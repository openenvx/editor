import { useChat } from '@ai-sdk/react';
import {
  useWorkbenchContext,
  useWorkbenchContextSelector,
} from '@openenvx/core/react';
import type { UIMessage } from 'ai';
import { DefaultChatTransport } from 'ai';
import { MessageSquare } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  buildSceneContext,
  DEFAULT_THREAD_TITLE,
  readAgentServiceUrl,
  readSceneId,
  truncateThreadTitle,
} from '../client/agent-service-client';
import { applyProposedChanges } from '../proposal/apply-proposal';
import type {
  AgentTaskEvent,
  ProposedChangesPayload,
} from '../schemas/proposed-changes';
import {
  agentTaskEventSchema,
  proposedChangesPayloadSchema,
} from '../schemas/proposed-changes';
import { AgentTaskBoard } from './agent-task-board';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from './ai-elements/conversation';
import { Message, MessageContent } from './ai-elements/message';
import { MessageLoading, MessageParts } from './ai-elements/message-parts';
import {
  PromptInput,
  PromptInputError,
  PromptInputSubmit,
  PromptInputTextarea,
} from './ai-elements/prompt-input';
import { ChatHistoryList } from './chat-history-list';
import { ProposalCard } from './proposal-card';
import { useAgentThreads } from './use-agent-threads';

import styles from './chat-panel.module.css';

const AUTO_APPLY_STORAGE_KEY = 'openenvx.agent.autoApply';

function readAutoApplyPreference(): boolean {
  if (typeof localStorage === 'undefined') {
    return false;
  }
  return localStorage.getItem(AUTO_APPLY_STORAGE_KEY) === 'true';
}

function writeAutoApplyPreference(enabled: boolean): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(AUTO_APPLY_STORAGE_KEY, enabled ? 'true' : 'false');
}

function getMessageText(parts: { type: string; text?: string }[]): string {
  return parts
    .filter((part) => part.type === 'text' && part.text)
    .map((part) => part.text!)
    .join('');
}

function upsertTask(
  tasks: AgentTaskEvent[],
  next: AgentTaskEvent
): AgentTaskEvent[] {
  const index = tasks.findIndex((task) => task.taskId === next.taskId);
  if (index === -1) {
    return [...tasks, next];
  }
  const copy = [...tasks];
  copy[index] = next;
  return copy;
}

