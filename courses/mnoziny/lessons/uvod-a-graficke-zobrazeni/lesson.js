// Mnoziny - Kapitola 1: Uvod a graficke zobrazeni

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initNavbarScroll();
    initMembershipLab();
    initTypeClassifier();
    initCardinalityLab();
    initVennExplorer();
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
        'uvod-do-mnozin',
        'typy-mnozin',
        'vennovy-diagramy-a-zakresleni-mnozin'
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

function initMembershipLab() {
    const setLatexEl = document.getElementById('membershipSetLatex');
    const candidateEl = document.getElementById('membershipCandidate');
    const progressEl = document.getElementById('membershipProgress');
    const feedbackEl = document.getElementById('membershipFeedback');
    const belongsBtn = document.getElementById('membershipBelongsBtn');
    const notBelongsBtn = document.getElementById('membershipNotBelongsBtn');
    const nextBtn = document.getElementById('membershipNextBtn');

    if (!setLatexEl || !candidateEl || !progressEl || !feedbackEl || !belongsBtn || !notBelongsBtn || !nextBtn) {
        return;
    }

    const tasks = shuffleArray([
        {
            setSymbol: 'A',
            setLatex: '\\(A=\\{x\\in\\mathbb{N}\\mid x\\text{ je sudé a }x\\le 12\\}\\)',
            candidate: 8,
            inSet: true,
            explanation: '8 je sudé přirozené číslo a platí 8 ≤ 12.'
        },
        {
            setSymbol: 'A',
            setLatex: '\\(A=\\{x\\in\\mathbb{N}\\mid x\\text{ je sudé a }x\\le 12\\}\\)',
            candidate: 9,
            inSet: false,
            explanation: '9 je liché číslo, takže podmínku sudosti nesplňuje.'
        },
        {
            setSymbol: 'B',
            setLatex: '\\(B=\\{x\\in\\mathbb{Z}\\mid -3\\le x<3\\}\\)',
            candidate: -3,
            inSet: true,
            explanation: '-3 je celé číslo a spadá do intervalu od -3 včetně do 3 bez 3.'
        },
        {
            setSymbol: 'B',
            setLatex: '\\(B=\\{x\\in\\mathbb{Z}\\mid -3\\le x<3\\}\\)',
            candidate: 3,
            inSet: false,
            explanation: 'Pravý kraj je ostrý: podmínka je x < 3, takže 3 do B nepatří.'
        },
        {
            setSymbol: 'C',
            setLatex: '\\(C=\\{x\\in\\mathbb{N}\\mid x\\text{ je prvočíslo a }x<15\\}\\)',
            candidate: 13,
            inSet: true,
            explanation: '13 je prvočíslo a zároveň 13 < 15.'
        },
        {
            setSymbol: 'C',
            setLatex: '\\(C=\\{x\\in\\mathbb{N}\\mid x\\text{ je prvočíslo a }x<15\\}\\)',
            candidate: 1,
            inSet: false,
            explanation: 'Číslo 1 není prvočíslo, takže do množiny C nepatří.'
        }
    ]);

    let currentIndex = 0;

    function renderTask() {
        const task = tasks[currentIndex];
        setLatexEl.innerHTML = task.setLatex;
        candidateEl.innerHTML = `\\(x=${task.candidate}\\)`;
        progressEl.textContent = `Příklad ${currentIndex + 1} z ${tasks.length}`;
        clearFeedback(feedbackEl);
        typeset(setLatexEl);
        typeset(candidateEl);
    }

    function evaluate(answerBelongs) {
        const task = tasks[currentIndex];
        const isCorrect = answerBelongs === task.inSet;
        const relation = task.inSet ? '\\in' : '\\notin';

        const message = isCorrect
            ? `Správně: \\(${task.candidate} ${relation} ${task.setSymbol}\\). ${task.explanation}`
            : `Nesprávně. Správně je \\(${task.candidate} ${relation} ${task.setSymbol}\\). ${task.explanation}`;

        setFeedback(feedbackEl, isCorrect ? 'correct' : 'incorrect', message);
    }

    belongsBtn.addEventListener('click', () => evaluate(true));
    notBelongsBtn.addEventListener('click', () => evaluate(false));

    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % tasks.length;
        renderTask();
    });

    renderTask();
}

