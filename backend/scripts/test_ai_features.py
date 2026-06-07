#!/usr/bin/env python3
"""Test all AI features against running backend."""
import asyncio
import json
import sys
import os

import httpx

BASE = "http://localhost:8000/api"


async def main():
    results = []

    async with httpx.AsyncClient(timeout=180.0) as client:
        r = await client.post(
            f"{BASE}/auth/login",
            json={"email": "admin@aurahr.com", "password": "admin123"},
        )
        if r.status_code != 200:
            print("LOGIN FAILED:", r.status_code, r.text)
            return 1
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        results.append(("Auth Login", "PASS", "OK"))

        r = await client.get(f"{BASE}/jobs", headers=headers)
        jobs = r.json() if r.status_code == 200 else []
        results.append(
            ("List Jobs", "PASS" if r.status_code == 200 else "FAIL", f"{r.status_code}, count={len(jobs)}")
        )

        r = await client.get(f"{BASE}/candidates", headers=headers)
        candidates = r.json() if r.status_code == 200 else []
        results.append(
            ("List Candidates", "PASS" if r.status_code == 200 else "FAIL", f"{r.status_code}, count={len(candidates)}")
        )

        r = await client.get(f"{BASE}/employees", headers=headers)
        employees = r.json() if r.status_code == 200 else []
        results.append(
            ("List Employees", "PASS" if r.status_code == 200 else "FAIL", f"{r.status_code}, count={len(employees)}")
        )

        chat_id = None
        if candidates:
            cid = candidates[0].get("_id") or candidates[0].get("id")
            r = await client.get(f"{BASE}/candidates/{cid}/ai-score", headers=headers)
            status = "PASS" if r.status_code == 200 else "FAIL"
            detail = str(r.status_code)
            if r.status_code == 200:
                d = r.json()
                detail += f" overallScore={d.get('overallScore')} resumeScore={d.get('resumeScore')}"
            else:
                detail += " " + r.text[:200]
            results.append(("AI Resume Scoring", status, detail))

            r = await client.post(f"{BASE}/candidates/{cid}/start-screening", headers=headers)
            status = "PASS" if r.status_code == 200 else "FAIL"
            detail = str(r.status_code)
            if r.status_code == 200:
                d = r.json()
                chat_id = d.get("chatId") or d.get("chat_id")
                detail += f" chatId={chat_id}"
            else:
                detail += " " + r.text[:200]
            results.append(("Start AI Screening", status, detail))
        else:
            results.append(("AI Resume Scoring", "SKIP", "No candidates in DB"))
            results.append(("Start AI Screening", "SKIP", "No candidates in DB"))

        if chat_id:
            r = await client.post(
                f"{BASE}/chat/{chat_id}",
                headers=headers,
                json={"message": "Tell me about the candidate experience with Python."},
            )
            status = "PASS" if r.status_code == 200 else "FAIL"
            detail = str(r.status_code)
            if r.status_code == 200:
                d = r.json()
                reply = (d.get("reply") or d.get("message") or "")[:100]
                detail += f" reply={reply!r}"
            else:
                detail += " " + r.text[:200]
            results.append(("AI Screening Chat", status, detail))

            r = await client.post(f"{BASE}/chat/{chat_id}/end", headers=headers)
            status = "PASS" if r.status_code == 200 else "FAIL"
            detail = str(r.status_code)
            if r.status_code != 200:
                detail += " " + r.text[:200]
            else:
                detail += " summary generated"
            results.append(("AI Interview Summary", status, detail))
        else:
            results.append(("AI Screening Chat", "SKIP", "No chat session"))
            results.append(("AI Interview Summary", "SKIP", "No chat session"))

        if employees:
            eid = employees[0].get("_id") or employees[0].get("id")
            r = await client.post(f"{BASE}/employees/{eid}/development-plan", headers=headers)
            status = "PASS" if r.status_code == 200 else "FAIL"
            detail = str(r.status_code)
            if r.status_code == 200:
                d = r.json()
                areas = d.get("planJson", {}).get("growthAreas", [])
                detail += f" growthAreas={len(areas)}"
            else:
                detail += " " + r.text[:200]
            results.append(("AI Development Plan", status, detail))
        else:
            results.append(("AI Development Plan", "SKIP", "No employees in DB"))

        r = await client.get(
            f"{BASE}/team/members", headers=headers, params={"include_ai_insights": "true"}
        )
        status = "PASS" if r.status_code == 200 else "FAIL"
        detail = str(r.status_code)
        if r.status_code == 200:
            members = r.json()
            detail += f" members={len(members)}"
            if members:
                m = members[0]
                has_insights = "aiInsights" in m or "insights" in m
                detail += f" hasInsights={has_insights}"
        else:
            detail += " " + r.text[:200]
        results.append(("Team AI Insights", status, detail))

        r = await client.get(f"{BASE}/public/chat/test-token-123")
        status = "PASS" if r.status_code == 200 else "FAIL"
        results.append(("Public Candidate Chat", status, f"{r.status_code} {r.text[:100]}"))

        r = await client.post(
            f"{BASE}/jobs/",
            headers=headers,
            json={
                "title": "AI Test Engineer",
                "description": "Python, FastAPI, machine learning, NLP experience required.",
                "requirements": ["Python", "FastAPI", "ML"],
                "location": "Remote",
                "department": "Engineering",
                "salaryRange": "100k-120k",
                "employmentType": "full-time",
            },
        )
        status = "PASS" if r.status_code in (200, 201) else "FAIL"
        detail = str(r.status_code)
        job_id = None
        if r.status_code in (200, 201):
            job_id = r.json().get("_id")
            detail += f" jobId={job_id}"
        else:
            detail += " " + r.text[:200]
        results.append(("Job Creation + Embedding", status, detail))

        # Resume upload test with synthetic text file
        if job_id:
            resume_content = b"""John Smith
Email: john.smith@email.com | Phone: 555-1234
Skills: Python, FastAPI, React, MongoDB, Machine Learning
Experience: 5 years as Software Engineer at TechCorp.
Built NLP pipelines and REST APIs."""
            files = {"file": ("test_resume.txt", resume_content, "text/plain")}
            r = await client.post(
                f"{BASE}/jobs/{job_id}/upload-resume", headers=headers, files=files
            )
            status = "PASS" if r.status_code in (200, 201) else "FAIL"
            detail = str(r.status_code)
            if r.status_code in (200, 201):
                detail += f" {r.json()}"
            else:
                detail += " " + r.text[:200]
            results.append(("Resume Upload + AI Pipeline", status, detail))

            await asyncio.sleep(3)
            r = await client.get(f"{BASE}/jobs/{job_id}/candidates", headers=headers)
            if r.status_code == 200 and r.json():
                cid = r.json()[0].get("_id")
                r2 = await client.get(f"{BASE}/candidates/{cid}/ai-score", headers=headers)
                status = "PASS" if r2.status_code == 200 else "FAIL"
                detail = str(r2.status_code)
                if r2.status_code == 200:
                    d = r2.json()
                    detail += f" overallScore={d.get('overallScore')}"
                else:
                    detail += " " + r2.text[:200]
                results.append(("Post-Upload AI Score", status, detail))
            else:
                results.append(("Post-Upload AI Score", "SKIP", "No candidate after upload"))

    print("=" * 70)
    print("AURAHR AI FEATURE TEST RESULTS")
    print("=" * 70)
    for name, status, detail in results:
        icon = {"PASS": "[OK]", "FAIL": "[FAIL]", "SKIP": "[SKIP]"}.get(status, status)
        print(f"{icon:8} {name:32} {detail}")
    print("=" * 70)

    fails = sum(1 for _, s, _ in results if s == "FAIL")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
