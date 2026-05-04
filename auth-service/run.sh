#!/bin/bash
export PYTHONPATH=\$PYTHONPATH:.
uvicorn app.main:app --host 0.0.0.0 --port 8004 --reload
