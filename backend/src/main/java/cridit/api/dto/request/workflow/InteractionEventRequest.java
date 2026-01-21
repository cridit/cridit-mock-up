package cridit.api.dto.request.workflow;

import jakarta.validation.constraints.NotNull;

public record InteractionEventRequest(
        String participantId,
        String sessionId,
        String interactionId,
        String timestamp,
        String taskId,
        String domain,
        String difficulty,
        String miscalibrationState,
        Boolean outcomeCorrect,
        @NotNull Boolean accepted,
        @NotNull Boolean rejected,
        @NotNull String feedback
) {
}
