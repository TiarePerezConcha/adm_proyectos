/**
 * Motor ligero y autónomo de TOTP (RFC 6238) y Criptografía Web nativa del navegador.
 * 100% compatible con Google Authenticator, Authy, Microsoft Authenticator.
 */

function base32ToBytes(base32: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  const clean = base32.toUpperCase().replace(/=+$/, '');
  for (let i = 0; i < clean.length; i++) {
    const val = alphabet.indexOf(clean[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
  }
  return bytes;
}

export function generateBase32Secret(length = 16): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += alphabet[array[i] % alphabet.length];
  }
  return secret;
}

export async function generateTOTPCode(secret: string, timeStepSeconds = 30): Promise<string> {
  const keyBytes = base32ToBytes(secret);
  const epochSeconds = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epochSeconds / timeStepSeconds);

  const counterBytes = new Uint8Array(8);
  let temp = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = temp & 0xff;
    temp = Math.floor(temp / 256);
  }

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, counterBytes.buffer as ArrayBuffer);
  const hash = new Uint8Array(signature);
  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

export async function verifyTOTPCode(secret: string, code: string): Promise<boolean> {
  const currentEpoch = Math.floor(Date.now() / 1000);
  const cleanCode = code.trim();

  for (let offset = -1; offset <= 1; offset++) {
    const counter = Math.floor((currentEpoch + offset * 30) / 30);
    const counterBytes = new Uint8Array(8);
    let temp = counter;
    for (let i = 7; i >= 0; i--) {
      counterBytes[i] = temp & 0xff;
      temp = Math.floor(temp / 256);
    }
    const keyBytes = base32ToBytes(secret);
    try {
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyBytes.buffer as ArrayBuffer,
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
      );
      const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, counterBytes.buffer as ArrayBuffer);
      const hash = new Uint8Array(signature);
      const hashOffset = hash[hash.length - 1] & 0x0f;
      const binary =
        ((hash[hashOffset] & 0x7f) << 24) |
        ((hash[hashOffset + 1] & 0xff) << 16) |
        ((hash[hashOffset + 2] & 0xff) << 8) |
        (hash[hashOffset + 3] & 0xff);
      const generated = (binary % 1000000).toString().padStart(6, '0');
      if (generated === cleanCode) return true;
    } catch (e) {
      console.error(e);
    }
  }
  return false;
}

export async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password + '_salt_lsc_2026');
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
