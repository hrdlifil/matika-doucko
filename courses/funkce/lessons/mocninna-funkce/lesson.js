document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initNavbarScroll();
    initPositiveCoreLab();
    initPositiveShiftLab();
    initPositivePropsLab();
    initNegativeCoreLab();
    initNegativeShiftLab();
    initNegativePropsLab();
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

function fmtNumber(value, digits = 2) {
    if (!Number.isFinite(value)) {
        return 'nedef.';
    }

    const rounded = Math.round(value * 10 ** digits) / 10 ** digits;
    if (Math.abs(rounded) < 1e-9) {
        return '0';
    }

    if (Math.abs(rounded - Math.round(rounded)) < 1e-9) {
        return String(Math.round(rounded));
    }

    return rounded
        .toFixed(digits)
        .replace(/\.0+$/, '')
        .replace(/(\.\d*[1-9])0+$/, '$1');
}

function formatPoint(x, y) {
    return `[${fmtNumber(x)}, ${fmtNumber(y)}]`;
}

function sanitizeNonZero(value, fallback = 1, minAbs = 0.1) {
    if (!Number.isFinite(value)) {
        return fallback;
    }
    if (Math.abs(value) < minAbs) {
        return value < 0 ? -minAbs : minAbs;
    }
    return value;
}

function sanitizeSliderNonZero(slider, fallback = 1, minAbs = 0.1) {
    const value = sanitizeNonZero(Number.parseFloat(slider.value), fallback, minAbs);
    slider.value = String(value);
    return value;
}

function sanitizeAwayFrom(value, blocked, minDistance = 0.25) {
    if (Math.abs(value - blocked) >= minDistance) {
        return value;
    }
    const sign = value < blocked ? -1 : 1;
    return blocked + sign * minDistance;
}

function buildPositiveExpr(a, n, variable = 'x') {
    const absA = Math.abs(a);
    let coef = '';

    if (Math.abs(absA - 1) < EPS) {
        coef = a < 0 ? '-' : '';
    } else {
        coef = `${a < 0 ? '-' : ''}${fmtNumber(absA)}`;
    }

    if (n === 1) {
        return `${coef}${variable}`;
    }

    return `${coef}${variable}^${n}`;
}

function buildPositiveShiftExpr(a, n, h, k) {
    const hPart = Math.abs(h) < EPS ? 'x' : (h > 0 ? `x-${fmtNumber(h)}` : `x+${fmtNumber(Math.abs(h))}`);
    const core = buildPositiveExpr(a, n, `(${hPart})`);
    if (Math.abs(k) < EPS) {
        return core;
    }
    return `${core}${k > 0 ? '+' : '-'}${fmtNumber(Math.abs(k))}`;
}

function buildNegativeExpr(a, n, shift = null) {
    const absA = Math.abs(a);
    let coef;

    if (Math.abs(absA - 1) < EPS) {
        coef = a < 0 ? '-1' : '1';
    } else {
        coef = `${a < 0 ? '-' : ''}${fmtNumber(absA)}`;
    }

    const varPart = shift === null
        ? 'x'
        : (Math.abs(shift) < EPS ? 'x' : (shift > 0 ? `x-${fmtNumber(shift)}` : `x+${fmtNumber(Math.abs(shift))}`));

    if (shift === null) {
        return `${coef}/${varPart}${n === 1 ? '' : `^${n}`}`;
    }

    return `${coef}/(${varPart})${n === 1 ? '' : `^${n}`}`;
}

function positiveRange(a, n) {
    if (n % 2 === 1) {
        return 'R';
    }
    return a > 0 ? '[0,∞)' : '(-∞,0]';
}

function positiveShiftRange(a, n, k) {
    if (n % 2 === 1) {
        return 'R';
    }
    return a > 0 ? `[${fmtNumber(k)},∞)` : `(-∞,${fmtNumber(k)}]`;
}

function positiveMonotonicity(a, n) {
    if (n % 2 === 1) {
        return a > 0 ? 'roste na R' : 'klesá na R';
    }
    return a > 0
        ? 'klesá na (-∞,0), roste na (0,∞)'
        : 'roste na (-∞,0), klesá na (0,∞)';
}

