package cridit.api.dto.request.machine;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import cridit.machineSide.Evidence;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record EvidenceRequest(
        @NotNull
        @Size(min = 1, message = "evidenceSet must not be empty")
        List<Evidence> evidenceSet
){
}
