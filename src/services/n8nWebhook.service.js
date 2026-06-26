import env from '../config/env.js';

const buildHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };

  if (env.n8n.webhookSecret) {
    headers['X-Webhook-Secret'] = env.n8n.webhookSecret;
  }

  return headers;
};

export const n8nWebhookService = {
  dispatch: async (eventType, payload) => {
    if (!env.n8n.webhookUrl) {
      return { dispatched: false, reason: 'N8N_WEBHOOK_URL no configurada' };
    }

    const response = await fetch(env.n8n.webhookUrl, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({
        eventType,
        emittedAt: new Date().toISOString(),
        payload,
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook n8n respondió ${response.status}`);
    }

    return { dispatched: true };
  },
};
