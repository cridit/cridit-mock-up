package cridit.api;

import cridit.api.dto.request.machine.EvidenceRequest;
import cridit.api.dto.request.human.HumanInputRequest;
import cridit.api.dto.request.human.PreflightHumanInputRequest;
import cridit.api.dto.request.human.PreflightRequest;
import cridit.api.dto.request.workflow.TrustCuesRequest;
import cridit.api.dto.request.workflow.CalibrationRecordRequest;
import cridit.api.dto.request.workflow.PostflightRequest;
import cridit.api.dto.request.workflow.PostflightCalibrationRequest;
import cridit.api.dto.request.machine.TrustEventRequest;
import cridit.api.dto.response.machine.MachineTrustEventResponse;
import cridit.api.dto.response.workflow.PostflightSummary;
import cridit.calibration.Calibration;
import cridit.calibration.TrustCues;
import cridit.calibration.adaptation.PostflightService;
import cridit.machineSide.Evidence;
import cridit.humanSide.Adoption;
import cridit.humanSide.Feedback.Report;
import cridit.humanSide.HumanSideTrustEvaluation;
import cridit.machineSide.MachineSideTrustEvaluation;
import cridit.humanSide.preflight.PreflightScore;
import cridit.humanSide.PhysiologicalReport;
import cridit.machineSide.events.MachineTrustEventService;
import cridit.observability.CRiDiTObservability;
import cridit.observability.CalibrationHistoryEntry;
import cridit.observability.CalibrationHistoryStore;
import cridit.observability.PostflightAnswerStore;
import cridit.observability.PreflightAnswerStore;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.util.List;

