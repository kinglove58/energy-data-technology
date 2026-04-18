import { logError } from "@/lib/logger";
import { env } from "@/config/env";
import type { ReportRequest, ReportResponse } from "@/types/ai";
import { getGenAIClient } from "../clients/genai";

export async function generateExecutiveReport(
  input: ReportRequest
): Promise<ReportResponse> {
  const defaultReport: ReportResponse = {
    generatedAt: new Date().toISOString(),
    markdown: `# Executive Revenue Report

**Period:** ${input.period}

## Summary
- Energy Supplied: ${input.metrics.supplied ?? "N/A"} GWh
- Energy Billed: ${input.metrics.billed ?? "N/A"} GWh
- Theft Cases: ${input.metrics.theftCases ?? "N/A"}
- Recovery: $${input.metrics.recovery ?? "N/A"}M

## Recommendations
- Increase field inspections in high-loss feeders.
- Prioritize smart meter audits for critical transformers.
- Accelerate recovery actions on confirmed theft cases.`,
  };

  if (!env.GEMINI_API_KEY) {
    return defaultReport;
  }

  try {
    const ai = getGenAIClient();
    const prompt = `
      Generate a concise markdown executive report for power utility revenue assurance.
      Use the following metrics: ${JSON.stringify(input.metrics)} and period ${
      input.period
    }.
      Sections: Executive Summary, Critical Anomalies, Financial Impact, Recommendations (3 bullets).
    `;
    const response = await ai.models.generateContent({
      model: "gemini-2-5-flash",
      contents: prompt,
    });

    if (response.text) {
      return {
        generatedAt: new Date().toISOString(),
        markdown: response.text,
      };
    }
  } catch (error) {
    logError("generateExecutiveReport", error);
  }

  return defaultReport;
}
