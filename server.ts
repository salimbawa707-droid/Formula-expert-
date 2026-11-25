import 'dotenv/config';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { resolveUniversalIngredientIdentity } from './src/data/universalIngredientLibrary.ts';
import path from 'path';
import {
  authenticateUserMiddleware,
  requireAdminMiddleware,
  CANONICAL_PACKAGE_NAME,
  isApiKeyConfigured,
  payloadSizeValidator,
  rateLimitMiddleware,
  resolveGeminiModel,
  securityHeadersMiddleware,
  verifyGooglePlayPurchase,
} from './src/services/serverSecurity.ts';

const app = express();
// Dev server must run on port 3000 per AI Studio environment constraints
// Parse command line arguments if provided (e.g. --port 3000 --host 0.0.0.0)
const argv = process.argv.slice(2);
const portFlagIndex = argv.indexOf('--port');
const hostFlagIndex = argv.indexOf('--host');
const cliPort = portFlagIndex !== -1 && argv[portFlagIndex + 1] ? parseInt(argv[portFlagIndex + 1], 10) : NaN;
const cliHost = hostFlagIndex !== -1 && argv[hostFlagIndex + 1] ? argv[hostFlagIndex + 1] : '';

const PORT = Number.isFinite(cliPort) && cliPort > 0 ? cliPort : (process.env.NODE_ENV === 'production' && process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);
const HOST = cliHost || '0.0.0.0';

// Parse small form submissions globally. JSON parsing is route-specific below so a
// large image upload cannot force every API route to accept a 30 MB body.
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(securityHeadersMiddleware());

// Lazy GoogleGenAI proxy: prevents top-level instantiation warnings during pre-warming
let genAIInstance: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIInstance) {
    genAIInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAIInstance;
}
const ai = new Proxy({} as GoogleGenAI, {
  get(_target, prop) {
    const instance = getGenAI() as any;
    const value = instance[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});

async function callWithTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}

function buildGeminiConfig(model: string, config: Record<string, any>): Record<string, any> {
  const sanitized = { ...config };
  if (model.startsWith('gemini-4')) {
    delete sanitized.temperature;
    delete sanitized.topP;
    delete sanitized.topK;
    delete sanitized.candidateCount;
  }
  return sanitized;
}

// API Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: isApiKeyConfigured(process.env.GEMINI_API_KEY),
    service: 'Formula Expert Forensic R&D Backend'
  });
});

// Gemini Chemistry AI Chat Proxy Endpoint
app.post(
  '/api/ai/chat',
  authenticateUserMiddleware,
  rateLimitMiddleware({ maxRequests: 20, windowMs: 60_000, endpointName: 'AI chat' }),
  express.json({ limit: '256kb' }),
  payloadSizeValidator(256 * 1024),
  async (req: Request, res: Response) => {
  try {
    const { message, history, context } = req.body;

    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Field "message" is required and must be a non-empty string.' });
    }
    if (message.length > 12_000) {
      return res.status(413).json({ error: 'Message is too long. Maximum length is 12000 characters.' });
    }
    if (history !== undefined && (!Array.isArray(history) || history.length > 6 ||
      history.some((item: any) => !item || !['user', 'assistant'].includes(item.role) ||
        typeof item.content !== 'string' || item.content.length > 6000))) {
      return res.status(400).json({ error: 'History must contain at most 6 valid user/assistant messages.' });
    }
    if (context !== undefined && (!context || typeof context !== 'object' || Array.isArray(context))) {
      return res.status(400).json({ error: 'Context must be a JSON object.' });
    }

    const systemInstruction = `You are the Lead Scientific Formulator and Industrial Detergent Chemistry AI for Detergent Formula Expert.
Your knowledge covers:
- Surfactants: LABSA, SLES (1EO, 2EO, 3EO), SLS, CAPB, Glucosides (APG 0810, 1214), AOS, Amine Oxides, Quats, Fatty Alcohol Ethoxylates.
- Stoichiometric Neutralization: LABSA + NaOH (Caustic Soda flakes/lye) or TEA/KOH, strict pKa/pH calculations, buffer capacity.
- Rheology & Salt Curves: NaCl electrolyte thickening mechanism, micelle elongation, salting-out thresholds, HPMC, Carbomers, Xanthan.
- Builders & Hard Water: GLDA, MGDA, Sodium Citrate, STPP, Zeolite 4A, Ca/Mg chelation stability constants.
- Troubleshooting: Cloud point, haze, phase separation, syneresis, microbial stability, preservative efficacy.

Format answers with precise scientific rationale, step-by-step chemical advice, dosage percentages, and clear bullet points.
Support questions in English, Hindi, and Hinglish. Always maintain safety precautions for strong bases (NaOH/KOH) and acids (LABSA).`;

    let contextSnippet = '';
    if (context && typeof context === 'object') {
      contextSnippet = `\n\n[ACTIVE FORMULATION CONTEXT]\n` +
        `Formula Name: ${context.formulaName || 'Unnamed'}\n` +
        `Product Category: ${context.productCategory || 'Detergent'}\n` +
        `Batch Size: ${context.batchSizeKg || 100} kg\n` +
        `Water Hardness: ${typeof context.waterHardnessPpm === 'number' && Number.isFinite(context.waterHardnessPpm) && context.waterHardnessPpm >= 0 ? `${context.waterHardnessPpm} ppm CaCO3 (source not independently verified)` : 'UNKNOWN / NOT PROVIDED'}\n` +
        `Current Ingredients: ${JSON.stringify(context.ingredients || [], null, 2)}\n` +
        (context.warnings?.length ? `Active Warnings: ${context.warnings.join('; ')}\n` : '') +
        (context.specVerdict ? `Specification Verdict: ${context.specVerdict}\n` : '');
    }

    // Build contents array formatted for @google/genai
    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const item of history.slice(-6)) {
        contents.push({
          role: item.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: item.content }]
        });
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: `${message}${contextSnippet}` }]
    });

    if (!isApiKeyConfigured(process.env.GEMINI_API_KEY)) {
      return res.status(503).json({
        error: 'Gemini API key is not configured on the server.',
        details: 'Configure a valid GEMINI_API_KEY in the server environment to enable AI chat.'
      });
    }

    const activeModel = resolveGeminiModel();
    const response = await callWithTimeout(
      ai.models.generateContent({
        model: activeModel,
        contents,
        config: buildGeminiConfig(activeModel, {
          systemInstruction,
          temperature: 0.2,
        })
      }),
      45_000,
      'Gemini AI chat'
    );

    const reply = response.text || 'Chemical reasoning engine generated empty response.';

    return res.json({
      reply,
      modelUsed: activeModel,
      tier: 'gemini-server-side',
      timestamp: Date.now()
    });
  } catch (err: any) {
    console.error('[API /api/ai/chat] Error:', err);
    return res.status(500).json({
      error: 'Failed to process AI chat request',
      details: 'Please retry later. The server recorded diagnostic information.'
    });
  }
});

