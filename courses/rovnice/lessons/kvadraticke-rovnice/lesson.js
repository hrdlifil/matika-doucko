document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initQuadraticLab();
    initDerivationLab();
    initAbsoluteLab();
    initExercises();
});

const EPS = 1e-9;

function initNavigation() {
    const sections = Array.from(document.querySelectorAll('.lesson-section'));
    const links = Array.from(document.querySelectorAll('.sidebar-link'));
    const progressFill = document.querySelector('.progress-fill-small');
    const visited = new Set();

    if (!sections.length || !links.length) {
        return;
    }

    function updateProgress() {
        if (!progressFill) {
            return;
        }
        const percent = Math.round((visited.size / sections.length) * 100);
        progressFill.style.width = `${percent}%`;
    }

    function showSection(sectionId, smooth = true, updateHash = true) {
        const target = document.getElementById(sectionId);
        if (!target) {
            return;
        }

        sections.forEach(section => {
            section.classList.toggle('active', section.id === sectionId);
        });

        links.forEach(link => {
            link.classList.toggle('active', link.dataset.section === sectionId);
        });

        visited.add(sectionId);
        updateProgress();

        if (updateHash) {
            window.history.replaceState(null, '', `#${sectionId}`);
        }

        if (smooth) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'auto' });
        }
    }

    links.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            showSection(link.dataset.section, true, true);
        });
    });

    document.querySelectorAll('.btn-next, .btn-prev').forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.next || button.dataset.prev;
            if (targetId) {
                showSection(targetId, true, true);
            }
        });
    });

    const initialHash = window.location.hash ? window.location.hash.slice(1) : '';
    const initialSection = sections.some(section => section.id === initialHash)
        ? initialHash
        : sections[0].id;

    showSection(initialSection, false, false);
}

function sanitizeLeadingCoefficient(slider, fallback = 1) {
    let value = Number.parseFloat(slider.value);
    if (!Number.isFinite(value) || Math.abs(value) < EPS) {
        value = fallback;
        slider.value = String(value);
    }
    return value;
}

function formatNumber(value, precision = 3) {
    if (!Number.isFinite(value)) {
        return '—';
    }

    const rounded = Math.round(value * 10 ** precision) / 10 ** precision;
    if (Math.abs(rounded) < EPS) {
        return '0';
    }

    if (Number.isInteger(rounded)) {
        return String(rounded);
    }

    return rounded.toFixed(precision).replace(/\.?0+$/, '');
}

function formatShift(value) {
    if (Math.abs(value) < EPS) {
        return 'x';
    }
    if (value > 0) {
        return `x + ${formatNumber(value)}`;
    }
    return `x - ${formatNumber(Math.abs(value))}`;
}

function buildPolynomialString(a, b, c) {
    const terms = [];

    appendTerm(a, 'x²');
    appendTerm(b, 'x');
    appendTerm(c, '');

    return terms.length ? terms.join('') : '0';

    function appendTerm(coef, suffix) {
        if (Math.abs(coef) < EPS) {
            return;
        }

        const absCoef = Math.abs(coef);
        let body;

        if (!suffix) {
            body = formatNumber(absCoef);
        } else if (Math.abs(absCoef - 1) < EPS) {
            body = suffix;
        } else {
            body = `${formatNumber(absCoef)}${suffix}`;
        }

        if (!terms.length) {
            terms.push(`${coef < 0 ? '-' : ''}${body}`);
            return;
        }

        terms.push(`${coef < 0 ? ' - ' : ' + '}${body}`);
    }
}

function formatRootSet(roots) {
    if (!roots.length) {
        return '∅';
    }
    return `{${roots.map(root => formatNumber(root)).join(', ')}}`;
}

function uniqueSorted(values, tolerance = 1e-7) {
    const sorted = [...values].sort((a, b) => a - b);
    const unique = [];

    sorted.forEach(value => {
        if (!unique.some(existing => Math.abs(existing - value) <= tolerance)) {
            unique.push(value);
        }
    });

    return unique;
}

function solveQuadratic(a, b, c) {
    if (Math.abs(a) < EPS) {
        if (Math.abs(b) < EPS) {
            return [];
        }
        return [-c / b];
    }

    const discriminant = b * b - 4 * a * c;

    if (discriminant > EPS) {
        const sqrtD = Math.sqrt(discriminant);
        const x1 = (-b - sqrtD) / (2 * a);
        const x2 = (-b + sqrtD) / (2 * a);
        return uniqueSorted([x1, x2]);
    }

    if (Math.abs(discriminant) <= EPS) {
        return [-b / (2 * a)];
    }

    return [];
}

