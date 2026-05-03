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

# Pane 0: control-service
tmux send-keys -t $SESSION:main "cd control-service && ./run.sh" C-m

# Pane 1: worker-node
tmux split-window -h -t $SESSION:main
tmux send-keys -t $SESSION:main.1 "cd worker-node && ./run.sh" C-m

# Pane 2: storage-node
tmux split-window -v -t $SESSION:main.0
tmux send-keys -t $SESSION:main.2 "cd storage-node && ./run.sh" C-m

# Pane 3: primary-agent
tmux split-window -v -t $SESSION:main.1
tmux send-keys -t $SESSION:main.3 "cd primary-agent && ./run.sh" C-m

# Set layout to tiled
tmux select-layout -t $SESSION:main tiled

# Attach to the session
tmux attach-session -t $SESSION
