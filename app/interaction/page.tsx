"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SessionData,
  clearSession,
  loadSession,
  updateAdoptionHistory,
} from "../lib/session";

type ChatBubble = {
  role: "assistant" | "user";
  text: string;
};

type InteractionState = {
  roundIndex: number;
  adoptedTotal: number;
  rejectedTotal: number;
  lastDecision: string | null;
  lastInteractionId: string | null;
  lastAction: "adopted" | "rejected" | null;
};

const clamp = (value: string | number) =>
  Math.min(1, Math.max(0, Number(value)));

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

const determineMiscalibrationState = (decision: string | null) => {
  if (!decision) {
    return null;
  }
  if (decision === "DECREASE HUMAN TRUST") {
    return "OVER";
  }
  if (decision === "INCREASE HUMAN TRUST") {
    return "UNDER";
  }
  return null;
};

const buildCueMessage = (stage: string | null, cueMode?: string | null) => {
  const mode = (cueMode || "accurate").toLowerCase();
  let guidance = "Guidance reflects system performance.";
  if (mode === "misleading") {
    guidance = "Guidance may be unreliable.";
  } else if (mode === "nocue" || mode === "no-cue") {
    guidance = "No guidance available.";
  }

  if (stage === "OVER") {
    return `Be careful: you may be over-trusting. Consider model limitations. ${guidance}`;
  }
  if (stage === "UNDER") {
    return `You may be under-trusting. Consider the model's strengths. ${guidance}`;
  }
  return `Trust level appears calibrated. Maintain current reliance. ${guidance}`;
};