export const ChatPanel = memo(() => {
  const { api } = useWorkbenchContext();
  const editorUri =
    useWorkbenchContextSelector((state) => state.editor?.uri) ??
    'untitled://scene';
  const agentServiceUrl = readAgentServiceUrl();
  const sceneId = useMemo(() => readSceneId(editorUri), [editorUri]);
  const [pendingProposal, setPendingProposal] =
    useState<ProposedChangesPayload | null>(null);
  const [autoApply, setAutoApply] = useState(readAutoApplyPreference);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [hasInput, setHasInput] = useState(false);
  const [activeTasks, setActiveTasks] = useState<AgentTaskEvent[]>([]);
  const autoAppliedRef = useRef<string | null>(null);
  const titledThreadIdsRef = useRef<Set<string>>(new Set());
  const stopRef = useRef<() => void>(() => {});
  const statusRef = useRef<string>('ready');
  const threadIdRef = useRef<string | null>(null);
  const setMessagesRef = useRef<(messages: UIMessage[]) => void>(() => {});

  const resetEphemeralState = useCallback(() => {
    setPendingProposal(null);
    setActiveTasks([]);
    setApplyError(null);
    autoAppliedRef.current = null;
  }, []);

  const transport = useMemo(() => {
    if (!agentServiceUrl) {
      return;
    }
    return new DefaultChatTransport({
      api: `${agentServiceUrl}/api/agent/chat`,
      prepareSendMessagesRequest: ({ messages, body }) => {
        const sceneContext = buildSceneContext(api);
        return {
          body: {
            ...body,
            messages: messages.map((message) => ({
              role: message.role,
              content: getMessageText(
                message.parts as { type: string; text?: string }[]
              ),
            })),
            sceneContext,
            sceneId: sceneContext.sceneId,
            threadId: threadIdRef.current ?? undefined,
          },
        };
      },
    });
  }, [agentServiceUrl, api]);

  const {
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
  } = useAgentThreads({
    agentServiceUrl,
    sceneId,
    statusRef,
    stopRef,
    threadIdRef,
    setMessages: (messages) => setMessagesRef.current(messages),
    onResetEphemeral: resetEphemeralState,
  });

  const {
    messages,
    sendMessage,
    setMessages,
    status,
    error: chatError,
    stop,
  } = useChat({
    id: activeThreadId ?? 'pending-thread',
    transport,
  });

  setMessagesRef.current = setMessages;
  stopRef.current = stop;
  statusRef.current = status;

  // Apply hydrated history after useChat remounts for the new thread id.
  useEffect(() => {
    if (hydrateMessagesRef.current === null) {
      return;
    }
    const next = hydrateMessagesRef.current;
    hydrateMessagesRef.current = null;
    setMessages(next);
  }, [activeThreadId, hydrateMessagesRef, setMessages]);

  const handleApplyProposal = useCallback(
    async (proposal: ProposedChangesPayload): Promise<boolean> => {
      setApplying(true);
      try {
        await applyProposedChanges(api, proposal.changes, proposal.summary);
        setPendingProposal(null);
        setApplyError(null);
        return true;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to apply changes';
        setApplyError(message);
        return false;
      } finally {
        setApplying(false);
      }
    },
    [api]
  );

  useEffect(() => {
    for (const message of messages) {
      for (const part of message.parts) {
        if (part.type === 'data-agent-task') {
          const parsed = agentTaskEventSchema.safeParse(part.data);
          if (parsed.success) {
            setActiveTasks((prev) => upsertTask(prev, parsed.data));
          }
          continue;
        }
        if (part.type !== 'data-proposed-changes') {
          continue;
        }
        const parsed = proposedChangesPayloadSchema.safeParse(part.data);
        if (!parsed.success) {
          continue;
        }
        const proposal = parsed.data;
        const proposalKey = JSON.stringify(proposal);
        if (autoAppliedRef.current === proposalKey) {
          continue;
        }
        // Mark in-flight so streaming updates don't double-apply; clear on
        // auto-apply failure so the user can retry via the proposal card.
        autoAppliedRef.current = proposalKey;
        if (autoApply) {
          void handleApplyProposal(proposal).then((ok) => {
            if (!ok) {
              autoAppliedRef.current = null;
              setPendingProposal(proposal);
            }
          });
        } else {
          setPendingProposal(proposal);
        }
      }
    }
  }, [autoApply, handleApplyProposal, messages]);

  useEffect(() => {
    if (status === 'ready' || status === 'error') {
      const hasIncomplete = activeTasks.some(
        (task) => task.status === 'pending' || task.status === 'running'
      );
      if (!hasIncomplete && activeTasks.length > 0) {
        const timer = setTimeout(() => setActiveTasks([]), 2500);
        return () => clearTimeout(timer);
      }
    }
  }, [activeTasks, status]);

  // Auto-title "New chat" threads from the first user message.
  useEffect(() => {
    if (!agentServiceUrl || !activeThreadId) {
      return;
    }
    const thread = threads.find((item) => item.id === activeThreadId);
    if (!thread || thread.title !== DEFAULT_THREAD_TITLE) {
      return;
    }
    if (titledThreadIdsRef.current.has(activeThreadId)) {
      return;
    }
    const firstUser = messages.find((message) => message.role === 'user');
    if (!firstUser) {
      return;
    }
    const text = getMessageText(
      firstUser.parts as { type: string; text?: string }[]
    );
    if (!text.trim()) {
      return;
    }

    titledThreadIdsRef.current.add(activeThreadId);
    void applyThreadTitle(activeThreadId, truncateThreadTitle(text));
  }, [activeThreadId, agentServiceUrl, applyThreadTitle, messages, threads]);

  const handleSubmit = useCallback(
    async ({ text }: { text: string }) => {
      const trimmed = text.trim();
      if (!trimmed || status === 'streaming' || status === 'submitted') {
        return;
      }
      setHasInput(false);
      setActiveTasks([]);

      const threadId = await ensureActiveThread();
      await sendMessage({ text: trimmed });

      if (threadId) {
        touchThreadUpdatedAt(threadId);
      }
    },
    [ensureActiveThread, sendMessage, status, touchThreadUpdatedAt]
  );

  if (!agentServiceUrl) {
    return (
      <div className={styles.root}>
        <ConversationEmptyState
          description="Set VITE_AGENT_SERVICE_URL to enable the agent sidebar."
          title="Agent service is disabled"
        />
      </div>
    );
  }

  const isBusy = status === 'streaming' || status === 'submitted';
  const isStreaming = status === 'streaming';
  const showLoading =
    status === 'submitted' ||
    (isStreaming && messages.length > 0 && messages.at(-1)?.role === 'user');

  return (
    <div className={styles.root}>
      {historyReady ? (
        <ChatHistoryList
          activeThreadId={activeThreadId}
          disabled={historyBusy || isBusy}
          onDelete={(threadId) => void handleDeleteThread(threadId)}
          onNewChat={() => void handleNewChat()}
          onSelect={(threadId) => void handleSelectThread(threadId)}
          threads={threads}
        />
      ) : null}
      <AgentTaskBoard tasks={activeTasks} />
      <Conversation>
        <ConversationContent scrollAnchor={`${messages.length}-${status}`}>
          {messages.length === 0 && !showLoading ? (
            <ConversationEmptyState
              description="Ask about your design or request layout and styling changes."
              icon={<MessageSquare size={48} strokeWidth={1.25} />}
              title="No messages yet"
            />
          ) : (
            <>
              {messages.map((message, index) => (
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    <MessageParts
                      isLastMessage={index === messages.length - 1}
                      isStreaming={isStreaming}
                      message={message}
                    />
                  </MessageContent>
                </Message>
              ))}
              {showLoading ? <MessageLoading /> : null}
            </>
          )}
          {pendingProposal ? (
            <ProposalCard
              applying={applying}
              autoApplyEnabled={autoApply}
              onApply={() => void handleApplyProposal(pendingProposal)}
              onAutoApplyChange={(enabled) => {
                setAutoApply(enabled);
                writeAutoApplyPreference(enabled);
              }}
              onReject={() => {
                setPendingProposal(null);
                setApplyError(null);
              }}
              proposal={pendingProposal}
            />
          ) : null}
        </ConversationContent>
      </Conversation>
      <PromptInputError>{applyError ?? chatError?.message}</PromptInputError>
      <PromptInput onSubmit={handleSubmit}>
        <PromptInputTextarea
          disabled={isBusy || historyBusy}
          onChange={(event) =>
            setHasInput(event.target.value.trim().length > 0)
          }
        />
        <PromptInputSubmit
          disabled={(!hasInput && !isBusy) || historyBusy}
          onStop={stop}
          status={status}
        />
      </PromptInput>
    </div>
  );
});
