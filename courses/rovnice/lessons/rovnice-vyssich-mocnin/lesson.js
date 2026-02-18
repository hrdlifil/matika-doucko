document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initIntroLab();
    initFactorChallenge();
    initGuessRootLab();
    initHornerLab();
    initSubstitutionLab();
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

function toSuperscript(power) {
    const map = {
        '-': '⁻',
        0: '⁰',
        1: '¹',
        2: '²',
        3: '³',
        4: '⁴',
        5: '⁵',
        6: '⁶',
        7: '⁷',
        8: '⁸',
        9: '⁹'
    };

    return String(power)
        .split('')
        .map(char => map[char] || char)
        .join('');
}

function buildPolynomialString(coeffs) {
    const degree = coeffs.length - 1;
    const terms = [];

    coeffs.forEach((coefficient, index) => {
        if (Math.abs(coefficient) < EPS) {
            return;
        }

        const power = degree - index;
        const absCoef = Math.abs(coefficient);
        const powerPart = power === 0
            ? ''
            : power === 1
                ? 'x'
                : `x${toSuperscript(power)}`;

        let termBody = '';
        if (!powerPart) {
            termBody = formatNumber(absCoef);
        } else if (Math.abs(absCoef - 1) < EPS) {
            termBody = powerPart;
        } else {
            termBody = `${formatNumber(absCoef)}${powerPart}`;
        }

        if (!terms.length) {
            terms.push(`${coefficient < 0 ? '-' : ''}${termBody}`);
        } else {
            terms.push(`${coefficient < 0 ? ' - ' : ' + '}${termBody}`);
        }
    });

    return terms.length ? terms.join('') : '0';
}

function buildExpressionFromTerms(terms) {
    const sorted = [...terms].sort((first, second) => second.power - first.power);
    return buildPolynomialStringFromTermArray(sorted);
}

function buildPolynomialStringFromTermArray(sortedTerms) {
    const parts = [];

    sortedTerms.forEach(term => {
        const coefficient = term.coef;
        const power = term.power;

        if (Math.abs(coefficient) < EPS) {
            return;
        }

        const absCoef = Math.abs(coefficient);
        const powerPart = power === 0
            ? ''
            : power === 1
                ? 'x'
                : `x${toSuperscript(power)}`;

        let body = '';
        if (!powerPart) {
            body = formatNumber(absCoef);
        } else if (Math.abs(absCoef - 1) < EPS) {
            body = powerPart;
        } else {
            body = `${formatNumber(absCoef)}${powerPart}`;
        }

        if (!parts.length) {
            parts.push(`${coefficient < 0 ? '-' : ''}${body}`);
        } else {
            parts.push(`${coefficient < 0 ? ' - ' : ' + '}${body}`);
        }
    });

    return parts.length ? parts.join('') : '0';
}

function formatSet(values, precision = 3) {
    if (!values.length) {
        return '∅';
    }

    return `{${values.map(value => formatNumber(value, precision)).join(', ')}}`;
}

function uniqueSorted(values, tolerance = 1e-7) {
    const sorted = [...values].sort((first, second) => first - second);
    const unique = [];

    sorted.forEach(value => {
        if (!unique.some(existing => Math.abs(existing - value) <= tolerance)) {
            unique.push(value);
        }
    });

    return unique;
}

function evaluatePolynomial(coeffs, x) {
    return coeffs.reduce((accumulator, coefficient) => accumulator * x + coefficient, 0);
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

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.34)';
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

    const step = (viewport.xMax - viewport.xMin) / 650;
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

function drawPoint(ctx, viewport, x, y, color, label = '') {
    const px = toCanvasX(x, viewport);
    const py = toCanvasY(y, viewport);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, py, 5.1, 0, Math.PI * 2);
    ctx.fill();

    if (label) {
        ctx.font = '600 12px Inter, sans-serif';
        ctx.fillStyle = color;
        ctx.fillText(label, px + 8, py - 8);
    }
}

