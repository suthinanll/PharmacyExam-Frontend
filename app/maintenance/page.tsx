import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ปิดปรับปรุงชั่วคราว — เภสัชพร้อมสอบ",
  description: "เว็บไซต์อยู่ระหว่างการปรับปรุงระบบ จะกลับมาให้บริการในเร็วๆ นี้",
};

export default function MaintenancePage() {
  return (
    <html lang="th">
      <head />
      <body>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            font-family: var(--font-primary, 'Kanit', 'Sarabun', sans-serif);
            min-height: 100vh;
            background-color: #76B25A;
            background-image:
              radial-gradient(circle at 20% 30%, rgba(255,255,255,0.10) 0%, transparent 40%),
              radial-gradient(circle at 80% 70%, rgba(0,0,0,0.08) 0%, transparent 40%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
          }

          /* ─── Card ─── */
          .card {
            background: #ffffff;
            border-radius: 1.5rem;
            padding: 2.75rem 2.5rem 2.25rem;
            width: 500px;
            max-width: 440px;
            box-shadow:
              0 4px 6px rgba(0,0,0,0.06),
              0 20px 60px rgba(0,0,0,0.12);
            text-align: center;
          }

          /* ─── Logo / Icon ─── */
          .icon-wrap {
            width: 72px;
            height: 72px;
            background: #f0fdf4;
            border: 2px solid #d1fae5;
            border-radius: 1.25rem;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
          }

          .gear-svg {
            animation: spin 8s linear infinite;
            color: #76B25A;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }

          /* ─── Badge ─── */
          .badge {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            background: #f0fdf4;
            border: 1.5px solid #bbf7d0;
            color: #16a34a;
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.3rem 0.85rem;
            border-radius: 9999px;
            margin-bottom: 1.25rem;
            letter-spacing: 0.01em;
          }

          .badge-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #22c55e;
            animation: blink 1.5s ease-in-out infinite;
          }

          @keyframes blink {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.15; }
          }

          /* ─── Typography ─── */
          .brand-name {
            font-size: 1.5rem;
            font-weight: 700;
            color: #76B25A;
            margin-bottom: 0.35rem;
            letter-spacing: 0.01em;
          }

          h1 {
            font-size: 1.5rem;
            font-weight: 700;
            color: #111827;
            line-height: 1.3;
            margin-bottom: 0.65rem;
          }

          .subtitle {
            font-size: 0.9rem;
            color: #6b7280;
            line-height: 1.7;
            margin-bottom: 2rem;
          }

          /* ─── Divider ─── */
          .divider {
            border: none;
            border-top: 1.5px solid #f3f4f6;
            margin-bottom: 1.5rem;
          }

          /* ─── Progress ─── */
          .progress-label-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.82rem;
            color: #6b7280;
            font-weight: 500;
            margin-bottom: 0.6rem;
          }

          .progress-pct {
            color: #16a34a;
            font-weight: 700;
          }

          .progress-track {
            height: 7px;
            background: #f3f4f6;
            border-radius: 9999px;
            overflow: hidden;
            margin-bottom: 1.25rem;
          }

          .progress-fill {
            height: 100%;
            width: 75%;
            background: linear-gradient(90deg, #76B25A, #4ade80);
            border-radius: 9999px;
            animation: grow 2s ease-out both;
          }

          @keyframes grow {
            from { width: 0; }
            to   { width: 75%; }
          }

          /* ─── Steps ─── */
          .steps {
            display: flex;
            flex-direction: column;
            gap: 0.55rem;
            text-align: left;
            margin-bottom: 2rem;
          }

          .step {
            display: flex;
            align-items: center;
            gap: 0.65rem;
            font-size: 0.82rem;
            color: #6b7280;
          }

          .step-icon {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.65rem;
          }

          .step.done .step-icon {
            background: #dcfce7;
            color: #16a34a;
          }

          .step.active .step-icon {
            background: #fef3c7;
            color: #d97706;
          }

          .step.done  span { color: #374151; }
          .step.active span { color: #374151; font-weight: 600; }

          /* ─── Contact line ─── */
          .contact {
            font-size: 0.8rem;
            color: #9ca3af;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.4rem;
            margin-bottom: 0.6rem;
          }

          .contact a {
            color: #76B25A;
            font-weight: 600;
            text-decoration: none;
          }
          .contact a:hover { text-decoration: underline; }

          /* ─── Footer brand ─── */
          .footer-brand {
            margin-top: 1.25rem;
            font-size: 0.78rem;
            color: rgba(255,255,255,0.55);
            text-align: center;
          }
        `}</style>

        {/* ── Card ─────────────────────────────────────── */}
        <div className="card">

          {/* Icon */}
          <div className="icon-wrap">
            <svg
              className="gear-svg"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
              <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          </div>

          {/* Brand */}
          <p className="brand-name">เภสัชพร้อมสอบ</p>

          {/* Badge */}
          <div className="badge">
            <span className="badge-dot" />
            กำลังดำเนินการปรับปรุง
          </div>

          <h1>เว็บไซต์ปิดปรับปรุง<br />ชั่วคราว</h1>

          <p className="subtitle">
            ทีมงานกำลังอัปเกรดระบบเพื่อมอบประสบการณ์<br />
            การเรียนรู้ที่ดียิ่งขึ้น กรุณารอสักครู่
          </p>

          <hr className="divider" />

          {/* Progress */}
          <div className="progress-label-row">
            <span>ความคืบหน้า</span>
            <span className="progress-pct">75%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" />
          </div>

          {/* Step checklist */}
          <div className="steps">
            <div className="step done">
              <div className="step-icon">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span>สำรองข้อมูลระบบเรียบร้อย</span>
            </div>
            <div className="step done">
              <div className="step-icon">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span>อัปเดตโครงสร้างฐานข้อมูล</span>
            </div>
            <div className="step active">
              <div className="step-icon">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <span>ทดสอบและตรวจสอบระบบ <em style={{ fontStyle: "normal", color: "#d97706" }}>(กำลังดำเนินการ)</em></span>
            </div>
          </div>

          {/* Contact */}
          <p className="contact">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            ติดต่อแอดมิน:&nbsp;
            <a href="mailto:admin@pharmexam.com">admin@pharmexam.com</a>
          </p>
        </div>

        {/* Footer below card */}
        <p className="footer-brand">© 2025 เภสัชพร้อมสอบ · All rights reserved</p>
      </body>
    </html>
  );
}
