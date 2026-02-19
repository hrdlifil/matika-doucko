// Uvod do funkci - interaktivni lekce

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initNavbarScroll();
    initDomainRangeLab();
    initRelationLab();
    initGraphLab();
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

function initNavigation() {
    const order = [
        'definicni-obor-a-obor-hodnot',
        'co-je-funkci-a-co-neni',
        'graf-funkce',
        'procvicovani'
    ];

    const sections = document.querySelectorAll('.lesson-section');
    const links = document.querySelectorAll('.sidebar-link');
    const nextButtons = document.querySelectorAll('.btn-next');
    const prevButtons = document.querySelectorAll('.btn-prev');

    function updateProgress(sectionId) {
        const index = order.indexOf(sectionId);
        const progress = index >= 0 ? ((index + 1) / order.length) * 100 : 0;
        const bar = document.querySelector('.progress-fill-small');
        if (bar) {
            bar.style.width = `${progress}%`;
        }
    }

    function showSection(sectionId, smooth = true) {
        const target = document.getElementById(sectionId);
        if (!target) {
            return;
        }

        sections.forEach(section => section.classList.remove('active'));
        links.forEach(link => link.classList.remove('active'));

        target.classList.add('active');
        const activeLink = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        updateProgress(sectionId);
        window.history.replaceState(null, '', `#${sectionId}`);

        if (smooth) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        typeset(target);
    }

    links.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            showSection(link.dataset.section);
        });
    });

    nextButtons.forEach(button => {
        button.addEventListener('click', () => showSection(button.dataset.next));
    });

    prevButtons.forEach(button => {
        button.addEventListener('click', () => showSection(button.dataset.prev));
    });

    const hash = window.location.hash.replace('#', '');
    showSection(order.includes(hash) ? hash : order[0], false);
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

function nearlyEqual(a, b, tolerance = EPS) {
    return Math.abs(a - b) <= tolerance;
}

function fmt(value) {
    if (!Number.isFinite(value)) {
        return value < 0 ? '-\\infty' : '\\infty';
    }

    const clean = Math.abs(value) < EPS ? 0 : value;
    const rounded = Math.round(clean * 100) / 100;
    const integerLike = nearlyEqual(rounded, Math.round(rounded), 1e-6);
    if (integerLike) {
        return String(Math.round(rounded));
    }

    return rounded.toFixed(2).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
}

function plusTerm(value) {
    if (Math.abs(value) < EPS) {
        return '';
    }
    return value > 0 ? `+${fmt(value)}` : fmt(value);
}

function canvasPlane(canvas, options = {}) {
    const ctx = canvas.getContext('2d');
    return {
        canvas,
        ctx,
        width: canvas.width,
        height: canvas.height,
        xMin: options.xMin ?? -8,
        xMax: options.xMax ?? 8,
        yMin: options.yMin ?? -8,
        yMax: options.yMax ?? 8
    };
}

function toCanvasX(plane, x) {
    return ((x - plane.xMin) / (plane.xMax - plane.xMin)) * plane.width;
}

function toCanvasY(plane, y) {
    return plane.height - ((y - plane.yMin) / (plane.yMax - plane.yMin)) * plane.height;
}

function clearPlane(plane) {
    const { ctx, width, height } = plane;
    ctx.fillStyle = '#08080d';
    ctx.fillRect(0, 0, width, height);
}

function drawGridAndAxes(plane) {
    const { ctx, xMin, xMax, yMin, yMax } = plane;
    clearPlane(plane);

    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;

    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x += 1) {
        const px = toCanvasX(plane, x);
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, plane.height);
        ctx.stroke();
    }

    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y += 1) {
        const py = toCanvasY(plane, y);
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(plane.width, py);
        ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 2;

    const axisX = toCanvasY(plane, 0);
    const axisY = toCanvasX(plane, 0);

    ctx.beginPath();
    ctx.moveTo(0, axisX);
    ctx.lineTo(plane.width, axisX);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(axisY, 0);
    ctx.lineTo(axisY, plane.height);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '12px Inter, sans-serif';
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x += 2) {
        if (x === 0) {
            continue;
        }
        ctx.fillText(String(x), toCanvasX(plane, x) - 5, axisX + 15);
    }
    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y += 2) {
        if (y === 0) {
            continue;
        }
        ctx.fillText(String(y), axisY + 6, toCanvasY(plane, y) + 4);
    }
}

