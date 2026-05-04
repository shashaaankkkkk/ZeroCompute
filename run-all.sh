#!/bin/bash

SESSION="zerocompute"
BASE_PATH=$(pwd)
VENV_PYTHON="$BASE_PATH/venv/bin/python"

echo "Full System Purge..."
tmux kill-session -t $SESSION 2>/dev/null
lsof -ti:8000,8001,8002,8003,8004,3000 | xargs kill -9 2>/dev/null

echo "Initializing Isolated Mesh..."
tmux new-session -d -s $SESSION -n 'mesh'
P0=$(tmux display-message -p '#{pane_id}')

# Create 4-pane grid
P1=$(tmux split-window -h -P -t $P0)
P2=$(tmux split-window -v -P -t $P0)
P3=$(tmux split-window -v -P -t $P1)

# --- SERVICE LAUNCH ---

echo "Launching Control (8000)..."
tmux send-keys -t $P0 "cd $BASE_PATH/control-service && export PYTHONPATH=$BASE_PATH/control-service && $VENV_PYTHON -m uvicorn app.main:app --host 0.0.0.0 --port 8000" C-m

sleep 5

echo "Launching Backend (8004)..."
tmux send-keys -t $P1 "cd $BASE_PATH/portal-backend && $VENV_PYTHON manage.py runserver 0.0.0.0:8004" C-m

echo "Launching Primary Node (8001)..."
tmux send-keys -t $P2 "cd $BASE_PATH/mesh-node && export NODE_PORT=8001 && export NODE_ID=primary-node && export PYTHONPATH=$BASE_PATH/mesh-node && $VENV_PYTHON -m uvicorn app.main:app --host 0.0.0.0 --port 8001" C-m

echo "Launching Web Portal (3000)..."
tmux send-keys -t $P3 "cd $BASE_PATH/web-portal && npm run dev" C-m

tmux select-layout tiled
tmux attach-session -t $SESSION
