package cridit.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import cridit.api.dto.openai.OpenAIProxyRequest;
import cridit.api.dto.openai.OpenAIProxyResponse;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.logging.Logger;

@Path("/openai")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class OpenAIProxyController {
    private static final String DEFAULT_MODEL = "gpt-4o-mini";
    private static final URI OPENAI_URI = URI.create("https://api.openai.com/v1/chat/completions");
    private static final Logger LOGGER = Logger.getLogger(OpenAIProxyController.class.getName());

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final Optional<String> apiKey;

    @Inject
    public OpenAIProxyController(
        ObjectMapper objectMapper,
        @ConfigProperty(name = "openai.api.key") Optional<String> apiKey
    ) {
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
    }

    @POST
    @Path("/respond")
    public OpenAIProxyResponse respond(OpenAIProxyRequest request) {
        if (request == null || request.participantMessage() == null || request.participantMessage().isBlank()) {
            throw buildError(Response.Status.BAD_REQUEST, "participantMessage is required");
        }
        String resolvedKey = apiKey.orElse("");
        String source = "config";
        if (resolvedKey.isBlank()) {
            resolvedKey = System.getenv("OPENAI_API_KEY");
            source = "env";
        }
        if (resolvedKey == null) {
            resolvedKey = "";
        }
        LOGGER.info("OpenAI key source=" + source + ", present=" + !resolvedKey.isBlank());
        if (resolvedKey.isBlank()) {
            throw buildError(Response.Status.BAD_REQUEST, "OPENAI_API_KEY is not configured");
        }

        String model = request.model() == null || request.model().isBlank()
                ? DEFAULT_MODEL
                : request.model().trim();

        List<Map<String, String>> messages = new ArrayList<>();
        if (request.operatorPrompt() != null && !request.operatorPrompt().isBlank()) {
            messages.add(Map.of(
                    "role", "system",
                    "content", request.operatorPrompt().trim()
            ));
        }
        messages.add(Map.of(
                "role", "user",
                "content", request.participantMessage().trim()
        ));

        Map<String, Object> payload = new HashMap<>();
        payload.put("model", model);
        payload.put("messages", messages);
        payload.put("temperature", 0.2);

        String body;
        try {
            body = objectMapper.writeValueAsString(payload);
        } catch (IOException e) {
            throw buildError(Response.Status.INTERNAL_SERVER_ERROR, "Failed to serialize request");
        }

        HttpRequest httpRequest = HttpRequest.newBuilder(OPENAI_URI)
                .header("Authorization", "Bearer " + resolvedKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        String responseBody;
        try {
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                String message = "OpenAI error: " + response.statusCode() + " " + response.body();
                LOGGER.warning(message);
                throw buildError(Response.Status.BAD_GATEWAY, message);
            }
            responseBody = response.body();
        } catch (IOException e) {
            LOGGER.warning("OpenAI request failed: " + e.getMessage());
            throw buildError(Response.Status.BAD_GATEWAY, "OpenAI request failed: " + e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            LOGGER.warning("OpenAI request interrupted");
            throw buildError(Response.Status.BAD_GATEWAY, "OpenAI request interrupted");
        }

        String responseText = extractResponseText(responseBody);
        if (responseText == null || responseText.isBlank()) {
            throw buildError(Response.Status.BAD_GATEWAY, "OpenAI response was empty");
        }

        return new OpenAIProxyResponse(responseText, model);
    }

    @SuppressWarnings("unchecked")
    private String extractResponseText(String responseBody) {
        try {
            Map<String, Object> payload = objectMapper.readValue(responseBody, Map.class);
            Object choices = payload.get("choices");
            if (!(choices instanceof List<?> choicesList) || choicesList.isEmpty()) {
                return null;
            }
            Object first = choicesList.get(0);
            if (!(first instanceof Map<?, ?> choiceMap)) {
                return null;
            }
            Object message = choiceMap.get("message");
            if (!(message instanceof Map<?, ?> messageMap)) {
                return null;
            }
            Object content = messageMap.get("content");
            return content == null ? null : content.toString();
        } catch (IOException e) {
            return null;
        }
    }

    private WebApplicationException buildError(Response.Status status, String message) {
        return new WebApplicationException(
                Response.status(status)
                        .type(MediaType.APPLICATION_JSON)
                        .entity(Map.of("error", message))
                        .build()
        );
    }
}
