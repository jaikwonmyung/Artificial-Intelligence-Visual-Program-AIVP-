#!/bin/bash
# Invisible Launcher for Gentle Monster AI Toolkit (Mac)
# This script ensures a fresh start by killing any existing server on port 3030.

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR/app"

PORT=3030

# 1. Kill any process currently using the port
# -t gives PID only, -i :3030 finds process on that port
PID=$(lsof -ti :$PORT)
if [ ! -z "$PID" ]; then
    kill -9 $PID >/dev/null 2>&1
fi

# 2. Start the server afresh
# Redirect output to /dev/null so no file is created
nohup python3 -m http.server $PORT >/dev/null 2>&1 &

# 3. Wait a moment for server to spin up
sleep 1
open "http://localhost:$PORT"

# 4. Close this terminal window immediately
osascript -e 'tell application "Terminal" to close front window' & exit
