package cridit.api.dto;

public class ScenarioInputs {
  public double baselineMachine;
  public double preflightHuman;
  public double threshold;
  public Integer adopted;
  public Integer rejected;
  public String sessionId;

  public ScenarioInputs() {}

  public ScenarioInputs(double baselineMachine, double preflightHuman, double threshold) {
    this.baselineMachine = baselineMachine;
    this.preflightHuman = preflightHuman;
    this.threshold = threshold;
  }

  public ScenarioInputs(
      double baselineMachine,
      double preflightHuman,
      double threshold,
      Integer adopted,
      Integer rejected
  ) {
    this.baselineMachine = baselineMachine;
    this.preflightHuman = preflightHuman;
    this.threshold = threshold;
    this.adopted = adopted;
    this.rejected = rejected;
  }

  public ScenarioInputs(
      double baselineMachine,
      double preflightHuman,
      double threshold,
      Integer adopted,
      Integer rejected,
      String sessionId
  ) {
    this.baselineMachine = baselineMachine;
    this.preflightHuman = preflightHuman;
    this.threshold = threshold;
    this.adopted = adopted;
    this.rejected = rejected;
    this.sessionId = sessionId;
  }
}
