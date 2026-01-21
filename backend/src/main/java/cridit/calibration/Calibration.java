package cridit.calibration;

import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

@ApplicationScoped
public class Calibration {
    private final Threshold threshold = new Threshold(0.10, 0.10, 0.20);

    private final AtomicReference<Double> lastHuman = new AtomicReference<>(null);
    private final AtomicReference<Double> lastMachine = new AtomicReference<>(null);
    private final AtomicInteger lastSampleNumber = new AtomicInteger(0);
    private final ConcurrentHashMap<String, SessionState> sessionStates = new ConcurrentHashMap<>();

    public void updateLastHuman(double score) {
        lastHuman.set(score);
    }

    public void updateLastMachine(double score) {
        lastMachine.set(score);
    }

    public Optional<Double> getLastHuman() {
        return Optional.ofNullable(lastHuman.get());
    }

    public Optional<Double> getLastMachine() {
        return Optional.ofNullable(lastMachine.get());
    }

    public void setInitialThreshold(double thresholdValue) {
        threshold.setInitThreshold(thresholdValue);
    }

    public void resetSession() {
        lastHuman.set(null);
        lastMachine.set(null);
        lastSampleNumber.set(0);
    }

    public void resetSession(String sessionId) {
        if (sessionId == null) {
            resetSession();
            return;
        }
        sessionStates.remove(sessionId);
    }

    public void setInitialThreshold(String sessionId, double thresholdValue) {
        if (sessionId == null) {
            setInitialThreshold(thresholdValue);
            return;
        }
        sessionStates.computeIfAbsent(sessionId, key -> new SessionState(thresholdValue))
                .thresholdManager
                .setInitialThreshold(thresholdValue);
    }

    public double resolveRiskChange(String sessionId, double currentRiskValue) {
        if (sessionId == null) {
            return 0.0;
        }
        SessionState state = sessionStates.computeIfAbsent(sessionId,
                key -> new SessionState(threshold.getStatisticThreshold()));
        return state.updateRiskValue(currentRiskValue);
    }

    public CalibrationDecision decide(String sessionId,
                                      TrustMetrics metrics,
                                      double negativeEvidence,
                                      double riskChange,
                                      String thresholdNature) {
        String resolvedSessionId = sessionId == null ? "default" : sessionId;
        SessionState state = sessionStates.computeIfAbsent(resolvedSessionId,
                key -> new SessionState(threshold.getStatisticThreshold()));
        double thresholdValue = "statistic".equalsIgnoreCase(thresholdNature == null ? "statistic" : thresholdNature)
                ? threshold.getStatisticThreshold()
                : state.thresholdManager.calculateDynamicThreshold(negativeEvidence, riskChange, metrics.riskLevel());

        state.thresholdManager.updateHistory(metrics.trustGap(), metrics.riskLevel());

        double gap = metrics.trustGap();
        double absGap = Math.abs(gap);
        CalibrationAction action;
        String reason;

        if (absGap <= thresholdValue) {
            action = CalibrationAction.MAINTAIN;
            reason = String.format("Gap %.3f within threshold %.3f", absGap, thresholdValue);
            state.consecutiveMiscalibrations = 0;
        } else if (gap > thresholdValue) {
            action = CalibrationAction.DECREASE_TRUST;
            reason = String.format("Over-trust: Δ=%.3f > τ=%.3f", gap, thresholdValue);
            state.consecutiveMiscalibrations++;
        } else {
            action = CalibrationAction.INCREASE_TRUST;
            reason = String.format("Under-trust: Δ=%.3f < -τ=%.3f", gap, -thresholdValue);
            state.consecutiveMiscalibrations++;
        }

        if (state.consecutiveMiscalibrations >= state.maxConsecutiveMiscalibrations) {
            action = CalibrationAction.ADAPT_SYSTEM;
            reason = reason + " | Escalated after consecutive miscalibrations";
            state.consecutiveMiscalibrations = 0;
        }

        double confidence = calculateDecisionConfidence(metrics);
        return new CalibrationDecision(
                action,
                reason,
                confidence,
                thresholdValue,
                metrics,
                Instant.now()
        );
    }

    public TrustCues calibration(double machineTrustScore, double humanTrustScore, double error, double risk,
                                 Double riskPerception, String previousMiscalibrationState, String thresholdNature) {
        double gap = threshold.getGap(humanTrustScore, machineTrustScore);
        int samples = lastSampleNumber.get();
        double thresholdValue = thresholdNature.equals("statistic") ? threshold.getStatisticThreshold()
                : threshold.getDynamicThreshold(error, risk, riskPerception, previousMiscalibrationState, samples);
        lastSampleNumber.incrementAndGet();
        String decision = "CONSISTENT";
        if(gap > thresholdValue) {
            decision = "DECREASE HUMAN TRUST";
        } else if (gap < -1 *  thresholdValue) {
            decision = "INCREASE HUMAN TRUST";
        }

        return new TrustCues(
                error,
                risk,
                machineTrustScore,
                humanTrustScore,
                gap,
                thresholdValue,
                decision,
                Instant.now(),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );
    }

    private double calculateDecisionConfidence(TrustMetrics metrics) {
        double baseConfidence = 0.7;
        double intervalWidth = metrics.plausibility() - metrics.belief();
        baseConfidence -= intervalWidth * 0.3;

        switch (metrics.riskLevel()) {
            case HIGH, CRITICAL -> baseConfidence *= 1.2;
            case LOW -> baseConfidence *= 0.8;
            default -> baseConfidence *= 1.0;
        }
        return Math.max(0.1, Math.min(1.0, baseConfidence));
    }

    private static class SessionState {
        private final Threshold thresholdManager;
        private int consecutiveMiscalibrations = 0;
        private final int maxConsecutiveMiscalibrations = 3;
        private Double lastRiskValue;

        private SessionState(double initialThreshold) {
            this.thresholdManager = new Threshold(initialThreshold, initialThreshold, 0.5, 10);
        }

        private double updateRiskValue(double currentRiskValue) {
            if (lastRiskValue == null) {
                lastRiskValue = currentRiskValue;
                return 0.0;
            }
            double change = Math.abs(currentRiskValue - lastRiskValue);
            lastRiskValue = currentRiskValue;
            return change;
        }
    }
}
