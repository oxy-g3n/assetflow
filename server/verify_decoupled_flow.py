
import asyncio
import httpx
import sys

BASE_URL = "http://localhost:8000/api/v1"

# You'll need a valid token to run this. 
# This script is for demonstration/internal verification.
TOKEN = "YOUR_TOKEN_HERE" 

async def verify_flow():
    headers = {"Authorization": f"Bearer {TOKEN}"} if TOKEN != "YOUR_TOKEN_HERE" else {}
    
    async with httpx.AsyncClient(base_url=BASE_URL, headers=headers) as client:
        # 1. Create Workflow
        print("1. Creating Workflow...")
        wf_data = {"name": "Test Decoupled Workflow", "type": "data"}
        resp = await client.post("/workflows/", json=wf_data)
        if resp.status_code != 201:
            print(f"Failed to create workflow: {resp.text}")
            return
        workflow = resp.json()
        wf_id = workflow["id"]
        print(f"Created Workflow ID: {wf_id}")

        # 2. Add Stage
        print("\n2. Adding Stage...")
        stage_data = {"label": "Data Cleaning", "stage_index": 0}
        resp = await client.post(f"/workflows/{wf_id}/stages", json=stage_data)
        if resp.status_code != 200:
            print(f"Failed to add stage: {resp.text}")
            return
        stage = resp.json()
        stage_id = stage["id"]
        print(f"Created Stage ID: {stage_id}")

        # 3. Assign User (using a placeholder user ID 1 for test)
        print("\n3. Assigning User...")
        assign_data = {"user_ids": [1]}
        resp = await client.post(f"/workflows/stages/{stage_id}/assignments", json=assign_data)
        if resp.status_code == 200:
            print("User assigned successfully")
        else:
            print(f"Failed to assign user (possibly user ID 1 doesn't exist): {resp.status_code}")

        # 4. Upload Template (Stub)
        print("\n4. Uploading Template...")
        template_data = {"label": "Cleaning Template", "file_path": "/tmp/template.csv"}
        resp = await client.post(f"/workflows/stages/{stage_id}/templates", json=template_data)
        if resp.status_code == 200:
            print("Template uploaded successfully")
        else:
            print(f"Failed to upload template: {resp.text}")

        # 5. Upload Library (Stub)
        print("\n5. Uploading Library...")
        library_data = {"label": "Cleaning Library", "file_path": "/tmp/library.csv"}
        resp = await client.post(f"/workflows/stages/{stage_id}/libraries", json=library_data)
        if resp.status_code == 200:
            print("Library uploaded successfully")
        else:
            print(f"Failed to upload library: {resp.text}")

        # Final check
        print("\n6. Final Verification...")
        resp = await client.get(f"/workflows/{wf_id}")
        final_wf = resp.json()
        print(f"Workflow Status: {final_wf.get('status')}")
        print("Flow verification complete!")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        TOKEN = sys.argv[1]
    asyncio.run(verify_flow())
