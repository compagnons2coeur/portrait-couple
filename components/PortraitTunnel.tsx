"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { STYLES, type Style } from "@/lib/styles";
import {
  MAX_UPLOAD_BYTES,
  POLL_INTERVAL_MS,
} from "@/lib/constants";
import {
  applyWatermark,
  compressImage,
  isValidImageFile,
} from "@/lib/image-utils";
import SupportSelector from "@/components/SupportSelector";
import CropModal from "@/components/CropModal";

type Step = "upload" | "pet-name" | "style" | "generating" | "result" | "support";

const SUPPORT_PRODUCTS = [
  { id: "tableau-toile",  label: "Tableau Toile",  emoji: "🖼️", prix: "À partir de 34,90€", available: true  },
  { id: "tableau-metal",  label: "Tableau Métal",  emoji: "✨", prix: "Bientôt disponible",  available: false },
  { id: "tshirt",         label: "T-shirt",         emoji: "👕", prix: "Bientôt disponible",  available: false },
  { id: "sweat",          label: "Sweat",           emoji: "🧥", prix: "Bientôt disponible",  available: false },
  { id: "tote-bag",       label: "Tote bag",        emoji: "👜", prix: "Bientôt disponible",  available: false },
  { id: "coque-iphone",   label: "Coque iPhone",    emoji: "📱", prix: "Bientôt disponible",  available: false },
];

const BLOCKED_MESSAGE =
  "Vous avez utilisé vos 2 aperçus gratuits pour ce style. Passez commande pour recevoir votre portrait en HD sans filigrane.";

