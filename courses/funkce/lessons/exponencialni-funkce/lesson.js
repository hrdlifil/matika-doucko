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

function fmtNumber(value, digits = 2) {
    if (!Number.isFinite(value)) {
        return value > 0 ? '∞' : '-∞';
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

function initNavigation() {
    const order = [
        'exponencialni-funkce',
        'posuny-grafu-exponencialni-funkce',
        'vlastnosti-exponencialni-funkce',
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
    const samples = options.samples ?? 1600;
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

function drawHorizontalLine(plane, y, color = 'rgba(239, 68, 68, 0.8)', dashed = true) {
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

function drawVerticalLine(plane, x, color = 'rgba(16, 185, 129, 0.75)', dashed = true) {
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
    const samples = 600;
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

function monotonicityText(base, factor = 1) {
    if (isZero(factor)) {
        return 'konstantní';
    }
    const increasing = (base > 1 && factor > 0) || (base < 1 && factor < 0);
    return increasing ? 'striktně rostoucí' : 'striktně klesající';
}

function shiftText(value, positiveLabel, negativeLabel) {
    if (isZero(value)) {
        return `bez posunu v ose ${positiveLabel === 'doprava' ? 'x' : 'y'}`;
    }
    return value > 0
        ? `${fmtNumber(Math.abs(value))} ${positiveLabel}`
        : `${fmtNumber(Math.abs(value))} ${negativeLabel}`;
}

function rangeText(A, k) {
    if (A > EPS) {
        return `(${fmtNumber(k)}, ∞)`;
    }
    if (A < -EPS) {
        return `(-∞, ${fmtNumber(k)})`;
    }
    return `{${fmtNumber(k)}}`;
}

function buildShiftFormula(A, a, h, k) {
    const aText = fmtBase(a);
    const expPart = isZero(h)
        ? 'x'
        : (h > 0 ? `x-${fmtNumber(Math.abs(h))}` : `x+${fmtNumber(Math.abs(h))}`);

    let factor = '';
    if (isZero(A - 1)) {
        factor = '';
    } else if (isZero(A + 1)) {
        factor = '-';
    } else {
        factor = `${fmtNumber(A)}·`;
    }

    const core = `${factor}${aText}^(${expPart})`;
    if (isZero(k)) {
        return core;
    }
    return k > 0 ? `${core}+${fmtNumber(k)}` : `${core}-${fmtNumber(Math.abs(k))}`;
}

function initDefinitionLab() {
    const canvas = document.getElementById('expDefCanvas');
    const section = document.getElementById('exponencialni-funkce');
    if (!canvas || !section) {
        return;
    }

    const plane = createPlane(canvas, { xMin: -4, xMax: 4, yMin: -1, yMax: 10 });
    const baseSelect = document.getElementById('expDefBase');
    const xSlider = document.getElementById('expDefX');

    const xValue = document.getElementById('expDefXValue');
    const formulaOut = document.getElementById('expDefFormula');
    const domainOut = document.getElementById('expDefDomain');
    const rangeOut = document.getElementById('expDefRange');
    const monotonicOut = document.getElementById('expDefMonotonic');
    const valueOut = document.getElementById('expDefValue');
    const ratioOut = document.getElementById('expDefRatio');
    const limitsOut = document.getElementById('expDefLimits');
    const conclusionOut = document.getElementById('expDefConclusion');

    function render() {
        const a = Number(baseSelect.value);
        const x0 = Number(xSlider.value);
        const y0 = a ** x0;
        const yLeft = a ** -4;
        const yRight = a ** 4;

        const yMax = clamp(Math.max(5, yLeft, yRight) * 1.15 + 1, 6, 32);
        setPlaneBounds(plane, { xMin: -4, xMax: 4, yMin: -1, yMax });

        drawGridAxes(plane, { xStep: 1, yStep: yMax > 16 ? 2 : 1 });
        drawHorizontalLine(plane, 0, 'rgba(239, 68, 68, 0.85)');
        drawFunction(plane, x => a ** x, () => true, { color: '#6366f1', lineWidth: 2.8 });
        drawVerticalLine(plane, x0, 'rgba(16, 185, 129, 0.75)');
        drawPoint(plane, x0, y0, '#10b981', 5);
        drawPoint(plane, 0, 1, '#f59e0b', 4.5);

        xValue.textContent = fmtNumber(x0, 1);
        formulaOut.textContent = `f(x) = ${fmtBase(a)}^x`;
        domainOut.textContent = 'R';
        rangeOut.textContent = '(0, ∞)';
        monotonicOut.textContent = a > 1 ? 'striktně rostoucí' : 'striktně klesající';
        valueOut.textContent = fmtNumber(y0, 4);
        ratioOut.textContent = fmtNumber(a, 4);

        const limitsText = a > 1
            ? 'x→∞: ∞,  x→-∞: 0'
            : 'x→∞: 0,  x→-∞: ∞';
        limitsOut.textContent = limitsText;

        conclusionOut.textContent = a > 1
            ? `Protože a=${fmtNumber(a)} > 1, graf roste. Zvýšení x o 1 násobí hodnotu přibližně ${fmtNumber(a, 3)}×.`
            : `Protože 0<a=${fmtNumber(a)}<1, graf klesá. Zvýšení x o 1 násobí hodnotu číslem ${fmtNumber(a, 3)}, tedy ji zmenší.`;
    }

    baseSelect.addEventListener('change', render);
    xSlider.addEventListener('input', render);
    render();
}

function initShiftLab() {
    const canvas = document.getElementById('expShiftCanvas');
    const section = document.getElementById('posuny-grafu-exponencialni-funkce');
    if (!canvas || !section) {
        return;
    }

    const plane = createPlane(canvas, { xMin: -5, xMax: 5, yMin: -8, yMax: 8 });
    const baseSelect = document.getElementById('expShiftBase');
    const aSlider = document.getElementById('expShiftA');
    const hSlider = document.getElementById('expShiftH');
    const kSlider = document.getElementById('expShiftK');
    const xSlider = document.getElementById('expShiftX');

    const aValue = document.getElementById('expShiftAValue');
    const hValue = document.getElementById('expShiftHValue');
    const kValue = document.getElementById('expShiftKValue');
    const xValue = document.getElementById('expShiftXValue');

    const formulaOut = document.getElementById('expShiftFormula');
    const asymptoteOut = document.getElementById('expShiftAsymptote');
    const monotonicOut = document.getElementById('expShiftMonotonic');
    const rangeOut = document.getElementById('expShiftRange');
    const valueOut = document.getElementById('expShiftValue');
    const moveOut = document.getElementById('expShiftMove');
    const conclusionOut = document.getElementById('expShiftConclusion');

    function render() {
        const base = Number(baseSelect.value);
        const A = Number(aSlider.value);
        const h = Number(hSlider.value);
        const k = Number(kSlider.value);
        const x0 = Number(xSlider.value);

        const f = x => base ** x;
        const g = x => A * (base ** (x - h)) + k;
        const bounds = estimateYBounds([f, g, () => k], -5, 5);
        setPlaneBounds(plane, { xMin: -5, xMax: 5, yMin: bounds.yMin, yMax: bounds.yMax });

        drawGridAxes(plane, { xStep: 1, yStep: 1 });
        drawFunction(plane, f, () => true, { color: '#f59e0b', lineWidth: 2.2, dashed: true });
        drawFunction(plane, g, () => true, { color: '#6366f1', lineWidth: 2.8 });
        drawHorizontalLine(plane, k, 'rgba(236, 72, 153, 0.9)');
        drawVerticalLine(plane, x0, 'rgba(16, 185, 129, 0.75)');
        drawPoint(plane, x0, g(x0), '#10b981', 5);

        aValue.textContent = fmtNumber(A, 1);
        hValue.textContent = fmtNumber(h, 1);
        kValue.textContent = fmtNumber(k, 1);
        xValue.textContent = fmtNumber(x0, 1);

        formulaOut.textContent = `g(x) = ${buildShiftFormula(A, base, h, k)}`;
        asymptoteOut.textContent = isZero(A)
            ? 'není (konstantní funkce)'
            : `y = ${fmtNumber(k, 2)}`;
        monotonicOut.textContent = monotonicityText(base, A);
        rangeOut.textContent = rangeText(A, k);
        valueOut.textContent = fmtNumber(g(x0), 4);

        const horizontal = shiftText(h, 'doprava', 'doleva');
        const vertical = shiftText(k, 'nahoru', 'dolů');
        moveOut.textContent = `${horizontal}, ${vertical}`;

        let note = '';
        if (isZero(A)) {
            note = `Pro A=0 dostáváme konstantní funkci g(x)=${fmtNumber(k)} s oborem hodnot {${fmtNumber(k)}}.`;
        } else {
            note = `Asymptota se posunula na y=${fmtNumber(k)} a obor hodnot je ${rangeText(A, k)}.`;
        }
        if (A < -EPS) {
            note += ' Záporné A navíc převrací graf podle osy x.';
        } else if (A > EPS) {
            note += ' Kladné A zachovává orientaci grafu vůči ose x.';
        }
        conclusionOut.textContent = note;
    }

    baseSelect.addEventListener('change', render);
    [aSlider, hSlider, kSlider, xSlider].forEach(slider => slider.addEventListener('input', render));
    render();
}

function initPropertiesLab() {
    const canvas = document.getElementById('expPropsCanvas');
    const section = document.getElementById('vlastnosti-exponencialni-funkce');
    if (!canvas || !section) {
        return;
    }

    const plane = createPlane(canvas, { xMin: -4, xMax: 4, yMin: -3, yMax: 12 });
    const baseSelect = document.getElementById('expPropsBase');
    const bSlider = document.getElementById('expPropsB');
    const xSlider = document.getElementById('expPropsX');

    const bValue = document.getElementById('expPropsBValue');
    const xValue = document.getElementById('expPropsXValue');
    const formulaOut = document.getElementById('expPropsFormula');
    const domainOut = document.getElementById('expPropsDomain');
    const rangeOut = document.getElementById('expPropsRange');
    const monotonicOut = document.getElementById('expPropsMonotonic');
    const convexOut = document.getElementById('expPropsConvex');
    const limitsOut = document.getElementById('expPropsLimits');
    const equationOut = document.getElementById('expPropsEquation');
    const solutionOut = document.getElementById('expPropsSolution');
    const checkOut = document.getElementById('expPropsCheck');
    const conclusionOut = document.getElementById('expPropsConclusion');

    function render() {
        const a = Number(baseSelect.value);
        const b = Number(bSlider.value);
        const x0 = Number(xSlider.value);
        const f = x => a ** x;

        const bounds = estimateYBounds([f, () => b, () => 0], -4, 4);
        setPlaneBounds(plane, { xMin: -4, xMax: 4, yMin: bounds.yMin, yMax: bounds.yMax });

        drawGridAxes(plane, { xStep: 1, yStep: 1 });
        drawHorizontalLine(plane, 0, 'rgba(239, 68, 68, 0.8)');
        drawFunction(plane, f, () => true, { color: '#6366f1', lineWidth: 2.8 });
        drawHorizontalLine(plane, b, 'rgba(249, 115, 22, 0.85)');
        drawVerticalLine(plane, x0, 'rgba(16, 185, 129, 0.75)');
        drawPoint(plane, x0, f(x0), '#10b981', 5);

        const equationText = `${fmtBase(a)}^x = ${fmtNumber(b)}`;
        const monotonicText = monotonicityText(a, 1);

        bValue.textContent = fmtNumber(b, 1);
        xValue.textContent = fmtNumber(x0, 1);
        formulaOut.textContent = `f(x) = ${fmtBase(a)}^x`;
        domainOut.textContent = 'R';
        rangeOut.textContent = '(0, ∞)';
        monotonicOut.textContent = monotonicText;
        convexOut.textContent = 'vždy konvexní';
        limitsOut.textContent = a > 1 ? 'x→∞: ∞, x→-∞: 0' : 'x→∞: 0, x→-∞: ∞';
        equationOut.textContent = equationText;

        if (b > 0) {
            const xSolution = Math.log(b) / Math.log(a);
            drawPoint(plane, xSolution, b, '#f97316', 5);
            solutionOut.textContent = `x = ${fmtNumber(xSolution, 4)}`;
            checkOut.textContent = `${fmtBase(a)}^${fmtNumber(xSolution, 3)} ≈ ${fmtNumber(a ** xSolution, 3)}`;
            conclusionOut.textContent = `Protože b=${fmtNumber(b)} > 0, rovnice má právě jedno řešení. V bodě x0=${fmtNumber(x0, 1)} je f(x0)=${fmtNumber(f(x0), 4)}.`;
        } else {
            solutionOut.textContent = 'v R bez řešení';
            checkOut.textContent = 'exponenciála je vždy kladná';
            conclusionOut.textContent = `Protože b=${fmtNumber(b)} ≤ 0 a a^x > 0 pro všechna reálná x, rovnice nemá reálné řešení.`;
        }
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
        1: 'Exponenciála má pouze kladné hodnoty, takže její obor hodnot je \((0,\infty)\).',
        2: 'Protože \(8=2^3\), vychází přímo \(x=3\).',
        3: 'Pro základ mezi 0 a 1 je exponenciální funkce striktně klesající.',
        4: 'Přičtení čísla \(+5\) posune asymptotu z \(y=0\) na \(y=5\).',
        5: 'U \(g(x)=-3\cdot2^x+4\) jsou hodnoty vždy menší než 4, tedy \((-\infty,4)\).',
        6: '\(\left(\frac12\right)^{x-1}=4=2^2\Rightarrow2^{1-x}=2^2\Rightarrow x=-1\).',
        7: 'Pro \(x=0\): \(g(0)=3\cdot2^{-2}-1=3\cdot\frac14-1=-\frac14\).',
        8: 'Základní exponenciála osu x neprotíná a má vodorovnou asymptotu \(y=0\).'
    };

    const correctLabel = {
        1: '\\((0,\\infty)\\)',
        2: '\\(x=3\\)',
        3: 'striktně klesající',
        4: '\\(y=5\\)',
        5: '\\(( -\\infty,4)\\)',
        6: '\\(x=-1\\)',
        7: '\\(-\\frac14\\)',
        8: 'graf osu x neprotíná, asymptota \\(y=0\\)'
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
