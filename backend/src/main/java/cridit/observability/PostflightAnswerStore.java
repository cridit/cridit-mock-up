package cridit.observability;

import com.fasterxml.jackson.databind.ObjectMapper;
import cridit.api.dto.request.workflow.PostflightRequest;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

@ApplicationScoped
public class PostflightAnswerStore {
    private final ObjectMapper objectMapper;
    private final Path answersPath;

    @Inject
    public PostflightAnswerStore(
            ObjectMapper objectMapper,
            @ConfigProperty(name = "cridit.postflight.answers.path",
                    defaultValue = "target/cridit-postflight-answers.jsonl")
            String answersPath
    ) {
        this.objectMapper = objectMapper;
        this.answersPath = Path.of(answersPath);
    }

    public void record(PostflightRequest request) {
        if (request == null) {
            return;
        }
        append(request);
    }

    private void append(PostflightRequest request) {
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
