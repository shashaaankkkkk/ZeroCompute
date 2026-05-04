from django.http import HttpResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
import requests
import os
from pathlib import Path

CONTROL_SERVICE_URL = "http://localhost:8000"
PROJECT_ROOT = str(Path(__file__).resolve().parent.parent.parent)
VENV_PYTHON = os.path.join(PROJECT_ROOT, "venv/bin/python")

@api_view(['GET'])
def mesh_status(request, mesh_id):
    try:
        res = requests.get(f"{CONTROL_SERVICE_URL}/nodes?account_id={mesh_id}", timeout=2)
        return Response({"nodes": res.json()})
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
def execute_on_mesh(request, mesh_id):
    code = request.data.get('code')
    try:
        res = requests.get(f"{CONTROL_SERVICE_URL}/nodes?account_id={mesh_id}")
        nodes = [n for n in res.json() if n['role'] == 'unified-node']
        if not nodes:
            return Response({"error": "No mesh nodes online"}, status=404)
        
        node = nodes[0]
        node_url = f"http://{node['ip']}:{node['port']}/compute/execute"
        exec_res = requests.post(node_url, json={"engine": "python", "code": code}, timeout=15)
        return Response(exec_res.json())
    except Exception as e:
        return Response({"error": str(e)}, status=500)

def get_installer(request):
    # Fixed script template (removed backslash over-escaping)
    script = f"""#!/bin/bash
MESH_ID=$1
NODE_PORT=$((8100 + RANDOM % 100))
NODE_ID="node-remote-$RANDOM"

echo "Deploying Mesh Node to Port: $NODE_PORT"

cd {PROJECT_ROOT}/mesh-node
export ACCOUNT_ID=$MESH_ID
export NODE_PORT=$NODE_PORT
export NODE_ID=$NODE_ID
export PYTHONPATH={PROJECT_ROOT}/mesh-node

# Start using the VENV python
nohup {VENV_PYTHON} -m uvicorn app.main:app --host 0.0.0.0 --port $NODE_PORT > /tmp/$NODE_ID.log 2>&1 &

echo "Node $NODE_ID active."
"""
    return HttpResponse(script, content_type="text/plain")
