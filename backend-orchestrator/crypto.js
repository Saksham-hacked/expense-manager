/**
 * Cryptography Module
 * 
 * Handles encryption/decryption of user-provided LLM API keys
 * Uses AES-256-GCM for authenticated encryption
 * 
 * CRITICAL SECURITY RULES:
 * - Master key MUST be 32 bytes (base64 encoded in env)
 * - Keys are ONLY decrypted in memory
 * - Plaintext keys NEVER logged or persisted
 * - IV is randomly generated per encryption
 */

import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get master encryption key from environment
 * Must be 32 bytes when decoded
 */
function getMasterKey() {
  const key = process.env.MASTER_ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('MASTER_ENCRYPTION_KEY not set in environment');
  }
  
  // Decode base64 key
  const decodedKey = Buffer.from(key, 'base64');
  
  if (decodedKey.length !== 32) {
    throw new Error('MASTER_ENCRYPTION_KEY must be 32 bytes when decoded');
  }
  
  return decodedKey;
}

/**
 * Encrypt a plaintext API key
 * 
 * @param {string} plaintext - The API key to encrypt
 * @returns {string} - Base64 encoded: iv:authTag:ciphertext
 */
export function encryptKey(plaintext) {
  if (!plaintext || typeof plaintext !== 'string') {
    throw new Error('Invalid plaintext for encryption');
  }
  
  try {
    const masterKey = getMasterKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    // Format: iv:authTag:ciphertext (all base64)
    const result = `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
    
    return result;
    
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw new Error('Failed to encrypt key');
  }
}

/**
 * Decrypt an encrypted API key
 * 
 * @param {string} encrypted - Base64 encoded: iv:authTag:ciphertext
 * @returns {string} - Decrypted plaintext key
 */
export function decryptKey(encrypted) {
  if (!encrypted || typeof encrypted !== 'string') {
    throw new Error('Invalid encrypted data for decryption');
  }
  
  try {
    const masterKey = getMasterKey();
    
    // Parse encrypted format
    const parts = encrypted.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted key format');
    }
    
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const ciphertext = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
    
  } catch (error) {
    console.error('Decryption error:', error.message);
    throw new Error('Failed to decrypt key - key may be corrupted or master key changed');
  }
}

/**
 * Generate a random master encryption key
 * Use this to generate MASTER_ENCRYPTION_KEY for .env
 * 
 * @returns {string} - Base64 encoded 32-byte key
 */
export function generateMasterKey() {
  const key = crypto.randomBytes(32);
  return key.toString('base64');
}

/**
 * Securely compare two strings (constant-time)
 * Prevents timing attacks
 */
export function secureCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  
  if (a.length !== b.length) {
    return false;
  }
  
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  
  return crypto.timingSafeEqual(bufA, bufB);
}

// Export for setup script
export { generateMasterKey as default };
