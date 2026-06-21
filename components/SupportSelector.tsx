"use client";

import { useEffect, useState } from "react";

const SMART_OBJ_METAL = "1685ddb5-152d-4595-8624-4213d767037e";
const MOCKUP_METAL    = "6486ae2b-f0f8-436d-9290-22f03fc1543d";

const PRODUCTS: Record<string, Product> = {
  "tableau-toile": {
    label: "Tableau Toile",
    description: "Portrait de votre animal imprimé sur toile tendue premium, prêt à accrocher.",
    variants: [
      { label: "20×30 cm", price: 34.90, variantId: 53838496661847, mockupUuid: "d695bb0a-f01e-4a74-9127-c18240bc6a54", smartObjectUuid: "ecf80a3c-8ab3-4fcd-878a-ce6b8b8e112e" },
      { label: "30×40 cm", price: 44.90, variantId: 53838496694615, mockupUuid: "d695bb0a-f01e-4a74-9127-c18240bc6a54", smartObjectUuid: "ecf80a3c-8ab3-4fcd-878a-ce6b8b8e112e" },
      { label: "40×60 cm", price: 59.90, variantId: 53838496727383, mockupUuid: "d695bb0a-f01e-4a74-9127-c18240bc6a54", smartObjectUuid: "ecf80a3c-8ab3-4fcd-878a-ce6b8b8e112e" },
      { label: "50×70 cm", price: 74.90, variantId: 53838496760151, mockupUuid: "d695bb0a-f01e-4a74-9127-c18240bc6a54", smartObjectUuid: "ecf80a3c-8ab3-4fcd-878a-ce6b8b8e112e" },
    ],
  },
  "tableau-metal": {
    label: "Tableau Métal",
    description: "Portrait sublimé sur plaque aluminium, rendu brillant et couleurs éclatantes.",
    variants: [
      { label: "20×30 cm", price: 39.90, variantId: 53838536147287, mockupUuid: MOCKUP_METAL, smartObjectUuid: SMART_OBJ_METAL },
      { label: "30×40 cm", price: 49.90, variantId: 53838536180055, mockupUuid: MOCKUP_METAL, smartObjectUuid: SMART_OBJ_METAL },
      { label: "40×60 cm", price: 64.90, variantId: 53838536212823, mockupUuid: MOCKUP_METAL, smartObjectUuid: SMART_OBJ_METAL },
      { label: "50×70 cm", price: 79.90, variantId: 53838536245591, mockupUuid: MOCKUP_METAL, smartObjectUuid: SMART_OBJ_METAL },
    ],
  },
};

const CADRES = [
  { id: "sans-cadre",   label: "Sans cadre",  surcharge: 0,  color: null },
  { id: "noir",         label: "Noir",         surcharge: 20, color: "#1a1a1a" },
  { id: "naturel",      label: "Naturel",      surcharge: 20, color: "#c4a97d" },
  { id: "blanc",        label: "Blanc",        surcharge: 20, color: "#f0ede8" },
  { id: "marron",       label: "Marron",       surcharge: 20, color: "#7a4a2e" },
  { id: "dore-antique", label: "Doré antique", surcharge: 25, color: "#c9a84c" },
];

const DIGITAL_PRICE = 4.99;

interface Variant {
  label: string;
  price: number;
  variantId: number;
  mockupUuid: string;
  smartObjectUuid: string;
}

interface Product {
  label: string;
  description: string;
  variants: Variant[];
}

interface Props {
  productId: string;
  mockupImageUrl: string;
  shopifyImageUrl: string;
  petName?: string;
  onBack: () => void;
}

function fmt(price: number) {
  return price.toFixed(2).replace(".", ",") + "€";
}

function Toggle({ on }: { on: boolean }) {
  return (
    <div
      className="relative h-6 w-11 rounded-full transition-colors pointer-events-none"
      style={{ backgroundColor: on ? "var(--green)" : "var(--border)" }}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
        style={{ transform: on ? "translateX(20px)" : "translateX(2px)" }}
      />
    </div>
  );
}

