package cridit.calibration.adaptation;

import cridit.api.dto.request.human.FrontendFeedbackInput;
import cridit.api.dto.request.machine.EvidenceRequest;
import cridit.api.dto.request.workflow.PostflightRequest;
import cridit.api.dto.request.workflow.PostflightSurveyInput;
import cridit.api.dto.response.workflow.PostflightSummary;
import cridit.machineSide.Evidence;
import cridit.machineSide.MachineSideTrustEvaluation;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@ApplicationScoped
public class PostflightService {
    private static final double DEFAULT_HUMAN_SCORE = 0.5;
    private static final double WEIGHT_BOOST = 0.05;

    private final MachineSideTrustEvaluation machineSideTrustEvaluation;
    private final Map<String, PostflightSummary> summaries = new ConcurrentHashMap<>();

    @Inject
    public PostflightService(MachineSideTrustEvaluation machineSideTrustEvaluation) {
        this.machineSideTrustEvaluation = machineSideTrustEvaluation;
    }

    public PostflightSummary submit(PostflightRequest request) {
        EvidenceRequest metrics = request.evidenceRequest();
        List<Evidence> evidenceSet = metrics == null ? Collections.emptyList() : safeEvidence(metrics.evidenceSet());
        List<Evidence.Weight> baseWeights = metrics == null ? Collections.emptyList() : safeWeights(metrics.evidenceWeights());
        List<String> factors = request.feedbackInput() == null ? Collections.emptyList() : safeFactors(request.feedbackInput());
        List<Evidence.Weight> updatedWeights = updateWeights(evidenceSet, baseWeights, factors);

        double machineScore = resolveMachineTrustScore(request.conflictRedistribution(), evidenceSet, updatedWeights);
        double humanScore = computeHumanTrustScore(request.feedbackInput(), request.surveyInput());

        PostflightSummary summary = new PostflightSummary(
                request.sessionId(),
                request.participantId(),
                machineScore,
                humanScore,
                updatedWeights,
                factors,
                Instant.now().toString(),
                null,
                null,
                null,
                null
        );
        if (request.sessionId() != null && !request.sessionId().isBlank()) {
            summaries.put(request.sessionId(), summary);
        }
        return summary;
    }

    public List<PostflightSummary> listSummaries() {
        List<PostflightSummary> results = new ArrayList<>(summaries.values());
        results.sort(Comparator.comparing(PostflightSummary::sessionId, this::compareSessionIds));
        return results;
    }

    public PostflightSummary updateCalibration(String sessionId,
                                               String decision,
                                               Double gap,
                                               Double machineScore,
                                               Double humanScore) {
        if (sessionId == null || sessionId.isBlank()) {
            return null;
        }
        PostflightSummary existing = summaries.get(sessionId);
        if (existing == null) {
            return null;
        }
        PostflightSummary updated = new PostflightSummary(
                existing.sessionId(),
                existing.participantId(),
                existing.machineTrustScore(),
                existing.humanTrustScore(),
                existing.updatedWeights(),
                existing.trustFactors(),
                existing.timestamp(),
                decision,
                gap,
                machineScore,
                humanScore
        );
        summaries.put(sessionId, updated);
        return updated;
    }

    private int compareSessionIds(String left, String right) {
        if (left == null && right == null) {
            return 0;
        }
        if (left == null) {
            return -1;
        }
        if (right == null) {
            return 1;
        }
        try {
            return Integer.compare(Integer.parseInt(left), Integer.parseInt(right));
        } catch (NumberFormatException e) {
            return left.compareTo(right);
        }
    }

    private List<Evidence> safeEvidence(List<Evidence> evidenceSet) {
        return evidenceSet == null ? Collections.emptyList() : evidenceSet;
    }

    private List<Evidence.Weight> safeWeights(List<Evidence.Weight> weights) {
        return weights == null ? Collections.emptyList() : weights;
    }

