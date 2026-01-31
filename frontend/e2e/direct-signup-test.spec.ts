import { test, expect } from '@playwright/test';

const PROD_URL = 'https://d1gsy3508vpy61.cloudfront.net';

test('check production API directly', async ({ request }) => {
  // Test 1: Check if CloudFront API routes work
  console.log('\n=== Testing CloudFront API Routes ===');
  
  // Test health endpoint through CloudFront
  const healthResponse = await request.get(`${PROD_URL}/api/health`);
  console.log(`CloudFront /api/health - Status: ${healthResponse.status()}`);
  const healthBody = await healthResponse.text();
  console.log(`Body: ${healthBody.substring(0, 300)}`);
  
  // Check if it's returning HTML (wrong) or JSON (correct)
  const isHTML = healthBody.includes('<!doctype html>') || healthBody.includes('<!DOCTYPE html>');
  console.log(`Returning HTML instead of JSON: ${isHTML}`);
  
  if (isHTML) {
    console.log('\n❌ PROBLEM: CloudFront is returning frontend HTML for API calls!');
    console.log('The /api/* cache behavior is not routing to the backend origin.');
  }
  
  // Test direct backend
  console.log('\n=== Testing Direct Backend ===');
  const directHealth = await request.get('http://51.20.67.228:3000/health');
  console.log(`Direct /health - Status: ${directHealth.status()}`);
  const directBody = await directHealth.text();
  console.log(`Body: ${directBody}`);
  
  // Test signup directly on backend
  console.log('\n=== Testing Direct Backend Signup ===');
  const timestamp = Date.now();
  const signupData = {
    email: `playwright${timestamp}@test.com`,
    password: 'Test123!@#',
    firstName: 'Playwright',
    lastName: 'Test',
    companyName: `PlaywrightCo${timestamp}`,
    country: 'ZA',
    plan: 'starter'
  };
  
  const directSignup = await request.post('http://51.20.67.228:3000/api/auth/signup', {
    data: signupData,
    headers: { 'Content-Type': 'application/json' }
  });
  console.log(`Direct signup - Status: ${directSignup.status()}`);
  const signupBody = await directSignup.text();
  console.log(`Body: ${signupBody.substring(0, 500)}`);
  
  // Test signup through CloudFront
  console.log('\n=== Testing CloudFront Signup ===');
  const cfSignup = await request.post(`${PROD_URL}/api/auth/signup`, {
    data: { ...signupData, email: `playwright2${timestamp}@test.com`, companyName: `PlaywrightCo2${timestamp}` },
    headers: { 'Content-Type': 'application/json' }
  });
  console.log(`CloudFront signup - Status: ${cfSignup.status()}`);
  const cfSignupBody = await cfSignup.text();
  console.log(`Body: ${cfSignupBody.substring(0, 500)}`);
  
  // Final verdict
  console.log('\n=== VERDICT ===');
  if (cfSignup.status() === 200 && !cfSignupBody.includes('<!')) {
    console.log('✅ CloudFront API routing is WORKING');
  } else if (cfSignup.status() === 504) {
    console.log('❌ 504 Gateway Timeout - Backend may be down or CloudFront cannot reach it');
  } else if (cfSignupBody.includes('<!')) {
    console.log('❌ CloudFront returning HTML - API routing is broken');
  } else {
    console.log(`❌ Unknown issue - Status: ${cfSignup.status()}`);
  }
  
  expect(directSignup.status()).toBe(200);
});
