import { NextRequest, NextResponse } from "next/server";
import { extractImageUrl, fal, FAL_MODEL_ID } from "@/lib/fal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JobStatus = "pending" | "completed" | "failed";

function mapFalStatus(status: string): JobStatus {
  if (status === "COMPLETED") return "completed";
  if (status === "FAILED" || status === "CANCELLED") return "failed";
  return "pending";
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    if (!process.env.FAL_KEY) {
      return NextResponse.json(
        { error: "Configuration serveur manquante (FAL_KEY)." },
        { status: 500 }
      );
    }

    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json({ error: "jobId requis." }, { status: 400 });
    }

    const queueStatus = await fal.queue.status(FAL_MODEL_ID, {
      requestId: jobId,
      logs: false,
    });

    const status = mapFalStatus(queueStatus.status);

    if (status !== "completed") {
      return NextResponse.json({ status, imageUrl: null });
    }

    const result = await fal.queue.result(FAL_MODEL_ID, {
      requestId: jobId,
    });

    const imageUrl = extractImageUrl(result.data);

    if (!imageUrl) {
      return NextResponse.json(
        { status: "failed", imageUrl: null },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: "completed", imageUrl });
  } catch (error) {
    console.error("[GET /api/status]", error);
    return NextResponse.json(
      { status: "failed", imageUrl: null, error: "Erreur de statut." },
      { status: 500 }
    );
  }
}
