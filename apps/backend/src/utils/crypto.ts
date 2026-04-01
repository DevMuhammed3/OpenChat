import crypto from 'crypto';

// Use environment variable or fallback for development
const ENCRYPTION_KEY_STRING = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY_STRING) {
  throw new Error('ENCRYPTION_KEY is not set');
}

const ENCRYPTION_KEY = Buffer.from(ENCRYPTION_KEY_STRING, 'hex')
const ALGORITHM = 'aes-256-gcm'

export function encryptMessage(text: string): string {
  if (!text) return text;
  
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptMessage(encryptedData: string): string {
  if (!encryptedData) return encryptedData;

  try {
    const parts = encryptedData.split(':');
    // If it doesn't match the expected format, it might be an older unencrypted message.
    if (parts.length !== 3) return encryptedData;
    
    const iv = Buffer.from(parts[0]!, 'hex');
    const authTag = Buffer.from(parts[1]!, 'hex');
    const encryptedText = parts[2]!;
    
    // Check lengths to minimize crypto errors throwing
    if (iv.length !== 12 || authTag.length !== 16) return encryptedData;

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch {
    // Graceful fallback for legacy unencrypted messages that happen to have colons
    // or if the key has changed.
    return encryptedData;
  }
}
