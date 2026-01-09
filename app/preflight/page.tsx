"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PreflightAnswers,
  SessionParams,
  commitNextSessionId,
  loadAdoptionHistory,
  peekNextSessionId,
  resetSessionCounter,
  saveSession,
} from "../lib/session";

const MMLU_SCORE_RAW = 76.89;

const sendJSON = async (baseUrl: string, path: string, payload: unknown) => {
  const url = baseUrl ? `${baseUrl}${path}` : path;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }
  return response.json().catch(() => ({}));
};

export default function PreflightPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState("");
  const domain = "mental health";
  const backendBaseUrl = "http://localhost:8080";
  const [preflight, setPreflight] = useState<PreflightAnswers>({
    propensityToTrust: 3,
    privacyConcern: 3,
    riskAversion: 3,
    taskCriticality: 3,
    perceivedUsefulness: 4,
    priorExperience: 2,
  });
  const [preflightScore, setPreflightScore] = useState<number | null>(null);
  const [preflightStatus, setPreflightStatus] = useState<string>("Not run.");
  const [params, setParams] = useState<SessionParams | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setSessionId(peekNextSessionId());
  }, []);

  const handleCompute = async () => {
    if (!sessionId) {
      return;
    }
    if (sessionId !== "1") {
      setErrorMessage("Preflight is locked. Only session ID 1 can run it.");
      return;
    }

    const baseUrl = backendBaseUrl.trim().replace(/\/$/, "");
    try {
      const response = await sendJSON(
        baseUrl,
        "/cridit/preflight/params",
        preflight,
      );
      setPreflightScore(Number(response.preflightScore));
      setParams({
        behaviorBaseRate: Number(response.behaviorBaseRate),
        feedbackBaseRate: Number(response.feedbackBaseRate),
        physioBaseRate: Number(response.physioBaseRate),
        initialUncertainty: Number(response.initialUncertainty),
        initialThreshold: Number(response.initialThreshold),
      });
      setPreflightStatus(Number(response.preflightScore).toFixed(3));
      setErrorMessage("");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setPreflightStatus(`Error: ${message}`);
    }
  };

  const handleStartSession = async () => {
    if (!sessionId) {
      return;
    }
    let resolvedParams = params;
    let resolvedPreflightScore = preflightScore;
    if (!resolvedParams) {
      const baseUrl = backendBaseUrl.trim().replace(/\/$/, "");
      try {
        const response = await sendJSON(
          baseUrl,
          "/cridit/preflight/params",
          preflight,
        );
        resolvedPreflightScore = Number(response.preflightScore);
        resolvedParams = {
          behaviorBaseRate: Number(response.behaviorBaseRate),
          feedbackBaseRate: Number(response.feedbackBaseRate),
          physioBaseRate: Number(response.physioBaseRate),
          initialUncertainty: Number(response.initialUncertainty),
          initialThreshold: Number(response.initialThreshold),
        };
        setPreflightScore(resolvedPreflightScore);
        setParams(resolvedParams);
        setPreflightStatus(Number(response.preflightScore).toFixed(3));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setPreflightStatus(`Error: ${message}`);
        setErrorMessage(message);
        return;
      }
    }
    if (sessionId !== "1") {
      const history = loadAdoptionHistory();
      const total = history.adopted + history.rejected;
      const baseRate = total > 0 ? history.adopted / total : 0.5;
      resolvedParams = {
        ...resolvedParams,
        behaviorBaseRate: Number(baseRate.toFixed(3)),
      };
    }
    const resolvedSessionId = commitNextSessionId();
    saveSession({
      sessionId: resolvedSessionId,
      participantId: participantId.trim(),
      backendBaseUrl,
      domain,
      taskId: "",
      preflightAnswers: preflight,
      preflightScore: resolvedPreflightScore ?? 0.5,
      params: resolvedParams,
      benchmarkEvidence: [],
    });
    router.push("/benchmark");
  };

  const handleResetSessionId = () => {
    resetSessionCounter();
    setSessionId(peekNextSessionId());
  };

  return (
    sessionId ? (
    <>
      <div className="backdrop">
        <div className="halo"></div>
        <div className="mesh"></div>
      </div>

      <header className="hero">
        <div>
          <p className="eyebrow">CRiDiT Interactive Console</p>
          <h1>Preflight Calibration</h1>
          <p className="lede">
            Answer the preflight questionnaire. The system will compute initial
            base rates, uncertainty, and calibration threshold from your trust
            profile.
          </p>
        </div>
        <div className="session-badge">
          <span>Benchmark Source</span>
          <strong>MMLU {MMLU_SCORE_RAW}</strong>
        </div>
      </header>

      <main className="layout">
        <section className="panel">
          <h2>1. Session Metadata</h2>
          <div className="grid two">
            <label>
              Participant ID
              <input
                value={participantId}
                onChange={(event) => setParticipantId(event.target.value)}
                placeholder="P-001"
              />
            </label>
            <label>
              Session ID
              <input value={sessionId} disabled placeholder="Auto-generated" />
            </label>
            <label>
              Domain
              <input value={domain} disabled />
            </label>
          </div>
          <div className="actions">
            <button className="ghost" onClick={handleResetSessionId}>
              Reset Session ID
            </button>
          </div>
        </section>

        {sessionId === "1" ? (
          <section className="panel">
            <h2>2. Preflight Questionnaire (1-5)</h2>
            <div className="grid three">
              <label>
                Propensity to Trust
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={preflight.propensityToTrust}
                  onChange={(event) =>
                    setPreflight((prev) => ({
                      ...prev,
                      propensityToTrust: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label>
                Privacy Concern
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={preflight.privacyConcern}
                  onChange={(event) =>
                    setPreflight((prev) => ({
                      ...prev,
                      privacyConcern: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label>
                Risk Aversion
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={preflight.riskAversion}
                  onChange={(event) =>
                    setPreflight((prev) => ({
                      ...prev,
                      riskAversion: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label>
                Task Criticality
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={preflight.taskCriticality}
                  onChange={(event) =>
                    setPreflight((prev) => ({
                      ...prev,
                      taskCriticality: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label>
                Perceived Usefulness
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={preflight.perceivedUsefulness}
                  onChange={(event) =>
                    setPreflight((prev) => ({
                      ...prev,
                      perceivedUsefulness: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label>
                Prior Experience
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={preflight.priorExperience}
                  onChange={(event) =>
                    setPreflight((prev) => ({
                      ...prev,
                      priorExperience: Number(event.target.value),
                    }))
                  }
                />
              </label>
            </div>

            <div className="actions">
              <button className="primary" onClick={handleCompute}>
                Compute Initial Parameters
              </button>
            </div>
            <p className="status">Preflight score: {preflightStatus}</p>
            {errorMessage ? <p className="status">{errorMessage}</p> : null}
          </section>
        ) : null}

        <section className="panel">
          <h2>{sessionId === "1" ? "3. Start Session" : "2. Start Session"}</h2>
          <div className="actions">
            <button className="primary" onClick={handleStartSession}>
              Continue to Benchmark Overview
            </button>
          </div>
        </section>
      </main>
    </>
    ) : null
  );
}
