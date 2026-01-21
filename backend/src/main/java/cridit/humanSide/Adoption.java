package cridit.humanSide;

public class Adoption {
    private final int adopted;
    private final int rejected;
    private final double baseRate;

    public Adoption(int adopted, int rejected, double baseRate) {
        this.adopted = adopted;
        this.rejected = rejected;
        this.baseRate = baseRate;
    }

    public int getAdopted() {
        return adopted;
    }

    public int getRejected() {
        return rejected;
    }

    public double getBaseRate() {
        return baseRate;
    }
}