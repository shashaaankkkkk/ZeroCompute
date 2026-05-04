#!/bin/bash
PAYLOAD=${1:-"Default long string for testing compute sharing"}
echo "Sending task: $PAYLOAD"
curl -X POST http://localhost:8003/task      -H "Content-Type: application/json"      -d "{\"task_id\": \"test_$(date +%s)\", \"payload\": \"$PAYLOAD\"}"
echo -e "\nDone."
