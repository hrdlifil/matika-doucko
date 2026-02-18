document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initExponentialLab();
    initLogarithmicLab();
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

function almostEqual(a, b, tolerance = 1e-9) {
    return Math.abs(a - b) <= tolerance;
}

function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
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

function formatLinearExpression(m, n) {
    if (Math.abs(m) < EPS) {
        return formatNumber(n);
    }

    let mPart = '';
    if (almostEqual(Math.abs(m), 1, 1e-7)) {
        mPart = m < 0 ? '-x' : 'x';
    } else {
        mPart = `${formatNumber(m)}x`;
    }

    if (Math.abs(n) < EPS) {
        return mPart;
    }

    const nPart = `${n > 0 ? '+' : '-'} ${formatNumber(Math.abs(n))}`;
    return `${mPart} ${nPart}`;
}

function formatShiftExpression(h) {
    if (Math.abs(h) < EPS) {
        return 'x';
    }

    if (h > 0) {
        return `x - ${formatNumber(h)}`;
    }

    return `x + ${formatNumber(Math.abs(h))}`;
}

function chooseGridStep(span) {
    if (span <= 16) {
        return 1;
    }
    if (span <= 32) {
        return 2;
    }
    if (span <= 80) {
        return 5;
    }
    return 10;
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

    const xSpan = viewport.xMax - viewport.xMin;
    const ySpan = viewport.yMax - viewport.yMin;

    const xStep = chooseGridStep(xSpan);
    const yStep = chooseGridStep(ySpan);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;

    const xStart = Math.ceil(viewport.xMin / xStep) * xStep;
    const xEnd = Math.floor(viewport.xMax / xStep) * xStep;
    for (let x = xStart; x <= xEnd + EPS; x += xStep) {
        const px = toCanvasX(x, viewport);
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, viewport.height);
        ctx.stroke();
    }

    const yStart = Math.ceil(viewport.yMin / yStep) * yStep;
    const yEnd = Math.floor(viewport.yMax / yStep) * yStep;
    for (let y = yStart; y <= yEnd + EPS; y += yStep) {
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

function drawCurve(ctx, viewport, fn, color, lineWidth = 2.6, domainFn = () => true) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();

    const step = (viewport.xMax - viewport.xMin) / 900;
    let started = false;

    for (let x = viewport.xMin; x <= viewport.xMax + step; x += step) {
        if (!domainFn(x)) {
            started = false;
            continue;
        }

        const y = fn(x);

        if (!Number.isFinite(y) || Math.abs(y) > 1e6) {
            started = false;
            continue;
        }

        const px = toCanvasX(x, viewport);
        const py = toCanvasY(y, viewport);

        if (!Number.isFinite(py)) {
            started = false;
            continue;
        }

        if (!started) {
            ctx.moveTo(px, py);
            started = true;
        } else {
            ctx.lineTo(px, py);
        }
    }

    ctx.stroke();
}

function drawHorizontalLine(ctx, viewport, y, color = '#10b981') {
    if (y < viewport.yMin || y > viewport.yMax) {
        return;
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 5]);

    const py = toCanvasY(y, viewport);
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(viewport.width, py);
    ctx.stroke();

    ctx.setLineDash([]);
}

function drawVerticalLine(ctx, viewport, x, color = '#ef4444') {
    if (x < viewport.xMin || x > viewport.xMax) {
        return;
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 5]);

    const px = toCanvasX(x, viewport);
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, viewport.height);
    ctx.stroke();

    ctx.setLineDash([]);
}

function drawPoint(ctx, viewport, x, y, color, label = '') {
    const px = toCanvasX(x, viewport);
    const py = toCanvasY(y, viewport);

    if (px < -20 || px > viewport.width + 20 || py < -20 || py > viewport.height + 20) {
        return;
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, py, 5.2, 0, Math.PI * 2);
    ctx.fill();

    if (label) {
        ctx.font = '600 12px Inter, sans-serif';
        ctx.fillStyle = color;
        ctx.fillText(label, px + 8, py - 8);
    }
}

