import { proxyPowergridRequest } from "@/lib/powergridProxy";

export async function GET() {
  return proxyPowergridRequest("/health/ready", undefined, {
    successMessage: "Powergrid readiness loaded.",
  });
}
