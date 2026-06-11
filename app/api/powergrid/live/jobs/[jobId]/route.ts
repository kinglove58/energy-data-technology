import { proxyPowergridRequest } from "@/lib/powergridProxy";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  return proxyPowergridRequest(
    `/analysis/live/jobs/${encodeURIComponent(jobId)}`,
    undefined,
    {
      successMessage: "Live grouped-analysis job status loaded.",
    }
  );
}
