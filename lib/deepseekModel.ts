// Which model to call and how. DeepSeek's API IDs are `deepseek-flash` and `deepseek-v4-pro`
// (marketing names like "deepseek-v4.1-flash" are rejected with HTTP 400, and the old
// `deepseek-chat` is only an alias that may be retired).
//
// The current models default to THINKING ON, which spends hundreds of hidden reasoning tokens per
// call and was measured ~3.5x slower for the same JSON report. The audit prompt is already
// evidence-constrained, so thinking is turned off unless DEEPSEEK_THINKING=enabled.
const THINKING_MODELS = new Set(['deepseek-flash', 'deepseek-v4-pro']);

export function deepseekModelConfig(env: Record<string, string | undefined> = process.env) {
  const baseUrl = env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  const model = env.DEEPSEEK_MODEL || 'deepseek-flash';
  // Only the official API understands `thinking`; other OpenAI-compatible hosts may reject it.
  const official = /^https?:\/\/api\.deepseek\.com/i.test(baseUrl);
  const extra = official && THINKING_MODELS.has(model)
    ? { thinking: { type: env.DEEPSEEK_THINKING === 'enabled' ? 'enabled' : 'disabled' } }
    : {};
  return { baseUrl, model, extra };
}
