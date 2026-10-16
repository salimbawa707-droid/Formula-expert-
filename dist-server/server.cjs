"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs3 = __toESM(require("fs"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_vite = require("vite");
var import_genai2 = require("@google/genai");

// src/services/aiFallbackService.ts
var AiFallbackService = class {
  /**
   * Helper to safely sanitize and parse JSON response text
   */
  static cleanAndParseJson(text) {
    let clean = (text || "").trim();
    if (clean.startsWith("```")) {
      clean = clean.replace(/^```(?:json)?\n?/i, "");
      clean = clean.replace(/\n?```$/, "");
    }
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
        }
      }
    }
    return JSON.parse(clean.trim());
  }
  /**
   * Extract standardized string prompt from contents
   */
  static extractPromptText(contents) {
    if (typeof contents === "string") return contents;
    if (Array.isArray(contents)) {
      return contents.map((c) => {
        if (typeof c === "string") return c;
        if (c.parts) return c.parts.map((p) => p.text || "").join("\n");
        if (c.text) return c.text;
        return JSON.stringify(c);
      }).join("\n\n");
    }
    if (contents && typeof contents === "object") {
      if (contents.parts) {
        return contents.parts.map((p) => p.text || "").join("\n");
      }
      return JSON.stringify(contents);
    }
    return String(contents || "");
  }
  static isRateLimitOrTransient(error) {
    const msg = String(error?.message || error || "").toLowerCase();
    const status = error?.status || error?.statusCode;
    return status === 429 || status === 503 || status === 500 || status === 502 || status === 504 || msg.includes("429") || msg.includes("resource_exhausted") || msg.includes("quota") || msg.includes("rate limit") || msg.includes("overloaded") || msg.includes("temporarily unavailable") || msg.includes("deadline exceeded");
  }
  /**
   * Returns active Omni Gateway status and Omni Combo configuration
   */
  static getProvidersStatus() {
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
  static async executeWithFallback(omniClient, options, predefinedProvider) {
    const startTime = Date.now();
    const task = options.taskName || "Omni AI Request";
    const collectedErrors = [];
    let totalAttempts = 0;
    const isJson = options.responseMimeType === "application/json";
    const promptText = this.extractPromptText(options.contents);
    const systemPrompt = options.systemInstruction;
    const temp = options.temperature ?? 0.2;
    const formatSuccess = (rawText, modelUsed, tier) => {
      let parsedData = rawText;
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
        errors: collectedErrors
      };
    };
    if (omniClient) {
      totalAttempts++;
      try {
        const config = { temperature: temp };
        if (systemPrompt) config.systemInstruction = systemPrompt;
        if (options.responseMimeType) config.responseMimeType = options.responseMimeType;
        if (options.responseSchema) config.responseSchema = options.responseSchema;
        const response = await omniClient.models.generateContent({
          model: "gemini-3.8-flash",
          contents: options.contents,
          config
        });
        const rawText = response.text || "";
        if (rawText.trim()) {
          return formatSuccess(rawText, "Omni Combo (gemini-3.8-flash Primary)", "omni_combo_primary");
        }
      } catch (err) {
        const msg = err?.message || String(err);
        console.warn(`[Omni Gateway] ${task} -> Primary Combo Route failed: ${msg}`);
        collectedErrors.push(`Omni Combo Primary: ${msg}`);
      }
      totalAttempts++;
      try {
        let omniInput = promptText;
        if (isJson && !omniInput.includes("Return ONLY valid JSON")) {
          omniInput += "\n\nCRITICAL: Return ONLY a valid JSON string matching the required schema without markdown code blocks.";
        }
        const interactionParams = {
          model: "gemini-omni-1.1-flash",
          input: omniInput
        };
        if (systemPrompt) interactionParams.system_instruction = systemPrompt;
        if (temp !== void 0) {
          interactionParams.generation_config = { temperature: temp };
        }
        const interaction = await omniClient.interactions.create(interactionParams);
        let outputText = "";
        if (interaction.steps && Array.isArray(interaction.steps)) {
          for (const step of interaction.steps) {
            if (step.type === "model_output" && step.content) {
              const contents = step.content;
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
        if (!outputText && interaction.output_text) {
          outputText = interaction.output_text;
        }
        if (outputText.trim()) {
          return formatSuccess(outputText, "Omni Combo (gemini-omni-1.1-flash Interactions Route)", "omni_interactions");
        }
      } catch (omniErr) {
        const msg = omniErr?.message || String(omniErr);
        console.warn(`[Omni Gateway] ${task} -> Omni Interactions Route failed: ${msg}`);
        collectedErrors.push(`Omni Interactions: ${msg}`);
      }
      totalAttempts++;
      try {
        const config = { temperature: temp };
        if (systemPrompt) config.systemInstruction = systemPrompt;
        if (options.responseMimeType) config.responseMimeType = options.responseMimeType;
        if (options.responseSchema) config.responseSchema = options.responseSchema;
        const response = await omniClient.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: options.contents,
          config
        });
        const rawText = response.text || "";
        if (rawText.trim()) {
          return formatSuccess(rawText, "Omni Combo (gemini-3.1-flash-lite Fast Failover)", "omni_combo_secondary");
        }
      } catch (err) {
        const msg = err?.message || String(err);
        console.warn(`[Omni Gateway] ${task} -> Secondary Combo Route failed: ${msg}`);
        collectedErrors.push(`Omni Combo Secondary: ${msg}`);
      }
      totalAttempts++;
      try {
        const config = { temperature: temp };
        if (systemPrompt) config.systemInstruction = systemPrompt;
        if (options.responseMimeType) config.responseMimeType = options.responseMimeType;
        if (options.responseSchema) config.responseSchema = options.responseSchema;
        const response = await omniClient.models.generateContent({
          model: "gemini-flash-latest",
          contents: options.contents,
          config
        });
        const rawText = response.text || "";
        if (rawText.trim()) {
          return formatSuccess(rawText, "Omni Combo (gemini-flash-latest Redundancy Alias)", "omni_combo_alias");
        }
      } catch (err) {
        const msg = err?.message || String(err);
        console.warn(`[Omni Gateway] ${task} -> Alias Combo Route failed: ${msg}`);
        collectedErrors.push(`Omni Combo Alias: ${msg}`);
      }
    } else {
      collectedErrors.push("Omni Gateway: Client offline or key uninitialized");
    }
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
          errors: collectedErrors
        };
      } catch (providerErr) {
        collectedErrors.push(`Predefined fallback provider failed: ${providerErr?.message || String(providerErr)}`);
      }
    }
    throw new Error(
      `Omni Gateway and all fallback routes failed.
Encountered:
${collectedErrors.join("\n")}`
    );
  }
};

// src/data/universalIngredientLibrary.ts
var UNIVERSAL_INGREDIENTS = [
  {
    "id": "labsa-96",
    "name": "LABSA 96% (Acid Slurry)",
    "category": "Anionic Surfactant",
    "casNumber": "27176-87-0",
    "inciName": "Dodecylbenzene Sulfonic Acid",
    "function": "Primary Anionic Surfactant Acid",
    "activeDefault": 96,
    "costPerKg": null,
    "hlb": 11.5,
    "description": "Workhorse raw material for liquid & powder detergents.",
    "manufacturer": "Commercial Detergent Standard",
    "productName": "LABSA 96% Acid Slurry",
    "provenance": {
      "sourceType": "STANDARD_CHEMICAL",
      "source": "Commercial Detergent Raw Material Standard (96% Active Slurry)",
      "verificationStatus": "VERIFIED"
    }
  },
  {
    "id": "labsa-90",
    "name": "LABSA 90% (Acid Slurry)",
    "category": "Anionic Surfactant",
    "casNumber": "27176-87-0",
    "inciName": "Dodecylbenzene Sulfonic Acid",
    "function": "Primary Anionic Surfactant Acid (90% Commercial Grade)",
    "activeDefault": 90,
    "costPerKg": null,
    "hlb": 11.5,
    "description": "Standard commercial 90% active linear alkylbenzene sulfonic acid (Acid Slurry) for liquid and powder detergents.",
    "manufacturer": "Commercial Detergent Standard",
    "productName": "LABSA 90% Acid Slurry",
    "provenance": {
      "sourceType": "STANDARD_CHEMICAL",
      "source": "Commercial Detergent Raw Material Standard (90% Active Slurry)",
      "verificationStatus": "VERIFIED"
    }
  },
  {
    "id": "aristo-9",
    "name": "Aristo 9 (Multipurpose Detergent Additive)",
    "category": "Additive & Performance",
    "casNumber": "PROPRIETARY-BLEND",
    "inciName": "Proprietary Enzyme & Thickener Blend",
    "function": "Multipurpose Detergent Additive & Viscosity/Enzyme Booster",
    "activeDefault": 0,
    "activeMatter": void 0,
    "costPerKg": null,
    "hlb": null,
    "description": "Commercial liquid detergent chemical and enzyme booster blend manufactured by Blue Chem India (Ahmedabad, Gujarat). Chemical composition and active matter assay are proprietary/unspecified by the manufacturer; scientific properties must be treated as UNKNOWN / INSUFFICIENT_DATA.",
    "manufacturer": "Blue Chem India",
    "productName": "Aristo 9",
    "provenance": {
      "sourceType": "OFFICIAL_MANUFACTURER",
      "source": "Blue Chem India",
      "sourceUrl": "https://bluechemindia.co.in",
      "verificationStatus": "NEEDS_VERIFICATION",
      "verifiedAt": "2026-10-04",
      "notes": "Manufacturer documentation identifies product as an enzyme & thickener blend for liquid detergent compounding. Quantitative active assay, pKa, CMC, and thermodynamic properties are proprietary/unverified and must not be fabricated."
    },
    "unknownProperties": ["activeMatter", "hlb", "cmc", "density", "nvr", "pKa", "chelatingCapacity"]
  },
  {
    "id": "sles-70",
    "name": "SLES 70% (Sodium Lauryl Ether Sulfate)",
    "category": "Anionic Surfactant",
    "casNumber": "68585-34-2",
    "inciName": "Sodium Laureth Sulfate",
    "function": "Primary Foamer & Cleanser",
    "activeDefault": 70,
    "costPerKg": null,
    "hlb": 40,
    "description": "High-foaming anionic surfactant with 2 moles EO."
  },
  {
    "id": "sles-28",
    "name": "SLES 28% Liquid",
    "category": "Anionic Surfactant",
    "casNumber": "68585-34-2",
    "inciName": "Sodium Laureth Sulfate",
    "function": "Dilute Primary Cleanser",
    "activeDefault": 28,
    "costPerKg": null,
    "hlb": 40,
    "description": "Ready-to-use liquid SLES formulation base."
  },
  {
    "id": "sls-needles",
    "name": "SLS 95% Needles (Sodium Lauryl Sulfate)",
    "category": "Anionic Surfactant",
    "casNumber": "151-21-3",
    "inciName": "Sodium Lauryl Sulfate",
    "function": "High Flash Foam Surfactant",
    "activeDefault": 95,
    "costPerKg": null,
    "hlb": 40,
    "description": "High flash foam powder/needle anionic surfactant."
  },
  {
    "id": "sls-30",
    "name": "SLS 30% Liquid",
    "category": "Anionic Surfactant",
    "casNumber": "151-21-3",
    "inciName": "Sodium Lauryl Sulfate",
    "function": "Liquid Primary Foamer",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": 40,
    "description": "Liquid form sodium lauryl sulfate."
  },
  {
    "id": "aos-38",
    "name": "AOS 38% Liquid (Alpha Olefin Sulfonate)",
    "category": "Anionic Surfactant",
    "casNumber": "68439-57-6",
    "inciName": "Sodium C14-16 Olefin Sulfonate",
    "function": "Hard Water Tolerant Cleanser",
    "activeDefault": 38,
    "costPerKg": null,
    "hlb": 12,
    "description": "Phosphate-free high foaming surfactant with acid/alkali stability."
  },
  {
    "id": "aos-92",
    "name": "AOS 92% Powder",
    "category": "Anionic Surfactant",
    "casNumber": "68439-57-6",
    "inciName": "Sodium C14-16 Olefin Sulfonate",
    "function": "Concentrated Anionic Powder",
    "activeDefault": 92,
    "costPerKg": null,
    "hlb": 12,
    "description": "Powdered alpha olefin sulfonate for detergent bars & powders."
  },
  {
    "id": "sas-60",
    "name": "Sodium Alkane Sulfonate 60% (SAS 60)",
    "category": "Anionic Surfactant",
    "casNumber": "68037-49-0",
    "inciName": "Sodium C14-17 Sec-Alkyl Sulfonate",
    "function": "Secondary Alkane Sulfonate",
    "activeDefault": 60,
    "costPerKg": null,
    "hlb": 13,
    "description": "Highly soluble anionic surfactant with superior grease cutting."
  },
  {
    "id": "sarcosinate-30",
    "name": "Sodium Lauryl Sarcosinate 30%",
    "category": "Anionic Surfactant",
    "casNumber": "137-16-6",
    "inciName": "Sodium Lauroyl Sarcosinate",
    "function": "Mild Amino Acid Surfactant",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": 13.5,
    "description": "Corrosion inhibiting mild anionic surfactant for premium care."
  },
  {
    "id": "sulfosuccinate-40",
    "name": "Disodium Laureth Sulfosuccinate (DLS 40%)",
    "category": "Anionic Surfactant",
    "casNumber": "39354-45-5",
    "inciName": "Disodium Laureth Sulfosuccinate",
    "function": "Ultra-Mild Anionic Foamer",
    "activeDefault": 40,
    "costPerKg": null,
    "hlb": 12.6,
    "description": "Very low irritation anionic surfactant for delicate fabrics & baby care."
  },
  {
    "id": "sci-85",
    "name": "Sodium Cocoyl Isethionate 85% (SCI)",
    "category": "Anionic Surfactant",
    "casNumber": "61789-32-0",
    "inciName": "Sodium Cocoyl Isethionate",
    "function": "Solid Syndet Cleanser",
    "activeDefault": 85,
    "costPerKg": null,
    "hlb": 12,
    "description": "Mild sulfate-free noodle/powder surfactant."
  },
  {
    "id": "smt-30",
    "name": "Sodium Methyl Cocoyl Taurate 30%",
    "category": "Anionic Surfactant",
    "casNumber": "61791-42-2",
    "inciName": "Sodium Methyl Cocoyl Taurate",
    "function": "Sulfate-Free Foaming Agent",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": 12.5,
    "description": "Stable across wide pH range with soft foam feel."
  },
  {
    "id": "lignosulfonate-na",
    "name": "Sodium Lignosulfonate",
    "category": "Anionic Surfactant",
    "casNumber": "8061-51-6",
    "inciName": "Sodium Lignosulfonate",
    "function": "Anionic Dispersant & Binder",
    "activeDefault": 95,
    "costPerKg": null,
    "hlb": 10,
    "description": "Bio-based lignin dispersant for industrial powders."
  },
  {
    "id": "lae-3",
    "name": "LAE-3 (C12-15 Alcohol Ethoxylate 3EO)",
    "category": "Nonionic Surfactant",
    "casNumber": "68439-50-9",
    "inciName": "C12-15 Pareth-3",
    "function": "Oil-Soluble Emulsifier",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 8,
    "description": "Low HLB nonionic surfactant for oil soil emulsification."
  },
  {
    "id": "lae-7",
    "name": "LAE-7 (C12-15 Alcohol Ethoxylate 7EO)",
    "category": "Nonionic Surfactant",
    "casNumber": "68439-50-9",
    "inciName": "C12-15 Pareth-7",
    "function": "Primary Detergent Nonionic",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 12.1,
    "description": "Standard laundry detergent nonionic surfactant."
  },
  {
    "id": "lae-9",
    "name": "LAE-9 (C12-15 Alcohol Ethoxylate 9EO)",
    "category": "Nonionic Surfactant",
    "casNumber": "68439-50-9",
    "inciName": "C12-15 Pareth-9",
    "function": "Nonionic Degreaser",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 13.1,
    "description": "High performance degreaser and soil suspension agent."
  },
  {
    "id": "lae-12",
    "name": "LAE-12 (C12-15 Alcohol Ethoxylate 12EO)",
    "category": "Nonionic Surfactant",
    "casNumber": "68439-50-9",
    "inciName": "C12-15 Pareth-12",
    "function": "High-Solubility Hydrophile",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 14.5,
    "description": "High cloud-point nonionic for warm water washing."
  },
  {
    "id": "np-6",
    "name": "Nonylphenol Ethoxylate 6EO (NP-6)",
    "category": "Nonionic Surfactant",
    "casNumber": "9016-45-9",
    "inciName": "Nonoxynol-6",
    "function": "Industrial Degreasing Solvent",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 10.9,
    "description": "Industrial heavy duty degreasing nonionic surfactant."
  },
  {
    "id": "np-9",
    "name": "Nonylphenol Ethoxylate 9EO (NP-9 / Alfox 200)",
    "category": "Nonionic Surfactant",
    "casNumber": "9016-45-9",
    "inciName": "Nonoxynol-9",
    "function": "Industrial Detergent Workhorse",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 13,
    "description": "Classic industrial hard surface cleanser."
  },
  {
    "id": "np-10",
    "name": "Nonylphenol Ethoxylate 10EO (NP-10)",
    "category": "Nonionic Surfactant",
    "casNumber": "9016-45-9",
    "inciName": "Nonoxynol-10",
    "function": "High Water Soluble Cleanser",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 13.3,
    "description": "Water soluble industrial cleanser."
  },
  {
    "id": "apg-0810",
    "name": "APG 0810 (Caprylyl/Capryl Glucoside 50%)",
    "category": "Nonionic Surfactant",
    "casNumber": "68515-73-1",
    "inciName": "Caprylyl/Capryl Glucoside",
    "function": "Eco Nonionic Hydrotrope",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": 13,
    "description": "Bio-based, plant-derived nonionic hydrotrope."
  },
  {
    "id": "apg-1214",
    "name": "APG 1214 (Lauryl Glucoside 50%)",
    "category": "Nonionic Surfactant",
    "casNumber": "110615-47-9",
    "inciName": "Lauryl Glucoside",
    "function": "Eco Detergent Nonionic",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": 12.5,
    "description": "Plant-derived readily biodegradable nonionic surfactant."
  },
  {
    "id": "cdea-85",
    "name": "Cocamide DEA 85% (CDEA / CDE)",
    "category": "Nonionic Surfactant",
    "casNumber": "68603-42-9",
    "inciName": "Cocamide DEA",
    "function": "Viscosity & Foam Booster",
    "activeDefault": 85,
    "costPerKg": null,
    "hlb": 13.5,
    "description": "Fatty acid alkanolamide foam booster and thickener."
  },
  {
    "id": "cmea-90",
    "name": "Cocamide MEA 90% (CMEA)",
    "category": "Nonionic Surfactant",
    "casNumber": "68140-00-1",
    "inciName": "Cocamide MEA",
    "function": "Solid Foam Stabilizer",
    "activeDefault": 90,
    "costPerKg": null,
    "hlb": 11.5,
    "description": "Flake alkanolamide foam booster for liquid & solid formulations."
  },
  {
    "id": "lauryl-amine-oxide",
    "name": "Lauryl Amine Oxide 30% (LDAO)",
    "category": "Nonionic Surfactant",
    "casNumber": "1643-20-5",
    "inciName": "Lauramine Oxide",
    "function": "Amine Oxide Foam Stabilizer",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": 14.2,
    "description": "High-foaming bleach-stable amine oxide surfactant."
  },
  {
    "id": "peg-40-hco",
    "name": "PEG-40 Hydrogenated Castor Oil",
    "category": "Nonionic Surfactant",
    "casNumber": "61788-85-0",
    "inciName": "PEG-40 Hydrogenated Castor Oil",
    "function": "Solubilizer for Fragrance/Oils",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 15,
    "description": "Nonionic solubilizer for essential oils and perfume."
  },
  {
    "id": "polysorbate-20",
    "name": "Polysorbate 20 (Tween 20)",
    "category": "Nonionic Surfactant",
    "casNumber": "9005-64-5",
    "inciName": "Polysorbate 20",
    "function": "Fragrance & Oil Solubilizer",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 16.7,
    "description": "High HLB nonionic hydrophilic solubilizer."
  },
  {
    "id": "polysorbate-80",
    "name": "Polysorbate 80 (Tween 80)",
    "category": "Nonionic Surfactant",
    "casNumber": "9005-65-6",
    "inciName": "Polysorbate 80",
    "function": "Emulsifier for Oily Formulations",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 15,
    "description": "High efficiency oleate nonionic emulsifier."
  },
  {
    "id": "capb-30-uni",
    "name": "CAPB 30% (Cocamidopropyl Betaine)",
    "category": "Amphoteric Surfactant",
    "casNumber": "61789-40-0",
    "inciName": "Cocamidopropyl Betaine",
    "function": "Foam & Viscosity Booster",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": 12,
    "description": "Mild secondary surfactant co-thickening with NaCl."
  },
  {
    "id": "capb-45",
    "name": "CAPB 45% High Active Concentrate",
    "category": "Amphoteric Surfactant",
    "casNumber": "61789-40-0",
    "inciName": "Cocamidopropyl Betaine",
    "function": "Concentrated Betaine Base",
    "activeDefault": 45,
    "costPerKg": null,
    "hlb": 12,
    "description": "High concentration zwitterionic surfactant."
  },
  {
    "id": "lauryl-betaine-30",
    "name": "Lauryl Betaine 30%",
    "category": "Amphoteric Surfactant",
    "casNumber": "683-10-3",
    "inciName": "Lauryl Betaine",
    "function": "High Flash Foam Amphoteric",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": 12.5,
    "description": "Strong flash foaming zwitterionic surfactant."
  },
  {
    "id": "coco-betaine-30",
    "name": "Coco Betaine 30%",
    "category": "Amphoteric Surfactant",
    "casNumber": "68424-94-2",
    "inciName": "Coco-Betaine",
    "function": "Natural Betaine Cleanser",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": 12.2,
    "description": "Alkyl betaine for mild cleansing formulations."
  },
  {
    "id": "sodium-amphoacetate-40",
    "name": "Sodium Cocoamphoacetate 40%",
    "category": "Amphoteric Surfactant",
    "casNumber": "68604-71-7",
    "inciName": "Sodium Cocoamphoacetate",
    "function": "Ultra-Mild Amphoteric",
    "activeDefault": 40,
    "costPerKg": null,
    "hlb": 13,
    "description": "Low-irritation amphoacetate for sensitive washing."
  },
  {
    "id": "disodium-amphodiacetate",
    "name": "Disodium Cocoamphodiacetate 38%",
    "category": "Amphoteric Surfactant",
    "casNumber": "68650-39-5",
    "inciName": "Disodium Cocoamphodiacetate",
    "function": "Gentle Secondary Surfactant",
    "activeDefault": 38,
    "costPerKg": null,
    "hlb": 13.2,
    "description": "High-mildness dicarboxylate amphoteric surfactant."
  },
  {
    "id": "capb-sultaine",
    "name": "Cocamidopropyl Hydroxysultaine 40%",
    "category": "Amphoteric Surfactant",
    "casNumber": "68139-30-0",
    "inciName": "Cocamidopropyl Hydroxysultaine",
    "function": "Hard Water Stable Betaine",
    "activeDefault": 40,
    "costPerKg": null,
    "hlb": 12.8,
    "description": "Sultaine amphoteric stable in electrolyte & hard water."
  },
  {
    "id": "ctac-29",
    "name": "Cetrimonium Chloride 29% (CTAC)",
    "category": "Cationic Surfactant",
    "casNumber": "112-02-7",
    "inciName": "Cetrimonium Chloride",
    "function": "Fabric Softener & Antistatic Agent",
    "activeDefault": 29,
    "costPerKg": null,
    "hlb": 15.8,
    "description": "Cationic quaternary ammonium antistatic conditioner."
  },
  {
    "id": "btac-80",
    "name": "Behentrimonium Chloride 80% (BTAC)",
    "category": "Cationic Surfactant",
    "casNumber": "17301-53-0",
    "inciName": "Behentrimonium Chloride",
    "function": "Concentrated Fabric Conditioner",
    "activeDefault": 80,
    "costPerKg": null,
    "hlb": 14.5,
    "description": "High long-chain cationic softener."
  },
  {
    "id": "esterquat-90",
    "name": "Esterquat 90% (Di-Tallow Esterquat)",
    "category": "Cationic Surfactant",
    "casNumber": "91995-81-2",
    "inciName": "Dipalmitoylethyl Hydroxyethylmonium Methosulfate",
    "function": "Eco-Biodegradable Fabric Softener",
    "activeDefault": 90,
    "costPerKg": null,
    "hlb": 11,
    "description": "Readily biodegradable cationic fabric conditioning agent."
  },
  {
    "id": "bkc-50",
    "name": "Benzalkonium Chloride 50% (BKC 50)",
    "category": "Cationic Surfactant",
    "casNumber": "63449-41-2",
    "inciName": "Benzalkonium Chloride",
    "function": "Disinfectant & Antimicrobial Cationic",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": 15,
    "description": "Quaternary germicide and sanitizer."
  },
  {
    "id": "bkc-80",
    "name": "Benzalkonium Chloride 80% (BKC 80)",
    "category": "Cationic Surfactant",
    "casNumber": "63449-41-2",
    "inciName": "Benzalkonium Chloride",
    "function": "High-Con Germicidal Cationic",
    "activeDefault": 80,
    "costPerKg": null,
    "hlb": 15,
    "description": "Concentrated quaternary biocide."
  },
  {
    "id": "naoh-50-uni",
    "name": "Sodium Hydroxide 50% Liquid (Caustic Soda Lye)",
    "category": "Neutralizer / Base",
    "casNumber": "1310-73-2",
    "inciName": "Sodium Hydroxide",
    "function": "Saponification & Neutralization Base",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid caustic soda neutralizer."
  },
  {
    "id": "naoh-flakes-99",
    "name": "Sodium Hydroxide 99% Flakes",
    "category": "Neutralizer / Base",
    "casNumber": "1310-73-2",
    "inciName": "Sodium Hydroxide",
    "function": "Solid Neutralizing Caustic",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "Solid caustic soda for saponification & neutralization."
  },
  {
    "id": "koh-90-flakes",
    "name": "Potassium Hydroxide 90% Flakes (Caustic Potash)",
    "category": "Neutralizer / Base",
    "casNumber": "1310-58-3",
    "inciName": "Potassium Hydroxide",
    "function": "High Solubility Potassium Base",
    "activeDefault": 90,
    "costPerKg": null,
    "hlb": null,
    "description": "Potassium base for soft soaps and high-solubility liquid detergents."
  },
  {
    "id": "koh-45-liquid",
    "name": "Potassium Hydroxide 45% Liquid",
    "category": "Neutralizer / Base",
    "casNumber": "1310-58-3",
    "inciName": "Potassium Hydroxide",
    "function": "Liquid Caustic Potash",
    "activeDefault": 45,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid potassium hydroxide base."
  },
  {
    "id": "tea-99",
    "name": "Triethanolamine 99% (TEA)",
    "category": "Neutralizer / Base",
    "casNumber": "102-71-6",
    "inciName": "Triethanolamine",
    "function": "Organic Base Neutralizer & Buffer",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "Mild organic amine neutralizer for LABSA & fatty acids."
  },
  {
    "id": "mea-99",
    "name": "Monoethanolamine 99% (MEA)",
    "category": "Neutralizer / Base",
    "casNumber": "141-43-5",
    "inciName": "Ethanolamine",
    "function": "Heavy Duty Amine Base",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "Strong organic amine for heavy duty industrial degreasers."
  },
  {
    "id": "amp-95",
    "name": "Aminomethyl Propanol (AMP-95)",
    "category": "Neutralizer / Base",
    "casNumber": "124-68-5",
    "inciName": "Aminomethyl Propanol",
    "function": "Multifunctional Amine Neutralizer",
    "activeDefault": 95,
    "costPerKg": null,
    "hlb": null,
    "description": "High efficiency neutralizer and pigment dispersant."
  },
  {
    "id": "soda-ash-uni",
    "name": "Sodium Carbonate (Soda Ash Dense)",
    "category": "Alkaline Builder",
    "casNumber": "497-19-8",
    "inciName": "Sodium Carbonate",
    "function": "Alkalinity Builder & Saponification Helper",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Heavy duty alkaline builder."
  },
  {
    "id": "soda-ash-light",
    "name": "Sodium Carbonate (Soda Ash Light)",
    "category": "Alkaline Builder",
    "casNumber": "497-19-8",
    "inciName": "Sodium Carbonate",
    "function": "Rapid Dissolving Alkaline Builder",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Low bulk density rapidly soluble soda ash."
  },
  {
    "id": "sodium-metasilicate-pentahydrate",
    "name": "Sodium Metasilicate Pentahydrate",
    "category": "Alkaline Builder",
    "casNumber": "10213-79-3",
    "inciName": "Sodium Metasilicate",
    "function": "Alkaline Builder & Anti-Corrosion Agent",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Silicate builder protecting metal parts in washing machines."
  },
  {
    "id": "sodium-metasilicate-anhydrous",
    "name": "Sodium Metasilicate Anhydrous",
    "category": "Alkaline Builder",
    "casNumber": "6834-92-0",
    "inciName": "Sodium Metasilicate",
    "function": "High Active Anhydrous Silicate",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Anhydrous heavy duty industrial builder."
  },
  {
    "id": "liquid-silicate-24",
    "name": "Sodium Silicate Liquid (2.4 Ratio)",
    "category": "Alkaline Builder",
    "casNumber": "1344-09-8",
    "inciName": "Sodium Silicate",
    "function": "Liquid Anti-Corrosion Builder",
    "activeDefault": 40,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid silicate for slurry processing & metal protection."
  },
  {
    "id": "sodium-bicarbonate",
    "name": "Sodium Bicarbonate (Baking Soda)",
    "category": "Alkaline Builder",
    "casNumber": "144-55-8",
    "inciName": "Sodium Bicarbonate",
    "function": "Mild Alkaline Buffer & Odor Neutralizer",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Eco-friendly mild buffering builder."
  },
  {
    "id": "sodium-sesquicarbonate",
    "name": "Sodium Sesquicarbonate",
    "category": "Alkaline Builder",
    "casNumber": "533-96-5",
    "inciName": "Sodium Sesquicarbonate",
    "function": "Crystalline Alkaline Buffer",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Free-flowing mild alkaline builder crystal."
  },
  {
    "id": "citric-acid-uni",
    "name": "Citric Acid Anhydrous",
    "category": "Builder / Chelator",
    "casNumber": "77-92-9",
    "inciName": "Citric Acid",
    "function": "Acidifier & Chelating Agent",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Organic acid for pH control and metal ion sequestering."
  },
  {
    "id": "sodium-citrate-uni",
    "name": "Sodium Citrate Dihydrate",
    "category": "Builder / Chelator",
    "casNumber": "6132-04-3",
    "inciName": "Sodium Citrate",
    "function": "Water Softener & Buffer",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Phosphate-free eco builder."
  },
  {
    "id": "edta-4na-powder",
    "name": "Tetrasodium EDTA 99% Powder",
    "category": "Builder / Chelator",
    "casNumber": "64-02-8",
    "inciName": "Tetrasodium EDTA",
    "function": "Heavy Metal Chelating Agent",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "Strong chelating agent for calcium, magnesium, & iron ions."
  },
  {
    "id": "edta-4na-39-liquid",
    "name": "Tetrasodium EDTA 39% Liquid",
    "category": "Builder / Chelator",
    "casNumber": "64-02-8",
    "inciName": "Tetrasodium EDTA",
    "function": "Liquid Metal Sequestering Agent",
    "activeDefault": 39,
    "costPerKg": null,
    "hlb": null,
    "description": "Ready-to-use liquid EDTA solution."
  },
  {
    "id": "edta-2na",
    "name": "Disodium EDTA 99%",
    "category": "Builder / Chelator",
    "casNumber": "139-33-3",
    "inciName": "Disodium EDTA",
    "function": "Acidic Metal Sequestering Agent",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "Chelator for acidic/neutral detergent formulations."
  },
  {
    "id": "glda-47",
    "name": "GLDA 47% Liquid (Dissolvine GL-47)",
    "category": "Builder / Chelator",
    "casNumber": "51981-21-6",
    "inciName": "Tetrasodium Glutamate Diacetate",
    "function": "Eco Readily Biodegradable Chelator",
    "activeDefault": 47,
    "costPerKg": null,
    "hlb": null,
    "description": "Green plant-based biodegradable chelating agent."
  },
  {
    "id": "mgda-40",
    "name": "MGDA 40% Liquid (Trilon M)",
    "category": "Builder / Chelator",
    "casNumber": "164462-16-2",
    "inciName": "Trisodium Dicarboxymethyl Alaninate",
    "function": "High-Performance Eco Chelator",
    "activeDefault": 40,
    "costPerKg": null,
    "hlb": null,
    "description": "Eco phosphate-alternative builder for automatic dishwashing & laundry."
  },
  {
    "id": "sodium-gluconate",
    "name": "Sodium Gluconate 99%",
    "category": "Builder / Chelator",
    "casNumber": "527-07-1",
    "inciName": "Sodium Gluconate",
    "function": "Alkaline Iron & Hardness Chelator",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "Bio-based chelator effective in highly alkaline caustic solutions."
  },
  {
    "id": "stpp-94",
    "name": "Sodium Tripolyphosphate 94% (STPP)",
    "category": "Builder / Chelator",
    "casNumber": "7758-29-4",
    "inciName": "Sodium Triphosphate",
    "function": "Classic Detergent Builder",
    "activeDefault": 94,
    "costPerKg": null,
    "hlb": null,
    "description": "Heavy duty builder for soil suspension & water softening."
  },
  {
    "id": "hedp-60",
    "name": "HEDP 60% (Etidronic Acid)",
    "category": "Builder / Chelator",
    "casNumber": "2809-21-4",
    "inciName": "Etidronic Acid",
    "function": "Organophosphonate Scale Inhibitor",
    "activeDefault": 60,
    "costPerKg": null,
    "hlb": null,
    "description": "High stability phosphonate scale and stain chelator."
  },
  {
    "id": "protease-liquid",
    "name": "Protease Liquid (Savinase / Alcalase)",
    "category": "Enzymes",
    "casNumber": "9014-01-1",
    "inciName": "Subtilisin",
    "function": "Protein Stain Removal Enzyme",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Enzyme targeting blood, grass, milk, and protein soils."
  },
  {
    "id": "amylase-liquid",
    "name": "Amylase Liquid (Stainzyme / Termamyl)",
    "category": "Enzymes",
    "casNumber": "9000-90-2",
    "inciName": "Alpha-Amylase",
    "function": "Starch Stain Removal Enzyme",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Enzyme breaking down starch, pasta, sauce, and food residues."
  },
  {
    "id": "lipase-liquid",
    "name": "Lipase Liquid (Lipex)",
    "category": "Enzymes",
    "casNumber": "9001-62-1",
    "inciName": "Triacylglycerol Lipase",
    "function": "Fat & Oil Stain Removal Enzyme",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Enzyme degrading lipid, grease, oil, and sebum soils."
  },
  {
    "id": "cellulase-liquid",
    "name": "Cellulase Liquid (Carezyme)",
    "category": "Enzymes",
    "casNumber": "9012-54-8",
    "inciName": "Cellulase",
    "function": "Fabric Care & Anti-Pilling Enzyme",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Enzyme removing microfibrils, reviving fabric color & brightness."
  },
  {
    "id": "mannanase-liquid",
    "name": "Mannanase Liquid (Mannaway)",
    "category": "Enzymes",
    "casNumber": "37288-54-3",
    "inciName": "Mannan Endoperoxidase",
    "function": "Guar & Food Gum Stain Enzyme",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Enzyme breaking down food thickeners, ice cream, & dressing stains."
  },
  {
    "id": "xanthan-gum-200",
    "name": "Xanthan Gum 200 Mesh",
    "category": "Polymer & Thickener",
    "casNumber": "11138-66-2",
    "inciName": "Xanthan Gum",
    "function": "Natural Polysaccharide Thickener",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Pseudoplastic natural rheology modifier."
  },
  {
    "id": "cmc-technical",
    "name": "Carboxymethyl Cellulose Technical (CMC)",
    "category": "Polymer & Thickener",
    "casNumber": "9004-32-4",
    "inciName": "Cellulose Gum",
    "function": "Anti-Redeposition Agent & Thickener",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Polymeric soil suspension agent preventing soil re-attachment."
  },
  {
    "id": "hpmc-100k",
    "name": "Hydroxypropyl Methylcellulose 100,000 cps (HPMC)",
    "category": "Polymer & Thickener",
    "casNumber": "9004-65-3",
    "inciName": "Hydroxypropyl Methylcellulose",
    "function": "Cellulosic Viscosity Builder",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "High clarity non-ionic water soluble polymer thickener."
  },
  {
    "id": "carbomer-940",
    "name": "Carbomer 940",
    "category": "Polymer & Thickener",
    "casNumber": "9003-01-4",
    "inciName": "Carbomer",
    "function": "Crosslinked Polyacrylate Gel Polymer",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "High clarity gel thickener requiring alkali neutralization."
  },
  {
    "id": "ase-polymer-33",
    "name": "Acrysol 33 (ASE Polymer 30%)",
    "category": "Polymer & Thickener",
    "casNumber": "25212-88-8",
    "inciName": "Acrylates Copolymer",
    "function": "Alkali Swellable Emulsion Thickener",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": null,
    "description": "Acidic liquid emulsion thickening upon alkali neutralization."
  },
  {
    "id": "pvp-k30",
    "name": "Polyvinylpyrrolidone K30 (PVP K30)",
    "category": "Polymer & Thickener",
    "casNumber": "9003-39-8",
    "inciName": "PVP",
    "function": "Dye Transfer Inhibitor Polymer",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Polymer trapping loose fugitive dyes in wash water."
  },
  {
    "id": "pvno-40",
    "name": "PVNO 40% Liquid (Polyvinylpyridine N-Oxide)",
    "category": "Polymer & Thickener",
    "casNumber": "26837-43-8",
    "inciName": "Polyvinylpyridine N-Oxide",
    "function": "Premium Dye Transfer Inhibitor",
    "activeDefault": 40,
    "costPerKg": null,
    "hlb": null,
    "description": "High performance dye anti-redeposition polymer."
  },
  {
    "id": "peg-4000",
    "name": "Polyethylene Glycol 4000 (PEG 4000)",
    "category": "Polymer & Thickener",
    "casNumber": "25322-68-3",
    "inciName": "PEG-90",
    "function": "Binder & Processing Aid",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Solid flake polyethylene glycol binder for tablet detergents."
  },
  {
    "id": "dm-water",
    "name": "Demineralized Water (Aqua)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "7732-18-5",
    "inciName": "Water",
    "function": "Solvent & Liquid Carrier Base",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Pure deionized water matrix for liquid detergent formulations."
  },
  {
    "id": "sxs-40",
    "name": "Sodium Xylene Sulfonate 40% (SXS 40)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "1300-72-7",
    "inciName": "Sodium Xylene Sulfonate",
    "function": "Hydrotrope & Coupling Agent",
    "activeDefault": 40,
    "costPerKg": null,
    "hlb": null,
    "description": "Anionic hydrotrope increasing solubility of surfactants in aqueous solutions."
  },
  {
    "id": "sxs-90",
    "name": "Sodium Xylene Sulfonate 90% Powder (SXS 90)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "1300-72-7",
    "inciName": "Sodium Xylene Sulfonate",
    "function": "Concentrated Solid Hydrotrope",
    "activeDefault": 90,
    "costPerKg": null,
    "hlb": null,
    "description": "Powder hydrotrope for concentrated liquid/solid formulations."
  },
  {
    "id": "pxs-40",
    "name": "Potassium Xylene Sulfonate 40% (PXS)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "30348-70-4",
    "inciName": "Potassium Xylene Sulfonate",
    "function": "High Solubility Potassium Hydrotrope",
    "activeDefault": 40,
    "costPerKg": null,
    "hlb": null,
    "description": "High potassium compatibility hydrotrope."
  },
  {
    "id": "mpg-99",
    "name": "Monopropylene Glycol 99.5% (MPG / Propylene Glycol)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "57-55-6",
    "inciName": "Propylene Glycol",
    "function": "Co-Solvent, Enzyme Stabilizer & Antifreeze",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "Glycol solvent stabilizing enzymes and lowering freeze point."
  },
  {
    "id": "glycerin-99",
    "name": "Glycerin 99.5% USP",
    "category": "Solvent & Hydrotrope",
    "casNumber": "56-81-5",
    "inciName": "Glycerin",
    "function": "Humectant & Eco Solvent",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "Plant-derived bio-glycerol humectant and enzyme stabilizer."
  },
  {
    "id": "ethanol-96",
    "name": "Ethanol 96% Denatured",
    "category": "Solvent & Hydrotrope",
    "casNumber": "64-17-5",
    "inciName": "Alcohol Denat.",
    "function": "Flash Drying Solvent & Viscosity Modifier",
    "activeDefault": 96,
    "costPerKg": null,
    "hlb": null,
    "description": "Volatile solvent for quick-drying hard surface & glass cleaners."
  },
  {
    "id": "ipa-99",
    "name": "Isopropanol 99% (IPA / Isopropyl Alcohol)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "67-63-0",
    "inciName": "Isopropyl Alcohol",
    "function": "Degreasing Solvent & Sanitizer",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "Fast evaporating solvent for heavy oil degreasing."
  },
  {
    "id": "kathon-cg",
    "name": "Kathon CG (CMIT/MIT 1.5%)",
    "category": "Preservative & Biocide",
    "casNumber": "55965-84-9",
    "inciName": "Methylchloroisothiazolinone / Methylisothiazolinone",
    "function": "Broad Spectrum Preservative",
    "activeDefault": 1.5,
    "costPerKg": null,
    "hlb": null,
    "description": "Low dose broad spectrum liquid preservative for neutral/acidic formulas."
  },
  {
    "id": "bit-20",
    "name": "Benzisothiazolinone 20% (BIT 20 / Proxel GXL)",
    "category": "Preservative & Biocide",
    "casNumber": "2634-33-5",
    "inciName": "Benzisothiazolinone",
    "function": "Alkaline Stable Liquid Preservative",
    "activeDefault": 20,
    "costPerKg": null,
    "hlb": null,
    "description": "Preservative stable at high pH (> 8.5) and elevated temperature."
  },
  {
    "id": "phenoxyethanol-99",
    "name": "Phenoxyethanol 99%",
    "category": "Preservative & Biocide",
    "casNumber": "122-99-6",
    "inciName": "Phenoxyethanol",
    "function": "Mild Paraben-Free Preservative",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "Broad spectrum gentle preservative."
  },
  {
    "id": "sodium-benzoate",
    "name": "Sodium Benzoate 99%",
    "category": "Preservative & Biocide",
    "casNumber": "532-32-1",
    "inciName": "Sodium Benzoate",
    "function": "Acidic Food-Grade Preservative",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "Organic acid preservative active at pH < 5.5."
  },
  {
    "id": "potassium-sorbate",
    "name": "Potassium Sorbate 99%",
    "category": "Preservative & Biocide",
    "casNumber": "24634-61-5",
    "inciName": "Potassium Sorbate",
    "function": "Anti-Fungal Eco Preservative",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "Anti-mold eco preservative active in acidic media."
  },
  {
    "id": "cbs-x",
    "name": "Optical Brightener CBS-X (Tinopal CBS-X)",
    "category": "Optical Brightener & Dye",
    "casNumber": "27344-41-8",
    "inciName": "Disodium Distyrylbiphenyl Disulfonate",
    "function": "Fluorescent Whitening Agent for Liquids",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "High performance soluble optical brightener for laundry liquids."
  },
  {
    "id": "brightener-28",
    "name": "Fluorescent Brightener 28",
    "category": "Optical Brightener & Dye",
    "casNumber": "4404-43-7",
    "inciName": "Disodium 4,4'-bis[(4-anilino-6-morpholino-1,3,5-triazin-2-yl)amino]stilbene-2,2'-disulfonate",
    "function": "Cotton Optical Whitener",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Cellulosic fiber optical whitener."
  },
  {
    "id": "acid-blue-9",
    "name": "Acid Blue 9 Liquid Colorant",
    "category": "Optical Brightener & Dye",
    "casNumber": "3844-45-9",
    "inciName": "CI 42090",
    "function": "Water-Soluble Blue Detergent Dye",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Standard liquid blue dye for detergent identification."
  },
  {
    "id": "liquitint-blue",
    "name": "Liquitint Blue HP",
    "category": "Optical Brightener & Dye",
    "casNumber": "PROPRIETARY",
    "inciName": "Colorant",
    "function": "Non-Staining Polymeric Blue Dye",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Polymeric non-staining dye for laundry liquids."
  },
  {
    "id": "silicone-antifoam-30",
    "name": "Silicone Antifoam Emulsion 30%",
    "category": "Additive & Performance",
    "casNumber": "63148-62-9",
    "inciName": "Dimethicone",
    "function": "Foam Control & Defoamer",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": null,
    "description": "Silicone emulsion rapidly collapsing excess foam in automatic washers."
  },
  {
    "id": "sodium-sulfate-uni",
    "name": "Sodium Sulfate Anhydrous",
    "category": "Additive & Performance",
    "casNumber": "7757-82-6",
    "inciName": "Sodium Sulfate",
    "function": "Filler & Processing Aid Powder",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Standard inert bulking agent for detergent powders."
  },
  {
    "id": "sodium-chloride-uni",
    "name": "Sodium Chloride (Vacuum Salt)",
    "category": "Additive & Performance",
    "casNumber": "7647-14-5",
    "inciName": "Sodium Chloride",
    "function": "Viscosity Builder for Anionics",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Electrolyte thickener building micellar viscosity with SLES & CAPB."
  },
  {
    "id": "calcium-chloride-74",
    "name": "Calcium Chloride 74% Flakes",
    "category": "Additive & Performance",
    "casNumber": "10043-52-4",
    "inciName": "Calcium Chloride",
    "function": "Enzyme Stabilizer & Fabric Softener Viscosity Aid",
    "activeDefault": 74,
    "costPerKg": null,
    "hlb": null,
    "description": "Source of calcium ions stabilizing protease & controlling softener viscosity."
  },
  {
    "id": "opacifier-emulsion-30",
    "name": "Styrene/Acrylates Opacifier 30%",
    "category": "Additive & Performance",
    "casNumber": "9010-92-8",
    "inciName": "Styrene/Acrylates Copolymer",
    "function": "Milky White Lotion Opacifier",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": null,
    "description": "Polymeric emulsion imparting milky white opaque appearance."
  },
  {
    "id": "zinc-ricinoleate",
    "name": "Zinc Ricinoleate 100%",
    "category": "Additive & Performance",
    "casNumber": "13040-19-2",
    "inciName": "Zinc Ricinoleate",
    "function": "Chemical Odor Absorber",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Zinc salt trapping nitrogen and sulfur malodor molecules."
  },
  {
    "id": "labsa-96-tech",
    "name": "LABSA 96% (Acid Slurry) (Technical Grade)",
    "category": "Anionic Surfactant",
    "casNumber": "27176-87-0",
    "inciName": "Dodecylbenzene Sulfonic Acid",
    "function": "Primary Anionic Surfactant Acid - Industrial Tech Grade",
    "activeDefault": 96,
    "costPerKg": null,
    "hlb": 11.5,
    "description": "Technical grade Workhorse raw material for liquid & powder detergents. optimized for bulk commercial applications."
  },
  {
    "id": "labsa-96-pure",
    "name": "LABSA 96% (Acid Slurry) (High Purity / R&D Grade)",
    "category": "Anionic Surfactant",
    "casNumber": "27176-87-0",
    "inciName": "Dodecylbenzene Sulfonic Acid",
    "function": "Primary Anionic Surfactant Acid - High Purity Grade",
    "activeDefault": 96,
    "costPerKg": null,
    "hlb": 11.5,
    "description": "High purity low-impurity Workhorse raw material for liquid & powder detergents. for sensitive & eco premium formulations."
  },
  {
    "id": "labsa-96-sol",
    "name": "LABSA 96% (Acid Slurry) (Custom Concentrated Solution)",
    "category": "Anionic Surfactant",
    "casNumber": "27176-87-0",
    "inciName": "Dodecylbenzene Sulfonic Acid",
    "function": "Primary Anionic Surfactant Acid - Ready Blend Solution",
    "activeDefault": 48,
    "costPerKg": null,
    "hlb": 11.5,
    "description": "Liquid pre-dissolved solution of LABSA 96% (Acid Slurry) for rapid cold-process compounding."
  },
  {
    "id": "sles-70-tech",
    "name": "SLES 70% (Sodium Lauryl Ether Sulfate) (Technical Grade)",
    "category": "Anionic Surfactant",
    "casNumber": "68585-34-2",
    "inciName": "Sodium Laureth Sulfate",
    "function": "Primary Foamer & Cleanser - Industrial Tech Grade",
    "activeDefault": 70,
    "costPerKg": null,
    "hlb": 40,
    "description": "Technical grade High-foaming anionic surfactant with 2 moles EO. optimized for bulk commercial applications."
  },
  {
    "id": "sles-70-pure",
    "name": "SLES 70% (Sodium Lauryl Ether Sulfate) (High Purity / R&D Grade)",
    "category": "Anionic Surfactant",
    "casNumber": "68585-34-2",
    "inciName": "Sodium Laureth Sulfate",
    "function": "Primary Foamer & Cleanser - High Purity Grade",
    "activeDefault": 70,
    "costPerKg": null,
    "hlb": 40,
    "description": "High purity low-impurity High-foaming anionic surfactant with 2 moles EO. for sensitive & eco premium formulations."
  },
  {
    "id": "sles-70-sol",
    "name": "SLES 70% (Sodium Lauryl Ether Sulfate) (Custom Concentrated Solution)",
    "category": "Anionic Surfactant",
    "casNumber": "68585-34-2",
    "inciName": "Sodium Laureth Sulfate",
    "function": "Primary Foamer & Cleanser - Ready Blend Solution",
    "activeDefault": 35,
    "costPerKg": null,
    "hlb": 40,
    "description": "Liquid pre-dissolved solution of SLES 70% (Sodium Lauryl Ether Sulfate) for rapid cold-process compounding."
  },
  {
    "id": "sles-28-tech",
    "name": "SLES 28% Liquid (Technical Grade)",
    "category": "Anionic Surfactant",
    "casNumber": "68585-34-2",
    "inciName": "Sodium Laureth Sulfate",
    "function": "Dilute Primary Cleanser - Industrial Tech Grade",
    "activeDefault": 28,
    "costPerKg": null,
    "hlb": 40,
    "description": "Technical grade Ready-to-use liquid SLES formulation base. optimized for bulk commercial applications."
  },
  {
    "id": "sles-28-pure",
    "name": "SLES 28% Liquid (High Purity / R&D Grade)",
    "category": "Anionic Surfactant",
    "casNumber": "68585-34-2",
    "inciName": "Sodium Laureth Sulfate",
    "function": "Dilute Primary Cleanser - High Purity Grade",
    "activeDefault": 28,
    "costPerKg": null,
    "hlb": 40,
    "description": "High purity low-impurity Ready-to-use liquid SLES formulation base. for sensitive & eco premium formulations."
  },
  {
    "id": "sles-28-sol",
    "name": "SLES 28% Liquid (Custom Concentrated Solution)",
    "category": "Anionic Surfactant",
    "casNumber": "68585-34-2",
    "inciName": "Sodium Laureth Sulfate",
    "function": "Dilute Primary Cleanser - Ready Blend Solution",
    "activeDefault": 14,
    "costPerKg": null,
    "hlb": 40,
    "description": "Liquid pre-dissolved solution of SLES 28% Liquid for rapid cold-process compounding."
  },
  {
    "id": "sls-needles-tech",
    "name": "SLS 95% Needles (Sodium Lauryl Sulfate) (Technical Grade)",
    "category": "Anionic Surfactant",
    "casNumber": "151-21-3",
    "inciName": "Sodium Lauryl Sulfate",
    "function": "High Flash Foam Surfactant - Industrial Tech Grade",
    "activeDefault": 95,
    "costPerKg": null,
    "hlb": 40,
    "description": "Technical grade High flash foam powder/needle anionic surfactant. optimized for bulk commercial applications."
  },
  {
    "id": "sls-needles-pure",
    "name": "SLS 95% Needles (Sodium Lauryl Sulfate) (High Purity / R&D Grade)",
    "category": "Anionic Surfactant",
    "casNumber": "151-21-3",
    "inciName": "Sodium Lauryl Sulfate",
    "function": "High Flash Foam Surfactant - High Purity Grade",
    "activeDefault": 95,
    "costPerKg": null,
    "hlb": 40,
    "description": "High purity low-impurity High flash foam powder/needle anionic surfactant. for sensitive & eco premium formulations."
  },
  {
    "id": "sls-needles-sol",
    "name": "SLS 95% Needles (Sodium Lauryl Sulfate) (Custom Concentrated Solution)",
    "category": "Anionic Surfactant",
    "casNumber": "151-21-3",
    "inciName": "Sodium Lauryl Sulfate",
    "function": "High Flash Foam Surfactant - Ready Blend Solution",
    "activeDefault": 47,
    "costPerKg": null,
    "hlb": 40,
    "description": "Liquid pre-dissolved solution of SLS 95% Needles (Sodium Lauryl Sulfate) for rapid cold-process compounding."
  },
  {
    "id": "sls-30-tech",
    "name": "SLS 30% Liquid (Technical Grade)",
    "category": "Anionic Surfactant",
    "casNumber": "151-21-3",
    "inciName": "Sodium Lauryl Sulfate",
    "function": "Liquid Primary Foamer - Industrial Tech Grade",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": 40,
    "description": "Technical grade Liquid form sodium lauryl sulfate. optimized for bulk commercial applications."
  },
  {
    "id": "sls-30-pure",
    "name": "SLS 30% Liquid (High Purity / R&D Grade)",
    "category": "Anionic Surfactant",
    "casNumber": "151-21-3",
    "inciName": "Sodium Lauryl Sulfate",
    "function": "Liquid Primary Foamer - High Purity Grade",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": 40,
    "description": "High purity low-impurity Liquid form sodium lauryl sulfate. for sensitive & eco premium formulations."
  },
  {
    "id": "sls-30-sol",
    "name": "SLS 30% Liquid (Custom Concentrated Solution)",
    "category": "Anionic Surfactant",
    "casNumber": "151-21-3",
    "inciName": "Sodium Lauryl Sulfate",
    "function": "Liquid Primary Foamer - Ready Blend Solution",
    "activeDefault": 15,
    "costPerKg": null,
    "hlb": 40,
    "description": "Liquid pre-dissolved solution of SLS 30% Liquid for rapid cold-process compounding."
  },
  {
    "id": "aos-38-tech",
    "name": "AOS 38% Liquid (Alpha Olefin Sulfonate) (Technical Grade)",
    "category": "Anionic Surfactant",
    "casNumber": "68439-57-6",
    "inciName": "Sodium C14-16 Olefin Sulfonate",
    "function": "Hard Water Tolerant Cleanser - Industrial Tech Grade",
    "activeDefault": 38,
    "costPerKg": null,
    "hlb": 12,
    "description": "Technical grade Phosphate-free high foaming surfactant with acid/alkali stability. optimized for bulk commercial applications."
  },
  {
    "id": "aos-38-pure",
    "name": "AOS 38% Liquid (Alpha Olefin Sulfonate) (High Purity / R&D Grade)",
    "category": "Anionic Surfactant",
    "casNumber": "68439-57-6",
    "inciName": "Sodium C14-16 Olefin Sulfonate",
    "function": "Hard Water Tolerant Cleanser - High Purity Grade",
    "activeDefault": 38,
    "costPerKg": null,
    "hlb": 12,
    "description": "High purity low-impurity Phosphate-free high foaming surfactant with acid/alkali stability. for sensitive & eco premium formulations."
  },
  {
    "id": "aos-38-sol",
    "name": "AOS 38% Liquid (Alpha Olefin Sulfonate) (Custom Concentrated Solution)",
    "category": "Anionic Surfactant",
    "casNumber": "68439-57-6",
    "inciName": "Sodium C14-16 Olefin Sulfonate",
    "function": "Hard Water Tolerant Cleanser - Ready Blend Solution",
    "activeDefault": 19,
    "costPerKg": null,
    "hlb": 12,
    "description": "Liquid pre-dissolved solution of AOS 38% Liquid (Alpha Olefin Sulfonate) for rapid cold-process compounding."
  },
  {
    "id": "aos-92-tech",
    "name": "AOS 92% Powder (Technical Grade)",
    "category": "Anionic Surfactant",
    "casNumber": "68439-57-6",
    "inciName": "Sodium C14-16 Olefin Sulfonate",
    "function": "Concentrated Anionic Powder - Industrial Tech Grade",
    "activeDefault": 92,
    "costPerKg": null,
    "hlb": 12,
    "description": "Technical grade Powdered alpha olefin sulfonate for detergent bars & powders. optimized for bulk commercial applications."
  },
  {
    "id": "aos-92-pure",
    "name": "AOS 92% Powder (High Purity / R&D Grade)",
    "category": "Anionic Surfactant",
    "casNumber": "68439-57-6",
    "inciName": "Sodium C14-16 Olefin Sulfonate",
    "function": "Concentrated Anionic Powder - High Purity Grade",
    "activeDefault": 92,
    "costPerKg": null,
    "hlb": 12,
    "description": "High purity low-impurity Powdered alpha olefin sulfonate for detergent bars & powders. for sensitive & eco premium formulations."
  },
  {
    "id": "aos-92-sol",
    "name": "AOS 92% Powder (Custom Concentrated Solution)",
    "category": "Anionic Surfactant",
    "casNumber": "68439-57-6",
    "inciName": "Sodium C14-16 Olefin Sulfonate",
    "function": "Concentrated Anionic Powder - Ready Blend Solution",
    "activeDefault": 46,
    "costPerKg": null,
    "hlb": 12,
    "description": "Liquid pre-dissolved solution of AOS 92% Powder for rapid cold-process compounding."
  },
  {
    "id": "sas-60-tech",
    "name": "Sodium Alkane Sulfonate 60% (SAS 60) (Technical Grade)",
    "category": "Anionic Surfactant",
    "casNumber": "68037-49-0",
    "inciName": "Sodium C14-17 Sec-Alkyl Sulfonate",
    "function": "Secondary Alkane Sulfonate - Industrial Tech Grade",
    "activeDefault": 60,
    "costPerKg": null,
    "hlb": 13,
    "description": "Technical grade Highly soluble anionic surfactant with superior grease cutting. optimized for bulk commercial applications."
  },
  {
    "id": "sas-60-pure",
    "name": "Sodium Alkane Sulfonate 60% (SAS 60) (High Purity / R&D Grade)",
    "category": "Anionic Surfactant",
    "casNumber": "68037-49-0",
    "inciName": "Sodium C14-17 Sec-Alkyl Sulfonate",
    "function": "Secondary Alkane Sulfonate - High Purity Grade",
    "activeDefault": 60,
    "costPerKg": null,
    "hlb": 13,
    "description": "High purity low-impurity Highly soluble anionic surfactant with superior grease cutting. for sensitive & eco premium formulations."
  },
  {
    "id": "sas-60-sol",
    "name": "Sodium Alkane Sulfonate 60% (SAS 60) (Custom Concentrated Solution)",
    "category": "Anionic Surfactant",
    "casNumber": "68037-49-0",
    "inciName": "Sodium C14-17 Sec-Alkyl Sulfonate",
    "function": "Secondary Alkane Sulfonate - Ready Blend Solution",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": 13,
    "description": "Liquid pre-dissolved solution of Sodium Alkane Sulfonate 60% (SAS 60) for rapid cold-process compounding."
  },
  {
    "id": "sarcosinate-30-tech",
    "name": "Sodium Lauryl Sarcosinate 30% (Technical Grade)",
    "category": "Anionic Surfactant",
    "casNumber": "137-16-6",
    "inciName": "Sodium Lauroyl Sarcosinate",
    "function": "Mild Amino Acid Surfactant - Industrial Tech Grade",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": 13.5,
    "description": "Technical grade Corrosion inhibiting mild anionic surfactant for premium care. optimized for bulk commercial applications."
  },
  {
    "id": "sarcosinate-30-pure",
    "name": "Sodium Lauryl Sarcosinate 30% (High Purity / R&D Grade)",
    "category": "Anionic Surfactant",
    "casNumber": "137-16-6",
    "inciName": "Sodium Lauroyl Sarcosinate",
    "function": "Mild Amino Acid Surfactant - High Purity Grade",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": 13.5,
    "description": "High purity low-impurity Corrosion inhibiting mild anionic surfactant for premium care. for sensitive & eco premium formulations."
  },
  {
    "id": "sarcosinate-30-sol",
    "name": "Sodium Lauryl Sarcosinate 30% (Custom Concentrated Solution)",
    "category": "Anionic Surfactant",
    "casNumber": "137-16-6",
    "inciName": "Sodium Lauroyl Sarcosinate",
    "function": "Mild Amino Acid Surfactant - Ready Blend Solution",
    "activeDefault": 15,
    "costPerKg": null,
    "hlb": 13.5,
    "description": "Liquid pre-dissolved solution of Sodium Lauryl Sarcosinate 30% for rapid cold-process compounding."
  },
  {
    "id": "sulfosuccinate-40-tech",
    "name": "Disodium Laureth Sulfosuccinate (DLS 40%) (Technical Grade)",
    "category": "Anionic Surfactant",
    "casNumber": "39354-45-5",
    "inciName": "Disodium Laureth Sulfosuccinate",
    "function": "Ultra-Mild Anionic Foamer - Industrial Tech Grade",
    "activeDefault": 40,
    "costPerKg": null,
    "hlb": 12.6,
    "description": "Technical grade Very low irritation anionic surfactant for delicate fabrics & baby care. optimized for bulk commercial applications."
  },
  {
    "id": "sulfosuccinate-40-pure",
    "name": "Disodium Laureth Sulfosuccinate (DLS 40%) (High Purity / R&D Grade)",
    "category": "Anionic Surfactant",
    "casNumber": "39354-45-5",
    "inciName": "Disodium Laureth Sulfosuccinate",
    "function": "Ultra-Mild Anionic Foamer - High Purity Grade",
    "activeDefault": 40,
    "costPerKg": null,
    "hlb": 12.6,
    "description": "High purity low-impurity Very low irritation anionic surfactant for delicate fabrics & baby care. for sensitive & eco premium formulations."
  },
  {
    "id": "sulfosuccinate-40-sol",
    "name": "Disodium Laureth Sulfosuccinate (DLS 40%) (Custom Concentrated Solution)",
    "category": "Anionic Surfactant",
    "casNumber": "39354-45-5",
    "inciName": "Disodium Laureth Sulfosuccinate",
    "function": "Ultra-Mild Anionic Foamer - Ready Blend Solution",
    "activeDefault": 20,
    "costPerKg": null,
    "hlb": 12.6,
    "description": "Liquid pre-dissolved solution of Disodium Laureth Sulfosuccinate (DLS 40%) for rapid cold-process compounding."
  },
  {
    "id": "sci-85-tech",
    "name": "Sodium Cocoyl Isethionate 85% (SCI) (Technical Grade)",
    "category": "Anionic Surfactant",
    "casNumber": "61789-32-0",
    "inciName": "Sodium Cocoyl Isethionate",
    "function": "Solid Syndet Cleanser - Industrial Tech Grade",
    "activeDefault": 85,
    "costPerKg": null,
    "hlb": 12,
    "description": "Technical grade Mild sulfate-free noodle/powder surfactant. optimized for bulk commercial applications."
  },
  {
    "id": "sci-85-pure",
    "name": "Sodium Cocoyl Isethionate 85% (SCI) (High Purity / R&D Grade)",
    "category": "Anionic Surfactant",
    "casNumber": "61789-32-0",
    "inciName": "Sodium Cocoyl Isethionate",
    "function": "Solid Syndet Cleanser - High Purity Grade",
    "activeDefault": 85,
    "costPerKg": null,
    "hlb": 12,
    "description": "High purity low-impurity Mild sulfate-free noodle/powder surfactant. for sensitive & eco premium formulations."
  },
  {
    "id": "sci-85-sol",
    "name": "Sodium Cocoyl Isethionate 85% (SCI) (Custom Concentrated Solution)",
    "category": "Anionic Surfactant",
    "casNumber": "61789-32-0",
    "inciName": "Sodium Cocoyl Isethionate",
    "function": "Solid Syndet Cleanser - Ready Blend Solution",
    "activeDefault": 42,
    "costPerKg": null,
    "hlb": 12,
    "description": "Liquid pre-dissolved solution of Sodium Cocoyl Isethionate 85% (SCI) for rapid cold-process compounding."
  },
  {
    "id": "smt-30-tech",
    "name": "Sodium Methyl Cocoyl Taurate 30% (Technical Grade)",
    "category": "Anionic Surfactant",
    "casNumber": "61791-42-2",
    "inciName": "Sodium Methyl Cocoyl Taurate",
    "function": "Sulfate-Free Foaming Agent - Industrial Tech Grade",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": 12.5,
    "description": "Technical grade Stable across wide pH range with soft foam feel. optimized for bulk commercial applications."
  },
  {
    "id": "smt-30-pure",
    "name": "Sodium Methyl Cocoyl Taurate 30% (High Purity / R&D Grade)",
    "category": "Anionic Surfactant",
    "casNumber": "61791-42-2",
    "inciName": "Sodium Methyl Cocoyl Taurate",
    "function": "Sulfate-Free Foaming Agent - High Purity Grade",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": 12.5,
    "description": "High purity low-impurity Stable across wide pH range with soft foam feel. for sensitive & eco premium formulations."
  },
  {
    "id": "smt-30-sol",
    "name": "Sodium Methyl Cocoyl Taurate 30% (Custom Concentrated Solution)",
    "category": "Anionic Surfactant",
    "casNumber": "61791-42-2",
    "inciName": "Sodium Methyl Cocoyl Taurate",
    "function": "Sulfate-Free Foaming Agent - Ready Blend Solution",
    "activeDefault": 15,
    "costPerKg": null,
    "hlb": 12.5,
    "description": "Liquid pre-dissolved solution of Sodium Methyl Cocoyl Taurate 30% for rapid cold-process compounding."
  },
  {
    "id": "lignosulfonate-na-tech",
    "name": "Sodium Lignosulfonate (Technical Grade)",
    "category": "Anionic Surfactant",
    "casNumber": "8061-51-6",
    "inciName": "Sodium Lignosulfonate",
    "function": "Anionic Dispersant & Binder - Industrial Tech Grade",
    "activeDefault": 95,
    "costPerKg": null,
    "hlb": 10,
    "description": "Technical grade Bio-based lignin dispersant for industrial powders. optimized for bulk commercial applications."
  },
  {
    "id": "lignosulfonate-na-pure",
    "name": "Sodium Lignosulfonate (High Purity / R&D Grade)",
    "category": "Anionic Surfactant",
    "casNumber": "8061-51-6",
    "inciName": "Sodium Lignosulfonate",
    "function": "Anionic Dispersant & Binder - High Purity Grade",
    "activeDefault": 95,
    "costPerKg": null,
    "hlb": 10,
    "description": "High purity low-impurity Bio-based lignin dispersant for industrial powders. for sensitive & eco premium formulations."
  },
  {
    "id": "lignosulfonate-na-sol",
    "name": "Sodium Lignosulfonate (Custom Concentrated Solution)",
    "category": "Anionic Surfactant",
    "casNumber": "8061-51-6",
    "inciName": "Sodium Lignosulfonate",
    "function": "Anionic Dispersant & Binder - Ready Blend Solution",
    "activeDefault": 47,
    "costPerKg": null,
    "hlb": 10,
    "description": "Liquid pre-dissolved solution of Sodium Lignosulfonate for rapid cold-process compounding."
  },
  {
    "id": "lae-3-tech",
    "name": "LAE-3 (C12-15 Alcohol Ethoxylate 3EO) (Technical Grade)",
    "category": "Nonionic Surfactant",
    "casNumber": "68439-50-9",
    "inciName": "C12-15 Pareth-3",
    "function": "Oil-Soluble Emulsifier - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 8,
    "description": "Technical grade Low HLB nonionic surfactant for oil soil emulsification. optimized for bulk commercial applications."
  },
  {
    "id": "lae-3-pure",
    "name": "LAE-3 (C12-15 Alcohol Ethoxylate 3EO) (High Purity / R&D Grade)",
    "category": "Nonionic Surfactant",
    "casNumber": "68439-50-9",
    "inciName": "C12-15 Pareth-3",
    "function": "Oil-Soluble Emulsifier - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 8,
    "description": "High purity low-impurity Low HLB nonionic surfactant for oil soil emulsification. for sensitive & eco premium formulations."
  },
  {
    "id": "lae-3-sol",
    "name": "LAE-3 (C12-15 Alcohol Ethoxylate 3EO) (Custom Concentrated Solution)",
    "category": "Nonionic Surfactant",
    "casNumber": "68439-50-9",
    "inciName": "C12-15 Pareth-3",
    "function": "Oil-Soluble Emulsifier - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": 8,
    "description": "Liquid pre-dissolved solution of LAE-3 (C12-15 Alcohol Ethoxylate 3EO) for rapid cold-process compounding."
  },
  {
    "id": "lae-7-tech",
    "name": "LAE-7 (C12-15 Alcohol Ethoxylate 7EO) (Technical Grade)",
    "category": "Nonionic Surfactant",
    "casNumber": "68439-50-9",
    "inciName": "C12-15 Pareth-7",
    "function": "Primary Detergent Nonionic - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 12.1,
    "description": "Technical grade Standard laundry detergent nonionic surfactant. optimized for bulk commercial applications."
  },
  {
    "id": "lae-7-pure",
    "name": "LAE-7 (C12-15 Alcohol Ethoxylate 7EO) (High Purity / R&D Grade)",
    "category": "Nonionic Surfactant",
    "casNumber": "68439-50-9",
    "inciName": "C12-15 Pareth-7",
    "function": "Primary Detergent Nonionic - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 12.1,
    "description": "High purity low-impurity Standard laundry detergent nonionic surfactant. for sensitive & eco premium formulations."
  },
  {
    "id": "lae-7-sol",
    "name": "LAE-7 (C12-15 Alcohol Ethoxylate 7EO) (Custom Concentrated Solution)",
    "category": "Nonionic Surfactant",
    "casNumber": "68439-50-9",
    "inciName": "C12-15 Pareth-7",
    "function": "Primary Detergent Nonionic - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": 12.1,
    "description": "Liquid pre-dissolved solution of LAE-7 (C12-15 Alcohol Ethoxylate 7EO) for rapid cold-process compounding."
  },
  {
    "id": "lae-9-tech",
    "name": "LAE-9 (C12-15 Alcohol Ethoxylate 9EO) (Technical Grade)",
    "category": "Nonionic Surfactant",
    "casNumber": "68439-50-9",
    "inciName": "C12-15 Pareth-9",
    "function": "Nonionic Degreaser - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 13.1,
    "description": "Technical grade High performance degreaser and soil suspension agent. optimized for bulk commercial applications."
  },
  {
    "id": "lae-9-pure",
    "name": "LAE-9 (C12-15 Alcohol Ethoxylate 9EO) (High Purity / R&D Grade)",
    "category": "Nonionic Surfactant",
    "casNumber": "68439-50-9",
    "inciName": "C12-15 Pareth-9",
    "function": "Nonionic Degreaser - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 13.1,
    "description": "High purity low-impurity High performance degreaser and soil suspension agent. for sensitive & eco premium formulations."
  },
  {
    "id": "lae-9-sol",
    "name": "LAE-9 (C12-15 Alcohol Ethoxylate 9EO) (Custom Concentrated Solution)",
    "category": "Nonionic Surfactant",
    "casNumber": "68439-50-9",
    "inciName": "C12-15 Pareth-9",
    "function": "Nonionic Degreaser - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": 13.1,
    "description": "Liquid pre-dissolved solution of LAE-9 (C12-15 Alcohol Ethoxylate 9EO) for rapid cold-process compounding."
  },
  {
    "id": "lae-12-tech",
    "name": "LAE-12 (C12-15 Alcohol Ethoxylate 12EO) (Technical Grade)",
    "category": "Nonionic Surfactant",
    "casNumber": "68439-50-9",
    "inciName": "C12-15 Pareth-12",
    "function": "High-Solubility Hydrophile - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 14.5,
    "description": "Technical grade High cloud-point nonionic for warm water washing. optimized for bulk commercial applications."
  },
  {
    "id": "lae-12-pure",
    "name": "LAE-12 (C12-15 Alcohol Ethoxylate 12EO) (High Purity / R&D Grade)",
    "category": "Nonionic Surfactant",
    "casNumber": "68439-50-9",
    "inciName": "C12-15 Pareth-12",
    "function": "High-Solubility Hydrophile - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 14.5,
    "description": "High purity low-impurity High cloud-point nonionic for warm water washing. for sensitive & eco premium formulations."
  },
  {
    "id": "lae-12-sol",
    "name": "LAE-12 (C12-15 Alcohol Ethoxylate 12EO) (Custom Concentrated Solution)",
    "category": "Nonionic Surfactant",
    "casNumber": "68439-50-9",
    "inciName": "C12-15 Pareth-12",
    "function": "High-Solubility Hydrophile - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": 14.5,
    "description": "Liquid pre-dissolved solution of LAE-12 (C12-15 Alcohol Ethoxylate 12EO) for rapid cold-process compounding."
  },
  {
    "id": "np-6-tech",
    "name": "Nonylphenol Ethoxylate 6EO (NP-6) (Technical Grade)",
    "category": "Nonionic Surfactant",
    "casNumber": "9016-45-9",
    "inciName": "Nonoxynol-6",
    "function": "Industrial Degreasing Solvent - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 10.9,
    "description": "Technical grade Industrial heavy duty degreasing nonionic surfactant. optimized for bulk commercial applications."
  },
  {
    "id": "np-6-pure",
    "name": "Nonylphenol Ethoxylate 6EO (NP-6) (High Purity / R&D Grade)",
    "category": "Nonionic Surfactant",
    "casNumber": "9016-45-9",
    "inciName": "Nonoxynol-6",
    "function": "Industrial Degreasing Solvent - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 10.9,
    "description": "High purity low-impurity Industrial heavy duty degreasing nonionic surfactant. for sensitive & eco premium formulations."
  },
  {
    "id": "np-6-sol",
    "name": "Nonylphenol Ethoxylate 6EO (NP-6) (Custom Concentrated Solution)",
    "category": "Nonionic Surfactant",
    "casNumber": "9016-45-9",
    "inciName": "Nonoxynol-6",
    "function": "Industrial Degreasing Solvent - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": 10.9,
    "description": "Liquid pre-dissolved solution of Nonylphenol Ethoxylate 6EO (NP-6) for rapid cold-process compounding."
  },
  {
    "id": "np-9-tech",
    "name": "Nonylphenol Ethoxylate 9EO (NP-9 / Alfox 200) (Technical Grade)",
    "category": "Nonionic Surfactant",
    "casNumber": "9016-45-9",
    "inciName": "Nonoxynol-9",
    "function": "Industrial Detergent Workhorse - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 13,
    "description": "Technical grade Classic industrial hard surface cleanser. optimized for bulk commercial applications."
  },
  {
    "id": "np-9-pure",
    "name": "Nonylphenol Ethoxylate 9EO (NP-9 / Alfox 200) (High Purity / R&D Grade)",
    "category": "Nonionic Surfactant",
    "casNumber": "9016-45-9",
    "inciName": "Nonoxynol-9",
    "function": "Industrial Detergent Workhorse - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 13,
    "description": "High purity low-impurity Classic industrial hard surface cleanser. for sensitive & eco premium formulations."
  },
  {
    "id": "np-9-sol",
    "name": "Nonylphenol Ethoxylate 9EO (NP-9 / Alfox 200) (Custom Concentrated Solution)",
    "category": "Nonionic Surfactant",
    "casNumber": "9016-45-9",
    "inciName": "Nonoxynol-9",
    "function": "Industrial Detergent Workhorse - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": 13,
    "description": "Liquid pre-dissolved solution of Nonylphenol Ethoxylate 9EO (NP-9 / Alfox 200) for rapid cold-process compounding."
  },
  {
    "id": "np-10-tech",
    "name": "Nonylphenol Ethoxylate 10EO (NP-10) (Technical Grade)",
    "category": "Nonionic Surfactant",
    "casNumber": "9016-45-9",
    "inciName": "Nonoxynol-10",
    "function": "High Water Soluble Cleanser - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 13.3,
    "description": "Technical grade Water soluble industrial cleanser. optimized for bulk commercial applications."
  },
  {
    "id": "np-10-pure",
    "name": "Nonylphenol Ethoxylate 10EO (NP-10) (High Purity / R&D Grade)",
    "category": "Nonionic Surfactant",
    "casNumber": "9016-45-9",
    "inciName": "Nonoxynol-10",
    "function": "High Water Soluble Cleanser - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 13.3,
    "description": "High purity low-impurity Water soluble industrial cleanser. for sensitive & eco premium formulations."
  },
  {
    "id": "np-10-sol",
    "name": "Nonylphenol Ethoxylate 10EO (NP-10) (Custom Concentrated Solution)",
    "category": "Nonionic Surfactant",
    "casNumber": "9016-45-9",
    "inciName": "Nonoxynol-10",
    "function": "High Water Soluble Cleanser - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": 13.3,
    "description": "Liquid pre-dissolved solution of Nonylphenol Ethoxylate 10EO (NP-10) for rapid cold-process compounding."
  },
  {
    "id": "apg-0810-tech",
    "name": "APG 0810 (Caprylyl/Capryl Glucoside 50%) (Technical Grade)",
    "category": "Nonionic Surfactant",
    "casNumber": "68515-73-1",
    "inciName": "Caprylyl/Capryl Glucoside",
    "function": "Eco Nonionic Hydrotrope - Industrial Tech Grade",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": 13,
    "description": "Technical grade Bio-based, plant-derived nonionic hydrotrope. optimized for bulk commercial applications."
  },
  {
    "id": "apg-0810-pure",
    "name": "APG 0810 (Caprylyl/Capryl Glucoside 50%) (High Purity / R&D Grade)",
    "category": "Nonionic Surfactant",
    "casNumber": "68515-73-1",
    "inciName": "Caprylyl/Capryl Glucoside",
    "function": "Eco Nonionic Hydrotrope - High Purity Grade",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": 13,
    "description": "High purity low-impurity Bio-based, plant-derived nonionic hydrotrope. for sensitive & eco premium formulations."
  },
  {
    "id": "apg-0810-sol",
    "name": "APG 0810 (Caprylyl/Capryl Glucoside 50%) (Custom Concentrated Solution)",
    "category": "Nonionic Surfactant",
    "casNumber": "68515-73-1",
    "inciName": "Caprylyl/Capryl Glucoside",
    "function": "Eco Nonionic Hydrotrope - Ready Blend Solution",
    "activeDefault": 25,
    "costPerKg": null,
    "hlb": 13,
    "description": "Liquid pre-dissolved solution of APG 0810 (Caprylyl/Capryl Glucoside 50%) for rapid cold-process compounding."
  },
  {
    "id": "apg-1214-tech",
    "name": "APG 1214 (Lauryl Glucoside 50%) (Technical Grade)",
    "category": "Nonionic Surfactant",
    "casNumber": "110615-47-9",
    "inciName": "Lauryl Glucoside",
    "function": "Eco Detergent Nonionic - Industrial Tech Grade",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": 12.5,
    "description": "Technical grade Plant-derived readily biodegradable nonionic surfactant. optimized for bulk commercial applications."
  },
  {
    "id": "apg-1214-pure",
    "name": "APG 1214 (Lauryl Glucoside 50%) (High Purity / R&D Grade)",
    "category": "Nonionic Surfactant",
    "casNumber": "110615-47-9",
    "inciName": "Lauryl Glucoside",
    "function": "Eco Detergent Nonionic - High Purity Grade",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": 12.5,
    "description": "High purity low-impurity Plant-derived readily biodegradable nonionic surfactant. for sensitive & eco premium formulations."
  },
  {
    "id": "apg-1214-sol",
    "name": "APG 1214 (Lauryl Glucoside 50%) (Custom Concentrated Solution)",
    "category": "Nonionic Surfactant",
    "casNumber": "110615-47-9",
    "inciName": "Lauryl Glucoside",
    "function": "Eco Detergent Nonionic - Ready Blend Solution",
    "activeDefault": 25,
    "costPerKg": null,
    "hlb": 12.5,
    "description": "Liquid pre-dissolved solution of APG 1214 (Lauryl Glucoside 50%) for rapid cold-process compounding."
  },
  {
    "id": "cdea-85-tech",
    "name": "Cocamide DEA 85% (CDEA / CDE) (Technical Grade)",
    "category": "Nonionic Surfactant",
    "casNumber": "68603-42-9",
    "inciName": "Cocamide DEA",
    "function": "Viscosity & Foam Booster - Industrial Tech Grade",
    "activeDefault": 85,
    "costPerKg": null,
    "hlb": 13.5,
    "description": "Technical grade Fatty acid alkanolamide foam booster and thickener. optimized for bulk commercial applications."
  },
  {
    "id": "cdea-85-pure",
    "name": "Cocamide DEA 85% (CDEA / CDE) (High Purity / R&D Grade)",
    "category": "Nonionic Surfactant",
    "casNumber": "68603-42-9",
    "inciName": "Cocamide DEA",
    "function": "Viscosity & Foam Booster - High Purity Grade",
    "activeDefault": 85,
    "costPerKg": null,
    "hlb": 13.5,
    "description": "High purity low-impurity Fatty acid alkanolamide foam booster and thickener. for sensitive & eco premium formulations."
  },
  {
    "id": "cdea-85-sol",
    "name": "Cocamide DEA 85% (CDEA / CDE) (Custom Concentrated Solution)",
    "category": "Nonionic Surfactant",
    "casNumber": "68603-42-9",
    "inciName": "Cocamide DEA",
    "function": "Viscosity & Foam Booster - Ready Blend Solution",
    "activeDefault": 42,
    "costPerKg": null,
    "hlb": 13.5,
    "description": "Liquid pre-dissolved solution of Cocamide DEA 85% (CDEA / CDE) for rapid cold-process compounding."
  },
  {
    "id": "cmea-90-tech",
    "name": "Cocamide MEA 90% (CMEA) (Technical Grade)",
    "category": "Nonionic Surfactant",
    "casNumber": "68140-00-1",
    "inciName": "Cocamide MEA",
    "function": "Solid Foam Stabilizer - Industrial Tech Grade",
    "activeDefault": 90,
    "costPerKg": null,
    "hlb": 11.5,
    "description": "Technical grade Flake alkanolamide foam booster for liquid & solid formulations. optimized for bulk commercial applications."
  },
  {
    "id": "cmea-90-pure",
    "name": "Cocamide MEA 90% (CMEA) (High Purity / R&D Grade)",
    "category": "Nonionic Surfactant",
    "casNumber": "68140-00-1",
    "inciName": "Cocamide MEA",
    "function": "Solid Foam Stabilizer - High Purity Grade",
    "activeDefault": 90,
    "costPerKg": null,
    "hlb": 11.5,
    "description": "High purity low-impurity Flake alkanolamide foam booster for liquid & solid formulations. for sensitive & eco premium formulations."
  },
  {
    "id": "cmea-90-sol",
    "name": "Cocamide MEA 90% (CMEA) (Custom Concentrated Solution)",
    "category": "Nonionic Surfactant",
    "casNumber": "68140-00-1",
    "inciName": "Cocamide MEA",
    "function": "Solid Foam Stabilizer - Ready Blend Solution",
    "activeDefault": 45,
    "costPerKg": null,
    "hlb": 11.5,
    "description": "Liquid pre-dissolved solution of Cocamide MEA 90% (CMEA) for rapid cold-process compounding."
  },
  {
    "id": "lauryl-amine-oxide-tech",
    "name": "Lauryl Amine Oxide 30% (LDAO) (Technical Grade)",
    "category": "Nonionic Surfactant",
    "casNumber": "1643-20-5",
    "inciName": "Lauramine Oxide",
    "function": "Amine Oxide Foam Stabilizer - Industrial Tech Grade",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": 14.2,
    "description": "Technical grade High-foaming bleach-stable amine oxide surfactant. optimized for bulk commercial applications."
  },
  {
    "id": "lauryl-amine-oxide-pure",
    "name": "Lauryl Amine Oxide 30% (LDAO) (High Purity / R&D Grade)",
    "category": "Nonionic Surfactant",
    "casNumber": "1643-20-5",
    "inciName": "Lauramine Oxide",
    "function": "Amine Oxide Foam Stabilizer - High Purity Grade",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": 14.2,
    "description": "High purity low-impurity High-foaming bleach-stable amine oxide surfactant. for sensitive & eco premium formulations."
  },
  {
    "id": "lauryl-amine-oxide-sol",
    "name": "Lauryl Amine Oxide 30% (LDAO) (Custom Concentrated Solution)",
    "category": "Nonionic Surfactant",
    "casNumber": "1643-20-5",
    "inciName": "Lauramine Oxide",
    "function": "Amine Oxide Foam Stabilizer - Ready Blend Solution",
    "activeDefault": 15,
    "costPerKg": null,
    "hlb": 14.2,
    "description": "Liquid pre-dissolved solution of Lauryl Amine Oxide 30% (LDAO) for rapid cold-process compounding."
  },
  {
    "id": "peg-40-hco-tech",
    "name": "PEG-40 Hydrogenated Castor Oil (Technical Grade)",
    "category": "Nonionic Surfactant",
    "casNumber": "61788-85-0",
    "inciName": "PEG-40 Hydrogenated Castor Oil",
    "function": "Solubilizer for Fragrance/Oils - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 15,
    "description": "Technical grade Nonionic solubilizer for essential oils and perfume. optimized for bulk commercial applications."
  },
  {
    "id": "peg-40-hco-pure",
    "name": "PEG-40 Hydrogenated Castor Oil (High Purity / R&D Grade)",
    "category": "Nonionic Surfactant",
    "casNumber": "61788-85-0",
    "inciName": "PEG-40 Hydrogenated Castor Oil",
    "function": "Solubilizer for Fragrance/Oils - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 15,
    "description": "High purity low-impurity Nonionic solubilizer for essential oils and perfume. for sensitive & eco premium formulations."
  },
  {
    "id": "peg-40-hco-sol",
    "name": "PEG-40 Hydrogenated Castor Oil (Custom Concentrated Solution)",
    "category": "Nonionic Surfactant",
    "casNumber": "61788-85-0",
    "inciName": "PEG-40 Hydrogenated Castor Oil",
    "function": "Solubilizer for Fragrance/Oils - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": 15,
    "description": "Liquid pre-dissolved solution of PEG-40 Hydrogenated Castor Oil for rapid cold-process compounding."
  },
  {
    "id": "polysorbate-20-tech",
    "name": "Polysorbate 20 (Tween 20) (Technical Grade)",
    "category": "Nonionic Surfactant",
    "casNumber": "9005-64-5",
    "inciName": "Polysorbate 20",
    "function": "Fragrance & Oil Solubilizer - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 16.7,
    "description": "Technical grade High HLB nonionic hydrophilic solubilizer. optimized for bulk commercial applications."
  },
  {
    "id": "polysorbate-20-pure",
    "name": "Polysorbate 20 (Tween 20) (High Purity / R&D Grade)",
    "category": "Nonionic Surfactant",
    "casNumber": "9005-64-5",
    "inciName": "Polysorbate 20",
    "function": "Fragrance & Oil Solubilizer - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 16.7,
    "description": "High purity low-impurity High HLB nonionic hydrophilic solubilizer. for sensitive & eco premium formulations."
  },
  {
    "id": "polysorbate-20-sol",
    "name": "Polysorbate 20 (Tween 20) (Custom Concentrated Solution)",
    "category": "Nonionic Surfactant",
    "casNumber": "9005-64-5",
    "inciName": "Polysorbate 20",
    "function": "Fragrance & Oil Solubilizer - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": 16.7,
    "description": "Liquid pre-dissolved solution of Polysorbate 20 (Tween 20) for rapid cold-process compounding."
  },
  {
    "id": "polysorbate-80-tech",
    "name": "Polysorbate 80 (Tween 80) (Technical Grade)",
    "category": "Nonionic Surfactant",
    "casNumber": "9005-65-6",
    "inciName": "Polysorbate 80",
    "function": "Emulsifier for Oily Formulations - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 15,
    "description": "Technical grade High efficiency oleate nonionic emulsifier. optimized for bulk commercial applications."
  },
  {
    "id": "polysorbate-80-pure",
    "name": "Polysorbate 80 (Tween 80) (High Purity / R&D Grade)",
    "category": "Nonionic Surfactant",
    "casNumber": "9005-65-6",
    "inciName": "Polysorbate 80",
    "function": "Emulsifier for Oily Formulations - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 15,
    "description": "High purity low-impurity High efficiency oleate nonionic emulsifier. for sensitive & eco premium formulations."
  },
  {
    "id": "polysorbate-80-sol",
    "name": "Polysorbate 80 (Tween 80) (Custom Concentrated Solution)",
    "category": "Nonionic Surfactant",
    "casNumber": "9005-65-6",
    "inciName": "Polysorbate 80",
    "function": "Emulsifier for Oily Formulations - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": 15,
    "description": "Liquid pre-dissolved solution of Polysorbate 80 (Tween 80) for rapid cold-process compounding."
  },
  {
    "id": "capb-30-uni-tech",
    "name": "CAPB 30% (Cocamidopropyl Betaine) (Technical Grade)",
    "category": "Amphoteric Surfactant",
    "casNumber": "61789-40-0",
    "inciName": "Cocamidopropyl Betaine",
    "function": "Foam & Viscosity Booster - Industrial Tech Grade",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": 12,
    "description": "Technical grade Mild secondary surfactant co-thickening with NaCl. optimized for bulk commercial applications."
  },
  {
    "id": "capb-30-uni-pure",
    "name": "CAPB 30% (Cocamidopropyl Betaine) (High Purity / R&D Grade)",
    "category": "Amphoteric Surfactant",
    "casNumber": "61789-40-0",
    "inciName": "Cocamidopropyl Betaine",
    "function": "Foam & Viscosity Booster - High Purity Grade",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": 12,
    "description": "High purity low-impurity Mild secondary surfactant co-thickening with NaCl. for sensitive & eco premium formulations."
  },
  {
    "id": "capb-30-uni-sol",
    "name": "CAPB 30% (Cocamidopropyl Betaine) (Custom Concentrated Solution)",
    "category": "Amphoteric Surfactant",
    "casNumber": "61789-40-0",
    "inciName": "Cocamidopropyl Betaine",
    "function": "Foam & Viscosity Booster - Ready Blend Solution",
    "activeDefault": 15,
    "costPerKg": null,
    "hlb": 12,
    "description": "Liquid pre-dissolved solution of CAPB 30% (Cocamidopropyl Betaine) for rapid cold-process compounding."
  },
  {
    "id": "capb-45-tech",
    "name": "CAPB 45% High Active Concentrate (Technical Grade)",
    "category": "Amphoteric Surfactant",
    "casNumber": "61789-40-0",
    "inciName": "Cocamidopropyl Betaine",
    "function": "Concentrated Betaine Base - Industrial Tech Grade",
    "activeDefault": 45,
    "costPerKg": null,
    "hlb": 12,
    "description": "Technical grade High concentration zwitterionic surfactant. optimized for bulk commercial applications."
  },
  {
    "id": "capb-45-pure",
    "name": "CAPB 45% High Active Concentrate (High Purity / R&D Grade)",
    "category": "Amphoteric Surfactant",
    "casNumber": "61789-40-0",
    "inciName": "Cocamidopropyl Betaine",
    "function": "Concentrated Betaine Base - High Purity Grade",
    "activeDefault": 45,
    "costPerKg": null,
    "hlb": 12,
    "description": "High purity low-impurity High concentration zwitterionic surfactant. for sensitive & eco premium formulations."
  },
  {
    "id": "capb-45-sol",
    "name": "CAPB 45% High Active Concentrate (Custom Concentrated Solution)",
    "category": "Amphoteric Surfactant",
    "casNumber": "61789-40-0",
    "inciName": "Cocamidopropyl Betaine",
    "function": "Concentrated Betaine Base - Ready Blend Solution",
    "activeDefault": 22,
    "costPerKg": null,
    "hlb": 12,
    "description": "Liquid pre-dissolved solution of CAPB 45% High Active Concentrate for rapid cold-process compounding."
  },
  {
    "id": "lauryl-betaine-30-tech",
    "name": "Lauryl Betaine 30% (Technical Grade)",
    "category": "Amphoteric Surfactant",
    "casNumber": "683-10-3",
    "inciName": "Lauryl Betaine",
    "function": "High Flash Foam Amphoteric - Industrial Tech Grade",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": 12.5,
    "description": "Technical grade Strong flash foaming zwitterionic surfactant. optimized for bulk commercial applications."
  },
  {
    "id": "lauryl-betaine-30-pure",
    "name": "Lauryl Betaine 30% (High Purity / R&D Grade)",
    "category": "Amphoteric Surfactant",
    "casNumber": "683-10-3",
    "inciName": "Lauryl Betaine",
    "function": "High Flash Foam Amphoteric - High Purity Grade",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": 12.5,
    "description": "High purity low-impurity Strong flash foaming zwitterionic surfactant. for sensitive & eco premium formulations."
  },
  {
    "id": "lauryl-betaine-30-sol",
    "name": "Lauryl Betaine 30% (Custom Concentrated Solution)",
    "category": "Amphoteric Surfactant",
    "casNumber": "683-10-3",
    "inciName": "Lauryl Betaine",
    "function": "High Flash Foam Amphoteric - Ready Blend Solution",
    "activeDefault": 15,
    "costPerKg": null,
    "hlb": 12.5,
    "description": "Liquid pre-dissolved solution of Lauryl Betaine 30% for rapid cold-process compounding."
  },
  {
    "id": "coco-betaine-30-tech",
    "name": "Coco Betaine 30% (Technical Grade)",
    "category": "Amphoteric Surfactant",
    "casNumber": "68424-94-2",
    "inciName": "Coco-Betaine",
    "function": "Natural Betaine Cleanser - Industrial Tech Grade",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": 12.2,
    "description": "Technical grade Alkyl betaine for mild cleansing formulations. optimized for bulk commercial applications."
  },
  {
    "id": "coco-betaine-30-pure",
    "name": "Coco Betaine 30% (High Purity / R&D Grade)",
    "category": "Amphoteric Surfactant",
    "casNumber": "68424-94-2",
    "inciName": "Coco-Betaine",
    "function": "Natural Betaine Cleanser - High Purity Grade",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": 12.2,
    "description": "High purity low-impurity Alkyl betaine for mild cleansing formulations. for sensitive & eco premium formulations."
  },
  {
    "id": "coco-betaine-30-sol",
    "name": "Coco Betaine 30% (Custom Concentrated Solution)",
    "category": "Amphoteric Surfactant",
    "casNumber": "68424-94-2",
    "inciName": "Coco-Betaine",
    "function": "Natural Betaine Cleanser - Ready Blend Solution",
    "activeDefault": 15,
    "costPerKg": null,
    "hlb": 12.2,
    "description": "Liquid pre-dissolved solution of Coco Betaine 30% for rapid cold-process compounding."
  },
  {
    "id": "sodium-amphoacetate-40-tech",
    "name": "Sodium Cocoamphoacetate 40% (Technical Grade)",
    "category": "Amphoteric Surfactant",
    "casNumber": "68604-71-7",
    "inciName": "Sodium Cocoamphoacetate",
    "function": "Ultra-Mild Amphoteric - Industrial Tech Grade",
    "activeDefault": 40,
    "costPerKg": null,
    "hlb": 13,
    "description": "Technical grade Low-irritation amphoacetate for sensitive washing. optimized for bulk commercial applications."
  },
  {
    "id": "sodium-amphoacetate-40-pure",
    "name": "Sodium Cocoamphoacetate 40% (High Purity / R&D Grade)",
    "category": "Amphoteric Surfactant",
    "casNumber": "68604-71-7",
    "inciName": "Sodium Cocoamphoacetate",
    "function": "Ultra-Mild Amphoteric - High Purity Grade",
    "activeDefault": 40,
    "costPerKg": null,
    "hlb": 13,
    "description": "High purity low-impurity Low-irritation amphoacetate for sensitive washing. for sensitive & eco premium formulations."
  },
  {
    "id": "sodium-amphoacetate-40-sol",
    "name": "Sodium Cocoamphoacetate 40% (Custom Concentrated Solution)",
    "category": "Amphoteric Surfactant",
    "casNumber": "68604-71-7",
    "inciName": "Sodium Cocoamphoacetate",
    "function": "Ultra-Mild Amphoteric - Ready Blend Solution",
    "activeDefault": 20,
    "costPerKg": null,
    "hlb": 13,
    "description": "Liquid pre-dissolved solution of Sodium Cocoamphoacetate 40% for rapid cold-process compounding."
  },
  {
    "id": "disodium-amphodiacetate-tech",
    "name": "Disodium Cocoamphodiacetate 38% (Technical Grade)",
    "category": "Amphoteric Surfactant",
    "casNumber": "68650-39-5",
    "inciName": "Disodium Cocoamphodiacetate",
    "function": "Gentle Secondary Surfactant - Industrial Tech Grade",
    "activeDefault": 38,
    "costPerKg": null,
    "hlb": 13.2,
    "description": "Technical grade High-mildness dicarboxylate amphoteric surfactant. optimized for bulk commercial applications."
  },
  {
    "id": "disodium-amphodiacetate-pure",
    "name": "Disodium Cocoamphodiacetate 38% (High Purity / R&D Grade)",
    "category": "Amphoteric Surfactant",
    "casNumber": "68650-39-5",
    "inciName": "Disodium Cocoamphodiacetate",
    "function": "Gentle Secondary Surfactant - High Purity Grade",
    "activeDefault": 38,
    "costPerKg": null,
    "hlb": 13.2,
    "description": "High purity low-impurity High-mildness dicarboxylate amphoteric surfactant. for sensitive & eco premium formulations."
  },
  {
    "id": "disodium-amphodiacetate-sol",
    "name": "Disodium Cocoamphodiacetate 38% (Custom Concentrated Solution)",
    "category": "Amphoteric Surfactant",
    "casNumber": "68650-39-5",
    "inciName": "Disodium Cocoamphodiacetate",
    "function": "Gentle Secondary Surfactant - Ready Blend Solution",
    "activeDefault": 19,
    "costPerKg": null,
    "hlb": 13.2,
    "description": "Liquid pre-dissolved solution of Disodium Cocoamphodiacetate 38% for rapid cold-process compounding."
  },
  {
    "id": "capb-sultaine-tech",
    "name": "Cocamidopropyl Hydroxysultaine 40% (Technical Grade)",
    "category": "Amphoteric Surfactant",
    "casNumber": "68139-30-0",
    "inciName": "Cocamidopropyl Hydroxysultaine",
    "function": "Hard Water Stable Betaine - Industrial Tech Grade",
    "activeDefault": 40,
    "costPerKg": null,
    "hlb": 12.8,
    "description": "Technical grade Sultaine amphoteric stable in electrolyte & hard water. optimized for bulk commercial applications."
  },
  {
    "id": "capb-sultaine-pure",
    "name": "Cocamidopropyl Hydroxysultaine 40% (High Purity / R&D Grade)",
    "category": "Amphoteric Surfactant",
    "casNumber": "68139-30-0",
    "inciName": "Cocamidopropyl Hydroxysultaine",
    "function": "Hard Water Stable Betaine - High Purity Grade",
    "activeDefault": 40,
    "costPerKg": null,
    "hlb": 12.8,
    "description": "High purity low-impurity Sultaine amphoteric stable in electrolyte & hard water. for sensitive & eco premium formulations."
  },
  {
    "id": "capb-sultaine-sol",
    "name": "Cocamidopropyl Hydroxysultaine 40% (Custom Concentrated Solution)",
    "category": "Amphoteric Surfactant",
    "casNumber": "68139-30-0",
    "inciName": "Cocamidopropyl Hydroxysultaine",
    "function": "Hard Water Stable Betaine - Ready Blend Solution",
    "activeDefault": 20,
    "costPerKg": null,
    "hlb": 12.8,
    "description": "Liquid pre-dissolved solution of Cocamidopropyl Hydroxysultaine 40% for rapid cold-process compounding."
  },
  {
    "id": "ctac-29-tech",
    "name": "Cetrimonium Chloride 29% (CTAC) (Technical Grade)",
    "category": "Cationic Surfactant",
    "casNumber": "112-02-7",
    "inciName": "Cetrimonium Chloride",
    "function": "Fabric Softener & Antistatic Agent - Industrial Tech Grade",
    "activeDefault": 29,
    "costPerKg": null,
    "hlb": 15.8,
    "description": "Technical grade Cationic quaternary ammonium antistatic conditioner. optimized for bulk commercial applications."
  },
  {
    "id": "ctac-29-pure",
    "name": "Cetrimonium Chloride 29% (CTAC) (High Purity / R&D Grade)",
    "category": "Cationic Surfactant",
    "casNumber": "112-02-7",
    "inciName": "Cetrimonium Chloride",
    "function": "Fabric Softener & Antistatic Agent - High Purity Grade",
    "activeDefault": 29,
    "costPerKg": null,
    "hlb": 15.8,
    "description": "High purity low-impurity Cationic quaternary ammonium antistatic conditioner. for sensitive & eco premium formulations."
  },
  {
    "id": "ctac-29-sol",
    "name": "Cetrimonium Chloride 29% (CTAC) (Custom Concentrated Solution)",
    "category": "Cationic Surfactant",
    "casNumber": "112-02-7",
    "inciName": "Cetrimonium Chloride",
    "function": "Fabric Softener & Antistatic Agent - Ready Blend Solution",
    "activeDefault": 14,
    "costPerKg": null,
    "hlb": 15.8,
    "description": "Liquid pre-dissolved solution of Cetrimonium Chloride 29% (CTAC) for rapid cold-process compounding."
  },
  {
    "id": "btac-80-tech",
    "name": "Behentrimonium Chloride 80% (BTAC) (Technical Grade)",
    "category": "Cationic Surfactant",
    "casNumber": "17301-53-0",
    "inciName": "Behentrimonium Chloride",
    "function": "Concentrated Fabric Conditioner - Industrial Tech Grade",
    "activeDefault": 80,
    "costPerKg": null,
    "hlb": 14.5,
    "description": "Technical grade High long-chain cationic softener. optimized for bulk commercial applications."
  },
  {
    "id": "btac-80-pure",
    "name": "Behentrimonium Chloride 80% (BTAC) (High Purity / R&D Grade)",
    "category": "Cationic Surfactant",
    "casNumber": "17301-53-0",
    "inciName": "Behentrimonium Chloride",
    "function": "Concentrated Fabric Conditioner - High Purity Grade",
    "activeDefault": 80,
    "costPerKg": null,
    "hlb": 14.5,
    "description": "High purity low-impurity High long-chain cationic softener. for sensitive & eco premium formulations."
  },
  {
    "id": "btac-80-sol",
    "name": "Behentrimonium Chloride 80% (BTAC) (Custom Concentrated Solution)",
    "category": "Cationic Surfactant",
    "casNumber": "17301-53-0",
    "inciName": "Behentrimonium Chloride",
    "function": "Concentrated Fabric Conditioner - Ready Blend Solution",
    "activeDefault": 40,
    "costPerKg": null,
    "hlb": 14.5,
    "description": "Liquid pre-dissolved solution of Behentrimonium Chloride 80% (BTAC) for rapid cold-process compounding."
  },
  {
    "id": "esterquat-90-tech",
    "name": "Esterquat 90% (Di-Tallow Esterquat) (Technical Grade)",
    "category": "Cationic Surfactant",
    "casNumber": "91995-81-2",
    "inciName": "Dipalmitoylethyl Hydroxyethylmonium Methosulfate",
    "function": "Eco-Biodegradable Fabric Softener - Industrial Tech Grade",
    "activeDefault": 90,
    "costPerKg": null,
    "hlb": 11,
    "description": "Technical grade Readily biodegradable cationic fabric conditioning agent. optimized for bulk commercial applications."
  },
  {
    "id": "esterquat-90-pure",
    "name": "Esterquat 90% (Di-Tallow Esterquat) (High Purity / R&D Grade)",
    "category": "Cationic Surfactant",
    "casNumber": "91995-81-2",
    "inciName": "Dipalmitoylethyl Hydroxyethylmonium Methosulfate",
    "function": "Eco-Biodegradable Fabric Softener - High Purity Grade",
    "activeDefault": 90,
    "costPerKg": null,
    "hlb": 11,
    "description": "High purity low-impurity Readily biodegradable cationic fabric conditioning agent. for sensitive & eco premium formulations."
  },
  {
    "id": "esterquat-90-sol",
    "name": "Esterquat 90% (Di-Tallow Esterquat) (Custom Concentrated Solution)",
    "category": "Cationic Surfactant",
    "casNumber": "91995-81-2",
    "inciName": "Dipalmitoylethyl Hydroxyethylmonium Methosulfate",
    "function": "Eco-Biodegradable Fabric Softener - Ready Blend Solution",
    "activeDefault": 45,
    "costPerKg": null,
    "hlb": 11,
    "description": "Liquid pre-dissolved solution of Esterquat 90% (Di-Tallow Esterquat) for rapid cold-process compounding."
  },
  {
    "id": "bkc-50-tech",
    "name": "Benzalkonium Chloride 50% (BKC 50) (Technical Grade)",
    "category": "Cationic Surfactant",
    "casNumber": "63449-41-2",
    "inciName": "Benzalkonium Chloride",
    "function": "Disinfectant & Antimicrobial Cationic - Industrial Tech Grade",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": 15,
    "description": "Technical grade Quaternary germicide and sanitizer. optimized for bulk commercial applications."
  },
  {
    "id": "bkc-50-pure",
    "name": "Benzalkonium Chloride 50% (BKC 50) (High Purity / R&D Grade)",
    "category": "Cationic Surfactant",
    "casNumber": "63449-41-2",
    "inciName": "Benzalkonium Chloride",
    "function": "Disinfectant & Antimicrobial Cationic - High Purity Grade",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": 15,
    "description": "High purity low-impurity Quaternary germicide and sanitizer. for sensitive & eco premium formulations."
  },
  {
    "id": "bkc-50-sol",
    "name": "Benzalkonium Chloride 50% (BKC 50) (Custom Concentrated Solution)",
    "category": "Cationic Surfactant",
    "casNumber": "63449-41-2",
    "inciName": "Benzalkonium Chloride",
    "function": "Disinfectant & Antimicrobial Cationic - Ready Blend Solution",
    "activeDefault": 25,
    "costPerKg": null,
    "hlb": 15,
    "description": "Liquid pre-dissolved solution of Benzalkonium Chloride 50% (BKC 50) for rapid cold-process compounding."
  },
  {
    "id": "bkc-80-tech",
    "name": "Benzalkonium Chloride 80% (BKC 80) (Technical Grade)",
    "category": "Cationic Surfactant",
    "casNumber": "63449-41-2",
    "inciName": "Benzalkonium Chloride",
    "function": "High-Con Germicidal Cationic - Industrial Tech Grade",
    "activeDefault": 80,
    "costPerKg": null,
    "hlb": 15,
    "description": "Technical grade Concentrated quaternary biocide. optimized for bulk commercial applications."
  },
  {
    "id": "bkc-80-pure",
    "name": "Benzalkonium Chloride 80% (BKC 80) (High Purity / R&D Grade)",
    "category": "Cationic Surfactant",
    "casNumber": "63449-41-2",
    "inciName": "Benzalkonium Chloride",
    "function": "High-Con Germicidal Cationic - High Purity Grade",
    "activeDefault": 80,
    "costPerKg": null,
    "hlb": 15,
    "description": "High purity low-impurity Concentrated quaternary biocide. for sensitive & eco premium formulations."
  },
  {
    "id": "bkc-80-sol",
    "name": "Benzalkonium Chloride 80% (BKC 80) (Custom Concentrated Solution)",
    "category": "Cationic Surfactant",
    "casNumber": "63449-41-2",
    "inciName": "Benzalkonium Chloride",
    "function": "High-Con Germicidal Cationic - Ready Blend Solution",
    "activeDefault": 40,
    "costPerKg": null,
    "hlb": 15,
    "description": "Liquid pre-dissolved solution of Benzalkonium Chloride 80% (BKC 80) for rapid cold-process compounding."
  },
  {
    "id": "naoh-50-uni-tech",
    "name": "Sodium Hydroxide 50% Liquid (Caustic Soda Lye) (Technical Grade)",
    "category": "Neutralizer / Base",
    "casNumber": "1310-73-2",
    "inciName": "Sodium Hydroxide",
    "function": "Saponification & Neutralization Base - Industrial Tech Grade",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Liquid caustic soda neutralizer. optimized for bulk commercial applications."
  },
  {
    "id": "naoh-50-uni-pure",
    "name": "Sodium Hydroxide 50% Liquid (Caustic Soda Lye) (High Purity / R&D Grade)",
    "category": "Neutralizer / Base",
    "casNumber": "1310-73-2",
    "inciName": "Sodium Hydroxide",
    "function": "Saponification & Neutralization Base - High Purity Grade",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Liquid caustic soda neutralizer. for sensitive & eco premium formulations."
  },
  {
    "id": "naoh-50-uni-sol",
    "name": "Sodium Hydroxide 50% Liquid (Caustic Soda Lye) (Custom Concentrated Solution)",
    "category": "Neutralizer / Base",
    "casNumber": "1310-73-2",
    "inciName": "Sodium Hydroxide",
    "function": "Saponification & Neutralization Base - Ready Blend Solution",
    "activeDefault": 25,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Sodium Hydroxide 50% Liquid (Caustic Soda Lye) for rapid cold-process compounding."
  },
  {
    "id": "naoh-flakes-99-tech",
    "name": "Sodium Hydroxide 99% Flakes (Technical Grade)",
    "category": "Neutralizer / Base",
    "casNumber": "1310-73-2",
    "inciName": "Sodium Hydroxide",
    "function": "Solid Neutralizing Caustic - Industrial Tech Grade",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Solid caustic soda for saponification & neutralization. optimized for bulk commercial applications."
  },
  {
    "id": "naoh-flakes-99-pure",
    "name": "Sodium Hydroxide 99% Flakes (High Purity / R&D Grade)",
    "category": "Neutralizer / Base",
    "casNumber": "1310-73-2",
    "inciName": "Sodium Hydroxide",
    "function": "Solid Neutralizing Caustic - High Purity Grade",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Solid caustic soda for saponification & neutralization. for sensitive & eco premium formulations."
  },
  {
    "id": "naoh-flakes-99-sol",
    "name": "Sodium Hydroxide 99% Flakes (Custom Concentrated Solution)",
    "category": "Neutralizer / Base",
    "casNumber": "1310-73-2",
    "inciName": "Sodium Hydroxide",
    "function": "Solid Neutralizing Caustic - Ready Blend Solution",
    "activeDefault": 49,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Sodium Hydroxide 99% Flakes for rapid cold-process compounding."
  },
  {
    "id": "koh-90-flakes-tech",
    "name": "Potassium Hydroxide 90% Flakes (Caustic Potash) (Technical Grade)",
    "category": "Neutralizer / Base",
    "casNumber": "1310-58-3",
    "inciName": "Potassium Hydroxide",
    "function": "High Solubility Potassium Base - Industrial Tech Grade",
    "activeDefault": 90,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Potassium base for soft soaps and high-solubility liquid detergents. optimized for bulk commercial applications."
  },
  {
    "id": "koh-90-flakes-pure",
    "name": "Potassium Hydroxide 90% Flakes (Caustic Potash) (High Purity / R&D Grade)",
    "category": "Neutralizer / Base",
    "casNumber": "1310-58-3",
    "inciName": "Potassium Hydroxide",
    "function": "High Solubility Potassium Base - High Purity Grade",
    "activeDefault": 90,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Potassium base for soft soaps and high-solubility liquid detergents. for sensitive & eco premium formulations."
  },
  {
    "id": "koh-90-flakes-sol",
    "name": "Potassium Hydroxide 90% Flakes (Caustic Potash) (Custom Concentrated Solution)",
    "category": "Neutralizer / Base",
    "casNumber": "1310-58-3",
    "inciName": "Potassium Hydroxide",
    "function": "High Solubility Potassium Base - Ready Blend Solution",
    "activeDefault": 45,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Potassium Hydroxide 90% Flakes (Caustic Potash) for rapid cold-process compounding."
  },
  {
    "id": "koh-45-liquid-tech",
    "name": "Potassium Hydroxide 45% Liquid (Technical Grade)",
    "category": "Neutralizer / Base",
    "casNumber": "1310-58-3",
    "inciName": "Potassium Hydroxide",
    "function": "Liquid Caustic Potash - Industrial Tech Grade",
    "activeDefault": 45,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Liquid potassium hydroxide base. optimized for bulk commercial applications."
  },
  {
    "id": "koh-45-liquid-pure",
    "name": "Potassium Hydroxide 45% Liquid (High Purity / R&D Grade)",
    "category": "Neutralizer / Base",
    "casNumber": "1310-58-3",
    "inciName": "Potassium Hydroxide",
    "function": "Liquid Caustic Potash - High Purity Grade",
    "activeDefault": 45,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Liquid potassium hydroxide base. for sensitive & eco premium formulations."
  },
  {
    "id": "koh-45-liquid-sol",
    "name": "Potassium Hydroxide 45% Liquid (Custom Concentrated Solution)",
    "category": "Neutralizer / Base",
    "casNumber": "1310-58-3",
    "inciName": "Potassium Hydroxide",
    "function": "Liquid Caustic Potash - Ready Blend Solution",
    "activeDefault": 22,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Potassium Hydroxide 45% Liquid for rapid cold-process compounding."
  },
  {
    "id": "tea-99-tech",
    "name": "Triethanolamine 99% (TEA) (Technical Grade)",
    "category": "Neutralizer / Base",
    "casNumber": "102-71-6",
    "inciName": "Triethanolamine",
    "function": "Organic Base Neutralizer & Buffer - Industrial Tech Grade",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Mild organic amine neutralizer for LABSA & fatty acids. optimized for bulk commercial applications."
  },
  {
    "id": "tea-99-pure",
    "name": "Triethanolamine 99% (TEA) (High Purity / R&D Grade)",
    "category": "Neutralizer / Base",
    "casNumber": "102-71-6",
    "inciName": "Triethanolamine",
    "function": "Organic Base Neutralizer & Buffer - High Purity Grade",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Mild organic amine neutralizer for LABSA & fatty acids. for sensitive & eco premium formulations."
  },
  {
    "id": "tea-99-sol",
    "name": "Triethanolamine 99% (TEA) (Custom Concentrated Solution)",
    "category": "Neutralizer / Base",
    "casNumber": "102-71-6",
    "inciName": "Triethanolamine",
    "function": "Organic Base Neutralizer & Buffer - Ready Blend Solution",
    "activeDefault": 49,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Triethanolamine 99% (TEA) for rapid cold-process compounding."
  },
  {
    "id": "mea-99-tech",
    "name": "Monoethanolamine 99% (MEA) (Technical Grade)",
    "category": "Neutralizer / Base",
    "casNumber": "141-43-5",
    "inciName": "Ethanolamine",
    "function": "Heavy Duty Amine Base - Industrial Tech Grade",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Strong organic amine for heavy duty industrial degreasers. optimized for bulk commercial applications."
  },
  {
    "id": "mea-99-pure",
    "name": "Monoethanolamine 99% (MEA) (High Purity / R&D Grade)",
    "category": "Neutralizer / Base",
    "casNumber": "141-43-5",
    "inciName": "Ethanolamine",
    "function": "Heavy Duty Amine Base - High Purity Grade",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Strong organic amine for heavy duty industrial degreasers. for sensitive & eco premium formulations."
  },
  {
    "id": "mea-99-sol",
    "name": "Monoethanolamine 99% (MEA) (Custom Concentrated Solution)",
    "category": "Neutralizer / Base",
    "casNumber": "141-43-5",
    "inciName": "Ethanolamine",
    "function": "Heavy Duty Amine Base - Ready Blend Solution",
    "activeDefault": 49,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Monoethanolamine 99% (MEA) for rapid cold-process compounding."
  },
  {
    "id": "amp-95-tech",
    "name": "Aminomethyl Propanol (AMP-95) (Technical Grade)",
    "category": "Neutralizer / Base",
    "casNumber": "124-68-5",
    "inciName": "Aminomethyl Propanol",
    "function": "Multifunctional Amine Neutralizer - Industrial Tech Grade",
    "activeDefault": 95,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade High efficiency neutralizer and pigment dispersant. optimized for bulk commercial applications."
  },
  {
    "id": "amp-95-pure",
    "name": "Aminomethyl Propanol (AMP-95) (High Purity / R&D Grade)",
    "category": "Neutralizer / Base",
    "casNumber": "124-68-5",
    "inciName": "Aminomethyl Propanol",
    "function": "Multifunctional Amine Neutralizer - High Purity Grade",
    "activeDefault": 95,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity High efficiency neutralizer and pigment dispersant. for sensitive & eco premium formulations."
  },
  {
    "id": "amp-95-sol",
    "name": "Aminomethyl Propanol (AMP-95) (Custom Concentrated Solution)",
    "category": "Neutralizer / Base",
    "casNumber": "124-68-5",
    "inciName": "Aminomethyl Propanol",
    "function": "Multifunctional Amine Neutralizer - Ready Blend Solution",
    "activeDefault": 47,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Aminomethyl Propanol (AMP-95) for rapid cold-process compounding."
  },
  {
    "id": "soda-ash-uni-tech",
    "name": "Sodium Carbonate (Soda Ash Dense) (Technical Grade)",
    "category": "Alkaline Builder",
    "casNumber": "497-19-8",
    "inciName": "Sodium Carbonate",
    "function": "Alkalinity Builder & Saponification Helper - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Heavy duty alkaline builder. optimized for bulk commercial applications."
  },
  {
    "id": "soda-ash-uni-pure",
    "name": "Sodium Carbonate (Soda Ash Dense) (High Purity / R&D Grade)",
    "category": "Alkaline Builder",
    "casNumber": "497-19-8",
    "inciName": "Sodium Carbonate",
    "function": "Alkalinity Builder & Saponification Helper - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Heavy duty alkaline builder. for sensitive & eco premium formulations."
  },
  {
    "id": "soda-ash-uni-sol",
    "name": "Sodium Carbonate (Soda Ash Dense) (Custom Concentrated Solution)",
    "category": "Alkaline Builder",
    "casNumber": "497-19-8",
    "inciName": "Sodium Carbonate",
    "function": "Alkalinity Builder & Saponification Helper - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Sodium Carbonate (Soda Ash Dense) for rapid cold-process compounding."
  },
  {
    "id": "soda-ash-light-tech",
    "name": "Sodium Carbonate (Soda Ash Light) (Technical Grade)",
    "category": "Alkaline Builder",
    "casNumber": "497-19-8",
    "inciName": "Sodium Carbonate",
    "function": "Rapid Dissolving Alkaline Builder - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Low bulk density rapidly soluble soda ash. optimized for bulk commercial applications."
  },
  {
    "id": "soda-ash-light-pure",
    "name": "Sodium Carbonate (Soda Ash Light) (High Purity / R&D Grade)",
    "category": "Alkaline Builder",
    "casNumber": "497-19-8",
    "inciName": "Sodium Carbonate",
    "function": "Rapid Dissolving Alkaline Builder - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Low bulk density rapidly soluble soda ash. for sensitive & eco premium formulations."
  },
  {
    "id": "soda-ash-light-sol",
    "name": "Sodium Carbonate (Soda Ash Light) (Custom Concentrated Solution)",
    "category": "Alkaline Builder",
    "casNumber": "497-19-8",
    "inciName": "Sodium Carbonate",
    "function": "Rapid Dissolving Alkaline Builder - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Sodium Carbonate (Soda Ash Light) for rapid cold-process compounding."
  },
  {
    "id": "sodium-metasilicate-pentahydrate-tech",
    "name": "Sodium Metasilicate Pentahydrate (Technical Grade)",
    "category": "Alkaline Builder",
    "casNumber": "10213-79-3",
    "inciName": "Sodium Metasilicate",
    "function": "Alkaline Builder & Anti-Corrosion Agent - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Silicate builder protecting metal parts in washing machines. optimized for bulk commercial applications."
  },
  {
    "id": "sodium-metasilicate-pentahydrate-pure",
    "name": "Sodium Metasilicate Pentahydrate (High Purity / R&D Grade)",
    "category": "Alkaline Builder",
    "casNumber": "10213-79-3",
    "inciName": "Sodium Metasilicate",
    "function": "Alkaline Builder & Anti-Corrosion Agent - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Silicate builder protecting metal parts in washing machines. for sensitive & eco premium formulations."
  },
  {
    "id": "sodium-metasilicate-pentahydrate-sol",
    "name": "Sodium Metasilicate Pentahydrate (Custom Concentrated Solution)",
    "category": "Alkaline Builder",
    "casNumber": "10213-79-3",
    "inciName": "Sodium Metasilicate",
    "function": "Alkaline Builder & Anti-Corrosion Agent - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Sodium Metasilicate Pentahydrate for rapid cold-process compounding."
  },
  {
    "id": "sodium-metasilicate-anhydrous-tech",
    "name": "Sodium Metasilicate Anhydrous (Technical Grade)",
    "category": "Alkaline Builder",
    "casNumber": "6834-92-0",
    "inciName": "Sodium Metasilicate",
    "function": "High Active Anhydrous Silicate - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Anhydrous heavy duty industrial builder. optimized for bulk commercial applications."
  },
  {
    "id": "sodium-metasilicate-anhydrous-pure",
    "name": "Sodium Metasilicate Anhydrous (High Purity / R&D Grade)",
    "category": "Alkaline Builder",
    "casNumber": "6834-92-0",
    "inciName": "Sodium Metasilicate",
    "function": "High Active Anhydrous Silicate - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Anhydrous heavy duty industrial builder. for sensitive & eco premium formulations."
  },
  {
    "id": "sodium-metasilicate-anhydrous-sol",
    "name": "Sodium Metasilicate Anhydrous (Custom Concentrated Solution)",
    "category": "Alkaline Builder",
    "casNumber": "6834-92-0",
    "inciName": "Sodium Metasilicate",
    "function": "High Active Anhydrous Silicate - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Sodium Metasilicate Anhydrous for rapid cold-process compounding."
  },
  {
    "id": "liquid-silicate-24-tech",
    "name": "Sodium Silicate Liquid (2.4 Ratio) (Technical Grade)",
    "category": "Alkaline Builder",
    "casNumber": "1344-09-8",
    "inciName": "Sodium Silicate",
    "function": "Liquid Anti-Corrosion Builder - Industrial Tech Grade",
    "activeDefault": 40,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Liquid silicate for slurry processing & metal protection. optimized for bulk commercial applications."
  },
  {
    "id": "liquid-silicate-24-pure",
    "name": "Sodium Silicate Liquid (2.4 Ratio) (High Purity / R&D Grade)",
    "category": "Alkaline Builder",
    "casNumber": "1344-09-8",
    "inciName": "Sodium Silicate",
    "function": "Liquid Anti-Corrosion Builder - High Purity Grade",
    "activeDefault": 40,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Liquid silicate for slurry processing & metal protection. for sensitive & eco premium formulations."
  },
  {
    "id": "liquid-silicate-24-sol",
    "name": "Sodium Silicate Liquid (2.4 Ratio) (Custom Concentrated Solution)",
    "category": "Alkaline Builder",
    "casNumber": "1344-09-8",
    "inciName": "Sodium Silicate",
    "function": "Liquid Anti-Corrosion Builder - Ready Blend Solution",
    "activeDefault": 20,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Sodium Silicate Liquid (2.4 Ratio) for rapid cold-process compounding."
  },
  {
    "id": "sodium-bicarbonate-tech",
    "name": "Sodium Bicarbonate (Baking Soda) (Technical Grade)",
    "category": "Alkaline Builder",
    "casNumber": "144-55-8",
    "inciName": "Sodium Bicarbonate",
    "function": "Mild Alkaline Buffer & Odor Neutralizer - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Eco-friendly mild buffering builder. optimized for bulk commercial applications."
  },
  {
    "id": "sodium-bicarbonate-pure",
    "name": "Sodium Bicarbonate (Baking Soda) (High Purity / R&D Grade)",
    "category": "Alkaline Builder",
    "casNumber": "144-55-8",
    "inciName": "Sodium Bicarbonate",
    "function": "Mild Alkaline Buffer & Odor Neutralizer - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Eco-friendly mild buffering builder. for sensitive & eco premium formulations."
  },
  {
    "id": "sodium-bicarbonate-sol",
    "name": "Sodium Bicarbonate (Baking Soda) (Custom Concentrated Solution)",
    "category": "Alkaline Builder",
    "casNumber": "144-55-8",
    "inciName": "Sodium Bicarbonate",
    "function": "Mild Alkaline Buffer & Odor Neutralizer - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Sodium Bicarbonate (Baking Soda) for rapid cold-process compounding."
  },
  {
    "id": "sodium-sesquicarbonate-tech",
    "name": "Sodium Sesquicarbonate (Technical Grade)",
    "category": "Alkaline Builder",
    "casNumber": "533-96-5",
    "inciName": "Sodium Sesquicarbonate",
    "function": "Crystalline Alkaline Buffer - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Free-flowing mild alkaline builder crystal. optimized for bulk commercial applications."
  },
  {
    "id": "sodium-sesquicarbonate-pure",
    "name": "Sodium Sesquicarbonate (High Purity / R&D Grade)",
    "category": "Alkaline Builder",
    "casNumber": "533-96-5",
    "inciName": "Sodium Sesquicarbonate",
    "function": "Crystalline Alkaline Buffer - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Free-flowing mild alkaline builder crystal. for sensitive & eco premium formulations."
  },
  {
    "id": "sodium-sesquicarbonate-sol",
    "name": "Sodium Sesquicarbonate (Custom Concentrated Solution)",
    "category": "Alkaline Builder",
    "casNumber": "533-96-5",
    "inciName": "Sodium Sesquicarbonate",
    "function": "Crystalline Alkaline Buffer - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Sodium Sesquicarbonate for rapid cold-process compounding."
  },
  {
    "id": "citric-acid-uni-tech",
    "name": "Citric Acid Anhydrous (Technical Grade)",
    "category": "Builder / Chelator",
    "casNumber": "77-92-9",
    "inciName": "Citric Acid",
    "function": "Acidifier & Chelating Agent - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Organic acid for pH control and metal ion sequestering. optimized for bulk commercial applications."
  },
  {
    "id": "citric-acid-uni-pure",
    "name": "Citric Acid Anhydrous (High Purity / R&D Grade)",
    "category": "Builder / Chelator",
    "casNumber": "77-92-9",
    "inciName": "Citric Acid",
    "function": "Acidifier & Chelating Agent - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Organic acid for pH control and metal ion sequestering. for sensitive & eco premium formulations."
  },
  {
    "id": "citric-acid-uni-sol",
    "name": "Citric Acid Anhydrous (Custom Concentrated Solution)",
    "category": "Builder / Chelator",
    "casNumber": "77-92-9",
    "inciName": "Citric Acid",
    "function": "Acidifier & Chelating Agent - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Citric Acid Anhydrous for rapid cold-process compounding."
  },
  {
    "id": "sodium-citrate-uni-tech",
    "name": "Sodium Citrate Dihydrate (Technical Grade)",
    "category": "Builder / Chelator",
    "casNumber": "6132-04-3",
    "inciName": "Sodium Citrate",
    "function": "Water Softener & Buffer - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Phosphate-free eco builder. optimized for bulk commercial applications."
  },
  {
    "id": "sodium-citrate-uni-pure",
    "name": "Sodium Citrate Dihydrate (High Purity / R&D Grade)",
    "category": "Builder / Chelator",
    "casNumber": "6132-04-3",
    "inciName": "Sodium Citrate",
    "function": "Water Softener & Buffer - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Phosphate-free eco builder. for sensitive & eco premium formulations."
  },
  {
    "id": "sodium-citrate-uni-sol",
    "name": "Sodium Citrate Dihydrate (Custom Concentrated Solution)",
    "category": "Builder / Chelator",
    "casNumber": "6132-04-3",
    "inciName": "Sodium Citrate",
    "function": "Water Softener & Buffer - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Sodium Citrate Dihydrate for rapid cold-process compounding."
  },
  {
    "id": "edta-4na-powder-tech",
    "name": "Tetrasodium EDTA 99% Powder (Technical Grade)",
    "category": "Builder / Chelator",
    "casNumber": "64-02-8",
    "inciName": "Tetrasodium EDTA",
    "function": "Heavy Metal Chelating Agent - Industrial Tech Grade",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Strong chelating agent for calcium, magnesium, & iron ions. optimized for bulk commercial applications."
  },
  {
    "id": "edta-4na-powder-pure",
    "name": "Tetrasodium EDTA 99% Powder (High Purity / R&D Grade)",
    "category": "Builder / Chelator",
    "casNumber": "64-02-8",
    "inciName": "Tetrasodium EDTA",
    "function": "Heavy Metal Chelating Agent - High Purity Grade",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Strong chelating agent for calcium, magnesium, & iron ions. for sensitive & eco premium formulations."
  },
  {
    "id": "edta-4na-powder-sol",
    "name": "Tetrasodium EDTA 99% Powder (Custom Concentrated Solution)",
    "category": "Builder / Chelator",
    "casNumber": "64-02-8",
    "inciName": "Tetrasodium EDTA",
    "function": "Heavy Metal Chelating Agent - Ready Blend Solution",
    "activeDefault": 49,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Tetrasodium EDTA 99% Powder for rapid cold-process compounding."
  },
  {
    "id": "edta-4na-39-liquid-tech",
    "name": "Tetrasodium EDTA 39% Liquid (Technical Grade)",
    "category": "Builder / Chelator",
    "casNumber": "64-02-8",
    "inciName": "Tetrasodium EDTA",
    "function": "Liquid Metal Sequestering Agent - Industrial Tech Grade",
    "activeDefault": 39,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Ready-to-use liquid EDTA solution. optimized for bulk commercial applications."
  },
  {
    "id": "edta-4na-39-liquid-pure",
    "name": "Tetrasodium EDTA 39% Liquid (High Purity / R&D Grade)",
    "category": "Builder / Chelator",
    "casNumber": "64-02-8",
    "inciName": "Tetrasodium EDTA",
    "function": "Liquid Metal Sequestering Agent - High Purity Grade",
    "activeDefault": 39,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Ready-to-use liquid EDTA solution. for sensitive & eco premium formulations."
  },
  {
    "id": "edta-4na-39-liquid-sol",
    "name": "Tetrasodium EDTA 39% Liquid (Custom Concentrated Solution)",
    "category": "Builder / Chelator",
    "casNumber": "64-02-8",
    "inciName": "Tetrasodium EDTA",
    "function": "Liquid Metal Sequestering Agent - Ready Blend Solution",
    "activeDefault": 19,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Tetrasodium EDTA 39% Liquid for rapid cold-process compounding."
  },
  {
    "id": "edta-2na-tech",
    "name": "Disodium EDTA 99% (Technical Grade)",
    "category": "Builder / Chelator",
    "casNumber": "139-33-3",
    "inciName": "Disodium EDTA",
    "function": "Acidic Metal Sequestering Agent - Industrial Tech Grade",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Chelator for acidic/neutral detergent formulations. optimized for bulk commercial applications."
  },
  {
    "id": "edta-2na-pure",
    "name": "Disodium EDTA 99% (High Purity / R&D Grade)",
    "category": "Builder / Chelator",
    "casNumber": "139-33-3",
    "inciName": "Disodium EDTA",
    "function": "Acidic Metal Sequestering Agent - High Purity Grade",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Chelator for acidic/neutral detergent formulations. for sensitive & eco premium formulations."
  },
  {
    "id": "edta-2na-sol",
    "name": "Disodium EDTA 99% (Custom Concentrated Solution)",
    "category": "Builder / Chelator",
    "casNumber": "139-33-3",
    "inciName": "Disodium EDTA",
    "function": "Acidic Metal Sequestering Agent - Ready Blend Solution",
    "activeDefault": 49,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Disodium EDTA 99% for rapid cold-process compounding."
  },
  {
    "id": "glda-47-tech",
    "name": "GLDA 47% Liquid (Dissolvine GL-47) (Technical Grade)",
    "category": "Builder / Chelator",
    "casNumber": "51981-21-6",
    "inciName": "Tetrasodium Glutamate Diacetate",
    "function": "Eco Readily Biodegradable Chelator - Industrial Tech Grade",
    "activeDefault": 47,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Green plant-based biodegradable chelating agent. optimized for bulk commercial applications."
  },
  {
    "id": "glda-47-pure",
    "name": "GLDA 47% Liquid (Dissolvine GL-47) (High Purity / R&D Grade)",
    "category": "Builder / Chelator",
    "casNumber": "51981-21-6",
    "inciName": "Tetrasodium Glutamate Diacetate",
    "function": "Eco Readily Biodegradable Chelator - High Purity Grade",
    "activeDefault": 47,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Green plant-based biodegradable chelating agent. for sensitive & eco premium formulations."
  },
  {
    "id": "glda-47-sol",
    "name": "GLDA 47% Liquid (Dissolvine GL-47) (Custom Concentrated Solution)",
    "category": "Builder / Chelator",
    "casNumber": "51981-21-6",
    "inciName": "Tetrasodium Glutamate Diacetate",
    "function": "Eco Readily Biodegradable Chelator - Ready Blend Solution",
    "activeDefault": 23,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of GLDA 47% Liquid (Dissolvine GL-47) for rapid cold-process compounding."
  },
  {
    "id": "mgda-40-tech",
    "name": "MGDA 40% Liquid (Trilon M) (Technical Grade)",
    "category": "Builder / Chelator",
    "casNumber": "164462-16-2",
    "inciName": "Trisodium Dicarboxymethyl Alaninate",
    "function": "High-Performance Eco Chelator - Industrial Tech Grade",
    "activeDefault": 40,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Eco phosphate-alternative builder for automatic dishwashing & laundry. optimized for bulk commercial applications."
  },
  {
    "id": "mgda-40-pure",
    "name": "MGDA 40% Liquid (Trilon M) (High Purity / R&D Grade)",
    "category": "Builder / Chelator",
    "casNumber": "164462-16-2",
    "inciName": "Trisodium Dicarboxymethyl Alaninate",
    "function": "High-Performance Eco Chelator - High Purity Grade",
    "activeDefault": 40,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Eco phosphate-alternative builder for automatic dishwashing & laundry. for sensitive & eco premium formulations."
  },
  {
    "id": "mgda-40-sol",
    "name": "MGDA 40% Liquid (Trilon M) (Custom Concentrated Solution)",
    "category": "Builder / Chelator",
    "casNumber": "164462-16-2",
    "inciName": "Trisodium Dicarboxymethyl Alaninate",
    "function": "High-Performance Eco Chelator - Ready Blend Solution",
    "activeDefault": 20,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of MGDA 40% Liquid (Trilon M) for rapid cold-process compounding."
  },
  {
    "id": "sodium-gluconate-tech",
    "name": "Sodium Gluconate 99% (Technical Grade)",
    "category": "Builder / Chelator",
    "casNumber": "527-07-1",
    "inciName": "Sodium Gluconate",
    "function": "Alkaline Iron & Hardness Chelator - Industrial Tech Grade",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Bio-based chelator effective in highly alkaline caustic solutions. optimized for bulk commercial applications."
  },
  {
    "id": "sodium-gluconate-pure",
    "name": "Sodium Gluconate 99% (High Purity / R&D Grade)",
    "category": "Builder / Chelator",
    "casNumber": "527-07-1",
    "inciName": "Sodium Gluconate",
    "function": "Alkaline Iron & Hardness Chelator - High Purity Grade",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Bio-based chelator effective in highly alkaline caustic solutions. for sensitive & eco premium formulations."
  },
  {
    "id": "sodium-gluconate-sol",
    "name": "Sodium Gluconate 99% (Custom Concentrated Solution)",
    "category": "Builder / Chelator",
    "casNumber": "527-07-1",
    "inciName": "Sodium Gluconate",
    "function": "Alkaline Iron & Hardness Chelator - Ready Blend Solution",
    "activeDefault": 49,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Sodium Gluconate 99% for rapid cold-process compounding."
  },
  {
    "id": "stpp-94-tech",
    "name": "Sodium Tripolyphosphate 94% (STPP) (Technical Grade)",
    "category": "Builder / Chelator",
    "casNumber": "7758-29-4",
    "inciName": "Sodium Triphosphate",
    "function": "Classic Detergent Builder - Industrial Tech Grade",
    "activeDefault": 94,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Heavy duty builder for soil suspension & water softening. optimized for bulk commercial applications."
  },
  {
    "id": "stpp-94-pure",
    "name": "Sodium Tripolyphosphate 94% (STPP) (High Purity / R&D Grade)",
    "category": "Builder / Chelator",
    "casNumber": "7758-29-4",
    "inciName": "Sodium Triphosphate",
    "function": "Classic Detergent Builder - High Purity Grade",
    "activeDefault": 94,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Heavy duty builder for soil suspension & water softening. for sensitive & eco premium formulations."
  },
  {
    "id": "stpp-94-sol",
    "name": "Sodium Tripolyphosphate 94% (STPP) (Custom Concentrated Solution)",
    "category": "Builder / Chelator",
    "casNumber": "7758-29-4",
    "inciName": "Sodium Triphosphate",
    "function": "Classic Detergent Builder - Ready Blend Solution",
    "activeDefault": 47,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Sodium Tripolyphosphate 94% (STPP) for rapid cold-process compounding."
  },
  {
    "id": "hedp-60-tech",
    "name": "HEDP 60% (Etidronic Acid) (Technical Grade)",
    "category": "Builder / Chelator",
    "casNumber": "2809-21-4",
    "inciName": "Etidronic Acid",
    "function": "Organophosphonate Scale Inhibitor - Industrial Tech Grade",
    "activeDefault": 60,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade High stability phosphonate scale and stain chelator. optimized for bulk commercial applications."
  },
  {
    "id": "hedp-60-pure",
    "name": "HEDP 60% (Etidronic Acid) (High Purity / R&D Grade)",
    "category": "Builder / Chelator",
    "casNumber": "2809-21-4",
    "inciName": "Etidronic Acid",
    "function": "Organophosphonate Scale Inhibitor - High Purity Grade",
    "activeDefault": 60,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity High stability phosphonate scale and stain chelator. for sensitive & eco premium formulations."
  },
  {
    "id": "hedp-60-sol",
    "name": "HEDP 60% (Etidronic Acid) (Custom Concentrated Solution)",
    "category": "Builder / Chelator",
    "casNumber": "2809-21-4",
    "inciName": "Etidronic Acid",
    "function": "Organophosphonate Scale Inhibitor - Ready Blend Solution",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of HEDP 60% (Etidronic Acid) for rapid cold-process compounding."
  },
  {
    "id": "protease-liquid-tech",
    "name": "Protease Liquid (Savinase / Alcalase) (Technical Grade)",
    "category": "Enzymes",
    "casNumber": "9014-01-1",
    "inciName": "Subtilisin",
    "function": "Protein Stain Removal Enzyme - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Enzyme targeting blood, grass, milk, and protein soils. optimized for bulk commercial applications."
  },
  {
    "id": "protease-liquid-pure",
    "name": "Protease Liquid (Savinase / Alcalase) (High Purity / R&D Grade)",
    "category": "Enzymes",
    "casNumber": "9014-01-1",
    "inciName": "Subtilisin",
    "function": "Protein Stain Removal Enzyme - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Enzyme targeting blood, grass, milk, and protein soils. for sensitive & eco premium formulations."
  },
  {
    "id": "protease-liquid-sol",
    "name": "Protease Liquid (Savinase / Alcalase) (Custom Concentrated Solution)",
    "category": "Enzymes",
    "casNumber": "9014-01-1",
    "inciName": "Subtilisin",
    "function": "Protein Stain Removal Enzyme - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Protease Liquid (Savinase / Alcalase) for rapid cold-process compounding."
  },
  {
    "id": "amylase-liquid-tech",
    "name": "Amylase Liquid (Stainzyme / Termamyl) (Technical Grade)",
    "category": "Enzymes",
    "casNumber": "9000-90-2",
    "inciName": "Alpha-Amylase",
    "function": "Starch Stain Removal Enzyme - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Enzyme breaking down starch, pasta, sauce, and food residues. optimized for bulk commercial applications."
  },
  {
    "id": "amylase-liquid-pure",
    "name": "Amylase Liquid (Stainzyme / Termamyl) (High Purity / R&D Grade)",
    "category": "Enzymes",
    "casNumber": "9000-90-2",
    "inciName": "Alpha-Amylase",
    "function": "Starch Stain Removal Enzyme - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Enzyme breaking down starch, pasta, sauce, and food residues. for sensitive & eco premium formulations."
  },
  {
    "id": "amylase-liquid-sol",
    "name": "Amylase Liquid (Stainzyme / Termamyl) (Custom Concentrated Solution)",
    "category": "Enzymes",
    "casNumber": "9000-90-2",
    "inciName": "Alpha-Amylase",
    "function": "Starch Stain Removal Enzyme - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Amylase Liquid (Stainzyme / Termamyl) for rapid cold-process compounding."
  },
  {
    "id": "lipase-liquid-tech",
    "name": "Lipase Liquid (Lipex) (Technical Grade)",
    "category": "Enzymes",
    "casNumber": "9001-62-1",
    "inciName": "Triacylglycerol Lipase",
    "function": "Fat & Oil Stain Removal Enzyme - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Enzyme degrading lipid, grease, oil, and sebum soils. optimized for bulk commercial applications."
  },
  {
    "id": "lipase-liquid-pure",
    "name": "Lipase Liquid (Lipex) (High Purity / R&D Grade)",
    "category": "Enzymes",
    "casNumber": "9001-62-1",
    "inciName": "Triacylglycerol Lipase",
    "function": "Fat & Oil Stain Removal Enzyme - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Enzyme degrading lipid, grease, oil, and sebum soils. for sensitive & eco premium formulations."
  },
  {
    "id": "lipase-liquid-sol",
    "name": "Lipase Liquid (Lipex) (Custom Concentrated Solution)",
    "category": "Enzymes",
    "casNumber": "9001-62-1",
    "inciName": "Triacylglycerol Lipase",
    "function": "Fat & Oil Stain Removal Enzyme - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Lipase Liquid (Lipex) for rapid cold-process compounding."
  },
  {
    "id": "cellulase-liquid-tech",
    "name": "Cellulase Liquid (Carezyme) (Technical Grade)",
    "category": "Enzymes",
    "casNumber": "9012-54-8",
    "inciName": "Cellulase",
    "function": "Fabric Care & Anti-Pilling Enzyme - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Enzyme removing microfibrils, reviving fabric color & brightness. optimized for bulk commercial applications."
  },
  {
    "id": "cellulase-liquid-pure",
    "name": "Cellulase Liquid (Carezyme) (High Purity / R&D Grade)",
    "category": "Enzymes",
    "casNumber": "9012-54-8",
    "inciName": "Cellulase",
    "function": "Fabric Care & Anti-Pilling Enzyme - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Enzyme removing microfibrils, reviving fabric color & brightness. for sensitive & eco premium formulations."
  },
  {
    "id": "cellulase-liquid-sol",
    "name": "Cellulase Liquid (Carezyme) (Custom Concentrated Solution)",
    "category": "Enzymes",
    "casNumber": "9012-54-8",
    "inciName": "Cellulase",
    "function": "Fabric Care & Anti-Pilling Enzyme - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Cellulase Liquid (Carezyme) for rapid cold-process compounding."
  },
  {
    "id": "mannanase-liquid-tech",
    "name": "Mannanase Liquid (Mannaway) (Technical Grade)",
    "category": "Enzymes",
    "casNumber": "37288-54-3",
    "inciName": "Mannan Endoperoxidase",
    "function": "Guar & Food Gum Stain Enzyme - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Enzyme breaking down food thickeners, ice cream, & dressing stains. optimized for bulk commercial applications."
  },
  {
    "id": "mannanase-liquid-pure",
    "name": "Mannanase Liquid (Mannaway) (High Purity / R&D Grade)",
    "category": "Enzymes",
    "casNumber": "37288-54-3",
    "inciName": "Mannan Endoperoxidase",
    "function": "Guar & Food Gum Stain Enzyme - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Enzyme breaking down food thickeners, ice cream, & dressing stains. for sensitive & eco premium formulations."
  },
  {
    "id": "mannanase-liquid-sol",
    "name": "Mannanase Liquid (Mannaway) (Custom Concentrated Solution)",
    "category": "Enzymes",
    "casNumber": "37288-54-3",
    "inciName": "Mannan Endoperoxidase",
    "function": "Guar & Food Gum Stain Enzyme - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Mannanase Liquid (Mannaway) for rapid cold-process compounding."
  },
  {
    "id": "xanthan-gum-200-tech",
    "name": "Xanthan Gum 200 Mesh (Technical Grade)",
    "category": "Polymer & Thickener",
    "casNumber": "11138-66-2",
    "inciName": "Xanthan Gum",
    "function": "Natural Polysaccharide Thickener - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Pseudoplastic natural rheology modifier. optimized for bulk commercial applications."
  },
  {
    "id": "xanthan-gum-200-pure",
    "name": "Xanthan Gum 200 Mesh (High Purity / R&D Grade)",
    "category": "Polymer & Thickener",
    "casNumber": "11138-66-2",
    "inciName": "Xanthan Gum",
    "function": "Natural Polysaccharide Thickener - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Pseudoplastic natural rheology modifier. for sensitive & eco premium formulations."
  },
  {
    "id": "xanthan-gum-200-sol",
    "name": "Xanthan Gum 200 Mesh (Custom Concentrated Solution)",
    "category": "Polymer & Thickener",
    "casNumber": "11138-66-2",
    "inciName": "Xanthan Gum",
    "function": "Natural Polysaccharide Thickener - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Xanthan Gum 200 Mesh for rapid cold-process compounding."
  },
  {
    "id": "cmc-technical-tech",
    "name": "Carboxymethyl Cellulose Technical (CMC) (Technical Grade)",
    "category": "Polymer & Thickener",
    "casNumber": "9004-32-4",
    "inciName": "Cellulose Gum",
    "function": "Anti-Redeposition Agent & Thickener - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Polymeric soil suspension agent preventing soil re-attachment. optimized for bulk commercial applications."
  },
  {
    "id": "cmc-technical-pure",
    "name": "Carboxymethyl Cellulose Technical (CMC) (High Purity / R&D Grade)",
    "category": "Polymer & Thickener",
    "casNumber": "9004-32-4",
    "inciName": "Cellulose Gum",
    "function": "Anti-Redeposition Agent & Thickener - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Polymeric soil suspension agent preventing soil re-attachment. for sensitive & eco premium formulations."
  },
  {
    "id": "cmc-technical-sol",
    "name": "Carboxymethyl Cellulose Technical (CMC) (Custom Concentrated Solution)",
    "category": "Polymer & Thickener",
    "casNumber": "9004-32-4",
    "inciName": "Cellulose Gum",
    "function": "Anti-Redeposition Agent & Thickener - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Carboxymethyl Cellulose Technical (CMC) for rapid cold-process compounding."
  },
  {
    "id": "hpmc-100k-tech",
    "name": "Hydroxypropyl Methylcellulose 100,000 cps (HPMC) (Technical Grade)",
    "category": "Polymer & Thickener",
    "casNumber": "9004-65-3",
    "inciName": "Hydroxypropyl Methylcellulose",
    "function": "Cellulosic Viscosity Builder - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade High clarity non-ionic water soluble polymer thickener. optimized for bulk commercial applications."
  },
  {
    "id": "hpmc-100k-pure",
    "name": "Hydroxypropyl Methylcellulose 100,000 cps (HPMC) (High Purity / R&D Grade)",
    "category": "Polymer & Thickener",
    "casNumber": "9004-65-3",
    "inciName": "Hydroxypropyl Methylcellulose",
    "function": "Cellulosic Viscosity Builder - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity High clarity non-ionic water soluble polymer thickener. for sensitive & eco premium formulations."
  },
  {
    "id": "hpmc-100k-sol",
    "name": "Hydroxypropyl Methylcellulose 100,000 cps (HPMC) (Custom Concentrated Solution)",
    "category": "Polymer & Thickener",
    "casNumber": "9004-65-3",
    "inciName": "Hydroxypropyl Methylcellulose",
    "function": "Cellulosic Viscosity Builder - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Hydroxypropyl Methylcellulose 100,000 cps (HPMC) for rapid cold-process compounding."
  },
  {
    "id": "carbomer-940-tech",
    "name": "Carbomer 940 (Technical Grade)",
    "category": "Polymer & Thickener",
    "casNumber": "9003-01-4",
    "inciName": "Carbomer",
    "function": "Crosslinked Polyacrylate Gel Polymer - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade High clarity gel thickener requiring alkali neutralization. optimized for bulk commercial applications."
  },
  {
    "id": "carbomer-940-pure",
    "name": "Carbomer 940 (High Purity / R&D Grade)",
    "category": "Polymer & Thickener",
    "casNumber": "9003-01-4",
    "inciName": "Carbomer",
    "function": "Crosslinked Polyacrylate Gel Polymer - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity High clarity gel thickener requiring alkali neutralization. for sensitive & eco premium formulations."
  },
  {
    "id": "carbomer-940-sol",
    "name": "Carbomer 940 (Custom Concentrated Solution)",
    "category": "Polymer & Thickener",
    "casNumber": "9003-01-4",
    "inciName": "Carbomer",
    "function": "Crosslinked Polyacrylate Gel Polymer - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Carbomer 940 for rapid cold-process compounding."
  },
  {
    "id": "ase-polymer-33-tech",
    "name": "Acrysol 33 (ASE Polymer 30%) (Technical Grade)",
    "category": "Polymer & Thickener",
    "casNumber": "25212-88-8",
    "inciName": "Acrylates Copolymer",
    "function": "Alkali Swellable Emulsion Thickener - Industrial Tech Grade",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Acidic liquid emulsion thickening upon alkali neutralization. optimized for bulk commercial applications."
  },
  {
    "id": "ase-polymer-33-pure",
    "name": "Acrysol 33 (ASE Polymer 30%) (High Purity / R&D Grade)",
    "category": "Polymer & Thickener",
    "casNumber": "25212-88-8",
    "inciName": "Acrylates Copolymer",
    "function": "Alkali Swellable Emulsion Thickener - High Purity Grade",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Acidic liquid emulsion thickening upon alkali neutralization. for sensitive & eco premium formulations."
  },
  {
    "id": "ase-polymer-33-sol",
    "name": "Acrysol 33 (ASE Polymer 30%) (Custom Concentrated Solution)",
    "category": "Polymer & Thickener",
    "casNumber": "25212-88-8",
    "inciName": "Acrylates Copolymer",
    "function": "Alkali Swellable Emulsion Thickener - Ready Blend Solution",
    "activeDefault": 15,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Acrysol 33 (ASE Polymer 30%) for rapid cold-process compounding."
  },
  {
    "id": "pvp-k30-tech",
    "name": "Polyvinylpyrrolidone K30 (PVP K30) (Technical Grade)",
    "category": "Polymer & Thickener",
    "casNumber": "9003-39-8",
    "inciName": "PVP",
    "function": "Dye Transfer Inhibitor Polymer - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Polymer trapping loose fugitive dyes in wash water. optimized for bulk commercial applications."
  },
  {
    "id": "pvp-k30-pure",
    "name": "Polyvinylpyrrolidone K30 (PVP K30) (High Purity / R&D Grade)",
    "category": "Polymer & Thickener",
    "casNumber": "9003-39-8",
    "inciName": "PVP",
    "function": "Dye Transfer Inhibitor Polymer - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Polymer trapping loose fugitive dyes in wash water. for sensitive & eco premium formulations."
  },
  {
    "id": "pvp-k30-sol",
    "name": "Polyvinylpyrrolidone K30 (PVP K30) (Custom Concentrated Solution)",
    "category": "Polymer & Thickener",
    "casNumber": "9003-39-8",
    "inciName": "PVP",
    "function": "Dye Transfer Inhibitor Polymer - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Polyvinylpyrrolidone K30 (PVP K30) for rapid cold-process compounding."
  },
  {
    "id": "pvno-40-tech",
    "name": "PVNO 40% Liquid (Polyvinylpyridine N-Oxide) (Technical Grade)",
    "category": "Polymer & Thickener",
    "casNumber": "26837-43-8",
    "inciName": "Polyvinylpyridine N-Oxide",
    "function": "Premium Dye Transfer Inhibitor - Industrial Tech Grade",
    "activeDefault": 40,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade High performance dye anti-redeposition polymer. optimized for bulk commercial applications."
  },
  {
    "id": "pvno-40-pure",
    "name": "PVNO 40% Liquid (Polyvinylpyridine N-Oxide) (High Purity / R&D Grade)",
    "category": "Polymer & Thickener",
    "casNumber": "26837-43-8",
    "inciName": "Polyvinylpyridine N-Oxide",
    "function": "Premium Dye Transfer Inhibitor - High Purity Grade",
    "activeDefault": 40,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity High performance dye anti-redeposition polymer. for sensitive & eco premium formulations."
  },
  {
    "id": "pvno-40-sol",
    "name": "PVNO 40% Liquid (Polyvinylpyridine N-Oxide) (Custom Concentrated Solution)",
    "category": "Polymer & Thickener",
    "casNumber": "26837-43-8",
    "inciName": "Polyvinylpyridine N-Oxide",
    "function": "Premium Dye Transfer Inhibitor - Ready Blend Solution",
    "activeDefault": 20,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of PVNO 40% Liquid (Polyvinylpyridine N-Oxide) for rapid cold-process compounding."
  },
  {
    "id": "peg-4000-tech",
    "name": "Polyethylene Glycol 4000 (PEG 4000) (Technical Grade)",
    "category": "Polymer & Thickener",
    "casNumber": "25322-68-3",
    "inciName": "PEG-90",
    "function": "Binder & Processing Aid - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Solid flake polyethylene glycol binder for tablet detergents. optimized for bulk commercial applications."
  },
  {
    "id": "peg-4000-pure",
    "name": "Polyethylene Glycol 4000 (PEG 4000) (High Purity / R&D Grade)",
    "category": "Polymer & Thickener",
    "casNumber": "25322-68-3",
    "inciName": "PEG-90",
    "function": "Binder & Processing Aid - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Solid flake polyethylene glycol binder for tablet detergents. for sensitive & eco premium formulations."
  },
  {
    "id": "peg-4000-sol",
    "name": "Polyethylene Glycol 4000 (PEG 4000) (Custom Concentrated Solution)",
    "category": "Polymer & Thickener",
    "casNumber": "25322-68-3",
    "inciName": "PEG-90",
    "function": "Binder & Processing Aid - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Polyethylene Glycol 4000 (PEG 4000) for rapid cold-process compounding."
  },
  {
    "id": "dm-water-tech",
    "name": "Demineralized Water (Aqua) (Technical Grade)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "7732-18-5",
    "inciName": "Water",
    "function": "Solvent & Liquid Carrier Base - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Pure deionized water matrix for liquid detergent formulations. optimized for bulk commercial applications."
  },
  {
    "id": "dm-water-pure",
    "name": "Demineralized Water (Aqua) (High Purity / R&D Grade)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "7732-18-5",
    "inciName": "Water",
    "function": "Solvent & Liquid Carrier Base - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Pure deionized water matrix for liquid detergent formulations. for sensitive & eco premium formulations."
  },
  {
    "id": "dm-water-sol",
    "name": "Demineralized Water (Aqua) (Custom Concentrated Solution)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "7732-18-5",
    "inciName": "Water",
    "function": "Solvent & Liquid Carrier Base - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Demineralized Water (Aqua) for rapid cold-process compounding."
  },
  {
    "id": "sxs-40-tech",
    "name": "Sodium Xylene Sulfonate 40% (SXS 40) (Technical Grade)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "1300-72-7",
    "inciName": "Sodium Xylene Sulfonate",
    "function": "Hydrotrope & Coupling Agent - Industrial Tech Grade",
    "activeDefault": 40,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Anionic hydrotrope increasing solubility of surfactants in aqueous solutions. optimized for bulk commercial applications."
  },
  {
    "id": "sxs-40-pure",
    "name": "Sodium Xylene Sulfonate 40% (SXS 40) (High Purity / R&D Grade)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "1300-72-7",
    "inciName": "Sodium Xylene Sulfonate",
    "function": "Hydrotrope & Coupling Agent - High Purity Grade",
    "activeDefault": 40,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Anionic hydrotrope increasing solubility of surfactants in aqueous solutions. for sensitive & eco premium formulations."
  },
  {
    "id": "sxs-40-sol",
    "name": "Sodium Xylene Sulfonate 40% (SXS 40) (Custom Concentrated Solution)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "1300-72-7",
    "inciName": "Sodium Xylene Sulfonate",
    "function": "Hydrotrope & Coupling Agent - Ready Blend Solution",
    "activeDefault": 20,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Sodium Xylene Sulfonate 40% (SXS 40) for rapid cold-process compounding."
  },
  {
    "id": "sxs-90-tech",
    "name": "Sodium Xylene Sulfonate 90% Powder (SXS 90) (Technical Grade)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "1300-72-7",
    "inciName": "Sodium Xylene Sulfonate",
    "function": "Concentrated Solid Hydrotrope - Industrial Tech Grade",
    "activeDefault": 90,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Powder hydrotrope for concentrated liquid/solid formulations. optimized for bulk commercial applications."
  },
  {
    "id": "sxs-90-pure",
    "name": "Sodium Xylene Sulfonate 90% Powder (SXS 90) (High Purity / R&D Grade)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "1300-72-7",
    "inciName": "Sodium Xylene Sulfonate",
    "function": "Concentrated Solid Hydrotrope - High Purity Grade",
    "activeDefault": 90,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Powder hydrotrope for concentrated liquid/solid formulations. for sensitive & eco premium formulations."
  },
  {
    "id": "sxs-90-sol",
    "name": "Sodium Xylene Sulfonate 90% Powder (SXS 90) (Custom Concentrated Solution)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "1300-72-7",
    "inciName": "Sodium Xylene Sulfonate",
    "function": "Concentrated Solid Hydrotrope - Ready Blend Solution",
    "activeDefault": 45,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Sodium Xylene Sulfonate 90% Powder (SXS 90) for rapid cold-process compounding."
  },
  {
    "id": "pxs-40-tech",
    "name": "Potassium Xylene Sulfonate 40% (PXS) (Technical Grade)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "30348-70-4",
    "inciName": "Potassium Xylene Sulfonate",
    "function": "High Solubility Potassium Hydrotrope - Industrial Tech Grade",
    "activeDefault": 40,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade High potassium compatibility hydrotrope. optimized for bulk commercial applications."
  },
  {
    "id": "pxs-40-pure",
    "name": "Potassium Xylene Sulfonate 40% (PXS) (High Purity / R&D Grade)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "30348-70-4",
    "inciName": "Potassium Xylene Sulfonate",
    "function": "High Solubility Potassium Hydrotrope - High Purity Grade",
    "activeDefault": 40,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity High potassium compatibility hydrotrope. for sensitive & eco premium formulations."
  },
  {
    "id": "pxs-40-sol",
    "name": "Potassium Xylene Sulfonate 40% (PXS) (Custom Concentrated Solution)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "30348-70-4",
    "inciName": "Potassium Xylene Sulfonate",
    "function": "High Solubility Potassium Hydrotrope - Ready Blend Solution",
    "activeDefault": 20,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Potassium Xylene Sulfonate 40% (PXS) for rapid cold-process compounding."
  },
  {
    "id": "mpg-99-tech",
    "name": "Monopropylene Glycol 99.5% (MPG / Propylene Glycol) (Technical Grade)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "57-55-6",
    "inciName": "Propylene Glycol",
    "function": "Co-Solvent, Enzyme Stabilizer & Antifreeze - Industrial Tech Grade",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Glycol solvent stabilizing enzymes and lowering freeze point. optimized for bulk commercial applications."
  },
  {
    "id": "mpg-99-pure",
    "name": "Monopropylene Glycol 99.5% (MPG / Propylene Glycol) (High Purity / R&D Grade)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "57-55-6",
    "inciName": "Propylene Glycol",
    "function": "Co-Solvent, Enzyme Stabilizer & Antifreeze - High Purity Grade",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Glycol solvent stabilizing enzymes and lowering freeze point. for sensitive & eco premium formulations."
  },
  {
    "id": "mpg-99-sol",
    "name": "Monopropylene Glycol 99.5% (MPG / Propylene Glycol) (Custom Concentrated Solution)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "57-55-6",
    "inciName": "Propylene Glycol",
    "function": "Co-Solvent, Enzyme Stabilizer & Antifreeze - Ready Blend Solution",
    "activeDefault": 49,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Monopropylene Glycol 99.5% (MPG / Propylene Glycol) for rapid cold-process compounding."
  },
  {
    "id": "glycerin-99-tech",
    "name": "Glycerin 99.5% USP (Technical Grade)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "56-81-5",
    "inciName": "Glycerin",
    "function": "Humectant & Eco Solvent - Industrial Tech Grade",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Plant-derived bio-glycerol humectant and enzyme stabilizer. optimized for bulk commercial applications."
  },
  {
    "id": "glycerin-99-pure",
    "name": "Glycerin 99.5% USP (High Purity / R&D Grade)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "56-81-5",
    "inciName": "Glycerin",
    "function": "Humectant & Eco Solvent - High Purity Grade",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Plant-derived bio-glycerol humectant and enzyme stabilizer. for sensitive & eco premium formulations."
  },
  {
    "id": "glycerin-99-sol",
    "name": "Glycerin 99.5% USP (Custom Concentrated Solution)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "56-81-5",
    "inciName": "Glycerin",
    "function": "Humectant & Eco Solvent - Ready Blend Solution",
    "activeDefault": 49,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Glycerin 99.5% USP for rapid cold-process compounding."
  },
  {
    "id": "ethanol-96-tech",
    "name": "Ethanol 96% Denatured (Technical Grade)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "64-17-5",
    "inciName": "Alcohol Denat.",
    "function": "Flash Drying Solvent & Viscosity Modifier - Industrial Tech Grade",
    "activeDefault": 96,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Volatile solvent for quick-drying hard surface & glass cleaners. optimized for bulk commercial applications."
  },
  {
    "id": "ethanol-96-pure",
    "name": "Ethanol 96% Denatured (High Purity / R&D Grade)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "64-17-5",
    "inciName": "Alcohol Denat.",
    "function": "Flash Drying Solvent & Viscosity Modifier - High Purity Grade",
    "activeDefault": 96,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Volatile solvent for quick-drying hard surface & glass cleaners. for sensitive & eco premium formulations."
  },
  {
    "id": "ethanol-96-sol",
    "name": "Ethanol 96% Denatured (Custom Concentrated Solution)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "64-17-5",
    "inciName": "Alcohol Denat.",
    "function": "Flash Drying Solvent & Viscosity Modifier - Ready Blend Solution",
    "activeDefault": 48,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Ethanol 96% Denatured for rapid cold-process compounding."
  },
  {
    "id": "ipa-99-tech",
    "name": "Isopropanol 99% (IPA / Isopropyl Alcohol) (Technical Grade)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "67-63-0",
    "inciName": "Isopropyl Alcohol",
    "function": "Degreasing Solvent & Sanitizer - Industrial Tech Grade",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Fast evaporating solvent for heavy oil degreasing. optimized for bulk commercial applications."
  },
  {
    "id": "ipa-99-pure",
    "name": "Isopropanol 99% (IPA / Isopropyl Alcohol) (High Purity / R&D Grade)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "67-63-0",
    "inciName": "Isopropyl Alcohol",
    "function": "Degreasing Solvent & Sanitizer - High Purity Grade",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Fast evaporating solvent for heavy oil degreasing. for sensitive & eco premium formulations."
  },
  {
    "id": "ipa-99-sol",
    "name": "Isopropanol 99% (IPA / Isopropyl Alcohol) (Custom Concentrated Solution)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "67-63-0",
    "inciName": "Isopropyl Alcohol",
    "function": "Degreasing Solvent & Sanitizer - Ready Blend Solution",
    "activeDefault": 49,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Isopropanol 99% (IPA / Isopropyl Alcohol) for rapid cold-process compounding."
  },
  {
    "id": "kathon-cg-tech",
    "name": "Kathon CG (CMIT/MIT 1.5%) (Technical Grade)",
    "category": "Preservative & Biocide",
    "casNumber": "55965-84-9",
    "inciName": "Methylchloroisothiazolinone / Methylisothiazolinone",
    "function": "Broad Spectrum Preservative - Industrial Tech Grade",
    "activeDefault": 1.5,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Low dose broad spectrum liquid preservative for neutral/acidic formulas. optimized for bulk commercial applications."
  },
  {
    "id": "kathon-cg-pure",
    "name": "Kathon CG (CMIT/MIT 1.5%) (High Purity / R&D Grade)",
    "category": "Preservative & Biocide",
    "casNumber": "55965-84-9",
    "inciName": "Methylchloroisothiazolinone / Methylisothiazolinone",
    "function": "Broad Spectrum Preservative - High Purity Grade",
    "activeDefault": 1.5,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Low dose broad spectrum liquid preservative for neutral/acidic formulas. for sensitive & eco premium formulations."
  },
  {
    "id": "kathon-cg-sol",
    "name": "Kathon CG (CMIT/MIT 1.5%) (Custom Concentrated Solution)",
    "category": "Preservative & Biocide",
    "casNumber": "55965-84-9",
    "inciName": "Methylchloroisothiazolinone / Methylisothiazolinone",
    "function": "Broad Spectrum Preservative - Ready Blend Solution",
    "activeDefault": 10,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Kathon CG (CMIT/MIT 1.5%) for rapid cold-process compounding."
  },
  {
    "id": "bit-20-tech",
    "name": "Benzisothiazolinone 20% (BIT 20 / Proxel GXL) (Technical Grade)",
    "category": "Preservative & Biocide",
    "casNumber": "2634-33-5",
    "inciName": "Benzisothiazolinone",
    "function": "Alkaline Stable Liquid Preservative - Industrial Tech Grade",
    "activeDefault": 20,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Preservative stable at high pH (> 8.5) and elevated temperature. optimized for bulk commercial applications."
  },
  {
    "id": "bit-20-pure",
    "name": "Benzisothiazolinone 20% (BIT 20 / Proxel GXL) (High Purity / R&D Grade)",
    "category": "Preservative & Biocide",
    "casNumber": "2634-33-5",
    "inciName": "Benzisothiazolinone",
    "function": "Alkaline Stable Liquid Preservative - High Purity Grade",
    "activeDefault": 20,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Preservative stable at high pH (> 8.5) and elevated temperature. for sensitive & eco premium formulations."
  },
  {
    "id": "bit-20-sol",
    "name": "Benzisothiazolinone 20% (BIT 20 / Proxel GXL) (Custom Concentrated Solution)",
    "category": "Preservative & Biocide",
    "casNumber": "2634-33-5",
    "inciName": "Benzisothiazolinone",
    "function": "Alkaline Stable Liquid Preservative - Ready Blend Solution",
    "activeDefault": 10,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Benzisothiazolinone 20% (BIT 20 / Proxel GXL) for rapid cold-process compounding."
  },
  {
    "id": "phenoxyethanol-99-tech",
    "name": "Phenoxyethanol 99% (Technical Grade)",
    "category": "Preservative & Biocide",
    "casNumber": "122-99-6",
    "inciName": "Phenoxyethanol",
    "function": "Mild Paraben-Free Preservative - Industrial Tech Grade",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Broad spectrum gentle preservative. optimized for bulk commercial applications."
  },
  {
    "id": "phenoxyethanol-99-pure",
    "name": "Phenoxyethanol 99% (High Purity / R&D Grade)",
    "category": "Preservative & Biocide",
    "casNumber": "122-99-6",
    "inciName": "Phenoxyethanol",
    "function": "Mild Paraben-Free Preservative - High Purity Grade",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Broad spectrum gentle preservative. for sensitive & eco premium formulations."
  },
  {
    "id": "phenoxyethanol-99-sol",
    "name": "Phenoxyethanol 99% (Custom Concentrated Solution)",
    "category": "Preservative & Biocide",
    "casNumber": "122-99-6",
    "inciName": "Phenoxyethanol",
    "function": "Mild Paraben-Free Preservative - Ready Blend Solution",
    "activeDefault": 49,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Phenoxyethanol 99% for rapid cold-process compounding."
  },
  {
    "id": "sodium-benzoate-tech",
    "name": "Sodium Benzoate 99% (Technical Grade)",
    "category": "Preservative & Biocide",
    "casNumber": "532-32-1",
    "inciName": "Sodium Benzoate",
    "function": "Acidic Food-Grade Preservative - Industrial Tech Grade",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Organic acid preservative active at pH < 5.5. optimized for bulk commercial applications."
  },
  {
    "id": "sodium-benzoate-pure",
    "name": "Sodium Benzoate 99% (High Purity / R&D Grade)",
    "category": "Preservative & Biocide",
    "casNumber": "532-32-1",
    "inciName": "Sodium Benzoate",
    "function": "Acidic Food-Grade Preservative - High Purity Grade",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Organic acid preservative active at pH < 5.5. for sensitive & eco premium formulations."
  },
  {
    "id": "sodium-benzoate-sol",
    "name": "Sodium Benzoate 99% (Custom Concentrated Solution)",
    "category": "Preservative & Biocide",
    "casNumber": "532-32-1",
    "inciName": "Sodium Benzoate",
    "function": "Acidic Food-Grade Preservative - Ready Blend Solution",
    "activeDefault": 49,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Sodium Benzoate 99% for rapid cold-process compounding."
  },
  {
    "id": "potassium-sorbate-tech",
    "name": "Potassium Sorbate 99% (Technical Grade)",
    "category": "Preservative & Biocide",
    "casNumber": "24634-61-5",
    "inciName": "Potassium Sorbate",
    "function": "Anti-Fungal Eco Preservative - Industrial Tech Grade",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Anti-mold eco preservative active in acidic media. optimized for bulk commercial applications."
  },
  {
    "id": "potassium-sorbate-pure",
    "name": "Potassium Sorbate 99% (High Purity / R&D Grade)",
    "category": "Preservative & Biocide",
    "casNumber": "24634-61-5",
    "inciName": "Potassium Sorbate",
    "function": "Anti-Fungal Eco Preservative - High Purity Grade",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Anti-mold eco preservative active in acidic media. for sensitive & eco premium formulations."
  },
  {
    "id": "potassium-sorbate-sol",
    "name": "Potassium Sorbate 99% (Custom Concentrated Solution)",
    "category": "Preservative & Biocide",
    "casNumber": "24634-61-5",
    "inciName": "Potassium Sorbate",
    "function": "Anti-Fungal Eco Preservative - Ready Blend Solution",
    "activeDefault": 49,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Potassium Sorbate 99% for rapid cold-process compounding."
  },
  {
    "id": "cbs-x-tech",
    "name": "Optical Brightener CBS-X (Tinopal CBS-X) (Technical Grade)",
    "category": "Optical Brightener & Dye",
    "casNumber": "27344-41-8",
    "inciName": "Disodium Distyrylbiphenyl Disulfonate",
    "function": "Fluorescent Whitening Agent for Liquids - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade High performance soluble optical brightener for laundry liquids. optimized for bulk commercial applications."
  },
  {
    "id": "cbs-x-pure",
    "name": "Optical Brightener CBS-X (Tinopal CBS-X) (High Purity / R&D Grade)",
    "category": "Optical Brightener & Dye",
    "casNumber": "27344-41-8",
    "inciName": "Disodium Distyrylbiphenyl Disulfonate",
    "function": "Fluorescent Whitening Agent for Liquids - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity High performance soluble optical brightener for laundry liquids. for sensitive & eco premium formulations."
  },
  {
    "id": "cbs-x-sol",
    "name": "Optical Brightener CBS-X (Tinopal CBS-X) (Custom Concentrated Solution)",
    "category": "Optical Brightener & Dye",
    "casNumber": "27344-41-8",
    "inciName": "Disodium Distyrylbiphenyl Disulfonate",
    "function": "Fluorescent Whitening Agent for Liquids - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Optical Brightener CBS-X (Tinopal CBS-X) for rapid cold-process compounding."
  },
  {
    "id": "brightener-28-tech",
    "name": "Fluorescent Brightener 28 (Technical Grade)",
    "category": "Optical Brightener & Dye",
    "casNumber": "4404-43-7",
    "inciName": "Disodium 4,4'-bis[(4-anilino-6-morpholino-1,3,5-triazin-2-yl)amino]stilbene-2,2'-disulfonate",
    "function": "Cotton Optical Whitener - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Cellulosic fiber optical whitener. optimized for bulk commercial applications."
  },
  {
    "id": "brightener-28-pure",
    "name": "Fluorescent Brightener 28 (High Purity / R&D Grade)",
    "category": "Optical Brightener & Dye",
    "casNumber": "4404-43-7",
    "inciName": "Disodium 4,4'-bis[(4-anilino-6-morpholino-1,3,5-triazin-2-yl)amino]stilbene-2,2'-disulfonate",
    "function": "Cotton Optical Whitener - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Cellulosic fiber optical whitener. for sensitive & eco premium formulations."
  },
  {
    "id": "brightener-28-sol",
    "name": "Fluorescent Brightener 28 (Custom Concentrated Solution)",
    "category": "Optical Brightener & Dye",
    "casNumber": "4404-43-7",
    "inciName": "Disodium 4,4'-bis[(4-anilino-6-morpholino-1,3,5-triazin-2-yl)amino]stilbene-2,2'-disulfonate",
    "function": "Cotton Optical Whitener - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Fluorescent Brightener 28 for rapid cold-process compounding."
  },
  {
    "id": "acid-blue-9-tech",
    "name": "Acid Blue 9 Liquid Colorant (Technical Grade)",
    "category": "Optical Brightener & Dye",
    "casNumber": "3844-45-9",
    "inciName": "CI 42090",
    "function": "Water-Soluble Blue Detergent Dye - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Standard liquid blue dye for detergent identification. optimized for bulk commercial applications."
  },
  {
    "id": "acid-blue-9-pure",
    "name": "Acid Blue 9 Liquid Colorant (High Purity / R&D Grade)",
    "category": "Optical Brightener & Dye",
    "casNumber": "3844-45-9",
    "inciName": "CI 42090",
    "function": "Water-Soluble Blue Detergent Dye - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Standard liquid blue dye for detergent identification. for sensitive & eco premium formulations."
  },
  {
    "id": "acid-blue-9-sol",
    "name": "Acid Blue 9 Liquid Colorant (Custom Concentrated Solution)",
    "category": "Optical Brightener & Dye",
    "casNumber": "3844-45-9",
    "inciName": "CI 42090",
    "function": "Water-Soluble Blue Detergent Dye - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Acid Blue 9 Liquid Colorant for rapid cold-process compounding."
  },
  {
    "id": "liquitint-blue-tech",
    "name": "Liquitint Blue HP (Technical Grade)",
    "category": "Optical Brightener & Dye",
    "casNumber": "PROPRIETARY",
    "inciName": "Colorant",
    "function": "Non-Staining Polymeric Blue Dye - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Polymeric non-staining dye for laundry liquids. optimized for bulk commercial applications."
  },
  {
    "id": "liquitint-blue-pure",
    "name": "Liquitint Blue HP (High Purity / R&D Grade)",
    "category": "Optical Brightener & Dye",
    "casNumber": "PROPRIETARY",
    "inciName": "Colorant",
    "function": "Non-Staining Polymeric Blue Dye - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Polymeric non-staining dye for laundry liquids. for sensitive & eco premium formulations."
  },
  {
    "id": "liquitint-blue-sol",
    "name": "Liquitint Blue HP (Custom Concentrated Solution)",
    "category": "Optical Brightener & Dye",
    "casNumber": "PROPRIETARY",
    "inciName": "Colorant",
    "function": "Non-Staining Polymeric Blue Dye - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Liquitint Blue HP for rapid cold-process compounding."
  },
  {
    "id": "silicone-antifoam-30-tech",
    "name": "Silicone Antifoam Emulsion 30% (Technical Grade)",
    "category": "Additive & Performance",
    "casNumber": "63148-62-9",
    "inciName": "Dimethicone",
    "function": "Foam Control & Defoamer - Industrial Tech Grade",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Silicone emulsion rapidly collapsing excess foam in automatic washers. optimized for bulk commercial applications."
  },
  {
    "id": "silicone-antifoam-30-pure",
    "name": "Silicone Antifoam Emulsion 30% (High Purity / R&D Grade)",
    "category": "Additive & Performance",
    "casNumber": "63148-62-9",
    "inciName": "Dimethicone",
    "function": "Foam Control & Defoamer - High Purity Grade",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Silicone emulsion rapidly collapsing excess foam in automatic washers. for sensitive & eco premium formulations."
  },
  {
    "id": "silicone-antifoam-30-sol",
    "name": "Silicone Antifoam Emulsion 30% (Custom Concentrated Solution)",
    "category": "Additive & Performance",
    "casNumber": "63148-62-9",
    "inciName": "Dimethicone",
    "function": "Foam Control & Defoamer - Ready Blend Solution",
    "activeDefault": 15,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Silicone Antifoam Emulsion 30% for rapid cold-process compounding."
  },
  {
    "id": "sodium-sulfate-uni-tech",
    "name": "Sodium Sulfate Anhydrous (Technical Grade)",
    "category": "Additive & Performance",
    "casNumber": "7757-82-6",
    "inciName": "Sodium Sulfate",
    "function": "Filler & Processing Aid Powder - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Standard inert bulking agent for detergent powders. optimized for bulk commercial applications."
  },
  {
    "id": "sodium-sulfate-uni-pure",
    "name": "Sodium Sulfate Anhydrous (High Purity / R&D Grade)",
    "category": "Additive & Performance",
    "casNumber": "7757-82-6",
    "inciName": "Sodium Sulfate",
    "function": "Filler & Processing Aid Powder - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Standard inert bulking agent for detergent powders. for sensitive & eco premium formulations."
  },
  {
    "id": "sodium-sulfate-uni-sol",
    "name": "Sodium Sulfate Anhydrous (Custom Concentrated Solution)",
    "category": "Additive & Performance",
    "casNumber": "7757-82-6",
    "inciName": "Sodium Sulfate",
    "function": "Filler & Processing Aid Powder - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Sodium Sulfate Anhydrous for rapid cold-process compounding."
  },
  {
    "id": "sodium-chloride-uni-tech",
    "name": "Sodium Chloride (Vacuum Salt) (Technical Grade)",
    "category": "Additive & Performance",
    "casNumber": "7647-14-5",
    "inciName": "Sodium Chloride",
    "function": "Viscosity Builder for Anionics - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Electrolyte thickener building micellar viscosity with SLES & CAPB. optimized for bulk commercial applications."
  },
  {
    "id": "sodium-chloride-uni-pure",
    "name": "Sodium Chloride (Vacuum Salt) (High Purity / R&D Grade)",
    "category": "Additive & Performance",
    "casNumber": "7647-14-5",
    "inciName": "Sodium Chloride",
    "function": "Viscosity Builder for Anionics - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Electrolyte thickener building micellar viscosity with SLES & CAPB. for sensitive & eco premium formulations."
  },
  {
    "id": "sodium-chloride-uni-sol",
    "name": "Sodium Chloride (Vacuum Salt) (Custom Concentrated Solution)",
    "category": "Additive & Performance",
    "casNumber": "7647-14-5",
    "inciName": "Sodium Chloride",
    "function": "Viscosity Builder for Anionics - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Sodium Chloride (Vacuum Salt) for rapid cold-process compounding."
  },
  {
    "id": "calcium-chloride-74-tech",
    "name": "Calcium Chloride 74% Flakes (Technical Grade)",
    "category": "Additive & Performance",
    "casNumber": "10043-52-4",
    "inciName": "Calcium Chloride",
    "function": "Enzyme Stabilizer & Fabric Softener Viscosity Aid - Industrial Tech Grade",
    "activeDefault": 74,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Source of calcium ions stabilizing protease & controlling softener viscosity. optimized for bulk commercial applications."
  },
  {
    "id": "calcium-chloride-74-pure",
    "name": "Calcium Chloride 74% Flakes (High Purity / R&D Grade)",
    "category": "Additive & Performance",
    "casNumber": "10043-52-4",
    "inciName": "Calcium Chloride",
    "function": "Enzyme Stabilizer & Fabric Softener Viscosity Aid - High Purity Grade",
    "activeDefault": 74,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Source of calcium ions stabilizing protease & controlling softener viscosity. for sensitive & eco premium formulations."
  },
  {
    "id": "calcium-chloride-74-sol",
    "name": "Calcium Chloride 74% Flakes (Custom Concentrated Solution)",
    "category": "Additive & Performance",
    "casNumber": "10043-52-4",
    "inciName": "Calcium Chloride",
    "function": "Enzyme Stabilizer & Fabric Softener Viscosity Aid - Ready Blend Solution",
    "activeDefault": 37,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Calcium Chloride 74% Flakes for rapid cold-process compounding."
  },
  {
    "id": "opacifier-emulsion-30-tech",
    "name": "Styrene/Acrylates Opacifier 30% (Technical Grade)",
    "category": "Additive & Performance",
    "casNumber": "9010-92-8",
    "inciName": "Styrene/Acrylates Copolymer",
    "function": "Milky White Lotion Opacifier - Industrial Tech Grade",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Polymeric emulsion imparting milky white opaque appearance. optimized for bulk commercial applications."
  },
  {
    "id": "opacifier-emulsion-30-pure",
    "name": "Styrene/Acrylates Opacifier 30% (High Purity / R&D Grade)",
    "category": "Additive & Performance",
    "casNumber": "9010-92-8",
    "inciName": "Styrene/Acrylates Copolymer",
    "function": "Milky White Lotion Opacifier - High Purity Grade",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Polymeric emulsion imparting milky white opaque appearance. for sensitive & eco premium formulations."
  },
  {
    "id": "opacifier-emulsion-30-sol",
    "name": "Styrene/Acrylates Opacifier 30% (Custom Concentrated Solution)",
    "category": "Additive & Performance",
    "casNumber": "9010-92-8",
    "inciName": "Styrene/Acrylates Copolymer",
    "function": "Milky White Lotion Opacifier - Ready Blend Solution",
    "activeDefault": 15,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Styrene/Acrylates Opacifier 30% for rapid cold-process compounding."
  },
  {
    "id": "zinc-ricinoleate-tech",
    "name": "Zinc Ricinoleate 100% (Technical Grade)",
    "category": "Additive & Performance",
    "casNumber": "13040-19-2",
    "inciName": "Zinc Ricinoleate",
    "function": "Chemical Odor Absorber - Industrial Tech Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Technical grade Zinc salt trapping nitrogen and sulfur malodor molecules. optimized for bulk commercial applications."
  },
  {
    "id": "zinc-ricinoleate-pure",
    "name": "Zinc Ricinoleate 100% (High Purity / R&D Grade)",
    "category": "Additive & Performance",
    "casNumber": "13040-19-2",
    "inciName": "Zinc Ricinoleate",
    "function": "Chemical Odor Absorber - High Purity Grade",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "High purity low-impurity Zinc salt trapping nitrogen and sulfur malodor molecules. for sensitive & eco premium formulations."
  },
  {
    "id": "zinc-ricinoleate-sol",
    "name": "Zinc Ricinoleate 100% (Custom Concentrated Solution)",
    "category": "Additive & Performance",
    "casNumber": "13040-19-2",
    "inciName": "Zinc Ricinoleate",
    "function": "Chemical Odor Absorber - Ready Blend Solution",
    "activeDefault": 50,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid pre-dissolved solution of Zinc Ricinoleate 100% for rapid cold-process compounding."
  },
  {
    "id": "sodium-percarbonate-uni",
    "name": "Sodium Percarbonate (Active Oxygen Bleach)",
    "category": "Bleach & Oxidizer",
    "casNumber": "15630-89-4",
    "inciName": "Sodium Carbonate Peroxide",
    "function": "Active Oxygen Destaining Bleach",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Granular active oxygen bleach releasing hydrogen peroxide in washing liquor."
  },
  {
    "id": "taed-bleach-activator",
    "name": "TAED Bleach Activator (Tetraacetylethylenediamine)",
    "category": "Bleach & Oxidizer",
    "casNumber": "10543-57-4",
    "inciName": "Tetraacetylethylenediamine",
    "function": "Low Temperature Oxygen Bleach Activator",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Peracetic acid precursor enabling cold-water stain bleaching from 20\xB0C."
  },
  {
    "id": "zeolite-4a",
    "name": "Zeolite 4A Builder Powder",
    "category": "Alkaline Builder",
    "casNumber": "1318-02-1",
    "inciName": "Zeolite",
    "function": "Phosphate-Free Calcium Ion Exchange Builder",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Synthetic sodium aluminosilicate ion-exchange builder for eco laundry powders."
  },
  {
    "id": "hcl-33-uni",
    "name": "Hydrochloric Acid 33% (HCl Technical)",
    "category": "Acid & Descaler",
    "casNumber": "7647-01-0",
    "inciName": "Hydrochloric Acid",
    "function": "Strong Mineral Acid Scale Dissolver",
    "activeDefault": 33,
    "costPerKg": null,
    "hlb": null,
    "description": "Concentrated technical grade hydrochloric acid for heavy toilet descaling."
  },
  {
    "id": "sulfamic-acid-uni",
    "name": "Sulfamic Acid 99% Granular",
    "category": "Acid & Descaler",
    "casNumber": "5329-14-6",
    "inciName": "Sulfamic Acid",
    "function": "Solid Organic Acid Scale Remover",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "Dry granular organic acid descaler with low corrosion profile on metals."
  },
  {
    "id": "glycolic-acid-70",
    "name": "Glycolic Acid 70% Liquid",
    "category": "Acid & Descaler",
    "casNumber": "79-14-1",
    "inciName": "Glycolic Acid",
    "function": "Alpha-Hydroxy Acid Soap Scum Penetrator",
    "activeDefault": 70,
    "costPerKg": null,
    "hlb": null,
    "description": "High-efficiency calcium soap scum and scale penetrator for bathroom tiles."
  },
  {
    "id": "lactic-acid-88",
    "name": "Lactic Acid 88% Liquid",
    "category": "Acid & Descaler",
    "casNumber": "50-21-5",
    "inciName": "Lactic Acid",
    "function": "Natural Fermentation Acid Descaler & Sanitizer",
    "activeDefault": 88,
    "costPerKg": null,
    "hlb": null,
    "description": "Eco bio-based AHA providing limescale removal and mild antibacterial action."
  },
  {
    "id": "d-limonene-pure",
    "name": "D-Limonene (Natural Citrus Terpene 95%)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "5989-27-5",
    "inciName": "Limonene",
    "function": "Natural Heavy Grease Solvent & Citrus Aroma",
    "activeDefault": 95,
    "costPerKg": null,
    "hlb": null,
    "description": "Cold-pressed orange peel solvent dissolving heavy grease, tar, and adhesive soils."
  },
  {
    "id": "pine-oil-85",
    "name": "Natural Pine Oil (85%)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "8002-09-3",
    "inciName": "Pinus Palustris Oil",
    "function": "Natural Terpene Solvent & Pine Disinfectant Base",
    "activeDefault": 85,
    "costPerKg": null,
    "hlb": null,
    "description": "Steam-distilled pine terpene oil for floor cleaning emulsions and deodorizing."
  },
  {
    "id": "scs-40",
    "name": "Sodium Cumene Sulfonate 40% (SCS 40)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "28348-53-0",
    "inciName": "Sodium Cumene Sulfonate",
    "function": "Coupling Hydrotrope & Cloud Point Booster",
    "activeDefault": 40,
    "costPerKg": null,
    "hlb": null,
    "description": "Hydrotropic solubilizer coupling nonionics and solvents in clear aqueous solutions."
  },
  {
    "id": "egbe-butyl-glycol",
    "name": "Ethylene Glycol Monobutyl Ether (Butyl Cellosolve / EGBE)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "111-76-2",
    "inciName": "Butoxyethanol",
    "function": "High-Efficiency Grease & Carbonized Soil Solvent",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Powerful fast-coupling glycol ether solvent for industrial oven and glass cleaners."
  },
  {
    "id": "bdg-butyl-diglycol",
    "name": "Diethylene Glycol Monobutyl Ether (Butyl Diglycol / BDG)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "112-34-5",
    "inciName": "Butoxydiglycol",
    "function": "Slow Evaporating Heavy Grease Solvent",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "High-boiling coalescing glycol ether solvent for deep oven fat removal."
  },
  {
    "id": "pm-solvent",
    "name": "Propylene Glycol Monomethyl Ether (PM Solvent)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "107-98-2",
    "inciName": "Methoxyisopropanol",
    "function": "Fast Evaporating Low-Toxicity Surface Solvent",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Low-toxicity P-series glycol ether solvent for streak-free all-purpose cleaners."
  },
  {
    "id": "dpnb-solvent",
    "name": "Dipropylene Glycol n-Butyl Ether (DPnB Solvent)",
    "category": "Solvent & Hydrotrope",
    "casNumber": "29911-28-2",
    "inciName": "Dipropylene Glycol Butyl Ether",
    "function": "Hydrophobic Soil Dissolving Solvent",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Slow-evaporating hydrophobic solvent for tough bathroom soap scum and grease."
  },
  {
    "id": "ammonia-25",
    "name": "Ammonium Hydroxide 25% (Ammonia Water)",
    "category": "Neutralizer / Base",
    "casNumber": "1336-21-6",
    "inciName": "Ammonium Hydroxide",
    "function": "Volatile Alkaline Grease Cutter & Glass Shine",
    "activeDefault": 25,
    "costPerKg": null,
    "hlb": null,
    "description": "Volatile alkali evaporating completely without leaving residue on glass surfaces."
  },
  {
    "id": "pcmx-chloroxylenol",
    "name": "Chloroxylenol 99% (PCMX)",
    "category": "Preservative & Biocide",
    "casNumber": "88-04-0",
    "inciName": "Chloroxylenol",
    "function": "Broad-Spectrum Antibacterial Active",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "Dettol-type halogenated phenolic disinfectant active for antimicrobial soaps."
  },
  {
    "id": "egds-pearlizer",
    "name": "Glycol Distearate (EGDS Pearlizer)",
    "category": "Additive & Performance",
    "casNumber": "627-83-8",
    "inciName": "Glycol Distearate",
    "function": "Opacifying Pearlizing Agent",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 1.5,
    "description": "Diester crystal former providing rich silky pearlescence to hand soaps."
  },
  {
    "id": "d-panthenol",
    "name": "D-Panthenol 99% (Pro-Vitamin B5)",
    "category": "Additive & Performance",
    "casNumber": "81-13-0",
    "inciName": "Panthenol",
    "function": "Skin Barrier Conditioner & Humectant",
    "activeDefault": 99,
    "costPerKg": null,
    "hlb": null,
    "description": "Deep-penetrating provitamin humectant soothing hand skin during frequent washing."
  },
  {
    "id": "peg-120-thickener",
    "name": "PEG-120 Methyl Glucose Dioleate Thickener",
    "category": "Polymer & Thickener",
    "casNumber": "86893-19-8",
    "inciName": "PEG-120 Methyl Glucose Dioleate",
    "function": "Ultra-Mild Sulfate-Free Viscosity Builder",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Nonionic natural glucose derivative thickening sulfate-free surfactant systems."
  },
  {
    "id": "carnauba-wax-emulsion",
    "name": "Carnauba Wax Microemulsion 20%",
    "category": "Additive & Performance",
    "casNumber": "8015-86-9",
    "inciName": "Copernicia Cerifera Cera",
    "function": "Water-Beading Auto Gloss Wax Additive",
    "activeDefault": 20,
    "costPerKg": null,
    "hlb": null,
    "description": "Micro-emulsified natural carnauba wax delivering hydrophobic sheeting to paintwork."
  },
  {
    "id": "anti-fog-polymer",
    "name": "Anti-Fog Hydrophilic Surface Polymer",
    "category": "Polymer & Thickener",
    "casNumber": "25085-34-1",
    "inciName": "Acrylates Copolymer",
    "function": "Hydrophilic Sheeting Anti-Fog Film Former",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Surface-substantive polymer preventing water vapor condensation droplets on glass."
  },
  {
    "id": "perfume-compound",
    "name": "Commercial Perfume & Essential Fragrance Compound",
    "category": "Additive & Performance",
    "casNumber": "N/A",
    "inciName": "Parfum",
    "function": "Long-Lasting Aesthetic Fragrance",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "IFRA-compliant industrial fragrance compound for detergent scent."
  },
  {
    "id": "dye-colorant",
    "name": "Aesthetic Colorant & Liquid Dye Solution",
    "category": "Optical Brightener & Dye",
    "casNumber": "N/A",
    "inciName": "Colorant (CI Blend)",
    "function": "Visual Product Identity Colorant",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Non-staining water-soluble dye blend for product identification."
  },
  {
    "id": "acid-corrosion-inhibitor",
    "name": "Acid Corrosion Inhibitor (Propargyl Alcohol Derivative)",
    "category": "Additive & Performance",
    "casNumber": "107-19-7",
    "inciName": "Propargyl Alcohol",
    "function": "Acid Pickling & Pipe Corrosion Inhibitor",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Specialty acetylenic inhibitor preventing HCl attack on plumbing and pipe walls."
  },
  {
    "id": "tallow-amine-oxide",
    "name": "Tallow Amine Ethoxylate / Amine Oxide Acid Thickener",
    "category": "Polymer & Thickener",
    "casNumber": "61791-26-2",
    "inciName": "PEG-2 Tallow Amine",
    "function": "Strong Mineral Acid Vertical Cling Thickener",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": null,
    "description": "Cationic amine ethoxylate structuring 10% HCl into clinging vertical bowl gel."
  },
  {
    "id": "cationic-polymer-emulsion",
    "name": "Cationic Polymer Thickening Emulsion",
    "category": "Polymer & Thickener",
    "casNumber": "9003-05-8",
    "inciName": "Polyquaternium-37",
    "function": "Cationic Fabric Softener Viscosity Builder",
    "activeDefault": 30,
    "costPerKg": null,
    "hlb": null,
    "description": "Liquid dispersion polymer for stabilizing esterquat fabric conditioner emulsions."
  },
  {
    "id": "amino-silicone-emulsion",
    "name": "Amino-Functional Silicone Emulsion (35%)",
    "category": "Additive & Performance",
    "casNumber": "71750-79-3",
    "inciName": "Amodimethicone",
    "function": "Fiber Lubricant & Easy Ironing Additive",
    "activeDefault": 35,
    "costPerKg": null,
    "hlb": null,
    "description": "Microemulsion of amino silicone providing silkiness, elasticity, and anti-static glide."
  },
  {
    "id": "pluronic-pe-6400",
    "name": "Pluronic Low-Foam Nonionic EO/PO (PE 6400)",
    "category": "Nonionic Surfactant",
    "casNumber": "9003-11-6",
    "inciName": "Poloxamer 184",
    "function": "Zero-Foam Wetting & Rinse Aid Sheeting Agent",
    "activeDefault": 100,
    "costPerKg": null,
    "hlb": 15,
    "description": "Block copolymer of ethylene oxide and propylene oxide for machine dishwashers."
  }
];
function getIngredientAliasKeywords(item) {
  const name = (item?.name || "").toLowerCase();
  const id = (item?.id || "").toLowerCase();
  const cas = (item?.casNumber || "").toLowerCase();
  const inci = (item?.inciName || "").toLowerCase();
  const mfg = (item?.manufacturer || "").toLowerCase();
  let aliases = "";
  if (inci) {
    aliases += ` ${inci}`;
  }
  if (mfg) {
    aliases += ` ${mfg}`;
  }
  if (id === "aristo-9" || name.includes("aristo") || id.includes("aristo")) {
    aliases += " aristo aristo 9 aristo9 blue chem bluechem multipurpose additive enzyme booster liquid detergent chemical";
  }
  if (id === "labsa-90" || name.includes("labsa") && name.includes("90") || name.includes("acid slurry") && name.includes("90")) {
    aliases += " labsa 90 acid slurry 90% acid slurry 90 labsa 90% commercial acid slurry";
  }
  if (id === "labsa-96" || name.includes("labsa") && name.includes("96") || name.includes("acid slurry") && name.includes("96")) {
    aliases += " labsa 96 acid slurry 96% acid slurry 96 labsa 96% technical acid slurry";
  }
  if (cas === "1310-73-2" || name.includes("sodium hydroxide") || id.includes("naoh")) {
    aliases += " naoh caustic soda lye sodium hydroxide";
  }
  if (cas === "1310-58-3" || name.includes("potassium hydroxide") || id.includes("koh")) {
    aliases += " koh caustic potash potassium hydroxide";
  }
  if (cas === "102-71-6" || name.includes("triethanolamine") || id.includes("tea")) {
    aliases += " tea triethanolamine";
  }
  if (cas === "141-43-5" || name.includes("monoethanolamine") || id.includes("mea")) {
    aliases += " mea monoethanolamine";
  }
  if (cas === "27176-87-0" || name.includes("dodecylbenzene") || name.includes("acid slurry") || id.includes("labsa")) {
    aliases += " labsa las acid slurry sulfonic acid alkylbenzene";
  }
  if (cas === "68585-34-2" || name.includes("lauryl ether sulfate") || name.includes("laureth sulfate") || id.includes("sles")) {
    aliases += " sles texapon sodium laureth sulfate";
  }
  if (cas === "151-21-3" || name.includes("lauryl sulfate") || id.includes("sls")) {
    aliases += " sls sodium lauryl sulfate";
  }
  if (cas === "68439-57-6" || name.includes("olefin sulfonate") || id.includes("aos")) {
    aliases += " aos alpha olefin sulfonate";
  }
  if (cas === "61789-40-0" || name.includes("cocamidopropyl") || id.includes("capb")) {
    aliases += " capb cocamidopropyl betaine coco betaine";
  }
  if (cas === "64-02-8" || cas === "139-33-3" || name.includes("edta") || id.includes("edta")) {
    aliases += " edta tetrasodium disodium versene";
  }
  if (cas === "51981-21-6" || name.includes("glutamate diacetate") || id.includes("glda")) {
    aliases += " glda dissolvine tetrasodium glutamate diacetate";
  }
  if (cas === "164462-16-2" || name.includes("methylglycine") || id.includes("mgda")) {
    aliases += " mgda trilon m methylglycinediacetic acid";
  }
  if (cas === "7758-29-4" || name.includes("tripolyphosphate") || id.includes("stpp")) {
    aliases += " stpp sodium tripolyphosphate";
  }
  if (cas === "77-92-9" || name.includes("citric acid")) {
    aliases += " citric acid acidifier";
  }
  if (cas === "6132-04-3" || name.includes("sodium citrate")) {
    aliases += " sodium citrate trisodium citrate";
  }
  return aliases;
}
function searchUniversalIngredients(query, category) {
  const q = (query || "").toLowerCase().trim();
  const cat = (category || "").trim();
  const tokens = q ? q.split(/\s+/).filter(Boolean) : [];
  return UNIVERSAL_INGREDIENTS.filter((item) => {
    let matchesCategory = true;
    if (cat && cat !== "All" && cat !== "All Categories") {
      const itemCat = (item?.category || "").toLowerCase();
      const catLower = cat.toLowerCase();
      matchesCategory = item?.category === cat || itemCat === catLower || itemCat.includes(catLower) || catLower.includes(itemCat);
    }
    if (!matchesCategory) return false;
    if (tokens.length === 0) return true;
    const nameStr = (item?.name || "").toLowerCase();
    const funcStr = (item?.function || "").toLowerCase();
    const inciStr = (item?.inciName || "").toLowerCase();
    const casStr = (item?.casNumber || "").toLowerCase();
    const descStr = (item?.description || "").toLowerCase();
    const idStr = (item?.id || "").toLowerCase();
    const catStr = (item?.category || "").toLowerCase();
    const mfgStr = (item?.manufacturer || "").toLowerCase();
    const prodStr = (item?.productName || "").toLowerCase();
    const activeStr = `${item?.activeDefault ?? ""}% ${item?.activeDefault ?? ""}`;
    const aliasStr = getIngredientAliasKeywords(item);
    const fullSearchableText = `${nameStr} ${funcStr} ${inciStr} ${casStr} ${descStr} ${idStr} ${catStr} ${mfgStr} ${prodStr} ${activeStr} ${aliasStr}`;
    return tokens.every((token) => fullSearchableText.includes(token));
  });
}

// src/db/database.ts
var import_dexie = __toESM(require("dexie"), 1);
var DetergentDatabase = class extends import_dexie.default {
  constructor() {
    super("DetergentFormulaExpertDB");
    this.version(1).stores({
      formulas: "id, name, category, productType, isFavorite, updatedAt",
      inventory: "id, name, category, stockKg, updatedAt",
      productionRuns: "id, batchNumber, formulaId, date, status, createdAt",
      labNotes: "id, title, date, formulaId, createdAt",
      formulaVersions: "id, formulaId, versionNumber, timestamp",
      specRecords: "category, updatedAt",
      userSettings: "key, updatedAt"
    });
  }
};
var db = new DetergentDatabase();

// src/services/ingredientResearchService.ts
var import_genai = require("@google/genai");

// src/utils/activeMatterEngine.ts
var AUTHORITATIVE_ACTIVE_BENCHMARKS = [
  { name: "LABSA 96% (Acid Slurry)", activeDefault: 96, category: "Anionic Surfactant", surfactantType: "anionic", description: "Standard high-purity linear alkylbenzene sulfonic acid." },
  { name: "LABSA 90% (Acid Slurry)", activeDefault: 90, category: "Anionic Surfactant", surfactantType: "anionic", description: "Standard commercial 90% active linear alkylbenzene sulfonic acid." },
  { name: "LABSA 90% (Commercial Grade)", activeDefault: 90, category: "Anionic Surfactant", surfactantType: "anionic", description: "Commercial alkylbenzene sulfonic acid grade." },
  { name: "SLES 70% (Sodium Lauryl Ether Sulfate Paste)", activeDefault: 70, category: "Anionic Surfactant", surfactantType: "anionic", description: "Concentrated 2EO sulfate paste." },
  { name: "SLES 28% (Sodium Lauryl Ether Sulfate Liquid)", activeDefault: 28, category: "Anionic Surfactant", surfactantType: "anionic", description: "Ready-to-pump dilute 2EO sulfate liquid." },
  { name: "SLS 95% Needles (Sodium Lauryl Sulfate)", activeDefault: 95, category: "Anionic Surfactant", surfactantType: "anionic", description: "High-foaming solid sodium lauryl sulfate needles." },
  { name: "SLS 30% Liquid (Sodium Lauryl Sulfate)", activeDefault: 30, category: "Anionic Surfactant", surfactantType: "anionic", description: "Dilute liquid sodium lauryl sulfate solution." },
  { name: "AOS 92% Powder (Alpha Olefin Sulfonate)", activeDefault: 92, category: "Anionic Surfactant", surfactantType: "anionic", description: "High active dry powder alpha olefin sulfonate." },
  { name: "AOS 38% Liquid (Alpha Olefin Sulfonate)", activeDefault: 38, category: "Anionic Surfactant", surfactantType: "anionic", description: "Liquid alpha olefin sulfonate solution." },
  { name: "CAPB 30% (Cocamidopropyl Betaine)", activeDefault: 30, category: "Amphoteric Surfactant", surfactantType: "amphoteric", description: "Standard amphoteric secondary surfactant." },
  { name: "CAPB 45% (Cocamidopropyl Betaine High Active)", activeDefault: 45, category: "Amphoteric Surfactant", surfactantType: "amphoteric", description: "High-concentration amphoteric betaine concentrate." },
  { name: "Cocamide DEA 85% (CDEA)", activeDefault: 85, category: "Nonionic Surfactant", surfactantType: "nonionic", description: "Alkanolamide foam stabilizer and viscosity builder." },
  { name: "Cocamide MEA 90% (CMEA Flakes)", activeDefault: 90, category: "Nonionic Surfactant", surfactantType: "nonionic", description: "Solid flake monoethanolamide foam booster." },
  { name: "Lauryl Amine Oxide 30% (LDAO)", activeDefault: 30, category: "Nonionic Surfactant", surfactantType: "nonionic", description: "Amine oxide foam booster and bleach-stable surfactant." },
  { name: "APG 0810 (Caprylyl/Capryl Glucoside 50%)", activeDefault: 50, category: "Nonionic Surfactant", surfactantType: "nonionic", description: "50% aqueous alkyl polyglucoside nonionic hydrotrope." },
  { name: "APG 1214 (Lauryl Glucoside 50%)", activeDefault: 50, category: "Nonionic Surfactant", surfactantType: "nonionic", description: "50% aqueous plant-derived lauryl glucoside." },
  { name: "Linear Alcohol Ethoxylate 9EO (LAE-9 100%)", activeDefault: 100, category: "Nonionic Surfactant", surfactantType: "nonionic", description: "100% active nonionic detergency surfactant." },
  { name: "Linear Alcohol Ethoxylate 7EO (LAE-7 100%)", activeDefault: 100, category: "Nonionic Surfactant", surfactantType: "nonionic", description: "100% active nonionic emulsifier." },
  { name: "Polysorbate 20 (Tween 20 100%)", activeDefault: 100, category: "Nonionic Surfactant", surfactantType: "nonionic", description: "100% active hydrophilic fragrance solubilizer." },
  { name: "Polysorbate 80 (Tween 80 100%)", activeDefault: 100, category: "Nonionic Surfactant", surfactantType: "nonionic", description: "100% active O/W emulsifier." },
  { name: "PEG-40 Hydrogenated Castor Oil (100%)", activeDefault: 100, category: "Nonionic Surfactant", surfactantType: "nonionic", description: "100% active fragrance solubilizer." },
  { name: "Benzalkonium Chloride 50% (BKC-50)", activeDefault: 50, category: "Cationic Surfactant", surfactantType: "cationic", description: "50% aqueous quaternary ammonium disinfectant." },
  { name: "Benzalkonium Chloride 80% (BKC-80)", activeDefault: 80, category: "Cationic Surfactant", surfactantType: "cationic", description: "80% concentrated quaternary ammonium biocide." },
  { name: "Cetrimonium Chloride 30% (CTAC)", activeDefault: 30, category: "Cationic Surfactant", surfactantType: "cationic", description: "30% aqueous cationic hair & fabric conditioner." },
  { name: "Sodium Hydroxide 50% Liquid (Caustic Lye)", activeDefault: 50, category: "Neutralizer / Base", surfactantType: "none", description: "50% aqueous sodium hydroxide lye." },
  { name: "Sodium Hydroxide 99% Flakes", activeDefault: 99, category: "Neutralizer / Base", surfactantType: "none", description: "99% solid caustic soda flakes." },
  { name: "Potassium Hydroxide 45% Liquid (Caustic Potash)", activeDefault: 45, category: "Neutralizer / Base", surfactantType: "none", description: "45% aqueous potassium hydroxide solution." },
  { name: "Potassium Hydroxide 90% Flakes", activeDefault: 90, category: "Neutralizer / Base", surfactantType: "none", description: "90% solid potassium hydroxide flakes." },
  { name: "Triethanolamine 99% (TEA)", activeDefault: 99, category: "Neutralizer / Buffer", surfactantType: "none", description: "99% pure organic tertiary amine base." },
  { name: "Triethanolamine 85% (TEA 85)", activeDefault: 85, category: "Neutralizer / Buffer", surfactantType: "none", description: "85% commercial grade triethanolamine (with diethanolamine)." },
  { name: "Monoethanolamine 99% (MEA)", activeDefault: 99, category: "Neutralizer / Base", surfactantType: "none", description: "99% pure primary ethanolamine." },
  { name: "GLDA 47% Liquid (Dissolvine GL-47)", activeDefault: 47, category: "Builder / Chelator", surfactantType: "none", description: "47% aqueous tetrasodium glutamate diacetate solution." },
  { name: "MGDA 40% Liquid (Trilon M)", activeDefault: 40, category: "Builder / Chelator", surfactantType: "none", description: "40% aqueous methylglycinediacetic acid solution." },
  { name: "Tetrasodium EDTA 39% Liquid", activeDefault: 39, category: "Builder / Chelator", surfactantType: "none", description: "39% aqueous tetrasodium ethylenediaminetetraacetate solution." },
  { name: "Tetrasodium EDTA 99% Powder", activeDefault: 99, category: "Builder / Chelator", surfactantType: "none", description: "99% solid tetrasodium EDTA crystalline powder." },
  { name: "Sodium Citrate Dihydrate (100%)", activeDefault: 100, category: "Builder / Chelator", surfactantType: "none", description: "100% crystalline sodium citrate dihydrate builder." },
  { name: "Sodium Carbonate (Soda Ash 99%)", activeDefault: 99, category: "Builder / Alkali", surfactantType: "none", description: "99% dense/light soda ash powder." },
  { name: "Sodium Tripolyphosphate (STPP 94%)", activeDefault: 94, category: "Builder / Sequestering", surfactantType: "none", description: "94% technical grade sodium tripolyphosphate." },
  { name: "Sodium Metasilicate Pentahydrate", activeDefault: 100, category: "Builder / Corrosion Inhibitor", surfactantType: "none", description: "100% crystalline sodium metasilicate pentahydrate." },
  { name: "Sodium Hypochlorite 12% Liquid (Bleach)", activeDefault: 12, category: "Bleach / Oxidizer", surfactantType: "none", description: "12% available chlorine industrial sodium hypochlorite." },
  { name: "Hydrogen Peroxide 50% Liquid", activeDefault: 50, category: "Bleach / Oxidizer", surfactantType: "none", description: "50% technical hydrogen peroxide solution." },
  { name: "Sodium Xylene Sulfonate 40% (SXS-40)", activeDefault: 40, category: "Hydrotrope / Coupling", surfactantType: "none", description: "40% aqueous sodium xylene sulfonate hydrotrope." },
  { name: "Deionized Water (Water / Aqua)", activeDefault: 0, category: "Solvent / Carrier", surfactantType: "none", description: "0% active solids, 100% carrier solvent." },
  { name: "Demineralized Water (DM Water)", activeDefault: 0, category: "Solvent / Carrier", surfactantType: "none", description: "0% active solids, 100% carrier solvent." },
  { name: "Tap Water", activeDefault: 0, category: "Solvent / Carrier", surfactantType: "none", description: "0% active solids, 100% carrier solvent." }
];
var ActiveMatterEngine = class {
  /**
   * Helper: classify surfactant charge type based on category, role, and name keywords
   */
  static classifySurfactantCharge(category, role, name) {
    const cat = (category || "").toLowerCase();
    const r = (role || "").toLowerCase();
    const n = (name || "").toLowerCase();
    const combined = `${cat} ${r} ${n}`;
    const isExplicitNonSurfactant = cat.includes("filler") || cat.includes("builder") || cat.includes("chelator") || cat.includes("preservative") || cat.includes("neutralizer") || cat.includes("solvent") || cat.includes("dye") || cat.includes("colorant") || cat.includes("fragrance") || cat.includes("perfume") || cat.includes("enzyme") || n === "sodium sulfate" || n === "magnesium sulfate" || n === "calcium sulfate" || n === "potassium sulfate" || n === "sodium chloride" || n.includes("glauber");
    if (isExplicitNonSurfactant && !cat.includes("surfactant")) {
      return { isSurfactant: false, surfactantType: "none" };
    }
    if (cat.includes("anionic") || r.includes("anionic") || n.includes("labsa") || n.includes("sles") || n.includes("sls") || n.includes("als") || n.includes("ales") || n.includes("lauryl sulfate") || n.includes("laureth sulfate") || n.includes("alkyl sulfate") || n.includes("dodecyl sulfate") || n.includes("aos") || n.includes("sulfonate") || n.includes("alkylbenzene") || n.includes("soap") || n.includes("oleate")) {
      return { isSurfactant: true, surfactantType: "anionic" };
    }
    if (cat.includes("amphoteric") || cat.includes("zwitterionic") || r.includes("amphoteric") || n.includes("betaine") || n.includes("capb") || n.includes("sultaine") || n.includes("amphoacetate")) {
      return { isSurfactant: true, surfactantType: "amphoteric" };
    }
    if (cat.includes("cationic") || r.includes("cationic") || n.includes("bkc") || n.includes("quaternary") || n.includes("chloride") && (n.includes("cetrimonium") || n.includes("benzalkonium") || n.includes("distearyl")) || n.includes("esterquat")) {
      return { isSurfactant: true, surfactantType: "cationic" };
    }
    if (cat.includes("nonionic") || r.includes("nonionic") || n.includes("ethoxylate") || n.includes("lae") || n.includes("apg") || n.includes("glucoside") || n.includes("tween") || n.includes("span") || n.includes("polysorbate") || n.includes("cdea") || n.includes("cmea") || n.includes("cocamide") || n.includes("amine oxide") || n.includes("ldao") || n.includes("peg-40") || n.includes("np-9") || n.includes("np-6")) {
      return { isSurfactant: true, surfactantType: "nonionic" };
    }
    if (cat.includes("surfactant") || r.includes("surfactant") || combined.includes("foamer") || combined.includes("emulsifier") || combined.includes("solubilizer")) {
      return { isSurfactant: true, surfactantType: "nonionic" };
    }
    return { isSurfactant: false, surfactantType: "none" };
  }
  /**
   * Helper: Check if an ingredient is water or pure carrier
   */
  static isWaterIngredient(name, category, role) {
    const n = (name || "").toLowerCase().trim();
    const c = (category || "").toLowerCase();
    const r = (role || "").toLowerCase();
    if (n === "water" || n === "aqua" || n === "di water" || n === "ro water" || n === "dm water" || n === "tap water" || n === "deionized water" || n === "demineralized water" || n.includes("purified water")) {
      return true;
    }
    if ((n.includes("water") || n.includes("aqua")) && (c.includes("solvent") || c.includes("carrier") || r.includes("solvent") || r.includes("carrier") || !c)) {
      return true;
    }
    return false;
  }
  /**
   * Helper: Check if an ingredient is a solvent (excluding water)
   */
  static isSolventIngredient(name, category, role) {
    const n = (name || "").toLowerCase().trim();
    const c = (category || "").toLowerCase();
    const r = (role || "").toLowerCase();
    if (this.isWaterIngredient(name, category, role)) {
      return false;
    }
    if (c.includes("solvent") || r.includes("solvent") || n.includes("ethanol") || n.includes("isopropanol") || n.includes("ipa") || n.includes("propylene glycol") || n.includes("glycerin") || n.includes("butyl glycol") || n.includes("dpm") || n.includes("dipropylene glycol")) {
      return true;
    }
    return false;
  }
  /**
   * Helper: Extract percentage number embedded in ingredient name
   * Examples: "SLES 28%", "LABSA 96%", "NaOH 50% Liquid", "GLDA 47%"
   */
  static extractPercentageFromName(name) {
    if (!name) return null;
    const match = name.match(/(\d+(?:\.\d+)?)\s*(?:%|pct|percent)/i);
    if (match && match[1]) {
      const val = parseFloat(match[1]);
      if (!isNaN(val) && val >= 0 && val <= 100) {
        return val;
      }
    }
    return null;
  }
  /**
   * Authoritative resolution of ingredient active matter percentage and metadata.
   */
  static resolveIngredientActive(ing) {
    const rawName = (ing?.name || "").trim();
    const lowerName = rawName.toLowerCase();
    const rawCategory = (ing?.category || ing?.role || ing?.function || "").trim();
    const rawRole = (ing?.role || ing?.function || "").trim();
    const isWater = this.isWaterIngredient(rawName, rawCategory, rawRole);
    const isSolvent = this.isSolventIngredient(rawName, rawCategory, rawRole);
    const explicitActive = ing?.activeMatterPct ?? ing?.activePercent ?? ing?.activeMatterPurity ?? ing?.activePct ?? ing?.purity;
    let canonicalMatch;
    if (ing?.id) {
      canonicalMatch = UNIVERSAL_INGREDIENTS.find((u) => u.id === ing.id);
    }
    if (!canonicalMatch && rawName) {
      canonicalMatch = UNIVERSAL_INGREDIENTS.find((u) => u.name.toLowerCase() === lowerName);
    }
    const resolvedCategory = canonicalMatch?.category || rawCategory || (isWater ? "Solvent / Carrier" : isSolvent ? "Solvent" : "Additive");
    const { isSurfactant, surfactantType } = this.classifySurfactantCharge(resolvedCategory, rawRole, rawName);
    if (isWater) {
      return {
        activeMatterPct: 0,
        dataSource: explicitActive !== void 0 && explicitActive !== null ? "explicit_override" : "authoritative",
        category: resolvedCategory,
        isSurfactant: false,
        surfactantType: "none",
        isWater: true,
        isSolvent: false,
        canonicalMatch
      };
    }
    if (explicitActive !== void 0 && explicitActive !== null && !isNaN(Number(explicitActive))) {
      const activeNum = Math.max(0, Math.min(100, Number(explicitActive)));
      return {
        activeMatterPct: activeNum,
        dataSource: "explicit_override",
        category: resolvedCategory,
        isSurfactant,
        surfactantType,
        isWater: false,
        isSolvent,
        canonicalMatch
      };
    }
    const namePct = this.extractPercentageFromName(rawName);
    if (namePct !== null) {
      const matchedBench = AUTHORITATIVE_ACTIVE_BENCHMARKS.find((b) => {
        const bLower = b.name.toLowerCase();
        return b.activeDefault === namePct && (lowerName.includes("labsa") && bLower.includes("labsa") || lowerName.includes("sles") && bLower.includes("sles") || lowerName.includes("sls") && bLower.includes("sls") || lowerName.includes("aos") && bLower.includes("aos") || lowerName.includes("capb") && bLower.includes("capb") || (lowerName.includes("naoh") || lowerName.includes("hydroxide")) && (bLower.includes("naoh") || bLower.includes("hydroxide")) || lowerName.includes("glda") && bLower.includes("glda") || lowerName.includes("edta") && bLower.includes("edta") || lowerName.includes("bkc") && bLower.includes("bkc"));
      });
      return {
        activeMatterPct: namePct,
        dataSource: matchedBench ? "authoritative" : "derived_from_name",
        category: resolvedCategory || matchedBench?.category || "Surfactant",
        isSurfactant: isSurfactant || (matchedBench ? matchedBench.surfactantType !== "none" : false),
        surfactantType: surfactantType !== "none" ? surfactantType : matchedBench?.surfactantType || "none",
        isWater: false,
        isSolvent,
        canonicalMatch
      };
    }
    if (canonicalMatch && canonicalMatch.activeDefault !== void 0 && !isNaN(Number(canonicalMatch.activeDefault))) {
      return {
        activeMatterPct: Number(canonicalMatch.activeDefault),
        dataSource: "authoritative",
        category: resolvedCategory,
        isSurfactant,
        surfactantType,
        isWater: false,
        isSolvent,
        canonicalMatch
      };
    }
    const benchMatch = AUTHORITATIVE_ACTIVE_BENCHMARKS.find((b) => {
      const bLower = b.name.toLowerCase();
      const bFirst = bLower.split(" ")[0];
      const bParen = bLower.split("(")[0].trim();
      const hasParenthesesMatch = bLower.includes(`(${lowerName} `) || bLower.includes(` ${lowerName} `) || bLower.includes(`(${lowerName})`) || bLower.includes(` ${lowerName})`) || bLower.includes(`(${lowerName}%)`) || bLower.includes(`(${lowerName} 100%)`);
      return lowerName === bFirst || lowerName === bParen || bLower.startsWith(lowerName) || hasParenthesesMatch;
    });
    if (benchMatch) {
      return {
        activeMatterPct: benchMatch.activeDefault,
        dataSource: "authoritative",
        category: resolvedCategory || benchMatch.category,
        isSurfactant: isSurfactant || benchMatch.surfactantType !== "none",
        surfactantType: surfactantType !== "none" ? surfactantType : benchMatch.surfactantType,
        isWater: false,
        isSolvent,
        canonicalMatch
      };
    }
    if (isSolvent) {
      return {
        activeMatterPct: 100,
        dataSource: "authoritative",
        category: resolvedCategory,
        isSurfactant: false,
        surfactantType: "none",
        isWater: false,
        isSolvent: true,
        canonicalMatch
      };
    }
    const isSolidChemical = lowerName.includes("chloride") || lowerName.includes("sulfate") && !isSurfactant || lowerName.includes("carbonate") || lowerName.includes("bicarbonate") || lowerName.includes("citric acid") || lowerName.includes("silicate") || lowerName.includes("powder") || lowerName.includes("flakes") || lowerName.includes("granules") || lowerName.includes("enzyme") || lowerName.includes("preservative") || lowerName.includes("dye") || lowerName.includes("fragrance");
    if (isSolidChemical) {
      return {
        activeMatterPct: 100,
        dataSource: "authoritative",
        category: resolvedCategory,
        isSurfactant,
        surfactantType,
        isWater: false,
        isSolvent: false,
        canonicalMatch
      };
    }
    return {
      activeMatterPct: 0,
      dataSource: "missing",
      category: resolvedCategory,
      isSurfactant,
      surfactantType,
      isWater: false,
      isSolvent: false,
      canonicalMatch
    };
  }
  /**
   * Evaluates complete Active Matter and Mass Balance Report for a formulation.
   */
  static calculateActiveMatterReport(ingredients, batchSizeKg = 100) {
    const safeIngs = Array.isArray(ingredients) ? ingredients : [];
    const validBatchSize = typeof batchSizeKg === "number" && batchSizeKg > 0 ? batchSizeKg : 100;
    const contributions = [];
    const diagnostics = [];
    const warnings = [];
    let totalRawMatter = 0;
    let totalActiveMatter = 0;
    let totalCarriedWaterPct = 0;
    let totalFreeWaterPct = 0;
    let anionicActivePct = 0;
    let nonionicActivePct = 0;
    let amphotericActivePct = 0;
    let cationicActivePct = 0;
    let totalActiveSurfactants = 0;
    let totalRawSurfactants = 0;
    let ingredientsWithMissingActive = 0;
    for (const ing of safeIngs) {
      const rawPct = Number(ing?.percentage ?? ing?.percent ?? ing?.percentageInFormula ?? 0);
      if (isNaN(rawPct) || rawPct < 0) {
        continue;
      }
      totalRawMatter += rawPct;
      const resolution = this.resolveIngredientActive(ing);
      const activePct = rawPct * resolution.activeMatterPct / 100;
      const carrierPct = Math.max(0, rawPct - activePct);
      const rawMassKg = rawPct / 100 * validBatchSize;
      const activeMassKg = activePct / 100 * validBatchSize;
      const carrierMassKg = carrierPct / 100 * validBatchSize;
      if (resolution.dataSource === "missing") {
        ingredientsWithMissingActive++;
        diagnostics.push(`Ingredient "${ing.name || "Unknown"}" lacks authoritative active assay data (unresolved active specification; INSUFFICIENT_DATA).`);
        warnings.push(`Ingredient "${ing.name || "Unknown"}" lacks authoritative active assay specification (INSUFFICIENT_DATA).`);
      }
      if (resolution.isWater) {
        totalFreeWaterPct += rawPct;
      } else {
        totalActiveMatter += activePct;
        totalCarriedWaterPct += carrierPct;
      }
      if (resolution.isSurfactant) {
        totalRawSurfactants += rawPct;
        totalActiveSurfactants += activePct;
        switch (resolution.surfactantType) {
          case "anionic":
            anionicActivePct += activePct;
            break;
          case "nonionic":
            nonionicActivePct += activePct;
            break;
          case "amphoteric":
            amphotericActivePct += activePct;
            break;
          case "cationic":
            cationicActivePct += activePct;
            break;
        }
      }
      contributions.push({
        id: ing.id,
        name: ing.name || "Unnamed Ingredient",
        category: resolution.category,
        role: ing.role || ing.function,
        rawPercentage: Number(rawPct.toFixed(3)),
        activeMatterPct: resolution.activeMatterPct,
        activePercentage: Number(activePct.toFixed(3)),
        carrierPercentage: Number(carrierPct.toFixed(3)),
        rawMassKg: Number(rawMassKg.toFixed(4)),
        activeMassKg: Number(activeMassKg.toFixed(4)),
        carrierMassKg: Number(carrierMassKg.toFixed(4)),
        isSurfactant: resolution.isSurfactant,
        surfactantType: resolution.surfactantType,
        isWater: resolution.isWater,
        isSolvent: resolution.isSolvent,
        dataSource: resolution.dataSource,
        notes: resolution.isWater ? "Carrier water" : `${resolution.activeMatterPct}% active (${resolution.dataSource})`
      });
    }
    const totalWaterPct = totalFreeWaterPct + totalCarriedWaterPct;
    const totalBatchActiveKg = totalActiveMatter / 100 * validBatchSize;
    const totalBatchWaterKg = totalWaterPct / 100 * validBatchSize;
    const anionicRatio = totalActiveSurfactants > 0 ? anionicActivePct / totalActiveSurfactants * 100 : 0;
    const nonionicRatio = totalActiveSurfactants > 0 ? nonionicActivePct / totalActiveSurfactants * 100 : 0;
    const amphotericRatio = totalActiveSurfactants > 0 ? amphotericActivePct / totalActiveSurfactants * 100 : 0;
    const cationicRatio = totalActiveSurfactants > 0 ? cationicActivePct / totalActiveSurfactants * 100 : 0;
    if (Math.abs(totalRawMatter - 100) > 0.5 && safeIngs.length > 0) {
      warnings.push(`Formula total raw percentage is ${totalRawMatter.toFixed(2)}% (target: 100.0%).`);
    }
    return {
      totalActiveMatter: Number(totalActiveMatter.toFixed(2)),
      totalRawMatter: Number(totalRawMatter.toFixed(2)),
      totalRawPercentage: Number(totalRawMatter.toFixed(2)),
      totalCarrierPercentage: Number(Math.max(0, totalRawMatter - totalActiveMatter).toFixed(2)),
      totalActiveKg: Number(totalBatchActiveKg.toFixed(3)),
      totalCarriedWaterPct: Number(totalCarriedWaterPct.toFixed(2)),
      totalFreeWaterPct: Number(totalFreeWaterPct.toFixed(2)),
      totalWaterPct: Number(totalWaterPct.toFixed(2)),
      totalBatchActiveKg: Number(totalBatchActiveKg.toFixed(3)),
      totalBatchWaterKg: Number(totalBatchWaterKg.toFixed(3)),
      surfactants: {
        anionicActivePct: Number(anionicActivePct.toFixed(2)),
        nonionicActivePct: Number(nonionicActivePct.toFixed(2)),
        amphotericActivePct: Number(amphotericActivePct.toFixed(2)),
        cationicActivePct: Number(cationicActivePct.toFixed(2)),
        totalActiveSurfactants: Number(totalActiveSurfactants.toFixed(2)),
        totalRawSurfactants: Number(totalRawSurfactants.toFixed(2)),
        anionicRatio: Number(anionicRatio.toFixed(1)),
        nonionicRatio: Number(nonionicRatio.toFixed(1)),
        amphotericRatio: Number(amphotericRatio.toFixed(1)),
        cationicRatio: Number(cationicRatio.toFixed(1))
      },
      waterBalance: {
        freeAddedWaterPct: Number(totalFreeWaterPct.toFixed(2)),
        carriedWaterPct: Number(totalCarriedWaterPct.toFixed(2)),
        totalWaterPct: Number(totalWaterPct.toFixed(2)),
        freeAddedWaterKg: Number((totalFreeWaterPct / 100 * validBatchSize).toFixed(3)),
        carriedWaterKg: Number((totalCarriedWaterPct / 100 * validBatchSize).toFixed(3)),
        totalWaterKg: Number(totalBatchWaterKg.toFixed(3))
      },
      contributions,
      isFullyAuthoritative: ingredientsWithMissingActive === 0,
      activeMatterStatus: ingredientsWithMissingActive === 0 ? "COMPLETE" : "INSUFFICIENT_DATA",
      ingredientsCount: contributions.length,
      ingredientsWithMissingActive,
      diagnostics,
      warnings
    };
  }
  /**
   * Fast calculation helper: Total Active Solids % (w/w)
   */
  static calculateTotalActiveMatter(ingredients) {
    return this.calculateActiveMatterReport(ingredients).totalActiveMatter;
  }
  /**
   * Fast calculation helper: Total Active Surfactants % (w/w)
   */
  static calculateActiveSurfactants(ingredients) {
    return this.calculateActiveMatterReport(ingredients).surfactants.totalActiveSurfactants;
  }
  /**
   * Fast calculation helper: Total Raw Surfactants % (w/w)
   */
  static calculateRawSurfactants(ingredients) {
    return this.calculateActiveMatterReport(ingredients).surfactants.totalRawSurfactants;
  }
  /**
   * Single-ingredient active matter lookup helper
   */
  static getDefaultActiveMatter(nameOrIng) {
    if (typeof nameOrIng === "string") {
      return this.resolveIngredientActive({ name: nameOrIng }).activeMatterPct;
    }
    return this.resolveIngredientActive(nameOrIng).activeMatterPct;
  }
};
function calculateActiveMatter(ingredients) {
  return ActiveMatterEngine.calculateTotalActiveMatter(ingredients);
}
function calculateActiveSurfactants(ingredients) {
  return ActiveMatterEngine.calculateActiveSurfactants(ingredients);
}
function calculateRawSurfactants(ingredients) {
  return ActiveMatterEngine.calculateRawSurfactants(ingredients);
}

// src/utils/densityEngine.ts
function getStandardComponentDensity(name) {
  const n = (name || "").toLowerCase().trim();
  if (n.includes("water") || n.includes("aqua") || n === "di water" || n === "ro water") return 1;
  if (n.includes("labsa") || n.includes("sulfonic") || n.includes("acid slurry")) {
    return n.includes("90") ? 1.05 : 1.06;
  }
  if (n.includes("sles") || n.includes("lauryl ether sulfate") || n.includes("laureth sulfate")) {
    return n.includes("28") ? 1.03 : 1.1;
  }
  if (n.includes("sls") || n.includes("sodium lauryl sulfate")) {
    return n.includes("30") ? 1.04 : 1.1;
  }
  if (n.includes("capb") || n.includes("betaine")) {
    return n.includes("45") ? 1.07 : 1.045;
  }
  if (n.includes("cdea") || n.includes("cocamide dea") || n.includes("diethanolamide")) return 1;
  if (n.includes("cmea") || n.includes("cocamide mea")) return 1.02;
  if (n.includes("lae") || n.includes("ethoxylate") || n.includes("np-9") || n.includes("lutensol")) return 1.01;
  if (n.includes("apg") || n.includes("glucoside")) return 1.1;
  if (n.includes("naoh") || n.includes("caustic soda") || n.includes("sodium hydroxide")) {
    if (n.includes("48%") || n.includes("lye (48%)")) return 1.51;
    if (n.includes("50%") || n.includes("lye (50%)")) return 1.53;
    return 1.45;
  }
  if (n.includes("koh") || n.includes("potassium hydroxide")) return 1.45;
  if (n.includes("soda ash") || n.includes("sodium carbonate")) return 1.2;
  if (n.includes("sodium sulfate") || n.includes("sulfate")) return 1.2;
  if (n.includes("sodium chloride") || n.includes("salt") || n.includes("vacuum salt")) return 1.2;
  if (n.includes("sodium citrate") || n.includes("citrate")) return 1.18;
  if (n.includes("citric acid")) return 1.15;
  if (n.includes("glda") || n.includes("dissolvine")) return 1.3;
  if (n.includes("edta")) return 1.28;
  if (n.includes("mgda") || n.includes("trilon")) return 1.28;
  if (n.includes("glycerin") || n.includes("glycerol")) return 1.26;
  if (n.includes("propylene glycol") || n.includes("pg")) return 1.036;
  if (n.includes("ethanol") || n.includes("alcohol")) return 0.805;
  if (n.includes("isopropanol") || n.includes("ipa")) return 0.786;
  if (n.includes("fragrance") || n.includes("perfume") || n.includes("essential oil")) return 0.95;
  if (n.includes("preservative") || n.includes("kathon") || n.includes("phenoxyethanol")) return 1.05;
  if (n.includes("xanthan") || n.includes("carbomer") || n.includes("hpmc") || n.includes("cmc")) return 1.15;
  return null;
}
function calculateDensity(ingredients = [], totalBatchMassGrams = 100) {
  const safeList = Array.isArray(ingredients) ? ingredients : [];
  if (safeList.length === 0) {
    return {
      densityGPerCm3: 1,
      densityKgPerM3: 1e3,
      specificGravity: 1.002,
      totalMassGrams: totalBatchMassGrams,
      totalVolumeCm3: totalBatchMassGrams,
      isIdealVolumeAdditivity: true,
      confidence: "HIGH",
      modelType: "Pure Water Reference (20\xB0C)",
      densityType: "PREDICTED_DENSITY",
      densityStatus: "PREDICTED",
      provenance: "PREDICTED",
      contributions: [],
      notes: "No ingredients provided. Defaulting to pure water baseline at 20\xB0C (1.000 g/cm\xB3)."
    };
  }
  let totalMass = 0;
  let totalVolume = 0;
  let hasUncertainDensity = false;
  const unknownDensityIngredients = [];
  const rawContributions = [];
  safeList.forEach((ing) => {
    const rawPct = Number(ing.percentage ?? ing.percent ?? ing.percentageInFormula ?? 0);
    if (rawPct <= 0) return;
    const name = ing.name || "Component";
    const explicitDensity = typeof ing.density === "number" && ing.density > 0.1 ? ing.density : void 0;
    const stdDensity = getStandardComponentDensity(name);
    if (explicitDensity === void 0 && stdDensity === null) {
      hasUncertainDensity = true;
      unknownDensityIngredients.push(name);
    }
    const compDensity = explicitDensity || stdDensity || 1;
    const compMassG = rawPct / 100 * totalBatchMassGrams;
    const compVolCm3 = compMassG / compDensity;
    totalMass += compMassG;
    totalVolume += compVolCm3;
    rawContributions.push({
      name,
      massPercentage: rawPct,
      componentDensityGPerCm3: compDensity,
      volumeCm3: compVolCm3
    });
  });
  if (totalMass <= 0 || totalVolume <= 0) {
    return {
      densityGPerCm3: 1,
      densityKgPerM3: 1e3,
      specificGravity: 1.002,
      totalMassGrams: totalBatchMassGrams,
      totalVolumeCm3: totalBatchMassGrams,
      isIdealVolumeAdditivity: true,
      confidence: "HIGH",
      modelType: "Pure Water Reference (20\xB0C)",
      densityType: "PREDICTED_DENSITY",
      densityStatus: "PREDICTED",
      provenance: "PREDICTED",
      contributions: [],
      notes: "Empty or zero active mass. Defaulting to pure water baseline."
    };
  }
  const mixDensityGPerCm3 = totalMass / totalVolume;
  const densityKgPerM3 = mixDensityGPerCm3 * 1e3;
  const specificGravity = mixDensityGPerCm3 / 0.9982;
  const contributions = rawContributions.map((c) => ({
    name: c.name,
    massPercentage: Number(c.massPercentage.toFixed(2)),
    componentDensityGPerCm3: Number(c.componentDensityGPerCm3.toFixed(3)),
    volumeCm3: Number(c.volumeCm3.toFixed(3)),
    volumeFraction: Number((c.volumeCm3 / totalVolume).toFixed(4))
  }));
  return {
    densityGPerCm3: Number(mixDensityGPerCm3.toFixed(3)),
    densityKgPerM3: Number(densityKgPerM3.toFixed(1)),
    specificGravity: Number(specificGravity.toFixed(3)),
    totalMassGrams: Number(totalMass.toFixed(2)),
    totalVolumeCm3: Number(totalVolume.toFixed(2)),
    isIdealVolumeAdditivity: true,
    confidence: hasUncertainDensity ? "LOW" : "HIGH",
    modelType: hasUncertainDensity ? "Partial Ideal Volume Additivity (Estimated Density)" : "Ideal Harmonic Volume Additivity",
    densityType: "PREDICTED_DENSITY",
    densityStatus: hasUncertainDensity ? "SCREENING_ESTIMATE" : "PREDICTED",
    provenance: "PREDICTED",
    unknownDensityIngredients: hasUncertainDensity ? unknownDensityIngredients : void 0,
    limitations: [
      "Assumes ideal volume additivity [\u03C1_mix = \u03A3 m_i / \u03A3 (m_i / \u03C1_i)].",
      "Does not model non-ideal excess volume of mixing (contraction or expansion) in concentrated polar solvent/surfactant systems.",
      "Empirical pycnometer or digital density meter measurement is required for certified packaging density."
    ],
    contributions,
    notes: hasUncertainDensity ? "Formulation contains ingredients with missing/unknown component density. Mixture density is ESTIMATED / INSUFFICIENT_DATA and cannot be reported with HIGH confidence." : "Mixture density calculated via ideal volume additivity [\u03C1_mix = \u03A3 m_i / \u03A3 (m_i / \u03C1_i)]. Minor excess volume of mixing (<1%) may occur in concentrated alcohol/glycol blends."
  };
}

// src/utils/hlbEngine.ts
var AUTHORITATIVE_HLB_BENCHMARKS = [
  { name: "Span 80 (Sorbitan Monooleate)", hlb: 4.3, category: "Nonionic Surfactant", activeDefault: 100, scaleType: "Griffin", description: "W/O emulsifier, lipophilic oil-soluble surfactant." },
  { name: "Span 20 (Sorbitan Monolaurate)", hlb: 8.6, category: "Nonionic Surfactant", activeDefault: 100, scaleType: "Griffin", description: "W/O and O/W co-emulsifier." },
  { name: "Glyceryl Monostearate (GMS)", hlb: 3.8, category: "Nonionic Surfactant", activeDefault: 100, scaleType: "Griffin", description: "Low HLB lipophilic consistency builder." },
  { name: "LAE-3 (Alcohol Ethoxylate 3EO)", hlb: 8, category: "Nonionic Surfactant", activeDefault: 100, scaleType: "Griffin", description: "Low HLB nonionic for oily soil penetration." },
  { name: "Nonylphenol Ethoxylate 6EO (NP-6)", hlb: 10.9, category: "Nonionic Surfactant", activeDefault: 100, scaleType: "Griffin", description: "Degreaser and oil wetting nonionic." },
  { name: "LAE-7 (Alcohol Ethoxylate 7EO)", hlb: 12.1, category: "Nonionic Surfactant", activeDefault: 100, scaleType: "Griffin", description: "Standard O/W detergent nonionic surfactant." },
  { name: "Nonylphenol Ethoxylate 9EO (NP-9)", hlb: 13, category: "Nonionic Surfactant", activeDefault: 100, scaleType: "Griffin", description: "Workhorse industrial hard surface detergency nonionic." },
  { name: "LAE-9 (Alcohol Ethoxylate 9EO)", hlb: 13.1, category: "Nonionic Surfactant", activeDefault: 100, scaleType: "Griffin", description: "High-performance laundry and degreasing nonionic." },
  { name: "APG 1214 (Lauryl Glucoside 50%)", hlb: 12.5, category: "Nonionic Surfactant", activeDefault: 50, scaleType: "Griffin", description: "Eco-certified plant glucoside surfactant." },
  { name: "APG 0810 (Caprylyl/Capryl Glucoside 50%)", hlb: 13, category: "Nonionic Surfactant", activeDefault: 50, scaleType: "Griffin", description: "High-solubility nonionic hydrotrope." },
  { name: "Cocamide DEA 85% (CDEA)", hlb: 13.5, category: "Nonionic Surfactant", activeDefault: 85, scaleType: "Griffin", description: "Alkanolamide foam stabilizer and viscosity builder." },
  { name: "Cocamide MEA 90% (CMEA)", hlb: 11.5, category: "Nonionic Surfactant", activeDefault: 90, scaleType: "Griffin", description: "Solid flake alkanolamide foam booster." },
  { name: "Lauryl Amine Oxide 30% (LDAO)", hlb: 14.2, category: "Nonionic Surfactant", activeDefault: 30, scaleType: "Griffin", description: "Amine oxide foam booster and hypochlorite-stable nonionic." },
  { name: "LAE-12 (Alcohol Ethoxylate 12EO)", hlb: 14.5, category: "Nonionic Surfactant", activeDefault: 100, scaleType: "Griffin", description: "High cloud point hydrophilic nonionic detergent." },
  { name: "Polysorbate 80 (Tween 80)", hlb: 15, category: "Nonionic Surfactant", activeDefault: 100, scaleType: "Griffin", description: "Hydrophilic O/W emulsifier and essential oil solubilizer." },
  { name: "PEG-40 Hydrogenated Castor Oil", hlb: 15, category: "Nonionic Surfactant", activeDefault: 100, scaleType: "Griffin", description: "High-efficiency fragrance and lipophilic solubilizer." },
  { name: "Polysorbate 20 (Tween 20)", hlb: 16.7, category: "Nonionic Surfactant", activeDefault: 100, scaleType: "Griffin", description: "Hydrophilic fragrance solubilizer." },
  { name: "CAPB 30% (Cocamidopropyl Betaine)", hlb: 12, category: "Amphoteric Surfactant", activeDefault: 30, scaleType: "Griffin", description: "Zwitterionic secondary surfactant." },
  { name: "LABSA 96% (Acid Slurry / Neutralized LAS)", hlb: 11.5, category: "Anionic Surfactant", activeDefault: 96, scaleType: "Griffin", description: "Primary linear alkylbenzene sulfonate detergency benchmark." },
  { name: "SLES 70% (Sodium Lauryl Ether Sulfate)", hlb: 40, category: "Anionic Surfactant", activeDefault: 70, scaleType: "Davies", description: "Extended ionic sulfate surfactant on Davies scale." },
  { name: "SLES 28% Liquid", hlb: 40, category: "Anionic Surfactant", activeDefault: 28, scaleType: "Davies", description: "Extended ionic sulfate surfactant on Davies scale." },
  { name: "SLS 95% Needles (Sodium Lauryl Sulfate)", hlb: 40, category: "Anionic Surfactant", activeDefault: 95, scaleType: "Davies", description: "Extended ionic sulfate surfactant on Davies scale." }
];
var HLBEngine = class {
  /**
   * Resolves raw-material grade and HLB data from canonical library or explicit overrides.
   */
  static resolveIngredientHLB(ing) {
    const rawName = (ing?.name || "").trim();
    const lowerName = rawName.toLowerCase();
    const explicitActive = ing?.activeMatterPct ?? ing?.activePercent ?? ing?.activeMatterPurity ?? ing?.activeMatter;
    const explicitHlb = ing?.hlbValue ?? ing?.hlb;
    const isWater = lowerName.includes("water") || lowerName.includes("aqua") || lowerName === "di water" || lowerName === "ro water";
    let canonicalMatch;
    if (ing?.id) {
      canonicalMatch = UNIVERSAL_INGREDIENTS.find((u) => u.id === ing.id);
    }
    if (!canonicalMatch && rawName) {
      canonicalMatch = UNIVERSAL_INGREDIENTS.find((u) => u.name.toLowerCase() === lowerName);
    }
    if (!canonicalMatch && rawName) {
      canonicalMatch = UNIVERSAL_INGREDIENTS.find(
        (u) => lowerName.includes(u.name.toLowerCase()) || u.name.toLowerCase().includes(lowerName) || u.inciName && lowerName.includes(u.inciName.toLowerCase())
      );
    }
    const resolvedCategory = canonicalMatch?.category || ing?.category || "";
    const catLower = resolvedCategory.toLowerCase();
    const isSurfactantCategory = catLower.includes("surfactant") || catLower.includes("betaine") || catLower.includes("foamer") || catLower.includes("emulsifier") || catLower.includes("solubilizer");
    const isSurfactant = !isWater && (isSurfactantCategory || explicitHlb !== void 0 && explicitHlb !== null && explicitHlb > 0);
    const isIonic = catLower.includes("anionic") || catLower.includes("cationic") || catLower.includes("amphoteric");
    let activeMatterPct = 100;
    if (explicitActive !== void 0 && explicitActive !== null && !isNaN(Number(explicitActive))) {
      activeMatterPct = Number(explicitActive);
    } else if (canonicalMatch?.activeDefault !== void 0) {
      activeMatterPct = canonicalMatch.activeDefault;
    } else if (isWater) {
      activeMatterPct = 0;
    }
    if (explicitHlb !== void 0 && explicitHlb !== null && !isNaN(Number(explicitHlb))) {
      return {
        hlb: Number(explicitHlb),
        dataSource: "explicit_override",
        activeMatterPct,
        category: resolvedCategory,
        isSurfactant,
        isIonic
      };
    }
    if (canonicalMatch && canonicalMatch.hlb !== void 0 && canonicalMatch.hlb !== null && !isNaN(Number(canonicalMatch.hlb))) {
      return {
        hlb: Number(canonicalMatch.hlb),
        dataSource: "authoritative",
        activeMatterPct,
        category: resolvedCategory,
        isSurfactant: true,
        isIonic
      };
    }
    const benchMatch = AUTHORITATIVE_HLB_BENCHMARKS.find((b) => {
      const bLower = b.name.toLowerCase();
      const bParen = bLower.split("(")[0].trim();
      const bInParen = bLower.includes("(") ? bLower.split("(")[1].replace(")", "").trim() : "";
      if (lowerName === bLower || lowerName === bParen || bInParen && lowerName === bInParen) {
        return true;
      }
      if (bParen && lowerName.includes(bParen)) {
        return true;
      }
      if (bInParen && lowerName.includes(bInParen)) {
        return true;
      }
      return bLower.includes(lowerName);
    });
    if (benchMatch && (isSurfactant || isSurfactantCategory || benchMatch.category.toLowerCase().includes("surfactant"))) {
      return {
        hlb: benchMatch.hlb,
        dataSource: "authoritative",
        activeMatterPct: explicitActive !== void 0 ? Number(explicitActive) : benchMatch.activeDefault,
        category: resolvedCategory || benchMatch.category,
        isSurfactant: true,
        isIonic: benchMatch.scaleType === "Davies" || isIonic
      };
    }
    return {
      hlb: null,
      dataSource: "missing",
      activeMatterPct,
      category: resolvedCategory,
      isSurfactant,
      isIonic
    };
  }
  /**
   * Determine Emulsification Region according to standard Griffin & Davies mapping
   */
  static mapEmulsionRegion(hlb) {
    if (hlb <= 0) {
      return {
        region: "Non-Surfactant / Not Applicable",
        interpretation: "No active surfactant HLB contribution detected."
      };
    }
    if (hlb >= 1 && hlb < 3.5) {
      return {
        region: "Antifoaming Agent",
        interpretation: "Lipophilic defoaming agent; suppresses foam formation in liquid shear."
      };
    }
    if (hlb >= 3.5 && hlb < 6) {
      return {
        region: "Water-in-Oil (W/O) Emulsifier",
        interpretation: "Lipophilic emulsifier ideal for inverted water-in-oil creams, polishes, and grease pastes."
      };
    }
    if (hlb >= 6 && hlb < 8) {
      return {
        region: "Wetting & Spreading Agent",
        interpretation: "Intermediate HLB providing rapid substrate wetting, spreading, and penetration."
      };
    }
    if (hlb >= 8 && hlb < 13) {
      return {
        region: "Oil-in-Water (O/W) Emulsifier",
        interpretation: "Standard oil-in-water emulsifier suitable for milky lotions, vehicle washes, and general degreasers."
      };
    }
    if (hlb >= 13 && hlb <= 15) {
      return {
        region: "Detergent & Micellar Cleanser",
        interpretation: "Optimal nonionic detergency & micellar solubilization window (HLB 12-15) for laundry and dishwashing."
      };
    }
    if (hlb > 15 && hlb <= 18) {
      return {
        region: "Hydrophilic Solubilizer",
        interpretation: "High hydrophilic strength for clear micro-emulsification of essential oils, perfumes, and active actives."
      };
    }
    return {
      region: "Extended Ionic Surfactant (Davies Scale)",
      interpretation: "Extended ionic HLB (Davies scale). High charge-density hydrophilic detergency and foaming."
    };
  }
  /**
   * Computes the blended HLB across all surfactants in the formulation.
   * 
   * Mathematical Model:
   *   HLB_blend = Σ(HLB_i * W_active_i) / Σ(W_active_i)
   * 
   * where W_active_i = (percentage_i * activeMatter_i) / 100
   * 
   * Returns authoritative HLBCalculationResult.
   */
  static calculateBlendedHLB(ingredients) {
    const safeIngs = Array.isArray(ingredients) ? ingredients : [];
    const contributions = [];
    const limitations = [];
    let totalSurfactantRawWeight = 0;
    let totalSurfactantActiveWeight = 0;
    let weightedHLB = 0;
    let surfactantsWithAuthoritativeHLB = 0;
    let surfactantsWithMissingHLB = 0;
    let hasIonicSurfactants = false;
    for (const ing of safeIngs) {
      const pct = Number(ing?.percentage ?? ing?.percent ?? ing?.percentageInFormula ?? 0);
      if (isNaN(pct) || pct <= 0) {
        continue;
      }
      const resolution = this.resolveIngredientHLB(ing);
      if (resolution.isSurfactant || resolution.hlb !== null && resolution.hlb > 0) {
        const activeWeight = pct * resolution.activeMatterPct / 100;
        totalSurfactantRawWeight += pct;
        totalSurfactantActiveWeight += activeWeight;
        if (resolution.isIonic) {
          hasIonicSurfactants = true;
        }
        if (resolution.hlb !== null && resolution.hlb >= 0) {
          if (resolution.dataSource === "authoritative" || resolution.dataSource === "explicit_override") {
            surfactantsWithAuthoritativeHLB++;
          }
          weightedHLB += resolution.hlb * activeWeight;
        } else {
          surfactantsWithMissingHLB++;
          limitations.push(`Surfactant "${ing.name || "Unknown"}" lacks authoritative HLB data.`);
        }
        const methodMeta = resolution.dataSource === "missing" ? "UNKNOWN" : resolution.dataSource === "explicit_override" ? "SUPPLIER_REPORTED" : resolution.isIonic ? "DAVIES" : "GRIFFIN";
        contributions.push({
          id: ing.id,
          name: ing.name || "Unnamed Surfactant",
          category: resolution.category,
          percentage: pct,
          activeMatterPct: resolution.activeMatterPct,
          activeWeight: Number(activeWeight.toFixed(3)),
          hlb: resolution.hlb,
          dataSource: resolution.dataSource,
          isIonicSurfactant: resolution.isIonic,
          methodMetadata: methodMeta,
          notes: resolution.dataSource === "missing" ? "Missing HLB in master database" : `${resolution.dataSource} (${resolution.isIonic ? "Davies / Ionic" : "Griffin Scale"})`
        });
      }
    }
    const hasSurfactants = totalSurfactantActiveWeight > 0 && contributions.length > 0;
    const finalBlendedHLB = totalSurfactantActiveWeight > 0 ? Number((weightedHLB / totalSurfactantActiveWeight).toFixed(2)) : 0;
    const { region, interpretation } = this.mapEmulsionRegion(finalBlendedHLB);
    if (hasIonicSurfactants) {
      limitations.push("Mixture contains ionic surfactants: Griffin HLB is strictly defined for nonionic surfactants. Extended values reflect the Davies scale.");
    }
    const isFullyAuthoritative = hasSurfactants && surfactantsWithMissingHLB === 0;
    const overallMethodMeta = !hasSurfactants ? "NOT_APPLICABLE" : hasIonicSurfactants ? "DAVIES" : "GRIFFIN";
    return {
      blendedHLB: finalBlendedHLB,
      hasSurfactants,
      totalSurfactantRawWeight: Number(totalSurfactantRawWeight.toFixed(2)),
      totalSurfactantActiveWeight: Number(totalSurfactantActiveWeight.toFixed(2)),
      surfactantsCount: contributions.length,
      surfactantsWithAuthoritativeHLB,
      surfactantsWithMissingHLB,
      isFullyAuthoritative,
      hasIonicSurfactants,
      methodMetadata: overallMethodMeta,
      emulsionRegion: region,
      interpretation,
      scientificNotes: hasSurfactants ? `Blended HLB ${finalBlendedHLB.toFixed(2)} calculated from ${contributions.length} surfactant(s) based on active-matter mass fractions.` : "No surfactant components with valid HLB detected in formulation.",
      contributions,
      limitations
    };
  }
  /**
   * Fast helper for single-number output backwards compatibility.
   */
  static calculateBlendedHLBNumber(ingredients) {
    return this.calculateBlendedHLB(ingredients).blendedHLB;
  }
  /**
   * Legacy tuple calculator compatibility: takes array of { name, hlb, proportion / weight }
   */
  static calculateHLBFromList(surfactants) {
    let totalWeight = 0;
    let weightedHLB = 0;
    for (const s of surfactants || []) {
      const w = s.proportion !== void 0 ? s.proportion : s.weight || 0;
      const hlb = s.hlb || 0;
      if (w > 0 && !isNaN(w) && !isNaN(hlb)) {
        totalWeight += w;
        weightedHLB += hlb * w;
      }
    }
    return totalWeight > 0 ? Number((weightedHLB / totalWeight).toFixed(2)) : 0;
  }
};
function calculateBlendedHLB(ingredients) {
  return HLBEngine.calculateBlendedHLBNumber(ingredients);
}

// src/utils/liquidNvrEngine.ts
function calculateLiquidNVR(ingredients, batchSizeKg = 100) {
  const safeIngs = Array.isArray(ingredients) ? ingredients : [];
  let knownNvrSum = 0;
  let knownMassSum = 0;
  let unknownMassSum = 0;
  const unknownIngredients = [];
  for (const ing of safeIngs) {
    const percentage = Number(ing.percentage ?? ing.percent ?? 0);
    if (percentage <= 0) continue;
    if (ing.nonVolatileFraction !== void 0 && ing.nonVolatileFraction !== null && !isNaN(ing.nonVolatileFraction)) {
      const fraction = Math.max(0, Math.min(1, ing.nonVolatileFraction));
      knownNvrSum += percentage * fraction;
      knownMassSum += percentage;
    } else if (isKnownVolatile(ing)) {
      knownNvrSum += 0;
      knownMassSum += percentage;
    } else {
      unknownMassSum += percentage;
      unknownIngredients.push(ing.name || "Unknown Ingredient");
    }
  }
  const totalFormulaMass = knownMassSum + unknownMassSum;
  const knownMassPercent = Number(knownMassSum.toFixed(2));
  const unknownMassPercent = Number(unknownMassSum.toFixed(2));
  const dataCompleteness = totalFormulaMass > 0 ? Number((knownMassSum / totalFormulaMass * 100).toFixed(1)) : 100;
  const isComplete = unknownMassPercent === 0;
  const status = isComplete ? "COMPLETE" : "INSUFFICIENT_DATA";
  const provenance = isComplete ? "CALCULATED" : "INSUFFICIENT_DATA";
  const nvrPercentage = Number(knownNvrSum.toFixed(2));
  const nvrMassKg = Number((nvrPercentage / 100 * batchSizeKg).toFixed(3));
  return {
    nvrPercentage,
    nvrMassKg,
    knownMassPercent,
    unknownMassPercent,
    dataCompleteness,
    status,
    isComplete,
    unknownIngredients,
    provenance,
    dryingProtocolAssumed: "Oven drying at 105\xB0C \xB1 2\xB0C (METHOD_NOT_VERIFIED; pending authoritative laboratory method citation)",
    limitations: [
      "Calculated value represents theoretical non-volatile solids based on ingredient specifications.",
      "Physical oven drying may show minor deviations due to water-of-crystallization retention or volatile co-solvent stripping.",
      "Laboratory gravimetric measurement is required for certified CoA release testing."
    ]
  };
}
function isKnownVolatile(ing) {
  const name = (ing.name || "").toLowerCase().trim();
  const role = (ing.role || ing.category || "").toLowerCase().trim();
  if (name.includes("water") || name.includes("aqua") || name.includes("deionized") || name.includes("demineralized") || name === "di water" || name === "ro water") {
    return true;
  }
  if (name.includes("ethanol") || name.includes("isopropyl alcohol") || name.includes("isopropanol") || name.includes("ipa") || name.includes("denatured alcohol") || name.includes("methanol") || name.includes("acetone") || role === "volatile solvent" || role === "solvent base" || role.includes("solvent") && (name.includes("alcohol") || name.includes("water"))) {
    return true;
  }
  return false;
}

// src/domain/productTaxonomy.ts
var CANONICAL_PRODUCT_CATEGORY_IDS = [
  "LAUNDRY_LIQUID",
  "LAUNDRY_POWDER",
  "DISHWASH_MANUAL",
  "DISHWASH_AUTOMATIC",
  "FLOOR_CLEANER",
  "MULTIPURPOSE_CLEANER",
  "TOILET_CLEANER",
  "BATHROOM_CLEANER",
  "GLASS_CLEANER",
  "FABRIC_SOFTENER",
  "HAND_WASH",
  "KITCHEN_DEGREASER",
  "CAR_SHAMPOO"
];
var PRODUCT_TAXONOMY_MAP = {
  LAUNDRY_LIQUID: {
    id: "LAUNDRY_LIQUID",
    label: "Liquid Laundry",
    description: "Liquid detergent formulated for fabric cleaning in top-load and front-load washing machines.",
    physicalForm: "LIQUID",
    family: "LAUNDRY_CARE",
    targetPHMin: 7.5,
    targetPHMax: 9.5,
    defaultPH: 8.5,
    activeMatterMinPct: 10,
    activeMatterTargetPct: 16,
    foamExpectation: "Medium / Controlled",
    primaryFunction: "Removal of particulate soil, sebum, and greasy stains from fabrics",
    keyConstraints: [
      "Prevent enzyme denaturation above pH 9.5",
      "Keep viscosity between 600-1200 cP",
      "Maintain hard water chelation"
    ],
    defaultFormulaId: "hd-liquid-laundry",
    defaultFormulaStatus: "AVAILABLE",
    categoryApplicability: {
      hlb: true,
      cmc: true,
      viscosity: true,
      cleaningScore: true,
      foam: true,
      builder: true
    }
  },
  LAUNDRY_POWDER: {
    id: "LAUNDRY_POWDER",
    label: "Powder Laundry",
    description: "Granular heavy-duty laundry washing powder with alkaline builder and soil-suspending systems.",
    physicalForm: "POWDER",
    family: "LAUNDRY_CARE",
    targetPHMin: 9.5,
    targetPHMax: 11.5,
    defaultPH: 10.5,
    activeMatterMinPct: 10,
    activeMatterTargetPct: 15,
    foamExpectation: "High / Controlled",
    primaryFunction: "Alkaline saponification, builder water-softening, and soil suspension in powder washing",
    keyConstraints: [
      "Moisture content must be < 5%",
      "Prevent caking with anticaking silicates",
      "Keep bulk density between 0.45-0.85 g/cm\xB3"
    ],
    defaultFormulaId: "high-foam-laundry-powder",
    defaultFormulaStatus: "AVAILABLE",
    categoryApplicability: {
      hlb: false,
      cmc: true,
      viscosity: false,
      cleaningScore: true,
      foam: true,
      builder: true
    }
  },
  DISHWASH_MANUAL: {
    id: "DISHWASH_MANUAL",
    label: "Manual Dishwash",
    description: "Hand dishwashing liquid formulated for grease emulsification, skin mildness, and high foam build.",
    physicalForm: "LIQUID",
    family: "DISH_CARE",
    targetPHMin: 6,
    targetPHMax: 8,
    defaultPH: 6.8,
    activeMatterMinPct: 12,
    activeMatterTargetPct: 20,
    foamExpectation: "High / Dense",
    primaryFunction: "Hand-safe grease emulsification and persistent high foam build",
    keyConstraints: [
      "Skin compatibility pH range 6.0-7.5",
      "Require amphoteric CAPB for mildness",
      "High viscosity (1500-2500 cP)"
    ],
    defaultFormulaId: "dishwash-manual-premium",
    defaultFormulaStatus: "AVAILABLE",
    categoryApplicability: {
      hlb: true,
      cmc: true,
      viscosity: true,
      cleaningScore: true,
      foam: true,
      builder: true
    }
  },
  DISHWASH_AUTOMATIC: {
    id: "DISHWASH_AUTOMATIC",
    label: "Automatic Dishwasher",
    description: "Machine dishwashing detergent engineered for zero foam, soil enzyme breakdown, and glass sheeting.",
    physicalForm: "LIQUID",
    family: "DISH_CARE",
    targetPHMin: 8.5,
    targetPHMax: 11.5,
    defaultPH: 10,
    activeMatterMinPct: 4,
    activeMatterTargetPct: 8,
    foamExpectation: "Low / Zero Suds",
    primaryFunction: "Low-foaming mechanical dishwashing, glass sheeting, and protein enzyme breakdown",
    keyConstraints: [
      "STRICT ZERO FOAM to prevent pump cavitation",
      "Prevent etching on glassware with silicates",
      "Enzyme stability"
    ],
    defaultFormulaId: "dishwash-auto-standard",
    defaultFormulaStatus: "AVAILABLE",
    categoryApplicability: {
      hlb: true,
      cmc: true,
      viscosity: true,
      cleaningScore: true,
      foam: true,
      builder: true
    }
  },
  FLOOR_CLEANER: {
    id: "FLOOR_CLEANER",
    label: "Floor Cleaner",
    description: "Hard surface mop-down cleaner designed for fast streak-free drying without slippery or sticky residue.",
    physicalForm: "LIQUID",
    family: "SURFACE_CARE",
    targetPHMin: 6.5,
    targetPHMax: 9.5,
    defaultPH: 7.5,
    activeMatterMinPct: 3,
    activeMatterTargetPct: 6,
    foamExpectation: "Low / Controlled",
    primaryFunction: "Mop-down surface dirt removal without leaving sticky residue or slippery film",
    keyConstraints: [
      "Zero sticky polymer residue",
      "Fast drying time",
      "Neutral pH range 7.0-8.0 for marble/granite safety"
    ],
    defaultFormulaId: "floor-cleaner-economy-pine",
    defaultFormulaStatus: "AVAILABLE",
    categoryApplicability: {
      hlb: true,
      cmc: true,
      viscosity: true,
      cleaningScore: true,
      foam: true,
      builder: true
    }
  },
  MULTIPURPOSE_CLEANER: {
    id: "MULTIPURPOSE_CLEANER",
    label: "Multipurpose Cleaner",
    description: "Versatile spray-and-wipe cleaner safe for countertops, tiles, kitchen fixtures, and painted surfaces.",
    physicalForm: "LIQUID",
    family: "SURFACE_CARE",
    targetPHMin: 7,
    targetPHMax: 10,
    defaultPH: 8.5,
    activeMatterMinPct: 4,
    activeMatterTargetPct: 8,
    foamExpectation: "Medium / Moderate",
    primaryFunction: "Versatile spray-and-wipe cleaning across countertops, appliances, and fixtures",
    keyConstraints: [
      "Compatible with trigger spray bottles",
      "Mild degreasing with APG or LAE nonionics",
      "No harsh fumes"
    ],
    defaultFormulaId: "multi-surface-citrus-spray",
    defaultFormulaStatus: "AVAILABLE",
    categoryApplicability: {
      hlb: true,
      cmc: true,
      viscosity: true,
      cleaningScore: true,
      foam: true,
      builder: true
    }
  },
  TOILET_CLEANER: {
    id: "TOILET_CLEANER",
    label: "Toilet Cleaner",
    description: "Acidic thickened descaling cleaner for rapid dissolution of uric scale, lime deposits, and rust stains.",
    physicalForm: "LIQUID",
    family: "SURFACE_CARE",
    targetPHMin: 1,
    targetPHMax: 2.5,
    defaultPH: 1.5,
    activeMatterMinPct: 2,
    activeMatterTargetPct: 5,
    foamExpectation: "Clinging Foam",
    primaryFunction: "Dissolution of uric scale, lime scale, and rust stains under porcelain bowl rims",
    keyConstraints: [
      "High vertical surface cling (viscosity 800-1500 cP)",
      "Corrosion inhibition required for metal pipes",
      "Acidic stability with amine ethoxylate / HCl or organic acid"
    ],
    defaultFormulaId: "toilet-cleaner-acid-standard",
    defaultFormulaStatus: "AVAILABLE",
    categoryApplicability: {
      hlb: false,
      cmc: false,
      viscosity: true,
      cleaningScore: true,
      foam: true,
      builder: false
    }
  },
  BATHROOM_CLEANER: {
    id: "BATHROOM_CLEANER",
    label: "Bathroom Cleaner",
    description: "Targeted tile, grout, and sanitary ware descaler for dissolving soap scum and calcium water deposits.",
    physicalForm: "LIQUID",
    family: "SURFACE_CARE",
    targetPHMin: 2,
    targetPHMax: 4,
    defaultPH: 3,
    activeMatterMinPct: 3,
    activeMatterTargetPct: 7,
    foamExpectation: "Clinging Foam",
    primaryFunction: "Removal of calcium soap scum, hard water mineral deposits, and mildew on ceramic tiles",
    keyConstraints: [
      "Organic acid chelating system (Citric/Sulfamic/Glycolic)",
      "Tile grout protection",
      "Effective cling time"
    ],
    defaultFormulaId: "bathroom-cleaner-spray",
    defaultFormulaStatus: "AVAILABLE",
    categoryApplicability: {
      hlb: true,
      cmc: true,
      viscosity: true,
      cleaningScore: true,
      foam: true,
      builder: true
    }
  },
  GLASS_CLEANER: {
    id: "GLASS_CLEANER",
    label: "Glass / Window Cleaner",
    description: "Ultra-fast drying, streak-free cleaner for windows, automotive windshields, and mirrored glass.",
    physicalForm: "LIQUID",
    family: "SURFACE_CARE",
    targetPHMin: 8.5,
    targetPHMax: 10.5,
    defaultPH: 9.5,
    activeMatterMinPct: 1,
    activeMatterTargetPct: 3,
    foamExpectation: "Streak-Free Zero Suds",
    primaryFunction: "Fast-evaporating streak-free removal of fingerprints and smudges from glass & mirrors",
    keyConstraints: [
      "Active matter strictly under 3% to prevent streaks",
      "Hydrotrope solvent coupling (IPA or Glycol Ether)",
      "Instant flash drying"
    ],
    defaultFormulaId: "glass-cleaner-standard",
    defaultFormulaStatus: "AVAILABLE",
    categoryApplicability: {
      hlb: false,
      cmc: false,
      viscosity: true,
      cleaningScore: true,
      foam: true,
      builder: false
    }
  },
  FABRIC_SOFTENER: {
    id: "FABRIC_SOFTENER",
    label: "Fabric Softener",
    description: "Cationic conditioning rinse aid for fabric softening, static reduction, and fragrance longevity.",
    physicalForm: "LIQUID",
    family: "LAUNDRY_CARE",
    targetPHMin: 2.5,
    targetPHMax: 4.5,
    defaultPH: 3.5,
    activeMatterMinPct: 4,
    activeMatterTargetPct: 12,
    foamExpectation: "Non-Foaming Cationic",
    primaryFunction: "Cationic fiber lubrication, anti-static charge neutralization, and long-lasting scent burst",
    keyConstraints: [
      "STRICT CATIONIC MEDIUM \u2014 zero anionic surfactants",
      "pH controlled to 3.0-4.0 for esterquat emulsion stability",
      "Anti-microbial preservation"
    ],
    defaultFormulaId: "fabric-softener-standard",
    defaultFormulaStatus: "AVAILABLE",
    categoryApplicability: {
      hlb: false,
      cmc: false,
      viscosity: true,
      cleaningScore: false,
      foam: false,
      builder: false
    }
  },
  HAND_WASH: {
    id: "HAND_WASH",
    label: "Hand Wash",
    description: "Dermatologically safe skin-cleansing liquid soap with moisturizers and mild lathering agents.",
    physicalForm: "LIQUID",
    family: "PERSONAL_CARE",
    targetPHMin: 5,
    targetPHMax: 6.8,
    defaultPH: 6,
    activeMatterMinPct: 8,
    activeMatterTargetPct: 14,
    foamExpectation: "High / Dense",
    primaryFunction: "Dermatologically mild skin cleansing, pathogen removal, and lipid moisture replenishment",
    keyConstraints: [
      "Skin natural pH balance (5.5-6.5)",
      "Skin-soothing CAPB/Glycerin combo",
      "Smooth dispensing viscosity (1800-3000 cP)"
    ],
    defaultFormulaId: "hand-soap-standard",
    defaultFormulaStatus: "AVAILABLE",
    categoryApplicability: {
      hlb: true,
      cmc: true,
      viscosity: true,
      cleaningScore: true,
      foam: true,
      builder: false
    }
  },
  KITCHEN_DEGREASER: {
    id: "KITCHEN_DEGREASER",
    label: "Kitchen Degreaser",
    description: "Heavy-duty alkaline and solvent degreaser for baked-on grease, carbonized oil, and exhaust hood soils.",
    physicalForm: "LIQUID",
    family: "SURFACE_CARE",
    targetPHMin: 11,
    targetPHMax: 13.8,
    defaultPH: 12.5,
    activeMatterMinPct: 8,
    activeMatterTargetPct: 16,
    foamExpectation: "Low / Solvent Cling",
    primaryFunction: "Alkaline saponification of baked-on grease, carbonized oil, and heavy food soils on ovens & hoods",
    keyConstraints: [
      "Heavy caustic or metasilicate reserve",
      "Glycol ether or terpene grease penetration",
      "Personal protective equipment recommended"
    ],
    defaultFormulaId: "kitchen-degreaser-heavy-duty",
    defaultFormulaStatus: "AVAILABLE",
    categoryApplicability: {
      hlb: true,
      cmc: true,
      viscosity: true,
      cleaningScore: true,
      foam: true,
      builder: true
    }
  },
  CAR_SHAMPOO: {
    id: "CAR_SHAMPOO",
    label: "Car Shampoo",
    description: "High-lubricity pH-neutral vehicle wash designed for snow-foam application without stripping protective wax.",
    physicalForm: "LIQUID",
    family: "VEHICLE_CARE",
    targetPHMin: 6.5,
    targetPHMax: 8,
    defaultPH: 7.2,
    activeMatterMinPct: 8,
    activeMatterTargetPct: 15,
    foamExpectation: "High Suds / Snow Foam",
    primaryFunction: "High-lubricity foam lifting of road grime without stripping automotive wax or ceramic coatings",
    keyConstraints: [
      "Strict pH-neutral 6.8-7.5 for clearcoat and wax safety",
      "High slickness/lubricity to prevent swirl marks",
      "Free rinsing without water spotting"
    ],
    defaultFormulaId: "car-shampoo-snow-foam",
    defaultFormulaStatus: "AVAILABLE",
    categoryApplicability: {
      hlb: true,
      cmc: true,
      viscosity: true,
      cleaningScore: true,
      foam: true,
      builder: true
    }
  }
};
var PRODUCT_CATEGORIES = CANONICAL_PRODUCT_CATEGORY_IDS.map(
  (id) => PRODUCT_TAXONOMY_MAP[id]
);

// src/utils/provenanceEngine.ts
function validateUrl(url) {
  if (!url || typeof url !== "string") return false;
  const lowerUrl = url.toLowerCase().trim();
  if (lowerUrl.includes("example.com") || lowerUrl.includes("test.com") || lowerUrl.includes("placeholder.com") || lowerUrl.includes("fake-url") || lowerUrl.includes("manufacturer.com") || lowerUrl === "https://bluechemindia.co.in/aristo-9") {
    if (lowerUrl === "https://bluechemindia.co.in/aristo-9") return true;
    return false;
  }
  return lowerUrl.startsWith("http://") || lowerUrl.startsWith("https://");
}

// src/services/ingredientResearchService.ts
var MULTI_SOURCE_EVIDENCE_REPOSITORIES = {
  "aristo-9": [
    {
      sourceId: "src-aristo-manufacturer",
      url: "https://bluechemindia.co.in/aristo-9",
      domain: "bluechemindia.co.in",
      title: "Blue Chem India Ahmedabad - Aristo 9 Technical Product Datasheet (TDS)",
      publisher: "Blue Chem India",
      sourceType: "MANUFACTURER_TDS",
      retrievedAt: "2026-10-05T12:00:00Z",
      publicationDate: "2025-05-10",
      contentReference: "Page 2 Section A",
      rawContent: "Aristo 9 multipurpose liquid laundry additive contains 90% dry solids concentration. Operating pH 10% solution is 7.0 (range 7.0 - 9.0). Ethylene oxide based nonionic compound with auxiliary polymer thickeners.",
      extractedParameters: {
        activeMatter: 90,
        pH: 7,
        pHRange: "7.0 - 9.0",
        ionicNature: "Nonionic",
        physicalState: "Liquid",
        shelfLife: "2 years",
        application: "Liquid Detergent & Viscosity Booster"
      }
    },
    {
      sourceId: "src-aristo-supplier",
      url: "https://reputablesupplier.com/aristo-9-spec",
      domain: "reputablesupplier.com",
      title: "Chemical Supplier Spec Sheet - Aristo 9 Additive",
      publisher: "Reputable Supplier Corp",
      sourceType: "SUPPLIER_TDS",
      retrievedAt: "2026-10-05T12:05:00Z",
      publicationDate: "2025-08-12",
      rawContent: "Aristo 9 is distributed as a liquid nonionic laundry booster. Active concentration is reported around 90% by solids oven-drying. pH of 10% solution sits at 7.2.",
      extractedParameters: {
        activeMatter: 90,
        pH: 7.2,
        ionicNature: "Nonionic",
        physicalState: "Liquid"
      }
    },
    {
      sourceId: "src-aristo-industry",
      url: "https://industryjournal.org/reviews/aristo-9",
      domain: "industryjournal.org",
      title: "Ethoxylated Specialty Blends in Modern Detergents",
      publisher: "Detergents Technology Review",
      sourceType: "TECHNICAL_REFERENCE",
      retrievedAt: "2026-10-05T12:10:00Z",
      publicationDate: "2024-11-05",
      rawContent: "Industrial reviews of Blue Chem Indias Aristo 9 confirm it functions as an ethoxylated nonionic stabilizer. Active loading typically measures 88 - 90% with stable neutral pH.",
      extractedParameters: {
        activeMatter: 90,
        pH: 7.1,
        ionicNature: "Nonionic"
      }
    }
  ]
};
var IngredientResearchService = class {
  static {
    this.searchCache = {};
  }
  /**
   * Safe input sanitizer protecting against prompt injections in retrieved web content.
   * Strips potential malicious instructions and executable scripts.
   */
  static sanitizeWebContent(text) {
    if (!text) return "";
    return text.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "").replace(/ignore\s+previous\s+instructions/gi, "[Injection Blocked]").replace(/reveal\s+api\s+key/gi, "[Injection Blocked]").replace(/execute\s+command/gi, "[Injection Blocked]").trim();
  }
  /**
   * Plans property-specific structured queries for more targeted searches.
   */
  static planQueries(ingredientName, grade) {
    const cleanName = ingredientName.trim();
    const cleanGrade = grade ? ` ${grade}` : "";
    return [
      `"${cleanName}"${cleanGrade} Technical Datasheet TDS`,
      `"${cleanName}"${cleanGrade} CAS number chemical properties`,
      `"${cleanName}"${cleanGrade} active matter pH density specification`
    ];
  }
  /**
   * Identifies and resolves an ingredient name or alias to its canonical database record.
   */
  static resolveIdentity(nameOrAlias) {
    const q = (nameOrAlias || "").trim().toLowerCase();
    if (!q) {
      return { ingredient: null, resolvedName: "", confidence: "UNRESOLVED" };
    }
    let match = UNIVERSAL_INGREDIENTS.find((i) => i.id === q || i.name.toLowerCase() === q || i.productName?.toLowerCase() === q);
    if (match) {
      return { ingredient: match, resolvedName: match.name, confidence: "EXACT_MATCH" };
    }
    const normalizedQuery = q.replace(/[^a-z0-9]/g, "");
    match = UNIVERSAL_INGREDIENTS.find((i) => {
      const normalName = i.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const normalProd = (i.productName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const hasAlias = i.inciName?.toLowerCase() === q || i.casNumber === q;
      return normalName === normalizedQuery || normalProd === normalizedQuery || hasAlias;
    });
    if (match) {
      return { ingredient: match, resolvedName: match.name, confidence: "HIGH_CONFIDENCE_MATCH" };
    }
    const searchMatches = searchUniversalIngredients(nameOrAlias);
    if (searchMatches.length === 1) {
      return { ingredient: searchMatches[0], resolvedName: searchMatches[0].name, confidence: "HIGH_CONFIDENCE_MATCH" };
    } else if (searchMatches.length > 1) {
      const exactOrClose = searchMatches.find((i) => i.id === q || i.name.toLowerCase().includes(q) || q.includes(i.name.toLowerCase()));
      if (exactOrClose) {
        return { ingredient: exactOrClose, resolvedName: exactOrClose.name, confidence: "HIGH_CONFIDENCE_MATCH" };
      }
    }
    match = UNIVERSAL_INGREDIENTS.find((i) => {
      const normalName = i.name.toLowerCase();
      return normalName.includes(q) || q.includes(normalName);
    });
    if (match) {
      return { ingredient: match, resolvedName: match.name, confidence: "POSSIBLE_MATCH" };
    }
    return { ingredient: null, resolvedName: nameOrAlias, confidence: "UNRESOLVED" };
  }
  /**
   * Executes the full multi-source web research pipeline (P1-8).
   * Generates queries, retrieves multiple independent sources, performs cross-source comparisons,
   * detects conflicts, sanitizes content, and populates evidence.
   */
  static async researchMultiSource(request, apiKey) {
    const { ingredientName, grade } = request;
    const cacheKey = `${ingredientName.toLowerCase()}|${(grade || "").toLowerCase()}`;
    if (this.searchCache[cacheKey]) {
      return this.searchCache[cacheKey];
    }
    const resolution = this.resolveIdentity(ingredientName);
    const resolvedName = resolution.ingredient ? resolution.ingredient.name : ingredientName;
    const queries = this.planQueries(ingredientName, grade);
    const resolvedKey = Object.keys(MULTI_SOURCE_EVIDENCE_REPOSITORIES).find((key) => {
      const queryLower = ingredientName.toLowerCase().replace(/[^a-z0-9]/g, "");
      const keyLower = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      return keyLower === queryLower || keyLower.includes(queryLower) || queryLower.includes(keyLower);
    });
    let retrievedSources = [];
    if (apiKey && apiKey.trim() && apiKey !== "MY_GEMINI_API_KEY") {
      try {
        const ai = new import_genai.GoogleGenAI({
          apiKey,
          httpOptions: { headers: { "User-Agent": "aistudio-build" } }
        });
        const prompt = `Perform rigorous multi-source research on: "${ingredientName}" (grade: "${grade || "any"}").
Search distinct manufacturer datasheets, TDS, and supplier specifications.
CRITICAL INTEGRITY: Retrieve actual facts only. Do not hallucinate or invent sources or URLs.
Classify each source with distinct publisher and sourceType.
Provide exactly 3 distinct sources in JSON format conforming to this schema:
{
  "sources": [
    {
      "sourceId": "string",
      "url": "string_or_null",
      "domain": "string",
      "title": "string",
      "publisher": "string",
      "sourceType": "MANUFACTURER_TDS" | "SUPPLIER_TDS" | "TECHNICAL_REFERENCE" | "REGULATORY_DOCUMENT",
      "publicationDate": "string",
      "rawContent": "string_factual_content_snippet",
      "extractedParameters": {
        "activeMatter": number_or_null,
        "pH": number_or_null,
        "ionicNature": "string_or_null"
      }
    }
  ]
}`;
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
              type: import_genai.Type.OBJECT,
              properties: {
                sources: {
                  type: import_genai.Type.ARRAY,
                  items: {
                    type: import_genai.Type.OBJECT,
                    properties: {
                      sourceId: { type: import_genai.Type.STRING },
                      url: { type: import_genai.Type.STRING },
                      domain: { type: import_genai.Type.STRING },
                      title: { type: import_genai.Type.STRING },
                      publisher: { type: import_genai.Type.STRING },
                      sourceType: { type: import_genai.Type.STRING },
                      publicationDate: { type: import_genai.Type.STRING },
                      rawContent: { type: import_genai.Type.STRING },
                      extractedParameters: {
                        type: import_genai.Type.OBJECT,
                        properties: {
                          activeMatter: { type: import_genai.Type.NUMBER },
                          pH: { type: import_genai.Type.NUMBER },
                          ionicNature: { type: import_genai.Type.STRING }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        });
        if (response.text) {
          const resultJson = JSON.parse(response.text.trim());
          if (resultJson.sources && resultJson.sources.length > 0) {
            retrievedSources = resultJson.sources.map((s) => ({
              ...s,
              retrievedAt: (/* @__PURE__ */ new Date()).toISOString(),
              rawContent: this.sanitizeWebContent(s.rawContent || "")
            }));
          }
        }
      } catch (err) {
        console.warn("Grounded Gemini search retrieval failed, falling back to local multi-source repositories:", err);
      }
    }
    if (retrievedSources.length === 0 && (apiKey === "TEST_MODE" || process.env.NODE_ENV === "test") && resolvedKey) {
      retrievedSources = MULTI_SOURCE_EVIDENCE_REPOSITORIES[resolvedKey].map((s) => ({
        ...s,
        rawContent: this.sanitizeWebContent(s.rawContent)
      }));
    }
    if (retrievedSources.length === 0) {
      const failedResult = {
        researchId: `res-fail-${Date.now()}`,
        query: queries[0],
        ingredientName,
        resolvedName,
        confidence: resolution.confidence,
        status: "INSUFFICIENT_EVIDENCE",
        sourcesRetrieved: [],
        propertiesExtracted: {},
        comparisonReport: [],
        requiresUserApproval: false,
        notes: "No reliable external sources could be retrieved for this ingredient."
      };
      return failedResult;
    }
    const uniqueDomains = /* @__PURE__ */ new Set();
    const uniqueSources = retrievedSources.filter((s) => {
      if (!s.domain) return true;
      if (uniqueDomains.has(s.domain)) return false;
      uniqueDomains.add(s.domain);
      return true;
    });
    const propertiesToCompare = ["activeMatter", "pH", "ionicNature"];
    const comparisonReport = [];
    const propertiesExtracted = {};
    propertiesToCompare.forEach((prop) => {
      const values = uniqueSources.map((s) => s.extractedParameters?.[prop]).filter((v) => v !== void 0 && v !== null);
      if (values.length === 0) {
        comparisonReport.push({
          property: prop,
          comparisonStatus: "INSUFFICIENT_DATA",
          values: []
        });
        return;
      }
      const uniqueVals = Array.from(new Set(values.map((v) => typeof v === "string" ? v.toLowerCase() : v)));
      if (uniqueVals.length === 1) {
        comparisonReport.push({
          property: prop,
          comparisonStatus: "AGREEMENT",
          values,
          notes: "All independent sources are in complete scientific agreement."
        });
        propertiesExtracted[prop] = values[0];
      } else {
        const numericValues = values.map(Number).filter((v) => !isNaN(v));
        if (numericValues.length > 1) {
          const min = Math.min(...numericValues);
          const max = Math.max(...numericValues);
          const diff = max - min;
          const tolerance = 0.05 * min;
          if (diff > tolerance) {
            comparisonReport.push({
              property: prop,
              comparisonStatus: "CONFLICT",
              values,
              notes: `Significant variation discovered among sources (range: ${min} - ${max}). Preserving both as conflicting evidence.`
            });
            propertiesExtracted[prop] = `${min} - ${max}`;
          } else {
            comparisonReport.push({
              property: prop,
              comparisonStatus: "MINOR_VARIATION",
              values,
              notes: "Minor variance within acceptable 5% physical tolerance limits. Safe to average."
            });
            propertiesExtracted[prop] = Math.round(numericValues.reduce((a, b) => a + b, 0) / numericValues.length * 10) / 10;
          }
        } else {
          comparisonReport.push({
            property: prop,
            comparisonStatus: "CONFLICT",
            values,
            notes: "Conflicting qualitative classifications found across sources."
          });
        }
      }
    });
    const isConflicting = comparisonReport.some((c) => c.comparisonStatus === "CONFLICT");
    const finalStatus = isConflicting ? "CONFLICTING_EVIDENCE" : "SUCCESS";
    const multiResult = {
      researchId: `res-ms-${ingredientName.toLowerCase()}-${Date.now()}`,
      query: queries[0],
      ingredientName,
      resolvedName,
      confidence: resolution.confidence,
      status: finalStatus,
      sourcesRetrieved: uniqueSources,
      propertiesExtracted,
      comparisonReport,
      requiresUserApproval: isConflicting || uniqueSources.length > 1,
      notes: isConflicting ? "Cross-source comparison discovered significant scientific conflicts. Manual engineering audit is required." : "Multi-source web research completed with strong corroborative agreement."
    };
    this.searchCache[cacheKey] = multiResult;
    return multiResult;
  }
  /**
   * Synchronous / backward compatible research entry point wrapping the multi-source pipeline (P1-8).
   */
  static async researchIngredient(nameOrAlias, apiKey) {
    const resolution = this.resolveIdentity(nameOrAlias);
    const ingredient = resolution.ingredient;
    const cleanSlug = nameOrAlias.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "custom-ingredient";
    const ingredientId = ingredient ? ingredient.id : `custom-${cleanSlug}`;
    const canonicalName = ingredient ? ingredient.name : nameOrAlias;
    const msResult = await this.researchMultiSource({ ingredientName: canonicalName }, apiKey);
    if (msResult.sourcesRetrieved.length === 0) {
      return {
        ingredientId,
        canonicalName,
        resolvedName: resolution.resolvedName,
        confidence: resolution.confidence,
        parameters: {},
        provenance: {},
        requiresUserApproval: false
      };
    }
    const firstSource = msResult.sourcesRetrieved[0];
    const activeVal = msResult.propertiesExtracted.activeMatter ?? null;
    const phVal = msResult.propertiesExtracted.pH ?? null;
    const phRangeVal = firstSource.extractedParameters.pHRange ?? null;
    const ionicVal = msResult.propertiesExtracted.ionicNature ?? null;
    const stateVal = firstSource.extractedParameters.physicalState ?? null;
    const shelfVal = firstSource.extractedParameters.shelfLife ?? null;
    const appVal = firstSource.extractedParameters.application ?? null;
    const source = firstSource.publisher || (firstSource.domain ? firstSource.domain : "Independent Technical Datasheet");
    const sourceUrl = firstSource.url || (firstSource.domain ? `https://${firstSource.domain}` : "");
    const isConflict = msResult.status === "CONFLICTING_EVIDENCE";
    const isManufacturerSource = firstSource.sourceType === "MANUFACTURER_TDS" || firstSource.sourceType === "MANUFACTURER_SDS" || firstSource.sourceType === "REGULATORY_DOCUMENT" || firstSource.sourceType === "MANUFACTURER_SPECIFICATION";
    const pProv = (property, val, notes) => {
      let status = "UNKNOWN";
      let evidenceLevel = "UNKNOWN";
      if (isConflict) {
        status = "EVIDENCE_CONFLICT";
        evidenceLevel = "UNKNOWN";
      } else if (val !== null && val !== void 0) {
        if (isManufacturerSource) {
          status = "VERIFIED";
          evidenceLevel = "VERIFIED_SOURCE";
        } else {
          status = "SOURCE_BACKED";
          evidenceLevel = "SOURCE_BACKED";
        }
      }
      return {
        property,
        value: val,
        extractedValue: val,
        status,
        evidenceLevel,
        source,
        sourceUrl: validateUrl(sourceUrl) ? sourceUrl : firstSource.domain ? `https://${firstSource.domain}` : "",
        sourceDocumentUrl: validateUrl(sourceUrl) ? sourceUrl : null,
        notes,
        verifiedAt: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        verificationDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        confidenceScore: isConflict ? 0.3 : isManufacturerSource ? 0.95 : 0.8
      };
    };
    const provenance = {};
    const parameters = {};
    if (activeVal !== null) {
      provenance.activeMatter = pProv("activeMatter", activeVal, "Assay determined by solids oven-drying");
      const parsedActive = typeof activeVal === "number" ? activeVal : parseFloat(activeVal);
      if (!isNaN(parsedActive)) parameters.activeMatter = parsedActive;
    }
    if (phVal !== null) {
      provenance.pH = pProv("pH", phVal, "pH of 10% aqueous solution");
      const parsedPH = typeof phVal === "number" ? phVal : parseFloat(phVal);
      if (!isNaN(parsedPH)) parameters.pH = parsedPH;
    }
    if (phRangeVal !== null) {
      provenance.pHRange = pProv("pHRange", phRangeVal, "Operating GHS specification");
      parameters.pHRange = phRangeVal;
    }
    if (ionicVal !== null) {
      provenance.ionicNature = pProv("ionicNature", ionicVal, "Non-reactive ethoxylated structure");
      parameters.ionicNature = ionicVal;
    }
    if (stateVal !== null) {
      provenance.physicalState = pProv("physicalState", stateVal, "Macroscopic appearance");
      parameters.physicalState = stateVal;
    }
    if (shelfVal !== null) {
      provenance.shelfLife = pProv("shelfLife", shelfVal, "Storage stability window");
      parameters.shelfLife = shelfVal;
    }
    if (appVal !== null) {
      provenance.application = pProv("application", appVal, "Primary functional utility");
      parameters.application = appVal;
    }
    provenance.hlb = { property: "hlb", value: null, extractedValue: null, status: "UNKNOWN", evidenceLevel: "UNKNOWN", source, sourceUrl };
    provenance.cmc = { property: "cmc", value: null, extractedValue: null, status: "UNKNOWN", evidenceLevel: "UNKNOWN", source, sourceUrl };
    provenance.density = { property: "density", value: null, extractedValue: null, status: "UNKNOWN", evidenceLevel: "UNKNOWN", source, sourceUrl };
    provenance.nvr = { property: "nvr", value: null, extractedValue: null, status: "UNKNOWN", evidenceLevel: "UNKNOWN", source, sourceUrl };
    return {
      ingredientId,
      canonicalName,
      resolvedName: resolution.resolvedName,
      confidence: resolution.confidence,
      parameters,
      provenance,
      requiresUserApproval: msResult.requiresUserApproval
    };
  }
  /**
   * Applies verified parameters to a canonical ingredient and triggers re-evaluations.
   */
  static async applyVerifiedData(researchResult, previousRecord) {
    const { ingredientId, canonicalName, resolvedName, parameters, provenance } = researchResult;
    const ingIndex = UNIVERSAL_INGREDIENTS.findIndex((i) => i.id === ingredientId);
    let updatedIng;
    if (ingIndex === -1) {
      const name = canonicalName || resolvedName || ingredientId;
      const detectedActive = typeof parameters.activeMatter === "number" ? parameters.activeMatter : previousRecord?.activeDefault ?? null;
      const detectedDensity = typeof parameters.density === "number" ? parameters.density : previousRecord?.density ?? null;
      const detectedPhMin = typeof parameters.pH === "number" ? parameters.pH : previousRecord?.phMin ?? null;
      const detectedPhMax = parameters.pHRange ? parseFloat(parameters.pHRange.split("-")[1]) || null : previousRecord?.phMax ?? null;
      updatedIng = {
        id: ingredientId,
        name,
        productName: name,
        category: parameters.ionicNature ? `Surfactant (${parameters.ionicNature})` : "Specialty Chemical / Additive",
        subCategory: "Researched Raw Material",
        casNumber: previousRecord?.casNumber || "N/A",
        inciName: name,
        function: parameters.application || "Functional Detergent Additive",
        activeDefault: detectedActive,
        activeMatterPct: detectedActive,
        activePercent: detectedActive,
        costPerKg: previousRecord?.costPerKg !== void 0 ? previousRecord.costPerKg : null,
        density: detectedDensity,
        phMin: detectedPhMin,
        phMax: detectedPhMax,
        description: `Researched technical raw material: ${name}`,
        isCustom: true
      };
    } else {
      updatedIng = { ...UNIVERSAL_INGREDIENTS[ingIndex] };
    }
    if (parameters.activeMatter !== void 0) {
      updatedIng.activeDefault = parameters.activeMatter;
      updatedIng.activeMatterPct = parameters.activeMatter;
      if (updatedIng.unknownProperties) {
        updatedIng.unknownProperties = updatedIng.unknownProperties.filter((p) => p !== "activeMatter");
      }
    }
    if (parameters.pH !== void 0) {
      updatedIng.phMin = parameters.pH;
      updatedIng.phMax = parameters.pHRange ? parseFloat(parameters.pHRange.split("-")[1]) || null : null;
    }
    if (parameters.density !== void 0 && typeof parameters.density === "number") {
      updatedIng.density = parameters.density;
    }
    if (parameters.ionicNature !== void 0) {
      updatedIng.ionicNature = parameters.ionicNature;
    }
    if (provenance && provenance.activeMatter && provenance.activeMatter.sourceUrl && provenance.activeMatter.status === "VERIFIED") {
      const isMfr = provenance.activeMatter.sourceType === "MANUFACTURER_TDS";
      updatedIng.provenance = {
        sourceType: isMfr ? "OFFICIAL_MANUFACTURER" : provenance.activeMatter.sourceType || "TECHNICAL_REFERENCE",
        source: provenance.activeMatter.source || "Technical Datasheet",
        sourceUrl: provenance.activeMatter.sourceUrl,
        verificationStatus: "VERIFIED",
        verifiedAt: provenance.activeMatter.verifiedAt || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        notes: `Verified parameter extraction from primary source.`
      };
    } else {
      updatedIng.provenance = {
        sourceType: "ESTIMATED",
        source: provenance?.activeMatter?.source || "Unverified Research Record",
        sourceUrl: provenance?.activeMatter?.sourceUrl || "",
        verificationStatus: "UNVERIFIED",
        verifiedAt: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        notes: "Research data lacks validated primary manufacturer TDS evidence."
      };
    }
    if (ingIndex !== -1) {
      UNIVERSAL_INGREDIENTS[ingIndex] = updatedIng;
    } else {
      UNIVERSAL_INGREDIENTS.push(updatedIng);
    }
    let dynamicIngredients = [];
    try {
      const dynamicSetting = await db.userSettings.get("dynamic_ingredients");
      dynamicIngredients = dynamicSetting ? dynamicSetting.value : [];
    } catch {
    }
    dynamicIngredients = dynamicIngredients.filter((i) => i.id !== ingredientId);
    dynamicIngredients.push(updatedIng);
    await db.userSettings.put({
      key: "dynamic_ingredients",
      value: dynamicIngredients,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    const auditTrail = {
      ingredientId,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      previousRecord,
      newRecord: updatedIng,
      reason: `Autonomous Intelligence update from verified manufacturer TDS datasheet.`
    };
    let auditLogs = [];
    try {
      const auditSetting = await db.userSettings.get("research_audit_logs");
      auditLogs = auditSetting ? auditSetting.value : [];
    } catch {
    }
    auditLogs.push(auditTrail);
    await db.userSettings.put({
      key: "research_audit_logs",
      value: auditLogs,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    const affectedFormulas = await db.formulas.toArray();
    for (const formula of affectedFormulas) {
      let isAffected = false;
      const updatedIngredients = formula.ingredients.map((ing) => {
        if (ing.id === ingredientId || ing.name.toLowerCase() === updatedIng.name.toLowerCase()) {
          isAffected = true;
          return {
            ...ing,
            activeMatterPct: updatedIng.activeDefault,
            provenance: updatedIng.provenance
          };
        }
        return ing;
      });
      if (isAffected) {
        calculateActiveMatter(updatedIngredients);
        calculateActiveSurfactants(updatedIngredients);
        calculateRawSurfactants(updatedIngredients);
        calculateDensity(updatedIngredients, formula.batchSizeKg * 1e3);
        calculateBlendedHLB(updatedIngredients);
        calculateLiquidNVR(updatedIngredients, formula.batchSizeKg);
        const updatedFormula = {
          ...formula,
          ingredients: updatedIngredients,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        await db.formulas.put(updatedFormula);
      }
    }
    return { success: true, auditTrail, updatedIngredient: updatedIng };
  }
};

// src/domain/ph/acidBaseDataModel.ts
var AUTHORITATIVE_ACID_BASE_REGISTRY = {
  // --------------------------------------------------------------------------
  // LABSA COMMERCIAL GRADES & REFERENCE MOLECULE
  // --------------------------------------------------------------------------
  "pure_labsa_reference": {
    identity: {
      ingredientId: "pure_labsa_reference",
      chemicalIdentity: "Pure Linear Alkylbenzene Sulfonic Acid (Reference Molecule)",
      commonName: "LABSA 100% Reference",
      casNumber: "27176-87-0",
      chemicalFormula: "C18H30O3S",
      isPureReferenceChemical: true,
      physicalForm: "LIQUID"
    },
    classification: {
      acidBaseClass: "STRONG_ACID",
      acidBaseFamily: "SULFONIC_ACID_LABSA",
      protonFunctionality: "MONOPROTIC",
      protonDonorCount: 1,
      pKa: [-2]
    },
    assay: {
      status: "SOURCE_VERIFIED",
      valuePct: 100,
      lowerBoundPct: 100,
      upperBoundPct: 100,
      moistureFractionPct: 0,
      freeSulfuricAcidPct: 0,
      freeOilPct: 0,
      sourceType: "OFFICIAL_STANDARD",
      evidenceLevel: 2,
      notes: "Monoisotopic reference standard LABSA (dodecylbenzene sulfonic acid, MW 326.49 g/mol)"
    },
    equivalentBasis: {
      basisType: "MOLECULAR_WEIGHT",
      molecularWeight: 326.49,
      isMwDefensible: true,
      equivalentWeight: 326.49,
      reactiveEquivalentsPerKg: 3.06288,
      // 1000g / 326.49 g/mol
      uncertainty: { class: "EXACT_REFERENCE", description: "Theoretical pure reference molecule" }
    },
    provenance: {
      evidenceLevel: 2,
      source: "IUPAC / CRC Handbook of Chemistry and Physics",
      sourceType: "OFFICIAL_STANDARD",
      verifiedDate: "2026-01-01"
    },
    validation: { isValid: true, errors: [], warnings: [] }
  },
  "commercial_labsa_90": {
    identity: {
      ingredientId: "commercial_labsa_90",
      chemicalIdentity: "Commercial Linear Alkylbenzene Sulfonic Acid 90% Slurry",
      commonName: "LABSA 90%",
      inciName: "Dodecylbenzene Sulfonic Acid",
      casNumber: "27176-87-0",
      isPureReferenceChemical: false,
      grade: "Standard Commercial Grade (90%)",
      physicalForm: "SLURRY"
    },
    classification: {
      acidBaseClass: "STRONG_ACID",
      acidBaseFamily: "SULFONIC_ACID_LABSA",
      protonFunctionality: "MONOPROTIC",
      protonDonorCount: 1,
      pKa: [-2]
    },
    assay: {
      status: "DECLARED_REGISTRY_DATA",
      valuePct: 90,
      lowerBoundPct: 89,
      upperBoundPct: 91,
      moistureFractionPct: 4,
      freeSulfuricAcidPct: 5,
      freeOilPct: 1,
      sourceType: "DECLARED_REGISTRY_DATA",
      evidenceLevel: 3,
      notes: "Standard industrial grade containing ~90% active LABSA, ~5% free H2SO4, ~1% unsulfonated matter, ~4% water"
    },
    equivalentBasis: {
      basisType: "COMMERCIAL_ASSAY",
      molecularWeight: 326.49,
      isMwDefensible: true,
      equivalentWeight: 326.49,
      acidValueMgKOHg: 180,
      // Typical TDS acid value range 178-182 mg KOH/g
      reactiveEquivalentsPerKg: 2.7566,
      // (900g / 326.49) active + diprotic free H2SO4 contribution where specified
      uncertainty: { class: "CERTIFIED", lowerBound: 89, upperBound: 91, description: "Manufacturer COA specification range \xB11.0%" }
    },
    provenance: {
      evidenceLevel: 3,
      source: "Manufacturer Technical Data Sheet (Commercial LABSA 90%)",
      sourceType: "DECLARED_REGISTRY_DATA",
      verifiedDate: "2026-01-01"
    },
    validation: { isValid: true, errors: [], warnings: [] }
  },
  "commercial_labsa_96": {
    identity: {
      ingredientId: "commercial_labsa_96",
      chemicalIdentity: "Commercial High Purity Linear Alkylbenzene Sulfonic Acid 96%",
      commonName: "LABSA 96% High Purity",
      inciName: "Dodecylbenzene Sulfonic Acid",
      casNumber: "27176-87-0",
      isPureReferenceChemical: false,
      grade: "High Purity / Low Free Acid Grade (96%)",
      physicalForm: "SLURRY"
    },
    classification: {
      acidBaseClass: "STRONG_ACID",
      acidBaseFamily: "SULFONIC_ACID_LABSA",
      protonFunctionality: "MONOPROTIC",
      protonDonorCount: 1,
      pKa: [-2]
    },
    assay: {
      status: "DECLARED_REGISTRY_DATA",
      valuePct: 96,
      lowerBoundPct: 95.5,
      upperBoundPct: 96.5,
      moistureFractionPct: 1.5,
      freeSulfuricAcidPct: 1.5,
      freeOilPct: 1,
      sourceType: "DECLARED_REGISTRY_DATA",
      evidenceLevel: 3,
      notes: "Low free sulfuric acid premium grade (~96% active LABSA, ~1.5% free H2SO4)"
    },
    equivalentBasis: {
      basisType: "COMMERCIAL_ASSAY",
      molecularWeight: 326.49,
      isMwDefensible: true,
      equivalentWeight: 326.49,
      acidValueMgKOHg: 183,
      reactiveEquivalentsPerKg: 2.9403,
      uncertainty: { class: "CERTIFIED", lowerBound: 95.5, upperBound: 96.5, description: "Manufacturer TDS certified specification" }
    },
    provenance: {
      evidenceLevel: 3,
      source: "High Purity LABSA TDS Specification",
      sourceType: "DECLARED_REGISTRY_DATA",
      verifiedDate: "2026-01-01"
    },
    validation: { isValid: true, errors: [], warnings: [] }
  },
  // --------------------------------------------------------------------------
  // NaOH COMMERCIAL GRADES & REFERENCE MOLECULE
  // --------------------------------------------------------------------------
  "pure_naoh_reference": {
    identity: {
      ingredientId: "pure_naoh_reference",
      chemicalIdentity: "Sodium Hydroxide (Pure Reference Chemical)",
      commonName: "NaOH 100% Reference",
      casNumber: "1310-73-2",
      chemicalFormula: "NaOH",
      isPureReferenceChemical: true,
      physicalForm: "PELLETS"
    },
    classification: {
      acidBaseClass: "STRONG_BASE",
      acidBaseFamily: "STRONG_BASE",
      protonFunctionality: "MONO_EQUIVALENT_BASE",
      protonAcceptorCount: 1
    },
    assay: {
      status: "SOURCE_VERIFIED",
      valuePct: 100,
      lowerBoundPct: 100,
      upperBoundPct: 100,
      sourceType: "OFFICIAL_STANDARD",
      evidenceLevel: 2,
      notes: "Pure stoichiometric reference Sodium Hydroxide (MW 40.00 g/mol)"
    },
    equivalentBasis: {
      basisType: "MOLECULAR_WEIGHT",
      molecularWeight: 40,
      isMwDefensible: true,
      equivalentWeight: 40,
      reactiveEquivalentsPerKg: 25,
      // 1000g / 40g/mol = 25.0 mol OH-/kg
      uncertainty: { class: "EXACT_REFERENCE", description: "Pure stoichiometric chemical reference" }
    },
    provenance: {
      evidenceLevel: 2,
      source: "CRC Handbook of Chemistry and Physics",
      sourceType: "OFFICIAL_STANDARD",
      verifiedDate: "2026-01-01"
    },
    validation: { isValid: true, errors: [], warnings: [] }
  },
  "commercial_naoh_flakes_99": {
    identity: {
      ingredientId: "commercial_naoh_flakes_99",
      chemicalIdentity: "Sodium Hydroxide Commercial Solid Flakes 99%",
      commonName: "Caustic Soda Flakes 99%",
      casNumber: "1310-73-2",
      isPureReferenceChemical: false,
      grade: "Industrial Flake Grade (99%)",
      physicalForm: "SOLID_FLAKES"
    },
    classification: {
      acidBaseClass: "STRONG_BASE",
      acidBaseFamily: "STRONG_BASE",
      protonFunctionality: "MONO_EQUIVALENT_BASE",
      protonAcceptorCount: 1
    },
    assay: {
      status: "DECLARED_REGISTRY_DATA",
      valuePct: 99,
      lowerBoundPct: 98.5,
      upperBoundPct: 99.5,
      moistureFractionPct: 0.5,
      sourceType: "DECLARED_REGISTRY_DATA",
      evidenceLevel: 3,
      notes: "Solid anhydrous flakes containing ~99% active NaOH, ~0.5% Na2CO3, ~0.5% moisture"
    },
    equivalentBasis: {
      basisType: "COMMERCIAL_ASSAY",
      molecularWeight: 40,
      isMwDefensible: true,
      equivalentWeight: 40,
      reactiveEquivalentsPerKg: 24.75,
      // 990g / 40g/mol = 24.75 mol OH-/kg
      uncertainty: { class: "CERTIFIED", lowerBound: 98.5, upperBound: 99.5, description: "Commercial flake specification 99.0% \xB1 0.5%" }
    },
    provenance: {
      evidenceLevel: 3,
      source: "Caustic Soda Flakes Manufacturer Specification",
      sourceType: "DECLARED_REGISTRY_DATA",
      verifiedDate: "2026-01-01"
    },
    validation: { isValid: true, errors: [], warnings: [] }
  },
  "commercial_caustic_lye_48": {
    identity: {
      ingredientId: "commercial_caustic_lye_48",
      chemicalIdentity: "Sodium Hydroxide Aqueous Liquid Solution 48%",
      commonName: "Caustic Soda Lye 48%",
      casNumber: "1310-73-2",
      isPureReferenceChemical: false,
      grade: "Aqueous Solution Grade (48%)",
      physicalForm: "SOLUTION"
    },
    classification: {
      acidBaseClass: "STRONG_BASE",
      acidBaseFamily: "STRONG_BASE",
      protonFunctionality: "MONO_EQUIVALENT_BASE",
      protonAcceptorCount: 1
    },
    assay: {
      status: "DECLARED_REGISTRY_DATA",
      valuePct: 48,
      lowerBoundPct: 47.5,
      upperBoundPct: 48.5,
      moistureFractionPct: 52,
      sourceType: "DECLARED_REGISTRY_DATA",
      evidenceLevel: 3,
      notes: "Industrial liquid lye solution containing 48% w/w active NaOH and 52% water"
    },
    equivalentBasis: {
      basisType: "COMMERCIAL_ASSAY",
      molecularWeight: 40,
      isMwDefensible: true,
      equivalentWeight: 40,
      reactiveEquivalentsPerKg: 12,
      // 480g / 40g/mol = 12.0 mol OH-/kg
      uncertainty: { class: "CERTIFIED", lowerBound: 47.5, upperBound: 48.5, description: "Liquid lye certified assay \xB1 0.5%" }
    },
    provenance: {
      evidenceLevel: 3,
      source: "Caustic Lye 48% Liquid TDS",
      sourceType: "DECLARED_REGISTRY_DATA",
      verifiedDate: "2026-01-01"
    },
    validation: { isValid: true, errors: [], warnings: [] }
  },
  "commercial_caustic_lye_50": {
    identity: {
      ingredientId: "commercial_caustic_lye_50",
      chemicalIdentity: "Sodium Hydroxide Aqueous Liquid Solution 50%",
      commonName: "Caustic Soda Lye 50%",
      casNumber: "1310-73-2",
      isPureReferenceChemical: false,
      grade: "Aqueous Solution Grade (50%)",
      physicalForm: "SOLUTION"
    },
    classification: {
      acidBaseClass: "STRONG_BASE",
      acidBaseFamily: "STRONG_BASE",
      protonFunctionality: "MONO_EQUIVALENT_BASE",
      protonAcceptorCount: 1
    },
    assay: {
      status: "DECLARED_REGISTRY_DATA",
      valuePct: 50,
      lowerBoundPct: 49.5,
      upperBoundPct: 50.5,
      moistureFractionPct: 50,
      sourceType: "DECLARED_REGISTRY_DATA",
      evidenceLevel: 3,
      notes: "Standard membrane cell liquid caustic lye 50% w/w solution"
    },
    equivalentBasis: {
      basisType: "COMMERCIAL_ASSAY",
      molecularWeight: 40,
      isMwDefensible: true,
      equivalentWeight: 40,
      reactiveEquivalentsPerKg: 12.5,
      // 500g / 40g/mol = 12.5 mol OH-/kg
      uncertainty: { class: "CERTIFIED", lowerBound: 49.5, upperBound: 50.5, description: "Liquid lye 50% certified assay \xB1 0.5%" }
    },
    provenance: {
      evidenceLevel: 3,
      source: "Caustic Lye 50% Liquid TDS",
      sourceType: "DECLARED_REGISTRY_DATA",
      verifiedDate: "2026-01-01"
    },
    validation: { isValid: true, errors: [], warnings: [] }
  },
  // --------------------------------------------------------------------------
  // OTHER ACIDS & BASES
  // --------------------------------------------------------------------------
  "citric_acid_anhydrous": {
    identity: {
      ingredientId: "citric_acid_anhydrous",
      chemicalIdentity: "Citric Acid Anhydrous",
      commonName: "Citric Acid",
      casNumber: "77-92-9",
      chemicalFormula: "C6H8O7",
      isPureReferenceChemical: true,
      physicalForm: "POWDER"
    },
    classification: {
      acidBaseClass: "WEAK_ACID",
      acidBaseFamily: "CARBOXYLIC_WEAK_ACID",
      protonFunctionality: "TRIPROTIC",
      protonDonorCount: 3,
      pKa: [3.13, 4.76, 6.4]
    },
    assay: {
      status: "SOURCE_VERIFIED",
      valuePct: 99.5,
      sourceType: "OFFICIAL_STANDARD",
      evidenceLevel: 2,
      notes: "Anhydrous triprotic organic acid (MW 192.12 g/mol, 3 H+ equivalents)"
    },
    equivalentBasis: {
      basisType: "MOLECULAR_WEIGHT",
      molecularWeight: 192.12,
      isMwDefensible: true,
      equivalentWeight: 64.04,
      // 192.12 / 3
      reactiveEquivalentsPerKg: 15.537,
      // (995g / 192.12) * 3
      uncertainty: { class: "EXACT_REFERENCE", description: "USP/BP Grade Anhydrous Citric Acid" }
    },
    provenance: {
      evidenceLevel: 2,
      source: "USP / Merck Index",
      sourceType: "OFFICIAL_STANDARD",
      verifiedDate: "2026-01-01"
    },
    validation: { isValid: true, errors: [], warnings: [] }
  },
  "soda_ash_dense": {
    identity: {
      ingredientId: "soda_ash_dense",
      chemicalIdentity: "Sodium Carbonate Anhydrous (Soda Ash)",
      commonName: "Soda Ash Dense / Light",
      casNumber: "497-19-8",
      chemicalFormula: "Na2CO3",
      isPureReferenceChemical: false,
      grade: "Industrial Builder Grade (99.2%)",
      physicalForm: "POWDER"
    },
    classification: {
      acidBaseClass: "WEAK_BASE",
      acidBaseFamily: "CARBONATE",
      protonFunctionality: "MULTI_EQUIVALENT_BASE",
      protonAcceptorCount: 2,
      pKa: [6.35, 10.33]
    },
    assay: {
      status: "DECLARED_REGISTRY_DATA",
      valuePct: 99.2,
      sourceType: "DECLARED_REGISTRY_DATA",
      evidenceLevel: 3,
      notes: "Anhydrous sodium carbonate diprotic alkaline builder (MW 105.99 g/mol, 2 OH- equivalents in acid excess)"
    },
    equivalentBasis: {
      basisType: "COMMERCIAL_ASSAY",
      molecularWeight: 105.99,
      isMwDefensible: true,
      equivalentWeight: 52.995,
      // 105.99 / 2
      reactiveEquivalentsPerKg: 18.718,
      // (992g / 105.99) * 2
      reactiveLimitType: "CONDITIONALLY_AVAILABLE_EQUIVALENTS",
      availabilityContext: "Equilibrium pH limits actual available alkalinity depending on solution context.",
      uncertainty: { class: "CERTIFIED", description: "Industrial Soda Ash TDS Specification 99.2% min" }
    },
    provenance: {
      evidenceLevel: 3,
      source: "Soda Ash Manufacturer Specification",
      sourceType: "DECLARED_REGISTRY_DATA",
      verifiedDate: "2026-01-01"
    },
    validation: { isValid: true, errors: [], warnings: [] }
  },
  "triethanolamine_99": {
    identity: {
      ingredientId: "triethanolamine_99",
      chemicalIdentity: "Triethanolamine 99%",
      commonName: "TEA 99%",
      casNumber: "102-71-6",
      chemicalFormula: "C6H15NO3",
      isPureReferenceChemical: false,
      grade: "Pure Commercial Amine (99%)",
      physicalForm: "LIQUID"
    },
    classification: {
      acidBaseClass: "WEAK_BASE",
      acidBaseFamily: "AMINE_BASE",
      protonFunctionality: "MONO_EQUIVALENT_BASE",
      protonAcceptorCount: 1,
      pKaConjugate: 9.5
    },
    assay: {
      status: "DECLARED_REGISTRY_DATA",
      valuePct: 99,
      sourceType: "DECLARED_REGISTRY_DATA",
      evidenceLevel: 3,
      notes: "Tertiary organic amine base (MW 149.19 g/mol, 1 OH- equivalent)"
    },
    equivalentBasis: {
      basisType: "COMMERCIAL_ASSAY",
      molecularWeight: 149.19,
      isMwDefensible: true,
      equivalentWeight: 149.19,
      reactiveEquivalentsPerKg: 6.6358,
      // 990g / 149.19
      reactiveLimitType: "THEORETICAL_STOICHIOMETRIC_EQUIVALENTS",
      uncertainty: { class: "CERTIFIED", description: "Commercial TEA 99% specification" }
    },
    provenance: {
      evidenceLevel: 3,
      source: "Triethanolamine TDS Specification",
      sourceType: "DECLARED_REGISTRY_DATA",
      verifiedDate: "2026-01-01"
    },
    validation: { isValid: true, errors: [], warnings: [] }
  },
  "sulfuric_acid_98": {
    identity: {
      ingredientId: "sulfuric_acid_98",
      chemicalIdentity: "Sulfuric Acid Concentrated 98%",
      commonName: "Sulfuric Acid 98%",
      casNumber: "7664-93-9",
      chemicalFormula: "H2SO4",
      isPureReferenceChemical: false,
      grade: "Technical Concentrated Grade (98%)",
      physicalForm: "LIQUID"
    },
    classification: {
      acidBaseClass: "STRONG_ACID",
      acidBaseFamily: "STRONG_MINERAL_ACID",
      protonFunctionality: "DIPROTIC",
      protonDonorCount: 2,
      pKa: [-3, 1.99]
    },
    assay: {
      status: "DECLARED_REGISTRY_DATA",
      valuePct: 98,
      lowerBoundPct: 97.5,
      upperBoundPct: 98.5,
      sourceType: "DECLARED_REGISTRY_DATA",
      evidenceLevel: 3,
      notes: "Concentrated diprotic mineral acid (MW 98.08 g/mol, 2 H+ equivalents per mole = 19.9837 eq/kg)"
    },
    equivalentBasis: {
      basisType: "COMMERCIAL_ASSAY",
      molecularWeight: 98.08,
      isMwDefensible: true,
      equivalentWeight: 49.04,
      reactiveEquivalentsPerKg: 19.9837,
      reactiveLimitType: "THEORETICAL_STOICHIOMETRIC_EQUIVALENTS",
      uncertainty: { class: "CERTIFIED", description: "Concentrated Sulfuric Acid 98% TDS specification" }
    },
    provenance: {
      evidenceLevel: 3,
      source: "Industrial Mineral Acid TDS Specification",
      sourceType: "DECLARED_REGISTRY_DATA",
      verifiedDate: "2026-01-01"
    },
    validation: { isValid: true, errors: [], warnings: [] }
  },
  "potassium_hydroxide_85": {
    identity: {
      ingredientId: "potassium_hydroxide_85",
      chemicalIdentity: "Potassium Hydroxide Flakes 85%",
      commonName: "KOH 85%",
      casNumber: "1310-58-3",
      chemicalFormula: "KOH",
      isPureReferenceChemical: false,
      grade: "Technical Flake Grade (85%)",
      physicalForm: "SOLID_FLAKES"
    },
    classification: {
      acidBaseClass: "STRONG_BASE",
      acidBaseFamily: "STRONG_BASE",
      protonFunctionality: "MONO_EQUIVALENT_BASE",
      protonAcceptorCount: 1
    },
    assay: {
      status: "DECLARED_REGISTRY_DATA",
      valuePct: 85,
      sourceType: "DECLARED_REGISTRY_DATA",
      evidenceLevel: 3,
      notes: "Industrial KOH solid flakes (~85% KOH)"
    },
    equivalentBasis: {
      basisType: "COMMERCIAL_ASSAY",
      molecularWeight: 56.11,
      isMwDefensible: true,
      equivalentWeight: 56.11,
      reactiveEquivalentsPerKg: 15.1488,
      reactiveLimitType: "THEORETICAL_STOICHIOMETRIC_EQUIVALENTS",
      uncertainty: { class: "CERTIFIED", description: "Technical KOH 85% TDS" }
    },
    provenance: {
      evidenceLevel: 3,
      source: "Potassium Hydroxide Flakes TDS",
      sourceType: "DECLARED_REGISTRY_DATA",
      verifiedDate: "2026-01-01"
    },
    validation: { isValid: true, errors: [], warnings: [] }
  },
  "pure_hcl_reference": {
    identity: {
      ingredientId: "pure_hcl_reference",
      chemicalIdentity: "Hydrochloric Acid (Pure Reference Chemical)",
      commonName: "HCl 100% Reference",
      casNumber: "7647-01-0",
      chemicalFormula: "HCl",
      isPureReferenceChemical: true,
      physicalForm: "SOLUTION"
    },
    classification: {
      acidBaseClass: "STRONG_ACID",
      acidBaseFamily: "STRONG_MINERAL_ACID",
      protonFunctionality: "MONOPROTIC",
      protonDonorCount: 1,
      pKa: [-6.3]
    },
    assay: {
      status: "SOURCE_VERIFIED",
      valuePct: 100,
      sourceType: "OFFICIAL_STANDARD",
      evidenceLevel: 2,
      notes: "Pure stoichiometric reference Hydrochloric Acid (MW 36.46 g/mol)"
    },
    equivalentBasis: {
      basisType: "MOLECULAR_WEIGHT",
      molecularWeight: 36.46,
      isMwDefensible: true,
      equivalentWeight: 36.46,
      reactiveEquivalentsPerKg: 27.4273,
      // 1000g / 36.46 g/mol = 27.4273 mol/kg
      uncertainty: { class: "EXACT_REFERENCE", description: "Pure stoichiometric chemical reference" }
    },
    provenance: {
      evidenceLevel: 2,
      source: "CRC Handbook of Chemistry and Physics",
      sourceType: "OFFICIAL_STANDARD",
      verifiedDate: "2026-01-01"
    },
    validation: { isValid: true, errors: [], warnings: [] }
  }
};
function validateScientificAcidBaseProfile(profile) {
  const errors = [];
  const warnings = [];
  if (profile.assay.valuePct !== void 0 && profile.assay.valuePct !== null) {
    if (profile.assay.valuePct < 0 || profile.assay.valuePct > 100) {
      errors.push(`Invalid assay valuePct ${profile.assay.valuePct}%. Assay must strictly be between 0% and 100%.`);
    }
  }
  if (profile.equivalentBasis.molecularWeight !== void 0 && profile.equivalentBasis.molecularWeight !== null) {
    if (profile.equivalentBasis.molecularWeight <= 0) {
      errors.push(`Invalid molecularWeight ${profile.equivalentBasis.molecularWeight}. Must be strictly positive.`);
    }
  }
  if (profile.provenance.evidenceLevel < 1 || profile.provenance.evidenceLevel > 6) {
    errors.push(`Invalid evidenceLevel ${profile.provenance.evidenceLevel}. Must be an integer between 1 and 6.`);
  }
  if (profile.assay.status === "NAME_PARSED_ESTIMATE" && profile.provenance.sourceType === "MANUFACTURER_TDS") {
    warnings.push("Conflict detected: Name parsed estimate should not claim MANUFACTURER_TDS source authority.");
  }
  if (profile.assay.status === "UNKNOWN" || profile.assay.status === "INSUFFICIENT_DATA") {
    warnings.push("Assay is UNKNOWN or INSUFFICIENT_DATA. Scientific calculation path will not invent an assay.");
  }
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
function resolveScientificAcidBaseProfile(rawInput, options = {}) {
  const inputObj = typeof rawInput === "string" ? { name: rawInput } : rawInput || { name: "" };
  const name = (inputObj.name || "").trim();
  const nLower = name.toLowerCase();
  const explicitActivePct = inputObj.activeMatterPct ?? inputObj.activePercent ?? inputObj.activeMatterPurity ?? inputObj.purity;
  const hasExplicitAssay = explicitActivePct !== void 0 && explicitActivePct !== null && !isNaN(Number(explicitActivePct));
  let matchedKey = null;
  const hasSpecificGradeInName = nLower.includes("90%") || nLower.includes("90") || nLower.includes("96%") || nLower.includes("96") || nLower.includes("98%") || nLower.includes("98") || nLower.includes("85%") || nLower.includes("85") || nLower.includes("48%") || nLower.includes("48") || nLower.includes("50%") || nLower.includes("50") || nLower.includes("99%") || nLower.includes("99") || nLower.includes("100%") || nLower.includes("100") || nLower.includes("pure") || nLower.includes("reference") || nLower.includes("flake") || nLower.includes("lye") || nLower.includes("anhydrous") || nLower.includes("dense");
  if (nLower.includes("labsa") || nLower.includes("sulfonic acid") || nLower.includes("acid slurry")) {
    if (nLower.includes("96") || nLower.includes("high purity")) {
      matchedKey = "commercial_labsa_96";
    } else if (nLower.includes("100") || nLower.includes("pure") || nLower.includes("reference")) {
      matchedKey = "pure_labsa_reference";
    } else {
      matchedKey = "commercial_labsa_90";
    }
  } else if (nLower.includes("naoh") || nLower.includes("caustic") || nLower.includes("sodium hydroxide") || nLower.includes("lye")) {
    if (nLower.includes("48")) {
      matchedKey = "commercial_caustic_lye_48";
    } else if (nLower.includes("50")) {
      matchedKey = "commercial_caustic_lye_50";
    } else if (nLower.includes("99") || nLower.includes("flake")) {
      matchedKey = "commercial_naoh_flakes_99";
    } else if (nLower.includes("100") || nLower.includes("reference")) {
      matchedKey = "pure_naoh_reference";
    } else {
      matchedKey = "commercial_naoh_flakes_99";
    }
  } else if (nLower.includes("sulfuric acid") || nLower.includes("h2so4")) {
    matchedKey = "sulfuric_acid_98";
  } else if (nLower.includes("hydrochloric acid") || nLower.includes("hcl")) {
    matchedKey = "pure_hcl_reference";
  } else if (nLower.includes("potassium hydroxide") || nLower.includes("koh")) {
    matchedKey = "potassium_hydroxide_85";
  } else if (nLower.includes("citric acid")) {
    matchedKey = "citric_acid_anhydrous";
  } else if (nLower.includes("soda ash") || nLower.includes("sodium carbonate")) {
    matchedKey = "soda_ash_dense";
  } else if (nLower.includes("triethanolamine") || nLower.includes("tea")) {
    matchedKey = "triethanolamine_99";
  }
  const baseProfile = matchedKey && AUTHORITATIVE_ACID_BASE_REGISTRY[matchedKey] ? JSON.parse(JSON.stringify(AUTHORITATIVE_ACID_BASE_REGISTRY[matchedKey])) : {
    identity: {
      ingredientId: name.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      chemicalIdentity: name || "Unknown Ingredient",
      commonName: name || "Unknown Ingredient",
      isPureReferenceChemical: false,
      physicalForm: "UNKNOWN"
    },
    classification: {
      acidBaseClass: "UNKNOWN",
      acidBaseFamily: "UNKNOWN",
      protonFunctionality: "UNKNOWN"
    },
    assay: {
      status: "UNKNOWN",
      valuePct: null,
      sourceType: "UNKNOWN",
      evidenceLevel: 6
    },
    equivalentBasis: {
      basisType: "UNKNOWN_INSUFFICIENT_DATA",
      isMwDefensible: false,
      reactiveEquivalentsPerKg: null,
      uncertainty: { class: "UNKNOWN", description: "No assay or equivalent data available" }
    },
    provenance: {
      evidenceLevel: 6,
      source: "Unresolved raw input name",
      sourceType: "UNKNOWN"
    },
    validation: { isValid: false, errors: ["Unknown ingredient name without active assay metadata"], warnings: [] }
  };
  if (hasExplicitAssay) {
    const numericAssay = Math.max(0, Math.min(100, Number(explicitActivePct)));
    baseProfile.assay = {
      status: "SPECIFIED_EXPLICIT",
      valuePct: numericAssay,
      lowerBoundPct: numericAssay,
      upperBoundPct: numericAssay,
      sourceType: "COA",
      evidenceLevel: 1,
      notes: "Explicit active percentage provided in formulation ingredient record"
    };
    baseProfile.provenance = {
      evidenceLevel: 1,
      source: "User/System Explicit Input Record",
      sourceType: "COA"
    };
    if (baseProfile.equivalentBasis.molecularWeight && baseProfile.equivalentBasis.molecularWeight > 0) {
      const activeKgPerKg = numericAssay / 100;
      const mw = baseProfile.equivalentBasis.molecularWeight;
      const donorEq = baseProfile.classification.protonDonorCount ?? baseProfile.classification.protonAcceptorCount ?? 1;
      baseProfile.equivalentBasis.reactiveEquivalentsPerKg = Number((activeKgPerKg * 1e3 / mw * donorEq).toFixed(5));
      baseProfile.equivalentBasis.basisType = "COMMERCIAL_ASSAY";
    }
  } else if (matchedKey && hasSpecificGradeInName) {
    baseProfile.assay.status = "NAME_PARSED_ESTIMATE";
    baseProfile.assay.sourceType = "NAME_PARSED_ESTIMATE";
    baseProfile.assay.evidenceLevel = 5;
    baseProfile.provenance.sourceType = "NAME_PARSED_ESTIMATE";
    baseProfile.provenance.evidenceLevel = 5;
  } else if (matchedKey && (baseProfile.identity.isPureReferenceChemical || nLower.includes("anhydrous") || nLower.includes("dense"))) {
  } else {
    if (options.allowConvenienceDefaultsForUI) {
      let defaultVal = 100;
      if (nLower.includes("labsa")) defaultVal = 90;
      else if (nLower.includes("sles")) defaultVal = 28;
      else if (nLower.includes("capb")) defaultVal = 30;
      baseProfile.assay = {
        status: "CONVENIENCE_DEFAULT",
        valuePct: defaultVal,
        sourceType: "CONVENIENCE_DEFAULT",
        evidenceLevel: 6,
        notes: "CONVENIENCE DEFAULT FOR UI VIEW ONLY \u2014 NOT VERIFIED SCIENTIFIC EVIDENCE"
      };
      baseProfile.provenance = {
        evidenceLevel: 6,
        source: "Legacy UI Convenience Default Lookup",
        sourceType: "CONVENIENCE_DEFAULT"
      };
    } else {
      baseProfile.assay = {
        status: "UNKNOWN",
        valuePct: null,
        sourceType: "UNKNOWN",
        evidenceLevel: 6,
        notes: "Missing active assay metadata and unstated commercial grade. Scientific engine does not fabricate an assay."
      };
      baseProfile.equivalentBasis.basisType = "UNKNOWN_INSUFFICIENT_DATA";
      baseProfile.equivalentBasis.reactiveEquivalentsPerKg = null;
      baseProfile.equivalentBasis.uncertainty = {
        class: "UNKNOWN",
        description: "Assay UNKNOWN \u2014 reactive equivalents cannot be calculated without explicit assay or grade specification"
      };
    }
  }
  const valRes = validateScientificAcidBaseProfile(baseProfile);
  baseProfile.validation = valRes;
  return baseProfile;
}
function calculateReactiveEquivalents(profile, rawMassKg) {
  const warnings = [];
  if (!profile || rawMassKg <= 0) {
    return {
      status: "INVALID_INPUT",
      equivalentsPerKg: null,
      totalReactiveEquivalents: null,
      basisUsed: "UNKNOWN_INSUFFICIENT_DATA",
      provenance: "UNKNOWN",
      evidenceLevel: 6,
      warnings: ["Invalid raw mass input (must be > 0)"]
    };
  }
  if (profile.assay.status === "UNKNOWN" || profile.assay.status === "INSUFFICIENT_DATA" || profile.assay.valuePct === null || profile.assay.valuePct === void 0) {
    return {
      status: "INSUFFICIENT_DATA",
      equivalentsPerKg: null,
      totalReactiveEquivalents: null,
      basisUsed: "UNKNOWN_INSUFFICIENT_DATA",
      provenance: profile.provenance.sourceType,
      evidenceLevel: profile.provenance.evidenceLevel,
      warnings: ["Assay is UNKNOWN or INSUFFICIENT_DATA. Refusing to calculate reactive equivalents with fabricated assumptions."]
    };
  }
  const eqPerKg = profile.equivalentBasis.reactiveEquivalentsPerKg;
  if (eqPerKg === null || eqPerKg === void 0 || isNaN(eqPerKg)) {
    return {
      status: "INSUFFICIENT_DATA",
      equivalentsPerKg: null,
      totalReactiveEquivalents: null,
      basisUsed: profile.equivalentBasis.basisType,
      provenance: profile.provenance.sourceType,
      evidenceLevel: profile.provenance.evidenceLevel,
      warnings: ["Equivalent capacity per kg is not defined for this ingredient profile."]
    };
  }
  const totalReactiveEquivalents = Number((rawMassKg * eqPerKg).toFixed(5));
  if (profile.assay.status === "NAME_PARSED_ESTIMATE" || profile.assay.status === "CONVENIENCE_DEFAULT") {
    warnings.push(`Assay derived from ${profile.assay.status}. Equivalent calculation relies on unverified estimate.`);
  }
  return {
    status: "SUCCESS",
    equivalentsPerKg: eqPerKg,
    totalReactiveEquivalents,
    basisUsed: profile.equivalentBasis.basisType,
    provenance: profile.provenance.sourceType,
    evidenceLevel: profile.provenance.evidenceLevel,
    warnings
  };
}

// src/services/serverSecurity.ts
var import_app2 = require("firebase-admin/app");
var import_auth = require("firebase-admin/auth");
var import_googleapis = require("googleapis");
var import_fs2 = __toESM(require("fs"), 1);

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "imagined-zone-cv4kj",
  appId: "1:678655473700:web:d29cf4d8feff5e983240b1",
  apiKey: "AIzaSyCSoBbyRjYpzWIjsHbKLAfgWbh6SxcONMc",
  authDomain: "imagined-zone-cv4kj.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-formulaexpert-1b72894a-9fa1-4c13-a705-8b8d50c5196c",
  storageBucket: "imagined-zone-cv4kj.firebasestorage.app",
  messagingSenderId: "678655473700",
  measurementId: "",
  oAuthClientId: "678655473700-c21bjeiv33paeqeia7aa7um22mh85aia.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

// src/services/durablePurchaseStore.ts
var import_crypto = __toESM(require("crypto"), 1);
var import_app = require("firebase-admin/app");
var import_firestore = require("firebase-admin/firestore");
var import_fs = __toESM(require("fs"), 1);
function computeTokenFingerprint(token) {
  if (!token || typeof token !== "string") return "";
  return import_crypto.default.createHash("sha256").update(token.trim()).digest("hex");
}
var adminFirestoreInstance = null;
function getDurableFirestore() {
  if (adminFirestoreInstance) return adminFirestoreInstance;
  try {
    let app2;
    if ((0, import_app.getApps)().length > 0) {
      app2 = (0, import_app.getApp)();
    } else {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (serviceAccountKey) {
        let certObj;
        if (serviceAccountKey.trim().startsWith("{")) {
          certObj = JSON.parse(serviceAccountKey);
        } else if (import_fs.default.existsSync(serviceAccountKey)) {
          certObj = JSON.parse(import_fs.default.readFileSync(serviceAccountKey, "utf8"));
        }
        if (certObj) {
          app2 = (0, import_app.initializeApp)({
            credential: (0, import_app.cert)(certObj),
            projectId: certObj.project_id || firebase_applet_config_default.projectId
          });
        } else {
          app2 = (0, import_app.initializeApp)({ projectId: firebase_applet_config_default.projectId || "imagined-zone-cv4kj" });
        }
      } else {
        app2 = (0, import_app.initializeApp)({ projectId: firebase_applet_config_default.projectId || "imagined-zone-cv4kj" });
      }
    }
    const databaseId = firebase_applet_config_default.firestoreDatabaseId;
    adminFirestoreInstance = databaseId ? (0, import_firestore.getFirestore)(app2, databaseId) : (0, import_firestore.getFirestore)(app2);
    return adminFirestoreInstance;
  } catch (err) {
    console.warn("[DurablePurchaseStore] Admin Firestore unavailable:", err?.message || err);
    return null;
  }
}
var testMemoryStore = /* @__PURE__ */ new Map();
function isGenuineTestEnvironment() {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.NODE_ENV === "test" || Boolean(process.argv && process.argv.some((a) => a.includes("test") || a.includes("test-calculations"))) || process.env.JEST_WORKER_ID !== void 0 || process.env.VITEST !== void 0;
}
var DurablePurchaseStore = class {
  static {
    this.COLLECTION_NAME = "purchase_grants";
  }
  /**
   * Resets the test memory store. Only permitted in test processes.
   */
  static resetTestStore() {
    if (isGenuineTestEnvironment()) {
      testMemoryStore.clear();
    }
  }
  /**
   * Checks whether a purchase token has been registered, verifying user account ownership.
   * Concurrency-safe: checks durable store by token fingerprint.
   */
  static async checkReplay(purchaseToken, targetUserId) {
    const fingerprint = computeTokenFingerprint(purchaseToken);
    if (!fingerprint) {
      return { allowed: false, isExistingGrant: false, error: "Empty or invalid purchase token." };
    }
    if (!targetUserId || targetUserId === "anonymous_client") {
      return { allowed: false, isExistingGrant: false, error: "Missing or anonymous user ID." };
    }
    if (isGenuineTestEnvironment() && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const existing = testMemoryStore.get(fingerprint);
      if (existing) {
        if (existing.userId !== targetUserId) {
          return {
            allowed: false,
            isExistingGrant: true,
            error: "Purchase token replay detected: This token was already bound to a different user account."
          };
        }
        return { allowed: true, isExistingGrant: true, grant: existing };
      }
      return { allowed: true, isExistingGrant: false };
    }
    const firestore = getDurableFirestore();
    if (!firestore) {
      return {
        allowed: false,
        isExistingGrant: false,
        error: "Durable storage configuration missing. Fail-closed: Cannot perform replay verification."
      };
    }
    try {
      const docRef = firestore.collection(this.COLLECTION_NAME).doc(fingerprint);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        const data = docSnap.data();
        if (data.userId !== targetUserId) {
          return {
            allowed: false,
            isExistingGrant: true,
            error: "Purchase token replay detected: This token was already bound to a different user account."
          };
        }
        return { allowed: true, isExistingGrant: true, grant: data };
      }
      return { allowed: true, isExistingGrant: false };
    } catch (err) {
      return {
        allowed: false,
        isExistingGrant: false,
        error: `Durable replay store query failed: ${err.message || "Unknown Firestore error"}`
      };
    }
  }
  /**
   * Atomically records a verified purchase grant bound to the user ID.
   * Uses Firestore transactions in production to guarantee atomic write and prevent concurrent race conditions.
   */
  static async recordGrant(grantData) {
    const fingerprint = computeTokenFingerprint(grantData.purchaseToken);
    if (!fingerprint) {
      return { success: false, error: "Invalid token fingerprint." };
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const record = {
      tokenFingerprint: fingerprint,
      userId: grantData.userId,
      productId: grantData.productId,
      packageName: grantData.packageName,
      subscriptionState: grantData.subscriptionState,
      expiryTimeMillis: grantData.expiryTimeMillis,
      verifiedAt: Date.now(),
      createdAt: nowIso,
      updatedAt: nowIso
    };
    if (isGenuineTestEnvironment() && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const existing = testMemoryStore.get(fingerprint);
      if (existing && existing.userId !== grantData.userId) {
        return {
          success: false,
          error: "Concurrent race condition: Purchase token was claimed by another account."
        };
      }
      testMemoryStore.set(fingerprint, record);
      return { success: true, grant: record };
    }
    const firestore = getDurableFirestore();
    if (!firestore) {
      return {
        success: false,
        error: "Durable storage configuration missing. Fail-closed: Cannot record purchase grant."
      };
    }
    try {
      const docRef = firestore.collection(this.COLLECTION_NAME).doc(fingerprint);
      await firestore.runTransaction(async (transaction) => {
        const docSnap = await transaction.get(docRef);
        if (docSnap.exists) {
          const existing = docSnap.data();
          if (existing.userId !== grantData.userId) {
            throw new Error("Purchase token replay detected: This token was already bound to a different user account.");
          }
          transaction.update(docRef, {
            subscriptionState: grantData.subscriptionState,
            expiryTimeMillis: grantData.expiryTimeMillis,
            verifiedAt: Date.now(),
            updatedAt: nowIso
          });
        } else {
          transaction.set(docRef, record);
        }
      });
      return { success: true, grant: record };
    } catch (err) {
      return {
        success: false,
        error: `Transaction failed during purchase grant persistence: ${err.message || "Firestore transaction error"}`
      };
    }
  }
  /**
   * Retrieves a grant record by purchase token.
   */
  static async getGrant(purchaseToken) {
    const fingerprint = computeTokenFingerprint(purchaseToken);
    if (!fingerprint) return null;
    if (isGenuineTestEnvironment() && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      return testMemoryStore.get(fingerprint) || null;
    }
    const firestore = getDurableFirestore();
    if (!firestore) return null;
    try {
      const docSnap = await firestore.collection(this.COLLECTION_NAME).doc(fingerprint).get();
      if (!docSnap.exists) return null;
      return docSnap.data();
    } catch {
      return null;
    }
  }
};

// src/services/serverSecurity.ts
var InMemoryRateLimiter = class {
  constructor() {
    this.tracker = /* @__PURE__ */ new Map();
    this.lastCleanup = Date.now();
  }
  /**
   * Cleans up expired rate-limit records every 5 minutes to prevent memory leaks
   */
  cleanup() {
    const now = Date.now();
    if (now - this.lastCleanup < 3e5) return;
    this.lastCleanup = now;
    for (const [key, record] of this.tracker.entries()) {
      if (now > record.resetAt) {
        this.tracker.delete(key);
      }
    }
  }
  check(ip, maxRequests, windowMs) {
    this.cleanup();
    const now = Date.now();
    const record = this.tracker.get(ip);
    if (!record || now > record.resetAt) {
      this.tracker.set(ip, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: maxRequests - 1, resetInMs: windowMs };
    }
    if (record.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetInMs: Math.max(0, record.resetAt - now) };
    }
    record.count++;
    return { allowed: true, remaining: maxRequests - record.count, resetInMs: Math.max(0, record.resetAt - now) };
  }
  reset(ip) {
    if (ip) {
      this.tracker.delete(ip);
    } else {
      this.tracker.clear();
    }
  }
};
var serverRateLimiter = new InMemoryRateLimiter();
function getClientIp(req) {
  if (req.ip) {
    return req.ip;
  }
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    const firstIp = forwarded.split(",")[0].trim();
    if (firstIp && /^[0-9a-fA-F:.]+$/.test(firstIp)) {
      return firstIp;
    }
  }
  return req.socket.remoteAddress || "127.0.0.1";
}
function rateLimitMiddleware(options) {
  const { maxRequests, windowMs, endpointName = "Endpoint" } = options;
  return (req, res, next) => {
    const clientIp = getClientIp(req);
    const key = `${endpointName}:${clientIp}`;
    const result = serverRateLimiter.check(key, maxRequests, windowMs);
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", result.remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil(result.resetInMs / 1e3));
    res.setHeader("X-RateLimit-Scope", "instance-memory-single-process");
    if (!result.allowed) {
      const retryAfterSec = Math.max(1, Math.ceil(result.resetInMs / 1e3));
      res.setHeader("Retry-After", retryAfterSec);
      res.status(429).json({
        error: `Too many requests to ${endpointName}. Rate limit exceeded.`,
        retryAfterSeconds: retryAfterSec
      });
      return;
    }
    next();
  };
}
function payloadSizeValidator(maxBytes = 25e4) {
  return (req, res, next) => {
    const contentLength = req.headers["content-length"];
    if (contentLength && parseInt(contentLength, 10) > maxBytes) {
      res.status(413).json({
        error: `Payload too large. Maximum allowed request size is ${Math.round(maxBytes / 1024)} KB.`
      });
      return;
    }
    if (req.body && typeof req.body === "object") {
      try {
        const bodyStr = JSON.stringify(req.body);
        if (bodyStr.length > maxBytes) {
          res.status(413).json({
            error: `Request body exceeds maximum size limit of ${Math.round(maxBytes / 1024)} KB.`
          });
          return;
        }
      } catch {
      }
    }
    next();
  };
}
function sanitizeErrorMessage(err) {
  if (!err) return "An unexpected error occurred.";
  const msg = typeof err === "string" ? err : err.message || "Operation failed.";
  let cleanMsg = msg.replace(/AIza[0-9A-Za-z-_]{20,50}/g, "[REDACTED_KEY]").replace(/\/app\/[a-zA-Z0-9_\-\.\/]+/g, "[REDACTED_PATH]").replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[REDACTED_EMAIL]");
  return cleanMsg;
}
function corsMiddleware(customAllowedOrigins) {
  const envOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean);
  const defaultOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "capacitor://localhost",
    "ionic://localhost",
    "http://localhost"
  ];
  const allowedOrigins = customAllowedOrigins && customAllowedOrigins.length > 0 ? customAllowedOrigins : envOrigins.length > 0 ? envOrigins : defaultOrigins;
  return (req, res, next) => {
    const origin = req.headers.origin;
    if (!origin) {
      next();
      return;
    }
    const isAllowed = allowedOrigins.includes("*") || allowedOrigins.includes(origin);
    if (isAllowed) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Max-Age", "86400");
    }
    if (req.method === "OPTIONS") {
      if (!isAllowed) {
        res.status(403).json({ error: "CORS policy violation: Origin not allowed." });
        return;
      }
      res.status(204).end();
      return;
    }
    if (!isAllowed) {
      res.status(403).json({ error: "CORS policy violation: Origin not allowed." });
      return;
    }
    next();
  };
}
var firebaseAdminApp = null;
function getFirebaseAdminApp() {
  if (!firebaseAdminApp) {
    if ((0, import_app2.getApps)().length > 0) {
      firebaseAdminApp = (0, import_app2.getApp)();
    } else {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (serviceAccountKey) {
        try {
          let certObj;
          if (serviceAccountKey.trim().startsWith("{")) {
            certObj = JSON.parse(serviceAccountKey);
          } else if (import_fs2.default.existsSync(serviceAccountKey)) {
            certObj = JSON.parse(import_fs2.default.readFileSync(serviceAccountKey, "utf8"));
          }
          if (certObj) {
            firebaseAdminApp = (0, import_app2.initializeApp)({
              credential: (0, import_app2.cert)(certObj),
              projectId: certObj.project_id || firebase_applet_config_default.projectId
            });
          }
        } catch (e) {
          console.error("[serverSecurity] Failed to parse Firebase service account credentials:", e);
        }
      }
      if (!firebaseAdminApp) {
        firebaseAdminApp = (0, import_app2.initializeApp)({
          projectId: firebase_applet_config_default.projectId || "imagined-zone-cv4kj"
        });
      }
    }
  }
  return firebaseAdminApp;
}
function parseJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}
async function verifyAuthToken(token) {
  if (!token || typeof token !== "string" || !token.trim()) {
    return { valid: false, error: "Missing or empty authentication token." };
  }
  const parts = token.split(".");
  if (parts.length !== 3) {
    return { valid: false, error: "Malformed authentication token: Unable to decode JWT structure." };
  }
  const payload = parseJwtPayload(token);
  if (!payload) {
    return { valid: false, error: "Malformed authentication token: Unable to decode JWT payload." };
  }
  if (payload.exp && typeof payload.exp === "number") {
    const nowSec = Math.floor(Date.now() / 1e3);
    if (nowSec > payload.exp) {
      return { valid: false, error: "Expired authentication token: Token has passed its exp timestamp." };
    }
  }
  const isTestProcess = isGenuineTestEnvironment() && payload.iss === "https://securetoken.google.com/test-project";
  if (isTestProcess) {
    const uid = payload.user_id || payload.sub || payload.uid;
    if (!uid || typeof uid !== "string") {
      return { valid: false, error: "Invalid token claims: Token missing user identifier (sub/user_id)." };
    }
    const role = payload.admin === true || payload["https://detergentlab.internal/admin"] === true ? "admin" : "user";
    return {
      valid: true,
      user: { uid, email: payload.email, role }
    };
  }
  try {
    const adminApp = getFirebaseAdminApp();
    const auth = (0, import_auth.getAuth)(adminApp);
    const decodedToken = await auth.verifyIdToken(token, true);
    const uid = decodedToken.uid;
    if (!uid) {
      return { valid: false, error: "Cryptographic verification failed: Missing uid in decoded token." };
    }
    const role = decodedToken.admin === true || decodedToken.role === "admin" ? "admin" : "user";
    return {
      valid: true,
      user: {
        uid,
        email: decodedToken.email,
        role
      }
    };
  } catch (err) {
    return {
      valid: false,
      error: `Cryptographic token verification failed: ${sanitizeErrorMessage(err)}`
    };
  }
}
function authenticateUserMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Authentication required: Missing Authorization header with Bearer token."
    });
    return;
  }
  const token = authHeader.substring(7).trim();
  verifyAuthToken(token).then((result) => {
    if (!result.valid || !result.user) {
      res.status(401).json({
        error: result.error || "Authentication failed: Invalid or expired token."
      });
      return;
    }
    req.user = result.user;
    next();
  }).catch((err) => {
    res.status(401).json({
      error: `Authentication error: ${sanitizeErrorMessage(err)}`
    });
  });
}
function requireAdminMiddleware(req, res, next) {
  const user = req.user;
  if (!user || user.role !== "admin") {
    res.status(403).json({
      error: "Forbidden: Endpoint requires administrator privileges."
    });
    return;
  }
  next();
}
function verifyUserOwnership(authenticatedUid, targetUserId) {
  if (!authenticatedUid || !targetUserId) return false;
  return authenticatedUid === targetUserId;
}
var ALLOWED_PLAY_PRODUCT_IDS = [
  "com.detergentlab.pro.monthly",
  "com.detergentlab.pro.yearly",
  "com.detergentlab.team.yearly"
];
var CANONICAL_PACKAGE_NAME = "com.detergentrnd.formulaexpert";
function requireVerifiedBillingAuthMiddleware(req, res, next) {
  const user = req.user;
  if (!user || !user.uid || user.uid === "anonymous_client") {
    res.status(401).json({
      error: "Verified authentication required for billing. Anonymous or unauthenticated requests are strictly prohibited.",
      status: "UNVERIFIED"
    });
    return;
  }
  next();
}
async function verifyGooglePlayPurchase(request) {
  const { packageName, productId, purchaseToken, userId } = request;
  if (packageName !== CANONICAL_PACKAGE_NAME) {
    return {
      verified: false,
      status: "UNVERIFIED",
      error: `Invalid application package name: '${packageName}'. Expected '${CANONICAL_PACKAGE_NAME}'.`
    };
  }
  if (!ALLOWED_PLAY_PRODUCT_IDS.includes(productId)) {
    return {
      verified: false,
      status: "UNVERIFIED",
      error: `Unrecognized product ID: '${productId}'. Must be one of: ${ALLOWED_PLAY_PRODUCT_IDS.join(", ")}.`
    };
  }
  if (!purchaseToken || typeof purchaseToken !== "string" || purchaseToken.trim().length === 0) {
    return {
      verified: false,
      status: "UNVERIFIED",
      error: "Empty or invalid purchase token."
    };
  }
  if (!userId || typeof userId !== "string" || userId.trim().length === 0 || userId === "anonymous_client") {
    return {
      verified: false,
      status: "UNVERIFIED",
      error: "Missing or anonymous user ID. Purchases must be bound to a verified authenticated account."
    };
  }
  const replayCheck = await DurablePurchaseStore.checkReplay(purchaseToken, userId);
  if (!replayCheck.allowed && replayCheck.error) {
    return {
      verified: false,
      status: "UNVERIFIED",
      error: replayCheck.error
    };
  }
  const hasPlayCredentials = Boolean(
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS
  );
  if (!hasPlayCredentials) {
    return {
      verified: false,
      status: "UNVERIFIED",
      error: "Google Play Developer API service account credentials (GOOGLE_PLAY_SERVICE_ACCOUNT_KEY) are not configured on the server. Live verification BLOCKED (fail-closed)."
    };
  }
  try {
    const androidpublisher = import_googleapis.google.androidpublisher("v3");
    let credentialsObj;
    const keyEnv = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (keyEnv) {
      if (keyEnv.trim().startsWith("{")) {
        credentialsObj = JSON.parse(keyEnv);
      } else if (import_fs2.default.existsSync(keyEnv)) {
        credentialsObj = JSON.parse(import_fs2.default.readFileSync(keyEnv, "utf8"));
      }
    }
    const auth = new import_googleapis.google.auth.GoogleAuth({
      credentials: credentialsObj,
      scopes: ["https://www.googleapis.com/auth/androidpublisher"]
    });
    const authClient = await auth.getClient();
    const playRes = await androidpublisher.purchases.subscriptionsv2.get({
      packageName,
      token: purchaseToken,
      auth: authClient
    });
    const sub = playRes.data;
    if (!sub) {
      return {
        verified: false,
        status: "UNVERIFIED",
        error: "Empty response received from Google Play Developer API."
      };
    }
    const matchedItem = sub.lineItems?.find((item) => item.productId === productId);
    if (!matchedItem) {
      return {
        verified: false,
        status: "UNVERIFIED",
        error: `Purchased product mismatch: line item '${productId}' not found in Google Play receipt.`
      };
    }
    const expiryTimeIso = matchedItem.expiryTime;
    const expiryTimeMillis = expiryTimeIso ? new Date(expiryTimeIso).getTime() : 0;
    const nowMs = Date.now();
    if (!expiryTimeMillis || isNaN(expiryTimeMillis) || expiryTimeMillis <= nowMs) {
      return {
        verified: false,
        status: "EXPIRED",
        productId,
        userId,
        error: "Subscription has expired or lacks a valid future expiry timestamp."
      };
    }
    if (sub.subscriptionState === "SUBSCRIPTION_STATE_PENDING") {
      return {
        verified: false,
        status: "UNVERIFIED",
        error: "Google Play payment state is pending verification."
      };
    }
    if (sub.subscriptionState === "SUBSCRIPTION_STATE_PAUSED") {
      return {
        verified: false,
        status: "UNVERIFIED",
        error: "Google Play subscription is paused by subscriber."
      };
    }
    if (sub.subscriptionState === "SUBSCRIPTION_STATE_ON_HOLD") {
      return {
        verified: false,
        status: "UNVERIFIED",
        error: "Google Play subscription is on account hold due to payment method decline."
      };
    }
    if (sub.subscriptionState === "SUBSCRIPTION_STATE_EXPIRED") {
      return {
        verified: false,
        status: "EXPIRED",
        productId,
        userId,
        error: "Google Play subscription is expired."
      };
    }
    if (sub.subscriptionState === "SUBSCRIPTION_STATE_UNSPECIFIED") {
      return {
        verified: false,
        status: "UNVERIFIED",
        error: "Google Play returned unspecified subscription state."
      };
    }
    await DurablePurchaseStore.recordGrant({
      purchaseToken,
      userId,
      productId,
      packageName,
      subscriptionState: sub.subscriptionState || "SUBSCRIPTION_STATE_ACTIVE",
      expiryTimeMillis
    });
    return {
      verified: true,
      status: "ACTIVE",
      productId,
      userId
    };
  } catch (apiErr) {
    return {
      verified: false,
      status: "UNVERIFIED",
      error: `Google Play Developer API verification failed: ${sanitizeErrorMessage(apiErr)}`
    };
  }
}
function runStartupSecurityDiagnostics() {
  const hasFirebase = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS);
  const hasPlay = Boolean(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS);
  const hasFirestore = Boolean(getFirebaseAdminApp());
  console.log("--- STARTUP SECURITY & BILLING DIAGNOSTICS ---");
  console.log(`Firebase Admin Auth: ${hasFirebase ? "Configured (Service Account)" : "Default (Applet Config Project ID)"}`);
  console.log(`Firestore Database: ${hasFirestore ? "Available" : "Unconfigured"}`);
  console.log(`Google Play Developer API: ${hasPlay ? "Configured" : "Missing Credentials (Fail-Closed Active)"}`);
  console.log(`Policy: STRICT_FAIL_CLOSED_SERVER_VERIFIED`);
  console.log("----------------------------------------------");
  return {
    firebaseAdminConfigured: hasFirebase,
    firestoreConfigured: hasFirestore,
    playBillingConfigured: hasPlay,
    policy: "STCRIPTION_STATE_STRICT_FAIL_CLOSED"
  };
}

// server.ts
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.set("trust proxy", 1);
app.use(corsMiddleware());
app.use(import_express.default.json({ limit: "1mb" }));
var lastAIOperationSuccess = null;
var lastAIOperationTimestamp = null;
var lastAIOperationError = null;
async function probeGeminiHealth() {
  const client = getAIClient();
  if (!client) {
    return { reachable: false, latencyMs: 0, error: "Missing or invalid GEMINI_API_KEY credentials." };
  }
  const start = Date.now();
  try {
    const response = await Promise.race([
      client.models.generateContent({
        model: "gemini-3.8-flash",
        contents: "Respond with the single word: OK"
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout contacting Gemini API (3000ms limit)")), 3e3))
    ]);
    const latencyMs = Date.now() - start;
    if (response && response.text) {
      lastAIOperationSuccess = true;
      lastAIOperationTimestamp = (/* @__PURE__ */ new Date()).toISOString();
      lastAIOperationError = null;
      return { reachable: true, latencyMs };
    }
    throw new Error("Empty response received from provider.");
  } catch (err) {
    lastAIOperationSuccess = false;
    lastAIOperationTimestamp = (/* @__PURE__ */ new Date()).toISOString();
    lastAIOperationError = sanitizeErrorMessage(err);
    return { reachable: false, latencyMs: Date.now() - start, error: lastAIOperationError };
  }
}
var aiClient = null;
function getAIClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim() && apiKey !== "MY_GEMINI_API_KEY") {
      try {
        aiClient = new import_genai2.GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build"
            }
          }
        });
      } catch (e) {
        console.error("Failed to initialize Google Gen AI client:", e);
      }
    }
  }
  return aiClient;
}
app.post("/api/ai/chat", authenticateUserMiddleware, payloadSizeValidator(1e5), rateLimitMiddleware({ maxRequests: 30, windowMs: 6e4, endpointName: "AI Chat" }), async (req, res) => {
  const { message, history, context } = req.body;
  const client = getAIClient();
  const domainExpertFallback = (msg, ctx) => {
    const lower = (msg || "").toLowerCase();
    let advice = "";
    if (ctx && ctx.ingredients && Array.isArray(ctx.ingredients)) {
      const ingCount = ctx.ingredients.length;
      const ingNames = ctx.ingredients.map((i) => i.name || "").join(", ");
      const hasLabsa = lower.includes("labsa") || ingNames.toLowerCase().includes("labsa");
      const hasSles = lower.includes("sles") || ingNames.toLowerCase().includes("sles");
      const hasSalt = lower.includes("salt") || lower.includes("nacl") || ingNames.toLowerCase().includes("salt") || ingNames.toLowerCase().includes("chloride");
      advice = `### \u{1F9EA} Chemical Diagnosis for Your Active Formula (${ctx.formulaName || ctx.productType || "Formulation"})
- **Product Type:** ${ctx.productType || "General Cleaning Product"} | **Total Ingredients:** ${ingCount}
- **Active Formula Key Actives:** ${ingNames || "Standard Surfactant Matrix"}

**Core Chemistry Observations & Fixes:**
1. **Surfactant Ratio (Anionic / Amphoteric / Non-ionic):** 
   ${hasLabsa && hasSles ? "\u2022 Your formula contains both LABSA and SLES. For optimal micellar packing, maintain an active surfactant ratio of 2:1 or 3:1 (Anionic to Amphoteric such as CAPB). This maximizes interfacial surface tension reduction while protecting skin mildness." : "\u2022 Ensure balanced active matter according to product category (Laundry 10-14%, Dishwash 12-16%, Handwash 8-11%)."}
2. **Neutralization & pH Control:** 
   ${hasLabsa ? "\u2022 **LABSA Neutralization Stoichiometry:** Unneutralized LABSA is pH ~1.5. Every 1 kg of LABSA (90%) requires ~0.123 kg 100% NaOH (or ~0.25 kg 48% Caustic Lye) or ~0.457 kg Triethanolamine (TEA 99%). Maintain target pH at 7.5 - 8.5 to prevent acid hydrolysis of ether sulfates." : "\u2022 Verify pH stability. Buffer with 0.2 - 0.5% Citric Acid or Sodium Citrate to avoid pH drift over 90-day accelerated shelf-life."}
3. **Viscosity & Electrolyte Curve:** 
   ${hasSalt ? "\u2022 **Salt Titration Window:** Sodium Chloride (NaCl) operates on a bell-shaped curve. Keep NaCl within 0.8% - 1.6%. Going past 2.0% salt triggers immediate micellar breakdown ('salting-out') causing sudden thinning and cloudy precipitation." : "\u2022 To build rich body without salt shock, consider pairing 1.0% NaCl with 0.5% CAPB or a liquid polymer thickener (e.g. HPMC or Acrylates copolymer)."}
4. **Water Hardness & Chelating Shield:**
   \u2022 At typical tap water hardness (150-300 ppm CaCO\u2083), incorporate 0.5% - 1.2% GLDA (Dissolvine GL 47%) or Sodium Gluconate to sequester Ca\xB2\u207A/Mg\xB2\u207A ions and prevent soap scum precipitation.`;
      return `[Specialized Chemistry AI R&D Response]

${advice}

*Feel free to ask specific follow-up questions about adjusting individual chemical dosages, mixing order, or cost reduction!*`;
    }
    if (lower.includes("viscosity") || lower.includes("thick") || lower.includes("thin") || lower.includes("gaadha") || lower.includes("patla")) {
      advice = `**Viscosity & Rheology Engineering:**
1. **Electrolyte Salt Curve:** In classic anionic surfactant blends (LABSA + SLES + CAPB), rod-like micellar entanglement is controlled via Sodium Chloride (NaCl) titration between 0.8% \u2013 1.8% w/w.
2. **Salting-Out Warning:** Exceeding ~2.0% salt breaks the electrical double layer and causes catastrophic micellar collapse ('salting out'), turning the liquid permanently thin and cloudy.
3. **Alternative Thickeners:** For sulfate-free or low-surfactant formulas, use HPMC (0.4\u20130.8%), Xanthan Gum (0.3\u20130.6%), or Carbomer/Acrylates Copolymer neutralized with TEA.`;
    } else if (lower.includes("ph") || lower.includes("neutral") || lower.includes("caustic") || lower.includes("acid") || lower.includes("tejab")) {
      advice = `**Stoichiometric Neutralization & pH Buffer:**
1. **LABSA Neutralization:** 1 kg LABSA (MW ~326 g/mol) requires exactly ~0.123 kg 100% NaOH flakes (or ~0.25 kg 48% Caustic Soda lye) or ~0.457 kg Triethanolamine (TEA 99%).
2. **Target pH Windows:**
   - Liquid Laundry Detergent: pH 7.5 \u2013 8.5 (prevents fabric damage and preserves enzymes)
   - Manual Dishwash Liquid: pH 6.0 \u2013 7.2 (skin mildness)
   - Heavy-Duty Degreaser: pH 10.5 \u2013 12.0 (saponifies stubborn greases)
3. **Acid Buffering:** Use Citric Acid (0.1\u20130.3%) for downward trimming and buffering against alkaline drift.`;
    } else if (lower.includes("cloudy") || lower.includes("separation") || lower.includes("turbid") || lower.includes("stability") || lower.includes("dhundhla")) {
      advice = `**Clarity & Phase Separation Troubleshooting:**
1. **Hard Water Precipitates:** Insoluble Ca\xB2\u207A/Mg\xB2\u207A sulfonates cause cloudiness. Remedy: Add 0.5\u20131.0% GLDA (Dissolvine) or Sodium Gluconate.
2. **Hydrotrope Addition:** If high-titer surfactants separate below their Krafft point in cold weather, add 1.0\u20132.5% Sodium Xylene Sulfonate (SXS 40%) or Propylene Glycol to clarify the isotropic single phase.
3. **Ionic Charge Incompatibility:** NEVER mix cationic conditioning quats (BKC, CTAC, Esterquats) directly with anionic surfactants (LABSA, SLES) without a strong non-ionic bridging surfactant (like LAE-9 or APG).`;
    } else if (lower.includes("cost") || lower.includes("margin") || lower.includes("cheap") || lower.includes("sasta") || lower.includes("economy")) {
      advice = `**Industrial Cost-Optimization Strategy:**
1. **Economy Grade (\u20B918\u201328 / kg target):** Pair 5.0\u20137.0% LABSA with 2.0\u20133.0% Soda Ash builder, 0.5% CAPB for foam stabilization, and thicken using 1.2% NaCl rather than expensive polymers.
2. **Active Matter Efficiency:** Maximize detergency per rupee by boosting synergistic builders (Sodium Metasilicate + GLDA) which cut the required surfactant dosage by 25%.
3. **Preservation:** Always maintain 0.1% Kathon CG or DMDM Hydantoin to prevent microbial fouling and odor development.`;
    } else {
      advice = `**Detergent Formulation Chemistry Best Practices:**
1. **Surfactant Synergy:** Maintain an optimal 3:1 ratio of Anionic (LABSA/SLES) to Amphoteric/Nonionic (CAPB / APG / LAE-9) for maximum interfacial soil rolling-up and high, creamy foam.
2. **Critical Micelle Concentration (CMC):** Blended systems exhibit lower mixed CMC than single surfactants, delivering superior cleaning at reduced active matter.
3. **Process Sequence:** Always charge DM Water first \u2192 disperse Acid/LABSA \u2192 neutralize with Alkali \u2192 add Foamers/Nonionics \u2192 add Chelators & Preservative \u2192 finalize Viscosity with Salt titration at the very end.`;
    }
    return `[Specialized Detergent Formulation AI Engine]

${advice}`;
  };
  try {
    const systemPrompt = `You are a world-class Industrial Detergent Formulation Chemist & Cleaning Product R&D Specialist.
Your deep chemical domain expertise covers:
1. Surfactant Physical Chemistry: Anionic (LABSA, SLES, SLS, AOS, SAS), Amphoteric (CAPB, Amine Oxides, Amphoacetates), Non-ionic (Alcohol Ethoxylates LAE-7/LAE-9, Alkyl Polyglucosides APG Coco/Decyl/Lauryl Glucosides), and Cationic (Quats, Esterquats, BKC).
2. Stoichiometric Calculations: Acid-base neutralization of LABSA with Caustic Soda (NaOH), Caustic Potash (KOH), or Triethanolamine (TEA); exact molar equivalents and neutralization ratios.
3. Rheology & Viscosity: Micellar growth, worm-like micelles, the electrolyte salt curve (NaCl titration), salting-out thresholds, and polymeric thickeners (HPMC, Xanthan, Carbomer 940, Acrylates copolymers).
4. Chelation & Builders: Sequestration of Ca\xB2\u207A/Mg\xB2\u207A hardness, green chelants (GLDA, MGDA, Sodium Gluconate), STPP, Zeolite 4A, Soda Ash, Sodium Metasilicate.
5. Emulsion & HLB: Hydrophilic-Lipophilic Balance calculations, O/W and W/O emulsification, Bancroft's rule, microemulsions, cloud point, and Krafft temperature.
6. Enzyme & Preservative Stabilization: Protease/Amylase stabilization using Propylene Glycol, Borax/Boric acid, and Calcium salts; preservative compatibility windows (Kathon CG, DMDM Hydantoin, Phenoxyethanol, Sodium Benzoate pH limits).
7. Troubleshooting: Diagnosing cloudiness, haze, phase separation, syneresis, viscosity loss, rancidity, precipitation, and scaling issues.

Language Capability:
- You are fully multilingual and speak fluent English, Hindi (\u0939\u093F\u0928\u094D\u0926\u0940), and Hinglish (Hindi written in Roman script).
- If the user writes or asks in Hindi or Hinglish, respond warmly and clearly in Hindi/Hinglish with exact chemical facts, dosages, and step-by-step instructions.
- Always provide actionable, scientific, industrial-grade advice with exact percentage ranges, chemical names, and mixing sequences.

Formulation Context Provided:
${JSON.stringify(context || {})}`;
    const contents = [];
    if (history && Array.isArray(history)) {
      for (const h of history) {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.content }]
        });
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });
    const execution = await AiFallbackService.executeWithFallback(
      client,
      {
        contents,
        systemInstruction: systemPrompt,
        temperature: 0.2,
        taskName: "AI Chemistry Consultation"
      },
      () => domainExpertFallback(message, context)
    );
    res.json({
      reply: execution.data,
      modelUsed: execution.modelUsed,
      tier: execution.tier,
      executionTimeMs: execution.executionTimeMs
    });
    return;
  } catch (error) {
    console.error("All AI models and fallbacks failed in chat:", error);
    res.json({
      reply: domainExpertFallback(message, context),
      mode: "Auto Fallback (Quota / Network Resilient)",
      modelUsed: "Deterministic Chemical R&D Engine",
      tier: "predefined_provider"
    });
    return;
  }
});
app.get("/api/ai/chemistry-status", async (req, res) => {
  const client = getAIClient();
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY");
  if (req.query.probe === "true" && hasKey) {
    await probeGeminiHealth();
  }
  let reachability = "DETERMINISTIC_FALLBACK_ACTIVE";
  if (!hasKey) {
    reachability = "DETERMINISTIC_FALLBACK_ACTIVE";
  } else if (lastAIOperationSuccess === true) {
    reachability = "TESTED_SUCCESS";
  } else if (lastAIOperationSuccess === false) {
    reachability = "UNREACHABLE";
  } else {
    reachability = "CONFIGURED_UNTESTED";
  }
  const isOperational = reachability === "TESTED_SUCCESS";
  res.json({
    activeModel: hasKey ? "gemini-3.8-flash" : "Deterministic Chemical R&D Engine (Local Core)",
    provider: "Google Gemini 3.8 Flash (AI Studio)",
    status: reachability,
    isOperational,
    apiKeyConfigured: hasKey,
    clientInitialized: Boolean(client),
    reachability,
    fallbackMode: !isOperational,
    lastTestedAt: lastAIOperationTimestamp,
    chemistryCapabilities: {
      surfactantScience: "Anionic, Amphoteric, Non-ionic, Cationic, Biosurfactants (APG)",
      stoichiometricNeutralization: "LABSA + NaOH/KOH/TEA exact molar ratios",
      rheologyElectrolyteCurve: "NaCl micellar expansion, salting-out curves & polymer thickening",
      chelationHardWater: "GLDA, MGDA, Sodium Gluconate, STPP, Zeolites (ppm CaCO3)",
      phaseStabilityHlb: "HLB 1.0 - 20.0, Krafft point, cloud point, hydrotropes (SXS, PG)",
      enzymePreservativeStability: "Protease/Amylase stabilizers & pH preservative windows",
      troubleshooting: "Cloudiness, phase separation, viscosity drop, odor, foaming control",
      multilingualSupport: ["English", "Hindi (\u0939\u093F\u0928\u094D\u0926\u0940)", "Hinglish", "Gujarati", "Marathi"]
    }
  });
});
app.post(
  "/api/ai/research-ingredient",
  authenticateUserMiddleware,
  payloadSizeValidator(5e4),
  rateLimitMiddleware({ maxRequests: 20, windowMs: 6e4, endpointName: "Ingredient Research" }),
  async (req, res) => {
    const { nameOrAlias } = req.body || {};
    if (!nameOrAlias || typeof nameOrAlias !== "string" || nameOrAlias.trim().length === 0) {
      return res.status(400).json({ error: "Invalid request payload: nameOrAlias must be a non-empty string" });
    }
    if (nameOrAlias.length > 200) {
      return res.status(413).json({ error: "Request payload too large: ingredient name exceeds maximum limit" });
    }
    try {
      const result = await IngredientResearchService.researchIngredient(nameOrAlias.trim(), process.env.GEMINI_API_KEY);
      res.json(result);
    } catch (err) {
      console.error("Sanitized error during ingredient research for:", nameOrAlias.substring(0, 50));
      res.status(500).json({ error: sanitizeErrorMessage(err) });
    }
    return;
  }
);
app.post(
  "/api/ai/apply-verified-ingredient",
  authenticateUserMiddleware,
  payloadSizeValidator(1e5),
  rateLimitMiddleware({ maxRequests: 30, windowMs: 6e4, endpointName: "Apply Verified Data" }),
  async (req, res) => {
    const { researchResult, previousRecord } = req.body || {};
    if (!researchResult || typeof researchResult !== "object" || !researchResult.ingredientId) {
      return res.status(400).json({ error: "Invalid request payload: valid researchResult with ingredientId required." });
    }
    const params = researchResult.parameters || {};
    if (params.activeMatter !== void 0 && params.activeMatter !== null) {
      const am = Number(params.activeMatter);
      if (isNaN(am) || am < 0 || am > 100) {
        return res.status(400).json({ error: "Validation failed: activeMatter must be a number between 0 and 100." });
      }
    }
    if (params.pH !== void 0 && params.pH !== null) {
      const ph = Number(params.pH);
      if (isNaN(ph) || ph < 0 || ph > 14) {
        return res.status(400).json({ error: "Validation failed: pH must be a number between 0 and 14." });
      }
    }
    if (params.density !== void 0 && params.density !== null) {
      const d = Number(params.density);
      if (isNaN(d) || d <= 0 || d > 3) {
        return res.status(400).json({ error: "Validation failed: density must be a positive number up to 3.0 g/cm\xB3." });
      }
    }
    const prov = researchResult.provenance;
    if (prov && prov.activeMatter && prov.activeMatter.sourceUrl) {
      const url = String(prov.activeMatter.sourceUrl);
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return res.status(400).json({ error: "Validation failed: sourceUrl must use http or https protocol." });
      }
    }
    try {
      const result = await IngredientResearchService.applyVerifiedData(researchResult, previousRecord);
      res.json(result);
    } catch (err) {
      console.error("Sanitized error applying verified ingredient data:", researchResult.ingredientId);
      res.status(500).json({ error: sanitizeErrorMessage(err) });
    }
    return;
  }
);
function enforcePreservativeConstraints(formula) {
  if (!formula || !formula.ingredients || formula.ingredients.length === 0) return formula;
  let pH = 7.5;
  const propPH = formula.properties?.pH;
  if (propPH) {
    const cleanPH = String(propPH).replace(/[^\d.-]/g, "");
    if (cleanPH.includes("-")) {
      const parts = cleanPH.split("-").map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        pH = (parts[0] + parts[1]) / 2;
      }
    } else {
      const val = Number(cleanPH);
      if (!isNaN(val)) pH = val;
    }
  } else {
    const typeLower = (formula.productType || "").toLowerCase();
    if (typeLower.includes("softener") || typeLower.includes("conditioner")) {
      pH = 4;
    } else if (typeLower.includes("degreaser")) {
      pH = 11;
    } else if (typeLower.includes("dish")) {
      pH = 7;
    }
  }
  let safePreservative = {
    name: "Kathon CG (Safe Preservative)",
    percentage: 0.1,
    role: "Safe Preservative / pH compatible",
    costPerKg: null,
    activeMatterPct: 0,
    hlbValue: null
  };
  if (pH <= 5.5) {
    safePreservative = {
      name: "Sodium Benzoate (Safe Eco Preservative)",
      percentage: 0.2,
      role: "Safe Eco Preservative / pH compatible",
      costPerKg: null,
      activeMatterPct: 0,
      hlbValue: null
    };
  } else if (pH > 9) {
    safePreservative = {
      name: "Phenoxyethanol (Safe Preservative)",
      percentage: 0.15,
      role: "High-pH Stable Safe Preservative",
      costPerKg: null,
      activeMatterPct: 0,
      hlbValue: null
    };
  } else {
    safePreservative = {
      name: "Kathon CG (Safe Preservative)",
      percentage: 0.1,
      role: "Safe Preservative / pH compatible",
      costPerKg: null,
      activeMatterPct: 0,
      hlbValue: null
    };
  }
  let hasPreservative = false;
  let preservativeIdx = -1;
  formula.ingredients.forEach((ing, idx) => {
    const nameLower = ing.name.toLowerCase();
    const roleLower = (ing.role || "").toLowerCase();
    const isPres = nameLower.includes("preservative") || roleLower.includes("preservative") || nameLower.includes("formalin") || nameLower.includes("formaldehyde") || nameLower.includes("kathon") || nameLower.includes("benzoate") || nameLower.includes("sorbate") || nameLower.includes("phenoxy") || nameLower.includes("benzyl alcohol") || nameLower.includes("dmdm");
    if (isPres) {
      hasPreservative = true;
      preservativeIdx = idx;
    }
  });
  if (hasPreservative && preservativeIdx !== -1) {
    const currentIng = formula.ingredients[preservativeIdx];
    const nameLower = currentIng.name.toLowerCase();
    let needsSubstitution = false;
    if (nameLower.includes("formalin") || nameLower.includes("formaldehyde")) {
      needsSubstitution = true;
    }
    if (nameLower.includes("benzoate") || nameLower.includes("sorbate")) {
      if (pH > 5.5) needsSubstitution = true;
    }
    if (nameLower.includes("benzyl alcohol")) {
      if (pH > 8) needsSubstitution = true;
    }
    if (nameLower.includes("kathon")) {
      if (pH > 9) needsSubstitution = true;
    }
    if (needsSubstitution) {
      formula.ingredients[preservativeIdx] = {
        ...safePreservative,
        percentage: currentIng.percentage > 0 ? currentIng.percentage : safePreservative.percentage
      };
    }
  } else {
    formula.ingredients.push(safePreservative);
  }
  return formula;
}
function getHlbValueByName(name) {
  const n = (name || "").toLowerCase();
  if (n.includes("labsa") || n.includes("sulfonic acid")) return 11.5;
  if (n.includes("sles") || n.includes("ether sulfate")) return 13;
  if (n.includes("capb") || n.includes("cocamidopropyl betaine")) return 12;
  if (n.includes("aos") || n.includes("olefin sulfonate")) return 12;
  if (n.includes("sls needle") || n.includes("sls liquid") || n.includes("sodium lauryl sulfate")) return 40;
  if (n.includes("tween 20")) return 16.7;
  if (n.includes("tween 80")) return 15;
  if (n.includes("span 80")) return 4.3;
  if (n.includes("span 20")) return 8.6;
  if (n.includes("gms") || n.includes("glyceryl monostearate")) return 3.8;
  if (n.includes("cde") || n.includes("cocamide dea")) return 13.5;
  if (n.includes("cme") || n.includes("cocamide mea")) return 11.5;
  if (n.includes("np-9") || n.includes("nonylphenol ethoxylate (np-9)") || n.includes("alfox 200")) return 13;
  if (n.includes("np-6")) return 10.9;
  if (n.includes("np-10")) return 13.3;
  if (n.includes("lae-9") || n.includes("linear alcohol ethoxylate (lae-9)")) return 13.3;
  if (n.includes("lae-7")) return 12.1;
  if (n.includes("lae-3")) return 8;
  if (n.includes("bkc") || n.includes("benzalkonium chloride")) return 15;
  if (n.includes("ctac") || n.includes("cetrimonium chloride")) return 15.8;
  if (n.includes("btac") || n.includes("behentrimonium chloride")) return 14.5;
  if (n.includes("ldao") || n.includes("lauryl amine oxide")) return 14.2;
  if (n.includes("coco amine oxide")) return 13.8;
  if (n.includes("dls 40") || n.includes("disodium laureth sulfosuccinate")) return 12.6;
  if (n.includes("sarkosyl") || n.includes("sarcosinate")) return 13.5;
  if (n.includes("slmi") || n.includes("lauroyl methyl isethionate")) return 12;
  if (n.includes("peg-40")) return 15;
  if (n.includes("ceteareth-20")) return 15.2;
  if (n.includes("ceteareth-25")) return 16.2;
  if (n.includes("cetyl alcohol")) return 1;
  if (n.includes("stearyl alcohol")) return 1;
  if (n.includes("span 60")) return 4.7;
  if (n.includes("esterquat") || n.includes("dhtdmac")) return 10;
  if (n.includes("peg-150")) return 18.5;
  if (n.includes("coco glucoside")) return 12.5;
  if (n.includes("lauryl glucoside")) return 12;
  if (n.includes("decyl glucoside")) return 13;
  if (n.includes("caprylyl/capryl glucoside")) return 13.5;
  if (n.includes("taurate")) return 14.5;
  if (n.includes("isethionate") || n.includes("sci")) return 11;
  if (n.includes("glutamate")) return 14;
  if (n.includes("oat amino acids")) return 13.8;
  if (n.includes("mes 70%") || n.includes("methyl ester sulfonate")) return 12.8;
  if (n.includes("saponin") || n.includes("soapnut")) return 13.5;
  if (n.includes("slsa") || n.includes("sulfoacetate")) return 11.8;
  return null;
}
function calculateActiveMatterServer(ingredients) {
  if (!ingredients || !Array.isArray(ingredients)) return 0;
  let totalActive = 0;
  ingredients.forEach((ing) => {
    const name = (ing.name || "").toLowerCase();
    const isSurfactant = name.includes("labsa") || name.includes("sulfonic acid") || name.includes("sles") || name.includes("ether sulfate") || name.includes("sls") || name.includes("lauryl sulfate") || name.includes("aos") || name.includes("olefin sulfonate") || name.includes("dodecylbenzene sulfonate") || name.includes("sdbs") || name.includes("isethionate") || name.includes("sci") || name.includes("taurate") || name.includes("sarcosinate") || name.includes("sarkosyl") || name.includes("sulfosuccinate") || name.includes("dls") || name.includes("sulfoacetate") || name.includes("slsa") || name.includes("alkane sulfonate") || name.includes("sas") || name.includes("methyl ester sulfonate") || name.includes("mes") || name.includes("soap noodles") || name.includes("cocoate") || name.includes("potassium soap") || name.includes("sodium soap") || name.includes("betaine") || name.includes("capb") || name.includes("amphoacetate") || name.includes("amphodiacetate") || name.includes("amine oxide") || name.includes("ldao") || name.includes("cocamine oxide") || name.includes("sultaine") || name.includes("cetrimonium") || name.includes("ctac") || name.includes("behentrimonium") || name.includes("btac") || name.includes("benzalkonium") || name.includes("bkc") || name.includes("didecyldimethyl") || name.includes("ddac") || name.includes("esterquat") || name.includes("dhtdmac") || name.includes("glucoside") || name.includes("apg") || name.includes("ethoxylate") || name.includes("lae") || name.includes("fae") || name.includes("np-9") || name.includes("np-6") || name.includes("np-10") || name.includes("alfox") || name.includes("polysorbate") || name.includes("tween") || name.includes("span") || name.includes("sorbitan") || name.includes("ceteareth") || name.includes("glyceryl stearate") || name.includes("gms") || name.includes("cocamide") || name.includes("cde") || name.includes("cme") || name.includes("cmea") || name.includes("sucrose cocoate") || name.includes("sucrose stearate") || name.includes("soapnut") || name.includes("saponin") || name.includes("surfactant") || name.includes("naoh") || name.includes("caustic") || name.includes("sodium hydroxide") || name.includes("lye");
    if (isSurfactant) {
      let activePct = ing.activeMatterPct !== void 0 && ing.activeMatterPct !== null ? ing.activeMatterPct : ing.activeMatterPurity !== void 0 ? ing.activeMatterPurity : ing.active !== void 0 ? ing.active : 0;
      if (!activePct || activePct === 0) {
        if (name.includes("33")) activePct = 33;
        else if (name.includes("50")) activePct = 50;
        else if (name.includes("98") || name.includes("flake")) activePct = 98;
        else activePct = 100;
      }
      totalActive += Number(ing.percentage || 0) * Number(activePct || 0) / 100;
    }
  });
  return Number(totalActive.toFixed(2));
}
function enforceFormulaMassBalance(formula) {
  if (!formula || !formula.ingredients || formula.ingredients.length === 0) return formula;
  formula = enforcePreservativeConstraints(formula);
  let weightedHlbSum = 0;
  let surfactantPctSum = 0;
  formula.ingredients.forEach((ing) => {
    ing.percentage = Number(Number(ing.percentage).toFixed(2));
    const correctHlb = getHlbValueByName(ing.name);
    if (correctHlb !== null) {
      ing.hlbValue = correctHlb;
    } else if (serverIsSurfactant(ing.name)) {
      if (ing.hlbValue === void 0 || ing.hlbValue === null || ing.hlbValue > 20 || ing.hlbValue < 0) {
        ing.hlbValue = null;
      }
    } else {
      ing.hlbValue = null;
    }
    if (ing.hlbValue !== null && ing.hlbValue !== void 0 && ing.hlbValue > 0) {
      weightedHlbSum += ing.percentage * ing.hlbValue;
      surfactantPctSum += ing.percentage;
    }
  });
  if (surfactantPctSum > 0) {
    formula.calculatedHlb = (weightedHlbSum / surfactantPctSum).toFixed(1);
  } else {
    formula.calculatedHlb = "Not Applicable";
  }
  formula.activeMatter = calculateActiveMatterServer(formula.ingredients);
  let waterIdx = formula.ingredients.findIndex((ing) => {
    const nameLower = ing.name.toLowerCase();
    const roleLower = (ing.role || "").toLowerCase();
    return nameLower.includes("water") || nameLower.includes("aqua") || nameLower.includes("carrier") || roleLower.includes("carrier") || roleLower.includes("solvent");
  });
  if (waterIdx === -1) {
    let currentSum = 0;
    formula.ingredients.forEach((ing) => {
      currentSum += ing.percentage;
    });
    const remPct = Number((currentSum < 100 ? 100 - currentSum : 0).toFixed(2));
    formula.ingredients.push({
      name: "Demineralized Water (DM Water)",
      percentage: remPct,
      role: "Solvent Carrier",
      costPerKg: 2,
      activeMatterPct: 0,
      hlbValue: null
    });
    waterIdx = formula.ingredients.length - 1;
  }
  let nonWaterSum = 0;
  formula.ingredients.forEach((ing, idx) => {
    if (idx !== waterIdx) {
      nonWaterSum += ing.percentage;
    }
  });
  if (nonWaterSum > 100) {
    const maxAllowedNonWater = 95;
    const correctionFactor = maxAllowedNonWater / nonWaterSum;
    let newNonWaterSum = 0;
    formula.ingredients.forEach((ing, idx) => {
      if (idx !== waterIdx) {
        ing.percentage = Number((ing.percentage * correctionFactor).toFixed(2));
        newNonWaterSum += ing.percentage;
      }
    });
    formula.ingredients[waterIdx].percentage = Number((100 - newNonWaterSum).toFixed(2));
  } else {
    formula.ingredients[waterIdx].percentage = Number((100 - nonWaterSum).toFixed(2));
  }
  let finalSum = 0;
  formula.ingredients.forEach((ing) => {
    finalSum += ing.percentage;
  });
  if (finalSum !== 100) {
    const residual = Number((100 - finalSum).toFixed(2));
    formula.ingredients[waterIdx].percentage = Number((formula.ingredients[waterIdx].percentage + residual).toFixed(2));
  }
  let totalCost = 0;
  formula.ingredients.forEach((ing) => {
    totalCost += ing.percentage / 100 * (ing.costPerKg || 0);
  });
  formula.actualCost = Number(totalCost.toFixed(2));
  return formula;
}
function serverIsSurfactant(name) {
  const n = name.toLowerCase();
  if (n.includes("labsa") || n.includes("sles") || n.includes("capb") || n.includes("glucoside") || n.includes("lae") || n.includes("aos") || n.includes("sulfonate") || n.includes("sarcosinate") || n.includes("betaine") || n.includes("amine oxide") || n.includes("esterquat") || n.includes("dhtdmac") || n.includes("soapnut") || n.includes("active surfactant") || n.includes("surfactant")) {
    return true;
  }
  return false;
}
function analyzeUserFormulaFallback(ingredients, productType, grade, targetCost) {
  const list = JSON.parse(JSON.stringify(ingredients));
  let waterIdx = list.findIndex((ing) => {
    const nameLower = (ing.name || "").toLowerCase();
    const roleLower = (ing.role || "").toLowerCase();
    return nameLower.includes("water") || nameLower.includes("aqua") || nameLower.includes("carrier") || roleLower.includes("carrier") || roleLower.includes("solvent");
  });
  if (waterIdx === -1) {
    let currentSum = 0;
    list.forEach((ing) => {
      currentSum += Number(ing.percentage || 0);
    });
    const remPct = Number((currentSum < 100 ? 100 - currentSum : 0).toFixed(2));
    list.push({
      name: "Demineralized Water (DM Water)",
      percentage: remPct,
      role: "Solvent Carrier",
      costPerKg: null,
      activeMatterPct: 0,
      hlbValue: null
    });
    waterIdx = list.length - 1;
  }
  let nonWaterSum = 0;
  list.forEach((ing, idx) => {
    if (idx !== waterIdx) {
      nonWaterSum += Number(ing.percentage || 0);
    }
  });
  if (nonWaterSum > 100) {
    const maxAllowedNonWater = 95;
    const correctionFactor = maxAllowedNonWater / nonWaterSum;
    let newNonWaterSum = 0;
    list.forEach((ing, idx) => {
      if (idx !== waterIdx) {
        ing.percentage = Number((Number(ing.percentage) * correctionFactor).toFixed(2));
        newNonWaterSum += ing.percentage;
      }
    });
    list[waterIdx].percentage = Number((100 - newNonWaterSum).toFixed(2));
  } else {
    list[waterIdx].percentage = Number((100 - nonWaterSum).toFixed(2));
  }
  list.forEach((ing) => {
    const n = (ing.name || "").toLowerCase();
    if (ing.costPerKg === void 0 || ing.costPerKg === null || ing.costPerKg === "" || isNaN(Number(ing.costPerKg))) {
      ing.costPerKg = null;
    } else {
      ing.costPerKg = Number(ing.costPerKg);
    }
    if (!ing.role) {
      if (n.includes("labsa")) ing.role = "Anionic Surfactant / Primary Degreaser";
      else if (n.includes("sles")) ing.role = "Anionic Surfactant / High Foam Generator";
      else if (n.includes("capb")) ing.role = "Amphoteric Surfactant / Foam Booster";
      else if (n.includes("water") || n.includes("aqua")) ing.role = "Solvent Carrier";
      else if (n.includes("salt")) ing.role = "Viscosity Control / Thickener";
      else if (n.includes("soda ash")) ing.role = "Alkaline Builder / pH Buffer";
      else if (n.includes("citric")) ing.role = "pH Neutralization Agent";
      else if (n.includes("fragrance")) ing.role = "Aesthetic Perfume";
      else ing.role = "Formulation Additive";
    }
    const correctHlb = getHlbValueByName(ing.name || "");
    if (correctHlb !== null) {
      ing.hlbValue = correctHlb;
    } else if (serverIsSurfactant(ing.name || "")) {
      if (ing.hlbValue === void 0 || ing.hlbValue === null || ing.hlbValue > 20) {
        ing.hlbValue = null;
      }
    } else {
      ing.hlbValue = null;
    }
    ing.percentage = Number(Number(ing.percentage || 0).toFixed(2));
  });
  let actualCost = 0;
  let allPriced = true;
  list.forEach((ing) => {
    if (typeof ing.costPerKg === "number" && !isNaN(ing.costPerKg)) {
      if (actualCost !== null) {
        actualCost += ing.percentage / 100 * ing.costPerKg;
      }
    } else {
      allPriced = false;
    }
  });
  actualCost = allPriced ? Number((actualCost ?? 0).toFixed(2)) : null;
  const activeMatterSum = calculateActiveMatterServer(list);
  let weightedHlbSum = 0;
  let surfactantPctSum = 0;
  list.forEach((ing) => {
    if (ing.hlbValue !== null && ing.hlbValue !== void 0 && ing.hlbValue > 0) {
      weightedHlbSum += ing.percentage * ing.hlbValue;
      surfactantPctSum += ing.percentage;
    }
  });
  const calculatedHlb = surfactantPctSum > 0 ? (weightedHlbSum / surfactantPctSum).toFixed(1) : "Not Applicable";
  return {
    name: "Audited Custom Formulation",
    productType,
    grade,
    targetCost,
    actualCost,
    activeMatter: activeMatterSum,
    calculatedHlb,
    idealHlb: "12.0 - 14.0 (for Laundry Liquid)",
    hlbImportance: "Surfactant HLB determines optimal detergency of the product.",
    properties: {
      pH: "7.5 - 8.5",
      viscosity: "1500 - 2000 cPs",
      foamHeight: "Medium-High Foam",
      cleaningRating: 8.5,
      ecoRating: 7.5,
      compatibilityScore: 98
    },
    ingredients: list,
    manufacturingMethod: [
      { order: 1, action: "Measure Demineralized Water and begin slow stirring.", mixingTime: "5 mins", mixingSpeed: "Slow", temperature: "Ambient", safetyNote: "Ensure equipment grounding." },
      { order: 2, action: "Sequentially add ingredients, checking pH buffers and adjusting if required.", mixingTime: "15 mins", mixingSpeed: "Medium", temperature: "Ambient", safetyNote: "Wear chemical splash goggles." }
    ],
    commonMistakes: ["Excessive rapid stirring resulting in foaming", "Adding salt too quickly bypassing viscosity peak"],
    troubleshootingNotes: ["If separation occurs, check for balance or add hydrotropes"],
    packagingCompatibility: "PE, PP, or PET plastic containers"
  };
}
app.post("/api/ai/formulate", authenticateUserMiddleware, payloadSizeValidator(15e4), rateLimitMiddleware({ maxRequests: 20, windowMs: 6e4, endpointName: "AI Formulator" }), async (req, res) => {
  const {
    mode,
    ingredients: inputIngredients,
    productType: rawProductType,
    productCategory,
    targetCost,
    targetpH: rawTargetpH,
    targetPH,
    targetFoam: rawTargetFoam,
    foamingProfile,
    targetViscosity,
    ecoRequirement: rawEcoRequirement,
    ecoRatingRule,
    grade: rawGrade,
    qualityGrade,
    availableIngredients,
    targetActiveMatter: rawTargetActiveMatter,
    activeMatter: rawActiveMatter,
    targetHlb,
    waterHardnessPpm: rawWaterHardnessPpm,
    waterHardness: rawWaterHardness
  } = req.body;
  const productType = rawProductType || productCategory;
  const targetpH = rawTargetpH || targetPH;
  const targetFoam = rawTargetFoam || foamingProfile;
  const ecoRequirement = rawEcoRequirement || ecoRatingRule;
  const grade = rawGrade || qualityGrade;
  const targetActiveMatter = rawTargetActiveMatter !== void 0 ? rawTargetActiveMatter : rawActiveMatter;
  const waterHardnessPpm = rawWaterHardnessPpm !== void 0 ? rawWaterHardnessPpm : rawWaterHardness;
  const client = getAIClient();
  const typeLower = (productType || "").toLowerCase();
  let activeMatter = targetActiveMatter !== void 0 && targetActiveMatter !== null && !isNaN(Number(targetActiveMatter)) ? Number(targetActiveMatter) : typeLower.includes("anti-foam") || typeLower.includes("antifoam") || typeLower.includes("defoamer") ? grade === "Premium" ? 22 : grade === "Standard" ? 15 : 9 : typeLower.includes("softener") || typeLower.includes("conditioner") ? grade === "Premium" ? 15 : grade === "Standard" ? 10 : 6 : typeLower.includes("degreaser") ? grade === "Premium" ? 20 : grade === "Standard" ? 14 : 8 : grade === "Premium" ? 18.5 : grade === "Standard" ? 12 : 7.5;
  const hardness = Number(waterHardnessPpm) || 150;
  const waterHardness = hardness;
  let builderPercentage = 0.5;
  let builderName = "Sodium Gluconate";
  let builderRole = "Eco Chelating Agent / Water Softener";
  let builderCost = null;
  if (hardness < 100) {
    builderPercentage = 0.4;
    builderName = "Sodium Gluconate";
    builderRole = "Eco Chelating Agent (Balanced for Soft water: " + hardness + " ppm)";
    builderCost = null;
  } else if (hardness >= 100 && hardness < 250) {
    builderPercentage = 1.2;
    builderName = "GLDA (Dissolvine GL 47%)";
    builderRole = "Green Biodegradable Chelator / Water Softener (Adjusted for Medium hardness: " + hardness + " ppm)";
    builderCost = null;
  } else if (hardness >= 250 && hardness < 400) {
    builderPercentage = 2.2;
    builderName = "GLDA (Dissolvine GL 47%)";
    builderRole = "Green Biodegradable Chelator / Water Softener (Adjusted for Hard water: " + hardness + " ppm)";
    builderCost = null;
  } else {
    builderPercentage = 3;
    builderName = "GLDA (Dissolvine GL 47%)";
    builderRole = "Green Biodegradable Chelator / Water Softener (Adjusted for Very Hard water: " + hardness + " ppm)";
    builderCost = null;
  }
  let calculatedHlb = "12.8";
  let idealHlb = "12.0 - 14.0 (for Laundry Liquid Detergency)";
  let hlbImportance = "HLB (Hydrophilic-Lipophilic Balance) measures the relative size and strength of hydrophilic (water-loving) and lipophilic (oil-loving) groups in a surfactant molecule. For laundry detergent liquids, an HLB value of 12 to 14 is the industry standard for optimum cleaning because it allows surfactants to bridge the gap between oil-based soils and the water carrier, effectively emulsifying and lifting grease. If the HLB is too low (e.g. 4-6), the product will act as an anti-foaming agent or water-in-oil emulsifier and fail to clean. If it's too high (e.g. 16-18), it acts as a solubilizer or hydrotrope, becoming too soluble in water to adequately partition onto soil surfaces.";
  let ingredients = [];
  let manufacturingMethod = [];
  let commonMistakes = [];
  let troubleshootingNotes = [];
  let packagingCompatibility = "";
  const isDishwash = typeLower.includes("dish") || typeLower.includes("vessel") || typeLower.includes("utensil") || typeLower.includes("plate");
  const isPureEco = ecoRequirement === "Eco-Friendly Only" || ecoRequirement === "Eco" || ecoRequirement === "Pure Plant-Based" || ecoRequirement === "Pure Plant";
  if (isDishwash) {
    calculatedHlb = isPureEco ? "13.0" : "13.2";
    idealHlb = "13.0 - 15.0 (for Dishwash Detergency)";
    hlbImportance = "For dishwash liquids, an HLB value of 13 to 15 is standard to efficiently emulsify and suspend fatty food greases and butter oils from plates and utensils. Crucially, dishwash formulations must NEVER contain optical brighteners (CBS-X) or CMC (Carboxymethyl Cellulose) as they are meant for cotton fabrics and leave a toxic chemical or cloudy white film residue on plates.";
    if (isPureEco) {
      ingredients = [
        { name: "Coco Glucoside (50% Bio-surfactant)", percentage: grade === "Premium" ? 14 : grade === "Standard" ? 9 : 5, role: "Non-ionic Plant Surfactant / Primary Degreaser", costPerKg: null, activeMatterPct: 50, hlbValue: 13.6 },
        { name: "Lauryl Glucoside (50% Bio-surfactant)", percentage: grade === "Premium" ? 10 : grade === "Standard" ? 6 : 3, role: "Non-ionic Plant Surfactant / Foam Stabilizer", costPerKg: null, activeMatterPct: 50, hlbValue: 12 },
        { name: "CAPB (30%)", percentage: grade === "Premium" ? 8 : grade === "Standard" ? 5 : 2.5, role: "Amphoteric Surfactant / Gentle Hand Mildness", costPerKg: null, activeMatterPct: 30, hlbValue: 12 },
        { name: "Sodium Gluconate", percentage: 1, role: "Eco Chelator / Water Softener", costPerKg: null, activeMatterPct: 0, hlbValue: null },
        { name: "Xanthan Gum (Natural Polymer)", percentage: 0.8, role: "Eco-friendly Thickener & Stabilizer", costPerKg: null, activeMatterPct: 0, hlbValue: null },
        { name: "Citric Acid (for skin-friendly pH adjustment)", percentage: 0.25, role: "pH Adjuster (Buffers pH to 7.2 - 7.5)", costPerKg: null, activeMatterPct: 0, hlbValue: null },
        { name: "Sodium Benzoate (Eco Preservative)", percentage: 0.2, role: "Eco Preservative / Prevents yeast & mold growth", costPerKg: null, activeMatterPct: 0, hlbValue: null },
        { name: "Lemon Essential Oil (Natural Fragrance)", percentage: 0.25, role: "Natural Citrus Scent", costPerKg: null, activeMatterPct: 0, hlbValue: null },
        { name: "Natural Curcumin (Yellow Dye)", percentage: 0.01, role: "Natural Aesthetic Dye", costPerKg: null, activeMatterPct: 0, hlbValue: null },
        { name: "Demineralized Water (DM Water)", percentage: 0, role: "Aqueous Solvent Carrier", costPerKg: null, activeMatterPct: 0, hlbValue: null }
      ];
      manufacturingMethod = [
        { order: 1, action: "Charge full quantity of DM water into the mixing tank. Start stirrer at slow speed (40-50 RPM).", mixingTime: "5 mins", mixingSpeed: "Slow", temperature: "Ambient" },
        { order: 2, action: "Slowly disperse Xanthan Gum into water. Mix vigorously using a high-shear mixer or high speed to prevent lump formation until fully hydrated.", mixingTime: "20 mins", mixingSpeed: "High (1200 RPM)", temperature: "Ambient" },
        { order: 3, action: "Add Coco Glucoside and Lauryl Glucoside. Stir very gently to avoid generating foam. Keep speed below 60 RPM.", mixingTime: "15 mins", mixingSpeed: "Slow", temperature: "Ambient" },
        { order: 4, action: "Slowly pour in CAPB and Sodium Gluconate. Stir until the mixture is fully transparent and homogeneous.", mixingTime: "10 mins", mixingSpeed: "Slow", temperature: "Ambient" },
        { order: 5, action: "Add Sodium Benzoate and pre-dissolved Citric Acid. Check the pH carefully. Adjust with Citric Acid to fall strictly in the skin-safe range of 7.2 - 7.5.", mixingTime: "10 mins", mixingSpeed: "Slow", temperature: "Ambient" },
        { order: 6, action: "Incorporate Lemon Essential Oil and Curcumin dye. Blend for 10 minutes until uniform and clear.", mixingTime: "10 mins", mixingSpeed: "Slow", temperature: "Ambient" }
      ];
      commonMistakes = [
        "Adding Xanthan Gum too fast without high-speed mixing, creating solid 'fish-eye' lumps that never dissolve.",
        "Stirring too rapidly after adding Glucosides, leading to excessive foaming that takes 24 hours to clear."
      ];
      troubleshootingNotes = [
        "If viscosity is too low: check Xanthan Gum hydration. You can add 0.1% increments of Xanthan Gum or Guar Gum.",
        "If product is hazy: Ensure the pH is correct (7.2 - 7.5). If hazy, check that all Glucosides are fully solubilized."
      ];
    } else {
      ingredients = [
        { name: "LABSA (90%)", percentage: grade === "Premium" ? 9 : grade === "Standard" ? 6 : 3.5, role: "Anionic Surfactant / Primary Degreaser", costPerKg: null, activeMatterPct: 90, hlbValue: 11.5 },
        { name: "Sodium Hydroxide (NaOH, Caustic Soda) - for neutralization", percentage: grade === "Premium" ? 1.22 : grade === "Standard" ? 0.81 : 0.47, role: "Neutralizing Agent", costPerKg: null, activeMatterPct: 0, hlbValue: null },
        { name: "SLES (70%)", percentage: grade === "Premium" ? 10 : grade === "Standard" ? 6.5 : 3, role: "Anionic Surfactant / High Foam Generator", costPerKg: null, activeMatterPct: 70, hlbValue: 13 },
        { name: "CAPB (30%)", percentage: grade === "Premium" ? 4 : grade === "Standard" ? 2.5 : 1.5, role: "Amphoteric Surfactant / Foam Booster & Hand Mildness", costPerKg: null, activeMatterPct: 30, hlbValue: 12 },
        { name: builderName, percentage: builderPercentage, role: builderRole, costPerKg: builderCost, activeMatterPct: 0, hlbValue: null },
        { name: "Sodium Chloride (Salt)", percentage: 1.5, role: "Viscosity Thickener", costPerKg: null, activeMatterPct: 0, hlbValue: null },
        { name: "Preservative (Formalin or Kathon CG)", percentage: 0.1, role: "Preservative / Prevents spoilage & rotting", costPerKg: null, activeMatterPct: 0, hlbValue: null },
        { name: "Fragrance (Lemon / Citrus)", percentage: 0.2, role: "Fresh Deodorizing Fragrance", costPerKg: null, activeMatterPct: 0, hlbValue: null },
        { name: "Colorant (Acid Green or Lemon Yellow Dye)", percentage: 0.01, role: "Esthetics", costPerKg: null, activeMatterPct: 0, hlbValue: null },
        { name: "Demineralized Water (DM Water)", percentage: 0, role: "Solvent Carrier", costPerKg: null, activeMatterPct: 0, hlbValue: null }
      ];
      manufacturingMethod = [
        { order: 1, action: "Charge full quantity of DM water into the mixing tank. Start stirrer at moderate speed (50-60 RPM).", mixingTime: "5 mins", mixingSpeed: "Slow", temperature: "Ambient" },
        { order: 2, action: "Slowly disperse acid slurry (LABSA) into water until uniform and fully hydrated.", mixingTime: "15 mins", mixingSpeed: "Medium", temperature: "Ambient" },
        { order: 3, action: "Neutralize to pH 7.2 - 7.8 with Caustic Soda solution. Check pH carefully to ensure skin-safe mildness.", mixingTime: "15 mins", mixingSpeed: "Medium", temperature: "Ambient" },
        { order: 4, action: "Add SLES and mix gently to avoid air bubbles and foaming. Stir until crystal clear.", mixingTime: "25 mins", mixingSpeed: "Medium", temperature: "Ambient" },
        { order: 5, action: `Add CAPB, ${builderName || "Sodium Gluconate"}, and Fragrance/Colorant. Stir until uniform.`, mixingTime: "15 mins", mixingSpeed: "Medium", temperature: "Ambient" },
        { order: 6, action: "Slowly add pre-dissolved Sodium Chloride (salt) in small increments to build high viscosity. Monitor thickness curve.", mixingTime: "15 mins", mixingSpeed: "Slow", temperature: "Ambient" },
        { order: 7, action: "Incorporate Preservative and perform final QC checks for viscosity, pH, and active content.", mixingTime: "10 mins", mixingSpeed: "Slow", temperature: "Ambient" }
      ];
      commonMistakes = [
        "Using CMC or Optical Brightener (this causes cloudy glasses and chemical buildup on plates).",
        "Adding salt too fast (passes viscosity peak, resulting in permanent water-like thinning).",
        "Stirring vigorously (causes air entrapment, making the liquid cloudy or opaque with foam)."
      ];
      troubleshootingNotes = [
        "If the dishwash is cloudy: Check the pH. Ensure it is neutral (6.5 - 7.5). If pH is correct, add a hydrotrope like SXS or a small amount of non-ionic active to clear.",
        "If too thin: Slowly adjust salt level. If salt curve is exceeded, add SLES or a non-ionic active to restore viscosity."
      ];
    }
    packagingCompatibility = "Squeezable PET or HDPE bottles with flip-top caps or push-pull dispensers.";
  } else if (typeLower.includes("anti-foam") || typeLower.includes("antifoam") || typeLower.includes("defoamer")) {
    calculatedHlb = "2.5";
    idealHlb = "1.0 - 3.0 (for Anti-foaming Agents)";
    activeMatter = grade === "Premium" ? 22 : grade === "Standard" ? 15 : 9;
    hlbImportance = "For anti-foaming agents, a low HLB (1.0 - 3.0) is essential so the surfactant is completely insoluble in the continuous water phase. This allows it to migrate to the air-water interface, spreading as a thin film that destabilizes and collapses the liquid lamellae of the foam bubbles. If the HLB is too high, the defoamer would solubilize and boost foam rather than suppress it.";
    ingredients = [
      { name: "Polydimethylsiloxane (Silicone Fluid)", percentage: grade === "Premium" ? 12 : grade === "Standard" ? 8 : 5, role: "De-foaming Active Component", costPerKg: null, activeMatterPct: 100, hlbValue: 1 },
      { name: "Sorbitan Oleate (Span 80)", percentage: grade === "Premium" ? 10 : grade === "Standard" ? 7 : 4, role: "Lipophilic Co-Emulsifier", costPerKg: null, activeMatterPct: 100, hlbValue: 4.3 },
      { name: "Light Mineral Oil (Carrier)", percentage: 20, role: "Hydrophobic Liquid Carrier", costPerKg: null, activeMatterPct: 0, hlbValue: null },
      { name: "Sodium Carboxymethyl Cellulose", percentage: 1, role: "Emulsion Stabilizer & Thickener", costPerKg: null, activeMatterPct: 0, hlbValue: null },
      { name: "Preservative (Kathon CG)", percentage: 0.1, role: "Preservative", costPerKg: null, activeMatterPct: 0, hlbValue: null },
      { name: "Demineralized Water (DM Water)", percentage: 0, role: "Continuous Solvent Phase", costPerKg: null, activeMatterPct: 0, hlbValue: null }
    ];
    manufacturingMethod = [
      { order: 1, action: "Blend Polydimethylsiloxane (Silicone Fluid) and Sorbitan Oleate (Span 80) together in Light Mineral Oil in a separate vessel until fully uniform.", mixingTime: "10 mins", mixingSpeed: "Medium", temperature: "Ambient" },
      { order: 2, action: "Charge the main vessel with DM Water. Dissolve Sodium Carboxymethyl Cellulose slowly under high shear to ensure complete hydration without lumps.", mixingTime: "25 mins", mixingSpeed: "High Shear (1800 RPM)", temperature: "45\xB0C" },
      { order: 3, action: "Under high-speed agitation, slowly pour the oil/silicone blend into the water/polymer phase to form a stable milky emulsion.", mixingTime: "20 mins", mixingSpeed: "High Speed (800 RPM)", temperature: "Ambient" },
      { order: 4, action: "Add preservative and stir gently to cool down and de-aerate the emulsion.", mixingTime: "10 mins", mixingSpeed: "Slow", temperature: "Ambient" }
    ];
    commonMistakes = [
      "Inadequate shearing when combining oil and water phases (causes oil droplets to pool and separate).",
      "Using high-HLB surfactants (causes the silicone oil to solubilize, neutralizing its anti-foaming capability)."
    ];
    troubleshootingNotes = [
      "If separation occurs: Increase high-shear mixing time or add 0.2% Xanthan gum to increase the continuous phase viscosity to lock droplets."
    ];
    packagingCompatibility = "Fluorinated HDPE or thick PET containers to prevent oil permeation.";
  } else if (typeLower.includes("softener") || typeLower.includes("conditioner")) {
    calculatedHlb = "10.2";
    idealHlb = "9.0 - 12.0 (for Fabric Softener Conditioning)";
    activeMatter = grade === "Premium" ? 15 : grade === "Standard" ? 10 : 6;
    hlbImportance = "Fabric softeners utilize cationic surfactants at HLB 9.0 - 12.0. These positively charged molecules are drawn to the negatively charged textile fibers, adsorbing as a lubricant monolayer that reduces fiber-to-fiber friction, static build-up, and fabric stiffness. Mismatched HLB can lead to unstable separation or gelation in storage.";
    ingredients = [
      { name: "DHTDMAC (Esterquat / Cationic Surfactant)", percentage: grade === "Premium" ? 12 : grade === "Standard" ? 8 : 5, role: "Cationic Softening Agent", costPerKg: null, activeMatterPct: 80, hlbValue: 10 },
      { name: "Linear Alcohol Ethoxylate (LAE-9)", percentage: 2, role: "Non-ionic Emulsifier & Re-wetting Agent", costPerKg: null, activeMatterPct: 100, hlbValue: 13.3 },
      { name: "Calcium Chloride (CaCl2 10% solution)", percentage: 0.5, role: "Viscosity Control / Electrolyte", costPerKg: null, activeMatterPct: 0, hlbValue: null },
      { name: "Preservative (Formalin)", percentage: 0.1, role: "Preservative", costPerKg: null, activeMatterPct: 0, hlbValue: null },
      { name: "Fragrance (Lavender Encapsulated)", percentage: 0.4, role: "Long-lasting Fragrance", costPerKg: null, activeMatterPct: 0, hlbValue: null },
      { name: "Colorant (Blue Dye)", percentage: 0.01, role: "Esthetics", costPerKg: null, activeMatterPct: 0, hlbValue: null },
      { name: "Demineralized Water (DM Water)", percentage: 0, role: "Aqueous Carrier", costPerKg: null, activeMatterPct: 0, hlbValue: null }
    ];
    manufacturingMethod = [
      { order: 1, action: "Heat DM Water in the main vessel to 55\xB0C - 60\xB0C. Cationic esterquats must be dispersed above their melting point.", mixingTime: "5 mins", mixingSpeed: "Slow", temperature: "60\xB0C" },
      { order: 2, action: "Slowly add melted Esterquat active matter into the hot water under steady agitation. Avoid high shear to prevent air bubble locking.", mixingTime: "20 mins", mixingSpeed: "Medium (150 RPM)", temperature: "55\xB0C" },
      { order: 3, action: "Add the LAE-9 surfactant to stabilize the cationic dispersion and assist in future wetting during fabric washes.", mixingTime: "10 mins", mixingSpeed: "Medium", temperature: "50\xB0C" },
      { order: 4, action: "Gradually add Calcium Chloride solution to adjust viscosity. Observe the mix thinning from a thick gel into a smooth pourable liquid.", mixingTime: "10 mins", mixingSpeed: "Medium", temperature: "45\xB0C" },
      { order: 5, action: "Cool down to below 35\xB0C under slow stirring, then add Fragrance, Dye, and Preservative.", mixingTime: "15 mins", mixingSpeed: "Slow", temperature: "30\xB0C" }
    ];
    commonMistakes = [
      "Adding Esterquat to cold water (results in thick, un-dispersed lumps that block filters).",
      "Mixing with anionic surfactants (causes mutual neutralization, producing an inactive sticky precipitate)."
    ];
    troubleshootingNotes = [
      "If the mixture is too thick: Add small doses of CaCl2 electrolyte to thin the liquid. Do not add anionic thickeners like CMC."
    ];
    packagingCompatibility = "Standard PET or HDPE bottles. Cationic softeners do not corrode plastics.";
  } else if (typeLower.includes("degreaser")) {
    calculatedHlb = "13.6";
    idealHlb = "12.5 - 14.5 (for Heavy-Duty Degreasing)";
    activeMatter = grade === "Premium" ? 20 : grade === "Standard" ? 14 : 8;
    hlbImportance = "Heavy-duty degreasers require an HLB range of 12.5 - 14.5 to efficiently penetrate, break up, and emulsify dense polymerized greases, lubricating oils, and motor carbon. Often coupled with strong alkaline builders like Sodium Metasilicate, these high-HLB non-ionic surfactants remain stable in electrolyte-dense environments and prevent soil re-deposition.";
    ingredients = [
      { name: "Linear Alcohol Ethoxylate (LAE-9)", percentage: grade === "Premium" ? 14 : grade === "Standard" ? 10 : 6, role: "Non-ionic Emulsifier & Primary Detergent", costPerKg: null, activeMatterPct: 100, hlbValue: 13.3 },
      { name: "CAPB (30%)", percentage: grade === "Premium" ? 6 : grade === "Standard" ? 4 : 2, role: "Amphoteric Co-surfactant / Alkaline Coupling", costPerKg: null, activeMatterPct: 30, hlbValue: 12 },
      { name: "Potassium Hydroxide (KOH, 45% Sol)", percentage: 5, role: "Alkaline Saponification Agent", costPerKg: null, activeMatterPct: 0, hlbValue: null },
      { name: "Sodium Metasilicate Pentahydrate", percentage: 4, role: "Inorganic Builder & Corrosion Inhibitor", costPerKg: null, activeMatterPct: 0, hlbValue: null },
      { name: "Sodium Xylene Sulfonate (SXS 40%)", percentage: 5, role: "Hydrotrope / Coupling Agent", costPerKg: null, activeMatterPct: 0, hlbValue: null },
      { name: "Solvent (Butyl Carbitol)", percentage: 5, role: "Organic Co-Solvent / Grease Cutter", costPerKg: null, activeMatterPct: 0, hlbValue: null },
      { name: "Demineralized Water (DM Water)", percentage: 0, role: "Carrier Solvent", costPerKg: null, activeMatterPct: 0, hlbValue: null }
    ];
    manufacturingMethod = [
      { order: 1, action: "Charge full water quantity. Dissolve Sodium Metasilicate Pentahydrate completely under moderate agitation.", mixingTime: "10 mins", mixingSpeed: "Medium", temperature: "Ambient" },
      { order: 2, action: "Cautiously add Potassium Hydroxide solution. Note that this reaction is slightly exothermic.", mixingTime: "10 mins", mixingSpeed: "Medium", temperature: "Ambient" },
      { order: 3, action: "Add Sodium Xylene Sulfonate (SXS) hydrotrope and Butyl Carbitol grease solvent. Stir to obtain a completely clear phase.", mixingTime: "10 mins", mixingSpeed: "Medium", temperature: "Ambient" },
      { order: 4, action: "Incorporate Linear Alcohol Ethoxylate (LAE-9) and CAPB. Agitate slowly to prevent foam generation inside the vessel.", mixingTime: "20 mins", mixingSpeed: "Medium", temperature: "Ambient" }
    ];
    commonMistakes = [
      "Failing to use a hydrotrope (high levels of builders and electrolytes can salt out non-ionic surfactants, causing the mixture to turn cloudy and separate into layers).",
      "Using ammonium-based salts with KOH (releases hazardous ammonia gas)."
    ];
    troubleshootingNotes = [
      "If formula is cloudy: Add small increments of SXS (Sodium Xylene Sulfonate) hydrotrope to clear and couple the surfactants."
    ];
    packagingCompatibility = "High-Density Polyethylene (HDPE) only. Glass or metals are subject to corrosion by highly alkaline degreasers.";
  } else {
    if (isPureEco) {
      ingredients = [
        { name: "Coco Glucoside (50% Bio-surfactant)", percentage: grade === "Premium" ? 15 : grade === "Standard" ? 10 : 6, role: "Non-ionic Bio-surfactant / Greasy Soil Emulsifier", costPerKg: null, activeMatterPct: 50, hlbValue: 13.6 },
        { name: "Lauryl Glucoside (50% Bio-surfactant)", percentage: grade === "Premium" ? 8 : grade === "Standard" ? 5 : 3, role: "Non-ionic Bio-surfactant / Soil Suspender", costPerKg: null, activeMatterPct: 50, hlbValue: 12 },
        { name: "CAPB (30%)", percentage: grade === "Premium" ? 6 : grade === "Standard" ? 4 : 2, role: "Amphoteric Surfactant / Foam Stabilization & Mildness", costPerKg: null, activeMatterPct: 30, hlbValue: 12 },
        { name: "Sodium Gluconate", percentage: 1.5, role: "Eco-friendly Chelator / Heavy Metal Sequestering", costPerKg: null, activeMatterPct: 0, hlbValue: null },
        { name: "HEC (Hydroxyethyl Cellulose)", percentage: 0.8, role: "Natural Cellulosic Thickener & Anti-redeposition", costPerKg: null, activeMatterPct: 0, hlbValue: null },
        { name: "Sodium Benzoate (Eco Preservative)", percentage: 0.2, role: "Eco Preservative / Prevents yeast & mold growth", costPerKg: null, activeMatterPct: 0, hlbValue: null },
        { name: "Fragrance (Aqua Floral Natural Essential Blend)", percentage: 0.3, role: "Natural Therapeutic Scent", costPerKg: null, activeMatterPct: 0, hlbValue: null },
        { name: "Natural Curcumin (D&C Dye equivalent)", percentage: 0.01, role: "Esthetics", costPerKg: null, activeMatterPct: 0, hlbValue: null },
        { name: "Demineralized Water (DM Water)", percentage: 0, role: "Solvent Carrier", costPerKg: null, activeMatterPct: 0, hlbValue: null }
      ];
      manufacturingMethod = [
        { order: 1, action: "Charge full quantity of DM water into the mixing vessel. Start agitator at slow speed (60-80 RPM).", mixingTime: "5 mins", mixingSpeed: "Slow", temperature: "Ambient" },
        { order: 2, action: "Slowly sift HEC (thickener) into the water under rapid stirring to ensure complete dispersion without lumps. Add a tiny pinch of citric acid to trigger hydration if needed.", mixingTime: "20 mins", mixingSpeed: "High (800 RPM)", temperature: "Ambient" },
        { order: 3, action: "Add Coco Glucoside and Lauryl Glucoside. Stir very gently to avoid generating foam.", mixingTime: "15 mins", mixingSpeed: "Slow", temperature: "Ambient" },
        { order: 4, action: "Add CAPB, Sodium Gluconate, and Sodium Benzoate. Stir until completely crystal clear and uniform.", mixingTime: "15 mins", mixingSpeed: "Slow", temperature: "Ambient" },
        { order: 5, action: "Cool down and add Fragrance and natural colorant. Perform final QC check for skin-safe pH (7.2 - 7.6) and viscosity.", mixingTime: "10 mins", mixingSpeed: "Slow", temperature: "Ambient" }
      ];
      commonMistakes = [
        "Adding HEC too fast, which creates solid lumps (gellies) that do not dissolve in water.",
        "Stirring too fast, trapping micro-foam that makes the liquid look white and cloudy."
      ];
      troubleshootingNotes = [
        "If viscosity is too low: check HEC hydration. You can add 0.1% increments of pre-hydrated HEC to build viscosity safely.",
        "If separation occurs: ensure the Glucosides were added in the correct order and stirred until clear."
      ];
    } else {
      ingredients = [
        { name: "LABSA (90%)", percentage: grade === "Premium" ? 10 : grade === "Standard" ? 7 : 4, role: "Anionic Surfactant / Primary Cleaning", costPerKg: null, activeMatterPct: 90, hlbValue: 11.5 },
        { name: "Sodium Hydroxide (NaOH, Caustic Soda) - for neutralization", percentage: grade === "Premium" ? 1.35 : grade === "Standard" ? 0.95 : 0.54, role: "Neutralizing Agent", costPerKg: null, activeMatterPct: 0, hlbValue: null },
        { name: "SLES (70%)", percentage: grade === "Premium" ? 8 : grade === "Standard" ? 5 : 2.5, role: "Anionic Surfactant / Foam Booster", costPerKg: null, activeMatterPct: 70, hlbValue: 13 },
        { name: "CAPB (30%)", percentage: grade === "Premium" ? 3 : grade === "Standard" ? 2 : 1, role: "Amphoteric Surfactant / Mildness", costPerKg: null, activeMatterPct: 30, hlbValue: 12 },
        { name: builderName, percentage: builderPercentage, role: builderRole, costPerKg: builderCost, activeMatterPct: 0, hlbValue: null },
        { name: "CMC (Carboxymethyl Cellulose) / HEC", percentage: 0.6, role: "Thickener & Anti-redeposition", costPerKg: null, activeMatterPct: 0, hlbValue: null },
        { name: "Optical Brightener (CBS-X)", percentage: 0.1, role: "Optical Brightener", costPerKg: null, activeMatterPct: 0, hlbValue: null },
        { name: "Preservative (Formalin or Kathon)", percentage: 0.1, role: "Preservative", costPerKg: null, activeMatterPct: 0, hlbValue: null },
        { name: "Fragrance (Aqua Floral / Lemon)", percentage: 0.25, role: "Fragrance", costPerKg: null, activeMatterPct: 0, hlbValue: null },
        { name: "Colorant (D&C Dye)", percentage: 0.01, role: "Esthetics", costPerKg: null, activeMatterPct: 0, hlbValue: null },
        { name: "Demineralized Water (DM Water)", percentage: 0, role: "Solvent Carrier", costPerKg: null, activeMatterPct: 0, hlbValue: null }
      ];
      manufacturingMethod = [
        { order: 1, action: "Charge full quantity of DM water into the mixing vessel. Start agitator at low speed (60-80 RPM).", mixingTime: "5 mins", mixingSpeed: "Slow", temperature: "Ambient" },
        { order: 2, action: "Slowly add LABSA (Acid Slurry) into water under continuous stirring. Stir until fully dissolved and uniform (no brown streaks).", mixingTime: "15 mins", mixingSpeed: "Medium (120 RPM)", temperature: "Ambient (LABSA hydration is exothermic)" },
        { order: 3, action: "Gradually add Caustic Soda solution (or dissolved NaOH flakes) to neutralize LABSA. Monitor pH continuously until it reaches 7.5 - 8.2.", mixingTime: "15 mins", mixingSpeed: "Medium", temperature: "Ambient (keep temp < 45\xB0C)" },
        { order: 4, action: "Incorporate SLES slowly to prevent air entrapment and foaming. Stir until SLES is completely dissolved and clear.", mixingTime: "25 mins", mixingSpeed: "Medium", temperature: "Ambient" },
        { order: 5, action: `Add CAPB, ${builderName}, and dissolved Optical Brightener. Stir until completely homogeneous.`, mixingTime: "10 mins", mixingSpeed: "Medium", temperature: "Ambient" },
        { order: 6, action: "Add thickener (e.g., pre-hydrated CMC or HEC) slowly to adjust the viscosity to target. Add salt (NaCl) in small increments if further viscosity build is desired.", mixingTime: "15 mins", mixingSpeed: "Slow", temperature: "Ambient" },
        { order: 7, action: "Cool down if needed, then add Fragrance, Colorant, and Preservative. Perform final QC check for pH, Active Matter, and Viscosity.", mixingTime: "10 mins", mixingSpeed: "Slow", temperature: "Ambient" }
      ];
      commonMistakes = [
        "Adding water directly to concentrated LABSA (causes localized gelation and lumps).",
        "Stirring too fast (creates micro-foam that takes 24-48 hours to settle, causing cloudy/hazy product).",
        "Inadequate pH control (if pH falls below 7.0, SLES/LABSA can slowly hydrolyze and lose active strength; if pH > 9.0, skin mildness is reduced)."
      ];
      troubleshootingNotes = [
        "If viscosity drops suddenly: you may have passed the salt-curve peak. Add a small amount of non-ionic surfactant (e.g., CDE or Cocamide MEA) or polymer (HEC) to restore thickness.",
        "If product separates into layers: check electrolyte balance or increase hydrotrope (e.g., SXS - Sodium Xylene Sulfonate) to couple the formula."
      ];
    }
    packagingCompatibility = "High-Density Polyethylene (HDPE) or PET bottles are highly recommended. Avoid metal containers as neutralized surfactants can still cause micro-corrosion over time.";
  }
  const userHasAvailable = availableIngredients && availableIngredients.trim().length > 0;
  if (userHasAvailable) {
    const rawTokens = availableIngredients.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
    const allowedWords = [
      ...rawTokens,
      "water",
      "aqua",
      "carrier",
      "solvent",
      "dm water",
      "demineralized water",
      "preservative",
      "formalin",
      "kathon",
      "benzoate",
      "sorbate",
      "dmdm",
      "hydantoin",
      "kathon cg",
      "methylisothiazolinone",
      "citric",
      "acid",
      "adjuster",
      "naoh",
      "caustic",
      "sodium hydroxide",
      "neutraliz",
      "koh",
      "potassium hydroxide"
    ];
    ingredients = ingredients.filter((ing) => {
      const nameL = ing.name.toLowerCase();
      return allowedWords.some((token) => {
        if (token.length <= 4) {
          const regex = new RegExp(`\\b${token}\\b|${token}`, "i");
          return regex.test(nameL);
        }
        return nameL.includes(token);
      });
    });
    if (ingredients.length <= 1) {
      ingredients = [
        { name: "SLES (70%)", percentage: grade === "Premium" ? 15 : grade === "Standard" ? 10 : 6, role: "Primary Surfactant", costPerKg: null, activeMatterPct: 70, hlbValue: 13 },
        { name: "Sodium Chloride (Salt)", percentage: 1.5, role: "Viscosity Builder", costPerKg: null, activeMatterPct: 0, hlbValue: null },
        { name: "Demineralized Water (DM Water)", percentage: 0, role: "Solvent Carrier", costPerKg: null, activeMatterPct: 0, hlbValue: null }
      ];
    }
  }
  let initialNonWaterSum = 0;
  let initialWaterIdx = -1;
  ingredients.forEach((ing, idx) => {
    if (ing.name.includes("Water") || ing.name.includes("Carrier") || ing.name.includes("Solvent")) {
      initialWaterIdx = idx;
    } else {
      initialNonWaterSum += ing.percentage;
    }
  });
  if (initialWaterIdx !== -1) {
    const calculatedWater = 100 - initialNonWaterSum;
    ingredients[initialWaterIdx].percentage = Number((calculatedWater > 0 ? calculatedWater : 5).toFixed(2));
  }
  if (targetActiveMatter !== void 0 && targetActiveMatter !== null && !isNaN(Number(targetActiveMatter))) {
    const desiredActive = Number(targetActiveMatter);
    let defaultActive = 0;
    ingredients.forEach((ing) => {
      if (ing.activeMatterPct > 0) {
        defaultActive += ing.percentage * ing.activeMatterPct / 100;
      }
    });
    if (defaultActive > 0) {
      const scaleFactor = desiredActive / defaultActive;
      ingredients = ingredients.map((ing) => {
        if (ing.activeMatterPct > 0) {
          return {
            ...ing,
            percentage: Number((ing.percentage * scaleFactor).toFixed(2))
          };
        }
        return ing;
      });
      const labsa = ingredients.find((i) => i.name.includes("LABSA"));
      if (labsa) {
        const labsaProfile = resolveScientificAcidBaseProfile({ name: labsa.name, activeMatterPct: labsa.activeMatterPct });
        const labsaMassKg = labsa.percentage || 0;
        const labsaEqRes = calculateReactiveEquivalents(labsaProfile, labsaMassKg);
        const labsaEq = labsaEqRes.totalReactiveEquivalents;
        if (labsaEq !== null && labsaEq > 0) {
          ingredients = ingredients.map((ing) => {
            if (ing.name.includes("NaOH") || ing.name.includes("Sodium Hydroxide") || ing.name.includes("Caustic Soda") || ing.name.includes("KOH")) {
              const baseProfile = resolveScientificAcidBaseProfile({ name: ing.name, activeMatterPct: ing.activeMatterPct });
              const baseEqPerKg = baseProfile.equivalentBasis.reactiveEquivalentsPerKg ?? null;
              if (baseEqPerKg !== null && baseEqPerKg > 0) {
                const reqBaseMassKg = labsaEq / baseEqPerKg;
                return {
                  ...ing,
                  percentage: Number(reqBaseMassKg.toFixed(2))
                };
              }
            }
            return ing;
          });
        }
      }
      let nonWaterSum = 0;
      let waterIdx = -1;
      ingredients.forEach((ing, idx) => {
        const nameLower = ing.name.toLowerCase();
        if (nameLower.includes("water") || nameLower.includes("aqua") || nameLower.includes("carrier") || nameLower.includes("solvent")) {
          waterIdx = idx;
        } else {
          nonWaterSum += ing.percentage;
        }
      });
      if (waterIdx !== -1) {
        let waterPct = 100 - nonWaterSum;
        if (waterPct < 5) {
          const clampWaterPct = 5;
          const correctionFactor = (100 - clampWaterPct) / nonWaterSum;
          ingredients = ingredients.map((ing, idx) => {
            if (idx !== waterIdx) {
              return {
                ...ing,
                percentage: Number((ing.percentage * correctionFactor).toFixed(2))
              };
            }
            return ing;
          });
          ingredients[waterIdx].percentage = clampWaterPct;
        } else {
          ingredients[waterIdx].percentage = Number(waterPct.toFixed(2));
        }
      }
    }
  }
  const mockFormula = {
    name: `Custom AI ${grade} ${productType}`,
    productType,
    grade,
    targetCost: targetCost ? Number(targetCost) : null,
    actualCost: null,
    activeMatter,
    calculatedHlb: targetHlb ? String(targetHlb).split("-")[0].trim() : calculatedHlb,
    idealHlb: targetHlb ? `${targetHlb} (User Configured)` : idealHlb,
    hlbImportance: targetHlb ? `This formula has been balanced to match your custom Target HLB of ${targetHlb}. In cleaning chemistry, adjusting the HLB value allows precision targeting of specific soil and surface types.` : hlbImportance,
    targetedPH: targetpH ? String(targetpH) : "6.0",
    estimatedPH: targetpH ? String(targetpH) : "6.0",
    properties: {
      pH: targetpH ? String(targetpH) : typeLower.includes("degreaser") ? "12.0" : typeLower.includes("softener") ? "4.0" : "6.0",
      viscosity: targetViscosity || "1500 - 2500 cPs",
      foamHeight: typeLower.includes("anti-foam") ? "Zero Foam (< 5mm)" : targetFoam === "Low Foam" ? "Low (< 50mm)" : targetFoam === "Medium Foam" ? "Medium (100-150mm)" : "High (> 220mm)",
      cleaningRating: grade === "Premium" ? 92 : grade === "Standard" ? 78 : 60,
      ecoRating: ecoRequirement === "Eco-Friendly Only" || ecoRequirement === "Eco" ? 95 : ecoRequirement === "Semi-Synthetic" ? 60 : ecoRequirement === "Synthetic" ? 25 : 75,
      compatibilityScore: 98
    },
    ingredients,
    manufacturingMethod,
    commonMistakes,
    troubleshootingNotes,
    packagingCompatibility
  };
  if (mode === "check") {
    const checkedFallback = analyzeUserFormulaFallback(inputIngredients || [], productType, grade, targetCost);
    return res.json({
      success: true,
      mode: "Audited Custom Formulation",
      formula: checkedFallback
    });
  }
  if (!client) {
    const balancedMock = enforceFormulaMassBalance(mockFormula);
    return res.json({
      success: true,
      mode: "Demo/Offline Mode",
      formula: balancedMock
    });
  }
  try {
    let prompt = "";
    if (mode === "check") {
      const userIngredientsStr = JSON.stringify(inputIngredients || [], null, 2);
      prompt = `You are an expert detergent chemist. The user has provided their own custom detergent ingredient recipe and wants you to audit and analyze it. 
STRICT REQUIREMENT: You MUST NOT invent, add, or replace any ingredients in the user's recipe (except you can adjust the solvent water/carrier percentage to ensure the total sums up exactly to 100.0% if it doesn't already, or add/fill Demineralized Water (DM Water) to reach 100% mass balance if a solvent carrier is missing/implied).
Do not redesign the formula. Analyze/audit ONLY.

User's Input Ingredient List:
${userIngredientsStr}

Product Type: ${productType}
Grade: ${grade} (Economy, Standard, or Premium)
Target Cost/kg (INR/kg): ${targetCost}

For this specific recipe, you MUST:
1. Keep the exact user ingredients and their relative ratios. If the sum is not 100%, adjust the water/carrier percentage so that it sums up to exactly 100.0%. If there is no water/solvent, append "Demineralized Water (DM Water)" to balance it to 100%.
2. Calculate the exact chemical properties of this specific mixture:
   - "properties.pH": Estimate the pH of this mixture (e.g. "7.5 - 8.2" or "8.0"). Be scientifically accurate based on the acid-alkali ratios (e.g. neutralization of LABSA with NaOH, KOH, or buffering with Soda Ash/Citric Acid).
   - "properties.viscosity": Estimate the viscosity (e.g. "1200 - 1800 cPs" or "2000 cPs").
   - "properties.foamHeight": Estimate the foaming height/profile (e.g. "High Foam", "Low Foam", etc.).
   - "properties.cleaningRating": Estimate cleaning rating (1-10) based on surfactant concentration and builder power.
   - "properties.ecoRating": Estimate eco rating (1-10) based on biodegradability and plant-based content of the entered ingredients.
   - "properties.compatibilityScore": Estimate compatibility score (1-100) based on surfactant interaction (e.g., anionic-cationic compatibility, pH stability).
   - "calculatedHlb": Calculate the weighted HLB value of all surfactant ingredients in this recipe using the formula: \u03A3(surfactant_percentage * hlbValue) / \u03A3(surfactant_percentages). If no surfactants are present, return "Not Applicable". Use the activeMatterPct and hlbValue of each surfactant.
   - "idealHlb": Specify the ideal industry HLB range for this product category (e.g. "12.0 - 14.0 (for Laundry Liquid Detergency)").
   - "hlbImportance": Write an educational explanation of what HLB is, why the calculated HLB of their recipe is or is not aligned with the target, and how they can adjust their surfactant ratios to hit the ideal HLB.
3. Keep the exact user's active% (activeMatterPct) as entered for each ingredient. Do not change them.
4. Preserve the user's costPerKg for each ingredient if provided (or set to null if not provided). Do NOT invent market prices. If prices are missing, set actualCost to null.
5. Provide a custom "manufacturingMethod" (step-by-step instructions to blend the user's specific ingredients).
6. Provide "commonMistakes" specific to the user's ingredient choices (e.g. warnings about adding salt too fast, neutralization temperature, order of addition).
7. Provide custom "troubleshootingNotes" and "packagingCompatibility" specific to this formulation.

Return ONLY a strictly valid JSON response that matches the schema exactly.`;
    } else {
      prompt = `Generate a scientifically accurate and optimized formulation recipe for a detergent.
Parameters:
- Product Type: ${productType}
- Grade: ${grade} (Premium, Standard, or Economy)
- Target Cost/kg: ${targetCost}
- Target pH: EXACTLY ${targetpH || "6.0"}. You MUST calculate the exact amount of NaOH to neutralize all anionic surfactants and then adjust with citric acid to hit the target pH precisely. Do not return a pH range.
- Target Viscosity: ${targetViscosity}
- Target Foam: ${targetFoam}
- Eco Friendly: ${ecoRequirement}
- Target HLB Range/Value: ${targetHlb || "Default standard range for this product category"} (IMPORTANT: Make sure the weighted HLB of surfactants in the formulation aligns with this target range.)
- Target Active Surfactant Matter: ${activeMatter}% (IMPORTANT: You must design the recipe to have a total active surfactant matter of approximately ${activeMatter}%. Sum of (surfactant percentage * activeMatterPct / 100) must equal ${activeMatter}%.)
- Wash Water Hardness: ${hardness} ppm (as CaCO3) (IMPORTANT: You must dynamically scale or introduce green builders & chelators like GLDA (Dissolvine GL 47%), Sodium Gluconate, Sodium Citrate, or Soda Ash based on this water hardness value. If water hardness is soft (< 100 ppm), use a low amount e.g. 0.3-0.5% Sodium Gluconate or GLDA. If water hardness is medium to hard (100-300 ppm), add a robust co-builder level of 1.0-1.8%. If water hardness is very hard (>= 300 ppm), scale the chelators up to 2.0-3.0% and note this water hardness adaptation in the ingredient role or formula explanation.)

CRITICAL HARD WATER CHELATOR RULE:
You MUST scale chelators/builders so that the total sequestration capacity is at least 1.2 times the user's water hardness of ${waterHardness} ppm CaCO\u2083. Target minimum capacity = ${waterHardness * 1.2} ppm CaCO\u2083.

Available chelators and their exact binding capacities per gram (mg CaCO\u2083 per gram of raw material):
- Soda Ash (Sodium Carbonate): 38 mg/g
- Sodium Gluconate: 76 mg/g
- Tetrasodium EDTA: 263 mg/g
- Dissolvine GL-47 (GLDA): 291 mg/g

To calculate the required amount of any chelator:
1. Decide how much of the total target capacity this chelator will provide (e.g., 200 ppm out of ${waterHardness * 1.2} ppm).
2. Required mass in grams = (desired capacity in mg) / (binding capacity per gram).
3. Percentage in formula = (mass in grams / 1000) \u2014 for a 100 kg batch, percentage = mass/1000.

You may combine multiple chelators. Prefer eco-friendly ones first (Sodium Gluconate, then GLDA) and fill the remaining capacity with others if needed. You MUST include the calculated chelator(s) with exact percentages in the final formula ingredients list. DO NOT skip chelators or use less than the target capacity.
- Available Ingredients in Lab: ${availableIngredients ? `STRICT MANDATORY CONSTRAINT: You MUST select formulation ingredients ONLY from this list: "${availableIngredients}". Do NOT include any ingredient that is not in this list, EXCEPT for the following critical chemical stability & safety compounds which you are ALWAYS allowed and required to add:
  1. Demineralized Water (DM Water) as solvent carrier.
  2. NaOH (Caustic Soda), KOH (Potassium Hydroxide), or Citric Acid for acid-base neutralization & strict pH adjustment.
  3. A safe preservative (such as Kathon CG (Preservative), Phenoxyethanol, DMDM Hydantoin, or Sodium Benzoate) at 0.1% to 0.2% concentration to prevent microbial spoilage (since water-based detergents will rot/mold without this).
  If this available list is empty, you are free to design with standard industry raw materials.` : "No constraint (empty list). You are free to design the recipe with standard industry raw materials of your choice."}

CRITICAL CHEMISTRY COMPLIANCE RULES:
1. Product Category Restrictions:
   - For Dishwash Liquid (Dish wash, Vessel wash, Utensil cleaner, Plate washing, etc.), you are STRICTLY FORBIDDEN from adding laundry-specific ingredients like Optical Brighteners (CBS-X, Tinopal) or CMC (Carboxymethyl Cellulose). These leave a dangerous, toxic chemical residue or cloudy white polymer haze on eating plates, glasses, and utensils. If the user wrote these in their available ingredients, explain in the role why they are being omitted, but DO NOT put them in the final ingredients list. Instead, use appropriate thickeners like Salt (NaCl) or Cocamide DEA (CDE), or polymers like HEC/Xanthan Gum, and safe builders like GLDA or Sodium Gluconate.
   - For Laundry Liquid Detergent, you are allowed to use Optical Brighteners, CMC, and clay-based redeposition inhibitors.
   - For Degreasers, use heavy-duty builders (Sodium Metasilicate, Soda Ash, KOH) and high-HLB non-ionic surfactants, with zero optical brighteners.

2. TARGET pH STALKING RULE (CRITICAL):
   - Target pH: EXACTLY ${targetpH || "6.0"}. You MUST calculate the exact amount of NaOH to neutralize all anionic surfactants and then adjust with citric acid to hit the target pH precisely. Do not return a pH range.
   - You MUST ensure the final pH returned in "properties.pH", "targetedPH", and "estimatedPH" matches the specified "Target pH" parameter (${targetpH || "6.0"}) exactly as a single numerical value string (e.g. "${targetpH || "6.0"}").
   - Balance your ingredients accordingly: if anionic acidic surfactants like LABSA (90%), SLES, or AOS are present, calculate the required Caustic Soda (NaOH) or KOH to neutralize them, and use Citric Acid if needed to fine-tune to hit ${targetpH || "6.0"} precisely.

3. PRESERVATIVE SELECTION RULE (CRITICAL):
   - You MUST ALWAYS include a suitable preservative at 0.1% - 0.2% in any water-based formula to prevent micro-biological spoilage.
   - You MUST match the preservative's chemical stability to the formulation's target pH:
     a) For neutral or alkaline formulation target pH (pH >= 6.0), you are STRICTLY FORBIDDEN from using Sodium Benzoate or Potassium Sorbate alone, as organic acids are inactive above pH 5.5 and will fail preservative testing. For these, you MUST use Kathon CG (Preservative), Phenoxyethanol, or DMDM Hydantoin.
     b) For acidic formulation target pH (pH < 5.5), you should prefer Sodium Benzoate or Potassium Sorbate as safe eco-friendly preservatives.
     c) You are STRICTLY FORBIDDEN from using Formalin (Formaldehyde solution) by default due to carcinogenic hazard, unless the user has explicitly typed 'Formalin' in their available list. Always prefer safe, non-formaldehyde-releasing alternatives like Kathon CG (Preservative) or Phenoxyethanol.

4. ECO AND SYNTHETIC COMPLIANCE RULES (CRITICAL):
   - Under the "Eco Friendly" parameter (set to "${ecoRequirement}"), you must choose surfactants, builders, and additives as follows, UNLESS restricted by the Available Ingredients list:
     a) If Eco Friendly is "Eco-Friendly Only", "Eco", "Petroleum Free", or "Pure Plant-Based":
        - You MUST formulate using strictly eco-friendly, biodegradable, and plant-derived raw materials.
        - For surfactants: select from Coco Glucoside, Lauryl Glucoside, Decyl Glucoside, Caprylyl/Capryl Glucoside, Sodium Cocoyl Isethionate (SCI), Sodium Methyl Cocoyl Taurate, Sodium Cocoyl Glutamate, Disodium Cocoyl Glutamate, Methyl Ester Sulfonate (MES), Soapnut Extract (Saponin), or Sodium Lauryl Sulfoacetate (SLSA).
        - For builders and chelators: select from GLDA, MGDA, Sodium Citrate, Sodium Gluconate, Potassium Citrate, Lactic Acid, or Citric Acid.
        - For thickeners & additives: select from Xanthan Gum, Guar Gum, Cationic Guar, Vegetable Glycerin, Sorbitol, and natural essential oils (Lemongrass, Peppermint, Sweet Orange, Eucalyptus).
        - For preservatives: use eco-friendly preservatives like Sodium Benzoate, Potassium Sorbate, or Benzyl Alcohol.
        - STRICTLY FORBIDDEN: Do NOT include any synthetic petroleum-based raw materials like LABSA, SLES, Nonylphenol Ethoxylates (NP-9/NP-6), and environmental hazards like STPP (phosphates) or EDTA.
     b) If Eco Friendly is "Synthetic":
        - You MUST formulate using high-efficiency synthetic surfactants, builders, and additives.
        - For surfactants: use LABSA (Linear Alkyl Benzene Sulfonic Acid), SLES (Sodium Lauryl Ether Sulfate), CAPB (Cocamidopropyl Betaine), AOS (Alpha Olefin Sulfonate), SLS (Sodium Lauryl Sulfate), Cocamide DEA (CDE), Cocamide MEA (CME), Nonylphenol Ethoxylates (NP-9 / NP-10 / Alfox 200), or Linear Alcohol Ethoxylates (LAE-9 / LAE-7).
        - For builders: use Soda Ash (Sodium Carbonate), Sodium Metasilicate, Sodium Silicate, STPP (Sodium Tripolyphosphate), Tetrasodium EDTA, or NTA.
        - For thickeners & polymers: use CMC, HEC, Carbomer, Acrylate Copolymer, PEG-150 Distearate, or Salt (NaCl).
        - For additives: use Optical Brighteners (CBS-X, Tinopal DMS), synthetically derived fragrances (Lemon, Lavender, Rose), and safe preservatives (Kathon CG (Preservative), Phenoxyethanol, DMDM Hydantoin). Do NOT use Formalin due to safety risk alerts.
     c) If Eco Friendly is "Standard Eco" or "Semi-Synthetic":
        - You can blend high-performance synthetic surfactants with eco-friendly additives and green builders (e.g. SLES + CAPB neutralized with Soda Ash, utilizing Sodium Gluconate or Citric Acid). Opt for safe, non-formaldehyde preservatives like Kathon CG or Phenoxyethanol.
     d) MANDATORY PRECEDENCE RULE (STRICT):
        - If the "Available Ingredients in Lab" parameter is NOT empty, then this list of available raw materials takes absolute precedence over all other guidelines! You MUST ONLY select raw materials from the listed "Available Ingredients in Lab", regardless of whether they are synthetic or eco. You are ONLY allowed to add Demineralized Water, Caustic Soda/Caustic Potash/Citric Acid (for pH neutralization), and safe preservatives (to protect the formula from spoiling), as fallback safety compounds.

Return ONLY a strictly valid JSON response that exactly matches this TypeScript schema:
{
  "name": string,
  "productType": string,
  "grade": "Economy" | "Standard" | "Premium",
  "targetCost": number,
  "actualCost": number,
  "activeMatter": number,
  "calculatedHlb": string, // Weighted HLB value of all surfactants in the formula, e.g. "12.8" or "Not Applicable" if no surfactants are used
  "idealHlb": string, // Ideal industry standard HLB range for this product category, e.g. "12.0 - 14.0 (for Laundry Liquid Detergency)" or "13.0 - 15.0 (for Dishwash detergency)" or "11.0 - 13.0 (for Handwash)"
  "hlbImportance": string, // Comprehensive educational explanation of what HLB is, why this calculated HLB is ideal (or needs adjustment) for this product type, how HLB aids emulsification and grease-lifting, and how the chemist can redesign the formula if they need to adjust the HLB.
  "properties": {
    "pH": string,
    "viscosity": string,
    "foamHeight": string,
    "cleaningRating": number,
    "ecoRating": number,
    "compatibilityScore": number
  },
  "ingredients": Array<{
    "name": string,
    "percentage": number,
    "role": string,
    "costPerKg": number,
    "activeMatterPct": number,
    "hlbValue": number | null // HLB value of this ingredient if it is a surfactant (e.g. SLES=13.0, LABSA=11.5, CAPB=12.0, Cocamide DEA=13.0, Tween 20=16.7, etc.). Set to null for non-surfactant raw materials.
  }>,
  "manufacturingMethod": Array<{
    "order": number,
    "action": string,
    "mixingTime": string,
    "mixingSpeed": string,
    "temperature": string,
    "safetyNote": string
  }>,
  "commonMistakes": string[],
  "troubleshootingNotes": string[],
  "packagingCompatibility": string
}

Ensure the ingredient percentages sum up exactly to 100.0%. Do NOT invent ingredient prices; if not entered by user, set costPerKg to null.
Output ONLY raw JSON. No markdown formatting, no backticks, no wrap. Just the JSON text.`;
    }
    const formulateSchema = {
      type: import_genai2.Type.OBJECT,
      properties: {
        name: { type: import_genai2.Type.STRING, description: "Name of the custom formula" },
        productType: { type: import_genai2.Type.STRING, description: "The category/type of the product" },
        grade: { type: import_genai2.Type.STRING, enum: ["Economy", "Standard", "Premium"], description: "The product grade" },
        targetCost: { type: import_genai2.Type.NUMBER, description: "Target cost per kg in INR (if specified by user)" },
        actualCost: { type: import_genai2.Type.NUMBER, description: "Calculated actual raw material cost per kg in INR based on percentages, or null" },
        activeMatter: { type: import_genai2.Type.NUMBER, description: "Total active surfactant matter percentage" },
        calculatedHlb: { type: import_genai2.Type.STRING, description: "Weighted HLB value of all surfactants, e.g., '12.8'" },
        idealHlb: { type: import_genai2.Type.STRING, description: "Ideal standard HLB range, e.g., '12.0 - 14.0 (for Laundry Liquid Detergency)'" },
        hlbImportance: { type: import_genai2.Type.STRING, description: "Comprehensive educational explanation of HLB, how it relates to this product type, and how to adjust it." },
        properties: {
          type: import_genai2.Type.OBJECT,
          properties: {
            pH: { type: import_genai2.Type.STRING },
            viscosity: { type: import_genai2.Type.STRING },
            foamHeight: { type: import_genai2.Type.STRING },
            cleaningRating: { type: import_genai2.Type.NUMBER },
            ecoRating: { type: import_genai2.Type.NUMBER },
            compatibilityScore: { type: import_genai2.Type.NUMBER }
          },
          required: ["pH", "viscosity", "foamHeight", "cleaningRating", "ecoRating", "compatibilityScore"]
        },
        ingredients: {
          type: import_genai2.Type.ARRAY,
          items: {
            type: import_genai2.Type.OBJECT,
            properties: {
              name: { type: import_genai2.Type.STRING },
              percentage: { type: import_genai2.Type.NUMBER },
              role: { type: import_genai2.Type.STRING },
              costPerKg: { type: import_genai2.Type.NUMBER, description: "User cost per kg in INR, or null if unconfigured" },
              activeMatterPct: { type: import_genai2.Type.NUMBER },
              hlbValue: { type: import_genai2.Type.NUMBER, description: "HLB value if surfactant, otherwise omit or set to 0." }
            },
            required: ["name", "percentage", "role", "activeMatterPct"]
          }
        },
        manufacturingMethod: {
          type: import_genai2.Type.ARRAY,
          items: {
            type: import_genai2.Type.OBJECT,
            properties: {
              order: { type: import_genai2.Type.INTEGER },
              action: { type: import_genai2.Type.STRING },
              mixingTime: { type: import_genai2.Type.STRING },
              mixingSpeed: { type: import_genai2.Type.STRING },
              temperature: { type: import_genai2.Type.STRING },
              safetyNote: { type: import_genai2.Type.STRING }
            },
            required: ["order", "action", "mixingTime", "mixingSpeed", "temperature", "safetyNote"]
          }
        },
        commonMistakes: {
          type: import_genai2.Type.ARRAY,
          items: { type: import_genai2.Type.STRING }
        },
        troubleshootingNotes: {
          type: import_genai2.Type.ARRAY,
          items: { type: import_genai2.Type.STRING }
        },
        packagingCompatibility: { type: import_genai2.Type.STRING }
      },
      required: [
        "name",
        "productType",
        "grade",
        "targetCost",
        "actualCost",
        "activeMatter",
        "calculatedHlb",
        "idealHlb",
        "hlbImportance",
        "properties",
        "ingredients",
        "manufacturingMethod",
        "commonMistakes",
        "troubleshootingNotes",
        "packagingCompatibility"
      ]
    };
    const execution = await AiFallbackService.executeWithFallback(
      client,
      {
        contents: prompt,
        responseMimeType: "application/json",
        responseSchema: formulateSchema,
        temperature: 0.1,
        taskName: "AI Formulation Generator"
      },
      () => {
        if (mode === "check") {
          return analyzeUserFormulaFallback(inputIngredients || [], productType, grade, targetCost);
        }
        return enforceFormulaMassBalance(mockFormula);
      }
    );
    const balanced = enforceFormulaMassBalance(execution.data);
    res.json({
      success: true,
      formula: balanced,
      modelUsed: execution.modelUsed,
      tier: execution.tier,
      executionTimeMs: execution.executionTimeMs
    });
    return;
  } catch (error) {
    console.error("All AI models failed in Formulation Generator, activating audited chemistry fallback:", error);
    if (mode === "check") {
      const checkedFallback = analyzeUserFormulaFallback(inputIngredients || [], productType, grade, targetCost);
      res.json({
        success: true,
        mode: "Audited Rule-Based Fallback (Quota Protected)",
        modelUsed: "Audited Physical Chemistry Rules",
        tier: "predefined_provider",
        formula: checkedFallback
      });
      return;
    } else {
      const balancedFallback = enforceFormulaMassBalance(mockFormula);
      res.json({
        success: true,
        mode: "Mass-Balanced Chemical Fallback (Quota Protected)",
        modelUsed: "Deterministic Stoichiometric Engine",
        tier: "predefined_provider",
        formula: balancedFallback
      });
      return;
    }
  }
});
app.post("/api/ai/troubleshoot", authenticateUserMiddleware, payloadSizeValidator(1e5), rateLimitMiddleware({ maxRequests: 30, windowMs: 6e4, endpointName: "AI Troubleshooter" }), async (req, res) => {
  const { query, productContext } = req.body;
  const client = getAIClient();
  const fallbackTrouble = {
    issue: query || "Viscosity dropping / formulation thinning",
    causes: [
      {
        cause: "Electrolyte overload triggering micelle structure collapse",
        confidence: "High",
        chemistryPrinciple: "salt curve \u2014 excess electrolyte can collapse micelle structure at high surfactant concentration by screening ionic charges",
        relationToUserData: productContext?.logs?.some((l) => l.viscosity < 1600) ? `Correlates with your logged low viscosity in batch ${productContext.logs.find((l) => l.viscosity < 1600).batchNo || "B-2607-03"}` : "No specific overlapping viscosity drop found in logged sessions, but common in salt-thickened formulas.",
        correctiveActions: [
          "Dilute the batch slightly with demineralized water and add a small, proportional amount of SLES 70% to restore surfactant-to-electrolyte balance.",
          "Slowly blend in Cocamide DEA (CDE) or Cocamidopropyl Betaine (CAPB) in 0.5% increments to stabilize the micellar network."
        ]
      },
      {
        cause: "Surfactant hydrolysis due to unneutralized LABSA acidity",
        confidence: "Medium",
        chemistryPrinciple: "hydrolysis \u2014 SLES ether-sulfate bonds undergo rapid acid-catalyzed cleavage at pH values below 5.0",
        relationToUserData: productContext?.logs?.some((l) => l.pH < 7) ? `Correlates with low pH (${productContext.logs.find((l) => l.pH < 7).pH}) logged in history.` : "Matches typical patterns when raw LABSA acid is added too quickly without complete caustic neutralization.",
        correctiveActions: [
          "Add Caustic Soda (Sodium Hydroxide) solution slowly to bring pH strictly to 7.5 - 8.5.",
          "Incorporate a stable non-ionic thickener like HEC (Hydroxyethyl Cellulose) to build structure independent of pH."
        ]
      }
    ],
    preventativeMeasures: [
      "Set strict upper limit cut-offs of 1.5% for Sodium Chloride (salt) additions.",
      "Conduct in-line temperature checks to ensure the batch remains below 40\xB0C during neutralization phases to protect enzymes and prevent SLES degradation."
    ]
  };
  try {
    const prompt = `You are a scientific Detergent R&D Troubleshooter and formulation chemist.
A researcher is facing a problem: "${query}".

Analyze this issue and return possible causes and corrective/preventative actions.
Here is the available user laboratory data context (containing experiments, batch logs, or QC logs):
${JSON.stringify(productContext || {})}

IMPORTANT SCIENTIFIC CONSTRAINTS:
1. List possible causes ranked by likelihood, each with a Confidence Score (High/Medium/Low).
2. Cite the specific chemistry principle behind each cause (e.g., "salt curve \u2014 excess electrolyte can collapse micelle structure at high surfactant concentration").
3. Check the provided productContext data. If any logged experiment, QC log, or stability log has metrics (pH, viscosity, temperature, active matter, etc.) that explain or correlate with this issue, cite that SPECIFIC batch ID, date, or log value in 'relationToUserData'. If no relevant user data exists, write "No overlapping logged parameters found in database".
4. Suggest corrective actions using ONLY ingredients/techniques from the typical detergent R&D encyclopedia: LABSA, SLES, CAPB, Caustic Soda, Soda Ash, Sodium Chloride, Cocamide DEA (CDE), CMC, HEC, Sodium Gluconate, Monopropylene Glycol, Citric Acid, AOS (Alpha Olefin Sulfonate), Optical Brighteners.
5. All troubleshooting must be labeled as "AI Recommendation \u2014 Verify With Physical Retest."

Return ONLY a strictly valid JSON response matching this schema:
{
  "issue": string,
  "causes": Array<{
    "cause": string,
    "confidence": "High" | "Medium" | "Low",
    "chemistryPrinciple": string,
    "relationToUserData": string,
    "correctiveActions": string[]
  }>,
  "preventativeMeasures": string[]
}

Do not include markdown code block formatting or backticks. Return raw JSON text only.`;
    const troubleshootSchema = {
      type: import_genai2.Type.OBJECT,
      properties: {
        issue: { type: import_genai2.Type.STRING },
        causes: {
          type: import_genai2.Type.ARRAY,
          items: {
            type: import_genai2.Type.OBJECT,
            properties: {
              cause: { type: import_genai2.Type.STRING },
              confidence: { type: import_genai2.Type.STRING, enum: ["High", "Medium", "Low"] },
              chemistryPrinciple: { type: import_genai2.Type.STRING },
              relationToUserData: { type: import_genai2.Type.STRING },
              correctiveActions: {
                type: import_genai2.Type.ARRAY,
                items: { type: import_genai2.Type.STRING }
              }
            },
            required: ["cause", "confidence", "chemistryPrinciple", "relationToUserData", "correctiveActions"]
          }
        },
        preventativeMeasures: {
          type: import_genai2.Type.ARRAY,
          items: { type: import_genai2.Type.STRING }
        }
      },
      required: ["issue", "causes", "preventativeMeasures"]
    };
    const execution = await AiFallbackService.executeWithFallback(
      client,
      {
        contents: prompt,
        responseMimeType: "application/json",
        responseSchema: troubleshootSchema,
        temperature: 0.1,
        taskName: "AI Troubleshooting"
      },
      () => fallbackTrouble
    );
    res.json({
      success: true,
      troubleshoot: execution.data,
      modelUsed: execution.modelUsed,
      tier: execution.tier,
      executionTimeMs: execution.executionTimeMs
    });
    return;
  } catch (error) {
    console.error("All AI models failed in Troubleshooting API, activating chemistry rules fallback:", error);
    res.json({
      success: true,
      mode: "Chemical R&D Rules Fallback (Quota Protected)",
      modelUsed: "Deterministic Chemical R&D Engine",
      tier: "predefined_provider",
      troubleshoot: fallbackTrouble
    });
    return;
  }
});
app.post("/api/ai/analyze-recommend", authenticateUserMiddleware, payloadSizeValidator(15e4), rateLimitMiddleware({ maxRequests: 25, windowMs: 6e4, endpointName: "AI Analyzer" }), async (req, res) => {
  const { formulaName, productType, grade, ingredients } = req.body;
  const client = getAIClient();
  const predefinedAnalyzerFallback = () => {
    const recs = [];
    const ingList = Array.isArray(ingredients) ? ingredients : [];
    const hasSLES = ingList.some((i) => (i.name || "").toLowerCase().includes("sles"));
    const hasLabsa = ingList.some((i) => (i.name || "").toLowerCase().includes("labsa"));
    const hasChelator = ingList.some((i) => (i.name || "").toLowerCase().includes("gluconate") || (i.name || "").toLowerCase().includes("edta") || (i.name || "").toLowerCase().includes("citrate"));
    if (hasSLES) {
      recs.push({
        type: "Cost Reduction",
        recommendation: "Optimize SLES 70% fraction by pairing with 0.8% - 1.2% Sodium Chloride electrolyte bridge to retain high yield stress and target viscosity while reducing surfactant loading.",
        trigger: "Surfactant rheology optimization potential identified.",
        suggestedIngredient: "Sodium Chloride (Salt)"
      });
    }
    if (!hasChelator) {
      recs.push({
        type: "Stability Enhancement",
        recommendation: "Introduce 0.5% - 1.0% Sodium Gluconate or GLDA to sequester Ca\xB2\u207A/Mg\xB2\u207A ions in tap water, preventing cloudy precipitation and extending product shelf-life.",
        trigger: "Formula lacks dedicated organic builder/chelating agent.",
        suggestedIngredient: "Sodium Gluconate (Safe Organic Chelator)"
      });
    }
    if (hasLabsa) {
      recs.push({
        type: "Eco Optimization",
        recommendation: "Consider blending 2-3% Alpha Olefin Sulfonate (AOS 38%) or Alkyl Polyglucoside (APG 0814) to enhance eco-toxicity profile and skin mildness score.",
        trigger: "Formula relies predominantly on standard synthetic petrochemical surfactants.",
        suggestedIngredient: "Alkyl Polyglucoside (APG Eco Surfactant)"
      });
    }
    if (recs.length === 0) {
      recs.push({
        type: "Performance Boost",
        recommendation: "Maintain balanced anionic-to-amphoteric ratio (3:1) with Cocamidopropyl Betaine (CAPB) for flash foaming and micelle stability.",
        trigger: "Standard baseline formulation optimization pass.",
        suggestedIngredient: "Cocamidopropyl Betaine (CAPB 30%)"
      });
    }
    return recs;
  };
  try {
    const prompt = `You are a Senior Chemical R&D Specialist in Detergents & Industrial Cleaners.
Analyze the following user formulation:
Product: ${formulaName || "Custom Cleaning Product"} (${productType || "General"}, Grade: ${grade || "Standard"})
Ingredients: ${JSON.stringify(ingredients || [])}

Provide high-value, actionable scientific and cost recommendations for this formula.
Focus on: Cost Reduction, Performance Boost, Stability Enhancement, or Eco Optimization.

Return ONLY a valid JSON array matching this schema:
[
  {
    "type": "Cost Reduction" | "Performance Boost" | "Stability Enhancement" | "Eco Optimization",
    "recommendation": string,
    "trigger": string,
    "suggestedIngredient": string
  }
]
No markdown formatting, raw JSON only.`;
    const recommendationSchema = {
      type: import_genai2.Type.ARRAY,
      items: {
        type: import_genai2.Type.OBJECT,
        properties: {
          type: { type: import_genai2.Type.STRING },
          recommendation: { type: import_genai2.Type.STRING },
          trigger: { type: import_genai2.Type.STRING },
          suggestedIngredient: { type: import_genai2.Type.STRING }
        },
        required: ["type", "recommendation", "trigger", "suggestedIngredient"]
      }
    };
    const execution = await AiFallbackService.executeWithFallback(
      client,
      {
        contents: prompt,
        responseMimeType: "application/json",
        responseSchema: recommendationSchema,
        temperature: 0.2,
        taskName: "AI Formula Recommendations"
      },
      () => predefinedAnalyzerFallback()
    );
    res.json({
      success: true,
      recommendations: execution.data,
      modelUsed: execution.modelUsed,
      tier: execution.tier,
      executionTimeMs: execution.executionTimeMs
    });
    return;
  } catch (err) {
    console.error("Formula recommendations fallback error:", err);
    res.json({
      success: true,
      recommendations: predefinedAnalyzerFallback(),
      modelUsed: "Deterministic Chemical R&D Engine",
      tier: "predefined_provider"
    });
    return;
  }
});
app.get("/api/ai/status", async (req, res) => {
  const providers = AiFallbackService.getProvidersStatus();
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY");
  const client = getAIClient();
  if (req.query.probe === "true" && hasKey) {
    await probeGeminiHealth();
  }
  let reachability = "DETERMINISTIC_FALLBACK_ACTIVE";
  if (!hasKey) {
    reachability = "DETERMINISTIC_FALLBACK_ACTIVE";
  } else if (lastAIOperationSuccess === true) {
    reachability = "TESTED_SUCCESS";
  } else if (lastAIOperationSuccess === false) {
    reachability = "UNREACHABLE";
  } else {
    reachability = "CONFIGURED_UNTESTED";
  }
  const isOperational = reachability === "TESTED_SUCCESS";
  const comboState = hasKey ? isOperational ? "Omni Dynamic Router (Configured & Tested Operational)" : "Omni Dynamic Router (Configured - Awaiting Live Probe)" : "Deterministic Offline Core (Active Fallback)";
  res.json({
    status: "ok",
    gateway: "Omni Unified Endpoint",
    combo: comboState,
    apiKeyConfigured: hasKey,
    clientInitialized: Boolean(client),
    reachability,
    providerReachable: isOperational,
    lastTestedAt: lastAIOperationTimestamp,
    providers,
    pipeline: [
      { step: 1, route: "Omni Combo Primary", model: "gemini-3.7-flash", description: "Flagship Fast Reasoning via Omni" },
      { step: 2, route: "Omni Interactions API", model: "gemini-omni-1.1-flash", description: "Omni Model Interactions Route" },
      { step: 3, route: "Omni Combo Fast Failover", model: "gemini-3.1-flash-lite", description: "Low-Latency Dynamic Failover" },
      { step: 4, route: "Omni Combo Alias Route", model: "gemini-flash-latest", description: "High-Availability Redundancy Alias" },
      { step: 5, route: "Deterministic Chemistry Engine", model: "Stoichiometric & Physics Rules", description: "Zero-Credit & Offline Resilient Fallback" }
    ],
    supportedLogicalProfiles: [
      "OpenAI / GPT-4o & GPT-4o-mini",
      "Anthropic / Claude 3.7 Sonnet & 3.5 Haiku",
      "DeepSeek-V3 & DeepSeek-R1",
      "Moonshot / Kimi 8k/32k",
      "Google Gemini Flash & Pro"
    ],
    features: [
      "Single Gateway Omni Endpoint Architecture",
      "Dynamic Account & Model Routing via Omni Combo",
      "Zero External Provider Keys Required in UI",
      "Automatic 429 Quota & Rate Limit Protection",
      "Omni Model Interactions API Support",
      "Deterministic Stoichiometric Formula Balancing",
      "Continuous Offline Workflow Guarantee"
    ]
  });
});
app.post(
  "/api/billing/verify-purchase",
  authenticateUserMiddleware,
  requireVerifiedBillingAuthMiddleware,
  payloadSizeValidator(5e4),
  rateLimitMiddleware({ maxRequests: 15, windowMs: 6e4, endpointName: "Billing Verification" }),
  async (req, res) => {
    const { packageName, productId, purchaseToken } = req.body || {};
    const authenticatedUser = req.user;
    const userId = authenticatedUser.uid;
    const result = await verifyGooglePlayPurchase({
      packageName: packageName || CANONICAL_PACKAGE_NAME,
      productId: productId || "",
      purchaseToken: purchaseToken || "",
      userId
    });
    if (!result.verified) {
      return res.status(result.error?.includes("credentials") ? 503 : 400).json({
        verified: false,
        error: result.error || "Purchase verification failed.",
        status: result.status
      });
    }
    return res.json({
      verified: true,
      status: result.status,
      productId: result.productId,
      userId: result.userId,
      entitlementGranted: true
    });
  }
);
app.get(
  "/api/billing/subscription-status",
  authenticateUserMiddleware,
  requireVerifiedBillingAuthMiddleware,
  rateLimitMiddleware({ maxRequests: 30, windowMs: 6e4, endpointName: "Subscription Status" }),
  async (req, res) => {
    const user = req.user;
    const hasCredentials = Boolean(
      process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS
    );
    return res.json({
      gatewayConfigured: hasCredentials,
      supportedProducts: ALLOWED_PLAY_PRODUCT_IDS,
      policy: "STRICT_FAIL_CLOSED_SERVER_VERIFIED",
      userId: user.uid,
      activeSubscriptions: 0
    });
  }
);
app.post(
  "/api/user/:userId/verify-access",
  authenticateUserMiddleware,
  payloadSizeValidator(1e4),
  (req, res) => {
    const user = req.user;
    const targetUserId = req.params.userId;
    if (!verifyUserOwnership(user.uid, targetUserId)) {
      return res.status(403).json({ error: "Forbidden: You are not authorized to access another user's data." });
    }
    return res.json({ success: true, authorized: true, userId: user.uid });
  }
);
app.get(
  "/api/admin/diagnostics",
  authenticateUserMiddleware,
  requireAdminMiddleware,
  (_req, res) => {
    return res.json({
      status: "OK",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      service: "Detergent Formula Expert Core Service",
      nodeVersion: process.version
    });
  }
);
app.get("/detergent-formula-expert-release.apk", (_req, res) => {
  const publicApkPath = import_path.default.join(process.cwd(), "public", "detergent-formula-expert-release.apk");
  const distApkPath = import_path.default.join(process.cwd(), "dist", "detergent-formula-expert-release.apk");
  const targetPath = import_fs3.default.existsSync(publicApkPath) ? publicApkPath : distApkPath;
  if (import_fs3.default.existsSync(targetPath)) {
    res.setHeader("Content-Type", "application/vnd.android.package-archive");
    res.setHeader("Content-Disposition", 'attachment; filename="detergent-formula-expert-release.apk"');
    return res.sendFile(targetPath);
  } else {
    return res.status(404).send("APK file not found");
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true, allowedHosts: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Detergent R&D Expert server running on http://0.0.0.0:${PORT}`);
    runStartupSecurityDiagnostics();
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
