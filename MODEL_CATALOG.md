# Model Catalog

**Last Updated:** March 9, 2026

This document lists the latest AI models from OpenAI, Anthropic, and Google (Gemini) available for use with llm-comp.

---

## OpenAI Models

### Current Flagship Models (Recommended)

| Model | Description | Context |
|-------|-------------|---------|
| `gpt-5.4` | Latest flagship model with improved coding, instruction following, and long-context performance | 1,050,000 input / 32,768 output |
| `gpt-5.4-pro` | Higher-accuracy GPT-5.4 variant for the hardest tasks | 400,000 input / 32,768 output |
| `gpt-5.2` | Previous GPT-5 flagship generation | - |
| `gpt-5.2-pro` | Higher-accuracy GPT-5.2 variant | - |
| `gpt-5-mini` | Faster, cost-efficient GPT-5 model | - |
| `gpt-5-nano` | Fastest, most cost-efficient GPT-5 model | - |

### Coding-Specific Models

| Model | Description | Context |
|-------|-------------|---------|
| `gpt-5.2-codex` | Latest Codex-tuned GPT-5 model for agentic coding workflows | 400,000 input / 32,768 output |
| `gpt-5-codex` | Earlier Codex-tuned GPT-5 model | 400,000 input / 128,000 output |

### Legacy Reasoning / Older Families

| Model | Status | Notes |
|-------|--------|-------|
| `o3` | Legacy | Succeeded by GPT-5 family |
| `o3-pro` | Legacy | Higher-compute `o3` variant |
| `o3-mini` | Legacy | Smaller `o3` variant |
| `o4-mini` | Legacy | Fast reasoning model, now superseded by GPT-5 mini |
| `gpt-4.1` | Older but still documented | 1M-context non-reasoning model |
| `gpt-4.1-mini` | Older but still documented | Balanced GPT-4.1 variant |
| `gpt-4.1-nano` | Older but still documented | Fastest GPT-4.1 variant |

### Deprecated / Removed

| Model | Status |
|-------|--------|
| `gpt-4o` | Older general-purpose model; no longer a recommended default |
| `gpt-4.5-preview` | Removed from API on July 14, 2025 |
| `gpt-4` | Legacy model |
| `o1-preview` | Removed from API on July 28, 2025 |
| `o1-mini` | Removed from API on October 27, 2025 |
| `codex-mini-latest` | Deprecated; removed on January 16, 2026 |

---

## Anthropic Claude Models

### Current Claude 4.6 Family (Recommended)

| Model | Status | Description |
|-------|--------|-------------|
| `claude-opus-4-6` | Active | Current top Claude model for coding, agents, and computer use |
| `claude-sonnet-4-6` | Active | Best balance of capability, speed, and cost in the Claude lineup |

### Other Active Claude 4.x Models

| Model | Status | Description |
|-------|--------|-------------|
| `claude-haiku-4-5-20251001` | Active | Fastest and cheapest current Claude model |
| `claude-opus-4-5-20251101` | Active | Prior Opus generation, still available |
| `claude-sonnet-4-5-20250929` | Active | Prior Sonnet generation, still available |
| `claude-opus-4-1-20250805` | Active | Earlier Claude 4.1 release |
| `claude-opus-4-20250514` | Active | First Claude 4 Opus release |
| `claude-sonnet-4-20250514` | Active | First Claude 4 Sonnet release |

### Deprecated / Retired

| Model | Status |
|-------|--------|
| `claude-3-opus-20240229` | Deprecated on June 30, 2025; retired on January 5, 2026 |
| `claude-3-7-sonnet-20250219` | Deprecated on October 28, 2025; retired on February 19, 2026 |
| `claude-3-5-haiku-20241022` | Deprecated on December 19, 2025; retired on February 19, 2026 |
| `claude-3-5-sonnet-20240620` | Retired on October 28, 2025 |
| `claude-3-5-sonnet-20241022` | Retired on October 28, 2025 |
| `claude-3-sonnet-20240229` | Retired on July 21, 2025 |
| `claude-2.1` | Retired on July 21, 2025 |

---

## Google Gemini Models

### Current Gemini 3.x Models

| Model | Status | Description | Context |
|-------|--------|-------------|---------|
| `gemini-3.1-pro-preview` | Preview | Latest high-end Gemini reasoning model | 1,048,576 input / 65,536 output |
| `gemini-3-flash-preview` | Preview | Fast multimodal model with strong price/performance | 1,048,576 input / 65,536 output |
| `gemini-3.1-flash-lite-preview` | Preview | Lowest-cost Gemini 3.x model | 1,048,576 input / 65,536 output |

