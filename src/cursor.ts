import { Agent, CursorAgentError } from "@cursor/sdk";
import { config } from "./config.js";
import { clearAgentId, getAgentId, setAgentId } from "./sessions.js";

async function openAgent(chatId: number) {
  const existingId = await getAgentId(chatId);

  if (existingId) {
    try {
      return await Agent.resume(existingId, {
        apiKey: config.cursorApiKey,
      });
    } catch (err) {
      console.warn(`Could not resume agent ${existingId}, creating a new one`, err);
      await clearAgentId(chatId);
    }
  }

  const agent = await Agent.create({
    apiKey: config.cursorApiKey,
    name: `telegram-${chatId}`,
    model: { id: config.model },
    // No-repo cloud agent: chat without giving the bot a shell on your VPS.
    cloud: {
      repos: [],
      metadata: {
        channel: "telegram",
        chat_id: String(chatId),
      },
    },
  });

  await setAgentId(chatId, agent.agentId);
  return agent;
}

export async function chatWithCursor(chatId: number, text: string): Promise<string> {
  await using agent = await openAgent(chatId);

  try {
    const run = await agent.send(text);
    const result = await run.wait();

    if (result.status === "finished") {
      const reply = result.result?.trim();
      return reply || "(empty reply from Cursor)";
    }

    if (result.status === "error") {
      throw new Error(`Cursor run failed (run id: ${result.id})`);
    }

    throw new Error(`Cursor run ended with status: ${result.status}`);
  } catch (err) {
    if (err instanceof CursorAgentError) {
      throw new Error(
        `Cursor startup failed: ${err.message}${err.isRetryable ? " (retryable)" : ""}`,
      );
    }
    throw err;
  }
}

export async function resetChat(chatId: number): Promise<void> {
  await clearAgentId(chatId);
}
