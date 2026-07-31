import type { WorkbenchApi } from '@openenvx/headless';
import type { UIMessage } from 'ai';

import {
  DEFAULT_THREAD_TITLE,
  truncateThreadTitle,
} from '../schemas/thread-title';

const SCENE_ID_STORAGE_PREFIX = 'openenvx.agent.sceneId.';
const THREAD_ID_STORAGE_PREFIX = 'openenvx.agent.threadId.';

export { DEFAULT_THREAD_TITLE, truncateThreadTitle };

export interface SceneContextPayload {
  scene: ReturnType<WorkbenchApi['serializeScene']>;
  selection: {
    activePageId: string;
    selectedLayerIds: string[];
    primaryLayerId: string | null;
  };
  activePageId: string | null;
  sceneId: string;
}

export interface AgentThread {
  id: string;
  title: string;
  resourceId: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

function sceneIdStorageKey(editorUri: string): string {
  const scope = editorUri.replaceAll(/[^a-zA-Z0-9_-]+/g, '-') || 'default';
  return `${SCENE_ID_STORAGE_PREFIX}${scope}`;
}

function readOrCreateSceneId(editorUri: string): string {
  if (typeof localStorage === 'undefined') {
    return (
      editorUri.replaceAll(/[^a-zA-Z0-9_-]+/g, '-') || `scene-${Date.now()}`
    );
  }
  const key = sceneIdStorageKey(editorUri);
  const existing = localStorage.getItem(key);
  if (existing) {
    return existing;
  }
  const created =
    editorUri.replaceAll(/[^a-zA-Z0-9_-]+/g, '-') ||
    `scene-${crypto.randomUUID()}`;
  localStorage.setItem(key, created);
  return created;
}

export function buildSceneContext(api: WorkbenchApi): SceneContextPayload {
  const scene = api.serializeScene();
  const selection = api.scene.getSelection();
  const editorUri = api.getSnapshot().editor?.uri ?? 'untitled://scene';
  return {
    activePageId: selection.activePageId ?? null,
    scene,
    selection,
    sceneId: readOrCreateSceneId(editorUri),
  };
}

export function readSceneId(editorUri?: string): string {
  return readOrCreateSceneId(editorUri ?? 'untitled://scene');
}

type ViteImportMeta = ImportMeta & {
  env?: {
    VITE_AGENT_SERVICE?: string;
    VITE_AGENT_SERVICE_URL?: string;
  };
};

export function readAgentServiceUrl(): string | null {
  const env = (import.meta as ViteImportMeta).env;
  if (env?.VITE_AGENT_SERVICE === 'false') {
    return null;
  }
  return env?.VITE_AGENT_SERVICE_URL ?? 'http://localhost:8789';
}

export function readActiveThreadId(sceneId: string): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  return localStorage.getItem(`${THREAD_ID_STORAGE_PREFIX}${sceneId}`);
}

export function writeActiveThreadId(
  sceneId: string,
  threadId: string | null
): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  const key = `${THREAD_ID_STORAGE_PREFIX}${sceneId}`;
  if (threadId) {
    localStorage.setItem(key, threadId);
  } else {
    localStorage.removeItem(key);
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export async function listThreads(
  baseUrl: string,
  sceneId: string
): Promise<AgentThread[]> {
  const response = await fetch(
    `${baseUrl}/api/agent/threads?sceneId=${encodeURIComponent(sceneId)}`
  );
  if (response.status === 503) {
    return [];
  }
  if (!response.ok) {
    throw new Error(`Failed to list threads (${response.status})`);
  }
  const data = await parseJson<{ threads: AgentThread[] }>(response);
  return data.threads ?? [];
}

export async function createThread(
  baseUrl: string,
  sceneId: string,
  title = DEFAULT_THREAD_TITLE
): Promise<AgentThread | null> {
  const response = await fetch(`${baseUrl}/api/agent/threads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sceneId, title }),
  });
  if (response.status === 503) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to create thread (${response.status})`);
  }
  const data = await parseJson<{ thread: AgentThread }>(response);
  return data.thread;
}

export async function fetchThreadMessages(
  baseUrl: string,
  threadId: string,
  sceneId: string
): Promise<UIMessage[]> {
  const response = await fetch(
    `${baseUrl}/api/agent/threads/${encodeURIComponent(threadId)}/messages?sceneId=${encodeURIComponent(sceneId)}`
  );
  if (response.status === 503) {
    return [];
  }
  if (response.status === 404) {
    return [];
  }
  if (!response.ok) {
    throw new Error(`Failed to load thread messages (${response.status})`);
  }
  const data = await parseJson<{ messages: UIMessage[] }>(response);
  return data.messages ?? [];
}

export async function deleteThread(
  baseUrl: string,
  threadId: string,
  sceneId: string
): Promise<boolean> {
  const response = await fetch(
    `${baseUrl}/api/agent/threads/${encodeURIComponent(threadId)}?sceneId=${encodeURIComponent(sceneId)}`,
    { method: 'DELETE' }
  );
  if (response.status === 503 || response.status === 404) {
    return false;
  }
  if (!response.ok) {
    throw new Error(`Failed to delete thread (${response.status})`);
  }
  return true;
}

export async function renameThread(
  baseUrl: string,
  threadId: string,
  sceneId: string,
  title: string
): Promise<AgentThread | null> {
  const response = await fetch(
    `${baseUrl}/api/agent/threads/${encodeURIComponent(threadId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sceneId, title }),
    }
  );
  if (response.status === 503 || response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to rename thread (${response.status})`);
  }
  const data = await parseJson<{ thread: AgentThread }>(response);
  return data.thread;
}
