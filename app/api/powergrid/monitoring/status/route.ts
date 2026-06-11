import { proxyPowergridRequest } from "@/lib/powergridProxy";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const includeDrift = url.searchParams.get("include_drift") ?? "false";

  return proxyPowergridRequest(
    `/monitoring/status?include_drift=${encodeURIComponent(includeDrift)}`,
    undefined,
    {
      successMessage: "Powergrid monitoring status loaded.",
      timeoutMs: includeDrift === "true" ? 45_000 : 20_000,
    }
  );
}
