export const MOCK_MODE = true;

export type ScenarioKey = "medical" | "justice" | "infrastructure";

type BaselineTask = {
  taskId: string;
  domain: string;
  trustScore: number;
  riskScore: number;
};

type TrustCuesPayload = {
  humanInputRequest: {
    adopted: number;
    rejected: number;
    adoptionBaseRate: number;
    feedbackBaseRate: number;
  };
  benchmarkMetricRequest?: {
    evidenceSet: {
      evidenceKey: string;
      trustworthyMass: number;
      untrustworthyMass: number;
      uncertaintyMass: number;
    }[];
  };
  error?: number;
  risk?: number;
  initialThreshold?: number | null;
  thresholdNature?: string | null;
  cueVisibility?: string | null;
  adaptationMode?: string | null;
  roundIndex?: number | null;
};

type TrustCuesResponse = {
  decision: string;
  humanTrustScore: number;
  machineTrustScore: number;
  humanMachineTrustGap: number;
  threshold: number;
  actionShowCue: boolean;
  actionCueMode: string;
  cueVisibility: string;
  cueReliability: string;
  adaptationMode: string;
  adaptationApplied: boolean;
  cueAdoptionScore: number;
  cueAdoptionMode: string;
  belief: number;
  plausibility: number;
  riskLevel: string;
  decisionConfidence: number;
  systemAdaptationSummary: string;
  timestamp: string;
  error: number;
  risk: number;
};

