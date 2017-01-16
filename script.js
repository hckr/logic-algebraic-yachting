let results, interpretedFacts; // outside for debugging purpose

fetch('test.lamd').then(response => {
    if (response.ok) {
        response.text().then(text => {
            console.log('Parsing input...');
            results = parseData(text);
            let allGroups = [ results['input-groups'],
                              results['output-groups'],
                              results['disruptions-groups'] ];
            Object.assign(results['facts'], parseFacts(generateFactsArrayFromGroups(flatten(allGroups))));
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
            let varIdsInAllGroups = flatten(allGroups, 2),
                groupDuplicates = findDuplicates(varIdsInAllGroups);
            if (groupDuplicates.length > 0) {
                throw new Error(`Found variable(s) used multiple times in "*-groups" sections: ${groupDuplicates.join(', ')}`);
            }
            console.log('Done.');
            interpretedFacts = interpretFacts(results['facts']);
            function tempCb(fact) {
                console.log(fact);
            }
            initializeFactEditor(document.getElementsByClassName('fact-editor')[0], results['inputs'], findErrorsInExpression, tempCb);
            initializeFactEditor(document.getElementsByClassName('fact-editor')[1], results['outputs'], findErrorsInExpression, tempCb);
        });
    }
});