function initTypeClassifier() {
    const setDisplayEl = document.getElementById('typeSetDisplay');
    const progressEl = document.getElementById('typeProgress');
    const options = Array.from(document.querySelectorAll('.type-option'));
    const checkBtn = document.getElementById('typeCheckBtn');
    const nextBtn = document.getElementById('typeNextBtn');
    const feedbackEl = document.getElementById('typeFeedback');

    if (!setDisplayEl || !progressEl || options.length === 0 || !checkBtn || !nextBtn || !feedbackEl) {
        return;
    }

    const typeLabel = {
        empty: 'prázdná množina',
        singleton: 'jednoprvková množina',
        finite: 'konečná množina (s více prvky)',
        infinite: 'nekonečná množina'
    };

    const tasks = shuffleArray([
        {
            setLatex: '\\(\\varnothing\\)',
            correctType: 'empty',
            explanation: 'Prázdná množina neobsahuje žádný prvek.'
        },
        {
            setLatex: '\\(\\{\\pi\\}\\)',
            correctType: 'singleton',
            explanation: 'Množina obsahuje právě jeden prvek, číslo π.'
        },
        {
            setLatex: '\\(\\{2,4,6,8,10\\}\\)',
            correctType: 'finite',
            explanation: 'Množina má pět prvků, tedy je konečná.'
        },
        {
            setLatex: '\\(\\mathbb{Z}\\)',
            correctType: 'infinite',
            explanation: 'Celých čísel je nekonečně mnoho v obou směrech.'
        },
        {
            setLatex: '\\(\\{x\\in\\mathbb{N}\\mid x^2=16\\}\\)',
            correctType: 'singleton',
            explanation: 'V přirozených číslech řeší rovnici x² = 16 jen x = 4.'
        },
        {
            setLatex: '\\(\\{x\\in\\mathbb{N}\\mid x\\text{ je násobek }3\\}\\)',
            correctType: 'infinite',
            explanation: 'Násobků tří je v přirozených číslech nekonečně mnoho.'
        }
    ]);

    let currentIndex = 0;
    let selectedType = '';

    function resetOptionState() {
        options.forEach(option => {
            option.classList.remove('selected', 'correct', 'incorrect');
            option.disabled = false;
        });
    }

    function renderTask() {
        const task = tasks[currentIndex];
        selectedType = '';
        setDisplayEl.innerHTML = task.setLatex;
        progressEl.textContent = `Příklad ${currentIndex + 1} z ${tasks.length}`;
        resetOptionState();
        clearFeedback(feedbackEl);
        typeset(setDisplayEl);
    }

    options.forEach(option => {
        option.addEventListener('click', () => {
            options.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedType = option.dataset.type;
        });
    });

    checkBtn.addEventListener('click', () => {
        const task = tasks[currentIndex];

        if (!selectedType) {
            setFeedback(feedbackEl, 'info', 'Nejprve vyberte jednu možnost.');
            return;
        }

        options.forEach(option => {
            option.disabled = true;
            const type = option.dataset.type;
            if (type === task.correctType) {
                option.classList.add('correct');
            } else if (type === selectedType) {
                option.classList.add('incorrect');
            }
        });

        const isCorrect = selectedType === task.correctType;
        const message = isCorrect
            ? `Správně. Jde o ${typeLabel[task.correctType]}. ${task.explanation}`
            : `Nesprávně. Správná odpověď je: ${typeLabel[task.correctType]}. ${task.explanation}`;

        setFeedback(feedbackEl, isCorrect ? 'correct' : 'incorrect', message);
    });

    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % tasks.length;
        renderTask();
    });

    renderTask();
}

