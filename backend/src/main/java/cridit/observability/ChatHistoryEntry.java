package cridit.observability;

public record ChatHistoryEntry(
        String scenarioKey,
        String taskId,
        long messageId,
        String role,
        String text,
        String source,
        String clientId,
        Integer rating,
        String selfConfidence,
        String satisfaction,
        String helpfulness,
        String trustCueUsefulness,
        String interactionId,
        long timestamp
) {
}