export default function SupportSelector({ productId, mockupImageUrl, shopifyImageUrl, petName, onBack }: Props) {
  const product = PRODUCTS[productId] ?? PRODUCTS["tableau-toile"];
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState(product.variants[1]);
  const [selectedCadre, setSelectedCadre] = useState(CADRES[0]);
  const [withSignature, setWithSignature] = useState(false);
  const [withDigital, setWithDigital] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const totalPrice = selectedVariant.price + selectedCadre.surcharge + (withDigital ? DIGITAL_PRICE : 0);

  useEffect(() => {
    const generate = async () => {
      setLoading(true); setError(null);
      try {
        const res = await fetch("/api/mockup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl: mockupImageUrl,
            mockupUuid: selectedVariant.mockupUuid,
            smartObjectUuid: selectedVariant.smartObjectUuid,
          }),
        });
        const data = await res.json() as { mockupUrl?: string; error?: string };
        if (!res.ok || !data.mockupUrl) throw new Error(data.error ?? "Erreur génération mockup.");
        setMockupUrl(data.mockupUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue.");
      } finally {
        setLoading(false);
      }
    };
    void generate();
  }, [mockupImageUrl, selectedVariant]);

  const handleCommander = async () => {
    setCheckoutLoading(true);
    try {
      const properties: { name: string; value: string }[] = [];
      if (selectedCadre.id !== "sans-cadre") properties.push({ name: "Cadre", value: selectedCadre.label });
      if (withSignature && petName) properties.push({ name: "Signature", value: petName });
      if (withDigital) properties.push({ name: "Fichier digital 4K", value: "Oui" });

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: selectedVariant.variantId, quantity: 1, portraitUrl: shopifyImageUrl, properties }),
      });
      const data = await res.json() as { checkoutUrl?: string; error?: string };
      if (!res.ok || !data.checkoutUrl) throw new Error(data.error ?? "Erreur création commande.");
      window.location.href = data.checkoutUrl;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: "var(--bg)" }}>
      <div className="lg:flex lg:min-h-screen">

        {/* Left — mockup plein écran sticky */}
        <div className="lg:sticky lg:top-0 lg:h-screen lg:w-1/2 shrink-0 flex items-center justify-center" style={{ backgroundColor: "#e8e4de" }}>
          {loading && (
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-stone-500" />
          )}
          {error && (
            <p className="px-8 text-center text-sm text-red-400">{error}</p>
          )}
          {mockupUrl && !loading && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mockupUrl} alt="Aperçu du tableau toile" className="w-full h-full object-cover" />
          )}
          {/* Bouton retour positionné sur l'image */}
          <button
            type="button"
            onClick={onBack}
            className="absolute top-5 left-5 flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur-sm px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-white"
            style={{ color: "var(--ink)" }}
          >
            ← Retour
          </button>
        </div>

        {/* Right — options scrollables */}
        <div className="lg:w-1/2 px-6 py-10 lg:px-14 lg:py-14 space-y-8">

          {/* Header */}
          <div>
            <h2 className="font-display text-3xl text-stone-900" style={{ letterSpacing: "-0.01em" }}>
              {product.label}
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{product.description}</p>
          </div>

          {/* FORMAT */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Format</p>
            <div className="grid grid-cols-2 gap-2">
              {product.variants.map(v => {
                const active = selectedVariant.variantId === v.variantId;
                return (
                  <button
                    key={v.variantId}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className="rounded-xl border py-3 px-4 text-center transition-all"
                    style={{
                      borderColor: active ? "var(--ink)" : "var(--border)",
                      backgroundColor: active ? "var(--ink)" : "white",
                      color: active ? "white" : "var(--ink)",
                    }}
                  >
                    <span className="block text-sm font-semibold">{v.label}</span>
                    <span className="text-xs opacity-60">{fmt(v.price)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CADRE */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Cadre</p>
            <div className="grid grid-cols-3 gap-2">
              {CADRES.map(c => {
                const active = selectedCadre.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCadre(c)}
                    className="flex flex-col items-center gap-1.5 rounded-xl border py-3 px-2 text-center transition-all"
                    style={{
                      borderColor: active ? "var(--ink)" : "var(--border)",
                      backgroundColor: active ? "#faf9f7" : "white",
                    }}
                  >
                    {c.color ? (
                      <span className="h-5 w-5 rounded-full border shadow-sm" style={{ backgroundColor: c.color, borderColor: "var(--border)" }} />
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed" style={{ borderColor: "var(--border)" }}>
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--border)" }} />
                      </span>
                    )}
                    <span className="text-xs font-medium text-stone-700 leading-tight">{c.label}</span>
                    <span className="text-[10px]" style={{ color: "var(--muted)" }}>
                      {c.surcharge === 0 ? "Inclus" : `+${fmt(c.surcharge)}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* OPTIONS */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Options</p>
            <div className="space-y-2">
              {/* Signature */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setWithSignature(v => !v)}
                onKeyDown={e => e.key === "Enter" && setWithSignature(v => !v)}
                className="flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition hover:bg-stone-50"
                style={{ borderColor: "var(--border)" }}
              >
                <span className="text-xl">✍️</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-800">Signature</p>
                  <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
                    {petName ? `Prénom « ${petName} » gravé sur le tableau` : "Ajoutez le prénom de votre compagnon"}
                  </p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1.5">
                  <span className="text-xs font-bold" style={{ color: "var(--green)" }}>Offert</span>
                  <Toggle on={withSignature} />
                </div>
              </div>

              {/* Digital 4K */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setWithDigital(v => !v)}
                onKeyDown={e => e.key === "Enter" && setWithDigital(v => !v)}
                className="flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition hover:bg-stone-50"
                style={{ borderColor: "var(--border)" }}
              >
                <span className="text-xl">🖥️</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-800">Fichier digital 4K</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>Recevez votre œuvre en haute définition</p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1.5">
                  <span className="text-xs font-semibold text-stone-600">+{fmt(DIGITAL_PRICE)}</span>
                  <Toggle on={withDigital} />
                </div>
              </div>
            </div>
          </div>

          {/* Prix + CTA */}
          <div className="pt-2">
            <div className="mb-5 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-stone-900">{fmt(totalPrice)}</span>
              <span className="text-sm" style={{ color: "var(--muted)" }}>TTC · hors livraison</span>
            </div>
            <button
              type="button"
              onClick={handleCommander}
              disabled={checkoutLoading}
              className="w-full rounded-full py-4 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "var(--green)" }}
            >
              {checkoutLoading ? "Création de la commande…" : `Commander — ${selectedVariant.label}`}
            </button>
            <p className="mt-3 text-center text-xs" style={{ color: "var(--muted)" }}>
              Version HD sans filigrane livrée après commande confirmée.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
