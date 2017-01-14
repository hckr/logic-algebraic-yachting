function createControls(results, sectionName, groupSectionName) {
    let wrapper = document.createElement('div');
    wrapper.className = `${sectionName}-wrapper`;
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
