export interface AgentServiceBindings {
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
  /** OpenRouter reasoning effort: none | minimal | low | medium | high | xhigh | max */
  OPENROUTER_REASONING_EFFORT?: string;
  /** Optional hard cap on reasoning tokens (takes precedence over effort). */
  OPENROUTER_REASONING_MAX_TOKENS?: string;
  DB?: D1Database;
}
