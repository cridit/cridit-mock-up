package cridit.calibration;

import java.time.Instant;

public record TrustCues (
        double error,
        double risk,
        double machineTrustScore,
        double humanTrustScore,
        double humanMachineTrustGap,
        double threshold,
        String decision, // calibration actions
        Instant timestamp,
        String cueVisibility,
        String cueReliability,
        String adaptationMode,
        Boolean adaptationApplied,
        Double adaptationAdjustment,
        Boolean actionShowCue,
        String actionCueMode,
        String actionReminderLevel,
        Double actionConfigAdjustment,
        Double cueAdoptionScore,
        String cueAdoptionMode,
        Double belief,
        Double plausibility,
        String riskLevel,
        Double decisionConfidence,
        String systemAdaptationSummary){
}
