import dotenv from 'dotenv';

dotenv.config();

export function validateEnv() {
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'PORT'
  ];

  const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingVars.length > 0) {
    throw new Error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  }

  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET === 'worldclass-erp-demo-secret-key') {
      throw new Error('❌ Security Risk: Using default JWT_SECRET in production!');
    }
  }

  console.log('✅ Environment variables validated');
}
