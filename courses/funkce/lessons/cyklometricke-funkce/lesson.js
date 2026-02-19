document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initNavbarScroll();
    initSinCosLab();
    initTanCotLab();
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

function radToDeg(value) {
    return (value * 180) / Math.PI;
}

function acot(value) {
    return Math.atan2(1, value);
}

function approxPiText(value) {
    const ratio = value / Math.PI;
    const known = [
        { value: -1, text: '-π' },
        { value: -3 / 4, text: '-3π/4' },
        { value: -2 / 3, text: '-2π/3' },
        { value: -1 / 2, text: '-π/2' },
        { value: -1 / 3, text: '-π/3' },
        { value: -1 / 4, text: '-π/4' },
        { value: -1 / 6, text: '-π/6' },
        { value: 0, text: '0' },
        { value: 1 / 6, text: 'π/6' },
        { value: 1 / 4, text: 'π/4' },
        { value: 1 / 3, text: 'π/3' },
        { value: 1 / 2, text: 'π/2' },
        { value: 2 / 3, text: '2π/3' },
        { value: 3 / 4, text: '3π/4' },
        { value: 5 / 6, text: '5π/6' },
        { value: 1, text: 'π' }
    ];

    for (const item of known) {
        if (Math.abs(ratio - item.value) < 0.0025) {
            return item.text;
        }
    }
    return null;
}

function fmtAngleRad(value) {
    return approxPiText(value) || fmtNumber(value, 5);
}

function fmtAngleDeg(value) {
    return `${fmtNumber(radToDeg(value), 2)}°`;
}

