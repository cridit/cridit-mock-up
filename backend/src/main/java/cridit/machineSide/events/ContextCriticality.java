package cridit.machineSide.events;

public enum ContextCriticality {
    LOW(0.3),
    MEDIUM(0.6),
    HIGH(1.0),
    CRITICAL(1.5);

    private final double multiplier;

    ContextCriticality(double multiplier) {
        this.multiplier = multiplier;
    }

    public double multiplier() {
        return multiplier;
    }
}
