import { proxyPowergridRequest } from "@/lib/powergridProxy";

export async function GET() {
  return proxyPowergridRequest("/datasets/catalog", undefined, {
    successMessage: "Dataset catalog loaded.",
  });
}
