from enum import Enum


class UserRole(str, Enum):
    admin = "ADMIN"
    student = "STUDENT"


class UserStatus(str, Enum):
    active = "ACTIVE"
    inactive = "INACTIVE"

