package cridit.observability;

import com.fasterxml.jackson.databind.ObjectMapper;
import cridit.api.dto.request.human.PreflightRequest;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

@ApplicationScoped
public class PreflightAnswerStore {
    private final ObjectMapper objectMapper;
    private final Path answersPath;

    @Inject
    public PreflightAnswerStore(
            ObjectMapper objectMapper,
            @ConfigProperty(name = "cridit.preflight.answers.path",
                    defaultValue = "src/main/resources/cridit-preflight-answers.jsonl")
            String answersPath
    ) {
        this.objectMapper = objectMapper;
        this.answersPath = Path.of(answersPath);
    }

    public void record(PreflightRequest request) {
        if (request == null) {
            return;
        }
        append(request);
    }

    private void append(PreflightRequest request) {
        try {
            Files.createDirectories(answersPath.getParent());
        } catch (IOException ignored) {
            // ignore directory creation errors
        }
        try {
            String payload = objectMapper.writeValueAsString(request);
            Files.writeString(
                    answersPath,
                    payload + System.lineSeparator(),
                    StandardOpenOption.CREATE,
                    StandardOpenOption.WRITE,
                    StandardOpenOption.APPEND
            );
        } catch (IOException ignored) {
            // ignore logging errors
        }
    }
}