// AI formulation recommendations. Recommendations are advisory and must not be
// treated as lab-validated, regulatory-approved, or guaranteed cost/eco outcomes.
app.post(
  '/api/ai/analyze-recommend',
  authenticateUserMiddleware,
  rateLimitMiddleware({ maxRequests: 10, windowMs: 60_000, endpointName: 'Formula recommendations' }),
  express.json({ limit: '256kb' }),
  payloadSizeValidator(256 * 1024),
  async (req: Request, res: Response) => {
    try {
      const { formulaName, productType, grade, ingredients } = req.body ?? {};
      if (!Array.isArray(ingredients) || ingredients.length > 80) {
        return res.status(400).json({ error: 'ingredients must be an array with at most 80 entries.' });
      }
      for (const ingredient of ingredients) {
        if (!ingredient || typeof ingredient !== 'object' ||
          typeof ingredient.name !== 'string' || ingredient.name.length > 160 ||
          typeof ingredient.percentage !== 'number' || !Number.isFinite(ingredient.percentage) ||
          ingredient.percentage < 0 || ingredient.percentage > 100) {
          return res.status(400).json({ error: 'Each ingredient must include a name and a percentage from 0 to 100.' });
        }
      }
      const safeFormulaName = typeof formulaName === 'string' ? formulaName.slice(0, 160) : 'Unnamed formula';
      const safeProductType = typeof productType === 'string' ? productType.slice(0, 100) : 'Detergent';
      const safeGrade = typeof grade === 'string' ? grade.slice(0, 100) : 'Unspecified';
      const ingredientSummary = ingredients.map((item: any) => ({
        name: item.name.trim(),
        percentage: item.percentage,
        costPerKg: typeof item.costPerKg === 'number' && Number.isFinite(item.costPerKg) && item.costPerKg >= 0
          ? item.costPerKg : null
      }));

      if (!isApiKeyConfigured(process.env.GEMINI_API_KEY)) {
        return res.status(503).json({
          success: false,
          error: 'Gemini API key is not configured on the server.'
        });
      }

      const activeModel = resolveGeminiModel();
      const response = await callWithTimeout(
        ai.models.generateContent({
          model: activeModel,
          contents: [{
            role: 'user',
            parts: [{
              text: `Review this detergent formulation and return ONLY valid JSON in the schema {"recommendations":[{"type":"string","recommendation":"string","trigger":"string","suggestedIngredient":"string"}]}. Return 1-5 conservative suggestions, or an empty array if evidence is insufficient. Do not invent prices, measured performance, certification eligibility, safety approval, or guaranteed environmental claims. Mark suggestions as hypotheses that require compatibility review and lab testing. Do not recommend unsafe mixing steps.\n\nFormula: ${safeFormulaName}\nProduct type: ${safeProductType}\nGrade: ${safeGrade}\nIngredients: ${JSON.stringify(ingredientSummary)}`
            }]
          }],
          config: buildGeminiConfig(activeModel, { temperature: 0.2 })
        }),
        45_000,
        'Gemini formula recommendation'
      );

      const raw = response.text || '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return res.status(502).json({ success: false, error: 'The recommendation service returned an invalid response.' });
      }
      let parsed: any;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        return res.status(502).json({ success: false, error: 'The recommendation service returned invalid JSON.' });
      }
      if (!Array.isArray(parsed.recommendations) || parsed.recommendations.length > 5) {
        return res.status(502).json({ success: false, error: 'The recommendation service returned an invalid response.' });
      }
      const recommendations = parsed.recommendations
        .filter((item: any) => item && typeof item === 'object')
        .map((item: any) => ({
          type: typeof item.type === 'string' ? item.type.slice(0, 80) : 'Review',
          recommendation: typeof item.recommendation === 'string' ? item.recommendation.slice(0, 1200) : '',
          trigger: typeof item.trigger === 'string' ? item.trigger.slice(0, 500) : '',
          suggestedIngredient: typeof item.suggestedIngredient === 'string' ? item.suggestedIngredient.slice(0, 160) : ''
        }))
        .filter((item: any) => item.recommendation.length > 0);

      return res.json({
        success: true,
        recommendations,
        disclaimer: 'AI-generated hypotheses only; independently verify ingredient compatibility, cost assumptions, safety, regulatory requirements, and laboratory performance.'
      });
    } catch (err: any) {
      console.error('[API /api/ai/analyze-recommend] Error:', err);
      return res.status(500).json({ success: false, error: 'Formula recommendations could not be generated.' });
    }
  }
);

