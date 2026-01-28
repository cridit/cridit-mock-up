package cridit.observability;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.atomic.AtomicLong;

@ApplicationScoped
public class SessionIdService {
    private final AtomicLong counter;

    @Inject
    public SessionIdService(
            ObjectMapper objectMapper,
            @ConfigProperty(name = "cridit.postflight.answers.path",
                    defaultValue = "src/main/resources/cridit-postflight-answers.jsonl")
            String postflightAnswersPath
    ) {
        long maxFromDisk = readMaxSessionId(objectMapper, Path.of(postflightAnswersPath));
        this.counter = new AtomicLong(Math.max(0, maxFromDisk));
    }

    public String nextSessionId() {
        return String.valueOf(counter.incrementAndGet());
    }

    private long readMaxSessionId(ObjectMapper objectMapper, Path path) {
        if (path == null || Files.notExists(path)) {
            return 0;
        }
        long max = 0;
        try (BufferedReader reader = Files.newBufferedReader(path)) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) {
                    continue;
                }
                try {
                    JsonNode node = objectMapper.readTree(line);
                    JsonNode sessionIdNode = node == null ? null : node.get("sessionId");
                    if (sessionIdNode == null || sessionIdNode.isNull()) {
                        continue;
                    }
                    String raw = sessionIdNode.asText("");
                    if (raw == null || raw.isBlank()) {
                        continue;
                    }
                    long value = Long.parseLong(raw.trim());
                    if (value > max) {
                        max = value;
                    }
                } catch (Exception ignored) {
                    // ignore malformed line/sessionId
                }
            }
        } catch (IOException ignored) {
            return 0;
        }
        return max;
    }
}

