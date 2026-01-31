module.exports = {
  apps: [{
    name: 'erp-backend',
    script: 'dist/index.js',
    cwd: '/home/ec2-user/erp-production',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DB_HOST: 'aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com',
      DB_PORT: 5432,
      DB_NAME: 'postgres',
      DB_USER: 'postgres',
      DB_PASSWORD: 'caxMex-0putca-dyjnah',
      DATABASE_URL: 'postgresql://postgres:caxMex-0putca-dyjnah@aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com:5432/postgres',
      JWT_SECRET: 'aetheros-super-secret-key-change-in-production-2024',
      JWT_EXPIRY: '24h',
      CORS_ORIGIN: '*',
      SMTP_HOST: 'smtp.sendgrid.net',
      SMTP_PORT: '587',
      SMTP_USER: 'apikey',
      SMTP_PASSWORD: 'SENDGRID_API_KEY_PLACEHOLDER.XZ9TjxHkY3Gxf0NHUV53MLRGTYwz7CqSZ7hZs-8aAHs',
      EMAIL_FROM: 'noreply@primesources.site'
    }
  }]
};
