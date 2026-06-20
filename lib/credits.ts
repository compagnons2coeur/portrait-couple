import { FREE_GENERATIONS_PER_STYLE } from "./constants";
import { getRedis } from "./redis";

function creditKey(fingerprint: string, styleId: string): string {
  return `credit:${fingerprint}-${styleId}`;
}

function emailKey(fingerprint: string): string {
  return `email:${fingerprint}`;
}

async function getUsedCount(
  fingerprint: string,
  styleId: string
): Promise<number> {
  const value = await getRedis().get<number>(creditKey(fingerprint, styleId));
  return value ?? 0;
}

async function hasEmail(fingerprint: string): Promise<boolean> {
  const value = await getRedis().get<string>(emailKey(fingerprint));
  return Boolean(value);
}

export async function getCreditsUsage(
  fingerprint: string,
  styleId: string
): Promise<{ used: number; remaining: number }> {
  const used = await getUsedCount(fingerprint, styleId);

  return {
    used,
    remaining: Math.max(0, FREE_GENERATIONS_PER_STYLE - used),
  };
}

export async function canGenerate(
  fingerprint: string,
  styleId: string
): Promise<{ allowed: boolean; used: number; needsEmail: boolean }> {
  const used = await getUsedCount(fingerprint, styleId);
  const emailRegistered = await hasEmail(fingerprint);

  return {
    allowed: used < FREE_GENERATIONS_PER_STYLE,
    used,
    needsEmail: used === 0 && !emailRegistered,
  };
}

export async function recordEmail(
  fingerprint: string,
  email: string
): Promise<void> {
  await getRedis().set(emailKey(fingerprint), email.trim().toLowerCase());
}

export async function incrementUsage(
  fingerprint: string,
  styleId: string
): Promise<void> {
  await getRedis().incr(creditKey(fingerprint, styleId));
}
