import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { dataUrl } = await request.json() as { dataUrl: string };

    if (!dataUrl?.startsWith("data:image/")) {
      return NextResponse.json({ error: "Image invalide." }, { status: 400 });
    }

    const base64 = dataUrl.split(",")[1];
    const buffer = Buffer.from(base64, "base64");
    const filename = `portraits/watermarked-${Date.now()}.png`;

    const blob = await put(filename, buffer, {
      access: "public",
      contentType: "image/png",
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("[POST /api/upload-watermark]", error);
    return NextResponse.json({ error: "Erreur upload." }, { status: 500 });
  }
}
