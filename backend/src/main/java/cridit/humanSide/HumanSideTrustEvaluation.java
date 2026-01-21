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
    private double physioInputWeight;

    public double getHumanTrustScoreWithPreflight(double behaviorInputWeight, int adopted, int rejected,
                                                  PreflightScore.Response preflightResponse,
                                                  double feedbackInputWeight, Report feedbackReport,
                                                  double physioInputWeight, PhysiologicalReport physioReport) {
        this.behaviorInputWeight = behaviorInputWeight;
        this.feedbackInputWeight = feedbackInputWeight;
        this.physioInputWeight = physioInputWeight;

        double baseRate = PreflightScore.computeScore(preflightResponse).feedbackBaseRate();
        Adoption adoption = new Adoption(adopted, rejected, baseRate);
        if (adopted + rejected == 0) {
            if (feedbackInputWeight + physioInputWeight == 0.0) {
                throw new IllegalArgumentException("At least one human input weight must be non-zero");
            }
            Opinion feedbackOpinion = feedbackInputWeight == 0.0 ? null : subjectiveLogic.getFeedbackOpinion(feedbackReport);
            Opinion physioOpinion = physioInputWeight == 0.0 ? null : subjectiveLogic.getPhysioOpinion(physioReport);
            Opinion fusedOpinion = fuseOpinions(null, feedbackOpinion, physioOpinion);
            return subjectiveLogic.getHumanTrustLevel(fusedOpinion);
        }
        return getHumanTrustScore(behaviorInputWeight, adoption, feedbackInputWeight, feedbackReport,
                physioInputWeight, physioReport);
    }

    public double getHumanTrustScore(double behaviorInputWeight, Adoption adoption,
                                     double feedbackInputWeight, Report feedbackReport,
                                     double physioInputWeight, PhysiologicalReport physioReport) {
        this.behaviorInputWeight = behaviorInputWeight;
        this.feedbackInputWeight = feedbackInputWeight;
        this.physioInputWeight = physioInputWeight;
        validateWeights(behaviorInputWeight, feedbackInputWeight, physioInputWeight);

        Opinion behaviorOpinion = null;
        Opinion feedbackOpinion = null;
        Opinion physioOpinion = null;

        if (behaviorInputWeight != 0.0) {
            behaviorOpinion = subjectiveLogic.getBehaviorOpinion(adoption);
        }
        if (feedbackInputWeight != 0.0) {
            feedbackOpinion = subjectiveLogic.getFeedbackOpinion(feedbackReport);
        }
        if (physioInputWeight != 0.0) {
            physioOpinion = subjectiveLogic.getPhysioOpinion(physioReport);
        }

        Opinion fusedOpinion = fuseOpinions(behaviorOpinion, feedbackOpinion, physioOpinion);
        return subjectiveLogic.getHumanTrustLevel(fusedOpinion);
    }


    public double applyRiskPerception(double trustScore, double riskPerception) {
        validateUnit(riskPerception, "riskPerception");
        return trustScore * (1.0 - riskPerception);
    }

    private Opinion fuseOpinions(Opinion behaviorOpinion, Opinion feedbackOpinion, Opinion physioOpinion) {
        double[] weights = effectiveWeights(behaviorOpinion != null, feedbackOpinion != null, physioOpinion != null);
        Opinion weightedBehavior = behaviorOpinion == null
                ? null
                : subjectiveLogic.discountByWeight(weights[0], behaviorOpinion);
        Opinion weightedFeedback = feedbackOpinion == null
                ? null
                : subjectiveLogic.discountByWeight(weights[1], feedbackOpinion);
        Opinion weightedPhysio = physioOpinion == null
                ? null
                : subjectiveLogic.discountByWeight(weights[2], physioOpinion);

        if (weightedBehavior != null && weightedFeedback != null && weightedPhysio != null) {
            return subjectiveLogic.consensus(weightedBehavior, weightedFeedback, weightedPhysio);
        }
        if (weightedBehavior != null && weightedFeedback != null) {
            return subjectiveLogic.consensus(weightedBehavior, weightedFeedback);
        }
        if (weightedBehavior != null && weightedPhysio != null) {
            return subjectiveLogic.consensus(weightedBehavior, weightedPhysio);
        }
        if (weightedFeedback != null && weightedPhysio != null) {
            return subjectiveLogic.consensus(weightedFeedback, weightedPhysio);
        }
        if (weightedBehavior != null) {
            return weightedBehavior;
        }
        if (weightedFeedback != null) {
            return weightedFeedback;
        }
        if (weightedPhysio != null) {
            return weightedPhysio;
        }
        throw new IllegalArgumentException("At least one human input must be provided");
    }

    private void validateWeights(double behaviorWeight, double feedbackWeight, double physioWeight) {
        double sum = behaviorWeight + feedbackWeight + physioWeight;
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

    private double[] effectiveWeights(boolean hasBehavior, boolean hasFeedback, boolean hasPhysio) {
        double wb = hasBehavior ? Math.pow(behaviorInputWeight, WEIGHT_POWER) : 0.0;
        double wf = hasFeedback ? Math.pow(feedbackInputWeight, WEIGHT_POWER) : 0.0;
        double wp = hasPhysio ? Math.pow(physioInputWeight, WEIGHT_POWER) : 0.0;
        double sum = wb + wf + wp;
        if (sum == 0.0) {
            return new double[]{0.0, 0.0, 0.0};
        }
        return new double[]{wb / sum, wf / sum, wp / sum};
    }
}
