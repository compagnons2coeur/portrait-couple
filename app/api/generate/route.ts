import { NextRequest, NextResponse } from "next/server";
import {
  canGenerate,
  incrementUsage,
  recordEmail,
} from "@/lib/credits";
import { fal, FAL_MODEL_ID } from "@/lib/fal";
import { buildPrompt, getStyleById } from "@/lib/styles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    if (!process.env.FAL_KEY) {
      return NextResponse.json(
        { error: "Configuration serveur manquante (FAL_KEY)." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const photo = formData.get("photo");
    const styleId = formData.get("styleId");
    const fingerprint = formData.get("fingerprint");
    const email = formData.get("email");

    if (!(photo instanceof File)) {
      return NextResponse.json(
        { error: "Photo requise." },
        { status: 400 }
      );
    }

    if (typeof styleId !== "string" || typeof fingerprint !== "string") {
      return NextResponse.json(
        { error: "styleId et fingerprint sont requis." },
        { status: 400 }
      );
    }

    const style = getStyleById(styleId);
    if (!style) {
      return NextResponse.json({ error: "Style inconnu." }, { status: 400 });
    }

    const access = await canGenerate(fingerprint, styleId);

    if (!access.allowed) {
      return NextResponse.json(
        {
          error:
            "Vous avez utilisé vos 2 aperçus gratuits pour ce style. Passez commande pour recevoir votre portrait en HD sans filigrane.",
        },
        { status: 403 }
      );
    }

    if (access.needsEmail) {
      if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
        return NextResponse.json(
          { error: "Un email valide est requis pour votre première génération." },
          { status: 400 }
        );
      }
      await recordEmail(fingerprint, email);
    }

    const uploadedUrl = await fal.storage.upload(photo);
    const prompt = buildPrompt(styleId);

    const { request_id } = await fal.queue.submit(FAL_MODEL_ID, {
      input: {
        prompt,
        image_urls: [uploadedUrl],
        num_images: 1,
        output_format: "jpeg",
        resolution: "2K",
        aspect_ratio: "3:4",
      },
    });

    await incrementUsage(fingerprint, styleId);

    return NextResponse.json({ jobId: request_id });
  } catch (error) {
    console.error("[POST /api/generate]", error);
    return NextResponse.json(
      { error: "Erreur lors du lancement de la génération." },
      { status: 500 }
    );
  }
}
