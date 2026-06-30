import { logError } from "@/lib/logger";
import { env } from "@/config/env";
import type { Insight, InsightInput } from "@/types/ai";
import { getGenAIClient } from "../clients/genai";

function formatMoney(value: number) {
  if (!Number.isFinite(value)) return "$0";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
}

function buildFallbackInsights(input?: InsightInput): Insight[] {
  const metrics = input?.metrics ?? {};
  const supplied = metrics.energySuppliedMWh ?? 0;
  const billed = metrics.energyBilledMWh ?? 0;
  const lossMWh = Math.max(supplied - billed, 0);
  const lossRate = supplied > 0 ? (lossMWh / supplied) * 100 : 0;
  const theftCases = metrics.theftCases ?? 0;
  const exposure = formatMoney(metrics.revenueLossUSD ?? 0);

  return [
    {
      type: theftCases > 0 ? "Alert" : "Trend",
      text:
        theftCases > 0
          ? `${theftCases.toLocaleString()} bypass flags need field validation in the latest batch.`
          : "No bypass flags are present in the latest batch.",
      action: theftCases > 0 ? "Dispatch field review" : "Keep monitoring",
    },
    {
      type: "Trend",
      text: `Latest loss is ${lossMWh.toFixed(2)} MWh, about ${lossRate.toFixed(1)}% of supplied energy.`,
      action: "Review loss ranking",
    },
    {
      type: "Anomaly",
      text: `Estimated revenue exposure is ${exposure} for the current analysis window.`,
      action: "Export executive report",
    },
  ];
}

export async function getInsights(input?: InsightInput): Promise<Insight[]> {
  if (!("GEMINI_API_KEY" in env) || !env.GEMINI_API_KEY) {
    return buildFallbackInsights(input);
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

  return buildFallbackInsights(input);
}
