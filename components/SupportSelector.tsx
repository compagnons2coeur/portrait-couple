"use client";

import { useEffect, useState } from "react";

const TABLEAU_TOILE = {
  mockupUuid: "d695bb0a-f01e-4a74-9127-c18240bc6a54",
  smartObjectUuid: "ecf80a3c-8ab3-4fcd-878a-ce6b8b8e112e",
  label: "Tableau Toile",
  description: "Portrait de votre animal imprimé sur toile tendue premium, prêt à accrocher.",
  variants: [
    { label: "20×30 cm", price: 34.90, variantId: 53838496661847 },
    { label: "30×40 cm", price: 44.90, variantId: 53838496694615 },
    { label: "40×60 cm", price: 59.90, variantId: 53838496727383 },
    { label: "50×70 cm", price: 74.90, variantId: 53838496760151 },
  ],
};

const CADRES = [
  { id: "sans-cadre",   label: "Sans cadre",   surcharge: 0,  color: null },
  { id: "noir",         label: "Noir",          surcharge: 20, color: "#1a1a1a" },
  { id: "naturel",      label: "Naturel",       surcharge: 20, color: "#c4a97d" },
  { id: "blanc",        label: "Blanc",         surcharge: 20, color: "#f5f5f0" },
  { id: "marron",       label: "Marron",        surcharge: 20, color: "#7a4a2e" },
  { id: "dore-antique", label: "Doré antique",  surcharge: 25, color: "#c9a84c" },
];

const DIGITAL_PRICE = 4.99;

interface Props {
  mockupImageUrl: string;
  shopifyImageUrl: string;
  petName?: string;
  onBack: () => void;
}

function fmt(price: number) {
  return price.toFixed(2).replace(".", ",") + "€";
}

export default function SupportSelector({ mockupImageUrl, shopifyImageUrl, petName, onBack }: Props) {
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState(TABLEAU_TOILE.variants[1]);
  const [selectedCadre, setSelectedCadre] = useState(CADRES[0]);
  const [withSignature, setWithSignature] = useState(false);
  const [withDigital, setWithDigital] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const totalPrice = selectedVariant.price + selectedCadre.surcharge + (withDigital ? DIGITAL_PRICE : 0);

  useEffect(() => {
    const generate = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/mockup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl: mockupImageUrl,
            mockupUuid: TABLEAU_TOILE.mockupUuid,
            smartObjectUuid: TABLEAU_TOILE.smartObjectUuid,
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
  }, [mockupImageUrl]);

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
        body: JSON.stringify({
          variantId: selectedVariant.variantId,
          quantity: 1,
          portraitUrl: shopifyImageUrl,
          properties,
        }),
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
    <div className="mx-auto w-full max-w-6xl">
      <button
        type="button"
        onClick={onBack}
        className="mb-5 flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700"
      >
        ← Retour aux supports
      </button>

      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm lg:flex">
        {/* Left — mockup */}
        <div className="flex min-h-80 items-center justify-center bg-stone-100 lg:w-1/2">
          {loading && (
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
          )}
          {error && (
            <p className="px-8 text-center text-sm text-red-500">{error}</p>
          )}
          {mockupUrl && !loading && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mockupUrl}
              alt="Aperçu du tableau toile"
              className="h-full w-full object-cover"
            />
          )}
        </div>

        {/* Right — options */}
        <div className="flex flex-col divide-y divide-stone-100 lg:w-1/2">
          {/* Header */}
          <div className="p-6 sm:p-8">
            <h2 className="font-serif text-2xl text-stone-800">{TABLEAU_TOILE.label}</h2>
            <p className="mt-1 text-sm text-stone-500">{TABLEAU_TOILE.description}</p>
          </div>

          {/* FORMAT */}
          <div className="p-6 sm:px-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">Format</p>
            <div className="grid grid-cols-2 gap-2">
              {TABLEAU_TOILE.variants.map((v) => {
                const active = selectedVariant.variantId === v.variantId;
                return (
                  <button
                    key={v.variantId}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`rounded-xl border p-3 text-center transition ${
                      active
                        ? "border-stone-800 bg-stone-800 text-white"
                        : "border-stone-200 text-stone-700 hover:border-stone-400"
                    }`}
                  >
                    <span className="block text-sm font-semibold">{v.label}</span>
                    <span className={`text-xs ${active ? "text-stone-300" : "text-stone-400"}`}>
                      {fmt(v.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CADRE */}
          <div className="p-6 sm:px-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">Cadre</p>
            <div className="grid grid-cols-3 gap-2">
              {CADRES.map((c) => {
                const active = selectedCadre.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCadre(c)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition ${
                      active
                        ? "border-stone-800 bg-stone-50"
                        : "border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    {c.color ? (
                      <span
                        className="h-6 w-6 rounded-full border border-stone-200 shadow-sm"
                        style={{ backgroundColor: c.color }}
                      />
                    ) : (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-stone-300">
                        <span className="h-3 w-3 rounded-full border border-stone-300" />
                      </span>
                    )}
                    <span className="text-xs font-medium text-stone-700">{c.label}</span>
                    <span className="text-xs text-stone-400">
                      {c.surcharge === 0 ? "Inclus" : `+${fmt(c.surcharge)}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* OPTIONS */}
          <div className="p-6 sm:px-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">Options</p>
            <div className="space-y-3">
              {/* Signature */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setWithSignature((v) => !v)}
                onKeyDown={(e) => e.key === "Enter" && setWithSignature((v) => !v)}
                className="flex cursor-pointer items-center gap-4 rounded-xl border border-stone-200 p-4 transition hover:border-stone-300"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-lg">
                  ✍️
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800">Signature</p>
                  <p className="text-xs text-stone-500 truncate">
                    {petName
                      ? `Prénom « ${petName} » gravé sur le tableau`
                      : "Ajoutez le prénom de votre compagnon"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-xs font-semibold text-green-600">Offert</span>
                  <div
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      withSignature ? "bg-green-500" : "bg-stone-200"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        withSignature ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Digital 4K */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setWithDigital((v) => !v)}
                onKeyDown={(e) => e.key === "Enter" && setWithDigital((v) => !v)}
                className="flex cursor-pointer items-center gap-4 rounded-xl border border-stone-200 p-4 transition hover:border-stone-300"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-lg">
                  🖥️
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800">Fichier digital 4K</p>
                  <p className="text-xs text-stone-500">Recevez votre œuvre en haute définition</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-xs font-semibold text-stone-700">+{fmt(DIGITAL_PRICE)}</span>
                  <div
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      withDigital ? "bg-green-500" : "bg-stone-200"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        withDigital ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Prix + CTA */}
          <div className="p-6 sm:p-8">
            <div className="mb-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-stone-800">{fmt(totalPrice)}</span>
              <span className="text-sm text-stone-400">TTC · hors livraison</span>
            </div>
            <button
              type="button"
              onClick={handleCommander}
              disabled={checkoutLoading}
              className="w-full rounded-full bg-green-600 py-4 font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
            >
              {checkoutLoading
                ? "Création de la commande…"
                : `Commander — ${selectedVariant.label}`}
            </button>
            <p className="mt-3 text-center text-xs text-stone-400">
              Version HD sans filigrane livrée après commande confirmée.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
