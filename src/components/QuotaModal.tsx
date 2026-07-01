"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/language";

/**
 * Full-screen modal shown when the user has exhausted their monthly quota.
 * They can go back to the dashboard to upgrade via WhatsApp.
 */
export default function QuotaModal() {
  const { isRTL } = useLanguage();

  return (
    <div
      className="quota-modal-overlay"
      dir={isRTL ? "rtl" : "ltr"}
      style={{ fontFamily: isRTL ? "var(--font-arabic), sans-serif" : undefined }}
    >
      <div className="quota-modal">
        {/* Icon */}
        <div className="quota-modal-icon-wrap">
          <div className="quota-modal-icon">
            {/* Lightning-bolt-off / quota depleted icon */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12h8M12 8v8" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h2 className="quota-modal-title">
          {isRTL ? "لقد استنفذت حصتك الشهرية" : "Monthly Quota Exhausted"}
        </h2>
        <p className="quota-modal-desc">
          {isRTL
            ? "لقد استخدمت جميع طلبات الإرسال المتاحة لهذا الشهر. قم بترقية خطتك للحصول على المزيد."
            : "You've used all your submission slots for this month. Upgrade your plan to unlock more capacity instantly."}
        </p>

        {/* Stats pill */}
        <div className="quota-modal-stat">
          <span className="quota-modal-stat-icon">📊</span>
          <span>
            {isRTL ? "الحصة المستخدمة بالكامل هذا الشهر" : "100% of plan quota used this month"}
          </span>
        </div>

        {/* WhatsApp upgrade CTA */}
        <a
          href="https://wa.me/923178328164?text=Hi%2C%20I%27ve%20used%20all%20my%20quota%20and%20want%20to%20upgrade%20my%20Vizez%20Manpower%20plan"
          target="_blank"
          rel="noopener noreferrer"
          className="quota-modal-whatsapp"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          {isRTL ? "الترقية عبر واتساب" : "Upgrade on WhatsApp"}
        </a>

        {/* Back to dashboard */}
        <Link href="/dashboard" className="quota-modal-back">
          {isRTL ? "← العودة إلى لوحة التحكم" : "← Back to Dashboard"}
        </Link>

        <p className="quota-modal-note">
          {isRTL ? "متاح ٢٤/٧ · استجابة فورية" : "Available 24/7 · Instant response"}
        </p>
      </div>
    </div>
  );
}
