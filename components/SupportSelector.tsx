"use client";

import { useEffect, useState } from "react";

const TABLEAU_TOILE = {
  mockupUuid: "d695bb0a-f01e-4a74-9127-c18240bc6a54",
  smartObjectUuid: "ecf80a3c-8ab3-4fcd-878a-ce6b8b8e112e",
  label: "Tableau Toile",
  prixDes: "34,90€",
  variants: [
    { label: "20×30 cm", variantId: 53838496661847 },
    { label: "30×40 cm", variantId: 53838496694615 },
    { label: "40×60 cm", variantId: 53838496727383 },
    { label: "50×70 cm", variantId: 53838496760151 },
  ],
};

interface Props {
  mockupImageUrl: string;
  shopifyImageUrl: string;
  onBack: () => void;
}

export default function SupportSelector({ mockupImageUrl, shopifyImageUrl, onBack }: Props) {
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState(TABLEAU_TOILE.variants[1]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

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

        if (!res.ok || !data.mockupUrl) {
          throw new Error(data.error ?? "Erreur génération mockup.");
        }

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
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: selectedVariant.variantId,
          quantity: 1,
          portraitUrl: shopifyImageUrl,
        }),
      });

      const data = await res.json() as { checkoutUrl?: string; error?: string };

      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error ?? "Erreur création commande.");
      }

      window.location.href = data.checkoutUrl;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-stone-500 underline-offset-2 hover:underline"
        >
          ← Retour
        </button>
        <h2 className="font-serif text-2xl text-stone-800">
          Choisissez votre support
        </h2>
      </div>

      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="mb-6 text-sm text-stone-500">
          Votre portrait sera imprimé sur le support de votre choix et livré chez vous.
        </p>

        {/* Mockup */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-stone-100 bg-stone-50">
          {loading && (
            <div className="flex h-80 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
            </div>
          )}
          {error && (
            <div className="flex h-80 items-center justify-center text-sm text-red-500">
              {error}
            </div>
          )}
          {mockupUrl && !loading && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mockupUrl}
              alt="Aperçu de votre tableau toile"
              className="w-full object-cover"
            />
          )}
        </div>

        {/* Produit */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-stone-800">{TABLEAU_TOILE.label}</h3>
          <p className="text-sm text-stone-500">À partir de {TABLEAU_TOILE.prixDes}</p>
        </div>

        {/* Sélecteur format */}
        <div className="mb-6">
          <p className="mb-2 text-sm font-medium text-stone-700">Format</p>
          <div className="flex flex-wrap gap-2">
            {TABLEAU_TOILE.variants.map((v) => (
              <button
                key={v.variantId}
                type="button"
                onClick={() => setSelectedVariant(v)}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                  selectedVariant.variantId === v.variantId
                    ? "border-green-600 bg-green-600 text-white"
                    : "border-stone-300 text-stone-700 hover:border-green-400"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleCommander}
          disabled={checkoutLoading}
          className="w-full rounded-full bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
        >
          {checkoutLoading ? "Création de la commande…" : `Commander ce tableau — ${selectedVariant.label}`}
        </button>

        <p className="mt-3 text-center text-xs text-stone-400">
          Version HD sans filigrane livrée après commande confirmée.
        </p>
      </div>
    </div>
  );
}
