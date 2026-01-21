package cridit.unitTest;

import cridit.humanSide.Adoption;
import cridit.humanSide.Feedback.Report;
import cridit.humanSide.HumanSideTrustEvaluation;
import cridit.humanSide.preflight.PreflightScore;
import cridit.humanSide.PhysiologicalReport;
import org.junit.jupiter.api.Assertions;
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

    double physioLikelihood = 0.75;
    double physioConfidence = 0.6;
    double physioBaseRate = 0.7;


    @Test
    public void testHumanSideTrustService_nullBehaviorInput() {
        double behaviorInputWeight = 0.7;
        double feedbackInputWeight = 0.2;
        double physioInputWeight = 0.1;
        Report feedbackReport = new Report(feedbackLikelihood, feedbackConfidence, feedbackBaseRate);
        PhysiologicalReport physioReport = new PhysiologicalReport(physioLikelihood, physioConfidence, physioBaseRate);
        assertThrows(NullPointerException.class, () -> {
            humanSideTrustEvaluation.getHumanTrustScore(behaviorInputWeight, null, feedbackInputWeight,
                    feedbackReport, physioInputWeight, physioReport);
        });
    }

    @Test
    public void testHumanScoreCalculation_BehaviorOpinionZeroWeighted() {
        double behaviorInputWeight = 0.0;
        Adoption adoption = new Adoption(adopted, rejected, behaviorBaseRate);
        double feedbackInputWeight = 0.7;
        Report feedbackReport = new Report(feedbackLikelihood, feedbackConfidence, feedbackBaseRate);
        double physioInputWeight = 0.3;
        PhysiologicalReport physioReport = new PhysiologicalReport(physioLikelihood, physioConfidence, physioBaseRate);
        double score = humanSideTrustEvaluation.getHumanTrustScore(
                behaviorInputWeight, adoption, feedbackInputWeight, feedbackReport, physioInputWeight, physioReport);
        Assertions.assertEquals(0.881, (double) Math.round(score * 1000) / 1000.0);
    }

    @Test
    public void testHumanSideTrustService_nullFeedbackInput() {
        double behaviorInputWeight = 0.7;
        Adoption adoption = new Adoption(adopted, rejected, behaviorBaseRate);
        double feedbackInputWeight = 0.2;
        Report feedbackReport = null;
        double physioInputWeight = 0.1;
        PhysiologicalReport physioReport = new PhysiologicalReport(physioLikelihood, physioConfidence, physioBaseRate);
        assertThrows(NullPointerException.class, () -> {
            humanSideTrustEvaluation.getHumanTrustScore(behaviorInputWeight, adoption, feedbackInputWeight,
                    feedbackReport, physioInputWeight, physioReport);
        });
    }

    @Test
    public void testHumanScoreCalculation_FeedbackOpinionZeroWeighted() {
        double behaviorInputWeight = 0.8;
        Adoption adoption = new Adoption(adopted, rejected, behaviorBaseRate);
        double feedbackInputWeight = 0.0;
        Report feedbackReport = new Report(feedbackLikelihood, feedbackConfidence, feedbackBaseRate);
        double physioInputWeight = 0.2;
        PhysiologicalReport physioReport = new PhysiologicalReport(physioLikelihood, physioConfidence, physioBaseRate);
        double score = humanSideTrustEvaluation.getHumanTrustScore(
                behaviorInputWeight, adoption, feedbackInputWeight, feedbackReport, physioInputWeight, physioReport);
        assertEquals(0.732, (double) Math.round(score * 1000) / 1000.0);
    }

    @Test
    public void testHumanSideTrustService_nullPhysioInput() {
        double behaviorInputWeight = 0.7;
        Adoption adoption = new Adoption(adopted, rejected, behaviorBaseRate);
        double feedbackInputWeight = 0.2;
        Report feedbackReport = new Report(feedbackLikelihood, feedbackConfidence, feedbackBaseRate);
        double physioInputWeight = 0.1;
        PhysiologicalReport physioReport = null;
        assertThrows(NullPointerException.class, () -> {
            humanSideTrustEvaluation.getHumanTrustScore(behaviorInputWeight, adoption, feedbackInputWeight,
                    feedbackReport, physioInputWeight, physioReport);
        });
    }

    @Test
    public void testHumanScoreCalculation_PhysioOpinionZeroWeighted() {
        double behaviorInputWeight = 0.7;
        double feedbackInputWeight = 0.3;
        double physioInputWeight = 0.0;
        Adoption adoption = new Adoption(adopted, rejected, behaviorBaseRate);
        Report feedbackReport = new Report(feedbackLikelihood, feedbackConfidence, feedbackBaseRate);
        PhysiologicalReport physioReport = new PhysiologicalReport(0.75, 0.6, 0.6);
        double score = humanSideTrustEvaluation.getHumanTrustScore(
                behaviorInputWeight, adoption, feedbackInputWeight, feedbackReport, physioInputWeight, physioReport
        );
        assertEquals(0.729, (double) Math.round(score * 1000) / 1000.0);
    }

    @Test
    public void testHumanScoreCalculation_EquallyWeighted() {
        double behaviorInputWeight = 1.0 / 3.0;
        Adoption adoption = new Adoption(adopted, rejected, behaviorBaseRate);
        double feedbackInputWeight = 1.0 / 3.0;
        Report feedbackReport = new Report(feedbackLikelihood, feedbackConfidence, feedbackBaseRate);
        double physioInputWeight = 1.0 / 3.0;
        PhysiologicalReport physioReport = new PhysiologicalReport(physioLikelihood, physioConfidence, physioBaseRate);
        double score = humanSideTrustEvaluation.getHumanTrustScore(
                behaviorInputWeight, adoption, feedbackInputWeight, feedbackReport, physioInputWeight, physioReport);
        assertEquals(1.011, (double) Math.round(score * 1000) / 1000.0);
    }

    @Test
    public void testHumanScoreCalculation_HierarchicalWeighted() {
        double behaviorInputWeight = 0.7;
        double feedbackInputWeight = 0.2;
        double physioInputWeight = 0.1;
        Adoption adoption = new Adoption(adopted, rejected, behaviorBaseRate);
        Report feedbackReport = new Report(feedbackLikelihood, feedbackConfidence, feedbackBaseRate);
        PhysiologicalReport physioReport = new PhysiologicalReport(physioLikelihood, physioConfidence, physioBaseRate);
        double score = humanSideTrustEvaluation.getHumanTrustScore(
                behaviorInputWeight, adoption, feedbackInputWeight, feedbackReport, physioInputWeight, physioReport);
        assertEquals(0.742, (double) Math.round(score * 1000) / 1000.0);
    }

    @Test
    public void testHumanScoreCalculation_UncertainNegativeFeedbackProxy() {
        double behaviorInputWeight = 0.7;
        double feedbackInputWeight = 0.2;
        double physioInputWeight = 0.1;
        Adoption adoption = new Adoption(adopted, rejected, behaviorBaseRate);
        PhysiologicalReport physioReport = new PhysiologicalReport(physioLikelihood, physioConfidence, physioBaseRate);
        Report uncertainNegative = new Report(0.25, 0.6, feedbackBaseRate);
        double uncertainScore = humanSideTrustEvaluation.getHumanTrustScore(
                behaviorInputWeight, adoption, feedbackInputWeight, uncertainNegative, physioInputWeight, physioReport
        );

        Report positive = new Report(0.75, 0.6, feedbackBaseRate);
        double positiveScore = humanSideTrustEvaluation.getHumanTrustScore(
                behaviorInputWeight, adoption, feedbackInputWeight, positive, physioInputWeight, physioReport );

        assertTrue(uncertainScore < positiveScore);
    }

    @Test
    public void testHumanInputWeightsMustSumToOne() {
        Adoption adoption = new Adoption(adopted, rejected, behaviorBaseRate);
        Report feedbackReport = new Report(feedbackLikelihood, feedbackConfidence, feedbackBaseRate);
        PhysiologicalReport physioReport = new PhysiologicalReport(0.75, 0.6, 0.6);
        assertThrows(IllegalArgumentException.class, () -> {
            humanSideTrustEvaluation.getHumanTrustScore(0.6, adoption, 0.2, feedbackReport, 0.1, physioReport);
        });
    }

    @Test
    public void testHumanScoreCalculation_QualitativeFeedbackAndPhysio() {
        double behaviorInputWeight = 0.6;
        double feedbackInputWeight = 0.25;
        double physioInputWeight = 0.15;
        Adoption adoption = new Adoption(adopted, rejected, behaviorBaseRate);

        Report feedbackReport = new Report(feedbackLikelihood, feedbackConfidence, feedbackBaseRate);
        PhysiologicalReport physioReport = new PhysiologicalReport(0.25, 0.9, physioBaseRate);
        double score = humanSideTrustEvaluation.getHumanTrustScore(
                behaviorInputWeight, adoption, feedbackInputWeight, feedbackReport, physioInputWeight, physioReport);

        assertTrue(score > 0.0);
        assertTrue(score < 1.0);
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
        Report feedbackReport = new Report(feedbackLikelihood, feedbackConfidence, feedbackBaseRate);
        PhysiologicalReport physioReport = new PhysiologicalReport(physioLikelihood, physioConfidence, physioBaseRate);

        double score = humanSideTrustEvaluation.getHumanTrustScoreWithPreflight(
                0.0, 0, 0, preflightResponse, 0.7, feedbackReport, 0.3, physioReport);
        assertEquals(0.881, (double) Math.round(score * 1000) / 1000.0);
    }

    @Test
    public void testHumanTrustScoreRiskPerceptionAdjustment() {
        double adjusted = humanSideTrustEvaluation.applyRiskPerception(0.75, 0.2);
        assertEquals(0.6, adjusted, 1e-9);
        assertThrows(IllegalArgumentException.class, () -> humanSideTrustEvaluation.applyRiskPerception(0.75, 1.1));
    }
}
