// Mnoziny - Kapitola 2: Mnozinove vztahy

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initNavbarScroll();
    initInclusionBuilder();
    initRelationQuiz();
    initEqualityChecker();
    initEqualityQuiz();
    typeset();
});

function typeset(target) {
    if (!window.MathJax || typeof window.MathJax.typesetPromise !== 'function') {
        return;
    }

    const payload = target ? [target] : undefined;
    window.MathJax.typesetPromise(payload).catch(() => {
        // Ignore transient MathJax render errors.
    });
}

function initNavigation() {
    const sectionOrder = [
        'podmnozina-mnoziny-inkluze',
        'rovnost-mnozin'
    ];

    const sections = document.querySelectorAll('.lesson-section');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const nextButtons = document.querySelectorAll('.btn-next');
    const prevButtons = document.querySelectorAll('.btn-prev');
    const progressBar = document.querySelector('.progress-fill-small');

    function updateProgress(sectionId) {
        if (!progressBar) {
            return;
        }

        const index = sectionOrder.indexOf(sectionId);
        const progress = index >= 0 ? ((index + 1) / sectionOrder.length) * 100 : 0;
        progressBar.style.width = `${progress}%`;
    }

    function showSection(sectionId, smooth = true) {
        const targetSection = document.getElementById(sectionId);
        if (!targetSection) {
            return;
        }

        sections.forEach(section => section.classList.remove('active'));
        sidebarLinks.forEach(link => link.classList.remove('active'));

        targetSection.classList.add('active');

        const targetLink = document.querySelector(`[data-section="${sectionId}"]`);
        if (targetLink) {
            targetLink.classList.add('active');
        }

        updateProgress(sectionId);
        window.history.replaceState(null, '', `#${sectionId}`);

        if (smooth) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        typeset(targetSection);
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            showSection(link.dataset.section);
        });
    });

    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            showSection(button.dataset.next);
        });
    });

    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            showSection(button.dataset.prev);
        });
    });

    const initialHash = window.location.hash.replace('#', '');
    const initialSection = sectionOrder.includes(initialHash) ? initialHash : sectionOrder[0];
    showSection(initialSection, false);
}

function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) {
        return;
    }

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 10, 15, 0.95)';
        } else {
            navbar.style.background = 'rgba(10, 10, 15, 0.8)';
        }
    });
}

