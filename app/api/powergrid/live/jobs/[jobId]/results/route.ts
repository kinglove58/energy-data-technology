import { proxyPowergridRequest } from "@/lib/powergridProxy";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  return proxyPowergridRequest(
    `/analysis/live/jobs/${encodeURIComponent(jobId)}/results`,
    undefined,
    {
      successMessage: "Live grouped-analysis job results loaded.",
      timeoutMs: 45_000,
    }
  );
}
