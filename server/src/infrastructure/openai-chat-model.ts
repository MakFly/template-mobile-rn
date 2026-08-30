import { createOpenAI } from '@ai-sdk/openai';
import { convertToModelMessages, generateText, streamText, type UIMessage } from 'ai';

import type { ChatModel } from '../application/ports';

export interface OpenAIChatModelConfig {
  apiKey?: string;
  model?: string;
  titleModel?: string;
}

export class OpenAIChatModel implements ChatModel {
  readonly configured: boolean;

  constructor(private readonly config: OpenAIChatModelConfig) {
    this.configured = Boolean(config.apiKey && config.model);
  }

  async stream(messages: unknown[], signal?: AbortSignal) {
    if (!this.config.apiKey || !this.config.model) throw new Error('OpenAI is not configured');
    const openai = createOpenAI({ apiKey: this.config.apiKey });
    const uiMessages = messages as UIMessage[];
    const result = streamText({
      model: openai(this.config.model),
      messages: await convertToModelMessages(uiMessages),
      abortSignal: signal,
    });
    return result.toUIMessageStreamResponse({
      originalMessages: uiMessages,
      onError: () => 'La réponse du modèle a échoué. Réessayez.',
    });
  }

  async generateTitle(messages: unknown[]) {
    if (!this.config.apiKey || !this.config.model) throw new Error('OpenAI is not configured');
    const openai = createOpenAI({ apiKey: this.config.apiKey });
    const result = await generateText({
      model: openai(this.config.titleModel || this.config.model),
      system: 'Return only a concise French conversation title, maximum six words, no quotes.',
      prompt: JSON.stringify(messages).slice(0, 8_000),
      maxOutputTokens: 32,
    });
    return (
      result.text
        .trim()
        .replace(/^['"]|['"]$/g, '')
        .slice(0, 80) || 'Nouvelle discussion'
    );
  }
}
