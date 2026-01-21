package cridit.api.dto.request.workflow;

import cridit.riskAnalysis.Threat;
import cridit.riskAnalysis.Vulnerability;

import java.util.List;

public record RiskInputRequest(
        List<Threat> threats,
        List<Vulnerability> vulnerabilities
) {
}
