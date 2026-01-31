#!/usr/bin/env ts-node
/**
 * Email Service Test Script
 * Tests email sending functionality
 * 
 * Usage: npx ts-node scripts/test-email.ts [recipient@email.com]
 */

import dotenv from 'dotenv';
dotenv.config();

import { emailService } from '../src/services/email-production.service';

const TEST_EMAIL = process.argv[2] || 'test@example.com';

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('📧 EMAIL SERVICE TEST');
  console.log('='.repeat(60));
  console.log(`Test recipient: ${TEST_EMAIL}\n`);

  // Test 1: Health Check
  console.log('1️⃣ Testing health check...');
  const health = await emailService.healthCheck();
  console.log(`   Status: ${health.status}`);
  console.log(`   Provider: ${health.provider}`);
  console.log(`   Message: ${health.message}\n`);

  // Test 2: Password Reset Email
  console.log('2️⃣ Testing password reset email...');
  const resetResult = await emailService.sendPasswordReset(
    TEST_EMAIL,
    'https://app.example.com/reset?token=test123',
    'Test User'
  );
  console.log(`   Result: ${resetResult ? '✅ Success' : '❌ Failed'}\n`);

  // Test 3: Trip Completed Email
  console.log('3️⃣ Testing trip completed email...');
  const tripResult = await emailService.sendTripCompleted(TEST_EMAIL, {
    tripNumber: 'TRP-2024-001234',
    origin: 'Johannesburg Warehouse',
    destination: 'Cape Town Distribution Center',
    driver: 'John Smith',
    completedAt: new Date().toLocaleString('en-ZA'),
  });
  console.log(`   Result: ${tripResult ? '✅ Success' : '❌ Failed'}\n`);

  // Test 4: Invoice Notification Email
  console.log('4️⃣ Testing invoice notification email...');
  const invoiceResult = await emailService.sendInvoiceNotification(TEST_EMAIL, {
    invoiceNumber: 'INV-2024-005678',
    amount: 'R 12,500.00',
    dueDate: '2024-12-31',
    customerName: 'Test Customer',
  });
  console.log(`   Result: ${invoiceResult ? '✅ Success' : '❌ Failed'}\n`);

  // Summary
  console.log('='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  const passed = [resetResult, tripResult, invoiceResult].filter(Boolean).length;
  console.log(`   Tests passed: ${passed}/3`);
  console.log(`   Provider: ${health.provider}`);
  
  if (health.provider === 'console') {
    console.log('\n⚠️  Running in console mode (emails logged but not sent)');
    console.log('   To enable email sending, configure SMTP/SES/SendGrid in .env');
  }
  
  console.log('\n');
}

runTests().catch(console.error);
