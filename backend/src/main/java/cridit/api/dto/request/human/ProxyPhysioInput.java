package cridit.api.dto.request.human;

public record ProxyPhysioInput(
        Integer selfReportedStress,
        Integer selfReportedArousal,
        Integer engagementLevel,
        Integer concentrationLevel,
        Integer fatigueLevel,
        String emotionalValence,
        Double confidenceInReport,
        Integer physicalComfort
) {
}