function initInclusionBuilder() {
    const aContainer = document.getElementById('subsetAElements');
    const bContainer = document.getElementById('subsetBElements');
    const displayA = document.getElementById('subsetDisplayA');
    const displayB = document.getElementById('subsetDisplayB');
    const relationEl = document.getElementById('subsetRelation');
    const explanationEl = document.getElementById('subsetExplanation');
    const diffAEl = document.getElementById('subsetDiffA');
    const diffBEl = document.getElementById('subsetDiffB');
    const preset1Btn = document.getElementById('subsetPreset1Btn');
    const preset2Btn = document.getElementById('subsetPreset2Btn');
    const preset3Btn = document.getElementById('subsetPreset3Btn');
    const resetBtn = document.getElementById('subsetResetBtn');

    if (!aContainer || !bContainer || !displayA || !displayB || !relationEl || !explanationEl || !diffAEl || !diffBEl || !preset1Btn || !preset2Btn || !preset3Btn || !resetBtn) {
        return;
    }

    const universe = [1, 2, 3, 4, 5, 6, 7, 8];
    let setA = new Set([2, 4, 6]);
    let setB = new Set([1, 2, 3, 4, 5, 6]);

    const inputAByValue = new Map();
    const inputBByValue = new Map();

    function buildSelector(container, setState, inputMap, prefix) {
        container.innerHTML = '';
        universe.forEach(value => {
            const label = document.createElement('label');
            label.className = 'element-chip';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.id = `${prefix}-${value}`;
            input.checked = setState.has(value);

            const span = document.createElement('span');
            span.textContent = String(value);

            input.addEventListener('change', () => {
                if (input.checked) {
                    setState.add(value);
                } else {
                    setState.delete(value);
                }
                render();
            });

            label.appendChild(input);
            label.appendChild(span);
            container.appendChild(label);
            inputMap.set(value, input);
        });
    }

    function syncInputs(inputMap, sourceSet) {
        inputMap.forEach((input, value) => {
            input.checked = sourceSet.has(value);
        });
    }

    function isSubset(left, right) {
        for (const value of left) {
            if (!right.has(value)) {
                return false;
            }
        }
        return true;
    }

    function difference(left, right) {
        return sortedNumbers(Array.from(left).filter(value => !right.has(value)));
    }

    function render() {
        const sortedA = sortedNumbers(Array.from(setA));
        const sortedB = sortedNumbers(Array.from(setB));

        const aSubsetB = isSubset(setA, setB);
        const bSubsetA = isSubset(setB, setA);
        const onlyA = difference(setA, setB);
        const onlyB = difference(setB, setA);

        displayA.innerHTML = `\\(A=${setToLatex(sortedA)}\\)`;
        displayB.innerHTML = `\\(B=${setToLatex(sortedB)}\\)`;
        diffAEl.innerHTML = `\\(A\\setminus B=${setToLatex(onlyA)}\\)`;
        diffBEl.innerHTML = `\\(B\\setminus A=${setToLatex(onlyB)}\\)`;

        if (aSubsetB && bSubsetA) {
            relationEl.innerHTML = '\\(A=B\\)';
            explanationEl.textContent = 'Platí obě inkluze, množiny mají přesně stejné prvky.';
        } else if (aSubsetB) {
            relationEl.innerHTML = '\\(A\\subsetneq B\\)';
            explanationEl.textContent = 'Každý prvek A je v B a navíc existuje prvek v B, který není v A.';
        } else if (bSubsetA) {
            relationEl.innerHTML = '\\(B\\subsetneq A\\)';
            explanationEl.textContent = 'Každý prvek B je v A a navíc existuje prvek v A, který není v B.';
        } else {
            relationEl.innerHTML = '\\(A\\nsubseteq B\\) a \\(B\\nsubseteq A\\)';
            if (onlyA.length > 0 && onlyB.length > 0) {
                explanationEl.innerHTML = `Protipříklad pro \\(A\\subseteq B\\): \\(${onlyA[0]}\\in A,\\ ${onlyA[0]}\\notin B\\). ` +
                    `Protipříklad pro \\(B\\subseteq A\\): \\(${onlyB[0]}\\in B,\\ ${onlyB[0]}\\notin A\\).`;
            } else {
                explanationEl.textContent = 'Množiny nejsou navzájem podmnožinami.';
            }
        }

        typeset(relationEl.closest('.demo-controls'));
    }

    function applyPreset(valuesA, valuesB) {
        setA.clear();
        setB.clear();
        valuesA.forEach(value => setA.add(value));
        valuesB.forEach(value => setB.add(value));
        syncInputs(inputAByValue, setA);
        syncInputs(inputBByValue, setB);
        render();
    }

    preset1Btn.addEventListener('click', () => {
        applyPreset([2, 4, 6], [1, 2, 3, 4, 5, 6]);
    });

    preset2Btn.addEventListener('click', () => {
        applyPreset([1, 3, 5], [1, 3, 5]);
    });

    preset3Btn.addEventListener('click', () => {
        applyPreset([1, 2, 5], [2, 3, 4]);
    });

    resetBtn.addEventListener('click', () => {
        applyPreset([], []);
    });

    buildSelector(aContainer, setA, inputAByValue, 'subset-a');
    buildSelector(bContainer, setB, inputBByValue, 'subset-b');
    render();
}

