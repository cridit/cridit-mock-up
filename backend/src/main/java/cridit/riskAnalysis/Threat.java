package cridit.riskAnalysis;

public class Threat {
    private String id;
    private String description;
    private double likelihood;
    private double weight = 1.0;

    public Threat() {
    }

    public Threat(String id, String description, double likelihood) {
        this.id = id;
        this.description = description;
        this.likelihood = likelihood;
        this.weight = 1.0;
    }

    public Threat(String id, String description, double likelihood, double weight) {
        this.id = id;
        this.description = description;
        this.likelihood = likelihood;
        this.weight = weight;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public double getLikelihood() {
        return likelihood;
    }

    public void setLikelihood(double likelihood) {
        this.likelihood = likelihood;
    }

    public double getWeight() {
        return weight;
    }

    public void setWeight(double weight) {
        this.weight = weight;
    }
}
