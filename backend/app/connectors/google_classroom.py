"""Google Classroom OAuth2 connector."""

import httpx
import structlog

logger = structlog.get_logger()

SCOPES = [
    "https://www.googleapis.com/auth/classroom.courses.readonly",
    "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
    "https://www.googleapis.com/auth/classroom.student-submissions.me.readonly",
    "openid",
    "email",
]

AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
CLASSROOM_API = "https://classroom.googleapis.com/v1"


def build_auth_url(client_id: str, redirect_uri: str, state: str = "") -> str:
    import urllib.parse
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    return f"{AUTH_URL}?{urllib.parse.urlencode(params)}"


async def exchange_code(
    code: str,
    client_id: str,
    client_secret: str,
    redirect_uri: str,
) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.post(TOKEN_URL, data={
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        })
        resp.raise_for_status()
        return resp.json()


async def refresh_access_token(
    refresh_token: str,
    client_id: str,
    client_secret: str,
) -> str:
    async with httpx.AsyncClient() as client:
        resp = await client.post(TOKEN_URL, data={
            "refresh_token": refresh_token,
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "refresh_token",
        })
        resp.raise_for_status()
        return resp.json()["access_token"]


class GoogleClassroomConnector:
    def __init__(self, access_token: str, refresh_token: str, client_id: str, client_secret: str):
        self.access_token = access_token
        self.refresh_token = refresh_token
        self.client_id = client_id
        self.client_secret = client_secret

    async def _get(self, path: str, params: dict | None = None) -> dict:
        headers = {"Authorization": f"Bearer {self.access_token}"}
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(f"{CLASSROOM_API}{path}", headers=headers, params=params or {})
            if resp.status_code == 401:
                self.access_token = await refresh_access_token(
                    self.refresh_token, self.client_id, self.client_secret
                )
                headers["Authorization"] = f"Bearer {self.access_token}"
                resp = await client.get(f"{CLASSROOM_API}{path}", headers=headers, params=params or {})
            resp.raise_for_status()
            return resp.json()

    async def get_courses(self) -> list[dict]:
        data = await self._get("/courses", {"studentId": "me", "courseStates": "ACTIVE"})
        return data.get("courses", [])

    async def get_coursework(self, course_id: str) -> list[dict]:
        data = await self._get(f"/courses/{course_id}/courseWork")
        return data.get("courseWork", [])

    async def get_all_assignments(self) -> list[dict]:
        courses = await self.get_courses()
        assignments = []
        for course in courses:
            try:
                works = await self.get_coursework(course["id"])
                for w in works:
                    due = None
                    if "dueDate" in w and "dueTime" in w:
                        d = w["dueDate"]
                        t = w.get("dueTime", {})
                        due = f"{d['year']}-{d['month']:02d}-{d['day']:02d}T{t.get('hours', 0):02d}:{t.get('minutes', 0):02d}:00Z"
                    assignments.append({
                        "id": w["id"],
                        "title": w.get("title", "Sin título"),
                        "description": w.get("description", ""),
                        "course_name": course.get("name", ""),
                        "due_date": due,
                        "url": w.get("alternateLink", ""),
                    })
            except Exception as e:
                logger.warning("google_classroom.coursework.error", course=course.get("id"), error=str(e))
        return assignments
