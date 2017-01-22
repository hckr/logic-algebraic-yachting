function initializeFactEditor(editor, variables, findErrorsInExpression, factReadyCallback) {
    let entry = editor.getElementsByClassName('fact-entry')[0],
        form = editor.getElementsByTagName('form')[0],
        button = editor.getElementsByTagName('button')[0],
        result = editor.getElementsByClassName('result')[0];

    let fitEntrySize = fitSize.bind(entry, () => entry.value.length + 3, 18);
    fitEntrySize();
    entry.addEventListener('keydown', fitEntrySize);

    // entry.focus();
    // entry.selectionStart = entry.value.length;

    let formVisible = false;

    let selectHtmlArr = [ '<select><option>?</option>' ];
    for (let varId in variables) {
        selectHtmlArr.push(`<option value="${varId}">${varId}: ${variables[varId]}</option>`);
    }
    selectHtmlArr.push('</select>');
    let selectHtml = selectHtmlArr.join('');

    editor.addEventListener('transitionend', function(e) {
        if (e.target != editor) {
            return;
        }
        if (this.style.opacity == 0) {
            let prevText = button.innerHTML;
            button.innerHTML = button.getAttribute('data-toggle');
            button.setAttribute('data-toggle', prevText);

            if (formVisible) {
                result.innerHTML = '';
                form.classList.add('hidden');
                entry.classList.remove('hidden');
                entry.focus();
                formVisible = false;
            } else {
                form.innerHTML = entry.value.replace(/\?/g, selectHtml);
                let allSelects = form.querySelectorAll('select');
                allSelects.forEach(s => {
                    let fitSelectSize = fitSize.bind(s, () => s.options[s.selectedIndex].text.length + 2, 14);
                    fitSelectSize();
                    s.addEventListener('change', fitSelectSize);
                    s.addEventListener('change', () => result.innerHTML = '');
                    s.addEventListener('change', () => setTimeout(
                        ifFactReadyThenCall.bind(this, entry, allSelects, factReadyCallback.bind(this, setResult))));
                });
                entry.classList.add('hidden');
                form.classList.remove('hidden');
                form.querySelector('select').focus();
                formVisible = true;
            }
            this.style.opacity = 1;
        } else {
            button.disabled = false;
        }
    });

    button.addEventListener('click', function() {
        if (!formVisible) {
            let error = findErrorsInExpression(entry.value);
            if (entry.value.match(/\?/) && error == null) {
                entry.classList.remove('error');
                editor.style.opacity = 0; // triggers event
                button.disabled = true;
            } else {
                entry.classList.add('error');
                entry.focus();
                if (error) {
                    entry.selectionStart = error.tokenStart;
                    entry.selectionEnd = error.tokenEnd;
                }
            }
        } else {
            editor.style.opacity = 0; // triggers event
        }
    });

    entry.addEventListener('keypress', e => e.keyCode == 13 && button.click());

    function setResult(variables, possibleCombinations) {
        let colTitles = Object.keys(variables).map(varId => `${varId}: ${variables[varId]}`),
            tableHtml = buildResultsTable(colTitles, possibleCombinations),
            sentencesHtml = buildResultSentencesInPolish(Object.keys(variables), possibleCombinations);
        result.innerHTML = tableHtml + sentencesHtml;

        if (possibleCombinations.length) {
            let table = result.getElementsByTagName('table')[0],
                sentences = result.getElementsByClassName('sentences')[0],
                button = document.createElement('button'),
                tableHidden = true;
            button.className = 'show-table';
            button.innerHTML = 'pokaż tabelę';
            button.addEventListener('click', () => {
                tableHidden = false;
                sentences.style.marginTop = '0';
                button.parentNode.removeChild(button);
            });

            setSizes();
            window.addEventListener('resize', setSizes);

            result.appendChild(button);

            function setSizes() {
                let tableWidth = table.clientWidth,
                    tableHeight = table.clientHeight,
                    headerHeight = table.getElementsByTagName('td')[0].clientHeight;
                sentences.classList.remove('transition');
                if (tableHidden) {
                    sentences.style.marginTop = `-${tableHeight - headerHeight - 3}px`;
                }
                sentences.style.width = tableWidth + 'px';
                button.style.top = `${headerHeight + 10}px`;
                button.style.left = `${tableWidth / 2 - 65}px`;
                setTimeout(() => sentences.classList.add('transition'));
            }
        }
    }
}

function fitSize(getTextLen, fontWidth) {
    setTimeout(() => this.style.width = (getTextLen() * fontWidth) + 'px', 4);
}

function ifFactReadyThenCall(entry, allSelects, callback) {
    if ([].every.call(this.querySelectorAll('select'), s => s.selectedIndex > 0)) {
        let index = 0;
        callback(entry.value.replace(/\?/g, () => allSelects[index++].value));
    }
}

function buildResultsTable(colTitles, varCombinations) {
    let titleRow = `<tr><td>${colTitles.join('</td><td>')}</td></tr>`,
        rows;

    if (varCombinations.length) {
        rows = varCombinations.map(c => `<tr><td>${c.join('</td><td>')}</td></tr>`).join('');
    } else {
        rows = `<tr><td colspan=${colTitles.length}>–</td></tr>`;
    }

    let table = `<table>${titleRow}${rows}</table>`;
    return table;
}

function buildResultSentencesInPolish(varIds, varCombinations) {
    let sentences = '<div class="sentences">';
    if (varCombinations.length) {
        sentences += varCombinations.map(c => {
            let sentence = '(';
            sentence += c.map((v, i) => {
                let variable = varIds[i];
                if (v == 0) {
                    variable = `(nie ${variable})`;
                }
                return variable;
            }).join(' <b>i</b> ');
            return sentence + ')';
        }).join('<br><b>lub</b><br>');
    }
    return sentences + '</div>';
}