@Path("/cridit")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class CRiDiTController {
    @Inject
    HumanSideTrustEvaluation humanSideTrustEvaluation;

    @Inject
    MachineSideTrustEvaluation machineSideTrustEvaluation;

    @Inject
    Calibration calibration;

    @Inject
    CRiDiTObservability observability;

    @Inject
    CalibrationHistoryStore calibrationHistoryStore;

    @Inject
    PostflightService postflightService;

    @Inject
    PreflightAnswerStore preflightAnswerStore;

    @Inject
    PostflightAnswerStore postflightAnswerStore;

    @Inject
    MachineTrustEventService machineTrustEventService;

    public CRiDiTController(MachineSideTrustEvaluation machineSideTrustEvaluation,
                            HumanSideTrustEvaluation humanSideTrustEvaluation,
                            Calibration calibration,
                            CRiDiTObservability observability,
                            PostflightService postflightService,
                            PreflightAnswerStore preflightAnswerStore,
                            PostflightAnswerStore postflightAnswerStore,
                            MachineTrustEventService machineTrustEventService) {
        this.machineSideTrustEvaluation = machineSideTrustEvaluation;
        this.humanSideTrustEvaluation = humanSideTrustEvaluation;
        this.calibration = calibration;
        this.observability = observability;
        this.postflightService = postflightService;
        this.preflightAnswerStore = preflightAnswerStore;
        this.postflightAnswerStore = postflightAnswerStore;
        this.machineTrustEventService = machineTrustEventService;
    }

    @POST
    @Path("/preflight/params")
    public PreflightScore.ScoreResult getPreflightParams(PreflightRequest request) {
        preflightAnswerStore.record(request);
        PreflightScore.Response preflightResponse = request.toResponse();
        return PreflightScore.computeScore(preflightResponse);
    }

    @POST
    @Path("/evaluation/score/machine")
    public double getMachineTrustScoreP(EvidenceRequest evidenceRecords) {
        List<Evidence> evidenceSet = evidenceRecords.evidenceSet();
        return machineSideTrustEvaluation.getMachineTrustScore(evidenceSet);
    }

    @POST
    @Path("/machine/events")
    public MachineTrustEventResponse recordMachineEvent(TrustEventRequest request) {
        return machineTrustEventService.recordEvent(request);
    }

    @POST
    @Path("/evaluation/score/human")
    public double getHumanTrustScore(HumanInputRequest humanInputRecord) {
        return evaluateHumanTrustScore(humanInputRecord);
    }

    @POST
    @Path("/evaluation/score/human/preflight")
    public double getHumanTrustScoreWithPreflight(PreflightHumanInputRequest request) {
        HumanInputRequest humanInputRecord = request.humanInput();
        PreflightScore.Response preflightResponse = request.preflight().toResponse();

        Report feedbackReport = new Report(
                humanInputRecord.feedbackLikelihood(),
                humanInputRecord.feedbackConfidence(),
                humanInputRecord.feedbackBaseRate()
        );
        PhysiologicalReport physioReport = new PhysiologicalReport(
                humanInputRecord.physioLikelihood(),
                humanInputRecord.physioConfidence(),
                humanInputRecord.physioBaseRate()
        );

        double score = humanSideTrustEvaluation.getHumanTrustScoreWithPreflight(
                humanInputRecord.behaviorInputWeight(),
                humanInputRecord.adopted(),
                humanInputRecord.rejected(),
                preflightResponse,
                humanInputRecord.feedbackInputWeight(),
                feedbackReport,
                humanInputRecord.physioInputWeight(),
                physioReport
        );
        return score;
    }

    @POST
    @Path("/calibration/trustCues")
    public TrustCues calibrate(TrustCuesRequest trustCuesRequest) {
        String conflictRedistribution = trustCuesRequest.conflictRedistribution();
        String thresholdNature = trustCuesRequest.thresholdNature();
        var timer = observability.startTimer();
        boolean success = false;
        try {
            TrustCues trustCues = observability.inSpan(
                    "/cridit/calibration/trustCues",
                    conflictRedistribution,
                    () -> buildTrustCues(trustCuesRequest, thresholdNature)
            );
            success = true;
            calibrationHistoryStore.record(
                    resolveScenarioKey(trustCuesRequest),
                    trustCuesRequest.taskId(),
                    trustCues,
                    conflictRedistribution,
                    thresholdNature,
                    trustCuesRequest.timestamp()
            );
            return trustCues;
        } finally {
            observability.stopCalibrationTimer(timer, thresholdNature, success);
        }
    }

    @POST
    @Path("/calibration/record")
    public void recordCalibration(CalibrationRecordRequest request) {
        if (request == null) {
            return;
        }
        String scenarioKey = request.scenarioKey();
        if (scenarioKey == null || scenarioKey.isBlank()) {
            return;
        }
        calibrationHistoryStore.recordManual(
                scenarioKey,
                request.taskId(),
                request.humanTrustScore(),
                request.machineTrustScore(),
                request.humanMachineTrustGap(),
                request.threshold(),
                request.decision(),
                request.conflictRedistribution(),
                request.thresholdNature(),
                request.timestamp()
        );
    }

    @POST
    @Path("/postflight")
    public PostflightSummary submitPostflight(PostflightRequest request) {
        postflightAnswerStore.record(request);
        return postflightService.submit(request);
    }

    @GET
    @Path("/postflight")
    public List<PostflightSummary> listPostflightSummaries() {
        return postflightService.listSummaries();
    }

    @POST
    @Path("/postflight/calibration")
    public PostflightSummary updatePostflightCalibration(PostflightCalibrationRequest request) {
        return postflightService.updateCalibration(
                request.sessionId(),
                request.calibrationDecision(),
                request.calibrationGap(),
                request.calibrationMachineScore(),
                request.calibrationHumanScore()
        );
    }

    @GET
    @Path("/calibration/latest/{scenario}")
    public CalibrationHistoryEntry getLatestCalibration(@PathParam("scenario") String scenario) {
        CalibrationHistoryEntry entry = calibrationHistoryStore.latest(scenario);
        if (entry != null) {
            return entry;
        }
        CalibrationHistoryEntry fallback = calibrationHistoryStore.latest("default");
        if (fallback != null) {
            return fallback;
        }
        throw new NotFoundException("No calibration history for scenario");
    }

    private TrustCues buildTrustCues(TrustCuesRequest trustCuesRequest, String thresholdNature) {
        EvidenceRequest evidenceRequest = trustCuesRequest.evidenceRequest();
        List<Evidence> evidenceSet = evidenceRequest == null ? null : evidenceRequest.evidenceSet();
        double machineScore = machineSideTrustEvaluation.getMachineTrustScore(evidenceSet);
        machineScore = machineSideTrustEvaluation.applyRiskAdjustment(machineScore, trustCuesRequest.risk());

        double humanScore = evaluateHumanTrustScore(trustCuesRequest.humanInputRequest());
        if (trustCuesRequest.riskPerception() != null) {
            humanScore = humanSideTrustEvaluation.applyRiskPerception(humanScore, trustCuesRequest.riskPerception());
        }

        if (trustCuesRequest.initialThreshold() != null) {
            calibration.setInitialThreshold(trustCuesRequest.sessionId(), trustCuesRequest.initialThreshold());
        }

        String resolvedThresholdNature = thresholdNature == null ? "statistic" : thresholdNature;
        TrustCues trustCues = calibration.calibration(
                machineScore,
                humanScore,
                trustCuesRequest.error(),
                trustCuesRequest.risk(),
                trustCuesRequest.riskPerception(),
                trustCuesRequest.previousMiscalibrationState(),
                resolvedThresholdNature
        );
        observability.calibrationRecord(
                trustCuesRequest.conflictRedistribution(),
                resolvedThresholdNature,
                trustCues
        );
        return trustCues;
    }

    private String resolveScenarioKey(TrustCuesRequest request) {
        if (request.domain() != null && !request.domain().isBlank()) {
            return request.domain();
        }
        if (request.taskId() != null && !request.taskId().isBlank()) {
            return request.taskId();
        }
        return "default";
    }

    private double evaluateHumanTrustScore(HumanInputRequest humanInputRecord) {
        Adoption adoption = new Adoption(
                humanInputRecord.adopted(),
                humanInputRecord.rejected(),
                humanInputRecord.adoptionBaseRate()
        );
        Report feedbackReport = new Report(
                humanInputRecord.feedbackLikelihood(),
                humanInputRecord.feedbackConfidence(),
                humanInputRecord.feedbackBaseRate()
        );
        PhysiologicalReport physioReport = new PhysiologicalReport(
                humanInputRecord.physioLikelihood(),
                humanInputRecord.physioConfidence(),
                humanInputRecord.physioBaseRate()
        );

        return humanSideTrustEvaluation.getHumanTrustScore(
                humanInputRecord.behaviorInputWeight(),
                adoption,
                humanInputRecord.feedbackInputWeight(),
                feedbackReport,
                humanInputRecord.physioInputWeight(),
                physioReport
        );
    }
}
