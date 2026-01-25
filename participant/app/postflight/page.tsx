"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession, loadSession, type SessionData } from "../lib/session";

const DEFAULT_BACKEND_URL = "http://cridit:8001";

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

const TRUST_OUTCOME_QUESTIONS_FINANCE = [
  { id: "overallTrust", label: "Overall trust in the chatbot for corporate finance analysis" },
  { id: "willingnessReuse", label: "Willingness to reuse for similar tasks" },
  { id: "relianceWithVerification", label: "Willingness to rely on outputs with verification" },
  { id: "relianceWithoutVerification", label: "Willingness to rely on outputs without verification" },
] as const;

const TRUST_OUTCOME_QUESTIONS_HR = [
  { id: "overallTrust", label: "I trust this chatbot for HR support tasks" },
  { id: "willingnessReuse", label: "I would reuse this system for similar HR tasks" },
  { id: "relianceWithVerification", label: "I would rely on this system with human review" },
  { id: "relianceWithoutVerification", label: "I would rely on this system without human review" },
] as const;

const TRUST_OUTCOME_QUESTIONS_LEGAL = [
  { id: "overallTrust", label: "Overall trust in the chatbot for legal analysis" },
  { id: "willingnessReuse", label: "Willingness to reuse for similar legal tasks" },
  { id: "relianceWithVerification", label: "Willingness to rely on outputs with verification" },
  { id: "relianceWithoutVerification", label: "Willingness to rely on outputs without verification" },
] as const;

const TRUST_QUALITY_QUESTIONS_FINANCE = [
  { id: "calculationsAccurate", label: "The chatbot's calculations were accurate" },
  { id: "assumptionsExplicit", label: "It made assumptions explicit" },
  { id: "traceabilityShown", label: "It showed steps / traceability" },
  { id: "consistencyMaintained", label: "It was consistent across answers" },
  { id: "uncertaintyCommunicated", label: "It communicated uncertainty appropriately" },
  { id: "riskComprehensive", label: "It helped identify risks comprehensively" },
  { id: "professionalBoundaries", label: "It respected professional boundaries" },
  { id: "taskUtility", label: "The system saved time" },
] as const;

const TRUST_QUALITY_QUESTIONS_HR = [
  { id: "criteriaTransparent", label: "The chatbot applied selection criteria transparently" },
  { id: "explanationsUnderstandable", label: "The explanations were understandable" },
  { id: "fairnessObserved", label: "The system behaved fairly" },
  { id: "professionalBoundaries", label: "The output respected professional boundaries" },
  { id: "toneAppropriate", label: "The tone was appropriate" },
  { id: "taskUtility", label: "The system saved time" },
  { id: "controlOfDecision", label: "I felt in control of the final decision" },
] as const;

const TRUST_QUALITY_QUESTIONS_LEGAL = [
  { id: "calculationsAccurate", label: "The chatbot's legal analysis was accurate" },
  { id: "assumptionsExplicit", label: "It made legal assumptions explicit" },
  { id: "traceabilityShown", label: "It showed steps / traceability" },
  { id: "consistencyMaintained", label: "It was consistent across answers" },
  { id: "uncertaintyCommunicated", label: "It communicated uncertainty appropriately" },
  { id: "riskComprehensive", label: "It helped identify legal risks comprehensively" },
  { id: "professionalBoundaries", label: "It respected professional boundaries" },
  { id: "taskUtility", label: "The system saved time" },
] as const;

const REMEDIATION_QUESTIONS_FINANCE = [
  { id: "remediationAcknowledgedError", label: "The chatbot acknowledged the error/limitation" },
  { id: "remediationFixedProblem", label: "The correction fixed the problem" },
  { id: "remediationExplanationHelpful", label: "The explanation helped me understand why it happened" },
  { id: "remediationMoreAuditable", label: "The revised answer was more auditable" },
  { id: "remediationTrustRestored", label: "Trust was restored after remediation" },
] as const;

