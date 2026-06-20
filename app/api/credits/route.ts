import { NextRequest, NextResponse } from "next/server";
import { canGenerate, getCreditsUsage } from "@/lib/credits";
import { getStyleById } from "@/lib/styles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const styleId = request.nextUrl.searchParams.get("styleId");
    const fingerprint = request.nextUrl.searchParams.get("fingerprint");

    if (!styleId || !fingerprint) {
      return NextResponse.json(
        { error: "styleId et fingerprint sont requis." },
        { status: 400 }
      );
    }

    if (!getStyleById(styleId)) {
      return NextResponse.json({ error: "Style inconnu." }, { status: 400 });
    }

    const { used, remaining } = await getCreditsUsage(fingerprint, styleId);
    const access = await canGenerate(fingerprint, styleId);

    return NextResponse.json({
      used,
      remaining,
      needsEmail: access.needsEmail,
    });
  } catch (error) {
    console.error("[GET /api/credits]", error);
    return NextResponse.json(
      { error: "Impossible de lire les crédits." },
      { status: 500 }
    );
  }
}
