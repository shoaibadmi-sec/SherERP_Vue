import { parseSettings, type TenantSettings } from "./model.ts";

const prefix = "-- HisabIQ settings SQL backup v1\nBEGIN;\nCREATE TABLE IF NOT EXISTS hisabiq_settings_backup (tenant_id TEXT PRIMARY KEY, payload TEXT NOT NULL);\n";
const aad = new TextEncoder().encode("HisabIQ settings SQL backup v1");
const iterations = 310000;
const quote = (value: string) => "'" + value.replaceAll("'", "''") + "'";

/** A portable SQL snapshot row; imports parse this format and never execute SQL. */
export function settingsToSql(state: TenantSettings): string {
  return prefix + `INSERT INTO hisabiq_settings_backup (tenant_id, payload) VALUES (${quote(state.tenantId)}, ${quote(JSON.stringify(state))});\nCOMMIT;\n`;
}
export function settingsFromSql(raw: string, tenantId: string): TenantSettings {
  if (raw.length > 1000000) throw Error("SQL backup is too large.");
  const normalized = raw.replaceAll("\r\n", "\n");
  if (!normalized.startsWith(prefix)) throw Error("Choose a HisabIQ settings SQL backup; arbitrary SQL is not supported.");
  const match = /^INSERT INTO hisabiq_settings_backup \(tenant_id, payload\) VALUES \('((?:[^']|'')*)', '((?:[^']|'')*)'\);\nCOMMIT;\n?$/.exec(normalized.slice(prefix.length));
  if (!match || match[1].replaceAll("''", "'") !== tenantId) throw Error("Invalid SQL backup format or a backup from another business.");
  const parsed = parseSettings(match[2].replaceAll("''", "'"), tenantId);
  if (parsed.recovered) throw Error("The SQL backup has invalid settings, employees or roles.");
  return parsed.state;
}
function secretBytes(secret: string) {
  if (secret.length < 12 || secret.length > 1024) throw Error("Use a HisabIQ secret key of 12–1024 characters.");
  return new TextEncoder().encode(secret);
}
const base64 = (bytes: Uint8Array) => btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(""));
function bytes(value: unknown, max: number): Uint8Array<ArrayBuffer> {
  if (typeof value !== "string" || value.length > max || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) throw Error("Invalid encrypted backup format.");
  return Uint8Array.from(atob(value), character => character.charCodeAt(0));
}
async function derive(secret: string, salt: Uint8Array<ArrayBuffer>) {
  const material = await crypto.subtle.importKey("raw", secretBytes(secret), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
export async function encryptSettingsSql(state: TenantSettings, secret: string): Promise<string> {
  secretBytes(secret);
  const sql = settingsToSql(state);
  settingsFromSql(sql, state.tenantId);
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await derive(secret, salt);
  const plaintext = new TextEncoder().encode(sql);
  if (plaintext.byteLength > 1000000) throw Error("SQL backup is too large.");
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: aad }, key, plaintext);
  return JSON.stringify({ format: "hisabiq-settings-sql", version: 1, cipher: "AES-256-GCM", kdf: "PBKDF2-SHA-256", iterations, salt: base64(salt), iv: base64(iv), ciphertext: base64(new Uint8Array(encrypted)) });
}
export async function decryptSettingsSql(raw: string, secret: string, tenantId: string): Promise<TenantSettings> {
  if (raw.length > 2000000) throw Error("Encrypted SQL backup is too large.");
  let envelope;
  try { envelope = JSON.parse(raw); } catch { throw Error("Invalid encrypted backup format."); }
  if (!envelope || envelope.format !== "hisabiq-settings-sql" || envelope.version !== 1 || envelope.cipher !== "AES-256-GCM" || envelope.kdf !== "PBKDF2-SHA-256" || envelope.iterations !== iterations) throw Error("Invalid encrypted backup format.");
  const salt = bytes(envelope.salt, 24), iv = bytes(envelope.iv, 16), ciphertext = bytes(envelope.ciphertext, 1500000);
  if (salt.length !== 16 || iv.length !== 12 || ciphertext.length < 16) throw Error("Invalid encrypted backup format.");
  const key = await derive(secret, salt);
  let plaintext;
  try { plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv, additionalData: aad }, key, ciphertext); }
  catch { throw Error("The HisabIQ secret key is incorrect or the backup is damaged."); }
  return settingsFromSql(new TextDecoder().decode(plaintext), tenantId);
}
