document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initNavbarScroll();
    initCoreLab();
    initShiftLab();
    initPropertiesLab();
    initAbsoluteLab();
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

function isZero(value, tolerance = EPS) {
    return Math.abs(value) < tolerance;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function fmtNumber(value, digits = 2) {
    if (!Number.isFinite(value)) {
        return value > 0 ? '∞' : '-∞';
    }

    const rounded = Math.round(value * 10 ** digits) / 10 ** digits;
    if (Math.abs(rounded) < 1e-8) {
        return '0';
    }

    if (Math.abs(rounded - Math.round(rounded)) < 1e-8) {
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

function sanitizeLeadingCoefficient(slider, fallback = 1) {
    let value = Number.parseFloat(slider.value);
    if (!Number.isFinite(value) || Math.abs(value) < 0.05) {
        value = fallback;
        slider.value = String(value);
    }
    return value;
}

function buildPolynomialExpression(a, b, c, variable = 'x') {
    const terms = [];

    appendTerm(a, `${variable}^2`);
    appendTerm(b, variable);
    appendTerm(c, '');

    return terms.length ? terms.join('') : '0';

    function appendTerm(coef, suffix) {
        if (Math.abs(coef) < EPS) {
            return;
        }

        const absCoef = Math.abs(coef);
        let body = '';

        if (!suffix) {
            body = fmtNumber(absCoef);
        } else if (Math.abs(absCoef - 1) < EPS) {
            body = suffix;
        } else {
            body = `${fmtNumber(absCoef)}${suffix}`;
        }

        if (!terms.length) {
            terms.push(`${coef < 0 ? '-' : ''}${body}`);
        } else {
            terms.push(`${coef < 0 ? ' - ' : ' + '}${body}`);
        }
    }
}

function buildVertexExpression(a, h, k) {
    const aPart = Math.abs(a - 1) < EPS
        ? ''
        : (Math.abs(a + 1) < EPS ? '-' : fmtNumber(a));

    const hPart = isZero(h)
        ? 'x'
        : (h > 0 ? `x - ${fmtNumber(h)}` : `x + ${fmtNumber(Math.abs(h))}`);

    const kPart = isZero(k)
        ? ''
        : (k > 0 ? ` + ${fmtNumber(k)}` : ` - ${fmtNumber(Math.abs(k))}`);

    return `${aPart}(${hPart})^2${kPart}`;
}

function solveQuadratic(a, b, c) {
    const D = b * b - 4 * a * c;

    if (D > EPS) {
        const sqrtD = Math.sqrt(D);
        const x1 = (-b - sqrtD) / (2 * a);
        const x2 = (-b + sqrtD) / (2 * a);
        return { D, roots: x1 < x2 ? [x1, x2] : [x2, x1] };
    }

    if (Math.abs(D) <= EPS) {
        return { D: 0, roots: [-b / (2 * a)] };
    }

    return { D, roots: [] };
}

function vertexOfQuadratic(a, b, c) {
    const x = -b / (2 * a);
    const y = a * x * x + b * x + c;
    return { x, y };
}

function rootsDescription(D, roots) {
    if (roots.length === 2) {
        return `x1=${fmtNumber(roots[0])}, x2=${fmtNumber(roots[1])}`;
    }

    if (roots.length === 1) {
        return `x1=x2=${fmtNumber(roots[0])}`;
    }

    if (D < 0) {
        return 'zadne realne koreny';
    }

    return 'bez realnych korenu';
}

function rangeDescription(a, yv) {
    return a > 0
        ? `[${fmtNumber(yv)}, ∞)`
        : `(-∞, ${fmtNumber(yv)}]`;
}

function openingDescription(a) {
    return a > 0 ? 'nahoru' : 'dolu';
}

function monotonicDescription(a, xv) {
    if (a > 0) {
        return `klesa na (-∞, ${fmtNumber(xv)}), roste na (${fmtNumber(xv)}, ∞)`;
    }
    return `roste na (-∞, ${fmtNumber(xv)}), klesa na (${fmtNumber(xv)}, ∞)`;
}

function signDescription(a, roots) {
    if (!roots.length) {
        return a > 0 ? 'kladna pro vsechna x' : 'zaporna pro vsechna x';
    }

    if (roots.length === 1) {
        const r = fmtNumber(roots[0]);
        return a > 0
            ? `f(x) >= 0 pro vsechna x, nulova v x=${r}`
            : `f(x) <= 0 pro vsechna x, nulova v x=${r}`;
    }

    const r1 = fmtNumber(roots[0]);
    const r2 = fmtNumber(roots[1]);

    if (a > 0) {
        return `zaporna pro ${r1} < x < ${r2}, kladna mimo interval`; 
    }

    return `kladna pro ${r1} < x < ${r2}, zaporna mimo interval`;
}
function initNavigation() {
    const order = [
        'kvadraticka-funkce',
        'posuny-grafu-kvadraticke-funkce',
        'vlastnosti-kvadraticke-funkce',
        'kvadraticka-funkce-s-absolutni-hodnotou'
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
    const samples = options.samples ?? 1200;
    const color = options.color ?? '#6366f1';
    const lineWidth = options.lineWidth ?? 2.6;
    const dashed = options.dashed ?? false;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash(dashed ? [7, 5] : []);

    let drawing = false;

    for (let i = 0; i <= samples; i += 1) {
        const x = plane.xMin + ((plane.xMax - plane.xMin) * i) / samples;
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

        if (py < -300 || py > plane.height + 300) {
            if (drawing) {
                ctx.stroke();
                drawing = false;
            }
            continue;
        }

        if (!drawing) {
            ctx.beginPath();
            ctx.moveTo(px, py);
            drawing = true;
        } else {
            ctx.lineTo(px, py);
        }
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

function drawLabel(plane, text, x, y, color = '#ffffff') {
    const ctx = plane.ctx;
    ctx.fillStyle = color;
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText(text, toCanvasX(plane, x) + 7, toCanvasY(plane, y) - 8);
}

function initCoreLab() {
    const canvas = document.getElementById('quadCoreCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, { xMin: -8, xMax: 8, yMin: -10, yMax: 10 });

    const sliders = {
        a: document.getElementById('quadA'),
        b: document.getElementById('quadB'),
        c: document.getElementById('quadC'),
        x: document.getElementById('quadX')
    };

    const values = {
        a: document.getElementById('quadAValue'),
        b: document.getElementById('quadBValue'),
        c: document.getElementById('quadCValue'),
        x: document.getElementById('quadXValue')
    };

    const formulaOut = document.getElementById('quadCoreFormula');
    const vertexFormOut = document.getElementById('quadCoreVertexForm');
    const vertexOut = document.getElementById('quadCoreVertex');
    const axisOut = document.getElementById('quadCoreAxis');
    const discOut = document.getElementById('quadCoreDisc');
    const rootsOut = document.getElementById('quadCoreRoots');
    const valueOut = document.getElementById('quadCoreValue');
    const rangeOut = document.getElementById('quadCoreRange');
    const conclusionOut = document.getElementById('quadCoreConclusion');

    function render() {
        const a = sanitizeLeadingCoefficient(sliders.a, 1);
        const b = Number.parseFloat(sliders.b.value);
        const c = Number.parseFloat(sliders.c.value);
        const x0 = Number.parseFloat(sliders.x.value);

        const y0 = a * x0 * x0 + b * x0 + c;
        const vertex = vertexOfQuadratic(a, b, c);
        const solved = solveQuadratic(a, b, c);

        values.a.textContent = fmtNumber(a);
        values.b.textContent = fmtNumber(b);
        values.c.textContent = fmtNumber(c);
        values.x.textContent = fmtNumber(x0);

        drawGridAxes(plane);
        drawFunction(plane, x => a * x * x + b * x + c, { color: '#6366f1', lineWidth: 2.8 });

        drawVerticalGuide(plane, vertex.x, 'rgba(56,189,248,0.85)');
        drawPoint(plane, vertex.x, vertex.y, '#f59e0b', 5.5);
        drawLabel(plane, 'V', vertex.x, vertex.y, '#f59e0b');

        drawVerticalGuide(plane, x0, 'rgba(236,72,153,0.75)');
        drawPoint(plane, x0, y0, '#ec4899', 5);

        solved.roots.forEach(root => {
            if (root >= plane.xMin - 0.1 && root <= plane.xMax + 0.1) {
                drawPoint(plane, root, 0, '#22c55e', 5);
            }
        });

        formulaOut.textContent = `f(x)=${buildPolynomialExpression(a, b, c)}`;
        vertexFormOut.textContent = `f(x)=${buildVertexExpression(a, vertex.x, vertex.y)}`;
        vertexOut.textContent = formatPoint(vertex.x, vertex.y);
        axisOut.textContent = `x=${fmtNumber(vertex.x)}`;
        discOut.textContent = `D=${fmtNumber(solved.D, 3)}`;
        rootsOut.textContent = rootsDescription(solved.D, solved.roots);
        valueOut.textContent = `f(${fmtNumber(x0)})=${fmtNumber(y0)}`;
        rangeOut.textContent = rangeDescription(a, vertex.y);

        conclusionOut.textContent = `Parabola je otevrena ${openingDescription(a)}, vrchol lezi v bode ${formatPoint(vertex.x, vertex.y)} a funkce ${monotonicDescription(a, vertex.x)}.`;
    }

    Object.values(sliders).forEach(slider => slider.addEventListener('input', render));
    render();
}
function initShiftLab() {
    const canvas = document.getElementById('quadShiftCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, { xMin: -8, xMax: 8, yMin: -10, yMax: 10 });

    const sliders = {
        a: document.getElementById('qsA'),
        h: document.getElementById('qsH'),
        k: document.getElementById('qsK')
    };

    const values = {
        a: document.getElementById('qsAValue'),
        h: document.getElementById('qsHValue'),
        k: document.getElementById('qsKValue')
    };

    const baseOut = document.getElementById('qsBase');
    const shiftedOut = document.getElementById('qsShifted');
    const vertexOut = document.getElementById('qsVertex');
    const axisOut = document.getElementById('qsAxis');
    const rootsOut = document.getElementById('qsRoots');
    const moveOut = document.getElementById('qsMove');
    const openingOut = document.getElementById('qsOpening');
    const conclusionOut = document.getElementById('qsConclusion');

    function render() {
        const a = sanitizeLeadingCoefficient(sliders.a, 1);
        const h = Number.parseFloat(sliders.h.value);
        const k = Number.parseFloat(sliders.k.value);

        const b = -2 * a * h;
        const c = a * h * h + k;
        const solved = solveQuadratic(a, b, c);

        values.a.textContent = fmtNumber(a);
        values.h.textContent = fmtNumber(h);
        values.k.textContent = fmtNumber(k);

        drawGridAxes(plane);
        drawFunction(plane, x => a * x * x, { color: '#6366f1', lineWidth: 2.4, dashed: true });
        drawFunction(plane, x => a * (x - h) * (x - h) + k, { color: '#10b981', lineWidth: 2.8 });

        drawVerticalGuide(plane, h, 'rgba(56,189,248,0.85)');
        drawPoint(plane, 0, 0, '#f59e0b', 4.5);
        drawPoint(plane, h, k, '#f59e0b', 5.5);

        solved.roots.forEach(root => {
            if (root >= plane.xMin - 0.1 && root <= plane.xMax + 0.1) {
                drawPoint(plane, root, 0, '#22c55e', 5);
            }
        });

        baseOut.textContent = `f(x)=${buildPolynomialExpression(a, 0, 0)}`;
        shiftedOut.textContent = `g(x)=${buildVertexExpression(a, h, k)}`;
        vertexOut.textContent = formatPoint(h, k);
        axisOut.textContent = `x=${fmtNumber(h)}`;
        rootsOut.textContent = rootsDescription(solved.D, solved.roots);

        const horizontal = isZero(h) ? 'bez vodorovneho posunu' : (h > 0 ? `${fmtNumber(h)} doprava` : `${fmtNumber(Math.abs(h))} doleva`);
        const vertical = isZero(k) ? 'bez svisleho posunu' : (k > 0 ? `${fmtNumber(k)} nahoru` : `${fmtNumber(Math.abs(k))} dolu`);
        moveOut.textContent = `${horizontal}, ${vertical}`;
        openingOut.textContent = openingDescription(a);

        conclusionOut.textContent = `Posun meni polohu vrcholu na ${formatPoint(h, k)}, ale tvar paraboly urceny koeficientem a zustava zachovan.`;
    }

    Object.values(sliders).forEach(slider => slider.addEventListener('input', render));
    render();
}

function initPropertiesLab() {
    const canvas = document.getElementById('quadPropsCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, { xMin: -8, xMax: 8, yMin: -10, yMax: 10 });

    const sliders = {
        a: document.getElementById('qpA'),
        b: document.getElementById('qpB'),
        c: document.getElementById('qpC')
    };

    const values = {
        a: document.getElementById('qpAValue'),
        b: document.getElementById('qpBValue'),
        c: document.getElementById('qpCValue')
    };

    const formulaOut = document.getElementById('qpFormula');
    const domainOut = document.getElementById('qpDomain');
    const rangeOut = document.getElementById('qpRange');
    const axisOut = document.getElementById('qpAxis');
    const extremumOut = document.getElementById('qpExtremum');
    const monotonicOut = document.getElementById('qpMonotonic');
    const injectiveOut = document.getElementById('qpInjective');
    const rootsOut = document.getElementById('qpRoots');
    const signOut = document.getElementById('qpSign');
    const conclusionOut = document.getElementById('qpConclusion');

    function render() {
        const a = sanitizeLeadingCoefficient(sliders.a, 1);
        const b = Number.parseFloat(sliders.b.value);
        const c = Number.parseFloat(sliders.c.value);

        const vertex = vertexOfQuadratic(a, b, c);
        const solved = solveQuadratic(a, b, c);

        values.a.textContent = fmtNumber(a);
        values.b.textContent = fmtNumber(b);
        values.c.textContent = fmtNumber(c);

        drawGridAxes(plane);
        drawFunction(plane, x => a * x * x + b * x + c, { color: '#6366f1', lineWidth: 2.8 });
        drawVerticalGuide(plane, vertex.x, 'rgba(56,189,248,0.85)');
        drawPoint(plane, vertex.x, vertex.y, '#f59e0b', 5.5);

        solved.roots.forEach(root => drawPoint(plane, root, 0, '#22c55e', 5));

        formulaOut.textContent = `f(x)=${buildPolynomialExpression(a, b, c)}`;
        domainOut.textContent = 'R';
        rangeOut.textContent = rangeDescription(a, vertex.y);
        axisOut.textContent = `x=${fmtNumber(vertex.x)}`;
        extremumOut.textContent = `${a > 0 ? 'minimum' : 'maximum'} ${fmtNumber(vertex.y)} v x=${fmtNumber(vertex.x)}`;
        monotonicOut.textContent = monotonicDescription(a, vertex.x);
        injectiveOut.textContent = `ne na R, ano na (-∞, ${fmtNumber(vertex.x)}] a [${fmtNumber(vertex.x)}, ∞)`;
        rootsOut.textContent = rootsDescription(solved.D, solved.roots);
        signOut.textContent = signDescription(a, solved.roots);

        conclusionOut.textContent = `Funkce je osove soumerna podle x=${fmtNumber(vertex.x)} a extrem nastava ve vrcholu ${formatPoint(vertex.x, vertex.y)}.`;
    }

    Object.values(sliders).forEach(slider => slider.addEventListener('input', render));
    render();
}
function reflectionDescription(a, roots) {
    if (!roots.length) {
        return a > 0 ? 'zadna cast se neodrazi (q je kladna)' : 'odrazi se cely graf q nad osu x';
    }

    if (roots.length === 1) {
        return a > 0
            ? 'graf se prakticky nemeni, jen se dotyka osy x'
            : 'odrazi se cely graf, nulovy bod zustava stejny';
    }

    const r1 = fmtNumber(roots[0]);
    const r2 = fmtNumber(roots[1]);

    if (a > 0) {
        return `odrazi se cast na intervalu (${r1}, ${r2})`;
    }

    return `odrazi se cast mimo interval (${r1}, ${r2})`;
}

function piecewiseDescription(a, roots) {
    if (!roots.length) {
        return a > 0
            ? '\\(|q(x)|=q(x)\\) pro vsechna \\(x\\)'
            : '\\(|q(x)|=-q(x)\\) pro vsechna \\(x\\)';
    }

    if (roots.length === 1) {
        return a > 0
            ? '\\(q(x)\\ge0\\): bez zmeny znaku'
            : '\\(q(x)\\le0\\): mimo nulovy bod se meni znamenko';
    }

    const r1 = fmtNumber(roots[0]);
    const r2 = fmtNumber(roots[1]);

    return a > 0
        ? `\\(|q(x)|=q(x)\\) mimo (${r1}, ${r2}), uvnitr \\(|q(x)|=-q(x)\\)`
        : `\\(|q(x)|=q(x)\\) uvnitr (${r1}, ${r2}), mimo interval \\(|q(x)|=-q(x)\\)`;
}

function initAbsoluteLab() {
    const canvas = document.getElementById('quadAbsCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, { xMin: -8, xMax: 8, yMin: -10, yMax: 10 });

    const sliders = {
        a: document.getElementById('qaA'),
        b: document.getElementById('qaB'),
        c: document.getElementById('qaC')
    };

    const values = {
        a: document.getElementById('qaAValue'),
        b: document.getElementById('qaBValue'),
        c: document.getElementById('qaCValue')
    };

    const originalOut = document.getElementById('qabsOriginal');
    const absoluteOut = document.getElementById('qabsAbsolute');
    const rootsOut = document.getElementById('qabsRoots');
    const reflectionOut = document.getElementById('qabsReflection');
    const minimumOut = document.getElementById('qabsMinimum');
    const pieceOut = document.getElementById('qabsPiece');
    const conclusionOut = document.getElementById('qabsConclusion');

    function render() {
        const a = sanitizeLeadingCoefficient(sliders.a, 1);
        const b = Number.parseFloat(sliders.b.value);
        const c = Number.parseFloat(sliders.c.value);

        const vertex = vertexOfQuadratic(a, b, c);
        const solved = solveQuadratic(a, b, c);

        values.a.textContent = fmtNumber(a);
        values.b.textContent = fmtNumber(b);
        values.c.textContent = fmtNumber(c);

        drawGridAxes(plane);
        drawFunction(plane, x => a * x * x + b * x + c, { color: '#f97316', lineWidth: 2.3, dashed: true });
        drawFunction(plane, x => Math.abs(a * x * x + b * x + c), { color: '#10b981', lineWidth: 2.8 });

        drawVerticalGuide(plane, vertex.x, 'rgba(56,189,248,0.85)');
        solved.roots.forEach(root => drawPoint(plane, root, 0, '#22c55e', 5));

        originalOut.textContent = `q(x)=${buildPolynomialExpression(a, b, c)}`;
        absoluteOut.textContent = `F(x)=|${buildPolynomialExpression(a, b, c)}|`;
        rootsOut.textContent = rootsDescription(solved.D, solved.roots);
        reflectionOut.textContent = reflectionDescription(a, solved.roots);

        if (solved.roots.length) {
            minimumOut.textContent = `0 v korenech`; 
        } else {
            minimumOut.textContent = `${fmtNumber(Math.abs(vertex.y))} v x=${fmtNumber(vertex.x)}`;
        }

        pieceOut.innerHTML = piecewiseDescription(a, solved.roots);
        typeset(pieceOut);

        conclusionOut.textContent = 'Absolutni hodnota ponecha kladne casti grafu a zaporne casti preklopi nad osu x. Proto je vysledna funkce vzdy nezaporna.';
    }

    Object.values(sliders).forEach(slider => slider.addEventListener('input', render));
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
                alert('Vyberte prosim jednu odpoved.');
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
                    ? `Spravne. ${explanation}`
                    : `Nespravne. Spravna odpoved je ${correctLabel}. ${explanation}`;
                feedback.className = `mini-feedback show ${isCorrect ? 'correct' : 'incorrect'}`;
                typeset(feedback);
            }
        });
    });
}

function initExercises() {
    const explanation = {
        1: 'Pouzijte vzorec pro vrchol: \\(x_V=-\\frac{b}{2a}=2\\), potom \\(y_V=f(2)=-3\\).',
        2: 'U \\(f(x-3)-4\\) se vrchol z \\([0,0]\\) posune na \\([3,-4]\\).',
        3: 'Parabola je otevrena dolu, vrchol je v \\(x=2\\) a \\(y=1\\), proto \\(H(f)=(-\\infty,1]\\).',
        4: 'Koreny jsou \\(2\\) a \\(3\\). Pro \\(a>0\\) je funkce mezi koreny zaporna.',
        5: '\\(D=b^2-4ac=36-36=0\\), tedy jeden dvojnasobny koren.',
        6: 'Vyraz \\(x^2-1\\) je nezaporny mimo interval \\((-1,1)\\), tam se graf nemeni.'
    };

    const correctLabel = {
        1: '\\([2,-3]\\)',
        2: '\\([3,-4]\\)',
        3: '\\((-\\infty,1]\\)',
        4: '\\(2<x<3\\)',
        5: 'jeden dvojnasobny',
        6: '\\(x\\le-1\\) nebo \\(x\\ge1\\)'
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
            const correctValue = button.dataset.correct;

            if (!selected) {
                alert('Vyberte prosim jednu odpoved.');
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
                status.textContent = isCorrect ? 'Spravne' : 'Spatne';
                status.className = `exercise-status ${isCorrect ? 'correct' : 'incorrect'}`;
            }

            if (feedback) {
                feedback.innerHTML = isCorrect
                    ? `Spravne. ${explanation[id]}`
                    : `Nespravne. Spravna odpoved je ${correctLabel[id]}. ${explanation[id]}`;
                feedback.className = `exercise-feedback show ${isCorrect ? 'correct' : 'incorrect'}`;
                typeset(feedback);
            }

            const correctCount = document.querySelectorAll('.exercise-status.correct').length;
            if (solvedCount) {
                solvedCount.textContent = String(correctCount);
            }

            const allDone = Array.from(buttons).every(item => item.disabled);
            if (allDone) {
                const completeBox = document.getElementById('lessonComplete');
                const score = document.getElementById('lessonScore');

                if (score) {
                    score.textContent = `Spravne mate ${correctCount} z ${buttons.length} uloh.`;
                }

                if (completeBox) {
                    completeBox.style.display = 'block';
                    typeset(completeBox);
                }
            }
        });
    });
}
