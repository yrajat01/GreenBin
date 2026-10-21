#!/usr/bin/env node

/**
 * GreenBin Automated Environment Setup Script
 * Copies .env.example files to .env in server/ and client/ if they don't already exist.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const serverDir = path.join(rootDir, 'server');
const clientDir = path.join(rootDir, 'client');

function setupEnvFile(dirName, targetDir) {
  const envExamplePath = path.join(targetDir, '.env.example');
  const envPath = path.join(targetDir, '.env');

  if (!fs.existsSync(envExamplePath)) {
    console.warn(`⚠️  Warning: ${dirName}/.env.example not found.`);
    return;
  }

  if (fs.existsSync(envPath)) {
    console.log(`ℹ️  ${dirName}/.env already exists. Skipping copy.`);
  } else {
    fs.copyFileSync(envExamplePath, envPath);
    console.log(`✅ Created ${dirName}/.env from ${dirName}/.env.example`);
  }
}

console.log('==============================================');
console.log('🌿 GreenBin Local Environment Setup');
console.log('==============================================\n');

setupEnvFile('server', serverDir);
setupEnvFile('client', clientDir);

console.log('\n✨ Environment files setup complete.');
console.log('\nNext steps:');
console.log('  1. Ensure MongoDB is running (e.g., run `npm run docker:up` or start local mongod).');
console.log('  2. Run `npm run install:all` to install all dependencies.');
console.log('  3. Run `npm run dev` to start both the server and client concurrently.');
console.log('  4. Open http://localhost:5173 in your browser.\n');
