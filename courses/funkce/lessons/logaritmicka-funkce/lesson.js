document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initNavbarScroll();
    initDefinitionLab();
    initShiftLab();
    initPropertiesLab();
    initMiniChecks();
    initExercises();
});

const EPS = 1e-9;

function typeset(target) {
    if (!window.MathJax || typeof window.MathJax.typesetPromise !== 'function') {
        return;
    }
    const nodes = target ? [target] : undefined;
    window.MathJax.typesetPromise(nodes).catch(() => { });
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function isZero(value, tolerance = EPS) {
    return Math.abs(value) < tolerance;
}

function logBase(x, base) {
    return Math.log(x) / Math.log(base);
}

function fmtNumber(value, digits = 2) {
    if (!Number.isFinite(value)) {
        return value > 0 ? '∞' : '-∞';
    }
    const abs = Math.abs(value);
    if (abs > 0 && (abs >= 1e6 || abs < 1e-4)) {
        return value.toExponential(2).replace('+', '');
    }
    const rounded = Math.round(value * 10 ** digits) / 10 ** digits;
    if (Math.abs(rounded) < 1e-10) {
        return '0';
    }
    if (Math.abs(rounded - Math.round(rounded)) < 1e-10) {
        return String(Math.round(rounded));
    }
    return rounded.toFixed(digits).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
}

function fmtBase(value) {
    if (Math.abs(value - Math.E) < 0.0015) {
        return 'e';
    }
    return fmtNumber(value, 3);
}

function monotonicityText(base, factor = 1) {
    if (isZero(factor)) {
        return 'konstantní';
    }
    const increasing = (base > 1 && factor > 0) || (base < 1 && factor < 0);
    return increasing ? 'striktně rostoucí' : 'striktně klesající';
}

function concavityText(base, factor = 1) {
    const sign = -factor / Math.log(base);
    return sign < 0 ? 'konkávní' : 'konvexní';
}

function rangeText(A, k) {
    if (isZero(A)) {
        return `{${fmtNumber(k, 3)}}`;
    }
    return 'R';
}

function shiftDirectionText(value, positiveLabel, negativeLabel) {
    if (isZero(value)) {
        return 'bez posunu';
    }
    return value > 0
        ? `${fmtNumber(Math.abs(value), 2)} ${positiveLabel}`
        : `${fmtNumber(Math.abs(value), 2)} ${negativeLabel}`;
}

function buildShiftFormula(A, a, h, k) {
    const aText = fmtBase(a);
    const arg = isZero(h)
        ? 'x'
        : (h > 0 ? `x-${fmtNumber(Math.abs(h), 2)}` : `x+${fmtNumber(Math.abs(h), 2)}`);

    let factor = '';
    if (isZero(A - 1)) {
        factor = '';
    } else if (isZero(A + 1)) {
        factor = '-';
    } else {
        factor = `${fmtNumber(A, 2)}·`;
    }

    const core = `${factor}log_${aText}(${arg})`;
    if (isZero(k)) {
        return core;
    }
    return k > 0 ? `${core}+${fmtNumber(k, 2)}` : `${core}-${fmtNumber(Math.abs(k), 2)}`;
}

function initNavigation() {
    const order = [
        'logaritmicka-funkce',
        'posuny-grafu-logaritmicke-funkce',
        'vlastnosti-logaritmicke-funkce',
        'procvicovani'
    ];

    const sections = document.querySelectorAll('.lesson-section');
    const links = document.querySelectorAll('.sidebar-link');
    const nextButtons = document.querySelectorAll('.btn-next');
    const prevButtons = document.querySelectorAll('.btn-prev');
    const progress = document.querySelector('.progress-fill-small');

    function setSection(id, smooth = true) {
        const section = document.getElementById(id);
        if (!section) {
            return;
        }

        sections.forEach(item => item.classList.remove('active'));
        links.forEach(item => item.classList.remove('active'));
        section.classList.add('active');

        const link = document.querySelector(`.sidebar-link[data-section="${id}"]`);
        if (link) {
            link.classList.add('active');
        }

        const index = order.indexOf(id);
        if (progress && index >= 0) {
            progress.style.width = `${((index + 1) / order.length) * 100}%`;
        }

        window.history.replaceState(null, '', `#${id}`);
        if (smooth) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        typeset(section);
    }

    links.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            setSection(link.dataset.section);
        });
    });

    nextButtons.forEach(button => {
        button.addEventListener('click', () => setSection(button.dataset.next));
    });

    prevButtons.forEach(button => {
        button.addEventListener('click', () => setSection(button.dataset.prev));
    });

    const hash = window.location.hash.replace('#', '');
    setSection(order.includes(hash) ? hash : order[0], false);
}

