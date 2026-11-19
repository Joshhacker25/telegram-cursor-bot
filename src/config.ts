import "dotenv/config";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

const allowedRaw = process.env.TELEGRAM_ALLOWED_USER_IDS?.trim() ?? "";
const allowedUserIds = new Set(
  allowedRaw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id)),
);

if (allowedUserIds.size === 0) {
  throw new Error(
    "Set TELEGRAM_ALLOWED_USER_IDS to at least one numeric Telegram user id",
  );
}

export const config = {
  telegramToken: required("TELEGRAM_BOT_TOKEN"),
  allowedUserIds,
  cursorApiKey: required("CURSOR_API_KEY"),
  model: process.env.CURSOR_MODEL?.trim() || "composer-2.5",
} as const;
