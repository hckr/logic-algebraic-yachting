function parseData(text) {
    let lines = text.split('\n').map(l => l.trim()),
        results = {},
        currentSectionName,
        currentSectionStartIndex;
    for (let i = 0, len = lines.length; i < len; ++i) {
        let line = lines[i];
        if (line.length == 0) {
            continue;
        }
        if (line.match(/:$/)) {
            let newSectionName = line.replace(/:$/, '');
            if (Object.keys(results).indexOf(newSectionName) != -1 ||
                    currentSectionName == newSectionName) {
                throw new Error(`Found duplicated section "${newSectionName}" at line ${i + 1}`)
            }
            if (currentSectionName) {
                results[currentSectionName] =
                    parseSection(currentSectionName,
                        lines.slice(currentSectionStartIndex + 1, i).filter(l => l.length != 0));
            }
            currentSectionName = newSectionName;
            currentSectionStartIndex = i;
        }
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
    lines.forEach(line => {
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
