"use client";

import { useRouter } from "next/navigation";

export default function ThankYouPage() {
  const router = useRouter();

  return (
    <div className="page">
      <div className="fireworks" aria-hidden="true">
        <span className="firework fw-1"></span>
        <span className="firework fw-2"></span>
        <span className="firework fw-3"></span>
      </div>
      <header className="hero">
        <div>
          <p className="eyebrow">Participant Completed</p>
          <h1 style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>Thank you!</h1>
          <p className="subhead">
            Your responses have been recorded. We appreciate your time and feedback.
          </p>
        </div>
      </header>
      <main className="grid">
        <section className="panel full-span">
          <div className="form-actions">
            <button className="primary" onClick={() => router.replace("/")}>
              Back to home
            </button>
          </div>
        </section>
      </main>
      <style jsx>{`
        .fireworks {
          position: fixed;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .firework {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: transparent;
        }

        .firework::before,
        .firework::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 50%;
          box-shadow:
            0 -32px #ff6b6b,
            22px -22px #ffd93d,
            32px 0 #6bcBef,
            22px 22px #9bdeac,
            0 32px #f7aef8,
            -22px 22px #ff9f1c,
            -32px 0 #3ec1d3,
            -22px -22px #f9c74f;
          transform: scale(0);
          opacity: 0;
          animation: burst 1.6s ease-out infinite;
        }

        .firework::after {
          animation-delay: 0.2s;
          filter: blur(0.2px);
        }

        .fw-1 {
          top: 18%;
          left: 20%;
          animation: rise 2.4s ease-in-out infinite;
        }

        .fw-2 {
          top: 28%;
          right: 18%;
          animation: rise 2.6s ease-in-out infinite 0.4s;
        }

        .fw-3 {
          top: 12%;
          left: 60%;
          animation: rise 2.8s ease-in-out infinite 0.8s;
        }

        @keyframes rise {
          0% {
            transform: translateY(40px);
            opacity: 0;
          }
          40% {
            opacity: 1;
          }
          100% {
            transform: translateY(-20px);
            opacity: 0.9;
          }
        }

        @keyframes burst {
          0% {
            transform: scale(0.2);
            opacity: 0;
          }
          45% {
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
