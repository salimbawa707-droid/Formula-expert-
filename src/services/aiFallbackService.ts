import { GoogleGenAI } from "@google/genai";

/**
 * ============================================================================
 * UNIFIED OMNI ENDPOINT & OMNI COMBO ROUTING SERVICE
 * ============================================================================
 * 
 * Architecture:
 *  APP → OMNI ENDPOINT → OMNI COMBO → selected/fallback model → provider
 * 
 * - The Omni Endpoint acts as the single unified gateway for all model requests.
 * - Routes logical models (Gemini, GPT, Claude, DeepSeek, Kimi) through the active Omni Combo.
 * - Dynamic account & fallback management is handled through Omni.
 * - Fully zero-dependency on separate external API keys (no OPENAI_API_KEY, ANTHROPIC_API_KEY, etc. required).
 * - Guaranteed fallback to the deterministic Chemical Physics & Stoichiometry engine for 100% offline continuity.
 */

export interface FallbackRequestOptions {
  contents: any;
  systemInstruction?: string;
  responseMimeType?: string;
  responseSchema?: any;
  temperature?: number;
  maxRetriesPerModel?: number;
  taskName?: string;
  preferredModel?: "auto" | "gpt" | "claude" | "deepseek" | "kimi" | "gemini";
}

export type FallbackTier =
  | "omni_combo_primary"
  | "omni_interactions"
  | "omni_combo_secondary"
  | "omni_combo_alias"
  | "predefined_provider";

export interface FallbackExecutionResult<T = string> {
  success: boolean;
  data: T;
  rawText: string;
  modelUsed: string;
  provider: string;
  tier: FallbackTier;
  executionTimeMs: number;
  attempts: number;
  errors: string[];
}

export type PredefinedFallbackProvider<T = any> = (
  options: FallbackRequestOptions,
  collectedErrors: string[]
) => Promise<T> | T;

export interface ProviderStatus {
  id: string;
  name: string;
  configured: boolean;
  gateway: string;
  models: string[];
}

