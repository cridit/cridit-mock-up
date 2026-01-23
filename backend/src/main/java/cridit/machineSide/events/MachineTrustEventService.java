package cridit.machineSide.events;

import cridit.api.dto.request.machine.TrustEventRequest;
import cridit.api.dto.response.machine.MachineTrustEventResponse;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@ApplicationScoped
public class MachineTrustEventService {
    private final Map<String, MachineTrustManager> sessions = new ConcurrentHashMap<>();
    private final String defaultModelId;

    public MachineTrustEventService(
            @ConfigProperty(name = "cridit.benchmark.model-id", defaultValue = "model") String defaultModelId
    ) {
        this.defaultModelId = defaultModelId;
    }

    public MachineTrustEventResponse recordEvent(TrustEventRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request must be provided");
        }
        if (request.eventType() == null) {
            throw new IllegalArgumentException("eventType must be provided");
        }
        if (request.polarity() == null) {
            throw new IllegalArgumentException("polarity must be provided");
        }
        String sessionKey = resolveSessionKey(request.sessionId(), request.scenarioKey());
        if (sessionKey == null) {
            throw new IllegalArgumentException("sessionId or scenarioKey must be provided");
        }
        MachineTrustManager manager = sessions.computeIfAbsent(
                sessionKey,
                ignored -> new MachineTrustManager(
                        resolveModelId(request.modelId()),
                        resolveBaselineScore(request.baselineScore())
                )
        );

        TrustEvent event = new TrustEvent(
                request.eventType(),
                request.polarity(),
                clamp01(request.severity()),
                resolveContext(request.context()),
                request.domain(),
                resolveTimestamp(request.timestamp())
        );
        manager.processEvent(event);

        double[] masses = manager.getCurrentMasses();
        return new MachineTrustEventResponse(
                manager.getCurrentTrustScore(),
                masses[0],
                masses[1],
                masses[2],
                manager.getConflictLevel()
        );
    }

    private String resolveSessionKey(String sessionId, String scenarioKey) {
        if (sessionId != null && !sessionId.isBlank()) {
            return sessionId;
        }
        if (scenarioKey != null && !scenarioKey.isBlank()) {
            return scenarioKey;
        }
        return null;
    }

    private String resolveModelId(String modelId) {
        if (modelId == null || modelId.isBlank()) {
            return defaultModelId;
        }
        return modelId.trim();
    }

    private double resolveBaselineScore(Double baselineScore) {
        if (baselineScore == null) {
            return 0.5;
        }
        return clamp01(baselineScore);
    }

    private ContextCriticality resolveContext(ContextCriticality context) {
        return context == null ? ContextCriticality.MEDIUM : context;
    }

    private long resolveTimestamp(Long timestamp) {
        if (timestamp == null || timestamp <= 0) {
            return System.currentTimeMillis();
        }
        return timestamp;
    }

    private double clamp01(Double value) {
        if (value == null) {
            return 0.5;
        }
        if (value < 0.0) {
            return 0.0;
        }
        if (value > 1.0) {
            return 1.0;
        }
        return value;
    }
}
