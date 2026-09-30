import { describe, it, expect } from 'vitest';
import { deepseekModelConfig } from '../../lib/deepseekModel';

describe('deepseekModelConfig', () => {
  it('defaults to deepseek-flash with thinking disabled on the official API', () => {
    const c = deepseekModelConfig({});
    expect(c.model).toBe('deepseek-flash');
    expect(c.baseUrl).toBe('https://api.deepseek.com');
    expect(c.extra).toEqual({ thinking: { type: 'disabled' } });
  });

  it('lets thinking be switched on explicitly', () => {
    expect(deepseekModelConfig({ DEEPSEEK_THINKING: 'enabled' }).extra).toEqual({ thinking: { type: 'enabled' } });
  });

  it('honours an explicit model such as deepseek-v4-pro', () => {
    const c = deepseekModelConfig({ DEEPSEEK_MODEL: 'deepseek-v4-pro' });
    expect(c.model).toBe('deepseek-v4-pro');
    expect(c.extra).toEqual({ thinking: { type: 'disabled' } });
  });

  it('sends no thinking parameter to legacy model names or third-party hosts', () => {
    expect(deepseekModelConfig({ DEEPSEEK_MODEL: 'deepseek-chat' }).extra).toEqual({});
    expect(deepseekModelConfig({ DEEPSEEK_BASE_URL: 'https://llm.example.com/v1' }).extra).toEqual({});
  });
});
