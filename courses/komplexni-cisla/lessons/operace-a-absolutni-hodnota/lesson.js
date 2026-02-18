document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initNavbarScroll();
    initAddSubDemo();
    initMultiplicationDemo();
    initDivisionDemo();
    initModulusDemo();
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
        'scitani-a-odcitani-komplexnich-cisel',
        'nasobeni-komplexnich-cisel',
        'deleni-komplexnich-cisel',
        'absolutni-hodnota-komplexniho-cisla'
    ];
    const sections = Array.from(document.querySelectorAll('.lesson-section'));
    const links = Array.from(document.querySelectorAll('.sidebar-link'));
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

        sections.forEach(section => section.classList.toggle('active', section.id === sectionId));
        links.forEach(link => link.classList.toggle('active', link.dataset.section === sectionId));
        updateProgress(sectionId);
        window.history.replaceState(null, '', `#${sectionId}`);

        window.scrollTo({
            top: 0,
            behavior: smooth ? 'smooth' : 'auto'
        });
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

    const initial = window.location.hash.replace('#', '');
    showSection(order.includes(initial) ? initial : order[0], false);
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

function createPlane(canvas, xRange = 8, yRange = 6) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scaleX = width / (2 * xRange);
    const scaleY = height / (2 * yRange);

    return { ctx, width, height, centerX, centerY, scaleX, scaleY, xRange, yRange };
}

function toCanvasX(x, plane) {
    return plane.centerX + x * plane.scaleX;
}

function toCanvasY(y, plane) {
    return plane.centerY - y * plane.scaleY;
}

function toMathX(canvasX, plane) {
    return (canvasX - plane.centerX) / plane.scaleX;
}

function toMathY(canvasY, plane) {
    return (plane.centerY - canvasY) / plane.scaleY;
}

