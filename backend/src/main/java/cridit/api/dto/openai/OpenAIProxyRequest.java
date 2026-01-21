package cridit.api.dto.openai;

public record OpenAIProxyRequest(
        String scenarioKey,
        String taskId,
        String participantMessage,
        String operatorPrompt,
        String model
) {
}
