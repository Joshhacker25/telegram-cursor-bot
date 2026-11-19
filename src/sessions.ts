import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const dataDir = path.resolve("data");
const sessionsPath = path.join(dataDir, "sessions.json");

type SessionMap = Record<string, string>;

async function load(): Promise<SessionMap> {
  try {
    const raw = await readFile(sessionsPath, "utf8");
    return JSON.parse(raw) as SessionMap;
  } catch {
    return {};
  }
}

async function save(map: SessionMap): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  await writeFile(sessionsPath, JSON.stringify(map, null, 2), "utf8");
}

export async function getAgentId(chatId: number): Promise<string | undefined> {
  const map = await load();
  return map[String(chatId)];
}

export async function setAgentId(chatId: number, agentId: string): Promise<void> {
  const map = await load();
  map[String(chatId)] = agentId;
  await save(map);
}

export async function clearAgentId(chatId: number): Promise<void> {
  const map = await load();
  delete map[String(chatId)];
  await save(map);
}
