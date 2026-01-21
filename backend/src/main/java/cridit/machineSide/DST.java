package cridit.machineSide;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DST {
    private enum State {
        T, // trustworthy = {T}
        UT, // untrustworthy = {UT}
        U // uncertainty = {T, UT}
    }

    private enum IntersectionState {
        EMPTY,
        T,
        UT,
        U
    }

    private static final class Combination {
        final Map<String, State> stateByKey;
        final double massProduct;

        Combination(Map<String, State> stateByKey, double massProduct) {
            this.stateByKey = stateByKey;
            this.massProduct = massProduct;
        }
    }

    private double getMassForState(Evidence evidence, State state){
        return switch (state){
            case T -> evidence.trustworthyMass();
            case UT -> evidence.untrustworthyMass();
            case U -> evidence.uncertaintyMass();
        };
    }

    private List<Combination> getCombinationSet(List<Evidence> evidenceSet){
        if(evidenceSet == null || evidenceSet.isEmpty()){
            throw new IllegalArgumentException("Evidence set is null or empty");
        }

        // 3 states (T, UT, {T, UT}) 3^n combinations
        List<Combination> combinationSet = new ArrayList<>();
        combinationSet.add(new Combination(new HashMap<>(), 1.0));

        for(int i = 0; i < evidenceSet.size(); i++){
            List<Combination> newCombination = new ArrayList<>();
            String key = evidenceSet.get(i).evidenceKey();
            double trustworthyMass = evidenceSet.get(i).trustworthyMass();
            double untrustworthyMass = evidenceSet.get(i).untrustworthyMass();
            double uncertaintyMass = evidenceSet.get(i).uncertaintyMass();

            for(Combination combination: combinationSet){
                Map<String, State> trustworthyState = new HashMap<>(combination.stateByKey);
                trustworthyState.put(key, State.T);
                newCombination.add(new Combination(trustworthyState, combination.massProduct * trustworthyMass));

                Map<String, State> untrustworthyState = new HashMap<>(combination.stateByKey);
                untrustworthyState.put(key, State.UT);
                newCombination.add(new Combination(untrustworthyState, combination.massProduct * untrustworthyMass));

                Map<String, State> uncertaintyState = new HashMap<>(combination.stateByKey);
                uncertaintyState.put(key, State.U);
                newCombination.add(new Combination(uncertaintyState, combination.massProduct * uncertaintyMass));
            }

            combinationSet = newCombination;
        }

        return combinationSet;
    }

    private IntersectionState getIntersectionState(Combination combination){
        boolean hasTrustworthyMass = false;
        boolean hasUntrustworthyMass = false;

        for (State state : combination.stateByKey.values()){
            if(state == State.T){
                hasTrustworthyMass = true;
            } else if(state == State.UT){
                hasUntrustworthyMass = true;
            }
        }

        if(hasTrustworthyMass && hasUntrustworthyMass){
            return IntersectionState.EMPTY; // T and UT
        } else if (hasTrustworthyMass){
            return IntersectionState.T; // T and U
        } else if (hasUntrustworthyMass){
            return IntersectionState.UT; // UT and U
        } else {
            return IntersectionState.U; // U and U
        }
    }


    // X is either trustworthy, untrustworthy or uncertainty, when we calculate the scalar of trustworthy state,
    // we collect mass from trustworthy state and uncertainty state
    // for instance, we have accuracy(trustworthy) = 0.9, accuracy(uncertainty) = 0.1, transparency(trustworthy) = 0.7,
    // transparency(untrustworthy) = 0.1, transparency(uncertainty) = 0.2, errorRate(untrustworthy) = 0.9,
    // errorRate(uncertainty) = 0.1, then the cons mass should be:
    // accuracy(trustworthy)*transparency(trustworthy)*errorRate(uncertainty)
    // + accuracy(trustworthy)*transparency(uncertainty)*errorRate(uncertainty)
    // + accuracy(uncertainty)*transparency(trustworthy)*errorRate(uncertainty)
    private double getConjunctiveConsensusTrustworthy(List<Combination> combinationSet){
        double prodSum = 0.0;
        for(Combination combination: combinationSet){
            if(getIntersectionState(combination).equals(IntersectionState.T)){
                prodSum += combination.massProduct;
            }
        }

        return prodSum;
    }

    private double getConjunctiveConsensusUntrustworthy(List<Combination> combinationSet){
        double prodSum = 0.0;
        for(Combination combination: combinationSet){
            if(getIntersectionState(combination).equals(IntersectionState.UT)){
                prodSum += combination.massProduct;
            }
        }

        return prodSum;
    }

    private double getConflict(List<Combination> combinationSet){
        double prodSum = 0.0;
        for(Combination combination: combinationSet){
            if(getIntersectionState(combination).equals(IntersectionState.EMPTY)){
                prodSum += combination.massProduct;
            }
        }

        return prodSum;
    }

    public double conflict(List<Evidence> evidenceSet) {
        List<Combination> combinationSet = getCombinationSet(evidenceSet);
        return getConflict(combinationSet);
    }

    // conflict redistribution
    private double getMassSum(List<Evidence> evidenceSet, Combination combination, String key_i, double sum) {
        for(Evidence evidence_k : evidenceSet){
            String key_k = evidence_k.evidenceKey();
            if(key_k.equals(key_i)) {
                continue;
            }

            State state_k = combination.stateByKey.get(key_k);
            double m_k = getMassForState(evidence_k, state_k);
            sum += m_k;
        }
        return sum;
    }

    private double getPCR5ConflictTrustworthy(List<Evidence> evidenceSet, List<Combination> combinationSet) {
        double conflictSum = 0.0;

        for (Combination combination : combinationSet) {
            if (! getIntersectionState(combination).equals(IntersectionState.EMPTY)) {
                continue;
            }

            double prod = combination.massProduct;
            if (prod == 0.0){
                continue;
            }

            for (Evidence evidence_i : evidenceSet) {
                String key_i = evidence_i.evidenceKey();
                State state = combination.stateByKey.get(key_i);
                if (!state.equals(State.T)) {
                    continue;
                }

                double m_i = evidence_i.trustworthyMass();
                if (m_i == 0.0) {
                    continue;
                }

                double P_without_i = prod / m_i;

                double sum = 0.0;
                sum = getMassSum(evidenceSet, combination, key_i, sum);

                if (m_i + sum == 0.0){
                    continue;
                }

                double term = (m_i * m_i * P_without_i) / (m_i + sum);
                conflictSum += term;
            }
        }

        return conflictSum;
    }

    private double getPCR5ConflictUntrustworthy(List<Evidence> evidenceSet, List<Combination> combinationSet){
        double conflictSum = 0;

        for(Combination combination : combinationSet){
            if(getIntersectionState(combination) != IntersectionState.EMPTY) {
                continue;
            }

            double prod = combination.massProduct;
            if(prod == 0) {
                continue;
            }

            for (Evidence evidence_i : evidenceSet) {
                String key_i = evidence_i.evidenceKey();
                if(combination.stateByKey.get(key_i) != State.UT) {
                    continue;
                }

                double m_i = evidence_i.untrustworthyMass();
                if(m_i == 0) {
                    continue;
                }

                double P_without_i = prod / m_i;

                double sum = 0;
                sum = getMassSum(evidenceSet, combination, key_i, sum);

                if(m_i + sum == 0) {
                    continue;
                }

                conflictSum += (m_i * m_i * P_without_i) / (m_i + sum);
            }
        }

        return conflictSum;
    }

    // fusion
    // pcr5
    private double[] pcr5 (List<Evidence> evidenceSet){
        if (evidenceSet == null || evidenceSet.isEmpty()) {
            throw new IllegalArgumentException("Evidence set is null or empty");
        }

        List<Combination> combinationSet = getCombinationSet(evidenceSet);

        double trustworthyMassCons  = getConjunctiveConsensusTrustworthy(combinationSet);
        double untrustworthyMassCons = getConjunctiveConsensusUntrustworthy(combinationSet);

        double trustworthyMassConf  = getPCR5ConflictTrustworthy(evidenceSet, combinationSet);
        double untrustworthyMassConf = getPCR5ConflictUntrustworthy(evidenceSet, combinationSet);

        double trustworthyMass = trustworthyMassCons + trustworthyMassConf;
        double untrustworthyMass = untrustworthyMassCons + untrustworthyMassConf;
        double uncertaintyMass = 1.0 - trustworthyMass - untrustworthyMass;
        return new double[]{ trustworthyMass, untrustworthyMass, uncertaintyMass };
    }

    public double[] getMasses(List<Evidence> evidenceSet) {
        return pcr5(evidenceSet);
    }

    public double getMachineTrustScore(List<Evidence> evidenceSet){
        double[] masses = getMasses(evidenceSet);
        double belief = masses[0]; // m(T)
        double plausibility = masses[0] + masses[2]; // m(T) + m(U)
        return (belief + plausibility)/2;
    }
}
