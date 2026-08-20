from __future__ import annotations


def login(client, email: str, password: str) -> str:
    response = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_role_protection_and_authentication(seeded_client):
    client = seeded_client

    admin_token = login(client, "admin@example.com", "admin12345")
    student_token = login(client, "student1@example.com", "student12345")

    assert client.get("/api/v1/admin/dashboard", headers=auth_headers(student_token)).status_code == 403
    assert client.get("/api/v1/student/dashboard", headers=auth_headers(admin_token)).status_code == 403
    assert client.get("/api/v1/student/leaderboard", headers=auth_headers(student_token)).status_code == 200
    assert client.get("/api/v1/admin/analytics", headers=auth_headers(admin_token)).status_code == 200


def test_student_quiz_submission_and_history(seeded_client):
    client = seeded_client
    seed = client.app.state.seeded
    token = login(client, "student1@example.com", "student12345")

    quizzes = client.get("/api/v1/student/quizzes", headers=auth_headers(token))
    assert quizzes.status_code == 200
    quiz_id = seed["quiz_id"]

    detail = client.get(f"/api/v1/student/quizzes/{quiz_id}", headers=auth_headers(token))
    assert detail.status_code == 200
    question = detail.json()["questions"][0]
    assert question["id"] == seed["question_id"]
    correct_option_id = seed["correct_option_id"]

    start = client.post(f"/api/v1/student/quizzes/{quiz_id}/start", headers=auth_headers(token))
    assert start.status_code == 200
    attempt_id = start.json()["attempt_id"]

    invalid_submit = client.post(
        f"/api/v1/student/attempts/{attempt_id}/submit",
        headers=auth_headers(token),
        json={
            "answers": [
                {
                    "question_id": question["id"],
                    "selected_option_id": 999999,
                }
            ]
        },
    )
    assert invalid_submit.status_code == 400

    submit = client.post(
        f"/api/v1/student/attempts/{attempt_id}/submit",
        headers=auth_headers(token),
        json={
            "answers": [
                {
                    "question_id": question["id"],
                    "selected_option_id": correct_option_id,
                }
            ]
        },
    )
    assert submit.status_code == 200
    submit_data = submit.json()
    assert submit_data["passed"] is True
    assert submit_data["percentage"] == 100.0
    assert submit_data["correct_count"] == 1

    history = client.get("/api/v1/student/attempts", headers=auth_headers(token))
    assert history.status_code == 200
    assert history.json()["total"] >= 2

    review = client.get(f"/api/v1/student/attempts/{attempt_id}", headers=auth_headers(token))
    assert review.status_code == 200
    assert review.json()["results"][0]["is_correct"] is True


def test_max_attempts_and_leaderboards(seeded_client):
    client = seeded_client
    seed = client.app.state.seeded
    token = login(client, "student1@example.com", "student12345")

    leaderboard = client.get("/api/v1/student/leaderboard", headers=auth_headers(token))
    assert leaderboard.status_code == 200
    payload = leaderboard.json()
    assert payload["overall"]
    assert payload["category_leaderboard"]

    quiz_id = seed["quiz_id"]
    question = client.get(f"/api/v1/student/quizzes/{quiz_id}", headers=auth_headers(token)).json()["questions"][0]
    correct_option_id = seed["correct_option_id"]

    start_1 = client.post(f"/api/v1/student/quizzes/{quiz_id}/start", headers=auth_headers(token))
    assert start_1.status_code == 200
    attempt_1 = start_1.json()["attempt_id"]
    submit_1 = client.post(
        f"/api/v1/student/attempts/{attempt_1}/submit",
        headers=auth_headers(token),
        json={"answers": [{"question_id": question["id"], "selected_option_id": correct_option_id}]},
    )
    assert submit_1.status_code == 200

    start_2 = client.post(f"/api/v1/student/quizzes/{quiz_id}/start", headers=auth_headers(token))
    assert start_2.status_code == 409


def test_password_reset_student_filters_and_admin_attempts(seeded_client):
    client = seeded_client
    seed = client.app.state.seeded

    admin_token = login(client, "admin@example.com", "admin12345")
    student_token = login(client, "student1@example.com", "student12345")
    student_profile = client.get("/api/v1/auth/me", headers=auth_headers(student_token)).json()

    forgot = client.post("/api/v1/auth/forgot-password", json={"email": "student1@example.com"})
    assert forgot.status_code == 200
    reset_token = forgot.json()["reset_token"]
    assert reset_token
    reset = client.post(
        "/api/v1/auth/reset-password",
        json={"token": reset_token, "password": "newstudent12345"},
    )
    assert reset.status_code == 200
    assert login(client, "student1@example.com", "newstudent12345")

    filtered = client.get(
        "/api/v1/student/quizzes?search=python&category=Python&difficulty=Beginner&max_duration=30&sort=popular",
        headers=auth_headers(student_token),
    )
    assert filtered.status_code == 200
    assert filtered.json()["total"] >= 1

    attempts = client.get("/api/v1/admin/attempts", headers=auth_headers(admin_token))
    assert attempts.status_code == 200
    assert attempts.json()["total"] >= 1
    attempt_id = attempts.json()["items"][0]["attempt_id"]

    review = client.get(f"/api/v1/admin/attempts/{attempt_id}", headers=auth_headers(admin_token))
    assert review.status_code == 200
    assert review.json()["attempt_id"] == attempt_id

    health = client.get("/health")
    assert health.headers["x-content-type-options"] == "nosniff"


def test_student_notifications_for_published_quiz_and_read_state(seeded_client):
    client = seeded_client

    admin_token = login(client, "admin@example.com", "admin12345")
    student_token = login(client, "student1@example.com", "student12345")

    create_quiz = client.post(
        "/api/v1/admin/quizzes",
        headers=auth_headers(admin_token),
        json={
            "title": "Notification Flow Quiz",
            "description": "Checks publish notifications",
            "category": "Python",
            "difficulty": "Beginner",
            "duration": 15,
            "passing_score": 60,
            "max_attempts": 1,
            "status": "PUBLISHED",
            "thumbnail_url": None,
        },
    )
    assert create_quiz.status_code == 201

    notifications = client.get("/api/v1/student/notifications", headers=auth_headers(student_token))
    assert notifications.status_code == 200
    payload = notifications.json()
    assert payload["unread_count"] >= 1
    published_notification = next(
        item for item in payload["items"] if item["message"].startswith("Notification Flow Quiz")
    )
    assert published_notification["category"] == "QUIZ"
    assert published_notification["is_read"] is False

    read_one = client.patch(
        f"/api/v1/student/notifications/{published_notification['id']}/read",
        headers=auth_headers(student_token),
    )
    assert read_one.status_code == 200
    assert read_one.json()["is_read"] is True

    read_all = client.patch("/api/v1/student/notifications/read-all", headers=auth_headers(student_token))
    assert read_all.status_code == 200
    assert read_all.json()["unread_count"] == 0
