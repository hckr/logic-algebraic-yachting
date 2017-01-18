function initializeFactEditor(editor, variables, findErrorsInExpression, factReadyCallback) {
    let entry = editor.getElementsByClassName('fact-entry')[0],
        form = editor.getElementsByTagName('form')[0],
        button = editor.getElementsByTagName('button')[0],
        result = editor.getElementsByClassName('result')[0];

    function setResult(r) {
        result.innerHTML = r;
    }

    let fitEntrySize = fitSize.bind(entry, () => entry.value.length + 3, 18);
    fitEntrySize();
    entry.addEventListener('keydown', fitEntrySize);

    entry.focus();
    entry.selectionStart = entry.value.length;

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
        let error = findErrorsInExpression(entry.value);
        if (entry.value.match(/\?/) && error == null) {
            entry.classList.remove('error');
            editor.style.opacity = 0;
            button.disabled = true;
        } else {
            entry.classList.add('error');
            entry.focus();
            if (error) {
                entry.selectionStart = error.tokenStart;
                entry.selectionEnd = error.tokenEnd;
            }
        }
    });

    entry.addEventListener('keypress', e => e.keyCode == 13 && button.click());
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
