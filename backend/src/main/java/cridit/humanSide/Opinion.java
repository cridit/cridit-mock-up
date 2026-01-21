package cridit.humanSide;

public class Opinion {
    private final double belief;
    private final double disbelief;
    private final double uncertainty;
    private final double baseRate;

    protected Opinion(double belief, double disbelief, double uncertainty, double baseRate) {
        this.belief = belief;
        this.disbelief = disbelief;
        this.uncertainty = uncertainty;
        this.baseRate = baseRate;
    }

    protected double getBelief() {
        return belief;
    }

    protected double getDisbelief() {
        return disbelief;
    }

    protected double getUncertainty() {
        return uncertainty;
    }

    protected double getBaseRate() {
        return baseRate;
    }
}
