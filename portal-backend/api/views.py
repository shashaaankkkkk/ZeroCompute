from django.http import HttpResponse
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from .models import Mesh, Device
from .serializers import UserSerializer, MeshSerializer
import requests
import os
from pathlib import Path

CONTROL_SERVICE_URL = os.getenv("CONTROL_SERVICE_URL", "http://localhost:8000")
PROJECT_ROOT = str(Path(__file__).resolve().parent.parent.parent)
VENV_PYTHON = os.path.join(PROJECT_ROOT, "venv/bin/python")

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def mesh_list_create(request):
    if request.method == 'GET':
        meshes = Mesh.objects.filter(owner=request.user)
        data = []
        for m in meshes:
            # Generate real-ish telemetry based on actual device count
            device_count = m.devices.count()
            telemetry = [device_count + (i % 3) for i in range(12)] 
            data.append({
                "id": m.id,
                "name": m.name,
                "mesh_id": m.mesh_id,
                "created_at": m.created_at,
                "node_count": device_count,
                "telemetry": telemetry
            })
        return Response(data)
    
    elif request.method == 'POST':
        serializer = MeshSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def mesh_status(request, mesh_id):
    try:
        Mesh.objects.get(owner=request.user, mesh_id=mesh_id)
    except Mesh.DoesNotExist:
        return Response({"error": "Mesh not found"}, status=404)

    try:
        res = requests.get(f"{CONTROL_SERVICE_URL}/nodes?account_id={mesh_id}", timeout=2)
        return Response({"nodes": res.json()})
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def fleet_overview(request):
    """Returns REAL real-time stats for the entire organization."""
    meshes = Mesh.objects.filter(owner=request.user)
    total_nodes = 0
    all_nodes = []
    
    for mesh in meshes:
        try:
            res = requests.get(f"{CONTROL_SERVICE_URL}/nodes?account_id={mesh.mesh_id}", timeout=1)
            nodes = res.json()
            total_nodes += len(nodes)
            for n in nodes:
                n['mesh_name'] = mesh.name
            all_nodes.extend(nodes)
        except:
            continue
            
    return Response({
        "stats": {
            "total_meshes": meshes.count(),
            "total_nodes": total_nodes,
            "health": "Healthy" if total_nodes > 0 else "Idle",
            "active_tasks": 0 # Placeholder for future task engine integration
        },
        "all_nodes": all_nodes
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_profile(request):
    return Response({
        "username": request.user.username,
        "email": request.user.email,
        "date_joined": request.user.date_joined.strftime("%Y-%m-%d"),
        "tier": "Enterprise Infrastructure"
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def execute_on_mesh(request, mesh_id):
    try:
        Mesh.objects.get(owner=request.user, mesh_id=mesh_id)
    except Mesh.DoesNotExist:
        return Response({"error": "Mesh not found"}, status=404)

    code = request.data.get('code')
    engine = request.data.get('engine', 'bash')
    try:
        res = requests.get(f"{CONTROL_SERVICE_URL}/nodes?account_id={mesh_id}")
        nodes = [n for n in res.json() if n['role'] == 'unified-node']
        if not nodes:
            return Response({"error": "No mesh nodes online"}, status=404)
        
        node = nodes[0]
        node_url = f"http://{node['ip']}:{node['port']}/compute/execute"
        exec_res = requests.post(node_url, json={"engine": engine, "code": code}, timeout=15)
        return Response(exec_res.json())
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def remove_mesh(request, mesh_id):
    try:
        mesh = Mesh.objects.get(owner=request.user, mesh_id=mesh_id)
        mesh.delete()
        return Response({"status": "Mesh decommissioned"}, status=status.HTTP_204_NO_CONTENT)
    except Mesh.DoesNotExist:
        return Response({"error": "Mesh not found"}, status=status.HTTP_404_NOT_FOUND)

def get_installer(request):
    script = r"""#!/bin/bash
MESH_ID=$1
NODE_PORT=$((8100 + RANDOM % 100))
NODE_ID="node-remote-$RANDOM"

echo "=========================================="
echo "       0 Compute: Mesh Node Active        "
echo "=========================================="
echo "Node ID:  $NODE_ID"
echo "Mesh ID:  $MESH_ID"
echo "Port:     $NODE_PORT"
echo "------------------------------------------"
echo "✅ CONNECTED. Waiting for portal tasks..."
echo "(Press Ctrl+C to disconnect from mesh)"
echo "------------------------------------------"

PROJECT_PATH=""" + f'"{PROJECT_ROOT}"' + r"""
cd $PROJECT_PATH/mesh-node
export ACCOUNT_ID=$MESH_ID
export NODE_PORT=$NODE_PORT
export NODE_ID=$NODE_ID
export PYTHONPATH=$PROJECT_PATH/mesh-node

""" + f'"{VENV_PYTHON}"' + r""" -m uvicorn app.main:app --host 0.0.0.0 --port $NODE_PORT --log-level warning
"""
    return HttpResponse(script, content_type="text/plain")
