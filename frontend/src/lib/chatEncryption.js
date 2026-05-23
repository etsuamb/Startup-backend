/**
 * Conversation-scoped AES-GCM encryption for chat text.
 * Both participants derive the same key from the conversation id.
 * Messages are prefixed so legacy plaintext still renders.
 */

const E2E_PREFIX = "sc-e2e:v1:";
const PBKDF2_ITERATIONS = 120000;

function getSecret() {
  return (
    process.env.NEXT_PUBLIC_CHAT_E2E_SECRET ||
    "startupconnect-chat-e2e-dev-change-in-production"
  );
}

function toBase64(bytes) {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function fromBase64(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveKey(conversationId) {
  const enc = new TextEncoder();
  const material = enc.encode(`${getSecret()}:conversation:${conversationId}`);
  const salt = enc.encode("startupconnect-chat-salt-v1");
  const baseKey = await crypto.subtle.importKey("raw", material, "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export function isEncryptedChatPayload(value) {
  return typeof value === "string" && value.startsWith(E2E_PREFIX);
}

export async function encryptChatText(plaintext, conversationId) {
  const text = String(plaintext ?? "");
  if (!text.trim() || !conversationId) return text;
  const key = await deriveKey(conversationId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const payload = new Uint8Array(iv.length + cipher.byteLength);
  payload.set(iv, 0);
  payload.set(new Uint8Array(cipher), iv.length);
  return `${E2E_PREFIX}${toBase64(payload)}`;
}

export async function decryptChatText(ciphertext, conversationId) {
  const raw = String(ciphertext ?? "");
  if (!raw.startsWith(E2E_PREFIX) || !conversationId) return raw;
  try {
    const key = await deriveKey(conversationId);
    const payload = fromBase64(raw.slice(E2E_PREFIX.length));
    const iv = payload.slice(0, 12);
    const data = payload.slice(12);
    const plainBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
    return new TextDecoder().decode(plainBuffer);
  } catch {
    return "[Unable to decrypt message]";
  }
}

export async function decryptMessages(messages, conversationId, getText) {
  if (!Array.isArray(messages) || !conversationId) return messages || [];
  return Promise.all(
    messages.map(async (message) => {
      const original = getText(message);
      if (!original || !isEncryptedChatPayload(original)) return message;
      const decrypted = await decryptChatText(original, conversationId);
      return { ...message, _decrypted_body: decrypted };
    }),
  );
}
