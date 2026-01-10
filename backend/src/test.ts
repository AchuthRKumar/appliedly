import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { encrypt, decrypt } from './lib/security.js';
import { isJobRelated, extractJobData } from './services/aiService.js';

dotenv.config();

async function runTests() {
  console.log('--- STARTING SYSTEM CHECKS ---\n');

  // 1. Test Encryption (Crucial for storing tokens)
  console.log('🔹 1. Testing Security Module...');
  const secretText = "This-Is-A-Super-Secret-Token";
  try {
    const encrypted = encrypt(secretText);
    const decrypted = decrypt(encrypted);
    
    if (decrypted === secretText) {
      console.log('✅ Encryption/Decryption: SUCCESS');
    } else {
      console.error('❌ Encryption/Decryption: FAILED (Mismatch)');
    }
  } catch (error) {
    console.error('❌ Encryption Error:', error);
  }

  // 2. Test MongoDB Connection
  console.log('\n🔹 2. Testing Database Connection...');
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('✅ MongoDB: Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB: Connection Failed', error);
    process.exit(1); // Stop if DB fails
  }

  // 3. Test Gemini AI (The Fun Part)
  console.log('\n🔹 3. Testing Gemini 2.5 AI Service...');
  
  // Test A: Filtering
  const testSubject = "Application for Senior React Developer - TechCorp";
  console.log(`\n   Test A: Filtering Subject: "${testSubject}"`);
  const isJob = await isJobRelated(testSubject, "hr@techcorp.com");
  console.log(`   Result: ${isJob ? '✅ Identified as Job' : '❌ Failed to identify'}`);

  // Test B: Extraction
  const testBody = `
    Hi there,
    Thanks for applying to the Frontend Engineer role at Google.
    We would like to move forward and schedule a screening interview next Tuesday.
    Please let us know your availability.
    Best, Google HR.
  `;
  console.log(`\n   Test B: Extracting Data from Body...`);
  const extracted = await extractJobData(testBody);
  
  if (extracted && extracted.companyName) {
    console.log('✅ Extraction Success! Output:');
    console.log(JSON.stringify(extracted, null, 2));
  } else {
    console.error('❌ Extraction Failed (Check API Key or Model Name)');
  }

  // Cleanup
  await mongoose.connection.close();
  console.log('\n--- TESTS COMPLETED ---');
}

runTests();