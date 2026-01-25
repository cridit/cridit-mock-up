package cridit.unitTest;

import cridit.humanSide.Adoption;
import cridit.humanSide.Feedback.Report;
import cridit.humanSide.HumanSideTrustEvaluation;
import cridit.humanSide.preflight.PreflightScore;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class HumanSideTrustEvaluationTest {
    private HumanSideTrustEvaluation humanSideTrustEvaluation;

    @BeforeEach
    void setUp() {
        humanSideTrustEvaluation = new HumanSideTrustEvaluation();
    }

    int adopted = 30;
    int rejected = 10;
    double behaviorBaseRate = 0.5;

    double feedbackLikelihood = 0.75;
    double feedbackConfidence = 0.6;
    double feedbackBaseRate = 0.7;

    @Test
    public void testHumanSideTrustService_nullBehaviorInput() {
        double behaviorInputWeight = 0.7;
        double feedbackInputWeight = 0.3;
        Report feedbackReport = new Report(feedbackLikelihood, feedbackConfidence, feedbackBaseRate);
        assertThrows(NullPointerException.class, () -> {
            humanSideTrustEvaluation.getHumanTrustScore(behaviorInputWeight, null, feedbackInputWeight,
                    feedbackReport);
        });
    }

    @Test
    public void testHumanScoreCalculation_BehaviorOpinionZeroWeighted() {
        double behaviorInputWeight = 0.0;
        Adoption adoption = new Adoption(adopted, rejected, behaviorBaseRate);
        double feedbackInputWeight = 1.0;
        Report feedbackReport = new Report(feedbackLikelihood, feedbackConfidence, feedbackBaseRate);
        double score = humanSideTrustEvaluation.getHumanTrustScore(
                behaviorInputWeight, adoption, feedbackInputWeight, feedbackReport);
        assertTrue(score > 0.0);
        assertTrue(score < 1.0);
    }

    @Test
    public void testHumanSideTrustService_nullFeedbackInput() {
        double behaviorInputWeight = 0.7;
        Adoption adoption = new Adoption(adopted, rejected, behaviorBaseRate);
        double feedbackInputWeight = 0.3;
        Report feedbackReport = null;
        assertThrows(NullPointerException.class, () -> {
            humanSideTrustEvaluation.getHumanTrustScore(behaviorInputWeight, adoption, feedbackInputWeight,
                    feedbackReport);
        });
    }

    @Test
    public void testHumanScoreCalculation_FeedbackOpinionZeroWeighted() {
        double behaviorInputWeight = 1.0;
        Adoption adoption = new Adoption(adopted, rejected, behaviorBaseRate);
        double feedbackInputWeight = 0.0;
        Report feedbackReport = new Report(feedbackLikelihood, feedbackConfidence, feedbackBaseRate);
        double score = humanSideTrustEvaluation.getHumanTrustScore(
                behaviorInputWeight, adoption, feedbackInputWeight, feedbackReport);
        assertTrue(score > 0.0);
        assertTrue(score < 1.0);
    }

    @Test
    public void testHumanScoreCalculation_UncertainNegativeFeedbackProxy() {
        double behaviorInputWeight = 0.7;
        double feedbackInputWeight = 0.3;
        Adoption adoption = new Adoption(adopted, rejected, behaviorBaseRate);
        Report uncertainNegative = new Report(0.25, 0.6, feedbackBaseRate);
        double uncertainScore = humanSideTrustEvaluation.getHumanTrustScore(
                behaviorInputWeight, adoption, feedbackInputWeight, uncertainNegative
        );

        Report positive = new Report(0.75, 0.6, feedbackBaseRate);
        double positiveScore = humanSideTrustEvaluation.getHumanTrustScore(
                behaviorInputWeight, adoption, feedbackInputWeight, positive
        );

        assertTrue(uncertainScore < positiveScore);
    }

    @Test
    public void testHumanInputWeightsMustSumToOne() {
        Adoption adoption = new Adoption(adopted, rejected, behaviorBaseRate);
        Report feedbackReport = new Report(feedbackLikelihood, feedbackConfidence, feedbackBaseRate);
        assertThrows(IllegalArgumentException.class, () -> {
            humanSideTrustEvaluation.getHumanTrustScore(0.6, adoption, 0.2, feedbackReport);
        });
    }

    @Test
    public void testHumanTrustScoreWithPreflightNoBehaviorHistoryUsesBaseRate() {
        PreflightScore.Response preflightResponse = new PreflightScore.Response(new double[]{
                PreflightScore.normalizeLikert(4, 1, 7),
                PreflightScore.normalizeLikert(5, 1, 7),
                PreflightScore.normalizeLikert(4, 1, 7),
                PreflightScore.normalizeLikert(3, 1, 7),
                PreflightScore.normalizeLikert(4, 1, 7),
                PreflightScore.normalizeLikert(3, 1, 7),
                PreflightScore.normalizeLikert(4, 1, 7),
                PreflightScore.normalizeLikert(3, 1, 7),
                PreflightScore.normalizeLikert(5, 1, 7),
                PreflightScore.normalizeLikert(4, 1, 7),
                PreflightScore.normalizeLikert(5, 1, 7)
        });
        double score = humanSideTrustEvaluation.getHumanTrustScoreWithPreflight(preflightResponse);
        assertEquals(0.5, (double) Math.round(score * 1000) / 1000.0);
    }

    @Test
    public void testHumanTrustScoreRiskPerceptionAdjustment() {
        double adjusted = humanSideTrustEvaluation.applyRiskPerception(0.75, 0.2);
        assertEquals(0.6, adjusted, 1e-9);
        assertThrows(IllegalArgumentException.class, () -> humanSideTrustEvaluation.applyRiskPerception(0.75, 1.1));
    }
}
