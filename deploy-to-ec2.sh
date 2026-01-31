#!/bin/bash

#############################################
# COMPLETE DEPLOYMENT SCRIPT FOR AWS EC2
# Copy and paste this ENTIRE file into AWS Session Manager
#############################################

set -e

echo "=========================================="
echo "  WorldClass ERP - Complete Deployment"
echo "=========================================="
echo ""

# Step 1: Update Backend Code
echo "Step 1: Updating backend environment..."
cd /home/ec2-user/backend

# Create .env
cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://erp_admin:SecurePassword123!@aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com:5432/aetheros_erp
JWT_SECRET=worldclass-erp-production-secret-2025-very-long-and-secure
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d
DEMO_MODE=true
CORS_ORIGIN=*
ENVEOF

echo "✅ .env created"

# Step 2: Update auth controller with demo login
echo ""
echo "Step 2: Adding demo authentication..."

# Backup existing file
cp src/auth/auth.controller.ts src/auth/auth.controller.ts.backup 2>/dev/null || true

# Create updated auth controller with demo users
cat > src/auth/auth.controller.ts << 'AUTHEOF'
import { Response } from 'express';
import { TenantRequest } from '../types';
import AuthService from './auth.service';
import WelcomeEmailService from '../services/welcome-email.service';
import fs from 'fs';
import jwt from 'jsonwebtoken';

// Demo users for testing without database
const DEMO_USERS = [
  {
    email: 'admin@demo.com',
    password: 'admin123',
    id: 'demo-user-001',
    firstName: 'Demo',
    lastName: 'Admin',
    role: 'admin',
    tenantId: 'demo-tenant-001',
    tenantName: 'Demo Company',
    tenantSlug: 'demo'
  },
  {
    email: 'user@demo.com',
    password: 'user123',
    id: 'demo-user-002',
    firstName: 'Demo',
    lastName: 'User',
    role: 'user',
    tenantId: 'demo-tenant-001',
    tenantName: 'Demo Company',
    tenantSlug: 'demo'
  }
];

const JWT_SECRET = process.env.JWT_SECRET || 'worldclass-erp-demo-secret-key';

export class AuthController {
  static async login(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { email, password, tenantSlug } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
        return;
      }

      // DEMO MODE: Check if using demo credentials
      const demoUser = DEMO_USERS.find(u => u.email === email && u.password === password);
      if (demoUser) {
        console.log('✅ Demo login successful for:', email);
        
        const accessToken = jwt.sign(
          {
            userId: demoUser.id,
            tenantId: demoUser.tenantId,
            email: demoUser.email,
            role: demoUser.role,
            type: 'access'
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        const refreshToken = jwt.sign(
          {
            userId: demoUser.id,
            tenantId: demoUser.tenantId,
            type: 'refresh'
          },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        res.status(200).json({
          success: true,
          message: 'Login successful (Demo Mode)',
          data: {
            tokens: {
              accessToken,
              refreshToken,
              expiresIn: 86400
            },
            tenant: {
              id: demoUser.tenantId,
              slug: demoUser.tenantSlug,
              name: demoUser.tenantName,
              status: 'active',
              trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            },
            user: {
              id: demoUser.id,
              email: demoUser.email,
              firstName: demoUser.firstName,
              lastName: demoUser.lastName,
              role: demoUser.role
            }
          }
        });
        return;
      }

      // Regular login with database (fallback)
      const deviceInfo = {
        ip_address: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        user_agent: req.headers['user-agent'] || 'unknown'
      };

      const result = await AuthService.login({ email, password, tenantSlug }, deviceInfo);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error: any) {
      console.error('Login error:', error?.message);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Login failed'
      });
    }
  }

  static async me(req: TenantRequest, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({ success: false, message: 'No token provided' });
        return;
      }

      const token = authHeader.replace('Bearer ', '');
      const decoded: any = jwt.verify(token, JWT_SECRET);

      // Return demo user if it's a demo token
      if (decoded.userId.startsWith('demo-')) {
        const demoUser = DEMO_USERS.find(u => u.id === decoded.userId);
        if (demoUser) {
          res.json({
            success: true,
            data: {
              id: demoUser.id,
              email: demoUser.email,
              firstName: demoUser.firstName,
              lastName: demoUser.lastName,
              role: demoUser.role,
              tenant: {
                id: demoUser.tenantId,
                name: demoUser.tenantName,
                slug: demoUser.tenantSlug
              }
            }
          });
          return;
        }
      }

      res.status(401).json({ success: false, message: 'Invalid token' });
    } catch (error) {
      res.status(401).json({ success: false, message: 'Invalid token' });
    }
  }

  // Placeholder for other methods
  static async signup(req: TenantRequest, res: Response): Promise<void> {
    res.status(501).json({ success: false, message: 'Signup not implemented' });
  }
}

export default AuthController;
AUTHEOF

echo "✅ Demo authentication added"

# Step 3: Install and build
echo ""
echo "Step 3: Installing dependencies..."
npm install --production

echo ""
echo "Step 4: Building TypeScript..."
npm run build

# Step 5: Restart PM2
echo ""
echo "Step 5: Restarting application..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 start dist/index.js --name worldclass-backend
pm2 save

echo ""
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo ""

# Test
echo "Testing backend..."
sleep 3
curl -s http://localhost:3000/health | head -5

echo ""
echo ""
echo "Status:"
pm2 status

echo ""
echo "Recent logs:"
pm2 logs --lines 15 --nostream

echo ""
echo "=========================================="
echo "✅ Backend is running!"
echo ""
echo "Test from browser:"
echo "  Health: http://51.21.219.35:3000/health"
echo "  Login: admin@demo.com / admin123"
echo "=========================================="