const SCENARIOS: Record<ScenarioKey, BaselineTask> = {
  medical: {
    taskId: "medical-triage",
    domain: "medical",
    trustScore: 0.71,
    riskScore: 0.32,
  },
  justice: {
    taskId: "justice-risk",
    domain: "justice",
    trustScore: 0.58,
    riskScore: 0.48,
  },
  infrastructure: {
    taskId: "infra-control",
    domain: "infrastructure",
    trustScore: 0.63,
    riskScore: 0.41,
  },
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const resolveScenarioKey = (domain?: string, taskId?: string): ScenarioKey => {
  if (taskId?.includes("medical") || domain === "medical") {
    return "medical";
  }
  if (taskId?.includes("justice") || domain === "justice") {
    return "justice";
  }
  if (taskId?.includes("infra") || domain === "infrastructure") {
    return "infrastructure";
  }
  return "medical";
};

export const mockBaselineList = (): BaselineTask[] =>
  Object.values(SCENARIOS);

export const mockBaselineRun = (taskId: string) => {
  const fallback = SCENARIOS.medical;
  const match =
    Object.values(SCENARIOS).find((scenario) => scenario.taskId === taskId) ||
    fallback;
  return {
    tasks: [
      {
        taskId: match.taskId,
        trustScore: match.trustScore,
        riskScore: match.riskScore,
      },
    ],
  };
};

export const mockPreflightParams = (preflight: Record<string, unknown>) => {
  const values = Object.values(preflight).filter(
    (value): value is number => typeof value === "number",
  );
  const avg = values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 4;
  const normalized = clamp((avg - 1) / 6, 0, 1);
  const behaviorBaseRate = clamp(0.4 + normalized * 0.4, 0.2, 0.85);
  const feedbackBaseRate = clamp(0.3 + normalized * 0.4, 0.2, 0.8);
  const initialUncertainty = clamp(0.2 + (1 - normalized) * 0.35, 0.15, 0.55);
  const initialThreshold = clamp(0.08 + (1 - normalized) * 0.12, 0.06, 0.2);
  return {
    preflightScore: Number(normalized.toFixed(3)),
    behaviorBaseRate: Number(behaviorBaseRate.toFixed(3)),
    feedbackBaseRate: Number(feedbackBaseRate.toFixed(3)),
    initialUncertainty: Number(initialUncertainty.toFixed(3)),
    initialThreshold: Number(initialThreshold.toFixed(3)),
  };
};

export const mockCalibration = (payload: TrustCuesPayload): TrustCuesResponse => {
  const adopted = payload.humanInputRequest.adopted ?? 0;
  const rejected = payload.humanInputRequest.rejected ?? 0;
  const total = adopted + rejected;
  const baseRate = payload.humanInputRequest.adoptionBaseRate ?? 0.5;
  const humanTrust = total > 0 ? adopted / total : baseRate;

  const error = payload.error ?? 0.15;
  const risk = payload.risk ?? 0.25;
  const roundFactor = payload.roundIndex ? payload.roundIndex * 0.015 : 0;
  const machineTrust = clamp(0.72 - error * 0.3 - risk * 0.25 - roundFactor, 0.15, 0.9);
  const evidenceSet = payload.benchmarkMetricRequest?.evidenceSet ?? [];
  const uncertaintyMass =
    evidenceSet.length > 0
      ? clamp(
          evidenceSet.reduce((sum, item) => sum + item.uncertaintyMass, 0) /
            evidenceSet.length,
          0,
          1,
        )
      : 0.2;
  const belief = clamp(machineTrust - 0.5 * uncertaintyMass, 0, 1);
  const plausibility = clamp(machineTrust + 0.5 * uncertaintyMass, 0, 1);

  const thresholdBase = payload.initialThreshold ?? 0.12;
  const threshold = clamp(
    payload.thresholdNature === "dynamic"
      ? thresholdBase + risk * 0.1 + error * 0.08
      : thresholdBase,
    0.06,
    0.25,
  );
  const gap = Number((humanTrust - machineTrust).toFixed(3));

  let decision = "NO ACTION";
  if (gap > threshold) {
    decision = "DECREASE HUMAN TRUST";
  } else if (gap < -threshold) {
    decision = "INCREASE HUMAN TRUST";
  } else if (risk > 0.5) {
    decision = "ADAPT SYSTEM";
  }

  return {
    decision,
    humanTrustScore: Number(humanTrust.toFixed(3)),
    machineTrustScore: Number(machineTrust.toFixed(3)),
    humanMachineTrustGap: gap,
    threshold: Number(threshold.toFixed(3)),
    actionShowCue: true,
    actionCueMode: "accurate",
    cueVisibility: payload.cueVisibility ?? "observable",
    cueReliability: "high",
    adaptationMode: payload.adaptationMode ?? "adaptive",
    adaptationApplied: decision === "ADAPT SYSTEM",
    cueAdoptionScore: Number(clamp(0.5 + gap, 0.1, 0.9).toFixed(3)),
    cueAdoptionMode: "accurate",
    belief: Number(belief.toFixed(3)),
    plausibility: Number(plausibility.toFixed(3)),
    riskLevel: risk > 0.5 ? "high" : risk > 0.3 ? "medium" : "low",
    decisionConfidence: Number(clamp(0.55 + Math.abs(gap), 0.5, 0.9).toFixed(3)),
    systemAdaptationSummary:
      decision === "ADAPT SYSTEM"
        ? "System adaptation simulated for scenario stability."
        : "No system adaptation triggered.",
    timestamp: new Date().toISOString(),
    error,
    risk,
  };
};

export const mockPostflightSummary = (payload: {
  sessionId: string;
  participantId: string | null;
  benchmarkMetricRequest: {
    evidenceSet: { evidenceKey: string; trustworthyMass: number; untrustworthyMass: number; uncertaintyMass: number }[];
    evidenceWeights: { evidenceKey: string; weight: number }[];
  };
  feedbackInput: { trustFactors: string[] };
}) => {
  const updatedWeights = payload.benchmarkMetricRequest.evidenceWeights.map((weight) => ({
    ...weight,
    weight: Number(clamp(weight.weight + 0.02, 0.2, 1).toFixed(3)),
  }));
  return {
    sessionId: payload.sessionId,
    participantId: payload.participantId,
    machineTrustScore: 0.62,
    humanTrustScore: 0.67,
    updatedWeights,
    trustFactors: payload.feedbackInput.trustFactors ?? [],
    timestamp: new Date().toISOString(),
  };
};

export const mockPostflightSummaries = () => [];

export const mockChatResponse = (scenarioKey: ScenarioKey, message: string) => {
  const script = {
    medical: [
      "Thanks for sharing. I recommend a rapid test before any prescription.",
      "We should consider alternative diagnoses if symptoms persist.",
      "Given the missing labs, a cautious follow-up is advised.",
    ],
    justice: [
      "The score reflects prior violations and support plan strength.",
      "We should review fairness audit indicators before relying on the score.",
      "Additional context would help clarify the recommendation.",
    ],
    infrastructure: [
      "The reroute reduces peak load but carries weather uncertainty.",
      "Manual override remains available within 2 minutes.",
      "Waiting for updated telemetry could reduce risk.",
    ],
  };
  const responses = script[scenarioKey];
  const index = Math.abs(message.length) % responses.length;
  return responses[index];
};
