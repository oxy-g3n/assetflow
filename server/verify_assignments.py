import requests
import json
from datetime import datetime, timedelta

def verify_publish():
    login_url = "http://localhost:8000/api/v1/auth/login"
    publish_url = "http://localhost:8000/api/v1/workflows/"
    
    # 1. Login to get token
    login_resp = requests.post(login_url, json={
        "email": "engineer1@example.com",
        "password": "password123",
        "region_id": 1
    })
    if login_resp.status_code != 200:
        print(f"Login failed: {login_resp.text}")
        return
    
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Get the engineer ID
    users_resp = requests.get("http://localhost:8000/api/v1/users?role=engineer", headers=headers)
    engineers = users_resp.json()
    engineer_id = engineers[0]["id"] if engineers else 1
    
    # 3. Simulated Publish payload (+5 days date)
    completion_date = (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d")
    
    payload = {
        "name": "Integration Test Workflow",
        "type": "standard",
        "status": "active",
        "completionDate": completion_date,
        "stages": [
            {
                "label": "Stage 1",
                "stage_index": 0,
                "sequence": "1",
                "status": "pending",
                "statusText": "PENDING",
                "isActive": True,
                "disabled": False,
                "assignments": [engineer_id],
                "substages": []
            }
        ]
    }
    
    print(f"Sending publish request with date: {completion_date}")
    resp = requests.post(publish_url, json=payload, headers=headers)
    
    if resp.status_code == 201:
        data = resp.json()
        print(f"Successfully published workflow! ID: {data['id']}")
        print(f"Assignee names in response: {data['assignee_names']}")
        
        # Verify in detail
        detail_resp = requests.get(f"{publish_url}{data['id']}", headers=headers)
        detail = detail_resp.json()
        print(f"Verified Workflow ID: {detail['id']}, Assignees: {detail['assignee_names']}")
        if "Engineer One" in detail['assignee_names']:
            print("SUCCESS: Assignment correctly persisted.")
        else:
            print("FAILURE: Assignment not found in response.")
    else:
        print(f"Publish failed: {resp.status_code} - {resp.text}")

if __name__ == "__main__":
    verify_publish()
