#!/usr/bin/env node

/**
 * Backend Orchestrator Setup Script
 * 
 * Helps you set up the backend orchestrator with Supabase
 */

import { randomBytes } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function generateKey(bytes = 32) {
  return randomBytes(bytes).toString('base64');
}

async function main() {
  console.log('🚀 Backend Orchestrator Setup\n');
  console.log('This script will help you configure your backend.\n');

  // Check if .env already exists
  if (existsSync('.env')) {
    console.log('⚠️  .env file already exists!');
    const overwrite = await question('Do you want to overwrite it? (yes/no): ');
    if (overwrite.toLowerCase() !== 'yes') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }

  console.log('\n📝 Let\'s gather your configuration...\n');

  // Server config
  const port = await question('Server port (default: 3000): ') || '3000';
  const nodeEnv = await question('Environment (development/production, default: development): ') || 'development';

  console.log('\n🗄️ Supabase Configuration');
  console.log('Get these from: https://app.supabase.com/project/_/settings/api\n');
  
  const supabaseUrl = await question('Supabase URL: ');
  const supabaseKey = await question('Supabase Service Role Key: ');

  if (!supabaseUrl || !supabaseKey) {
    console.error('\n❌ Supabase credentials are required!');
    console.log('Please create a Supabase project first.');
    console.log('See SUPABASE_SETUP.md for instructions.');
    rl.close();
    return;
  }

  // Generate security keys
  console.log('\n🔐 Generating security keys...');
  const encryptionKey = generateKey(32);
  const sessionSecret = generateKey(32);
  console.log('✅ Generated MASTER_ENCRYPTION_KEY');
  console.log('✅ Generated SESSION_SECRET');

  // Google OAuth
  console.log('\n🔑 Google OAuth Configuration');
  console.log('Get these from: https://console.cloud.google.com/apis/credentials\n');
  
  const googleClientId = await question('Google Client ID: ');
  const googleClientSecret = await question('Google Client Secret: ');

  // MCP Configuration
  console.log('\n🔧 MCP Server Configuration');
  const expenseMcpUrl = await question('Expense MCP URL (or press Enter to skip): ');

  // LLM Configuration
  console.log('\n🤖 LLM Configuration (Default provider)');
  const llmProvider = await question('Default LLM provider (gemini/openai, default: gemini): ') || 'gemini';
  const geminiKey = await question('Gemini API Key (optional, can be provided via BYOK): ');
  const openaiKey = await question('OpenAI API Key (optional, can be provided via BYOK): ');

  // CORS
  console.log('\n🌐 CORS Configuration');
  const allowedOrigins = await question('Allowed origins (comma-separated, default: http://localhost:3000): ') || 'http://localhost:3000';

  // Create .env file
  const envContent = `# Backend Orchestrator Environment Variables
# Generated on: ${new Date().toISOString()}

# Server Configuration
PORT=${port}
NODE_ENV=${nodeEnv}

# Supabase Configuration
SUPABASE_URL=${supabaseUrl}
SUPABASE_SERVICE_KEY=${supabaseKey}

# Security (DO NOT SHARE THESE!)
MASTER_ENCRYPTION_KEY=${encryptionKey}
SESSION_SECRET=${sessionSecret}

# Google OAuth
GOOGLE_CLIENT_ID=${googleClientId}
GOOGLE_CLIENT_SECRET=${googleClientSecret}

# MCP Configuration
EXPENSE_MCP_URL=${expenseMcpUrl}

# LLM Configuration
DEFAULT_LLM_PROVIDER=${llmProvider}
DEFAULT_GEMINI_API_KEY=${geminiKey}
DEFAULT_OPENAI_API_KEY=${openaiKey}

# CORS
ALLOWED_ORIGINS=${allowedOrigins}
`;

  writeFileSync('.env', envContent);
  console.log('\n✅ Created .env file');

  // Summary
  console.log('\n📋 Setup Summary:');
  console.log('================================');
  console.log(`✅ Server port: ${port}`);
  console.log(`✅ Environment: ${nodeEnv}`);
  console.log(`✅ Supabase configured: ${supabaseUrl}`);
  console.log(`✅ Security keys generated`);
  console.log(`✅ Google OAuth: ${googleClientId ? 'Configured' : 'Not configured'}`);
  console.log(`✅ MCP server: ${expenseMcpUrl || 'Not configured'}`);
  console.log(`✅ LLM provider: ${llmProvider}`);
  console.log('================================\n');

  console.log('🎯 Next Steps:\n');
  console.log('1. Run the schema in Supabase SQL Editor:');
  console.log('   - Go to https://app.supabase.com/project/_/sql');
  console.log('   - Copy and paste schema.sql');
  console.log('   - Click "Run"\n');
  
  console.log('2. Install dependencies:');
  console.log('   npm install\n');
  
  console.log('3. Start the server:');
  console.log('   npm run dev\n');
  
  console.log('4. Test the connection:');
  console.log('   curl http://localhost:' + port + '/execute/health\n');

  console.log('📚 For detailed setup instructions, see:');
  console.log('   - SUPABASE_SETUP.md');
  console.log('   - README.md\n');

  console.log('⚠️  Important Security Notes:');
  console.log('   - Never commit .env to Git');
  console.log('   - Keep your MASTER_ENCRYPTION_KEY secure');
  console.log('   - Use service_role key, not anon key');
  console.log('   - Enable HTTPS in production\n');

  rl.close();
}

main().catch(error => {
  console.error('❌ Setup failed:', error);
  rl.close();
  process.exit(1);
});
