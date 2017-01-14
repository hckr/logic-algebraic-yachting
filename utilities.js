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
