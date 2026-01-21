package cridit.api.dto.request.human;

import java.util.List;

public record FrontendFeedbackInput(
        Integer rating,
        String feedbackText,
        String emotionalState,
        String satisfaction,
        String helpfulness,
        Integer trustCueUsefulness,
        List<String> trustFactors,
        String timestamp,
        String interactionId
) {
}