function positiveSignDescription(a, n) {
    if (n % 2 === 1) {
        return a > 0 ? 'znaménko podle x' : 'znaménko opačné k x';
    }
    return a > 0 ? 'f(x) ≥ 0' : 'f(x) ≤ 0';
}

function positiveSymmetry(n) {
    return n % 2 === 0 ? 'podle osy y' : 'středově podle počátku';
}

function negativeRange(a, n) {
    if (n % 2 === 1) {
        return 'R\\{0}';
    }
    return a > 0 ? '(0,∞)' : '(-∞,0)';
}

function negativeShiftRange(a, n, k) {
    if (n % 2 === 1) {
        return `R\\{${fmtNumber(k)}}`;
    }
    return a > 0 ? `(${fmtNumber(k)},∞)` : `(-∞,${fmtNumber(k)})`;
}

function negativeMonotonicity(a, n) {
    if (n % 2 === 1) {
        return a > 0
            ? 'klesá na (-∞,0) i (0,∞)'
            : 'roste na (-∞,0) i (0,∞)';
    }
    return a > 0
        ? 'roste na (-∞,0), klesá na (0,∞)'
        : 'klesá na (-∞,0), roste na (0,∞)';
}

function negativeSignDescription(a, n) {
    if (n % 2 === 1) {
        return a > 0 ? 'znaménko podle x' : 'znaménko opačné k x';
    }
    return a > 0 ? 'vždy kladná' : 'vždy záporná';
}

function negativeInjective(n) {
    return n % 2 === 1 ? 'ano' : 'ne';
}

function initNavigation() {
    const order = [
        'mocninna-funkce-s-kladnym-mocnitelem',
        'posuny-grafu-mf-s-kladnym-mocnitelem',
        'vlastnosti-mf-s-kladnym-mocnitelem',
        'mocninna-funkce-se-zapornym-mocnitelem',
        'posuny-grafu-mf-se-zapornym-mocnitelem',
        'vlastnosti-mf-se-zapornym-mocnitelem'
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
        navbar.style.background = window.scrollY > 50
            ? 'rgba(10, 10, 15, 0.95)'
            : 'rgba(10, 10, 15, 0.8)';
    });
}

function createPlane(canvas, bounds = {}) {
    const ctx = canvas.getContext('2d');
    return {
        canvas,
        ctx,
        width: canvas.width,
        height: canvas.height,
        xMin: typeof bounds.xMin === 'number' ? bounds.xMin : -8,
        xMax: typeof bounds.xMax === 'number' ? bounds.xMax : 8,
        yMin: typeof bounds.yMin === 'number' ? bounds.yMin : -8,
        yMax: typeof bounds.yMax === 'number' ? bounds.yMax : 8
    };
}

function toCanvasX(plane, x) {
    return ((x - plane.xMin) / (plane.xMax - plane.xMin)) * plane.width;
}

function toCanvasY(plane, y) {
    return plane.height - ((y - plane.yMin) / (plane.yMax - plane.yMin)) * plane.height;
}

