package cridit.observability;

public record CalibrationHistoryEntry(
        String scenarioKey,
        String taskId,
        String timestamp,
        double humanTrustScore,
        double machineTrustScore,
        double humanMachineTrustGap,
        double threshold,
        String decision,
        String conflictRedistribution,
        String thresholdNature
) {
}