function initRelationQuiz() {
    const taskAEl = document.getElementById('relationTaskA');
    const taskBEl = document.getElementById('relationTaskB');
    const progressEl = document.getElementById('relationProgress');
    const feedbackEl = document.getElementById('relationFeedback');
    const options = Array.from(document.querySelectorAll('.relation-option'));
    const checkBtn = document.getElementById('relationCheckBtn');
    const nextBtn = document.getElementById('relationNextBtn');

    if (!taskAEl || !taskBEl || !progressEl || !feedbackEl || options.length === 0 || !checkBtn || !nextBtn) {
        return;
    }

    const relationLabel = {
        aProperB: 'A\\subsetneq B',
        equal: 'A=B',
        bProperA: 'B\\subsetneq A',
        incomparable: 'A\\nsubseteq B\\ \\text{a}\\ B\\nsubseteq A'
    };

    const tasks = shuffleArray([
        {
            setA: 'A=\\{2,4,6\\}',
            setB: 'B=\\{1,2,3,4,5,6\\}',
            correctRelation: 'aProperB',
            explanation: 'Každý prvek A je v B, ale například 1 je v B a není v A.'
        },
        {
            setA: 'A=\\{x\\in\\mathbb{Z}\\mid x^2=1\\}',
            setB: 'B=\\{-1,1\\}',
            correctRelation: 'equal',
            explanation: 'Obě množiny mají právě dva prvky: -1 a 1.'
        },
        {
            setA: 'A=\\{2,4,6,8\\}',
            setB: 'B=\\{2,4\\}',
            correctRelation: 'bProperA',
            explanation: 'Všechny prvky B jsou v A, ale 6 a 8 jsou pouze v A.'
        },
        {
            setA: 'A=\\{x\\in\\mathbb{N}\\mid x\\text{ je sudé}\\}',
            setB: 'B=\\{x\\in\\mathbb{N}\\mid x\\text{ je násobek }3\\}',
            correctRelation: 'incomparable',
            explanation: '2 je v A a není v B, zároveň 3 je v B a není v A.'
        },
        {
            setA: 'A=\\varnothing',
            setB: 'B=\\{0,1\\}',
            correctRelation: 'aProperB',
            explanation: 'Prázdná množina je podmnožinou každé množiny a zde je navíc striktně menší.'
        },
        {
            setA: 'A=\\{x\\in\\mathbb{N}\\mid x\\mid 12\\}',
            setB: 'B=\\{1,2,3,4,6,12\\}',
            correctRelation: 'equal',
            explanation: 'Jde o stejné dělitele čísla 12.'
        }
    ]);

    let currentIndex = 0;
    let selectedRelation = '';

    function resetOptionState() {
        options.forEach(option => {
            option.classList.remove('selected', 'correct', 'incorrect');
            option.disabled = false;
        });
    }

    function renderTask() {
        const task = tasks[currentIndex];
        selectedRelation = '';
        taskAEl.innerHTML = `\\(${task.setA}\\)`;
        taskBEl.innerHTML = `\\(${task.setB}\\)`;
        progressEl.textContent = `Příklad ${currentIndex + 1} z ${tasks.length}`;
        resetOptionState();
        clearFeedback(feedbackEl);
        typeset(taskAEl.closest('.demo-panel'));
    }

    options.forEach(option => {
        option.addEventListener('click', () => {
            if (option.disabled) {
                return;
            }
            options.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedRelation = option.dataset.relation;
        });
    });

    checkBtn.addEventListener('click', () => {
        const task = tasks[currentIndex];

        if (!selectedRelation) {
            setFeedback(feedbackEl, 'info', 'Nejprve vyberte jednu možnost.');
            return;
        }

        options.forEach(option => {
            option.disabled = true;
            const relation = option.dataset.relation;
            if (relation === task.correctRelation) {
                option.classList.add('correct');
            } else if (relation === selectedRelation) {
                option.classList.add('incorrect');
            }
        });

        const isCorrect = selectedRelation === task.correctRelation;
        const correctLatex = relationLabel[task.correctRelation];
        const message = isCorrect
            ? `Správně: \\(${correctLatex}\\). ${task.explanation}`
            : `Nesprávně. Správně je \\(${correctLatex}\\). ${task.explanation}`;

        setFeedback(feedbackEl, isCorrect ? 'correct' : 'incorrect', message);
    });

    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % tasks.length;
        renderTask();
    });

    renderTask();
}

function initEqualityChecker() {
    const inputA = document.getElementById('equalityInputA');
    const inputB = document.getElementById('equalityInputB');
    const checkBtn = document.getElementById('equalityCheckBtn');
    const clearBtn = document.getElementById('equalityClearBtn');
    const resultEl = document.getElementById('equalityResult');
    const feedbackEl = document.getElementById('equalityFeedback');

    if (!inputA || !inputB || !checkBtn || !clearBtn || !resultEl || !feedbackEl) {
        return;
    }

    function evaluate() {
        const parsedA = parseSetInput(inputA.value);
        const parsedB = parseSetInput(inputB.value);

        if (!parsedA.hasInput && !parsedB.hasInput) {
            setFeedback(feedbackEl, 'info', 'Zadejte alespoň jednu z množin A nebo B.');
            return;
        }

        if (parsedA.error) {
            setFeedback(feedbackEl, 'info', parsedA.error);
            return;
        }

        if (parsedB.error) {
            setFeedback(feedbackEl, 'info', parsedB.error);
            return;
        }

        const valuesA = parsedA.values;
        const valuesB = parsedB.values;

        const equal = arraysEqual(valuesA, valuesB);
        const onlyA = valuesA.filter(value => !valuesB.includes(value));
        const onlyB = valuesB.filter(value => !valuesA.includes(value));

        resultEl.innerHTML = `Normalizováno: <code>A=${escapeHtml(formatSetText(valuesA))}</code>, <code>B=${escapeHtml(formatSetText(valuesB))}</code>`;

        if (equal) {
            setFeedback(feedbackEl, 'correct', 'Platí \\(A=B\\). Po odstranění duplicit a seřazení mají obě množiny stejné prvky.');
        } else {
            const witnessParts = [];
            if (onlyA.length > 0) {
                witnessParts.push(`\\(${escapeLatex(onlyA[0])}\\in A\\) a \\(${escapeLatex(onlyA[0])}\\notin B\\)`);
            }
            if (onlyB.length > 0) {
                witnessParts.push(`\\(${escapeLatex(onlyB[0])}\\in B\\) a \\(${escapeLatex(onlyB[0])}\\notin A\\)`);
            }
            const witnessText = witnessParts.join('; ');
            setFeedback(feedbackEl, 'incorrect', `Neplatí \\(A=B\\). Správně je \\(A\\neq B\\), protože ${witnessText}.`);
        }
    }

    checkBtn.addEventListener('click', evaluate);

    clearBtn.addEventListener('click', () => {
        inputA.value = '';
        inputB.value = '';
        resultEl.textContent = 'Po vyhodnocení se zde zobrazí normalizované množiny a výsledek.';
        clearFeedback(feedbackEl);
    });
}

