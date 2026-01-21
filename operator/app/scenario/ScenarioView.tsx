"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ScenarioData } from "./data";
import { getScriptedResponses, type ScriptedTask } from "./scriptedResponses";
import openAiLogo from "./open-ai-logo.png";

type ScenarioViewProps = {
  scenario: ScenarioData;
  isOperator?: boolean;
  backendUrl?: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const trustFactorsByScenario: Record<
  string,
  Array<{
    key: string;
    label: string;
    trustworthy: number;
    untrustworthy: number;
    uncertainty: number;
    weight: number;
  }>
> = {
  financial: [
    {
      key: "calculation_accuracy",
      label: "Calculation accuracy",
      trustworthy: 0.6,
      untrustworthy: 0.2,
      uncertainty: 0.2,
      weight: 1.0,
    },
    {
      key: "consistency",
      label: "Consistency across answers",
      trustworthy: 0.6,
      untrustworthy: 0.2,
      uncertainty: 0.2,
      weight: 1.0,
    },
    {
      key: "assumption_transparency",
      label: "Transparency of assumptions",
      trustworthy: 0.6,
      untrustworthy: 0.2,
      uncertainty: 0.2,
      weight: 1.0,
    },
    {
      key: "traceability",
      label: "Traceability",
      trustworthy: 0.6,
      untrustworthy: 0.2,
      uncertainty: 0.2,
      weight: 1.0,
    },
    {
      key: "auditability",
      label: "Auditability",
      trustworthy: 0.6,
      untrustworthy: 0.2,
      uncertainty: 0.2,
      weight: 1.0,
    },
    {
      key: "source_grounding",
      label: "Source grounding",
      trustworthy: 0.6,
      untrustworthy: 0.2,
      uncertainty: 0.2,
      weight: 1.0,
    },
    {
      key: "risk_completeness",
      label: "Risk completeness",
      trustworthy: 0.6,
      untrustworthy: 0.2,
      uncertainty: 0.2,
      weight: 1.0,
    },
    {
      key: "professional_boundaries",
      label: "Professional boundaries",
      trustworthy: 0.6,
      untrustworthy: 0.2,
      uncertainty: 0.2,
      weight: 1.0,
    },
  ],
  hiring: [
    {
      key: "criteria_transparency",
      label: "Transparency of selection criteria",
      trustworthy: 0.6,
      untrustworthy: 0.2,
      uncertainty: 0.2,
      weight: 1.0,
    },
    {
      key: "explainability",
      label: "Explainability of outputs",
      trustworthy: 0.6,
      untrustworthy: 0.2,
      uncertainty: 0.2,
      weight: 1.0,
    },
    {
      key: "fairness",
      label: "Fairness / non-discrimination",
      trustworthy: 0.6,
      untrustworthy: 0.2,
      uncertainty: 0.2,
      weight: 1.0,
    },
    {
      key: "classification_accuracy",
      label: "Accuracy of CV classification",
      trustworthy: 0.6,
      untrustworthy: 0.2,
      uncertainty: 0.2,
      weight: 1.0,
    },
    {
      key: "consistency",
      label: "Consistency across candidates",
      trustworthy: 0.6,
      untrustworthy: 0.2,
      uncertainty: 0.2,
      weight: 1.0,
    },
    {
      key: "feedback_quality",
      label: "Quality of feedback provided",
      trustworthy: 0.6,
      untrustworthy: 0.2,
      uncertainty: 0.2,
      weight: 1.0,
    },
    {
      key: "tone_professionalism",
      label: "Tone and professionalism",
      trustworthy: 0.6,
      untrustworthy: 0.2,
      uncertainty: 0.2,
      weight: 1.0,
    },
    {
      key: "human_oversight",
      label: "Respect of human oversight",
      trustworthy: 0.6,
      untrustworthy: 0.2,
      uncertainty: 0.2,
      weight: 1.0,
    },
    {
      key: "efficiency",
      label: "Efficiency / time saving",
      trustworthy: 0.6,
      untrustworthy: 0.2,
      uncertainty: 0.2,
      weight: 1.0,
    },
    {
      key: "correction_ability",
      label: "Ability to adjust or correct the system",
      trustworthy: 0.6,
      untrustworthy: 0.2,
      uncertainty: 0.2,
      weight: 1.0,
    },
  ],
  legal: [
    {
      key: "reliability",
      label: "Reliability",
      trustworthy: 0.6,
      untrustworthy: 0.2,
      uncertainty: 0.2,
      weight: 1.0,
    },
    {
      key: "citation_accuracy",
      label: "Citation accuracy",
      trustworthy: 0.6,
      untrustworthy: 0.2,
      uncertainty: 0.2,
      weight: 1.0,
    },
    {
      key: "transparency",
      label: "Transparency of reasoning",
      trustworthy: 0.6,
      untrustworthy: 0.2,
      uncertainty: 0.2,
      weight: 1.0,
    },
    {
      key: "bias_fairness",
      label: "Bias avoidance and fairness",
      trustworthy: 0.6,
      untrustworthy: 0.2,
      uncertainty: 0.2,
      weight: 1.0,
    },
    {
      key: "privacy_security",
      label: "Security and confidentiality",
      trustworthy: 0.6,
      untrustworthy: 0.2,
      uncertainty: 0.2,
      weight: 1.0,
    },
    {
      key: "human_oversight",
      label: "Respect of human oversight",
      trustworthy: 0.6,
      untrustworthy: 0.2,
      uncertainty: 0.2,
      weight: 1.0,
    },
    {
      key: "accountability",
      label: "Accountability",
      trustworthy: 0.6,
      untrustworthy: 0.2,
      uncertainty: 0.2,
      weight: 1.0,
    },
    {
      key: "uncertainty_limits",
      label: "Explicit uncertainty and limits",
      trustworthy: 0.6,
      untrustworthy: 0.2,
      uncertainty: 0.2,
      weight: 1.0,
    },
  ],
};

export function ScenarioView({ scenario, isOperator, backendUrl }: ScenarioViewProps) {
  const scriptedTasks = useMemo(() => getScriptedResponses(scenario.key), [scenario.key]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    scriptedTasks[0]?.taskId ?? null,
  );
  const [selectedVariantKey, setSelectedVariantKey] = useState<string | null>(
    scriptedTasks[0]?.variants[0]?.key ?? null,
  );
  const [scriptedStatus, setScriptedStatus] = useState("");
  const [lastParticipantMessage, setLastParticipantMessage] = useState("");
  const [operatorPrompt, setOperatorPrompt] = useState("");
  const selectedTaskRef = useRef<string | null>(null);
  const selectedVariantRef = useRef<string | null>(null);
  const sendOperatorMessageRef = useRef<((text: string) => void) | null>(null);
  const trustHistoryRef = useRef<Array<{ human: number; machine: number }>>([]);
  const gapHistoryRef = useRef<number[]>([]);
  const scenarioKeyRef = useRef(scenario.key);
  const lastCalibrationKeyRef = useRef("");
  const scenarioRef = useRef(scenario);
  const clientId = useMemo(
    () =>
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `client-${Math.random().toString(36).slice(2, 10)}`,
    [],
  );

  useEffect(() => {
    setSelectedTaskId(scriptedTasks[0]?.taskId ?? null);
    setSelectedVariantKey(scriptedTasks[0]?.variants[0]?.key ?? null);
  }, [scriptedTasks]);

  useEffect(() => {
    selectedTaskRef.current = selectedTaskId;
  }, [selectedTaskId]);

  useEffect(() => {
    selectedVariantRef.current = selectedVariantKey;
  }, [selectedVariantKey]);

  useEffect(() => {
    scenarioRef.current = scenario;
  }, [scenario]);

  const selectedTask = useMemo<ScriptedTask | null>(() => {
    if (!selectedTaskId) {
      return scriptedTasks[0] ?? null;
    }
    return scriptedTasks.find((task) => task.taskId === selectedTaskId) ?? scriptedTasks[0] ?? null;
  }, [scriptedTasks, selectedTaskId]);

  const selectedVariant = useMemo(() => {
    if (!selectedTask) {
      return null;
    }
    if (selectedVariantKey) {
      return selectedTask.variants.find((variant) => variant.key === selectedVariantKey) ?? null;
    }
    return selectedTask.variants[0] ?? null;
  }, [selectedTask, selectedVariantKey]);

  const formatScore = (value?: number | null) =>
    typeof value === "number" && Number.isFinite(value) ? value.toFixed(3) : "n/a";

  const handleSendScripted = () => {
    if (!selectedVariant) {
      setScriptedStatus("Select a scripted response first.");
      return;
    }
    if (!sendOperatorMessageRef.current) {
      setScriptedStatus("Operator chat not ready.");
      return;
    }
    sendOperatorMessageRef.current(selectedVariant.text);
    setScriptedStatus("Scripted response sent to participant.");
  };

  const handleSendOpenAI = async (mode: "direct" | "with_prompt") => {
    if (!lastParticipantMessage.trim()) {
      setScriptedStatus("No participant request available yet.");
      return;
    }
    if (!sendOperatorMessageRef.current) {
      setScriptedStatus("Operator chat not ready.");
      return;
    }
    const prompt = mode === "with_prompt" ? operatorPrompt.trim() : "";
    const payload = {
      scenarioKey: scenario.key,
      taskId: selectedTaskRef.current ?? null,
      participantMessage: lastParticipantMessage.trim(),
      operatorPrompt: prompt || null,
      model: "gpt-4o-mini",
    };
    const baseUrl = backendUrl || "http://localhost:8001";
    try {
      setScriptedStatus("Sending to OpenAI...");
      const response = await fetch(`${baseUrl}/openai/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `OpenAI request failed (${response.status})`);
      }
      const data = (await response.json()) as { responseText?: string };
      if (!data.responseText) {
        throw new Error("OpenAI response was empty.");
      }
      if (mode === "with_prompt" && prompt) {
        fetch(`${baseUrl}/chat/${scenario.key}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: "system",
            source: "operator_prompt",
            text: `Participant request: ${lastParticipantMessage.trim()} | Operator prompt: ${prompt}`,
            clientId: "operator-prompt",
            taskId: selectedTaskRef.current ?? null,
            timestamp: Date.now(),
          }),
        }).catch(() => {});
      }
      sendOperatorMessageRef.current(data.responseText);
      setScriptedStatus("OpenAI response sent to participant.");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setScriptedStatus(message);
    }
  };

  const handleFocusOpenAiPanel = () => {
    const panel = document.getElementById("openai-panel");
    if (panel) {
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  useEffect(() => {
    const root = document.getElementById("mockup-root");
    if (!root) return;
    if (isOperator) {
      root.classList.add("show-operator");
    } else {
      root.classList.add("pre-interaction");
    }

    const scenarioKey = scenarioRef.current.key;
    const chatBaseUrl = backendUrl || "http://localhost:8001";
    let chatPoll: number | null = null;
    let trustPoll: number | null = null;
    let inputPoll: number | null = null;
    let lastChatId = 0;
    let currentTaskId: string | null = null;

    const interactionState = {
      adopted: 0,
      rejected: 0,
      roundIndex: 0,
    };
    if (scenarioKeyRef.current !== scenarioKey) {
      lastCalibrationKeyRef.current = "";
    }

    const evidenceByScenario = {
      financial: { trustworthyMass: 0.68, untrustworthyMass: 0.22, uncertaintyMass: 0.1 },
      legal: { trustworthyMass: 0.61, untrustworthyMass: 0.29, uncertaintyMass: 0.1 },
      hiring: { trustworthyMass: 0.54, untrustworthyMass: 0.36, uncertaintyMass: 0.1 },
    };

    const timeStamp = () => {
      const now = new Date();
      const pad = (value: number) => String(value).padStart(2, "0");
      return `${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    };

    const appendLog = (message: string) => {
      const logStream = document.querySelector(".log-stream");
      if (!logStream) return;
      const entry = document.createElement("div");
      entry.className = "log-entry";
      const time = document.createElement("span");
      time.className = "time";
      time.textContent = timeStamp();
      const event = document.createElement("span");
      event.className = "event";
      event.textContent = message;
      entry.appendChild(time);
      entry.appendChild(event);
      logStream.prepend(entry);
    };

    const appendListItem = (id: string, text: string) => {
      const list = document.getElementById(id);
      if (!list) return;
      const item = document.createElement("li");
      item.textContent = text;
      list.prepend(item);
    };

    const maxHistory = 24;
    if (scenarioKeyRef.current !== scenarioKey) {
      scenarioKeyRef.current = scenarioKey;
      trustHistoryRef.current = [];
      gapHistoryRef.current = [];
    }

    const drawLine = (
      svg: SVGSVGElement,
      series: number[],
      color: string,
      minOverride?: number,
      maxOverride?: number,
    ) => {
      const width = 240;
      const height = 80;
      const padding = 8;
      if (series.length === 0) {
        svg.innerHTML = "";
        return;
      }
      const min = typeof minOverride === "number" ? minOverride : Math.min(...series);
      const max = typeof maxOverride === "number" ? maxOverride : Math.max(...series);
      const span = max - min || 1;
      const scaleX = (index: number) =>
        padding + (index * (width - padding * 2)) / Math.max(series.length - 1, 1);
      const scaleY = (value: number) =>
        height - padding - ((value - min) / span) * (height - padding * 2);
      const path = series
        .map((value, index) => `${index === 0 ? "M" : "L"}${scaleX(index)},${scaleY(value)}`)
        .join(" ");
      const pathNode = document.createElementNS("http://www.w3.org/2000/svg", "path");
      pathNode.setAttribute("d", path);
      pathNode.setAttribute("fill", "none");
      pathNode.setAttribute("stroke", color);
      pathNode.setAttribute("stroke-width", "2");
      svg.appendChild(pathNode);
    };

    const drawPoints = (
      svg: SVGSVGElement,
      series: number[],
      color: string,
      minOverride?: number,
      maxOverride?: number,
    ) => {
      if (series.length === 0) {
        return;
      }
      const width = 240;
      const height = 80;
      const padding = 8;
      const min = typeof minOverride === "number" ? minOverride : Math.min(...series);
      const max = typeof maxOverride === "number" ? maxOverride : Math.max(...series);
      const span = max - min || 1;
      const scaleX = (index: number) =>
        padding + (index * (width - padding * 2)) / Math.max(series.length - 1, 1);
      const scaleY = (value: number) =>
        height - padding - ((value - min) / span) * (height - padding * 2);
      series.forEach((value, index) => {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", String(scaleX(index)));
        circle.setAttribute("cy", String(scaleY(value)));
        circle.setAttribute("r", "2.5");
        circle.setAttribute("fill", color);
        svg.appendChild(circle);
      });
    };

    const drawGrid = (
      svg: SVGSVGElement,
      min: number,
      max: number,
      ticks: number[],
    ) => {
      const width = 240;
      const height = 80;
      const padding = 8;
      const span = max - min || 1;
      const scaleY = (value: number) =>
        height - padding - ((value - min) / span) * (height - padding * 2);
      ticks.forEach((tick) => {
        const y = scaleY(tick);
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", String(padding));
        line.setAttribute("x2", String(width - padding));
        line.setAttribute("y1", String(y));
        line.setAttribute("y2", String(y));
        line.setAttribute("stroke", "rgba(0,0,0,0.12)");
        line.setAttribute("stroke-width", "1");
        svg.appendChild(line);

        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", String(padding));
        label.setAttribute("y", String(y - 2));
        label.setAttribute("fill", "#6b635d");
        label.setAttribute("font-size", "9");
        label.textContent = tick.toFixed(2);
        svg.appendChild(label);
      });
    };

    const drawTrustChart = () => {
      const svg = document.getElementById("trust-evolution-chart") as SVGSVGElement | null;
      if (!svg) return;
      svg.innerHTML = "";
      drawGrid(svg, 0, 1, [0, 0.25, 0.5, 0.75, 1]);
      drawLine(
        svg,
        trustHistoryRef.current.map((point) => point.human),
        "#D46A6A",
        0,
        1,
      );
      drawPoints(
        svg,
        trustHistoryRef.current.map((point) => point.human),
        "#D46A6A",
        0,
        1,
      );
      drawLine(
        svg,
        trustHistoryRef.current.map((point) => point.machine),
        "#4A7C9B",
        0,
        1,
      );
      drawPoints(
        svg,
        trustHistoryRef.current.map((point) => point.machine),
        "#4A7C9B",
        0,
        1,
      );
    };

    const drawGapChart = () => {
      const svg = document.getElementById("gap-evolution-chart") as SVGSVGElement | null;
      if (!svg) return;
      svg.innerHTML = "";
      drawGrid(svg, -1, 1, [-1, -0.5, 0, 0.5, 1]);
      drawLine(svg, gapHistoryRef.current, "#E0A458", -1, 1);
      drawPoints(svg, gapHistoryRef.current, "#E0A458", -1, 1);
    };

    const updateTrustEvolution = (humanText: string, machineText: string) => {
      const human = Number(humanText);
      const machine = Number(machineText);
      if (!Number.isFinite(human) || !Number.isFinite(machine)) {
        return;
      }
      const history = trustHistoryRef.current;
      history.push({ human, machine });
      if (history.length > maxHistory) {
        history.shift();
      }
      drawTrustChart();
    };

    const updateGapEvolution = (gapText: string) => {
      const gap = Number(gapText);
      if (!Number.isFinite(gap)) {
        return;
      }
      const history = gapHistoryRef.current;
      history.push(gap);
      if (history.length > maxHistory) {
        history.shift();
      }
      drawGapChart();
    };

    const buildCalibrationKey = (payload: {
      timestamp?: string;
      humanTrustScore?: number;
      machineTrustScore?: number;
      humanMachineTrustGap?: number;
      threshold?: number;
      decision?: string;
    }) => {
      const toKey = (value?: number) =>
        typeof value === "number" && Number.isFinite(value)
          ? value.toFixed(3)
          : "n/a";
      return [
        toKey(payload.humanTrustScore),
        toKey(payload.machineTrustScore),
        toKey(payload.humanMachineTrustGap),
        toKey(payload.threshold),
        payload.decision ?? "NO ACTION",
      ].join("|");
    };

    const setText = (id: string, value: string) => {
      const node = document.getElementById(id);
      if (node) {
        node.textContent = value;
      }
    };

    const computeDecisionFromGap = (gap: number, threshold: number) => {
      if (gap > threshold) {
        return "DECREASE HUMAN TRUST";
      }
      if (gap < -threshold) {
        return "INCREASE HUMAN TRUST";
      }
      return "NO ACTION";
    };

    const recordCalibrationUpdate = async () => {
      const humanText = document.getElementById("human-trust")?.textContent || "n/a";
      const machineText = document.getElementById("machine-trust")?.textContent || "n/a";
      const thresholdText = document.getElementById("threshold-value")?.textContent || "n/a";
      const human = Number(humanText);
      const machine = Number(machineText);
      const threshold = Number(thresholdText);
      if (!Number.isFinite(human) || !Number.isFinite(machine)) {
        return;
      }
      const resolvedThreshold = Number.isFinite(threshold)
        ? threshold
        : scenarioRef.current.threshold;
      const gap = human - machine;
      const decision = computeDecisionFromGap(gap, resolvedThreshold);
      const payload = {
        scenarioKey,
        taskId: selectedTaskRef.current ?? null,
        humanTrustScore: Number(human.toFixed(3)),
        machineTrustScore: Number(machine.toFixed(3)),
        humanMachineTrustGap: Number(gap.toFixed(3)),
        threshold: Number(resolvedThreshold.toFixed(3)),
        decision,
        conflictRedistribution: "manual",
        thresholdNature: "manual",
        timestamp: new Date().toISOString(),
      };
      const calibrationKey = buildCalibrationKey(payload);
      if (calibrationKey && calibrationKey === lastCalibrationKeyRef.current) {
        return;
      }
      lastCalibrationKeyRef.current = calibrationKey;
      try {
        await fetch(`${chatBaseUrl}/cridit/calibration/record`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        // ignore recording errors
      }
    };

    const toggleCueCards = () => {
      const cues = document.getElementById("trust-cues-list");
      const cuesCard = document.getElementById("trust-cues-card");
      const promptText = document.getElementById("last-prompt-text");
      const promptList = document.getElementById("prompt-history");
      const promptCard = document.getElementById("prompt-history-card");
      const cuesGrid = document.querySelector<HTMLElement>(".cue-grid");
      const cuesEmpty = !cues || cues.children.length === 0;
      const promptEmpty =
        (!promptList || promptList.children.length === 0) &&
        (!promptText || !promptText.textContent?.trim());
      if (cuesCard) {
        cuesCard.style.display = cuesEmpty ? "none" : "block";
      }
      if (promptCard) {
        promptCard.style.display = promptEmpty ? "none" : "block";
      }
      if (cuesGrid) {
        cuesGrid.style.display = cuesEmpty && promptEmpty ? "none" : "grid";
      }
    };

    const computeCalibrationState = (decision: string) => {
      if (decision === "DECREASE HUMAN TRUST") {
        return "over-trust";
      }
      if (decision === "INCREASE HUMAN TRUST") {
        return "under-trust";
      }
      return "well-calibrated";
    };

    const resolvePreviousState = () => {
      const state = document.getElementById("calibration-state")?.textContent || "";
      if (state.includes("over")) {
        return "OVER";
      }
      if (state.includes("under")) {
        return "UNDER";
      }
      return null;
    };

    const sendTrustCues = async (message: string) => {
      const ratingRaw = (document.getElementById("feedback-rating") as HTMLSelectElement | null)?.value;
      const rating = ratingRaw ? Number(ratingRaw) : null;
      const emotion =
        (document.getElementById("feedback-emotion") as HTMLSelectElement | null)?.value || "neutral";
      const feedbackLikelihood =
        typeof rating === "number" ? clamp((rating - 1) / 4, 0, 1) : 0;
      const feedbackWeight = typeof rating === "number" ? 0.25 : 0;
      const behaviorWeight = 0.55;
      const physioWeight = 0;
      const weightSum = behaviorWeight + feedbackWeight + physioWeight;
      const behaviorInputWeight = weightSum > 0 ? behaviorWeight / weightSum : 1;
      const feedbackInputWeight = weightSum > 0 ? feedbackWeight / weightSum : 0;
      const physioInputWeight = weightSum > 0 ? physioWeight / weightSum : 0;

      const evidence =
        evidenceByScenario[scenarioKey as keyof typeof evidenceByScenario] ||
        evidenceByScenario.financial;
      interactionState.roundIndex += 1;

      const payload = {
        participantId: null,
        sessionId: `${scenarioKey}-session`,
        interactionId: `interaction-${Date.now()}`,
        timestamp: new Date().toISOString(),
        benchmarkMetricRequest: {
          evidenceSet: [
            {
              evidenceKey: "mock",
              trustworthyMass: evidence.trustworthyMass,
              untrustworthyMass: evidence.untrustworthyMass,
              uncertaintyMass: evidence.uncertaintyMass,
            },
          ],
          evidenceWeights: [{ evidenceKey: "mock", weight: 1.0 }],
        },
        humanInputRequest: {
          behaviorInputWeight,
          adopted: interactionState.adopted,
          rejected: interactionState.rejected,
          adoptionBaseRate: 0.6,
          feedbackInputWeight,
          feedbackLikelihood,
          feedbackConfidence: feedbackInputWeight > 0 ? 0.7 : 0,
          feedbackBaseRate: 0.4,
          physioInputWeight,
          physioLikelihood: 0,
          physioConfidence: 0,
          physioBaseRate: 0,
        },
        feedbackInput: {
          rating,
          feedbackText: message || "",
          emotionalState: emotion,
          satisfaction: null,
          helpfulness: null,
          trustCueUsefulness: null,
          trustFactors: [],
          timestamp: new Date().toISOString(),
          interactionId: `interaction-${Date.now()}`,
        },
        proxyPhysioInput: null,
        error: 0.15,
        risk: 0.25,
        riskPerception: null,
        previousMiscalibrationState: resolvePreviousState(),
        taskId: scenarioKey,
        domain: scenarioKey,
        difficulty: null,
        conflictRedistribution: "pcr5",
        thresholdNature: "dynamic",
        initialThreshold: scenarioRef.current.threshold,
        riskInput: null,
        cueVisibility: "observable",
        cueReliability: null,
        cueBaseTrust: 0.6,
        cueVisible: 0.8,
        cueLatent: 0.4,
        cueBaseWeight: 0.25,
        cueVisibleWeight: 0.55,
        cueLatentWeight: 0.2,
        adaptationMode: "adaptive",
        roundIndex: interactionState.roundIndex,
      };

      try {
        const response = await fetch(
          `${backendUrl || "http://localhost:8001"}/cridit/calibration/trustCues`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        if (!response.ok) {
          throw new Error(`Calibration failed (${response.status})`);
        }
        const trustCues = await response.json();
        lastCalibrationKeyRef.current = buildCalibrationKey(trustCues);
        const human =
          typeof trustCues.humanTrustScore === "number"
            ? trustCues.humanTrustScore.toFixed(3)
            : "n/a";
        const machine =
          typeof trustCues.machineTrustScore === "number"
            ? trustCues.machineTrustScore.toFixed(3)
            : "n/a";
        const gap =
          typeof trustCues.humanMachineTrustGap === "number"
            ? trustCues.humanMachineTrustGap.toFixed(3)
            : "n/a";
        const threshold =
          typeof trustCues.threshold === "number"
            ? trustCues.threshold.toFixed(3)
            : "n/a";
        const decision = trustCues.decision || "NO ACTION";
        const state = computeCalibrationState(decision);

        setText("human-trust", human);
        setText("machine-trust", machine);
        setText("gap-value", gap);
        setText("gap-inline", gap);
        setText("threshold-value", threshold);
        setText("calibration-decision", decision);
        setText("calibration-state", state);
        setText("status-text", state);
        updateTrustEvolution(human, machine);
        updateGapEvolution(gap);
        toggleCueCards();
        appendLog(`Calibration updated: ${decision}, gap=${gap}.`);
      } catch (error) {
        appendLog(
          `Calibration error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    };

    const wireTrustSync = () => {
      if (!isOperator) return null;
      const poll = async () => {
        try {
          const response = await fetch(
            `${chatBaseUrl}/cridit/calibration/latest/${scenarioKey}`,
            { cache: "no-store" },
          );
          if (!response.ok) return;
          const trustCues = (await response.json()) as {
            machineTrustScore?: number;
            humanTrustScore?: number;
            humanMachineTrustGap?: number;
            threshold?: number;
            decision?: string;
          };
          if (typeof trustCues.machineTrustScore !== "number") {
            return;
          }
          const calibrationKey = buildCalibrationKey(trustCues);
          if (calibrationKey && calibrationKey === lastCalibrationKeyRef.current) {
            return;
          }
          lastCalibrationKeyRef.current = calibrationKey;
          const humanValue =
            typeof trustCues.humanTrustScore === "number" ? trustCues.humanTrustScore : NaN;
          const machineValue =
            typeof trustCues.machineTrustScore === "number" ? trustCues.machineTrustScore : NaN;
          const thresholdValue =
            typeof trustCues.threshold === "number"
              ? trustCues.threshold
              : scenarioRef.current.threshold;
          const existingMachineText = document.getElementById("machine-trust")?.textContent || "n/a";
          const existingMachineValue = Number(existingMachineText);
          const machineToUse = Number.isFinite(existingMachineValue)
            ? existingMachineValue
            : machineValue;
          const human = Number.isFinite(humanValue) ? humanValue.toFixed(3) : "n/a";
          const machine = Number.isFinite(machineToUse) ? machineToUse.toFixed(3) : "n/a";
          const gapValue =
            Number.isFinite(humanValue) && Number.isFinite(machineToUse)
              ? humanValue - machineToUse
              : typeof trustCues.humanMachineTrustGap === "number"
                ? trustCues.humanMachineTrustGap
                : NaN;
          const gap = Number.isFinite(gapValue) ? gapValue.toFixed(3) : "n/a";
          const threshold = Number.isFinite(thresholdValue) ? thresholdValue.toFixed(3) : "n/a";
          const decision =
            Number.isFinite(gapValue) && Number.isFinite(thresholdValue)
              ? computeDecisionFromGap(gapValue, thresholdValue)
              : trustCues.decision || "NO ACTION";
          const state = computeCalibrationState(decision);

          setText("human-trust", human);
          if (!Number.isFinite(existingMachineValue)) {
            setText("machine-trust", machine);
          }
          setText("gap-value", gap);
          setText("gap-inline", gap);
          setText("threshold-value", threshold);
          setText("calibration-decision", decision);
          setText("calibration-state", state);
          setText("status-text", state);
          updateTrustEvolution(human, machine);
          updateGapEvolution(gap);
          root.classList.remove("trust-pending");
        } catch {
          // ignore polling errors
        }
      };

      poll();
      return window.setInterval(poll, 2000);
    };

    const wireInputSync = () => {
      if (!isOperator) return null;
      const adoptedInput = document.getElementById("human-adopted") as HTMLInputElement | null;
      const rejectedInput = document.getElementById("human-rejected") as HTMLInputElement | null;
      if (!adoptedInput || !rejectedInput) return null;
      const poll = async () => {
        try {
          const response = await fetch(`${chatBaseUrl}/inputs/${scenarioKey}`, { cache: "no-store" });
          if (!response.ok) return;
          const data = (await response.json().catch(() => null)) as
            | { adopted?: number; rejected?: number }
            | null;
          if (typeof data?.adopted === "number") {
            adoptedInput.value = String(Math.max(0, Math.round(data.adopted)));
          }
          if (typeof data?.rejected === "number") {
            rejectedInput.value = String(Math.max(0, Math.round(data.rejected)));
          }
        } catch {
          // ignore input sync errors
        }
      };
      poll();
      return window.setInterval(poll, 2000);
    };

    const wireEvidencePanel = () => {
      if (!isOperator) return;
      const rows = Array.from(document.querySelectorAll(".evidence-row"));
      if (rows.length === 0) return;

      const setWeightLabel = (row: Element, value: number) => {
        const label = row.querySelector<HTMLElement>(".weight-label");
        if (!label) return;
        if (value >= 0.67) {
          label.textContent = "High";
        } else if (value >= 0.34) {
          label.textContent = "Medium";
        } else {
          label.textContent = "Low";
        }
      };

      const recalc = async () => {
        const evidenceSet: Array<{
          evidenceKey: string;
          trustworthyMass: number;
          untrustworthyMass: number;
          uncertaintyMass: number;
        }> = [];
        const evidenceWeights: Array<{ evidenceKey: string; weight: number }> = [];

        rows.forEach((row) => {
          const key = (row as HTMLElement).dataset.evidenceKey;
          if (!key) return;
          const trustworthyInput = row.querySelector<HTMLInputElement>(
            "input[data-field='trustworthy']",
          );
          const untrustworthyInput = row.querySelector<HTMLInputElement>(
            "input[data-field='untrustworthy']",
          );
          const uncertaintyInput = row.querySelector<HTMLInputElement>(
            "input[data-field='uncertainty']",
          );
          const weightRange = row.querySelector<HTMLInputElement>(
            "input[data-field='weight-range']",
          );

          const trustworthy = clamp(Number(trustworthyInput?.value || 0), 0, 1);
          const untrustworthy = clamp(Number(untrustworthyInput?.value || 0), 0, 1);
          const uncertainty = clamp(Number(uncertaintyInput?.value || 0), 0, 1);
          const weight = clamp(Number(weightRange?.value || 1), 0, 1);

          evidenceSet.push({
            evidenceKey: key,
            trustworthyMass: trustworthy,
            untrustworthyMass: untrustworthy,
            uncertaintyMass: uncertainty,
          });
          evidenceWeights.push({ evidenceKey: key, weight });
          setWeightLabel(row, weight);
        });

        try {
          const response = await fetch(`${chatBaseUrl}/cridit/evaluation/score/machine`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ evidenceSet, evidenceWeights }),
          });
          if (!response.ok) return;
          const score = await response.json();
          const scoreText = typeof score === "number" ? score.toFixed(3) : "n/a";
          const preview = document.getElementById("machine-score-preview");
          if (preview) {
            preview.textContent = scoreText;
          }
          setText("machine-trust", scoreText);
          const humanText = document.getElementById("human-trust")?.textContent || "n/a";
          if (humanText !== "n/a") {
            updateTrustEvolution(humanText, scoreText);
          }
          if (humanText !== "n/a" && scoreText !== "n/a") {
            const humanValue = Number(humanText);
            const machineValue = Number(scoreText);
            if (Number.isFinite(humanValue) && Number.isFinite(machineValue)) {
              updateGapEvolution((humanValue - machineValue).toFixed(3));
            }
          }
          await recordCalibrationUpdate();
        } catch {
          // ignore errors
        }
      };

      const refreshButton = document.getElementById("refresh-machine-score");
      if (refreshButton) {
        refreshButton.addEventListener("click", () => {
          recalc();
        });
      }

      rows.forEach((row) => {
        const weightRange = row.querySelector<HTMLInputElement>("input[data-field='weight-range']");
        if (!weightRange) {
          return;
        }
        const syncWeight = (value: number) => {
          const clamped = clamp(value, 0, 1);
          weightRange.value = clamped.toString();
          setWeightLabel(row, clamped);
        };
        weightRange.addEventListener("input", () => {
          syncWeight(Number(weightRange.value));
        });
        syncWeight(Number(weightRange.value || 1));
      });
    };

    const wireHumanFeedbackPanel = () => {
      if (!isOperator) return;
      const submitButton = document.getElementById("refresh-human-score");
      if (!submitButton) return;

      const readNumber = (id: string, fallback: number) => {
        const value = (document.getElementById(id) as HTMLInputElement | null)?.value;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
      };

      submitButton.addEventListener("click", async () => {
        const behaviorInputWeight = clamp(readNumber("human-behavior-weight", 0.55), 0, 1);
        const feedbackInputWeight = clamp(readNumber("human-feedback-weight", 0.25), 0, 1);
        const physioInputWeight = clamp(readNumber("human-physio-weight", 0.2), 0, 1);
        const weightSum = behaviorInputWeight + feedbackInputWeight + physioInputWeight;
        if (Math.abs(weightSum - 1) > 1e-6) {
          appendLog(
            `Human trust not refreshed: behavior + feedback + physio weights must sum to 1 (now ${weightSum.toFixed(2)}).`,
          );
          return;
        }

        const payload = {
          behaviorInputWeight,
          adopted: Math.max(0, Math.round(readNumber("human-adopted", 30))),
          rejected: Math.max(0, Math.round(readNumber("human-rejected", 10))),
          adoptionBaseRate: clamp(readNumber("human-adoption-base", 0.6), 0, 1),
          feedbackInputWeight,
          feedbackLikelihood: clamp(readNumber("human-feedback-likelihood", 0.75), 0, 1),
          feedbackConfidence: clamp(readNumber("human-feedback-confidence", 0.6), 0, 1),
          feedbackBaseRate: clamp(readNumber("human-feedback-base", 0.7), 0, 1),
          physioInputWeight,
          physioLikelihood: clamp(readNumber("human-physio-likelihood", 0.75), 0, 1),
          physioConfidence: clamp(readNumber("human-physio-confidence", 0.6), 0, 1),
          physioBaseRate: clamp(readNumber("human-physio-base", 0.6), 0, 1),
        };

        try {
          const response = await fetch(`${chatBaseUrl}/cridit/evaluation/score/human`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!response.ok) {
            throw new Error(`Human trust refresh failed (${response.status})`);
          }
          const score = await response.json();
          const scoreText = typeof score === "number" ? score.toFixed(3) : "n/a";
          setText("human-trust", scoreText);
          setText("human-score-preview", scoreText);
          const machineText = document.getElementById("machine-trust")?.textContent || "n/a";
          if (machineText !== "n/a") {
            updateTrustEvolution(scoreText, machineText);
          }
          if (machineText !== "n/a" && scoreText !== "n/a") {
            const humanValue = Number(scoreText);
            const machineValue = Number(machineText);
            if (Number.isFinite(humanValue) && Number.isFinite(machineValue)) {
              updateGapEvolution((humanValue - machineValue).toFixed(3));
            }
          }
          await recordCalibrationUpdate();
        } catch (error) {
          appendLog(
            `Human trust refresh error: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      });
    };

    const wireRecallPrompt = () => {
      const recall = document.getElementById("recall-prompt");
      const prompt = document.getElementById("last-prompt-text");
      const input = document.getElementById("user-message") as HTMLInputElement | null;
      if (!recall || !prompt || !input) return;
      recall.addEventListener("click", () => {
        if (!prompt.textContent) return;
        input.value = prompt.textContent;
        input.focus();
        appendLog("Prompt recalled into chat input.");
      });
    };

    const wireCueRating = () => {
      const rating = document.getElementById("trust-cues-rating") as HTMLSelectElement | null;
      if (!rating) return;
      rating.addEventListener("change", () => {
        if (!rating.value) return;
        appendLog(`Trust cue rating submitted: ${rating.value}.`);
      });
    };

    const wireValidationControls = () => {
      const up = document.getElementById("thumbs-up");
      const down = document.getElementById("thumbs-down");
      if (!up || !down) return;
      up.addEventListener("click", () => {
        interactionState.adopted += 1;
        appendLog("Behavioral choice recorded: accept.");
      });
      down.addEventListener("click", () => {
        interactionState.rejected += 1;
        appendLog("Behavioral choice recorded: reject.");
      });
    };

    const wireActionConsole = () => {
      document.querySelectorAll(".action-row button").forEach((button) => {
        button.addEventListener("click", () => {
          const command = (button as HTMLButtonElement).dataset.command;
          if (!command) return;
          appendLog(`Action executed: ${command}`);
        });
      });
    };

    const appendChatBubble = (container: Element, role: string, text: string) => {
      const bubble = document.createElement("div");
      bubble.className = `bubble ${role}`;
      const paragraph = document.createElement("p");
      paragraph.innerHTML = `<strong>${role === "user" ? "Participant" : "System"}</strong> · ${text}`;
      bubble.appendChild(paragraph);
      container.appendChild(bubble);
      (container as HTMLElement).scrollTop = (container as HTMLElement).scrollHeight;
    };

    const appendThinkingBubble = (container: Element) => {
      const bubble = document.createElement("div");
      bubble.className = "bubble system thinking";
      const paragraph = document.createElement("p");
      paragraph.innerHTML = "<strong>System</strong> · Thinking…";
      bubble.appendChild(paragraph);
      container.appendChild(bubble);
      (container as HTMLElement).scrollTop = (container as HTMLElement).scrollHeight;
    };

    const replaceThinkingBubble = (container: Element, text: string) => {
      const thinking = container.querySelector(".bubble.system.thinking");
      if (!thinking) {
        appendChatBubble(container, "system", text);
        return;
      }
      const paragraph = thinking.querySelector("p");
      if (paragraph) {
        paragraph.innerHTML = `<strong>System</strong> · ${text}`;
      }
      thinking.classList.remove("thinking");
    };

    const wireOperatorReply = () => {
      const container = document.querySelector(".chat");
      if (!container) return;
      const sendMessage = (value: string) => {
        const message = value.trim();
        if (!message) return;
        replaceThinkingBubble(container, message);
        appendLog("Operator sent system reply.");
        postChatMessage("system", message, "operator");
      };
      sendOperatorMessageRef.current = sendMessage;
    };

    const postChatMessage = async (role: string, text: string, source: string) => {
      const resolvedTaskId = selectedTaskRef.current ?? currentTaskId;
      try {
        const response = await fetch(`${chatBaseUrl}/chat/${scenarioKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role,
            text,
            source,
            clientId,
            taskId: resolvedTaskId,
            timestamp: Date.now(),
          }),
        });
        if (response.ok) {
          const created = (await response.json()) as { id?: number };
          if (created.id && created.id > lastChatId) {
            lastChatId = created.id;
          }
        }
      } catch {
        appendLog("Chat relay unavailable.");
      }
    };

    const wireChat = () => {
      const container = document.querySelector(".chat");
      const input = document.getElementById("user-message") as HTMLInputElement | null;
      const send = document.getElementById("send-message");
      if (!container || !input || !send) return;
      const sendMessage = () => {
        const value = input.value.trim();
        if (!value) return;
        appendChatBubble(container, "user", value);
        input.value = "";
        if (!isOperator) {
          root.classList.remove("pre-interaction");
          sendTrustCues(value);
        }
        appendThinkingBubble(container);
        postChatMessage("user", value, "participant");
      };

      send.addEventListener("click", sendMessage);
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          sendMessage();
        }
      });
    };

    const wireChatBridge = () => {
      const container = document.querySelector(".chat");
      if (!container) return null;
      const poll = async () => {
        try {
          const response = await fetch(
            `${chatBaseUrl}/chat/${scenarioKey}?afterId=${lastChatId}`,
          );
          if (!response.ok) return;
          const messages = (await response.json()) as Array<{
            id: number;
            role: string;
            text: string;
            source: string;
            clientId?: string;
            timestamp: number;
            taskId?: string;
          }>;
          messages
            .slice()
            .sort((a, b) => a.id - b.id)
            .forEach((message) => {
              if (message.id > lastChatId) {
                lastChatId = message.id;
              }
              if (message.clientId && message.clientId === clientId) {
                return;
              }
              if (message.source === "participant" && message.role === "user" && isOperator) {
                if (message.taskId) {
                  currentTaskId = message.taskId;
                  setSelectedTaskId(message.taskId);
                }
                setLastParticipantMessage(message.text);
                appendChatBubble(container, "user", message.text);
                appendLog("Participant message mirrored to operator.");
              } else if (message.role === "system") {
                appendChatBubble(container, "system", message.text);
              }
            });
        } catch {
          // ignore polling errors
        }
      };

      poll();
      return window.setInterval(poll, 1500);
    };

    wireChat();
    wireValidationControls();
    wireActionConsole();
    chatPoll = wireChatBridge();
    trustPoll = wireTrustSync();
    inputPoll = wireInputSync();
    wireEvidencePanel();
    wireHumanFeedbackPanel();
    wireRecallPrompt();
    wireCueRating();
    wireOperatorReply();
    toggleCueCards();
    drawTrustChart();
    drawGapChart();

    return () => {
      if (chatPoll) {
        window.clearInterval(chatPoll);
      }
      if (trustPoll) {
        window.clearInterval(trustPoll);
      }
      if (inputPoll) {
        window.clearInterval(inputPoll);
      }
    };
  }, [backendUrl, isOperator, scenario.key]);

  return (
    <div id="mockup-root" className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Mock-up only — no live model</p>
          <h1>{scenario.title}</h1>
          <p className="subhead">{scenario.subhead}</p>
        </div>
      </header>

      <main className="grid">
        <section className="panel trust">
          <div className="panel-header">
            <h2>Trust Scores & Calibration State</h2>
            <span className="status">Live</span>
          </div>
          <div className="trust-grid">
            <div className="trust-column">
              <div className="metric-grid">
                <div className="metric">
                  <span className="label">Machine Trust (M)</span>
                  <strong id="machine-trust">{formatScore(scenario.liveMachine)}</strong>
                  <span className="detail">n/a until computed</span>
                </div>
                <div className="metric">
                  <span className="label">Human Trust (H)</span>
                  <strong id="human-trust">{formatScore(scenario.liveHuman)}</strong>
                  <span className="detail">n/a until computed</span>
                </div>
                <div className="metric highlight">
                  <span className="label">Calibration Gap (Δ)</span>
                  <strong id="gap-value">{formatScore(scenario.liveGap)}</strong>
                  <span className="detail">
                    Status: <span id="status-text">{scenario.liveState}</span> | Gap:{" "}
                    <span id="gap-inline">{formatScore(scenario.liveGap)}</span>
                  </span>
                </div>
                <div className="metric">
                  <span className="label">Initial Threshold</span>
                  <strong id="threshold-value">{formatScore(scenario.threshold)}</strong>
                  <span className="detail">
                    Status: <span id="calibration-state">{scenario.liveState}</span> | Decision:{" "}
                    <span id="calibration-decision">{scenario.liveDecision}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="panel conversation">
          <div className="panel-header">
            <h2>Communication Box</h2>
            <div className="openai-badge" aria-label="Powered by OpenAI">
              <Image className="openai-mark" src={openAiLogo} alt="OpenAI" width={28} height={28} />
              <span className="openai-label">Powered by</span>
              <span className="openai-wordmark">OpenAI</span>
            </div>
          </div>
          <div className="chat"></div>
          <div className="input-row active participant-only">
            <input id="user-message" type="text" placeholder="Type a short response..." />
            <button id="send-message" type="button">
              Send
            </button>
          </div>
          <div className="operator-reply operator-only mt-auto">
            <h3>Operator Actions</h3>
            <p className="text-muted mb-2">
              Trigger one response path for the participant.
            </p>
            <div className="d-flex flex-wrap gap-2">
              <button className="btn btn-primary" type="button" onClick={handleSendScripted}>
                Send scripted response
              </button>
              <button className="btn btn-outline-secondary" type="button" onClick={() => handleSendOpenAI("direct")}>
                Send to OpenAI
              </button>
              <button className="btn btn-outline-secondary" type="button" onClick={handleFocusOpenAiPanel}>
                OpenAI + prompt
              </button>
            </div>
            {scriptedStatus ? <p className="status mt-2">{scriptedStatus}</p> : null}
          </div>
          <div className="interaction-controls participant-only">
            <h3>Feedback</h3>
            <div className="thumbs">
              <button id="thumbs-up" className="primary" type="button">
                Accept
              </button>
              <button id="thumbs-down" className="danger" type="button">
                Reject
              </button>
            </div>
            <div className="feedback-controls">
              <label>
                Feeling (self-report)
                <select id="feedback-emotion">
                  <option value="neutral">Neutral</option>
                  <option value="confident">Confident</option>
                  <option value="uncertain">Uncertain</option>
                  <option value="frustrated">Frustrated</option>
                  <option value="satisfied">Satisfied</option>
                </select>
              </label>
              <label>
                Trust rating (1-5)
                <select id="feedback-rating">
                  <option value="">Select</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </label>
            </div>
          </div>
        </section>

        <section className="panel operator-only full-span">
          <h3 className="mb-2">Scripted LLM Responses</h3>
          <p className="text-muted">
            Choose a task and response variant. Use Operator Actions to send responses.
          </p>
          {scriptedTasks.length === 0 ? (
            <p className="text-muted">No scripted responses for this scenario.</p>
          ) : (
            <>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Task</label>
                  <select
                    className="form-select"
                    value={selectedTask?.taskId ?? ""}
                    onChange={(event) => {
                      const value = event.target.value || null;
                      setSelectedTaskId(value);
                      const task = scriptedTasks.find((item) => item.taskId === value);
                      setSelectedVariantKey(task?.variants[0]?.key ?? null);
                      setScriptedStatus("");
                    }}
                  >
                    {scriptedTasks.map((task) => (
                      <option key={task.taskId} value={task.taskId}>
                        {task.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Variant</label>
                  <select
                    className="form-select"
                    value={selectedVariant?.key ?? ""}
                    onChange={(event) => {
                      setSelectedVariantKey(event.target.value || null);
                      setScriptedStatus("");
                    }}
                  >
                    {(selectedTask?.variants ?? []).map((variant) => (
                      <option key={variant.key} value={variant.key}>
                        {variant.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <label className="form-label">Preview</label>
                <textarea
                  className="form-control"
                  rows={10}
                  readOnly
                  value={selectedVariant?.text ?? ""}
                  placeholder="Select a response to preview..."
                ></textarea>
              </div>
              <div className="d-flex flex-wrap gap-2 mt-3">
                <p className="text-muted mb-0">
                  Use the Operator Actions panel to send responses.
                </p>
              </div>
            </>
          )}
        </section>

        <section className="panel operator-only full-span" id="openai-panel">
          <h3 className="mb-2">OpenAI + Operator Prompt</h3>
          <p className="text-muted">
            Review the latest participant request, add an operator prompt for trust calibration,
            then send to OpenAI.
          </p>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label">Participant request</label>
              <textarea
                className="form-control"
                rows={6}
                readOnly
                value={lastParticipantMessage}
                placeholder="Waiting for participant message..."
              ></textarea>
            </div>
            <div className="col-12">
              <label className="form-label">Operator prompt</label>
              <textarea
                className="form-control"
                rows={6}
                value={operatorPrompt}
                onChange={(event) => setOperatorPrompt(event.target.value)}
                placeholder="Add calibration prompt or constraints..."
              ></textarea>
            </div>
          </div>
          <div className="d-flex flex-wrap gap-2 mt-3">
            <button className="btn btn-primary" type="button" onClick={() => handleSendOpenAI("with_prompt")}>
              Send to OpenAI + prompt
            </button>
          </div>
          {scriptedStatus ? <p className="status mt-2">{scriptedStatus}</p> : null}
        </section>

        <section className="panel action-console operator-only">
          <h3>Trust Management</h3>
          <p className="muted">Monitor trust factors and recalibrate as needed.</p>
          <div className="evidence-panel">
            <h3>Trust Factors (from pre-flight questionnaire)</h3>
            {trustFactorsByScenario[scenario.key]?.length ? (
              <>
                <p className="muted">
                  Update masses and weights to recompute machine trust. Weights reflect factor
                  salience (0–1 per factor). Current machine score:{" "}
                  <strong id="machine-score-preview">n/a</strong>
                </p>
                <div className="evidence-table">
                  {(trustFactorsByScenario[scenario.key] || []).map((factor) => (
                    <div className="evidence-row" data-evidence-key={factor.key} key={factor.key}>
                      <div className="evidence-label">{factor.label}</div>
                      <label>
                        Trustworthy
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          defaultValue={factor.trustworthy}
                          data-field="trustworthy"
                        />
                      </label>
                      <label>
                        Untrustworthy
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          defaultValue={factor.untrustworthy}
                          data-field="untrustworthy"
                        />
                      </label>
                      <label>
                        Uncertainty
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          defaultValue={factor.uncertainty}
                          data-field="uncertainty"
                        />
                      </label>
                      <label>
                        Weight <span className="weight-label">Medium</span>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          defaultValue={factor.weight}
                          data-field="weight-range"
                        />
                      </label>
                    </div>
                  ))}
                </div>
                <button id="refresh-machine-score" className="ghost" type="button">
                  Refresh machine trust score
                </button>
              </>
            ) : (
              <p className="muted">No trust factor weights configured for this scenario.</p>
            )}
          </div>
          <div className="evidence-panel">
            <h3>Human Feedback Inputs</h3>
            <p className="muted">
              Use these inputs to estimate human trust from behavior, feedback, and physiology.
              Current human score: <strong id="human-score-preview">n/a</strong>
            </p>
            <div className="evidence-table">
              <div className="evidence-row">
                <div className="evidence-label">Behavior</div>
                <label>
                  Weight
                  <input id="human-behavior-weight" type="number" min="0" max="1" step="0.01" defaultValue="0.55" />
                </label>
                <label>
                  Adopted
                  <input id="human-adopted" type="number" min="0" step="1" defaultValue="0" />
                </label>
                <label>
                  Rejected
                  <input id="human-rejected" type="number" min="0" step="1" defaultValue="0" />
                </label>
                <label>
                  Base rate
                  <input id="human-adoption-base" type="number" min="0" max="1" step="0.01" defaultValue="0.6" />
                </label>
              </div>
              <div className="evidence-row">
                <div className="evidence-label">Feedback</div>
                <label>
                  Weight
                  <input id="human-feedback-weight" type="number" min="0" max="1" step="0.01" defaultValue="0.25" />
                </label>
                <label>
                  Likelihood
                  <input id="human-feedback-likelihood" type="number" min="0" max="1" step="0.01" defaultValue="0.75" />
                </label>
                <label>
                  Confidence
                  <input id="human-feedback-confidence" type="number" min="0" max="1" step="0.01" defaultValue="0.6" />
                </label>
                <label>
                  Base rate
                  <input id="human-feedback-base" type="number" min="0" max="1" step="0.01" defaultValue="0.7" />
                </label>
              </div>
              <div className="evidence-row">
                <div className="evidence-label">Physio</div>
                <label>
                  Weight
                  <input id="human-physio-weight" type="number" min="0" max="1" step="0.01" defaultValue="0.2" />
                </label>
                <label>
                  Likelihood
                  <input id="human-physio-likelihood" type="number" min="0" max="1" step="0.01" defaultValue="0.75" />
                </label>
                <label>
                  Confidence
                  <input id="human-physio-confidence" type="number" min="0" max="1" step="0.01" defaultValue="0.6" />
                </label>
                <label>
                  Base rate
                  <input id="human-physio-base" type="number" min="0" max="1" step="0.01" defaultValue="0.6" />
                </label>
              </div>
            </div>
            <button id="refresh-human-score" className="ghost" type="button">
              Refresh human trust score
            </button>
          </div>
        </section>

        <section className="panel logging">
          <div className="panel-header">
            <h2>Observation Log</h2>
            <span className="status">Auto-captured for analysis</span>
          </div>
          <div className="protocol-block">
            <h3>Trust Cues History</h3>
            <div className="cue-grid">
              <div className="cue-card" id="trust-cues-card">
                <ul className="compact-list" id="trust-cues-list"></ul>
                <label className="cue-rating">
                  Cue rating (1-5)
                  <select id="trust-cues-rating">
                    <option value="">Select</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
          <div className="protocol-block">
            <h3>Prompt History</h3>
            <div className="cue-grid">
              <div className="cue-card" id="prompt-history-card">
                <ul className="compact-list" id="prompt-history"></ul>
                <p className="muted" id="last-prompt-text"></p>
                <button id="recall-prompt" className="ghost" type="button">
                  Recall prompt to chat
                </button>
              </div>
            </div>
          </div>
          <div className="protocol-block">
            <h3>Trust & Gap Evolution</h3>
            <div className="evolution-grid">
              <div className="evolution-card">
                <h3>Trust Scores Over Time</h3>
                <div className="legend">
                  <span className="legend-item">
                    <span className="legend-swatch human"></span>
                    Human trust
                  </span>
                  <span className="legend-item">
                    <span className="legend-swatch machine"></span>
                    Machine trust
                  </span>
                </div>
                <svg
                  id="trust-evolution-chart"
                  viewBox="0 0 240 80"
                  width="100%"
                  height="80"
                  role="img"
                  aria-label="Trust scores over time"
                ></svg>
              </div>
              <div className="evolution-card">
                <h3>Gap Over Time</h3>
                <div className="legend">
                  <span className="legend-item">
                    <span className="legend-swatch gap"></span>
                    Gap (H − M)
                  </span>
                </div>
                <svg
                  id="gap-evolution-chart"
                  viewBox="0 0 240 80"
                  width="100%"
                  height="80"
                  role="img"
                  aria-label="Gap over time"
                ></svg>
              </div>
            </div>
          </div>
        </section>
      </main>
      <div className="back-home">
        <a className="ghost" href="/">
          Back to home
        </a>
      </div>
    </div>
  );
}
