#!/bin/bash

# Patch Bay Simulator Server Starter
# This script starts a local HTTP server for the Patch Bay web application

echo "Starting Patch Bay Simulator server..."
echo "Server will be available at: http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""

# Start Python HTTP server on port 8000
python3 -m http.server 8000