function initEqualityQuiz() {
    const setAEl = document.getElementById('equalityQuizA');
    const setBEl = document.getElementById('equalityQuizB');
    const progressEl = document.getElementById('equalityQuizProgress');
    const feedbackEl = document.getElementById('equalityQuizFeedback');
    const options = Array.from(document.querySelectorAll('.binary-option'));
    const checkBtn = document.getElementById('equalityQuizCheckBtn');
    const nextBtn = document.getElementById('equalityQuizNextBtn');

    if (!setAEl || !setBEl || !progressEl || !feedbackEl || options.length === 0 || !checkBtn || !nextBtn) {
        return;
    }

    const tasks = shuffleArray([
        {
            setA: 'A=\\{1,2,3\\}',
            setB: 'B=\\{3,2,1,1\\}',
            isEqual: true,
            explanation: 'Pořadí ani duplicity prvků v množině nehrají roli.'
        },
        {
            setA: 'A=\\{x\\in\\mathbb{Z}\\mid x^2=4\\}',
            setB: 'B=\\{-2,2\\}',
            isEqual: true,
            explanation: 'V celých číslech mají rovnici x² = 4 právě řešení -2 a 2.'
        },
        {
            setA: 'A=\\{x\\in\\mathbb{N}\\mid x<5\\}',
            setB: 'B=\\{1,2,3,4,5\\}',
            isEqual: false,
            explanation: 'Číslo 5 je v B, ale není v A, protože A obsahuje jen čísla menší než 5.'
        },
        {
            setA: 'A=\\{x\\in\\mathbb{Z}\\mid -2\\le x\\le 2\\}',
            setB: 'B=\\{-2,-1,0,1,2\\}',
            isEqual: true,
            explanation: 'Obě množiny popisují tutéž pětici celých čísel.'
        },
        {
            setA: 'A=\\varnothing',
            setB: 'B=\\{\\varnothing\\}',
            isEqual: false,
            explanation: 'A je prázdná množina, zatímco B má jeden prvek: prázdnou množinu.'
        },
        {
            setA: 'A=\\{x\\in\\mathbb{N}\\mid x\\text{ je násobek }4\\text{ a }x<20\\}',
            setB: 'B=\\{4,8,12,16\\}',
            isEqual: true,
            explanation: 'Všechna přirozená čísla splňující podmínku jsou právě 4, 8, 12 a 16.'
        }
    ]);

    let currentIndex = 0;
    let selectedValue = '';

    function resetOptionState() {
        options.forEach(option => {
            option.classList.remove('selected', 'correct', 'incorrect');
            option.disabled = false;
        });
    }

    function renderTask() {
        const task = tasks[currentIndex];
        selectedValue = '';
        setAEl.innerHTML = `\\(${task.setA}\\)`;
        setBEl.innerHTML = `\\(${task.setB}\\)`;
        progressEl.textContent = `Příklad ${currentIndex + 1} z ${tasks.length}`;
        resetOptionState();
        clearFeedback(feedbackEl);
        typeset(setAEl.closest('.demo-panel'));
    }

    options.forEach(option => {
        option.addEventListener('click', () => {
            if (option.disabled) {
                return;
            }
            options.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedValue = option.dataset.value;
        });
    });

    checkBtn.addEventListener('click', () => {
        const task = tasks[currentIndex];

        if (!selectedValue) {
            setFeedback(feedbackEl, 'info', 'Vyberte jednu možnost (platí / neplatí).');
            return;
        }

        const selectedBool = selectedValue === 'true';

        options.forEach(option => {
            option.disabled = true;
            const optionBool = option.dataset.value === 'true';
            if (optionBool === task.isEqual) {
                option.classList.add('correct');
            } else if (optionBool === selectedBool) {
                option.classList.add('incorrect');
            }
        });

        const isCorrect = selectedBool === task.isEqual;
        const correctRelation = task.isEqual ? 'A=B' : 'A\\neq B';
        const message = isCorrect
            ? `Správně: \\(${correctRelation}\\). ${task.explanation}`
            : `Nesprávně. Správně je \\(${correctRelation}\\). ${task.explanation}`;

        setFeedback(feedbackEl, isCorrect ? 'correct' : 'incorrect', message);
    });

    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % tasks.length;
        renderTask();
    });

    renderTask();
}