function initCardinalityLab() {
    const inputEl = document.getElementById('cardinalityInput');
    const checkBtn = document.getElementById('cardinalityCheckBtn');
    const resultEl = document.getElementById('cardinalityResult');
    const feedbackEl = document.getElementById('cardinalityFeedback');

    if (!inputEl || !checkBtn || !resultEl || !feedbackEl) {
        return;
    }

    checkBtn.addEventListener('click', () => {
        const rawValue = inputEl.value.trim();

        if (!rawValue) {
            setFeedback(feedbackEl, 'info', 'Zadejte alespoň jeden prvek oddělený čárkou.');
            return;
        }

        const rawTokens = rawValue
            .split(',')
            .map(token => token.trim())
            .filter(token => token.length > 0);

        if (rawTokens.length === 0) {
            setFeedback(feedbackEl, 'info', 'Zadaný text neobsahuje čitelné prvky množiny.');
            return;
        }

        const normalized = [];
        const seen = new Set();

        rawTokens.forEach(token => {
            const canonical = normalizeToken(token);
            if (!seen.has(canonical)) {
                seen.add(canonical);
                normalized.push(canonical);
            }
        });

        const safeSetText = normalized.map(item => escapeHtml(item)).join(', ');
        resultEl.innerHTML = `Po odstranění duplicit: <code>{${safeSetText}}</code><br>Kardinalita: \\(|A|=${normalized.length}\\)`;
        typeset(resultEl);

        if (normalized.length < rawTokens.length) {
            setFeedback(feedbackEl, 'correct', 'Správně: v množině se duplicitní prvky nezapočítávají.');
        } else {
            setFeedback(feedbackEl, 'info', 'Množina už byla bez duplicit, kardinalita je počet zadaných prvků.');
        }
    });
}