function createViewport(width, height, xMin, xMax, yMin, yMax) {
    return {
        width,
        height,
        xMin,
        xMax,
        yMin,
        yMax,
        scaleX: width / (xMax - xMin),
        scaleY: height / (yMax - yMin)
    };
}

function toCanvasX(x, viewport) {
    return (x - viewport.xMin) * viewport.scaleX;
}

function toCanvasY(y, viewport) {
    return viewport.height - (y - viewport.yMin) * viewport.scaleY;
}

function drawPlane(ctx, viewport) {
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, viewport.width, viewport.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;

    const xStart = Math.ceil(viewport.xMin);
    const xEnd = Math.floor(viewport.xMax);
    for (let x = xStart; x <= xEnd; x += 1) {
        const px = toCanvasX(x, viewport);
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, viewport.height);
        ctx.stroke();
    }

    const yStart = Math.ceil(viewport.yMin);
    const yEnd = Math.floor(viewport.yMax);
    for (let y = yStart; y <= yEnd; y += 1) {
        const py = toCanvasY(y, viewport);
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(viewport.width, py);
        ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.8;

    if (viewport.yMin < 0 && viewport.yMax > 0) {
        const axisY = toCanvasY(0, viewport);
        ctx.beginPath();
        ctx.moveTo(0, axisY);
        ctx.lineTo(viewport.width, axisY);
        ctx.stroke();
    }

    if (viewport.xMin < 0 && viewport.xMax > 0) {
        const axisX = toCanvasX(0, viewport);
        ctx.beginPath();
        ctx.moveTo(axisX, 0);
        ctx.lineTo(axisX, viewport.height);
        ctx.stroke();
    }
}

function drawCurve(ctx, viewport, fn, color, lineWidth = 2.4) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();

    const step = (viewport.xMax - viewport.xMin) / 500;
    let started = false;

    for (let x = viewport.xMin; x <= viewport.xMax + step; x += step) {
        const y = fn(x);
        if (!Number.isFinite(y)) {
            started = false;
            continue;
        }

        const px = toCanvasX(x, viewport);
        const py = toCanvasY(y, viewport);

        if (!started) {
            ctx.moveTo(px, py);
            started = true;
        } else {
            ctx.lineTo(px, py);
        }
    }

    ctx.stroke();
}

