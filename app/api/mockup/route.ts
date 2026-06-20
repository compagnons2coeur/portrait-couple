import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, mockupUuid, smartObjectUuid } = await request.json() as {
      imageUrl: string;
      mockupUuid: string;
      smartObjectUuid: string;
    };

    if (!imageUrl || !mockupUuid || !smartObjectUuid) {
      return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
    }

    if (!process.env.DYNAMIC_MOCKUPS_API_KEY) {
      return NextResponse.json({ error: "Clé API Dynamic Mockups manquante." }, { status: 500 });
    }

    const res = await fetch("https://app.dynamicmockups.com/api/v1/renders", {
      method: "POST",
      headers: {
        "x-api-key": process.env.DYNAMIC_MOCKUPS_API_KEY,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mockup_uuid: mockupUuid,
        smart_objects: [
          {
            uuid: smartObjectUuid,
            asset: { url: imageUrl },
          },
        ],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: "Erreur Dynamic Mockups." }, { status: 500 });
    }

    const mockupUrl = data.data?.export_path ?? data.export_path ?? data.url;
    return NextResponse.json({ mockupUrl });
  } catch (error) {
    console.error("[POST /api/mockup]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
