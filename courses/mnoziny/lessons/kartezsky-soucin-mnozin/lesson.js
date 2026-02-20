document.addEventListener('DOMContentLoaded', () => {
    initNavbarScroll();
    initNavigation();
    initProductBuilder();
    initMembershipQuiz();
    initFiniteCounterDemo();
    initFiniteWordProblems();
    initDiagonalEnumerator();
    initIntervalProductDemo();
    initInfiniteClassificationQuiz();
    initExercises();
    typeset();
});

function typeset(target) {
    if (!window.MathJax || typeof window.MathJax.typesetPromise !== 'function') {
        return;
    }

    const payload = target ? [target] : undefined;
    window.MathJax.typesetPromise(payload).catch(() => {
        // Ignore transient MathJax rendering errors.
    });
}

function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) {
        return;
    }

    window.addEventListener('scroll', () => {
        navbar.style.background = window.scrollY > 50
            ? 'rgba(10, 10, 15, 0.95)'
            : 'rgba(10, 10, 15, 0.8)';
    });
}

function initNavigation() {
    const sectionOrder = [
        'definice-kartezskeho-soucinu',
        'kartezsky-soucin-konecnych-mnozin',
        'kartezsky-soucin-nekonecnych-mnozin'
    ];

    const sections = sectionOrder
        .map(id => document.getElementById(id))
        .filter(Boolean);

    const links = Array.from(document.querySelectorAll('.sidebar-link'));
    const nextButtons = document.querySelectorAll('.btn-next');
    const prevButtons = document.querySelectorAll('.btn-prev');
    const progressFill = document.querySelector('.progress-fill-small');

    function showSection(sectionId, smoothScroll = true, updateHash = true) {
        if (!sectionOrder.includes(sectionId)) {
            return;
        }

        sections.forEach(section => {
            section.classList.toggle('active', section.id === sectionId);
        });

        links.forEach(link => {
            link.classList.toggle('active', link.dataset.section === sectionId);
        });

        const index = sectionOrder.indexOf(sectionId);
        const progress = ((index + 1) / sectionOrder.length) * 100;
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }

        if (updateHash) {
            window.history.replaceState(null, '', `#${sectionId}`);
        }

        window.scrollTo({
            top: 0,
            behavior: smoothScroll ? 'smooth' : 'auto'
        });

        const target = document.getElementById(sectionId);
        if (target) {
            typeset(target);
        }
    }

    links.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            showSection(link.dataset.section, true, true);
        });
    });

    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            showSection(button.dataset.next, true, true);
        });
    });

    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            showSection(button.dataset.prev, true, true);
        });
    });

    const hashId = window.location.hash.replace('#', '');
    if (sectionOrder.includes(hashId)) {
        showSection(hashId, false, false);
    } else {
        showSection(sectionOrder[0], false, false);
    }
}

function setFeedback(element, type, message, allowHtml = false) {
    if (!element) {
        return;
    }

    if (allowHtml) {
        element.innerHTML = message;
        typeset(element);
    } else {
        element.textContent = message;
    }

    element.className = `feedback-box show ${type}`;
}

function clearFeedback(element) {
    if (!element) {
        return;
    }

    element.className = 'feedback-box';
    element.textContent = '';
}

function setToLatex(values) {
    if (!values || values.length === 0) {
        return '\\varnothing';
    }

    return `\\{${values.join(',\\,')}\\}`;
}

function formatSetText(values) {
    if (!values || values.length === 0) {
        return '∅';
    }

    return `{${values.join(', ')}}`;
}

function formatNumber(value) {
    const rounded = Math.round(value * 100) / 100;
    if (Number.isInteger(rounded)) {
        return String(rounded);
    }
    return rounded.toString();
}

