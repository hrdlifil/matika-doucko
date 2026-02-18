document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initSubstitutionLab();
    initEliminationLab();
    initComparisonLab();
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

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
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

function formatTerm(coef, symbol, isFirst) {
    if (Math.abs(coef) < EPS) {
        return '';
    }

    const absCoef = Math.abs(coef);
    const magnitude = almostEqual(absCoef, 1) ? '' : formatNumber(absCoef);
    const body = `${magnitude}${symbol}`;

    if (isFirst) {
        return coef < 0 ? `-${body}` : body;
    }

    return coef < 0 ? ` - ${body}` : ` + ${body}`;
}

function formatGeneralLine(a, b, c) {
    let lhs = '';

    const xTerm = formatTerm(a, 'x', true);
    if (xTerm) {
        lhs += xTerm;
    }

    const yTerm = formatTerm(b, 'y', !xTerm);
    if (yTerm) {
        lhs += yTerm;
    }

    if (!lhs) {
        lhs = '0';
    }

    return `${lhs} = ${formatNumber(c)}`;
}

function formatSlopeLine(m, n) {
    let slopePart = '';

    if (almostEqual(Math.abs(m), 1)) {
        slopePart = m < 0 ? '-x' : 'x';
    } else if (almostEqual(m, 0)) {
        slopePart = '0';
    } else {
        slopePart = `${formatNumber(m)}x`;
    }

    if (almostEqual(m, 0)) {
        return `y = ${formatNumber(n)}`;
    }

    if (almostEqual(n, 0)) {
        return `y = ${slopePart}`;
    }

    return `y = ${slopePart}${n > 0 ? ' + ' : ' - '}${formatNumber(Math.abs(n))}`;
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

    const xStep = chooseGridStep(viewport.xMax - viewport.xMin);
    const yStep = chooseGridStep(viewport.yMax - viewport.yMin);

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

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
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

function drawGeneralLine(ctx, viewport, a, b, c, color, lineWidth = 2.6) {
    if (Math.abs(a) < EPS && Math.abs(b) < EPS) {
        return;
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();

    if (Math.abs(b) > EPS) {
        const x1 = viewport.xMin;
        const y1 = (c - a * x1) / b;
        const x2 = viewport.xMax;
        const y2 = (c - a * x2) / b;

        ctx.moveTo(toCanvasX(x1, viewport), toCanvasY(y1, viewport));
        ctx.lineTo(toCanvasX(x2, viewport), toCanvasY(y2, viewport));
    } else {
        const x = c / a;
        ctx.moveTo(toCanvasX(x, viewport), toCanvasY(viewport.yMin, viewport));
        ctx.lineTo(toCanvasX(x, viewport), toCanvasY(viewport.yMax, viewport));
    }

    ctx.stroke();
}

function drawSlopeLine(ctx, viewport, m, n, color, lineWidth = 2.6) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();

    const x1 = viewport.xMin;
    const y1 = m * x1 + n;
    const x2 = viewport.xMax;
    const y2 = m * x2 + n;

    ctx.moveTo(toCanvasX(x1, viewport), toCanvasY(y1, viewport));
    ctx.lineTo(toCanvasX(x2, viewport), toCanvasY(y2, viewport));
    ctx.stroke();
}

function drawPoint(ctx, viewport, x, y, color, label = '') {
    const px = toCanvasX(x, viewport);
    const py = toCanvasY(y, viewport);

    if (px < -30 || px > viewport.width + 30 || py < -30 || py > viewport.height + 30) {
        return;
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, py, 5.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    if (label) {
        ctx.fillStyle = color;
        ctx.font = '600 12px Inter, sans-serif';
        ctx.fillText(label, px + 8, py - 8);
    }
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(values) {
    return values[Math.floor(Math.random() * values.length)];
}

function gcdInt(a, b) {
    let x = Math.abs(Math.round(a));
    let y = Math.abs(Math.round(b));

    if (x === 0 && y === 0) {
        return 1;
    }

    while (y !== 0) {
        const temp = y;
        y = x % y;
        x = temp;
    }

    return x || 1;
}
function initSubstitutionLab() {
    const canvas = document.getElementById('subCanvas');
    if (!canvas) {
        return;
    }

    const ctx = canvas.getContext('2d');

    const controls = {
        m: document.getElementById('subM'),
        n: document.getElementById('subN'),
        a: document.getElementById('subA'),
        b: document.getElementById('subB'),
        c: document.getElementById('subC'),
        random: document.getElementById('subRandomBtn')
    };

    const outputs = {
        m: document.getElementById('subMVal'),
        n: document.getElementById('subNVal'),
        a: document.getElementById('subAVal'),
        b: document.getElementById('subBVal'),
        c: document.getElementById('subCVal'),
        eq1: document.getElementById('subEq1Text'),
        eq2: document.getElementById('subEq2Text'),
        steps: document.getElementById('subSteps'),
        type: document.getElementById('subType'),
        point: document.getElementById('subPoint'),
        check: document.getElementById('subCheck')
    };

    function setTypePill(element, type) {
        element.className = 'pill';
        if (type === 'one') {
            element.classList.add('success');
            element.textContent = 'Právě 1 řešení';
        } else if (type === 'infinite') {
            element.classList.add('warning');
            element.textContent = 'Nekonečně mnoho';
        } else {
            element.classList.add('danger');
            element.textContent = 'Žádné řešení';
        }
    }

    function renderSteps(lines) {
        outputs.steps.innerHTML = lines
            .map(line => `<div class="calc-line">${line}</div>`)
            .join('');
    }

    function render() {
        let m = Number.parseFloat(controls.m.value);
        let n = Number.parseFloat(controls.n.value);
        let a = Number.parseFloat(controls.a.value);
        let b = Number.parseFloat(controls.b.value);
        let c = Number.parseFloat(controls.c.value);

        if (Math.abs(a) < EPS && Math.abs(b) < EPS) {
            b = 1;
            controls.b.value = '1';
        }

        outputs.m.textContent = formatNumber(m);
        outputs.n.textContent = formatNumber(n);
        outputs.a.textContent = formatNumber(a);
        outputs.b.textContent = formatNumber(b);
        outputs.c.textContent = formatNumber(c);

        const eq1a = 1;
        const eq1b = -m;
        const eq1c = n;

        outputs.eq1.textContent = formatGeneralLine(eq1a, eq1b, eq1c);
        outputs.eq2.textContent = formatGeneralLine(a, b, c);

        const alpha = a * m + b;
        const beta = c - a * n;

        let solutionType = 'none';
        let x = Number.NaN;
        let y = Number.NaN;
        let steps = [];

        if (Math.abs(alpha) > EPS) {
            y = beta / alpha;
            x = m * y + n;
            solutionType = 'one';

            steps = [
                `1) x = ${formatNumber(m)}y ${n >= 0 ? '+' : '-'} ${formatNumber(Math.abs(n))}`,
                `2) ${formatNumber(a)}(${formatNumber(m)}y ${n >= 0 ? '+' : '-'} ${formatNumber(Math.abs(n))}) ${b >= 0 ? '+' : '-'} ${formatNumber(Math.abs(b))}y = ${formatNumber(c)}`,
                `3) (${formatNumber(alpha)})y = ${formatNumber(beta)}`,
                `4) y = ${formatNumber(y, 4)}, x = ${formatNumber(x, 4)}`
            ];

            outputs.point.textContent = `(x, y) = (${formatNumber(x, 4)}, ${formatNumber(y, 4)})`;
            const checkLeft1 = x - m * y;
            const checkLeft2 = a * x + b * y;
            outputs.check.textContent = `Kontrola: ${formatNumber(checkLeft1, 4)} = ${formatNumber(n, 4)} a ${formatNumber(checkLeft2, 4)} = ${formatNumber(c, 4)}.`;
        } else if (Math.abs(beta) <= EPS) {
            solutionType = 'infinite';
            steps = [
                `1) x = ${formatNumber(m)}y ${n >= 0 ? '+' : '-'} ${formatNumber(Math.abs(n))}`,
                `2) Po dosazení: (${formatNumber(alpha)})y = ${formatNumber(beta)}`,
                '3) Vyjde identita 0 = 0.',
                '4) Každý bod první přímky je řešením i druhé rovnice.'
            ];
            outputs.point.textContent = 'Obě rovnice popisují stejnou přímku.';
            outputs.check.textContent = 'Po dosazení vznikne identita 0 = 0.';
        } else {
            solutionType = 'none';
            steps = [
                `1) x = ${formatNumber(m)}y ${n >= 0 ? '+' : '-'} ${formatNumber(Math.abs(n))}`,
                `2) Po dosazení: (${formatNumber(alpha)})y = ${formatNumber(beta)}`,
                `3) Vyjde spor 0 = ${formatNumber(beta)}.`,
                '4) Přímky jsou rovnoběžné, nemají společný bod.'
            ];
            outputs.point.textContent = 'Soustava nemá řešení.';
            outputs.check.textContent = 'Po dosazení vznikne spor.';
        }

        setTypePill(outputs.type, solutionType);
        renderSteps(steps);

        const viewport = createViewport(canvas.width, canvas.height, -8, 8, -8, 8);
        drawPlane(ctx, viewport);
        drawGeneralLine(ctx, viewport, eq1a, eq1b, eq1c, '#8b5cf6', 2.8);
        drawGeneralLine(ctx, viewport, a, b, c, '#10b981', 2.8);

        if (solutionType === 'one') {
            drawPoint(ctx, viewport, x, y, '#ef4444', 'S');
        }
    }

    controls.random?.addEventListener('click', () => {
        controls.m.value = String(randomChoice([-3, -2.5, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5, 3]));
        controls.n.value = String(randomChoice([-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5]));

        let a = 0;
        let b = 0;
        while (Math.abs(a) < EPS && Math.abs(b) < EPS) {
            a = randomInt(-5, 5);
            b = randomInt(-5, 5);
        }

        controls.a.value = String(a);
        controls.b.value = String(b);
        controls.c.value = String(randomInt(-10, 10));
        render();
    });

    Object.values(controls).forEach(control => {
        if (!control || control === controls.random) {
            return;
        }
        control.addEventListener('input', render);
    });

    render();
}
function initEliminationLab() {
    const canvas = document.getElementById('elimCanvas');
    if (!canvas) {
        return;
    }

    const ctx = canvas.getContext('2d');

    const controls = {
        a1: document.getElementById('elimA1'),
        b1: document.getElementById('elimB1'),
        c1: document.getElementById('elimC1'),
        a2: document.getElementById('elimA2'),
        b2: document.getElementById('elimB2'),
        c2: document.getElementById('elimC2'),
        target: document.getElementById('elimTarget'),
        random: document.getElementById('elimRandomBtn')
    };

    const outputs = {
        a1: document.getElementById('elimA1Val'),
        b1: document.getElementById('elimB1Val'),
        c1: document.getElementById('elimC1Val'),
        a2: document.getElementById('elimA2Val'),
        b2: document.getElementById('elimB2Val'),
        c2: document.getElementById('elimC2Val'),
        eq1: document.getElementById('elimEq1Text'),
        eq2: document.getElementById('elimEq2Text'),
        multipliers: document.getElementById('elimMultipliers'),
        combined: document.getElementById('elimCombined'),
        derived: document.getElementById('elimDerived'),
        type: document.getElementById('elimType'),
        point: document.getElementById('elimPoint'),
        check: document.getElementById('elimCheck')
    };

    function setTypePill(element, type) {
        element.className = 'pill';
        if (type === 'one') {
            element.classList.add('success');
            element.textContent = 'Právě 1 řešení';
        } else if (type === 'infinite') {
            element.classList.add('warning');
            element.textContent = 'Nekonečně mnoho';
        } else {
            element.classList.add('danger');
            element.textContent = 'Žádné řešení';
        }
    }

    function render() {
        let a1 = Number.parseFloat(controls.a1.value);
        let b1 = Number.parseFloat(controls.b1.value);
        let c1 = Number.parseFloat(controls.c1.value);
        let a2 = Number.parseFloat(controls.a2.value);
        let b2 = Number.parseFloat(controls.b2.value);
        let c2 = Number.parseFloat(controls.c2.value);

        if (Math.abs(a1) < EPS && Math.abs(b1) < EPS) {
            b1 = 1;
            controls.b1.value = '1';
        }

        if (Math.abs(a2) < EPS && Math.abs(b2) < EPS) {
            b2 = 1;
            controls.b2.value = '1';
        }

        outputs.a1.textContent = formatNumber(a1);
        outputs.b1.textContent = formatNumber(b1);
        outputs.c1.textContent = formatNumber(c1);
        outputs.a2.textContent = formatNumber(a2);
        outputs.b2.textContent = formatNumber(b2);
        outputs.c2.textContent = formatNumber(c2);

        outputs.eq1.textContent = formatGeneralLine(a1, b1, c1);
        outputs.eq2.textContent = formatGeneralLine(a2, b2, c2);

        const target = controls.target.value;
        const t1 = target === 'x' ? a1 : b1;
        const t2 = target === 'x' ? a2 : b2;

        let m1 = 1;
        let m2 = 1;

        if (Math.abs(t1) < EPS && Math.abs(t2) < EPS) {
            m1 = 1;
            m2 = 1;
        } else if (Math.abs(t1) < EPS) {
            m1 = 1;
            m2 = 0;
        } else if (Math.abs(t2) < EPS) {
            m1 = 0;
            m2 = 1;
        } else {
            const g = gcdInt(t1, t2);
            m1 = t2 / g;
            m2 = -t1 / g;
        }

        const A1 = m1 * a1;
        const B1 = m1 * b1;
        const C1 = m1 * c1;

        const A2 = m2 * a2;
        const B2 = m2 * b2;
        const C2 = m2 * c2;

        const aSum = A1 + A2;
        const bSum = B1 + B2;
        const cSum = C1 + C2;

        outputs.multipliers.innerHTML = `<span>${formatNumber(m1)}·(${formatGeneralLine(a1, b1, c1)}) + ${formatNumber(m2)}·(${formatGeneralLine(a2, b2, c2)})</span>`;
        outputs.combined.innerHTML = `<span>Po sečtení: ${formatGeneralLine(aSum, bSum, cSum)}</span>`;

        const det = a1 * b2 - a2 * b1;
        const detX = c1 * b2 - c2 * b1;
        const detY = a1 * c2 - a2 * c1;

        let type = 'none';
        let x = Number.NaN;
        let y = Number.NaN;

        if (Math.abs(det) > EPS) {
            type = 'one';
            x = detX / det;
            y = detY / det;
        } else if (Math.abs(detX) <= EPS && Math.abs(detY) <= EPS) {
            type = 'infinite';
        } else {
            type = 'none';
        }

        if (type === 'one') {
            outputs.point.textContent = `(x, y) = (${formatNumber(x, 4)}, ${formatNumber(y, 4)})`;

            if (target === 'x' && Math.abs(aSum) <= 1e-8 && Math.abs(bSum) > EPS) {
                const yFromElim = cSum / bSum;
                outputs.derived.innerHTML = `<span>${formatNumber(bSum)}y = ${formatNumber(cSum)} ⇒ y = ${formatNumber(yFromElim, 4)}</span>`;
            } else if (target === 'y' && Math.abs(bSum) <= 1e-8 && Math.abs(aSum) > EPS) {
                const xFromElim = cSum / aSum;
                outputs.derived.innerHTML = `<span>${formatNumber(aSum)}x = ${formatNumber(cSum)} ⇒ x = ${formatNumber(xFromElim, 4)}</span>`;
            } else {
                outputs.derived.innerHTML = '<span>Dopočítání proběhne dosazením do původní rovnice.</span>';
            }

            const left1 = a1 * x + b1 * y;
            const left2 = a2 * x + b2 * y;
            outputs.check.textContent = `Kontrola: ${formatNumber(left1, 4)} = ${formatNumber(c1, 4)} a ${formatNumber(left2, 4)} = ${formatNumber(c2, 4)}.`;
        } else if (type === 'infinite') {
            outputs.point.textContent = 'Rovnice popisují stejnou přímku.';
            outputs.derived.innerHTML = '<span>Po eliminaci vychází identita.</span>';
            outputs.check.textContent = 'Soustava má nekonečně mnoho řešení.';
        } else {
            outputs.point.textContent = 'Soustava nemá řešení.';
            outputs.derived.innerHTML = '<span>Po eliminaci vznikne spor.</span>';
            outputs.check.textContent = 'Přímky jsou rovnoběžné.';
        }

        setTypePill(outputs.type, type);

        const viewport = createViewport(canvas.width, canvas.height, -8, 8, -8, 8);
        drawPlane(ctx, viewport);
        drawGeneralLine(ctx, viewport, a1, b1, c1, '#8b5cf6', 2.8);
        drawGeneralLine(ctx, viewport, a2, b2, c2, '#10b981', 2.8);

        if (type === 'one') {
            drawPoint(ctx, viewport, x, y, '#ef4444', 'S');
        }
    }

    controls.random?.addEventListener('click', () => {
        controls.a1.value = String(randomInt(-5, 5));
        controls.b1.value = String(randomInt(-5, 5));
        controls.c1.value = String(randomInt(-10, 10));
        controls.a2.value = String(randomInt(-5, 5));
        controls.b2.value = String(randomInt(-5, 5));
        controls.c2.value = String(randomInt(-10, 10));

        if (controls.a1.value === '0' && controls.b1.value === '0') {
            controls.b1.value = '1';
        }

        if (controls.a2.value === '0' && controls.b2.value === '0') {
            controls.b2.value = '1';
        }

        render();
    });

    Object.values(controls).forEach(control => {
        if (!control || control === controls.random) {
            return;
        }
        control.addEventListener('input', render);
        control.addEventListener('change', render);
    });

    render();
}

function initComparisonLab() {
    const canvas = document.getElementById('compCanvas');
    if (!canvas) {
        return;
    }

    const ctx = canvas.getContext('2d');

    const controls = {
        m1: document.getElementById('compM1'),
        n1: document.getElementById('compN1'),
        m2: document.getElementById('compM2'),
        n2: document.getElementById('compN2'),
        random: document.getElementById('compRandomBtn')
    };

    const outputs = {
        m1: document.getElementById('compM1Val'),
        n1: document.getElementById('compN1Val'),
        m2: document.getElementById('compM2Val'),
        n2: document.getElementById('compN2Val'),
        eq1: document.getElementById('compEq1Text'),
        eq2: document.getElementById('compEq2Text'),
        steps: document.getElementById('compSteps'),
        type: document.getElementById('compType'),
        point: document.getElementById('compPoint'),
        check: document.getElementById('compCheck')
    };

    function setTypePill(element, type) {
        element.className = 'pill';
        if (type === 'one') {
            element.classList.add('success');
            element.textContent = 'Právě 1 řešení';
        } else if (type === 'infinite') {
            element.classList.add('warning');
            element.textContent = 'Nekonečně mnoho';
        } else {
            element.classList.add('danger');
            element.textContent = 'Žádné řešení';
        }
    }

    function renderSteps(lines) {
        outputs.steps.innerHTML = lines.map(line => `<div class="calc-line">${line}</div>`).join('');
    }

    function render() {
        const m1 = Number.parseFloat(controls.m1.value);
        const n1 = Number.parseFloat(controls.n1.value);
        const m2 = Number.parseFloat(controls.m2.value);
        const n2 = Number.parseFloat(controls.n2.value);

        outputs.m1.textContent = formatNumber(m1);
        outputs.n1.textContent = formatNumber(n1);
        outputs.m2.textContent = formatNumber(m2);
        outputs.n2.textContent = formatNumber(n2);

        outputs.eq1.textContent = formatSlopeLine(m1, n1);
        outputs.eq2.textContent = formatSlopeLine(m2, n2);

        const deltaM = m1 - m2;
        const deltaN = n2 - n1;

        let type = 'none';
        let x = Number.NaN;
        let y = Number.NaN;
        let steps = [];

        if (Math.abs(deltaM) > EPS) {
            type = 'one';
            x = deltaN / deltaM;
            y = m1 * x + n1;

            steps = [
                `${formatSlopeLine(m1, n1)} a ${formatSlopeLine(m2, n2)}`,
                `${formatNumber(m1)}x ${n1 >= 0 ? '+' : '-'} ${formatNumber(Math.abs(n1))} = ${formatNumber(m2)}x ${n2 >= 0 ? '+' : '-'} ${formatNumber(Math.abs(n2))}`,
                `${formatNumber(deltaM)}x = ${formatNumber(deltaN)} ⇒ x = ${formatNumber(x, 4)}`,
                `y = ${formatNumber(y, 4)}`
            ];

            outputs.point.textContent = `(x, y) = (${formatNumber(x, 4)}, ${formatNumber(y, 4)})`;
            outputs.check.textContent = `Kontrola: y₁ = ${formatNumber(m1 * x + n1, 4)}, y₂ = ${formatNumber(m2 * x + n2, 4)}.`;
        } else if (Math.abs(n1 - n2) <= EPS) {
            type = 'infinite';
            steps = [
                `${formatSlopeLine(m1, n1)} a ${formatSlopeLine(m2, n2)}`,
                'Směrnice i absolutní člen jsou stejné.',
                'Po porovnání vychází identita 0 = 0.',
                'Obě rovnice představují tutéž přímku.'
            ];
            outputs.point.textContent = 'Nekonečně mnoho průsečíků.';
            outputs.check.textContent = 'Přímky splývají.';
        } else {
            type = 'none';
            steps = [
                `${formatSlopeLine(m1, n1)} a ${formatSlopeLine(m2, n2)}`,
                'Směrnice jsou stejné, absolutní členy různé.',
                'Po porovnání vychází spor.',
                'Přímky jsou rovnoběžné.'
            ];
            outputs.point.textContent = 'Průsečík neexistuje.';
            outputs.check.textContent = 'Přímky se neprotínají.';
        }

        setTypePill(outputs.type, type);
        renderSteps(steps);

        const xMin = -8;
        const xMax = 8;
        const candidates = [m1 * xMin + n1, m1 * xMax + n1, m2 * xMin + n2, m2 * xMax + n2, 0];

        let yMin = Math.min(...candidates) - 2;
        let yMax = Math.max(...candidates) + 2;

        yMin = clamp(yMin, -14, 14);
        yMax = clamp(yMax, -14, 14);

        if (yMax - yMin < 6) {
            const center = (yMax + yMin) / 2;
            yMin = center - 3;
            yMax = center + 3;
        }

        const viewport = createViewport(canvas.width, canvas.height, xMin, xMax, yMin, yMax);
        drawPlane(ctx, viewport);
        drawSlopeLine(ctx, viewport, m1, n1, '#8b5cf6', 2.8);
        drawSlopeLine(ctx, viewport, m2, n2, '#10b981', 2.8);

        if (type === 'one') {
            drawPoint(ctx, viewport, x, y, '#ef4444', 'S');
        }
    }

    controls.random?.addEventListener('click', () => {
        controls.m1.value = String(randomChoice([-3, -2.5, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5, 3]));
        controls.n1.value = String(randomChoice([-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6]));
        controls.m2.value = String(randomChoice([-3, -2.5, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5, 3]));
        controls.n2.value = String(randomChoice([-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6]));
        render();
    });

    Object.values(controls).forEach(control => {
        if (!control || control === controls.random) {
            return;
        }
        control.addEventListener('input', render);
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
    } else if (type === 'pair') {
        evaluation = evaluatePairExercise(exercise, expectedRaw, tolerance);
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

function evaluatePairExercise(exercise, expectedRaw, tolerance) {
    const input = exercise.querySelector('.exercise-input');
    if (!input) {
        return null;
    }

    const parsedUser = parsePair(input.value);
    if (!parsedUser.valid) {
        showInterimFeedback(exercise, 'Zadejte dvojici jako x,y (např. 2, -1).');
        return null;
    }

    const parsedExpected = parsePair(expectedRaw);
    if (!parsedExpected.valid) {
        return null;
    }

    const isCorrect = almostEqual(parsedUser.values[0], parsedExpected.values[0], tolerance)
        && almostEqual(parsedUser.values[1], parsedExpected.values[1], tolerance);

    return {
        isCorrect,
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

function parsePair(rawValue) {
    if (typeof rawValue !== 'string') {
        return { valid: false, values: [] };
    }

    const cleaned = rawValue
        .replace(/[\[\](){}]/g, '')
        .trim();

    if (!cleaned) {
        return { valid: false, values: [] };
    }

    let parts = cleaned
        .split(/[;,]/)
        .map(part => part.trim())
        .filter(Boolean);

    if (parts.length !== 2) {
        parts = cleaned
            .split(/\s+/)
            .map(part => part.trim())
            .filter(Boolean);
    }

    if (parts.length !== 2) {
        return { valid: false, values: [] };
    }

    const x = parseMathNumber(parts[0]);
    const y = parseMathNumber(parts[1]);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return { valid: false, values: [] };
    }

    return { valid: true, values: [x, y] };
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

