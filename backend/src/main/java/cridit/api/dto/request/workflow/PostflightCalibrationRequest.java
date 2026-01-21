package cridit.api.dto.request.workflow;

public record PostflightCalibrationRequest(
        String sessionId,
        String calibrationDecision,
        Double calibrationGap,
        Double calibrationMachineScore,
        Double calibrationHumanScore
) {
}
