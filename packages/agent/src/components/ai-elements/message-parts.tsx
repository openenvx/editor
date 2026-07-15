import type { UIMessage } from 'ai';
import { getToolName, isReasoningUIPart, isToolUIPart } from 'ai';
import { Bot, BookOpen, LayoutTemplate, Network, Palette, Sparkles, Wrench } from 'lucide-react';
import { memo } from 'react';

import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
  type ChainOfThoughtStepStatus,
} from './chain-of-thought';
import { MessageResponse } from './message';
import { Reasoning, ReasoningContent, ReasoningTrigger } from './reasoning';
import { Shimmer } from './shimmer';
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from './tool';

import styles from './message-parts.module.css';

function toolStateToStepStatus(state: string): ChainOfThoughtStepStatus {
  if (state === 'output-available') {
    return 'complete';
  }
  if (
    state === 'input-available' ||
    state === 'input-streaming' ||
    state === 'approval-requested'
  ) {
    return 'active';
  }
  if (state === 'output-error' || state === 'output-denied') {
    return 'complete';
  }
  return 'pending';
}

function toolIconForName(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('layout')) {
    return LayoutTemplate;
  }
  if (lower.includes('style')) {
    return Palette;
  }
  if (lower.includes('design')) {
    return Sparkles;
  }
  if (lower.includes('skill')) {
    return BookOpen;
  }
  if (lower.includes('workflow') || lower.includes('parallel')) {
    return Network;
  }
  if (lower.includes('agent') || lower.includes('supervisor')) {
    return Bot;
  }
  if (lower.includes('propose') || lower.includes('change')) {
    return Sparkles;
  }
  return Wrench;
}

function humanizeToolName(name: string): string {
  return name
    .replace(/^tool-/, '')
    .replaceAll(/([a-z])([A-Z])/g, '$1 $2')
    .replaceAll(/[-_]/g, ' ')
    .replaceAll(/\b\w/g, (char) => char.toUpperCase());
}

function summarizeToolInput(input: unknown): string | undefined {
  if (input === undefined || input === null) {
    return undefined;
  }
  if (typeof input === 'string') {
    return input.length > 80 ? `${input.slice(0, 77)}…` : input;
  }
  if (typeof input === 'object') {
    const record = input as Record<string, unknown>;
    if (typeof record.summary === 'string') {
      return record.summary;
    }
    if (typeof record.label === 'string') {
      return record.label;
    }
    if (typeof record.prompt === 'string') {
      return record.prompt.length > 80
        ? `${record.prompt.slice(0, 77)}…`
        : record.prompt;
    }
    if (Array.isArray(record.changes)) {
      return `${record.changes.length} change(s)`;
    }
  }
  return undefined;
}

export interface MessagePartsProps {
  message: UIMessage;
  isLastMessage: boolean;
  isStreaming: boolean;
}

export const MessageParts = memo(
  ({ message, isLastMessage, isStreaming }: MessagePartsProps) => {
    const reasoningParts = message.parts.filter(isReasoningUIPart);
    const reasoningText = reasoningParts.map((part) => part.text).join('\n\n');
    const hasReasoning = reasoningParts.length > 0;
    const lastPart = message.parts.at(-1);
    const isReasoningStreaming =
      isLastMessage && isStreaming && lastPart?.type === 'reasoning';

    const toolParts = message.parts.filter(isToolUIPart);
    const textParts = message.parts.filter((part) => part.type === 'text');
    const hasSteps = toolParts.length > 0;
    const anyToolActive = toolParts.some(
      (part) =>
        part.state === 'input-available' ||
        part.state === 'input-streaming' ||
        part.state === 'approval-requested'
    );

    return (
      <div className={styles.root}>
        {hasReasoning ? (
          <Reasoning isStreaming={isReasoningStreaming}>
            <ReasoningTrigger />
            <ReasoningContent>{reasoningText}</ReasoningContent>
          </Reasoning>
        ) : null}

        {hasSteps ? (
          <ChainOfThought
            defaultOpen={isLastMessage && (isStreaming || anyToolActive)}
          >
            <ChainOfThoughtHeader>
              {toolParts.length === 1 ? '1 step' : `${toolParts.length} steps`}
            </ChainOfThoughtHeader>
            <ChainOfThoughtContent>
              {toolParts.map((part) => {
                const name = getToolName(part);
                const Icon = toolIconForName(name);
                const status = toolStateToStepStatus(part.state);
                const description = summarizeToolInput(part.input);

                return (
                  <ChainOfThoughtStep
                    description={description}
                    icon={Icon}
                    key={part.toolCallId}
                    label={humanizeToolName(name)}
                    status={status}
                  >
                    <Tool
                      defaultOpen={
                        part.state === 'output-error' ||
                        part.state === 'output-available'
                      }
                    >
                      {part.type === 'dynamic-tool' ? (
                        <ToolHeader
                          state={part.state}
                          title={humanizeToolName(name)}
                          toolName={part.toolName}
                          type="dynamic-tool"
                        />
                      ) : (
                        <ToolHeader
                          state={part.state}
                          title={humanizeToolName(name)}
                          type={part.type}
                        />
                      )}
                      <ToolContent>
                        <ToolInput input={part.input} />
                        <ToolOutput
                          errorText={
                            part.state === 'output-error'
                              ? part.errorText
                              : undefined
                          }
                          output={
                            part.state === 'output-available'
                              ? part.output
                              : undefined
                          }
                        />
                      </ToolContent>
                    </Tool>
                  </ChainOfThoughtStep>
                );
              })}
            </ChainOfThoughtContent>
          </ChainOfThought>
        ) : null}

        {textParts.map((part, index) =>
          part.type === 'text' && part.text ? (
            <MessageResponse key={`${message.id}-text-${index}`}>
              {part.text}
            </MessageResponse>
          ) : null
        )}
      </div>
    );
  }
);

MessageParts.displayName = 'MessageParts';

export function MessageLoading() {
  return (
    <div className={styles.loading}>
      <Shimmer duration={1.4}>Thinking…</Shimmer>
    </div>
  );
}