### Gemini 2.5 Models (Stable but Already Scheduled for Shutdown)

| Model | Status | Description | Context |
|-------|--------|-------------|---------|
| `gemini-2.5-pro` | Stable; shuts down June 15, 2026 | State-of-the-art Gemini 2.5 reasoning model | 1,048,576 input / 65,536 output |
| `gemini-2.5-flash` | Stable; shuts down July 15, 2026 | Best Gemini 2.5 price/performance model | 1,048,576 input / 65,536 output |
| `gemini-2.5-flash-lite` | Stable; shuts down July 15, 2026 | Fastest Gemini 2.5 model | 1,048,576 input / 65,536 output |

### Gemini 2.0 Models (Legacy)

| Model | Status | Description | Context |
|-------|--------|-------------|---------|
| `gemini-2.0-flash` | Stable alias; shuts down June 1, 2026 | Older Gemini workhorse model | 1,048,576 input / 8,192 output |
| `gemini-2.0-flash-001` | Stable pinned version; shuts down June 1, 2026 | Pinned Gemini 2.0 Flash version | 1,048,576 input / 8,192 output |
| `gemini-2.0-flash-lite` | Stable alias; shuts down June 1, 2026 | Lower-cost Gemini 2.0 model | 1,048,576 input / 8,192 output |
| `gemini-2.0-flash-lite-001` | Stable pinned version; shuts down June 1, 2026 | Pinned Gemini 2.0 Flash-Lite version | 1,048,576 input / 8,192 output |

### Notes

- Prefer stable model codes for current production, but note that Google has already announced shutdown dates for Gemini 2.0 and 2.5 families.
- Inference from Google's lifecycle pages: for new Gemini integrations, prefer Gemini 3.x unless you specifically require GA-only models today.
- On Vertex AI, auto-updated aliases such as `gemini-2.0-flash` move to the latest stable pinned version; use pinned versions when reproducibility matters.

---

## Recommended Models

### For Generation Tasks

| Use Case | Recommended Model |
|----------|-------------------|
| High quality output | `claude-opus-4-6` or `gpt-5.4-pro` or `gemini-3.1-pro-preview` |
| Balanced cost/quality | `claude-sonnet-4-6` or `gpt-5.4` or `gemini-3-flash-preview` |
| Fast/cheap | `claude-haiku-4-5-20251001` or `gpt-5-mini` / `gpt-5-nano` or `gemini-3.1-flash-lite-preview` |

### For Refinement Tasks

| Use Case | Recommended Model |
|----------|-------------------|
| Complex reasoning | `gpt-5.4-pro` or `claude-opus-4-6` or `gemini-3.1-pro-preview` |
| Standard refinement | `claude-sonnet-4-6` or `gpt-5.4` or `gemini-3-flash-preview` |
| Coding-heavy refinement | `gpt-5.2-codex` or `claude-opus-4-6` or `claude-sonnet-4-6` |
| Fast iterative refinement | `claude-haiku-4-5-20251001` or `gpt-5-mini` or `gemini-3.1-flash-lite-preview` |

---

## Sources

- [OpenAI Models Overview](https://platform.openai.com/docs/models)
- [GPT-5.4 model guide](https://platform.openai.com/docs/models/gpt-5.4)
- [GPT-5.4 Pro model guide](https://platform.openai.com/docs/models/gpt-5.4-pro)
- [GPT-5.2 Codex model guide](https://platform.openai.com/docs/models/gpt-5.2-codex)
- [API model availability by usage tier and verification status](https://platform.openai.com/docs/guides/rate-limits#api-model-availability-by-usage-tier-and-verification-status)
- [OpenAI Deprecations](https://platform.openai.com/docs/deprecations)
- [Claude models overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- [What’s new in Claude 4.6](https://docs.anthropic.com/en/release-notes/api)
- [Anthropic model deprecations](https://docs.anthropic.com/en/docs/resources/model-deprecations)
- [Gemini models (Gemini API)](https://ai.google.dev/gemini-api/docs/models)
- [Gemini 3.1 Pro preview](https://ai.google.dev/gemini-api/docs/models/gemini#gemini-31-pro-preview)
- [Gemini 3 Flash preview](https://ai.google.dev/gemini-api/docs/models/gemini#gemini-3-flash-preview)
- [Gemini 3.1 Flash-Lite preview](https://ai.google.dev/gemini-api/docs/models/gemini#gemini-31-flash-lite-preview)
- [Google AI Studio and Gemini API deprecations](https://ai.google.dev/gemini-api/docs/deprecations)
