import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SHOP = process.env.SHOPIFY_SHOP_DOMAIN!;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;

export async function POST(request: NextRequest) {
  try {
    const { variantId, quantity, portraitUrl } = await request.json() as {
      variantId: number;
      quantity: number;
      portraitUrl: string;
    };

    if (!variantId || !portraitUrl) {
      return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
    }

    const res = await fetch(`https://${SHOP}/admin/api/2024-10/draft_orders.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": TOKEN,
      },
      body: JSON.stringify({
        draft_order: {
          line_items: [
            {
              variant_id: variantId,
              quantity: quantity ?? 1,
              properties: [
                { name: "Portrait IA", value: portraitUrl },
              ],
            },
          ],
        },
      }),
    });

    const data = await res.json() as { draft_order?: { invoice_url: string }; errors?: unknown };

    if (!res.ok || !data.draft_order) {
      console.error("[POST /api/checkout]", data.errors);
      return NextResponse.json({ error: "Erreur création commande." }, { status: 500 });
    }

    return NextResponse.json({ checkoutUrl: data.draft_order.invoice_url });
  } catch (error) {
    console.error("[POST /api/checkout]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
