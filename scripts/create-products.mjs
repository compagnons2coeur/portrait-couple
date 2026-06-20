import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually
const envPath = resolve(__dirname, "../.env.local");
const env = readFileSync(envPath, "utf-8");
env.split("\n").forEach((line) => {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
});

const SHOP = process.env.SHOPIFY_SHOP_DOMAIN;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

if (!SHOP || !TOKEN) {
  console.error("❌ SHOPIFY_SHOP_DOMAIN ou SHOPIFY_ADMIN_TOKEN manquant dans .env.local");
  process.exit(1);
}

const API_URL = `https://${SHOP}/admin/api/2026-04/products.json`;

async function createProduct(product) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN,
    },
    body: JSON.stringify({ product }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error(`❌ Erreur pour "${product.title}":`, JSON.stringify(data.errors));
    return null;
  }

  console.log(`✅ Créé : ${data.product.title} (id: ${data.product.id})`);
  return data.product;
}

const products = [
  // ─── TABLEAU TOILE ───────────────────────────────────────────
  {
    title: "Portrait IA — Tableau Toile",
    body_html: "<p>Portrait de votre animal généré par IA, imprimé sur toile tendue sur châssis. Livré prêt à accrocher.</p>",
    vendor: "Compagnons de Cœur",
    product_type: "Tableau",
    tags: "portrait-ia,tableau,toile",
    variants: [
      { option1: "20×30 cm", price: "34.90", requires_shipping: true },
      { option1: "30×40 cm", price: "44.90", requires_shipping: true },
      { option1: "40×60 cm", price: "69.90", requires_shipping: true },
      { option1: "50×70 cm", price: "89.90", requires_shipping: true },
    ],
    options: [{ name: "Format" }],
  },

  // ─── TABLEAU MÉTAL ───────────────────────────────────────────
  {
    title: "Portrait IA — Tableau Métal",
    body_html: "<p>Portrait de votre animal généré par IA, imprimé sur plaque aluminium Dibond. Rendu brillant et moderne.</p>",
    vendor: "Compagnons de Cœur",
    product_type: "Tableau",
    tags: "portrait-ia,tableau,metal",
    variants: [
      { option1: "20×30 cm", price: "44.90", requires_shipping: true },
      { option1: "30×40 cm", price: "59.90", requires_shipping: true },
      { option1: "40×60 cm", price: "84.90", requires_shipping: true },
      { option1: "50×70 cm", price: "109.90", requires_shipping: true },
    ],
    options: [{ name: "Format" }],
  },

  // ─── T-SHIRT ─────────────────────────────────────────────────
  {
    title: "Portrait IA — T-shirt",
    body_html: "<p>Portrait de votre animal généré par IA, imprimé en DTF sur t-shirt coton. Grand format dans le dos, option petit logo cœur en supplément.</p>",
    vendor: "Compagnons de Cœur",
    product_type: "Textile",
    tags: "portrait-ia,textile,tshirt",
    variants: [
      { option1: "XS", price: "34.90", requires_shipping: true },
      { option1: "S",  price: "34.90", requires_shipping: true },
      { option1: "M",  price: "34.90", requires_shipping: true },
      { option1: "L",  price: "34.90", requires_shipping: true },
      { option1: "XL", price: "34.90", requires_shipping: true },
    ],
    options: [{ name: "Taille" }],
  },

  // ─── SWEAT ───────────────────────────────────────────────────
  {
    title: "Portrait IA — Sweat",
    body_html: "<p>Portrait de votre animal généré par IA, imprimé en DTF sur sweat molletonné. Grand format dans le dos.</p>",
    vendor: "Compagnons de Cœur",
    product_type: "Textile",
    tags: "portrait-ia,textile,sweat",
    variants: [
      { option1: "XS", price: "54.90", requires_shipping: true },
      { option1: "S",  price: "54.90", requires_shipping: true },
      { option1: "M",  price: "54.90", requires_shipping: true },
      { option1: "L",  price: "54.90", requires_shipping: true },
      { option1: "XL", price: "54.90", requires_shipping: true },
    ],
    options: [{ name: "Taille" }],
  },

  // ─── TOTE BAG ────────────────────────────────────────────────
  {
    title: "Portrait IA — Tote Bag",
    body_html: "<p>Portrait de votre animal généré par IA, imprimé en DTF sur tote bag coton. Taille unique.</p>",
    vendor: "Compagnons de Cœur",
    product_type: "Textile",
    tags: "portrait-ia,textile,totebag",
    variants: [
      { option1: "Taille unique", price: "24.90", requires_shipping: true },
    ],
    options: [{ name: "Taille" }],
  },

  // ─── COQUE IPHONE ────────────────────────────────────────────
  {
    title: "Portrait IA — Coque iPhone",
    body_html: "<p>Portrait de votre animal généré par IA, imprimé sur coque iPhone rigide.</p>",
    vendor: "Compagnons de Cœur",
    product_type: "Coque",
    tags: "portrait-ia,coque,iphone",
    variants: [
      { option1: "iPhone 15",          price: "24.90", requires_shipping: true },
      { option1: "iPhone 15 Plus",     price: "24.90", requires_shipping: true },
      { option1: "iPhone 15 Pro",      price: "24.90", requires_shipping: true },
      { option1: "iPhone 15 Pro Max",  price: "24.90", requires_shipping: true },
      { option1: "iPhone 16",          price: "24.90", requires_shipping: true },
      { option1: "iPhone 16 Plus",     price: "24.90", requires_shipping: true },
      { option1: "iPhone 16 Pro",      price: "24.90", requires_shipping: true },
      { option1: "iPhone 16 Pro Max",  price: "24.90", requires_shipping: true },
      { option1: "iPhone 17",          price: "24.90", requires_shipping: true },
      { option1: "iPhone 17 Plus",     price: "24.90", requires_shipping: true },
      { option1: "iPhone 17 Pro",      price: "24.90", requires_shipping: true },
      { option1: "iPhone 17 Pro Max",  price: "24.90", requires_shipping: true },
    ],
    options: [{ name: "Modèle" }],
  },
];

console.log(`\n🚀 Création de ${products.length} produits sur ${SHOP}...\n`);

for (const product of products) {
  await createProduct(product);
  // Pause pour éviter le rate limit Shopify
  await new Promise((r) => setTimeout(r, 500));
}

console.log("\n✨ Terminé !");