// Gemini Multimodal AI Vision Chemical Label OCR & COA Extraction Endpoint
app.post(
  '/api/ai/analyze-label',
  authenticateUserMiddleware,
  rateLimitMiddleware({ maxRequests: 8, windowMs: 60_000, endpointName: 'Label analysis' }),
  express.json({ limit: '12mb' }),
  payloadSizeValidator(12 * 1024 * 1024),
  async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', fileName } = req.body;

    if (typeof imageBase64 !== 'string' || !imageBase64.trim()) {
      return res.status(400).json({ error: 'imageBase64 string is required.' });
    }
    const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (typeof mimeType !== 'string' || !allowedMimeTypes.has(mimeType)) {
      return res.status(400).json({ error: 'mimeType must be image/jpeg, image/png, or image/webp.' });
    }
    if (fileName !== undefined && (typeof fileName !== 'string' || fileName.length > 200)) {
      return res.status(400).json({ error: 'fileName must be a string of at most 200 characters.' });
    }

    // Strip only supported image data URL headers; SVG and arbitrary MIME types are rejected.
    const cleanBase64 = imageBase64.replace(/^data:image\/(?:jpeg|png|webp);base64,/i, '');
    if (cleanBase64.length > 11 * 1024 * 1024 || !/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
      return res.status(413).json({ error: 'Image data is invalid or exceeds the allowed upload size.' });
    }

    const visionPrompt = `You are a Senior Chemical QC & Raw Materials Forensic Analytical Chemist.
Examine this photograph / document of a chemical product label, Certificate of Analysis (COA), technical data sheet, or chemical container/drum.

Extract all relevant formulation specifications with 100% industrial accuracy into JSON format matching this EXACT schema:
{
  "ingredientName": "Canonical chemical name (e.g. Linear Alkylbenzene Sulfonic Acid)",
  "tradeName": "Commercial or brand name (e.g. LABSA 96% or Texapon N70)",
  "casNumber": "Standard CAS number if visible or known for this substance (e.g. 27176-87-0)",
  "activeAssayPercentage": number (the active substance concentration/purity assay in %, e.g. 96 for LABSA, 70 for SLES, 30 for CAPB, 100 for dry salts),
  "densityGml": number or null (specific gravity or density in g/mL at 20/25C if stated),
  "pHValue": number or null (pH value or typical pH range midpoint if stated),
  "supplier": "Manufacturer or supplier name if visible or null",
  "lotNumber": "Batch or Lot number if visible or null",
  "inciName": "INCI chemical designation if applicable",
  "recommendedRole": "One of: Surfactant, Builder, Neutralizer, Chelant, Preservative, Rheology Modifier, Solvent, Fragrance, Colorant, Other",
  "hazardGHS": ["List of GHS hazard categories e.g. Corrosive, Serious Eye Damage, Acute Toxicity, Flammable, etc."],
  "confidenceScore": number from 50 to 100,
  "chemicalFormula": "Chemical formula or structural abbreviation if available",
  "storageConditions": "Recommended storage conditions or shelf life notes if visible",
  "extractedRawText": "Brief summary of key text lines detected on the packaging"
}

Output ONLY valid raw JSON with no Markdown code block ticks, no extra conversational preamble or closing notes.`;

    if (!isApiKeyConfigured(process.env.GEMINI_API_KEY)) {
      return res.status(503).json({
        success: false,
        error: 'Gemini API key is not configured on the server.'
      });
    }

    const activeModel = resolveGeminiModel();
    const response = await callWithTimeout(
      ai.models.generateContent({
        model: activeModel,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                }
              },
              {
                text: visionPrompt
              }
            ]
          }
        ],
        config: buildGeminiConfig(activeModel, {
          temperature: 0.1,
        })
      }),
      45_000,
      'Gemini label vision analysis'
    );

    const rawText = response.text || '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    let parsedData: any = null;
    try {
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[0]);
        } catch {
          parsedData = JSON.parse(rawText.replace(/```json|```/g, '').trim());
        }
      } else {
        parsedData = JSON.parse(rawText.replace(/```json|```/g, '').trim());
      }
    } catch {
      return res.status(502).json({
        success: false,
        error: 'Vision model returned an unparseable response.'
      });
    }

    if (!parsedData || typeof parsedData !== 'object' || Array.isArray(parsedData)) {
      return res.status(502).json({
        success: false,
        error: 'Vision model response did not match the expected JSON object schema.'
      });
    }

    return res.json({
      success: true,
      data: parsedData,
      modelUsed: activeModel,
      fileName: typeof fileName === 'string' ? path.basename(fileName).replace(/[\r\n]/g, '').slice(0, 200) : 'label_scan.jpg',
      extractedAt: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('[API /api/ai/analyze-label] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Vision OCR extraction failed',
      details: 'Please retry later. The server recorded diagnostic information.'
    });
  }
});

