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
}
