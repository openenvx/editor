import type { UIMessage } from 'ai';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';

import {
  type AgentThread,
  createThread,
  deleteThread,
  fetchThreadMessages,
  listThreads,
  readActiveThreadId,
  renameThread,
  writeActiveThreadId,
} from '../client/agent-service-client';

function sortThreadsByUpdatedAt(threads: AgentThread[]): AgentThread[] {
  return [...threads].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export interface UseAgentThreadsOptions {
  agentServiceUrl: string | null;
  sceneId: string;
  statusRef: MutableRefObject<string>;
  stopRef: MutableRefObject<() => void>;
  threadIdRef: MutableRefObject<string | null>;
  setMessages: (messages: UIMessage[]) => void;
  onResetEphemeral: () => void;
}

export function useAgentThreads({
  agentServiceUrl,
  sceneId,
  statusRef,
  stopRef,
  threadIdRef,
  setMessages,
  onResetEphemeral,
}: UseAgentThreadsOptions) {
  const [threads, setThreads] = useState<AgentThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [historyReady, setHistoryReady] = useState(false);
  const [historyBusy, setHistoryBusy] = useState(false);
  const hydrateMessagesRef = useRef<UIMessage[] | null>(null);
  const setMessagesRef = useRef(setMessages);
  setMessagesRef.current = setMessages;

  useEffect(() => {
    threadIdRef.current = activeThreadId;
  }, [activeThreadId, threadIdRef]);

  const activateThread = useCallback(
    async (
      threadId: string,
      options?: { messages?: UIMessage[]; skipFetch?: boolean }
    ) => {
      if (!agentServiceUrl) {
        return;
      }

      const currentStatus = statusRef.current;
      if (currentStatus === 'streaming' || currentStatus === 'submitted') {
        stopRef.current();
      }
      onResetEphemeral();

      const nextMessages =
        options?.messages ??
        (options?.skipFetch
          ? []
          : await fetchThreadMessages(agentServiceUrl, threadId, sceneId));

      hydrateMessagesRef.current = nextMessages;
      setActiveThreadId(threadId);
      writeActiveThreadId(sceneId, threadId);
      threadIdRef.current = threadId;
    },
    [agentServiceUrl, onResetEphemeral, sceneId, statusRef, stopRef]
  );

  const activateThreadRef = useRef(activateThread);
  activateThreadRef.current = activateThread;

  useEffect(() => {
    if (!agentServiceUrl) {
      setHistoryReady(true);
      return;
    }

    let cancelled = false;

    void (async () => {
      setHistoryBusy(true);
      try {
        const listed = await listThreads(agentServiceUrl, sceneId);
        if (cancelled) {
          return;
        }

        const savedId = readActiveThreadId(sceneId);
        const saved = savedId
          ? listed.find((thread) => thread.id === savedId)
          : undefined;

        if (saved) {
          setThreads(sortThreadsByUpdatedAt(listed));
          await activateThreadRef.current(saved.id);
          return;
        }

        if (listed[0]) {
          setThreads(sortThreadsByUpdatedAt(listed));
          await activateThreadRef.current(listed[0].id);
          return;
        }

        const created = await createThread(agentServiceUrl, sceneId);
        if (cancelled) {
          return;
        }
        if (created) {
          setThreads([created]);
          await activateThreadRef.current(created.id, { messages: [] });
        } else {
          setThreads([]);
          setActiveThreadId(null);
          writeActiveThreadId(sceneId, null);
          setMessagesRef.current([]);
        }
      } catch {
        if (!cancelled) {
          setThreads([]);
        }
      } finally {
        if (!cancelled) {
          setHistoryBusy(false);
          setHistoryReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [agentServiceUrl, sceneId]);

  const ensureActiveThread = useCallback(async (): Promise<string | null> => {
    if (!agentServiceUrl) {
      return null;
    }
    if (threadIdRef.current) {
      return threadIdRef.current;
    }
    const created = await createThread(agentServiceUrl, sceneId);
    if (!created) {
      return null;
    }
    setThreads((prev) => sortThreadsByUpdatedAt([created, ...prev]));
    setActiveThreadId(created.id);
    writeActiveThreadId(sceneId, created.id);
    threadIdRef.current = created.id;
    return created.id;
  }, [agentServiceUrl, sceneId]);

  const handleNewChat = useCallback(async () => {
    if (!agentServiceUrl || historyBusy) {
      return;
    }
    setHistoryBusy(true);
    try {
      const created = await createThread(agentServiceUrl, sceneId);
      if (!created) {
        onResetEphemeral();
        setActiveThreadId(null);
        writeActiveThreadId(sceneId, null);
        hydrateMessagesRef.current = [];
        setMessages([]);
        return;
      }
      setThreads((prev) => sortThreadsByUpdatedAt([created, ...prev]));
      await activateThread(created.id, { messages: [] });
    } finally {
      setHistoryBusy(false);
    }
  }, [
    activateThread,
    agentServiceUrl,
    historyBusy,
    onResetEphemeral,
    sceneId,
    setMessages,
  ]);

  const handleSelectThread = useCallback(
    async (threadId: string) => {
      if (threadId === activeThreadId || historyBusy) {
        return;
      }
      setHistoryBusy(true);
      try {
        await activateThread(threadId);
      } finally {
        setHistoryBusy(false);
      }
    },
    [activateThread, activeThreadId, historyBusy]
  );

  const handleDeleteThread = useCallback(
    async (threadId: string) => {
      if (!agentServiceUrl || historyBusy) {
        return;
      }
      setHistoryBusy(true);
      try {
        const deleted = await deleteThread(
          agentServiceUrl,
          threadId,
          sceneId
        );
        if (!deleted) {
          return;
        }
        const remaining = threads.filter((thread) => thread.id !== threadId);
        setThreads(remaining);

        if (threadId !== activeThreadId) {
          return;
        }

        if (remaining[0]) {
          await activateThread(remaining[0].id);
          return;
        }

        const created = await createThread(agentServiceUrl, sceneId);
        if (created) {
          setThreads([created]);
          await activateThread(created.id, { messages: [] });
        } else {
          onResetEphemeral();
          setActiveThreadId(null);
          writeActiveThreadId(sceneId, null);
          hydrateMessagesRef.current = [];
          setMessages([]);
        }
      } finally {
        setHistoryBusy(false);
      }
    },
    [
      activateThread,
      activeThreadId,
      agentServiceUrl,
      historyBusy,
      onResetEphemeral,
      sceneId,
      setMessages,
      threads,
    ]
  );

  const touchThreadUpdatedAt = useCallback((threadId: string) => {
    setThreads((prev) =>
      sortThreadsByUpdatedAt(
        prev.map((thread) =>
          thread.id === threadId
            ? { ...thread, updatedAt: new Date().toISOString() }
            : thread
        )
      )
    );
  }, []);

  const applyThreadTitle = useCallback(
    async (threadId: string, title: string) => {
      if (!agentServiceUrl) {
        return;
      }
      const updated = await renameThread(
        agentServiceUrl,
        threadId,
        sceneId,
        title
      );
      if (!updated) {
        return;
      }
      setThreads((prev) =>
        sortThreadsByUpdatedAt(
          prev.map((item) =>
            item.id === updated.id
              ? {
                  ...item,
                  title: updated.title,
                  updatedAt: updated.updatedAt,
                }
              : item
          )
        )
      );
    },
    [agentServiceUrl, sceneId]
  );

  return {
    threads,
    activeThreadId,
    historyReady,
    historyBusy,
    hydrateMessagesRef,
    ensureActiveThread,
    handleNewChat,
    handleSelectThread,
    handleDeleteThread,
    touchThreadUpdatedAt,
    applyThreadTitle,
  };
}