// Gemini Web-Grounded Chemical & Raw Material Research Endpoint
app.post(
  '/api/ai/research-ingredient',
  authenticateUserMiddleware,
  rateLimitMiddleware({ maxRequests: 10, windowMs: 60_000, endpointName: 'Ingredient research' }),
  express.json({ limit: '256kb' }),
  payloadSizeValidator(256 * 1024),
  async (req: Request, res: Response) => {
  try {
    const { nameOrAlias, grade, jurisdiction } = req.body;

    if (typeof nameOrAlias !== 'string' || !nameOrAlias.trim()) {
      return res.status(400).json({ error: 'Field "nameOrAlias" is required and must be a non-empty string.' });
    }
    if (nameOrAlias.length > 200 ||
      (grade !== undefined && (typeof grade !== 'string' || grade.length > 120)) ||
      (jurisdiction !== undefined && (typeof jurisdiction !== 'string' || jurisdiction.length > 100))) {
      return res.status(400).json({ error: 'Ingredient name, grade, or jurisdiction exceeds the allowed length.' });
    }

    const cleanName = nameOrAlias.replace(/[\r\n\t]+/g, ' ').trim();
    const cleanGrade = (typeof grade === 'string') ? grade.replace(/[\r\n\t]+/g, ' ').trim() : '';
    const cleanJurisdiction = (typeof jurisdiction === 'string' && jurisdiction.trim())
      ? jurisdiction.replace(/[\r\n\t]+/g, ' ').trim()
      : 'Global';

    // Server-side database-first guard: never invoke Gemini for a canonical
    // ingredient or an explicitly declared alias already in the master library.
    const localResolution = resolveUniversalIngredientIdentity(cleanName);
    if (localResolution?.ingredient) {
      return res.json({
        success: true,
        localMatch: true,
        requiresUserApproval: false,
        gradeCompatible: localResolution.gradeCompatible,
        ingredient: localResolution.ingredient,
        message: localResolution.gradeCompatible
          ? 'Ingredient already exists in the local database. Gemini research was skipped.'
          : 'Ingredient identity exists locally, but commercial grade needs review. Gemini research was skipped.'
      });
    }

    if (!isApiKeyConfigured(process.env.GEMINI_API_KEY)) {
      return res.status(503).json({
        success: false,
        status: 'GEMINI_NOT_CONFIGURED',
        code: 'GEMINI_API_KEY_MISSING',
        requiresUserApproval: true,
        error: 'Gemini API key is not configured on the server. Add GEMINI_API_KEY to the server environment, then retry internet research.',
        details: 'Known catalog ingredients continue to resolve locally. No source-free Gemini output or guessed chemical properties will be saved.'
      });
    }

    const systemInstruction = `You are a Senior Detergent R&D Chemist, Industrial Formulator, and Chemical Specification Specialist.
Your mission is to perform rigorous research on chemical raw materials, commercial surfactants, builders, chelators, and additives used in cleaning, cosmetics, and industrial detergents.
Find authentic Technical Data Sheets (TDS), Safety Data Sheets (SDS), manufacturer specifications (e.g., BASF, Stepan, Clariant, Galaxy Surfactants, Solvay, Evonik, Croda, Nouryon, Dow), or official chemical registries (PubChem, ECHA, CosIng).
Extract precise formulation parameters without hallucinations or guesses. If a parameter is not stated or unknown, report it as null.`;

    const researchPrompt = `Conduct exhaustive technical research on raw material: "${cleanName}"${cleanGrade ? ` (Grade: "${cleanGrade}")` : ''}.
Jurisdiction focus: ${cleanJurisdiction}.

Extract these industrial formulation specifications:
1. Canonical chemical name & Trade/commercial name
2. CAS Registry Number & INCI designation
3. Active Matter Assay % (purity/concentration in %, e.g., 70 for SLES 70%, 96 for LABSA, 30 for CAPB, 100 for anhydrous dry powders)
4. Density / Specific Gravity in g/cm³ or g/mL (at 20-25°C)
5. pH value (as supplied or in 1% / 10% solution) and typical pH operating range (e.g., "6.5 - 7.5")
6. HLB value (if surfactant, Griffin scale 0-20; null if not applicable)
7. Category: 'Anionic Surfactant' | 'Nonionic Surfactant' | 'Amphoteric Surfactant' | 'Cationic Surfactant' | 'Builder' | 'Chelating Agent' | 'Neutralizer' | 'Rheology Modifier' | 'Preservative' | 'Solvent' | 'Enzyme' | 'Fragrance' | 'Colorant' | 'Additive'
8. Ionic Nature: 'Anionic' | 'Nonionic' | 'Amphoteric' | 'Cationic' | 'Neutral' | 'Inert'
9. Primary Function & Description (1-2 sentences on detergent and industrial utility)
10. Solid non-volatile content % (Total Solids / NVR)
11. Up to 3 reputable source references (Title, Publisher, URL if available, and Source Type like 'MANUFACTURER_TDS', 'MANUFACTURER_SDS', 'CHEMICAL_REGISTRY', or 'TECHNICAL_REFERENCE').

Format your response strictly as a single JSON object conforming to this schema:
{
  "ingredientId": "slug-id",
  "canonicalName": "Canonical chemical name",
  "resolvedName": "Standardized trade or chemical name",
  "tradeName": "Commercial product name",
  "confidence": "EXACT_MATCH" | "HIGH_CONFIDENCE_MATCH" | "POSSIBLE_MATCH",
  "parameters": {
    "activeMatter": number,
    "density": number or null,
    "pH": number or null,
    "pHRange": "min-max" or null,
    "hlb": number or null,
    "ionicNature": string,
    "application": string,
    "nvr": number or null,
    "casNumber": string,
    "inciName": string,
    "category": string
  },
  "sources": [
    {
      "sourceId": "string",
      "title": "string",
      "publisher": "string",
      "url": "string or null",
      "domain": "string",
      "sourceType": "MANUFACTURER_TDS" | "SUPPLIER_TDS" | "TECHNICAL_REFERENCE" | "REGULATORY_DOCUMENT"
    }
  ],
  "provenance": {
    "activeMatter": { "value": number, "source": "string", "sourceUrl": "string", "status": "VERIFIED" },
    "pH": { "value": number, "source": "string", "sourceUrl": "string", "status": "VERIFIED" }
  },
  "requiresUserApproval": false,
  "summary": "1 sentence scientific overview"
}

Output valid JSON only with NO markdown fences, no conversational text.`;

    let responseText = '';
    let groundingChunks: any[] = [];
    let researchModelUsed = resolveGeminiModel(process.env.GEMINI_RESEARCH_MODEL);
    const fallbackResearchModel = 'gemini-3.1-flash-lite';

    // Primary live research model with Google Search grounding.
    try {
      const response = await callWithTimeout(
        ai.models.generateContent({
          model: researchModelUsed,
          contents: [{ role: 'user', parts: [{ text: researchPrompt }] }],
          config: buildGeminiConfig(researchModelUsed, {
            systemInstruction,
            temperature: 0.1,
            tools: [{ googleSearch: {} }]
          })
        }),
        60000,
        `${researchModelUsed} Google Search`
      );
      responseText = response.text || '';
      groundingChunks = (response.candidates?.[0] as any)?.groundingMetadata?.groundingChunks || [];
    } catch (searchErr: any) {
      const errorText = String(searchErr?.message || searchErr || 'Unknown Google Search grounding error');
      const status = Number(searchErr?.status || searchErr?.statusCode || 0);
      const quotaOrBilling = status === 429 ||
        /RESOURCE_EXHAUSTED|quota|billing|free.?tier|grounding.*not available|rate.?limit|PERMISSION_DENIED|not enabled/i.test(errorText);
      const timedOut = /timed out|timeout/i.test(errorText);
      console.error(`[Research] ${researchModelUsed} Google Search grounding failed:`, errorText);

      // Bounded, evidence-only fallback to gemini-3.1-flash-lite with Search grounding.
      // Never falls back to ungrounded text generation.
      if (quotaOrBilling && researchModelUsed !== fallbackResearchModel) {
        try {
          const fallbackResponse = await callWithTimeout(
            ai.models.generateContent({
              model: fallbackResearchModel,
              contents: [{ role: 'user', parts: [{ text: researchPrompt }] }],
              config: buildGeminiConfig(fallbackResearchModel, {
                systemInstruction,
                temperature: 0.1,
                tools: [{ googleSearch: {} }]
              })
            }),
            45000,
            `${fallbackResearchModel} Google Search fallback`
          );
          const fallbackChunks = (fallbackResponse.candidates?.[0] as any)?.groundingMetadata?.groundingChunks || [];
          if (!Array.isArray(fallbackChunks) || fallbackChunks.length === 0) {
            throw new Error(`${fallbackResearchModel} returned no Google Search grounding references.`);
          }
          researchModelUsed = fallbackResearchModel;
          responseText = fallbackResponse.text || '';
          groundingChunks = fallbackChunks;
        } catch (fallbackErr: any) {
          console.error(`[Research] ${fallbackResearchModel} Search fallback failed:`, fallbackErr?.message || fallbackErr);
          return res.status(429).json({
            success: false,
            status: 'SEARCH_GROUNDING_QUOTA_OR_BILLING',
            code: 'GOOGLE_SEARCH_GROUNDING_UNAVAILABLE',
            requiresUserApproval: true,
            error: 'Gemini internet research is blocked for this API project due to Search grounding quota/permissions.',
            details: 'Both search-grounded attempts required real Google Search grounding. No direct-only Gemini answer, fabricated citation, or guessed chemical property was accepted.'
          });
        }
      } else {
        return res.status(timedOut ? 504 : 502).json({
          success: false,
          status: timedOut ? 'SEARCH_GROUNDING_TIMEOUT' : 'SEARCH_GROUNDING_FAILED',
          code: timedOut ? 'GOOGLE_SEARCH_GROUNDING_TIMEOUT' : 'GOOGLE_SEARCH_GROUNDING_ERROR',
          requiresUserApproval: true,
          error: timedOut
            ? 'Google Search grounding did not respond within 45 seconds. Retry the research request.'
            : 'Google Search grounding failed. Check the Gemini API key, project permissions, model access, and server logs.',
          details: 'Direct Gemini text generation is deliberately not accepted as internet research. No source-free or guessed chemical properties were saved.'
        });
      }
    }

    let parsed: any = {};
    if (responseText) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          try {
            parsed = JSON.parse(responseText.replace(/```json|```/g, '').trim());
          } catch {}
        }
      } else {
        try {
          parsed = JSON.parse(responseText.replace(/```json|```/g, '').trim());
        } catch {}
      }
    }

    // No heuristic fallback is allowed here. Unknown ingredients must be
    // supported by actual Google Search grounding; AI-only guesses are not
    // chemical specifications and must never be promoted into the database.
    if (!responseText || !parsed || !parsed.canonicalName ||
      !parsed.parameters || typeof parsed.parameters !== 'object' || Array.isArray(parsed.parameters) ||
      !Array.isArray(groundingChunks) || groundingChunks.length === 0) {
      return res.status(422).json({
        success: false,
        status: 'INSUFFICIENT_EVIDENCE',
        requiresUserApproval: true,
        error: 'No grounded source evidence was retrieved. No estimated/default chemical properties were generated or saved.'
      });
    }

    parsed.researchModelUsed = researchModelUsed;

    // Ensure fallback fields and proper slug
    const slug = (parsed.canonicalName || cleanName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'researched-chem';
    parsed.ingredientId = parsed.ingredientId || `custom-${slug}`;
    parsed.resolvedName = parsed.resolvedName || cleanName;
    parsed.canonicalName = parsed.canonicalName || cleanName;
    parsed.confidence = parsed.confidence || 'HIGH_CONFIDENCE_MATCH';
    parsed.parameters = parsed.parameters || {};

    const groundedSources = groundingChunks.map((chunk: any, idx: number) => {
      const uri = typeof chunk.web?.uri === 'string' ? chunk.web.uri : '';
      let domain = '';
      try {
        const parsedUrl = new URL(uri);
        if (parsedUrl.protocol !== 'https:') return null;
        domain = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
      } catch {
        return null;
      }
      return {
        sourceId: 'google-grounding-' + (idx + 1),
        title: typeof chunk.web?.title === 'string' ? chunk.web.title : 'Google Search grounded page',
        publisher: domain,
        url: uri,
        domain,
        sourceType: 'TECHNICAL_REFERENCE'
      };
    }).filter(Boolean);

    if (groundedSources.length === 0) {
      return res.status(422).json({
        success: false,
        status: 'INSUFFICIENT_EVIDENCE',
        requiresUserApproval: true,
        error: 'Search returned no valid HTTPS source references. No ingredient profile was saved.'
      });
    }

    // Model-extracted values remain candidate data until a human checks the
    // original manufacturer TDS/COA. Never trust the model's self-declared
    // VERIFIED flag or requiresUserApproval=false.
    parsed.sources = groundedSources;
    parsed.requiresUserApproval = true;
    parsed.status = 'NEEDS_VERIFICATION';
    parsed.provenance = {
      activeMatter: {
        value: parsed.parameters.activeMatter ?? null,
        source: 'Gemini extraction; original document requires human verification',
        sourceUrl: '',
        status: 'AI_SUMMARY'
      },
      pH: {
        value: parsed.parameters.pH ?? null,
        source: 'Gemini extraction; original document requires human verification',
        sourceUrl: '',
        status: 'AI_SUMMARY'
      }
    };

    return res.json(parsed);
  } catch (err: any) {
    console.error('[API /api/ai/research-ingredient] Error:', err);
    return res.status(500).json({
      error: 'Chemical research engine encountered an error',
      details: 'Please retry later. The server recorded diagnostic information.'
    });
  }
});