function drawPlane(plane, withAxisLabels = true) {
    const { ctx, width, height, xRange, yRange } = plane;
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;

    for (let x = -Math.floor(xRange); x <= Math.floor(xRange); x += 1) {
        const px = toCanvasX(x, plane);
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, height);
        ctx.stroke();
    }

    for (let y = -Math.floor(yRange); y <= Math.floor(yRange); y += 1) {
        const py = toCanvasY(y, plane);
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(width, py);
        ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.36)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, plane.centerY);
    ctx.lineTo(width, plane.centerY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(plane.centerX, 0);
    ctx.lineTo(plane.centerX, height);
    ctx.stroke();

    if (!withAxisLabels) {
        return;
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('Re', width - 26, plane.centerY - 8);
    ctx.fillText('Im', plane.centerX + 8, 14);
}

function drawVector(plane, fromRe, fromIm, toRe, toIm, color, label, width = 3, dashed = false) {
    const { ctx } = plane;
    const fromX = toCanvasX(fromRe, plane);
    const fromY = toCanvasY(fromIm, plane);
    const toX = toCanvasX(toRe, plane);
    const toY = toCanvasY(toIm, plane);

    ctx.save();
    if (dashed) {
        ctx.setLineDash([6, 5]);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    ctx.restore();

    const angle = Math.atan2(toY - fromY, toX - fromX);
    const head = 8;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - head * Math.cos(angle - Math.PI / 6), toY - head * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - head * Math.cos(angle + Math.PI / 6), toY - head * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    if (label) {
        ctx.fillStyle = color;
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText(label, toX + 8, toY - 8);
    }
}

function drawPoint(plane, re, im, color, label) {
    const { ctx } = plane;
    const px = toCanvasX(re, plane);
    const py = toCanvasY(im, plane);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();

    if (label) {
        ctx.fillStyle = color;
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText(label, px + 8, py - 8);
    }
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function formatNumber(value, digits = 3) {
    if (!Number.isFinite(value)) {
        return '—';
    }

    const rounded = Math.round(value * 10 ** digits) / 10 ** digits;
    if (Math.abs(rounded) < EPS) {
        return '0';
    }

    if (Number.isInteger(rounded)) {
        return String(rounded);
    }

    return rounded.toFixed(digits).replace(/\.?0+$/, '');
}

function complexString(re, im, digits = 3) {
    const a = formatNumber(re, digits);
    const b = formatNumber(Math.abs(im), digits);
    const sign = im >= 0 ? '+' : '-';
    return `${a} ${sign} ${b}i`;
}

function normalizeDegrees(deg) {
    let value = deg % 360;
    if (value <= -180) {
        value += 360;
    }
    if (value > 180) {
        value -= 360;
    }
    return value;
}

function parseSimpleNumber(raw) {
    const token = String(raw || '').trim().replace(',', '.');
    if (!token) {
        return null;
    }
    if (token === '+') {
        return 1;
    }
    if (token === '-') {
        return -1;
    }

    const fractionMatch = token.match(/^([+-]?\d+(?:\.\d+)?)\/([+-]?\d+(?:\.\d+)?)$/);
    if (fractionMatch) {
        const numerator = Number(fractionMatch[1]);
        const denominator = Number(fractionMatch[2]);
        if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || Math.abs(denominator) < EPS) {
            return null;
        }
        return numerator / denominator;
    }

    const value = Number(token);
    return Number.isFinite(value) ? value : null;
}

function parseComplexInput(raw) {
    const text = String(raw || '').toLowerCase().replace(/\s+/g, '').replace(/,/g, '.');
    if (!text) {
        return null;
    }

    if (!text.includes('i')) {
        const real = parseSimpleNumber(text);
        return real === null ? null : { re: real, im: 0 };
    }

    if (!text.endsWith('i')) {
        return null;
    }

    const body = text.slice(0, -1);
    if (body === '' || body === '+') {
        return { re: 0, im: 1 };
    }
    if (body === '-') {
        return { re: 0, im: -1 };
    }

    let split = -1;
    for (let index = 1; index < body.length; index += 1) {
        if (body[index] === '+' || body[index] === '-') {
            split = index;
        }
    }

    if (split === -1) {
        const imagOnly = parseSimpleNumber(body);
        return imagOnly === null ? null : { re: 0, im: imagOnly };
    }

    const realPart = body.slice(0, split);
    const imagPart = body.slice(split);
    const real = parseSimpleNumber(realPart);
    const imag = parseSimpleNumber(imagPart);

    if (real === null || imag === null) {
        return null;
    }
    return { re: real, im: imag };
}

function initAddSubDemo() {
    const canvas = document.getElementById('addSubCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, 8, 6);
    const sliders = {
        z1Re: document.getElementById('addZ1ReSlider'),
        z1Im: document.getElementById('addZ1ImSlider'),
        z2Re: document.getElementById('addZ2ReSlider'),
        z2Im: document.getElementById('addZ2ImSlider')
    };
    const randomButton = document.getElementById('addSubRandomBtn');

    const state = {
        z1Re: 2,
        z1Im: 1.5,
        z2Re: -1,
        z2Im: 2
    };
    let dragging = null;

    function render() {
        drawPlane(plane, true);
        const sumRe = state.z1Re + state.z2Re;
        const sumIm = state.z1Im + state.z2Im;
        const diffRe = state.z1Re - state.z2Re;
        const diffIm = state.z1Im - state.z2Im;

        drawVector(plane, 0, 0, state.z1Re, state.z1Im, '#3b82f6', 'z₁');
        drawVector(plane, 0, 0, state.z2Re, state.z2Im, '#f59e0b', 'z₂');
        drawVector(plane, 0, 0, sumRe, sumIm, '#10b981', 'z₁+z₂');
        drawVector(plane, 0, 0, diffRe, diffIm, '#ec4899', 'z₁-z₂');
        drawVector(plane, state.z1Re, state.z1Im, sumRe, sumIm, 'rgba(16,185,129,0.65)', '', 2, true);
        drawVector(plane, state.z2Re, state.z2Im, sumRe, sumIm, 'rgba(16,185,129,0.65)', '', 2, true);

        drawPoint(plane, state.z1Re, state.z1Im, '#60a5fa', '');
        drawPoint(plane, state.z2Re, state.z2Im, '#fbbf24', '');
        drawPoint(plane, sumRe, sumIm, '#34d399', '');
        drawPoint(plane, diffRe, diffIm, '#f472b6', '');

        document.getElementById('addZ1ReValue').textContent = formatNumber(state.z1Re, 1);
        document.getElementById('addZ1ImValue').textContent = formatNumber(state.z1Im, 1);
        document.getElementById('addZ2ReValue').textContent = formatNumber(state.z2Re, 1);
        document.getElementById('addZ2ImValue').textContent = formatNumber(state.z2Im, 1);
        document.getElementById('addZ1Value').textContent = complexString(state.z1Re, state.z1Im, 2);
        document.getElementById('addZ2Value').textContent = complexString(state.z2Re, state.z2Im, 2);
        document.getElementById('addSumValue').textContent = complexString(sumRe, sumIm, 2);
        document.getElementById('addDiffValue').textContent = complexString(diffRe, diffIm, 2);
        document.getElementById('addReCalc').textContent = `${formatNumber(state.z1Re, 1)} + ${formatNumber(state.z2Re, 1)} = ${formatNumber(sumRe, 1)}`;
        document.getElementById('addImCalc').textContent = `${formatNumber(state.z1Im, 1)} + ${formatNumber(state.z2Im, 1)} = ${formatNumber(sumIm, 1)}`;
        document.getElementById('addSumAbs').textContent = formatNumber(Math.hypot(sumRe, sumIm), 3);
        document.getElementById('addDiffAbs').textContent = formatNumber(Math.hypot(diffRe, diffIm), 3);
    }

    function updateFromSliders() {
        state.z1Re = Number.parseFloat(sliders.z1Re.value);
        state.z1Im = Number.parseFloat(sliders.z1Im.value);
        state.z2Re = Number.parseFloat(sliders.z2Re.value);
        state.z2Im = Number.parseFloat(sliders.z2Im.value);
        render();
    }

    Object.values(sliders).forEach(slider => slider.addEventListener('input', updateFromSliders));

    randomButton.addEventListener('click', () => {
        const random = () => (Math.floor(Math.random() * 25) - 12) / 2;
        state.z1Re = random();
        state.z1Im = random();
        state.z2Re = random();
        state.z2Im = random();
        sliders.z1Re.value = String(state.z1Re);
        sliders.z1Im.value = String(state.z1Im);
        sliders.z2Re.value = String(state.z2Re);
        sliders.z2Im.value = String(state.z2Im);
        render();
    });

    canvas.addEventListener('mousedown', event => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const z1x = toCanvasX(state.z1Re, plane);
        const z1y = toCanvasY(state.z1Im, plane);
        const z2x = toCanvasX(state.z2Re, plane);
        const z2y = toCanvasY(state.z2Im, plane);
        if (Math.hypot(x - z1x, y - z1y) <= 14) {
            dragging = 'z1';
        } else if (Math.hypot(x - z2x, y - z2y) <= 14) {
            dragging = 'z2';
        }
    });

    canvas.addEventListener('mousemove', event => {
        if (!dragging) {
            return;
        }
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const re = clamp(Math.round(toMathX(x, plane) * 2) / 2, -6, 6);
        const im = clamp(Math.round(toMathY(y, plane) * 2) / 2, -6, 6);

        if (dragging === 'z1') {
            state.z1Re = re;
            state.z1Im = im;
            sliders.z1Re.value = String(re);
            sliders.z1Im.value = String(im);
        } else {
            state.z2Re = re;
            state.z2Im = im;
            sliders.z2Re.value = String(re);
            sliders.z2Im.value = String(im);
        }
        render();
    });

    ['mouseup', 'mouseleave'].forEach(name => canvas.addEventListener(name, () => { dragging = null; }));
    render();
}

function initMultiplicationDemo() {
    const canvas = document.getElementById('multiplyCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, 16, 12);
    const z2ReSlider = document.getElementById('multZ2ReSlider');
    const z2ImSlider = document.getElementById('multZ2ImSlider');
    const randomButton = document.getElementById('multRandomBtn');

    const state = {
        z1Re: 2,
        z1Im: 1,
        z2Re: 1,
        z2Im: 2
    };
    let draggingZ1 = false;

    function render() {
        const productRe = state.z1Re * state.z2Re - state.z1Im * state.z2Im;
        const productIm = state.z1Re * state.z2Im + state.z1Im * state.z2Re;

        drawPlane(plane, true);
        drawVector(plane, 0, 0, state.z1Re, state.z1Im, '#3b82f6', 'z₁');
        drawVector(plane, 0, 0, state.z2Re, state.z2Im, '#f59e0b', 'z₂');
        drawVector(plane, 0, 0, productRe, productIm, '#10b981', 'z₁·z₂');
        drawPoint(plane, state.z1Re, state.z1Im, '#60a5fa', '');
        drawPoint(plane, state.z2Re, state.z2Im, '#fbbf24', '');
        drawPoint(plane, productRe, productIm, '#34d399', '');

        const abs1 = Math.hypot(state.z1Re, state.z1Im);
        const abs2 = Math.hypot(state.z2Re, state.z2Im);
        const absProduct = Math.hypot(productRe, productIm);
        const arg1 = normalizeDegrees(Math.atan2(state.z1Im, state.z1Re) * (180 / Math.PI));
        const arg2 = normalizeDegrees(Math.atan2(state.z2Im, state.z2Re) * (180 / Math.PI));
        const argProduct = normalizeDegrees(Math.atan2(productIm, productRe) * (180 / Math.PI));
        const argExpected = normalizeDegrees(arg1 + arg2);
        const hasDefinedArguments = abs1 > EPS && abs2 > EPS && absProduct > EPS;

        document.getElementById('multZ2ReValue').textContent = formatNumber(state.z2Re, 1);
        document.getElementById('multZ2ImValue').textContent = formatNumber(state.z2Im, 1);
        document.getElementById('multZ1Value').textContent = complexString(state.z1Re, state.z1Im, 2);
        document.getElementById('multZ2Value').textContent = complexString(state.z2Re, state.z2Im, 2);
        document.getElementById('multProductValue').textContent = complexString(productRe, productIm, 2);
        document.getElementById('multRealCalc').textContent = formatNumber(productRe, 3);
        document.getElementById('multImagCalc').textContent = formatNumber(productIm, 3);
        document.getElementById('multModCheck').textContent = `${formatNumber(absProduct, 3)} = ${formatNumber(abs1 * abs2, 3)}`;
        document.getElementById('multArgCheck').textContent = hasDefinedArguments
            ? `${formatNumber(argProduct, 1)}° = ${formatNumber(argExpected, 1)}°`
            : 'nedefinováno (alespoň jeden modul je 0)';
    }

    function updateFromSliders() {
        state.z2Re = Number.parseFloat(z2ReSlider.value);
        state.z2Im = Number.parseFloat(z2ImSlider.value);
        render();
    }

    z2ReSlider.addEventListener('input', updateFromSliders);
    z2ImSlider.addEventListener('input', updateFromSliders);

    randomButton.addEventListener('click', () => {
        const random = () => (Math.floor(Math.random() * 13) - 6) / 2;
        state.z1Re = random();
        state.z1Im = random();
        state.z2Re = random();
        state.z2Im = random();
        z2ReSlider.value = String(state.z2Re);
        z2ImSlider.value = String(state.z2Im);
        render();
    });

    canvas.addEventListener('mousedown', event => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const z1x = toCanvasX(state.z1Re, plane);
        const z1y = toCanvasY(state.z1Im, plane);
        draggingZ1 = Math.hypot(x - z1x, y - z1y) <= 14;
    });

    canvas.addEventListener('mousemove', event => {
        if (!draggingZ1) {
            return;
        }
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        state.z1Re = clamp(Math.round(toMathX(x, plane) * 2) / 2, -8, 8);
        state.z1Im = clamp(Math.round(toMathY(y, plane) * 2) / 2, -6, 6);
        render();
    });

    ['mouseup', 'mouseleave'].forEach(name => canvas.addEventListener(name, () => { draggingZ1 = false; }));
    render();
}

function initDivisionDemo() {
    const canvas = document.getElementById('divisionCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, 12, 9);
    const sliders = {
        numRe: document.getElementById('divNumReSlider'),
        numIm: document.getElementById('divNumImSlider'),
        denRe: document.getElementById('divDenReSlider'),
        denIm: document.getElementById('divDenImSlider')
    };
    const randomButton = document.getElementById('divRandomBtn');

    const state = {
        numRe: 3,
        numIm: 2,
        denRe: 2,
        denIm: -1
    };

    function render() {
        if (Math.abs(state.denRe) < EPS && Math.abs(state.denIm) < EPS) {
            state.denRe = 1;
            state.denIm = 0;
            sliders.denRe.value = '1';
            sliders.denIm.value = '0';
        }

        const a = state.numRe;
        const b = state.numIm;
        const c = state.denRe;
        const d = state.denIm;
        const denominator = c * c + d * d;
        const numReal = a * c + b * d;
        const numImag = b * c - a * d;
        const resultRe = numReal / denominator;
        const resultIm = numImag / denominator;
        const checkRe = resultRe * c - resultIm * d;
        const checkIm = resultRe * d + resultIm * c;

        drawPlane(plane, true);
        drawVector(plane, 0, 0, a, b, '#3b82f6', 'čitatel');
        drawVector(plane, 0, 0, c, d, '#f59e0b', 'jmenovatel');
        drawVector(plane, 0, 0, resultRe, resultIm, '#10b981', 'podíl');
        drawPoint(plane, a, b, '#60a5fa', '');
        drawPoint(plane, c, d, '#fbbf24', '');
        drawPoint(plane, resultRe, resultIm, '#34d399', '');

        document.getElementById('divNumReValue').textContent = formatNumber(a, 1);
        document.getElementById('divNumImValue').textContent = formatNumber(b, 1);
        document.getElementById('divDenReValue').textContent = formatNumber(c, 1);
        document.getElementById('divDenImValue').textContent = formatNumber(d, 1);
        document.getElementById('divNumeratorValue').textContent = complexString(a, b, 2);
        document.getElementById('divDenominatorValue').textContent = complexString(c, d, 2);
        document.getElementById('divConjugateValue').textContent = complexString(c, -d, 2);
        document.getElementById('divExpandedNumValue').textContent = complexString(numReal, numImag, 3);
        document.getElementById('divExpandedDenValue').textContent = formatNumber(denominator, 3);
        document.getElementById('divResultValue').textContent = complexString(resultRe, resultIm, 3);
        document.getElementById('divCheckValue').textContent = complexString(checkRe, checkIm, 3);
    }

    function updateFromSliders() {
        state.numRe = Number.parseFloat(sliders.numRe.value);
        state.numIm = Number.parseFloat(sliders.numIm.value);
        state.denRe = Number.parseFloat(sliders.denRe.value);
        state.denIm = Number.parseFloat(sliders.denIm.value);
        render();
    }

    Object.values(sliders).forEach(slider => slider.addEventListener('input', updateFromSliders));

    randomButton.addEventListener('click', () => {
        const random = () => (Math.floor(Math.random() * 25) - 12) / 2;
        state.numRe = random();
        state.numIm = random();
        do {
            state.denRe = random();
            state.denIm = random();
        } while (Math.abs(state.denRe) < EPS && Math.abs(state.denIm) < EPS);

        sliders.numRe.value = String(state.numRe);
        sliders.numIm.value = String(state.numIm);
        sliders.denRe.value = String(state.denRe);
        sliders.denIm.value = String(state.denIm);
        render();
    });

    render();
}

function initModulusDemo() {
    const canvas = document.getElementById('modulusCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, 8, 8);
    const reSlider = document.getElementById('modReSlider');
    const imSlider = document.getElementById('modImSlider');
    const randomButton = document.getElementById('modRandomBtn');

    const state = {
        re: 3,
        im: 4
    };
    let dragging = false;

    function render() {
        const { ctx } = plane;
        const abs = Math.hypot(state.re, state.im);

        drawPlane(plane, true);
        drawVector(plane, 0, 0, state.re, state.im, '#3b82f6', 'z');
        drawPoint(plane, state.re, state.im, '#60a5fa', '');

        ctx.save();
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(plane.centerX, plane.centerY, abs * plane.scaleX, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        drawVector(plane, state.re, state.im, state.re, 0, 'rgba(59,130,246,0.6)', '', 1.6, true);
        drawVector(plane, state.re, state.im, 0, state.im, 'rgba(59,130,246,0.6)', '', 1.6, true);

        document.getElementById('modReValue').textContent = formatNumber(state.re, 1);
        document.getElementById('modImValue').textContent = formatNumber(state.im, 1);
        document.getElementById('modZValue').textContent = complexString(state.re, state.im, 2);
        document.getElementById('modAbsValue').textContent = formatNumber(abs, 3);
        document.getElementById('modSquareValue').textContent = formatNumber(abs * abs, 3);
        document.getElementById('modConjValue').textContent = formatNumber(state.re * state.re + state.im * state.im, 3);
        document.getElementById('modDistanceFormula').textContent =
            `|z| = √(${formatNumber(state.re, 1)}² + ${formatNumber(state.im, 1)}²) = ${formatNumber(abs, 3)}`;
    }

    function updateFromSliders() {
        state.re = Number.parseFloat(reSlider.value);
        state.im = Number.parseFloat(imSlider.value);
        render();
    }

    reSlider.addEventListener('input', updateFromSliders);
    imSlider.addEventListener('input', updateFromSliders);

    randomButton.addEventListener('click', () => {
        const random = () => (Math.floor(Math.random() * 29) - 14) / 2;
        state.re = random();
        state.im = random();
        reSlider.value = String(state.re);
        imSlider.value = String(state.im);
        render();
    });

    canvas.addEventListener('mousedown', event => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const zx = toCanvasX(state.re, plane);
        const zy = toCanvasY(state.im, plane);
        dragging = Math.hypot(x - zx, y - zy) <= 14;
    });

    canvas.addEventListener('mousemove', event => {
        if (!dragging) {
            return;
        }
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        state.re = clamp(Math.round(toMathX(x, plane) * 2) / 2, -7, 7);
        state.im = clamp(Math.round(toMathY(y, plane) * 2) / 2, -7, 7);
        reSlider.value = String(state.re);
        imSlider.value = String(state.im);
        render();
    });

    ['mouseup', 'mouseleave'].forEach(name => canvas.addEventListener(name, () => { dragging = false; }));
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
            if (exercise.dataset.completed === '1') {
                return;
            }

            const feedback = exercise.querySelector('.exercise-feedback');
            const status = exercise.querySelector('.exercise-status');
            const type = exercise.dataset.type;

            let isCorrect = false;
            let hasAnswer = false;

            if (type === 'choice') {
                const expected = exercise.dataset.answer || '';
                const selected = exercise.querySelector('input[type="radio"]:checked');
                if (!selected) {
                    feedback.textContent = 'Vyberte prosím jednu odpověď.';
                    feedback.className = 'exercise-feedback show incorrect';
                    return;
                }

                hasAnswer = true;
                isCorrect = selected.value === expected;

                exercise.querySelectorAll('input[type="radio"]').forEach(input => {
                    input.disabled = true;
                    if (input.value === expected) {
                        input.parentElement.classList.add('correct');
                    }
                    if (!isCorrect && input === selected) {
                        input.parentElement.classList.add('incorrect');
                    }
                });
            } else if (type === 'complex-input') {
                const input = exercise.querySelector('.exercise-input');
                const answer = parseComplexInput(input ? input.value : '');
                if (!answer) {
                    feedback.textContent = 'Zadejte odpověď ve tvaru a+bi (např. 4-2i).';
                    feedback.className = 'exercise-feedback show incorrect';
                    return;
                }

                hasAnswer = true;
                const expectedRe = Number.parseFloat(exercise.dataset.real || '0');
                const expectedIm = Number.parseFloat(exercise.dataset.imag || '0');
                const tolerance = Number.parseFloat(exercise.dataset.tolerance || '0.001');
                isCorrect = Math.abs(answer.re - expectedRe) <= tolerance && Math.abs(answer.im - expectedIm) <= tolerance;

                input.disabled = true;
                input.classList.add(isCorrect ? 'correct-answer' : 'incorrect-answer');
            } else if (type === 'number-input') {
                const input = exercise.querySelector('.exercise-input');
                const answer = parseSimpleNumber(input ? input.value : '');
                if (answer === null) {
                    feedback.textContent = 'Zadejte číselný výsledek.';
                    feedback.className = 'exercise-feedback show incorrect';
                    return;
                }

                hasAnswer = true;
                const expectedValue = Number.parseFloat(exercise.dataset.value || '0');
                const tolerance = Number.parseFloat(exercise.dataset.tolerance || '0.001');
                isCorrect = Math.abs(answer - expectedValue) <= tolerance;

                input.disabled = true;
                input.classList.add(isCorrect ? 'correct-answer' : 'incorrect-answer');
            }

            if (!hasAnswer) {
                return;
            }

            exercise.dataset.completed = '1';
            exercise.dataset.correct = isCorrect ? '1' : '0';
            button.disabled = true;

            if (status) {
                status.textContent = isCorrect ? '✓ Správně' : '✗ Špatně';
                status.className = `exercise-status ${isCorrect ? 'correct' : 'incorrect'}`;
            }

            const correctLabel = exercise.dataset.correctLabel || '';
            const explanation = exercise.dataset.explanation || '';
            feedback.innerHTML = isCorrect
                ? `Správně. ${explanation}`
                : `Nesprávně. Správný výsledek: ${correctLabel}. ${explanation}`;
            feedback.className = `exercise-feedback show ${isCorrect ? 'correct' : 'incorrect'}`;
            typeset(feedback);
            setTimeout(() => typeset(feedback), 100);

            updateExerciseProgress(exercises);
        });
    });

    updateExerciseProgress(exercises);
}

function updateExerciseProgress(exercises) {
    const solved = exercises.filter(exercise => exercise.dataset.completed === '1').length;
    const correct = exercises.filter(exercise => exercise.dataset.correct === '1').length;

    const solvedCount = document.getElementById('solvedCount');
    if (solvedCount) {
        solvedCount.textContent = String(solved);
    }

    const finalScore = document.getElementById('finalScore');
    if (finalScore) {
        finalScore.textContent = `${correct} / ${exercises.length}`;
    }

    const complete = document.getElementById('lessonComplete');
    if (complete) {
        complete.classList.toggle('hidden', solved !== exercises.length);
    }
}
