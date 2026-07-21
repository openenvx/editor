import { describe, expect, it } from 'vitest';

import {
  agentTaskEventSchema,
  proposedChangesPayloadSchema,
} from '../schemas/proposed-changes';

/** Mirrors chat-panel upsertTask for media/imageGen task board events. */
function upsertTask<T extends { taskId: string }>(tasks: T[], next: T): T[] {
  const index = tasks.findIndex((task) => task.taskId === next.taskId);
  if (index === -1) {
    return [...tasks, next];
  }
  const copy = [...tasks];
  copy[index] = next;
  return copy;
}

describe('agent chat stream data parts (media path)', () => {
  it('accepts data-proposed-changes with canvas.svg and canvas.image creates', () => {
    const payload = proposedChangesPayloadSchema.parse({
      summary: 'Add icon and photo',
      changes: [
        {
          kind: 'createLayer',
          type: 'canvas.svg',
          id: 'icon-1',
          data: {
            svg: '<svg viewBox="0 0 24 24"><path d="M0 0h24v24"/></svg>',
          },
        },
        {
          kind: 'createLayer',
          type: 'canvas.image',
          id: 'photo-1',
          data: {
            assetRef: 'http://localhost:8789/assets/unsplash/x.png',
          },
        },
      ],
    });
    expect(payload.changes).toHaveLength(2);
    expect(payload.changes[0]?.type).toBe('canvas.svg');
    expect(payload.changes[1]?.type).toBe('canvas.image');
  });

  it('accepts data-agent-task events for media and imageGen specialists', () => {
    const media = agentTaskEventSchema.parse({
      taskId: 'media-1',
      agentId: 'media',
      label: 'Media',
      status: 'running',
    });
    const imageGen = agentTaskEventSchema.parse({
      taskId: 'imageGen-1',
      agentId: 'imageGen',
      label: 'ImageGen',
      status: 'complete',
      summary: 'Generated logo',
    });

    let tasks = upsertTask([], media);
    tasks = upsertTask(tasks, imageGen);
    tasks = upsertTask(tasks, { ...media, status: 'complete' as const });

    expect(tasks).toHaveLength(2);
    expect(tasks.find((task) => task.agentId === 'media')?.status).toBe(
      'complete'
    );
    expect(tasks.find((task) => task.agentId === 'imageGen')?.summary).toBe(
      'Generated logo'
    );
  });
});
