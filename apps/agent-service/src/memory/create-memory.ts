import { D1Store } from '@mastra/cloudflare-d1';
import { Memory } from '@mastra/memory';

export async function createMemory(
  db: D1Database | undefined
): Promise<Memory | undefined> {
  if (!db) {
    return undefined;
  }

  const storage = new D1Store({
    id: 'openenvx-agent-memory',
    binding: db,
  });
  await storage.init();

  return new Memory({
    storage,
    options: {
      lastMessages: 40,
      // Working-memory tools use AJV JSON Schema compilation (`new Function`),
      // which Cloudflare Workers blocks.
      workingMemory: { enabled: false },
    },
  });
}
