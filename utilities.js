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

function flatten(array, iter) {
    if (iter == undefined) {
        iter = 1;
    }
    let result = array;
    while (iter--) {
        result = [].concat(...result);
    }
    return result;
}

function findErrorsInExpression(expr) {
    try {
        let tokens = parseExpression(expr + '.', '.')[0],
            undeclaredPos = findFirstUndeclaredVariable(tokens, ['?']);
        if (undeclaredPos) {
            console.error('Use "?" instead of variable names!');
        }
        return undeclaredPos;
    } catch(e) {
        console.error(e);
        return e;
    }
}

function findFirstUndeclaredVariable(tokens, declaredVars) {
    for (let token of tokens) {
        switch (token.type) {
            case 'variable':
                if (declaredVars.indexOf(token.value) == -1) {
                    return {
                        'tokenStart': token.pos,
                        'tokenEnd': token.pos + token.length
                    };
                }
                break;
            case 'subExpression':
                let result = findFirstUndeclaredVariable(token.value, declaredVars);
                if (result != null) {
                    return result;
                }
                break;
        }
    }
    return null;
}
