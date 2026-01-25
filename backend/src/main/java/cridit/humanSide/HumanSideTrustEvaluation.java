package cridit.humanSide;

import cridit.humanSide.Feedback.Report;
import cridit.humanSide.preflight.PreflightScore;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class HumanSideTrustEvaluation {
    private final SubjectiveLogic subjectiveLogic = new SubjectiveLogic();
    private static final double WEIGHT_POWER = 2.0;

    private double behaviorInputWeight;
    private double feedbackInputWeight;

    public double getHumanTrustScoreWithPreflight(PreflightScore.Response preflightResponse) {
        if (preflightResponse == null) {
            throw new IllegalArgumentException("Preflight response is required");
        }
        return PreflightScore.computeScore(preflightResponse).preflightScore();
    }

    public double getHumanTrustScore(double behaviorInputWeight, Adoption adoption,
                                     double feedbackInputWeight, Report feedbackReport) {
        this.behaviorInputWeight = behaviorInputWeight;
        this.feedbackInputWeight = feedbackInputWeight;
        validateWeights(behaviorInputWeight, feedbackInputWeight);

        Opinion behaviorOpinion = null;
        Opinion feedbackOpinion = null;

        if (behaviorInputWeight != 0.0) {
            behaviorOpinion = subjectiveLogic.getBehaviorOpinion(adoption);
        }
        if (feedbackInputWeight != 0.0) {
            feedbackOpinion = subjectiveLogic.getFeedbackOpinion(feedbackReport);
        }

        Opinion fusedOpinion = fuseOpinions(behaviorOpinion, feedbackOpinion);
        return subjectiveLogic.getHumanTrustLevel(fusedOpinion);
    }


    public double applyRiskPerception(double trustScore, double riskPerception) {
        validateUnit(riskPerception, "riskPerception");
        return trustScore * (1.0 - riskPerception);
    }

    private Opinion fuseOpinions(Opinion behaviorOpinion, Opinion feedbackOpinion) {
        double[] weights = effectiveWeights(behaviorOpinion != null, feedbackOpinion != null);
        Opinion weightedBehavior = behaviorOpinion == null
                ? null
                : subjectiveLogic.discountByWeight(weights[0], behaviorOpinion);
        Opinion weightedFeedback = feedbackOpinion == null
                ? null
                : subjectiveLogic.discountByWeight(weights[1], feedbackOpinion);
        if (weightedBehavior != null && weightedFeedback != null) {
            return subjectiveLogic.consensus(weightedBehavior, weightedFeedback);
        }
        if (weightedBehavior != null) {
            return weightedBehavior;
        }
        if (weightedFeedback != null) {
            return weightedFeedback;
        }
        throw new IllegalArgumentException("At least one human input must be provided");
    }

    private void validateWeights(double behaviorWeight, double feedbackWeight) {
        double sum = behaviorWeight + feedbackWeight;
        if (sum == 0.0) {
            throw new IllegalArgumentException("At least one human input weight must be non-zero");
        }
        if (Math.abs(sum - 1.0) > 1e-9) {
            throw new IllegalArgumentException("Human input weights must sum to 1.0");
        }
    }

    private void validateUnit(double value, String name) {
        if (value < 0.0 || value > 1.0) {
            throw new IllegalArgumentException(name + " must be between 0.0 and 1.0");
        }
    }

    private double[] effectiveWeights(boolean hasBehavior, boolean hasFeedback) {
        double wb = hasBehavior ? Math.pow(behaviorInputWeight, WEIGHT_POWER) : 0.0;
        double wf = hasFeedback ? Math.pow(feedbackInputWeight, WEIGHT_POWER) : 0.0;
        double sum = wb + wf;
        if (sum == 0.0) {
            return new double[]{0.0, 0.0};
        }
        return new double[]{wb / sum, wf / sum};
    }
}
