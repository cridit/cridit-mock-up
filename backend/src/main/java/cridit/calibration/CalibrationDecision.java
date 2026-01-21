package cridit.calibration;

import java.time.Instant;

public record CalibrationDecision(
        CalibrationAction action,
        String reason,
        double confidence,
        double thresholdUsed,
        TrustMetrics metrics,
        Instant decisionTime
) {
}
