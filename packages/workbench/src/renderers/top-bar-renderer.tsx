import type { TopBarRegistration } from '@openenvx/core';
import type { ComponentType } from 'react';
import { memo } from 'react';

interface Props {
  topBars: TopBarRegistration[];
}

export const TopBarRenderer = memo(({ topBars }: Props) => {
  const registration = topBars[0];
  if (!registration) {
    return null;
  }

  const Component = registration.Component as ComponentType;
  return <Component />;
});
