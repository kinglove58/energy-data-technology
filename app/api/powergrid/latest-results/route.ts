import { NextResponse } from "next/server";
import {
  POWERGRID_PREVIEW_MESSAGE,
  POWERGRID_PREVIEW_RESULTS,
} from "@/lib/powergridPreviewData";
import { proxyPowergridRequest } from "@/lib/powergridProxy";

export async function GET() {
  const response = await proxyPowergridRequest("/analysis/live/results/latest", undefined, {
    successMessage: "Latest grouped-analysis results loaded.",
    timeoutMs: 8_000,
  });

  if (response.ok) {
    return response;
  }

  return NextResponse.json({
    success: true,
    data: POWERGRID_PREVIEW_RESULTS,
    message: POWERGRID_PREVIEW_MESSAGE,
  });
}
