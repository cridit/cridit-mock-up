package cridit.api.dto.request.human;

import cridit.humanSide.preflight.PreflightScore;
import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record PreflightRequest(
        @JsonAlias({"scenario", "domain"}) String scenarioKey,
        @Min(1) @Max(7) Integer intentionToTrust1,
        @Min(1) @Max(7) Integer intentionToTrust2,
        @Min(1) @Max(7) Integer intentionToTrust3,
        @Min(1) @Max(7) Integer privacyConcern1,
        @Min(1) @Max(7) Integer privacyConcern2,
        @Min(1) @Max(7) Integer privacyConcern3,
        @Min(1) @Max(7) Integer privacyConcern4,
        @Min(1) @Max(7) Integer privacyConcern5,
        @Min(1) @Max(7) Integer riskAversion1,
        @Min(1) @Max(7) Integer riskAversion2,
        @Min(1) @Max(7) Integer riskAversion3,
        @Min(1) @Max(7) Integer hrFamiliarity,
        @Min(1) @Max(7) Integer hrRecruitmentFrequency,
        @Min(1) @Max(7) Integer hrCriteriaTransparencyImportance,
        @Min(1) @Max(7) Integer hrExplainabilityImportance,
        @Min(1) @Max(7) Integer hrFairnessImportance,
        @Min(1) @Max(7) Integer hrClassificationAccuracyImportance,
        @Min(1) @Max(7) Integer hrConsistencyImportance,
        @Min(1) @Max(7) Integer hrFeedbackQualityImportance,
        @Min(1) @Max(7) Integer hrToneProfessionalismImportance,
        @Min(1) @Max(7) Integer hrHumanOversightImportance,
        @Min(1) @Max(7) Integer hrEfficiencyImportance,
        @Min(1) @Max(7) Integer hrCorrectionAbilityImportance,
        String hrDistrustTriggers,
        String hrNeverTrustTasks,
        @Min(1) @Max(7) Integer financeFamiliarity,
        @Min(1) @Max(7) Integer financeUsageFrequency,
        @Min(1) @Max(7) Integer calculationAccuracyImportance,
        @Min(1) @Max(7) Integer consistencyImportance,
        @Min(1) @Max(7) Integer assumptionTransparencyImportance,
        @Min(1) @Max(7) Integer traceabilityImportance,
        @Min(1) @Max(7) Integer auditabilityImportance,
        @Min(1) @Max(7) Integer sourceGroundingImportance,
        @Min(1) @Max(7) Integer uncertaintyCalibrationImportance,
        @Min(1) @Max(7) Integer riskCompletenessImportance,
        @Min(1) @Max(7) Integer professionalBoundariesImportance,
        @Min(1) @Max(7) Integer legalReliabilityImportance,
        @Min(1) @Max(7) Integer legalCitationAccuracyImportance,
        @Min(1) @Max(7) Integer legalTransparencyImportance,
        @Min(1) @Max(7) Integer legalBiasFairnessImportance,
        @Min(1) @Max(7) Integer legalPrivacySecurityImportance,
        @Min(1) @Max(7) Integer legalHumanOversightImportance,
        @Min(1) @Max(7) Integer legalAccountabilityImportance,
        @Min(1) @Max(7) Integer legalUncertaintyCommunicationImportance,
        String distrustTriggers,
        String trustAccelerators
) {
    public PreflightScore.Response toResponse() {
        if (isFinancial()) {
            return new PreflightScore.Response(new double[]{
                    PreflightScore.normalizeLikert(coalesce(intentionToTrust1, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(intentionToTrust2, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(intentionToTrust3, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(privacyConcern1, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(privacyConcern2, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(privacyConcern3, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(privacyConcern4, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(privacyConcern5, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(riskAversion1, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(riskAversion2, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(riskAversion3, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(financeFamiliarity, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(financeUsageFrequency, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(calculationAccuracyImportance, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(consistencyImportance, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(assumptionTransparencyImportance, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(traceabilityImportance, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(auditabilityImportance, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(sourceGroundingImportance, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(uncertaintyCalibrationImportance, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(riskCompletenessImportance, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(professionalBoundariesImportance, 4), 1, 7)
            });
        }
        if (isHiring()) {
            return new PreflightScore.Response(new double[]{
                    PreflightScore.normalizeLikert(coalesce(intentionToTrust1, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(intentionToTrust2, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(intentionToTrust3, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(privacyConcern1, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(privacyConcern2, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(privacyConcern3, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(privacyConcern4, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(privacyConcern5, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(riskAversion1, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(riskAversion2, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(riskAversion3, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(hrFamiliarity, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(hrRecruitmentFrequency, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(hrCriteriaTransparencyImportance, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(hrExplainabilityImportance, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(hrFairnessImportance, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(hrClassificationAccuracyImportance, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(hrConsistencyImportance, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(hrFeedbackQualityImportance, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(hrToneProfessionalismImportance, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(hrHumanOversightImportance, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(hrEfficiencyImportance, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(hrCorrectionAbilityImportance, 4), 1, 7)
            });
        }
        if (isLegal()) {
            return new PreflightScore.Response(new double[]{
                    PreflightScore.normalizeLikert(coalesce(intentionToTrust1, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(intentionToTrust2, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(intentionToTrust3, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(privacyConcern1, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(privacyConcern2, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(privacyConcern3, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(privacyConcern4, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(privacyConcern5, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(riskAversion1, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(riskAversion2, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(riskAversion3, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(legalReliabilityImportance, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(legalCitationAccuracyImportance, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(legalTransparencyImportance, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(legalBiasFairnessImportance, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(legalPrivacySecurityImportance, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(legalHumanOversightImportance, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(legalAccountabilityImportance, 4), 1, 7),
                    PreflightScore.normalizeLikert(coalesce(legalUncertaintyCommunicationImportance, 4), 1, 7)
            });
        }
        return new PreflightScore.Response(new double[]{
                PreflightScore.normalizeLikert(coalesce(intentionToTrust1, 4), 1, 7),
                PreflightScore.normalizeLikert(coalesce(intentionToTrust2, 4), 1, 7),
                PreflightScore.normalizeLikert(coalesce(intentionToTrust3, 4), 1, 7),
                PreflightScore.normalizeLikert(coalesce(privacyConcern1, 4), 1, 7),
                PreflightScore.normalizeLikert(coalesce(privacyConcern2, 4), 1, 7),
                PreflightScore.normalizeLikert(coalesce(privacyConcern3, 4), 1, 7),
                PreflightScore.normalizeLikert(coalesce(privacyConcern4, 4), 1, 7),
                PreflightScore.normalizeLikert(coalesce(privacyConcern5, 4), 1, 7),
                PreflightScore.normalizeLikert(coalesce(riskAversion1, 4), 1, 7),
                PreflightScore.normalizeLikert(coalesce(riskAversion2, 4), 1, 7),
                PreflightScore.normalizeLikert(coalesce(riskAversion3, 4), 1, 7)
        });
    }

    private boolean isFinancial() {
        if (scenarioKey == null || scenarioKey.isBlank()) {
            return financeFamiliarity != null || calculationAccuracyImportance != null;
        }
        return scenarioKey.toLowerCase().contains("financial");
    }

    private boolean isHiring() {
        if (scenarioKey == null || scenarioKey.isBlank()) {
            return hrFamiliarity != null || hrCriteriaTransparencyImportance != null;
        }
        return scenarioKey.toLowerCase().contains("hiring");
    }

    private boolean isLegal() {
        if (scenarioKey == null || scenarioKey.isBlank()) {
            return legalReliabilityImportance != null || legalCitationAccuracyImportance != null;
        }
        return scenarioKey.toLowerCase().contains("legal");
    }

    private int coalesce(Integer value, int fallback) {
        return value == null ? fallback : value;
    }
}
