import crypto from "crypto";
import { env } from "../config/env.ts";

const AES_KEY_HEX = env.AES_SECRET_KEY;

export function decryptAES256GCM(encryptedHex: string, rawKeyHex: string): string {
  try {
    const keyBytes = Buffer.from(rawKeyHex, "hex");
    const iv = Buffer.from(encryptedHex.slice(0, 24), "hex");
    const authTag = Buffer.from(encryptedHex.slice(24, 56), "hex");
    const ciphertext = Buffer.from(encryptedHex.slice(56), "hex");

    const decipher = crypto.createDecipheriv("aes-256-gcm", keyBytes, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, undefined, "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error("Decryption failed. Invalid payload or key.");
  }
}

export function decryptObjectValues(obj: any, rawKeyHex: string): any {
  if (typeof obj === "string") {
    if (obj.length > 56 && /^[0-9a-fA-F]+$/.test(obj)) {
      try {
        return decryptAES256GCM(obj, rawKeyHex);
      } catch (e) {
        return obj;
      }
    }
    return obj;
  } else if (Array.isArray(obj)) {
    return obj.map(item => decryptObjectValues(item, rawKeyHex));
  } else if (obj !== null && typeof obj === "object") {
    const newObj: any = {};
    for (const key of Object.keys(obj)) {
      newObj[key] = decryptObjectValues(obj[key], rawKeyHex);
    }
    return newObj;
  }
  return obj;
}
