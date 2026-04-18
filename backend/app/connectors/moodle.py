"""Moodle REST API connector."""

import httpx
import structlog

logger = structlog.get_logger()


class MoodleConnector:
    def __init__(self, base_url: str, token: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.token = token

    async def _call(self, function: str, **params) -> dict | list:
        url = f"{self.base_url}/webservice/rest/server.php"
        payload = {
            "wstoken": self.token,
            "wsfunction": function,
            "moodlewsrestformat": "json",
            **params,
        }
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(url, data=payload)
            resp.raise_for_status()
            data = resp.json()
            if isinstance(data, dict) and "exception" in data:
                raise ValueError(data.get("message", "Moodle error"))
            return data

    async def test_connection(self) -> dict:
        """Return site info if credentials are valid."""
        return await self._call("core_webservice_get_site_info")

    async def get_courses(self, user_id: int) -> list[dict]:
        data = await self._call("core_enrol_get_users_courses", userid=user_id)
        return data if isinstance(data, list) else []

    async def get_assignments(self, course_ids: list[int]) -> list[dict]:
        if not course_ids:
            return []
        params = {f"courseids[{i}]": cid for i, cid in enumerate(course_ids)}
        data = await self._call("mod_assign_get_assignments", **params)
        assignments = []
        for course in data.get("courses", []):
            for a in course.get("assignments", []):
                assignments.append({
                    "id": str(a["id"]),
                    "title": a["name"],
                    "description": a.get("intro", ""),
                    "course_name": course.get("fullname", ""),
                    "due_date": a.get("duedate"),
                    "url": f"{self.base_url}/mod/assign/view.php?id={a.get('cmid', '')}",
                })
        return assignments
