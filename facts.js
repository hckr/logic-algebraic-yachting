function* allBinaryCombinations(variablesCount) {
    for (let i = 0, lim = (1 << variablesCount); i < lim; ++i) {
        let combination = [];
        for (let j = variablesCount; j--;) {
            combination.push(!!((i >> j) & 1));
        }
        yield combination;
    }
}

function findPossibleVarCombinationsWithDecomposition(interpretedFacts, groupSize) {
    let factIds = Object.keys(interpretedFacts),
        factsCount = factIds.length,
        previousData;

    for (let i = 0; i < factsCount; i += groupSize) {
        let factIdsInGroup = factIds.slice(i, i + groupSize),
            group = createGroupOfFacts(interpretedFacts, factIdsInGroup);
        previousData = findPossibleVarCombinations(group, previousData);
    }

    return previousData;
}

function createGroupOfFacts(interpretedFacts, factIds) {
    let group = {};
    for (let factId of factIds) {
        group[factId] = interpretedFacts[factId];
    }
    return group;
}

function findPossibleVarCombinations(interpretedFacts, previousData) {
    previousData = previousData || { 'variables': [], 'combinations': [] };
    let variablesInCurrentFacts = Array.from(new Set(function*() {
            for (let factId in interpretedFacts) yield* interpretedFacts[factId].variables }())),
        newVariables = variablesInCurrentFacts.filter(v => previousData['variables'].indexOf(v) == -1),
        allVariables = previousData['variables'].concat(newVariables),
        possibleCombinations = [],
        previousDataCombinationsIndex = 0;
        prefix = previousData['combinations'][previousDataCombinationsIndex] || [];

    do {
        for (let newValues of allBinaryCombinations(newVariables.length)) {
            let allFactsTrue = true,
                values = prefix.concat(newValues),
                varObj = createVarObj(allVariables, values);
            for (let factId in interpretedFacts) {
                if (!interpretedFacts[factId].evaluate(varObj)) {
                    allFactsTrue = false;
                    break;
                }
            }
            if (allFactsTrue) {
                possibleCombinations.push(values);
            }
        }
        ++previousDataCombinationsIndex;
        prefix = previousData['combinations'][previousDataCombinationsIndex];
    } while (previousDataCombinationsIndex < previousData['combinations'].length);

    return {
        'variables': allVariables,
        'combinations': possibleCombinations
    };
}

function createVarObj(variables, values) {
    let obj = {};
    variables.forEach((v, i) => obj[v] = values[i]);
    return obj;
}
