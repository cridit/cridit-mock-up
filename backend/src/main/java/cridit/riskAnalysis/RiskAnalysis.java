package cridit.riskAnalysis;

import cridit.machineSide.Evidence;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class RiskAnalysis {
    public double weightedMeanRisk(List<Threat> threats, List<Vulnerability> vulnerabilities) {
        if (threats == null || threats.isEmpty()) {
            throw new IllegalArgumentException("Threats must be provided to compute risk");
        }
        if (vulnerabilities == null || vulnerabilities.isEmpty()) {
            throw new IllegalArgumentException("Vulnerabilities must be provided to compute risk");
        }
        double threatMean = weightedMeanThreats(threats);
        double vulnerabilityMean = weightedMeanVulnerabilities(vulnerabilities);
        return threatMean * vulnerabilityMean;
    }

    public double meanVulnerabilityFromEvidence(List<Evidence> evidenceSet) {
        if (evidenceSet == null || evidenceSet.isEmpty()) {
            throw new IllegalArgumentException("Evidence must be provided to compute vulnerability");
        }

        double sum = 0.0;
        int count = 0;
        for (Evidence evidence : evidenceSet) {
            if (evidence == null) {
                continue;
            }
            double vulnerability = clamp(evidence.uncertaintyMass() + evidence.untrustworthyMass());
            sum += vulnerability;
            count++;
        }
        if (count == 0) {
            throw new IllegalArgumentException("Evidence must be provided to compute vulnerability");
        }
        return sum / count;
    }

    public double riskFromThreatsAndEvidence(List<Threat> threats,
                                             List<Evidence> evidenceSet) {
        if (threats == null || threats.isEmpty()) {
            throw new IllegalArgumentException("Threats must be provided to compute risk");
        }
        double threatMean = weightedMeanThreats(threats);
        double vulnerability = meanVulnerabilityFromEvidence(evidenceSet);
        return threatMean * vulnerability;
    }

    private double weightedMeanThreats(List<Threat> threats) {
        double sumWeights = 0.0;
        double sum = 0.0;
        for (Threat threat : threats) {
            validateUnit(threat.getLikelihood(), "threat.likelihood");
            double weight = threat.getWeight();
            validateWeight(weight, "threat.weight");
            sumWeights += weight;
            sum += weight * threat.getLikelihood();
        }
        if (sumWeights == 0.0) {
            throw new IllegalArgumentException("Threat weights must sum to a positive value");
        }
        return sum / sumWeights;
    }

    private double weightedMeanVulnerabilities(List<Vulnerability> vulnerabilities) {
        double sumWeights = 0.0;
        double sum = 0.0;
        for (Vulnerability vulnerability : vulnerabilities) {
            validateUnit(vulnerability.getSeverity(), "vulnerability.severity");
            double weight = vulnerability.getWeight();
            validateWeight(weight, "vulnerability.weight");
            sumWeights += weight;
            sum += weight * vulnerability.getSeverity();
        }
        if (sumWeights == 0.0) {
            throw new IllegalArgumentException("Vulnerability weights must sum to a positive value");
        }
        return sum / sumWeights;
    }

    private void validateUnit(double value, String name) {
        if (value < 0.0 || value > 1.0) {
            throw new IllegalArgumentException(name + " must be between 0.0 and 1.0");
        }
    }

    private void validateWeight(double value, String name) {
        if (value < 0.0) {
            throw new IllegalArgumentException(name + " must be non-negative");
        }
    }

    private double clamp(double value) {
        if (value < 0.0) {
            return 0.0;
        }
        if (value > 1.0) {
            return 1.0;
        }
        return value;
    }
}
