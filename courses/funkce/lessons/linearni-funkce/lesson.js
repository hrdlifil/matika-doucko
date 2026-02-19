document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initNavbarScroll();
    initLinearLab();
    initTwoPointLab();
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
        return value > 0 ? 'inf' : '-inf';
    }

    const rounded = Math.round(value * 10 ** digits) / 10 ** digits;
    if (isZero(rounded, 1e-8)) {
        return '0';
    }
    if (Math.abs(rounded - Math.round(rounded)) < 1e-8) {
        return String(Math.round(rounded));
    }
    return rounded.toFixed(digits).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
}

function buildLinearExpression(a, b, variable = 'x') {
    const aZero = isZero(a);
    const bZero = isZero(b);

    if (aZero) {
        return fmtNumber(b);
    }

    let slopeTerm = '';
    if (isZero(a - 1)) {
        slopeTerm = variable;
    } else if (isZero(a + 1)) {
        slopeTerm = `-${variable}`;
    } else {
        slopeTerm = `${fmtNumber(a)}${variable}`;
    }

    if (bZero) {
        return slopeTerm;
    }

    return b > 0
        ? `${slopeTerm} + ${fmtNumber(b)}`
        : `${slopeTerm} - ${fmtNumber(Math.abs(b))}`;
}

function buildPoint(x, y) {
    return `(${fmtNumber(x)}, ${fmtNumber(y)})`;
}

