import OpenAI from 'openai';
import { config } from '../config/env.js';

let client;

function getClient() {
  if (!client) {
    if (!config.openai.apiKey) {
      console.warn('OpenAI API key missing; suggestion endpoints will fail.');
    }
    client = new OpenAI({ apiKey: config.openai.apiKey });
  }
  return client;
}

export async function createSuggestion({ prompt, context = {} }) {
  const openaiClient = getClient();
  if (!config.openai.apiKey) {
    return { message: 'OpenAI API key not configured.' };
  }
  const formattedContext = JSON.stringify(context, null, 2);
  const response = await openaiClient.responses.create({
    model: config.openai.model,
    input: `You are a graph assistant. Given the context below, respond to the prompt.\nContext:\n${formattedContext}\nPrompt: ${prompt}`,
    max_output_tokens: 300
  });
  const message = response.output_text ?? response.choices?.[0]?.message?.content;
  return { message: message?.trim() ?? '' };
}
