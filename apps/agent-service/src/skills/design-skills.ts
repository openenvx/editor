import { createSkill } from '@mastra/core/skills';

export const weddingVenueInvitationSkill = createSkill({
  name: 'wedding-venue-invitation',
  description:
    'Use when designing or improving wedding venue invitations, save-the-dates, or RSVP cards.',
  instructions: `
## Wedding venue invitation design

Structure the invitation with clear hierarchy:
1. Couple names (hero)
2. Occasion line ("together with their families invite you…")
3. Date and time
4. Venue name and location
5. RSVP / details / dress code (secondary)

### Layout principles
- Generous margins; center or elegant asymmetric column.
- Vertical rhythm: largest gap between hero and body, tighter within body.
- Keep decorative flourishes secondary to readable type.
- When creating layers, use OpenEnvx types \`canvas.text\` and \`canvas.rect\` (never bare "text"/"rect").
- Text content goes in data.html as HTML, e.g. \`<p>June 14, 2025</p>\`, with align: "center".

### Content checklist
- Names, date, venue, city, RSVP method/deadline
- Optional: reception, website, gift note

### Tone
Elegant, warm, concise. Prefer timeless over trendy slang.
`,
});

export const typographySkill = createSkill({
  name: 'typography',
  description:
    'Use when choosing fonts, type scale, hierarchy, letter-spacing, or text styling.',
  instructions: `
## Typography craft

- Establish a clear scale: display / title / body / caption (roughly 2.5–3× between display and body).
- Pair at most two families (e.g. serif display + sans body) or one family with weight contrast.
- Line length ~45–75 characters for body; avoid ultra-wide text blocks.
- Letter-spacing: slightly open for uppercase small labels; normal for body.
- Ensure contrast against background; dark text on light or vice versa with WCAG-minded contrast.
`,
});

export const colorHarmonySkill = createSkill({
  name: 'color-harmony',
  description:
    'Use when choosing palettes, fills, accents, or improving color contrast and cohesion.',
  instructions: `
## Color harmony

- Pick one dominant, one supporting, one accent; keep neutrals for text/backgrounds.
- For invitations: soft neutrals (ivory, champagne, sage, slate) with one accent (blush, gold, navy).
- Maintain text contrast; never put low-contrast gray on pastel without checking readability.
- Apply fills/borders consistently; limit accent color to CTAs and key ornaments.
`,
});

export const designSkills = [
  weddingVenueInvitationSkill,
  typographySkill,
  colorHarmonySkill,
];