    private List<String> safeFactors(FrontendFeedbackInput input) {
        List<String> factors = input.trustFactors();
        return factors == null ? Collections.emptyList() : factors;
    }

    private List<Evidence.Weight> updateWeights(List<Evidence> evidenceSet,
                                                List<Evidence.Weight> baseWeights,
                                                List<String> factors) {
        if (evidenceSet.isEmpty()) {
            return Collections.emptyList();
        }

        Map<String, Double> weightByKey = new HashMap<>();
        for (Evidence evidence : evidenceSet) {
            weightByKey.put(evidence.evidenceKey(), 1.0);
        }
        for (Evidence.Weight weight : baseWeights) {
            if (weight != null && weightByKey.containsKey(weight.evidenceKey())) {
                weightByKey.put(weight.evidenceKey(), weight.weight());
            }
        }

        if (!factors.isEmpty()) {
            Map<String, List<String>> factorMapping = buildFactorMapping();
            for (String rawFactor : factors) {
                if (rawFactor == null || rawFactor.isBlank()) {
                    continue;
                }
                String factor = rawFactor.trim().toLowerCase(Locale.ROOT);
                List<String> mappedKeys = factorMapping.getOrDefault(factor, List.of(factor));
                List<String> matched = new ArrayList<>();
                for (String key : weightByKey.keySet()) {
                    String normalizedKey = key.toLowerCase(Locale.ROOT);
                    for (String mapped : mappedKeys) {
                        if (normalizedKey.contains(mapped)) {
                            matched.add(key);
                            break;
                        }
                    }
                }
                if (matched.isEmpty()) {
                    double boost = WEIGHT_BOOST / weightByKey.size();
                    for (String key : weightByKey.keySet()) {
                        weightByKey.put(key, weightByKey.get(key) + boost);
                    }
                } else {
                    for (String key : matched) {
                        weightByKey.put(key, weightByKey.get(key) + WEIGHT_BOOST);
                    }
                }
            }
        }

        normalizeWeights(weightByKey);

        List<Evidence.Weight> updated = new ArrayList<>();
        for (Map.Entry<String, Double> entry : weightByKey.entrySet()) {
            updated.add(new Evidence.Weight(entry.getKey(), entry.getValue()));
        }
        return updated;
    }

    private Map<String, List<String>> buildFactorMapping() {
        Map<String, List<String>> mapping = new HashMap<>();
        mapping.put("reliability", List.of("reliability", "accuracy", "mmlu", "performance"));
        mapping.put("transparency", List.of("transparency", "explainability"));
        mapping.put("security", List.of("security", "robustness", "safety"));
        mapping.put("privacy", List.of("privacy"));
        mapping.put("humanness", List.of("humanness", "human", "empathy"));
        mapping.put("empathy", List.of("empathy", "humanness", "human"));
        return mapping;
    }

    private void normalizeWeights(Map<String, Double> weightByKey) {
        double sum = 0.0;
        for (double value : weightByKey.values()) {
            sum += value;
        }
        if (sum <= 0.0) {
            double equal = 1.0 / weightByKey.size();
            for (String key : weightByKey.keySet()) {
                weightByKey.put(key, equal);
            }
            return;
        }
        for (String key : weightByKey.keySet()) {
            weightByKey.put(key, weightByKey.get(key) / sum);
        }
    }

    private double resolveMachineTrustScore(String conflictRedistribution,
                                            List<Evidence> evidenceSet,
                                            List<Evidence.Weight> evidenceWeights) {
        if (evidenceSet == null || evidenceSet.isEmpty()) {
            return 0.0;
        }
        return machineSideTrustEvaluation.getMachineTrustScore(evidenceSet, evidenceWeights);
    }

