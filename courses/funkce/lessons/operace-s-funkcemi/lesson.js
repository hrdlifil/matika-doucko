document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initNavbarScroll();
    initEqualityLab();
    initCompositionLab();
    initInverseLab();
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
        return value > 0 ? 'inf' : '-inf';
    }
    const factor = 10 ** digits;
    const rounded = Math.round(value * factor) / factor;
    if (Math.abs(rounded) < EPS) {
        return '0';
    }
    if (Math.abs(rounded - Math.round(rounded)) < 1e-8) {
        return String(Math.round(rounded));
    }
    return rounded.toFixed(digits).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function initNavigation() {
    const order = ['rovnost-funkci', 'skladani-funkci', 'inverzni-funkce', 'procvicovani'];
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
        xMin: typeof bounds.xMin === 'number' ? bounds.xMin : -6,
        xMax: typeof bounds.xMax === 'number' ? bounds.xMax : 6,
        yMin: typeof bounds.yMin === 'number' ? bounds.yMin : -6,
        yMax: typeof bounds.yMax === 'number' ? bounds.yMax : 6
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
    const xStep = options.xStep !== undefined ? options.xStep : 1;
    const yStep = options.yStep !== undefined ? options.yStep : 1;

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
    const samples = options.samples !== undefined ? options.samples : 1500;
    const color = options.color !== undefined ? options.color : '#6366f1';
    const lineWidth = options.lineWidth !== undefined ? options.lineWidth : 2.6;
    const dashed = options.dashed !== undefined ? options.dashed : false;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash(dashed ? [7, 5] : []);

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
        if (py < -200 || py > plane.height + 200) {
            if (drawing) {
                ctx.stroke();
                drawing = false;
            }
            continue;
        }

        if (!drawing || Math.abs(py - prevPy) > plane.height * 0.45) {
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

function drawPoint(plane, x, y, color = '#10b981', radius = 4.5) {
    const ctx = plane.ctx;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(toCanvasX(plane, x), toCanvasY(plane, y), radius, 0, Math.PI * 2);
    ctx.fill();
}

function drawVerticalLine(plane, x, color = 'rgba(239,68,68,0.8)') {
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

function drawIdentityLine(plane) {
    const ctx = plane.ctx;
    const start = Math.max(plane.xMin, plane.yMin);
    const end = Math.min(plane.xMax, plane.yMax);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.9)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.moveTo(toCanvasX(plane, start), toCanvasY(plane, start));
    ctx.lineTo(toCanvasX(plane, end), toCanvasY(plane, end));
    ctx.stroke();
    ctx.setLineDash([]);
}

function evalDefined(domainFn, evalFn, x) {
    if (!domainFn(x)) {
        return { defined: false, value: NaN };
    }
    const value = evalFn(x);
    if (!Number.isFinite(value)) {
        return { defined: false, value: NaN };
    }
    return { defined: true, value };
}

const EQ_SCENARIOS = {
    rational_max: {
        formulaF: '\\frac{x^2-1}{x-1}',
        formulaG: 'x+1',
        domainFLatex: '\\mathbb{R}\\setminus\\{1\\}',
        domainGLatex: '\\mathbb{R}',
        domainF: x => Math.abs(x - 1) > 1e-6,
        domainG: () => true,
        evaluateF: x => (x * x - 1) / (x - 1),
        evaluateG: x => x + 1,
        bounds: { xMin: -6, xMax: 6, yMin: -6, yMax: 8 },
        xSliderMin: -5,
        xSliderMax: 5,
        xStep: 0.05,
        equal: false,
        explanation: 'Nejsou rovné: mají různý definiční obor.'
    },
    rational_restricted: {
        formulaF: '\\frac{x^2-1}{x-1}',
        formulaG: 'x+1',
        domainFLatex: '\\mathbb{R}\\setminus\\{1\\}',
        domainGLatex: '\\mathbb{R}\\setminus\\{1\\}',
        domainF: x => Math.abs(x - 1) > 1e-6,
        domainG: x => Math.abs(x - 1) > 1e-6,
        evaluateF: x => (x * x - 1) / (x - 1),
        evaluateG: x => x + 1,
        bounds: { xMin: -6, xMax: 6, yMin: -6, yMax: 8 },
        xSliderMin: -5,
        xSliderMax: 5,
        xStep: 0.05,
        equal: true,
        explanation: 'Jsou rovné na oboru R\\{1}: pro všechna povolená x dávají stejnou hodnotu.'
    },
    root_abs: {
        formulaF: '\\sqrt{x^2}',
        formulaG: '|x|',
        domainFLatex: '\\mathbb{R}',
        domainGLatex: '\\mathbb{R}',
        domainF: () => true,
        domainG: () => true,
        evaluateF: x => Math.sqrt(x * x),
        evaluateG: x => Math.abs(x),
        bounds: { xMin: -6, xMax: 6, yMin: -1, yMax: 6 },
        xSliderMin: -6,
        xSliderMax: 6,
        xStep: 0.05,
        equal: true,
        explanation: 'Jsou rovné: sqrt(x^2)=|x| pro každé reálné x.'
    },
    root_x: {
        formulaF: '\\sqrt{x^2}',
        formulaG: 'x',
        domainFLatex: '\\mathbb{R}',
        domainGLatex: '\\mathbb{R}',
        domainF: () => true,
        domainG: () => true,
        evaluateF: x => Math.sqrt(x * x),
        evaluateG: x => x,
        bounds: { xMin: -6, xMax: 6, yMin: -6, yMax: 6 },
        xSliderMin: -6,
        xSliderMax: 6,
        xStep: 0.05,
        equal: false,
        explanation: 'Nejsou rovné: pro záporná x platí sqrt(x^2)=|x| != x.'
    }
};

function initEqualityLab() {
    const section = document.getElementById('rovnost-funkci');
    const canvas = document.getElementById('equalityCanvas');
    if (!section || !canvas) {
        return;
    }

    const plane = createPlane(canvas);
    const scenarioSelect = document.getElementById('eqScenario');
    const xSlider = document.getElementById('eqX');
    const xValue = document.getElementById('eqXValue');

    const formulaFOut = document.getElementById('eqFormulaF');
    const formulaGOut = document.getElementById('eqFormulaG');
    const domainFOut = document.getElementById('eqDomainF');
    const domainGOut = document.getElementById('eqDomainG');
    const valueFOut = document.getElementById('eqValueF');
    const valueGOut = document.getElementById('eqValueG');
    const diffOut = document.getElementById('eqDiff');
    const conclusionOut = document.getElementById('eqConclusion');

    function applySlider(scenario) {
        xSlider.min = String(scenario.xSliderMin);
        xSlider.max = String(scenario.xSliderMax);
        xSlider.step = String(scenario.xStep);
        xSlider.value = String(clamp(Number(xSlider.value), scenario.xSliderMin, scenario.xSliderMax));
    }

    function render() {
        const scenario = EQ_SCENARIOS[scenarioSelect.value];
        const x0 = Number(xSlider.value);

        setPlaneBounds(plane, scenario.bounds);
        drawGridAxes(plane);

        drawFunction(plane, scenario.evaluateF, scenario.domainF, {
            color: '#6366f1',
            lineWidth: 2.7
        });

        drawFunction(plane, scenario.evaluateG, scenario.domainG, {
            color: '#f59e0b',
            lineWidth: 2.3,
            dashed: true
        });

        drawVerticalLine(plane, x0);

        const fVal = evalDefined(scenario.domainF, scenario.evaluateF, x0);
        const gVal = evalDefined(scenario.domainG, scenario.evaluateG, x0);

        if (fVal.defined) {
            drawPoint(plane, x0, fVal.value, '#6366f1', 5);
        }
        if (gVal.defined) {
            drawPoint(plane, x0, gVal.value, '#f59e0b', 5);
        }

        xValue.textContent = fmtNumber(x0, 2);
        formulaFOut.textContent = `f(x) = ${scenario.formulaF}`;
        formulaGOut.textContent = `g(x) = ${scenario.formulaG}`;
        domainFOut.textContent = scenario.domainFLatex;
        domainGOut.textContent = scenario.domainGLatex;

        valueFOut.textContent = fVal.defined ? fmtNumber(fVal.value, 4) : 'nedefinováno';
        valueGOut.textContent = gVal.defined ? fmtNumber(gVal.value, 4) : 'nedefinováno';

        if (fVal.defined && gVal.defined) {
            diffOut.textContent = fmtNumber(fVal.value - gVal.value, 5);
        } else {
            diffOut.textContent = 'nelze porovnat';
        }

        let conclusion = scenario.explanation;
        if (fVal.defined && gVal.defined) {
            const localEqual = Math.abs(fVal.value - gVal.value) < 1e-6;
            conclusion += localEqual
                ? ' V tomto bodě vychází stejné hodnoty.'
                : ' V tomto bodě vychází různé hodnoty.';
        } else {
            conclusion += ' V aktuálním bodě není alespoň jedna funkce definována.';
        }

        conclusionOut.textContent = conclusion;
    }

    scenarioSelect.addEventListener('change', () => {
        applySlider(EQ_SCENARIOS[scenarioSelect.value]);
        render();
    });

    xSlider.addEventListener('input', render);

    applySlider(EQ_SCENARIOS[scenarioSelect.value]);
    render();
}

const COMP_SCENARIOS = {
    linear_quadratic: {
        formulaF: 'x^2+1',
        formulaG: '2x-3',
        formulaFG: '(2x-3)^2+1',
        formulaGF: '2x^2-1',
        domainF: () => true,
        domainG: () => true,
        evalF: x => x * x + 1,
        evalG: x => 2 * x - 3,
        domainFGLatex: 'R',
        domainGFLatex: 'R',
        bounds: { xMin: -6, xMax: 6, yMin: -8, yMax: 12 },
        xSliderMin: -5,
        xSliderMax: 5,
        xStep: 0.05,
        explanation: 'Poradi meni vysledek: obecne (f o g)(x) != (g o f)(x).'
    },
    sqrt_linear: {
        formulaF: 'sqrt(x)',
        formulaG: 'x-1',
        formulaFG: 'sqrt(x-1)',
        formulaGF: 'sqrt(x)-1',
        domainF: x => x >= 0,
        domainG: () => true,
        evalF: x => Math.sqrt(x),
        evalG: x => x - 1,
        domainFGLatex: '[1,inf)',
        domainGFLatex: '[0,inf)',
        bounds: { xMin: -2, xMax: 8, yMin: -4, yMax: 6 },
        xSliderMin: -1.5,
        xSliderMax: 7,
        xStep: 0.05,
        explanation: 'Navíc se liší i definiční obory obou složených funkcí.'
    },
    reciprocal_quadratic: {
        formulaF: '1/x',
        formulaG: 'x^2-4',
        formulaFG: '1/(x^2-4)',
        formulaGF: '1/x^2-4',
        domainF: x => Math.abs(x) > 1e-6,
        domainG: () => true,
        evalF: x => 1 / x,
        evalG: x => x * x - 4,
        domainFGLatex: 'R\\{-2,2}',
        domainGFLatex: 'R\\{0}',
        bounds: { xMin: -6, xMax: 6, yMin: -6, yMax: 6 },
        xSliderMin: -5,
        xSliderMax: 5,
        xStep: 0.05,
        explanation: 'Dávejte pozor na místa, kde jmenovatel vyjde nula.'
    }
};

function initCompositionLab() {
    const section = document.getElementById('skladani-funkci');
    const canvas = document.getElementById('compositionCanvas');
    if (!section || !canvas) {
        return;
    }

    const plane = createPlane(canvas);
    const scenarioSelect = document.getElementById('compScenario');
    const xSlider = document.getElementById('compX');
    const xValue = document.getElementById('compXValue');
    const showReverse = document.getElementById('compShowReverse');

    const formulaFOut = document.getElementById('compFormulaF');
    const formulaGOut = document.getElementById('compFormulaG');
    const formulaFGOut = document.getElementById('compFormulaFG');
    const formulaGFOut = document.getElementById('compFormulaGF');
    const domainFGOut = document.getElementById('compDomainFG');
    const domainGFOut = document.getElementById('compDomainGF');
    const gxOut = document.getElementById('compGX');
    const fgxOut = document.getElementById('compFGX');
    const fxOut = document.getElementById('compFX');
    const gfxOut = document.getElementById('compGFX');
    const noteOut = document.getElementById('compOrderNote');

    function applySlider(scenario) {
        xSlider.min = String(scenario.xSliderMin);
        xSlider.max = String(scenario.xSliderMax);
        xSlider.step = String(scenario.xStep);
        xSlider.value = String(clamp(Number(xSlider.value), scenario.xSliderMin, scenario.xSliderMax));
    }

    function evalFG(scenario, x) {
        const gx = evalDefined(scenario.domainG, scenario.evalG, x);
        if (!gx.defined) {
            return { defined: false, gx: NaN, value: NaN };
        }
        const fg = evalDefined(scenario.domainF, scenario.evalF, gx.value);
        return { defined: fg.defined, gx: gx.value, value: fg.value };
    }

    function evalGF(scenario, x) {
        const fx = evalDefined(scenario.domainF, scenario.evalF, x);
        if (!fx.defined) {
            return { defined: false, fx: NaN, value: NaN };
        }
        const gf = evalDefined(scenario.domainG, scenario.evalG, fx.value);
        return { defined: gf.defined, fx: fx.value, value: gf.value };
    }

    function domainFG(scenario, x) {
        return scenario.domainG(x) && scenario.domainF(scenario.evalG(x));
    }

    function domainGF(scenario, x) {
        return scenario.domainF(x) && scenario.domainG(scenario.evalF(x));
    }

    function render() {
        const scenario = COMP_SCENARIOS[scenarioSelect.value];
        const x0 = Number(xSlider.value);

        setPlaneBounds(plane, scenario.bounds);
        drawGridAxes(plane);

        drawFunction(plane, scenario.evalF, scenario.domainF, {
            color: '#6366f1',
            lineWidth: 1.9,
            dashed: true
        });

        drawFunction(plane, scenario.evalG, scenario.domainG, {
            color: '#f59e0b',
            lineWidth: 2.1,
            dashed: true
        });

        drawFunction(plane, x => scenario.evalF(scenario.evalG(x)), x => domainFG(scenario, x), {
            color: '#10b981',
            lineWidth: 2.8
        });

        if (showReverse.checked) {
            drawFunction(plane, x => scenario.evalG(scenario.evalF(x)), x => domainGF(scenario, x), {
                color: '#ec4899',
                lineWidth: 2.4,
                dashed: true
            });
        }

        drawVerticalLine(plane, x0);

        const gx = evalDefined(scenario.domainG, scenario.evalG, x0);
        const fx = evalDefined(scenario.domainF, scenario.evalF, x0);
        const fg = evalFG(scenario, x0);
        const gf = evalGF(scenario, x0);

        if (gx.defined) drawPoint(plane, x0, gx.value, '#f59e0b', 4.5);
        if (fx.defined) drawPoint(plane, x0, fx.value, '#6366f1', 4.5);
        if (fg.defined) drawPoint(plane, x0, fg.value, '#10b981', 5);
        if (showReverse.checked && gf.defined) drawPoint(plane, x0, gf.value, '#ec4899', 5);

        xValue.textContent = fmtNumber(x0, 2);
        formulaFOut.textContent = `f(x) = ${scenario.formulaF}`;
        formulaGOut.textContent = `g(x) = ${scenario.formulaG}`;
        formulaFGOut.textContent = `(f o g)(x) = ${scenario.formulaFG}`;
        formulaGFOut.textContent = `(g o f)(x) = ${scenario.formulaGF}`;
        domainFGOut.textContent = scenario.domainFGLatex;
        domainGFOut.textContent = scenario.domainGFLatex;

        gxOut.textContent = gx.defined ? fmtNumber(gx.value, 4) : 'nedefinováno';
        fgxOut.textContent = fg.defined ? fmtNumber(fg.value, 4) : 'nedefinováno';
        fxOut.textContent = fx.defined ? fmtNumber(fx.value, 4) : 'nedefinováno';
        gfxOut.textContent = showReverse.checked
            ? (gf.defined ? fmtNumber(gf.value, 4) : 'nedefinováno')
            : 'skryto';

        let note = scenario.explanation;
        if (fg.defined && gf.defined) {
            note += Math.abs(fg.value - gf.value) < 1e-6
                ? ' V tomto bodě vyšly stejné, ale obecně to neplatí.'
                : ' V tomto bodě vyšly různé hodnoty.';
        } else if (fg.defined && !gf.defined) {
            note += ' V tomto bodě je (f o g) definovano, ale (g o f) ne.';
        } else if (!fg.defined && gf.defined) {
            note += ' V tomto bodě je (g o f) definovano, ale (f o g) ne.';
        } else {
            note += ' V tomto bodě není definována ani jedna složená funkce.';
        }
        noteOut.textContent = note;
    }

    scenarioSelect.addEventListener('change', () => {
        applySlider(COMP_SCENARIOS[scenarioSelect.value]);
        render();
    });
    xSlider.addEventListener('input', render);
    showReverse.addEventListener('change', render);

    applySlider(COMP_SCENARIOS[scenarioSelect.value]);
    render();
}

const INV_SCENARIOS = {
    linear: {
        formulaF: '2x-3',
        formulaInv: '(x+3)/2',
        domainLatex: 'R',
        rangeLatex: 'R',
        domainFn: () => true,
        rangeFn: () => true,
        evaluate: x => 2 * x - 3,
        inverse: y => (y + 3) / 2,
        bounds: { xMin: -6, xMax: 6, yMin: -6, yMax: 6 },
        xSliderMin: -4,
        xSliderMax: 4,
        xStep: 0.05,
        ySliderMin: -4,
        ySliderMax: 4,
        yStep: 0.05,
        note: 'Lineární funkce s nenulovým koeficientem je vždy bijekce na R.'
    },
    cubic: {
        formulaF: 'x^3',
        formulaInv: 'cuberoot(x)',
        domainLatex: 'R',
        rangeLatex: 'R',
        domainFn: () => true,
        rangeFn: () => true,
        evaluate: x => x * x * x,
        inverse: y => Math.cbrt(y),
        bounds: { xMin: -3, xMax: 3, yMin: -10, yMax: 10 },
        xSliderMin: -2,
        xSliderMax: 2,
        xStep: 0.05,
        ySliderMin: -8,
        ySliderMax: 8,
        yStep: 0.05,
        note: 'Funkce x^3 je prostá i na celém R, proto má inverzi.'
    },
    quadratic_restricted: {
        formulaF: 'x^2 na [0,inf)',
        formulaInv: 'sqrt(x)',
        domainLatex: '[0,inf)',
        rangeLatex: '[0,inf)',
        domainFn: x => x >= 0,
        rangeFn: y => y >= 0,
        evaluate: x => x * x,
        inverse: y => Math.sqrt(y),
        bounds: { xMin: -1, xMax: 7, yMin: -1, yMax: 12 },
        xSliderMin: 0,
        xSliderMax: 6,
        xStep: 0.05,
        ySliderMin: 0,
        ySliderMax: 10,
        yStep: 0.05,
        note: 'Bez omezení oboru by x^2 nebyla prostá a inverzní funkce by neexistovala.'
    },
    exponential: {
        formulaF: 'e^x',
        formulaInv: 'ln(x)',
        domainLatex: 'R',
        rangeLatex: '(0,inf)',
        domainFn: () => true,
        rangeFn: y => y > 0,
        evaluate: x => Math.exp(x),
        inverse: y => Math.log(y),
        bounds: { xMin: -4, xMax: 4, yMin: -2, yMax: 10 },
        xSliderMin: -2.2,
        xSliderMax: 2.2,
        xStep: 0.05,
        ySliderMin: 0.1,
        ySliderMax: 8,
        yStep: 0.05,
        note: 'Exponenciála je přísně rostoucí a inverzí je přirozený logaritmus.'
    }
};

function initInverseLab() {
    const section = document.getElementById('inverzni-funkce');
    const canvas = document.getElementById('inverseCanvas');
    if (!section || !canvas) {
        return;
    }

    const plane = createPlane(canvas);
    const scenarioSelect = document.getElementById('invScenario');
    const xSlider = document.getElementById('invX');
    const ySlider = document.getElementById('invY');

    const xOut = document.getElementById('invXValue');
    const yOut = document.getElementById('invYValue');
    const formulaFOut = document.getElementById('invFormulaF');
    const formulaInvOut = document.getElementById('invFormulaInv');
    const domainOut = document.getElementById('invDomain');
    const rangeOut = document.getElementById('invRange');
    const fxOut = document.getElementById('invFx');
    const invFxOut = document.getElementById('invInvFx');
    const invYOut = document.getElementById('invInvY');
    const fInvYOut = document.getElementById('invFInvY');
    const conclusionOut = document.getElementById('invConclusion');

    function applySliders(scenario) {
        xSlider.min = String(scenario.xSliderMin);
        xSlider.max = String(scenario.xSliderMax);
        xSlider.step = String(scenario.xStep);
        xSlider.value = String(clamp(Number(xSlider.value), scenario.xSliderMin, scenario.xSliderMax));

        ySlider.min = String(scenario.ySliderMin);
        ySlider.max = String(scenario.ySliderMax);
        ySlider.step = String(scenario.yStep);
        ySlider.value = String(clamp(Number(ySlider.value), scenario.ySliderMin, scenario.ySliderMax));
    }

    function render() {
        const scenario = INV_SCENARIOS[scenarioSelect.value];
        const x0 = Number(xSlider.value);
        const y0 = Number(ySlider.value);

        const fx = evalDefined(scenario.domainFn, scenario.evaluate, x0);
        const invFx = fx.defined
            ? evalDefined(scenario.rangeFn, scenario.inverse, fx.value)
            : { defined: false, value: NaN };

        const invY = evalDefined(scenario.rangeFn, scenario.inverse, y0);
        const fInvY = invY.defined
            ? evalDefined(scenario.domainFn, scenario.evaluate, invY.value)
            : { defined: false, value: NaN };

        setPlaneBounds(plane, scenario.bounds);
        drawGridAxes(plane);
        drawIdentityLine(plane);

        drawFunction(plane, scenario.evaluate, scenario.domainFn, {
            color: '#6366f1',
            lineWidth: 2.8
        });

        drawFunction(plane, scenario.inverse, scenario.rangeFn, {
            color: '#f97316',
            lineWidth: 2.4,
            dashed: true
        });

        if (fx.defined) {
            drawPoint(plane, x0, fx.value, '#10b981', 5.5);
            if (invFx.defined) {
                drawPoint(plane, fx.value, invFx.value, '#f97316', 5.5);
            }
        }

        if (invY.defined && fInvY.defined) {
            drawPoint(plane, y0, invY.value, '#ec4899', 4.5);
            drawPoint(plane, invY.value, fInvY.value, '#6366f1', 4.5);
        }

        xOut.textContent = fmtNumber(x0, 2);
        yOut.textContent = fmtNumber(y0, 2);
        formulaFOut.textContent = `f(x) = ${scenario.formulaF}`;
        formulaInvOut.textContent = `f^-1(x) = ${scenario.formulaInv}`;
        domainOut.textContent = scenario.domainLatex;
        rangeOut.textContent = scenario.rangeLatex;

        fxOut.textContent = fx.defined ? fmtNumber(fx.value, 5) : 'nedefinováno';
        invFxOut.textContent = invFx.defined ? fmtNumber(invFx.value, 5) : 'nedefinováno';
        invYOut.textContent = invY.defined ? fmtNumber(invY.value, 5) : 'nedefinováno';
        fInvYOut.textContent = fInvY.defined ? fmtNumber(fInvY.value, 5) : 'nedefinováno';

        let conclusion = scenario.note;
        if (invFx.defined && fInvY.defined) {
            const leftOk = Math.abs(invFx.value - x0) < 1e-5;
            const rightOk = Math.abs(fInvY.value - y0) < 1e-5;
            if (leftOk && rightOk) {
                conclusion += ' Obě ověřovací identity vycházejí.';
            } else {
                conclusion += ' V numerickém výpočtu je malá zaokrouhlovací chyba.';
            }
        } else {
            conclusion += ' Zvolená hodnota není v požadovaném oboru.';
        }
        conclusionOut.textContent = conclusion;
    }

    scenarioSelect.addEventListener('change', () => {
        applySliders(INV_SCENARIOS[scenarioSelect.value]);
        render();
    });
    xSlider.addEventListener('input', render);
    ySlider.addEventListener('input', render);

    applySliders(INV_SCENARIOS[scenarioSelect.value]);
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
        1: 'Po roznásobení platí (x-1)(x+1)=x^2-1, obor je v obou případech R.',
        2: 'Predpisy se sice shoduji pro x != 1, ale funkce maji na maximalnich oborech ruzne definicni obory.',
        3: 'Musi platit x-4 >= 0, tedy x >= 4.',
        4: 'Nejdřív dosadíme do f: 2x+3, až potom do g: (2x+3)^2.',
        5: 'Z y=3x-5 vyjádříme x=(y+5)/3, po prohození proměnných dostaneme inverzi.',
        6: 'Na [0, inf) je x^2 prosta a inverzni funkci je hlavni odmocnina.',
        7: 'Inverzní funkce přehazuje role: D(f^{-1})=H(f).',
        8: 'Složení inverzních funkcí vrací původní vstup: f(g(x))=x a g(f(x))=x.'
    };

    const correctLabel = {
        1: 'Ano',
        2: 'nerovné (liší se definičním oborem)',
        3: '[4,inf)',
        4: '(2x+3)^2',
        5: '(x+5)/3',
        6: 'f^{-1}(x)=sqrt(x)',
        7: 'H',
        8: 'f(g(x))=x'
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


