package cridit.humanSide.preflight;

public final class PreflightScore {
    private PreflightScore() {
    }

    public record Response(double[] factors) {
        public Response {
            if (factors == null || factors.length == 0) {
                throw new IllegalArgumentException("Preflight factors must not be empty");
            }
            for (int index = 0; index < factors.length; index++) {
                validateUnit(factors[index], "factor[" + index + "]");
            }
        }
    }

    public record ScoreResult(
            double preflightScore,
            double behaviorBaseRate,
            double feedbackBaseRate,
            double initialUncertainty,
            double initialThreshold
    ) {
    }

    public static double normalizeLikert(int value, int min, int max) {
        if (max <= min) {
            throw new IllegalArgumentException("Invalid Likert range");
        }
        if (value < min || value > max) {
            throw new IllegalArgumentException("Likert value out of range");
        }
        return (value - min) / (double) (max - min);
    }

    public static ScoreResult computeScore(Response response) {
        double[] factors = response.factors();
        double sum = 0.0;
        for (double value : factors) {
            sum += value;
        }
        double rawScore = sum / factors.length;
        double score = round3(rawScore);

        double low = triangle(score, 0.0, 0.0, 0.5);
        double mid = triangle(score, 0.0, 0.5, 1.0);
        double high = triangle(score, 0.5, 1.0, 1.0);
        double total = low + mid + high;
        if (total == 0.0) {
            total = 1.0;
        }

        double baseRate = (low * 0.35 + mid * 0.55 + high * 0.75) / total;
        double uncertainty = (low * 0.5 + mid * 0.3 + high * 0.15) / total;
        double threshold = (low * 0.08 + mid * 0.12 + high * 0.18) / total;

        return new ScoreResult(
                score,
                0.0,
                round3(baseRate),
                round3(uncertainty),
                round3(threshold)
        );
    }

    private static void validateUnit(double value, String name) {
        if (value < 0.0 || value > 1.0) {
            throw new IllegalArgumentException(name + " must be between 0.0 and 1.0");
        }
    }

    private static double triangle(double x, double a, double b, double c) {
        if (a == b) {
            if (x <= b) {
                return 1.0;
            }
            if (x >= c) {
                return 0.0;
            }
            return (c - x) / (c - b);
        }
        if (b == c) {
            if (x >= b) {
                return 1.0;
            }
            if (x <= a) {
                return 0.0;
            }
            return (x - a) / (b - a);
        }
        if (x <= a || x >= c) {
            return 0.0;
        }
        if (x == b) {
            return 1.0;
        }
        if (x < b) {
            return (x - a) / (b - a);
        }
        return (c - x) / (c - b);
    }

    private static double round3(double value) {
        return Math.round(value * 1000.0) / 1000.0;
    }

}
