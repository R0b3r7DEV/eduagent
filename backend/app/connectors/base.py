"""Abstract base class for LMS connectors."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime


@dataclass
class LMSTask:
    id: str
    title: str
    description: str
    due_date: datetime | None
    course_name: str
    subject: str
    url: str | None


@dataclass
class LMSCourse:
    id: str
    name: str
    subject: str
    teacher: str
    materials: list[str]  # URLs of course materials


class LMSConnector(ABC):
    @abstractmethod
    async def get_courses(self, user_id: str) -> list[LMSCourse]: ...

    @abstractmethod
    async def get_pending_tasks(self, user_id: str) -> list[LMSTask]: ...

    @abstractmethod
    async def get_course_materials(self, course_id: str) -> list[str]: ...

    @abstractmethod
    async def test_connection(self) -> bool: ...