function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) {
        return;
    }

    window.addEventListener('scroll', () => {
        navbar.style.background = window.scrollY > 50 ? 'rgba(10, 10, 15, 0.95)' : 'rgba(10, 10, 15, 0.8)';
    });
}
function createPlane(canvas, bounds = {}) {
    const ctx = canvas.getContext('2d');
    return {
        canvas,
        ctx,
        width: canvas.width,
        height: canvas.height,
        xMin: bounds.xMin ?? -6,
        xMax: bounds.xMax ?? 6,
        yMin: bounds.yMin ?? -6,
        yMax: bounds.yMax ?? 6
    };
}

function setPlaneBounds(plane, bounds) {
    plane.xMin = bounds.xMin;
    plane.xMax = bounds.xMax;
    plane.yMin = bounds.yMin;
    plane.yMax = bounds.yMax;
}

function toCanvasX(plane, x) {
    return ((x - plane.xMin) / (plane.xMax - plane.xMin)) * plane.width;
}

function toCanvasY(plane, y) {
    return plane.height - ((y - plane.yMin) / (plane.yMax - plane.yMin)) * plane.height;
}

function drawGridAxes(plane, options = {}) {
    const ctx = plane.ctx;
    const xStep = options.xStep ?? 1;
    const yStep = options.yStep ?? 1;

    ctx.clearRect(0, 0, plane.width, plane.height);
    ctx.fillStyle = '#08080d';
    ctx.fillRect(0, 0, plane.width, plane.height);

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;

    for (let x = Math.ceil(plane.xMin / xStep) * xStep; x <= plane.xMax + EPS; x += xStep) {
        const px = toCanvasX(plane, x);
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, plane.height);
        ctx.stroke();
    }

    for (let y = Math.ceil(plane.yMin / yStep) * yStep; y <= plane.yMax + EPS; y += yStep) {
        const py = toCanvasY(plane, y);
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(plane.width, py);
        ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.8;
    const axisX = toCanvasY(plane, 0);
    const axisY = toCanvasX(plane, 0);

    if (axisX >= 0 && axisX <= plane.height) {
        ctx.beginPath();
        ctx.moveTo(0, axisX);
        ctx.lineTo(plane.width, axisX);
        ctx.stroke();
    }
    if (axisY >= 0 && axisY <= plane.width) {
        ctx.beginPath();
        ctx.moveTo(axisY, 0);
        ctx.lineTo(axisY, plane.height);
        ctx.stroke();
    }
}

function drawFunction(plane, evaluate, isDefined = () => true, options = {}) {
    const ctx = plane.ctx;
    const samples = options.samples ?? 1800;
    const color = options.color ?? '#6366f1';
    const lineWidth = options.lineWidth ?? 2.7;
    const dashed = options.dashed ?? false;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash(dashed ? [8, 5] : []);

    let drawing = false;
    let prevPy = 0;

    for (let i = 0; i <= samples; i += 1) {
        const x = plane.xMin + ((plane.xMax - plane.xMin) * i) / samples;
        if (!isDefined(x)) {
            if (drawing) {
                ctx.stroke();
                drawing = false;
            }
            continue;
        }

        const y = evaluate(x);
        if (!Number.isFinite(y)) {
            if (drawing) {
                ctx.stroke();
                drawing = false;
            }
            continue;
        }

        const px = toCanvasX(plane, x);
        const py = toCanvasY(plane, y);
        if (py < -250 || py > plane.height + 250) {
            if (drawing) {
                ctx.stroke();
                drawing = false;
            }
            continue;
        }

        if (!drawing || Math.abs(py - prevPy) > plane.height * 0.5) {
            if (drawing) {
                ctx.stroke();
            }
            ctx.beginPath();
            ctx.moveTo(px, py);
            drawing = true;
        } else {
            ctx.lineTo(px, py);
        }
        prevPy = py;
    }

    if (drawing) {
        ctx.stroke();
    }
    ctx.setLineDash([]);
}

