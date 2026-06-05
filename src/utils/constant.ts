export const SUPPORTED_MODELS = {
  GEMINI_FLASH: 'gemini-2.5-flash',
  QWEN_7B: 'qwen-2.5-7b',
} as const;

export type ModelId = typeof SUPPORTED_MODELS[keyof typeof SUPPORTED_MODELS];
