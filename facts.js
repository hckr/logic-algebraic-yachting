function generateFactsArrayFromGroups(groups) {
    return groups.map((group, index) => `GF${index}: ${group.join(' xor ')}.`);
}

function* allBinaryCombinations(variablesCount) {
    for (let i = 0, lim = (1 << variablesCount); i < lim; ++i) {
        let combination = [];
        for (let j = variablesCount; j--;) {
            combination.push(!!((i >> j) & 1));
        }
        yield combination;
    }
}

function createVarObj(variables, values) {
    let obj = {};
    variables.forEach((v, i) => obj[v] = values[i]);
    return obj;
}

function findPossibleVarCombinations(interpretedFacts) {
    let allVariables = Array.from(new Set(function*() {
            for (let factId in interpretedFacts) yield* interpretedFacts[factId].variables }()));
        possibleCombinations = [];
    for (let values of allBinaryCombinations(allVariables.length)) {
        let allFactsTrue = true;
        for (let factId in interpretedFacts) {
            if (!interpretedFacts[factId].evaluate(createVarObj(allVariables, values))) {
                allFactsTrue = false;
                break;
            }
        }
        if (allFactsTrue) {
            possibleCombinations.push(values);
        }
    }
    return [ allVariables, possibleCombinations ];
}
