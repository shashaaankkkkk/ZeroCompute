#!/bin/bash

SESSION="zerocompute"

# Check if session already exists and kill it
tmux has-session -t $SESSION 2>/dev/null
if [ $? -eq 0 ]; then
    echo "Killing existing tmux session: $SESSION"
    tmux kill-session -t $SESSION
fi

echo "Starting ZeroCompute services in tmux session: $SESSION"

# Create new session, detached
tmux new-session -d -s $SESSION -n main

# Set the base path
BASE_PATH=$(pwd)

# --- Pane 0: Control Service ---
tmux send-keys -t $SESSION:main.0 "cd $BASE_PATH/control-service && ./run.sh" C-m

# --- Pane 1: Worker Node ---
# Split the first pane horizontally
tmux split-window -h -t $SESSION:main.0
tmux send-keys -t $SESSION:main.1 "cd $BASE_PATH/worker-node && ./run.sh" C-m

# --- Pane 2: Storage Node ---
# Split the first pane vertically
tmux split-window -v -t $SESSION:main.0
tmux send-keys -t $SESSION:main.2 "cd $BASE_PATH/storage-node && ./run.sh" C-m

# --- Pane 3: Primary Agent ---
# Split the second pane (Pane 1) vertically
tmux split-window -v -t $SESSION:main.1
tmux send-keys -t $SESSION:main.3 "cd $BASE_PATH/primary-agent && sleep 5 && ./run.sh; read -p 'Done. Press enter to exit...'" C-m

# Final layout adjustment
tmux select-layout -t $SESSION:main tiled

# Attach to the session
tmux attach-session -t $SESSION