function estimateYRange(fn, xMin, xMax, samples = 350) {
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (let index = 0; index <= samples; index += 1) {
        const x = xMin + (xMax - xMin) * (index / samples);
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
    const padding = Math.max(1.5, span * 0.18);
    return [minY - padding, maxY + padding];
}

function findRealRoots(fn, xMin, xMax, segments = 2000) {
    const roots = [];
    const step = (xMax - xMin) / segments;

    let previousX = xMin;
    let previousY = fn(previousX);

    if (Math.abs(previousY) < 1e-6) {
        pushRoot(roots, previousX);
    }

    for (let index = 1; index <= segments; index += 1) {
        const currentX = xMin + index * step;
        const currentY = fn(currentX);

        if (!Number.isFinite(previousY) || !Number.isFinite(currentY)) {
            previousX = currentX;
            previousY = currentY;
            continue;
        }

        if (Math.abs(currentY) < 1e-6) {
            pushRoot(roots, currentX);
        }

        if (previousY * currentY < 0) {
            const root = bisectionRoot(fn, previousX, currentX);
            if (Number.isFinite(root)) {
                pushRoot(roots, root);
            }
        }

        previousX = currentX;
        previousY = currentY;
    }

    return uniqueSorted(roots, 1e-4);
}

function bisectionRoot(fn, left, right, iterations = 45) {
    let l = left;
    let r = right;
    let fL = fn(l);
    let fR = fn(r);

    if (!Number.isFinite(fL) || !Number.isFinite(fR)) {
        return Number.NaN;
    }

    for (let step = 0; step < iterations; step += 1) {
        const middle = (l + r) / 2;
        const fM = fn(middle);

        if (!Number.isFinite(fM)) {
            return Number.NaN;
        }

        if (Math.abs(fM) < 1e-9) {
            return middle;
        }

        if (fL * fM <= 0) {
            r = middle;
            fR = fM;
        } else {
            l = middle;
            fL = fM;
        }
    }

    return (l + r) / 2;
}

function pushRoot(collection, candidate) {
    if (!Number.isFinite(candidate)) {
        return;
    }

    if (collection.some(existing => Math.abs(existing - candidate) <= 1e-4)) {
        return;
    }

    collection.push(candidate);
}

function initIntroLab() {
    const canvas = document.getElementById('introCanvas');
    if (!canvas) {
        return;
    }

    const ctx = canvas.getContext('2d');
    const sliders = {
        a: document.getElementById('introA'),
        b: document.getElementById('introB'),
        c: document.getElementById('introC'),
        d: document.getElementById('introD')
    };

    const outputs = {
        a: document.getElementById('introAVal'),
        b: document.getElementById('introBVal'),
        c: document.getElementById('introCVal'),
        d: document.getElementById('introDVal'),
        equation: document.getElementById('introEquation'),
        roots: document.getElementById('introRealRoots'),
        rootCount: document.getElementById('introRootCount'),
        behaviour: document.getElementById('introBehaviour')
    };

    function render() {
        const a = sanitizeLeadingCoefficient(sliders.a, 1);
        const b = Number.parseFloat(sliders.b.value);
        const c = Number.parseFloat(sliders.c.value);
        const d = Number.parseFloat(sliders.d.value);

        outputs.a.textContent = formatNumber(a);
        outputs.b.textContent = formatNumber(b);
        outputs.c.textContent = formatNumber(c);
        outputs.d.textContent = formatNumber(d);

        const coefficients = [a, b, c, d];
        const q = x => evaluatePolynomial(coefficients, x);

        outputs.equation.textContent = `${buildPolynomialString(coefficients)} = 0`;

        const roots = findRealRoots(q, -8, 8, 2200);
        outputs.roots.textContent = formatSet(roots, 3);
        outputs.rootCount.textContent = String(roots.length);

        if (roots.length === 0) {
            outputs.behaviour.textContent = 'V aktuálním intervalu se kořen nenašel.';
        } else if (roots.length === 1) {
            outputs.behaviour.textContent = 'Nalezen 1 reálný kořen v zobrazeném intervalu.';
        } else {
            outputs.behaviour.textContent = `Nalezeno ${roots.length} reálných kořenů v zobrazeném intervalu.`;
        }

        let [yMin, yMax] = estimateYRange(q, -8, 8, 450);
        yMin = Math.max(Math.min(yMin, -1), -35);
        yMax = Math.min(Math.max(yMax, 1), 35);

        const viewport = createViewport(canvas.width, canvas.height, -8, 8, yMin, yMax);
        drawPlane(ctx, viewport);
        drawCurve(ctx, viewport, q, '#3b82f6', 2.8);

        roots.forEach(root => {
            drawPoint(ctx, viewport, root, 0, '#10b981', `x=${formatNumber(root)}`);
        });
    }

    Object.values(sliders).forEach(slider => {
        slider.addEventListener('input', render);
    });

    render();
}

function initFactorChallenge() {
    const equationOutput = document.getElementById('factorTaskEquation');
    const input = document.getElementById('factorInput');
    const checkButton = document.getElementById('factorCheckBtn');
    const newButton = document.getElementById('factorNewBtn');
    const feedback = document.getElementById('factorFeedback');
    const solution = document.getElementById('factorSolution');

    if (!equationOutput || !input || !checkButton || !newButton || !feedback || !solution) {
        return;
    }

    let currentTask = null;

    function randomCoefficient() {
        const values = [-9, -8, -7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8, 9];
        return values[Math.floor(Math.random() * values.length)];
    }

    function randomInt(minimum, maximum) {
        return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
    }

    function generateTask() {
        const k = randomInt(1, 4);
        const m1 = randomInt(1, 3);
        const m2 = randomInt(m1 + 1, m1 + 3);

        const terms = [
            { coef: randomCoefficient(), power: k + m2 },
            { coef: randomCoefficient(), power: k + m1 },
            { coef: randomCoefficient(), power: k }
        ];

        const reducedTerms = terms.map(term => ({
            coef: term.coef,
            power: term.power - k
        }));

        return {
            k,
            terms,
            reducedTerms
        };
    }

    function updateTaskView() {
        equationOutput.textContent = `${buildExpressionFromTerms(currentTask.terms)} = 0`;
        solution.innerHTML = '<div><span class="math-inline">xᵏ</span> zatím neznámé</div>';
        feedback.className = 'exercise-feedback';
        feedback.textContent = '';
        input.value = '';
    }

    function showSolution(isCorrect) {
        const kText = `x${toSuperscript(currentTask.k)}`;
        const reduced = buildExpressionFromTerms(currentTask.reducedTerms);
        solution.innerHTML = [
            `<div>${buildExpressionFromTerms(currentTask.terms)} = 0</div>`,
            `<div>${kText}(${reduced}) = 0</div>`,
            `<div class="equation-final">Nejvyšší vytýkatelná mocnina: ${kText}</div>`
        ].join('');

        if (isCorrect) {
            feedback.textContent = `Správně. Nejvyšší mocnina je ${kText}.`;
            feedback.className = 'exercise-feedback show correct';
        } else {
            feedback.textContent = `Nesprávně. Správně lze vytknout ${kText}.`;
            feedback.className = 'exercise-feedback show incorrect';
        }
    }

    checkButton.addEventListener('click', () => {
        const userValue = parseMathNumber(input.value);
        if (!Number.isFinite(userValue) || !Number.isInteger(userValue)) {
            feedback.textContent = 'Zadejte celé číslo k (např. 2).';
            feedback.className = 'exercise-feedback show incorrect';
            return;
        }

        const isCorrect = userValue === currentTask.k;
        showSolution(isCorrect);
    });

    newButton.addEventListener('click', () => {
        currentTask = generateTask();
        updateTaskView();
    });

    currentTask = generateTask();
    updateTaskView();
}

function initGuessRootLab() {
    const equation = document.getElementById('guessEquation');
    const candidates = document.getElementById('guessCandidates');
    const input = document.getElementById('guessInput');
    const checkButton = document.getElementById('guessCheckBtn');
    const newButton = document.getElementById('guessNewBtn');
    const feedback = document.getElementById('guessFeedback');
    const evalBox = document.getElementById('guessEval');

    if (!equation || !candidates || !input || !checkButton || !newButton || !feedback || !evalBox) {
        return;
    }

    const tasks = [
        {
            coeffs: [1, -6, 11, -6],
            roots: [1, 2, 3],
            rootLabels: ['1', '2', '3']
        },
        {
            coeffs: [2, -3, -8, 12],
            roots: [-2, 1.5, 2],
            rootLabels: ['-2', '3/2', '2']
        },
        {
            coeffs: [1, 1, -4, -4],
            roots: [-2, -1, 2],
            rootLabels: ['-2', '-1', '2']
        }
    ];

    let currentTask = tasks[0];

    function gcd(a, b) {
        let x = Math.abs(a);
        let y = Math.abs(b);

        while (y !== 0) {
            const temp = y;
            y = x % y;
            x = temp;
        }

        return x || 1;
    }

    function divisors(value) {
        const absValue = Math.abs(value);
        if (absValue === 0) {
            return [0];
        }

        const result = new Set();
        for (let candidate = 1; candidate <= absValue; candidate += 1) {
            if (absValue % candidate === 0) {
                result.add(candidate);
            }
        }

        return Array.from(result).sort((first, second) => first - second);
    }

    function generateRationalCandidates(coeffs) {
        const leading = Math.round(Math.abs(coeffs[0]));
        const constant = Math.round(Math.abs(coeffs[coeffs.length - 1]));

        const pDiv = divisors(constant);
        const qDiv = divisors(leading);

        const seen = new Map();

        pDiv.forEach(p => {
            qDiv.forEach(q => {
                if (q === 0) {
                    return;
                }

                const common = gcd(p, q);
                const numerator = p / common;
                const denominator = q / common;
                const value = numerator / denominator;

                [1, -1].forEach(sign => {
                    const signedValue = sign * value;
                    const key = signedValue.toFixed(8);
                    if (!seen.has(key)) {
                        const labelBase = denominator === 1 ? `${numerator}` : `${numerator}/${denominator}`;
                        const label = sign < 0 ? `-${labelBase}` : labelBase;
                        seen.set(key, {
                            value: signedValue,
                            label
                        });
                    }
                });
            });
        });

        return Array.from(seen.values()).sort((first, second) => first.value - second.value);
    }

    function setTask(task) {
        currentTask = task;
        equation.textContent = `${buildPolynomialString(currentTask.coeffs)} = 0`;

        const candidateList = generateRationalCandidates(currentTask.coeffs);
        candidates.textContent = candidateList.map(item => item.label).join(', ');

        feedback.className = 'exercise-feedback';
        feedback.textContent = '';
        evalBox.innerHTML = '<div>Zatím nevyhodnoceno.</div>';
        input.value = '';
    }

    checkButton.addEventListener('click', () => {
        const userValue = parseMathNumber(input.value);
        if (!Number.isFinite(userValue)) {
            feedback.textContent = 'Zadejte číslo nebo zlomek (např. 2 nebo 3/2).';
            feedback.className = 'exercise-feedback show incorrect';
            return;
        }

        const evaluated = evaluatePolynomial(currentTask.coeffs, userValue);
        const isRoot = Math.abs(evaluated) <= 1e-8;

        if (isRoot) {
            feedback.textContent = `Správně. x = ${formatNumber(userValue)} je kořen.`;
            feedback.className = 'exercise-feedback show correct';

            evalBox.innerHTML = [
                `<div>P(${formatNumber(userValue)}) = ${formatNumber(evaluated, 8)}</div>`,
                '<div class="equation-final">Zbytek je 0, číslo je kořen.</div>',
                `<div>Kořeny tohoto polynomu: {${currentTask.rootLabels.join(', ')}}</div>`
            ].join('');
        } else {
            feedback.textContent = `Nesprávně. Správný kořen je například x = ${currentTask.rootLabels[0]}.`;
            feedback.className = 'exercise-feedback show incorrect';

            evalBox.innerHTML = [
                `<div>P(${formatNumber(userValue)}) = ${formatNumber(evaluated, 6)}</div>`,
                '<div class="equation-final">Hodnota není 0, proto nejde o kořen.</div>'
            ].join('');
        }
    });

    newButton.addEventListener('click', () => {
        const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
        setTask(randomTask);
    });

    setTask(tasks[0]);
}

function initHornerLab() {
    const select = document.getElementById('hornerSelect');
    const input = document.getElementById('hornerRInput');
    const runButton = document.getElementById('hornerRunBtn');
    const equation = document.getElementById('hornerEquation');
    const quotientOut = document.getElementById('hornerQuotient');
    const remainderOut = document.getElementById('hornerRemainder');
    const verdictOut = document.getElementById('hornerVerdict');
    const tableBody = document.getElementById('hornerTableBody');

    if (!select || !input || !runButton || !equation || !quotientOut || !remainderOut || !verdictOut || !tableBody) {
        return;
    }

    const tasks = {
        p1: {
            coeffs: [1, -6, 11, -6],
            label: 'x³ - 6x² + 11x - 6'
        },
        p2: {
            coeffs: [2, -3, -8, 12],
            label: '2x³ - 3x² - 8x + 12'
        },
        p3: {
            coeffs: [1, -3, -7, 27, -18],
            label: 'x⁴ - 3x³ - 7x² + 27x - 18'
        }
    };

    function syntheticDivision(coeffs, r) {
        const row = [coeffs[0]];

        for (let index = 1; index < coeffs.length; index += 1) {
            row.push(coeffs[index] + row[index - 1] * r);
        }

        return {
            row,
            quotient: row.slice(0, -1),
            remainder: row[row.length - 1]
        };
    }

    function renderTable(coeffs, row, r) {
        tableBody.innerHTML = '';

        const coefficientRow = document.createElement('tr');
        coefficientRow.innerHTML = `
            <td>Koeficienty P(x)</td>
            <td>${coeffs.map(value => formatNumber(value)).join(', ')}</td>
        `;

        const rowResult = document.createElement('tr');
        rowResult.innerHTML = `
            <td>Horner pro r = ${formatNumber(r)}</td>
            <td>${row.map(value => formatNumber(value)).join(', ')}</td>
        `;

        const quotientRow = document.createElement('tr');
        quotientRow.innerHTML = `
            <td>Kvocient | Zbytek</td>
            <td>${row.slice(0, -1).map(value => formatNumber(value)).join(', ')} | ${formatNumber(row[row.length - 1])}</td>
        `;

        tableBody.appendChild(coefficientRow);
        tableBody.appendChild(rowResult);
        tableBody.appendChild(quotientRow);
    }

    function update() {
        const key = select.value;
        const task = tasks[key];
        if (!task) {
            return;
        }

        const r = parseMathNumber(input.value);
        if (!Number.isFinite(r)) {
            remainderOut.textContent = '—';
            verdictOut.textContent = 'Zadejte číslo r';
            verdictOut.className = 'pill warning';
            quotientOut.textContent = '—';
            return;
        }

        equation.textContent = `${task.label}`;

        const result = syntheticDivision(task.coeffs, r);
        const quotientText = buildPolynomialString(result.quotient);

        quotientOut.textContent = quotientText;
        remainderOut.textContent = formatNumber(result.remainder);

        if (Math.abs(result.remainder) <= 1e-8) {
            verdictOut.textContent = 'r je kořen';
            verdictOut.className = 'pill success';
        } else {
            verdictOut.textContent = 'r není kořen';
            verdictOut.className = 'pill warning';
        }

        renderTable(task.coeffs, result.row, r);
    }

    runButton.addEventListener('click', update);
    select.addEventListener('change', update);
    input.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            update();
        }
    });

    update();
}

