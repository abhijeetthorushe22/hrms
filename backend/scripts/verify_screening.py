import httpx

BASE = "http://localhost:8000/api"
with httpx.Client(timeout=60) as c:
    login = c.post(f"{BASE}/auth/login", json={"email": "admin@aurahr.com", "password": "admin123"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    cands = c.get(f"{BASE}/candidates", headers=headers).json()
    cid = cands[0]["_id"]
    screen = c.post(f"{BASE}/candidates/{cid}/start-screening", headers=headers)
    data = screen.json()
    print("keys", list(data.keys()))
    print("candidateToken present", "candidateToken" in data)
    print("candidateLink", data.get("candidateLink"))
    if data.get("candidateToken"):
        pub = c.get(f"{BASE}/public/chat/{data['candidateToken']}")
        print("public chat status", pub.status_code)
        if pub.status_code == 200:
            print("public messages", len(pub.json().get("messages", [])))
