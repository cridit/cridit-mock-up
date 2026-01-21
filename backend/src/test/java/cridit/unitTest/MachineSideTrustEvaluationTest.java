package cridit.unitTest;

import cridit.machineSide.DST;
import cridit.machineSide.Evidence;
import cridit.machineSide.MachineSideTrustEvaluation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class MachineSideTrustEvaluationTest {
    private MachineSideTrustEvaluation machineSideTrustEvaluation;

    @BeforeEach
    void setUp() {
        machineSideTrustEvaluation = new MachineSideTrustEvaluation();
    }

    Evidence accuracy = new Evidence("accuracy", 0.9, 0.0, 0.1);
    Evidence transparency = new Evidence("transparency", 0.6, 0.1, 0.3);
    Evidence errorRate = new Evidence("errorRate", 0.0, 0.9, 0.1);

    List<Evidence> evidenceSet = new ArrayList<>(){{
        add(accuracy);
        add(transparency);
        add(errorRate);
    }};

    @Test
    public void testMachineSideTrustService_nullEvidence(){
        assertThrows(IllegalArgumentException.class, () -> {
            new DST().getMachineTrustScore(null);
        });
    }

    @Test
    public void testMachineSideTrustService(){
        double score = new DST().getMachineTrustScore(evidenceSet);
        assertEquals(0.582, (double) Math.round(score * 1000) / 1000.0);
    }

    @Test
    public void testMachineSideTrustService_riskAdjustment(){
        double score = machineSideTrustEvaluation.applyRiskAdjustment(0.75, 0.2);
        assertEquals(0.6, score, 1e-9);
        assertThrows(IllegalArgumentException.class, () -> machineSideTrustEvaluation.applyRiskAdjustment(0.75, -0.1));
    }

    @Test
    public void testMachineSideTrustService_salienceWeights(){
        List<Evidence.Weight> weights = List.of(
                new Evidence.Weight("accuracy", 0.5),
                new Evidence.Weight("transparency", 1.0)
        );

        double averageWeight = (0.5 + 1.0) / 2.0;
        List<Evidence> adjusted = List.of(
                normalizeWeighted("accuracy", 0.9, 0.0, 0.1, 0.5 / averageWeight),
                normalizeWeighted("transparency", 0.6, 0.1, 0.3, 1.0 / averageWeight),
                normalizeWeighted("errorRate", 0.0, 0.9, 0.1, 1.0)
        );

        double expected = new DST().getMachineTrustScore(adjusted);
        double score = machineSideTrustEvaluation.getMachineTrustScore(evidenceSet, weights);
        assertEquals(expected, score, 1e-9);
    }

    private static Evidence normalizeWeighted(
            String key,
            double trustworthy,
            double untrustworthy,
            double uncertainty,
            double relativeWeight
    ) {
        double weightedTrustworthy = trustworthy * relativeWeight;
        double weightedUntrustworthy = untrustworthy * relativeWeight;
        double sum = weightedTrustworthy + weightedUntrustworthy + uncertainty;
        if (sum <= 0.0) {
            return new Evidence(key, trustworthy, untrustworthy, uncertainty);
        }
        return new Evidence(
                key,
                weightedTrustworthy / sum,
                weightedUntrustworthy / sum,
                uncertainty / sum
        );
    }
}