function initSubstitutionLab() {
    const canvas = document.getElementById('subCanvas');
    if (!canvas) {
        return;
    }

    const ctx = canvas.getContext('2d');
    const sliders = {
        a: document.getElementById('subA'),
        b: document.getElementById('subB')
    };

    const outputs = {
        a: document.getElementById('subAVal'),
        b: document.getElementById('subBVal'),
        equation: document.getElementById('subEquation'),
        tEquation: document.getElementById('subTEq'),
        tRoots: document.getElementById('subTRoots'),
        xRoots: document.getElementById('subXRoots'),
        interpretation: document.getElementById('subInterpretation')
    };

    function render() {
        const a = Number.parseFloat(sliders.a.value);
        const b = Number.parseFloat(sliders.b.value);

        outputs.a.textContent = formatNumber(a);
        outputs.b.textContent = formatNumber(b);

        outputs.equation.textContent = `${buildPolynomialString([1, 0, a, 0, b])} = 0`;
        outputs.tEquation.textContent = `${buildPolynomialString([1, a, b]).replace(/x/g, 't')} = 0`;

        const tRoots = solveQuadratic(1, a, b);
        outputs.tRoots.textContent = formatSet(tRoots, 4);

        const xRoots = [];
        tRoots.forEach(root => {
            if (root < -1e-9) {
                return;
            }

            if (Math.abs(root) <= 1e-9) {
                pushRoot(xRoots, 0);
                return;
            }

            const sqrtRoot = Math.sqrt(root);
            pushRoot(xRoots, -sqrtRoot);
            pushRoot(xRoots, sqrtRoot);
        });

        const sortedXRoots = uniqueSorted(xRoots, 1e-7);
        outputs.xRoots.textContent = formatSet(sortedXRoots, 4);

        if (!sortedXRoots.length) {
            outputs.interpretation.textContent = 'Žádný reálný kořen';
        } else if (sortedXRoots.length === 1) {
            outputs.interpretation.textContent = '1 reálný kořen';
        } else {
            outputs.interpretation.textContent = `${sortedXRoots.length} reálné kořeny`;
        }

        const q = x => x ** 4 + a * x * x + b;
        let [yMin, yMax] = estimateYRange(q, -4.5, 4.5, 450);
        yMin = Math.max(Math.min(yMin, -1.5), -35);
        yMax = Math.min(Math.max(yMax, 1.5), 35);

        const viewport = createViewport(canvas.width, canvas.height, -4.5, 4.5, yMin, yMax);
        drawPlane(ctx, viewport);
        drawCurve(ctx, viewport, q, '#6366f1', 2.8);

        sortedXRoots.forEach(root => {
            drawPoint(ctx, viewport, root, 0, '#10b981', `x=${formatNumber(root)}`);
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

