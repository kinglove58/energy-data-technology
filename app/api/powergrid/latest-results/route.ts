import { NextResponse } from "next/server";

const DEFAULT_POWERGRID_API_BASE_URL = "http://localhost:8000";
const POWERGRID_REQUEST_TIMEOUT_MS = 12_000;

function getPowergridApiBaseUrl() {
  return (
    process.env.POWERGRID_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    DEFAULT_POWERGRID_API_BASE_URL
  ).replace(/\/+$/, "");
}

async function parseResponseBody(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function GET() {
  const endpoint = `${getPowergridApiBaseUrl()}/analysis/live/results/latest`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), POWERGRID_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });
    const body = await parseResponseBody(response);

    if (!response.ok) {
      const message =
        typeof body === "object" && body && "detail" in body
          ? String(body.detail)
          : `Powergrid API returned ${response.status}`;

      return NextResponse.json(
        {
          success: false,
          data: null,
          message,
          errors: body,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: body,
      message: "Latest grouped-analysis results loaded.",
    });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? `Timed out after ${POWERGRID_REQUEST_TIMEOUT_MS / 1000}s waiting for the Powergrid API.`
        : error instanceof Error
          ? error.message
          : "Unable to reach the Powergrid API.";

    return NextResponse.json(
      {
        success: false,
        data: null,
        message,
      },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