function drawCurve(plane, evaluate, defined, color = '#6366f1') {
    const { ctx, xMin, xMax } = plane;
    const step = (xMax - xMin) / 800;

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;

    let drawing = false;
    for (let x = xMin; x <= xMax; x += step) {
        if (!defined(x)) {
            drawing = false;
            continue;
        }

        const y = evaluate(x);
        if (!Number.isFinite(y) || y < plane.yMin - 1 || y > plane.yMax + 1) {
            drawing = false;
            continue;
        }

        const px = toCanvasX(plane, x);
        const py = toCanvasY(plane, y);

        if (!drawing) {
            ctx.beginPath();
            ctx.moveTo(px, py);
            drawing = true;
        } else {
            ctx.lineTo(px, py);
            ctx.stroke();
        }
    }
}

function drawPoint(plane, x, y, color, radius = 6) {
    const { ctx } = plane;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(toCanvasX(plane, x), toCanvasY(plane, y), radius, 0, Math.PI * 2);
    ctx.fill();
}

function drawVerticalGuide(plane, x, color = 'rgba(239,68,68,0.55)') {
    const { ctx } = plane;
    const px = toCanvasX(plane, x);
    ctx.strokeStyle = color;
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, plane.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

const DOMAIN_MODELS = {
    linear: {
        formula: 'f(x)=2x-1',
        domain: '\\mathbb{R}',
        range: '\\mathbb{R}',
        defined: () => true,
        evaluate: x => 2 * x - 1,
        noteDefined: 'Lineární funkce je definovaná pro všechna reálná x.',
        noteUndefined: ''
    },
    quadratic: {
        formula: 'f(x)=x^2-4',
        domain: '\\mathbb{R}',
        range: '[-4,\\infty)',
        defined: () => true,
        evaluate: x => x * x - 4,
        noteDefined: 'Kvadratická funkce má minimum -4 v bodě x=0.',
        noteUndefined: ''
    },
    reciprocal: {
        formula: 'f(x)=\\frac{1}{x-2}',
        domain: '\\mathbb{R}\\setminus\\{2\\}',
        range: '\\mathbb{R}\\setminus\\{0\\}',
        defined: x => !nearlyEqual(x, 2, 1e-7),
        evaluate: x => 1 / (x - 2),
        noteDefined: 'Funkce je definovaná pro všechna x kromě x=2.',
        noteUndefined: 'Pro x=2 je jmenovatel nulový, hodnota není definovaná.',
        verticalAsymptote: 2
    },
    root: {
        formula: 'f(x)=\\sqrt{x+1}',
        domain: '[-1,\\infty)',
        range: '[0,\\infty)',
        defined: x => x >= -1 - EPS,
        evaluate: x => Math.sqrt(Math.max(0, x + 1)),
        noteDefined: 'Odmocnina je definovaná jen pro nezáporný výraz pod odmocninou.',
        noteUndefined: 'Pro x<-1 je pod odmocninou záporné číslo.'
    },
    absolute: {
        formula: 'f(x)=|x|-2',
        domain: '\\mathbb{R}',
        range: '[-2,\\infty)',
        defined: () => true,
        evaluate: x => Math.abs(x) - 2,
        noteDefined: 'Absolutní hodnota je vždy nezáporná, proto je minimum -2.',
        noteUndefined: ''
    }
};

function initDomainRangeLab() {
    const section = document.getElementById('definicni-obor-a-obor-hodnot');
    if (!section) {
        return;
    }

    const select = document.getElementById('drFunction');
    const xSlider = document.getElementById('drX');
    const xValue = document.getElementById('drXValue');
    const formulaLatex = document.getElementById('drFormulaLatex');
    const domainLatex = document.getElementById('drDomainLatex');
    const rangeLatex = document.getElementById('drRangeLatex');
    const valueLatex = document.getElementById('drValueLatex');
    const note = document.getElementById('drInterpretation');
    const canvas = document.getElementById('domainRangeCanvas');

    if (!select || !xSlider || !canvas) {
        return;
    }

    const plane = canvasPlane(canvas);

    function update() {
        const model = DOMAIN_MODELS[select.value];
        const x0 = Number(xSlider.value);
        const isDefined = model.defined(x0);
        const y0 = isDefined ? model.evaluate(x0) : NaN;

        xValue.textContent = fmt(x0);
        formulaLatex.innerHTML = `\\(${model.formula}\\)`;
        domainLatex.innerHTML = `\\(${model.domain}\\)`;
        rangeLatex.innerHTML = `\\(${model.range}\\)`;

        if (isDefined && Number.isFinite(y0)) {
            valueLatex.innerHTML = `\\(f(${fmt(x0)})=${fmt(y0)}\\)`;
            note.textContent = model.noteDefined;
        } else {
            valueLatex.innerHTML = `\\(f(${fmt(x0)})\\text{ není definována}\\)`;
            note.textContent = model.noteUndefined || 'V tomto bodě funkce není definovaná.';
        }

        drawGridAndAxes(plane);
        drawCurve(plane, model.evaluate, model.defined, '#8b5cf6');

        if (typeof model.verticalAsymptote === 'number') {
            drawVerticalGuide(plane, model.verticalAsymptote, 'rgba(245,158,11,0.7)');
        }

        if (isDefined && Number.isFinite(y0) && y0 >= plane.yMin && y0 <= plane.yMax) {
            drawPoint(plane, x0, y0, '#10b981', 6);
        }

        typeset(section);
    }

    select.addEventListener('change', update);
    xSlider.addEventListener('input', update);
    update();
}

const RELATION_SCENARIOS = {
    parabola: {
        relation: '\\{(-3,7),(-2,3),(-1,1),(0,1),(1,3),(2,7)\\}',
        points: [[-3, 7], [-2, 3], [-1, 1], [0, 1], [1, 3], [2, 7]],
        isFunction: true,
        explanation: 'Každé x se vyskytuje právě jednou.'
    },
    circle: {
        relation: '\\{(-2,0),(-1,1.7),(-1,-1.7),(0,2),(0,-2),(1,1.7),(1,-1.7),(2,0)\\}',
        points: [[-2, 0], [-1, 1.7], [-1, -1.7], [0, 2], [0, -2], [1, 1.7], [1, -1.7], [2, 0]],
        isFunction: false,
        explanation: 'Stejné x má dvě různé y, proto to není funkce.'
    },
    vertical: {
        relation: '\\{(2,-3),(2,-1),(2,1),(2,3)\\}',
        points: [[2, -3], [2, -1], [2, 1], [2, 3]],
        isFunction: false,
        explanation: 'Svislá přímka porušuje podmínku jednoznačnosti.'
    },
    polyline: {
        relation: '\\{(-3,-1),(-2,0),(-1,1),(0,2),(1,1),(2,0)\\}',
        points: [[-3, -1], [-2, 0], [-1, 1], [0, 2], [1, 1], [2, 0]],
        isFunction: true,
        explanation: 'Žádné x nemá dvě různé hodnoty y.'
    }
};

function duplicateXValues(points) {
    const map = new Map();

    points.forEach(([x, y]) => {
        const key = fmt(x);
        if (!map.has(key)) {
            map.set(key, new Set());
        }
        map.get(key).add(fmt(y));
    });

    const duplicates = [];
    map.forEach((values, key) => {
        if (values.size > 1) {
            duplicates.push(Number(key.replace(',', '.')));
        }
    });

    return duplicates;
}

function clearSelectionByName(name) {
    document.querySelectorAll(`input[name="${name}"]`).forEach(input => {
        input.checked = false;
        input.disabled = false;
        if (input.parentElement) {
            input.parentElement.classList.remove('correct', 'incorrect');
        }
    });
}

function initRelationLab() {
    const section = document.getElementById('co-je-funkci-a-co-neni');
    if (!section) {
        return;
    }

    const select = document.getElementById('relationScenario');
    const relationLatex = document.getElementById('relationLatex');
    const collisionLatex = document.getElementById('relationCollisionLatex');
    const note = document.getElementById('relationHint');
    const button = document.getElementById('relationCheckBtn');
    const feedback = document.getElementById('relationFeedback');
    const canvas = document.getElementById('relationCanvas');

    if (!select || !button || !canvas) {
        return;
    }

    const plane = canvasPlane(canvas);
    let current = RELATION_SCENARIOS[select.value];

    function renderScenario() {
        current = RELATION_SCENARIOS[select.value];
        const duplicates = duplicateXValues(current.points);

        relationLatex.innerHTML = `\\(${current.relation}\\)`;
        if (duplicates.length === 0) {
            collisionLatex.innerHTML = '\\(\\text{Bez kolize vstupu }x\\)';
        } else {
            const joined = duplicates.map(x => fmt(x)).join(',\\;');
            collisionLatex.innerHTML = `\\(\\text{Kolize pro }x=${joined}\\)`;
        }
        note.textContent = current.explanation;

        drawGridAndAxes(plane);

        duplicates.forEach(x => drawVerticalGuide(plane, x));

        current.points.forEach(([x, y]) => {
            drawPoint(plane, x, y, '#3b82f6', 5);
        });

        clearSelectionByName('relation-answer');
        feedback.className = 'mini-feedback';
        feedback.textContent = '';
        button.disabled = false;

        typeset(section);
    }

    function checkRelation() {
        const selected = document.querySelector('input[name="relation-answer"]:checked');
        if (!selected) {
            alert('Vyberte prosím jednu odpověď.');
            return;
        }

        const userAnswer = selected.value === 'yes';
        const isCorrect = userAnswer === current.isFunction;

        clearSelectionByName('relation-answer');
        const options = document.querySelectorAll('input[name="relation-answer"]');
        options.forEach(option => {
            option.disabled = true;
            const isTrueOption = (option.value === 'yes') === current.isFunction;
            if (isTrueOption) {
                option.parentElement.classList.add('correct');
            }
        });

        selected.parentElement.classList.add(isCorrect ? 'correct' : 'incorrect');
        button.disabled = true;

        if (isCorrect) {
            feedback.textContent = 'Správně. Relace splňuje podmínku funkce.';
        } else {
            const correctText = current.isFunction ? 'Ano, je to funkce.' : 'Ne, není to funkce.';
            feedback.textContent = `Nesprávně. Správná odpověď je: ${correctText} ${current.explanation}`;
        }
        feedback.className = `mini-feedback show ${isCorrect ? 'correct' : 'incorrect'}`;
        typeset(section);
    }

    select.addEventListener('change', renderScenario);
    button.addEventListener('click', checkRelation);
    renderScenario();
}

function signedSymbol(value) {
    return value >= 0 ? '+' : '-';
}

function coeffWithSymbol(value, symbol) {
    if (Math.abs(value) < EPS) {
        return '';
    }

    const sign = value >= 0 ? '+' : '-';
    const absValue = Math.abs(value);
    const absText = nearlyEqual(absValue, 1) && symbol ? '' : fmt(absValue);
    return `${sign}${absText}${symbol}`;
}

function joinTerms(terms) {
    let out = '';
    terms.forEach(term => {
        if (!term) {
            return;
        }
        if (!out) {
            out = term.startsWith('+') ? term.slice(1) : term;
        } else {
            out += term;
        }
    });
    return out || '0';
}

function absoluteInside(h) {
    if (Math.abs(h) < EPS) {
        return 'x';
    }
    return h > 0 ? `x-${fmt(h)}` : `x+${fmt(-h)}`;
}

const GRAPH_MODELS = {
    linear: {
        params: [
            { key: 'a', label: 'a', min: -4, max: 4, step: 0.5, value: 1.5 },
            { key: 'b', label: 'b', min: -6, max: 6, step: 0.5, value: -1 }
        ],
        evaluate: (x, p) => p.a * x + p.b,
        formula: p => `f(x)=${joinTerms([coeffWithSymbol(p.a, 'x'), coeffWithSymbol(p.b, '')])}`,
        domain: () => '\\mathbb{R}',
        range: p => (Math.abs(p.a) < EPS ? `\\{${fmt(p.b)}\\}` : '\\mathbb{R}')
    },
    quadratic: {
        params: [
            { key: 'a', label: 'a', min: -3, max: 3, step: 0.5, value: 1 },
            { key: 'b', label: 'b', min: -6, max: 6, step: 0.5, value: -2 },
            { key: 'c', label: 'c', min: -6, max: 6, step: 0.5, value: -3 }
        ],
        evaluate: (x, p) => p.a * x * x + p.b * x + p.c,
        formula: p => `f(x)=${joinTerms([coeffWithSymbol(p.a, 'x^2'), coeffWithSymbol(p.b, 'x'), coeffWithSymbol(p.c, '')])}`,
        domain: () => '\\mathbb{R}',
        range: p => {
            if (Math.abs(p.a) < EPS) {
                if (Math.abs(p.b) < EPS) {
                    return `\\{${fmt(p.c)}\\}`;
                }
                return '\\mathbb{R}';
            }
            const xv = -p.b / (2 * p.a);
            const yv = p.a * xv * xv + p.b * xv + p.c;
            return p.a > 0 ? `[${fmt(yv)},\\infty)` : `(-\\infty,${fmt(yv)}]`;
        }
    },
    absolute: {
        params: [
            { key: 'a', label: 'a', min: -4, max: 4, step: 0.5, value: 1 },
            { key: 'h', label: 'h', min: -5, max: 5, step: 0.5, value: 0 },
            { key: 'k', label: 'k', min: -6, max: 6, step: 0.5, value: -2 }
        ],
        evaluate: (x, p) => p.a * Math.abs(x - p.h) + p.k,
        formula: p => {
            const inside = absoluteInside(p.h);
            if (Math.abs(p.a) < EPS) {
                return `f(x)=${fmt(p.k)}`;
            }

            let mainPart = '';
            if (nearlyEqual(p.a, 1)) {
                mainPart = `|${inside}|`;
            } else if (nearlyEqual(p.a, -1)) {
                mainPart = `-|${inside}|`;
            } else {
                mainPart = `${fmt(p.a)}|${inside}|`;
            }
            return `f(x)=${mainPart}${plusTerm(p.k)}`;
        },
        domain: () => '\\mathbb{R}',
        range: p => {
            if (Math.abs(p.a) < EPS) {
                return `\\{${fmt(p.k)}\\}`;
            }
            return p.a > 0 ? `[${fmt(p.k)},\\infty)` : `(-\\infty,${fmt(p.k)}]`;
        }
    }
};

function initGraphLab() {
    const section = document.getElementById('graf-funkce');
    if (!section) {
        return;
    }

    const familySelect = document.getElementById('graphFamily');
    const paramInputs = [
        document.getElementById('graphParam1'),
        document.getElementById('graphParam2'),
        document.getElementById('graphParam3')
    ];
    const paramWraps = [
        paramInputs[0]?.closest('.control-item'),
        paramInputs[1]?.closest('.control-item'),
        document.getElementById('graphParam3Wrap')
    ];
    const paramLabels = [
        document.getElementById('param1Label'),
        document.getElementById('param2Label'),
        document.getElementById('param3Label')
    ];
    const paramValues = [
        document.getElementById('param1Value'),
        document.getElementById('param2Value'),
        document.getElementById('param3Value')
    ];

    const formulaLatex = document.getElementById('graphFormulaLatex');
    const domainLatex = document.getElementById('graphDomainLatex');
    const rangeLatex = document.getElementById('graphRangeLatex');
    const tableLatex = document.getElementById('graphTableLatex');
    const pointXInput = document.getElementById('pointX');
    const pointYInput = document.getElementById('pointY');
    const pointCheckBtn = document.getElementById('pointCheckBtn');
    const pointFeedback = document.getElementById('pointFeedback');
    const canvas = document.getElementById('graphCanvas');

    if (!familySelect || !canvas || !pointCheckBtn) {
        return;
    }

    const plane = canvasPlane(canvas);
    const state = {
        family: familySelect.value,
        params: {},
        testedPoint: null
    };

    function configureForFamily() {
        state.family = familySelect.value;
        const model = GRAPH_MODELS[state.family];

        model.params.forEach((param, index) => {
            const input = paramInputs[index];
            const label = paramLabels[index];
            const valueEl = paramValues[index];
            const wrap = paramWraps[index];

            if (!input || !label || !valueEl || !wrap) {
                return;
            }

            wrap.style.display = '';
            label.innerHTML = `\\(${param.label}\\)`;
            input.min = String(param.min);
            input.max = String(param.max);
            input.step = String(param.step);
            input.value = String(param.value);
            valueEl.textContent = fmt(param.value);
        });

        for (let i = model.params.length; i < paramInputs.length; i += 1) {
            if (paramWraps[i]) {
                paramWraps[i].style.display = 'none';
            }
        }

        state.testedPoint = null;
        pointFeedback.className = 'mini-feedback';
        pointFeedback.textContent = '';
    }

    function readParams() {
        const model = GRAPH_MODELS[state.family];
        const params = {};
        model.params.forEach((param, index) => {
            const value = Number(paramInputs[index].value);
            params[param.key] = value;
            paramValues[index].textContent = fmt(value);
        });
        state.params = params;
    }

    function drawGraph() {
        const model = GRAPH_MODELS[state.family];
        drawGridAndAxes(plane);
        drawCurve(plane, x => model.evaluate(x, state.params), () => true, '#6366f1');

        if (state.testedPoint) {
            const { x, yInput, yTrue, isCorrect } = state.testedPoint;
            if (yInput >= plane.yMin && yInput <= plane.yMax) {
                drawPoint(plane, x, yInput, isCorrect ? '#10b981' : '#ef4444', 5);
            }
            if (!isCorrect && yTrue >= plane.yMin && yTrue <= plane.yMax) {
                drawPoint(plane, x, yTrue, '#f59e0b', 5);
            }
        }
    }

    function buildTableLatex(model, params) {
        const xs = [-2, -1, 0, 1, 2];
        const ys = xs.map(x => fmt(model.evaluate(x, params)));
        return `\\(\\begin{array}{c|ccccc}x&-2&-1&0&1&2\\\\\\hline f(x)&${ys.join('&')}\\end{array}\\)`;
    }

    function renderGraphLab() {
        const model = GRAPH_MODELS[state.family];
        readParams();

        formulaLatex.innerHTML = `\\(${model.formula(state.params)}\\)`;
        domainLatex.innerHTML = `\\(${model.domain(state.params)}\\)`;
        rangeLatex.innerHTML = `\\(${model.range(state.params)}\\)`;
        tableLatex.innerHTML = buildTableLatex(model, state.params);

        drawGraph();
        typeset(section);
    }

    function onPointCheck() {
        const x = Number(pointXInput.value);
        const y = Number(pointYInput.value);
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            alert('Zadejte prosím číselné hodnoty x a y.');
            return;
        }

        const model = GRAPH_MODELS[state.family];
        const yTrue = model.evaluate(x, state.params);
        const isCorrect = nearlyEqual(y, yTrue, 0.05);

        state.testedPoint = { x, yInput: y, yTrue, isCorrect };
        drawGraph();

        if (isCorrect) {
            pointFeedback.textContent = `Správně. Pro x=${fmt(x)} vychází y=${fmt(yTrue)}.`;
            pointFeedback.className = 'mini-feedback show correct';
        } else {
            pointFeedback.textContent = `Nesprávně. Pro x=${fmt(x)} je správná hodnota y=${fmt(yTrue)}.`;
            pointFeedback.className = 'mini-feedback show incorrect';
        }
        typeset(section);
    }

    familySelect.addEventListener('change', () => {
        configureForFamily();
        renderGraphLab();
    });

    paramInputs.forEach(input => {
        if (!input) {
            return;
        }
        input.addEventListener('input', () => {
            state.testedPoint = null;
            pointFeedback.className = 'mini-feedback';
            pointFeedback.textContent = '';
            renderGraphLab();
        });
    });

    pointCheckBtn.addEventListener('click', onPointCheck);

    configureForFamily();
    renderGraphLab();
}