function shuffleArray(source) {
    const array = [...source];
    for (let index = array.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [array[index], array[swapIndex]] = [array[swapIndex], array[index]];
    }
    return array;
}
function initProductBuilder() {
    const containerA = document.getElementById('builderSetA');
    const containerB = document.getElementById('builderSetB');
    const displayA = document.getElementById('builderDisplayA');
    const displayB = document.getElementById('builderDisplayB');
    const displayAxB = document.getElementById('builderDisplayAxB');
    const displayBxA = document.getElementById('builderDisplayBxA');
    const cardinality = document.getElementById('builderCardinality');
    const randomButton = document.getElementById('builderRandomBtn');
    const resetButton = document.getElementById('builderResetBtn');

    if (!containerA || !containerB || !displayA || !displayB || !displayAxB || !displayBxA || !cardinality || !randomButton || !resetButton) {
        return;
    }

    const optionsA = ['1', '2', '3', '4'];
    const optionsB = ['a', 'b', 'c', 'd'];

    let setA = new Set(['1', '2']);
    let setB = new Set(['a', 'c']);

    function cartesianProduct(valuesA, valuesB) {
        const result = [];
        valuesA.forEach(valueA => {
            valuesB.forEach(valueB => {
                result.push([valueA, valueB]);
            });
        });
        return result;
    }

    function pairsToLatex(pairs) {
        if (!pairs || pairs.length === 0) {
            return '\\varnothing';
        }

        const joined = pairs
            .map(pair => `(${pair[0]},${pair[1]})`)
            .join(',\\,');

        return `\\{${joined}\\}`;
    }

    function createChipElements(container, values, activeSet, onToggle) {
        container.innerHTML = '';

        values.forEach(value => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'set-chip';
            button.textContent = value;
            button.classList.toggle('active', activeSet.has(value));

            button.addEventListener('click', () => {
                if (activeSet.has(value)) {
                    activeSet.delete(value);
                } else {
                    activeSet.add(value);
                }

                onToggle();
            });

            container.appendChild(button);
        });
    }

    function randomSubset(sourceValues) {
        const subset = new Set();
        sourceValues.forEach(value => {
            if (Math.random() > 0.45) {
                subset.add(value);
            }
        });
        return subset;
    }

    function render() {
        createChipElements(containerA, optionsA, setA, render);
        createChipElements(containerB, optionsB, setB, render);

        const valuesA = optionsA.filter(value => setA.has(value));
        const valuesB = optionsB.filter(value => setB.has(value));

        const productAB = cartesianProduct(valuesA, valuesB);
        const productBA = cartesianProduct(valuesB, valuesA);

        displayA.innerHTML = `\\(A=${setToLatex(valuesA)}\\)`;
        displayB.innerHTML = `\\(B=${setToLatex(valuesB)}\\)`;
        displayAxB.innerHTML = `\\(A\\times B=${pairsToLatex(productAB)}\\)`;
        displayBxA.innerHTML = `\\(B\\times A=${pairsToLatex(productBA)}\\)`;

        cardinality.innerHTML = `\\(|A|=${valuesA.length},\ |B|=${valuesB.length},\ |A\\times B|=${productAB.length}\)`;

        typeset(displayA.closest('.builder-panel-wide'));
    }

    randomButton.addEventListener('click', () => {
        setA = randomSubset(optionsA);
        setB = randomSubset(optionsB);
        render();
    });

    resetButton.addEventListener('click', () => {
        setA = new Set();
        setB = new Set();
        render();
    });

    render();
}