function setToLatex(values) {
    if (values.length === 0) {
        return '\\varnothing';
    }
    return `\\{${values.join(',\\,')}\\}`;
}

function setFeedback(element, type, message) {
    if (!element) {
        return;
    }

    element.innerHTML = message;
    element.className = `feedback-box show ${type}`;
    typeset(element);
}

function clearFeedback(element) {
    if (!element) {
        return;
    }

    element.className = 'feedback-box';
    element.innerHTML = '';
}

function parseSetInput(rawValue) {
    const raw = rawValue.trim();

    if (!raw) {
        return { hasInput: false, values: [] };
    }

    const lower = raw.toLowerCase();
    if (lower === '∅' || lower === '{}' || lower === '\\varnothing' || lower === 'varnothing' || lower === 'empty') {
        return { hasInput: true, values: [] };
    }

    let cleaned = raw;
    if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
        cleaned = cleaned.slice(1, -1).trim();
    }

    if (!cleaned) {
        return { hasInput: true, values: [] };
    }

    const tokens = cleaned
        .split(/[,;]+/)
        .map(token => token.trim())
        .filter(Boolean);

    if (tokens.length === 0) {
        return { hasInput: true, values: [] };
    }

    const deduped = [];
    const seen = new Set();

    for (const token of tokens) {
        const normalized = normalizeToken(token);
        if (!normalized) {
            return { hasInput: true, values: [], error: 'Zadaná množina obsahuje neplatný prvek.' };
        }

        if (!seen.has(normalized.key)) {
            seen.add(normalized.key);
            deduped.push(normalized);
        }
    }

    deduped.sort(compareNormalizedToken);
    const values = deduped.map(item => item.value);
    return { hasInput: true, values };
}

function normalizeToken(token) {
    const clean = token.trim();

    if (!clean) {
        return null;
    }

    if (/^[+-]?\d+(?:[.,]\d+)?$/.test(clean)) {
        const numeric = Number(clean.replace(',', '.'));
        if (Number.isFinite(numeric)) {
            const canonical = canonicalNumber(numeric);
            return {
                value: canonical,
                key: `num:${canonical}`,
                isNumber: true,
                numeric
            };
        }
    }

    return {
        value: clean,
        key: `str:${clean}`,
        isNumber: false,
        numeric: NaN
    };
}

function canonicalNumber(value) {
    if (Number.isInteger(value)) {
        return String(value);
    }

    return String(Number(value.toFixed(10)));
}

function compareNormalizedToken(left, right) {
    if (left.isNumber && right.isNumber) {
        return left.numeric - right.numeric;
    }

    if (left.isNumber) {
        return -1;
    }

    if (right.isNumber) {
        return 1;
    }

    return left.value.localeCompare(right.value, 'cs', { sensitivity: 'base', numeric: true });
}

function formatSetText(values) {
    if (values.length === 0) {
        return '∅';
    }
    return `{${values.join(', ')}}`;
}

function arraysEqual(left, right) {
    if (left.length !== right.length) {
        return false;
    }

    for (let i = 0; i < left.length; i += 1) {
        if (left[i] !== right[i]) {
            return false;
        }
    }

    return true;
}

function sortedNumbers(values) {
    return [...values].sort((a, b) => a - b);
}

function escapeHtml(value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function escapeLatex(value) {
    return value
        .replaceAll('\\', '\\textbackslash ')
        .replaceAll('{', '\\{')
        .replaceAll('}', '\\}')
        .replaceAll('_', '\\_')
        .replaceAll('^', '\\^{}')
        .replaceAll('%', '\\%')
        .replaceAll('&', '\\&')
        .replaceAll('#', '\\#')
        .replaceAll('$', '\\$');
}

function shuffleArray(source) {
    const arr = [...source];
    for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
