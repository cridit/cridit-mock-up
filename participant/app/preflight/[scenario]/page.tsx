"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  PreflightAnswers,
  SessionParams,
  commitNextSessionId,
  peekNextSessionId,
  saveSession,
} from "../../lib/session";
import { mockPreflightParams } from "../../lib/mock";
import { scenarioMap, scenarios, type ScenarioKey } from "../../scenario/data";

const DEFAULT_BACKEND_URL = "http://localhost:8001";

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

const clampLikert = (value: string, min: number, max: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return min;
  }
  return Math.min(max, Math.max(min, parsed));
};

const isScenarioKey = (value: string): value is ScenarioKey =>
  value === "financial" || value === "legal" || value === "hiring";

export default function PreflightScenarioPage() {
  const params = useParams();
  const router = useRouter();
  const scenarioKeyParam = params?.scenario;
  const scenarioKey = typeof scenarioKeyParam === "string" && isScenarioKey(scenarioKeyParam)
    ? scenarioKeyParam
    : null;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [backendBaseUrl] = useState(DEFAULT_BACKEND_URL);
  const [preflight, setPreflight] = useState<PreflightAnswers>({
    scenarioKey: scenarioKey ?? undefined,
    intentionToTrust1: 4,
    intentionToTrust2: 4,
    intentionToTrust3: 4,
    privacyConcern1: 4,
    privacyConcern2: 4,
    privacyConcern3: 4,
    privacyConcern4: 4,
    privacyConcern5: 4,
    riskAversion1: 4,
    riskAversion2: 4,
    riskAversion3: 4,
    hrFamiliarity: 4,
    hrRecruitmentFrequency: 4,
    hrCriteriaTransparencyImportance: 4,
    hrExplainabilityImportance: 4,
    hrFairnessImportance: 4,
    hrClassificationAccuracyImportance: 4,
    hrConsistencyImportance: 4,
    hrFeedbackQualityImportance: 4,
    hrToneProfessionalismImportance: 4,
    hrHumanOversightImportance: 4,
    hrEfficiencyImportance: 4,
    hrCorrectionAbilityImportance: 4,
    hrDistrustTriggers: "",
    hrNeverTrustTasks: "",
    financeFamiliarity: 4,
    financeUsageFrequency: 4,
    calculationAccuracyImportance: 4,
    consistencyImportance: 4,
    assumptionTransparencyImportance: 4,
    traceabilityImportance: 4,
    auditabilityImportance: 4,
    sourceGroundingImportance: 4,
    uncertaintyCalibrationImportance: 4,
    riskCompletenessImportance: 4,
    professionalBoundariesImportance: 4,
    legalReliabilityImportance: 4,
    legalCitationAccuracyImportance: 4,
    legalTransparencyImportance: 4,
    legalBiasFairnessImportance: 4,
    legalPrivacySecurityImportance: 4,
    legalHumanOversightImportance: 4,
    legalAccountabilityImportance: 4,
    legalUncertaintyCommunicationImportance: 4,
    distrustTriggers: "",
    trustAccelerators: "",
  });
  const [preflightStatus, setPreflightStatus] = useState("Not run.");
  const [syncStatus, setSyncStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setSessionId(peekNextSessionId());
  }, []);

  useEffect(() => {
    if (!scenarioKey) {
      router.replace("/preflight");
    }
  }, [router, scenarioKey]);

  const scenario = useMemo(
    () => (scenarioKey ? scenarioMap.get(scenarioKey) ?? scenarios[0] : scenarios[0]),
    [scenarioKey],
  );

  type LikertQuestion = {
    key: keyof PreflightAnswers;
    label: string;
    min: number;
    max: number;
  };

  const dispositionalQuestions: LikertQuestion[] = [
    {
      key: "intentionToTrust1",
      label:
        "In general, you tend to trust technical infrastructures embedded with AI (AI-infused systems).",
      min: 1,
      max: 7,
    },
    {
      key: "intentionToTrust2",
      label: "You usually believe that AI-infused systems are designed to improve performance.",
      min: 1,
      max: 7,
    },
    {
      key: "intentionToTrust3",
      label: "You are generally optimistic about the benefits that AI-infused systems can provide.",
      min: 1,
      max: 7,
    },
    {
      key: "privacyConcern1",
      label:
        "You are generally concerned about how much personal information AI-infused systems collect about you.",
      min: 1,
      max: 7,
    },
    {
      key: "privacyConcern2",
      label: "You often worry that your data is not secure when you use AI-infused systems.",
      min: 1,
      max: 7,
    },
    {
      key: "privacyConcern3",
      label: "You are sensitive about how your information is used by AI-infused systems.",
      min: 1,
      max: 7,
    },
    {
      key: "privacyConcern4",
      label:
        "The idea of an AI technology provider sharing your personal data with third parties makes you uncomfortable.",
      min: 1,
      max: 7,
    },
    {
      key: "privacyConcern5",
      label: "You believe privacy risks are among the most serious problems in today's digital world.",
      min: 1,
      max: 7,
    },
    {
      key: "riskAversion1",
      label:
        "You prefer to wait until a new AI-infused system has been proven by others before you try it.",
      min: 1,
      max: 7,
    },
    {
      key: "riskAversion2",
      label:
        "When using AI-infused systems, avoiding potential losses (like information leakage) matters more to you than gaining potential benefits.",
      min: 1,
      max: 7,
    },
    {
      key: "riskAversion3",
      label: "You like to fully understand all the risks before you use a new AI-infused system.",
      min: 1,
      max: 7,
    },
  ];


  const financialContextQuestions: LikertQuestion[] = [
    {
      key: "financeFamiliarity",
      label: "How familiar are you with corporate finance tasks?",
      min: 1,
      max: 7,
    },
    {
      key: "financeUsageFrequency",
      label: "How often do you use financial statements in your work or studies?",
      min: 1,
      max: 7,
    },
  ];

  const financialImportanceQuestions: LikertQuestion[] = [
    {
      key: "calculationAccuracyImportance",
      label: "Calculation accuracy",
      min: 1,
      max: 7,
    },
    {
      key: "consistencyImportance",
      label: "Consistency across answers",
      min: 1,
      max: 7,
    },
    {
      key: "assumptionTransparencyImportance",
      label: "Transparency of assumptions",
      min: 1,
      max: 7,
    },
    {
      key: "traceabilityImportance",
      label: "Traceability",
      min: 1,
      max: 7,
    },
    {
      key: "auditabilityImportance",
      label: "Auditability",
      min: 1,
      max: 7,
    },
    {
      key: "sourceGroundingImportance",
      label: "Source grounding",
      min: 1,
      max: 7,
    },
    {
      key: "riskCompletenessImportance",
      label: "Risk completeness",
      min: 1,
      max: 7,
    },
    {
      key: "professionalBoundariesImportance",
      label: "Professional boundaries",
      min: 1,
      max: 7,
    },
  ];

  const financialOpenQuestions = [
    {
      key: "distrustTriggers",
      label: "In corporate finance, what would make you immediately distrust such a chatbot?",
    },
    {
      key: "trustAccelerators",
      label: "What would make you trust it faster?",
    },
  ] as const;

  const legalImportanceQuestions: LikertQuestion[] = [
    {
      key: "legalReliabilityImportance",
      label: "Reliability (avoids incorrect or fabricated sources)",
      min: 1,
      max: 7,
    },
    {
      key: "legalCitationAccuracyImportance",
      label: "Citation accuracy (statutes, cases, articles)",
      min: 1,
      max: 7,
    },
    {
      key: "legalTransparencyImportance",
      label: "Transparency of reasoning",
      min: 1,
      max: 7,
    },
    {
      key: "legalBiasFairnessImportance",
      label: "Bias avoidance and fairness",
      min: 1,
      max: 7,
    },
    {
      key: "legalPrivacySecurityImportance",
      label: "Security and confidentiality",
      min: 1,
      max: 7,
    },
    {
      key: "legalHumanOversightImportance",
      label: "Respect of human oversight",
      min: 1,
      max: 7,
    },
    {
      key: "legalAccountabilityImportance",
      label: "Accountability (human responsibility retained)",
      min: 1,
      max: 7,
    },
    {
      key: "legalUncertaintyCommunicationImportance",
      label: "Explicit uncertainty and limits",
      min: 1,
      max: 7,
    },
  ];

  const legalOpenQuestions = [
    {
      key: "distrustTriggers",
      label: "In legal work, what would make you immediately distrust such a chatbot?",
    },
    {
      key: "trustAccelerators",
      label: "What would make you trust it faster in legal tasks?",
    },
  ] as const;

  const hrContextQuestions: LikertQuestion[] = [
    {
      key: "hrFamiliarity",
      label: "How familiar are you with HR processes (recruitment, CV screening, job descriptions)?",
      min: 1,
      max: 7,
    },
    {
      key: "hrRecruitmentFrequency",
      label: "How frequently do you participate in recruitment activities?",
      min: 1,
      max: 7,
    },
  ];

  const hrImportanceQuestions: LikertQuestion[] = [
    {
      key: "hrCriteriaTransparencyImportance",
      label: "Transparency of selection criteria",
      min: 1,
      max: 7,
    },
    {
      key: "hrExplainabilityImportance",
      label: "Explainability of outputs",
      min: 1,
      max: 7,
    },
    {
      key: "hrFairnessImportance",
      label: "Fairness / non-discrimination",
      min: 1,
      max: 7,
    },
    {
      key: "hrClassificationAccuracyImportance",
      label: "Accuracy of CV classification",
      min: 1,
      max: 7,
    },
    {
      key: "hrConsistencyImportance",
      label: "Consistency across candidates",
      min: 1,
      max: 7,
    },
    {
      key: "hrFeedbackQualityImportance",
      label: "Quality of feedback provided",
      min: 1,
      max: 7,
    },
    {
      key: "hrToneProfessionalismImportance",
      label: "Tone and professionalism",
      min: 1,
      max: 7,
    },
    {
      key: "hrHumanOversightImportance",
      label: "Respect of human oversight",
      min: 1,
      max: 7,
    },
    {
      key: "hrEfficiencyImportance",
      label: "Efficiency / time saving",
      min: 1,
      max: 7,
    },
    {
      key: "hrCorrectionAbilityImportance",
      label: "Ability to adjust or correct the system",
      min: 1,
      max: 7,
    },
  ];


  const isFinancial = scenarioKey === "financial";
  const isHiring = scenarioKey === "hiring";
  const isLegal = scenarioKey === "legal";

  const toWeight = (value?: number) => {
    if (typeof value !== "number") return 0.5;
    const normalized = (value - 1) / 6;
    return Math.min(1, Math.max(0, normalized));
  };

  const buildBenchmarkEvidence = () => {
    if (isFinancial) {
      return [
        {
          evidenceKey: "calculation_accuracy",
          trustworthyMass: 0.6,
          untrustworthyMass: 0.2,
          uncertaintyMass: 0.2,
          weight: toWeight(preflight.calculationAccuracyImportance),
        },
        {
          evidenceKey: "consistency",
          trustworthyMass: 0.6,
          untrustworthyMass: 0.2,
          uncertaintyMass: 0.2,
          weight: toWeight(preflight.consistencyImportance),
        },
        {
          evidenceKey: "assumption_transparency",
          trustworthyMass: 0.6,
          untrustworthyMass: 0.2,
          uncertaintyMass: 0.2,
          weight: toWeight(preflight.assumptionTransparencyImportance),
        },
        {
          evidenceKey: "traceability",
          trustworthyMass: 0.6,
          untrustworthyMass: 0.2,
          uncertaintyMass: 0.2,
          weight: toWeight(preflight.traceabilityImportance),
        },
        {
          evidenceKey: "auditability",
          trustworthyMass: 0.6,
          untrustworthyMass: 0.2,
          uncertaintyMass: 0.2,
          weight: toWeight(preflight.auditabilityImportance),
        },
        {
          evidenceKey: "source_grounding",
          trustworthyMass: 0.6,
          untrustworthyMass: 0.2,
          uncertaintyMass: 0.2,
          weight: toWeight(preflight.sourceGroundingImportance),
        },
        {
          evidenceKey: "risk_completeness",
          trustworthyMass: 0.6,
          untrustworthyMass: 0.2,
          uncertaintyMass: 0.2,
          weight: toWeight(preflight.riskCompletenessImportance),
        },
        {
          evidenceKey: "professional_boundaries",
          trustworthyMass: 0.6,
          untrustworthyMass: 0.2,
          uncertaintyMass: 0.2,
          weight: toWeight(preflight.professionalBoundariesImportance),
        },
      ];
    }
    if (isHiring) {
      return [
        {
          evidenceKey: "criteria_transparency",
          trustworthyMass: 0.6,
          untrustworthyMass: 0.2,
          uncertaintyMass: 0.2,
          weight: toWeight(preflight.hrCriteriaTransparencyImportance),
        },
        {
          evidenceKey: "explainability",
          trustworthyMass: 0.6,
          untrustworthyMass: 0.2,
          uncertaintyMass: 0.2,
          weight: toWeight(preflight.hrExplainabilityImportance),
        },
        {
          evidenceKey: "fairness",
          trustworthyMass: 0.6,
          untrustworthyMass: 0.2,
          uncertaintyMass: 0.2,
          weight: toWeight(preflight.hrFairnessImportance),
        },
        {
          evidenceKey: "classification_accuracy",
          trustworthyMass: 0.6,
          untrustworthyMass: 0.2,
          uncertaintyMass: 0.2,
          weight: toWeight(preflight.hrClassificationAccuracyImportance),
        },
        {
          evidenceKey: "consistency",
          trustworthyMass: 0.6,
          untrustworthyMass: 0.2,
          uncertaintyMass: 0.2,
          weight: toWeight(preflight.hrConsistencyImportance),
        },
        {
          evidenceKey: "feedback_quality",
          trustworthyMass: 0.6,
          untrustworthyMass: 0.2,
          uncertaintyMass: 0.2,
          weight: toWeight(preflight.hrFeedbackQualityImportance),
        },
        {
          evidenceKey: "tone_professionalism",
          trustworthyMass: 0.6,
          untrustworthyMass: 0.2,
          uncertaintyMass: 0.2,
          weight: toWeight(preflight.hrToneProfessionalismImportance),
        },
        {
          evidenceKey: "human_oversight",
          trustworthyMass: 0.6,
          untrustworthyMass: 0.2,
          uncertaintyMass: 0.2,
          weight: toWeight(preflight.hrHumanOversightImportance),
        },
        {
          evidenceKey: "efficiency",
          trustworthyMass: 0.6,
          untrustworthyMass: 0.2,
          uncertaintyMass: 0.2,
          weight: toWeight(preflight.hrEfficiencyImportance),
        },
        {
          evidenceKey: "correction_ability",
          trustworthyMass: 0.6,
          untrustworthyMass: 0.2,
          uncertaintyMass: 0.2,
          weight: toWeight(preflight.hrCorrectionAbilityImportance),
        },
      ];
    }
    if (isLegal) {
      return [
        {
          evidenceKey: "reliability",
          trustworthyMass: 0.6,
          untrustworthyMass: 0.2,
          uncertaintyMass: 0.2,
          weight: toWeight(preflight.legalReliabilityImportance),
        },
        {
          evidenceKey: "citation_accuracy",
          trustworthyMass: 0.6,
          untrustworthyMass: 0.2,
          uncertaintyMass: 0.2,
          weight: toWeight(preflight.legalCitationAccuracyImportance),
        },
        {
          evidenceKey: "transparency",
          trustworthyMass: 0.6,
          untrustworthyMass: 0.2,
          uncertaintyMass: 0.2,
          weight: toWeight(preflight.legalTransparencyImportance),
        },
        {
          evidenceKey: "bias_fairness",
          trustworthyMass: 0.6,
          untrustworthyMass: 0.2,
          uncertaintyMass: 0.2,
          weight: toWeight(preflight.legalBiasFairnessImportance),
        },
        {
          evidenceKey: "privacy_security",
          trustworthyMass: 0.6,
          untrustworthyMass: 0.2,
          uncertaintyMass: 0.2,
          weight: toWeight(preflight.legalPrivacySecurityImportance),
        },
        {
          evidenceKey: "human_oversight",
          trustworthyMass: 0.6,
          untrustworthyMass: 0.2,
          uncertaintyMass: 0.2,
          weight: toWeight(preflight.legalHumanOversightImportance),
        },
        {
          evidenceKey: "accountability",
          trustworthyMass: 0.6,
          untrustworthyMass: 0.2,
          uncertaintyMass: 0.2,
          weight: toWeight(preflight.legalAccountabilityImportance),
        },
        {
          evidenceKey: "uncertainty_limits",
          trustworthyMass: 0.6,
          untrustworthyMass: 0.2,
          uncertaintyMass: 0.2,
          weight: toWeight(preflight.legalUncertaintyCommunicationImportance),
        },
      ];
    }
    return [];
  };

  const optionLabelsByKey: Partial<Record<keyof PreflightAnswers, string[]>> = {
    hrFamiliarity: [
      "Not at all familiar",
      "Slightly familiar",
      "Somewhat familiar",
      "Moderately familiar",
      "Quite familiar",
      "Very familiar",
      "Extremely familiar",
    ],
    hrRecruitmentFrequency: [
      "Never",
      "Rarely",
      "Occasionally",
      "Monthly",
      "Weekly",
      "Several times a week",
      "Daily",
    ],
    financeFamiliarity: [
      "Not at all familiar",
      "Slightly familiar",
      "Somewhat familiar",
      "Moderately familiar",
      "Quite familiar",
      "Very familiar",
      "Extremely familiar",
    ],
    financeUsageFrequency: [
      "Never",
      "Rarely",
      "Occasionally",
      "Monthly",
      "Weekly",
      "Several times a week",
      "Daily",
    ],
    calculationAccuracyImportance: [
      "Not important",
      "Slightly important",
      "Somewhat important",
      "Moderately important",
      "Very important",
      "Extremely important",
      "Critical",
    ],
    consistencyImportance: [
      "Not important",
      "Slightly important",
      "Somewhat important",
      "Moderately important",
      "Very important",
      "Extremely important",
      "Critical",
    ],
    assumptionTransparencyImportance: [
      "Not important",
      "Slightly important",
      "Somewhat important",
      "Moderately important",
      "Very important",
      "Extremely important",
      "Critical",
    ],
    traceabilityImportance: [
      "Not important",
      "Slightly important",
      "Somewhat important",
      "Moderately important",
      "Very important",
      "Extremely important",
      "Critical",
    ],
    auditabilityImportance: [
      "Not important",
      "Slightly important",
      "Somewhat important",
      "Moderately important",
      "Very important",
      "Extremely important",
      "Critical",
    ],
    sourceGroundingImportance: [
      "Not important",
      "Slightly important",
      "Somewhat important",
      "Moderately important",
      "Very important",
      "Extremely important",
      "Critical",
    ],
    uncertaintyCalibrationImportance: [
      "Not important",
      "Slightly important",
      "Somewhat important",
      "Moderately important",
      "Very important",
      "Extremely important",
      "Critical",
    ],
    riskCompletenessImportance: [
      "Not important",
      "Slightly important",
      "Somewhat important",
      "Moderately important",
      "Very important",
      "Extremely important",
      "Critical",
    ],
    professionalBoundariesImportance: [
      "Not important",
      "Slightly important",
      "Somewhat important",
      "Moderately important",
      "Very important",
      "Extremely important",
      "Critical",
    ],
    legalReliabilityImportance: [
      "Not important",
      "Slightly important",
      "Somewhat important",
      "Moderately important",
      "Very important",
      "Extremely important",
      "Critical",
    ],
    legalCitationAccuracyImportance: [
      "Not important",
      "Slightly important",
      "Somewhat important",
      "Moderately important",
      "Very important",
      "Extremely important",
      "Critical",
    ],
    legalTransparencyImportance: [
      "Not important",
      "Slightly important",
      "Somewhat important",
      "Moderately important",
      "Very important",
      "Extremely important",
      "Critical",
    ],
    legalBiasFairnessImportance: [
      "Not important",
      "Slightly important",
      "Somewhat important",
      "Moderately important",
      "Very important",
      "Extremely important",
      "Critical",
    ],
    legalPrivacySecurityImportance: [
      "Not important",
      "Slightly important",
      "Somewhat important",
      "Moderately important",
      "Very important",
      "Extremely important",
      "Critical",
    ],
    legalHumanOversightImportance: [
      "Not important",
      "Slightly important",
      "Somewhat important",
      "Moderately important",
      "Very important",
      "Extremely important",
      "Critical",
    ],
    legalAccountabilityImportance: [
      "Not important",
      "Slightly important",
      "Somewhat important",
      "Moderately important",
      "Very important",
      "Extremely important",
      "Critical",
    ],
    legalUncertaintyCommunicationImportance: [
      "Not important",
      "Slightly important",
      "Somewhat important",
      "Moderately important",
      "Very important",
      "Extremely important",
      "Critical",
    ],
    hrCriteriaTransparencyImportance: [
      "Not important",
      "Slightly important",
      "Somewhat important",
      "Moderately important",
      "Very important",
      "Extremely important",
      "Critical",
    ],
    hrExplainabilityImportance: [
      "Not important",
      "Slightly important",
      "Somewhat important",
      "Moderately important",
      "Very important",
      "Extremely important",
      "Critical",
    ],
    hrFairnessImportance: [
      "Not important",
      "Slightly important",
      "Somewhat important",
      "Moderately important",
      "Very important",
      "Extremely important",
      "Critical",
    ],
    hrClassificationAccuracyImportance: [
      "Not important",
      "Slightly important",
      "Somewhat important",
      "Moderately important",
      "Very important",
      "Extremely important",
      "Critical",
    ],
    hrConsistencyImportance: [
      "Not important",
      "Slightly important",
      "Somewhat important",
      "Moderately important",
      "Very important",
      "Extremely important",
      "Critical",
    ],
    hrFeedbackQualityImportance: [
      "Not important",
      "Slightly important",
      "Somewhat important",
      "Moderately important",
      "Very important",
      "Extremely important",
      "Critical",
    ],
    hrToneProfessionalismImportance: [
      "Not important",
      "Slightly important",
      "Somewhat important",
      "Moderately important",
      "Very important",
      "Extremely important",
      "Critical",
    ],
    hrHumanOversightImportance: [
      "Not important",
      "Slightly important",
      "Somewhat important",
      "Moderately important",
      "Very important",
      "Extremely important",
      "Critical",
    ],
    hrEfficiencyImportance: [
      "Not important",
      "Slightly important",
      "Somewhat important",
      "Moderately important",
      "Very important",
      "Extremely important",
      "Critical",
    ],
    hrCorrectionAbilityImportance: [
      "Not important",
      "Slightly important",
      "Somewhat important",
      "Moderately important",
      "Very important",
      "Extremely important",
      "Critical",
    ],
    intentionToTrust1: [
      "Strongly disagree",
      "Disagree",
      "Somewhat disagree",
      "Neutral",
      "Somewhat agree",
      "Agree",
      "Strongly agree",
    ],
    intentionToTrust2: [
      "Strongly disagree",
      "Disagree",
      "Somewhat disagree",
      "Neutral",
      "Somewhat agree",
      "Agree",
      "Strongly agree",
    ],
    intentionToTrust3: [
      "Strongly disagree",
      "Disagree",
      "Somewhat disagree",
      "Neutral",
      "Somewhat agree",
      "Agree",
      "Strongly agree",
    ],
    privacyConcern1: [
      "Strongly disagree",
      "Disagree",
      "Somewhat disagree",
      "Neutral",
      "Somewhat agree",
      "Agree",
      "Strongly agree",
    ],
    privacyConcern2: [
      "Strongly disagree",
      "Disagree",
      "Somewhat disagree",
      "Neutral",
      "Somewhat agree",
      "Agree",
      "Strongly agree",
    ],
    privacyConcern3: [
      "Strongly disagree",
      "Disagree",
      "Somewhat disagree",
      "Neutral",
      "Somewhat agree",
      "Agree",
      "Strongly agree",
    ],
    privacyConcern4: [
      "Strongly disagree",
      "Disagree",
      "Somewhat disagree",
      "Neutral",
      "Somewhat agree",
      "Agree",
      "Strongly agree",
    ],
    privacyConcern5: [
      "Strongly disagree",
      "Disagree",
      "Somewhat disagree",
      "Neutral",
      "Somewhat agree",
      "Agree",
      "Strongly agree",
    ],
    riskAversion1: [
      "Strongly disagree",
      "Disagree",
      "Somewhat disagree",
      "Neutral",
      "Somewhat agree",
      "Agree",
      "Strongly agree",
    ],
    riskAversion2: [
      "Strongly disagree",
      "Disagree",
      "Somewhat disagree",
      "Neutral",
      "Somewhat agree",
      "Agree",
      "Strongly agree",
    ],
    riskAversion3: [
      "Strongly disagree",
      "Disagree",
      "Somewhat disagree",
      "Neutral",
      "Somewhat agree",
      "Agree",
      "Strongly agree",
    ],
  };

  const renderLikert = (question: LikertQuestion) => {
    const current =
      typeof preflight[question.key] === "number"
        ? (preflight[question.key] as number)
        : question.min;
    const optionLabels = optionLabelsByKey[question.key];
    return (
      <div key={question.key} className="mb-3">
        <label className="form-label">
          {question.label}
        </label>
        <select
          className="form-select"
          value={current}
          onChange={(event) =>
            setPreflight((prev) => ({
              ...prev,
              [question.key]: clampLikert(
                event.target.value,
                question.min,
                question.max,
              ),
            }))
          }
        >
          {Array.from({ length: question.max - question.min + 1 }, (_, index) => {
            const value = question.min + index;
            const label =
              optionLabels && optionLabels.length > index
                ? `${value} - ${optionLabels[index]}`
                : String(value);
            return (
              <option key={value} value={value}>
                {label}
              </option>
            );
          })}
        </select>
      </div>
    );
  };

  const buildPayload = (): PreflightAnswers => {
    if (scenarioKey === "financial") {
      return {
        scenarioKey: scenarioKey ?? undefined,
        intentionToTrust1: preflight.intentionToTrust1 ?? 4,
        intentionToTrust2: preflight.intentionToTrust2 ?? 4,
        intentionToTrust3: preflight.intentionToTrust3 ?? 4,
        privacyConcern1: preflight.privacyConcern1 ?? 4,
        privacyConcern2: preflight.privacyConcern2 ?? 4,
        privacyConcern3: preflight.privacyConcern3 ?? 4,
        privacyConcern4: preflight.privacyConcern4 ?? 4,
        privacyConcern5: preflight.privacyConcern5 ?? 4,
        riskAversion1: preflight.riskAversion1 ?? 4,
        riskAversion2: preflight.riskAversion2 ?? 4,
        riskAversion3: preflight.riskAversion3 ?? 4,
        financeFamiliarity: preflight.financeFamiliarity ?? 4,
        financeUsageFrequency: preflight.financeUsageFrequency ?? 4,
        calculationAccuracyImportance: preflight.calculationAccuracyImportance ?? 4,
        consistencyImportance: preflight.consistencyImportance ?? 4,
        assumptionTransparencyImportance: preflight.assumptionTransparencyImportance ?? 4,
        traceabilityImportance: preflight.traceabilityImportance ?? 4,
        auditabilityImportance: preflight.auditabilityImportance ?? 4,
        sourceGroundingImportance: preflight.sourceGroundingImportance ?? 4,
        uncertaintyCalibrationImportance: preflight.uncertaintyCalibrationImportance ?? 4,
        riskCompletenessImportance: preflight.riskCompletenessImportance ?? 4,
        professionalBoundariesImportance: preflight.professionalBoundariesImportance ?? 4,
        distrustTriggers: preflight.distrustTriggers ?? "",
        trustAccelerators: preflight.trustAccelerators ?? "",
      };
    }
    if (scenarioKey === "hiring") {
      return {
        scenarioKey: scenarioKey ?? undefined,
        intentionToTrust1: preflight.intentionToTrust1 ?? 4,
        intentionToTrust2: preflight.intentionToTrust2 ?? 4,
        intentionToTrust3: preflight.intentionToTrust3 ?? 4,
        privacyConcern1: preflight.privacyConcern1 ?? 4,
        privacyConcern2: preflight.privacyConcern2 ?? 4,
        privacyConcern3: preflight.privacyConcern3 ?? 4,
        privacyConcern4: preflight.privacyConcern4 ?? 4,
        privacyConcern5: preflight.privacyConcern5 ?? 4,
        riskAversion1: preflight.riskAversion1 ?? 4,
        riskAversion2: preflight.riskAversion2 ?? 4,
        riskAversion3: preflight.riskAversion3 ?? 4,
        hrFamiliarity: preflight.hrFamiliarity ?? 4,
        hrRecruitmentFrequency: preflight.hrRecruitmentFrequency ?? 4,
        hrCriteriaTransparencyImportance: preflight.hrCriteriaTransparencyImportance ?? 4,
        hrExplainabilityImportance: preflight.hrExplainabilityImportance ?? 4,
        hrFairnessImportance: preflight.hrFairnessImportance ?? 4,
        hrClassificationAccuracyImportance: preflight.hrClassificationAccuracyImportance ?? 4,
        hrConsistencyImportance: preflight.hrConsistencyImportance ?? 4,
        hrFeedbackQualityImportance: preflight.hrFeedbackQualityImportance ?? 4,
        hrToneProfessionalismImportance: preflight.hrToneProfessionalismImportance ?? 4,
        hrHumanOversightImportance: preflight.hrHumanOversightImportance ?? 4,
        hrEfficiencyImportance: preflight.hrEfficiencyImportance ?? 4,
        hrCorrectionAbilityImportance: preflight.hrCorrectionAbilityImportance ?? 4,
        hrDistrustTriggers: preflight.hrDistrustTriggers ?? "",
        hrNeverTrustTasks: preflight.hrNeverTrustTasks ?? "",
      };
    }
    if (scenarioKey === "legal") {
      return {
        scenarioKey: scenarioKey ?? undefined,
        intentionToTrust1: preflight.intentionToTrust1 ?? 4,
        intentionToTrust2: preflight.intentionToTrust2 ?? 4,
        intentionToTrust3: preflight.intentionToTrust3 ?? 4,
        privacyConcern1: preflight.privacyConcern1 ?? 4,
        privacyConcern2: preflight.privacyConcern2 ?? 4,
        privacyConcern3: preflight.privacyConcern3 ?? 4,
        privacyConcern4: preflight.privacyConcern4 ?? 4,
        privacyConcern5: preflight.privacyConcern5 ?? 4,
        riskAversion1: preflight.riskAversion1 ?? 4,
        riskAversion2: preflight.riskAversion2 ?? 4,
        riskAversion3: preflight.riskAversion3 ?? 4,
        legalReliabilityImportance: preflight.legalReliabilityImportance ?? 4,
        legalCitationAccuracyImportance: preflight.legalCitationAccuracyImportance ?? 4,
        legalTransparencyImportance: preflight.legalTransparencyImportance ?? 4,
        legalBiasFairnessImportance: preflight.legalBiasFairnessImportance ?? 4,
        legalPrivacySecurityImportance: preflight.legalPrivacySecurityImportance ?? 4,
        legalHumanOversightImportance: preflight.legalHumanOversightImportance ?? 4,
        legalAccountabilityImportance: preflight.legalAccountabilityImportance ?? 4,
        legalUncertaintyCommunicationImportance:
          preflight.legalUncertaintyCommunicationImportance ?? 4,
        distrustTriggers: preflight.distrustTriggers ?? "",
        trustAccelerators: preflight.trustAccelerators ?? "",
      };
    }
    return {
      scenarioKey: scenarioKey ?? undefined,
      intentionToTrust1: preflight.intentionToTrust1 ?? 4,
      intentionToTrust2: preflight.intentionToTrust2 ?? 4,
      intentionToTrust3: preflight.intentionToTrust3 ?? 4,
      privacyConcern1: preflight.privacyConcern1 ?? 4,
      privacyConcern2: preflight.privacyConcern2 ?? 4,
      privacyConcern3: preflight.privacyConcern3 ?? 4,
      privacyConcern4: preflight.privacyConcern4 ?? 4,
      privacyConcern5: preflight.privacyConcern5 ?? 4,
      riskAversion1: preflight.riskAversion1 ?? 4,
      riskAversion2: preflight.riskAversion2 ?? 4,
      riskAversion3: preflight.riskAversion3 ?? 4,
    };
  };

  const syncOperatorInputs = async (baseUrl: string, score: number) => {
    if (!scenarioKey) {
      return null;
    }
    let baselineMachine = scenario.baselineMachine;
    let threshold = scenario.threshold;
    try {
      const response = await fetch(`${baseUrl}/inputs/${scenarioKey}`);
      if (response.ok) {
        const data = (await response.json().catch(() => null)) as
          | {
              baselineMachine?: number;
              threshold?: number;
            }
          | null;
        if (typeof data?.baselineMachine === "number") {
          baselineMachine = data.baselineMachine;
        }
        if (typeof data?.threshold === "number") {
          threshold = data.threshold;
        }
      }
    } catch {
      // ignore input fetch errors
    }
    await sendJSON(baseUrl, `/inputs/${scenarioKey}`, {
      baselineMachine,
      preflightHuman: score,
      threshold,
      adopted: 0,
      rejected: 0,
    });
    return { baselineMachine, threshold };
  };

  const recordPreflightCalibration = async (
    baseUrl: string,
    score: number,
    baselineMachine: number,
    threshold: number,
  ) => {
    if (!scenarioKey) {
      return;
    }
    const gap = score - baselineMachine;
    let decision = "NO ACTION";
    if (gap > threshold) {
      decision = "DECREASE HUMAN TRUST";
    } else if (gap < -threshold) {
      decision = "INCREASE HUMAN TRUST";
    }
    await sendJSON(baseUrl, "/cridit/calibration/record", {
      scenarioKey,
      taskId: null,
      humanTrustScore: Number(score.toFixed(3)),
      machineTrustScore: Number(baselineMachine.toFixed(3)),
      humanMachineTrustGap: Number(gap.toFixed(3)),
      threshold: Number(threshold.toFixed(3)),
      decision,
      conflictRedistribution: "preflight",
      thresholdNature: "preflight",
      timestamp: new Date().toISOString(),
    });
  };

  const handleCompute = async () => {
    if (!sessionId || !scenarioKey) {
      return;
    }
    setErrorMessage("");
    setSyncStatus("");
    const baseUrl = backendBaseUrl.trim().replace(/\/$/, "");
    const payload = buildPayload();
    let response: {
      preflightScore: number;
      behaviorBaseRate: number;
      feedbackBaseRate: number;
      physioBaseRate: number;
      initialUncertainty: number;
      initialThreshold: number;
    };
    let usedMock = false;
    try {
      response = await sendJSON(baseUrl, "/cridit/preflight/params", payload);
    } catch (error) {
      response = mockPreflightParams(payload);
      usedMock = true;
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(message);
    }

    const score = Number(response.preflightScore);
    const status = Number.isFinite(score) ? score.toFixed(3) : "n/a";
    setPreflightStatus(usedMock ? `${status} (mocked)` : status);

    const params: SessionParams = {
      behaviorBaseRate: Number(response.behaviorBaseRate ?? 0),
      feedbackBaseRate: Number(response.feedbackBaseRate ?? 0),
      physioBaseRate: Number(response.physioBaseRate ?? 0),
      initialUncertainty: Number(response.initialUncertainty ?? 0),
      initialThreshold: Number(response.initialThreshold ?? scenario.threshold),
    };
    saveSession({
      participantId: "",
      sessionId,
      domain: scenario.status,
      taskId: scenario.key,
      backendBaseUrl: baseUrl,
      preflightAnswers: payload,
      preflightScore: Number.isFinite(score) ? score : 0.5,
      params,
      benchmarkEvidence: buildBenchmarkEvidence(),
    });

    try {
      const inputs = await syncOperatorInputs(baseUrl, score);
      if (inputs) {
        await recordPreflightCalibration(baseUrl, score, inputs.baselineMachine, inputs.threshold);
      }
      setSyncStatus("Synced preflight score with operator view.");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSyncStatus(`Operator sync failed: ${message}`);
    }

    commitNextSessionId();
    router.push(`/scenario/${scenarioKey}`);
  };

  if (!scenarioKey) {
    return null;
  }

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Participant Questionnaire</p>
          <h1>{scenario.status} Pre-flight Survey</h1>
          <p className="subhead">
            Complete the questionnaire before starting the interaction.
          </p>
        </div>
      </header>

      <main className="grid">
        <section className="panel full-span">
          {isFinancial ? (
            <>
              <h3>Dispositional Trust (1-7)</h3>
              <div>{dispositionalQuestions.map(renderLikert)}</div>
              <h3>Context (1-7)</h3>
              <div>{financialContextQuestions.map(renderLikert)}</div>
              <h3>Importance of Trust Factors (1-7)</h3>
              <div>{financialImportanceQuestions.map(renderLikert)}</div>
              <h3>Open Questions</h3>
              <div>
                {financialOpenQuestions.map((question) => (
                  <div key={question.key} className="mb-3">
                    <label className="form-label">{question.label}</label>
                    <textarea
                      className="form-control"
                      value={(preflight[question.key] as string | undefined) ?? ""}
                      onChange={(event) =>
                        setPreflight((prev) => ({
                          ...prev,
                          [question.key]: event.target.value,
                        }))
                      }
                    ></textarea>
                  </div>
                ))}
              </div>
            </>
          ) : isHiring ? (
            <>
              <h3>Dispositional Trust (1-7)</h3>
              <div>{dispositionalQuestions.map(renderLikert)}</div>
              <h3>Context (1-7)</h3>
              <div>{hrContextQuestions.map(renderLikert)}</div>
              <h3>Importance of HR Trust Factors (1-7)</h3>
              <p className="muted">
                In the context of HR tasks, how important are the following factors for trusting an AI chatbot?
              </p>
              <div>{hrImportanceQuestions.map(renderLikert)}</div>
              <h3>Open Questions</h3>
              <div>
                <div className="mb-3">
                  <label className="form-label">
                    What would immediately make you distrust an HR chatbot?
                  </label>
                  <textarea
                    className="form-control"
                    value={preflight.hrDistrustTriggers ?? ""}
                    onChange={(event) =>
                      setPreflight((prev) => ({
                        ...prev,
                        hrDistrustTriggers: event.target.value,
                      }))
                    }
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    In which HR tasks would you never trust an AI system?
                  </label>
                  <textarea
                    className="form-control"
                    value={preflight.hrNeverTrustTasks ?? ""}
                    onChange={(event) =>
                      setPreflight((prev) => ({
                        ...prev,
                        hrNeverTrustTasks: event.target.value,
                      }))
                    }
                  ></textarea>
                </div>
              </div>
            </>
          ) : isLegal ? (
            <>
              <h3>Dispositional Trust (1-7)</h3>
              <div>{dispositionalQuestions.map(renderLikert)}</div>
              <h3>Importance of Legal Trust Factors (1-7)</h3>
              <div>{legalImportanceQuestions.map(renderLikert)}</div>
              <h3>Open Questions</h3>
              <div>
                {legalOpenQuestions.map((question) => (
                  <div key={question.key} className="mb-3">
                    <label className="form-label">{question.label}</label>
                    <textarea
                      className="form-control"
                      value={(preflight[question.key] as string | undefined) ?? ""}
                      onChange={(event) =>
                        setPreflight((prev) => ({
                          ...prev,
                          [question.key]: event.target.value,
                        }))
                      }
                    ></textarea>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div>
              <h3>Dispositional Trust (1-7)</h3>
              <div>{dispositionalQuestions.map(renderLikert)}</div>
            </div>
          )}
          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleCompute}>
              Submit pre-flight questionnaire
            </button>
          </div>
          <p className="status">Preflight score: {preflightStatus}</p>
          {syncStatus ? <p className="status">{syncStatus}</p> : null}
          {errorMessage ? <p className="status">{errorMessage}</p> : null}
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