function StyleCard({
  style,
  selected,
  disabled,
  onSelect,
}: {
  style: Style;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className="group overflow-hidden rounded-2xl border border-stone-200 text-left transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
      style={{
        borderColor: selected ? style.accent : undefined,
      }}
    >
      <div className="aspect-[2/3] w-full overflow-hidden rounded-t-2xl bg-stone-200">
        {!imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/styles/${style.id}.jpg`}
            alt={style.nameFr}
            className={`h-full w-full object-cover ${style.id === "argentique" ? "object-top" : ""}`}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-4">
            <span className="text-center text-sm font-medium text-stone-600">
              {style.nameFr}
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div
          className="mb-3 h-2 rounded-full"
          style={{ backgroundColor: style.accent }}
        />
        <h3 className="text-sm font-medium text-stone-800">{style.nameFr}</h3>
        <p className="mt-0.5 text-xs text-stone-500">{style.description}</p>
        <p className="mt-1.5 text-sm font-bold text-green-600">À partir de 24,90€</p>
      </div>
    </button>
  );
}

export default function PortraitTunnel() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isExamplePhoto, setIsExamplePhoto] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [petName, setPetName] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [watermarkedImageUrl, setWatermarkedImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [blobImageUrl, setBlobImageUrl] = useState<string | null>(null);
  const [generationMessage, setGenerationMessage] = useState(
    "Nous préparons votre portrait…"
  );
  const [progressPct, setProgressPct] = useState(0);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    FingerprintJS.load()
      .then((fp) => fp.get())
      .then((result) => {
        if (!cancelled) {
          setFingerprint(result.visitorId);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Impossible d'identifier cet appareil. Rechargez la page.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const resetError = () => setError(null);

  const handleFile = useCallback((file: File) => {
    resetError();
    setIsExamplePhoto(false);

    if (!isValidImageFile(file)) {
      setError("Format accepté : JPG ou PNG uniquement.");
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setError("L'image ne doit pas dépasser 15 Mo.");
      return;
    }

    setPhotoFile(file);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }, []);

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const fetchCredits = async (styleId: string, fp: string) => {
    const params = new URLSearchParams({ styleId, fingerprint: fp });
    const response = await fetch(`/api/credits?${params}`);
    if (!response.ok) return null;
    const data = (await response.json()) as { remaining: number };
    return data.remaining;
  };

  const startGeneration = async (style: Style, emailValue?: string) => {
    if (!photoFile || !fingerprint) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const remaining = await fetchCredits(style.id, fingerprint);
      setCreditsRemaining(remaining);

      if (remaining === 0) {
        setError(BLOCKED_MESSAGE);
        setIsSubmitting(false);
        return;
      }

      const compressed = await compressImage(photoFile);
      const formData = new FormData();
      formData.append("photo", compressed, photoFile.name);
      formData.append("styleId", style.id);
      formData.append("fingerprint", fingerprint);
      if (emailValue) {
        formData.append("email", emailValue);
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        jobId?: string;
        error?: string;
      };

      if (!response.ok) {
        if (response.status === 400 && data.error?.includes("email")) {
          setShowEmailModal(true);
          setIsSubmitting(false);
          return;
        }
        throw new Error(data.error ?? "Échec du lancement.");
      }

      if (!data.jobId) {
        throw new Error("Identifiant de génération manquant.");
      }

      setShowEmailModal(false);
      setJobId(data.jobId);
      setStep("generating");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStyleSelect = (style: Style) => {
    resetError();
    setSelectedStyle(style);
  };

  const handleConfirmGeneration = async () => {
    if (!selectedStyle || !fingerprint) return;
    resetError();

    if (selectedStyle.id === "sans-ia") {
      if (!photoFile) return;
      setStep("generating");
      setProgressPct(50);
      setGenerationMessage("Préparation de votre photo…");
      try {
        const compressed = await compressImage(photoFile);
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(compressed);
        });
        setProgressPct(75);
        setGenerationMessage("Application du filigrane…");
        const watermarked = await applyWatermark(dataUrl);
        let blobUrl: string | null = null;
        try {
          const uploadRes = await fetch("/api/upload-watermark", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dataUrl: watermarked }),
          });
          const uploadData = await uploadRes.json() as { url?: string };
          blobUrl = uploadData.url ?? null;
        } catch { /* fallback */ }
        setProgressPct(100);
        setGenerationMessage("Photo prête !");
        await new Promise((resolve) => setTimeout(resolve, 400));
        setOriginalImageUrl(dataUrl);
        setWatermarkedImageUrl(watermarked);
        setBlobImageUrl(blobUrl);
        setStep("result");
      } catch {
        setError("Une erreur est survenue. Veuillez réessayer.");
        setStep("style");
      }
      return;
    }

    if (isExamplePhoto) {
      const demoUrl = `/demos/${selectedStyle.id}.jpg`;
      setStep("generating");
      await new Promise((resolve) => setTimeout(resolve, 8000));
      setProgressPct(100);
      setGenerationMessage("Portrait prêt !");
      await new Promise((resolve) => setTimeout(resolve, 500));
      setOriginalImageUrl(demoUrl);
      setWatermarkedImageUrl(demoUrl);
      setBlobImageUrl(demoUrl);
      setStep("result");
      return;
    }

    const remaining = await fetchCredits(selectedStyle.id, fingerprint);
    setCreditsRemaining(remaining);

    if (remaining === 0) {
      setError(BLOCKED_MESSAGE);
      return;
    }

    const params = new URLSearchParams({ styleId: selectedStyle.id, fingerprint });
    const creditsResponse = await fetch(`/api/credits?${params}`);
    if (creditsResponse.ok) {
      const creditsData = (await creditsResponse.json()) as { needsEmail?: boolean };
      if (creditsData.needsEmail) {
        setShowEmailModal(true);
        return;
      }
    }

    await startGeneration(selectedStyle);
  };

  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setEmailError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Veuillez entrer une adresse email valide.");
      return;
    }

    if (!selectedStyle) return;
    await startGeneration(selectedStyle, email.trim());
  };

  const PROGRESS_STEPS = [
    { pct: 8,  msg: "Analyse de votre animal en cours…" },
    { pct: 20, msg: "Identification des traits distinctifs…" },
    { pct: 35, msg: "Application du style artistique…" },
    { pct: 50, msg: "Ajout des détails et textures…" },
    { pct: 65, msg: "Mise en scène du portrait…" },
    { pct: 78, msg: "Finalisation des couleurs…" },
    { pct: 88, msg: "Dernières retouches…" },
    { pct: 94, msg: "Presque prêt…" },
  ];

  useEffect(() => {
    if (step !== "generating") { setProgressPct(0); return; }

    setProgressPct(0);
    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < PROGRESS_STEPS.length) {
        setProgressPct(PROGRESS_STEPS[stepIndex].pct);
        setGenerationMessage(PROGRESS_STEPS[stepIndex].msg);
        stepIndex++;
      }
    }, 4000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (step !== "generating" || !jobId) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const response = await fetch(`/api/status/${jobId}`);
        const data = (await response.json()) as {
          status: string;
          imageUrl?: string | null;
        };

        if (cancelled) return;

        if (data.status === "completed" && data.imageUrl) {
          setProgressPct(100);
          setGenerationMessage("Application du filigrane…");

          try {
            const watermarked = await applyWatermark(data.imageUrl);
            let blobUrl: string | null = null;
            try {
              const uploadRes = await fetch("/api/upload-watermark", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dataUrl: watermarked }),
              });
              const uploadData = await uploadRes.json() as { url?: string };
              blobUrl = uploadData.url ?? null;
            } catch {
              // silently fallback to original
            }
            if (!cancelled) {
              setOriginalImageUrl(data.imageUrl);
              setWatermarkedImageUrl(watermarked);
              setBlobImageUrl(blobUrl);
              setStep("result");
            }
          } catch {
            if (!cancelled) {
              setOriginalImageUrl(data.imageUrl);
              setWatermarkedImageUrl(data.imageUrl);
              setBlobImageUrl(null);
              setStep("result");
            }
          }
        } else if (data.status === "failed") {
          setError("La génération a échoué. Veuillez réessayer.");
          setStep("style");
        } else {
          setGenerationMessage("Votre portrait prend forme…");
        }
      } catch {
        if (!cancelled) {
          setGenerationMessage("Connexion instable, nouvelle tentative…");
        }
      }
    };

    void poll();
    const intervalId = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [step, jobId]);

  useEffect(() => {
    if (step !== "result" || !selectedStyle || !fingerprint) return;

    fetchCredits(selectedStyle.id, fingerprint).then((remaining) => {
      if (remaining !== null) {
        setCreditsRemaining(remaining);
      }
    });
  }, [step, selectedStyle, fingerprint]);

  const restart = () => {
    setStep("upload");
    setPhotoFile(null);
    setIsExamplePhoto(false);
    setPetName("");
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setSelectedStyle(null);
    setJobId(null);
    setWatermarkedImageUrl(null);
    setOriginalImageUrl(null);
    setBlobImageUrl(null);
    setError(null);
    setCreditsRemaining(null);
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-8 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-green-400">
          Compagnons de Cœur
        </p>
        <h1 className="mt-2 font-serif text-3xl text-stone-800 sm:text-4xl">
          Portrait IA de votre compagnon
        </h1>
        <p className="mt-3 text-stone-600">
          Uploadez une photo, choisissez un style, recevez un aperçu filigrané
          gratuit.
        </p>
        {step !== "upload" && (
          <button
            type="button"
            onClick={restart}
            className="mt-4 text-sm text-stone-400 underline-offset-2 hover:text-stone-600 hover:underline"
          >
            ↺ Recommencer
          </button>
        )}
      </div>

      <div className="mb-6 flex items-center justify-center gap-2">
        {(["upload", "style", "generating", "result"] as Step[]).map(
          (item, index) => {
            const labels = ["Photo", "Style", "Génération", "Résultat"];
            const activeIndex = ["upload", "style", "generating", "result"].indexOf(
              step
            );
            const isActive = index <= activeIndex;

            return (
              <div key={item} className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                    isActive
                      ? "bg-green-500 text-white"
                      : "bg-stone-200 text-stone-500"
                  }`}
                >
                  {index + 1}
                </div>
                <span
                  className={`hidden text-sm sm:inline ${
                    isActive ? "text-stone-800" : "text-stone-400"
                  }`}
                >
                  {labels[index]}
                </span>
                {index < 3 && (
                  <div className="mx-1 hidden h-px w-8 bg-stone-200 sm:block" />
                )}
              </div>
            );
          }
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {step === "upload" && (
        <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-serif text-2xl text-stone-800">
            1. Ajoutez la photo de votre animal
          </h2>
          <p className="mt-2 text-sm text-stone-500">
            JPG ou PNG, 15 Mo maximum. La photo sera compressée automatiquement. Plusieurs animaux sur la photo ? Pas de souci, ils seront tous intégrés au portrait.
          </p>

          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            className={`mt-6 flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 transition ${
              dragActive
                ? "border-green-400 bg-green-50"
                : "border-stone-300 bg-stone-50 hover:border-green-300"
            }`}
          >
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoPreview}
                alt="Aperçu de votre animal"
                className="max-h-64 rounded-xl object-contain"
              />
            ) : (
              <>
                <div className="text-4xl">🐾</div>
                <p className="mt-4 text-center font-medium text-stone-700">
                  Glissez-déposez une photo ici
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  ou cliquez pour parcourir vos fichiers
                </p>
              </>
            )}
          </div>

          {photoFile && (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-stone-700">{photoFile.name}</p>
                <p className="text-xs text-stone-400">{(photoFile.size / 1024 / 1024).toFixed(2)} Mo</p>
              </div>
              <div className="ml-4 flex shrink-0 gap-3 text-sm">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowCropModal(true); }}
                  className="text-green-600 hover:underline"
                >
                  Rogner
                </button>
                <span className="text-stone-300">|</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="text-stone-500 hover:underline"
                >
                  Changer
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
            }}
          />

          {!photoFile && (
            <>
              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-stone-200" />
                <span className="text-xs text-stone-400">OU</span>
                <div className="h-px flex-1 bg-stone-200" />
              </div>
              <button
                type="button"
                onClick={async () => {
                  const res = await fetch("/exemple-pet.jpg");
                  const blob = await res.blob();
                  const file = new File([blob], "exemple-pet.jpg", { type: "image/jpeg" });
                  handleFile(file);
                  setIsExamplePhoto(true);
                }}
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-6 py-3 text-sm font-medium text-stone-700 transition hover:border-green-300 hover:bg-green-50"
              >
                🐾 Essayer avec une photo d&apos;exemple
              </button>
            </>
          )}

          <button
            type="button"
            disabled={!photoFile}
            onClick={() => setStep("pet-name")}
            className="mt-6 w-full rounded-full bg-green-500 px-6 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            Continuer →
          </button>
        </section>
      )}

      {step === "pet-name" && (
        <section className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm text-center">
          <p className="text-4xl mb-4">🐾</p>
          <h2 className="font-serif text-3xl text-stone-800 mb-3">
            Comment s&apos;appelle(nt) votre/vos compagnon(s) ?
          </h2>
          <p className="text-sm text-stone-500 mb-8">
            Cela nous servira à signer votre tableau avec leur prénom si vous le souhaitez.
          </p>

          <div className="relative mx-auto max-w-sm">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">🐾</span>
            <input
              type="text"
              maxLength={24}
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder="Ex : Luna, ou Luna & Max"
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-3 pl-10 pr-4 text-stone-800 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
            />
          </div>
          <div className="mx-auto mt-1 flex max-w-sm justify-between text-xs text-stone-400 px-1">
            <span>Optionnel</span>
            <span>{petName.length}/24</span>
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setStep("upload")}
              className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700"
            >
              ← Retour
            </button>
            <button
              type="button"
              onClick={() => setStep("style")}
              className="rounded-full bg-stone-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-900"
            >
              Passer cette étape →
            </button>
          </div>
        </section>
      )}

      {step === "style" && (
        <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl text-stone-800">
                2. Choisissez un style
              </h2>
              <p className="mt-2 text-sm text-stone-500">
                2 aperçus gratuits par style et par appareil.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep("upload")}
              className="text-sm text-stone-500 underline-offset-2 hover:underline"
            >
              Modifier la photo
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {STYLES.map((style) => (
              <StyleCard
                key={style.id}
                style={style}
                selected={selectedStyle?.id === style.id}
                disabled={isSubmitting}
                onSelect={() => handleStyleSelect(style)}
              />
            ))}
          </div>

          {selectedStyle && !isSubmitting && (
            <div className="mt-8 rounded-2xl border border-green-100 bg-green-50 p-4">
              <p className="mb-3 text-center text-sm font-medium text-stone-700">
                Style sélectionné : <span className="text-green-700">{selectedStyle.nameFr}</span>
              </p>
              <button
                type="button"
                onClick={handleConfirmGeneration}
                className="w-full rounded-full bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
              >
                Générer ce portrait →
              </button>
            </div>
          )}

          {isSubmitting && (
            <p className="mt-6 text-center text-sm text-stone-500">
              Lancement de la génération…
            </p>
          )}
        </section>
      )}

      {step === "generating" && (
        <section className="rounded-3xl border border-stone-200 bg-white p-10 text-center shadow-sm">
          <h2 className="mb-2 font-serif text-2xl text-stone-800">
            Création en cours…
          </h2>
          {selectedStyle && (
            <p className="mb-8 text-sm text-stone-500">
              Style : {selectedStyle.nameFr}
            </p>
          )}

          {/* Barre de progression */}
          <div className="mb-4 h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-[3000ms] ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-stone-400 mb-6">
            <span>{progressPct}%</span>
            <span>~30 secondes</span>
          </div>

          <p className="text-stone-600 transition-all duration-500">{generationMessage}</p>
        </section>
      )}

      {step === "result" && watermarkedImageUrl && (
        <div>
          <div className="mb-6">
            <h2 className="font-serif text-2xl text-stone-800">4. Votre aperçu est prêt</h2>
            <p className="mt-1 text-sm text-stone-500">
              Aperçu filigrané — commandez pour recevoir la version HD sans filigrane.
            </p>
          </div>

          <div className="flex flex-col xl:flex-row gap-8 items-start">
            {/* Portrait sticky */}
            <div className="xl:sticky xl:top-8 xl:w-64 shrink-0 mx-auto xl:mx-0 w-full max-w-xs">
              <div className="overflow-hidden rounded-2xl border border-stone-200 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={watermarkedImageUrl}
                  alt="Portrait généré de votre animal"
                  className="w-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={restart}
                className="mt-3 w-full text-center text-sm text-stone-400 hover:text-stone-600"
              >
                ↺ Nouveau portrait
              </button>
              {creditsRemaining !== null && creditsRemaining > 0 && selectedStyle && (
                <p className="mt-2 text-center text-xs text-stone-400">
                  {creditsRemaining} aperçu{creditsRemaining > 1 ? "s" : ""} gratuit{creditsRemaining > 1 ? "s" : ""} restant{creditsRemaining > 1 ? "s" : ""} — style {selectedStyle.nameFr}
                </p>
              )}
            </div>

            {/* Grille produits */}
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-xl text-stone-800 mb-5">Choisissez votre support</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SUPPORT_PRODUCTS.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    disabled={!product.available}
                    onClick={() => setStep("support")}
                    className={`rounded-2xl border p-4 text-left transition ${
                      product.available
                        ? "border-stone-200 bg-white hover:-translate-y-0.5 hover:shadow-md hover:border-green-300 cursor-pointer"
                        : "border-stone-100 bg-stone-50 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div className="text-2xl mb-2">{product.emoji}</div>
                    <p className="text-sm font-semibold text-stone-800">{product.label}</p>
                    {product.available ? (
                      <p className="mt-1 text-xs font-bold text-green-600">{product.prix}</p>
                    ) : (
                      <span className="mt-2 inline-block rounded-full bg-stone-200 px-2 py-0.5 text-xs text-stone-500">
                        Bientôt
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-serif text-xl text-stone-800">
              Votre email pour continuer
            </h3>
            <p className="mt-2 text-sm text-stone-600">
              Pour votre première génération de ce style, indiquez votre email
              afin de vous envoyer votre portrait et nos offres.
            </p>

            <form onSubmit={handleEmailSubmit} className="mt-5 space-y-4">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="vous@exemple.com"
                className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none ring-green-300 focus:ring-2"
                required
              />
              {emailError && (
                <p className="text-sm text-red-600">{emailError}</p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="flex-1 rounded-full border border-stone-300 px-4 py-2.5 text-stone-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-full bg-green-500 px-4 py-2.5 font-semibold text-white hover:bg-green-700 disabled:bg-stone-300"
                >
                  {isSubmitting ? "Envoi…" : "Générer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {step === "support" && originalImageUrl && (
        <SupportSelector
          mockupImageUrl={blobImageUrl ?? originalImageUrl}
          shopifyImageUrl={originalImageUrl}
          petName={petName || undefined}
          onBack={() => setStep("result")}
        />
      )}

      {showCropModal && photoPreview && (
        <CropModal
          imageSrc={photoPreview}
          onClose={() => setShowCropModal(false)}
          onCropDone={(blob) => {
            const croppedFile = new File([blob], photoFile?.name ?? "photo.jpg", { type: "image/jpeg" });
            handleFile(croppedFile);
            setShowCropModal(false);
          }}
        />
      )}
    </div>
  );
}
