package cridit.machineSide;

import jakarta.enterprise.context.ApplicationScoped;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class MachineSideTrustEvaluation {
    private final DST dst = new DST();

    public double getMachineTrustScore(List<Evidence> evidenceSet, List<Evidence.Weight> evidenceWeights) {
        if (evidenceSet == null) {
            throw new NullPointerException("Benchmark metrics are null");
        }

        List<Evidence> adjustedEvidence = applySalienceWeights(evidenceSet, evidenceWeights);
        return dst.getMachineTrustScore(adjustedEvidence);
    }

    public double applyRiskAdjustment(double trustScore, double risk) {
        validateUnit(risk, "risk");
        return trustScore * (1.0 - risk);
    }

    private List<Evidence> applySalienceWeights(List<Evidence> evidenceSet, List<Evidence.Weight> evidenceWeights) {
        if (evidenceWeights == null || evidenceWeights.isEmpty()) {
            return evidenceSet;
        }

        Map<String, Double> weightByKey = new HashMap<>();
        double weightSum = 0.0;
        int weightCount = 0;
        for (Evidence.Weight evidenceWeight : evidenceWeights) {
            if (evidenceWeight == null) {
                continue;
            }
            validateUnit(evidenceWeight.weight(), "evidenceWeight");
            weightByKey.put(evidenceWeight.evidenceKey(), evidenceWeight.weight());
            weightSum += evidenceWeight.weight();
            weightCount++;
        }
        if (weightCount == 0) {
            return evidenceSet;
        }
        double averageWeight = weightSum / weightCount;
        if (averageWeight <= 0.0) {
            return evidenceSet;
        }

        List<Evidence> adjusted = new ArrayList<>(evidenceSet.size());
        for (Evidence evidence : evidenceSet) {
            if (evidence == null) {
                continue;
            }
            double weight = weightByKey.getOrDefault(evidence.evidenceKey(), averageWeight);
            double relativeWeight = weight / averageWeight;
            double trustworthy = relativeWeight * evidence.trustworthyMass();
            double untrustworthy = relativeWeight * evidence.untrustworthyMass();
            double uncertainty = evidence.uncertaintyMass();
            double sum = trustworthy + untrustworthy + uncertainty;
            if (sum <= 0.0) {
                adjusted.add(evidence);
                continue;
            }
            adjusted.add(new Evidence(
                    evidence.evidenceKey(),
                    trustworthy / sum,
                    untrustworthy / sum,
                    uncertainty / sum
            ));
        }
        return adjusted;
    }

    private void validateUnit(double value, String name) {
        if (value < 0.0 || value > 1.0) {
            throw new IllegalArgumentException(name + " must be between 0.0 and 1.0");
        }
    }
}