function initMembershipQuiz() {
    const questionEl = document.getElementById('membershipQuestion');
    const progressEl = document.getElementById('membershipProgress');
    const feedbackEl = document.getElementById('membershipFeedback');
    const options = Array.from(document.querySelectorAll('#membershipOptions .binary-option'));
    const checkButton = document.getElementById('membershipCheckBtn');
    const nextButton = document.getElementById('membershipNextBtn');

    if (!questionEl || !progressEl || !feedbackEl || options.length === 0 || !checkButton || !nextButton) {
        return;
    }

    const tasks = shuffleArray([
        {
            setA: ['1', '2', '3'],
            setB: ['a', 'c'],
            pair: ['2', 'a'],
            correct: true,
            explanation: 'První složka 2 patří do A a druhá složka a patří do B.'
        },
        {
            setA: ['1', '2', '3'],
            setB: ['a', 'c'],
            pair: ['a', '2'],
            correct: false,
            explanation: 'Pořadí je obrácené: první složka musí být z A, ne z B.'
        },
        {
            setA: ['x', 'y'],
            setB: ['x', 'y'],
            pair: ['y', 'x'],
            correct: true,
            explanation: 'Obě složky jsou ve správných množinách, proto dvojice patří do A×B.'
        },
        {
            setA: ['1', '2'],
            setB: ['a', 'b', 'c'],
            pair: ['2', 'd'],
            correct: false,
            explanation: 'Druhá složka d není prvkem množiny B.'
        },
        {
            setA: [],
            setB: ['0', '1'],
            pair: ['0', '1'],
            correct: false,
            explanation: 'A je prázdná množina, takže A×B = ∅ a neobsahuje žádnou dvojici.'
        }
    ]);

    let currentIndex = 0;
    let selectedValue = '';

    function setVisualState(correctValue, chosenValue) {
        options.forEach(option => {
            option.classList.remove('correct', 'incorrect', 'selected');

            if (option.dataset.value === correctValue) {
                option.classList.add('correct');
            }

            if (chosenValue && option.dataset.value === chosenValue && chosenValue !== correctValue) {
                option.classList.add('incorrect');
            }

            if (chosenValue && option.dataset.value === chosenValue) {
                option.classList.add('selected');
            }
        });
    }

    function clearOptionStyles() {
        options.forEach(option => option.classList.remove('correct', 'incorrect', 'selected'));
    }

    function renderTask() {
        selectedValue = '';
        clearOptionStyles();
        clearFeedback(feedbackEl);

        const task = tasks[currentIndex];
        const latexA = setToLatex(task.setA);
        const latexB = setToLatex(task.setB);
        const pairLatex = `(${task.pair[0]},${task.pair[1]})`;

        questionEl.innerHTML = `\\(A=${latexA},\ B=${latexB}\\)<br>Platí \\(${pairLatex}\\in A\\times B\\)?`;
        progressEl.textContent = `Úloha ${currentIndex + 1} z ${tasks.length}`;

        typeset(questionEl.closest('.demo-panel'));
    }

    options.forEach(option => {
        option.addEventListener('click', () => {
            selectedValue = option.dataset.value;
            options.forEach(item => item.classList.remove('selected'));
            option.classList.add('selected');
        });
    });

    checkButton.addEventListener('click', () => {
        if (!selectedValue) {
            setFeedback(feedbackEl, 'info', 'Nejprve vyberte jednu možnost.');
            return;
        }

        const task = tasks[currentIndex];
        const correctValue = String(task.correct);
        const isCorrect = selectedValue === correctValue;

        setVisualState(correctValue, selectedValue);

        const message = isCorrect
            ? `Správně. ${task.explanation}`
            : `Nesprávně. Správná odpověď je „${task.correct ? 'Ano, patří' : 'Ne, nepatří'}“. ${task.explanation}`;

        setFeedback(feedbackEl, isCorrect ? 'correct' : 'incorrect', message);
    });

    nextButton.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % tasks.length;
        renderTask();
    });

    renderTask();
}
function initFiniteCounterDemo() {
    const sizeAInput = document.getElementById('finiteSizeA');
    const sizeBInput = document.getElementById('finiteSizeB');
    const sizeCInput = document.getElementById('finiteSizeC');

    const sizeAValue = document.getElementById('finiteSizeAValue');
    const sizeBValue = document.getElementById('finiteSizeBValue');
    const sizeCValue = document.getElementById('finiteSizeCValue');

    const setAEl = document.getElementById('finiteSetA');
    const setBEl = document.getElementById('finiteSetB');
    const setCEl = document.getElementById('finiteSetC');

    const productABEl = document.getElementById('finiteProductAB');
    const productABCEl = document.getElementById('finiteProductABC');
    const gridEl = document.getElementById('finiteGrid');

    if (!sizeAInput || !sizeBInput || !sizeCInput || !sizeAValue || !sizeBValue || !sizeCValue || !setAEl || !setBEl || !setCEl || !productABEl || !productABCEl || !gridEl) {
        return;
    }

    function buildLabels(prefix, count) {
        return Array.from({ length: count }, (_, index) => `${prefix}${index + 1}`);
    }

    function renderPairTable(valuesA, valuesB) {
        if (valuesA.length === 0 || valuesB.length === 0) {
            gridEl.innerHTML = '<div class="empty-grid-note">A × B = ∅ (alespoň jedna množina je prázdná)</div>';
            return;
        }

        const head = valuesA.map(value => `<th>${value}</th>`).join('');
        const rows = valuesB.map(valueB => {
            const cells = valuesA
                .map(valueA => `<td>(${valueA}, ${valueB})</td>`)
                .join('');
            return `<tr><th>${valueB}</th>${cells}</tr>`;
        }).join('');

        gridEl.innerHTML = `
            <div class="table-scroll">
                <table class="pair-table" role="table" aria-label="Tabulka všech dvojic A×B">
                    <thead>
                        <tr>
                            <th>×</th>
                            ${head}
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    function render() {
        const sizeA = Number(sizeAInput.value);
        const sizeB = Number(sizeBInput.value);
        const sizeC = Number(sizeCInput.value);

        const valuesA = buildLabels('a', sizeA);
        const valuesB = buildLabels('b', sizeB);
        const valuesC = buildLabels('c', sizeC);

        sizeAValue.textContent = String(sizeA);
        sizeBValue.textContent = String(sizeB);
        sizeCValue.textContent = String(sizeC);

        const countAB = sizeA * sizeB;
        const countABC = sizeA * sizeB * sizeC;

        setAEl.textContent = `A = ${formatSetText(valuesA)}`;
        setBEl.textContent = `B = ${formatSetText(valuesB)}`;
        setCEl.textContent = `C = ${formatSetText(valuesC)}`;

        productABEl.textContent = `|A × B| = ${sizeA} · ${sizeB} = ${countAB}`;
        productABCEl.textContent = `|A × B × C| = ${sizeA} · ${sizeB} · ${sizeC} = ${countABC}`;

        renderPairTable(valuesA, valuesB);
    }

    [sizeAInput, sizeBInput, sizeCInput].forEach(input => {
        input.addEventListener('input', render);
    });

    render();
}

function initFiniteWordProblems() {
    const problemEl = document.getElementById('finiteWordProblem');
    const progressEl = document.getElementById('finiteWordProgress');
    const inputEl = document.getElementById('finiteWordInput');
    const feedbackEl = document.getElementById('finiteWordFeedback');
    const checkButton = document.getElementById('finiteWordCheckBtn');
    const nextButton = document.getElementById('finiteWordNextBtn');

    if (!problemEl || !progressEl || !inputEl || !feedbackEl || !checkButton || !nextButton) {
        return;
    }

    const tasks = shuffleArray([
        {
            question: 'Máme |A| = 6 a |B| = 4. Kolik prvků má A × B?',
            answer: 24,
            explanation: '|A × B| = 6 · 4 = 24.'
        },
        {
            question: 'Pro součin tří konečných množin platí |A| = 5, |B| = 3, |C| = 2. Určete |A × B × C|.',
            answer: 30,
            explanation: '|A × B × C| = 5 · 3 · 2 = 30.'
        },
        {
            question: 'Je dáno |A × B| = 42 a |A| = 6. Určete |B|.',
            answer: 7,
            explanation: '|B| = |A × B| / |A| = 42 / 6 = 7.'
        },
        {
            question: 'Kolik dvojic obsahuje {1, 2, 3, 4} × {a, b, c, d, e}?',
            answer: 20,
            explanation: '4 prvky v první množině a 5 ve druhé: 4 · 5 = 20.'
        },
        {
            question: 'Množina A je prázdná a |B| = 9. Kolik prvků má A × B?',
            answer: 0,
            explanation: 'Pokud je jedna složka prázdná, součin je prázdný: A × B = ∅.'
        }
    ]);

    let currentIndex = 0;

    function renderTask() {
        const task = tasks[currentIndex];
        problemEl.textContent = task.question;
        progressEl.textContent = `Úloha ${currentIndex + 1} z ${tasks.length}`;
        inputEl.value = '';
        clearFeedback(feedbackEl);
    }

    function evaluate() {
        const rawValue = inputEl.value.trim().replace(',', '.');

        if (!rawValue) {
            setFeedback(feedbackEl, 'info', 'Zadejte prosím číselnou odpověď.');
            return;
        }

        const userValue = Number(rawValue);
        if (!Number.isFinite(userValue)) {
            setFeedback(feedbackEl, 'info', 'Odpověď musí být číslo.');
            return;
        }

        const task = tasks[currentIndex];
        const isCorrect = Math.abs(userValue - task.answer) < 1e-9;

        if (isCorrect) {
            setFeedback(feedbackEl, 'correct', `Správně. ${task.explanation}`);
        } else {
            setFeedback(feedbackEl, 'incorrect', `Nesprávně. Správný výsledek je ${task.answer}. ${task.explanation}`);
        }
    }

    checkButton.addEventListener('click', evaluate);

    inputEl.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            evaluate();
        }
    });

    nextButton.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % tasks.length;
        renderTask();
    });

    renderTask();
}
function initDiagonalEnumerator() {
    const stepInput = document.getElementById('diagStep');
    const stepValueEl = document.getElementById('diagStepValue');
    const currentEl = document.getElementById('diagCurrent');
    const prefixEl = document.getElementById('diagPrefix');
    const gridEl = document.getElementById('diagGrid');

    if (!stepInput || !stepValueEl || !currentEl || !prefixEl || !gridEl) {
        return;
    }

    const gridSize = 8;
    const pairs = [];
    for (let diagonal = 0; pairs.length < gridSize * gridSize; diagonal += 1) {
        for (let x = 0; x <= diagonal; x += 1) {
            const y = diagonal - x;
            if (x < gridSize && y < gridSize) {
                pairs.push([x, y]);
            }
        }
    }

    const indexByKey = new Map();
    pairs.forEach((pair, index) => {
        indexByKey.set(`${pair[0]},${pair[1]}`, index + 1);
    });

    const cellByKey = new Map();
    gridEl.innerHTML = '';

    for (let y = gridSize - 1; y >= 0; y -= 1) {
        for (let x = 0; x < gridSize; x += 1) {
            const cell = document.createElement('div');
            cell.className = 'diag-cell';
            cell.dataset.key = `${x},${y}`;
            cell.innerHTML = `<span class="coords">(${x},${y})</span>`;
            gridEl.appendChild(cell);
            cellByKey.set(cell.dataset.key, cell);
        }
    }

    function render() {
        const step = Number(stepInput.value);
        stepValueEl.textContent = String(step);

        cellByKey.forEach((cell, key) => {
            const index = indexByKey.get(key);
            if (index <= step) {
                const [x, y] = key.split(',');
                cell.classList.add('visited');
                cell.innerHTML = `<span class="order">${index}</span><span class="coords">(${x},${y})</span>`;
            } else {
                const [x, y] = key.split(',');
                cell.classList.remove('visited');
                cell.innerHTML = `<span class="coords">(${x},${y})</span>`;
            }
        });

        const currentPair = pairs[step - 1];
        currentEl.textContent = `${step}. dvojice v pořadí je (${currentPair[0]}, ${currentPair[1]}).`;

        const shownPairs = pairs
            .slice(0, Math.min(step, 12))
            .map(pair => `(${pair[0]}, ${pair[1]})`)
            .join(', ');

        const suffix = step > 12 ? ', ...' : '';
        prefixEl.textContent = `První dvojice: ${shownPairs}${suffix}`;
    }

    stepInput.max = String(pairs.length);
    stepInput.addEventListener('input', render);
    render();
}

function initIntervalProductDemo() {
    const canvas = document.getElementById('intervalCanvas');
    if (!canvas) {
        return;
    }

    const ctx = canvas.getContext('2d');

    const controls = {
        xStart: document.getElementById('intervalXStart'),
        xEnd: document.getElementById('intervalXEnd'),
        yStart: document.getElementById('intervalYStart'),
        yEnd: document.getElementById('intervalYEnd')
    };

    const labels = {
        xStart: document.getElementById('intervalXStartValue'),
        xEnd: document.getElementById('intervalXEndValue'),
        yStart: document.getElementById('intervalYStartValue'),
        yEnd: document.getElementById('intervalYEndValue')
    };

    const xText = document.getElementById('intervalXText');
    const yText = document.getElementById('intervalYText');
    const productText = document.getElementById('intervalProductText');
    const metaText = document.getElementById('intervalMeta');

    if (!controls.xStart || !controls.xEnd || !controls.yStart || !controls.yEnd || !labels.xStart || !labels.xEnd || !labels.yStart || !labels.yEnd || !xText || !yText || !productText || !metaText) {
        return;
    }

    function drawPlane(a, b, c, d) {
        const width = canvas.width;
        const height = canvas.height;
        const padding = 34;

        const min = -6;
        const max = 6;
        const range = max - min;

        const mapX = x => padding + ((x - min) / range) * (width - 2 * padding);
        const mapY = y => height - padding - ((y - min) / range) * (height - 2 * padding);

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#0b101a';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
        ctx.lineWidth = 1;

        for (let value = -5; value <= 5; value += 1) {
            const px = mapX(value);
            const py = mapY(value);

            ctx.beginPath();
            ctx.moveTo(px, padding);
            ctx.lineTo(px, height - padding);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(padding, py);
            ctx.lineTo(width - padding, py);
            ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(226, 232, 240, 0.75)';
        ctx.lineWidth = 2;

        const axisX = mapY(0);
        const axisY = mapX(0);

        ctx.beginPath();
        ctx.moveTo(padding, axisX);
        ctx.lineTo(width - padding, axisX);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(axisY, padding);
        ctx.lineTo(axisY, height - padding);
        ctx.stroke();

        const left = mapX(a);
        const right = mapX(b);
        const bottom = mapY(c);
        const top = mapY(d);

        ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';
        ctx.fillRect(left, top, right - left, bottom - top);

        ctx.strokeStyle = 'rgba(129, 140, 248, 0.9)';
        ctx.lineWidth = 2;
        ctx.strokeRect(left, top, right - left, bottom - top);

        ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText('x', width - padding + 8, axisX - 8);
        ctx.fillText('y', axisY + 8, padding - 8);
    }

    function normalizeRanges(changedKey) {
        let a = Number(controls.xStart.value);
        let b = Number(controls.xEnd.value);
        let c = Number(controls.yStart.value);
        let d = Number(controls.yEnd.value);

        if (a > b) {
            if (changedKey === 'xStart') {
                b = a;
                controls.xEnd.value = String(b);
            } else {
                a = b;
                controls.xStart.value = String(a);
            }
        }

        if (c > d) {
            if (changedKey === 'yStart') {
                d = c;
                controls.yEnd.value = String(d);
            } else {
                c = d;
                controls.yStart.value = String(c);
            }
        }

        return { a, b, c, d };
    }

    function render(changedKey = '') {
        const { a, b, c, d } = normalizeRanges(changedKey);

        labels.xStart.textContent = formatNumber(a);
        labels.xEnd.textContent = formatNumber(b);
        labels.yStart.textContent = formatNumber(c);
        labels.yEnd.textContent = formatNumber(d);

        const widthInterval = b - a;
        const heightInterval = d - c;

        xText.textContent = `I = [${formatNumber(a)}, ${formatNumber(b)}]`;
        yText.textContent = `J = [${formatNumber(c)}, ${formatNumber(d)}]`;
        productText.textContent = 'I × J = {(x, y) | x ∈ I a y ∈ J}';
        metaText.textContent = `Šířka = ${formatNumber(widthInterval)}, výška = ${formatNumber(heightInterval)}, obsah obdélníku = ${formatNumber(widthInterval * heightInterval)}`;

        drawPlane(a, b, c, d);
    }

    Object.entries(controls).forEach(([key, input]) => {
        input.addEventListener('input', () => render(key));
    });

    render();
}
function initInfiniteClassificationQuiz() {
    const questionEl = document.getElementById('infiniteClassQuestion');
    const progressEl = document.getElementById('infiniteClassProgress');
    const feedbackEl = document.getElementById('infiniteClassFeedback');
    const options = Array.from(document.querySelectorAll('#infiniteClassOptions .classify-option'));
    const checkButton = document.getElementById('infiniteClassCheckBtn');
    const nextButton = document.getElementById('infiniteClassNextBtn');

    if (!questionEl || !progressEl || !feedbackEl || options.length === 0 || !checkButton || !nextButton) {
        return;
    }

    const tasks = shuffleArray([
        {
            expression: '\\(\\varnothing\\times\\mathbb{R}\\)',
            answer: 'finite',
            explanation: 'Součin s prázdnou množinou je prázdný, tedy konečný (má 0 prvků).'
        },
        {
            expression: '\\(\\mathbb{N}\\times\\{0,1,2,3\\}\\)',
            answer: 'countable',
            explanation: 'Konečně mnoho kopií množiny N je stále spočetně nekonečných.'
        },
        {
            expression: '\\(\\mathbb{Z}\\times\\mathbb{N}\\)',
            answer: 'countable',
            explanation: 'Součin dvou spočetně nekonečných množin je spočetně nekonečný.'
        },
        {
            expression: '\\([0,1]\\times[0,1]\\)',
            answer: 'uncountable',
            explanation: 'Čtverec v rovině obsahuje nespočetně mnoho bodů.'
        },
        {
            expression: '\\(\\mathbb{R}\\times\\mathbb{N}\\)',
            answer: 'uncountable',
            explanation: 'Součin nenulové spočetné množiny s R má stále mohutnost kontinua.'
        },
        {
            expression: '\\(\\mathbb{Q}\\times\\mathbb{Q}\\)',
            answer: 'countable',
            explanation: 'Racionální čísla jsou spočetná a součin dvou spočetných množin je spočetný.'
        }
    ]);

    const labels = {
        finite: 'Konečná',
        countable: 'Spočetně nekonečná',
        uncountable: 'Nespočetně nekonečná'
    };

    let currentIndex = 0;
    let selectedValue = '';

    function clearOptionState() {
        options.forEach(option => option.classList.remove('selected', 'correct', 'incorrect'));
    }

    function renderTask() {
        selectedValue = '';
        clearOptionState();
        clearFeedback(feedbackEl);

        const task = tasks[currentIndex];
        questionEl.innerHTML = `Určete mohutnost množiny ${task.expression}.`;
        progressEl.textContent = `Úloha ${currentIndex + 1} z ${tasks.length}`;

        typeset(questionEl.closest('.demo-panel'));
    }

    options.forEach(option => {
        option.addEventListener('click', () => {
            selectedValue = option.dataset.value;
            options.forEach(item => item.classList.remove('selected'));
            option.classList.add('selected');
        });
    });

    checkButton.addEventListener('click', () => {
        if (!selectedValue) {
            setFeedback(feedbackEl, 'info', 'Vyberte jednu z možností.');
            return;
        }

        const task = tasks[currentIndex];
        const isCorrect = selectedValue === task.answer;

        options.forEach(option => {
            option.classList.remove('correct', 'incorrect');
            if (option.dataset.value === task.answer) {
                option.classList.add('correct');
            } else if (option.dataset.value === selectedValue && !isCorrect) {
                option.classList.add('incorrect');
            }
        });

        if (isCorrect) {
            setFeedback(feedbackEl, 'correct', `Správně. ${task.explanation}`);
        } else {
            setFeedback(
                feedbackEl,
                'incorrect',
                `Nesprávně. Správná klasifikace je „${labels[task.answer]}“. ${task.explanation}`
            );
        }
    });

    nextButton.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % tasks.length;
        renderTask();
    });

    renderTask();
}

function initExercises() {
    const cards = Array.from(document.querySelectorAll('.exercise-card'));
    if (cards.length === 0) {
        return;
    }

    cards.forEach(card => {
        card.dataset.solved = 'false';
        const button = card.querySelector('.btn-check-exercise');
        if (!button) {
            return;
        }

        button.addEventListener('click', () => {
            evaluateExerciseCard(card);
            updateExerciseCompletion(cards);
        });

        const input = card.querySelector('.exercise-input');
        if (input) {
            input.addEventListener('keydown', event => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    evaluateExerciseCard(card);
                    updateExerciseCompletion(cards);
                }
            });
        }
    });
}

function evaluateExerciseCard(card) {
    const type = card.dataset.type;
    if (type === 'choice') {
        evaluateChoiceExercise(card);
        return;
    }

    if (type === 'number') {
        evaluateNumberExercise(card);
    }
}

function evaluateChoiceExercise(card) {
    const feedback = card.querySelector('.exercise-feedback');
    const answer = card.dataset.answer;
    const groupName = card.dataset.name;
    const explanation = card.dataset.explanation || '';

    const selectedInput = card.querySelector(`input[name="${groupName}"]:checked`);
    const options = Array.from(card.querySelectorAll('.option'));

    options.forEach(option => option.classList.remove('correct', 'incorrect'));

    if (!selectedInput) {
        setExerciseState(card, false, 'Nevyplněno');
        setCardFeedback(feedback, false, 'Vyberte prosím jednu možnost.');
        return;
    }

    const correctInput = card.querySelector(`input[name="${groupName}"][value="${answer}"]`);
    const selectedOption = selectedInput.closest('.option');
    const correctOption = correctInput ? correctInput.closest('.option') : null;

    const isCorrect = selectedInput.value === answer;

    if (selectedOption) {
        selectedOption.classList.add(isCorrect ? 'correct' : 'incorrect');
    }

    if (!isCorrect && correctOption) {
        correctOption.classList.add('correct');
    }

    const correctText = correctOption
        ? (correctOption.querySelector('.option-text')?.textContent || 'správná odpověď')
        : 'správná odpověď';

    if (isCorrect) {
        setExerciseState(card, true, 'Správně');
        setCardFeedback(feedback, true, `Správně. ${explanation}`);
    } else {
        setExerciseState(card, false, 'Nesprávně');
        setCardFeedback(feedback, false, `Nesprávně. Správná odpověď je: ${correctText}. ${explanation}`);
    }
}

function evaluateNumberExercise(card) {
    const feedback = card.querySelector('.exercise-feedback');
    const input = card.querySelector('.exercise-input');
    const explanation = card.dataset.explanation || '';
    const expectedValue = Number(card.dataset.answer);

    if (!input) {
        return;
    }

    const rawValue = input.value.trim().replace(',', '.');
    if (!rawValue) {
        setExerciseState(card, false, 'Nevyplněno');
        setCardFeedback(feedback, false, 'Zadejte číselný výsledek.');
        return;
    }

    const userValue = Number(rawValue);
    if (!Number.isFinite(userValue)) {
        setExerciseState(card, false, 'Nesprávně');
        setCardFeedback(feedback, false, 'Výsledek musí být číslo.');
        return;
    }

    const isCorrect = Math.abs(userValue - expectedValue) < 1e-9;

    if (isCorrect) {
        setExerciseState(card, true, 'Správně');
        setCardFeedback(feedback, true, `Správně. ${explanation}`);
    } else {
        setExerciseState(card, false, 'Nesprávně');
        setCardFeedback(feedback, false, `Nesprávně. Správný výsledek je ${expectedValue}. ${explanation}`);
    }
}

function setExerciseState(card, isCorrect, statusText) {
    const status = card.querySelector('.exercise-status');
    card.dataset.solved = isCorrect ? 'true' : 'false';
    card.classList.toggle('solved', isCorrect);

    if (!status) {
        return;
    }

    status.textContent = statusText;
    status.classList.remove('correct', 'incorrect');

    if (statusText === 'Správně') {
        status.classList.add('correct');
    } else if (statusText === 'Nesprávně') {
        status.classList.add('incorrect');
    }
}

function setCardFeedback(element, isCorrect, text) {
    if (!element) {
        return;
    }

    element.textContent = text;
    element.classList.remove('correct', 'incorrect', 'show');
    element.classList.add(isCorrect ? 'correct' : 'incorrect', 'show');
}

function updateExerciseCompletion(cards) {
    const allSolved = cards.every(card => card.dataset.solved === 'true');
    const completePanel = document.getElementById('lessonComplete');
    if (!completePanel) {
        return;
    }

    completePanel.style.display = allSolved ? 'block' : 'none';
}

