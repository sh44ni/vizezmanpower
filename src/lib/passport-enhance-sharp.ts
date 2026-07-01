/**
 * VizEz Manpower — Server-side passport image enhancement using sharp.
 *
 * Replaces the Python /api/v1/enhance endpoint.
 * Runs in Next.js API routes (Node.js runtime).
 */

import sharp from 'sharp';

/** Resize enhanced output to this width max (preserves aspect ratio) */
const ENHANCE_WIDTH = 2480; // ~A4 at 300 dpi
/** JPEG output quality */
const JPEG_QUALITY = 92;

export interface SharpEnhanceResult {
  /** Enhanced image as a base64 data URL (data:image/jpeg;base64,...) */
  dataUrl: string;
  /** True if enhancement succeeded; false means original was returned */
  wasEnhanced: boolean;
}

/**
 * Enhance a passport image using sharp:
 * - Auto-rotate from EXIF metadata
 * - Convert to sRGB colour space
 * - Resize to standard width (without upscaling)
 * - Boost brightness + contrast via linear correction
 * - Sharpen via Gaussian unsharp mask
 * - Output as high-quality JPEG
 *
 * Falls back gracefully to the original if any step fails.
 */
export async function enhancePassportImageSharp(
  fileBuffer: Buffer,
  mimeType: string = 'image/jpeg',
): Promise<SharpEnhanceResult> {
  const fallbackDataUrl = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;

  try {
    const enhanced = await sharp(fileBuffer)
      .rotate()                                   // auto-rotate from EXIF
      .toColorspace('srgb')
      .resize({ width: ENHANCE_WIDTH, withoutEnlargement: true })
      .linear(1.08, 8)                            // contrast × 1.08, brightness +8
      .sharpen({ sigma: 1.2, m1: 0.5, m2: 0.5 }) // unsharp mask
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer();

    console.log('[sharp-enhance] ✓ Enhanced passport image');

    return {
      dataUrl: `data:image/jpeg;base64,${enhanced.toString('base64')}`,
      wasEnhanced: true,
    };
  } catch (err) {
    console.warn(
      '[sharp-enhance] Enhancement failed, returning original:',
      (err as Error).message,
    );
    return { dataUrl: fallbackDataUrl, wasEnhanced: false };
  }
}

/**
 * Crop and enhance a user-supplied photo (server-side fallback).
 * Client-side processing in photo-processor-browser.ts is preferred.
 * This is used only when the browser route hits the API endpoint directly.
 *
 * Passport standard: 35×45mm @ 300 dpi (413×531 px)
 *   • Face height (chin→crown) ≈ 70 % of photo height
 *   • Top margin (above hair)  ≈ 10 % of photo height
 *   • Bottom margin (below chin)≈ 20 % of photo height
 *
 * On a typical portrait submission the subject stands against a plain
 * background and fills the upper ~40 % of the frame vertically.
 * We therefore take the top 45 % of image height, centred horizontally
 * at 65 % width, then enforce the exact 35:45 aspect ratio.
 */
export async function cropAndEnhancePhotoSharp(
  fileBuffer: Buffer,
  mimeType: string = 'image/jpeg',
): Promise<SharpEnhanceResult> {
  const fallbackDataUrl = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;

  try {
    const meta = await sharp(fileBuffer).rotate().metadata();
    const imgW = meta.width  ?? 0;
    const imgH = meta.height ?? 0;

    if (!imgW || !imgH) throw new Error('Could not read image dimensions');

    const ASPECT = 35 / 45;  // ≈ 0.778

    // ── Step 1: derive an initial crop height so the face fills ~70 % ──────
    // The head-and-shoulders region on a standing portrait is roughly the
    // top 40 % of the frame.  We use 42 % to allow a small bottom margin.
    const initH = Math.floor(imgH * 0.42);
    const initW = Math.floor(initH * ASPECT);  // maintain target ratio

    // ── Step 2: centre horizontally; start 4 % from the top ─────────────
    const cropX = Math.max(0, Math.floor((imgW - initW) / 2));
    const cropY = Math.floor(imgH * 0.04);  // small top margin

    // ── Step 3: clamp to image bounds ───────────────────────────────────
    const safeW = Math.min(initW, imgW - cropX);
    const safeH = Math.min(initH, imgH - cropY);

    if (safeW < 10 || safeH < 10) throw new Error('Computed crop region too small');

    const enhanced = await sharp(fileBuffer)
      .rotate()                                           // honour EXIF rotation
      .toColorspace('srgb')
      .extract({ left: cropX, top: cropY, width: safeW, height: safeH })
      .resize({ width: 413, height: 531, fit: 'fill' })  // 35×45mm @ 300 dpi
      .linear(1.10, 8)                                    // brightness + contrast
      .sharpen({ sigma: 1.2, m1: 0.5, m2: 0.5 })
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer();

    console.log(
      `[sharp-crop] ✓ Cropped + enhanced photo — extract=(${cropX},${cropY} ${safeW}×${safeH})`,
    );

    return {
      dataUrl: `data:image/jpeg;base64,${enhanced.toString('base64')}`,
      wasEnhanced: true,
    };
  } catch (err) {
    console.warn(
      '[sharp-crop] Failed, returning original:',
      (err as Error).message,
    );
    return { dataUrl: fallbackDataUrl, wasEnhanced: false };
  }
}
