document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initNavbarScroll();
    initComplexPlaneDemo();
    initQuadraticRootsDemo();
    initRotationDemo();
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
    const order = ['intro', 'equations', 'rotation'];
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
        button.addEventListener('click', () => {
            showSection(button.dataset.next);
        });
    });

    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            showSection(button.dataset.prev);
        });
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

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
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

function initComplexPlaneDemo() {
    const canvas = document.getElementById('complexPlaneCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, 8, 6);
    const sliders = {
        re: document.getElementById('reSlider'),
        im: document.getElementById('imSlider')
    };
    const showConjugate = document.getElementById('showConjugate');
    const randomButton = document.getElementById('randomComplexBtn');

    const state = { re: 2, im: 3 };
    let dragging = false;

    function render() {
        drawPlane(plane, true);
        const ctx = plane.ctx;

        const zx = toCanvasX(state.re, plane);
        const zy = toCanvasY(state.im, plane);

        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.55)';
        ctx.beginPath();
        ctx.moveTo(zx, zy);
        ctx.lineTo(zx, plane.centerY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(zx, zy);
        ctx.lineTo(plane.centerX, zy);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(plane.centerX, plane.centerY);
        ctx.lineTo(zx, zy);
        ctx.stroke();

        if (showConjugate.checked) {
            const cx = toCanvasX(state.re, plane);
            const cy = toCanvasY(-state.im, plane);
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(plane.centerX, plane.centerY);
            ctx.lineTo(cx, cy);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(cx, cy, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillText('Z̄', cx + 8, cy - 8);
        }

        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(zx, zy, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#dbeafe';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText('Z', zx + 8, zy - 8);

        const modulus = Math.hypot(state.re, state.im);
        const argRad = Math.atan2(state.im, state.re);
        const argDeg = normalizeDegrees(argRad * (180 / Math.PI));

        document.getElementById('reValue').textContent = formatNumber(state.re, 1);
        document.getElementById('imValue').textContent = formatNumber(state.im, 1);
        document.getElementById('complexNumberDisplay').textContent = `z = ${complexString(state.re, state.im, 2)}`;
        document.getElementById('conjugateDisplay').textContent = `z̄ = ${complexString(state.re, -state.im, 2)}`;
        document.getElementById('modulusValue').textContent = formatNumber(modulus, 3);
        document.getElementById('argRadValue').textContent = formatNumber(argRad, 3);
        document.getElementById('argDegValue').textContent = `${formatNumber(argDeg, 2)}°`;
    }

    function updateFromSliders() {
        state.re = Number.parseFloat(sliders.re.value);
        state.im = Number.parseFloat(sliders.im.value);
        render();
    }

    sliders.re.addEventListener('input', updateFromSliders);
    sliders.im.addEventListener('input', updateFromSliders);
    showConjugate.addEventListener('change', render);

    randomButton.addEventListener('click', () => {
        const random = () => (Math.floor(Math.random() * 25) - 12) / 2;
        state.re = random();
        state.im = random();
        sliders.re.value = String(state.re);
        sliders.im.value = String(state.im);
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
        state.re = Math.max(-6, Math.min(6, Math.round(toMathX(x, plane) * 2) / 2));
        state.im = Math.max(-6, Math.min(6, Math.round(toMathY(y, plane) * 2) / 2));
        sliders.re.value = String(state.re);
        sliders.im.value = String(state.im);
        render();
    });

    ['mouseup', 'mouseleave'].forEach(name => canvas.addEventListener(name, () => { dragging = false; }));
    render();
}

function initQuadraticRootsDemo() {
    const canvas = document.getElementById('rootsCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, 8, 6);
    const sliders = {
        a: document.getElementById('qaSlider'),
        b: document.getElementById('qbSlider'),
        c: document.getElementById('qcSlider')
    };

    function drawRoots(roots) {
        drawPlane(plane, true);
        const ctx = plane.ctx;
        ctx.font = '12px Inter, sans-serif';

        roots.forEach((root, index) => {
            const px = toCanvasX(root.re, plane);
            const py = toCanvasY(root.im, plane);
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(px, py, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#a7f3d0';
            ctx.fillText(`x${index + 1}`, px + 8, py - 8);
        });
    }

    function render() {
        let a = Number.parseFloat(sliders.a.value);
        const b = Number.parseFloat(sliders.b.value);
        const c = Number.parseFloat(sliders.c.value);
        if (Math.abs(a) < EPS) {
            a = 1;
            sliders.a.value = '1';
        }

        document.getElementById('qaValue').textContent = String(a);
        document.getElementById('qbValue').textContent = String(b);
        document.getElementById('qcValue').textContent = String(c);

        const D = b * b - 4 * a * c;
        const twoA = 2 * a;
        let roots;
        let rootType;

        if (D > EPS) {
            const sqrtD = Math.sqrt(D);
            roots = [
                { re: (-b + sqrtD) / twoA, im: 0 },
                { re: (-b - sqrtD) / twoA, im: 0 }
            ];
            rootType = '2 reálné kořeny';
        } else if (Math.abs(D) <= EPS) {
            const root = -b / twoA;
            roots = [{ re: root, im: 0 }, { re: root, im: 0 }];
            rootType = '1 dvojnásobný reálný kořen';
        } else {
            const real = -b / twoA;
            const imag = Math.sqrt(-D) / Math.abs(twoA);
            roots = [
                { re: real, im: imag },
                { re: real, im: -imag }
            ];
            rootType = '2 komplexní kořeny';
        }

        document.getElementById('quadraticEqDisplay').textContent = `${a}x² ${b >= 0 ? '+' : '-'} ${Math.abs(b)}x ${c >= 0 ? '+' : '-'} ${Math.abs(c)} = 0`;
        document.getElementById('discValue').textContent = formatNumber(D, 3);
        document.getElementById('root1Value').textContent = complexString(roots[0].re, roots[0].im, 3);
        document.getElementById('root2Value').textContent = complexString(roots[1].re, roots[1].im, 3);
        document.getElementById('rootTypeValue').textContent = rootType;
        drawRoots(roots);
    }

    Object.values(sliders).forEach(slider => slider.addEventListener('input', render));
    render();
}

function initRotationDemo() {
    const canvas = document.getElementById('rotationCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, 8, 6);
    const modSlider = document.getElementById('mulModSlider');
    const argSlider = document.getElementById('mulArgSlider');
    const presetButtons = document.querySelectorAll('.preset-btn');
    const state = { zRe: 2, zIm: 1 };
    let dragging = false;

    function render() {
        const mod = Number.parseFloat(modSlider.value);
        const angleDeg = Number.parseFloat(argSlider.value);
        const angleRad = angleDeg * Math.PI / 180;
        const wRe = mod * Math.cos(angleRad);
        const wIm = mod * Math.sin(angleRad);
        const zPrimeRe = wRe * state.zRe - wIm * state.zIm;
        const zPrimeIm = wRe * state.zIm + wIm * state.zRe;

        drawPlane(plane, true);
        const ctx = plane.ctx;

        const ox = plane.centerX;
        const oy = plane.centerY;
        const zx = toCanvasX(state.zRe, plane);
        const zy = toCanvasY(state.zIm, plane);
        const zpx = toCanvasX(zPrimeRe, plane);
        const zpy = toCanvasY(zPrimeIm, plane);

        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(zx, zy);
        ctx.stroke();

        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(zpx, zpy);
        ctx.stroke();

        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(zx, zy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(zpx, zpy, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#bfdbfe';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText('Z', zx + 8, zy - 8);
        ctx.fillStyle = '#86efac';
        ctx.fillText('Z′', zpx + 8, zpy - 8);

        document.getElementById('mulModValue').textContent = formatNumber(mod, 2);
        document.getElementById('mulArgValue').textContent = `${formatNumber(angleDeg, 0)}°`;
        document.getElementById('multiplierDisplay').textContent = `w = ${complexString(wRe, wIm, 3)}`;
        document.getElementById('transformDisplay').textContent = `z' = w · z`;
        document.getElementById('zValue').textContent = complexString(state.zRe, state.zIm, 3);
        document.getElementById('zPrimeValue').textContent = complexString(zPrimeRe, zPrimeIm, 3);
        document.getElementById('scaleValue').textContent = formatNumber(mod, 3);
        document.getElementById('angleShiftValue').textContent = `${formatNumber(normalizeDegrees(angleDeg), 0)}°`;
    }

    function activatePreset() {
        const mod = Number.parseFloat(modSlider.value);
        const angle = Number.parseFloat(argSlider.value);
        presetButtons.forEach(button => {
            const same = Number.parseFloat(button.dataset.mod) === mod && Number.parseFloat(button.dataset.angle) === angle;
            button.classList.toggle('active', same);
        });
    }

    modSlider.addEventListener('input', () => {
        activatePreset();
        render();
    });
    argSlider.addEventListener('input', () => {
        activatePreset();
        render();
    });

    presetButtons.forEach(button => {
        button.addEventListener('click', () => {
            modSlider.value = button.dataset.mod;
            argSlider.value = button.dataset.angle;
            activatePreset();
            render();
        });
    });

    canvas.addEventListener('mousedown', event => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const zx = toCanvasX(state.zRe, plane);
        const zy = toCanvasY(state.zIm, plane);
        dragging = Math.hypot(x - zx, y - zy) <= 14;
    });

    canvas.addEventListener('mousemove', event => {
        if (!dragging) {
            return;
        }
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        state.zRe = Math.max(-7, Math.min(7, Math.round(toMathX(x, plane) * 2) / 2));
        state.zIm = Math.max(-5.5, Math.min(5.5, Math.round(toMathY(y, plane) * 2) / 2));
        render();
    });

    ['mouseup', 'mouseleave'].forEach(name => canvas.addEventListener(name, () => { dragging = false; }));
    activatePreset();
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

            const expected = exercise.dataset.answer || '';
            const selected = exercise.querySelector('input[type="radio"]:checked');
            const feedback = exercise.querySelector('.exercise-feedback');
            const status = exercise.querySelector('.exercise-status');

            if (!selected) {
                feedback.textContent = 'Vyberte prosím jednu odpověď.';
                feedback.className = 'exercise-feedback show incorrect';
                return;
            }

            const isCorrect = selected.value === expected;
            exercise.dataset.completed = '1';
            exercise.dataset.correct = isCorrect ? '1' : '0';
            button.disabled = true;

            exercise.querySelectorAll('input[type="radio"]').forEach(input => {
                input.disabled = true;
                if (input.value === expected) {
                    input.parentElement.classList.add('correct');
                }
                if (!isCorrect && input === selected) {
                    input.parentElement.classList.add('incorrect');
                }
            });

            if (status) {
                status.textContent = isCorrect ? '✓ Správně' : '✗ Špatně';
                status.className = `exercise-status ${isCorrect ? 'correct' : 'incorrect'}`;
            }

            const correctLabel = exercise.dataset.correctLabel || '';
            const explanation = exercise.dataset.explanation || '';
            feedback.innerHTML = isCorrect
                ? `Správně. ${explanation}`
                : `Nesprávně. Správná odpověď: ${correctLabel}. ${explanation}`;
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
