/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Gemini API 金鑰；未設定時各 AI 功能自動降級為示範模式 */
  readonly VITE_GEMINI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
