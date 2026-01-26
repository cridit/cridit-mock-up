package cridit.machineSide.events;

import cridit.machineSide.DST;
import cridit.machineSide.Evidence;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

public class MachineTrustManager {
    private final DST dstEngine = new DST();
    private final EventToEvidenceMapper mapper = new EventToEvidenceMapper();
    private final List<Evidence> evidenceHistory = new ArrayList<>();
    private final Map<EventType, Double> factorScores = new EnumMap<>(EventType.class);
    
    public MachineTrustManager(String llmModelId, double baselineScore) {
        Evidence baselineEvidence = mapper.mapBaselineScore(baselineScore, llmModelId);
        evidenceHistory.add(baselineEvidence);
        updateFactorScores();
    }

    public void processEvent(TrustEvent event) {
        double timeDecay = calculateTimeDecay(event.timestamp());
        Evidence evidence = mapper.mapEventToEvidence(event, timeDecay);
        evidenceHistory.add(evidence);
        updateFactorScores();
    }

    public double getCurrentTrustScore() {
        return dstEngine.getMachineTrustScore(evidenceHistory);
    }

    public double[] getCurrentMasses() {
        return dstEngine.getMasses(evidenceHistory);
    }

    public double getConflictLevel() {
        return dstEngine.conflict(evidenceHistory);
    }

    public double getFactorTrustScore(EventType type) {
        List<Evidence> factorEvidence = new ArrayList<>();
        String prefix = type.key() + "_";
        for (Evidence evidence : evidenceHistory) {
            if (evidence.evidenceKey().startsWith(prefix)) {
                factorEvidence.add(evidence);
            }
        }
        if (factorEvidence.isEmpty()) {
            return 0.5;
        }
        return dstEngine.getMachineTrustScore(factorEvidence);
    }

    public Map<EventType, Double> getAllFactorScores() {
        return new EnumMap<>(factorScores);
    }

    private void updateFactorScores() {
        for (EventType type : EventType.values()) {
            factorScores.put(type, getFactorTrustScore(type));
        }
    }

    private double calculateTimeDecay(long eventTimestamp) {
        long currentTime = System.currentTimeMillis();
        long hoursSinceEvent = Math.max(0, (currentTime - eventTimestamp) / (1000 * 3600));
        return Math.pow(0.5, hoursSinceEvent / 24.0);
    }
}
