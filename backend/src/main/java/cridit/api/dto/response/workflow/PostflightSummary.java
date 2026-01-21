package cridit.api.dto.response.workflow;

import cridit.machineSide.Evidence;

import java.util.List;

public record PostflightSummary(
        String sessionId,
        String participantId,
        double machineTrustScore,
        double humanTrustScore,
        List<Evidence.Weight> updatedWeights,
        List<String> trustFactors,
        String timestamp,
        String calibrationDecision,
        Double calibrationGap,
        Double calibrationMachineScore,
        Double calibrationHumanScore
) {
}
