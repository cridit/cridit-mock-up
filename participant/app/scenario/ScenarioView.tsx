"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ScenarioData } from "./data";
import { generateClientId, loadSession, saveSession, type BenchmarkEvidence } from "../lib/session";
import openAiLogo from "./open-ai-logo.png";

type ScenarioViewProps = {
  scenario: ScenarioData;
  isOperator?: boolean;
  backendUrl?: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function ScenarioView({ scenario, isOperator, backendUrl }: ScenarioViewProps) {
  const tasks = scenario.tasks ?? [];
  const totalTasks = tasks.length;
  const [activeTaskIndex, setActiveTaskIndex] = useState<number | null>(
    totalTasks > 0 ? 0 : null,
  );
  const activeTaskId =
    activeTaskIndex === null ? null : `${scenario.key}-task-${activeTaskIndex + 1}`;
  const scenarioRef = useRef(scenario);
  const activeTaskIdRef = useRef<string | null>(activeTaskId);
  const resolveTaskLabel = (taskId?: string | null) => {
    if (!taskId) {
      return "Unassigned";
    }
    const prefix = `${scenario.key}-task-`;
    if (taskId.startsWith(prefix)) {
      const index = Number(taskId.slice(prefix.length)) - 1;
      const task = tasks[index];
      if (task) {
        return task.title;
      }
    }
    return taskId;
  };
  const activeTask = useMemo(() => {
    if (totalTasks === 0 || activeTaskIndex === null) {
      return null;
    }
    const index = Math.min(Math.max(activeTaskIndex, 0), totalTasks - 1);
    return tasks[index];
  }, [activeTaskIndex, tasks, totalTasks]);

  const formatScore = (value?: number | null) =>
    typeof value === "number" && Number.isFinite(value) ? value.toFixed(3) : "n/a";

  const handleStartTask = (index: number) => {
    if (totalTasks === 0) {
      return;
    }
    setActiveTaskIndex(index);
    const section = document.getElementById("interaction-section");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    scenarioRef.current = scenario;
  }, [scenario]);

  useEffect(() => {
    activeTaskIdRef.current = activeTaskId;
  }, [activeTaskId]);

  useEffect(() => {
    const root = document.getElementById("mockup-root");
    if (!root) return;
    if (isOperator) {
      root.classList.add("show-operator");
    } else {
      root.classList.add("pre-interaction");
    }

    const chatBaseUrl = backendUrl || "http://cridit-mock-up:8001";
    let chatPoll: number | null = null;
    let trustPoll: number | null = null;
    let lastChatId = 0;
    let lastParticipantRequest = "";
    const session = loadSession();
    const resolvedClientId = session?.clientId ?? generateClientId();
    if (session && !session.clientId) {
      saveSession({ clientId: resolvedClientId });
    }
    const clientId = resolvedClientId;

    const interactionState = {
      adopted: 0,
      rejected: 0,
      roundIndex: 0,
    };
    let behaviorChoiceLocked = false;
    let feedbackSubmitLocked = false;
    let toastTimeout: number | null = null;
    let lastCalibrationKey = "";
    const benchmarkEvidence = (session?.benchmarkEvidence ?? []) as BenchmarkEvidence[];

    const showFeedbackToast = (
      message: string,
      tone: "info" | "success" | "warn" = "info",
    ) => {
      const toast = document.getElementById("feedback-toast");
      if (!toast) return;
      toast.textContent = message;
      toast.classList.remove("info", "success", "warn");
      toast.classList.add("visible", tone);
      if (toastTimeout) {
        window.clearTimeout(toastTimeout);
      }
      toastTimeout = window.setTimeout(() => {
        toast.classList.remove("visible");
        toastTimeout = null;
      }, 1600);
    };

    const resetFeedbackUiForNewRound = () => {
      behaviorChoiceLocked = false;
      feedbackSubmitLocked = false;
      const up = document.getElementById("thumbs-up") as HTMLButtonElement | null;
      const down = document.getElementById("thumbs-down") as HTMLButtonElement | null;
      if (up) {
        up.disabled = false;
        up.classList.remove("selected");
      }
      if (down) {
        down.disabled = false;
        down.classList.remove("selected");
      }
      const submit = document.getElementById("submit-feedback") as HTMLButtonElement | null;
      if (submit) {
        submit.disabled = false;
        submit.classList.remove("submitted");
      }
    };

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

    const syncAdoptionCounts = async (adopted: number, rejected: number) => {
      const scenarioKey = scenarioRef.current.key;
      try {
        const response = await fetch(`${chatBaseUrl}/inputs/${scenarioKey}`);
        let baselineMachine = scenarioRef.current.baselineMachine;
        let preflightHuman = scenarioRef.current.preflightHuman;
        let threshold = scenarioRef.current.threshold;
        if (response.ok) {
          const existing = (await response.json().catch(() => null)) as
            | { baselineMachine?: number; preflightHuman?: number; threshold?: number }
            | null;
          if (typeof existing?.baselineMachine === "number") {
            baselineMachine = existing.baselineMachine;
          }
          if (typeof existing?.preflightHuman === "number") {
            preflightHuman = existing.preflightHuman;
          }
          if (typeof existing?.threshold === "number") {
            threshold = existing.threshold;
          }
        }
        await fetch(`${chatBaseUrl}/inputs/${scenarioKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            baselineMachine,
            preflightHuman,
            threshold,
            adopted,
            rejected,
          }),
        });
      } catch {
        // ignore sync failures
      }
    };

    const maxHistory = 24;
    const trustHistory: Array<{ human: number; machine: number }> = [];
    const gapHistory: number[] = [];

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
        trustHistory.map((point) => point.human),
        "#D46A6A",
        0,
        1,
      );
      drawPoints(
        svg,
        trustHistory.map((point) => point.human),
        "#D46A6A",
        0,
        1,
      );
      drawLine(
        svg,
        trustHistory.map((point) => point.machine),
        "#4A7C9B",
        0,
        1,
      );
      drawPoints(
        svg,
        trustHistory.map((point) => point.machine),
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
      drawLine(svg, gapHistory, "#E0A458", -1, 1);
      drawPoints(svg, gapHistory, "#E0A458", -1, 1);
    };

    const updateTrustEvolution = (humanText: string, machineText: string) => {
      const human = Number(humanText);
      const machine = Number(machineText);
      if (!Number.isFinite(human) || !Number.isFinite(machine)) {
        return;
      }
      trustHistory.push({ human, machine });
      if (trustHistory.length > maxHistory) {
        trustHistory.shift();
      }
      drawTrustChart();
    };

    const updateGapEvolution = (gapText: string) => {
      const gap = Number(gapText);
      if (!Number.isFinite(gap)) {
        return;
      }
      gapHistory.push(gap);
      if (gapHistory.length > maxHistory) {
        gapHistory.shift();
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
        typeof value === "number" && Number.isFinite(value) ? value.toFixed(3) : "n/a";
      return [
        toKey(payload.humanTrustScore),
        toKey(payload.machineTrustScore),
        toKey(payload.humanMachineTrustGap),
        toKey(payload.threshold),
        payload.decision ?? "NO ACTION",
      ].join("|");
    };

    const wireTrustSync = () => {
      const statusId = "trust-sync-status";
      const endpoint = `${chatBaseUrl}/cridit/calibration/latest/${scenario.key}`;
      const poll = async () => {
        try {
          const response = await fetch(endpoint, { cache: "no-store" });
          if (!response.ok) {
            setText(statusId, `Trust history unavailable (${response.status}).`);
            return;
          }
          const trustCues = (await response.json()) as {
            machineTrustScore?: number;
            humanTrustScore?: number;
            humanMachineTrustGap?: number;
            threshold?: number;
            decision?: string;
            timestamp?: string;
            taskId?: string;
          };
          if (typeof trustCues.machineTrustScore !== "number") {
            setText(statusId, "Trust history not ready yet.");
            return;
          }
          const calibrationKey = buildCalibrationKey(trustCues);
          if (calibrationKey && calibrationKey === lastCalibrationKey) {
            return;
          }
          lastCalibrationKey = calibrationKey;
          const humanValue =
            typeof trustCues.humanTrustScore === "number" ? trustCues.humanTrustScore : NaN;
          const machineValue =
            typeof trustCues.machineTrustScore === "number" ? trustCues.machineTrustScore : NaN;
          const thresholdValue =
            typeof trustCues.threshold === "number"
              ? trustCues.threshold
              : scenarioRef.current.threshold;
          const machineToUse = machineValue;
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
          const taskLabel = resolveTaskLabel(trustCues.taskId);

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
          updateGapWarning(gapValue, thresholdValue, decision, taskLabel);
          const timeLabel = trustCues.timestamp ?? new Date().toISOString();
          setText(statusId, `Last update: ${timeLabel} · Task: ${taskLabel}`);
          setText("trust-task-label", taskLabel);
        } catch {
          setText(statusId, "Trust history unavailable (network).");
        }
      };

      poll();
      return window.setInterval(poll, 2000);
    };

    const setText = (id: string, value: string) => {
      const node = document.getElementById(id);
      if (node) {
        node.textContent = value;
      }
    };

    const toggleCueCards = () => {
      const cues = document.getElementById("trust-cues-list");
      const cuesCard = document.getElementById("trust-cues-card") as HTMLElement | null;
      const promptText = document.getElementById("last-prompt-text");
      const promptList = document.getElementById("prompt-history");
      const promptCard = document.getElementById("prompt-history-card") as HTMLElement | null;
      const cuesGrid = document.querySelector(".cue-grid") as HTMLElement | null;
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

    const computeDecisionFromGap = (gap: number, threshold: number) => {
      if (gap > threshold) {
        return "DECREASE HUMAN TRUST";
      }
      if (gap < -threshold) {
        return "INCREASE HUMAN TRUST";
      }
      return "NO ACTION";
    };

    const updateGapWarning = (
      gapValue: number,
      thresholdValue: number,
      decision: string,
      taskLabel: string,
    ) => {
      const warning = document.getElementById("trust-gap-warning");
      if (!warning) return;
      if (Number.isFinite(gapValue) && Number.isFinite(thresholdValue) && Math.abs(gapValue) > thresholdValue) {
        if (decision === "INCREASE HUMAN TRUST") {
          warning.textContent =
            `${taskLabel}: The system performs well on this task. You can rely on it to improve efficiency.`;
        } else if (decision === "DECREASE HUMAN TRUST") {
          warning.textContent =
            `${taskLabel}: Please verify the output carefully. The system can make mistakes.`;
        } else {
          warning.textContent = `${taskLabel}: Trust gap exceeds the threshold.`;
        }
        warning.classList.add("active");
      } else {
        warning.textContent = "";
        warning.classList.remove("active");
      }
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

    const readLikert = (id: string) => {
      const raw = (document.getElementById(id) as HTMLSelectElement | null)?.value;
      const parsed = raw ? Number(raw) : null;
      return Number.isFinite(parsed) ? parsed : null;
    };

    const sendTrustCues = async (message: string) => {
      const reliability = readLikert("feedback-reliability");
      const predictability = readLikert("feedback-predictability");
      const selfConfidence = readLikert("feedback-self-confidence");
      const taskCriticality = readLikert("task-criticality");
      const taskComplexity = readLikert("task-complexity");
      const interactionId = `interaction-${Date.now()}`;
      const hasFeedbackScalars =
        reliability !== null &&
        predictability !== null &&
        selfConfidence !== null &&
        taskCriticality !== null;
      const feedbackLikelihood = 0.5;
      const feedbackWeight = hasFeedbackScalars ? 0.25 : 0;
      const behaviorWeight = 0.55;
      const weightSum = behaviorWeight + feedbackWeight;
      const behaviorInputWeight = weightSum > 0 ? behaviorWeight / weightSum : 1;
      const feedbackInputWeight = weightSum > 0 ? feedbackWeight / weightSum : 0;

      const scenarioKey = scenarioRef.current.key;
      const evidence =
        evidenceByScenario[scenarioKey as keyof typeof evidenceByScenario] ||
        evidenceByScenario.financial;
      const benchmarkRequest =
        benchmarkEvidence.length > 0
          ? {
              evidenceSet: benchmarkEvidence.map((item) => ({
                evidenceKey: item.evidenceKey,
                trustworthyMass: item.trustworthyMass,
                untrustworthyMass: item.untrustworthyMass,
                uncertaintyMass: item.uncertaintyMass,
              })),
              evidenceWeights: benchmarkEvidence.map((item) => ({
                evidenceKey: item.evidenceKey,
                weight: item.weight,
              })),
            }
          : {
              evidenceSet: [
                {
                  evidenceKey: "mock",
                  trustworthyMass: evidence.trustworthyMass,
                  untrustworthyMass: evidence.untrustworthyMass,
                  uncertaintyMass: evidence.uncertaintyMass,
                },
              ],
              evidenceWeights: [{ evidenceKey: "mock", weight: 1.0 }],
            };
      interactionState.roundIndex += 1;

      const payload = {
        participantId: null,
        sessionId: session?.sessionId ?? `${scenarioKey}-session`,
        interactionId,
        timestamp: new Date().toISOString(),
        benchmarkMetricRequest: benchmarkRequest,
        humanInputRequest: {
          behaviorInputWeight,
          adopted: interactionState.adopted,
          rejected: interactionState.rejected,
          adoptionBaseRate: 0.6,
          feedbackInputWeight,
          feedbackLikelihood,
          feedbackConfidence: feedbackInputWeight > 0 ? 0.7 : 0,
          feedbackBaseRate: 0.4,
          reliability,
          predictability,
          selfConfidence,
          taskCriticality,
        },
        feedbackInput: {
          rating: null,
          feedbackText: message || "",
          selfConfidence: selfConfidence?.toString() ?? null,
          satisfaction: null,
          helpfulness: null,
          trustCueUsefulness: null,
          trustFactors: [],
          timestamp: new Date().toISOString(),
          interactionId,
      },
        error: 0.15,
        risk: 0.25,
        riskPerception: null,
        previousMiscalibrationState: resolvePreviousState(),
        taskId: activeTaskIdRef.current ?? scenarioKey,
        domain: scenarioKey,
        difficulty: taskComplexity?.toString() ?? null,
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
          `${backendUrl || "http://cridit-mock-up:8001"}/cridit/calibration/trustCues`,
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
        lastCalibrationKey = buildCalibrationKey(trustCues);
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
        updateGapWarning(gapValue, thresholdValue, decision, resolveTaskLabel(trustCues.taskId));
        toggleCueCards();
        appendLog(`Calibration updated: ${decision}, gap=${gap}.`);
      } catch (error) {
        appendLog(
          `Calibration error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    };

    const wireRecallPrompt = () => {};

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
        if (behaviorChoiceLocked) {
          showFeedbackToast("Already recorded for this round.", "warn");
          return;
        }
        behaviorChoiceLocked = true;
        const upButton = up as HTMLButtonElement;
        const downButton = down as HTMLButtonElement;
        upButton.disabled = true;
        downButton.disabled = true;
        upButton.classList.add("selected");
        interactionState.adopted += 1;
        appendLog("Behavioral choice recorded: accept.");
        showFeedbackToast("Recorded: Accept.", "success");
        syncAdoptionCounts(interactionState.adopted, interactionState.rejected);
      });
      down.addEventListener("click", () => {
        if (behaviorChoiceLocked) {
          showFeedbackToast("Already recorded for this round.", "warn");
          return;
        }
        behaviorChoiceLocked = true;
        const upButton = up as HTMLButtonElement;
        const downButton = down as HTMLButtonElement;
        upButton.disabled = true;
        downButton.disabled = true;
        downButton.classList.add("selected");
        interactionState.rejected += 1;
        appendLog("Behavioral choice recorded: reject.");
        showFeedbackToast("Recorded: Reject.", "success");
        syncAdoptionCounts(interactionState.adopted, interactionState.rejected);
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

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const renderInline = (value: string) => {
      const escaped = escapeHtml(value);
      return escaped
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\*([^*]+)\*/g, "<em>$1</em>");
    };

    const renderMarkdown = (segment: string) => {
      const lines = segment.split("\n");
      const parts: string[] = [];
      let inUl = false;
      let inOl = false;
      const closeLists = () => {
        if (inUl) {
          parts.push("</ul>");
          inUl = false;
        }
        if (inOl) {
          parts.push("</ol>");
          inOl = false;
        }
      };

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          closeLists();
          parts.push("<br>");
          continue;
        }

        const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)$/);
        if (headingMatch) {
          closeLists();
          const level = headingMatch[1].length;
          const tag = level === 1 ? "h4" : level === 2 ? "h5" : "h6";
          parts.push(`<${tag}>${renderInline(headingMatch[2])}</${tag}>`);
          continue;
        }

        const olMatch = line.match(/^\s*\d+[.)]\s+(.*)$/);
        if (olMatch) {
          if (!inOl) {
            closeLists();
            parts.push("<ol>");
            inOl = true;
          }
          parts.push(`<li>${renderInline(olMatch[1])}</li>`);
          continue;
        }

        const ulMatch = line.match(/^\s*[-*]\s+(.*)$/);
        if (ulMatch) {
          if (!inUl) {
            closeLists();
            parts.push("<ul>");
            inUl = true;
          }
          parts.push(`<li>${renderInline(ulMatch[1])}</li>`);
          continue;
        }

        closeLists();
        parts.push(`<p>${renderInline(trimmed)}</p>`);
      }

      closeLists();
      return parts.join("");
    };

    const formatChatText = (value: string) => {
      const normalized = value.replace(/\r\n/g, "\n");
      const trimmed = normalized.trim();
      if (!trimmed) return "";
      if (!trimmed.includes("```") && (trimmed.startsWith("{") || trimmed.startsWith("["))) {
        try {
          const pretty = JSON.stringify(JSON.parse(trimmed), null, 2);
          return `<pre><code>${escapeHtml(pretty)}</code></pre>`;
        } catch {
          // fall through to markdown rendering
        }
      }
      const parts: string[] = [];
      const fenceRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = fenceRegex.exec(normalized)) !== null) {
        const [fullMatch, _lang, code] = match;
        const start = match.index;
        if (start > lastIndex) {
          const segment = normalized.slice(lastIndex, start);
          parts.push(renderMarkdown(segment));
        }
        parts.push(`<pre><code>${escapeHtml(code)}</code></pre>`);
        lastIndex = start + fullMatch.length;
      }
      if (lastIndex < normalized.length) {
        const tail = normalized.slice(lastIndex);
        parts.push(renderMarkdown(tail));
      }
      return parts.join("");
    };

    const appendChatBubble = (container: Element, role: string, text: string) => {
      const bubble = document.createElement("div");
      bubble.className = `bubble ${role}`;
      const header = document.createElement("div");
      header.className = "bubble-header";
      header.innerHTML = `<strong>${role === "user" ? "Participant" : "System"}</strong>`;
      const body = document.createElement("div");
      body.className = "bubble-body";
      body.innerHTML = formatChatText(text);
      bubble.appendChild(header);
      bubble.appendChild(body);
      container.appendChild(bubble);
      (container as HTMLElement).scrollTop = (container as HTMLElement).scrollHeight;
    };

    const summarize = (value: string, maxLength: number) => {
      if (value.length <= maxLength) {
        return value;
      }
      return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
    };

    const appendPromptHistory = (text: string, taskId?: string | null) => {
      const taskLabel = taskId && taskId.trim() ? taskId.trim() : "task-unknown";
      const participantText = summarize(lastParticipantRequest || "n/a", 140);
      const promptText = summarize(text, 140);
      appendListItem(
        "prompt-history",
        `${taskLabel} | Participant: ${participantText} | Prompt: ${promptText}`,
      );
      setText("last-prompt-text", `Participant: ${participantText} | Prompt: ${promptText}`);
      setText("prompt-task-label", taskLabel);
      toggleCueCards();
    };

    const appendThinkingBubble = (container: Element) => {
      const bubble = document.createElement("div");
      bubble.className = "bubble system thinking";
      const header = document.createElement("div");
      header.className = "bubble-header";
      header.innerHTML = "<strong>System</strong>";
      const body = document.createElement("div");
      body.className = "bubble-body";
      body.textContent = "Thinking...";
      bubble.appendChild(header);
      bubble.appendChild(body);
      container.appendChild(bubble);
      (container as HTMLElement).scrollTop = (container as HTMLElement).scrollHeight;
    };

    const replaceThinkingBubble = (container: Element, text: string) => {
      const thinking = container.querySelector(".bubble.system.thinking");
      if (!thinking) {
        appendChatBubble(container, "system", text);
        return;
      }
      const body = thinking.querySelector(".bubble-body");
      if (body) {
        body.innerHTML = formatChatText(text);
      }
      thinking.classList.remove("thinking");
    };

    const wireOperatorReply = () => {
      const input = document.getElementById("operator-message") as HTMLInputElement | null;
      const send = document.getElementById("operator-send");
      const container = document.querySelector(".chat");
      if (!input || !send || !container) return;

      const sendMessage = () => {
        const value = input.value.trim();
        if (!value) return;
        replaceThinkingBubble(container, value);
        appendLog("Operator sent system reply.");
        postChatMessage("system", value, "operator");
        input.value = "";
      };

      send.addEventListener("click", sendMessage);
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          sendMessage();
        }
      });
    };

    const postChatMessage = async (
      role: string,
      text: string,
      source: string,
      meta?: {
        rating?: number | null;
        adopted?: number | null;
        rejected?: number | null;
        selfConfidence?: string | null;
        selfConfidenceScore?: number | null;
        reliability?: number | null;
        predictability?: number | null;
        taskCriticality?: number | null;
        taskComplexity?: number | null;
        satisfaction?: string | null;
        helpfulness?: string | null;
        trustCueUsefulness?: string | null;
        interactionId?: string | null;
      },
    ) => {
      try {
        const sessionId = session?.sessionId ?? null;
        const response = await fetch(`${chatBaseUrl}/chat/${scenario.key}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            role,
            text,
            source,
            clientId,
            taskId: activeTaskIdRef.current ?? activeTaskId,
            rating: meta?.rating ?? null,
            adopted: meta?.adopted ?? null,
            rejected: meta?.rejected ?? null,
            selfConfidence: meta?.selfConfidence ?? null,
            selfConfidenceScore: meta?.selfConfidenceScore ?? null,
            reliability: meta?.reliability ?? null,
            predictability: meta?.predictability ?? null,
            taskCriticality: meta?.taskCriticality ?? null,
            taskComplexity: meta?.taskComplexity ?? null,
            satisfaction: meta?.satisfaction ?? null,
            helpfulness: meta?.helpfulness ?? null,
            trustCueUsefulness: meta?.trustCueUsefulness ?? null,
            interactionId: meta?.interactionId ?? null,
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
      const input = document.getElementById("user-message") as HTMLTextAreaElement | null;
      const send = document.getElementById("send-message");
      if (!container || !input || !send) return null;
      const sendMessage = () => {
        const value = input.value.trim();
        if (!value) return;
        resetFeedbackUiForNewRound();
        appendChatBubble(container, "user", value);
        lastParticipantRequest = value;
        input.value = "";
        if (!isOperator) {
          root.classList.remove("pre-interaction");
          sendTrustCues(value);
        }
        appendThinkingBubble(container);
        postChatMessage("user", value, "participant");
      };

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          sendMessage();
        }
      };

      send.addEventListener("click", sendMessage);
      input.addEventListener("keydown", onKeyDown);
      return () => {
        send.removeEventListener("click", sendMessage);
        input.removeEventListener("keydown", onKeyDown);
      };
    };

    const wireChatBridge = () => {
      const container = document.querySelector(".chat");
      if (!container) return null;
      const processMessage = (message: {
        id: number;
        sessionId?: string;
        role: string;
        text: string;
        source: string;
        clientId?: string;
        timestamp: number;
        taskId?: string;
      }, includeSelf: boolean) => {
        if (message.id > lastChatId) {
          lastChatId = message.id;
        }
        if (!includeSelf && message.clientId && message.clientId === clientId) {
          return;
        }
        if (message.source === "interaction_feedback") {
          return;
        }
        if (message.role === "user") {
          appendChatBubble(container, "user", message.text);
          if (message.source === "participant") {
            lastParticipantRequest = message.text;
          }
        } else if (message.source === "operator_prompt" && message.role === "system" && !isOperator) {
          appendPromptHistory(message.text, message.taskId);
        } else if (message.source === "operator" && message.role === "system" && !isOperator) {
          replaceThinkingBubble(container, message.text);
          appendLog("Operator response delivered to participant.");
        } else if (message.role === "system") {
          appendChatBubble(container, "system", message.text);
        }
      };
      const loadChatHistory = async () => {
        try {
          const sessionId = session?.sessionId ?? "";
          const url = sessionId
            ? `${chatBaseUrl}/chat/${scenario.key}?sessionId=${encodeURIComponent(sessionId)}`
            : `${chatBaseUrl}/chat/${scenario.key}`;
          const response = await fetch(url, { cache: "no-store" });
          if (!response.ok) return;
          const messages = (await response.json()) as Array<{
            id: number;
            sessionId?: string;
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
            .forEach((message) => processMessage(message, true));
        } catch {
          // ignore history load errors
        }
      };
      const poll = async () => {
        try {
          const sessionId = session?.sessionId ?? "";
          const sessionParam = sessionId ? `&sessionId=${encodeURIComponent(sessionId)}` : "";
          const response = await fetch(
            `${chatBaseUrl}/chat/${scenario.key}?afterId=${lastChatId}${sessionParam}`,
          );
          if (!response.ok) return;
          const messages = (await response.json()) as Array<{
            id: number;
            sessionId?: string;
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
            .forEach((message) => processMessage(message, false));
        } catch {
          // ignore polling errors
        }
      };

      loadChatHistory().then(poll);
      return window.setInterval(poll, 1500);
    };

    const loadCalibrationHistory = async () => {
      try {
        const response = await fetch(
          `${chatBaseUrl}/cridit/calibration/history/${scenario.key}`,
          { cache: "no-store" },
        );
        if (!response.ok) {
          return;
        }
        const entries = (await response.json()) as Array<{
          humanTrustScore?: number;
          machineTrustScore?: number;
          humanMachineTrustGap?: number;
          threshold?: number;
          decision?: string;
          timestamp?: string;
        }>;
        if (!Array.isArray(entries) || entries.length === 0) {
          return;
        }
        entries.forEach((entry) => {
          if (typeof entry.humanTrustScore === "number" && typeof entry.machineTrustScore === "number") {
            trustHistory.push({ human: entry.humanTrustScore, machine: entry.machineTrustScore });
          }
          if (typeof entry.humanMachineTrustGap === "number") {
            gapHistory.push(entry.humanMachineTrustGap);
          }
        });
        if (trustHistory.length > maxHistory) {
          trustHistory.splice(0, trustHistory.length - maxHistory);
        }
        if (gapHistory.length > maxHistory) {
          gapHistory.splice(0, gapHistory.length - maxHistory);
        }
        drawTrustChart();
        drawGapChart();
        const lastEntry = entries[entries.length - 1];
        lastCalibrationKey = buildCalibrationKey(lastEntry);
      } catch {
        // ignore history load errors
      }
    };

    const wireFeedbackSubmit = () => {
      const submit = document.getElementById("submit-feedback");
      if (!submit) return null;
      const onClick = () => {
        if (feedbackSubmitLocked) {
          showFeedbackToast("Feedback already submitted for this round.", "warn");
          return;
        }
        const reliability = readLikert("feedback-reliability");
        const predictability = readLikert("feedback-predictability");
        const selfConfidence = readLikert("feedback-self-confidence");
        const taskCriticality = readLikert("task-criticality");
        const taskComplexity = readLikert("task-complexity");
        if (
          reliability === null ||
          predictability === null ||
          selfConfidence === null ||
          taskCriticality === null
        ) {
          appendLog("Please complete reliability, predictability, self-confidence, and criticality.");
          showFeedbackToast("Complete required feedback fields first.", "warn");
          return;
        }
        postChatMessage("system", "", "interaction_feedback", {
          adopted: interactionState.adopted,
          rejected: interactionState.rejected,
          selfConfidenceScore: selfConfidence,
          reliability,
          predictability,
          taskCriticality,
          taskComplexity,
        });
        appendLog("Feedback submitted to operator.");
        feedbackSubmitLocked = true;
        const submitButton = submit as HTMLButtonElement;
        submitButton.disabled = true;
        submitButton.classList.add("submitted");
        showFeedbackToast("Feedback submitted.", "success");
      };
      submit.addEventListener("click", onClick);
      return () => {
        submit.removeEventListener("click", onClick);
      };
    };

    const endSessionButton = document.getElementById("end-session");
    const handleEndSession = () => {
      window.location.assign("/postflight");
    };
    if (endSessionButton) {
      endSessionButton.addEventListener("click", handleEndSession);
    }

    const cleanupChat = wireChat();
    wireValidationControls();
    wireActionConsole();
    chatPoll = wireChatBridge();
    trustPoll = wireTrustSync();
    loadCalibrationHistory();
    const cleanupFeedbackSubmit = wireFeedbackSubmit();
    wireRecallPrompt();
    wireCueRating();
    wireOperatorReply();
    toggleCueCards();

    return () => {
      if (toastTimeout) {
        window.clearTimeout(toastTimeout);
      }
      if (chatPoll) {
        window.clearInterval(chatPoll);
      }
      if (trustPoll) {
        window.clearInterval(trustPoll);
      }
      if (endSessionButton) {
        endSessionButton.removeEventListener("click", handleEndSession);
      }
      if (cleanupChat) {
        cleanupChat();
      }
      if (cleanupFeedbackSubmit) {
        cleanupFeedbackSubmit();
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
        {scenario.tasks && scenario.tasks.length > 0 ? (
          <section className="panel task-brief participant-only full-span">
            <div className="panel-header">
              <h2>Participant Tasks</h2>
              <span className="status">Choose any task order</span>
            </div>
            <div className="row g-3 align-items-stretch">
              {tasks.map((task, index) => {
                const isActive = activeTaskIndex === index;
                return (
                  <div key={task.title} className="col-12 col-lg-4 d-flex">
                    <div className={`card h-100 w-100 task-card ${isActive ? "is-active" : ""}`}>
                      <div className="card-body d-flex flex-column gap-3">
                        <div className="task-header">
                          <h3 className="card-title h6 mb-0">{task.title}</h3>
                          <span className="status">{task.duration}</span>
                        </div>
                        <p className="muted mb-0">{task.mission}</p>
                        <div className="task-details">
                          <div>
                            <p className="label">Inputs</p>
                            <ul className="compact-list">
                              {task.inputs.map((input) => (
                                <li key={input}>{input}</li>
                              ))}
                            </ul>
                            {task.providedInputs && task.providedInputs.length > 0 ? (
                              <details className="task-inputs">
                                <summary className="btn btn-link p-0 text-start">Provided inputs</summary>
                                <div className="task-inputs-body">
                                  {task.providedInputs.map((inputBlock) => {
                                    if (inputBlock.type === "text") {
                                      return (
                                        <div key={inputBlock.title} className="task-input-block">
                                          <p className="muted mb-2">{inputBlock.title}</p>
                                          <ul className="compact-list">
                                            {inputBlock.lines.map((line, lineIndex) => (
                                              <li key={`${inputBlock.title}-${lineIndex}`}>{line}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      );
                                    }
                                    if (inputBlock.type === "list") {
                                      return (
                                        <div key={inputBlock.title} className="task-input-block">
                                          <p className="muted mb-2">{inputBlock.title}</p>
                                          <ul className="compact-list">
                                            {inputBlock.items.map((item) => (
                                              <li key={item}>{item}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      );
                                    }
                                    return (
                                      <div key={inputBlock.title} className="task-input-block">
                                        <p className="muted mb-2">{inputBlock.title}</p>
                                        <table className="table table-sm input-table mb-0">
                                          <thead>
                                            <tr>
                                              {inputBlock.columns.map((column) => (
                                                <th key={column}>{column}</th>
                                              ))}
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {inputBlock.rows.map((row) => (
                                              <tr key={`${row[0]}-${row[1]}`}>
                                                <td>{row[0]}</td>
                                                <td>{row[1]}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    );
                                  })}
                                </div>
                              </details>
                            ) : null}
                            <div className="mt-3 d-flex justify-content-start">
                              <button
                                className={isActive ? "btn btn-primary" : "btn btn-outline-secondary"}
                                type="button"
                                onClick={() => handleStartTask(index)}
                              >
                                {isActive ? "Active task" : "Start task"}
                              </button>
                            </div>
                          </div>
                          <div>
                            <p className="label">Expected output</p>
                            <ul className="compact-list">
                              {task.expectedOutput.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <div>
                          <p className="label">Suggested steps</p>
                          <ol className="step-list">
                            {task.steps.map((step) => (
                              <li key={step}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {scenario.violationExamples && scenario.violationExamples.length > 0 ? (
              <div className="task-violations">
                <p className="label">Where violations/remediation happen</p>
                <ul className="compact-list">
                  {scenario.violationExamples.map((example) => (
                    <li key={example}>{example}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}
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
          <div className="action-console operator-only">
            <h3>Trust Management</h3>
            <p className="muted">Monitor trust factors and recalibrate as needed.</p>
            <div className="request-log">
              <div className="log-entry">
                <span className="time">--:--</span>
                <span className="event">Awaiting action commands.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="panel conversation" id="interaction-section">
          <div className="panel-header">
            <h2>
              Communication Box
              {activeTask ? ` — ${activeTask.title}` : ""}
            </h2>
            <div className="openai-badge" aria-label="Powered by OpenAI">
              <Image className="openai-mark" src={openAiLogo} alt="OpenAI" width={28} height={28} />
              <span className="openai-label">Powered by</span>
              <span className="openai-wordmark">OpenAI</span>
            </div>
          </div>
          <div className="chat"></div>
          <div className="input-row active participant-only">
            <textarea
              id="user-message"
              placeholder="Type your response... (Shift+Enter for a new line)"
              rows={3}
            />
            <button id="send-message" type="button">
              Send
            </button>
          </div>
          <div className="operator-reply operator-only">
            <h3>System Reply</h3>
            <p className="muted">Operator sends the system response from the communication box.</p>
            <div className="input-row active">
              <input id="operator-message" type="text" placeholder="Type the system reply..." />
              <button id="operator-send" type="button">
                Send
              </button>
            </div>
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
            <div id="feedback-toast" className="feedback-toast" role="status" aria-live="polite" />
            <div className="feedback-controls">
              <label>
                Self-confidence (1-7)
                <select id="feedback-self-confidence">
                  <option value="">Select</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                </select>
              </label>
              <label>
                Reliability (1-7)
                <select id="feedback-reliability">
                  <option value="">Select</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                </select>
              </label>
              <label>
                Predictability (1-7)
                <select id="feedback-predictability">
                  <option value="">Select</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                </select>
              </label>
              <label>
                Task criticality (1-7)
                <select id="task-criticality">
                  <option value="">Select</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                </select>
              </label>
              <label>
                Task complexity (1-7)
                <select id="task-complexity">
                  <option value="">Select</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                </select>
              </label>
            </div>
            <div className="form-actions">
              <button id="submit-feedback" className="ghost" type="button">
                Submit feedback
              </button>
              <button id="end-session" className="primary" type="button">
                End session
              </button>
            </div>
          </div>
        </section>

        <section className="panel logging">
          <div className="panel-header">
            <h2>Observation Log</h2>
            <span className="status">Auto-captured for analysis</span>
          </div>
          <div className="protocol-block">
            <h3>Trust Cue Warning</h3>
            <p id="trust-gap-warning" className="trust-warning" role="alert"></p>
          </div>
          <div className="protocol-block">
            <h3>Prompt History</h3>
            <div className="cue-grid">
              <div className="cue-card" id="prompt-history-card">
                <ul className="compact-list" id="prompt-history"></ul>
              </div>
            </div>
          </div>
            <div className="protocol-block">
              <h3>Trust & Gap Evolution</h3>
              <p className="status" id="trust-sync-status">
                Awaiting calibration history...
              </p>
              <p className="muted">
                Bound to task: <span id="trust-task-label">{resolveTaskLabel(activeTaskId)}</span>
              </p>
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
