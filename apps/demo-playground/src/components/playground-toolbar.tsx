import { useWorkbenchContext } from '@openenvx/headless/react';

const TOOLBAR_ACTIONS = [
  { commandId: 'canvas.insertText', label: 'Add Text' },
  { commandId: 'canvas.insertImage', label: 'Add Image' },
  { commandId: 'canvas.insertRect', label: 'Add Rect' },
  { commandId: 'canvas.insertCircle', label: 'Add Circle' },
] as const;

const EXPORT_ACTIONS = [
  { commandId: 'playground.export.svg', label: 'Export SVG' },
  { commandId: 'playground.export.png', label: 'Export PNG' },
  { commandId: 'playground.export.jpg', label: 'Export JPG' },
] as const;

export function PlaygroundToolbar() {
  const { executeCommand } = useWorkbenchContext();

  return (
    <div className="flex items-center gap-2 border-b border-neutral-200 bg-white px-4 py-3">
      {TOOLBAR_ACTIONS.map((action) => (
        <button
          key={action.commandId}
          className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
          onClick={() => {
            void executeCommand(action.commandId);
          }}
          type="button"
        >
          {action.label}
        </button>
      ))}
      <div className="mx-1 h-6 w-px bg-neutral-200" />
      {EXPORT_ACTIONS.map((action) => (
        <button
          key={action.commandId}
          className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
          onClick={() => {
            void executeCommand(action.commandId);
          }}
          type="button"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