// Apply verified ingredient to canonical memory
app.post(
  '/api/ai/apply-verified-ingredient',
  authenticateUserMiddleware,
  rateLimitMiddleware({ maxRequests: 20, windowMs: 60_000, endpointName: 'Apply researched ingredient' }),
  express.json({ limit: '256kb' }),
  payloadSizeValidator(256 * 1024),
  async (req: Request, res: Response) => {
  try {
    const { researchResult, previousRecord } = req.body;
    if (!researchResult || typeof researchResult !== 'object' ||
      typeof researchResult.ingredientId !== 'string' ||
      !/^[A-Za-z0-9._:-]{1,120}$/.test(researchResult.ingredientId)) {
      return res.status(400).json({ error: 'Valid researchResult with a safe ingredientId is required.' });
    }
    if (previousRecord !== undefined && (!previousRecord || typeof previousRecord !== 'object' || Array.isArray(previousRecord))) {
      return res.status(400).json({ error: 'previousRecord must be an object when provided.' });
    }

    const { ingredientId, canonicalName, resolvedName, parameters, provenance } = researchResult;
    if (researchResult.requiresUserApproval !== false) {
      return res.status(409).json({
        error: 'Research candidate is not verified. Human review of the original manufacturer TDS/COA is required before saving it to the ingredient database.'
      });
    }
    if (parameters !== undefined && (!parameters || typeof parameters !== 'object' || Array.isArray(parameters))) {
      return res.status(400).json({ error: 'researchResult.parameters must be an object.' });
    }
    const nameCandidate = typeof canonicalName === 'string' ? canonicalName :
      (typeof resolvedName === 'string' ? resolvedName : ingredientId);
    const name = nameCandidate.trim().slice(0, 200) || ingredientId;

    const activeInput = parameters?.activeMatter;
    const densityInput = parameters?.density;
    const phInput = parameters?.pH;
    const hlbInput = parameters?.hlb;
    if (activeInput !== undefined && activeInput !== null && (typeof activeInput !== 'number' || !Number.isFinite(activeInput) || activeInput < 0 || activeInput > 100)) {
      return res.status(400).json({ error: 'activeMatter must be a number between 0 and 100.' });
    }
    if (densityInput !== undefined && densityInput !== null && (typeof densityInput !== 'number' || !Number.isFinite(densityInput) || densityInput <= 0 || densityInput > 30)) {
      return res.status(400).json({ error: 'density must be a finite number greater than 0 and at most 30.' });
    }
    if (phInput !== undefined && phInput !== null && (typeof phInput !== 'number' || !Number.isFinite(phInput) || phInput < 0 || phInput > 14)) {
      return res.status(400).json({ error: 'pH must be a number between 0 and 14.' });
    }
    if (hlbInput !== undefined && hlbInput !== null && (typeof hlbInput !== 'number' || !Number.isFinite(hlbInput) || hlbInput < 0 || hlbInput > 40)) {
      return res.status(400).json({ error: 'HLB must be a number between 0 and 40.' });
    }

    // Preserve missing measurements as null rather than substituting 0%, 1.0 g/mL, or pH 7.0.
    const detectedActive = typeof activeInput === 'number' ? activeInput : null;
    const detectedDensity = typeof densityInput === 'number' ? densityInput : null;
    const detectedPhMin = typeof phInput === 'number' ? phInput : null;
    const phRangeEnd = typeof parameters?.pHRange === 'string' ? Number(parameters.pHRange.split('-')[1]) : NaN;
    const detectedPhMax = detectedPhMin !== null
      ? (Number.isFinite(phRangeEnd) && phRangeEnd >= detectedPhMin && phRangeEnd <= 14 ? phRangeEnd : detectedPhMin)
      : null;
    const detectedHlb = typeof hlbInput === 'number' ? hlbInput : null;

    const updatedIngredient = {
      id: ingredientId,
      name,
      productName: name,
      category: parameters?.category || (parameters?.ionicNature ? `Surfactant (${parameters.ionicNature})` : 'Specialty Chemical / Additive'),
      subCategory: 'Researched Raw Material',
      casNumber: parameters?.casNumber || previousRecord?.casNumber || 'N/A',
      inciName: parameters?.inciName || name,
      function: parameters?.application || 'Functional Detergent Additive',
      activeDefault: detectedActive,
      activeMatterPct: detectedActive,
      activePercent: detectedActive,
      costPerKg: previousRecord?.costPerKg !== undefined ? previousRecord.costPerKg : null,
      density: detectedDensity,
      hlb: detectedHlb,
      hlbValue: detectedHlb,
      phMin: detectedPhMin,
      phMax: detectedPhMax,
      description: `Researched technical raw material: ${name} (Active: ${detectedActive !== null ? `${detectedActive}%` : 'Unverified'})`,
      isCustom: true,
      provenance: {
        sourceType: 'AI_RESEARCH_PENDING_REVIEW',
        source: typeof provenance?.activeMatter?.source === 'string' ? provenance.activeMatter.source.slice(0, 300) : 'AI-assisted research',
        sourceUrl: (() => {
          try {
            const url = new URL(String(provenance?.activeMatter?.sourceUrl || ''));
            return ['https:', 'http:'].includes(url.protocol) ? url.toString() : '';
          } catch { return ''; }
        })(),
        verificationStatus: 'UNVERIFIED',
        verifiedAt: null,
        notes: 'AI-extracted candidate values. Independently compare against the original manufacturer TDS/COA before treating any field as verified.'
      }
    };

    return res.json({
      success: true,
      updatedIngredient,
      timestamp: Date.now()
    });
  } catch (err: any) {
    console.error('[API /api/ai/apply-verified-ingredient] Error:', err);
    return res.status(500).json({
      error: 'Failed to apply verified ingredient',
      details: 'Please retry later. The server recorded diagnostic information.'
    });
  }
});

