package cridit.api.dto.request.human;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record HumanInputRequest(
        @NotNull
        @DecimalMin(value = "0.0", inclusive = true)
        @DecimalMax(value = "1.0", inclusive = true)
        double behaviorInputWeight,

        @NotNull
        @Min(value = 0)
        int adopted,

        @NotNull
        @Min(value = 0)
        int rejected,

        @NotNull
        @DecimalMin(value = "0.0", inclusive = true)
        @DecimalMax(value = "1.0", inclusive = true)
        @JsonAlias({"adoptionBaseRate", "behaviorBaseRate"})
        double adoptionBaseRate,

        @NotNull
        @DecimalMin(value = "0.0", inclusive = true)
        @DecimalMax(value = "1.0", inclusive = true)
        double feedbackInputWeight,

        @NotNull
        @DecimalMin(value = "0.0", inclusive = true)
        @DecimalMax(value = "1.0", inclusive = true)
        double feedbackLikelihood,

        @NotNull
        @DecimalMin(value = "0.0", inclusive = true)
        @DecimalMax(value = "1.0", inclusive = true)
        double feedbackConfidence,

        @NotNull
        @DecimalMin(value = "0.0", inclusive = true)
        @DecimalMax(value = "1.0", inclusive = true)
        @JsonAlias({"feedbackBaseRate"})
        double feedbackBaseRate,
){}