function initMiniChecks() {
    const buttons = document.querySelectorAll('.mini-check-btn');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const group = button.dataset.group;
            const correct = button.dataset.correct;
            const feedback = document.getElementById(button.dataset.feedback);
            const selected = document.querySelector(`input[name="${group}"]:checked`);
            const options = document.querySelectorAll(`input[name="${group}"]`);

            if (!selected) {
                alert('Vyberte prosím jednu odpověď.');
                return;
            }

            const isCorrect = selected.value === correct;
            options.forEach(option => {
                option.disabled = true;
                if (option.parentElement) {
                    option.parentElement.classList.remove('correct', 'incorrect');
                }
            });
            button.disabled = true;

            selected.parentElement.classList.add(isCorrect ? 'correct' : 'incorrect');
            if (!isCorrect) {
                options.forEach(option => {
                    if (option.value === correct && option.parentElement) {
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
    const buttons = document.querySelectorAll('.btn-check');
    if (buttons.length === 0) {
        return;
    }

    const meta = {
        1: {
            correct: '\\(\\mathbb{R}\\setminus\\{-3\\}\\)',
            explanation: 'Jmenovatel \\(x+3\\) nesmí být nula.'
        },
        2: {
            correct: '\\(\\{(-1,2),(0,1),(1,0)\\}\\)',
            explanation: 'Pouze v této relaci má každé \\(x\\) právě jednu hodnotu \\(y\\).'
        },
        3: {
            correct: '\\([1,\\infty)\\)',
            explanation: '\\(x^2\\ge0\\), proto \\(x^2+1\\ge1\\).'
        },
        4: {
            correct: '\\(a=2\\)',
            explanation: 'Z bodu \\((2,5)\\): \\(5=2a+1\\Rightarrow a=2\\).'
        },
        5: {
            correct: '\\(1\\)',
            explanation: '\\(f(1)=|1-4|-2=3-2=1\\).'
        },
        6: {
            correct: 'Ne, protože \\(1-2<0\\).',
            explanation: 'Pod odmocninou musí být nezáporné číslo.'
        }
    };

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
                if (option.parentElement) {
                    option.parentElement.classList.remove('correct', 'incorrect');
                }
            });
            button.disabled = true;

            selected.parentElement.classList.add(isCorrect ? 'correct' : 'incorrect');
            if (!isCorrect) {
                options.forEach(option => {
                    if (option.value === button.dataset.correct && option.parentElement) {
                        option.parentElement.classList.add('correct');
                    }
                });
            }

            if (status) {
                status.textContent = isCorrect ? 'Správně' : 'Špatně';
                status.className = `exercise-status ${isCorrect ? 'correct' : 'incorrect'}`;
            }

            if (feedback && meta[id]) {
                feedback.innerHTML = isCorrect
                    ? `Správně. ${meta[id].explanation}`
                    : `Nesprávně. Správný výsledek je ${meta[id].correct}. ${meta[id].explanation}`;
                feedback.className = `exercise-feedback show ${isCorrect ? 'correct' : 'incorrect'}`;
                typeset(feedback);
            }

            const completed = Array.from(buttons).every(item => item.disabled);
            if (completed) {
                const completeBox = document.getElementById('lessonComplete');
                if (completeBox) {
                    completeBox.style.display = 'block';
                    typeset(completeBox);
                }
            }
        });
    });
}
