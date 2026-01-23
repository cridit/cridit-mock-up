package cridit.api.dto.response.machine;

public record MachineTrustEventResponse(
        double machineTrustScore,
        double trustworthyMass,
        double untrustworthyMass,
        double uncertaintyMass,
        double conflict
) {
}
