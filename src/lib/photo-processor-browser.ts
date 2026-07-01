/**
 * photo-processor-browser.ts
 *
 * Client-side passport photo processor with MediaPipe face detection.
 * Detects the face, adds passport-standard padding, and crops to 35×45mm.
 * Falls back to heuristic → server → raw on any failure.
 */

import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';

export interface PhotoProcessResult {
  dataUrl: string
  mode: 'browser' | 'server' | 'raw'
  wasCropped: boolean
}

/** Target dimensions: 35×45mm at 300 dpi */
const TARGET_W = 413
const TARGET_H = 531

// ── Singleton face detector (lazy-loaded once) ──────────────────────────────
let faceDetectorPromise: Promise<FaceDetector> | null = null;

async function getFaceDetector(): Promise<FaceDetector> {
  if (!faceDetectorPromise) {
    faceDetectorPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
      );
      return FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
        minDetectionConfidence: 0.5,
      });
    })();
  }
  return faceDetectorPromise;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload  = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not load image')) }
    img.src = url
  })
}

function applyPassportEnhancement(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data
  const brightness = 8
  const contrast = 1.08
  for (let i = 0; i < data.length; i += 4) {
    data[i]     = Math.min(255, Math.max(0, (data[i]     - 128) * contrast + 128 + brightness))
    data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrast + 128 + brightness))
    data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrast + 128 + brightness))
  }
  ctx.putImageData(imageData, 0, 0)
}

/**
 * Heuristic crop — used only when face detection fails.
 *
 * On a typical passport/ID photo submission the subject is centred and fills
 * the upper portion of the frame.  We take the top-centre region that covers
 * roughly the head + short neck and then enforce the 35:45 aspect ratio.
 */
function heuristicCrop(imgW: number, imgH: number): { sx: number; sy: number; sw: number; sh: number } {
  const targetRatio = TARGET_W / TARGET_H   // 35/45 ≈ 0.778

  // Take 55% of the width centred, starting 3% from the top, for 50% of height.
  // This reliably captures head + short neck on portrait shots.
  const sw0 = Math.round(imgW * 0.55)
  const sh0 = Math.round(imgH * 0.50)
  const sx0 = Math.round((imgW - sw0) / 2)
  const sy0 = Math.round(imgH * 0.03)

  // Enforce 35:45 aspect ratio by expanding width — never expand down (adds body)
  const naturalRatio = sw0 / sh0
  let sw = sw0
  let sh = sh0
  if (naturalRatio < targetRatio) {
    // Too tall → widen (expand horizontally, keep height)
    sw = Math.round(sh * targetRatio)
  } else {
    // Too wide → shorten height from bottom
    sh = Math.round(sw / targetRatio)
  }

  // Clamp to image bounds
  const sx = Math.max(0, Math.min(imgW - sw, sx0))
  const sy = Math.max(0, Math.min(imgH - sh, sy0))

  return { sx, sy, sw: Math.min(sw, imgW - sx), sh: Math.min(sh, imgH - sy) }
}

/**
 * Face-aware crop using MediaPipe FaceDetector.
 *
 * Passport photo standard (35×45mm, 300 dpi):
 *  • Face (chin → crown of hair) = ~70 % of photo height
 *  • Top of image → top of hair  = ~10 % of photo height
 *  • Chin → bottom of image       = ~20 % of photo height
 *
 * MediaPipe's bounding box covers approximately the forehead → chin region
 * (it does NOT include hair above the head).  To account for hair we add
 * ≈ 65 % of the face-box height as padding above the box.
 *
 * Aspect ratio is enforced by expanding WIDTH symmetrically — we never
 * extend the bottom of the crop to fix ratio, which would drag the body in.
 */
