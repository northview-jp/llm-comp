import { ProviderCatalog } from "./types.js";
import { ProviderId } from "../types/index.js";

const DEFAULT_MODELS: Readonly<Record<ProviderId, readonly string[]>> = {
  openai: ["gpt-5-mini", "gpt-5-nano"],
  claude: ["claude-haiku-4-5-20251001", "claude-sonnet-4-6"],
  gemini: ["gemini-3.1-flash-lite-preview", "gemini-3-flash-preview"],
};

export const MODEL_CATALOG: readonly ProviderCatalog[] = [
  {
    providerId: "openai",
    displayName: "OpenAI",
    models: [
      { id: "gpt-5.4-pro", displayName: "GPT-5.4 Pro", tier: "flagship" },
      { id: "gpt-5.4", displayName: "GPT-5.4", tier: "flagship" },
      { id: "gpt-5.2-pro", displayName: "GPT-5.2 Pro", tier: "standard" },
      { id: "gpt-5.2", displayName: "GPT-5.2", tier: "standard" },
      { id: "gpt-5", displayName: "GPT-5", tier: "legacy" },
      { id: "gpt-5-mini", displayName: "GPT-5 Mini", tier: "standard" },
      { id: "gpt-5-nano", displayName: "GPT-5 Nano", tier: "fast" },
      { id: "gpt-4.1", displayName: "GPT-4.1", tier: "legacy" },
      { id: "gpt-4.1-mini", displayName: "GPT-4.1 Mini", tier: "legacy" },
      { id: "gpt-4.1-nano", displayName: "GPT-4.1 Nano", tier: "legacy" },
    ],
  },
  {
    providerId: "claude",
    displayName: "Claude",
    models: [
      { id: "claude-opus-4-6", displayName: "Claude Opus 4.6", tier: "flagship" },
      { id: "claude-sonnet-4-6", displayName: "Claude Sonnet 4.6", tier: "standard" },
      { id: "claude-haiku-4-5-20251001", displayName: "Claude Haiku 4.5", tier: "fast" },
      { id: "claude-opus-4-5-20251101", displayName: "Claude Opus 4.5", tier: "legacy" },
      { id: "claude-sonnet-4-5-20250929", displayName: "Claude Sonnet 4.5", tier: "legacy" },
      { id: "claude-opus-4-1-20250805", displayName: "Claude Opus 4.1", tier: "legacy" },
      { id: "claude-opus-4-20250514", displayName: "Claude Opus 4", tier: "legacy" },
      { id: "claude-sonnet-4-20250514", displayName: "Claude Sonnet 4", tier: "legacy" },
    ],
  },
  {
    providerId: "gemini",
    displayName: "Gemini",
    models: [
      { id: "gemini-3.1-pro-preview", displayName: "Gemini 3.1 Pro Preview", tier: "flagship" },
      { id: "gemini-3-flash-preview", displayName: "Gemini 3 Flash Preview", tier: "standard" },
      { id: "gemini-3.1-flash-lite-preview", displayName: "Gemini 3.1 Flash Lite Preview", tier: "fast" },
      { id: "gemini-2.5-pro", displayName: "Gemini 2.5 Pro", tier: "legacy" },
      { id: "gemini-2.5-flash", displayName: "Gemini 2.5 Flash", tier: "legacy" },
      { id: "gemini-2.5-flash-lite", displayName: "Gemini 2.5 Flash Lite", tier: "legacy" },
      { id: "gemini-2.0-flash", displayName: "Gemini 2.0 Flash", tier: "legacy" },
      { id: "gemini-2.0-flash-001", displayName: "Gemini 2.0 Flash 001", tier: "legacy" },
      { id: "gemini-2.0-flash-lite", displayName: "Gemini 2.0 Flash Lite", tier: "legacy" },
      { id: "gemini-2.0-flash-lite-001", displayName: "Gemini 2.0 Flash Lite 001", tier: "legacy" },
    ],
  },
];

export function getDefaultModels(providerId: ProviderId): string[] {
  return [...(DEFAULT_MODELS[providerId] ?? [])];
}

export function getProviderDisplayName(providerId: ProviderId): string {
  const provider = MODEL_CATALOG.find((p) => p.providerId === providerId);
  return provider?.displayName ?? providerId;
}
