#!/usr/bin/env node

/**
 * Helper script to encode Firebase service account JSON to base64
 * Usage: node scripts/encode-service-account.js <path-to-service-account.json>
 * Or: cat service-account.json | node scripts/encode-service-account.js
 */

const fs = require('fs');

function encodeServiceAccount(jsonString) {
  try {
    // Validate it's valid JSON
    JSON.parse(jsonString);
    
    // Encode to base64
    const base64 = Buffer.from(jsonString, 'utf8').toString('base64');
    
    return base64;
  } catch (error) {
    console.error('Error: Invalid JSON provided');
    process.exit(1);
  }
}

// Check if file path is provided as argument
if (process.argv[2]) {
  const filePath = process.argv[2];
  
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }
  
  const jsonString = fs.readFileSync(filePath, 'utf8');
  const base64 = encodeServiceAccount(jsonString);
  
  console.log('\n✅ Base64-encoded Firebase service account:\n');
  console.log(base64);
  console.log('\n📋 Copy the above value and set it as FIREBASE_SERVICE_ACCOUNT_B64 in Railway\n');
} else {
  // Read from stdin
  let jsonString = '';
  
  process.stdin.on('data', (chunk) => {
    jsonString += chunk;
  });
  
  process.stdin.on('end', () => {
    if (!jsonString.trim()) {
      console.error('Usage: node scripts/encode-service-account.js <path-to-service-account.json>');
      console.error('   Or: cat service-account.json | node scripts/encode-service-account.js');
      process.exit(1);
    }
    
    const base64 = encodeServiceAccount(jsonString);
    
    console.log('\n✅ Base64-encoded Firebase service account:\n');
    console.log(base64);
    console.log('\n📋 Copy the above value and set it as FIREBASE_SERVICE_ACCOUNT_B64 in Railway\n');
  });
}
