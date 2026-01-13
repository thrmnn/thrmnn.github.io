#!/bin/bash
# Start Hugo development server

cd /home/theo/thrmnn.github.io

echo "🚀 Starting Hugo server..."
echo "📍 Access at: http://localhost:1313/"
echo "⏹️  Press Ctrl+C to stop"
echo ""

hugo server --bind 0.0.0.0 --port 1313
