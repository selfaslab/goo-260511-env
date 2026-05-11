/**
 * Mask a secret value, preserving a small prefix and suffix so a human can
 * still identify which key was matched without exposing the raw value.
 */
export function maskValue(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length <= 8) {
    return "*".repeat(Math.max(trimmed.length, 4));
  }
  const head = trimmed.slice(0, 4);
  const tail = trimmed.slice(-3);
  const middle = "*".repeat(Math.min(8, Math.max(4, trimmed.length - 7)));
  return `${head}${middle}${tail}`;
}

/**
 * Mask any secret-like substrings inside an arbitrary line of code so that
 * findings can be safely shipped to the UI / patch file.
 */
export function maskLine(line: string, secrets: string[]): string {
  let result = line;
  for (const secret of secrets) {
    if (!secret) continue;
    const masked = maskValue(secret);
    result = result.split(secret).join(masked);
  }
  return result;
}

export function stableId(parts: (string | number)[]): string {
  // Tiny FNV-1a hash. We do not need cryptographic strength here, only a
  // stable identifier per finding so the UI can key React lists.
  let hash = 0x811c9dc5;
  const input = parts.join("|");
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
