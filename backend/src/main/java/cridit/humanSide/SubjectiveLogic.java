package cridit.humanSide;

import cridit.humanSide.Feedback.Report;

public class SubjectiveLogic {
    double behaviorInputWeight;
    double feedbackInputWeight;

    public Opinion getBehaviorOpinion(Adoption adoption) {
        if(adoption==null){
            throw new NullPointerException("Adoption is null");
        }
        int adopted = adoption.getAdopted();
        int rejected = adoption.getRejected();
        double adoptionBaseRate = adoption.getBaseRate();

        double b = (adopted)/(2.0 + adopted + rejected);
        double d = (rejected)/(2.0 + adopted + rejected);
        double u = 2.0/(2.0 + adopted + rejected);
        return new Opinion(b, d, u, adoptionBaseRate);
    }

    public Opinion getFeedbackOpinion(Report report) {
        if (report == null) {
            throw new NullPointerException("Feedback report is null");
        }
        return getLikelihoodOpinion(report.getLikelihood(), report.getConfidence(), report.getBaseRate());
    }

    public Opinion getQualitativeOpinion(double likelihood, double confidence, double baseRate) {
        if (likelihood < 0.0 || likelihood > 1.0) {
            throw new IllegalArgumentException("likelihood must be in [0,1]");
        }
        if (confidence < 0.0 || confidence > 1.0) {
            throw new IllegalArgumentException("confidence must be in [0,1]");
        }
        if (baseRate < 0.0 || baseRate > 1.0) {
            throw new IllegalArgumentException("baseRate must be in [0,1]");
        }
        double b = confidence * likelihood;
        double d = confidence * (1.0 - likelihood);
        double u = 1.0 - confidence;
        return new Opinion(b, d, u, baseRate);
    }

    public Opinion getLikelihoodOpinion(double likelihood, double confidence, double baseRate) {
        if (likelihood < 0.0 || likelihood > 1.0) {
            throw new IllegalArgumentException("likelihood must be in [0,1]");
        }
        if (confidence < 0.0 || confidence > 1.0) {
            throw new IllegalArgumentException("confidence must be in [0,1]");
        }
        if (baseRate < 0.0 || baseRate > 1.0) {
            throw new IllegalArgumentException("baseRate must be in [0,1]");
        }

        double u = 1.0 - confidence;
        double b = likelihood - baseRate * u;
        double d = 1.0 - u - b;

        b = clamp01(b);
        d = clamp01(d);
        double remaining = 1.0 - u;
        double sum = b + d;
        if (sum > 0.0) {
            b = (b / sum) * remaining;
            d = (d / sum) * remaining;
        } else {
            b = remaining * clamp01(likelihood);
            d = remaining - b;
        }

        return new Opinion(b, d, u, baseRate);
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

    public Opinion fuse(Opinion behaviorOpinion, Opinion feedbackOpinion, double behaviorInputWeight, double feedbackInputWeight) {
        if(feedbackInputWeight == 0){
            return new Opinion(behaviorOpinion.getBelief(), behaviorOpinion.getDisbelief(), behaviorOpinion.getUncertainty(), behaviorOpinion.getBaseRate());
        } else if (behaviorInputWeight == 0){
            return new Opinion(feedbackOpinion.getBelief(), feedbackOpinion.getDisbelief(), feedbackOpinion.getUncertainty(), feedbackOpinion.getBaseRate());
        } else {
            double weightSum = behaviorInputWeight + feedbackInputWeight;
            double normalizedBehaviorInputWeight = behaviorInputWeight / weightSum;
            double normalizedFeedbackInputWeight = feedbackInputWeight / weightSum;
            double b = normalizedBehaviorInputWeight * behaviorOpinion.getBelief() + normalizedFeedbackInputWeight * feedbackOpinion.getBelief();
            double d = normalizedBehaviorInputWeight * behaviorOpinion.getDisbelief() + normalizedFeedbackInputWeight * feedbackOpinion.getDisbelief();
            double u = normalizedBehaviorInputWeight * behaviorOpinion.getUncertainty() + normalizedFeedbackInputWeight * feedbackOpinion.getUncertainty();
            double a = normalizedBehaviorInputWeight * behaviorOpinion.getBaseRate() + normalizedFeedbackInputWeight * feedbackOpinion.getBaseRate();

            return new Opinion(b, d, u, a);
        }
    }

    public Opinion discount(Opinion trustOpinion, Opinion targetOpinion) {
        if (trustOpinion == null || targetOpinion == null) {
            throw new NullPointerException("Opinions must not be null");
        }
        double b = trustOpinion.getBelief() * targetOpinion.getBelief();
        double d = trustOpinion.getBelief() * targetOpinion.getDisbelief();
        double u = trustOpinion.getDisbelief()
                + trustOpinion.getUncertainty()
                + trustOpinion.getBelief() * targetOpinion.getUncertainty();
        return new Opinion(b, d, u, targetOpinion.getBaseRate());
    }

    public Opinion discountByWeight(double weight, Opinion targetOpinion) {
        if (targetOpinion == null) {
            throw new NullPointerException("Opinion must not be null");
        }
        if (weight < 0.0 || weight > 1.0) {
            throw new IllegalArgumentException("Weight must be in [0,1]");
        }
        Opinion trustOpinion = new Opinion(weight, 0.0, 1.0 - weight, 0.5);
        return discount(trustOpinion, targetOpinion);
    }

    public Opinion consensus(Opinion left, Opinion right) {
        if (left == null || right == null) {
            throw new NullPointerException("Opinions must not be null");
        }
        double u1 = left.getUncertainty();
        double u2 = right.getUncertainty();
        double k = u1 + u2 - (u1 * u2);
        if (k == 0.0) {
            double b = 0.5 * (left.getBelief() + right.getBelief());
            double d = 0.5 * (left.getDisbelief() + right.getDisbelief());
            double a = 0.5 * (left.getBaseRate() + right.getBaseRate());
            return new Opinion(b, d, 0.0, a);
        }

        double b = (left.getBelief() * u2 + right.getBelief() * u1) / k;
        double d = (left.getDisbelief() * u2 + right.getDisbelief() * u1) / k;
        double u = (u1 * u2) / k;
        double a = (left.getBaseRate() * u2 + right.getBaseRate() * u1) / k;
        if (a < 0.0) {
            a = 0.0;
        } else if (a > 1.0) {
            a = 1.0;
        }
        return new Opinion(b, d, u, a);
    }

    public Opinion consensus(Opinion... opinions) {
        if (opinions == null || opinions.length == 0) {
            throw new IllegalArgumentException("At least one opinion is required");
        }
        Opinion result = opinions[0];
        for (int i = 1; i < opinions.length; i++) {
            result = consensus(result, opinions[i]);
        }
        return result;
    }

    public double getHumanTrustLevel(Opinion opinion) {
        double b = opinion.getBelief();
        double a = opinion.getBaseRate();
        double u = opinion.getUncertainty();
        double score = b + a * u;
        if (score < 0.0) {
            return 0.0;
        }
        if (score > 1.0) {
            return 1.0;
        }
        return score;
    }
}
