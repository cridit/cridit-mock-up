package cridit.observability;

public record ChatHistoryEntry(
        String scenarioKey,
        String taskId,
        long messageId,
        String role,
        String text,
        String source,
        String clientId,
        long timestamp
) {
}