function drawPoint(plane, x, y, color = '#10b981', radius = 5) {
    const ctx = plane.ctx;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(toCanvasX(plane, x), toCanvasY(plane, y), radius, 0, Math.PI * 2);
    ctx.fill();
}

function drawHorizontalLine(plane, y, color = 'rgba(249, 115, 22, 0.85)', dashed = true) {
    const ctx = plane.ctx;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash(dashed ? [8, 5] : []);
    ctx.beginPath();
    ctx.moveTo(0, toCanvasY(plane, y));
    ctx.lineTo(plane.width, toCanvasY(plane, y));
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawVerticalLine(plane, x, color = 'rgba(239, 68, 68, 0.85)', dashed = true) {
    const ctx = plane.ctx;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.setLineDash(dashed ? [8, 5] : []);
    ctx.beginPath();
    ctx.moveTo(toCanvasX(plane, x), 0);
    ctx.lineTo(toCanvasX(plane, x), plane.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function estimateYBounds(functions, xMin, xMax) {
    const samples = 800;
    let minY = Infinity;
    let maxY = -Infinity;

    for (let i = 0; i <= samples; i += 1) {
        const x = xMin + ((xMax - xMin) * i) / samples;
        functions.forEach(fn => {
            const y = fn(x);
            if (Number.isFinite(y) && Math.abs(y) < 1e6) {
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
        });
    }

    if (!Number.isFinite(minY) || !Number.isFinite(maxY)) {
        return { yMin: -6, yMax: 6 };
    }

    let span = maxY - minY;
    if (span < 3) {
        span = 3;
    }
    const pad = span * 0.2 + 0.8;

    let yMin = clamp(minY - pad, -40, 40);
    let yMax = clamp(maxY + pad, -40, 40);

    if (yMax - yMin < 5) {
        const center = (yMin + yMax) / 2;
        yMin = center - 2.5;
        yMax = center + 2.5;
    }

    return { yMin, yMax };
}
function initDefinitionLab() {
    const canvas = document.getElementById('logDefCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, { xMin: -0.5, xMax: 10, yMin: -6, yMax: 6 });
    const baseSelect = document.getElementById('logDefBase');
    const xSlider = document.getElementById('logDefX');

    const xValue = document.getElementById('logDefXValue');
    const formulaOut = document.getElementById('logDefFormula');
    const domainOut = document.getElementById('logDefDomain');
    const rangeOut = document.getElementById('logDefRange');
    const monotonicOut = document.getElementById('logDefMonotonic');
    const valueOut = document.getElementById('logDefValue');
    const relationOut = document.getElementById('logDefRelation');
    const limitsOut = document.getElementById('logDefLimits');
    const conclusionOut = document.getElementById('logDefConclusion');

    function render() {
        const a = Number(baseSelect.value);
        const x0 = Number(xSlider.value);

        const f = x => (x > 0 ? logBase(x, a) : NaN);
        const y0 = f(x0);
        const bounds = estimateYBounds([f], 0.05, 10);
        setPlaneBounds(plane, {
            xMin: -0.5,
            xMax: 10,
            yMin: clamp(Math.min(bounds.yMin, -4), -14, 14),
            yMax: clamp(Math.max(bounds.yMax, 4), -14, 14)
        });

        drawGridAxes(plane, { xStep: 1, yStep: 1 });
        drawVerticalLine(plane, 0, 'rgba(239, 68, 68, 0.9)');
        drawFunction(plane, f, x => x > 0, { color: '#6366f1', lineWidth: 2.8 });
        drawVerticalLine(plane, x0, 'rgba(16, 185, 129, 0.75)');
        drawPoint(plane, x0, y0, '#10b981', 5);
        drawPoint(plane, 1, 0, '#f59e0b', 4.5);

        xValue.textContent = fmtNumber(x0, 1);
        formulaOut.textContent = `f(x) = log_${fmtBase(a)}(x)`;
        domainOut.textContent = '(0, ∞)';
        rangeOut.textContent = 'R';
        monotonicOut.textContent = a > 1 ? 'striktně rostoucí' : 'striktně klesající';
        valueOut.textContent = fmtNumber(y0, 4);

        const relation = logBase(a * x0, a);
        relationOut.textContent = `${fmtNumber(relation, 4)} = ${fmtNumber(y0, 4)} + 1`;

        if (a > 1) {
            limitsOut.textContent = 'x→0+: -∞, x→∞: ∞';
        } else {
            limitsOut.textContent = 'x→0+: ∞, x→∞: -∞';
        }

        conclusionOut.textContent = a > 1
            ? `Protože a=${fmtNumber(a)} > 1, graf roste. Pro argument blízký nule míří hodnota k -∞.`
            : `Protože 0<a=${fmtNumber(a)}<1, graf klesá. Pro argument blízký nule míří hodnota k ∞.`;
    }

    baseSelect.addEventListener('change', render);
    xSlider.addEventListener('input', render);
    render();
}

function initShiftLab() {
    const canvas = document.getElementById('logShiftCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, { xMin: -5, xMax: 10, yMin: -8, yMax: 8 });
    const baseSelect = document.getElementById('logShiftBase');
    const aSlider = document.getElementById('logShiftA');
    const hSlider = document.getElementById('logShiftH');
    const kSlider = document.getElementById('logShiftK');
    const xSlider = document.getElementById('logShiftX');

    const aValue = document.getElementById('logShiftAValue');
    const hValue = document.getElementById('logShiftHValue');
    const kValue = document.getElementById('logShiftKValue');
    const xValue = document.getElementById('logShiftXValue');

    const formulaOut = document.getElementById('logShiftFormula');
    const asymptoteOut = document.getElementById('logShiftAsymptote');
    const domainOut = document.getElementById('logShiftDomain');
    const monotonicOut = document.getElementById('logShiftMonotonic');
    const rangeOut = document.getElementById('logShiftRange');
    const valueOut = document.getElementById('logShiftValue');
    const moveOut = document.getElementById('logShiftMove');
    const conclusionOut = document.getElementById('logShiftConclusion');

    function updateXRange(h) {
        const min = Number((h + 0.1).toFixed(1));
        xSlider.min = String(min);
        if (Number(xSlider.value) <= min) {
            xSlider.value = String(min + 0.1);
        }
    }

    function render() {
        const base = Number(baseSelect.value);
        const A = Number(aSlider.value);
        const h = Number(hSlider.value);
        const k = Number(kSlider.value);

        updateXRange(h);
        const x0 = Number(xSlider.value);

        const f = x => (x > 0 ? logBase(x, base) : NaN);
        const g = x => (x > h ? A * logBase(x - h, base) + k : NaN);

        const bounds = estimateYBounds([f, g, () => k], -5, 10);
        setPlaneBounds(plane, {
            xMin: -5,
            xMax: 10,
            yMin: clamp(bounds.yMin, -18, 18),
            yMax: clamp(bounds.yMax, -18, 18)
        });

        drawGridAxes(plane, { xStep: 1, yStep: 1 });
        drawFunction(plane, f, x => x > 0, { color: '#f59e0b', lineWidth: 2.2, dashed: true });
        drawFunction(plane, g, x => x > h, { color: '#6366f1', lineWidth: 2.8 });
        drawVerticalLine(plane, h, 'rgba(236, 72, 153, 0.9)');
        drawVerticalLine(plane, x0, 'rgba(16, 185, 129, 0.75)');
        drawPoint(plane, x0, g(x0), '#10b981', 5);
        drawPoint(plane, h + 1, k, '#f59e0b', 4.5);

        aValue.textContent = fmtNumber(A, 1);
        hValue.textContent = fmtNumber(h, 1);
        kValue.textContent = fmtNumber(k, 1);
        xValue.textContent = fmtNumber(x0, 1);

        formulaOut.textContent = `g(x) = ${buildShiftFormula(A, base, h, k)}`;
        asymptoteOut.textContent = `x = ${fmtNumber(h, 2)}`;
        domainOut.textContent = `(${fmtNumber(h, 2)}, ∞)`;
        monotonicOut.textContent = monotonicityText(base, A);
        rangeOut.textContent = rangeText(A, k);
        valueOut.textContent = fmtNumber(g(x0), 4);

        const horizontal = shiftDirectionText(h, 'doprava', 'doleva');
        const vertical = shiftDirectionText(k, 'nahoru', 'dolů');
        moveOut.textContent = `${horizontal}, ${vertical}`;

        let note = `Asymptota se posunula na x=${fmtNumber(h, 2)} a definiční obor je (${fmtNumber(h, 2)}, ∞).`;
        if (isZero(A)) {
            note += ` Pro A=0 dostaneme konstantní funkci s oborem hodnot {${fmtNumber(k, 2)}}.`;
        } else {
            note += ` Obor hodnot je R a bod (h+1, k) = (${fmtNumber(h + 1, 2)}, ${fmtNumber(k, 2)}) leží na grafu.`;
        }
        conclusionOut.textContent = note;
    }

    baseSelect.addEventListener('change', render);
    [aSlider, hSlider, kSlider, xSlider].forEach(slider => slider.addEventListener('input', render));
    render();
}
function initPropertiesLab() {
    const canvas = document.getElementById('logPropsCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, { xMin: -0.5, xMax: 10, yMin: -6, yMax: 6 });
    const baseSelect = document.getElementById('logPropsBase');
    const bSlider = document.getElementById('logPropsB');
    const xSlider = document.getElementById('logPropsX');

    const bValue = document.getElementById('logPropsBValue');
    const xValue = document.getElementById('logPropsXValue');
    const formulaOut = document.getElementById('logPropsFormula');
    const domainOut = document.getElementById('logPropsDomain');
    const rangeOut = document.getElementById('logPropsRange');
    const monotonicOut = document.getElementById('logPropsMonotonic');
    const concavityOut = document.getElementById('logPropsConcavity');
    const limitsOut = document.getElementById('logPropsLimits');
    const equationOut = document.getElementById('logPropsEquation');
    const solutionOut = document.getElementById('logPropsSolution');
    const checkOut = document.getElementById('logPropsCheck');
    const conclusionOut = document.getElementById('logPropsConclusion');

    function render() {
        const a = Number(baseSelect.value);
        const b = Number(bSlider.value);
        const x0 = Number(xSlider.value);

        const xSolution = a ** b;
        const xMax = clamp(Math.max(10, xSolution * 1.25), 10, 20);
        const f = x => (x > 0 ? logBase(x, a) : NaN);

        const bounds = estimateYBounds([f, () => b], 0.05, xMax);
        setPlaneBounds(plane, {
            xMin: -0.5,
            xMax,
            yMin: clamp(bounds.yMin, -18, 18),
            yMax: clamp(bounds.yMax, -18, 18)
        });

        drawGridAxes(plane, { xStep: 1, yStep: 1 });
        drawVerticalLine(plane, 0, 'rgba(239, 68, 68, 0.85)');
        drawFunction(plane, f, x => x > 0, { color: '#6366f1', lineWidth: 2.8 });
        drawHorizontalLine(plane, b, 'rgba(249, 115, 22, 0.85)');
        drawVerticalLine(plane, x0, 'rgba(16, 185, 129, 0.75)');
        drawPoint(plane, x0, f(x0), '#10b981', 5);

        if (xSolution <= xMax) {
            drawPoint(plane, xSolution, b, '#f97316', 5);
        }

        bValue.textContent = fmtNumber(b, 1);
        xValue.textContent = fmtNumber(x0, 1);

        formulaOut.textContent = `f(x) = log_${fmtBase(a)}(x)`;
        domainOut.textContent = '(0, ∞)';
        rangeOut.textContent = 'R';
        monotonicOut.textContent = monotonicityText(a, 1);
        concavityOut.textContent = concavityText(a, 1);
        limitsOut.textContent = a > 1 ? 'x→0+: -∞, x→∞: ∞' : 'x→0+: ∞, x→∞: -∞';

        equationOut.textContent = `log_${fmtBase(a)}(x) = ${fmtNumber(b, 3)}`;
        solutionOut.textContent = `x = ${fmtNumber(xSolution, 5)}`;
        checkOut.textContent = `log_${fmtBase(a)}(${fmtNumber(xSolution, 5)}) = ${fmtNumber(b, 3)}`;

        conclusionOut.textContent = `Rovnice log_${fmtBase(a)}(x)=${fmtNumber(b, 3)} má právě jedno řešení x=${fmtNumber(xSolution, 5)}.`;
    }

    baseSelect.addEventListener('change', render);
    bSlider.addEventListener('input', render);
    xSlider.addEventListener('input', render);
    render();
}

function initMiniChecks() {
    const buttons = document.querySelectorAll('.mini-check-btn');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const group = button.dataset.group;
            const selected = document.querySelector(`input[name="${group}"]:checked`);
            const options = document.querySelectorAll(`input[name="${group}"]`);
            const feedback = document.getElementById(button.dataset.feedback);

            if (!selected) {
                alert('Vyberte prosím jednu odpověď.');
                return;
            }

            const isCorrect = selected.value === button.dataset.correct;
            options.forEach(option => {
                option.disabled = true;
                option.parentElement.classList.remove('correct', 'incorrect');
            });
            button.disabled = true;

            selected.parentElement.classList.add(isCorrect ? 'correct' : 'incorrect');
            if (!isCorrect) {
                options.forEach(option => {
                    if (option.value === button.dataset.correct) {
                        option.parentElement.classList.add('correct');
                    }
                });
            }

            if (feedback) {
                const explanation = button.dataset.explanation || '';
                const correctLabel = button.dataset.correctLabel || '';
                feedback.innerHTML = isCorrect
                    ? `Správně. ${explanation}`
                    : `Nesprávně. Správná odpověď je ${correctLabel}. ${explanation}`;
                feedback.className = `mini-feedback show ${isCorrect ? 'correct' : 'incorrect'}`;
                typeset(feedback);
            }
        });
    });
}

function initExercises() {
    const explanation = {
        1: 'Logaritmus je definován jen pro kladné argumenty, tedy D(f)=(0,∞).',
        2: 'Z rovnosti log_3 x = 2 plyne x = 3^2 = 9.',
        3: 'x = (1/2)^(-3) = 2^3 = 8.',
        4: 'Asymptota je tam, kde argument přechází přes nulu: x-4=0, tedy x=4.',
        5: 'Násobení a posun obor hodnot logaritmu (A≠0) nezúží, zůstává R.',
        6: 'Pro základ mezi 0 a 1 je logaritmická funkce striktně klesající.',
        7: 'log_2(x-1)=3 ⇒ x-1=8 ⇒ x=9, podmínka x>1 je splněna.',
        8: '0.001 = 10^(-3), proto log_10(0.001) = -3.'
    };

    const correctLabel = {
        1: '\\((0,\\infty)\\)',
        2: '\\(x=9\\)',
        3: '\\(x=8\\)',
        4: '\\(x=4\\)',
        5: '\\(\\mathbb{R}\\)',
        6: 'striktně klesající',
        7: '\\(x=9\\)',
        8: '\\(-3\\)'
    };

    const buttons = document.querySelectorAll('.btn-check');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const id = button.dataset.exercise;
            const selected = document.querySelector(`input[name="ex${id}"]:checked`);
            const options = document.querySelectorAll(`input[name="ex${id}"]`);
            const status = document.getElementById(`ex${id}Status`);
            const feedback = document.getElementById(`ex${id}Feedback`);
            const correctValue = button.dataset.correct;

            if (!selected) {
                alert('Vyberte prosím jednu odpověď.');
                return;
            }

            const isCorrect = selected.value === correctValue;

            options.forEach(option => {
                option.disabled = true;
                option.parentElement.classList.remove('correct', 'incorrect');
            });
            button.disabled = true;

            selected.parentElement.classList.add(isCorrect ? 'correct' : 'incorrect');
            if (!isCorrect) {
                options.forEach(option => {
                    if (option.value === correctValue) {
                        option.parentElement.classList.add('correct');
                    }
                });
            }

            if (status) {
                status.textContent = isCorrect ? 'Správně' : 'Špatně';
                status.className = `exercise-status ${isCorrect ? 'correct' : 'incorrect'}`;
            }

            if (feedback) {
                feedback.innerHTML = isCorrect
                    ? `Správně. ${explanation[id]}`
                    : `Nesprávně. Správná odpověď je ${correctLabel[id]}. ${explanation[id]}`;
                feedback.className = `exercise-feedback show ${isCorrect ? 'correct' : 'incorrect'}`;
                typeset(feedback);
            }

            const allDone = Array.from(buttons).every(item => item.disabled);
            if (allDone) {
                const completeBox = document.getElementById('lessonComplete');
                const score = document.getElementById('lessonScore');
                const correctCount = document.querySelectorAll('.exercise-status.correct').length;
                if (score) {
                    score.textContent = `Správně máte ${correctCount} z ${buttons.length} úloh.`;
                }
                if (completeBox) {
                    completeBox.style.display = 'block';
                    typeset(completeBox);
                }
            }
        });
    });
}
