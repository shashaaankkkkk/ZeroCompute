#!/bin/bash

# ======================================================
#   0.space Platform — Unified Infrastructure Launcher
# ======================================================

SESSION="0space"
BASE_PATH="/Users/shashank/zerocompute"
VENV="$BASE_PATH/venv/bin/python"

echo "------------------------------------------------"
echo "  Initializing 0.space Management Console..."
echo "------------------------------------------------"

# --- 1. System Cleanup ---
echo "[1/4] Purging existing services..."
tmux kill-session -t $SESSION 2>/dev/null
lsof -ti:8000,8001,8004,3000 | xargs kill -9 2>/dev/null
sleep 2

# --- 2. Dependency Check ---
echo "[2/4] Verifying 0.space dependencies..."
$BASE_PATH/venv/bin/pip install --quiet djangorestframework-simplejwt django-cors-headers uvicorn fastapi requests django
echo "  — Core Dependencies: OK"

# --- 3. Database Migration ---
echo "[3/4] Syncing infrastructure registry..."
cd $BASE_PATH/portal-backend && $VENV manage.py migrate --noinput
echo "  — Registry: OK"

# --- 4. Launching Services ---
echo "[4/4] Spawning terminal grid..."

# Create session and first pane (Control Plane)
tmux new-session -d -s $SESSION -n console
tmux send-keys -t $SESSION "cd $BASE_PATH/control-service && PYTHONPATH=$BASE_PATH/control-service $VENV -m uvicorn app.main:app --host 0.0.0.0 --port 8000" C-m

# Split for Django Backend
tmux split-window -h -t $SESSION
tmux send-keys -t $SESSION "cd $BASE_PATH/portal-backend && $VENV manage.py runserver 0.0.0.0:8004 --noreload" C-m

# Split bottom-left for Primary Node
tmux select-pane -t 0
tmux split-window -v -t $SESSION
tmux send-keys -t $SESSION "cd $BASE_PATH/mesh-node && PYTHONPATH=$BASE_PATH/mesh-node NODE_PORT=8001 NODE_ID=primary-node ACCOUNT_ID=admin_mesh $VENV -m uvicorn app.main:app --host 0.0.0.0 --port 8001" C-m

# Split bottom-right for Web Portal
tmux select-pane -t 1
tmux split-window -v -t $SESSION
tmux send-keys -t $SESSION "cd $BASE_PATH/web-portal && npm run dev" C-m

echo ""
echo "================================================"
echo "  0.space is now ONLINE"
echo "================================================"
echo "  → Management Portal: http://localhost:3000"
echo "  → Control Engine:    http://localhost:8000"
echo "  → Fleet Backend:     http://localhost:8004"
echo "================================================"
echo ""
echo "Attaching to 0.space console (Ctrl+B then D to detach)..."
sleep 1

tmux attach-session -t $SESSION
