#!/bin/bash
export PYTHONPATH=$PYTHONPATH:.
echo "Starting Primary Agent on Port 8003..."
# Log to agent.log so we can see why it fails
uvicorn app.main:app --host 0.0.0.0 --port 8003 > agent.log 2>&1
