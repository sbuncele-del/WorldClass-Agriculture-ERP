#!/bin/bash

# Redis Setup Script for Email Queue System
# This script checks for Redis installation and provides setup instructions

set -e

echo "============================================"
echo "Redis Setup for Worldclass ERP Email Queue"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Redis is installed
check_redis() {
    if command -v redis-cli &> /dev/null; then
        echo -e "${GREEN}✓ Redis CLI is installed${NC}"
        return 0
    else
        echo -e "${RED}✗ Redis CLI is not installed${NC}"
        return 1
    fi
}

# Check if Redis server is running
check_redis_running() {
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✓ Redis server is running${NC}"
        return 0
    else
        echo -e "${RED}✗ Redis server is not running${NC}"
        return 1
    fi
}

# Get Redis info
get_redis_info() {
    echo -e "\n${YELLOW}Redis Server Information:${NC}"
    redis-cli info server | grep -E "redis_version|os|uptime_in_seconds"
    echo ""
    redis-cli info memory | grep -E "used_memory_human|used_memory_peak_human"
}

# Main
main() {
    if check_redis; then
        if check_redis_running; then
            get_redis_info
            echo -e "${GREEN}✓ Redis is ready for email queue!${NC}"
            echo ""
            echo "Next steps:"
            echo "1. Ensure .env has Redis configuration:"
            echo "   REDIS_HOST=localhost"
            echo "   REDIS_PORT=6379"
            echo ""
            echo "2. Run migrations:"
            echo "   psql -U your_username -d worldclass_erp -f src/migrations/010_email_queue_metrics.sql"
            echo ""
            echo "3. Start backend:"
            echo "   npm run dev"
            echo ""
        else
            echo ""
            echo -e "${YELLOW}Starting Redis server...${NC}"
            
            # Try to start Redis based on OS
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                echo "Detected macOS"
                if command -v brew &> /dev/null; then
                    brew services start redis
                    echo -e "${GREEN}✓ Redis started via Homebrew${NC}"
                else
                    echo -e "${RED}Homebrew not found. Install Redis with: brew install redis${NC}"
                fi
            elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
                # Linux
                echo "Detected Linux"
                sudo systemctl start redis
                echo -e "${GREEN}✓ Redis started via systemd${NC}"
            else
                echo -e "${RED}Unable to start Redis automatically on this OS${NC}"
                echo "Please start Redis manually"
            fi
            
            # Check if it started
            sleep 2
            if check_redis_running; then
                echo -e "${GREEN}✓ Redis is now running!${NC}"
            fi
        fi
    else
        echo ""
        echo -e "${YELLOW}Redis Installation Required${NC}"
        echo ""
        
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            echo "macOS Installation:"
            echo "1. Install Homebrew (if not installed):"
            echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            echo ""
            echo "2. Install Redis:"
            echo "   brew install redis"
            echo ""
            echo "3. Start Redis:"
            echo "   brew services start redis"
            echo ""
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            echo "Linux Installation (Ubuntu/Debian):"
            echo "   sudo apt-get update"
            echo "   sudo apt-get install redis-server"
            echo "   sudo systemctl start redis"
            echo "   sudo systemctl enable redis"
            echo ""
            echo "Linux Installation (CentOS/RHEL):"
            echo "   sudo yum install redis"
            echo "   sudo systemctl start redis"
            echo "   sudo systemctl enable redis"
            echo ""
        else
            # Windows or other
            echo "For Windows:"
            echo "1. Install WSL2: https://docs.microsoft.com/en-us/windows/wsl/install"
            echo "2. Follow Linux installation instructions inside WSL2"
            echo ""
            echo "Or use Docker:"
            echo "   docker run -d -p 6379:6379 --name redis redis:alpine"
            echo ""
        fi
        
        echo "Docker Installation (all platforms):"
        echo "   docker run -d -p 6379:6379 --name redis redis:alpine"
        echo ""
        echo "After installation, run this script again to verify."
    fi
}

main
