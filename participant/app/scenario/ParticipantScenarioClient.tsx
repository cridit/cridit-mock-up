"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScenarioView } from "./ScenarioView";
import { loadSession } from "../lib/session";
import { overrideBaseline, scenarioMap, type ScenarioKey } from "./data";

type ParticipantScenarioClientProps = {
  scenarioKey: ScenarioKey;
};

const BACKEND_URL = "http://cridit-mock-up:8001";

export function ParticipantScenarioClient({ scenarioKey }: ParticipantScenarioClientProps) {
  const router = useRouter();
  const scenario = scenarioMap.get(scenarioKey);
  const [overrideValues, setOverrideValues] = useState<
    { baseline?: string; preflight?: string; threshold?: string } | undefined
  >(undefined);

  useEffect(() => {
    if (!scenario) return;
    const session = loadSession();
    if (!session || session.taskId !== scenarioKey) {
      router.replace(`/preflight/${scenarioKey}`);
      return;
    }
    let isMounted = true;

    const readQueryParams = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const baseline = params.get("baseline") || undefined;
        const preflight = params.get("preflight") || undefined;
        const threshold = params.get("threshold") || undefined;
        if (baseline || preflight || threshold) {
          setOverrideValues((current) => ({
            ...current,
            baseline,
            preflight,
            threshold,
          }));
        }
      } catch {
        // ignore query parsing issues
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
        if (isMounted) {
          setOverrideValues(undefined);
        }
      }
    };

    readQueryParams();
    fetchInputs();
    const interval = window.setInterval(fetchInputs, 3000);
    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [router, scenarioKey, scenario]);

  if (!scenario) return null;

  const scenarioOverride = overrideBaseline(scenario, overrideValues);

  return <ScenarioView scenario={scenarioOverride} />;
}
