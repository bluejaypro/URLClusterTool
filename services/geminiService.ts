
import { GoogleGenAI, Type } from "@google/genai";
import { SemanticMap } from "../types";

// Note: process.env.API_KEY is pre-configured in this environment.
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * SEO_ARCHITECT_SYSTEM_PROMPT
 * The core system instruction for the semantic mapping phase.
 * Documentation: See SYSTEM_BEHAVIOR.md
 */
const SEO_ARCHITECT_SYSTEM_PROMPT = `
You are an expert SEO Architect specializing in high-conversion site structures and semantic mapping.

CRITICAL RULES:
1. Perform semantic analysis first.
2. Isolate intents: 
   - Commercial (Main service categories/landing pages).
   - Transactional (Action-oriented sub-pages for EVERY service). 
     MANDATORY: Include high-intent nodes like "Book Inspection", "Request Quote", "Schedule Service", "Emergency [Service]", or "Pricing/Estimates".
   - Informational (Topic clusters, blogs, and guides that support the commercial layers).
3. Transactional conversion nodes MUST be nested under or directly related to their parent services.
4. Informational content MUST support specific services and NOT compete for the same commercial keywords.
5. Define nuanced relationships using these types:
   - 'parent': Direct hierarchical connection (e.g., Service -> Detail Page).
   - 'supports': Informational content helping rank a service.
   - 'relates': General semantic connection.
   - 'includes': A feature or component that is part of a larger service offering.
   - 'alternative': A similar service suited for different budgets, scales, or specific contexts.
   - 'complementary': Services that are frequently paired or represent cross-sell opportunities.
6. No URLs. No ASCII trees. No explanations.
7. Return ONLY valid JSON matching the schema.
`.trim();

/**
 * Validates niche/ambiguous terms using Search Grounding (Gemini 3 Flash)
 */
export async function validateTaxonomy(serviceDomain: string): Promise<string> {
  const ai = getAIClient();
  const prompt = `Research and validate the standard SEO taxonomy and service hierarchy for "${serviceDomain}". 
  Identify the core parent services, typical sub-services, and common user intents (buying vs researching). 
  Return a concise summary of facts only. No fluff.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return response.text || "";
  } catch (error) {
    console.error("Taxonomy validation failed:", error);
    return "";
  }
}

/**
 * Generates the semantic map using complex reasoning (Gemini 3 Pro with Thinking)
 * Equivalent to POST /api/architecture/debug
 */
export async function generateSemanticMap(
  businessName: string, 
  serviceDomain: string, 
  region?: string,
  taxonomyHints?: string
): Promise<SemanticMap> {
  const ai = getAIClient();
  
  const userPrompt = `Generate a conversion-optimized SEO semantic map for:
  Business: ${businessName}
  Domain: ${serviceDomain}
  ${region ? `Region: ${region}` : ''}
  ${taxonomyHints ? `Search-Validated Taxonomy Hints: ${taxonomyHints}` : ''}
  
  Ensure every service has transactional conversion nodes and utilize nuanced relationships.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: userPrompt,
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      systemInstruction: SEO_ARCHITECT_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          entities: { type: Type.ARRAY, items: { type: Type.STRING } },
          services: { type: Type.ARRAY, items: { type: Type.STRING } },
          intentLayers: {
            type: Type.OBJECT,
            properties: {
              commercial: { type: Type.ARRAY, items: { type: Type.STRING } },
              transactional: { type: Type.ARRAY, items: { type: Type.STRING } },
              informational: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["commercial", "transactional", "informational"]
          },
          relationships: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                from: { type: Type.STRING },
                to: { type: Type.STRING },
                type: { 
                  type: Type.STRING, 
                  description: 'One of: parent, supports, relates, includes, alternative, complementary' 
                },
              },
              required: ["from", "to", "type"]
            }
          }
        },
        required: ["entities", "services", "intentLayers", "relationships"]
      },
    },
  });

  const text = response.text || "{}";
  return JSON.parse(text);
}

/**
 * Renders an ASCII tree deterministically from a Semantic Map (Gemini 3 Flash)
 */
export async function renderAsciiTree(semanticMap: SemanticMap, businessName: string): Promise<string> {
  const ai = getAIClient();
  const prompt = `
    Based on this Semantic Map for ${businessName}, generate a high-quality ASCII tree sitemap.
    Use standard characters: │, ├──, └──.
    
    MANDATORY STRUCTURE:
    Home (Root)
    ├── Services (Commercial Layer)
    │   ├── [Service Category Name]
    │   │   ├── [Service Detail Page]
    │   │   └── [Transactional Action Nodes: e.g., Book Inspection, Request Quote, Pricing]
    └── Blog & Resources (Informational Layer)
        └── [Intent-Cluster Topics supporting specific services]
        
    Ensure that commercial conversion points (Quotes, Bookings, Inspections) are highly visible in the tree under their respective services. Use the nuanced relationships (includes, alternative, complementary) to organize sub-nodes intelligently.
        
    MAP DATA:
    ${JSON.stringify(semanticMap)}
    
    Output ONLY the ASCII tree. No text before or after.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  return response.text || "Error generating tree";
}
