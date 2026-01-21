package cridit.observability;

import com.fasterxml.jackson.databind.ObjectMapper;
import cridit.calibration.TrustCues;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@ApplicationScoped
public class CalibrationHistoryStore {
    private final ObjectMapper objectMapper;
    private final Path historyPath;
    private final Map<String, CalibrationHistoryEntry> latestByScenario = new ConcurrentHashMap<>();

    @Inject
    public CalibrationHistoryStore(
            ObjectMapper objectMapper,
            @ConfigProperty(name = "cridit.calibration.history.path",
                    defaultValue = "target/cridit-calibration-history.jsonl")
            String historyPath
    ) {
        this.objectMapper = objectMapper;
        this.historyPath = Path.of(historyPath);
    }

    public void record(String scenarioKey,
                       String taskId,
                       TrustCues trustCues,
                       String conflictRedistribution,
                       String thresholdNature,
                       String timestamp) {
        String resolvedTimestamp = timestamp == null || timestamp.isBlank()
                ? Instant.now().toString()
                : timestamp;
        CalibrationHistoryEntry entry = new CalibrationHistoryEntry(
                scenarioKey,
                taskId,
                resolvedTimestamp,
                trustCues.humanTrustScore(),
                trustCues.machineTrustScore(),
                trustCues.humanMachineTrustGap(),
                trustCues.threshold(),
                trustCues.decision(),
                conflictRedistribution,
                thresholdNature
        );
        latestByScenario.put(scenarioKey, entry);
        append(entry);
    }

    public void recordManual(String scenarioKey,
                             String taskId,
                             Double humanTrustScore,
                             Double machineTrustScore,
                             Double humanMachineTrustGap,
                             Double threshold,
                             String decision,
                             String conflictRedistribution,
                             String thresholdNature,
                             String timestamp) {
        String resolvedTimestamp = timestamp == null || timestamp.isBlank()
                ? Instant.now().toString()
                : timestamp;
        CalibrationHistoryEntry entry = new CalibrationHistoryEntry(
                scenarioKey,
                taskId,
                resolvedTimestamp,
                humanTrustScore == null ? 0.0 : humanTrustScore,
                machineTrustScore == null ? 0.0 : machineTrustScore,
                humanMachineTrustGap == null ? 0.0 : humanMachineTrustGap,
                threshold == null ? 0.0 : threshold,
                decision == null ? "NO ACTION" : decision,
                conflictRedistribution == null ? "manual" : conflictRedistribution,
                thresholdNature == null ? "manual" : thresholdNature
        );
        latestByScenario.put(scenarioKey, entry);
        append(entry);
    }

    public CalibrationHistoryEntry latest(String scenarioKey) {
        if (scenarioKey == null || scenarioKey.isBlank()) {
            return null;
        }
        CalibrationHistoryEntry cached = latestByScenario.get(scenarioKey);
        if (cached != null && shouldInvalidateCache()) {
            latestByScenario.remove(scenarioKey);
            cached = null;
        }
        if (cached != null) {
            return cached;
        }
        CalibrationHistoryEntry fromDisk = readLatestFromDisk(scenarioKey);
        if (fromDisk != null) {
            latestByScenario.put(scenarioKey, fromDisk);
        }
        return fromDisk;
    }

    private boolean shouldInvalidateCache() {
        try {
            if (Files.notExists(historyPath)) {
                return true;
            }
            return Files.size(historyPath) == 0;
        } catch (IOException ignored) {
            return false;
        }
    }

    private void append(CalibrationHistoryEntry entry) {
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

    private CalibrationHistoryEntry readLatestFromDisk(String scenarioKey) {
        if (!Files.exists(historyPath)) {
            return null;
        }
        CalibrationHistoryEntry latest = null;
        try (BufferedReader reader = Files.newBufferedReader(historyPath)) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) {
                    continue;
                }
                CalibrationHistoryEntry entry = objectMapper.readValue(line, CalibrationHistoryEntry.class);
                if (scenarioKey.equals(entry.scenarioKey())) {
                    latest = entry;
                }
            }
        } catch (IOException ignored) {
            return null;
        }
        return latest;
    }
}