function estimateYRange(fn, xMin, xMax, domainFn = () => true, samples = 500) {
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (let index = 0; index <= samples; index += 1) {
        const x = xMin + (xMax - xMin) * (index / samples);
        if (!domainFn(x)) {
            continue;
        }

        const y = fn(x);
        if (!Number.isFinite(y) || Math.abs(y) > 1e6) {
            continue;
        }

        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    }

    if (!Number.isFinite(minY) || !Number.isFinite(maxY)) {
        return [-2, 10];
    }

    const span = Math.max(maxY - minY, 1);
    const padding = Math.max(1.2, span * 0.2);
    return [minY - padding, maxY + padding];
}
function initExponentialLab() {
    const canvas = document.getElementById('expCanvas');
    if (!canvas) {
        return;
    }

    const ctx = canvas.getContext('2d');

    const controls = {
        base: document.getElementById('expBase'),
        m: document.getElementById('expM'),
        n: document.getElementById('expN'),
        k: document.getElementById('expK')
    };

    const outputs = {
        m: document.getElementById('expMVal'),
        n: document.getElementById('expNVal'),
        k: document.getElementById('expKVal'),
        equation: document.getElementById('expEquation'),
        condition: document.getElementById('expCondition'),
        trend: document.getElementById('expTrend'),
        solution: document.getElementById('expSolution'),
        check: document.getElementById('expCheck'),
        summary: document.getElementById('expSummary')
    };

    if (Object.values(controls).some(control => !control) || Object.values(outputs).some(output => !output)) {
        return;
    }

    const xMin = -6;
    const xMax = 6;

    function render() {
        const a = Number.parseFloat(controls.base.value);
        const m = Number.parseFloat(controls.m.value);
        const n = Number.parseFloat(controls.n.value);
        const k = Number.parseFloat(controls.k.value);

        outputs.m.textContent = formatNumber(m);
        outputs.n.textContent = formatNumber(n);
        outputs.k.textContent = formatNumber(k);

        outputs.equation.textContent = `${formatNumber(a)}^(${formatLinearExpression(m, n)}) = ${formatNumber(k)}`;
        outputs.condition.textContent = 'Podmínka: pravá strana musí být kladná (k > 0).';

        const growthIndicator = m * Math.log(a);
        if (Math.abs(m) < EPS) {
            outputs.trend.textContent = 'konstantní (m = 0)';
        } else if (growthIndicator > 0) {
            outputs.trend.textContent = 'rostoucí';
        } else {
            outputs.trend.textContent = 'klesající';
        }

        let solutionX = Number.NaN;
        const constValue = Math.pow(a, n);

        if (k <= 0) {
            outputs.solution.textContent = '∅';
            outputs.check.textContent = 'Levá strana je vždy > 0';
            outputs.summary.textContent = 'Žádné reálné řešení';
        } else if (Math.abs(m) < EPS) {
            if (almostEqual(constValue, k, 1e-8)) {
                outputs.solution.textContent = 'x ∈ ℝ';
                outputs.check.textContent = `${formatNumber(a)}^(${formatNumber(n)}) = ${formatNumber(k)}`;
                outputs.summary.textContent = 'Nekonečně mnoho řešení';
            } else {
                outputs.solution.textContent = '∅';
                outputs.check.textContent = `${formatNumber(a)}^(${formatNumber(n)}) = ${formatNumber(constValue, 4)} ≠ ${formatNumber(k)}`;
                outputs.summary.textContent = 'Žádné reálné řešení';
            }
        } else {
            solutionX = (Math.log(k) / Math.log(a) - n) / m;
            const checkValue = Math.pow(a, m * solutionX + n);

            outputs.solution.textContent = `x = ${formatNumber(solutionX, 4)}`;
            outputs.check.textContent = `${formatNumber(a)}^(${formatNumber(m * solutionX + n, 4)}) = ${formatNumber(checkValue, 4)}`;

            if (solutionX < xMin || solutionX > xMax) {
                outputs.summary.textContent = '1 reálné řešení (mimo vykreslený interval)';
            } else {
                outputs.summary.textContent = '1 reálné řešení';
            }
        }

        const expFn = x => Math.pow(a, m * x + n);

        let [yMin, yMax] = estimateYRange(expFn, xMin, xMax);
        yMin = Math.min(yMin, k, 0) - 1.2;
        yMax = Math.max(yMax, k, 2) + 1.2;

        yMin = Math.max(-8, yMin);
        yMax = Math.min(40, yMax);
        if (yMax - yMin < 4) {
            yMax = yMin + 4;
        }

        const viewport = createViewport(canvas.width, canvas.height, xMin, xMax, yMin, yMax);

        drawPlane(ctx, viewport);
        drawCurve(ctx, viewport, expFn, '#6366f1', 2.8);
        drawHorizontalLine(ctx, viewport, k, '#10b981');

        if (Number.isFinite(solutionX) && k > 0) {
            drawPoint(ctx, viewport, solutionX, k, '#ef4444', `x=${formatNumber(solutionX, 3)}`);
        }
    }

    controls.base.addEventListener('change', render);
    controls.m.addEventListener('input', render);
    controls.n.addEventListener('input', render);
    controls.k.addEventListener('input', render);

    render();
}

