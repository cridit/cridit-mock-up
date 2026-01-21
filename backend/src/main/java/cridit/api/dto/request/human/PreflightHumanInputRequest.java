package cridit.api.dto.request.human;

import jakarta.validation.constraints.NotNull;

public record PreflightHumanInputRequest(
        @NotNull HumanInputRequest humanInput,
        @NotNull PreflightRequest preflight
) {
}
