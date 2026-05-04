#!/bin/bash
export PYTHONPATH=$PYTHONPATH:.
python3 -m uvicorn app.main:app --host 0.0.0.0 --port $NODE_PORT
