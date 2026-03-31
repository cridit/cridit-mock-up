package cridit.humanSide;

public class Feedback {
    private static final double DEFAULT_PRIOR_WEIGHT = 2.0;
    private static final double[] LIKELIHOOD_LEVELS = new double[]{0.05, 0.25, 0.5, 0.75, 0.95};
    private static final double[] CONFIDENCE_LEVELS = new double[]{0.1, 0.3, 0.5, 0.7, 0.9};
    private static final double[][][] QUALITATIVE_MATRIX = buildQualitativeMatrix();

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

        QualitativeLevel likelihoodLevel = mapLikertToLevel(roundedLikertAverage(reliability, predictability));
        QualitativeLevel confidenceLevel = mapLikertToLevel(selfConfidence);
        double[] opinion = qualitativeOpinion(likelihoodLevel, confidenceLevel);

        double criticalityCentered = (taskCriticality - 4.0) / 6.0;
        double baseRate = 0.5 - 0.3 * criticalityCentered;

        baseRate = clamp(baseRate);

        return Report.fromOpinion(opinion[0], opinion[1], opinion[2], baseRate);
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
        private final boolean hasOpinion;
        private final double belief;
        private final double disbelief;
        private final double uncertainty;

        public Report(double likelihood, double confidence, double baseRate) {
            this.likelihood = likelihood;
            this.confidence = confidence;
            this.baseRate = baseRate;
            this.hasOpinion = false;
            this.belief = 0.0;
            this.disbelief = 0.0;
            this.uncertainty = 1.0;
        }

        private Report(double belief, double disbelief, double uncertainty, double baseRate, boolean hasOpinion) {
            this.likelihood = 0.0;
            this.confidence = 0.0;
            this.baseRate = baseRate;
            this.hasOpinion = hasOpinion;
            this.belief = belief;
            this.disbelief = disbelief;
            this.uncertainty = uncertainty;
        }

        public static Report fromOpinion(double belief, double disbelief, double uncertainty, double baseRate) {
            double[] normalized = normalizeOpinion(belief, disbelief, uncertainty);
            return new Report(normalized[0], normalized[1], normalized[2], baseRate, true);
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

        public boolean hasOpinion() {
            return hasOpinion;
        }

        public double getBelief() {
            return belief;
        }

        public double getDisbelief() {
            return disbelief;
        }

        public double getUncertainty() {
            return uncertainty;
        }
    }

    private enum QualitativeLevel {
        VERY_LOW,
        LOW,
        MEDIUM,
        HIGH,
        VERY_HIGH
    }

    private static QualitativeLevel mapLikertToLevel(int value) {
        if (value <= 2) {
            return QualitativeLevel.VERY_LOW;
        }
        if (value == 3) {
            return QualitativeLevel.LOW;
        }
        if (value == 4) {
            return QualitativeLevel.MEDIUM;
        }
        if (value == 5) {
            return QualitativeLevel.HIGH;
        }
        return QualitativeLevel.VERY_HIGH;
    }

    private static int roundedLikertAverage(int left, int right) {
        return (int) Math.round((left + right) / 2.0);
    }

    private static double[] qualitativeOpinion(QualitativeLevel likelihood, QualitativeLevel confidence) {
        return QUALITATIVE_MATRIX[likelihood.ordinal()][confidence.ordinal()];
    }

    private static double[][][] buildQualitativeMatrix() {
        double[][][] matrix = new double[5][5][3];
        for (int i = 0; i < LIKELIHOOD_LEVELS.length; i++) {
            double likelihood = LIKELIHOOD_LEVELS[i];
            for (int j = 0; j < CONFIDENCE_LEVELS.length; j++) {
                double confidence = CONFIDENCE_LEVELS[j];
                double belief = confidence * likelihood;
                double disbelief = confidence * (1.0 - likelihood);
                double uncertainty = 1.0 - confidence;
                matrix[i][j][0] = belief;
                matrix[i][j][1] = disbelief;
                matrix[i][j][2] = uncertainty;
            }
        }
        return matrix;
    }

    private static double[] normalizeOpinion(double belief, double disbelief, double uncertainty) {
        validateUnit(belief, "belief");
        validateUnit(disbelief, "disbelief");
        validateUnit(uncertainty, "uncertainty");
        double sum = belief + disbelief + uncertainty;
        if (sum == 0.0) {
            return new double[]{0.0, 0.0, 1.0};
        }
        return new double[]{belief / sum, disbelief / sum, uncertainty / sum};
    }
}
