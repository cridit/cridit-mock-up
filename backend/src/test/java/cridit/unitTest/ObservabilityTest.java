package cridit.unitTest;

import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.sdk.OpenTelemetrySdk;
import io.opentelemetry.sdk.testing.exporter.InMemorySpanExporter;
import io.opentelemetry.sdk.trace.SdkTracerProvider;
import io.opentelemetry.sdk.trace.data.SpanData;
import io.opentelemetry.sdk.trace.export.SimpleSpanProcessor;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Produces;
import jakarta.inject.Singleton;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static io.restassured.RestAssured.given;
import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
public class ObservabilityTest {

    @BeforeEach
    void resetSpans() {
        TestOtelResources.SPAN_EXPORTER.reset();
    }

    private static void assertAttrPresent(SpanData span, String key) {
        var k = io.opentelemetry.api.common.AttributeKey.stringKey(key);
        var kd = io.opentelemetry.api.common.AttributeKey.doubleKey(key);

        // attribute can be string or double depending on your key;
        // we try both, pass if either exists
        boolean ok = span.getAttributes().get(k) != null || span.getAttributes().get(kd) != null;
        Assertions.assertTrue(ok, "Missing span attribute: " + key);
    }

    @Test
    public void testDynamicCalibration_inRow_metrics_and_traces() {
        for (int i = 0; i < 5; i++) {
            String body = requestBody(
                    0.05 + i * 0.02,
                    0.10 + i * 0.05
            );

            given()
                    .contentType("application/json")
                    .body(body)
                    .when()
                        .post("/cridit/calibration/trustCues")
                    .then()
                        .statusCode(200);
            }

            String metricsText = given()
                    .when()
                        .get("/metrics")
                    .then()
                        .statusCode(200)
                        .extract().asString();

            assertTrue(metricsText.contains("cridit_requests_total"));
            assertTrue(metricsText.contains("cridit_calibration_decisions_total"));
            assertTrue(metricsText.contains("cridit_calibration_seconds"));

            List<SpanData> spans = TestOtelResources.SPAN_EXPORTER.getFinishedSpanItems();
            assertTrue(spans.size() >= 5);

            SpanData span = spans.get(0);

            assertAttrPresent(span, "cridit.calibration.decision");
            assertAttrPresent(span, "cridit.calibration.gap");
            assertAttrPresent(span, "cridit.calibration.threshold_value");
            assertAttrPresent(span, "cridit.calibration.threshold_nature");

            assertAttrPresent(span, "cridit.machine.conflict_redistribution");
            assertAttrPresent(span, "cridit.machine.error");
            assertAttrPresent(span, "cridit.machine.risk");
            assertAttrPresent(span, "cridit.machine.score");
        }

        private static String requestBody(double machineError, double machineRisk) {
            return """
          {
          "benchmarkMetricRequest": {
            "evidenceSet": [
              { "evidenceKey": "accuracy",     "trustworthyMass": 0.9, "untrustworthyMass": 0.0, "uncertaintyMass": 0.1 },
              { "evidenceKey": "transparency", "trustworthyMass": 0.6, "untrustworthyMass": 0.1, "uncertaintyMass": 0.3 },
              { "evidenceKey": "errorRate",    "trustworthyMass": 0.0, "untrustworthyMass": 0.9, "uncertaintyMass": 0.1 }
            ]
          },
          "humanInputRequest": {
            "behaviorInputWeight": 0.6,
            "adopted": 30,
            "rejected": 10,
            "behaviorBaseRate": 0.5,
            "feedbackInputWeight": 0.25,
            "feedbackLikelihood": 0.75,
            "feedbackConfidence": 0.6,
            "feedbackBaseRate": 0.7,
            "physioInputWeight": 0.15,
            "physioLikelihood": 0.75,
            "physioConfidence": 0.6,
            "physioBaseRate": 0.6
          },
          "error": %s,
          "risk": %s,
          "conflictRedistribution": "pcr5",
          "thresholdNature": "dynamic"
        }
        """.formatted(machineError, machineRisk);
        }

        @ApplicationScoped
        public static class TestOtelResources {
            static final InMemorySpanExporter SPAN_EXPORTER = InMemorySpanExporter.create();

            @Produces
            @Singleton
            public OpenTelemetry openTelemetry() {
                SdkTracerProvider provider = SdkTracerProvider.builder()
                        .addSpanProcessor(SimpleSpanProcessor.create(SPAN_EXPORTER))
                        .build();

                return OpenTelemetrySdk.builder()
                        .setTracerProvider(provider)
                        .build();
            }
        }
}