// Normalize request parser errors so oversized/malformed requests get a small JSON response.
app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  if (err?.type === 'entity.too.large' || err?.status === 413) {
    res.status(413).json({ error: 'Request payload is too large.' });
    return;
  }
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Request body must contain valid JSON.' });
    return;
  }
  console.error('[API request middleware] Request processing failed:', err);
  res.status(500).json({ error: 'Request could not be processed.' });
});

// Google Play subscription verification. Identity comes only from the verified
// bearer token; client-supplied userId/packageName is never trusted for entitlement binding.
app.post(
  '/api/billing/verify-purchase',
  authenticateUserMiddleware,
  rateLimitMiddleware({ maxRequests: 10, windowMs: 60_000, endpointName: 'Purchase verification' }),
  express.json({ limit: '64kb' }),
  payloadSizeValidator(64 * 1024),
  async (req: Request, res: Response) => {
    try {
      const { productId, purchaseToken } = req.body ?? {};
      const user = (req as any).user;
      if (typeof productId !== 'string' || productId.length > 160 ||
          typeof purchaseToken !== 'string' || purchaseToken.length < 10 || purchaseToken.length > 8192) {
        return res.status(400).json({ verified: false, entitlementGranted: false, error: 'Valid productId and purchaseToken are required.' });
      }
      if (!user?.uid || user.uid === 'anonymous_client') {
        return res.status(401).json({ verified: false, entitlementGranted: false, error: 'A verified account is required.' });
      }

      const result = await verifyGooglePlayPurchase({
        packageName: CANONICAL_PACKAGE_NAME,
        productId,
        purchaseToken,
        userId: user.uid
      });

      if (!result.verified) {
        console.warn('[API /api/billing/verify-purchase] Purchase verification denied:', result.status);
        return res.status(403).json({
          verified: false,
          entitlementGranted: false,
          status: result.status,
          error: 'Purchase could not be verified. No paid entitlement was granted.'
        });
      }

      return res.json({
        verified: true,
        entitlementGranted: true,
        status: result.status,
        productId: result.productId
      });
    } catch (err: any) {
      console.error('[API /api/billing/verify-purchase] Verification error:', err);
      return res.status(500).json({
        verified: false,
        entitlementGranted: false,
        error: 'Purchase verification is temporarily unavailable.'
      });
    }
  }
);

