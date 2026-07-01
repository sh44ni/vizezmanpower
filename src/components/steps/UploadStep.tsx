"use client";

import React, { useRef, useState } from "react";
import { ManualVisaItem } from "@/app/types";
import { UploadCloud, X, ArrowRight, Plus, Camera, FileText, CheckCircle2, RefreshCw, Loader2 } from "lucide-react";
import { processApplicantPhoto } from "@/lib/photo-processor-browser";
import { useLanguage } from "@/lib/language";

function resetInput(el: HTMLInputElement | null) {
  if (el) el.value = "";
}

export default function UploadStep({ items, setItems, onNext, remaining }: any) {
  const { t, isRTL } = useLanguage();
  // remaining = null → unlimited, remaining = N → only N more applicants allowed
  const quotaLeft: number | null = remaining === null || remaining === undefined ? null : remaining;
  const atQuotaLimit = quotaLeft !== null && items.length >= quotaLeft;
  const mainInputRef = useRef<HTMLInputElement>(null);
  const fabInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  /** IDs currently being auto-cropped */
  const [croppingIds, setCroppingIds] = useState<Set<string>>(new Set());

  const ensurePdfJs = async () => {
    if ((window as any).pdfjsLib) return;
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
    await new Promise((res, rej) => {
      script.onload = res;
      script.onerror = rej;
      document.head.appendChild(script);
    });
    (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
  };

  const pdfToImage = async (file: File): Promise<File> => {
    await ensurePdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await (window as any).pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D context not available");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: context, viewport }).promise;
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.9));
    if (!blob) throw new Error("Canvas toBlob failed");
    return new File([blob], file.name.replace(/\.pdf$/i, ".jpg"), { type: "image/jpeg" });
  };

  const addFile = (passportFile?: File) => {
    if (!passportFile) return;
    const item: ManualVisaItem = {
      id: Math.random().toString(36).slice(7),
      passportFile,
      workPermitFile: null,
      photoFile: null,
      passportPreviewUrl: URL.createObjectURL(passportFile),
      workPermitPreviewUrl: "",
      photoPreviewUrl: "",
      status: "pending",
      progress: 0,
    };
    setItems((prev: any) => [...prev, item]);
  };

  const handlePassportFiles = async (
    fileList: FileList | null,
    inputEl?: HTMLInputElement | null
  ) => {
    if (!fileList || fileList.length === 0) return;
    // Quota cap: only add as many as the remaining slots allow
    let files = Array.from(fileList);
    if (quotaLeft !== null) {
      const canAdd = quotaLeft - items.length;
      if (canAdd <= 0) return; // already at limit
      files = files.slice(0, canAdd);
    }
    resetInput(inputEl || null);
    try {
      for (const f of files) {
        const fileName = f.name || "unnamed";
        const fileType = f.type || "no-type";
        const isPdf =
          fileType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
        let finalFile = f;
        if (isPdf) {
          try {
            finalFile = await pdfToImage(f);
          } catch {
            continue;
          }
        }
        addFile(finalFile);
      }
    } catch (globalErr: any) {
      alert("Error handling passport: " + globalErr.message);
    }
  };

  /** Replace an existing item's passport file */
  const handleReplacePassport = async (
    id: string,
    file: File,
    inputEl?: HTMLInputElement | null
  ) => {
    if (!file) return;
    resetInput(inputEl || null);
    try {
      const isPdf =
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      let finalFile = file;
      if (isPdf) {
        try {
          finalFile = await pdfToImage(file);
        } catch (err: any) {
          alert("Could not process PDF: " + err.message);
          return;
        }
      }
      const previewUrl = URL.createObjectURL(finalFile);
      setItems((prev: any) =>
        prev.map((item: any) =>
          item.id === id
            ? { ...item, passportFile: finalFile, passportPreviewUrl: previewUrl }
            : item
        )
      );
    } catch (globalErr: any) {
      alert("Error replacing passport: " + globalErr.message);
    }
  };

  const handleWorkPermitFile = async (
    id: string,
    file: File,
    inputEl?: HTMLInputElement | null
  ) => {
    if (!file) return;
    resetInput(inputEl || null);
    try {
      let finalFile = file;
      const isPdf =
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (isPdf) {
        try {
          finalFile = await pdfToImage(file);
        } catch (err: any) {
          alert("Could not process PDF: " + err.message);
          return;
        }
      }
      const wpUrl = URL.createObjectURL(finalFile);
      setItems((prev: any) =>
        prev.map((item: any) =>
          item.id === id
            ? { ...item, workPermitFile: finalFile, workPermitPreviewUrl: wpUrl }
            : item
        )
      );
    } catch (globalErr: any) {
      alert("Error handling work permit: " + globalErr.message);
    }
  };

  const handlePhotoFile = async (
    id: string,
    file: File,
    inputEl?: HTMLInputElement | null
  ) => {
    if (!file) return;
    resetInput(inputEl || null);

    // Show raw preview immediately so UI feels instant
    const rawUrl = URL.createObjectURL(file);
    setItems((prev: any) =>
      prev.map((item: any) =>
        item.id === id
          ? { ...item, photoFile: file, photoPreviewUrl: rawUrl, photoDataUrl: rawUrl }
          : item
      )
    );

    // Mark as cropping
    setCroppingIds((prev) => new Set(prev).add(id));

    try {
      // ── Entirely in-browser: face detect → classify → crop → enhance ──
      const result = await processApplicantPhoto(file);
      console.log(`[photo] mode=${result.mode} cropped=${result.wasCropped}`);

      setItems((prev: any) =>
        prev.map((item: any) =>
          item.id === id
            ? { ...item, photoPreviewUrl: result.dataUrl, photoDataUrl: result.dataUrl }
            : item
        )
      );

      // Clean up the temporary object URL now that we have the processed dataUrl
      URL.revokeObjectURL(rawUrl);
    } catch (err) {
      console.warn("[photo-crop] Browser processing failed, keeping raw preview:", err);
    } finally {
      setCroppingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const removeItem = (id: string) =>
    setItems((prev: any) => prev.filter((x: any) => x.id !== id));

  const canProceed = items.length > 0 && items.every((x: any) => x.passportFile) && croppingIds.size === 0;

  /* ── Drag-and-drop handlers for the empty zone ── */
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handlePassportFiles(e.dataTransfer.files);
  };

  return (
    <div className="flex flex-col h-full relative" dir={isRTL ? "rtl" : "ltr"} style={{ fontFamily: isRTL ? 'var(--font-arabic), sans-serif' : undefined }}>
      {/* Header */}
      <div className="mb-7 flex-shrink-0">
        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight" style={{ fontFamily: isRTL ? 'var(--font-arabic), sans-serif' : "var(--font-outfit), sans-serif" }}>
          {t('step_upload_title')}
        </h2>
        <p className="text-sm text-white/50">
          {t('step_upload_sub')}
        </p>
      </div>
      {/* Quota banner — only shown when a finite limit exists */}
      {quotaLeft !== null && (
        <div
          className={`mb-4 flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-medium ${
            atQuotaLimit
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : quotaLeft <= 3
              ? 'bg-amber-400/8 border-amber-400/25 text-amber-300'
              : 'bg-white/[0.03] border-white/[0.07] text-white/50'
          }`}
        >
          <span className="text-lg leading-none">{atQuotaLimit ? '🚫' : '📋'}</span>
          <span>
            {atQuotaLimit
              ? (isRTL ? 'لقد وصلت إلى الحد الأقصى لحصتك' : `Quota limit reached (${quotaLeft} slots used)`)
              : (isRTL ? `متبقٍ ${quotaLeft} طلب من حصتك هذا الشهر` : `${quotaLeft} slot${quotaLeft !== 1 ? 's' : ''} remaining this month`)}
          </span>
          {atQuotaLimit && (
            <a
              href="https://wa.me/923178328164?text=Hi%2C%20I%20need%20more%20submission%20slots%20on%20Vizez%20Manpower"
              target="_blank"
              rel="noopener noreferrer"
              className="ms-auto text-xs font-bold text-green-400 border border-green-400/30 bg-green-400/10 px-2.5 py-1 rounded-lg hover:bg-green-400/20 transition-colors whitespace-nowrap"
            >
              {isRTL ? '📲 ترقية' : '📲 Upgrade'}
            </a>
          )}
        </div>
      )}

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto pb-28 -mx-4 px-4 flex flex-col gap-3">
        {items.map((item: any, idx: number) => (
          <div
            key={item.id}
            className="bg-[rgba(255,255,255,0.03)] border border-white/[0.08] rounded-[22px] p-4 flex flex-col gap-3 relative overflow-hidden backdrop-blur-xl animate-slide-up"
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            {/* Top row */}
            <div className="flex items-center gap-4">
              {/* Passport thumbnail — clickable to reselect */}
              <label
                className="w-16 h-20 bg-black/50 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-inner relative cursor-pointer group"
                title={t('step_upload_tap_change')}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.passportPreviewUrl}
                  className="w-full h-full object-cover transition-opacity group-hover:opacity-50"
                  alt="passport"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                {/* Hover overlay with refresh icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <RefreshCw className="w-5 h-5 text-white drop-shadow-lg" />
                </div>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="sr-only"
                  onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
                  onChange={(e) => {
                    if (e.target.files?.[0])
                      handleReplacePassport(item.id, e.target.files[0], e.target);
                  }}
                />
              </label>

              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-[14px] truncate leading-tight">
                  {item.passportFile?.name}
                </h3>
                <p className="text-white/40 text-xs mt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] inline-block" />
                  {t('step_upload_passport_ready')}
                </p>
                <p className="text-white/25 text-[10px] mt-0.5">{t('step_upload_tap_change')}</p>
              </div>

              <button
                onClick={() => removeItem(item.id)}
                className="w-8 h-8 rounded-full bg-white/5 text-white/30 flex items-center justify-center shrink-0 hover:bg-red-500/20 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Attachments row */}
            <div className="flex items-center gap-2 pt-3 border-t border-white/[0.05] flex-wrap">
              {/* Photo — always shows a label even when set, to allow reselection */}
              {item.photoFile ? (
                <label
                  className="relative flex items-center gap-2 cursor-pointer group"
                  title={croppingIds.has(item.id) ? t('step_upload_cropping') : t('step_upload_tap_change')}
                >
                  {item.photoPreviewUrl && (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.photoPreviewUrl}
                        alt="photo"
                        className={`w-8 h-10 rounded-lg object-cover border transition-opacity ${
                          croppingIds.has(item.id)
                            ? "opacity-40 border-white/20"
                            : "border-emerald-400/30 group-hover:opacity-60"
                        }`}
                      />
                      {croppingIds.has(item.id) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                  )}
                  {croppingIds.has(item.id) ? (
                    <span className="flex items-center gap-1.5 text-xs text-white/50 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 font-medium">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('step_upload_cropping')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg border border-emerald-400/20 font-medium group-hover:bg-emerald-400/20 transition-colors">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {t('step_upload_photo_label')}
                      <RefreshCw className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </span>
                  )}
                  {!croppingIds.has(item.id) && (
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
                      onChange={(e) => {
                        if (e.target.files?.[0])
                          handlePhotoFile(item.id, e.target.files[0], e.target);
                      }}
                    />
                  )}
                </label>
              ) : (
                <label className="relative flex items-center gap-2 text-xs text-white/60 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 hover:text-white transition-all font-medium cursor-pointer">
                  <Camera className="w-3.5 h-3.5" /> {t('step_upload_add_photo')}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
                    onChange={(e) => {
                      if (e.target.files?.[0])
                        handlePhotoFile(item.id, e.target.files[0], e.target);
                    }}
                  />
                </label>
              )}

              {/* Work Permit — always shows a label even when set, to allow reselection */}
              {item.workPermitFile ? (
                <label
                  className="relative flex items-center gap-2 cursor-pointer group"
                  title={t('step_upload_tap_change')}
                >
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg border border-emerald-400/20 font-medium group-hover:bg-emerald-400/20 transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {t('step_upload_wp_label')}
                    <RefreshCw className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="sr-only"
                    onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
                    onChange={(e) => {
                      if (e.target.files?.[0])
                        handleWorkPermitFile(item.id, e.target.files[0], e.target);
                    }}
                  />
                </label>
              ) : (
                <label className="relative flex items-center gap-2 text-xs text-white/60 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 hover:text-white transition-all font-medium cursor-pointer">
                  <FileText className="w-3.5 h-3.5" /> {t('step_upload_add_wp')}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="sr-only"
                    onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
                    onChange={(e) => {
                      if (e.target.files?.[0])
                        handleWorkPermitFile(item.id, e.target.files[0], e.target);
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        ))}

        {/* Add another applicant row (visible when list has items AND not at quota limit) */}
        {items.length > 0 && !atQuotaLimit && (
          <label className="flex items-center justify-center gap-2 py-4 rounded-[18px] border border-dashed border-white/15 text-white/40 text-sm font-medium hover:border-[var(--accent)]/50 hover:text-white/70 hover:bg-white/[0.02] transition-all cursor-pointer group">
            <span className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[var(--accent)]/20 transition-colors">
              <Plus className="w-4 h-4 text-white/40 group-hover:text-[var(--accent)] transition-colors" />
            </span>
            {t('step_upload_add_another')}
            <input
              ref={fabInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="sr-only"
              onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
              onChange={(e) => handlePassportFiles(e.target.files, fabInputRef.current)}
            />
          </label>
        )}

        {/* Empty drop zone */}
        {items.length === 0 && (
          <label
            className={`relative border-2 border-dashed rounded-[32px] p-14 flex flex-col items-center justify-center text-center transition-all duration-300 group overflow-hidden cursor-pointer ${
              dragging
                ? "border-[var(--accent)] bg-[var(--accent)]/5 shadow-[0_0_40px_rgba(99,102,241,0.15)]"
                : "border-white/15 bg-gradient-to-b from-white/[0.02] to-transparent hover:border-[var(--accent)]/50 hover:from-white/[0.04] hover:shadow-[0_0_40px_rgba(99,102,241,0.08)]"
            }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <input
              ref={mainInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="sr-only"
              onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
              onChange={(e) => handlePassportFiles(e.target.files, mainInputRef.current)}
            />
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-300 relative ${
                  dragging
                    ? "bg-[var(--accent)]/30 border-2 border-[var(--accent)] shadow-[0_0_30px_rgba(99,102,241,0.4)] scale-110"
                    : "bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 border border-[var(--accent)]/20 group-hover:scale-105 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.25)]"
                }`}
              >
                <div className="absolute inset-0 bg-[var(--accent)]/15 rounded-full animate-ping opacity-30" />
                <UploadCloud
                  className={`w-10 h-10 transition-colors ${dragging ? "text-white" : "text-[var(--accent)]"}`}
                />
              </div>
              <p className="text-white font-semibold mb-1.5 text-lg">
                {dragging ? t('step_upload_dropping') : t('step_upload_drop')}
              </p>
              <p className="text-white/40 text-sm">{t('step_upload_types')}</p>
            </div>
          </label>
        )}
      </div>  {/* end scrollable */}

      {/* FAB — add more (visible on mobile as floating button, hidden when at quota limit) */}
      {items.length > 0 && !atQuotaLimit && (
        <label className="fixed bottom-[110px] right-6 w-14 h-14 bg-[var(--accent)] text-white rounded-full shadow-[var(--accent-glow)] flex items-center justify-center z-40 hover:scale-105 active:scale-95 transition-transform cursor-pointer">
          <input
            type="file"
            multiple
            accept="image/*,application/pdf"
            className="sr-only"
            onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
            onChange={(e) => handlePassportFiles(e.target.files, null)}
          />
          <Plus className="w-6 h-6" />
        </label>
      )}

      {/* Sticky bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#050507]/90 backdrop-blur-xl border-t border-white/10 p-4 pb-safe z-50">
        <div className="max-w-md mx-auto">
          <button
            disabled={!canProceed}
            onClick={onNext}
            className={`w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all duration-300 ${
              canProceed
                ? "bg-[var(--accent)] text-white shadow-[var(--accent-glow)] active:scale-[0.97]"
                : "bg-white/5 text-white/30"
            }`}
          >
            {t('step_upload_start')} <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
          {items.length > 0 && (
            <p className="text-center text-[11px] text-white/25 mt-2">
              {items.length} {items.length !== 1 ? t('step_upload_count_plural') : t('step_upload_count')} ·{" "}
              {items.filter((x: any) => x.workPermitFile).length} {t('step_upload_with_wp')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
