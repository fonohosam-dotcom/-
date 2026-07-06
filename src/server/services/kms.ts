import { KeyManagementServiceClient } from '@google-cloud/kms';
import { logger } from "../../lib/logger";

const client = new KeyManagementServiceClient();

export const encryptPII = async (plaintext: string, projectId: string, locationId: string, keyRingId: string, keyId: string) => {
  const name = client.cryptoKeyPath(projectId, locationId, keyRingId, keyId);
  const plaintextBuffer = Buffer.from(plaintext);

  try {
    const [result] = await client.encrypt({
      name,
      plaintext: plaintextBuffer,
    });
    return result.ciphertext;
  } catch (err) {
    logger.error("KMS Encryption failed", err);
    throw err;
  }
};

export const decryptPII = async (ciphertext: string, projectId: string, locationId: string, keyRingId: string, keyId: string) => {
  const name = client.cryptoKeyPath(projectId, locationId, keyRingId, keyId);
  
  try {
    const [result] = await client.decrypt({
      name,
      ciphertext: Buffer.from(ciphertext, 'base64'),
    });
    return result.plaintext?.toString();
  } catch (err) {
    logger.error("KMS Decryption failed", err);
    throw err;
  }
};
