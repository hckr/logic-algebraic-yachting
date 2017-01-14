function parseData(text) {
    let lines = text.split('\n').map(s => s.trim()),
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
    if (currentSectionName) {
        results[currentSectionName] =
            parseSection(currentSectionName,
                lines.slice(currentSectionStartIndex + 1).filter(l => l.length != 0));
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
    'output-groups': parseGroups,
    'facts': parseFacts
};

function parseSection(sectionName, lines) {
    if (sectionName in parsers) {
        try {
            return parsers[sectionName](lines);
        } catch(duplicatedId) {
            throw new Error(`Found duplicated id "${duplicatedId}" in section "${sectionName}".`);
        }
    } else {
        console.warn(`Could not find parser for section "${sectionName}".`);
    }
}

function parseVariables(lines) {
    let variables = {};
    lines.forEach(line => {
        let [id, name] = line.split(':').map(s => s.trim());
        if (Object.keys(variables).indexOf(id) != -1) {
            throw id;
        }
        variables[id] = name;
    });
    return variables;
}

function parseGroups(lines) {
    return lines.map(line => line.split(',').map(s => s.trim()));
}

function parseFacts(lines) {
    let facts = {};
    lines.forEach(line => {
        let [id, expression] = line.split(':').map(s => s.trim());
        if (Object.keys(facts).indexOf(id) != -1) {
            throw id;
        }
        if (!expression.match(/.$/)) {
            throw new Error(`Fact ${id} does not end with a dot!`);
        }
        facts[id] = parseExpression(expression.replace(/\s/, ' '), '.')[0];
    });
    return facts;
}

function parseExpression(expr, endsWith) {
    let tokens = [],
        pos = 0,
        len = expr.length,
        loop = true;
    while (loop && pos < len) {
        if (expr[pos] == ' ') {
            pos += 1;
            continue;
        }
        if (expr[pos] == '(') {
            pos += 1;
            let [subTokens, innerPos] = parseExpression(expr.slice(pos), ')');
            if (subTokens.length == 1 && subTokens[0].type == 'variable') {
                subTokens = subTokens[0];
            }
            tokens.push(subTokens);
            pos += innerPos;
            continue;
        }
        let nextSpacePos = expr.indexOf(' ', pos),
            endPos = expr.indexOf(endsWith, pos),
            nextDelimPos;
        if (nextSpacePos > 0 && nextSpacePos < endPos) {
            nextDelimPos = nextSpacePos;
        } else {
            loop = false;
            nextDelimPos = endPos;
        }
        let word = expr.slice(pos, nextDelimPos);
        if (word.length > 0) {
            let token,
                keywordValue = getKeywordValue(word);
            if (keywordValue) {
                token = {
                    type: 'keyword',
                    value: keywordValue
                };
            } else {
                token = {
                    type: 'variable',
                    value: word
                };
            }
            tokens.push(token);
        }
        pos = nextDelimPos + 1;
    }
    return [tokens, pos];
}

const KeywordsPL = {
    'jeżeli': 'if',
    'to': 'then',
    'i': 'and',
    'lub': 'or',
    'albo': 'xor'
};

function getKeywordValue(word) {
    if (Object.keys(KeywordsPL).indexOf(word.toLowerCase())) {
        return KeywordsPL[word];
    }
    return false;
}