const REMEDIATION_QUESTIONS_HR = [
  { id: "remediationAcknowledgedError", label: "The system acknowledged its limitation or error" },
  { id: "remediationExplanationHelpful", label: "The explanation helped me understand what went wrong" },
  { id: "remediationFixedProblem", label: "The correction improved the output" },
  { id: "remediationHonestLimits", label: "The system was honest about its limits" },
  { id: "remediationTrustRestored", label: "My trust was restored after the remediation" },
] as const;

const REMEDIATION_QUESTIONS_LEGAL = [
  { id: "remediationAcknowledgedError", label: "The chatbot acknowledged the error/limitation" },
  { id: "remediationFixedProblem", label: "The correction fixed the problem" },
  { id: "remediationExplanationHelpful", label: "The explanation helped me understand why it happened" },
  { id: "remediationMoreAuditable", label: "The revised answer was more auditable" },
  { id: "remediationTrustRestored", label: "Trust was restored after remediation" },
] as const;
const readLikert = (id: string) => {
  const raw = (document.getElementById(id) as HTMLSelectElement | null)?.value;
  return raw ? Number(raw) : null;
};

const readText = (id: string) =>
  (document.getElementById(id) as HTMLTextAreaElement | null)?.value ?? "";

const readRadio = (name: string) => {
  const input = document.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`);
  return input?.value ?? null;
};

const AGREEMENT_LABELS = [
  "Strongly disagree",
  "Disagree",
  "Somewhat disagree",
  "Neutral",
  "Somewhat agree",
  "Agree",
  "Strongly agree",
];

const likertSelect = (id: string, labels: string[], defaultValue = "4") => (
  <select id={id} className="form-select" defaultValue={defaultValue}>
    {labels.map((label, index) => (
      <option key={label} value={index + 1}>
        {index + 1} - {label}
      </option>
    ))}
  </select>
);

const renderLikertQuestion = (id: string, label: string) => (
  <div key={id} className="mb-3">
    <label className="form-label">{label}</label>
    {likertSelect(id, AGREEMENT_LABELS)}
  </div>
);

export default function PostflightPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [submitStatus, setSubmitStatus] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const loaded = loadSession();
    setSession(loaded);
  }, []);

  const handleSubmit = async () => {
    if (!session) {
      return;
    }

    const surveyInput = {
      overallTrust: readLikert("overallTrust"),
      willingnessReuse: readLikert("willingnessReuse"),
      relianceWithVerification: readLikert("relianceWithVerification"),
      relianceWithoutVerification: readLikert("relianceWithoutVerification"),
      calculationsAccurate: readLikert("calculationsAccurate"),
      assumptionsExplicit: readLikert("assumptionsExplicit"),
      traceabilityShown: readLikert("traceabilityShown"),
      consistencyMaintained: readLikert("consistencyMaintained"),
      uncertaintyCommunicated: readLikert("uncertaintyCommunicated"),
      riskComprehensive: readLikert("riskComprehensive"),
      professionalBoundaries: readLikert("professionalBoundaries"),
      taskUtility: readLikert("taskUtility"),
      criteriaTransparent: readLikert("criteriaTransparent"),
      explanationsUnderstandable: readLikert("explanationsUnderstandable"),
      fairnessObserved: readLikert("fairnessObserved"),
      toneAppropriate: readLikert("toneAppropriate"),
      controlOfDecision: readLikert("controlOfDecision"),
      violationOccurred: null,
      remediationAcknowledgedError: readLikert("remediationAcknowledgedError"),
      remediationFixedProblem: readLikert("remediationFixedProblem"),
      remediationExplanationHelpful: readLikert("remediationExplanationHelpful"),
      remediationMoreAuditable: readLikert("remediationMoreAuditable"),
      remediationTrustRestored: readLikert("remediationTrustRestored"),
      remediationHonestLimits: readLikert("remediationHonestLimits"),
      behaviorAfterIssue: readRadio("behaviorAfterIssue"),
      remediationMostImportant: readRadio("remediationMostImportant"),
      trustChangeExplanation: readText("trustChangeExplanation"),
      trustDecreaseExplanation: readText("trustDecreaseExplanation"),
      improvementSuggestion: readText("improvementSuggestion"),
    };

    const payload = {
      sessionId: session.sessionId,
      participantId: session.participantId || null,
      conflictRedistribution: "pcr5",
      benchmarkMetricRequest: {
        evidenceSet: [],
        evidenceWeights: [],
      },
      surveyInput,
    };

    try {
      setSubmitStatus("Submitting post-flight questionnaire...");
      setSubmitError("");
      const baseUrl = (session.backendBaseUrl || DEFAULT_BACKEND_URL).trim().replace(/\/$/, "");
      await sendJSON(baseUrl, "/cridit/postflight", payload);
      setSubmitStatus("Post-flight questionnaire submitted.");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSubmitError(message);
      setSubmitStatus("Saved locally (backend unavailable).");
    }

    try {
      window.localStorage.setItem(
        `cridit-postflight-${session.sessionId}`,
        JSON.stringify(payload),
      );
    } catch {
      // ignore storage errors
    }

    clearSession();
    router.replace("/thank-you");
  };

  if (!session) {
    return (
      <div className="page">
        <header className="hero">
          <div>
            <p className="eyebrow">Participant Questionnaire</p>
            <h1>Post-flight Survey</h1>
            <p className="subhead">
              Start with the pre-flight survey to open a session.
            </p>
          </div>
        </header>
        <main className="grid">
          <section className="panel">
            <p className="muted">
              No active session found. Complete the pre-flight questionnaire
              first.
            </p>
            <div className="form-actions">
              <button className="primary" onClick={() => router.replace("/preflight")}>
                Go to pre-flight
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const scenarioKey = `${session.domain ?? ""} ${session.taskId ?? ""}`.toLowerCase();
  const isHiring = scenarioKey.includes("hiring");
  const isLegal = scenarioKey.includes("legal");
  const trustOutcomeQuestions = isHiring
    ? TRUST_OUTCOME_QUESTIONS_HR
    : isLegal
      ? TRUST_OUTCOME_QUESTIONS_LEGAL
      : TRUST_OUTCOME_QUESTIONS_FINANCE;
  const trustQualityQuestions = isHiring
    ? TRUST_QUALITY_QUESTIONS_HR
    : isLegal
      ? TRUST_QUALITY_QUESTIONS_LEGAL
      : TRUST_QUALITY_QUESTIONS_FINANCE;
  const remediationQuestions = isHiring
    ? REMEDIATION_QUESTIONS_HR
    : isLegal
      ? REMEDIATION_QUESTIONS_LEGAL
      : REMEDIATION_QUESTIONS_FINANCE;

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Participant Questionnaire</p>
          <h1>Post-flight Survey</h1>
          <p className="subhead">
            {isHiring
              ? "HR trust evaluation after completing the scenario interaction (scale 1-7)."
              : isLegal
                ? "Legal trust evaluation after completing the scenario interaction (scale 1-7)."
                : "Corporate finance trust evaluation after completing the scenario interaction (scale 1-7)."}
          </p>
        </div>
      </header>

      <main className="grid">
        <section className="panel full-span">
          <h2>Trust Outcome</h2>
          <div>{trustOutcomeQuestions.map((question) => renderLikertQuestion(question.id, question.label))}</div>
        </section>

        <section className="panel full-span">
          <h2>
            {isHiring
              ? "HR Trust Qualities"
              : isLegal
                ? "Legal Trust Qualities"
                : "Corporate-finance Trust Qualities"}
          </h2>
          <div>{trustQualityQuestions.map((question) => renderLikertQuestion(question.id, question.label))}</div>
        </section>

        <section className="panel full-span">
          <h2>Remediation Effectiveness</h2>
          <p className="muted">
            These items evaluate the trust calibration mechanism itself, not whether an error occurred.
          </p>
          <div>{remediationQuestions.map((question) => renderLikertQuestion(question.id, question.label))}</div>
          <div>
            <fieldset className="choice-group mb-3">
              <legend>After the interaction, which best describes how you would use this system?</legend>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="behaviorAfterIssue"
                  value="use_as_is"
                  id="behaviorUseAsIs"
                />
                <label className="form-check-label" htmlFor="behaviorUseAsIs">
                  Use as-is
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="behaviorAfterIssue"
                  value="use_with_verification"
                  id="behaviorUseWithVerification"
                />
                <label className="form-check-label" htmlFor="behaviorUseWithVerification">
                  Use with verification
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="behaviorAfterIssue"
                  value="use_for_drafting"
                  id="behaviorUseForDrafting"
                />
                <label className="form-check-label" htmlFor="behaviorUseForDrafting">
                  Use only for drafting text
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="behaviorAfterIssue"
                  value="stop_using"
                  id="behaviorStopUsing"
                />
                <label className="form-check-label" htmlFor="behaviorStopUsing">
                  Stop using
                </label>
              </div>
            </fieldset>
            <fieldset className="choice-group">
              <legend>Which remediation element mattered most?</legend>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="remediationMostImportant"
                  value="correction"
                  id="remediationCorrection"
                />
                <label className="form-check-label" htmlFor="remediationCorrection">
                  Correction
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="remediationMostImportant"
                  value="explanation"
                  id="remediationExplanation"
                />
                <label className="form-check-label" htmlFor="remediationExplanation">
                  Explanation
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="remediationMostImportant"
                  value="evidence_separation"
                  id="remediationEvidenceSeparation"
                />
                <label className="form-check-label" htmlFor="remediationEvidenceSeparation">
                  Evidence separation
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="remediationMostImportant"
                  value="uncertainty"
                  id="remediationUncertainty"
                />
                <label className="form-check-label" htmlFor="remediationUncertainty">
                  Uncertainty
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="remediationMostImportant"
                  value="escalation"
                  id="remediationEscalation"
                />
                <label className="form-check-label" htmlFor="remediationEscalation">
                  Escalation
                </label>
              </div>
            </fieldset>
          </div>
        </section>

        <section className="panel full-span">
          <h2>Open Questions</h2>
          <div>
            {isHiring ? (
              <>
                <div className="mb-3">
                  <label className="form-label">What increased your trust the most?</label>
                  <textarea id="trustChangeExplanation" className="form-control"></textarea>
                </div>
                <div className="mb-3">
                  <label className="form-label">What decreased your trust the most?</label>
                  <textarea id="trustDecreaseExplanation" className="form-control"></textarea>
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    What would make this system acceptable in a real HR process?
                  </label>
                  <textarea id="improvementSuggestion" className="form-control"></textarea>
                </div>
              </>
            ) : isLegal ? (
              <>
                <div className="mb-3">
                  <label className="form-label">
                    What specifically increased or decreased your trust?
                  </label>
                  <textarea id="trustChangeExplanation" className="form-control"></textarea>
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    What would you change to make the system usable in legal contexts?
                  </label>
                  <textarea id="improvementSuggestion" className="form-control"></textarea>
                </div>
              </>
            ) : (
              <>
                <div className="mb-3">
                  <label className="form-label">
                    What specifically increased or decreased your trust?
                  </label>
                  <textarea id="trustChangeExplanation" className="form-control"></textarea>
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    What would you change to make the system usable in corporate finance?
                  </label>
                  <textarea id="improvementSuggestion" className="form-control"></textarea>
                </div>
              </>
            )}
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleSubmit}>
              Submit post-flight questionnaire
            </button>
          </div>
          {submitStatus ? <p className="status">{submitStatus}</p> : null}
          {submitError ? <p className="status">{submitError}</p> : null}
        </section>
      </main>
    </div>
  );
}
