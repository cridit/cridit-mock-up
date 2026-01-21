export type ScenarioKey = "financial" | "legal" | "hiring";

export type ScenarioData = {
  key: ScenarioKey;
  title: string;
  subhead: string;
  status: string;
  risk: string;
  role: string;
  baselineMachine: number;
  preflightHuman: number;
  baselineGap: number;
  threshold: number;
  baselineStatus: string;
  liveMachine: number;
  liveHuman: number;
  liveGap: number;
  liveThreshold: number;
  liveDecision: string;
  liveState: string;
};

export const scenarios: ScenarioData[] = [
  {
    key: "financial",
    title: "Financial Decision-Making Scenario",
    subhead:
      "Dedicated mock-up used by the financial testing group. Interface illustrates uncertainty cues, calibration status, and observational logging.",
    status: "Financial",
    risk: "Discriminatory access + financial loss",
    role: "Credit and transaction support",
    baselineMachine: 0.925,
    preflightHuman: 0.72,
    baselineGap: -0.21,
    threshold: 0.1,
    baselineStatus: "under-trust → increase human trust",
    liveMachine: 0.925,
    liveHuman: 0.74,
    liveGap: -0.19,
    liveThreshold: 0.1,
    liveDecision: "INCREASE HUMAN TRUST",
    liveState: "under-trust",
  },
  {
    key: "legal",
    title: "Legal Assistance Scenario",
    subhead:
      "Dedicated mock-up used by the legal testing group. Interface highlights citation cues, calibration status, and observational logging.",
    status: "Legal",
    risk: "Faulty advice + liability",
    role: "Legal research support",
    baselineMachine: 0.925,
    preflightHuman: 0.58,
    baselineGap: -0.35,
    threshold: 0.08,
    baselineStatus: "under-trust → increase human trust",
    liveMachine: 0.925,
    liveHuman: 0.57,
    liveGap: -0.36,
    liveThreshold: 0.08,
    liveDecision: "INCREASE HUMAN TRUST",
    liveState: "under-trust",
  },
  {
    key: "hiring",
    title: "Hiring and Talent Evaluation Scenario",
    subhead:
      "Dedicated mock-up for HR decision-support with strict human-in-the-loop boundaries. Interface emphasizes fairness cues, calibration status, and observational logging.",
    status: "Hiring",
    risk: "Biased exclusion",
    role: "HR decision-support (human-in-the-loop)",
    baselineMachine: 0.925,
    preflightHuman: 0.49,
    baselineGap: -0.44,
    threshold: 0.07,
    baselineStatus: "under-trust → increase human trust",
    liveMachine: 0.925,
    liveHuman: 0.49,
    liveGap: -0.44,
    liveThreshold: 0.09,
    liveDecision: "INCREASE HUMAN TRUST",
    liveState: "under-trust",
  },
];

export const scenarioMap = new Map(
  scenarios.map((scenario) => [scenario.key, scenario]),
);

const clampScore = (value: number) => Math.min(1, Math.max(0, value));

const parseScore = (
  value: string | string[] | undefined,
  fallback: number,
) => {
  if (typeof value !== "string") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return clampScore(parsed);
};

const formatBaselineStatus = (gap: number, threshold: number) => {
  if (Math.abs(gap) <= threshold) {
    return "gap acceptable → no action";
  }
  if (gap > threshold) {
    return "over-trust → decrease human trust";
  }
  return "under-trust → increase human trust";
};

export const overrideBaseline = (
  scenario: ScenarioData,
  params?: {
    baseline?: string | string[];
    preflight?: string | string[];
    threshold?: string | string[];
  },
) => {
  const baselineMachine = parseScore(params?.baseline, scenario.baselineMachine);
  const preflightHuman = parseScore(params?.preflight, scenario.preflightHuman);
  const threshold = parseScore(params?.threshold, scenario.threshold);
  const baselineGap = Number((preflightHuman - baselineMachine).toFixed(2));
  const baselineStatus = formatBaselineStatus(baselineGap, threshold);

  return {
    ...scenario,
    baselineMachine,
    preflightHuman,
    baselineGap,
    threshold,
    baselineStatus,
  };
};
