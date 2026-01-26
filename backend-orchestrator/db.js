/**
 * Database Connection Module (Supabase)
 * 
 * Manages Supabase connection for:
 * - User identity metadata
 * - Encrypted LLM API keys (BYOK)
 * 
 * DOES NOT store expense data (that lives in MCP server)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  throw new Error('Missing required Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY');
}

// Create Supabase client with service role key (for backend operations)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Test Supabase connection
 */
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet
      throw error;
    }
    
    console.log('✅ Connected to Supabase database');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    throw error;
  }
}

/**
 * Initialize database schema
 * Note: For Supabase, tables should be created via Supabase Dashboard or Migration files
 * This function verifies tables exist
 */
export async function initializeDatabase() {
  try {
    console.log('🔍 Verifying Supabase schema...');
    
    // Check if users table exists
    const { error: usersError } = await supabase
      .from('users')
      .select('user_id')
      .limit(1);
    
    // Check if user_llm_keys table exists
    const { error: keysError } = await supabase
      .from('user_llm_keys')
      .select('user_id')
      .limit(1);
    
    if (usersError && usersError.code === 'PGRST116') {
      console.error('❌ "users" table not found. Please run the schema.sql in Supabase SQL Editor.');
      throw new Error('Database schema not initialized. Run schema.sql first.');
    }
    
    if (keysError && keysError.code === 'PGRST116') {
      console.error('❌ "user_llm_keys" table not found. Please run the schema.sql in Supabase SQL Editor.');
      throw new Error('Database schema not initialized. Run schema.sql first.');
    }
    
    console.log('✅ Database schema verified');
    return true;
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * User Database Operations
 */

export async function createOrGetUser(userId, email) {
  try {
    // Try to insert, if conflict, update email
    const { data, error } = await supabase
      .from('users')
      .upsert(
        { 
          user_id: userId, 
          email: email 
        },
        { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        }
      )
      .select()
      .single();
    
    if (error) throw error;
    return data;
    
  } catch (error) {
    console.error('Error creating/getting user:', error);
    throw error;
  }
}

export async function getUserById(userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return data;
    
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
}

/**
 * LLM Key Database Operations
 */

export async function storeUserLLMKey(userId, provider, encryptedKey) {
  try {
    const { data, error } = await supabase
      .from('user_llm_keys')
      .upsert(
        {
          user_id: userId,
          provider: provider,
          encrypted_key: encryptedKey,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id',
          ignoreDuplicates: false
        }
      )
      .select('user_id, provider, created_at, updated_at')
      .single();
    
    if (error) throw error;
    return data;
    
  } catch (error) {
    console.error('Error storing LLM key:', error);
    throw error;
  }
}

export async function getUserLLMKey(userId) {
  try {
    const { data, error } = await supabase
      .from('user_llm_keys')
      .select('provider, encrypted_key, updated_at')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return data;
    
  } catch (error) {
    console.error('Error getting LLM key:', error);
    throw error;
  }
}

export async function deleteUserLLMKey(userId) {
  try {
    const { data, error } = await supabase
      .from('user_llm_keys')
      .delete()
      .eq('user_id', userId)
      .select('user_id')
      .single();
    
    if (error) throw error;
    return data;
    
  } catch (error) {
    console.error('Error deleting LLM key:', error);
    throw error;
  }
}

export default supabase;
