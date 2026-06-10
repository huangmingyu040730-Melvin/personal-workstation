export type AiProvider = "openai" | "deepseek" | "custom";

export type AiProviderConfig = {
  provider: AiProvider;
  apiKey: string | null;
  baseURL?: string;
  model: string;
  isConfigured: boolean;
};

export type AiProviderPublicInfo = {
  provider: AiProvider;
  providerLabel: string;
  baseURL?: string;
  model: string;
};

const defaultOpenAiModel = "gpt-4.1-mini";
const defaultDeepSeekBaseUrl = "https://api.deepseek.com";
const defaultDeepSeekModel = "deepseek-v4-flash";

export function getAiProviderConfig(): AiProviderConfig {
  const genericApiKey = readEnv("AI_API_KEY");
  if (genericApiKey) {
    const publicInfo = getGenericAiProviderPublicInfo();
    return {
      ...publicInfo,
      apiKey: genericApiKey,
      isConfigured: true
    };
  }

  const legacyOpenAiApiKey = readEnv("OPENAI_API_KEY");
  if (legacyOpenAiApiKey) {
    return {
      provider: "openai",
      apiKey: legacyOpenAiApiKey,
      model: readEnv("OPENAI_MODEL") || defaultOpenAiModel,
      isConfigured: true
    };
  }

  const publicInfo = getGenericAiProviderPublicInfo();
  return {
    ...publicInfo,
    apiKey: null,
    isConfigured: false
  };
}

export function getAiProviderPublicInfo(): AiProviderPublicInfo {
  return withProviderLabel(getGenericAiProviderPublicInfo());
}

export function getAiProviderDisplayName(provider: AiProvider) {
  if (provider === "deepseek") {
    return "DeepSeek";
  }

  if (provider === "openai") {
    return "OpenAI";
  }

  return "OpenAI-compatible";
}

function getGenericAiProviderPublicInfo(): Omit<AiProviderPublicInfo, "providerLabel"> {
  const provider = normalizeProvider(readEnv("AI_PROVIDER"));
  const baseURL = readEnv("AI_BASE_URL");

  if (provider === "deepseek") {
    return {
      provider: "deepseek",
      baseURL: baseURL || defaultDeepSeekBaseUrl,
      model: readEnv("AI_MODEL") || defaultDeepSeekModel
    };
  }

  if (provider === "openai") {
    return {
      provider: "openai",
      baseURL,
      model: readEnv("AI_MODEL") || readEnv("OPENAI_MODEL") || defaultOpenAiModel
    };
  }

  return {
    provider: baseURL ? "custom" : "openai",
    baseURL,
    model: readEnv("AI_MODEL") || readEnv("OPENAI_MODEL") || defaultOpenAiModel
  };
}

function withProviderLabel(info: Omit<AiProviderPublicInfo, "providerLabel">): AiProviderPublicInfo {
  return {
    ...info,
    providerLabel: getAiProviderDisplayName(info.provider)
  };
}

function normalizeProvider(value: string | undefined): AiProvider | undefined {
  const normalized = value?.toLowerCase();
  if (normalized === "openai" || normalized === "deepseek") {
    return normalized;
  }
  return normalized ? "custom" : undefined;
}

function readEnv(key: string) {
  const value = process.env[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}
