package cridit.humanSide;

import cridit.api.dto.request.human.ProxyPhysioInput;

import java.util.Locale;

public class ProxyPhysioProcessor {
    public record PhysioSignal(double likelihood, double confidence, double weight) {}

    public static PhysioSignal compute(ProxyPhysioInput input) {
        if (input == null) {
            return new PhysioSignal(0.5, 0.0, 0.0);
        }

        Integer stress = input.selfReportedStress();
        Integer arousal = input.selfReportedArousal();
        Integer engagement = input.engagementLevel();
        Integer fatigue = input.fatigueLevel();
        Integer comfort = input.physicalComfort();
        Double reportConfidence = input.confidenceInReport();

        double physioState = calculatePhysioState(stress, arousal, engagement, fatigue, comfort, input.emotionalValence());
        double completeness = calculateCompleteness(stress, arousal, engagement, fatigue);
        double confidence = clamp((reportConfidence == null ? 0.7 : reportConfidence) * completeness * 0.6);

        double featureConsistency = calculateFeatureConsistency(stress, arousal, engagement, fatigue);
        double dataQuality = calculateDataQuality(confidence, completeness, featureConsistency);
        double weight = calculateWeight(dataQuality, 0.5, featureConsistency);

        return new PhysioSignal(clamp(physioState), clamp(confidence), clamp(weight));
    }

    private static double calculatePhysioState(Integer stress,
                                               Integer arousal,
                                               Integer engagement,
                                               Integer fatigue,
                                               Integer comfort,
                                               String emotionalValence) {
        double normStress = normalizeInverse(stress);
        double normArousal = normalizeCentered(arousal);
        double normEngagement = normalizeDirect(engagement);
        double normFatigue = normalizeInverse(fatigue);
        double normComfort = normalizeDirect(comfort);

        double base = 0.3 * normStress + 0.2 * normArousal + 0.25 * normEngagement + 0.15 * normFatigue + 0.1 * normComfort;
        double valenceAdjust = switch (normalizeKey(emotionalValence)) {
            case "positive" -> 0.05;
            case "negative" -> -0.05;
            default -> 0.0;
        };
        return clamp(base + valenceAdjust);
    }

    private static double calculateCompleteness(Integer... values) {
        int valid = 0;
        for (Integer value : values) {
            if (value != null && value >= 1 && value <= 5) {
                valid++;
            }
        }
        return values.length == 0 ? 0.0 : valid / (double) values.length;
    }

    private static double calculateFeatureConsistency(Integer stress, Integer arousal, Integer engagement, Integer fatigue) {
        int checks = 0;
        double score = 0.0;
        if (stress != null && fatigue != null) {
            if ((stress >= 4 && fatigue >= 3) || (stress <= 2 && fatigue <= 2)) {
                score += 1.0;
            }
            checks++;
        }
        if (engagement != null && fatigue != null) {
            if ((engagement >= 4 && fatigue <= 2) || (engagement <= 2 && fatigue >= 4)) {
                score += 1.0;
            }
            checks++;
        }
        if (arousal != null && stress != null) {
            if ((arousal >= 4 && stress >= 4) || (arousal <= 2 && stress <= 2)) {
                score += 1.0;
            }
            checks++;
        }
        return checks == 0 ? 0.7 : score / checks;
    }

    private static double calculateDataQuality(double confidence, double completeness, double featureConsistency) {
        return clamp(0.5 * confidence + 0.3 * completeness + 0.2 * featureConsistency);
    }

    private static double calculateWeight(double dataQuality, double userCalibration, double featureConsistency) {
        double baseWeight = 0.2;
        double adjusted = baseWeight * (0.4 * dataQuality + 0.4 * userCalibration + 0.2 * featureConsistency);
        return Math.pow(clamp(adjusted), 1.3);
    }

    private static double normalizeInverse(Integer value) {
        if (value == null) {
            return 0.5;
        }
        return 1.0 - normalizeDirect(value);
    }

    private static double normalizeDirect(Integer value) {
        if (value == null) {
            return 0.5;
        }
        return clamp((value - 1) / 4.0);
    }

    private static double normalizeCentered(Integer value) {
        if (value == null) {
            return 0.5;
        }
        double centered = 1.0 - Math.abs((value - 3) / 4.0);
        return clamp(centered);
    }

    private static String normalizeKey(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private static double clamp(double value) {
        return Math.min(1.0, Math.max(0.0, value));
    }
}
