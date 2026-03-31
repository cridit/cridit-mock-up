package cridit.api.dto.request.workflow;

import com.fasterxml.jackson.annotation.JsonAlias;
import cridit.api.dto.request.machine.EvidenceRequest;

public record PostflightRequest(
        String sessionId,
        String participantId,
        @JsonAlias({"scenario", "domain"})
        String scenarioKey,
        String conflictRedistribution,
        @JsonAlias("evidenceRequest")
        EvidenceRequest evidenceRequest,
        @JsonAlias({"survey", "surveyInput"})
        PostflightSurveyInput surveyInput
) {
}
