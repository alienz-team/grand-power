import "server-only";
import { createClient } from "@supabase/supabase-js";

export const PRODUCT_BUCKET = "product-images";

export const isStorageConfigured = () => !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_BYTES = 8 * 1024 * 1024;

/** Uploads to the public `product-images` bucket using the service-role key (server only). */
export async function uploadProductImages(files: File[], folder = "products"): Promise<string[]> {
  if (!isStorageConfigured()) throw new Error("Supabase Storage is not configured");
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const urls: string[] = [];
  for (const file of files) {
    if (!ALLOWED.has(file.type)) throw new Error(`Unsupported file type: ${file.type}`);
    if (file.size > MAX_BYTES) throw new Error(`File too large: ${file.name}`);
    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(PRODUCT_BUCKET).upload(path, file, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw new Error(error.message);
    urls.push(supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(path).data.publicUrl);
  }
  return urls;
}
