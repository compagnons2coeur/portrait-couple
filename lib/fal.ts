import { fal } from "@fal-ai/client";
import { FAL_MODEL_ID } from "./constants";

fal.config({
  credentials: process.env.FAL_KEY,
});

export { fal, FAL_MODEL_ID };

export interface FalImageOutput {
  images?: Array<{ url?: string }>;
}

export function extractImageUrl(data: FalImageOutput): string | null {
  return data.images?.[0]?.url ?? null;
}
