const BASE = `Keep the exact appearance, faces, hair, skin tones and features of both people from the reference image. Preserve their identities completely. There are two people — a couple — always show both of them together in the scene.`;

export interface Style {
  id: string;
  nameFr: string;
  accent: string;
  prompt: string;
  description: string;
}

export const STYLES: Style[] = [
  {
    id: "sans-ia",
    nameFr: "Photo originale",
    accent: "#6B7280",
    description: "Votre photo telle quelle, sans modification",
    prompt: "",
  },
  {
    id: "espace",
    nameFr: "Espace",
    accent: "#1E3A5F",
    description: "Cosmonautes dans les étoiles",
    prompt: `${BASE}

Epic cinematic space portrait. Both subjects wear full bright WHITE modern EVA spacesuits, clear glass spherical helmets (open visors), mission patches. Deep space background: Earth curvature below, star-filled cosmos, purple and blue nebula. Dramatic cold rim lighting. Photorealistic, IMAX quality.`,
  },
  {
    id: "baroque",
    nameFr: "Baroque",
    accent: "#8B4513",
    description: "Portrait royal à l'huile",
    prompt: `${BASE}

Oil painting portrait, 17th century Flemish baroque masters style. Dramatic chiaroscuro lighting, warm golden candlelight. Both subjects wear ornate royal aristocrat costumes: crimson velvet capes, white lace ruff collars, jeweled brooches. Heavy draped burgundy curtains background. Rich impasto texture, visible brushstrokes. Museum-quality.`,
  },
  {
    id: "magazine",
    nameFr: "Compagnons de Cœur",
    accent: "#C9A84C",
    description: "Stars de couverture de magazine",
    prompt: `${BASE}

Glossy luxury fashion magazine cover. Both subjects wear oversized black designer sunglasses, tailored ivory blazers, chunky gold chains. High-key studio lighting. Bold serif white text "COMPAGNONS DE COEUR" at the top as masthead. Dark moody background. Ultra-sharp, glamorous.`,
  },
  {
    id: "influenceur",
    nameFr: "En vacances",
    accent: "#F4A261",
    description: "Lifestyle tropical & bonne humeur",
    prompt: `${BASE}

Bright tropical beach lifestyle photo, golden hour. Both subjects wear Hawaiian flower lei garlands, oversized mirrored sunglasses, straw hats. Turquoise ocean, white sand, blurred palm trees background. Warm saturated colors. Joyful, carefree, in love.`,
  },
  {
    id: "montagne",
    nameFr: "Sommet de montagne",
    accent: "#5D8AA8",
    description: "Aventuriers conquérant les sommets",
    prompt: `${BASE}

Epic adventure photography at a snowy mountain summit, golden hour. Both subjects wear red down jackets, wool scarves. Snow-capped peaks panorama, clouds below, orange and pink sky. Triumphant atmosphere, standing close together. National Geographic quality.`,
  },
  {
    id: "argentique",
    nameFr: "Argentique",
    accent: "#A0855B",
    description: "Photo pellicule années 90",
    prompt: `${BASE}

Authentic 35mm film photography, Kodak Portra 400 aesthetic. Film grain, warm faded colors, corner vignetting. Both subjects wear cozy vintage mustard yellow knit sweaters. Natural window light, underexposed, intimate nostalgic 1990s couple portrait.`,
  },
  {
    id: "cartoon",
    nameFr: "Cartoon",
    accent: "#E76F51",
    description: "Animation Pixar haute définition",
    prompt: `${BASE}

Vibrant Pixar 3D animated movie still. Both subjects wear colorful adventurer outfits: khaki explorer jackets, red neckerchiefs, leather backpacks. Warm studio lighting, pastel bokeh background. Playful, heartwarming, couple adventure movie quality.`,
  },
  {
    id: "studio-couleur",
    nameFr: "Studio photo",
    accent: "#6B7280",
    description: "Portrait professionnel fond blanc",
    prompt: `${BASE}

High-end professional studio couple portrait, 85mm lens. Perfect three-point lighting. Pure white seamless backdrop. Tack-sharp focus, creamy bokeh. Natural colors. Commercial editorial quality.`,
  },
  {
    id: "studio-nb",
    nameFr: "Studio noir & blanc",
    accent: "#1C1C1C",
    description: "Élégance intemporelle en N&B",
    prompt: `${BASE}

Timeless black and white fine art studio portrait of a couple. Dramatic key light, deep shadows, strong contrast. White seamless backdrop. Rich blacks, pure whites. Helmut Newton meets Irving Penn. Elegant, powerful, timeless.`,
  },
];

export function getStyleById(id: string): Style | undefined {
  return STYLES.find((style) => style.id === id);
}

export function buildPrompt(styleId: string): string {
  const style = getStyleById(styleId);
  if (!style) throw new Error(`Style inconnu: ${styleId}`);
  return style.prompt;
}
