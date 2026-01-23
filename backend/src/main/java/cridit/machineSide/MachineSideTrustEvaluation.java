package cridit.machineSide;

import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class MachineSideTrustEvaluation {
    private final DST dst = new DST();

    public double getMachineTrustScore(List<Evidence> evidenceSet) {
        if (evidenceSet == null) {
            throw new NullPointerException("Benchmark metrics are null");
        }
        return dst.getMachineTrustScore(evidenceSet);
    }

    public double applyRiskAdjustment(double trustScore, double risk) {
        validateUnit(risk, "risk");
        return trustScore * (1.0 - risk);
    }

    private void validateUnit(double value, String name) {
        if (value < 0.0 || value > 1.0) {
            throw new IllegalArgumentException(name + " must be between 0.0 and 1.0");
        }
    }
}
