const Keywords = [ 'if', 'then', 'and', 'or', 'xor', 'not' ];
let   keywordsTranslations = []; // same order as above
const BeginningKeywords = [ 'if', 'not' ];

function setKeywordsTranslations(translations) {
    if (translations) {
        keywordsTranslations = translations;
    }
}

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
    'facts': parseFacts
};

function parseSection(sectionName, lines) {
    if (sectionName in parsers) {
        try {
            return parsers[sectionName](lines);
        } catch(e) {
            if (e instanceof Error) {
                throw e;
            }
            let duplicatedId = e;
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

function parseFacts(lines) {
    let facts = {};
    lines.forEach(line => {
        let [id, expression] = line.split(':').map(s => s.trim());
        if(expression == undefined) {
            throw new Error('Found fact without id or expression!');
        }
        if (Object.keys(facts).indexOf(id) != -1) {
            throw id;
        }
        if (!expression.match(/\.$/)) {
            throw new Error(`Fact ${id} does not end with a dot!`);
        }
        try {
            facts[id] = parseExpression(expression, '.');
        } catch (e) {
            throw new Error(`${id}: ${e.message}`);
        }
    });
    return facts;
}

function parseExpression(expr, endsWith) {
    let left = expr.match(/\(/g),
        leftCount = left ? left.length : 0,
        right = expr.match(/\)/g),
        rightCount = right ? right.length : 0;
    if (leftCount != rightCount) {
        let err = new Error('Parantheses do not match!'),
            rightmostRightPos = expr.lastIndexOf(')');
        err.tokenStart = rightmostRightPos > -1 ? rightmostRightPos : expr.indexOf('(');
        err.tokenEnd = err.tokenStart + 1;
        throw err;
    }
    return parseEx(expr, endsWith, 0)[0];

    function parseEx(expr, endsWith, skippedLen) {
        let tokens = [],
            pos = 0,
            len = expr.length,
            loop = true,
            previousType,
            expressionKeyword;

        function addToken(token) {
            let err;
            if (previousType == 'variable' && token.type != 'keyword' ||
                    previousType == 'subExpression' && token.type != 'keyword' ||
                    previousType == 'keyword' && token.type == 'keyword' ||
                    previousType == undefined && token.type == 'keyword' && BeginningKeywords.indexOf(token.value) == -1) {
                console.log(token);
                err = new Error(`Unexpected ${token.type} ${previousType ? `after ${previousType}` : 'on the beginning of (sub)expression'} (position: ${skippedLen + token.pos}).`);
            }
            if (token.type == 'keyword') {
                if (expressionKeyword && token.value != expressionKeyword) {
                    if (!(expressionKeyword == 'if' && token.value == 'then')) {
                        err = new Error('Each (sub)expression can contain only one type of keyword! Use parantheses to group expressions.');
                    }
                }
                expressionKeyword = token.value;
            }
            if (err) {
                err.tokenStart = token.pos;
                err.tokenEnd = token.pos + token.length;
                throw err;
            }
            tokens.push(token);
            previousType = token.type;
        }

        while (loop && pos < len) {
            if (expr[pos] == ' ') {
                pos += 1;
                continue;
            }
            if (expr[pos] == '(') {
                pos += 1;
                let [subTokens, innerPos] = parseEx(expr.slice(pos), ')', pos);
                if (subTokens.length == 1 && subTokens[0].type == 'variable') {
                    addToken({
                        type: 'variable',
                        value: subTokens[0].value,
                        pos: skippedLen + pos - 1,
                        length: innerPos + 1
                    });
                } else {
                    addToken({
                        type: 'subExpression',
                        value: subTokens,
                        pos: skippedLen + pos - 1,
                        length: innerPos + 1
                    });
                }
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
                let keywordValue = getKeywordValue(word);
                if (keywordValue) {
                    addToken({
                        type: 'keyword',
                        value: keywordValue,
                        pos: skippedLen + pos,
                        length: word.length
                    });
                } else {
                    addToken({
                        type: 'variable',
                        value: word,
                        pos: skippedLen + pos,
                        length: word.length
                    });
                }
            }
            pos = nextDelimPos + 1;
        }

        if (previousType == 'keyword') {
            let err = new Error('Expression cannot end with a keyword!'),
                token = tokens[tokens.length - 1];
            err.tokenStart = token.pos;
            err.tokenEnd = token.pos + token.length;
            throw err;
        }

        return [tokens, pos];
    }
}

function getKeywordValue(word) {
    word = word.toLowerCase();
    let index = Keywords.indexOf(word);
    if (index > -1) {
        return word;
    }
    index = keywordsTranslations.indexOf(word);
    if (index > -1) {
        return Keywords[index];
    }
    return false;
}
