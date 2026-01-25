"use client";

export type PreflightAnswers = {
  intentionToTrust1?: number;
  intentionToTrust2?: number;
  intentionToTrust3?: number;
  privacyConcern1?: number;
  privacyConcern2?: number;
  privacyConcern3?: number;
  privacyConcern4?: number;
  privacyConcern5?: number;
  riskAversion1?: number;
  riskAversion2?: number;
  riskAversion3?: number;
};

export type SessionParams = {
  behaviorBaseRate: number;
  feedbackBaseRate: number;
  initialUncertainty: number;
  initialThreshold: number;
};

export type BenchmarkEvidence = {
  evidenceKey: string;
  trustworthyMass: number;
  untrustworthyMass: number;
  uncertaintyMass: number;
  weight: number;
};

export type SessionData = {
  participantId: string;
  sessionId: string;
  domain: string;
  taskId: string;
  cueVisibility?: string;
  adaptationMode?: string;
  modelMethod?: string;
  thresholdNature?: string;
  backendBaseUrl: string;
  preflightAnswers: PreflightAnswers;
  preflightScore: number;
  params: SessionParams;
  benchmarkEvidence: BenchmarkEvidence[];
};

const STORAGE_KEY = "cridit-session";
const SESSION_COUNTER_KEY = "cridit-session-counter";
const ADOPTION_HISTORY_KEY = "cridit-adoption-history";

export const loadSession = (): SessionData | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
};

export const saveSession = (update: Partial<SessionData>) => {
  if (typeof window === "undefined") {
    return;
  }
  const existing = loadSession() ?? ({} as SessionData);
  const next = { ...existing, ...update } as SessionData;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
};

export const clearSession = () => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
};

export const resetSessionCounter = () => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(SESSION_COUNTER_KEY);
};

type AdoptionHistory = {
  adopted: number;
  rejected: number;
};

export const loadAdoptionHistory = (): AdoptionHistory => {
  if (typeof window === "undefined") {
    return { adopted: 0, rejected: 0 };
  }
  const raw = window.localStorage.getItem(ADOPTION_HISTORY_KEY);
  if (!raw) {
    return { adopted: 0, rejected: 0 };
  }
  try {
    const parsed = JSON.parse(raw) as AdoptionHistory;
    return {
      adopted: Number.isFinite(parsed.adopted) ? parsed.adopted : 0,
      rejected: Number.isFinite(parsed.rejected) ? parsed.rejected : 0,
    };
  } catch {
    return { adopted: 0, rejected: 0 };
  }
};

export const updateAdoptionHistory = (adoptedDelta: number, rejectedDelta: number) => {
  if (typeof window === "undefined") {
    return;
  }
  const current = loadAdoptionHistory();
  const next = {
    adopted: Math.max(0, current.adopted + Math.max(0, adoptedDelta)),
    rejected: Math.max(0, current.rejected + Math.max(0, rejectedDelta)),
  };
  window.localStorage.setItem(ADOPTION_HISTORY_KEY, JSON.stringify(next));
};

export const peekNextSessionId = (): string => {
  if (typeof window === "undefined") {
    return "1";
  }
  const raw = window.localStorage.getItem(SESSION_COUNTER_KEY);
  const current = raw ? Number(raw) : 0;
  const next = Number.isFinite(current) ? current + 1 : 1;
  return String(next);
};

export const commitNextSessionId = (): string => {
  if (typeof window === "undefined") {
    return "1";
  }
  const raw = window.localStorage.getItem(SESSION_COUNTER_KEY);
  const current = raw ? Number(raw) : 0;
  const next = Number.isFinite(current) ? current + 1 : 1;
  window.localStorage.setItem(SESSION_COUNTER_KEY, String(next));
  return String(next);
};
