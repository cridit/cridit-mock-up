package cridit.machineSide;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record Evidence (
        @NotBlank String evidenceKey,
        @NotNull Double trustworthyMass,
        @NotNull Double untrustworthyMass,
        @NotNull Double uncertaintyMass
){
    public Evidence {
        if (Math.abs(trustworthyMass + untrustworthyMass + uncertaintyMass - 1.0) > 1e-6){
            throw new IllegalArgumentException("Masses must sum to 1.0");
        }
    }

    public static record Weight(
            @NotBlank String evidenceKey,
            @NotNull Double weight
    ) {
        public Weight {
            if (weight < 0.0 || weight > 1.0) {
                throw new IllegalArgumentException("Evidence weight must be between 0.0 and 1.0");
            }
        }
    }
}