function drawHorizontalLine(ctx, viewport, y, color) {
    const py = toCanvasY(y, viewport);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(viewport.width, py);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawPoint(ctx, viewport, x, y, color, label = '') {
    const px = toCanvasX(x, viewport);
    const py = toCanvasY(y, viewport);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, py, 5.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (label) {
        ctx.fillStyle = color;
        ctx.font = '600 12px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(label, px + 8, py - 8);
    }
}

function estimateYRange(fn, xMin, xMax, samples = 300) {
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (let i = 0; i <= samples; i += 1) {
        const x = xMin + (xMax - xMin) * (i / samples);
        const y = fn(x);
        if (!Number.isFinite(y)) {
            continue;
        }
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    }

    if (!Number.isFinite(minY) || !Number.isFinite(maxY)) {
        return [-10, 10];
    }

    const span = Math.max(maxY - minY, 2);
    const pad = Math.max(1.5, span * 0.18);
    return [minY - pad, maxY + pad];
}

function initQuadraticLab() {
    const canvas = document.getElementById('quadraticCanvas');
    if (!canvas) {
        return;
    }

    const ctx = canvas.getContext('2d');
    const sliders = {
        a: document.getElementById('quadA'),
        b: document.getElementById('quadB'),
        c: document.getElementById('quadC')
    };

    const outputs = {
        a: document.getElementById('quadAVal'),
        b: document.getElementById('quadBVal'),
        c: document.getElementById('quadCVal'),
        equation: document.getElementById('quadEquation'),
        discriminant: document.getElementById('quadDiscriminant'),
        roots: document.getElementById('quadRoots'),
        vertex: document.getElementById('quadVertex'),
        interpretation: document.getElementById('quadInterpretation')
    };

    function render() {
        const a = sanitizeLeadingCoefficient(sliders.a, 1);
        const b = Number.parseFloat(sliders.b.value);
        const c = Number.parseFloat(sliders.c.value);

        outputs.a.textContent = formatNumber(a);
        outputs.b.textContent = formatNumber(b);
        outputs.c.textContent = formatNumber(c);

        const discriminant = b * b - 4 * a * c;
        const roots = solveQuadratic(a, b, c);
        const vertexX = -b / (2 * a);
        const vertexY = a * vertexX * vertexX + b * vertexX + c;

        outputs.equation.textContent = `${buildPolynomialString(a, b, c)} = 0`;
        outputs.discriminant.textContent = formatNumber(discriminant);
        outputs.roots.textContent = formatRootSet(roots);
        outputs.vertex.textContent = `V(${formatNumber(vertexX)}, ${formatNumber(vertexY)})`;

        if (discriminant > EPS) {
            outputs.interpretation.textContent = '2 reálné kořeny';
        } else if (Math.abs(discriminant) <= EPS) {
            outputs.interpretation.textContent = '1 dvojnásobný reálný kořen';
        } else {
            outputs.interpretation.textContent = '0 reálných kořenů';
        }

        const xMin = -8;
        const xMax = 8;
        const q = x => a * x * x + b * x + c;
        let [yMin, yMax] = estimateYRange(q, xMin, xMax);

        yMin = Math.min(yMin, -1);
        yMax = Math.max(yMax, 1);
        yMin = Math.max(yMin, -30);
        yMax = Math.min(yMax, 30);

        const viewport = createViewport(canvas.width, canvas.height, xMin, xMax, yMin, yMax);
        drawPlane(ctx, viewport);
        drawCurve(ctx, viewport, q, '#6366f1', 2.8);

        roots.forEach(root => {
            drawPoint(ctx, viewport, root, 0, '#10b981', `x=${formatNumber(root)}`);
        });

        drawPoint(ctx, viewport, vertexX, vertexY, '#f59e0b', 'V');
    }

    Object.values(sliders).forEach(slider => {
        slider.addEventListener('input', render);
    });

    render();
}

function initDerivationLab() {
    const sliders = {
        a: document.getElementById('derA'),
        b: document.getElementById('derB'),
        c: document.getElementById('derC')
    };

    if (!sliders.a || !sliders.b || !sliders.c) {
        return;
    }

    const outputs = {
        a: document.getElementById('derAVal'),
        b: document.getElementById('derBVal'),
        c: document.getElementById('derCVal'),
        step1: document.getElementById('derStep1'),
        step2: document.getElementById('derStep2'),
        step3: document.getElementById('derStep3'),
        step4: document.getElementById('derStep4'),
        step5: document.getElementById('derStep5'),
        step6: document.getElementById('derStep6'),
        discriminant: document.getElementById('derDiscriminant'),
        classification: document.getElementById('derClassification')
    };

    function render() {
        const a = sanitizeLeadingCoefficient(sliders.a, 1);
        const b = Number.parseFloat(sliders.b.value);
        const c = Number.parseFloat(sliders.c.value);

        outputs.a.textContent = formatNumber(a);
        outputs.b.textContent = formatNumber(b);
        outputs.c.textContent = formatNumber(c);

        const bOverA = b / a;
        const cOverA = c / a;
        const h = b / (2 * a);
        const leftAdded = h * h;
        const rightAfterAdd = -cOverA + leftAdded;
        const discriminant = b * b - 4 * a * c;

        outputs.step1.textContent = `${buildPolynomialString(a, b, c)} = 0`;
        outputs.step2.textContent = `${buildPolynomialString(1, bOverA, cOverA)} = 0`;
        outputs.step3.textContent = `${buildPolynomialString(1, bOverA, 0)} = ${formatNumber(-cOverA)}`;
        outputs.step4.textContent = `${buildPolynomialString(1, bOverA, leftAdded)} = ${formatNumber(rightAfterAdd)}`;
        outputs.step5.textContent = `(${formatShift(h)})² = ${formatNumber(discriminant / (4 * a * a))}`;
        outputs.step6.textContent = `x = (${formatNumber(-b)} ± √${formatNumber(discriminant)}) / ${formatNumber(2 * a)}`;

        outputs.discriminant.textContent = formatNumber(discriminant);
        if (discriminant > EPS) {
            outputs.classification.textContent = '2 reálné kořeny';
        } else if (Math.abs(discriminant) <= EPS) {
            outputs.classification.textContent = '1 dvojnásobný reálný kořen';
        } else {
            outputs.classification.textContent = '0 reálných kořenů';
        }
    }

    Object.values(sliders).forEach(slider => {
        slider.addEventListener('input', render);
    });

    let expectedValue = 9;
    const challengeP = document.getElementById('derChallengeP');
    const challengeInput = document.getElementById('derChallengeInput');
    const challengeBtn = document.getElementById('derChallengeBtn');
    const challengeNew = document.getElementById('derChallengeNew');
    const challengeFeedback = document.getElementById('derChallengeFeedback');

    function showChallengeFeedback(isCorrect, message) {
        if (!challengeFeedback) {
            return;
        }
        challengeFeedback.textContent = message;
        challengeFeedback.className = `exercise-feedback show ${isCorrect ? 'correct' : 'incorrect'}`;
    }

    function generateChallenge() {
        const values = [-10, -8, -6, -4, -2, 2, 4, 6, 8, 10];
        const p = values[Math.floor(Math.random() * values.length)];
        expectedValue = (p / 2) * (p / 2);
        if (challengeP) {
            challengeP.textContent = String(p);
        }
        if (challengeInput) {
            challengeInput.value = '';
            challengeInput.disabled = false;
        }
        if (challengeBtn) {
            challengeBtn.disabled = false;
        }
        if (challengeFeedback) {
            challengeFeedback.className = 'exercise-feedback';
            challengeFeedback.textContent = '';
        }
    }

    challengeBtn?.addEventListener('click', () => {
        const value = parseMathNumber(challengeInput?.value || '');
        if (!Number.isFinite(value)) {
            showChallengeFeedback(false, 'Zadejte číselnou hodnotu, například 9 nebo 9/1.');
            return;
        }

        const isCorrect = Math.abs(value - expectedValue) <= 1e-8;
        if (isCorrect) {
            showChallengeFeedback(true, 'Správně. Při doplnění na čtverec přičítáme právě tuto hodnotu.');
        } else {
            showChallengeFeedback(false, `Nesprávně. Správná hodnota je ${formatNumber(expectedValue)}.`);
        }
    });

    challengeNew?.addEventListener('click', generateChallenge);

    render();
    generateChallenge();
}

function initAbsoluteLab() {
    const canvas = document.getElementById('absoluteCanvas');
    if (!canvas) {
        return;
    }

    const ctx = canvas.getContext('2d');
    const sliders = {
        a: document.getElementById('absA'),
        b: document.getElementById('absB'),
        c: document.getElementById('absC'),
        k: document.getElementById('absK')
    };

    const outputs = {
        a: document.getElementById('absAVal'),
        b: document.getElementById('absBVal'),
        c: document.getElementById('absCVal'),
        k: document.getElementById('absKVal'),
        equation: document.getElementById('absEquation'),
        case1Eq: document.getElementById('absCase1Eq'),
        case2Eq: document.getElementById('absCase2Eq'),
        case1Roots: document.getElementById('absCase1Roots'),
        case2Roots: document.getElementById('absCase2Roots'),
        allRoots: document.getElementById('absAllRoots')
    };

    function render() {
        const a = sanitizeLeadingCoefficient(sliders.a, 1);
        const b = Number.parseFloat(sliders.b.value);
        const c = Number.parseFloat(sliders.c.value);
        const k = Math.max(0, Number.parseFloat(sliders.k.value));

        outputs.a.textContent = formatNumber(a);
        outputs.b.textContent = formatNumber(b);
        outputs.c.textContent = formatNumber(c);
        outputs.k.textContent = formatNumber(k);

        const firstCaseRoots = solveQuadratic(a, b, c - k);
        const secondCaseRoots = solveQuadratic(a, b, c + k);
        const allRoots = uniqueSorted([...firstCaseRoots, ...secondCaseRoots]);

        outputs.equation.textContent = `|${buildPolynomialString(a, b, c)}| = ${formatNumber(k)}`;
        outputs.case1Eq.textContent = `${buildPolynomialString(a, b, c - k)} = 0`;
        outputs.case2Eq.textContent = `${buildPolynomialString(a, b, c + k)} = 0`;
        outputs.case1Roots.textContent = formatRootSet(firstCaseRoots);
        outputs.case2Roots.textContent = formatRootSet(secondCaseRoots);
        outputs.allRoots.textContent = formatRootSet(allRoots);

        const xMin = -8;
        const xMax = 8;
        const q = x => a * x * x + b * x + c;
        const absQ = x => Math.abs(q(x));

        let [yMin, yMax] = estimateYRange(absQ, xMin, xMax);
        yMin = Math.min(yMin, -1);
        yMax = Math.max(yMax, k + 1);
        yMin = Math.max(yMin, -2);
        yMax = Math.min(yMax, 35);

        const viewport = createViewport(canvas.width, canvas.height, xMin, xMax, yMin, yMax);
        drawPlane(ctx, viewport);
        drawCurve(ctx, viewport, absQ, '#3b82f6', 2.8);
        drawHorizontalLine(ctx, viewport, k, '#f59e0b');

        allRoots.forEach(root => {
            drawPoint(ctx, viewport, root, k, '#10b981', `x=${formatNumber(root)}`);
        });
    }

    Object.values(sliders).forEach(slider => {
        slider.addEventListener('input', render);
    });

    render();
}

function initExercises() {
    const exercises = Array.from(document.querySelectorAll('.exercise'));
    const totalCount = document.getElementById('totalCount');

    if (totalCount) {
        totalCount.textContent = String(exercises.length);
    }

    exercises.forEach(exercise => {
        const button = exercise.querySelector('.btn-check');
        if (!button) {
            return;
        }

        button.addEventListener('click', () => {
            handleExercise(exercise);
        });
    });

    updateExerciseProgress(exercises);
}

function handleExercise(exercise) {
    if (exercise.dataset.completed === '1') {
        return;
    }

    const type = exercise.dataset.type;
    const expectedRaw = exercise.dataset.answer || '';
    const tolerance = Number.parseFloat(exercise.dataset.tolerance || '1e-9');
    let evaluation = null;

    if (type === 'number') {
        evaluation = evaluateNumberExercise(exercise, expectedRaw, tolerance);
    } else if (type === 'set') {
        evaluation = evaluateSetExercise(exercise, expectedRaw, tolerance);
    } else if (type === 'choice') {
        evaluation = evaluateChoiceExercise(exercise, expectedRaw);
    }

    if (!evaluation) {
        return;
    }

    const { isCorrect, selectedValue } = evaluation;
    const solution = exercise.dataset.solution || expectedRaw;

    if (type === 'choice') {
        markChoiceExercise(exercise, expectedRaw, selectedValue, isCorrect);
    }

    const message = isCorrect
        ? `Správně. ${solution}`
        : `Nesprávně. Správný výsledek: ${solution}`;

    finalizeExercise(exercise, isCorrect, message);

    const exercises = Array.from(document.querySelectorAll('.exercise'));
    updateExerciseProgress(exercises);
}

function evaluateNumberExercise(exercise, expectedRaw, tolerance) {
    const input = exercise.querySelector('.exercise-input');
    if (!input) {
        return null;
    }

    const userValue = parseMathNumber(input.value);
    const expectedValue = parseMathNumber(expectedRaw);

    if (!Number.isFinite(userValue)) {
        showInterimFeedback(exercise, 'Zadejte číselný výsledek (např. 3,5 nebo 7/2).');
        return null;
    }

    if (!Number.isFinite(expectedValue)) {
        return null;
    }

    return {
        isCorrect: nearlyEqual(userValue, expectedValue, tolerance),
        selectedValue: null
    };
}

function evaluateSetExercise(exercise, expectedRaw, tolerance) {
    const input = exercise.querySelector('.exercise-input');
    if (!input) {
        return null;
    }

    const parsedUser = parseNumberSet(input.value, tolerance);
    if (!parsedUser.valid) {
        showInterimFeedback(exercise, 'Zadejte množinu čísel oddělenou čárkou (např. -5, 13).');
        return null;
    }

    const parsedExpected = parseNumberSet(expectedRaw, tolerance);
    if (!parsedExpected.valid) {
        return null;
    }

    return {
        isCorrect: areSetsEqual(parsedUser.values, parsedExpected.values, tolerance),
        selectedValue: null
    };
}

function evaluateChoiceExercise(exercise, expectedRaw) {
    const selected = exercise.querySelector('input[type="radio"]:checked');
    if (!selected) {
        showInterimFeedback(exercise, 'Vyberte prosím jednu možnost.');
        return null;
    }

    return {
        isCorrect: selected.value === expectedRaw,
        selectedValue: selected.value
    };
}

function markChoiceExercise(exercise, expectedValue, selectedValue, isCorrect) {
    const optionLabels = Array.from(exercise.querySelectorAll('.option'));

    optionLabels.forEach(label => {
        const input = label.querySelector('input[type="radio"]');
        if (!input) {
            return;
        }

        if (input.value === expectedValue) {
            label.classList.add('correct');
        }

        if (!isCorrect && input.value === selectedValue) {
            label.classList.add('incorrect');
        }
    });
}

function finalizeExercise(exercise, isCorrect, message) {
    const feedback = exercise.querySelector('.exercise-feedback');
    const status = exercise.querySelector('.exercise-status');

    if (feedback) {
        feedback.textContent = message;
        feedback.className = `exercise-feedback show ${isCorrect ? 'correct' : 'incorrect'}`;
    }

    if (status) {
        status.textContent = isCorrect ? '✓ Správně' : '✕ Špatně';
        status.className = `exercise-status ${isCorrect ? 'correct' : 'incorrect'}`;
    }

    exercise.dataset.completed = '1';
    exercise.dataset.correct = isCorrect ? '1' : '0';

    const button = exercise.querySelector('.btn-check');
    if (button) {
        button.disabled = true;
    }

    const inputs = Array.from(exercise.querySelectorAll('input'));
    inputs.forEach(input => {
        input.disabled = true;
    });
}

function showInterimFeedback(exercise, message) {
    const feedback = exercise.querySelector('.exercise-feedback');
    if (!feedback) {
        return;
    }

    feedback.textContent = message;
    feedback.className = 'exercise-feedback show incorrect';
}

function updateExerciseProgress(exercises) {
    const solvedCount = document.getElementById('solvedCount');
    const finalScore = document.getElementById('finalScore');
    const lessonComplete = document.getElementById('lessonComplete');

    const solved = exercises.filter(exercise => exercise.dataset.completed === '1').length;
    const correct = exercises.filter(exercise => exercise.dataset.correct === '1').length;

    if (solvedCount) {
        solvedCount.textContent = String(solved);
    }

    if (finalScore) {
        finalScore.textContent = `${correct} / ${exercises.length}`;
    }

    if (!lessonComplete) {
        return;
    }

    if (solved === exercises.length && exercises.length > 0) {
        lessonComplete.classList.remove('hidden');
    } else {
        lessonComplete.classList.add('hidden');
    }
}

function parseMathNumber(rawValue) {
    if (typeof rawValue !== 'string') {
        return Number.NaN;
    }

    let cleaned = rawValue.trim();
    if (!cleaned) {
        return Number.NaN;
    }

    cleaned = cleaned
        .replace(/\s+/g, '')
        .replace(/,/g, '.')
        .replace(/−/g, '-');

    if (cleaned.includes('/')) {
        const parts = cleaned.split('/');
        if (parts.length !== 2) {
            return Number.NaN;
        }

        const numerator = Number(parts[0]);
        const denominator = Number(parts[1]);

        if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
            return Number.NaN;
        }

        return numerator / denominator;
    }

    const value = Number(cleaned);
    return Number.isFinite(value) ? value : Number.NaN;
}

function parseNumberSet(rawValue, tolerance) {
    if (typeof rawValue !== 'string') {
        return { valid: false, values: [] };
    }

    const cleaned = rawValue.replace(/[{}]/g, '').trim();
    if (!cleaned) {
        return { valid: false, values: [] };
    }

    const parts = cleaned.split(/[;,]/).map(part => part.trim()).filter(Boolean);
    if (!parts.length) {
        return { valid: false, values: [] };
    }

    const values = [];

    for (const part of parts) {
        const parsed = parseMathNumber(part);
        if (!Number.isFinite(parsed)) {
            return { valid: false, values: [] };
        }

        if (!values.some(value => nearlyEqual(value, parsed, tolerance))) {
            values.push(parsed);
        }
    }

    values.sort((a, b) => a - b);
    return { valid: true, values };
}

function areSetsEqual(first, second, tolerance) {
    if (first.length !== second.length) {
        return false;
    }

    for (let index = 0; index < first.length; index += 1) {
        if (!nearlyEqual(first[index], second[index], tolerance)) {
            return false;
        }
    }

    return true;
}

function nearlyEqual(a, b, tolerance = 1e-9) {
    return Math.abs(a - b) <= tolerance;
}

