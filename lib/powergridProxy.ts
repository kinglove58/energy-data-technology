import { NextResponse } from "next/server";

const DEFAULT_POWERGRID_API_BASE_URL = "http://localhost:8000";
const DEFAULT_TIMEOUT_MS = 30_000;

export function getPowergridApiBaseUrl() {
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

export async function proxyPowergridRequest(
  path: string,
  init: RequestInit = {},
  options: { successMessage?: string; timeoutMs?: number } = {}
) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  );

  try {
    const endpoint = `${getPowergridApiBaseUrl()}${path}`;
    const response = await fetch(endpoint, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
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
      message: options.successMessage ?? "Powergrid API request completed.",
    });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? `Timed out after ${(options.timeoutMs ?? DEFAULT_TIMEOUT_MS) / 1000}s waiting for the Powergrid API.`
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
