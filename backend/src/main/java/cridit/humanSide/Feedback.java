package cridit.humanSide;

import cridit.api.dto.request.human.FrontendFeedbackInput;
import org.jboss.logging.Logger;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class Feedback {
    private static final Logger LOG = Logger.getLogger(Feedback.class);
    private static final double DEFAULT_PRIOR_WEIGHT = 2.0;

    private static final Map<String, Double> EMOTION_MAP = Map.ofEntries(
            Map.entry("angry", 0.1),
            Map.entry("frustrated", 0.2),
            Map.entry("stressed", 0.3),
            Map.entry("anxious", 0.4),
            Map.entry("neutral", 0.5),
            Map.entry("calm", 0.7),
            Map.entry("happy", 0.8),
            Map.entry("excited", 0.9),
            Map.entry("grateful", 0.85),
            Map.entry("relieved", 0.75)
    );

    private static final Map<String, Double> HELPFULNESS_MAP = Map.of(
            "not_helpful", 0.1,
            "somewhat_helpful", 0.4,
            "helpful", 0.7,
            "very_helpful", 0.9
    );

    private static final Map<String, Double> SATISFACTION_MAP = Map.of(
            "very_dissatisfied", 0.1,
            "dissatisfied", 0.3,
            "neutral", 0.5,
            "satisfied", 0.7,
            "very_satisfied", 0.9
    );

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

    public static Signal computeSignal(FrontendFeedbackInput input) {
        if (input == null) {
            return new Signal(0.5, 0.0, 0.0);
        }

        Integer rating = input.rating();
        String feedbackText = normalizeText(input.feedbackText());
        String emotionalState = normalizeKey(input.emotionalState());
        String satisfaction = normalizeKey(input.satisfaction());
        String helpfulness = normalizeKey(input.helpfulness());

        double ratingScore = rating == null ? 0.5 : clamp((rating - 1) / 4.0);
        double emotionScore = EMOTION_MAP.getOrDefault(emotionalState, 0.5);
        double satisfactionScore = SATISFACTION_MAP.getOrDefault(satisfaction, 0.5);
        double helpfulnessScore = HELPFULNESS_MAP.getOrDefault(helpfulness, 0.5);

        double likelihood = 0.4 * ratingScore + 0.2 * emotionScore + 0.2 * satisfactionScore + 0.2 * helpfulnessScore;
        double sentimentScore = analyzeSentiment(feedbackText);
        if (!feedbackText.isBlank()) {
            likelihood = 0.7 * likelihood + 0.3 * sentimentScore;
        }

        double completeness = calculateCompleteness(rating, feedbackText, emotionalState, helpfulness, satisfaction);
        double confidence = clamp(completeness * 0.9);
        if (feedbackText.isBlank()) {
            confidence *= 0.8;
        }

        double timeliness = calculateTimeliness(input.timestamp());
        double weight = calculateWeight(0.7, completeness, timeliness);
        weight = applyTrustFactorBoost(weight, input.trustFactors());

        if (!feedbackText.isBlank()) {
            LOG.debugf(
                    "feedback sentiment: text=\"%s\" rating=%s emotion=%s satisfaction=%s helpfulness=%s " +
                            "sentiment=%.3f likelihood=%.3f confidence=%.3f weight=%.3f",
                    feedbackText,
                    rating == null ? "null" : rating,
                    emotionalState,
                    satisfaction,
                    helpfulness,
                    sentimentScore,
                    likelihood,
                    confidence,
                    weight
            );
        }

        return new Signal(clamp(likelihood), clamp(confidence), clamp(weight));
    }

    private static double calculateWeight(double consistency, double completeness, double timeliness) {
        double score = 0.4 * consistency + 0.4 * completeness + 0.2 * timeliness;
        return Math.pow(clamp(score), 1.5);
    }

    private static double applyTrustFactorBoost(double weight, List<String> trustFactors) {
        if (trustFactors == null || trustFactors.isEmpty()) {
            return weight;
        }
        double boost = 0.0;
        for (String factor : trustFactors) {
            String normalized = normalizeKey(factor);
            if (normalized.isBlank()) {
                continue;
            }
            if ("humanness".equals(normalized) || "empathy".equals(normalized)) {
                boost += 0.15;
            } else {
                boost += 0.05;
            }
        }
        double multiplier = 1.0 + Math.min(boost, 0.5);
        return clamp(weight * multiplier);
    }

    private static double calculateTimeliness(String timestamp) {
        if (timestamp == null || timestamp.isBlank()) {
            return 1.0;
        }
        try {
            Instant feedbackTime = Instant.parse(timestamp);
            Duration delay = Duration.between(feedbackTime, Instant.now());
            long minutes = Math.max(0L, delay.toMinutes());
            return Math.exp(-minutes / (24.0 * 60.0 * 7.0));
        } catch (Exception e) {
            return 1.0;
        }
    }

    private static double calculateCompleteness(Integer rating,
                                                String feedbackText,
                                                String emotionalState,
                                                String helpfulness,
                                                String satisfaction) {
        double score = 0.0;
        if (rating != null) {
            score += 0.4;
        }
        if (!feedbackText.isBlank()) {
            score += 0.3;
        }
        if (!emotionalState.isBlank()) {
            score += 0.2;
        }
        if (!helpfulness.isBlank()) {
            score += 0.05;
        }
        if (!satisfaction.isBlank()) {
            score += 0.05;
        }
        return clamp(score);
    }

    private static double analyzeSentiment(String text) {
        if (text.isBlank()) {
            return 0.5;
        }
        String lower = text.toLowerCase(Locale.ROOT);
        int negative = countOccurrences(lower, new String[]{
                "do not trust", "don't trust", "cannot trust", "can't trust", "no trust", "not trust",
                "distrust", "untrustworthy", "unreliable",
                "bad", "poor", "unhelpful", "wrong", "confusing", "disappointed", "frustrating"
        });
        int positive = countOccurrences(lower, new String[]{
                "trust", "reliable", "accurate", "safe",
                "good", "great", "helpful", "thanks", "excellent", "useful", "supportive"
        });
        if (negative > 0) {
            positive = Math.max(0, positive - negative);
        }
        if (positive + negative == 0) {
            return 0.5;
        }
        return (double) positive / (positive + negative);
    }

    private static int countOccurrences(String text, String[] keywords) {
        int count = 0;
        for (String keyword : keywords) {
            int idx = text.indexOf(keyword);
            while (idx >= 0) {
                count++;
                idx = text.indexOf(keyword, idx + keyword.length());
            }
        }
        return count;
    }

    private static String normalizeKey(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private static String normalizeText(String value) {
        return value == null ? "" : value.trim();
    }

    private static void validateUnit(double value, String name) {
        if (value < 0.0 || value > 1.0) {
            throw new IllegalArgumentException(name + " must be in [0,1]");
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
