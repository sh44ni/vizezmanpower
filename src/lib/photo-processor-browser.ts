/**
 * photo-processor-browser.ts
 *
 * Client-side passport photo processor.
 * Uses Canvas API for resize + enhancement, with server-side fallback.
 */

export interface PhotoProcessResult {
  dataUrl: string
  mode: 'browser' | 'server' | 'raw'
  wasCropped: boolean
}

/**
 * Target dimensions for standard passport photos (35×45mm at 300dpi → 413×531px)
 */
const TARGET_W = 413
const TARGET_H = 531

/**
 * Convert File → HTMLImageElement
 */
async function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not load image')) }
    img.src = url
  })
}

/**
 * Enhance the image slightly: boost brightness/contrast for passport clarity
 */
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
 * Crop image to head-centered passport aspect ratio using simple heuristic.
 * Returns { sx, sy, sw, sh } — source region in natural pixels.
 */
function calculatePassportCrop(imgW: number, imgH: number): { sx: number; sy: number; sw: number; sh: number } {
  const targetRatio = TARGET_W / TARGET_H

  if (imgW / imgH > targetRatio) {
    // Wider than needed — crop width
    const sw = Math.round(imgH * targetRatio)
    const sx = Math.round((imgW - sw) / 2)
    return { sx, sy: 0, sw, sh: imgH }
  } else {
    // Taller than needed — show top 80% (head area)
    const sh = Math.round(imgW / targetRatio)
    const sy = Math.round(imgH * 0.05) // slight top offset to center face
    return { sx: 0, sy: Math.min(sy, imgH - sh), sw: imgW, sh }
  }
}

/**
 * Main browser-side photo processor.
 * Falls back to server-side /api/process-photo if canvas fails.
 */
export async function processApplicantPhoto(file: File): Promise<PhotoProcessResult> {
  // ── 1. Try browser canvas processing ──
  try {
    const img = await fileToImage(file)
    const { sx, sy, sw, sh } = calculatePassportCrop(img.naturalWidth, img.naturalHeight)

    const canvas = document.createElement('canvas')
    canvas.width  = TARGET_W
    canvas.height = TARGET_H

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No canvas context')

    // White background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, TARGET_W, TARGET_H)

    // Draw cropped region scaled to target size
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, TARGET_W, TARGET_H)

    // Apply slight enhancement
    applyPassportEnhancement(ctx, TARGET_W, TARGET_H)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    return { dataUrl, mode: 'browser', wasCropped: true }

  } catch (browserErr) {
    console.warn('[photo-processor-browser] Canvas failed, trying server:', browserErr)
  }

  // ── 2. Fallback: server-side via /api/process-photo ──
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

  // ── 3. Last resort: return raw file as dataUrl ──
  const rawUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
  return { dataUrl: rawUrl, mode: 'raw', wasCropped: false }
}
