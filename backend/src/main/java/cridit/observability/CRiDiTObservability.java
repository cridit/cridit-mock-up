package cridit.observability;

import cridit.calibration.TrustCues;
import io.micrometer.core.instrument.*;
import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.api.common.AttributeKey;
import io.opentelemetry.api.common.Attributes;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.SpanKind;
import io.opentelemetry.api.trace.Tracer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.concurrent.atomic.AtomicReference;

@ApplicationScoped
public class CRiDiTObservability {

    private final MeterRegistry registry;
    private final Tracer tracer;

    private final AtomicReference<Double> lastHuman = new AtomicReference<>(null);
    private final AtomicReference<Double> lastMachine = new AtomicReference<>(null);

    private static double nullDoubleManagement(Double value){
        return value == null ? Double.NaN : value;
    }

    private static String nullStringManagement(String value){
        return value == null ? "" : value;
    }

    @Inject
    public CRiDiTObservability(MeterRegistry registry, OpenTelemetry openTelemetry) {
        this.registry = registry;
        this.tracer = openTelemetry.getTracer("cridit");

        Gauge.builder("human.score", lastHuman, r -> nullDoubleManagement(r.get()))
                .register(registry);

        Gauge.builder("machine.score", lastMachine, r -> nullDoubleManagement(r.get()))
                .tag("machine.conflict_redistribution", "dst")
                .register(registry);

        Gauge.builder("machine.score", lastMachine, r -> nullDoubleManagement(r.get()))
                .tag("machine.conflict_redistribution", "pcr5")
                .register(registry);
    }

    public <T> T inSpan(String name, String conflictRedistribution, java.util.function.Supplier<T> action) {
        var spanBuilder = tracer.spanBuilder(name).setSpanKind(SpanKind.SERVER);
        if (conflictRedistribution != null)
            spanBuilder.setAttribute("cridit.machine.conflict_redistribution", conflictRedistribution);

        Span span = spanBuilder.startSpan();
        try (var scope = span.makeCurrent()) {
            return action.get();
        } catch (RuntimeException e) {
            span.recordException(e);
            span.setStatus(io.opentelemetry.api.trace.StatusCode.ERROR);
            throw e;
        } finally {
            span.end();
        }
    }

    public Timer.Sample startTimer() {
        return Timer.start(registry);
    }

    public void stopEvaluationTimer(Timer.Sample sample,
                                    String conflictRedistribution,  // dst / pcr5
                                    boolean success) {
        Timer timer = Timer.builder("cridit.evaluation.seconds")
                .tag("conflict_redistribution", nullStringManagement(conflictRedistribution))
                .tag("success", Boolean.toString(success))
                .register(registry);
        sample.stop(timer);
    }

    public void stopCalibrationTimer(Timer.Sample sample, String thresholdNature, boolean success) {
        Timer timer = Timer.builder("cridit.calibration.seconds")
                .tag("threshold_nature", nullStringManagement(thresholdNature))
                .tag("success", Boolean.toString(success))
                .register(registry);
        sample.stop(timer);
    }

    public void calibrationRecord(String conflictRedistribution, String thresholdNature, TrustCues trustCues) {
        Counter.builder("cridit_requests_total")
                .register(registry)
                .increment();

        DistributionSummary.builder("cridit.human.score")
                .register(registry)
                .record(trustCues.humanTrustScore());

        DistributionSummary.builder("cridit.machine.error")
                .register(registry)
                .record(trustCues.error());

        DistributionSummary.builder("cridit.machine.risk")
                .register(registry)
                .record(trustCues.risk());

        DistributionSummary.builder("cridit.machine.score")
                .tag("conflict_redistribution", nullStringManagement(conflictRedistribution))
                .register(registry)
                .record(trustCues.machineTrustScore());

        DistributionSummary.builder("cridit.calibration.gap")
                .register(registry)
                .record(trustCues.humanMachineTrustGap());

        DistributionSummary.builder("cridit_calibration_threshold")
                .tag("threshold_nature", nullStringManagement(thresholdNature))
                .register(registry)
                .record(trustCues.threshold());

        Counter.builder("cridit_calibration_decisions_total")
                .tag("decision", nullStringManagement(trustCues.decision()))
                .register(registry)
                .increment();

        if ("DECREASE HUMAN TRUST".equals(trustCues.decision())) {
            Counter.builder("cridit.overtrust.events")
                    .register(registry)
                    .increment();
        } else if ("INCREASE HUMAN TRUST".equals(trustCues.decision())) {
            Counter.builder("cridit.undertrust.events")
                    .register(registry)
                    .increment();
        } else if ("ADAPT SYSTEM".equals(trustCues.decision())) {
            Counter.builder("cridit.system.failures")
                    .register(registry)
                    .increment();
        }

        lastHuman.set(trustCues.humanTrustScore());
        lastMachine.set(trustCues.machineTrustScore());

        Span span = Span.current();
        if (span.getSpanContext().isValid()) {
            span.setAttribute("cridit.machine.error", trustCues.error());
            span.setAttribute("cridit.machine.risk", trustCues.risk());
            span.setAttribute("cridit.machine.score", trustCues.machineTrustScore());
            span.setAttribute("cridit.machine.conflict_redistribution", conflictRedistribution);
            span.setAttribute("cridit.humane.score", trustCues.humanTrustScore());
            span.setAttribute("cridit.calibration.gap", trustCues.humanMachineTrustGap());
            span.setAttribute("cridit.calibration.threshold_value", trustCues.threshold());
            span.setAttribute("cridit.calibration.threshold_nature", thresholdNature);
            span.setAttribute("cridit.calibration.decision", trustCues.decision());
            if (trustCues.belief() != null) {
                span.setAttribute("cridit.machine.belief", trustCues.belief());
            }
            if (trustCues.plausibility() != null) {
                span.setAttribute("cridit.machine.plausibility", trustCues.plausibility());
            }
            if (trustCues.riskLevel() != null) {
                span.setAttribute("cridit.risk.level", trustCues.riskLevel());
            }
            if (trustCues.decisionConfidence() != null) {
                span.setAttribute("cridit.calibration.confidence", trustCues.decisionConfidence());
            }
            span.addEvent(
                    "cridit.calibration",
                    Attributes.of(
                            AttributeKey.doubleKey("error"), trustCues.error(),
                            AttributeKey.doubleKey("risk"), trustCues.risk(),
                            AttributeKey.stringKey("decision"), trustCues.decision(),
                            AttributeKey.doubleKey("gap"), trustCues.humanMachineTrustGap(),
                            AttributeKey.doubleKey("threshold"), trustCues.threshold()
                    )
            );
        }
    }
}
