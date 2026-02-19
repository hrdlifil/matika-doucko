document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initNavbarScroll();
    initMonotonicityLab();
    initParityLab();
    initExtremaLab();
    initPeriodicityLab();
    initMiniChecks();
    initExercises();
});

const EPS = 1e-9;
const TAU = Math.PI * 2;

function typeset(target) {
    if (!window.MathJax || typeof window.MathJax.typesetPromise !== 'function') {
        return;
    }
    const nodes = target ? [target] : undefined;
    window.MathJax.typesetPromise(nodes).catch(() => { });
}

function fmtNumber(value, digits = 2) {
    if (!Number.isFinite(value)) {
        return value > 0 ? '\\infty' : '-\\infty';
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

function isNearlyInteger(value, tolerance = 0.02) {
    return Math.abs(value - Math.round(value)) < tolerance;
}

function initNavigation() {
    const order = [
        'monotonnost-a-prosta-funkce',
        'sudost-a-lichost',
        'omezenost-a-extremy',
        'periodicita',
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
    const lineWidth = options.lineWidth !== undefined ? options.lineWidth : 2.8;
    const dashed = options.dashed !== undefined ? options.dashed : false;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash(dashed ? [8, 5] : []);

    let drawing = false;
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
        const valid = Number.isFinite(y) && y > plane.yMin - 5 && y < plane.yMax + 5;
        if (!valid) {
            if (drawing) {
                ctx.stroke();
                drawing = false;
            }
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
        }
    }

    if (drawing) {
        ctx.stroke();
    }

    ctx.setLineDash([]);
}

function drawPoint(plane, x, y, color, radius = 5) {
    const ctx = plane.ctx;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(toCanvasX(plane, x), toCanvasY(plane, y), radius, 0, Math.PI * 2);
    ctx.fill();
}

function drawHorizontalLine(plane, y, color = 'rgba(245, 158, 11, 0.8)') {
    const ctx = plane.ctx;
    const py = toCanvasY(plane, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(plane.width, py);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawVerticalLine(plane, x, color = 'rgba(239, 68, 68, 0.8)') {
    const ctx = plane.ctx;
    const px = toCanvasX(plane, x);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, plane.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function approximateHorizontalIntersections(evaluate, isDefined, xMin, xMax, yTarget) {
    const samples = 2600;
    const tol = 1e-3;
    const roots = [];
    let prevValid = false;
    let prevX = xMin;
    let prevValue = 0;

    for (let i = 0; i <= samples; i += 1) {
        const x = xMin + ((xMax - xMin) * i) / samples;
        if (!isDefined(x)) {
            prevValid = false;
            continue;
        }

        const y = evaluate(x);
        if (!Number.isFinite(y)) {
            prevValid = false;
            continue;
        }

        const value = y - yTarget;
        if (Math.abs(value) < tol) {
            roots.push(x);
        }

        if (prevValid && prevValue * value < 0) {
            const ratio = prevValue / (prevValue - value);
            roots.push(prevX + (x - prevX) * ratio);
        }

        prevValid = true;
        prevX = x;
        prevValue = value;
    }

    roots.sort((a, b) => a - b);
    const unique = [];
    const minGap = (xMax - xMin) / 120;
    roots.forEach(root => {
        if (unique.length === 0 || Math.abs(root - unique[unique.length - 1]) > minGap) {
            unique.push(root);
        }
    });
    return unique;
}

const MONO_SCENARIOS = {
    linear_all: {
        formula: 'f(x)=2x-1',
        intervalLatex: '\\mathbb{R}',
        xMin: -6,
        xMax: 6,
        yMin: -8,
        yMax: 8,
        ySliderMin: -7,
        ySliderMax: 7,
        evaluate: x => 2 * x - 1,
        isDefined: () => true,
        monotonicity: 'striktně rostoucí',
        injective: true,
        detail: 'Striktní monotónnost na intervalu znamená prostotu.'
    },
    quadratic_all: {
        formula: 'f(x)=x^2',
        intervalLatex: '\\mathbb{R}',
        xMin: -6,
        xMax: 6,
        yMin: -1,
        yMax: 16,
        ySliderMin: -1,
        ySliderMax: 15,
        evaluate: x => x * x,
        isDefined: () => true,
        monotonicity: 'není monotónní na \\(\\mathbb{R}\\)',
        injective: false,
        detail: 'Na \\((-\\infty,0]\\) klesá a na \\([0,\\infty)\\) roste, proto není prostá.'
    },
    quadratic_half: {
        formula: 'f(x)=x^2',
        intervalLatex: '[0,\\infty)',
        xMin: -1,
        xMax: 6,
        yMin: -1,
        yMax: 16,
        ySliderMin: -1,
        ySliderMax: 15,
        evaluate: x => x * x,
        isDefined: x => x >= 0,
        monotonicity: 'striktně rostoucí na \\([0,\\infty)\\)',
        injective: true,
        detail: 'Po omezení definičního oboru na \\([0,\\infty)\\) je funkce prostá.',
        maskedLeft: true
    },
    absolute_all: {
        formula: 'f(x)=|x|',
        intervalLatex: '\\mathbb{R}',
        xMin: -6,
        xMax: 6,
        yMin: -1,
        yMax: 7,
        ySliderMin: -1,
        ySliderMax: 6,
        evaluate: x => Math.abs(x),
        isDefined: () => true,
        monotonicity: 'není monotónní na \\(\\mathbb{R}\\)',
        injective: false,
        detail: 'Například \\(f(-2)=f(2)=2\\), takže funkce není prostá.'
    },
    constant_all: {
        formula: 'f(x)=2',
        intervalLatex: '\\mathbb{R}',
        xMin: -6,
        xMax: 6,
        yMin: -1,
        yMax: 5,
        ySliderMin: -1,
        ySliderMax: 4,
        evaluate: () => 2,
        isDefined: () => true,
        monotonicity: 'neklesající i nerostoucí (konstantní)',
        injective: false,
        detail: 'Konstantní funkce je monotónní v neostrém smyslu, ale není prostá.'
    }
};

function initMonotonicityLab() {
    const section = document.getElementById('monotonnost-a-prosta-funkce');
    const canvas = document.getElementById('monoCanvas');
    if (!section || !canvas) {
        return;
    }

    const plane = createPlane(canvas);
    const scenarioSelect = document.getElementById('monoScenario');
    const ySlider = document.getElementById('monoY');
    const yValue = document.getElementById('monoYValue');
    const formulaOut = document.getElementById('monoFormula');
    const intervalOut = document.getElementById('monoInterval');
    const classOut = document.getElementById('monoClass');
    const injectiveOut = document.getElementById('monoInjective');
    const intersectionsOut = document.getElementById('monoIntersections');
    const verdictOut = document.getElementById('monoVerdict');

    function applyScenarioBounds(scenario) {
        ySlider.min = String(scenario.ySliderMin);
        ySlider.max = String(scenario.ySliderMax);
        ySlider.step = '0.1';
        ySlider.value = String(clamp(Number(ySlider.value), scenario.ySliderMin, scenario.ySliderMax));
    }

    function render() {
        const scenario = MONO_SCENARIOS[scenarioSelect.value];
        const yLine = Number(ySlider.value);
        setPlaneBounds(plane, scenario);
        drawGridAxes(plane);

        if (scenario.maskedLeft) {
            const ctx = plane.ctx;
            const boundary = toCanvasX(plane, 0);
            ctx.fillStyle = 'rgba(239, 68, 68, 0.10)';
            ctx.fillRect(0, 0, boundary, plane.height);
        }

        drawFunction(plane, scenario.evaluate, scenario.isDefined, { color: '#6366f1' });
        drawHorizontalLine(plane, yLine);

        const intersections = approximateHorizontalIntersections(
            scenario.evaluate,
            scenario.isDefined,
            scenario.xMin,
            scenario.xMax,
            yLine
        );

        intersections.forEach(x => {
            const y = scenario.evaluate(x);
            drawPoint(plane, x, y, '#f59e0b', 4);
        });

        yValue.textContent = fmtNumber(yLine, 1);
        formulaOut.innerHTML = `\\(${scenario.formula}\\)`;
        intervalOut.innerHTML = `\\(${scenario.intervalLatex}\\)`;
        classOut.innerHTML = scenario.monotonicity;
        injectiveOut.textContent = scenario.injective ? 'ano' : 'ne';
        intersectionsOut.textContent = String(intersections.length);

        let verdict = scenario.detail;
        if (intersections.length > 1) {
            verdict += ' Pro zvolenou přímku y=c vidíme více průniků, takže funkce zde nemůže být prostá.';
        } else if (!scenario.injective) {
            verdict += ' Jediný průnik pro konkrétní y=c ještě prostotu nedokazuje.';
        }
        verdictOut.textContent = verdict;

        typeset(section);
    }

    scenarioSelect.addEventListener('change', () => {
        applyScenarioBounds(MONO_SCENARIOS[scenarioSelect.value]);
        render();
    });
    ySlider.addEventListener('input', render);

    applyScenarioBounds(MONO_SCENARIOS[scenarioSelect.value]);
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
        1: 'Lineární funkce s kladným sklonem je na \\(\\mathbb{R}\\) striktně rostoucí, a proto prostá.',
        2: 'Konstantní funkce je neklesající i nerostoucí, ale pro různá x vrací stejnou hodnotu.',
        3: '\\(f(-x)=(-x)^3+(-x)=-(x^3+x)=-f(x)\\), tedy jde o lichou funkci.',
        4: '\\(0<f(x)=\\frac{1}{1+x^2}\\le 1\\), proto je funkce omezená shora i zdola.',
        5: 'Vrchol paraboly je v \\(x=2\\), kde \\(f(2)=-3\\), to je minimum na celém intervalu.',
        6: 'Pro \\(\\cos(kx)\\) platí \\(T=\\frac{2\\pi}{|k|}\\), tedy pro \\(k=4\\) je \\(T=\\frac{\\pi}{2}\\).',
        7: 'Tangens má základní periodu \\(\\pi\\).',
        8: 'Polynom \\(x^2\\) není periodický: pro žádné \\(T>0\\) neplatí \\((x+T)^2=x^2\\) pro všechna x.'
    };

    const correctLatex = {
        1: '\\(f(x)=2x-5\\)',
        2: 'neklesající, ale ne prostá',
        3: 'Lichá',
        4: 'omezená shora i zdola',
        5: '\\(-3\\) v \\(x=2\\)',
        6: '\\(\\frac{\\pi}{2}\\)',
        7: '\\(\\tan x\\)',
        8: 'Ne, není periodická'
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
                status.textContent = isCorrect ? '✓ Správně' : '✗ Špatně';
                status.className = `exercise-status ${isCorrect ? 'correct' : 'incorrect'}`;
            }

            if (feedback) {
                feedback.innerHTML = isCorrect
                    ? `Správně. ${explanation[id]}`
                    : `Nesprávně. Správná odpověď je ${correctLatex[id]}. ${explanation[id]}`;
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
const PERIOD_SCENARIOS = {
    sin: {
        formula: k => `f(x)=\\sin(${fmtKLatex(k)}x)`,
        usesK: true,
        periodic: true,
        fundamental: k => TAU / Math.abs(k),
        anyPositivePeriod: false,
        bounds: { xMin: -TAU, xMax: TAU, yMin: -1.6, yMax: 1.6 },
        evaluate: (x, k) => Math.sin(k * x),
        isDefined: () => true
    },
    cos: {
        formula: k => `f(x)=\\cos(${fmtKLatex(k)}x)`,
        usesK: true,
        periodic: true,
        fundamental: k => TAU / Math.abs(k),
        anyPositivePeriod: false,
        bounds: { xMin: -TAU, xMax: TAU, yMin: -1.6, yMax: 1.6 },
        evaluate: (x, k) => Math.cos(k * x),
        isDefined: () => true
    },
    tan: {
        formula: k => `f(x)=\\tan(${fmtKLatex(k)}x)`,
        usesK: true,
        periodic: true,
        fundamental: k => Math.PI / Math.abs(k),
        anyPositivePeriod: false,
        bounds: { xMin: -1.4 * Math.PI, xMax: 1.4 * Math.PI, yMin: -4, yMax: 4 },
        evaluate: (x, k) => Math.tan(k * x),
        isDefined: (x, k) => Math.abs(Math.cos(k * x)) > 0.08
    },
    square: {
        formula: () => 'f(x)=x^2',
        usesK: false,
        periodic: false,
        fundamental: null,
        anyPositivePeriod: false,
        bounds: { xMin: -3, xMax: 3, yMin: -1, yMax: 10 },
        evaluate: x => x * x,
        isDefined: () => true
    },
    constant: {
        formula: () => 'f(x)=3',
        usesK: false,
        periodic: true,
        fundamental: null,
        anyPositivePeriod: true,
        bounds: { xMin: -6, xMax: 6, yMin: -1, yMax: 5 },
        evaluate: () => 3,
        isDefined: () => true
    }
};

function fmtKLatex(k) {
    if (Math.abs(k - 1) < EPS) {
        return '';
    }
    return fmtNumber(k, 2);
}

function estimatePeriodDifference(scenario, T, k) {
    const samples = 1600;
    const xMin = scenario.bounds.xMin;
    const xMax = scenario.bounds.xMax;
    let maxDiff = 0;
    let count = 0;

    for (let i = 0; i <= samples; i += 1) {
        const x = xMin + ((xMax - xMin) * i) / samples;
        if (!scenario.isDefined(x, k) || !scenario.isDefined(x + T, k)) {
            continue;
        }
        const y1 = scenario.evaluate(x, k);
        const y2 = scenario.evaluate(x + T, k);
        if (!Number.isFinite(y1) || !Number.isFinite(y2)) {
            continue;
        }
        const diff = Math.abs(y2 - y1);
        if (diff > maxDiff) {
            maxDiff = diff;
        }
        count += 1;
    }

    return count > 0 ? maxDiff : NaN;
}

function testedPeriodHolds(scenario, T, k) {
    if (!scenario.periodic || T <= 0) {
        return false;
    }
    if (scenario.anyPositivePeriod) {
        return true;
    }
    const t0 = scenario.fundamental(k);
    return isNearlyInteger(T / t0, 0.03);
}

function initPeriodicityLab() {
    const section = document.getElementById('periodicita');
    const canvas = document.getElementById('periodCanvas');
    if (!section || !canvas) {
        return;
    }

    const plane = createPlane(canvas);
    const scenarioSelect = document.getElementById('periodScenario');
    const kWrap = document.getElementById('periodKWrap');
    const kSlider = document.getElementById('periodK');
    const kValue = document.getElementById('periodKValue');
    const tSlider = document.getElementById('periodT');
    const tValue = document.getElementById('periodTValue');
    const formulaOut = document.getElementById('periodFormula');
    const fundamentalOut = document.getElementById('periodFundamental');
    const diffOut = document.getElementById('periodDiff');
    const verdictOut = document.getElementById('periodVerdict');

    function render() {
        const scenario = PERIOD_SCENARIOS[scenarioSelect.value];
        const k = Number(kSlider.value);
        const Ttest = Number(tSlider.value);
        const diff = estimatePeriodDifference(scenario, Ttest, k);
        const isPeriod = testedPeriodHolds(scenario, Ttest, k);

        setPlaneBounds(plane, scenario.bounds);
        drawGridAxes(plane, { xStep: 1, yStep: 1 });
        drawFunction(
            plane,
            x => scenario.evaluate(x, k),
            x => scenario.isDefined(x, k),
            { color: '#6366f1', lineWidth: 2.7 }
        );
        drawFunction(
            plane,
            x => scenario.evaluate(x + Ttest, k),
            x => scenario.isDefined(x + Ttest, k),
            { color: '#f59e0b', dashed: true, lineWidth: 2.2 }
        );

        kWrap.style.display = scenario.usesK ? '' : 'none';
        kValue.textContent = fmtNumber(k, 2);
        tValue.textContent = fmtNumber(Ttest, 2);
        formulaOut.innerHTML = `\\(${scenario.formula(k)}\\)`;

        if (!scenario.periodic) {
            fundamentalOut.textContent = 'neexistuje (funkce není periodická)';
        } else if (scenario.anyPositivePeriod) {
            fundamentalOut.textContent = 'každé T>0 je perioda, základní perioda neexistuje';
        } else {
            fundamentalOut.innerHTML = `\\(T_0=${fmtNumber(scenario.fundamental(k), 4)}\\)`;
        }

        diffOut.innerHTML = Number.isFinite(diff) ? `\\(${fmtNumber(diff, 4)}\\)` : '—';

        if (!scenario.periodic) {
            verdictOut.textContent = 'Ne. Funkce není periodická, žádné T>0 rovnici f(x+T)=f(x) nesplní pro všechna x.';
        } else if (isPeriod) {
            verdictOut.textContent = 'Ano. Zvolená hodnota T je perioda této funkce.';
        } else {
            verdictOut.textContent = 'Ne. Zvolená hodnota T není perioda (graf se po posunu přesně nekryje).';
        }

        typeset(section);
    }

    scenarioSelect.addEventListener('change', render);
    kSlider.addEventListener('input', render);
    tSlider.addEventListener('input', render);
    render();
}

const EXTREMA_SCENARIOS = {
    quad_closed: {
        formula: 'f(x)=x^2-4x+1',
        domainLatex: '[-1,5]',
        bounds: { xMin: -2, xMax: 6, yMin: -5, yMax: 8 },
        interval: [-1, 5],
        evaluate: x => x * x - 4 * x + 1,
        absMax: { exists: true, label: '\\(6\\) v \\(x=-1\\) a \\(x=5\\)', points: [[-1, 6], [5, 6]] },
        absMin: { exists: true, label: '\\(-3\\) v \\(x=2\\)', points: [[2, -3]] },
        boundedText: 'Na intervalu \\([-1,5]\\) je funkce omezená shora i zdola.'
    },
    sin_closed: {
        formula: 'f(x)=\\sin x',
        domainLatex: '[0,2\\pi]',
        bounds: { xMin: -0.5, xMax: TAU + 0.5, yMin: -1.6, yMax: 1.6 },
        interval: [0, TAU],
        evaluate: x => Math.sin(x),
        absMax: { exists: true, label: '\\(1\\) v \\(x=\\frac{\\pi}{2}\\)', points: [[Math.PI / 2, 1]] },
        absMin: { exists: true, label: '\\(-1\\) v \\(x=\\frac{3\\pi}{2}\\)', points: [[1.5 * Math.PI, -1]] },
        boundedText: 'Sínus je na každém uzavřeném intervalu omezený.'
    },
    reciprocal_closed: {
        formula: 'f(x)=\\frac{1}{x+1}',
        domainLatex: '[0,4]',
        bounds: { xMin: -0.5, xMax: 4.5, yMin: -0.1, yMax: 1.2 },
        interval: [0, 4],
        evaluate: x => 1 / (x + 1),
        absMax: { exists: true, label: '\\(1\\) v \\(x=0\\)', points: [[0, 1]] },
        absMin: { exists: true, label: '\\(\\frac{1}{5}=0.2\\) v \\(x=4\\)', points: [[4, 0.2]] },
        boundedText: 'Na uzavřeném intervalu \\([0,4]\\) je funkce omezená.'
    },
    cubic_all: {
        formula: 'f(x)=x^3',
        domainLatex: '\\mathbb{R}',
        bounds: { xMin: -3.2, xMax: 3.2, yMin: -15, yMax: 15 },
        interval: null,
        evaluate: x => x * x * x,
        absMax: { exists: false, label: 'neexistuje na \\(\\mathbb{R}\\)', points: [] },
        absMin: { exists: false, label: 'neexistuje na \\(\\mathbb{R}\\)', points: [] },
        boundedText: 'Funkce není omezená ani shora, ani zdola na \\(\\mathbb{R}\\).'
    }
};

function initExtremaLab() {
    const section = document.getElementById('omezenost-a-extremy');
    const canvas = document.getElementById('extremaCanvas');
    if (!section || !canvas) {
        return;
    }

    const plane = createPlane(canvas);
    const scenarioSelect = document.getElementById('extremaScenario');
    const xSlider = document.getElementById('extremaX');
    const xValue = document.getElementById('extremaXValue');
    const formulaOut = document.getElementById('extremaFormula');
    const domainOut = document.getElementById('extremaDomain');
    const fxOut = document.getElementById('extremaFx');
    const maxOut = document.getElementById('extremaMax');
    const minOut = document.getElementById('extremaMin');
    const boundedOut = document.getElementById('extremaBounded');

    function setupSlider(scenario) {
        if (scenario.interval) {
            xSlider.min = String(scenario.interval[0]);
            xSlider.max = String(scenario.interval[1]);
            xSlider.step = '0.01';
            xSlider.value = String(clamp(Number(xSlider.value), scenario.interval[0], scenario.interval[1]));
        } else {
            xSlider.min = '-3';
            xSlider.max = '3';
            xSlider.step = '0.02';
            xSlider.value = String(clamp(Number(xSlider.value), -3, 3));
        }
    }

    function drawIntervalMask(scenario) {
        if (!scenario.interval) {
            return;
        }

        const [a, b] = scenario.interval;
        const ctx = plane.ctx;
        const leftPx = toCanvasX(plane, a);
        const rightPx = toCanvasX(plane, b);

        ctx.fillStyle = 'rgba(239, 68, 68, 0.10)';
        ctx.fillRect(0, 0, leftPx, plane.height);
        ctx.fillRect(rightPx, 0, plane.width - rightPx, plane.height);
        drawVerticalLine(plane, a, 'rgba(239, 68, 68, 0.7)');
        drawVerticalLine(plane, b, 'rgba(239, 68, 68, 0.7)');
    }

    function render() {
        const scenario = EXTREMA_SCENARIOS[scenarioSelect.value];
        const x0 = Number(xSlider.value);
        const y0 = scenario.evaluate(x0);

        setPlaneBounds(plane, scenario.bounds);
        drawGridAxes(plane, { xStep: scenario.interval ? 1 : 0.5, yStep: 1 });
        drawIntervalMask(scenario);

        const isDefined = scenario.interval
            ? x => x >= scenario.interval[0] - EPS && x <= scenario.interval[1] + EPS
            : () => true;
        drawFunction(plane, scenario.evaluate, isDefined, { color: '#6366f1' });

        scenario.absMax.points.forEach(([x, y]) => drawPoint(plane, x, y, '#10b981', 5));
        scenario.absMin.points.forEach(([x, y]) => drawPoint(plane, x, y, '#f59e0b', 5));
        drawPoint(plane, x0, y0, '#ef4444', 5);

        const nearMax = scenario.absMax.points.some(([x]) => Math.abs(x - x0) < 0.03);
        const nearMin = scenario.absMin.points.some(([x]) => Math.abs(x - x0) < 0.03);

        xValue.textContent = fmtNumber(x0, 2);
        formulaOut.innerHTML = `\\(${scenario.formula}\\)`;
        domainOut.innerHTML = `\\(${scenario.domainLatex}\\)`;
        fxOut.innerHTML = `\\(${fmtNumber(y0, 3)}\\)`;
        maxOut.innerHTML = scenario.absMax.label;
        minOut.innerHTML = scenario.absMin.label;

        let summary = scenario.boundedText;
        if (nearMax) {
            summary += ' Zvolený bod odpovídá absolutnímu maximu.';
        } else if (nearMin) {
            summary += ' Zvolený bod odpovídá absolutnímu minimu.';
        }
        boundedOut.textContent = summary;

        typeset(section);
    }

    scenarioSelect.addEventListener('change', () => {
        setupSlider(EXTREMA_SCENARIOS[scenarioSelect.value]);
        render();
    });
    xSlider.addEventListener('input', render);

    setupSlider(EXTREMA_SCENARIOS[scenarioSelect.value]);
    render();
}

const PARITY_SCENARIOS = {
    even_square: {
        formula: 'f(x)=x^2',
        parity: 'sudá',
        evaluate: x => x * x,
        xMin: -4,
        xMax: 4,
        yMin: -2,
        yMax: 16
    },
    odd_cubic: {
        formula: 'f(x)=x^3',
        parity: 'lichá',
        evaluate: x => x * x * x,
        xMin: -3,
        xMax: 3,
        yMin: -14,
        yMax: 14
    },
    neither_mix: {
        formula: 'f(x)=x^2+x',
        parity: 'ani sudá, ani lichá',
        evaluate: x => x * x + x,
        xMin: -4,
        xMax: 4,
        yMin: -4,
        yMax: 20
    },
    odd_sine: {
        formula: 'f(x)=\\sin x',
        parity: 'lichá',
        evaluate: x => Math.sin(x),
        xMin: -TAU,
        xMax: TAU,
        yMin: -1.6,
        yMax: 1.6
    },
    even_cos: {
        formula: 'f(x)=\\cos x',
        parity: 'sudá',
        evaluate: x => Math.cos(x),
        xMin: -TAU,
        xMax: TAU,
        yMin: -1.6,
        yMax: 1.6
    },
    even_abs: {
        formula: 'f(x)=|x|',
        parity: 'sudá',
        evaluate: x => Math.abs(x),
        xMin: -4,
        xMax: 4,
        yMin: -1,
        yMax: 5
    }
};

function initParityLab() {
    const section = document.getElementById('sudost-a-lichost');
    const canvas = document.getElementById('parityCanvas');
    if (!section || !canvas) {
        return;
    }

    const plane = createPlane(canvas);
    const scenarioSelect = document.getElementById('parityScenario');
    const xSlider = document.getElementById('parityX');
    const xValue = document.getElementById('parityXValue');
    const formulaOut = document.getElementById('parityFormula');
    const fxOut = document.getElementById('parityFx');
    const fNegOut = document.getElementById('parityFnegx');
    const evenDiffOut = document.getElementById('parityEvenDiff');
    const oddDiffOut = document.getElementById('parityOddDiff');
    const verdictOut = document.getElementById('parityVerdict');

    function render() {
        const scenario = PARITY_SCENARIOS[scenarioSelect.value];
        const x0 = Number(xSlider.value);
        const fx = scenario.evaluate(x0);
        const fNeg = scenario.evaluate(-x0);
        const evenDiff = fNeg - fx;
        const oddDiff = fNeg + fx;

        setPlaneBounds(plane, scenario);
        drawGridAxes(plane, {
            xStep: scenario.xMax - scenario.xMin > 8 ? Math.PI / 2 : 1,
            yStep: scenario.yMax - scenario.yMin > 10 ? 2 : 1
        });
        drawFunction(plane, scenario.evaluate, () => true, { color: '#6366f1' });

        drawPoint(plane, x0, fx, '#10b981', 5);
        drawPoint(plane, -x0, fNeg, '#f59e0b', 5);

        xValue.textContent = fmtNumber(x0, 1);
        formulaOut.innerHTML = `\\(${scenario.formula}\\)`;
        fxOut.innerHTML = `\\(${fmtNumber(fx)}\\)`;
        fNegOut.innerHTML = `\\(${fmtNumber(fNeg)}\\)`;
        evenDiffOut.innerHTML = `\\(${fmtNumber(evenDiff)}\\)`;
        oddDiffOut.innerHTML = `\\(${fmtNumber(oddDiff)}\\)`;

        let localCheck = '';
        if (Math.abs(evenDiff) < 0.02) {
            localCheck = 'V tomto bodě vychází f(-x0)=f(x0).';
        } else if (Math.abs(oddDiff) < 0.02) {
            localCheck = 'V tomto bodě vychází f(-x0)=-f(x0).';
        } else {
            localCheck = 'V tomto bodě neplatí ani sudá, ani lichá symetrie.';
        }
        verdictOut.innerHTML = `Funkce je <strong>${scenario.parity}</strong>. ${localCheck}`;

        typeset(section);
    }

    scenarioSelect.addEventListener('change', render);
    xSlider.addEventListener('input', render);
    render();
}