function initNavigation() {
    const order = [
        'linearni-funkce',
        'predpis-primky-ze-dvou-bodu',
        'posuny-grafu-linearni-funkce',
        'vlastnosti-linearni-funkce'
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
        if (py < -300 || py > plane.height + 300) {
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

function drawLineSegment(plane, x1, y1, x2, y2, color = 'rgba(255,255,255,0.35)', width = 1.5, dashed = false) {
    const ctx = plane.ctx;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dashed ? [8, 5] : []);
    ctx.beginPath();
    ctx.moveTo(toCanvasX(plane, x1), toCanvasY(plane, y1));
    ctx.lineTo(toCanvasX(plane, x2), toCanvasY(plane, y2));
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawVerticalGuide(plane, x, color = 'rgba(239,68,68,0.8)') {
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

function initLinearLab() {
    const canvas = document.getElementById('linearCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, { xMin: -8, xMax: 8, yMin: -8, yMax: 8 });

    const aSlider = document.getElementById('linA');
    const bSlider = document.getElementById('linB');
    const xSlider = document.getElementById('linX');

    const aValue = document.getElementById('linAValue');
    const bValue = document.getElementById('linBValue');
    const xValue = document.getElementById('linXValue');

    const formulaOut = document.getElementById('linFormula');
    const monotonicOut = document.getElementById('linMonotonic');
    const valueOut = document.getElementById('linValue');
    const zeroOut = document.getElementById('linZero');
    const rangeOut = document.getElementById('linRange');
    const conclusionOut = document.getElementById('linConclusion');

    function render() {
        const a = parseFloat(aSlider.value);
        const b = parseFloat(bSlider.value);
        const x0 = parseFloat(xSlider.value);
        const y0 = a * x0 + b;

        aValue.textContent = fmtNumber(a);
        bValue.textContent = fmtNumber(b);
        xValue.textContent = fmtNumber(x0);

        drawGridAxes(plane);
        drawFunction(plane, x => a * x + b, () => true, { color: '#6366f1', lineWidth: 2.8 });
        drawVerticalGuide(plane, x0, 'rgba(236,72,153,0.8)');
        drawPoint(plane, x0, y0, '#ec4899', 5);
        drawPoint(plane, 0, b, '#38bdf8', 5);

        if (!isZero(a)) {
            const root = -b / a;
            if (root >= plane.xMin - 0.2 && root <= plane.xMax + 0.2) {
                drawPoint(plane, root, 0, '#22c55e', 5);
            }
        }

        formulaOut.textContent = `f(x) = ${buildLinearExpression(a, b)}`;
        monotonicOut.textContent = a > EPS ? 'rostoucí' : (a < -EPS ? 'klesající' : 'konstantní');
        valueOut.textContent = `f(${fmtNumber(x0)}) = ${fmtNumber(y0)}`;

        if (!isZero(a)) {
            zeroOut.textContent = `x = ${fmtNumber(-b / a)}`;
            rangeOut.textContent = 'R';
        } else if (isZero(b)) {
            zeroOut.textContent = 'každé x z R';
            rangeOut.textContent = '{0}';
        } else {
            zeroOut.textContent = 'nemá nulový bod';
            rangeOut.textContent = `{${fmtNumber(b)}}`;
        }

        if (a > EPS) {
            conclusionOut.textContent = `Funkce roste: při zvýšení x o 1 vzroste y o ${fmtNumber(a)}. Průsečík s osou y je ${buildPoint(0, b)}.`;
        } else if (a < -EPS) {
            conclusionOut.textContent = `Funkce klesá: při zvýšení x o 1 klesne y o ${fmtNumber(Math.abs(a))}. Průsečík s osou y je ${buildPoint(0, b)}.`;
        } else {
            conclusionOut.textContent = `Jde o konstantní funkci y = ${fmtNumber(b)}. Všechny body grafu mají stejnou y-souřadnici.`;
        }
    }

    [aSlider, bSlider, xSlider].forEach(slider => slider.addEventListener('input', render));
    render();
}

function initTwoPointLab() {
    const canvas = document.getElementById('twoPointCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, { xMin: -7, xMax: 7, yMin: -7, yMax: 7 });

    const sliders = {
        x1: document.getElementById('tpX1'),
        y1: document.getElementById('tpY1'),
        x2: document.getElementById('tpX2'),
        y2: document.getElementById('tpY2')
    };

    const values = {
        x1: document.getElementById('tpX1Value'),
        y1: document.getElementById('tpY1Value'),
        x2: document.getElementById('tpX2Value'),
        y2: document.getElementById('tpY2Value')
    };

    const slopeOut = document.getElementById('tpSlopeStep');
    const interceptOut = document.getElementById('tpInterceptStep');
    const equationOut = document.getElementById('tpEquation');
    const conclusionOut = document.getElementById('tpConclusion');

    function render() {
        const x1 = parseFloat(sliders.x1.value);
        const y1 = parseFloat(sliders.y1.value);
        const x2 = parseFloat(sliders.x2.value);
        const y2 = parseFloat(sliders.y2.value);

        values.x1.textContent = fmtNumber(x1, 0);
        values.y1.textContent = fmtNumber(y1, 0);
        values.x2.textContent = fmtNumber(x2, 0);
        values.y2.textContent = fmtNumber(y2, 0);

        drawGridAxes(plane);

        drawPoint(plane, x1, y1, '#ef4444', 6);
        drawPoint(plane, x2, y2, '#f59e0b', 6);
        drawLabel(plane, 'A', x1, y1, '#ef4444');
        drawLabel(plane, 'B', x2, y2, '#f59e0b');
        drawLineSegment(plane, x1, y1, x2, y2, 'rgba(255,255,255,0.35)', 1.2, true);

        if (isZero(x1 - x2) && isZero(y1 - y2)) {
            slopeOut.textContent = 'a = nedefinováno (A = B)';
            interceptOut.textContent = 'b = nedefinováno';
            equationOut.textContent = 'nelze určit jednoznačnou přímku';
            conclusionOut.textContent = 'Body splývají. Jeden bod nestačí k určení jediné přímky.';
            return;
        }

        if (isZero(x1 - x2)) {
            drawLineSegment(plane, x1, plane.yMin, x1, plane.yMax, '#f97316', 2.5);
            slopeOut.textContent = `a = (${fmtNumber(y2, 0)} - ${fmtNumber(y1, 0)}) / (${fmtNumber(x2, 0)} - ${fmtNumber(x1, 0)}) = dělení nulou`;
            interceptOut.textContent = 'b se pro svislou přímku nepoužije';
            equationOut.textContent = `x = ${fmtNumber(x1, 0)}`;
            conclusionOut.textContent = 'Jde o svislou přímku. Není to graf funkce y = f(x), protože pro jedno x existuje více hodnot y.';
            return;
        }

        const a = (y2 - y1) / (x2 - x1);
        const b = y1 - a * x1;

        drawFunction(plane, x => a * x + b, () => true, { color: '#f97316', lineWidth: 2.8 });

        slopeOut.textContent = `a = (${fmtNumber(y2, 0)} - ${fmtNumber(y1, 0)}) / (${fmtNumber(x2, 0)} - ${fmtNumber(x1, 0)}) = ${fmtNumber(a)}`;
        interceptOut.textContent = `b = ${fmtNumber(y1, 0)} - ${fmtNumber(a)}·${fmtNumber(x1, 0)} = ${fmtNumber(b)}`;
        equationOut.textContent = `y = ${buildLinearExpression(a, b)}`;

        const checkA = isZero(a * x1 + b - y1, 1e-6);
        const checkB = isZero(a * x2 + b - y2, 1e-6);
        if (checkA && checkB) {
            conclusionOut.textContent = `Přímka y = ${buildLinearExpression(a, b)} prochází body A${buildPoint(x1, y1)} i B${buildPoint(x2, y2)}.`;
        } else {
            conclusionOut.textContent = 'Numericky došlo k drobné odchylce zaokrouhlením, výpočet je ale správný.';
        }
    }

    Object.values(sliders).forEach(slider => slider.addEventListener('input', render));
    render();
}

function initShiftLab() {
    const canvas = document.getElementById('shiftCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, { xMin: -8, xMax: 8, yMin: -8, yMax: 8 });

    const sliders = {
        a: document.getElementById('shA'),
        b: document.getElementById('shB'),
        h: document.getElementById('shH'),
        k: document.getElementById('shK')
    };

    const values = {
        a: document.getElementById('shAValue'),
        b: document.getElementById('shBValue'),
        h: document.getElementById('shHValue'),
        k: document.getElementById('shKValue')
    };

    const originalOut = document.getElementById('shOriginal');
    const shiftedOut = document.getElementById('shShifted');
    const slopeOut = document.getElementById('shSlope');
    const interceptOut = document.getElementById('shIntercept');
    const rootOut = document.getElementById('shRoot');
    const conclusionOut = document.getElementById('shConclusion');

    function render() {
        const a = parseFloat(sliders.a.value);
        const b = parseFloat(sliders.b.value);
        const h = parseFloat(sliders.h.value);
        const k = parseFloat(sliders.k.value);
        const shiftedB = b - a * h + k;

        values.a.textContent = fmtNumber(a);
        values.b.textContent = fmtNumber(b);
        values.h.textContent = fmtNumber(h);
        values.k.textContent = fmtNumber(k);

        drawGridAxes(plane);
        drawFunction(plane, x => a * x + b, () => true, { color: '#6366f1', lineWidth: 2.6 });
        drawFunction(plane, x => a * x + shiftedB, () => true, { color: '#10b981', lineWidth: 2.8 });
        drawPoint(plane, 0, b, '#38bdf8', 5);
        drawPoint(plane, 0, shiftedB, '#10b981', 5);

        originalOut.textContent = `f(x) = ${buildLinearExpression(a, b)}`;
        shiftedOut.textContent = `g(x) = ${buildLinearExpression(a, shiftedB)}`;
        slopeOut.textContent = `a = ${fmtNumber(a)} (beze změny)`;
        interceptOut.textContent = `g(0) = ${fmtNumber(shiftedB)}`;

        if (!isZero(a)) {
            const root = h - (b + k) / a;
            rootOut.textContent = `x = ${fmtNumber(root)}`;
            if (root >= plane.xMin - 0.2 && root <= plane.xMax + 0.2) {
                drawPoint(plane, root, 0, '#22c55e', 5);
            }
        } else if (isZero(b + k)) {
            rootOut.textContent = 'každé x z R';
        } else {
            rootOut.textContent = 'nemá nulový bod';
        }

        const horizontal = isZero(h)
            ? 'bez vodorovného posunu'
            : (h > 0 ? `o ${fmtNumber(h)} doprava` : `o ${fmtNumber(Math.abs(h))} doleva`);
        const vertical = isZero(k)
            ? 'bez svislého posunu'
            : (k > 0 ? `o ${fmtNumber(k)} nahoru` : `o ${fmtNumber(Math.abs(k))} dolů`);

        let note = `Graf g je posunutí grafu f: ${horizontal}, ${vertical}.`;
        if (isZero(a)) {
            note += ' U konstantní funkce vodorovný posun nemění předpis.';
        } else {
            note += ' Směrnice zůstává stejná, proto jsou přímky rovnoběžné.';
        }
        conclusionOut.textContent = note;
    }

    Object.values(sliders).forEach(slider => slider.addEventListener('input', render));
    render();
}

function signDescription(a, b) {
    if (!isZero(a)) {
        const root = -b / a;
        if (a > 0) {
            return `x > ${fmtNumber(root)}: kladná, x < ${fmtNumber(root)}: záporná`;
        }
        return `x < ${fmtNumber(root)}: kladná, x > ${fmtNumber(root)}: záporná`;
    }

    if (isZero(b)) {
        return 'pro všechna x je rovna 0';
    }
    return b > 0 ? 'kladná pro všechna x' : 'záporná pro všechna x';
}

function initPropertiesLab() {
    const canvas = document.getElementById('propertiesCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, { xMin: -8, xMax: 8, yMin: -8, yMax: 8 });

    const aSlider = document.getElementById('prA');
    const bSlider = document.getElementById('prB');
    const aValue = document.getElementById('prAValue');
    const bValue = document.getElementById('prBValue');

    const formulaOut = document.getElementById('prFormula');
    const domainOut = document.getElementById('prDomain');
    const rangeOut = document.getElementById('prRange');
    const monotonicOut = document.getElementById('prMonotonic');
    const injectiveOut = document.getElementById('prInjective');
    const parityOut = document.getElementById('prParity');
    const zeroOut = document.getElementById('prZero');
    const signOut = document.getElementById('prSign');
    const conclusionOut = document.getElementById('prConclusion');

    function render() {
        const a = parseFloat(aSlider.value);
        const b = parseFloat(bSlider.value);

        aValue.textContent = fmtNumber(a);
        bValue.textContent = fmtNumber(b);

        drawGridAxes(plane);
        drawFunction(plane, x => a * x + b, () => true, { color: '#6366f1', lineWidth: 2.8 });

        formulaOut.textContent = `f(x) = ${buildLinearExpression(a, b)}`;
        domainOut.textContent = 'R';
        rangeOut.textContent = isZero(a) ? `{${fmtNumber(b)}}` : 'R';

        if (a > EPS) {
            monotonicOut.textContent = 'striktně rostoucí';
        } else if (a < -EPS) {
            monotonicOut.textContent = 'striktně klesající';
        } else {
            monotonicOut.textContent = 'konstantní';
        }

        injectiveOut.textContent = isZero(a) ? 'ne' : 'ano';

        if (isZero(a) && isZero(b)) {
            parityOut.textContent = 'sudá i lichá';
        } else if (isZero(a)) {
            parityOut.textContent = 'sudá (není lichá)';
        } else if (isZero(b)) {
            parityOut.textContent = 'lichá (není sudá)';
        } else {
            parityOut.textContent = 'ani sudá, ani lichá';
        }

        if (!isZero(a)) {
            const root = -b / a;
            zeroOut.textContent = `x = ${fmtNumber(root)}`;
            if (root >= plane.xMin - 0.2 && root <= plane.xMax + 0.2) {
                drawPoint(plane, root, 0, '#22c55e', 5);
            }
        } else if (isZero(b)) {
            zeroOut.textContent = 'každé x z R';
        } else {
            zeroOut.textContent = 'nemá nulový bod';
        }

        signOut.textContent = signDescription(a, b);

        if (isZero(a)) {
            conclusionOut.textContent = `Konstantní funkce má obor hodnot {${fmtNumber(b)}} a není prostá (kromě triviálního omezení definičního oboru).`;
        } else {
            conclusionOut.textContent = `Lineární funkce se směrnicí ${fmtNumber(a)} je prostá a má obor hodnot celé R.`;
        }
    }

    [aSlider, bSlider].forEach(slider => slider.addEventListener('input', render));
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
        1: 'Nulový bod řeší rovnici \\(-3x+6=0\\), tedy \\(x=2\\).',
        2: 'Směrnice je \\(a=(-3-3)/(4-1)=-2\\) a \\(b=3-(-2)\\cdot1=5\\).',
        3: 'Nejprve \\(f(x-2)=x-3\\), potom \\(+3\\), tedy \\(g(x)=x\\).',
        4: 'Konstantní funkce \\(f(x)=-4\\) má jedinou hodnotu, takže \\(H(f)=\\{-4\\}\\).',
        5: 'Platí \\(2x-5>0\\Rightarrow x>2.5\\).',
        6: 'Současně sudá i lichá je jen nulová funkce \\(f(x)=0\\).'
    };

    const correctLabel = {
        1: '\\(x=2\\)',
        2: '\\(y=-2x+5\\)',
        3: '\\(g(x)=x\\)',
        4: '\\(H(f)=\\{-4\\}\\)',
        5: '\\(x>\\frac52\\)',
        6: '\\(f(x)=0\\)'
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