async function calculateFaceAwareCrop(
  img: HTMLImageElement
): Promise<{ sx: number; sy: number; sw: number; sh: number }> {
  const imgW = img.naturalWidth
  const imgH = img.naturalHeight
  const targetRatio = TARGET_W / TARGET_H   // 35/45 ≈ 0.778

  try {
    const detector = await getFaceDetector()
    const result = detector.detect(img)

    if (result.detections.length > 0) {
      const box = result.detections[0].boundingBox!
      const faceH = box.height
      const faceW = box.width

      // ── Passport padding ──────────────────────────────────────────────────
      // MediaPipe box starts at ~forehead level (not top of hair).
      // Hair typically adds ~65 % of face-box height above the box.
      // We also need a small top gap (~5 % photo height = ~7 % of faceH for
      // typical portraits) so we bump padTop a bit more.
      const padTop    = faceH * 0.72   // room for hair above the bounding box
      const padBottom = faceH * 0.20   // chin + very short neck — NO torso
      const padSide   = faceW * 0.28   // horizontal breathing room

      let cropTop    = box.originY - padTop
      let cropBottom = box.originY + faceH + padBottom
      let cropLeft   = box.originX - padSide
      let cropRight  = box.originX + faceW + padSide

      // Clamp vertically to the image
      cropTop    = Math.max(0, cropTop)
      cropBottom = Math.min(imgH, cropBottom)

      let cropH = cropBottom - cropTop
      let cropW = cropRight - cropLeft

      // ── Enforce 35:45 aspect ratio ────────────────────────────────────────
      // Always adjust WIDTH around the horizontal face centre.
      // Never extend cropBottom (that would pull body into the frame).
      const faceCentreX = box.originX + faceW / 2
      const requiredW   = cropH * targetRatio

      cropLeft  = faceCentreX - requiredW / 2
      cropRight = faceCentreX + requiredW / 2

      // If the required width exceeds the image, clamp and shrink height to match
      if (cropLeft < 0 || cropRight > imgW) {
        cropLeft  = Math.max(0, cropLeft)
        cropRight = Math.min(imgW, cropRight)
        cropW     = cropRight - cropLeft
        // Re-derive height from the now-clamped width (keep top, shorten bottom)
        cropH     = cropW / targetRatio
        cropBottom = Math.min(imgH, cropTop + cropH)
        cropH     = cropBottom - cropTop
      } else {
        cropW = cropRight - cropLeft
      }

      console.log(
        `[face-detect] ✓ Face detected — passport crop box=(${Math.round(box.originX)},${Math.round(box.originY)} ${Math.round(faceW)}×${Math.round(faceH)})` +
        ` crop=(${Math.round(cropLeft)},${Math.round(cropTop)} ${Math.round(cropW)}×${Math.round(cropH)})`
      )

      return {
        sx: Math.round(Math.max(0, cropLeft)),
        sy: Math.round(Math.max(0, cropTop)),
        sw: Math.round(Math.min(cropW, imgW)),
        sh: Math.round(Math.min(cropH, imgH)),
      }
    }

    console.warn('[face-detect] No face detected — falling back to heuristic crop')
  } catch (err) {
    console.warn('[face-detect] Detector failed — falling back to heuristic:', err)
    faceDetectorPromise = null  // Reset so next upload retries
  }

  return heuristicCrop(imgW, imgH)
}

// ── Main entry point ────────────────────────────────────────────────────────

/**
 * Process an applicant photo:
 * 1. Detect face with MediaPipe → smart passport crop → canvas enhance
 * 2. Fallback: server-side /api/process-photo (sharp)
 * 3. Last resort: raw file as dataUrl (no crop)
 */
export async function processApplicantPhoto(file: File): Promise<PhotoProcessResult> {
  // ── 1. Browser: face detection + canvas ──
  try {
    const img = await fileToImage(file)
    const { sx, sy, sw, sh } = await calculateFaceAwareCrop(img)

    const canvas = document.createElement('canvas')
    canvas.width  = TARGET_W
    canvas.height = TARGET_H

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No canvas context')

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, TARGET_W, TARGET_H)
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, TARGET_W, TARGET_H)
    applyPassportEnhancement(ctx, TARGET_W, TARGET_H)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    console.log(`[photo] mode=browser cropped=${sw}×${sh} → ${TARGET_W}×${TARGET_H}`)
    return { dataUrl, mode: 'browser', wasCropped: true }

  } catch (browserErr) {
    console.warn('[photo-processor-browser] Canvas failed, trying server:', browserErr)
  }

  // ── 2. Server fallback ──
  try {
    const formData = new FormData()
    formData.append('photo', file)
    const res = await fetch('/api/process-photo', { method: 'POST', body: formData })
    if (!res.ok) throw new Error(`Server returned ${res.status}`)
    const json = await res.json()
    if (json.dataUrl) {
      return { dataUrl: json.dataUrl, mode: 'server', wasCropped: json.wasCropped ?? false }
    }
    throw new Error('No dataUrl in response')
  } catch (serverErr) {
    console.warn('[photo-processor-browser] Server fallback failed:', serverErr)
  }

  // ── 3. Raw fallback ──
  const rawUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
  return { dataUrl: rawUrl, mode: 'raw', wasCropped: false }
}
