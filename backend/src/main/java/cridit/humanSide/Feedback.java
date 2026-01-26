package cridit.humanSide;

public class Feedback {
    private static final double DEFAULT_PRIOR_WEIGHT = 2.0;

    private final double positiveRate;
    private final double negativeRate;
    private final double uncertaintyRate;
    private final double baseRate;

    public Feedback(double positiveRate, double negativeRate, double uncertaintyRate, double baseRate) {
        this.positiveRate = positiveRate;
        this.negativeRate = negativeRate;
        this.uncertaintyRate = uncertaintyRate;
        this.baseRate = baseRate;
    }

    public static Feedback fromCounts(int positiveCount, int negativeCount, int uncertainCount, double baseRate) {
        return fromCounts(positiveCount, negativeCount, uncertainCount, baseRate, DEFAULT_PRIOR_WEIGHT);
    }

    public static Feedback fromCounts(int positiveCount, int negativeCount, int uncertainCount,
                                      double baseRate, double priorWeight) {
        if (positiveCount < 0 || negativeCount < 0 || uncertainCount < 0) {
            throw new IllegalArgumentException("Counts must be non-negative");
        }
        if (priorWeight <= 0.0) {
            throw new IllegalArgumentException("Prior weight must be positive");
        }

        validateUnit(baseRate, "baseRate");
        double effectivePrior = priorWeight + uncertainCount;
        double denom = effectivePrior + positiveCount + negativeCount;
        if (denom == 0.0) {
            return new Feedback(0.0, 0.0, 1.0, baseRate);
        }

        double b = positiveCount / denom;
        double d = negativeCount / denom;
        double u = effectivePrior / denom;
        return new Feedback(b, d, u, baseRate);
    }

    public static Feedback fromQualitative(double likelihood, double confidence, double baseRate) {
        validateUnit(likelihood, "likelihood");
        validateUnit(confidence, "confidence");
        validateUnit(baseRate, "baseRate");
        double b = confidence * likelihood;
        double d = confidence * (1.0 - likelihood);
        double u = 1.0 - confidence;
        return new Feedback(b, d, u, baseRate);
    }

    public static Report fromParticipantScalars(int reliability,
                                                int predictability,
                                                int selfConfidence,
                                                int taskCriticality) {
        validateLikert(reliability, "reliability");
        validateLikert(predictability, "predictability");
        validateLikert(selfConfidence, "selfConfidence");
        validateLikert(taskCriticality, "taskCriticality");

        double centeredReliability = reliability - 4.0;
        double centeredPredictability = predictability - 4.0;
        double likelihood = 0.5 + 0.2 * ((centeredReliability + centeredPredictability) / 6.0);

        double selfConfidenceFactor = (selfConfidence - 1.0) / 6.0;
        double consistency = 1.0 - 0.7 * (Math.abs(reliability - predictability) / 6.0);
        double confidence = selfConfidenceFactor * consistency;

        double criticalityCentered = (taskCriticality - 4.0) / 6.0;
        double baseRate = 0.5 - 0.3 * criticalityCentered;

        likelihood = clamp(likelihood);
        confidence = clamp(confidence);
        baseRate = clamp(baseRate);

        return new Report(likelihood, confidence, baseRate);
    }

    private static void validateUnit(double value, String name) {
        if (value < 0.0 || value > 1.0) {
            throw new IllegalArgumentException(name + " must be in [0,1]");
        }
    }

    private static void validateLikert(int value, String name) {
        if (value < 1 || value > 7) {
            throw new IllegalArgumentException(name + " must be in [1,7]");
        }
    }

    private static double clamp(double value) {
        return Math.min(1.0, Math.max(0.0, value));
    }

    public double getPositiveRate() {
        return positiveRate;
    }

    public double getNegativeRate() {
        return negativeRate;
    }

    public double getUncertaintyRate() {
        return uncertaintyRate;
    }

    public double getBaseRate() {
        return baseRate;
    }

    public record Signal(double likelihood, double confidence, double weight) {}

    public static class Report {
        private final double likelihood;
        private final double confidence;
        private final double baseRate;

        public Report(double likelihood, double confidence, double baseRate) {
            this.likelihood = likelihood;
            this.confidence = confidence;
            this.baseRate = baseRate;
        }

        public double getLikelihood() {
            return likelihood;
        }

        public double getConfidence() {
            return confidence;
        }

        public double getBaseRate() {
            return baseRate;
        }
    }
}