export default function InteractionPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [chatLog, setChatLog] = useState<ChatBubble[]>([
    {
      role: "assistant",
      text: "Hello, I am your therapist bot. When you are ready, describe how you feel today.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [historyStats, setHistoryStats] = useState(
    "Adopted: 0 | Rejected: 0",
  );
  const [feedbackDecision, setFeedbackDecision] = useState(
    "Awaiting calibration...",
  );
  const [feedbackStage, setFeedbackStage] = useState("n/a");
  const [feedbackDetails, setFeedbackDetails] = useState(
    "Trust cues and system adjustments will appear here.",
  );
  const [isChatting, setIsChatting] = useState(false);
  const chatLogRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<InteractionState>({
    roundIndex: 0,
    adoptedTotal: 0,
    rejectedTotal: 0,
    lastDecision: null,
    lastInteractionId: null,
    lastAction: null,
  });

  useEffect(() => {
    const loaded = loadSession();
    if (!loaded?.params || !loaded?.benchmarkEvidence?.length) {
      router.replace("/preflight");
      return;
    }
    setSession(loaded);
  }, [router]);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [chatLog]);

  const updateHistory = () => {
    const { adoptedTotal, rejectedTotal } = stateRef.current;
    setHistoryStats(`Adopted: ${adoptedTotal} | Rejected: ${rejectedTotal}`);
  };

  const appendBubble = (text: string, role: ChatBubble["role"]) => {
    setChatLog((prev) => [...prev, { text, role }]);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !session) {
      return;
    }
    const message = chatInput.trim();
    setChatInput("");
    appendBubble(message, "user");

    const messages = [
      { role: "system", content: "You are a supportive therapist chatbot." },
      ...chatLog.map((bubble) => ({
        role: bubble.role,
        content: bubble.text,
      })),
      { role: "user", content: message },
    ];

    setIsChatting(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      const data = await response.json();
      appendBubble(data?.message ?? "I hear you. Tell me more.", "assistant");
    } catch (error) {
      appendBubble("I'm having trouble responding right now.", "assistant");
    } finally {
      setIsChatting(false);
    }
  };

  const handleThumbsUp = () => {
    stateRef.current.adoptedTotal += 1;
    stateRef.current.lastAction = "adopted";
    stateRef.current.lastInteractionId = `interaction-${Date.now()}`;
    updateHistory();
  };

  const handleThumbsDown = () => {
    stateRef.current.rejectedTotal += 1;
    stateRef.current.lastAction = "rejected";
    stateRef.current.lastInteractionId = `interaction-${Date.now()}`;
    updateHistory();
  };

  const handleResetInteraction = () => {
    stateRef.current.adoptedTotal = 0;
    stateRef.current.rejectedTotal = 0;
    stateRef.current.roundIndex = 0;
    updateHistory();
  };

  const handleEndSession = () => {
    updateAdoptionHistory(
      stateRef.current.adoptedTotal,
      stateRef.current.rejectedTotal,
    );
    clearSession();
    router.replace("/preflight");
  };

  const handleRunCalibration = async () => {
    if (!session) {
      return;
    }
    try {
      const useHistory = (
        document.getElementById("useHistory") as HTMLInputElement | null
      )?.checked;
      const recentCounts = {
        adopted: stateRef.current.lastAction === "adopted" ? 1 : 0,
        rejected: stateRef.current.lastAction === "rejected" ? 1 : 0,
      };
      const counts = useHistory ? undefined : recentCounts;

      const evidence = session.benchmarkEvidence[0];

          const payload = {
        participantId: session.participantId || null,
        sessionId: session.sessionId,
        interactionId:
          stateRef.current.lastInteractionId || `interaction-${Date.now()}`,
        timestamp: new Date().toISOString(),
        benchmarkMetricRequest: {
          evidenceSet: [
            {
              evidenceKey: evidence.evidenceKey,
              trustworthyMass: evidence.trustworthyMass,
              untrustworthyMass: evidence.untrustworthyMass,
              uncertaintyMass: evidence.uncertaintyMass,
            },
          ],
          evidenceWeights: [
            { evidenceKey: evidence.evidenceKey, weight: evidence.weight },
          ],
        },
        humanInputRequest: {
          behaviorInputWeight: 0.55,
          adopted: counts?.adopted ?? stateRef.current.adoptedTotal,
          rejected: counts?.rejected ?? stateRef.current.rejectedTotal,
          adoptionBaseRate: session.params.behaviorBaseRate,
          feedbackInputWeight: 0,
          feedbackLikelihood: 0,
          feedbackConfidence: 0,
          feedbackBaseRate: session.params.feedbackBaseRate,
          physioInputWeight: 0,
          physioLikelihood: 0,
          physioConfidence: 0,
          physioBaseRate: session.params.physioBaseRate,
        },
        feedbackInput: {
          rating: Number(
            (document.getElementById("feedbackRating") as HTMLSelectElement)
              ?.value ?? "3",
          ),
          feedbackText:
            (document.getElementById("feedbackText") as HTMLTextAreaElement)
              ?.value ?? "",
          emotionalState: (
            document.getElementById("feedbackEmotion") as HTMLSelectElement
          )?.value,
          satisfaction: (
            document.getElementById("feedbackSatisfaction") as HTMLSelectElement
          )?.value,
          helpfulness: (
            document.getElementById("feedbackHelpfulness") as HTMLSelectElement
          )?.value,
          trustFactors: Array.from(
            document.querySelectorAll<HTMLInputElement>(
              'input[name="trustFactors"]:checked',
            ),
          ).map((input) => input.value),
          timestamp: new Date().toISOString(),
          interactionId:
            stateRef.current.lastInteractionId || `interaction-${Date.now()}`,
        },
        proxyPhysioInput: {
          selfReportedStress: Number(
            (document.getElementById("physioStress") as HTMLSelectElement)
              ?.value ?? "3",
          ),
          selfReportedArousal: Number(
            (document.getElementById("physioArousal") as HTMLSelectElement)
              ?.value ?? "3",
          ),
          engagementLevel: Number(
            (document.getElementById("physioEngagement") as HTMLSelectElement)
              ?.value ?? "3",
          ),
          concentrationLevel: Number(
            (document.getElementById("physioConcentration") as HTMLSelectElement)
              ?.value ?? "3",
          ),
          fatigueLevel: Number(
            (document.getElementById("physioFatigue") as HTMLSelectElement)
              ?.value ?? "3",
          ),
          emotionalValence: (
            document.getElementById("physioValence") as HTMLSelectElement
          )?.value,
          confidenceInReport: clamp(
            (document.getElementById("physioConfidence") as HTMLInputElement)
              ?.value ?? "0.8",
          ),
          physicalComfort: Number(
            (document.getElementById("physioComfort") as HTMLSelectElement)
              ?.value ?? "3",
          ),
        },
        error: 0.15,
        risk: 0.25,
        riskPerception: null,
        previousMiscalibrationState: determineMiscalibrationState(
          stateRef.current.lastDecision,
        ),
        taskId: session.taskId || null,
        domain: session.domain || null,
        difficulty: null,
        conflictRedistribution: "pcr5",
        thresholdNature: "dynamic",
        initialThreshold: session.params.initialThreshold,
        riskInput: null,
        cueVisibility: "observable",
        cueReliability: "accurate",
        cueBaseTrust: 0.6,
        cueVisible: 0.8,
        cueLatent: 0.4,
        cueBaseWeight: 0.25,
        cueVisibleWeight: 0.55,
        cueLatentWeight: 0.2,
        adaptationMode: "static",
        roundIndex: stateRef.current.roundIndex,
      };

      const trustCues = await sendJSON(
        session.backendBaseUrl,
        "/cridit/workflow/trustCues",
        payload,
      );

      stateRef.current.roundIndex += 1;
      stateRef.current.lastDecision = trustCues.decision ?? null;

      const gap =
        typeof trustCues.humanMachineTrustGap === "number"
          ? trustCues.humanMachineTrustGap.toFixed(3)
          : "n/a";
      const threshold =
        typeof trustCues.threshold === "number"
          ? trustCues.threshold.toFixed(3)
          : "n/a";

      const stage = determineMiscalibrationState(trustCues.decision);
      setFeedbackDecision(trustCues.decision || "No decision");
      setFeedbackStage(
        stage === "OVER"
          ? "over-trust"
          : stage === "UNDER"
            ? "under-trust"
            : "well-calibrated",
      );
      const cueState = trustCues.actionShowCue
        ? buildCueMessage(stage, trustCues.actionCueMode)
        : "No cue shown.";
      setFeedbackDetails(
        `Gap = human trust - machine trust = ${gap} | Threshold = ${threshold} | Cues = ${cueState}`,
      );

      await sendJSON(session.backendBaseUrl, "/cridit/interaction/event", {
        participantId: payload.participantId,
        sessionId: payload.sessionId,
        interactionId: payload.interactionId,
        timestamp: payload.timestamp,
        taskId: payload.taskId,
        domain: payload.domain,
        difficulty: payload.difficulty,
        miscalibrationState: determineMiscalibrationState(trustCues.decision),
        outcomeCorrect: null,
        accepted: stateRef.current.adoptedTotal > 0,
        rejected: stateRef.current.rejectedTotal > 0,
        feedback:
          (document.getElementById("feedbackText") as HTMLTextAreaElement)
            ?.value ?? "none",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setFeedbackDecision("Calibration error");
      setFeedbackDetails(message);
    }
  };

  if (!session) {
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
          <h1>Therapist Trust Interaction</h1>
          <p className="lede">
            Engage with the therapist chatbot, validate outcomes, and monitor
            calibration cues in real time.
          </p>
        </div>
        <div className="session-badge">
          <span>Session</span>
          <strong>{session.sessionId}</strong>
        </div>
      </header>

      <main className="layout">
        <section className="panel">
          <h2>Interaction Loop</h2>
          <div className="chat-shell">
            <div className="chat-log" id="chatLog" ref={chatLogRef}>
              {chatLog.map((bubble, index) => (
                <div
                  key={`${bubble.role}-${index}`}
                  className={`bubble ${bubble.role}`}
                >
                  {bubble.text}
                </div>
              ))}
              {isChatting ? (
                <div className="bubble assistant">Thinking...</div>
              ) : null}
            </div>
            <div className="chat-input">
              <input
                id="userMessage"
                placeholder="Type a short reflection..."
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
              />
              <button id="sendMessage" onClick={handleSendMessage}>
                Send
              </button>
            </div>
          </div>

          <div className="grid two">
            <div>
              <h3>Task Validation</h3>
              <div className="thumbs">
                <button
                  id="thumbsUp"
                  className="primary"
                  onClick={handleThumbsUp}
                >
                  Thumbs Up
                </button>
                <button
                  id="thumbsDown"
                  className="danger"
                  onClick={handleThumbsDown}
                >
                  Thumbs Down
                </button>
              </div>
              <label className="switch">
                <input id="useHistory" type="checkbox" defaultChecked />
                <span>Use historical interaction counts</span>
              </label>
              <p className="muted" id="historyStats">
                {historyStats}
              </p>
            </div>
            <div>
              <h3>Feedback</h3>
              <textarea
                id="feedbackText"
                rows={3}
                placeholder="Optional feedback for the system..."
              ></textarea>
              <div className="grid three">
                <label>
                  Rating (1-5)
                  <select id="feedbackRating" defaultValue="3">
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </label>
                <label>
                  Emotional State
                  <select id="feedbackEmotion" defaultValue="neutral">
                    <option value="stressed">Stressed</option>
                    <option value="anxious">Anxious</option>
                    <option value="neutral">Neutral</option>
                    <option value="calm">Calm</option>
                    <option value="happy">Happy</option>
                  </select>
                </label>
                <label>
                  Satisfaction
                  <select id="feedbackSatisfaction" defaultValue="neutral">
                    <option value="very_dissatisfied">Very dissatisfied</option>
                    <option value="dissatisfied">Dissatisfied</option>
                    <option value="neutral">Neutral</option>
                    <option value="satisfied">Satisfied</option>
                    <option value="very_satisfied">Very satisfied</option>
                  </select>
                </label>
              </div>
              <div className="grid three">
                <label>
                  Helpfulness
                  <select id="feedbackHelpfulness" defaultValue="helpful">
                    <option value="not_helpful">Not helpful</option>
                    <option value="somewhat_helpful">Somewhat helpful</option>
                    <option value="helpful">Helpful</option>
                    <option value="very_helpful">Very helpful</option>
                  </select>
                </label>
              </div>
              <div className="subsection">
                <h3>Trust Factors (Select All That Apply)</h3>
                <div className="grid three">
                  <label>
                    <input
                      type="checkbox"
                      name="trustFactors"
                      value="humanness"
                    />
                    Humanness
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="trustFactors"
                      value="privacy"
                    />
                    Privacy
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="trustFactors"
                      value="empathy"
                    />
                    Empathy
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="trustFactors"
                      value="security"
                    />
                    Security
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="trustFactors"
                      value="transparency"
                    />
                    Transparency
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="trustFactors"
                      value="reliability"
                    />
                    Reliability
                  </label>
                </div>
              </div>
              <div className="subsection">
                <h3>Self-Reported Physiology</h3>
                <div className="grid three">
                  <label>
                    Stress (1-5)
                    <select id="physioStress" defaultValue="3">
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                    </select>
                  </label>
                  <label>
                    Arousal (1-5)
                    <select id="physioArousal" defaultValue="3">
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                    </select>
                  </label>
                  <label>
                    Engagement (1-5)
                    <select id="physioEngagement" defaultValue="3">
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                    </select>
                  </label>
                  <label>
                    Concentration (1-5)
                    <select id="physioConcentration" defaultValue="3">
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                    </select>
                  </label>
                  <label>
                    Fatigue (1-5)
                    <select id="physioFatigue" defaultValue="3">
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                    </select>
                  </label>
                  <label>
                    Physical Comfort (1-5)
                    <select id="physioComfort" defaultValue="3">
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                    </select>
                  </label>
                  <label>
                    Emotional Valence
                    <select id="physioValence" defaultValue="neutral">
                      <option value="negative">Negative</option>
                      <option value="neutral">Neutral</option>
                      <option value="positive">Positive</option>
                    </select>
                  </label>
                  <label>
                    Report Confidence (0-1)
                    <input
                      id="physioConfidence"
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      defaultValue="0.8"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="subsection">
            <h3>Calibration Policy (Fixed)</h3>
            <p className="muted">
              Policy configuration is set by developers before the session and
              is not adjustable during interaction.
            </p>
          </div>
          <div className="actions">
            <button
              id="runCalibration"
              className="primary"
              onClick={handleRunCalibration}
            >
              Run Calibration
            </button>
            <button
              id="endSession"
              className="ghost"
              onClick={handleEndSession}
            >
              End Session
            </button>
            <button
              id="resetInteraction"
              className="ghost"
              onClick={handleResetInteraction}
            >
              Reset Interaction Stats
            </button>
          </div>
        </section>

        <section className="panel">
          <h2>Calibration Feedback</h2>
          <div className="feedback-card" id="feedbackCard">
            <h3 id="feedbackDecision">Calibration Status</h3>
            <p className="muted">Stage: {feedbackStage}</p>
            <p id="feedbackDetails" className="muted">
              {feedbackDetails}
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
