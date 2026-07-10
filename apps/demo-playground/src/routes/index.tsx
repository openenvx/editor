import { createFileRoute } from '@tanstack/react-router';

import { PlaygroundShell } from '#/components/playground-shell';

export const Route = createFileRoute('/')({
  ssr: false,
  component: PlaygroundPage,
});

function PlaygroundPage() {
  return <PlaygroundShell />;
}
