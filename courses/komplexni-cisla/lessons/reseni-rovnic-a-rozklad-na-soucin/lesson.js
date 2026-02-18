document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initNavbarScroll();
    initQuadraticComplexDemo();
    initQuadraticBuilderDemo();
    initPolynomialFactorDemo();
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

function randomInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

function randomStep(min, max, step = 1) {
    const count = Math.floor((max - min) / step);
    return min + randomInt(0, count) * step;
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

function formatImagNumber(value, digits = 3) {
    const abs = Math.abs(value);
    const coeff = formatNumber(abs, digits);
    const core = coeff === '1' ? 'i' : `${coeff}i`;
    return value < 0 ? `-${core}` : core;
}

function formatComplex(z, digits = 3) {
    const reZero = Math.abs(z.re) < EPS;
    const imZero = Math.abs(z.im) < EPS;

    if (reZero && imZero) {
        return '0';
    }
    if (imZero) {
        return formatNumber(z.re, digits);
    }
    if (reZero) {
        return formatImagNumber(z.im, digits);
    }

    const sign = z.im >= 0 ? '+' : '-';
    return `${formatNumber(z.re, digits)} ${sign} ${formatNumber(Math.abs(z.im), digits)}i`;
}

function formatTerm(value, variable, first = false, digits = 3) {
    if (Math.abs(value) < EPS) {
        return '';
    }

    const abs = Math.abs(value);
    const coeff = variable && Math.abs(abs - 1) < EPS ? '' : formatNumber(abs, digits);
    const term = `${coeff}${variable}`;

    if (first) {
        return `${value < 0 ? '-' : ''}${term}`;
    }
    return `${value < 0 ? ' - ' : ' + '}${term}`;
}

function formatPolynomial(terms) {
    let result = '';

    terms.forEach((item, index) => {
        const piece = formatTerm(item.value, item.variable, index === 0);
        if (piece) {
            result += piece;
        }
    });

    return result || '0';
}

function complexAdd(z1, z2) {
    return { re: z1.re + z2.re, im: z1.im + z2.im };
}

function complexMultiply(z1, z2) {
    return {
        re: z1.re * z2.re - z1.im * z2.im,
        im: z1.re * z2.im + z1.im * z2.re
    };
}

function factorLead(a) {
    if (Math.abs(a - 1) < EPS) {
        return '';
    }
    if (Math.abs(a + 1) < EPS) {
        return '-';
    }
    return `${formatNumber(a)}·`;
}

function factorFromRealRoot(root) {
    const value = formatNumber(Math.abs(root));
    return `(x ${root >= 0 ? '-' : '+'} ${value})`;
}

function factorFromComplexRoot(root) {
    if (Math.abs(root.im) < EPS) {
        return factorFromRealRoot(root.re);
    }
    return `(x - (${formatComplex(root)}))`;
}

function solveQuadraticComplex(a, b, c) {
    const D = b * b - 4 * a * c;
    const twoA = 2 * a;

    let sqrtD;
    if (D >= -EPS) {
        sqrtD = { re: Math.sqrt(Math.max(0, D)), im: 0 };
    } else {
        sqrtD = { re: 0, im: Math.sqrt(-D) };
    }

    const x1 = {
        re: (-b + sqrtD.re) / twoA,
        im: sqrtD.im / twoA
    };
    const x2 = {
        re: (-b - sqrtD.re) / twoA,
        im: -sqrtD.im / twoA
    };

    return { D, sqrtD, x1, x2 };
}

function initNavigation() {
    const order = [
        'komplexni-reseni-kvadraticke-rovnice',
        'tvorba-kvadraticke-rovnice',
        'rozklad-mnohoclenu-na-soucin'
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

function drawPoint(plane, re, im, color, label) {
    const { ctx } = plane;
    const x = toCanvasX(re, plane);
    const y = toCanvasY(im, plane);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();

    if (label) {
        ctx.font = '12px Inter, sans-serif';
        ctx.fillStyle = color;
        ctx.fillText(label, x + 8, y - 8);
    }
}

function drawDashedConnector(plane, z1, z2, color = 'rgba(255,255,255,0.35)') {
    const { ctx } = plane;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(toCanvasX(z1.re, plane), toCanvasY(z1.im, plane));
    ctx.lineTo(toCanvasX(z2.re, plane), toCanvasY(z2.im, plane));
    ctx.stroke();
    ctx.restore();
}
function initQuadraticComplexDemo() {
    const canvas = document.getElementById('quadraticComplexCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, 8, 6);
    const sliders = {
        a: document.getElementById('qcASlider'),
        b: document.getElementById('qcBSlider'),
        c: document.getElementById('qcCSlider')
    };
    const randomButton = document.getElementById('qcRandomBtn');

    const outputs = {
        a: document.getElementById('qcAValue'),
        b: document.getElementById('qcBValue'),
        c: document.getElementById('qcCValue'),
        equation: document.getElementById('qcEquation'),
        discriminant: document.getElementById('qcDiscriminant'),
        sqrtD: document.getElementById('qcSqrtD'),
        root1: document.getElementById('qcRoot1'),
        root2: document.getElementById('qcRoot2'),
        rootType: document.getElementById('qcRootType'),
        sumCheck: document.getElementById('qcSumCheck'),
        productCheck: document.getElementById('qcProductCheck'),
        conjugateCheck: document.getElementById('qcConjugateCheck')
    };

    function render() {
        let a = Number.parseFloat(sliders.a.value);
        const b = Number.parseFloat(sliders.b.value);
        const c = Number.parseFloat(sliders.c.value);

        if (Math.abs(a) < EPS) {
            a = 1;
            sliders.a.value = '1';
        }

        const solution = solveQuadraticComplex(a, b, c);
        const { D, sqrtD, x1, x2 } = solution;

        outputs.a.textContent = formatNumber(a, 2);
        outputs.b.textContent = formatNumber(b, 2);
        outputs.c.textContent = formatNumber(c, 2);

        outputs.equation.textContent = `${formatPolynomial([
            { value: a, variable: 'x²' },
            { value: b, variable: 'x' },
            { value: c, variable: '' }
        ])} = 0`;

        outputs.discriminant.textContent = formatNumber(D, 3);
        outputs.sqrtD.textContent = D >= -EPS ? formatNumber(sqrtD.re, 3) : formatImagNumber(sqrtD.im, 3);
        outputs.root1.textContent = `x₁ = ${formatComplex(x1, 4)}`;
        outputs.root2.textContent = `x₂ = ${formatComplex(x2, 4)}`;

        if (D > EPS) {
            outputs.rootType.textContent = '2 různé reálné kořeny';
        } else if (Math.abs(D) <= EPS) {
            outputs.rootType.textContent = '1 dvojnásobný reálný kořen';
        } else {
            outputs.rootType.textContent = '2 komplexně sdružené kořeny';
        }

        const sum = complexAdd(x1, x2);
        const product = complexMultiply(x1, x2);
        outputs.sumCheck.textContent = `${formatComplex(sum, 4)} = ${formatNumber(-b / a, 4)}`;
        outputs.productCheck.textContent = `${formatComplex(product, 4)} = ${formatNumber(c / a, 4)}`;

        if (D < -EPS) {
            outputs.conjugateCheck.textContent = 'ano';
        } else if (Math.abs(D) <= EPS) {
            outputs.conjugateCheck.textContent = 'shodný kořen';
        } else {
            outputs.conjugateCheck.textContent = 'reálné kořeny';
        }

        drawPlane(plane);
        drawPoint(plane, x1.re, x1.im, '#60a5fa', 'x1');

        const sameRoot = Math.abs(x1.re - x2.re) < 1e-6 && Math.abs(x1.im - x2.im) < 1e-6;
        if (!sameRoot) {
            drawPoint(plane, x2.re, x2.im, '#f59e0b', 'x2');
        }

        if (Math.abs(x1.im) > EPS || Math.abs(x2.im) > EPS) {
            drawDashedConnector(plane, x1, x2);
        }
    }

    Object.values(sliders).forEach(slider => slider.addEventListener('input', render));

    randomButton.addEventListener('click', () => {
        let a = 0;
        while (Math.abs(a) < EPS) {
            a = randomInt(-4, 4);
        }

        sliders.a.value = String(a);
        sliders.b.value = String(randomInt(-12, 12));
        sliders.c.value = String(randomInt(-15, 15));
        render();
    });

    render();
}

function initQuadraticBuilderDemo() {
    const canvas = document.getElementById('builderCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, 8, 6);
    const sliders = {
        a: document.getElementById('qbASlider'),
        p: document.getElementById('qbPSlider'),
        q: document.getElementById('qbQSlider')
    };
    const randomButton = document.getElementById('qbRandomBtn');

    const outputs = {
        a: document.getElementById('qbAValue'),
        p: document.getElementById('qbPValue'),
        q: document.getElementById('qbQValue'),
        root1: document.getElementById('qbRoot1'),
        root2: document.getElementById('qbRoot2'),
        factorComplex: document.getElementById('qbFactorComplex'),
        factorReal: document.getElementById('qbFactorReal'),
        equation: document.getElementById('qbEquation'),
        sumCheck: document.getElementById('qbSumCheck'),
        productCheck: document.getElementById('qbProductCheck'),
        coeffCheck: document.getElementById('qbCoeffCheck')
    };

    function render() {
        let a = Number.parseFloat(sliders.a.value);
        const p = Number.parseFloat(sliders.p.value);
        const q = Number.parseFloat(sliders.q.value);

        if (Math.abs(a) < EPS) {
            a = 1;
            sliders.a.value = '1';
        }

        const x1 = { re: p, im: q };
        const x2 = { re: p, im: -q };

        const A = a;
        const B = -2 * a * p;
        const C = a * (p * p + q * q);

        outputs.a.textContent = formatNumber(a, 2);
        outputs.p.textContent = formatNumber(p, 2);
        outputs.q.textContent = formatNumber(q, 2);

        outputs.root1.textContent = `x₁ = ${formatComplex(x1, 4)}`;
        outputs.root2.textContent = `x₂ = ${formatComplex(x2, 4)}`;

        outputs.factorComplex.textContent = `${factorLead(a)}${factorFromComplexRoot(x1)}${factorFromComplexRoot(x2)} = 0`;
        const monoQuadratic = formatPolynomial([
            { value: 1, variable: 'x²' },
            { value: -2 * p, variable: 'x' },
            { value: p * p + q * q, variable: '' }
        ]);

        outputs.factorReal.textContent = `${factorLead(a)}(${monoQuadratic}) = 0`;
        outputs.equation.textContent = `${formatPolynomial([
            { value: A, variable: 'x²' },
            { value: B, variable: 'x' },
            { value: C, variable: '' }
        ])} = 0`;

        const sum = complexAdd(x1, x2);
        const product = complexMultiply(x1, x2);
        outputs.sumCheck.textContent = `${formatComplex(sum, 4)} = ${formatNumber(-B / A, 4)}`;
        outputs.productCheck.textContent = `${formatComplex(product, 4)} = ${formatNumber(C / A, 4)}`;
        outputs.coeffCheck.textContent = `A=${formatNumber(A, 3)}, B=${formatNumber(B, 3)}, C=${formatNumber(C, 3)}`;

        drawPlane(plane);
        drawPoint(plane, x1.re, x1.im, '#60a5fa', 'x1');
        if (Math.abs(q) > EPS) {
            drawPoint(plane, x2.re, x2.im, '#f59e0b', 'x2');
            drawDashedConnector(plane, x1, x2);
        }
    }

    Object.values(sliders).forEach(slider => slider.addEventListener('input', render));

    randomButton.addEventListener('click', () => {
        let a = 0;
        while (Math.abs(a) < EPS) {
            a = randomStep(-3, 3, 0.5);
        }

        sliders.a.value = String(a);
        sliders.p.value = String(randomStep(-5, 5, 0.5));
        sliders.q.value = String(randomStep(0, 5, 0.5));
        render();
    });

    render();
}
function initPolynomialFactorDemo() {
    const canvas = document.getElementById('factorCanvas');
    if (!canvas) {
        return;
    }

    const plane = createPlane(canvas, 8, 6);
    const sliders = {
        a: document.getElementById('fcASlider'),
        r: document.getElementById('fcRSlider'),
        p: document.getElementById('fcPSlider'),
        q: document.getElementById('fcQSlider')
    };
    const randomButton = document.getElementById('fcRandomBtn');

    const outputs = {
        a: document.getElementById('fcAValue'),
        r: document.getElementById('fcRValue'),
        p: document.getElementById('fcPValue'),
        q: document.getElementById('fcQValue'),
        polynomial: document.getElementById('fcPolynomial'),
        quotient: document.getElementById('fcQuotient'),
        factorR: document.getElementById('fcFactorR'),
        factorC: document.getElementById('fcFactorC'),
        rootsList: document.getElementById('fcRootsList'),
        pRootCheck: document.getElementById('fcPRootCheck'),
        discCheck: document.getElementById('fcDiscCheck'),
        conjugateText: document.getElementById('fcConjugateText')
    };

    function render() {
        let a = Number.parseFloat(sliders.a.value);
        const r = Number.parseFloat(sliders.r.value);
        const p = Number.parseFloat(sliders.p.value);
        const q = Number.parseFloat(sliders.q.value);

        if (Math.abs(a) < EPS) {
            a = 1;
            sliders.a.value = '1';
        }

        const A = a;
        const B = -a * (2 * p + r);
        const C = a * (2 * p * r + p * p + q * q);
        const D = -a * r * (p * p + q * q);

        const qA = a;
        const qB = -2 * a * p;
        const qC = a * (p * p + q * q);

        outputs.a.textContent = formatNumber(a, 2);
        outputs.r.textContent = formatNumber(r, 2);
        outputs.p.textContent = formatNumber(p, 2);
        outputs.q.textContent = formatNumber(q, 2);

        outputs.polynomial.textContent = formatPolynomial([
            { value: A, variable: 'x³' },
            { value: B, variable: 'x²' },
            { value: C, variable: 'x' },
            { value: D, variable: '' }
        ]);

        outputs.quotient.textContent = formatPolynomial([
            { value: qA, variable: 'x²' },
            { value: qB, variable: 'x' },
            { value: qC, variable: '' }
        ]);

        const quadraticFactor = formatPolynomial([
            { value: 1, variable: 'x²' },
            { value: -2 * p, variable: 'x' },
            { value: p * p + q * q, variable: '' }
        ]);

        outputs.factorR.textContent = `${factorLead(a)}${factorFromRealRoot(r)}(${quadraticFactor})`;

        if (Math.abs(q) > EPS) {
            const z1 = { re: p, im: q };
            const z2 = { re: p, im: -q };
            outputs.factorC.textContent = `${factorLead(a)}${factorFromRealRoot(r)}${factorFromComplexRoot(z1)}${factorFromComplexRoot(z2)}`;
            outputs.rootsList.textContent = `Kořeny: ${formatNumber(r, 3)}, ${formatComplex(z1, 3)}, ${formatComplex(z2, 3)}`;
            outputs.conjugateText.textContent = 'ano, protože Δ < 0';
        } else {
            outputs.factorC.textContent = `${factorLead(a)}${factorFromRealRoot(r)}${factorFromRealRoot(p)}${factorFromRealRoot(p)}`;
            outputs.rootsList.textContent = `Kořeny: ${formatNumber(r, 3)}, ${formatNumber(p, 3)} (dvojnásobný)`;
            outputs.conjugateText.textContent = 'q = 0, kvadratický faktor je reálný';
        }

        const pValue = A * r ** 3 + B * r ** 2 + C * r + D;
        outputs.pRootCheck.textContent = formatNumber(pValue, 6);

        const discQuadratic = -4 * q * q;
        outputs.discCheck.textContent = formatNumber(discQuadratic, 3);

        drawPlane(plane);

        const realRoot = { re: r, im: 0 };
        const z1 = { re: p, im: q };
        const z2 = { re: p, im: -q };

        drawPoint(plane, realRoot.re, realRoot.im, '#60a5fa', 'r');
        drawPoint(plane, z1.re, z1.im, '#10b981', 'z1');

        if (Math.abs(q) > EPS) {
            drawPoint(plane, z2.re, z2.im, '#f59e0b', 'z2');
            drawDashedConnector(plane, z1, z2);
        }
    }

    Object.values(sliders).forEach(slider => slider.addEventListener('input', render));

    randomButton.addEventListener('click', () => {
        let a = 0;
        while (Math.abs(a) < EPS) {
            a = randomInt(-3, 3);
        }

        sliders.a.value = String(a);
        sliders.r.value = String(randomInt(-5, 5));
        sliders.p.value = String(randomStep(-4, 4, 0.5));
        sliders.q.value = String(randomStep(0, 4, 0.5));
        render();
    });

    render();
}

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
            const expected = exercise.dataset.answer || '';
            const selected = exercise.querySelector('input[type="radio"]:checked');

            if (!selected) {
                feedback.textContent = 'Vyberte prosím jednu odpověď.';
                feedback.className = 'exercise-feedback show incorrect';
                return;
            }

            const isCorrect = selected.value === expected;

            exercise.querySelectorAll('input[type="radio"]').forEach(input => {
                input.disabled = true;
                if (input.value === expected) {
                    input.parentElement.classList.add('correct');
                }
                if (!isCorrect && input === selected) {
                    input.parentElement.classList.add('incorrect');
                }
            });

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

