package cridit.api.dto.openai;

public record OpenAIProxyResponse(
        String responseText,
        String model
) {
}
