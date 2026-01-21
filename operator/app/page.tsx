"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { scenarios } from "./scenario/data";
import openAiLogo from "./scenario/open-ai-logo.png";

type ScenarioInput = {
  threshold: string;
};

export default function Home() {
  const [participantBaseUrl, setParticipantBaseUrl] = useState("http://localhost:3000");
  const [backendBaseUrl, setBackendBaseUrl] = useState("http://localhost:8001");
  const [inputs, setInputs] = useState<Record<string, ScenarioInput>>(() =>
    Object.fromEntries(
      scenarios.map((scenario) => [
        scenario.key,
        { threshold: "" },
      ]),
    ),
  );
  const [isLoaded, setIsLoaded] = useState(false);

  const defaults = useMemo(
    () =>
      Object.fromEntries(
        scenarios.map((scenario) => [
          scenario.key,
          {
            threshold: scenario.threshold,
          },
        ]),
      ),
    [],
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("cridit-operator-inputs");
      if (!raw) {
        setIsLoaded(true);
        return;
      }
      const parsed = JSON.parse(raw) as Record<string, ScenarioInput>;
      setInputs((prev) => ({ ...prev, ...parsed }));
    } catch {
      // ignore corrupted storage
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      window.localStorage.setItem("cridit-operator-inputs", JSON.stringify(inputs));
    } catch {
      // ignore storage errors
    }
  }, [inputs, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    const timer = window.setTimeout(() => {
      scenarios.forEach(async (scenario) => {
        const entry = inputs[scenario.key];
        if (!entry) return;
        const threshold = parseOrDefault(entry.threshold, defaults[scenario.key].threshold);
        let preflight = scenario.preflightHuman;
        let adopted: number | undefined;
        let rejected: number | undefined;
        try {
          const response = await fetch(`${backendBaseUrl}/inputs/${scenario.key}`);
          if (response.ok) {
            const existing = (await response.json().catch(() => null)) as
              | { preflightHuman?: number; adopted?: number; rejected?: number }
              | null;
            if (typeof existing?.preflightHuman === "number") {
              preflight = existing.preflightHuman;
            }
            if (typeof existing?.adopted === "number") {
              adopted = existing.adopted;
            }
            if (typeof existing?.rejected === "number") {
              rejected = existing.rejected;
            }
          }
        } catch {
          // keep fallback preflight
        }
        fetch(`${backendBaseUrl}/inputs/${scenario.key}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            baselineMachine: scenario.baselineMachine,
            preflightHuman: preflight,
            threshold,
            adopted,
            rejected,
          }),
        }).catch(() => {});
      });
    }, 500);

    return () => window.clearTimeout(timer);
  }, [backendBaseUrl, defaults, inputs, isLoaded]);

  const parseOrDefault = (value: string, fallback: number) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(1, Math.max(0, parsed));
  };

  const buildParticipantLink = (scenarioKey: string) =>
    `${participantBaseUrl}/preflight/${scenarioKey}`;

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-grid">
          <div className="hero-col">
            <p className="eyebrow">CRiDiT Mock-up</p>
            <h1>Three Scenario Test Beds</h1>
            <p className="subhead">Operator console for baseline and threshold inputs.</p>
          </div>
          <div className="hero-col hero-right">
            <div className="openai-badge" aria-label="Powered by OpenAI">
              <Image className="openai-mark" src={openAiLogo} alt="OpenAI" width={28} height={28} />
              <span className="openai-label">Powered by</span>
              <span className="openai-wordmark">OpenAI</span>
            </div>
          </div>
        </div>
      </header>

      <main className="grid landing">
        {scenarios.map((scenario) => (
          <section key={scenario.key} className="panel landing-card">
            <h3>{scenario.title}</h3>
            <p className="muted">{scenario.subhead}</p>
            <div className="feedback-controls">
              <label>
                Threshold (high-stake risk)
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  placeholder="e.g. 0.07"
                  value={inputs[scenario.key]?.threshold ?? ""}
                  onChange={(event) =>
                    setInputs((prev) => ({
                      ...prev,
                      [scenario.key]: {
                        ...prev[scenario.key],
                        threshold: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label>
                Participant base URL
                <input
                  type="text"
                  value={participantBaseUrl}
                  onChange={(event) => setParticipantBaseUrl(event.target.value)}
                />
              </label>
              <label>
                Backend base URL
                <input
                  type="text"
                  value={backendBaseUrl}
                  onChange={(event) => setBackendBaseUrl(event.target.value)}
                />
              </label>
            </div>
            <div className="feedback-controls">
              <label>
                Participant link
                <input
                  type="text"
                  readOnly
                  value={buildParticipantLink(scenario.key)}
                />
              </label>
            </div>
            <div className="button-row">
              <a className="primary" href={`/scenario/${scenario.key}/operator`}>
                Open operator view
              </a>
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