function initLogarithmicLab() {
    const canvas = document.getElementById('logCanvas');
    if (!canvas) {
        return;
    }

    const ctx = canvas.getContext('2d');

    const controls = {
        base: document.getElementById('logBase'),
        h: document.getElementById('logH'),
        c: document.getElementById('logC')
    };

    const outputs = {
        h: document.getElementById('logHVal'),
        c: document.getElementById('logCVal'),
        equation: document.getElementById('logEquation'),
        domain: document.getElementById('logDomain'),
        trend: document.getElementById('logTrend'),
        solution: document.getElementById('logSolution'),
        check: document.getElementById('logCheck'),
        summary: document.getElementById('logSummary')
    };

    if (Object.values(controls).some(control => !control) || Object.values(outputs).some(output => !output)) {
        return;
    }

    function render() {
        const a = Number.parseFloat(controls.base.value);
        const h = Number.parseFloat(controls.h.value);
        const c = Number.parseFloat(controls.c.value);

        outputs.h.textContent = formatNumber(h);
        outputs.c.textContent = formatNumber(c);

        const argLabel = formatShiftExpression(h);
        outputs.equation.textContent = `log_${formatNumber(a)}(${argLabel}) = ${formatNumber(c)}`;
        outputs.domain.textContent = `Podmínka: ${argLabel} > 0  ⇒  x > ${formatNumber(h)}`;

        outputs.trend.textContent = a > 1 ? 'rostoucí' : 'klesající';

        const solutionX = h + Math.pow(a, c);
        const checkValue = Math.log(solutionX - h) / Math.log(a);

        outputs.solution.textContent = `x = ${formatNumber(solutionX, 4)}`;
        outputs.check.textContent = `log_${formatNumber(a)}(${formatNumber(solutionX - h, 4)}) = ${formatNumber(checkValue, 4)}`;

        let xMin = Math.min(-6, h - 4);
        let xMax = clamp(solutionX + 6, 12, 110);
        if (xMax <= h + 2) {
            xMax = h + 6;
        }

        const yMin = -5;
        const yMax = 5;

        const viewport = createViewport(canvas.width, canvas.height, xMin, xMax, yMin, yMax);
        const logFn = x => Math.log(x - h) / Math.log(a);
        const domainFn = x => x > h + 1e-4;

        drawPlane(ctx, viewport);
        drawVerticalLine(ctx, viewport, h, '#ef4444');
        drawCurve(ctx, viewport, logFn, '#3b82f6', 2.8, domainFn);
        drawHorizontalLine(ctx, viewport, c, '#10b981');
        drawPoint(ctx, viewport, solutionX, c, '#f59e0b', `x=${formatNumber(solutionX, 3)}`);

        if (solutionX > xMax || solutionX < xMin) {
            outputs.summary.textContent = '1 reálné řešení (mimo vykreslený interval)';
        } else {
            outputs.summary.textContent = '1 reálné řešení';
        }
    }

    controls.base.addEventListener('change', render);
    controls.h.addEventListener('input', render);
    controls.c.addEventListener('input', render);

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
        isCorrect: almostEqual(userValue, expectedValue, tolerance),
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
        showInterimFeedback(exercise, 'Zadejte množinu čísel oddělenou čárkou (např. -3, 0, 3).');
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

    const parts = cleaned
        .split(/[;,]/)
        .map(part => part.trim())
        .filter(Boolean);

    if (!parts.length) {
        return { valid: false, values: [] };
    }

    const values = [];

    for (const part of parts) {
        const parsed = parseMathNumber(part);
        if (!Number.isFinite(parsed)) {
            return { valid: false, values: [] };
        }

        if (!values.some(value => almostEqual(value, parsed, tolerance))) {
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
        if (!almostEqual(first[index], second[index], tolerance)) {
            return false;
        }
    }

    return true;
}
