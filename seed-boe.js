#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🚀 Starting BoE data seeding...');

try {
    execSync('npm run seed:boe', { stdio: 'inherit' });
    console.log('✅ BoE data seeding completed successfully!');
} catch (error) {
    console.error('❌ BoE data seeding failed:', error.message);
    process.exit(1);
}