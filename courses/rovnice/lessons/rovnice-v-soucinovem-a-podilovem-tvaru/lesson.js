document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initProductLab();
    initRationalLab();
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

        window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
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

function sanitizeNonZeroCoefficient(slider, fallback = 1) {
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

function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y) {
        const t = x % y;
        x = y;
        y = t;
    }
    return x || 1;
}

function formatAsFraction(value, maxDenominator = 20) {
    if (!Number.isFinite(value)) {
        return '—';
    }

    if (Math.abs(value) < EPS) {
        return '0';
    }

    if (Number.isInteger(value)) {
        return String(value);
    }

    for (let denominator = 1; denominator <= maxDenominator; denominator += 1) {
        const numerator = Math.round(value * denominator);
        if (Math.abs(value - numerator / denominator) < 1e-8) {
            const divisor = gcd(numerator, denominator);
            const n = numerator / divisor;
            const d = denominator / divisor;
            if (d === 1) {
                return String(n);
            }
            return `${n}/${d}`;
        }
    }

    return formatNumber(value, 4);
}

function formatFactor(root) {
    if (Math.abs(root) < EPS) {
        return '(x)';
    }

    if (root > 0) {
        return `(x - ${formatNumber(root)})`;
    }

    return `(x + ${formatNumber(Math.abs(root))})`;
}

function formatXMinusValue(value) {
    if (value >= 0) {
        return `x - ${formatAsFraction(value)}`;
    }
    return `x + ${formatAsFraction(Math.abs(value))}`;
}

