package cridit.machineSide.events;

import cridit.machineSide.Evidence;

import java.util.Locale;

public class EventToEvidenceMapper {
    private static final double[] POSITIVE_BASE = new double[]{0.7, 0.1, 0.2};
    private static final double[] NEGATIVE_BASE = new double[]{0.1, 0.7, 0.2};
    private static final double[] NEUTRAL_BASE = new double[]{0.33, 0.33, 0.34};

    public Evidence mapBaselineScore(double baselineScore, String modelId) {
        double clamped = clamp01(baselineScore);
        // Preserve the baseline trust score when this is the only evidence.
        double uncertaintyMass = Math.min(0.2, 2.0 * (1.0 - clamped));
        double trustworthyMass = clamp01((2.0 * clamped - uncertaintyMass) / 2.0);
        double untrustworthyMass = clamp01(1.0 - trustworthyMass - uncertaintyMass);
        double[] masses = normalize(trustworthyMass, untrustworthyMass, uncertaintyMass);
        String key = "baseline_" + sanitize(modelId);
        return new Evidence(key, masses[0], masses[1], masses[2]);
    }

    public Evidence mapEventToEvidence(TrustEvent event, double timeDecay) {
        double[] base = baseMasses(event.polarity());
        scaleBySeverity(base, event.severity());
        applyContextCriticality(base, event.context());
        applyTimeDecay(base, timeDecay);
        double[] masses = normalize(base[0], base[1], base[2]);
        String key = buildEvidenceKey(event);
        return new Evidence(key, masses[0], masses[1], masses[2]);
    }

    private double[] baseMasses(EventPolarity polarity) {
        if (polarity == EventPolarity.POSITIVE) {
            return POSITIVE_BASE.clone();
        }
        if (polarity == EventPolarity.NEGATIVE) {
            return NEGATIVE_BASE.clone();
        }
        return NEUTRAL_BASE.clone();
    }

    private void scaleBySeverity(double[] masses, double severity) {
        double factor = clamp01(severity);
        if (masses == null || masses.length != 3) {
            return;
        }
        if (masses[0] > masses[1]) {
            masses[0] = masses[0] * (0.75 + 0.25 * factor);
            masses[1] = masses[1] * (1.0 - 0.25 * factor);
        } else if (masses[1] > masses[0]) {
            masses[1] = masses[1] * (0.75 + 0.25 * factor);
            masses[0] = masses[0] * (1.0 - 0.25 * factor);
        }
        masses[2] = 1.0 - (masses[0] + masses[1]);
    }

    private void applyContextCriticality(double[] masses, ContextCriticality context) {
        if (context == null) {
            return;
        }
        double multiplier = context.multiplier();
        double capped = Math.min(multiplier, 1.35);
        if (capped > 1.0) {
            masses[1] *= capped;
            double excess = masses[1] - 1.0;
            if (excess > 0.0) {
                masses[1] = 1.0;
                masses[0] = Math.max(0.0, masses[0] - excess * 0.5);
                masses[2] = Math.max(0.0, masses[2] - excess * 0.5);
            }
        } else {
            masses[0] = masses[0] * (0.3 + 0.7 * multiplier);
            masses[1] = masses[1] * (0.3 + 0.7 * multiplier);
            masses[2] = 1.0 - (masses[0] + masses[1]);
        }
    }

    private void applyTimeDecay(double[] masses, double timeDecay) {
        double freshness = clamp01(timeDecay);
        masses[0] = masses[0] * freshness + (1 - freshness) * 0.33;
        masses[1] = masses[1] * freshness + (1 - freshness) * 0.33;
        masses[2] = 1.0 - (masses[0] + masses[1]);
    }

    private double[] normalize(double trustworthy, double untrustworthy, double uncertainty) {
        double sum = trustworthy + untrustworthy + uncertainty;
        if (sum <= 0.0) {
            return NEUTRAL_BASE.clone();
        }
        return new double[]{trustworthy / sum, untrustworthy / sum, uncertainty / sum};
    }

    private String buildEvidenceKey(TrustEvent event) {
        String domain = sanitize(event.domain());
        return String.format(
                "%s_%d_%s",
                event.eventType().key(),
                event.timestamp(),
                domain
        );
    }

    private String sanitize(String value) {
        if (value == null || value.isBlank()) {
            return "global";
        }
        return value.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", "_");
    }

    private double clamp01(double value) {
        if (value < 0.0) {
            return 0.0;
        }
        if (value > 1.0) {
            return 1.0;
        }
        return value;
    }
}
