import { proxyPowergridRequest } from "@/lib/powergridProxy";

export async function GET() {
  return proxyPowergridRequest("/analysis/live/results/latest", undefined, {
    successMessage: "Latest grouped-analysis results loaded.",
    timeoutMs: 45_000,
  });
}
