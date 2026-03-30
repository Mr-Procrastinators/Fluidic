#!/bin/bash

# FLUIDIC System - Start Script for Linux/Mac
# Starts both React dashboard and GA-VMD algorithm

echo ""
echo "====================================="
echo "  FLUIDIC - Smart Pipeline Monitoring"
echo "====================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping services..."
    kill $REACT_PID 2>/dev/null
    kill $GAVMD_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start React dev server in background
echo "Starting React Dashboard on http://localhost:8081..."
npm run dev > react.log 2>&1 &
REACT_PID=$!

# Wait a moment for React to start
sleep 3

# Start GA-VMD algorithm in background
echo "Starting GA-VMD Algorithm..."
cd GA-VMD
python main.py > ../gavmd.log 2>&1 &
GAVMD_PID=$!
cd ..

echo ""
echo "====================================="
echo "Both services started!"
echo ""
echo "Dashboard: http://localhost:8081"
echo "GA-VMD: Running in background"
echo ""
echo "Logs:"
echo "  React:  tail -f react.log"
echo "  GA-VMD: tail -f gavmd.log"
echo ""
echo "Press Ctrl+C to stop all services"
echo "====================================="
echo ""

# Wait for both processes
wait $REACT_PID $GAVMD_PID