function initVennExplorer() {
    const canvas = document.getElementById('vennCanvas');
    const operationButtons = Array.from(document.querySelectorAll('.operation-btn'));
    const formulaEl = document.getElementById('operationFormula');
    const definitionEl = document.getElementById('operationDefinition');
    const resultEl = document.getElementById('operationResult');
    const cardinalityEl = document.getElementById('operationCardinality');
    const answerInput = document.getElementById('vennAnswerInput');
    const checkBtn = document.getElementById('vennCheckBtn');
    const resetBtn = document.getElementById('vennResetBtn');
    const feedbackEl = document.getElementById('vennFeedback');

    if (!canvas || operationButtons.length === 0 || !formulaEl || !definitionEl || !resultEl || !cardinalityEl || !answerInput || !checkBtn || !resetBtn || !feedbackEl) {
        return;
    }

    const ctx = canvas.getContext('2d');

    const U = range(1, 12);
    const A = [2, 4, 6, 8, 10, 12];
    const B = [2, 3, 5, 7, 11];
    const setU = new Set(U);

    const geometry = {
        frame: { x: 40, y: 24, w: 540, h: 300 },
        left: { x: 250, y: 175, r: 105 },
        right: { x: 370, y: 175, r: 105 }
    };

    const operations = {
        union: {
            formula: 'A\\cup B',
            description: 'Sjednocení obsahuje všechny prvky, které leží alespoň v jedné z množin A, B.',
            compute: () => union(A, B),
            draw: color => {
                fillCircle(geometry.left, color);
                fillCircle(geometry.right, color);
            }
        },
        intersection: {
            formula: 'A\\cap B',
            description: 'Průnik obsahuje pouze prvky, které leží současně v A i B.',
            compute: () => intersection(A, B),
            draw: color => {
                ctx.save();
                circlePath(geometry.left);
                ctx.clip();
                ctx.fillStyle = color;
                circlePath(geometry.right);
                ctx.fill();
                ctx.restore();
            }
        },
        aMinusB: {
            formula: 'A\\setminus B',
            description: 'Rozdíl A\\setminus B jsou prvky, které jsou v A, ale nejsou v B.',
            compute: () => difference(A, B),
            draw: color => {
                drawDifferenceRegion(geometry.left, geometry.right, color);
            }
        },
        bMinusA: {
            formula: 'B\\setminus A',
            description: 'Rozdíl B\\setminus A jsou prvky, které jsou v B, ale nejsou v A.',
            compute: () => difference(B, A),
            draw: color => {
                drawDifferenceRegion(geometry.right, geometry.left, color);
            }
        },
        aComplement: {
            formula: 'A^c',
            description: 'Doplněk A je vždy počítaný vůči univerzu U, tedy A^c = U\\setminus A.',
            compute: () => difference(U, A),
            draw: color => {
                fillFrame(color);
                punchCircle(geometry.left);
            }
        },
        bComplement: {
            formula: 'B^c',
            description: 'Doplněk B je množina všech prvků U, které neleží v B.',
            compute: () => difference(U, B),
            draw: color => {
                fillFrame(color);
                punchCircle(geometry.right);
            }
        },
        symDiff: {
            formula: 'A\\triangle B',
            description: 'Symetrický rozdíl jsou prvky, které patří právě do jedné z množin.',
            compute: () => symDifference(A, B),
            draw: color => {
                drawDifferenceRegion(geometry.left, geometry.right, color);
                drawDifferenceRegion(geometry.right, geometry.left, color);
            }
        }
    };

    let currentOperation = 'union';

    function circlePath(circle) {
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
    }

    function fillCircle(circle, color) {
        ctx.fillStyle = color;
        circlePath(circle);
        ctx.fill();
    }

    function fillFrame(color) {
        const frame = geometry.frame;
        ctx.fillStyle = color;
        ctx.fillRect(frame.x, frame.y, frame.w, frame.h);
    }

    function punchCircle(circle) {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        circlePath(circle);
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fill();
        ctx.restore();
    }

    function drawDifferenceRegion(inCircle, outCircle, color) {
        ctx.save();
        fillCircle(inCircle, color);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.save();
        circlePath(inCircle);
        ctx.clip();
        circlePath(outCircle);
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fill();
        ctx.restore();
        ctx.restore();
    }

    function drawBaseDiagram() {
        const frame = geometry.frame;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'rgba(99, 102, 241, 0.05)';
        ctx.fillRect(frame.x, frame.y, frame.w, frame.h);
    }

    function drawOutlines() {
        const frame = geometry.frame;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 2;
        ctx.strokeRect(frame.x, frame.y, frame.w, frame.h);

        ctx.strokeStyle = 'rgba(99, 102, 241, 0.85)';
        ctx.lineWidth = 3;
        circlePath(geometry.left);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(16, 185, 129, 0.9)';
        circlePath(geometry.right);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.font = '600 16px Inter, sans-serif';
        ctx.fillText('U', frame.x + 10, frame.y + 22);

        ctx.fillStyle = 'rgba(99, 102, 241, 0.95)';
        ctx.fillText('A', geometry.left.x - 70, geometry.left.y - 92);

        ctx.fillStyle = 'rgba(16, 185, 129, 0.95)';
        ctx.fillText('B', geometry.right.x + 55, geometry.right.y - 92);
    }

    function drawElement(value, point, color) {
        ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 15, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '600 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(value), point.x, point.y + 0.5);
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
    }

    function drawElements() {
        const onlyA = difference(A, B);
        const both = intersection(A, B);
        const onlyB = difference(B, A);
        const outside = difference(U, union(A, B));

        const pointsOnlyA = [
            { x: 173, y: 115 },
            { x: 155, y: 165 },
            { x: 176, y: 214 },
            { x: 216, y: 252 },
            { x: 236, y: 98 }
        ];
        const pointsBoth = [
            { x: 310, y: 174 },
            { x: 310, y: 138 }
        ];
        const pointsOnlyB = [
            { x: 396, y: 104 },
            { x: 432, y: 139 },
            { x: 454, y: 184 },
            { x: 420, y: 232 },
            { x: 470, y: 114 }
        ];
        const pointsOutside = [
            { x: 84, y: 96 },
            { x: 540, y: 96 },
            { x: 84, y: 258 },
            { x: 540, y: 258 }
        ];

        onlyA.forEach((value, idx) => drawElement(value, pointsOnlyA[idx], '#6366f1'));
        both.forEach((value, idx) => drawElement(value, pointsBoth[idx], '#f59e0b'));
        onlyB.forEach((value, idx) => drawElement(value, pointsOnlyB[idx], '#10b981'));
        outside.forEach((value, idx) => drawElement(value, pointsOutside[idx], '#94a3b8'));
    }

    function operationResultLatex(values) {
        if (values.length === 0) {
            return '\\varnothing';
        }
        return `\\{${values.join(',\\,')}\\}`;
    }

    function updateOperationTexts() {
        const op = operations[currentOperation];
        const result = op.compute();

        formulaEl.innerHTML = `\\(${op.formula}\\)`;
        definitionEl.textContent = op.description;
        resultEl.innerHTML = `Výsledek: \\(${op.formula} = ${operationResultLatex(result)}\\)`;

        if (currentOperation === 'union') {
            const sizeA = A.length;
            const sizeB = B.length;
            const sizeInter = intersection(A, B).length;
            cardinalityEl.innerHTML = `\\(|A\\cup B| = |A| + |B| - |A\\cap B| = ${sizeA} + ${sizeB} - ${sizeInter} = ${result.length}\\)`;
        } else {
            cardinalityEl.innerHTML = `\\(|${op.formula}| = ${result.length}\\)`;
        }

        typeset(formulaEl);
        typeset(resultEl);
        typeset(cardinalityEl);
    }

    function drawCurrentOperation() {
        drawBaseDiagram();

        const op = operations[currentOperation];
        op.draw('rgba(99, 102, 241, 0.24)');

        drawOutlines();
        drawElements();
    }

    function renderOperation() {
        operationButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.operation === currentOperation);
        });

        updateOperationTexts();
        drawCurrentOperation();
        clearFeedback(feedbackEl);
    }

    function parseAnswer(value) {
        const trimmed = value.trim();
        if (!trimmed || trimmed === '∅' || trimmed === '{}' || trimmed.toLowerCase() === 'empty') {
            return { values: [] };
        }

        const tokens = trimmed
            .split(/[,;\s]+/)
            .map(token => token.trim())
            .filter(Boolean);

        if (tokens.length === 0) {
            return { values: [] };
        }

        const values = [];
        const seen = new Set();

        for (const token of tokens) {
            if (!/^-?\d+$/.test(token)) {
                return { error: `Neplatný token „${escapeHtml(token)}“. Zadejte prosím pouze čísla oddělená čárkou.` };
            }

            const num = Number(token);
            if (!setU.has(num)) {
                return { error: `Číslo ${num} neleží v univerzu U = {1, 2, ..., 12}.` };
            }

            if (!seen.has(num)) {
                seen.add(num);
                values.push(num);
            }
        }

        values.sort((a, b) => a - b);
        return { values };
    }

    function arraysEqual(a, b) {
        if (a.length !== b.length) {
            return false;
        }

        for (let i = 0; i < a.length; i += 1) {
            if (a[i] !== b[i]) {
                return false;
            }
        }

        return true;
    }

    operationButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentOperation = button.dataset.operation;
            renderOperation();
        });
    });

    checkBtn.addEventListener('click', () => {
        const op = operations[currentOperation];
        const expected = op.compute();
        const parsed = parseAnswer(answerInput.value);

        if (parsed.error) {
            setFeedback(feedbackEl, 'info', parsed.error);
            return;
        }

        const userValues = parsed.values;
        const isCorrect = arraysEqual(userValues, expected);

        const expectedLatex = operationResultLatex(expected);
        const message = isCorrect
            ? `Správně: \\(${op.formula} = ${expectedLatex}\\).`
            : `Nesprávně. Správně je \\(${op.formula} = ${expectedLatex}\\).`;

        setFeedback(feedbackEl, isCorrect ? 'correct' : 'incorrect', message);
    });

    resetBtn.addEventListener('click', () => {
        answerInput.value = '';
        clearFeedback(feedbackEl);
    });

    renderOperation();
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

function normalizeToken(token) {
    const clean = token.trim();

    if (/^[+-]?\d+(?:\.\d+)?$/.test(clean)) {
        const numberValue = Number(clean);
        if (Number.isFinite(numberValue)) {
            return String(numberValue);
        }
    }

    return clean;
}

function escapeHtml(value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function range(start, end) {
    const result = [];
    for (let value = start; value <= end; value += 1) {
        result.push(value);
    }
    return result;
}

function union(left, right) {
    return Array.from(new Set([...left, ...right])).sort((a, b) => a - b);
}

function intersection(left, right) {
    const rightSet = new Set(right);
    return Array.from(new Set(left.filter(value => rightSet.has(value)))).sort((a, b) => a - b);
}

function difference(left, right) {
    const rightSet = new Set(right);
    return Array.from(new Set(left.filter(value => !rightSet.has(value)))).sort((a, b) => a - b);
}

function symDifference(left, right) {
    return union(difference(left, right), difference(right, left));
}

function shuffleArray(source) {
    const arr = [...source];
    for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
