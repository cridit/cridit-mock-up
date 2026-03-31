package cridit.api.dto.request.workflow;

public record CalibrationRecordRequest(
        String scenarioKey,
        String sessionId,
        String taskId,
        Double humanTrustScore,
        Double machineTrustScore,
        Double humanMachineTrustGap,
        Double threshold,
        String decision,
        String conflictRedistribution,
        String thresholdNature,
        String prompt,
        String timestamp
) {
}
