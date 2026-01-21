package cridit.calibration;

import java.util.ArrayList;
import java.util.List;

public class Threshold {
    private double statisticThreshold;
    private double initThreshold;
    private double currentThreshold;
    private double lastError;
    private double lastRisk;
    private double lastRiskPerception;
    private double lambda;
    private final int windowSize;
    private final List<Double> historicalGaps = new ArrayList<>();
    private final List<Double> historicalRiskValues = new ArrayList<>();

    public Threshold(double statisticThreshold,  double initThreshold, double lambda) {
        this.statisticThreshold = statisticThreshold;
        this.initThreshold = initThreshold;
        this.currentThreshold = initThreshold;
        this.lambda = lambda;
        this.windowSize = 10;
    }

    public Threshold(double statisticThreshold, double initThreshold, double lambda, int windowSize) {
        this.statisticThreshold = statisticThreshold;
        this.initThreshold = initThreshold;
        this.currentThreshold = initThreshold;
        this.lambda = lambda;
        this.windowSize = windowSize;
    }

    public void setStatisticThreshold(double statisticThreshold){
        this.statisticThreshold = statisticThreshold;
    }

    public void setInitThreshold(double initThreshold){
        this.initThreshold = initThreshold;
        this.currentThreshold = initThreshold;
    }

    public void setInitialThreshold(double initThreshold) {
        setInitThreshold(initThreshold);
    }

    public void setLambda(double lambda){
        this.lambda = lambda;
    }

    public void setLastError(double lastError){
        this.lastError = lastError;
    }

    public void setLastRisk(double lastRisk){
        this.lastRisk = lastRisk;
    }

    public double getGap(double humanTrustScore, double machineTrustScore) {
        return humanTrustScore - machineTrustScore;
    }

    public double getStatisticThreshold() {
        return statisticThreshold;
    }

    public double getDynamicThreshold(double currentError, double currentRisk, Double currentRiskPerception,
                                      String previousMiscalibrationState, int samples) {
        if(samples==0){
            lastError = currentError;
            lastRisk = currentRisk;
            lastRiskPerception = currentRiskPerception == null ? currentRisk : currentRiskPerception;
            return initThreshold;
        }

        double deltaE = currentError - lastError;
        double deltaR = currentRisk - lastRisk;
        double resolvedRiskPerception = currentRiskPerception == null ? currentRisk : currentRiskPerception;
        double deltaP = resolvedRiskPerception - lastRiskPerception;
        lastError = currentError;
        lastRisk = currentRisk;
        lastRiskPerception = resolvedRiskPerception;
        double miscalibrationFactor = miscalibrationMultiplier(previousMiscalibrationState);
        currentThreshold = currentThreshold * Math.exp(-lambda * miscalibrationFactor * (deltaE + deltaR + deltaP));
        return currentThreshold;
    }

    public double calculateDynamicThreshold(double negativeEvidence,
                                            double riskChange,
                                            RiskLevel riskLevel) {
        double deltaTechNeg = Math.max(negativeEvidence, calculateDeltaTechNegative());
        double deltaRisk = calculateDeltaRisk(riskChange, riskLevel);
        currentThreshold = currentThreshold * Math.exp(-lambda * (deltaTechNeg + deltaRisk));
        return clamp(currentThreshold, 0.05, 0.5);
    }

    public void updateHistory(double trustGap, RiskLevel riskLevel) {
        historicalGaps.add(trustGap);
        if (historicalGaps.size() > windowSize) {
            historicalGaps.remove(0);
        }
        historicalRiskValues.add(riskLevelToValue(riskLevel));
        if (historicalRiskValues.size() > windowSize) {
            historicalRiskValues.remove(0);
        }
    }

    private double miscalibrationMultiplier(String previousMiscalibrationState) {
        if (previousMiscalibrationState == null) {
            return 1.0;
        }
        String normalized = previousMiscalibrationState.trim().toUpperCase();
        if ("OVER".equals(normalized) || "UNDER".equals(normalized)) {
            return 1.2;
        }
        return 1.0;
    }

    private double calculateDeltaTechNegative() {
        if (historicalGaps.isEmpty()) {
            return 0.0;
        }
        double sum = 0.0;
        int count = 0;
        for (double gap : historicalGaps) {
            if (gap < -0.1) {
                sum += Math.abs(gap);
                count++;
            }
        }
        return count > 0 ? sum / count : 0.0;
    }

    private double calculateDeltaRisk(double riskChange, RiskLevel riskLevel) {
        if (historicalRiskValues.isEmpty()) {
            return riskLevelToValue(riskLevel);
        }
        return Math.max(riskChange, 0.0);
    }

    private double riskLevelToValue(RiskLevel level) {
        return switch (level) {
            case LOW -> 0.1;
            case MEDIUM -> 0.3;
            case HIGH -> 0.6;
            case CRITICAL -> 1.0;
        };
    }

    private double clamp(double value, double min, double max) {
        if (value < min) {
            return min;
        }
        if (value > max) {
            return max;
        }
        return value;
    }
}
