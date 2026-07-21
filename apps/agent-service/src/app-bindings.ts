import type { AssetBucket } from './assets/ingest-asset';

export interface AgentServiceBindings {
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
  /** Cheap text model for Media specialist. */
  OPENROUTER_MEDIA_MODEL?: string;
  /** OpenRouter image model id (Images API). Default openai/gpt-image-2. */
  OPENROUTER_IMAGE_MODEL?: string;
  /** OpenRouter reasoning effort: none | minimal | low | medium | high | xhigh | max */
  OPENROUTER_REASONING_EFFORT?: string;
  /** Optional hard cap on reasoning tokens (takes precedence over effort). */
  OPENROUTER_REASONING_MAX_TOKENS?: string;
  /** Unsplash Access Key for stock photo search. */
  UNSPLASH_ACCESS_KEY?: string;
  /**
   * Public origin for /assets/:key URLs (e.g. http://localhost:8789).
   * Falls back to the chat request origin when unset.
   */
  ASSET_PUBLIC_BASE_URL?: string;
  DB?: D1Database;
  ASSETS?: AssetBucket;
}
