package cridit.machineSide.events;

public record TrustEvent(
        EventType eventType,
        EventPolarity polarity,
        double severity,
        ContextCriticality context,
        String domain,
        long timestamp
) {
}
