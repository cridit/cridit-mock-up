"use client";

import { useEffect, useState } from "react";
import { ScenarioView } from "./ScenarioView";
import { overrideBaseline, scenarioMap, type ScenarioKey } from "./data";

type OperatorScenarioClientProps = {
  scenarioKey: ScenarioKey;
};

const BACKEND_URL = "http://cridit-mock-up:8001";
const STORAGE_KEY = "cridit-operator-inputs";

export function OperatorScenarioClient({ scenarioKey }: OperatorScenarioClientProps) {
  const scenario = scenarioMap.get(scenarioKey);
  const [overrideValues, setOverrideValues] = useState<
    { baseline?: string; preflight?: string; threshold?: string } | undefined
  >(undefined);

  useEffect(() => {
    if (!scenario) return;
    let isMounted = true;
    const readLocalInputs = () => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Record<
          ScenarioKey,
          { baseline?: string; preflight?: string; threshold?: string }
        >;
        const entry = parsed[scenarioKey];
        if (entry) {
          setOverrideValues(entry);
        }
      } catch {
        // ignore storage errors
      }
    };

    const fetchInputs = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/inputs/${scenarioKey}`);
        if (!response.ok) return;
        const data = (await response.json()) as {
          baselineMachine?: number;
          preflightHuman?: number;
          threshold?: number;
        };
        if (!isMounted) return;
        setOverrideValues((current) => ({
          ...current,
          baseline: data.baselineMachine?.toString(),
          preflight: data.preflightHuman?.toString(),
          threshold: data.threshold?.toString(),
        }));
      } catch {
        // keep existing values
      }
    };

    readLocalInputs();
    fetchInputs();
    const interval = window.setInterval(fetchInputs, 3000);
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      readLocalInputs();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      isMounted = false;
      window.clearInterval(interval);
      window.removeEventListener("storage", onStorage);
    };
  }, [scenarioKey, scenario]);

  if (!scenario) return null;

  const scenarioOverride = overrideBaseline(scenario, overrideValues);

  return <ScenarioView scenario={scenarioOverride} isOperator />;
}
