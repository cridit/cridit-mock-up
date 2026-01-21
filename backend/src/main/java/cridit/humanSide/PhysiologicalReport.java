package cridit.humanSide;

public class PhysiologicalReport {
    private final double likelihood;
    private final double confidence;
    private final double baseRate;

    public PhysiologicalReport(double likelihood, double confidence, double baseRate) {
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