// Account deletion is intentionally fail-closed until provider-aware deletion and
// owned-data retention/cascade rules are configured. Never report success without deletion.
app.delete(
  '/api/account',
  authenticateUserMiddleware,
  rateLimitMiddleware({ maxRequests: 3, windowMs: 60_000, endpointName: 'Account deletion' }),
  (_req: Request, res: Response) => {
    return res.status(501).json({
      success: false,
      error: 'Account deletion is not configured on this backend. No account or user data was deleted.'
    });
  }
);

// Admin Console System & Governance Overview Endpoint
app.get(
  '/api/admin/overview',
  authenticateUserMiddleware,
  requireAdminMiddleware,
  rateLimitMiddleware({ maxRequests: 30, windowMs: 60_000, endpointName: 'Admin overview' }),
  (req: Request, res: Response) => {
    const adminUser = (req as any).user;
    res.json({
      status: 'ok',
      service: 'Formula Expert Forensic R&D Backend',
      authorizedAdmin: adminUser?.email || adminUser?.uid || null,
      geminiConfigured: isApiKeyConfigured(process.env.GEMINI_API_KEY),
      geminiModel: resolveGeminiModel(),
      governance: {
        phase5: 'LOCKED (Awaiting Certified Physical Lab Sign-Off)',
        truthfulAiPolicy: 'STRICT_NO_FABRICATED_DATA'
      },
      timestamp: new Date().toISOString()
    });
  }
);

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, ws: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Express 5 uses path-to-regexp v8, where a bare '*' path throws
    // "Missing parameter name at index 1" at registration time and crashes the
    // production boot. Use a path-less fallback middleware instead so the SPA
    // history fallback never touches the router parser.
    app.use((req: Request, res: Response) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.status(404).json({ error: 'Not found.' });
        return;
      }
      if (req.path === '/api' || req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'Unknown API endpoint.' });
        return;
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  let attempts = 0;
  const maxRetries = 15;
  const delayMs = 800;

  function tryListen() {
    attempts++;
    const server = app.listen(PORT, HOST, () => {
      console.log(`[FormulaExpert] Server running on http://${HOST}:${PORT} (mode: ${isProd ? 'production' : 'development'})`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE' && attempts < maxRetries) {
        console.warn(`[FormulaExpert] Port ${PORT} is in use (attempt ${attempts}/${maxRetries}), retrying in ${delayMs}ms...`);
        try { server.close(); } catch {}
        setTimeout(tryListen, delayMs);
      } else {
        console.error('[FormulaExpert] Server error:', err);
      }
    });
  }

  tryListen();
}

startServer().catch((err) => {
  console.error('[FormulaExpert] Failed to start server:', err);
  process.exit(1);
});