function drawGridAxes(plane) {
    const ctx = plane.ctx;

    ctx.clearRect(0, 0, plane.width, plane.height);
    ctx.fillStyle = '#08080d';
    ctx.fillRect(0, 0, plane.width, plane.height);

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;

    for (let x = Math.ceil(plane.xMin); x <= plane.xMax; x += 1) {
        const px = toCanvasX(plane, x);
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, plane.height);
        ctx.stroke();
    }

    for (let y = Math.ceil(plane.yMin); y <= plane.yMax; y += 1) {
        const py = toCanvasY(plane, y);
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(plane.width, py);
        ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.7;

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

function drawFunction(plane, evaluate, options = {}) {
    const ctx = plane.ctx;
    const samples = options.samples ?? 1400;
    const color = options.color ?? '#6366f1';
    const lineWidth = options.lineWidth ?? 2.6;
    const dashed = options.dashed ?? false;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash(dashed ? [7, 5] : []);

    let drawing = false;
    let prevY = null;

    for (let i = 0; i <= samples; i += 1) {
        const x = plane.xMin + ((plane.xMax - plane.xMin) * i) / samples;
        const y = evaluate(x);

        if (!Number.isFinite(y)) {
            if (drawing) {
                ctx.stroke();
                drawing = false;
            }
            prevY = null;
            continue;
        }

        const px = toCanvasX(plane, x);
        const py = toCanvasY(plane, y);

        if (py < -350 || py > plane.height + 350) {
            if (drawing) {
                ctx.stroke();
                drawing = false;
            }
            prevY = null;
            continue;
        }

        if (prevY !== null && Math.abs(py - prevY) > plane.height * 0.7) {
            if (drawing) {
                ctx.stroke();
                drawing = false;
            }
            prevY = py;
            continue;
        }

        if (!drawing) {
            ctx.beginPath();
            ctx.moveTo(px, py);
            drawing = true;
        } else {
            ctx.lineTo(px, py);
        }

        prevY = py;
    }

    if (drawing) {
        ctx.stroke();
    }

    ctx.setLineDash([]);
}

function drawPoint(plane, x, y, color = '#ec4899', radius = 5) {
    const ctx = plane.ctx;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(toCanvasX(plane, x), toCanvasY(plane, y), radius, 0, Math.PI * 2);
    ctx.fill();
}

function drawVerticalGuide(plane, x, color = 'rgba(56,189,248,0.85)') {
    const ctx = plane.ctx;
    const px = toCanvasX(plane, x);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, plane.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawHorizontalGuide(plane, y, color = 'rgba(239,68,68,0.9)') {
    const ctx = plane.ctx;
    const py = toCanvasY(plane, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(plane.width, py);
    ctx.stroke();
    ctx.setLineDash([]);
}

function initPositiveCoreLab() {
    const canvas = document.getElementById('posCoreCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, { xMin: -4, xMax: 4, yMin: -8, yMax: 8 });

    const aSlider = document.getElementById('pcA');
    const nSelect = document.getElementById('pcN');
    const xSlider = document.getElementById('pcX');

    const outputs = {
        a: document.getElementById('pcAValue'),
        x: document.getElementById('pcXValue'),
        formula: document.getElementById('pcFormula'),
        value: document.getElementById('pcValue'),
        parity: document.getElementById('pcParity'),
        domain: document.getElementById('pcDomain'),
        range: document.getElementById('pcRange'),
        monotonic: document.getElementById('pcMonotonic'),
        injective: document.getElementById('pcInjective'),
        zero: document.getElementById('pcZero'),
        conclusion: document.getElementById('pcConclusion')
    };

    function render() {
        const a = sanitizeSliderNonZero(aSlider, 1);
        const n = Number.parseInt(nSelect.value, 10);
        const x0 = Number.parseFloat(xSlider.value);
        const y0 = a * Math.pow(x0, n);

        outputs.a.textContent = fmtNumber(a);
        outputs.x.textContent = fmtNumber(x0);

        drawGridAxes(plane);
        drawFunction(plane, x => a * Math.pow(x, n), { color: '#6366f1', lineWidth: 2.8 });
        drawPoint(plane, 0, 0, '#10b981', 4.5);
        drawPoint(plane, x0, y0, '#ec4899', 5);

        if (n % 2 === 0) {
            drawVerticalGuide(plane, 0, 'rgba(56,189,248,0.7)');
        }

        outputs.formula.textContent = `f(x)=${buildPositiveExpr(a, n)}`;
        outputs.value.textContent = fmtNumber(y0);
        outputs.parity.textContent = n % 2 === 0 ? 'sudý mocnitel' : 'lichý mocnitel';
        outputs.domain.textContent = 'R';
        outputs.range.textContent = positiveRange(a, n);
        outputs.monotonic.textContent = positiveMonotonicity(a, n);
        outputs.injective.textContent = n % 2 === 1 ? 'ano' : 'ne';
        outputs.zero.textContent = `x=0 (násobnost ${n})`;

        outputs.conclusion.textContent = n % 2 === 0
            ? `Sudý mocnitel dává ${a > 0 ? 'minimum' : 'maximum'} v bodě [0,0] a funkce je ${a > 0 ? 'nezáporná' : 'nekladná'}.`
            : `Lichý mocnitel dává prostou funkci, která ${a > 0 ? 'roste' : 'klesá'} na celém R.`;
    }

    [aSlider, nSelect, xSlider].forEach(ctrl => ctrl.addEventListener('input', render));
    render();
}

function initPositiveShiftLab() {
    const canvas = document.getElementById('posShiftCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, { xMin: -8, xMax: 8, yMin: -8, yMax: 8 });

    const aSlider = document.getElementById('psA');
    const nSelect = document.getElementById('psN');
    const hSlider = document.getElementById('psH');
    const kSlider = document.getElementById('psK');

    const outputs = {
        a: document.getElementById('psAValue'),
        h: document.getElementById('psHValue'),
        k: document.getElementById('psKValue'),
        base: document.getElementById('psBase'),
        shifted: document.getElementById('psShifted'),
        keyPoint: document.getElementById('psKeyPoint'),
        move: document.getElementById('psMove'),
        symmetry: document.getElementById('psSymmetry'),
        range: document.getElementById('psRange'),
        conclusion: document.getElementById('psConclusion')
    };

    function render() {
        const a = sanitizeSliderNonZero(aSlider, 1);
        const n = Number.parseInt(nSelect.value, 10);
        const h = Number.parseFloat(hSlider.value);
        const k = Number.parseFloat(kSlider.value);

        outputs.a.textContent = fmtNumber(a);
        outputs.h.textContent = fmtNumber(h);
        outputs.k.textContent = fmtNumber(k);

        drawGridAxes(plane);
        drawFunction(plane, x => a * Math.pow(x, n), { color: '#f97316', lineWidth: 2.2, dashed: true });
        drawFunction(plane, x => a * Math.pow(x - h, n) + k, { color: '#6366f1', lineWidth: 2.8 });

        if (n % 2 === 0) {
            drawVerticalGuide(plane, h, 'rgba(56,189,248,0.8)');
        }

        drawPoint(plane, h, k, '#ec4899', 5.5);

        const moveX = Math.abs(h) < EPS ? 'bez vodorovného posunu' : `${fmtNumber(Math.abs(h))} ${h > 0 ? 'doprava' : 'doleva'}`;
        const moveY = Math.abs(k) < EPS ? 'bez svislého posunu' : `${fmtNumber(Math.abs(k))} ${k > 0 ? 'nahoru' : 'dolů'}`;

        outputs.base.textContent = `f(x)=${buildPositiveExpr(a, n)}`;
        outputs.shifted.textContent = `g(x)=${buildPositiveShiftExpr(a, n, h, k)}`;
        outputs.keyPoint.textContent = formatPoint(h, k);
        outputs.move.textContent = `${moveX}, ${moveY}`;
        outputs.symmetry.textContent = n % 2 === 0 ? `osa x=${fmtNumber(h)}` : `střed ${formatPoint(h, k)}`;
        outputs.range.textContent = positiveShiftRange(a, n, k);

        outputs.conclusion.textContent = n % 2 === 0
            ? `Sudý mocnitel: bod [h,k] je vrchol a osa souměrnosti je x=${fmtNumber(h)}.`
            : `Lichý mocnitel: bod [h,k] je střed souměrnosti grafu.`;
    }

    [aSlider, nSelect, hSlider, kSlider].forEach(ctrl => ctrl.addEventListener('input', render));
    render();
}

function initPositivePropsLab() {
    const canvas = document.getElementById('posPropsCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, { xMin: -4, xMax: 4, yMin: -8, yMax: 8 });

    const aSlider = document.getElementById('ppA');
    const nSelect = document.getElementById('ppN');

    const outputs = {
        a: document.getElementById('ppAValue'),
        formula: document.getElementById('ppFormula'),
        domain: document.getElementById('ppDomain'),
        range: document.getElementById('ppRange'),
        parity: document.getElementById('ppParity'),
        monotonic: document.getElementById('ppMonotonic'),
        sign: document.getElementById('ppSign'),
        injective: document.getElementById('ppInjective'),
        extremum: document.getElementById('ppExtremum'),
        conclusion: document.getElementById('ppConclusion')
    };

    function render() {
        const a = sanitizeSliderNonZero(aSlider, 1);
        const n = Number.parseInt(nSelect.value, 10);

        outputs.a.textContent = fmtNumber(a);

        drawGridAxes(plane);
        drawFunction(plane, x => a * Math.pow(x, n), { color: '#6366f1', lineWidth: 2.8 });

        [-2, -1, 1, 2].forEach(x => drawPoint(plane, x, a * Math.pow(x, n), '#ec4899', 4.2));

        if (n % 2 === 0) {
            drawVerticalGuide(plane, 0, 'rgba(56,189,248,0.8)');
        }

        outputs.formula.textContent = `f(x)=${buildPositiveExpr(a, n)}`;
        outputs.domain.textContent = 'R';
        outputs.range.textContent = positiveRange(a, n);
        outputs.parity.textContent = n % 2 === 0 ? 'sudá' : 'lichá';
        outputs.monotonic.textContent = positiveMonotonicity(a, n);
        outputs.sign.textContent = positiveSignDescription(a, n);
        outputs.injective.textContent = n % 2 === 1 ? 'ano' : 'ne';
        outputs.extremum.textContent = n % 2 === 0
            ? `${a > 0 ? 'minimum' : 'maximum'} 0 v x=0`
            : 'globální extrém není';

        outputs.conclusion.textContent = n % 2 === 0
            ? `Sudá mocninná funkce není prostá na R. Prostá je až po omezení na interval x≥0 nebo x≤0.`
            : `Lichá mocninná funkce je prostá na R a její hodnoty pokrývají celé R.`;
    }

    [aSlider, nSelect].forEach(ctrl => ctrl.addEventListener('input', render));
    render();
}

function initNegativeCoreLab() {
    const canvas = document.getElementById('negCoreCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, { xMin: -7, xMax: 7, yMin: -8, yMax: 8 });

    const aSlider = document.getElementById('ncA');
    const nSelect = document.getElementById('ncN');
    const xSlider = document.getElementById('ncX');

    const outputs = {
        a: document.getElementById('ncAValue'),
        x: document.getElementById('ncXValue'),
        formula: document.getElementById('ncFormula'),
        value: document.getElementById('ncValue'),
        domain: document.getElementById('ncDomain'),
        range: document.getElementById('ncRange'),
        parity: document.getElementById('ncParity'),
        monotonic: document.getElementById('ncMonotonic'),
        asymptotes: document.getElementById('ncAsymptotes'),
        conclusion: document.getElementById('ncConclusion')
    };

    function render() {
        const a = sanitizeSliderNonZero(aSlider, 1);
        const n = Number.parseInt(nSelect.value, 10);
        let x0 = Number.parseFloat(xSlider.value);
        x0 = sanitizeAwayFrom(x0, 0, 0.25);
        xSlider.value = String(x0);

        const y0 = a / Math.pow(x0, n);

        outputs.a.textContent = fmtNumber(a);
        outputs.x.textContent = fmtNumber(x0);

        drawGridAxes(plane);
        drawVerticalGuide(plane, 0, 'rgba(239,68,68,0.9)');
        drawHorizontalGuide(plane, 0, 'rgba(239,68,68,0.9)');

        drawFunction(plane, x => {
            if (Math.abs(x) < 1e-5) return NaN;
            return a / Math.pow(x, n);
        }, { color: '#6366f1', lineWidth: 2.8 });

        drawPoint(plane, x0, y0, '#ec4899', 5);

        outputs.formula.textContent = `f(x)=${buildNegativeExpr(a, n)}`;
        outputs.value.textContent = fmtNumber(y0);
        outputs.domain.textContent = 'R\\{0}';
        outputs.range.textContent = negativeRange(a, n);
        outputs.parity.textContent = n % 2 === 0 ? 'sudá' : 'lichá';
        outputs.monotonic.textContent = negativeMonotonicity(a, n);
        outputs.asymptotes.textContent = 'x=0, y=0';

        outputs.conclusion.textContent = n % 2 === 0
            ? 'Sudý mocnitel dává stejná znaménka vlevo i vpravo od asymptoty x=0.'
            : 'Lichý mocnitel dává opačná znaménka na levé a pravé větvi.';
    }

    [aSlider, nSelect, xSlider].forEach(ctrl => ctrl.addEventListener('input', render));
    render();
}

function initNegativeShiftLab() {
    const canvas = document.getElementById('negShiftCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, { xMin: -8, xMax: 8, yMin: -8, yMax: 8 });

    const aSlider = document.getElementById('nsA');
    const nSelect = document.getElementById('nsN');
    const hSlider = document.getElementById('nsH');
    const kSlider = document.getElementById('nsK');

    const outputs = {
        a: document.getElementById('nsAValue'),
        h: document.getElementById('nsHValue'),
        k: document.getElementById('nsKValue'),
        shifted: document.getElementById('nsShifted'),
        asymptotes: document.getElementById('nsAsymptotes'),
        domain: document.getElementById('nsDomain'),
        range: document.getElementById('nsRange'),
        symmetry: document.getElementById('nsSymmetry'),
        conclusion: document.getElementById('nsConclusion')
    };

    function render() {
        const a = sanitizeSliderNonZero(aSlider, 1);
        const n = Number.parseInt(nSelect.value, 10);
        const h = Number.parseFloat(hSlider.value);
        const k = Number.parseFloat(kSlider.value);

        outputs.a.textContent = fmtNumber(a);
        outputs.h.textContent = fmtNumber(h);
        outputs.k.textContent = fmtNumber(k);

        drawGridAxes(plane);

        drawFunction(plane, x => {
            if (Math.abs(x) < 1e-5) return NaN;
            return a / Math.pow(x, n);
        }, { color: '#f97316', lineWidth: 2.1, dashed: true });

        drawFunction(plane, x => {
            if (Math.abs(x - h) < 1e-5) return NaN;
            return a / Math.pow(x - h, n) + k;
        }, { color: '#6366f1', lineWidth: 2.8 });

        drawVerticalGuide(plane, h, 'rgba(239,68,68,0.9)');
        drawHorizontalGuide(plane, k, 'rgba(239,68,68,0.9)');
        drawPoint(plane, h, k, '#ec4899', 5.5);

        outputs.shifted.textContent = `g(x)=${buildNegativeExpr(a, n, h)}${Math.abs(k) < EPS ? '' : (k > 0 ? `+${fmtNumber(k)}` : `-${fmtNumber(Math.abs(k))}`)}`;
        outputs.asymptotes.textContent = `x=${fmtNumber(h)}, y=${fmtNumber(k)}`;
        outputs.domain.textContent = `R\\{${fmtNumber(h)}}`;
        outputs.range.textContent = negativeShiftRange(a, n, k);
        outputs.symmetry.textContent = n % 2 === 0 ? `osa x=${fmtNumber(h)}` : `střed ${formatPoint(h, k)}`;

        outputs.conclusion.textContent = n % 2 === 0
            ? `Sudý mocnitel: vodorovná asymptota y=${fmtNumber(k)} se nikdy neprotíná.`
            : `Lichý mocnitel: funkce nabývá všech hodnot kromě y=${fmtNumber(k)}.`;
    }

    [aSlider, nSelect, hSlider, kSlider].forEach(ctrl => ctrl.addEventListener('input', render));
    render();
}

function initNegativePropsLab() {
    const canvas = document.getElementById('negPropsCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, { xMin: -7, xMax: 7, yMin: -8, yMax: 8 });

    const aSlider = document.getElementById('npA');
    const nSelect = document.getElementById('npN');

    const outputs = {
        a: document.getElementById('npAValue'),
        formula: document.getElementById('npFormula'),
        domain: document.getElementById('npDomain'),
        range: document.getElementById('npRange'),
        parity: document.getElementById('npParity'),
        monotonic: document.getElementById('npMonotonic'),
        sign: document.getElementById('npSign'),
        injective: document.getElementById('npInjective'),
        asymptotes: document.getElementById('npAsymptotes'),
        conclusion: document.getElementById('npConclusion')
    };

    function render() {
        const a = sanitizeSliderNonZero(aSlider, -2);
        const n = Number.parseInt(nSelect.value, 10);

        outputs.a.textContent = fmtNumber(a);

        drawGridAxes(plane);
        drawVerticalGuide(plane, 0, 'rgba(239,68,68,0.9)');
        drawHorizontalGuide(plane, 0, 'rgba(239,68,68,0.9)');

        drawFunction(plane, x => {
            if (Math.abs(x) < 1e-5) return NaN;
            return a / Math.pow(x, n);
        }, { color: '#6366f1', lineWidth: 2.8 });

        [-2, -1, 1, 2].forEach(x => drawPoint(plane, x, a / Math.pow(x, n), '#ec4899', 4.2));

        outputs.formula.textContent = `f(x)=${buildNegativeExpr(a, n)}`;
        outputs.domain.textContent = 'R\\{0}';
        outputs.range.textContent = negativeRange(a, n);
        outputs.parity.textContent = n % 2 === 0 ? 'sudá' : 'lichá';
        outputs.monotonic.textContent = negativeMonotonicity(a, n);
        outputs.sign.textContent = negativeSignDescription(a, n);
        outputs.injective.textContent = negativeInjective(n);
        outputs.asymptotes.textContent = 'x=0, y=0';

        outputs.conclusion.textContent = n % 2 === 0
            ? 'Sudý záporný mocnitel není prostý na celém definičním oboru.'
            : 'Lichý záporný mocnitel je prostý na R\\{0}.';
    }

    [aSlider, nSelect].forEach(ctrl => ctrl.addEventListener('input', render));
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

            selected.parentElement.classList.add(isCorrect ? 'correct' : 'incorrect');
            if (!isCorrect) {
                options.forEach(option => {
                    if (option.value === button.dataset.correct) {
                        option.parentElement.classList.add('correct');
                    }
                });
            }

            button.disabled = true;

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
    const explanations = {
        1: 'U sudého mocnitele a kladného koeficientu je minimum rovno 0.',
        2: 'Ve tvaru (x-h)^3+k je střed souměrnosti [h,k], zde h=-1, k=-2.',
        3: 'Lichý záporný mocnitel dává všechny nenulové reálné hodnoty.',
        4: 'Pro 1/x^2 je vlevo derivace kladná a vpravo záporná.',
        5: 'Protože jde o záporný koeficient u sudého mocnitele, funkce je vždy pod y=3.',
        6: 'Pro x>0 je jmenovatel kladný, se záporným čitatelem vychází záporná hodnota.'
    };

    const correctLabels = {
        1: '[0,∞)',
        2: '[-1,-2]',
        3: 'D=R\\{0}, H=R\\{0}',
        4: 'roste vlevo, klesá vpravo',
        5: '(-∞,3)',
        6: 'záporné'
    };

    const buttons = document.querySelectorAll('.btn-check');
    const solvedCount = document.getElementById('solvedCount');
    const totalCount = document.getElementById('totalCount');

    if (totalCount) {
        totalCount.textContent = String(buttons.length);
    }

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const id = button.dataset.exercise;
            const selected = document.querySelector(`input[name="ex${id}"]:checked`);
            const options = document.querySelectorAll(`input[name="ex${id}"]`);
            const status = document.getElementById(`ex${id}Status`);
            const feedback = document.getElementById(`ex${id}Feedback`);

            if (!selected) {
                alert('Vyberte prosím jednu odpověď.');
                return;
            }

            const isCorrect = selected.value === button.dataset.correct;

            options.forEach(option => {
                option.disabled = true;
                option.parentElement.classList.remove('correct', 'incorrect');
            });

            selected.parentElement.classList.add(isCorrect ? 'correct' : 'incorrect');
            if (!isCorrect) {
                options.forEach(option => {
                    if (option.value === button.dataset.correct) {
                        option.parentElement.classList.add('correct');
                    }
                });
            }

            button.disabled = true;

            if (status) {
                status.textContent = isCorrect ? 'Správně' : 'Špatně';
                status.className = `exercise-status ${isCorrect ? 'correct' : 'incorrect'}`;
            }

            if (feedback) {
                feedback.textContent = isCorrect
                    ? `Správně. ${explanations[id]}`
                    : `Nesprávně. Správná odpověď je ${correctLabels[id]}. ${explanations[id]}`;
                feedback.className = `exercise-feedback show ${isCorrect ? 'correct' : 'incorrect'}`;
            }

            const correctCount = document.querySelectorAll('.exercise-status.correct').length;
            if (solvedCount) {
                solvedCount.textContent = String(correctCount);
            }

            const allDone = Array.from(buttons).every(item => item.disabled);
            if (allDone) {
                const complete = document.getElementById('lessonComplete');
                const score = document.getElementById('lessonScore');
                if (score) {
                    score.textContent = `Správně máte ${correctCount} z ${buttons.length} úloh.`;
                }
                if (complete) {
                    complete.style.display = 'block';
                    typeset(complete);
                }
            }
        });
    });
}
