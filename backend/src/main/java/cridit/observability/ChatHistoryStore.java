package cridit.observability;

import com.fasterxml.jackson.databind.ObjectMapper;
import cridit.api.dto.ChatMessage;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

@ApplicationScoped
public class ChatHistoryStore {
    private final ObjectMapper objectMapper;
    private final Path historyPath;

    @Inject
    public ChatHistoryStore(
            ObjectMapper objectMapper,
            @ConfigProperty(name = "cridit.chat.history.path",
                    defaultValue = "src/main/resources/cridit-chat-history.jsonl")
            String historyPath
    ) {
        this.objectMapper = objectMapper;
        this.historyPath = Path.of(historyPath);
    }

    public void record(String scenarioKey, ChatMessage message) {
        if (message == null) {
            return;
        }
        if ("operator_prompt".equals(message.source) || "interaction_feedback".equals(message.source)){
            return;
        }
        ChatHistoryEntry entry = new ChatHistoryEntry(
                scenarioKey,
                message.sessionId,
                message.taskId,
                message.id,
                message.role,
                message.text,
                message.source,
                message.clientId,
                message.timestamp
        );
        append(entry);
    }

    private void append(ChatHistoryEntry entry) {
        try {
            Files.createDirectories(historyPath.getParent());
        } catch (IOException ignored) {
            // ignore directory creation errors
        }
        try {
            String payload = objectMapper.writeValueAsString(entry);
            Files.writeString(
                    historyPath,
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
