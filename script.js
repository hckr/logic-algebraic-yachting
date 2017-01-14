let results; // outside for debugging purpose

fetch('test.lamd').then(response => {
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
            let varIdsInAllGroups = flatten([ results['input-groups'],
                                              results['output-groups'],
                                              results['disruptions-groups'] ], 2),
                groupDuplicates = findDuplicates(varIdsInAllGroups);
            if (groupDuplicates.length > 0) {
                throw new Error(`Found variable(s) used multiple times in "*-groups" sections: ${groupDuplicates.join(', ')}`);
            }
            console.log('Done.');
            console.log('Creating controls...')
            let inputWrapper = createControls(results, 'inputs', 'input-groups'),
                inputParent = document.getElementById('inputToOutputForm');
            inputParent.insertBefore(inputWrapper, inputParent.querySelector('.header').nextSibling);
            inputWrapper.addEventListener('change', calculateOutputs);
            let disruptionsWrapper = createControls(results, 'disruptions', 'disruptions-groups'),
                disruptionsParent = document.getElementById('disruptionsForm');
            disruptionsParent.insertBefore(disruptionsWrapper, disruptionsParent.querySelector('.header').nextSibling);
            let outputWrapper = createControls(results, 'outputs', 'output-groups'),
                outputParent = document.getElementById('outputToInputForm');
            outputParent.insertBefore(outputWrapper, outputParent.querySelector('.header').nextSibling);
            outputWrapper.addEventListener('change', calculateInputs);
            console.log('Done.');
        });
    }
});

function calculateOutputs() {
    console.log('TODO');
}

function calculateInputs() {
    console.log('TODO');
}