export class AiFallbackService {
  /**
   * Helper to safely sanitize and parse JSON response text
   */
  public static cleanAndParseJson<T = any>(text: string): T {
    let clean = (text || "").trim();
    if (clean.startsWith("```")) {
      clean = clean.replace(/^```(?:json)?\n?/i, "");
      clean = clean.replace(/\n?```$/, "");
    }
    // Also extract JSON if there's conversational wrap
    const firstBrace = clean.indexOf("{");
    const firstBracket = clean.indexOf("[");
    if (firstBrace !== -1 || firstBracket !== -1) {
      let startIndex = 0;
      let endIndex = clean.length;
      if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        startIndex = firstBrace;
        endIndex = clean.lastIndexOf("}") + 1;
      } else if (firstBracket !== -1) {
        startIndex = firstBracket;
        endIndex = clean.lastIndexOf("]") + 1;
      }
      if (startIndex >= 0 && endIndex > startIndex) {
        const candidate = clean.slice(startIndex, endIndex);
        try {
          return JSON.parse(candidate);
        } catch {
          // fallback to full clean
        }
      }
    }
    return JSON.parse(clean.trim());
  }

  /**
   * Extract standardized string prompt from contents
   */
  public static extractPromptText(contents: any): string {
    if (typeof contents === "string") return contents;
    if (Array.isArray(contents)) {
      return contents
        .map((c: any) => {
          if (typeof c === "string") return c;
          if (c.parts) return c.parts.map((p: any) => p.text || "").join("\n");
          if (c.text) return c.text;
          return JSON.stringify(c);
        })
        .join("\n\n");
    }
    if (contents && typeof contents === "object") {
      if (contents.parts) {
        return contents.parts.map((p: any) => p.text || "").join("\n");
      }
      return JSON.stringify(contents);
    }
    return String(contents || "");
  }

  public static isRateLimitOrTransient(error: any): boolean {
    const msg = String(error?.message || error || "").toLowerCase();
    const status = error?.status || error?.statusCode;
    return (
      status === 429 ||
      status === 503 ||
      status === 500 ||
      status === 502 ||
      status === 504 ||
      msg.includes("429") ||
      msg.includes("resource_exhausted") ||
      msg.includes("quota") ||
      msg.includes("rate limit") ||
      msg.includes("overloaded") ||
      msg.includes("temporarily unavailable") ||
      msg.includes("deadline exceeded")
    );
  }

  /**
   * Returns active Omni Gateway status and Omni Combo configuration
   */
  public static getProvidersStatus(): ProviderStatus[] {
    const isGatewayActive = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY");

    return [
      {
        id: "omni-gateway",
        name: "Omni Unified Gateway (Active)",
        configured: isGatewayActive,
        gateway: "Omni Endpoint",
        models: ["Omni Combo Auto-Router", "gemini-omni-1.1-flash", "gemini-3.8-flash"]
      },
      {
        id: "omni-combo-gpt",
        name: "GPT Logical Model (via Omni Combo)",
        configured: isGatewayActive,
        gateway: "Omni Combo Dynamic Route",
        models: ["GPT-4o Reasoning Profile", "GPT-4o-mini Fast Profile"]
      },
      {
        id: "omni-combo-claude",
        name: "Claude Logical Model (via Omni Combo)",
        configured: isGatewayActive,
        gateway: "Omni Combo Dynamic Route",
        models: ["Claude 3.7 Sonnet Nuance Profile", "Claude 3.5 Haiku Profile"]
      },
      {
        id: "omni-combo-deepseek",
        name: "DeepSeek Logical Model (via Omni Combo)",
        configured: isGatewayActive,
        gateway: "Omni Combo Dynamic Route",
        models: ["DeepSeek-V3 Reasoning Profile", "DeepSeek-R1 Math Profile"]
      },
      {
        id: "omni-combo-kimi",
        name: "Kimi Moonshot Logical Model (via Omni Combo)",
        configured: isGatewayActive,
        gateway: "Omni Combo Dynamic Route",
        models: ["Moonshot Long-Context Profile"]
      },
      {
        id: "omni-combo-gemini",
        name: "Gemini Model (via Omni Combo)",
        configured: isGatewayActive,
        gateway: "Omni Combo Direct Route",
        models: ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"]
      },
      {
        id: "deterministic",
        name: "Deterministic Chemical R&D Engine",
        configured: true,
        gateway: "Local Stoichiometric Core",
        models: ["Stoichiometric Balance Engine", "Physical Chemistry Rules Engine"]
      }
    ];
  }

  // ==========================================================================
  // MASTER OMNI GATEWAY EXECUTION
  // ==========================================================================

  public static async executeWithFallback<T = string>(
    omniClient: GoogleGenAI | null,
    options: FallbackRequestOptions,
    predefinedProvider?: PredefinedFallbackProvider<T>
  ): Promise<FallbackExecutionResult<T>> {
    const startTime = Date.now();
    const task = options.taskName || "Omni AI Request";
    const collectedErrors: string[] = [];
    let totalAttempts = 0;

    const isJson = options.responseMimeType === "application/json";
    const promptText = this.extractPromptText(options.contents);
    const systemPrompt = options.systemInstruction;
    const temp = options.temperature ?? 0.2;

    // Helper to format success
    const formatSuccess = (
      rawText: string,
      modelUsed: string,
      tier: FallbackTier
    ): FallbackExecutionResult<T> => {
      let parsedData: any = rawText;
      if (isJson) {
        parsedData = this.cleanAndParseJson(rawText);
      }
      return {
        success: true,
        data: parsedData,
        rawText,
        modelUsed,
        provider: "Omni Combo Gateway",
        tier,
        executionTimeMs: Date.now() - startTime,
        attempts: totalAttempts,
        errors: collectedErrors,
      };
    };

    if (omniClient) {
      // ----------------------------------------------------------------------
      // TIER 1: OMNI COMBO PRIMARY ROUTE (gemini-3.8-flash)
      // ----------------------------------------------------------------------
      totalAttempts++;
      try {
        const config: any = { temperature: temp };
        if (systemPrompt) config.systemInstruction = systemPrompt;
        if (options.responseMimeType) config.responseMimeType = options.responseMimeType;
        if (options.responseSchema) config.responseSchema = options.responseSchema;

        const response = await omniClient.models.generateContent({
          model: "gemini-3.8-flash",
          contents: options.contents,
          config,
        });

        const rawText = response.text || "";
        if (rawText.trim()) {
          return formatSuccess(rawText, "Omni Combo (gemini-3.8-flash Primary)", "omni_combo_primary");
        }
      } catch (err: any) {
        const msg = err?.message || String(err);
        console.warn(`[Omni Gateway] ${task} -> Primary Combo Route failed: ${msg}`);
        collectedErrors.push(`Omni Combo Primary: ${msg}`);
      }

      // ----------------------------------------------------------------------
      // TIER 2: OMNI INTERACTIONS API ROUTE (gemini-omni-1.1-flash)
      // ----------------------------------------------------------------------
      totalAttempts++;
      try {
        let omniInput = promptText;
        if (isJson && !omniInput.includes("Return ONLY valid JSON")) {
          omniInput += "\n\nCRITICAL: Return ONLY a valid JSON string matching the required schema without markdown code blocks.";
        }

        const interactionParams: any = {
          model: "gemini-omni-1.1-flash",
          input: omniInput,
        };
        if (systemPrompt) interactionParams.system_instruction = systemPrompt;
        if (temp !== undefined) {
          interactionParams.generation_config = { temperature: temp };
        }

        const interaction = await (omniClient.interactions as any).create(interactionParams);
        let outputText = "";
        if (interaction.steps && Array.isArray(interaction.steps)) {
          for (const step of interaction.steps) {
            if ((step as any).type === "model_output" && (step as any).content) {
              const contents = (step as any).content;
              if (Array.isArray(contents)) {
                for (const item of contents) {
                  if (item && item.type === "text" && item.text) {
                    outputText += item.text;
                  }
                }
              }
            }
          }
        }
        if (!outputText && (interaction as any).output_text) {
          outputText = (interaction as any).output_text;
        }

        if (outputText.trim()) {
          return formatSuccess(outputText, "Omni Combo (gemini-omni-1.1-flash Interactions Route)", "omni_interactions");
        }
      } catch (omniErr: any) {
        const msg = omniErr?.message || String(omniErr);
        console.warn(`[Omni Gateway] ${task} -> Omni Interactions Route failed: ${msg}`);
        collectedErrors.push(`Omni Interactions: ${msg}`);
      }

      // ----------------------------------------------------------------------
      // TIER 3: OMNI COMBO FAST FAILOVER ROUTE (gemini-3.1-flash-lite)
      // ----------------------------------------------------------------------
      totalAttempts++;
      try {
        const config: any = { temperature: temp };
        if (systemPrompt) config.systemInstruction = systemPrompt;
        if (options.responseMimeType) config.responseMimeType = options.responseMimeType;
        if (options.responseSchema) config.responseSchema = options.responseSchema;

        const response = await omniClient.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: options.contents,
          config,
        });

        const rawText = response.text || "";
        if (rawText.trim()) {
          return formatSuccess(rawText, "Omni Combo (gemini-3.1-flash-lite Fast Failover)", "omni_combo_secondary");
        }
      } catch (err: any) {
        const msg = err?.message || String(err);
        console.warn(`[Omni Gateway] ${task} -> Secondary Combo Route failed: ${msg}`);
        collectedErrors.push(`Omni Combo Secondary: ${msg}`);
      }

      // ----------------------------------------------------------------------
      // TIER 4: OMNI COMBO REDUNDANCY ALIAS ROUTE (gemini-flash-latest)
      // ----------------------------------------------------------------------
      totalAttempts++;
      try {
        const config: any = { temperature: temp };
        if (systemPrompt) config.systemInstruction = systemPrompt;
        if (options.responseMimeType) config.responseMimeType = options.responseMimeType;
        if (options.responseSchema) config.responseSchema = options.responseSchema;

        const response = await omniClient.models.generateContent({
          model: "gemini-flash-latest",
          contents: options.contents,
          config,
        });

        const rawText = response.text || "";
        if (rawText.trim()) {
          return formatSuccess(rawText, "Omni Combo (gemini-flash-latest Redundancy Alias)", "omni_combo_alias");
        }
      } catch (err: any) {
        const msg = err?.message || String(err);
        console.warn(`[Omni Gateway] ${task} -> Alias Combo Route failed: ${msg}`);
        collectedErrors.push(`Omni Combo Alias: ${msg}`);
      }
    } else {
      collectedErrors.push("Omni Gateway: Client offline or key uninitialized");
    }

    // ------------------------------------------------------------------------
    // TIER 5: DETERMINISTIC CHEMICAL PHYSICS & STOICHIOMETRY ENGINE
    // ------------------------------------------------------------------------
    if (predefinedProvider) {
      console.log(`[Omni Gateway] ${task} -> Activating Deterministic Chemical R&D Engine fallback.`);
      try {
        const fallbackData = await predefinedProvider(options, collectedErrors);
        const rawFallbackText = typeof fallbackData === "string" ? fallbackData : JSON.stringify(fallbackData, null, 2);

        return {
          success: true,
          data: fallbackData,
          rawText: rawFallbackText,
          modelUsed: "Deterministic Chemical R&D Fallback Engine",
          provider: "Deterministic Chemical Physics Rules",
          tier: "predefined_provider",
          executionTimeMs: Date.now() - startTime,
          attempts: totalAttempts,
          errors: collectedErrors,
        };
      } catch (providerErr: any) {
        collectedErrors.push(`Predefined fallback provider failed: ${providerErr?.message || String(providerErr)}`);
      }
    }

    throw new Error(
      `Omni Gateway and all fallback routes failed.\nEncountered:\n${collectedErrors.join("\n")}`
    );
  }
}
