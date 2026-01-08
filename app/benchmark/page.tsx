"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BenchmarkEvidence,
  SessionData,
  loadSession,
  saveSession,
} from "../lib/session";

const MMLU_SCORE_RAW = 76.89;
const MMLU_SCORE = 0.7689;

const buildEvidence = (uncertainty: number): BenchmarkEvidence => {
  const trustworthy = MMLU_SCORE * (1 - uncertainty);
  const untrustworthy = (1 - MMLU_SCORE) * (1 - uncertainty);
  return {
    evidenceKey: "mmlu",
    trustworthyMass: Number(trustworthy.toFixed(3)),
    untrustworthyMass: Number(untrustworthy.toFixed(3)),
    uncertaintyMass: Number(uncertainty.toFixed(3)),
    weight: 1.0,
  };
};

export default function BenchmarkPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);

  useEffect(() => {
    const loaded = loadSession();
    if (!loaded?.params) {
      router.replace("/preflight");
      return;
    }
    const evidence = buildEvidence(loaded.params.initialUncertainty);
    saveSession({ benchmarkEvidence: [evidence] });
    setSession({ ...loaded, benchmarkEvidence: [evidence] });
  }, [router]);

  const evidence = useMemo(() => {
    if (!session?.benchmarkEvidence?.length) {
      return null;
    }
    return session.benchmarkEvidence[0];
  }, [session]);

  if (!session || !evidence) {
    return null;
  }

  return (
    <>
      <div className="backdrop">
        <div className="halo"></div>
        <div className="mesh"></div>
      </div>

      <header className="hero">
        <div>
          <p className="eyebrow">CRiDiT Interactive Console</p>
          <h1>Benchmark Evidence</h1>
          <p className="lede">
            Benchmark evidence is fixed for the session and derived from the
            selected model evaluation.
          </p>
        </div>
        <div className="session-badge">
          <span>Session</span>
          <strong>{session.sessionId}</strong>
        </div>
      </header>

      <main className="layout">
        <section className="panel">
          <h2>Session Initialization Summary</h2>
          <div className="grid three">
            <label>
              Behavior Base Rate
              <input value={session.params.behaviorBaseRate} readOnly />
            </label>
            <label>
              Feedback Base Rate
              <input value={session.params.feedbackBaseRate} readOnly />
            </label>
            <label>
              Physio Base Rate
              <input value={session.params.physioBaseRate} readOnly />
            </label>
            <label>
              Initial Uncertainty
              <input value={session.params.initialUncertainty} readOnly />
            </label>
            <label>
              Initial Threshold
              <input value={session.params.initialThreshold} readOnly />
            </label>
          </div>
        </section>

        <section className="panel">
          <h2>Benchmark Evidence (Read-only)</h2>
          <div className="grid two">
            <label>
              Evidence Key
              <input value={evidence.evidenceKey} readOnly />
            </label>
            <label>
              Global MMLU Score
              <input value={MMLU_SCORE_RAW} readOnly />
            </label>
            <label>
              Trustworthy Mass
              <input value={evidence.trustworthyMass} readOnly />
            </label>
            <label>
              Untrustworthy Mass
              <input value={evidence.untrustworthyMass} readOnly />
            </label>
            <label>
              Uncertainty Mass
              <input value={evidence.uncertaintyMass} readOnly />
            </label>
            <label>
              Salience Weight
              <input value={evidence.weight} readOnly />
            </label>
          </div>
          <details className="details">
            <summary>Benchmark source details</summary>
            <p className="muted">
              Source: MMLU global score for qwen3-8b. This evidence is applied
              once at session start and combined with the session uncertainty
              to create DST masses.
            </p>
          </details>
          <div className="actions">
            <button className="primary" onClick={() => router.push("/interaction")}>
              Continue to Interaction
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