function formatRootSet(roots) {
    if (!roots.length) {
        return '∅';
    }
    return `{${roots.map(root => formatAsFraction(root)).join(', ')}}`;
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

    for (let x = Math.ceil(viewport.xMin); x <= Math.floor(viewport.xMax); x += 1) {
        const px = toCanvasX(x, viewport);
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, viewport.height);
        ctx.stroke();
    }

    for (let y = Math.ceil(viewport.yMin); y <= Math.floor(viewport.yMax); y += 1) {
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

function drawCurve(ctx, viewport, fn, color, lineWidth = 2.6) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();

    const step = (viewport.xMax - viewport.xMin) / 550;
    let started = false;

    for (let x = viewport.xMin; x <= viewport.xMax + step; x += step) {
        const y = fn(x);
        if (!Number.isFinite(y)) {
            started = false;
            continue;
        }

        if (y < viewport.yMin - 40 || y > viewport.yMax + 40) {
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

function drawPoint(ctx, viewport, x, y, color, label = '') {
    const px = toCanvasX(x, viewport);
    const py = toCanvasY(y, viewport);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, py, 5.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    if (label) {
        ctx.fillStyle = color;
        ctx.font = '600 12px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(label, px + 8, py - 8);
    }
}

function drawHorizontalLine(ctx, viewport, y, color) {
    const py = toCanvasY(y, viewport);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(viewport.width, py);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawVerticalLine(ctx, viewport, x, color) {
    const px = toCanvasX(x, viewport);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, viewport.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function estimateYRange(fn, xMin, xMax, samples = 280) {
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
        return [-8, 8];
    }

    const span = Math.max(maxY - minY, 2);
    const pad = Math.max(1.5, span * 0.2);
    return [minY - pad, maxY + pad];
}

function initProductLab() {
    const canvas = document.getElementById('productCanvas');
    if (!canvas) {
        return;
    }

    const ctx = canvas.getContext('2d');
    const sliders = {
        k: document.getElementById('prodK'),
        r1: document.getElementById('prodR1'),
        r2: document.getElementById('prodR2')
    };

    const outputs = {
        k: document.getElementById('prodKVal'),
        r1: document.getElementById('prodR1Val'),
        r2: document.getElementById('prodR2Val'),
        equation: document.getElementById('productEquation'),
        roots: document.getElementById('productRoots'),
        count: document.getElementById('productCount'),
        type: document.getElementById('productType')
    };

    function render() {
        const k = sanitizeNonZeroCoefficient(sliders.k, 1);
        const r1 = Number.parseFloat(sliders.r1.value);
        const r2 = Number.parseFloat(sliders.r2.value);

        outputs.k.textContent = formatNumber(k);
        outputs.r1.textContent = formatNumber(r1);
        outputs.r2.textContent = formatNumber(r2);

        const factors = `${formatFactor(r1)}${formatFactor(r2)}`;
        const coefficient = Math.abs(k - 1) < EPS ? '' : `${formatNumber(k)}·`;
        outputs.equation.textContent = `${coefficient}${factors} = 0`;

        const uniqueRoots = [];
        [r1, r2].sort((a, b) => a - b).forEach(root => {
            if (!uniqueRoots.some(item => Math.abs(item - root) <= 1e-8)) {
                uniqueRoots.push(root);
            }
        });

        outputs.roots.textContent = formatRootSet(uniqueRoots);
        outputs.count.textContent = String(uniqueRoots.length);
        outputs.type.textContent = uniqueRoots.length === 1
            ? 'Jeden dvojnásobný reálný kořen'
            : 'Dva různé reálné kořeny';

        const f = x => k * (x - r1) * (x - r2);
        const xMin = -8;
        const xMax = 8;
        let [yMin, yMax] = estimateYRange(f, xMin, xMax);

        yMin = Math.max(yMin, -30);
        yMax = Math.min(yMax, 30);
        yMin = Math.min(yMin, -1.5);
        yMax = Math.max(yMax, 1.5);

        const viewport = createViewport(canvas.width, canvas.height, xMin, xMax, yMin, yMax);
        drawPlane(ctx, viewport);
        drawCurve(ctx, viewport, f, '#3b82f6', 2.8);

        uniqueRoots.forEach(root => {
            drawPoint(ctx, viewport, root, 0, '#10b981', `x=${formatAsFraction(root)}`);
        });
    }

    Object.values(sliders).forEach(slider => {
        slider.addEventListener('input', render);
    });

    render();
}
function initRationalLab() {
    const canvas = document.getElementById('rationalCanvas');
    if (!canvas) {
        return;
    }

    const ctx = canvas.getContext('2d');
    const sliders = {
        p: document.getElementById('ratP'),
        q: document.getElementById('ratQ'),
        m: document.getElementById('ratM')
    };

    const outputs = {
        p: document.getElementById('ratPVal'),
        q: document.getElementById('ratQVal'),
        m: document.getElementById('ratMVal'),
        equation: document.getElementById('rationalEquation'),
        domain: document.getElementById('rationalDomain'),
        step: document.getElementById('rationalStep'),
        solution: document.getElementById('rationalSolution'),
        type: document.getElementById('rationalType')
    };

    function drawRationalCurve(viewport, p, q) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2.6;
        ctx.beginPath();

        const step = (viewport.xMax - viewport.xMin) / 800;
        let started = false;

        for (let x = viewport.xMin; x <= viewport.xMax + step; x += step) {
            if (Math.abs(x - q) < step * 3) {
                started = false;
                continue;
            }

            const y = (x - p) / (x - q);
            if (!Number.isFinite(y) || y < viewport.yMin - 50 || y > viewport.yMax + 50) {
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

    function render() {
        const p = Number.parseFloat(sliders.p.value);
        const q = Number.parseFloat(sliders.q.value);
        const m = Number.parseFloat(sliders.m.value);
        const numeratorText = formatXMinusValue(p);
        const denominatorText = formatXMinusValue(q);

        outputs.p.textContent = formatNumber(p);
        outputs.q.textContent = formatNumber(q);
        outputs.m.textContent = formatNumber(m);

        outputs.equation.textContent = `(${numeratorText})/(${denominatorText}) = ${formatAsFraction(m)}`;

        outputs.domain.textContent = `x ≠ ${formatAsFraction(q)}`;

        let solutionType = '';
        let solutionText = '';
        let stepText = '';
        let singleSolution = null;

        if (Math.abs(m - 1) < EPS) {
            stepText = `${numeratorText} = ${denominatorText}`;
            if (Math.abs(p - q) < EPS) {
                solutionType = 'Nekonečně mnoho řešení';
                solutionText = `K = ℝ \\ {${formatAsFraction(q)}}`;
            } else {
                solutionType = 'Žádné řešení';
                solutionText = 'K = ∅';
            }
        } else {
            stepText = `${numeratorText} = ${formatAsFraction(m)}(${denominatorText})`;
            const candidate = (p - m * q) / (1 - m);
            if (Math.abs(candidate - q) < 1e-8) {
                solutionType = 'Žádné řešení';
                solutionText = 'K = ∅';
            } else {
                solutionType = 'Právě jedno řešení';
                solutionText = `K = {${formatAsFraction(candidate)}}`;
                singleSolution = candidate;
            }
        }

        outputs.step.textContent = stepText;
        outputs.solution.textContent = solutionText;
        outputs.type.textContent = solutionType;

        const f = x => (x - p) / (x - q);
        const xMin = -8;
        const xMax = 8;

        let [yMin, yMax] = estimateYRange(
            x => (Math.abs(x - q) < 0.02 ? Number.NaN : f(x)),
            xMin,
            xMax,
            500
        );

        yMin = Math.min(yMin, m - 2);
        yMax = Math.max(yMax, m + 2);
        yMin = Math.max(yMin, -12);
        yMax = Math.min(yMax, 12);

        const viewport = createViewport(canvas.width, canvas.height, xMin, xMax, yMin, yMax);

        drawPlane(ctx, viewport);
        drawRationalCurve(viewport, p, q);
        drawHorizontalLine(ctx, viewport, m, '#f59e0b');

        if (q > viewport.xMin && q < viewport.xMax) {
            drawVerticalLine(ctx, viewport, q, '#ef4444');
        }

        if (singleSolution !== null) {
            drawPoint(ctx, viewport, singleSolution, m, '#10b981', `x=${formatAsFraction(singleSolution)}`);
        }
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
    updateExerciseProgress(Array.from(document.querySelectorAll('.exercise')));
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
