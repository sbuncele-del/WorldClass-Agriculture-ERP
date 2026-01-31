/**
 * SIMPLE STANDALONE AUTH SERVER FOR TESTING
 * This bypasses all the complex middleware to test if basic auth works
 */

const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3001; // Different port to avoid conflicts

// Super simple CORS - allow everything
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Demo users
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
  }
];

const JWT_SECRET = 'worldclass-erp-demo-secret-key';

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Simple auth server running' });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('📨 Login request received:', req.body);
  
  const { email, password } = req.body;
  
  // Find demo user
  const user = DEMO_USERS.find(u => u.email === email && u.password === password);
  
  if (!user) {
    console.log('❌ Invalid credentials');
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }
  
  console.log('✅ Login successful for:', email);
  
  // Generate tokens
  const accessToken = jwt.sign(
    {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
      type: 'access'
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  const refreshToken = jwt.sign(
    {
      userId: user.id,
      tenantId: user.tenantId,
      type: 'refresh'
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  res.json({
    success: true,
    message: 'Login successful (Simple Demo Mode)',
    data: {
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 86400
      },
      tenant: {
        id: user.tenantId,
        slug: user.tenantSlug,
        name: user.tenantName,
        status: 'active',
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    }
  });
});

// Get current user (for /me endpoint)
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = DEMO_USERS[0]; // Return demo admin
    
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenant: {
          id: user.tenantId,
          name: user.tenantName,
          slug: user.tenantSlug
        }
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('========================================');
  console.log('🚀 SIMPLE AUTH SERVER RUNNING');
  console.log('========================================');
  console.log(`Port: ${PORT}`);
  console.log('Login endpoint: POST /api/auth/login');
  console.log('');
  console.log('Test credentials:');
  console.log('  Email: admin@demo.com');
  console.log('  Password: admin123');
  console.log('========================================');
  console.log('');
});
