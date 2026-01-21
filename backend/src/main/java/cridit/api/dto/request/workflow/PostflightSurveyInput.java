package cridit.api.dto.request.workflow;

public record PostflightSurveyInput(
        Integer overallTrust,
        Integer willingnessReuse,
        Integer relianceWithVerification,
        Integer relianceWithoutVerification,
        Integer calculationsAccurate,
        Integer assumptionsExplicit,
        Integer traceabilityShown,
        Integer consistencyMaintained,
        Integer uncertaintyCommunicated,
        Integer riskComprehensive,
        Integer professionalBoundaries,
        Integer taskUtility,
        Integer criteriaTransparent,
        Integer explanationsUnderstandable,
        Integer fairnessObserved,
        Integer toneAppropriate,
        Integer controlOfDecision,
        Boolean violationOccurred,
        Integer remediationAcknowledgedError,
        Integer remediationFixedProblem,
        Integer remediationExplanationHelpful,
        Integer remediationMoreAuditable,
        Integer remediationTrustRestored,
        Integer remediationHonestLimits,
        String behaviorAfterIssue,
        String remediationMostImportant,
        String trustChangeExplanation,
        String trustDecreaseExplanation,
        String improvementSuggestion
) {
}
