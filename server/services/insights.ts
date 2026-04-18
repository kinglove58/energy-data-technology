import { logError } from "@/lib/logger";
import { env } from "@/config/env";
import type { Insight, InsightInput } from "@/types/ai";
import { getGenAIClient } from "../clients/genai";

const fallbackInsights: Insight[] = [
  {
    type: "Alert",
    text: "15% drop in billing efficiency detected in North District over last 48h.",
    action: "View",
  },
  {
    type: "Anomaly",
    text: "Transformer T-409 load mismatch suggests meter bypass.",
    action: "Investigate",
  },
  {
    type: "Trend",
    text: "Recovery trend in South Zone exceeds forecast by 8%.",
    action: null,
  },
];

export async function getInsights(input?: InsightInput): Promise<Insight[]> {
  if (!("GEMINI_API_KEY" in env) || !env.GEMINI_API_KEY) {
    return fallbackInsights;
  }

  try {
    const ai = getGenAIClient();
    const metrics = input?.metrics ?? {};
    const prompt = `
      You are an AI Revenue Assurance Analyst.
      Use the supplied operational metrics to generate concise, prescriptive insights.
      Metrics (JSON): ${JSON.stringify(metrics)}
      Produce 3-4 bullet insights focused on:
      - Loss/Gain balance (energy supplied vs billed)
      - Theft exposure and risk locations
      - Recovery opportunities and next best action
      - Preventative advice (brief)
      Each insight must be an object: { "type": "Alert" | "Anomaly" | "Trend", "text": "<15 words actionable insight>", "action": "<3-4 word recommended action or null>" }
      Respond with JSON array only.
    `;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    if (response.text) {
      return JSON.parse(response.text) as Insight[];
    }
  } catch (error) {
    logError("getInsights", error);
  }

  return fallbackInsights;
}
