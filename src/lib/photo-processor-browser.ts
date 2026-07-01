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

/** Simple heuristic crop — used only when face detection fails */
function heuristicCrop(imgW: number, imgH: number): { sx: number; sy: number; sw: number; sh: number } {
  const targetRatio = TARGET_W / TARGET_H
  if (imgW / imgH > targetRatio) {
    const useH = Math.round(imgH * 0.75)
    const sw = Math.round(useH * targetRatio)
    const sx = Math.round((imgW - sw) / 2)
    return { sx, sy: 0, sw, sh: useH }
  } else {
    const sh = Math.min(Math.round(imgH * 0.55), Math.round(imgW / targetRatio))
    const sy = Math.round(imgH * 0.02)
    return { sx: 0, sy: Math.min(sy, imgH - sh), sw: imgW, sh: Math.min(sh, imgH) }
  }
}

/**
 * Face-aware crop using MediaPipe FaceDetector.
 *
 * Detects the face bounding box and builds a passport-standard crop:
 *  - 35% of face height above (forehead + hair)
 *  - 80% of face height below (chin → neck → top of shoulders)
 *  - 25% face width on each side
 * Then adjusts to exact 35:45 aspect ratio.
 */
async function calculateFaceAwareCrop(
  img: HTMLImageElement
): Promise<{ sx: number; sy: number; sw: number; sh: number }> {
  const imgW = img.naturalWidth
  const imgH = img.naturalHeight
  const targetRatio = TARGET_W / TARGET_H

  try {
    const detector = await getFaceDetector()
    const result = detector.detect(img)

    if (result.detections.length > 0) {
      const box = result.detections[0].boundingBox!

      // Passport padding around detected face box
      // padTop: hair above eyebrows + small gap; padBottom: chin + short neck only
      const padTop    = box.height * 0.35  // forehead + hair
      const padBottom = box.height * 0.25  // chin + short neck — NO body
      const padSide   = box.width  * 0.20  // left/right margins

      let cropTop    = Math.max(0, box.originY - padTop)
      let cropBottom = Math.min(imgH, box.originY + box.height + padBottom)
      let cropLeft   = Math.max(0, box.originX - padSide)
      let cropRight  = Math.min(imgW, box.originX + box.width + padSide)

      let cropW = cropRight - cropLeft
      let cropH = cropBottom - cropTop

      // Enforce 35:45 passport aspect ratio
      if (cropW / cropH > targetRatio) {
        // Wider than needed → expand height downward to fit ratio
        const newH = cropW / targetRatio
        cropBottom = Math.min(imgH, cropTop + newH)
        cropH = cropBottom - cropTop
      } else {
        // Taller than needed → expand width symmetrically around face center
        const newW = cropH * targetRatio
        const centerX = (cropLeft + cropRight) / 2
        cropLeft  = Math.max(0, centerX - newW / 2)
        cropRight = Math.min(imgW, centerX + newW / 2)
        cropW = cropRight - cropLeft
      }

      console.log('[face-detect] ✓ Face detected — smart passport crop applied')
      return {
        sx: Math.round(cropLeft),
        sy: Math.round(cropTop),
        sw: Math.round(cropW),
        sh: Math.round(cropH),
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
