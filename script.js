let results; // outside for debugging purpose

fetch('test.lamd').then(response => {
    if (response.ok) {
        response.text().then(text => {
            results = parseData(text);
            let inputWrapper = createInputControls(results);
            document.body.appendChild(inputWrapper);
            inputWrapper.addEventListener('change', recalculateOutputs);
        });
    }
});

function parseData(text) {
    let groups = text.split('\n\n'),
        results = {};
    for (let group of groups) {
        let lines = group.split('\n').map(l => l.trim()),
            groupName = lines.shift().replace(/:$/, '');
        results[groupName] = parseGroup(groupName, lines);
    }
    return results;
}

function createInputControls(results) {
    let wrapper = document.createElement('div');
    wrapper.className = 'input-controls';
    let currentRadioGroupNr = 1,
        groupedVariables = [];
    results['input-groups'].map(group => {
        let groupWrapper = document.createElement('div');
        groupWrapper.className = 'group-wrapper';
        let radioGroupName = 'group-' + currentRadioGroupNr;
        group.map(varId => {
            if (groupedVariables.indexOf(varId) != -1) {
                throw new Error(`Found duplicated variable ${varId} in input-groups section.`);
            }
            if (Object.keys(results['inputs']).indexOf(varId) == -1) {
                throw new Error(`Found undeclared input variable ${varId} in input-groups section.`);
            }
            let label = document.createElement('label');
            label.innerHTML = `<input type="radio" name="${radioGroupName}"
                                      id="${varId}">${results['inputs'][varId]}`;
            groupWrapper.appendChild(label);
            groupedVariables.push(varId);
        });
        groupWrapper.firstChild.firstChild.checked = true;
        wrapper.appendChild(groupWrapper);
        ++currentRadioGroupNr;
    });
    let processedInputVariables = [];
    for (let varId in results['inputs']) {
        if (processedInputVariables.indexOf(varId) != -1) {
            throw new Error(`Found duplicated variable ${varId} in inputs section.`);
        }
        processedInputVariables.push(varId);
        if (groupedVariables.indexOf(varId) != -1) {
            continue;
        }
        let label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" id="${varId}"> ${results['inputs'][varId]}`;
        wrapper.appendChild(label);
    }
    return wrapper;
}

function recalculateOutputs() {
    console.log('TODO');
}

let parsers = {
    'inputs': parseVariables,
    'outputs': parseVariables,
    'states': parseVariables,
    'input-groups': parseGroups
};

function parseGroup(groupName, lines) {
    if (groupName in parsers) {
        return parsers[groupName](lines);
    } else {
        console.warn(`Could not find parser for "${groupName}" group.`);
    }
}

function parseVariables(lines) {
    let variables = {};
    lines.map(line => {
        let [id, name] = line.split(':').map(l => l.trim());
        variables[id] = name;
    });
    return variables;
}

function parseGroups(lines) {
    return lines.map(line => line.split(',').map(l => l.trim()));
}
