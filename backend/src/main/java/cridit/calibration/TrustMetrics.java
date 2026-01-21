package cridit.calibration;

import java.time.Instant;

public record TrustMetrics(
        double machineTrust,
        double humanTrust,
        double trustGap,
        double belief,
        double plausibility,
        RiskLevel riskLevel,
        Instant timestamp
) {
}
