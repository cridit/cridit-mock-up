package cridit.api.dto.request.workflow;

import com.fasterxml.jackson.annotation.JsonAlias;
import cridit.api.dto.request.human.FrontendFeedbackInput;
import cridit.api.dto.request.human.HumanInputRequest;
import cridit.api.dto.request.machine.EvidenceRequest;

public record TrustCuesRequest(
  String participantId,
  String sessionId,
  String interactionId,
  String timestamp,
  @JsonAlias("evidenceRequest")
  EvidenceRequest evidenceRequest,
  HumanInputRequest humanInputRequest,
  FrontendFeedbackInput feedbackInput,
  double error,
  double risk,
  Double riskPerception,
  String previousMiscalibrationState,
  String taskId,
  String domain,
  String difficulty,
  String conflictRedistribution,
  String thresholdNature,
  Double initialThreshold,
  String cueVisibility,
  String cueReliability,
  Double cueBaseTrust,
  Double cueVisible,
  Double cueLatent,
  Double cueBaseWeight,
  Double cueVisibleWeight,
  Double cueLatentWeight,
  String adaptationMode,
  Integer roundIndex
){
}
