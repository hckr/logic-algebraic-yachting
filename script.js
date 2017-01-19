fetch('yachting.lamd').then(response => {
    if (response.ok) {
        response.text().then(text => {
            console.log('Parsing input...');
            let parsingResults = parseData(text);
            console.log('Done.')

            console.log('Looking for duplicates...');
            let allVarIds = flatten([ Object.keys(parsingResults['inputs']),
                                      Object.keys(parsingResults['outputs']),
                                      Object.keys(parsingResults['disruptions']),
                                      Object.keys(parsingResults['states']) ]);
                duplicates = findDuplicates(allVarIds);
            if (duplicates.length > 0) {
                throw new Error(`Found duplicated variable(s) across sections: ${duplicates.join(', ')}`);
            }
            console.log('Done.');

            console.log('Looking for undeclared variables in facts...');
            for (let factId in parsingResults['facts']) {
                let undeclaredVars = findUndeclaredVariables(parsingResults['facts'][factId], allVarIds);
                if (undeclaredVars.length > 0) {
                    throw new Error(`Found usage of undeclared variables in fact ${factId}: ${undeclaredVars.join(', ')}`);
                }
            }
            console.log('Done.');

            console.log('Interpreting facts...');
            let interpretedFacts = interpretFacts(parsingResults['facts']);
            console.log('Done.');

            console.log('Finding possible variables\' combinations');
            let possibleVarCombinations = findPossibleVarCombinationsByParts(interpretedFacts, 5);
            console.log('Done.');

            initializeFactEditor(document.getElementsByClassName('fact-editor')[0], Object.assign({}, parsingResults['inputs'], parsingResults['disruptions']), findErrorsInExpression, analysisTask);
            initializeFactEditor(document.getElementsByClassName('fact-editor')[1], Object.assign({}, parsingResults['outputs'], parsingResults['disruptions']), findErrorsInExpression, decisionMakingTask);

            function analysisTask(setResult, inputFactExpression) {
                let outputVarIds = Object.keys(parsingResults['outputs']),
                    interpretedInputFact = interpretFact(parseExpression(inputFactExpression + '.', '.')),
                    possibleCombinations = findPossibleVarCombinations({ 'IF1': interpretedInputFact }, possibleVarCombinations),
                    possibleOutputCombinations = filterCombinations(outputVarIds, possibleCombinations),
                    colTitles = outputVarIds.map(varId => `${varId}: ${parsingResults['outputs'][varId]}`);

                setResult(buildResultsTable(colTitles, possibleOutputCombinations));
            }

            function decisionMakingTask(setResult, outputFactExpression) {
                let inputVarIds = Object.keys(parsingResults['inputs']),
                    interpretedOutputFact = interpretFact(parseExpression(outputFactExpression + '.', '.')),
                    candidateCombinations = findPossibleVarCombinations({ 'OF1': interpretedOutputFact }, possibleVarCombinations),
                    candidateInputCombinations = filterCombinations(inputVarIds, candidateCombinations),
                    interpretedNegatedOutputFact = interpretFact(parseExpression('not (' + outputFactExpression + ').', '.')),
                    wrongCombinations = findPossibleVarCombinations({ 'OF1neg': interpretedNegatedOutputFact }, possibleVarCombinations),
                    wrongInputCombinations = filterCombinations(inputVarIds, wrongCombinations),
                    possibleInputCombinations = combinationsDifference(candidateInputCombinations, wrongInputCombinations),
                    colTitles = inputVarIds.map(varId => `${varId}: ${parsingResults['inputs'][varId]}`);

                setResult(buildResultsTable(colTitles, possibleInputCombinations));
            }
        });
    }
});

function filterCombinations(varIds, varCombinations) {
    let indices = varIds.map(varId => varCombinations['variables'].indexOf(varId)),

        combinationsWithoutDuplicates = Array.from(new Set(function*() {
            for (let combination of varCombinations['combinations']) {
                yield indices.map(i => combination[i] ? 1 : 0).join(',');
            }
        }())).map(c => c.split(','));

    return combinationsWithoutDuplicates;
}

function buildResultsTable(colTitles, varCombinations) {
    let titleRow = `<tr><td>${colTitles.join('</td><td>')}</td></tr>`,
        rows;

    if (varCombinations.length) {
        rows = varCombinations.map(c => `<tr><td>${c.join('</td><td>')}</td></tr>`).join('');
    } else {
        rows = `<tr><td colspan=${colTitles.length}>–</td></tr>`;
    }

    let table = `<table>${titleRow}${rows}</table>`;
    return table;
}

function combinationsDifference(source, toBeDeleted) {
    let sourceStrs = source.map(c => c.join(',')),
        toBeDeletedStrs = toBeDeleted.map(c => c.join(',')),
        resultStrs = sourceStrs.filter(c => toBeDeleted.indexOf(c) == -1);

    return resultStrs.map(c => c.split(','));
}
