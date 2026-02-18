document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initNavbarScroll();
    initPolarIntroDemo();
    initAlgToPolarDemo();
    initPolarToAlgDemo();
    initAddSubPolarDemo();
    initMultiplyPolarDemo();
    initDividePolarDemo();
    initExercises();
});

const EPS = 1e-9;

// shared
function typeset(target) {
    if (!window.MathJax || typeof window.MathJax.typesetPromise !== 'function') {
        return;
    }

    const nodes = target ? [target] : undefined;
    window.MathJax.typesetPromise(nodes).catch(() => { });
}

function initNavigation() {
    const order = [
        'goniometricky-tvar-komplexniho-cisla',
        'prevod-z-algebraickeho-na-goniometricky-tvar',
        'prevod-z-goniometrickeho-na-algebraicky-tvar',
        'soucet-a-rozdil-v-goniometrickem-tvaru',
        'soucin-v-goniometrickem-tvaru',
        'podil-v-goniometrickem-tvaru'
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

function drawPlane(plane) {
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

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('Re', width - 26, plane.centerY - 8);
    ctx.fillText('Im', plane.centerX + 8, 14);
}

function drawVector(plane, fromRe, fromIm, toRe, toIm, color, label = '', width = 3, dashed = false) {
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

function drawPoint(plane, re, im, color, label = '') {
    const { ctx } = plane;
    const x = toCanvasX(re, plane);
    const y = toCanvasY(im, plane);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();

    if (label) {
        ctx.fillStyle = color;
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText(label, x + 8, y - 8);
    }
}

function drawAngleArc(plane, angleRad, radius = 1.2, color = '#f59e0b') {
    const { ctx } = plane;
    const steps = 48;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= steps; i += 1) {
        const t = angleRad * (i / steps);
        const px = toCanvasX(radius * Math.cos(t), plane);
        const py = toCanvasY(radius * Math.sin(t), plane);
        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.stroke();
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

function degToRad(deg) {
    return (deg * Math.PI) / 180;
}

function radToDeg(rad) {
    return (rad * 180) / Math.PI;
}

function normalizeDegSigned(deg) {
    let value = deg % 360;
    if (value <= -180) {
        value += 360;
    }
    if (value > 180) {
        value -= 360;
    }
    return value;
}

function normalizeDegPositive(deg) {
    let value = deg % 360;
    if (value < 0) {
        value += 360;
    }
    return value;
}

function polarToCartesian(r, angleDeg) {
    const angleRad = degToRad(angleDeg);
    return {
        re: r * Math.cos(angleRad),
        im: r * Math.sin(angleRad)
    };
}

function cartesianToPolar(re, im) {
    const r = Math.hypot(re, im);
    const argRad = Math.atan2(im, re);
    const argDeg = normalizeDegSigned(radToDeg(argRad));
    const argDegPos = normalizeDegPositive(argDeg);
    return { r, argRad, argDeg, argDegPos };
}

function polarLabel(r, angleDeg) {
    if (r < EPS) {
        return '0';
    }
    return `${formatNumber(r, 3)} cis ${formatNumber(normalizeDegSigned(angleDeg), 2)}°`;
}

function polarFromCartesianLabel(re, im) {
    const polar = cartesianToPolar(re, im);
    if (polar.r < EPS) {
        return '0 (argument nedefinovaný)';
    }
    return `${formatNumber(polar.r, 3)} cis ${formatNumber(polar.argDeg, 2)}°`;
}

function parseSimpleNumber(raw) {
    const token = String(raw || '').trim().replace(',', '.').replace('°', '');
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
    for (let i = 1; i < body.length; i += 1) {
        if (body[i] === '+' || body[i] === '-') {
            split = i;
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

// demos
function initPolarIntroDemo() {
    const canvas = document.getElementById('polarIntroCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, 8, 6);
    const reSlider = document.getElementById('introReSlider');
    const imSlider = document.getElementById('introImSlider');
    const randomButton = document.getElementById('introRandomBtn');
    const state = { re: 3, im: 2 };
    let dragging = false;

    function render() {
        drawPlane(plane);
        drawVector(plane, 0, 0, state.re, state.im, '#3b82f6', 'z');
        drawPoint(plane, state.re, state.im, '#60a5fa');
        drawVector(plane, state.re, state.im, state.re, 0, 'rgba(59,130,246,0.55)', '', 1.5, true);
        drawVector(plane, state.re, state.im, 0, state.im, 'rgba(59,130,246,0.55)', '', 1.5, true);

        const polar = cartesianToPolar(state.re, state.im);
        if (polar.r > EPS) {
            drawAngleArc(plane, polar.argRad, Math.min(1.8, Math.max(1.1, polar.r * 0.35)));
        }

        document.getElementById('introReValue').textContent = formatNumber(state.re, 1);
        document.getElementById('introImValue').textContent = formatNumber(state.im, 1);
        document.getElementById('introCartesian').textContent = `z = ${complexString(state.re, state.im, 3)}`;

        if (polar.r < EPS) {
            document.getElementById('introTrig').textContent = 'z = 0 (argument není definovaný)';
            document.getElementById('introCis').textContent = 'Goniometrický tvar pro z = 0 nepoužíváme.';
            document.getElementById('introModulus').textContent = '0';
            document.getElementById('introArgRad').textContent = 'nedef.';
            document.getElementById('introArgDeg').textContent = 'nedef.';
            document.getElementById('introArgFamily').textContent = 'nedefinováno';
            return;
        }

        document.getElementById('introTrig').textContent =
            `z = ${formatNumber(polar.r, 3)}(cos ${formatNumber(polar.argDeg, 2)}° + i sin ${formatNumber(polar.argDeg, 2)}°)`;
        document.getElementById('introCis').textContent =
            `z = ${formatNumber(polar.r, 3)} cis ${formatNumber(polar.argDeg, 2)}°`;
        document.getElementById('introModulus').textContent = formatNumber(polar.r, 3);
        document.getElementById('introArgRad').textContent = formatNumber(polar.argRad, 4);
        document.getElementById('introArgDeg').textContent = `${formatNumber(polar.argDeg, 2)}°`;
        document.getElementById('introArgFamily').textContent = `${formatNumber(polar.argDeg, 2)}° + k·360°`;
    }

    function updateFromSliders() {
        state.re = Number.parseFloat(reSlider.value);
        state.im = Number.parseFloat(imSlider.value);
        render();
    }

    reSlider.addEventListener('input', updateFromSliders);
    imSlider.addEventListener('input', updateFromSliders);

    randomButton.addEventListener('click', () => {
        const random = () => (Math.floor(Math.random() * 25) - 12) / 2;
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
        const px = toCanvasX(state.re, plane);
        const py = toCanvasY(state.im, plane);
        dragging = Math.hypot(x - px, y - py) <= 14;
    });

    canvas.addEventListener('mousemove', event => {
        if (!dragging) {
            return;
        }
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        state.re = clamp(Math.round(toMathX(x, plane) * 2) / 2, -6, 6);
        state.im = clamp(Math.round(toMathY(y, plane) * 2) / 2, -6, 6);
        reSlider.value = String(state.re);
        imSlider.value = String(state.im);
        render();
    });

    ['mouseup', 'mouseleave'].forEach(name => canvas.addEventListener(name, () => { dragging = false; }));
    render();
}

function quadrantLabel(re, im) {
    if (Math.abs(re) < EPS && Math.abs(im) < EPS) {
        return 'bod 0';
    }
    if (Math.abs(re) < EPS) {
        return im > 0 ? 'osa +Im' : 'osa -Im';
    }
    if (Math.abs(im) < EPS) {
        return re > 0 ? 'osa +Re' : 'osa -Re';
    }
    if (re > 0 && im > 0) {
        return 'I';
    }
    if (re < 0 && im > 0) {
        return 'II';
    }
    if (re < 0 && im < 0) {
        return 'III';
    }
    return 'IV';
}

function initAlgToPolarDemo() {
    const canvas = document.getElementById('algToPolarCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, 8, 6);
    const reSlider = document.getElementById('algReSlider');
    const imSlider = document.getElementById('algImSlider');
    const randomButton = document.getElementById('algRandomBtn');
    const presetButtons = document.querySelectorAll('.alg-preset');
    const state = { re: -2, im: 3 };
    let dragging = false;

    function render() {
        drawPlane(plane);
        drawVector(plane, 0, 0, state.re, state.im, '#3b82f6', 'z');
        drawPoint(plane, state.re, state.im, '#60a5fa');

        const polar = cartesianToPolar(state.re, state.im);
        if (polar.r > EPS) {
            drawAngleArc(plane, polar.argRad, Math.min(1.8, Math.max(1.1, polar.r * 0.35)));
        }

        document.getElementById('algReValue').textContent = formatNumber(state.re, 1);
        document.getElementById('algImValue').textContent = formatNumber(state.im, 1);
        document.getElementById('algRValue').textContent = formatNumber(polar.r, 3);
        document.getElementById('algQuadrant').textContent = quadrantLabel(state.re, state.im);

        if (polar.r < EPS) {
            document.getElementById('algAlphaValue').textContent = 'nedef.';
            document.getElementById('algArgValue0').textContent = 'nedef.';
            document.getElementById('algArgPrincipal').textContent = 'nedef.';
            document.getElementById('algStepFormula').textContent = 'Pro z = 0 není argument definovaný.';
            document.getElementById('algTrigResult').textContent = 'z = 0';
            document.getElementById('algCisResult').textContent = 'Goniometrický tvar nepoužíváme.';
            return;
        }

        const alpha = (Math.abs(state.re) < EPS || Math.abs(state.im) < EPS)
            ? Math.abs(polar.argDeg)
            : radToDeg(Math.atan(Math.abs(state.im / state.re)));

        document.getElementById('algAlphaValue').textContent = `${formatNumber(alpha, 2)}°`;
        document.getElementById('algArgValue0').textContent = `${formatNumber(polar.argDegPos, 2)}°`;
        document.getElementById('algArgPrincipal').textContent = `${formatNumber(polar.argDeg, 2)}°`;
        document.getElementById('algStepFormula').textContent =
            `φ = atan2(${formatNumber(state.im, 2)}, ${formatNumber(state.re, 2)}) = ${formatNumber(polar.argDeg, 2)}°`;
        document.getElementById('algTrigResult').textContent =
            `z = ${formatNumber(polar.r, 3)}(cos ${formatNumber(polar.argDeg, 2)}° + i sin ${formatNumber(polar.argDeg, 2)}°)`;
        document.getElementById('algCisResult').textContent =
            `z = ${formatNumber(polar.r, 3)} cis ${formatNumber(polar.argDeg, 2)}°`;
    }

    function updateFromSliders() {
        state.re = Number.parseFloat(reSlider.value);
        state.im = Number.parseFloat(imSlider.value);
        render();
    }

    reSlider.addEventListener('input', updateFromSliders);
    imSlider.addEventListener('input', updateFromSliders);

    presetButtons.forEach(button => {
        button.addEventListener('click', () => {
            state.re = Number.parseFloat(button.dataset.re);
            state.im = Number.parseFloat(button.dataset.im);
            reSlider.value = String(state.re);
            imSlider.value = String(state.im);
            render();
        });
    });

    randomButton.addEventListener('click', () => {
        const random = () => (Math.floor(Math.random() * 25) - 12) / 2;
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
        const px = toCanvasX(state.re, plane);
        const py = toCanvasY(state.im, plane);
        dragging = Math.hypot(x - px, y - py) <= 14;
    });

    canvas.addEventListener('mousemove', event => {
        if (!dragging) {
            return;
        }
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        state.re = clamp(Math.round(toMathX(x, plane) * 2) / 2, -6, 6);
        state.im = clamp(Math.round(toMathY(y, plane) * 2) / 2, -6, 6);
        reSlider.value = String(state.re);
        imSlider.value = String(state.im);
        render();
    });

    ['mouseup', 'mouseleave'].forEach(name => canvas.addEventListener(name, () => { dragging = false; }));
    render();
}

function initPolarToAlgDemo() {
    const canvas = document.getElementById('polarToAlgCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, 8, 6);
    const rSlider = document.getElementById('ptaRSlider');
    const angleSlider = document.getElementById('ptaAngleSlider');
    const randomButton = document.getElementById('ptaRandomBtn');
    const presetButtons = document.querySelectorAll('.pta-preset');
    const state = { r: 4, angle: 60 };
    let dragging = false;

    function render() {
        const cart = polarToCartesian(state.r, state.angle);
        drawPlane(plane);
        drawVector(plane, 0, 0, cart.re, cart.im, '#3b82f6', 'z');
        drawPoint(plane, cart.re, cart.im, '#60a5fa');
        if (state.r > EPS) {
            drawAngleArc(plane, degToRad(state.angle), Math.min(1.8, Math.max(1.1, state.r * 0.35)));
        }

        const cosValue = Math.cos(degToRad(state.angle));
        const sinValue = Math.sin(degToRad(state.angle));

        document.getElementById('ptaRValue').textContent = formatNumber(state.r, 1);
        document.getElementById('ptaAngleValue').textContent = `${formatNumber(state.angle, 0)}°`;
        document.getElementById('ptaCosValue').textContent = formatNumber(cosValue, 4);
        document.getElementById('ptaSinValue').textContent = formatNumber(sinValue, 4);
        document.getElementById('ptaAValue').textContent = formatNumber(cart.re, 4);
        document.getElementById('ptaBValue').textContent = formatNumber(cart.im, 4);
        document.getElementById('ptaCartesianResult').textContent = `z = ${complexString(cart.re, cart.im, 4)}`;
        document.getElementById('ptaComplexResult').textContent =
            `a = r cos φ = ${formatNumber(cart.re, 4)}, b = r sin φ = ${formatNumber(cart.im, 4)}`;
    }

    function updateFromSliders() {
        state.r = Number.parseFloat(rSlider.value);
        state.angle = Number.parseFloat(angleSlider.value);
        render();
    }

    rSlider.addEventListener('input', updateFromSliders);
    angleSlider.addEventListener('input', updateFromSliders);

    presetButtons.forEach(button => {
        button.addEventListener('click', () => {
            state.r = Number.parseFloat(button.dataset.r);
            state.angle = Number.parseFloat(button.dataset.angle);
            rSlider.value = String(state.r);
            angleSlider.value = String(state.angle);
            render();
        });
    });

    randomButton.addEventListener('click', () => {
        const randomR = () => Math.floor(Math.random() * 17) / 2;
        const randomA = () => (Math.floor(Math.random() * 73) - 36) * 5;
        state.r = randomR();
        state.angle = randomA();
        rSlider.value = String(state.r);
        angleSlider.value = String(state.angle);
        render();
    });

    canvas.addEventListener('mousedown', event => {
        const cart = polarToCartesian(state.r, state.angle);
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const px = toCanvasX(cart.re, plane);
        const py = toCanvasY(cart.im, plane);
        dragging = Math.hypot(x - px, y - py) <= 14;
    });

    canvas.addEventListener('mousemove', event => {
        if (!dragging) {
            return;
        }
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const re = toMathX(x, plane);
        const im = toMathY(y, plane);
        const polar = cartesianToPolar(re, im);
        state.r = clamp(Math.round(polar.r * 2) / 2, 0, 8);
        state.angle = clamp(Math.round(polar.argDeg / 5) * 5, -180, 180);
        rSlider.value = String(state.r);
        angleSlider.value = String(state.angle);
        render();
    });

    ['mouseup', 'mouseleave'].forEach(name => canvas.addEventListener(name, () => { dragging = false; }));
    render();
}

function initAddSubPolarDemo() {
    const canvas = document.getElementById('addSubPolarCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, 9, 7);
    const sliders = {
        z1R: document.getElementById('aspZ1RSlider'),
        z1A: document.getElementById('aspZ1ASlider'),
        z2R: document.getElementById('aspZ2RSlider'),
        z2A: document.getElementById('aspZ2ASlider')
    };
    const randomButton = document.getElementById('aspRandomBtn');
    const state = { z1R: 2, z1A: 30, z2R: 2, z2A: 150 };

    function render() {
        const z1 = polarToCartesian(state.z1R, state.z1A);
        const z2 = polarToCartesian(state.z2R, state.z2A);
        const sum = { re: z1.re + z2.re, im: z1.im + z2.im };
        const diff = { re: z1.re - z2.re, im: z1.im - z2.im };

        drawPlane(plane);
        drawVector(plane, 0, 0, z1.re, z1.im, '#3b82f6', 'z1');
        drawVector(plane, 0, 0, z2.re, z2.im, '#f59e0b', 'z2');
        drawVector(plane, 0, 0, sum.re, sum.im, '#10b981', 'z1+z2');
        drawVector(plane, 0, 0, diff.re, diff.im, '#ec4899', 'z1-z2');
        drawPoint(plane, z1.re, z1.im, '#60a5fa');
        drawPoint(plane, z2.re, z2.im, '#fbbf24');
        drawPoint(plane, sum.re, sum.im, '#34d399');
        drawPoint(plane, diff.re, diff.im, '#f472b6');

        document.getElementById('aspZ1RValue').textContent = formatNumber(state.z1R, 1);
        document.getElementById('aspZ1AValue').textContent = `${formatNumber(state.z1A, 0)}°`;
        document.getElementById('aspZ2RValue').textContent = formatNumber(state.z2R, 1);
        document.getElementById('aspZ2AValue').textContent = `${formatNumber(state.z2A, 0)}°`;

        document.getElementById('aspZ1Cart').textContent = complexString(z1.re, z1.im, 3);
        document.getElementById('aspZ2Cart').textContent = complexString(z2.re, z2.im, 3);
        document.getElementById('aspSumCart').textContent = complexString(sum.re, sum.im, 3);
        document.getElementById('aspDiffCart').textContent = complexString(diff.re, diff.im, 3);
        document.getElementById('aspSumPolar').textContent = polarFromCartesianLabel(sum.re, sum.im);
        document.getElementById('aspDiffPolar').textContent = polarFromCartesianLabel(diff.re, diff.im);
        document.getElementById('aspRealCheck').textContent =
            `${formatNumber(z1.re, 3)} + ${formatNumber(z2.re, 3)} = ${formatNumber(sum.re, 3)}`;
        document.getElementById('aspImagCheck').textContent =
            `${formatNumber(z1.im, 3)} + ${formatNumber(z2.im, 3)} = ${formatNumber(sum.im, 3)}`;

        const note = Math.abs(sum.re) < EPS && Math.abs(sum.im) < EPS
            ? 'Součet je nulový, argument výsledku není definovaný.'
            : 'Bezpečná metoda: polar → algebraický tvar → operace → případně zpět.';
        document.getElementById('aspMethodNote').textContent = note;
    }

    function updateFromSliders() {
        state.z1R = Number.parseFloat(sliders.z1R.value);
        state.z1A = Number.parseFloat(sliders.z1A.value);
        state.z2R = Number.parseFloat(sliders.z2R.value);
        state.z2A = Number.parseFloat(sliders.z2A.value);
        render();
    }

    Object.values(sliders).forEach(slider => slider.addEventListener('input', updateFromSliders));

    randomButton.addEventListener('click', () => {
        const randomR = () => Math.floor(Math.random() * 13) / 2;
        const randomA = () => (Math.floor(Math.random() * 73) - 36) * 5;
        state.z1R = randomR();
        state.z1A = randomA();
        state.z2R = randomR();
        state.z2A = randomA();

        sliders.z1R.value = String(state.z1R);
        sliders.z1A.value = String(state.z1A);
        sliders.z2R.value = String(state.z2R);
        sliders.z2A.value = String(state.z2A);
        render();
    });

    render();
}

function initMultiplyPolarDemo() {
    const canvas = document.getElementById('multiplyPolarCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, 10, 8);
    const sliders = {
        z1R: document.getElementById('mpZ1RSlider'),
        z1A: document.getElementById('mpZ1ASlider'),
        z2R: document.getElementById('mpZ2RSlider'),
        z2A: document.getElementById('mpZ2ASlider')
    };
    const randomButton = document.getElementById('mpRandomBtn');
    const state = { z1R: 3, z1A: 25, z2R: 2, z2A: 40 };

    function render() {
        const z1 = polarToCartesian(state.z1R, state.z1A);
        const z2 = polarToCartesian(state.z2R, state.z2A);
        const productR = state.z1R * state.z2R;
        const productA = state.z1A + state.z2A;
        const product = polarToCartesian(productR, productA);
        const productPolar = cartesianToPolar(product.re, product.im);

        drawPlane(plane);
        drawVector(plane, 0, 0, z1.re, z1.im, '#3b82f6', 'z1');
        drawVector(plane, 0, 0, z2.re, z2.im, '#f59e0b', 'z2');
        drawVector(plane, 0, 0, product.re, product.im, '#10b981', 'z1·z2');
        drawPoint(plane, z1.re, z1.im, '#60a5fa');
        drawPoint(plane, z2.re, z2.im, '#fbbf24');
        drawPoint(plane, product.re, product.im, '#34d399');

        document.getElementById('mpZ1RValue').textContent = formatNumber(state.z1R, 1);
        document.getElementById('mpZ1AValue').textContent = `${formatNumber(state.z1A, 0)}°`;
        document.getElementById('mpZ2RValue').textContent = formatNumber(state.z2R, 1);
        document.getElementById('mpZ2AValue').textContent = `${formatNumber(state.z2A, 0)}°`;

        document.getElementById('mpZ1Polar').textContent = `z1 = ${polarLabel(state.z1R, state.z1A)}`;
        document.getElementById('mpZ2Polar').textContent = `z2 = ${polarLabel(state.z2R, state.z2A)}`;
        document.getElementById('mpProductPolar').textContent = `z1·z2 = ${polarLabel(productR, productA)}`;
        document.getElementById('mpProductCart').textContent = `z1·z2 = ${complexString(product.re, product.im, 4)}`;
        document.getElementById('mpModCheck').textContent =
            `${formatNumber(productPolar.r, 4)} = ${formatNumber(state.z1R * state.z2R, 4)}`;
        document.getElementById('mpArgCheck').textContent =
            `${formatNumber(productPolar.argDeg, 2)}° = ${formatNumber(normalizeDegSigned(state.z1A + state.z2A), 2)}°`;
    }

    function updateFromSliders() {
        state.z1R = Number.parseFloat(sliders.z1R.value);
        state.z1A = Number.parseFloat(sliders.z1A.value);
        state.z2R = Number.parseFloat(sliders.z2R.value);
        state.z2A = Number.parseFloat(sliders.z2A.value);
        render();
    }

    Object.values(sliders).forEach(slider => slider.addEventListener('input', updateFromSliders));

    randomButton.addEventListener('click', () => {
        const randomR = () => Math.floor(Math.random() * 13) / 2;
        const randomA = () => (Math.floor(Math.random() * 73) - 36) * 5;
        state.z1R = randomR();
        state.z1A = randomA();
        state.z2R = randomR();
        state.z2A = randomA();

        sliders.z1R.value = String(state.z1R);
        sliders.z1A.value = String(state.z1A);
        sliders.z2R.value = String(state.z2R);
        sliders.z2A.value = String(state.z2A);
        render();
    });

    render();
}

function initDividePolarDemo() {
    const canvas = document.getElementById('dividePolarCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, 10, 8);
    const sliders = {
        numR: document.getElementById('dpNumRSlider'),
        numA: document.getElementById('dpNumASlider'),
        denR: document.getElementById('dpDenRSlider'),
        denA: document.getElementById('dpDenASlider')
    };
    const randomButton = document.getElementById('dpRandomBtn');
    const state = { numR: 6, numA: 135, denR: 3, denA: 45 };

    function render() {
        state.denR = Math.max(0.5, state.denR);

        const numerator = polarToCartesian(state.numR, state.numA);
        const denominator = polarToCartesian(state.denR, state.denA);
        const quotientR = state.numR / state.denR;
        const quotientA = state.numA - state.denA;
        const quotient = polarToCartesian(quotientR, quotientA);
        const check = {
            re: quotient.re * denominator.re - quotient.im * denominator.im,
            im: quotient.re * denominator.im + quotient.im * denominator.re
        };

        drawPlane(plane);
        drawVector(plane, 0, 0, numerator.re, numerator.im, '#3b82f6', 'z1');
        drawVector(plane, 0, 0, denominator.re, denominator.im, '#f59e0b', 'z2');
        drawVector(plane, 0, 0, quotient.re, quotient.im, '#10b981', 'z1/z2');
        drawPoint(plane, numerator.re, numerator.im, '#60a5fa');
        drawPoint(plane, denominator.re, denominator.im, '#fbbf24');
        drawPoint(plane, quotient.re, quotient.im, '#34d399');

        document.getElementById('dpNumRValue').textContent = formatNumber(state.numR, 1);
        document.getElementById('dpNumAValue').textContent = `${formatNumber(state.numA, 0)}°`;
        document.getElementById('dpDenRValue').textContent = formatNumber(state.denR, 1);
        document.getElementById('dpDenAValue').textContent = `${formatNumber(state.denA, 0)}°`;

        document.getElementById('dpNumPolar').textContent = `z1 = ${polarLabel(state.numR, state.numA)}`;
        document.getElementById('dpDenPolar').textContent = `z2 = ${polarLabel(state.denR, state.denA)}`;
        document.getElementById('dpQuotPolar').textContent = `z1/z2 = ${polarLabel(quotientR, quotientA)}`;
        document.getElementById('dpQuotCart').textContent = `z1/z2 = ${complexString(quotient.re, quotient.im, 4)}`;
        document.getElementById('dpModCheck').textContent = formatNumber(quotientR, 4);
        document.getElementById('dpArgCheck').textContent = `${formatNumber(normalizeDegSigned(quotientA), 2)}°`;
        document.getElementById('dpCheck').textContent = complexString(check.re, check.im, 4);
    }

    function updateFromSliders() {
        state.numR = Number.parseFloat(sliders.numR.value);
        state.numA = Number.parseFloat(sliders.numA.value);
        state.denR = Number.parseFloat(sliders.denR.value);
        state.denA = Number.parseFloat(sliders.denA.value);
        render();
    }

    Object.values(sliders).forEach(slider => slider.addEventListener('input', updateFromSliders));

    randomButton.addEventListener('click', () => {
        const randomR = () => Math.max(0.5, Math.floor(Math.random() * 17) / 2);
        const randomA = () => (Math.floor(Math.random() * 73) - 36) * 5;
        state.numR = randomR();
        state.numA = randomA();
        state.denR = randomR();
        state.denA = randomA();

        sliders.numR.value = String(state.numR);
        sliders.numA.value = String(state.numA);
        sliders.denR.value = String(state.denR);
        sliders.denA.value = String(state.denA);
        render();
    });

    render();
}

// exercises
function initExercises() {
    const exercises = Array.from(document.querySelectorAll('.exercise'));
    const total = document.getElementById('totalCount');
    if (total) {
        total.textContent = String(exercises.length);
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
                    feedback.textContent = 'Zadejte výsledek ve tvaru a+bi (např. 3-2i nebo 2i).';
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
