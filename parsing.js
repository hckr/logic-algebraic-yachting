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

let parsers = {
    'inputs': parseVariables,
    'disruptions': parseVariables,
    'outputs': parseVariables,
    'states': parseVariables,
    'input-groups': parseGroups,
    'disruptions-groups': parseGroups,
    'output-groups': parseGroups
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
