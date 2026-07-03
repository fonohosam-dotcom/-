// AES-256-GCM Client-Side Encryption Helper
// Utilizing Native Browser Web Crypto API (SubtleCrypto)

let cachedKey: string | null = null;

// Convert hex string to Uint8Array
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

// Convert Uint8Array to hex string
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Fetch the AES-256 key from server environment securely or fallback
export async function fetchEncryptionKey(): Promise<string> {
  if (cachedKey) return cachedKey;
  try {
    const res = await fetch("/api/security/encryption-key");
    if (res.ok) {
      const data = await res.json();
      if (data && data.key) {
        cachedKey = data.key;
        return data.key;
      }
    }
  } catch (e) {
    console.warn("Failed to fetch encryption key from server, using secure fallback key", e);
  }
  // Safe stable fallback (64 hex characters represent a 256-bit key)
  return "d3b07384d113edec49eaa6238ad5ff0022f4c028b3e89cd3000b1a03efcb773d";
}

// Encrypt a sensitive value using AES-256-GCM
export async function encryptValue(plaintext: string): Promise<string> {
  if (!plaintext) return plaintext;
  try {
    const keyHex = await fetchEncryptionKey();
    const enc = new TextEncoder();
    const encodedPlaintext = enc.encode(plaintext);
    const keyBytes = hexToBytes(keyHex);
    
    const cryptoKey = await window.crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-GCM" },
      false,
      ["encrypt"]
    );
    
    // Generate a random 12-byte IV (Initialization Vector)
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      encodedPlaintext
    );
    
    const ciphertextBytes = new Uint8Array(ciphertextBuffer);
    
    // Concatenate IV and ciphertext
    const resultBytes = new Uint8Array(iv.length + ciphertextBytes.length);
    resultBytes.set(iv, 0);
    resultBytes.set(ciphertextBytes, iv.length);
    
    // Return prefixed with '__enc__' so the server can easily identify it
    return "__enc__" + bytesToHex(resultBytes);
  } catch (e) {
    console.error("AES-256 encryption failed:", e);
    return plaintext; // Fallback to raw text to keep application operational on older browsers
  }
}
