import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'VizEz <noreply@vizez.cloud>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3006'

export async function sendOtpEmail(to: string, otp: string, fullName: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `${otp} is your VizEz verification code`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#050507;color:#ffffff;border-radius:16px;padding:40px;border:1px solid rgba(255,255,255,0.08)">
        <div style="text-align:center;margin-bottom:32px">
          <div style="font-size:28px;font-weight:800;letter-spacing:-0.5px;color:#6366f1">VIZEZ</div>
          <div style="color:rgba(255,255,255,0.5);font-size:13px;margin-top:4px">MANPOWER SYSTEM</div>
        </div>
        <h2 style="font-size:20px;font-weight:700;margin:0 0 8px">Verify your email address</h2>
        <p style="color:rgba(255,255,255,0.7);line-height:1.6;margin:0 0 28px">Hi ${fullName},<br>Use the code below to verify your email. It expires in <strong>10 minutes</strong>.</p>
        <div style="background:rgba(99,102,241,0.12);border:2px solid rgba(99,102,241,0.4);border-radius:16px;padding:28px;text-align:center;margin-bottom:28px">
          <div style="font-size:48px;font-weight:900;letter-spacing:14px;color:#a5b4fc;font-variant-numeric:tabular-nums">${otp}</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:8px">Enter this code on the verification page</div>
        </div>
        <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0">This code expires in 10 minutes. If you didn't create a VizEz account, you can safely ignore this email.</p>
      </div>
    `,
  })
}


export async function sendPasswordResetEmail(to: string, token: string) {
  const url = `${APP_URL}/reset-password?token=${token}`
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Reset your VizEz password',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#050507;color:#ffffff;border-radius:16px;padding:40px;border:1px solid rgba(255,255,255,0.08)">
        <div style="text-align:center;margin-bottom:32px">
          <div style="font-size:28px;font-weight:800;letter-spacing:-0.5px;color:#6366f1">VIZEZ</div>
          <div style="color:rgba(255,255,255,0.5);font-size:13px;margin-top:4px">MANPOWER SYSTEM</div>
        </div>
        <h2 style="font-size:22px;font-weight:700;margin:0 0 12px">Reset your password</h2>
        <p style="color:rgba(255,255,255,0.7);line-height:1.6;margin:0 0 24px">Click below to reset your password. This link expires in 1 hour.</p>
        <a href="${url}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:600;font-size:15px">Reset Password</a>
        <p style="color:rgba(255,255,255,0.4);font-size:12px;margin-top:24px">If you didn't request this, please ignore this email. Your password will not change.</p>
        <p style="color:rgba(255,255,255,0.4);font-size:11px;margin-top:8px;word-break:break-all">Or copy: ${url}</p>
      </div>
    `,
  })
}

export async function sendActivationEmail(to: string, agencyName: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Your VizEz account is now active',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#050507;color:#ffffff;border-radius:16px;padding:40px;border:1px solid rgba(255,255,255,0.08)">
        <div style="text-align:center;margin-bottom:32px">
          <div style="font-size:28px;font-weight:800;letter-spacing:-0.5px;color:#6366f1">VIZEZ</div>
          <div style="color:rgba(255,255,255,0.5);font-size:13px;margin-top:4px">MANPOWER SYSTEM</div>
        </div>
        <h2 style="font-size:22px;font-weight:700;margin:0 0 12px">Your account is active! 🎉</h2>
        <p style="color:rgba(255,255,255,0.7);line-height:1.6;margin:0 0 24px">Hi ${agencyName},<br>Your VizEz account has been activated and a plan has been assigned. You can now log in and start using the platform.</p>
        <a href="${APP_URL}/login" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:600;font-size:15px">Log in to VizEz</a>
      </div>
    `,
  })
}
