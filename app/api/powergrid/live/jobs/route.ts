import { proxyPowergridRequest } from "@/lib/powergridProxy";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));

  return proxyPowergridRequest(
    "/analysis/live/jobs",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    {
      successMessage: "Live grouped-analysis job submitted.",
      timeoutMs: 30_000,
    }
  );
}
