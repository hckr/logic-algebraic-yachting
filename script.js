let results, interpretedFacts; // outside for debugging purpose

fetch('test2.lamd').then(response => {
    if (response.ok) {
        response.text().then(text => {
            console.log('Parsing input...');
            results = parseData(text);
            console.log('Done.')
            console.log('Looking for duplicates...');
            let allVarIds = flatten([ Object.keys(results['inputs']),
                                      Object.keys(results['outputs']),
                                      Object.keys(results['disruptions']),
                                      Object.keys(results['states']) ]);
                duplicates = findDuplicates(allVarIds);
            if (duplicates.length > 0) {
                throw new Error(`Found duplicated variable(s) across sections: ${duplicates.join(', ')}`);
            }
            console.log('Done.');
            console.log('Looking for undeclared variables in facts...');
            for (let factId in results['facts']) {
                let undeclaredVars = findUndeclaredVariables(results['facts'][factId], allVarIds);
                if (undeclaredVars.length > 0) {
                    throw new Error(`Found usage of undeclared variables in fact ${factId}: ${undeclaredVars.join(', ')}`);
                }
            }
            console.log('Done.');
            console.log('Interpreting facts...');
            interpretedFacts = interpretFacts(results['facts']);
            console.log('Done.');
            console.log('Finding possible variables\' combinations');
            let possibleVarCombinations = findPossibleVarCombinationsWithDecomposition(interpretedFacts, 5);
            console.log('Done.');
            function tempCb(fact) {
                console.log(fact);
            }
            initializeFactEditor(document.getElementsByClassName('fact-editor')[0], results['inputs'], findErrorsInExpression, analysisTask.bind(null, possibleVarCombinations));
            initializeFactEditor(document.getElementsByClassName('fact-editor')[1], results['outputs'], findErrorsInExpression, tempCb);
        });
    }
});

function analysisTask(possibleVarCombinations, inputFactExpression) {
    setTimeout(() => {
        let interpretedInputFact = interpretFact(parseExpression(inputFactExpression + '.', '.'));
        let res = findPossibleVarCombinations({ 'IF1': interpretedInputFact }, possibleVarCombinations);
        console.log(res);
        document.getElementById('result').innerHTML = res['variables'] + '<br>' + res['combinations'].map(c => c.join(', ')).join('<br>');
    }, 4);
}
