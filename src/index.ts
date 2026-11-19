import { Bot } from "grammy";
import { config } from "./config.js";
import { chatWithCursor, resetChat } from "./cursor.js";

const bot = new Bot(config.telegramToken);

/** Telegram message limit is 4096; keep a margin for safety. */
function splitMessage(text: string, max = 4000): string[] {
  if (text.length <= max) return [text];

  const chunks: string[] = [];
  let rest = text;
  while (rest.length > max) {
    let cut = rest.lastIndexOf("\n", max);
    if (cut < max * 0.5) cut = max;
    chunks.push(rest.slice(0, cut));
    rest = rest.slice(cut).trimStart();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

bot.use(async (ctx, next) => {
  const userId = ctx.from?.id;
  if (!userId || !config.allowedUserIds.has(userId)) {
    if (ctx.message) {
      await ctx.reply("Unauthorized.");
    }
    return;
  }
  await next();
});

bot.command("start", async (ctx) => {
  await ctx.reply(
    "Cursor Telegram bot ready.\n\n" +
      "Send any message to chat.\n" +
      "/new — start a fresh conversation\n" +
      "/help — show commands",
  );
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    "Commands:\n" +
      "/start — welcome\n" +
      "/new — reset conversation memory\n" +
      "/help — this help\n\n" +
      "Anything else is sent to Cursor.",
  );
});

bot.command("new", async (ctx) => {
  await resetChat(ctx.chat.id);
  await ctx.reply("Started a new conversation.");
});

bot.on("message:text", async (ctx) => {
  const text = ctx.message.text.trim();
  if (!text || text.startsWith("/")) return;

  await ctx.replyWithChatAction("typing");
  const typing = setInterval(() => {
    void ctx.replyWithChatAction("typing");
  }, 4000);

  try {
    const reply = await chatWithCursor(ctx.chat.id, text);
    for (const chunk of splitMessage(reply)) {
      await ctx.reply(chunk);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    await ctx.reply(`Error: ${message}`);
  } finally {
    clearInterval(typing);
  }
});

bot.catch((err) => {
  console.error("Bot error:", err.error);
});

console.log("Starting Telegram ↔ Cursor bot…");
await bot.start({
  onStart: (info) => console.log(`Bot @${info.username} is running`),
});