    private double computeHumanTrustScore(FrontendFeedbackInput feedbackInput, PostflightSurveyInput surveyInput) {
        Double surveyScore = computeSurveyScore(surveyInput);
        if (surveyScore != null) {
            return surveyScore;
        }
        if (feedbackInput == null) {
            return DEFAULT_HUMAN_SCORE;
        }
        double sum = 0.0;
        int count = 0;
        if (feedbackInput.rating() != null) {
            sum += clamp01(feedbackInput.rating() / 5.0);
            count++;
        }
        if (feedbackInput.trustCueUsefulness() != null) {
            sum += clamp01(feedbackInput.trustCueUsefulness() / 5.0);
            count++;
        }
        String satisfaction = feedbackInput.satisfaction();
        if (satisfaction != null && !satisfaction.isBlank()) {
            sum += mapSatisfaction(satisfaction.trim().toLowerCase(Locale.ROOT));
            count++;
        }
        String helpfulness = feedbackInput.helpfulness();
        if (helpfulness != null && !helpfulness.isBlank()) {
            sum += mapHelpfulness(helpfulness.trim().toLowerCase(Locale.ROOT));
            count++;
        }
        if (count == 0) {
            return DEFAULT_HUMAN_SCORE;
        }
        return clamp01(sum / count);
    }

    private Double computeSurveyScore(PostflightSurveyInput surveyInput) {
        if (surveyInput == null) {
            return null;
        }
        List<Integer> scores = new ArrayList<>();
        addIfPresent(scores, surveyInput.overallTrust());
        addIfPresent(scores, surveyInput.willingnessReuse());
        addIfPresent(scores, surveyInput.relianceWithVerification());
        addIfPresent(scores, surveyInput.relianceWithoutVerification());
        addIfPresent(scores, surveyInput.calculationsAccurate());
        addIfPresent(scores, surveyInput.assumptionsExplicit());
        addIfPresent(scores, surveyInput.traceabilityShown());
        addIfPresent(scores, surveyInput.consistencyMaintained());
        addIfPresent(scores, surveyInput.uncertaintyCommunicated());
        addIfPresent(scores, surveyInput.riskComprehensive());
        addIfPresent(scores, surveyInput.professionalBoundaries());
        addIfPresent(scores, surveyInput.taskUtility());
        addIfPresent(scores, surveyInput.criteriaTransparent());
        addIfPresent(scores, surveyInput.explanationsUnderstandable());
        addIfPresent(scores, surveyInput.fairnessObserved());
        addIfPresent(scores, surveyInput.toneAppropriate());
        addIfPresent(scores, surveyInput.controlOfDecision());
        addIfPresent(scores, surveyInput.remediationAcknowledgedError());
        addIfPresent(scores, surveyInput.remediationFixedProblem());
        addIfPresent(scores, surveyInput.remediationExplanationHelpful());
        addIfPresent(scores, surveyInput.remediationMoreAuditable());
        addIfPresent(scores, surveyInput.remediationTrustRestored());
        addIfPresent(scores, surveyInput.remediationHonestLimits());
        if (scores.isEmpty()) {
            return null;
        }
        double sum = 0.0;
        for (Integer score : scores) {
            if (score == null) {
                continue;
            }
            sum += clamp01((score - 1) / 6.0);
        }
        return clamp01(sum / scores.size());
    }

    private void addIfPresent(List<Integer> scores, Integer value) {
        if (value != null) {
            scores.add(value);
        }
    }

    private double mapSatisfaction(String value) {
        return switch (value) {
            case "very_dissatisfied" -> 0.1;
            case "dissatisfied" -> 0.3;
            case "satisfied" -> 0.7;
            case "very_satisfied" -> 0.9;
            default -> 0.5;
        };
    }

    private double mapHelpfulness(String value) {
        return switch (value) {
            case "not_helpful" -> 0.2;
            case "somewhat_helpful" -> 0.4;
            case "helpful" -> 0.6;
            case "very_helpful" -> 0.8;
            default -> 0.5;
        };
    }

    private double clamp01(double value) {
        if (value < 0.0) {
            return 0.0;
        }
        if (value > 1.0) {
            return 1.0;
        }
        return value;
    }
}
