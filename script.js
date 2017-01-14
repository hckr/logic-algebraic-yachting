let results; // outside for debugging purpose

fetch('test.lamd').then(response => {
    if (response.ok) {
        response.text().then(text => {
            console.log('Parsing input...');
            results = parseData(text);
            console.log('Done.')
            console.log('Looking for duplicates...');
            let allVarIds = Object.keys(results['inputs']).concat(Object.keys(results['outputs'])).concat(Object.keys(results['states'])),
                duplicates = findDuplicates(allVarIds);
            if (duplicates.length > 0) {
                throw new Error(`Found duplicated variable(s) across sections: ${duplicates.join(', ')}`);
            }
            let varIdsInAllGroups = [].concat.apply([], results['input-groups']),
                groupDuplicates = findDuplicates(varIdsInAllGroups);
            if (groupDuplicates.length > 0) {
                throw new Error(`Found variable(s) used multiple times in "input-groups" section: ${groupDuplicates.join(', ')}`);
            }
            console.log('Done.');
            console.log('Creating controls...')
            let inputWrapper = createControls(results, 'inputs', 'input-groups');
            document.body.appendChild(inputWrapper);
            inputWrapper.addEventListener('change', calculateOutputs);
            let outputWrapper = createControls(results, 'outputs', 'output-groups');
            document.body.appendChild(outputWrapper);
            inputWrapper.addEventListener('change', calculateInputs);
            console.log('Done.');
        });
    }
});

function parseData(text) {
    let groups = text.split('\n\n'),
        results = {};
    for (let group of groups) {
        let lines = group.split('\n').map(l => l.trim()),
            sectionName = lines.shift().replace(/:$/, '');
        results[sectionName] = parseSection(sectionName, lines);
    }
    return results;
}

function findDuplicates(elements) {
    elements = elements.concat(); // copy array
    elements.sort();
    let duplicates = [];
    for (let i = 1; i < elements.length; ++i) {
        if (elements[i-1] == elements[i]) {
            duplicates.push(elements[i]);
        }
    }
    return duplicates;
}

function createControls(results, sectionName, groupSectionName) {
    let wrapper = document.createElement('div');
    wrapper.className = '${sectionName}-wrapper';
    let currentRadioGroupNr = 1,
        groupedVariables = [];
    if (Object.keys(results).indexOf(groupSectionName) != -1) {
        results[groupSectionName].map(group => {
            let groupWrapper = document.createElement('div');
            groupWrapper.className = 'group-wrapper';
            let radioGroupName = `${groupSectionName}-${currentRadioGroupNr}`;
            group.map((varId, index) => {
                if (Object.keys(results[sectionName]).indexOf(varId) == -1) {
                    throw new Error(`Found undeclared input variable ${varId} in section "${groupSectionName}".`);
                }
                let label = document.createElement('label');
                label.innerHTML = `<input type="radio" name="${radioGroupName}"
                                          id="${varId}" ${index == 0 ? 'checked' : ''}>
                                   ${results[sectionName][varId]}`;
                groupWrapper.appendChild(label);
                groupedVariables.push(varId);
            });
            wrapper.appendChild(groupWrapper);
            ++currentRadioGroupNr;
        });
    }
    for (let varId in results[sectionName]) {
        if (groupedVariables.indexOf(varId) != -1) {
            continue;
        }
        let label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" id="${varId}"> ${results[sectionName][varId]}`;
        wrapper.appendChild(label);
    }
    return wrapper;
}

function calculateOutputs() {
    console.log('TODO');
}

function calculateInputs() {
    console.log('TODO');
}

let parsers = {
    'inputs': parseVariables,
    'outputs': parseVariables,
    'states': parseVariables,
    'input-groups': parseGroups
};

function parseSection(sectionName, lines) {
    if (sectionName in parsers) {
        try {
            return parsers[sectionName](lines);
        } catch(duplicatedId) {
            throw new Error(`Found duplicated variable id "${duplicatedId}" in section "${sectionName}".`);
        }
    } else {
        console.warn(`Could not find parser for section "${sectionName}".`);
    }
}

function parseVariables(lines) {
    let variables = {};
    lines.map(line => {
        let [id, name] = line.split(':').map(l => l.trim());
        if (Object.keys(variables).indexOf(id) != -1) {
            throw id;
        }
        variables[id] = name;
    });
    return variables;
}

function parseGroups(lines) {
    return lines.map(line => line.split(',').map(l => l.trim()));
}
