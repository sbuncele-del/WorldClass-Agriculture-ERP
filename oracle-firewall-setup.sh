#!/bin/bash

# ============================================================
# WorldClass ERP - Oracle Cloud VM Firewall Setup
# ============================================================
# Run this AFTER SSH'ing into your Oracle VM to open ports
# Oracle VMs have iptables rules that block traffic by default
# ============================================================

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  Oracle Cloud VM - Firewall Configuration                 ║"
echo "╚═══════════════════════════════════════════════════════════╝"

# Oracle Linux / Ubuntu firewall setup
echo "Opening required ports..."

# Method 1: iptables (works on most Oracle images)
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 5173 -j ACCEPT

# Save iptables rules
sudo netfilter-persistent save 2>/dev/null || sudo iptables-save | sudo tee /etc/iptables.rules

# Method 2: UFW (if available on Ubuntu)
if command -v ufw &> /dev/null; then
    sudo ufw allow 22/tcp    # SSH
    sudo ufw allow 80/tcp    # HTTP
    sudo ufw allow 443/tcp   # HTTPS
    sudo ufw allow 3000/tcp  # Backend
    sudo ufw allow 5173/tcp  # Frontend dev
    sudo ufw --force enable
fi

echo ""
echo "✓ Firewall configured!"
echo ""
echo "Ports opened:"
echo "  • 22   - SSH"
echo "  • 80   - HTTP (Nginx)"
echo "  • 443  - HTTPS"
echo "  • 3000 - Backend API"
echo "  • 5173 - Frontend Dev"
echo ""
echo "⚠️  IMPORTANT: Also configure Security List in Oracle Console!"
echo "   Networking → VCN → Security Lists → Add Ingress Rules"
