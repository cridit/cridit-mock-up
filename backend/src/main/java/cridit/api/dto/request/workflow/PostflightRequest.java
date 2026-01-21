package cridit.api.dto.request.workflow;

import com.fasterxml.jackson.annotation.JsonAlias;
import cridit.api.dto.request.human.FrontendFeedbackInput;
import cridit.api.dto.request.machine.EvidenceRequest;

public record PostflightRequest(
        String sessionId,
        String participantId,
        String conflictRedistribution,
        @JsonAlias("benchmarkMetricRequest")
        EvidenceRequest evidenceRequest,
        FrontendFeedbackInput feedbackInput,
        @JsonAlias({"survey", "surveyInput"})
        PostflightSurveyInput surveyInput
) {
}
