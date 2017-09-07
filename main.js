function main(dbFileName, dictionary) {

    function getTranslation(phrase) {
        return dictionary[phrase] || phrase;
    }

    fetch(dbFileName).then(response => {
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

                initializeFactEditor(document.getElementsByClassName('fact-editor')[0], Object.assign({}, parsingResults['inputs'], parsingResults['disruptions']), findErrorsInExpression, analysisTask, getTranslation);
                initializeFactEditor(document.getElementsByClassName('fact-editor')[1], parsingResults['outputs'], findErrorsInExpression, decisionMakingTask, getTranslation);

                function analysisTask(setResult, inputFactExpression) {
                    let outputVarIds = Object.keys(parsingResults['outputs']),
                        interpretedInputFact = interpretFact(parseExpression(inputFactExpression + '.', '.')),
                        possibleCombinations = findPossibleVarCombinations({ 'IF1': interpretedInputFact }, possibleVarCombinations),
                        possibleOutputCombinations = filterCombinations(outputVarIds, possibleCombinations);

                    setResult(parsingResults['outputs'], possibleOutputCombinations);
                }

                function decisionMakingTask(setResult, outputFactExpression) {
                    let inputVarIds = Object.keys(parsingResults['inputs']),
                        interpretedOutputFact = interpretFact(parseExpression(outputFactExpression + '.', '.')),
                        candidateCombinations = findPossibleVarCombinations({ 'OF1': interpretedOutputFact }, possibleVarCombinations),
                        candidateInputCombinations = filterCombinations(inputVarIds, candidateCombinations),
                        interpretedNegatedOutputFact = interpretFact(parseExpression('not (' + outputFactExpression + ').', '.')),
                        wrongCombinations = findPossibleVarCombinations({ 'OF1neg': interpretedNegatedOutputFact }, possibleVarCombinations),
                        wrongInputCombinations = filterCombinations(inputVarIds, wrongCombinations),
                        possibleInputCombinations = combinationsDifference(candidateInputCombinations, wrongInputCombinations);

                    setResult(parsingResults['inputs'], possibleInputCombinations);
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

    function combinationsDifference(source, toBeDeleted) {
        let sourceStrs = source.map(c => c.join(',')),
            toBeDeletedStrs = toBeDeleted.map(c => c.join(',')),
            resultStrs = sourceStrs.filter(c => toBeDeleted.indexOf(c) == -1);

        return resultStrs.map(c => c.split(','));
    }

    let tutorial = document.getElementsByClassName('tutorial')[0],
        tutorialWrapper = document.getElementsByClassName('tutorial-wrapper')[0],
        tutorialButton = document.querySelector('.description button');

    tutorialButton.addEventListener('click', () => {
        let oldText = tutorialButton.innerHTML;
        tutorialButton.innerHTML = tutorialButton.getAttribute('data-toggle');
        tutorialButton.setAttribute('data-toggle', oldText);
        tutorialWrapper.style.height = tutorial.clientHeight + 'px';
        setTimeout(() => tutorialWrapper.classList.toggle('hidden'), 50);
    });

    tutorialWrapper.addEventListener('transitionend', () => {
        tutorialWrapper.style.height = 'auto';
    });
}