function initNavigation() {
    const order = [
        'arcussinus-a-arcuscosinus',
        'arcustangens-a-arcuscotangens',
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

function drawHorizontalLine(plane, y, color = 'rgba(239, 68, 68, 0.85)', dashed = true) {
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

function initSinCosLab() {
    const canvas = document.getElementById('invSinCosCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, { xMin: -1.15, xMax: 1.15, yMin: -1.75, yMax: 3.25 });
    const xSlider = document.getElementById('invSinCosX');

    const xValue = document.getElementById('invSinCosXValue');
    const asinRadOut = document.getElementById('invSinCosAsinRad');
    const asinDegOut = document.getElementById('invSinCosAsinDeg');
    const acosRadOut = document.getElementById('invSinCosAcosRad');
    const acosDegOut = document.getElementById('invSinCosAcosDeg');
    const sumOut = document.getElementById('invSinCosSum');
    const backSinOut = document.getElementById('invSinCosBackSin');
    const backCosOut = document.getElementById('invSinCosBackCos');
    const conclusionOut = document.getElementById('invSinCosConclusion');

    function render() {
        const x0 = Number(xSlider.value);
        const asin = Math.asin(x0);
        const acos = Math.acos(x0);
        const sum = asin + acos;

        setPlaneBounds(plane, { xMin: -1.15, xMax: 1.15, yMin: -1.75, yMax: 3.25 });
        drawGridAxes(plane, { xStep: 0.25, yStep: 0.5 });
        drawHorizontalLine(plane, Math.PI / 2, 'rgba(249, 115, 22, 0.8)');
        drawFunction(plane, x => Math.asin(x), x => x >= -1 && x <= 1, { color: '#6366f1', lineWidth: 2.8 });
        drawFunction(plane, x => Math.acos(x), x => x >= -1 && x <= 1, { color: '#f59e0b', lineWidth: 2.8 });
        drawVerticalLine(plane, x0, 'rgba(16, 185, 129, 0.8)');
        drawPoint(plane, x0, asin, '#10b981', 5);
        drawPoint(plane, x0, acos, '#f97316', 5);
        drawPoint(plane, -1, -Math.PI / 2, '#6366f1', 3.8);
        drawPoint(plane, 1, Math.PI / 2, '#6366f1', 3.8);
        drawPoint(plane, -1, Math.PI, '#f59e0b', 3.8);
        drawPoint(plane, 1, 0, '#f59e0b', 3.8);

        xValue.textContent = fmtNumber(x0, 2);
        asinRadOut.textContent = fmtAngleRad(asin);
        asinDegOut.textContent = fmtAngleDeg(asin);
        acosRadOut.textContent = fmtAngleRad(acos);
        acosDegOut.textContent = fmtAngleDeg(acos);
        sumOut.textContent = `${fmtAngleRad(sum)} = π/2`;
        backSinOut.textContent = fmtNumber(Math.sin(asin), 4);
        backCosOut.textContent = fmtNumber(Math.cos(acos), 4);

        conclusionOut.textContent = `Pro x0=${fmtNumber(x0, 2)} vychází arcsin(x0)=${fmtAngleRad(asin)} rad a arccos(x0)=${fmtAngleRad(acos)} rad. Součet je ${fmtNumber(sum, 5)}, tedy přesně π/2.`;
    }

    xSlider.addEventListener('input', render);
    render();
}

function initTanCotLab() {
    const canvas = document.getElementById('invTanCotCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, { xMin: -8, xMax: 8, yMin: -1.8, yMax: 3.3 });
    const xSlider = document.getElementById('invTanCotX');

    const xValue = document.getElementById('invTanCotXValue');
    const atanRadOut = document.getElementById('invTanCotAtanRad');
    const atanDegOut = document.getElementById('invTanCotAtanDeg');
    const acotRadOut = document.getElementById('invTanCotAcotRad');
    const acotDegOut = document.getElementById('invTanCotAcotDeg');
    const sumOut = document.getElementById('invTanCotSum');
    const dAtanOut = document.getElementById('invTanCotDAtan');
    const dAcotOut = document.getElementById('invTanCotDAcot');
    const conclusionOut = document.getElementById('invTanCotConclusion');

    function render() {
        const x0 = Number(xSlider.value);
        const atan = Math.atan(x0);
        const acotValue = acot(x0);
        const sum = atan + acotValue;
        const derivative = 1 / (1 + x0 ** 2);

        setPlaneBounds(plane, { xMin: -8, xMax: 8, yMin: -1.8, yMax: 3.3 });
        drawGridAxes(plane, { xStep: 1, yStep: 0.5 });
        drawHorizontalLine(plane, Math.PI / 2, 'rgba(249, 115, 22, 0.85)');
        drawHorizontalLine(plane, -Math.PI / 2, 'rgba(239, 68, 68, 0.8)');
        drawHorizontalLine(plane, 0, 'rgba(236, 72, 153, 0.8)');
        drawHorizontalLine(plane, Math.PI, 'rgba(236, 72, 153, 0.8)');
        drawFunction(plane, x => Math.atan(x), () => true, { color: '#6366f1', lineWidth: 2.8 });
        drawFunction(plane, x => acot(x), () => true, { color: '#f59e0b', lineWidth: 2.8 });
        drawVerticalLine(plane, x0, 'rgba(16, 185, 129, 0.8)');
        drawPoint(plane, x0, atan, '#10b981', 5);
        drawPoint(plane, x0, acotValue, '#f97316', 5);

        xValue.textContent = fmtNumber(x0, 1);
        atanRadOut.textContent = fmtAngleRad(atan);
        atanDegOut.textContent = fmtAngleDeg(atan);
        acotRadOut.textContent = fmtAngleRad(acotValue);
        acotDegOut.textContent = fmtAngleDeg(acotValue);
        sumOut.textContent = `${fmtAngleRad(sum)} = π/2`;
        dAtanOut.textContent = fmtNumber(derivative, 5);
        dAcotOut.textContent = fmtNumber(-derivative, 5);

        conclusionOut.textContent = `V bodě x0=${fmtNumber(x0, 1)} je arctan rostoucí se směrnicí ${fmtNumber(derivative, 4)} a arccot klesající se směrnicí ${fmtNumber(-derivative, 4)}. Součet hodnot zůstává ${fmtNumber(sum, 5)} = π/2.`;
    }

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
        1: 'Inverzní sinus je definován pouze pro hodnoty, kterých sinus může nabývat, tedy od -1 do 1.',
        2: 'Sinus úhlu π/6 je 1/2 a π/6 leží v hlavní větvi intervalu [-π/2, π/2].',
        3: 'Kosinus úhlu 2π/3 je -1/2 a 2π/3 patří do hlavní větve [0, π].',
        4: 'Pro každé x z intervalu [-1,1] platí identita arcsin x + arccos x = π/2.',
        5: 'Tangens na intervalu (-π/2, π/2) pokryje všechna reálná čísla, takže inverze má právě tento obor hodnot.',
        6: 'Úhel s tangens rovnou 1 v hlavní větvi je π/4.',
        7: 'Při zvolené větvi (0, π) je úhel s cotangens -1 roven 3π/4.',
        8: 'Z rovnice arctan x = -π/3 po aplikaci tangens dostaneme x = tan(-π/3) = -√3.'
    };

    const correctLabel = {
        1: '\\([-1,1]\\)',
        2: '\\(\\frac{\\pi}{6}\\)',
        3: '\\(\\frac{2\\pi}{3}\\)',
        4: '\\(\\frac{\\pi}{2}\\)',
        5: '\\(\\left(-\\frac{\\pi}{2},\\frac{\\pi}{2}\\right)\\)',
        6: '\\(\\frac{\\pi}{4}\\)',
        7: '\\(\\frac{3\\pi}{4}\\)',
        8: '\\(x=-\\sqrt3\\)'
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
