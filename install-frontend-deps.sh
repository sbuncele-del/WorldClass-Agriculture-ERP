#!/bin/bash

# Install frontend dependencies for logistics module enhancement
# Includes Ant Design, Charts, Maps, and WebSocket support

cd "$(dirname "$0")/frontend" || exit 1

echo "Installing frontend dependencies..."
echo "This includes: Ant Design, Charts, Leaflet, Socket.io"

npm install

echo ""
echo "Installation complete!"
echo "New packages installed:"
echo "  - antd: Enterprise UI component library"
echo "  - @ant-design/icons: Icon set"
echo "  - @ant-design/charts: Data visualization"
echo "  - leaflet & react-leaflet: Map components"
echo "  - socket.io-client: Real-time WebSocket client"
