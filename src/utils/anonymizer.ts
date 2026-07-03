/**
 * Sijil Al-Takaful: Auto-Anonymization Helper for PII (Personally Identifiable Information)
 * Protects names, addresses, national IDs, and phone numbers in public contexts.
 */

// Mask Libyan National ID (12 digits)
export function maskNationalId(id: string | undefined | null): string {
  if (!id) return "غير مسجل";
  const cleaned = id.trim();
  // Check if it's already encrypted
  if (cleaned.startsWith("__enc__")) {
    return "🔐 مُشفر بالكامل ومحمي بالنظام";
  }
  if (cleaned.length >= 8) {
    return cleaned.substring(0, 4) + "******" + cleaned.substring(cleaned.length - 2);
  }
  return cleaned.replace(/./g, "*");
}

// Mask full Arabic or foreign names
export function maskName(name: string | undefined | null): string {
  if (!name) return "مستحق محجوب الهوية";
  const cleaned = name.trim();
  if (cleaned.startsWith("__enc__")) {
    return "🔐 اسم مستحق مشفر";
  }
  
  // Exclude placeholder names
  if (cleaned.includes("مستفيد رقم") || cleaned.includes("temp-user")) {
    return cleaned;
  }
  
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) {
    if (parts[0].length <= 2) return parts[0];
    return parts[0][0] + "**" + (parts[0][parts[0].length - 1] || "");
  }
  
  // If multiple words, e.g., "حسام فوزي غانم" -> "حسام ف*** غ***"
  return parts.map((part, index) => {
    if (index === 0) {
      // Keep first name visible for basic recognition
      return part;
    }
    if (part.length <= 1) return part;
    return part[0] + "***";
  }).join(" ");
}

// Mask detailed address but keep general municipality
export function maskAddress(address: string | undefined | null): string {
  if (!address) return "بلدية معينة";
  const cleaned = address.trim();
  if (cleaned.startsWith("__enc__")) {
    return "🔐 عنوان سكن مؤمن ومحمي";
  }
  
  // Try to find if there are comma separations
  const parts = cleaned.split(/[،,]/);
  if (parts.length > 1) {
    // Keep the first part (e.g. "طرابلس") and mask details
    return parts[0].trim() + "، حي " + "***" + (parts.length > 2 ? " (تفاصيل محمية)" : "");
  }
  if (cleaned.length <= 6) return cleaned;
  return cleaned.substring(0, 4) + "********";
}

// Mask general text containing potential PII (like National IDs, Phones, IBANs, or Names) via Regex
export function maskGeneralPII(text: string | undefined | null): string {
  if (!text) return "";
  let masked = text;

  // 1. Detect and mask national IDs (12-digit sequences)
  const nationalIdRegex = /\b\d{12}\b/g;
  masked = masked.replace(nationalIdRegex, (match) => {
    return match.substring(0, 4) + "******" + match.substring(10);
  });

  // 2. Detect and mask phone numbers (e.g., Libyan 091/092/094/093 followed by 7 digits)
  const phoneRegex = /\b(09[12345]\d{7})\b/g;
  masked = masked.replace(phoneRegex, (match) => {
    return match.substring(0, 3) + "****" + match.substring(7);
  });

  // 3. Detect and mask IBANs (e.g., LY followed by 23 alphanumeric characters)
  const ibanRegex = /\b(LY\d{23})\b/gi;
  masked = masked.replace(ibanRegex, (match) => {
    return match.substring(0, 4) + "***************" + match.substring(19);
  });

  return masked;
}
