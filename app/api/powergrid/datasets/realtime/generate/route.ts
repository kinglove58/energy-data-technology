import { proxyPowergridRequest } from "@/lib/powergridProxy";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));

  return proxyPowergridRequest(
    "/datasets/realtime/generate",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    {
      successMessage: "Realtime dataset generated.",
      timeoutMs: 90_000,
    }
  );
}
