import type { Scene } from '@xmazu/openenvxee-schema';

import {
  Button,
  Email,
  Heading,
  Section,
  Text,
  sceneFromEmailJsx,
} from './templates/jsx';

export function createEmailDemoScene(): Scene {
  return sceneFromEmailJsx(
    <Email
      id="email-root"
      preheader="Thanks for signing up"
      style={{
        backgroundColor: '#f6f9fc',
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 32,
        paddingBottom: 32,
      }}
    >
      <Section
        id="section-1"
        style={{
          backgroundColor: '#ffffff',
          padding: 32,
        }}
      >
        <Heading
          id="heading-1"
          as="h1"
          style={{ color: '#111827', textAlign: 'left' }}
        >
          Welcome
        </Heading>
        <Text id="text-1" style={{ color: '#374151', textAlign: 'left' }}>
          Thanks for joining. Drag blocks from the sidebar to build your email.
        </Text>
        <Button
          id="button-1"
          href="https://example.com"
          style={{
            backgroundColor: '#111827',
            color: '#ffffff',
            textAlign: 'left',
          }}
        >
          Get started
        </Button>
      </Section>
    </Email>,
    { pageName: 'Welcome email' }
  );
}
