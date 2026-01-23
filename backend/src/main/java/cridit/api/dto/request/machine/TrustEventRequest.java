package cridit.api.dto.request.machine;

import cridit.machineSide.events.ContextCriticality;
import cridit.machineSide.events.EventPolarity;
import cridit.machineSide.events.EventType;

public record TrustEventRequest(
        String sessionId,
        String scenarioKey,
        String domain,
        EventType eventType,
        EventPolarity polarity,
        Double severity,
        ContextCriticality context,
        Double baselineScore,
        String modelId,
        Long timestamp
) {
}
