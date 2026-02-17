// Skalární součin - Interactive Lesson JavaScript
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initCalcDemo();
    initAngleDemo();
    initOrthoDemo();
    initPlayground();
    initExercises();
});

// =============================================
// NAVIGATION
// =============================================

function initNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const sections = document.querySelectorAll('.lesson-section');
    const nextButtons = document.querySelectorAll('.btn-next');
    const prevButtons = document.querySelectorAll('.btn-prev');

    function showSection(sectionId) {
        sections.forEach(s => s.classList.remove('active'));
        sidebarLinks.forEach(l => l.classList.remove('active'));

        const section = document.getElementById(sectionId);
        const link = document.querySelector(`[data-section="${sectionId}"]`);

        if (section) section.classList.add('active');
        if (link) link.classList.add('active');

        updateProgress(sectionId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showSection(link.dataset.section);
        });
    });

    nextButtons.forEach(btn => {
        btn.addEventListener('click', () => showSection(btn.dataset.next));
    });

    prevButtons.forEach(btn => {
        btn.addEventListener('click', () => showSection(btn.dataset.prev));
    });

    function updateProgress(sectionId) {
        const sectionOrder = ['intro', 'calculation', 'properties', 'angle', 'ortho', 'playground', 'exercises'];
        const index = sectionOrder.indexOf(sectionId);
        const progress = ((index + 1) / sectionOrder.length) * 100;
        const fill = document.querySelector('.progress-fill-small');
        if (fill) fill.style.width = `${progress}%`;
    }

    // Handle hash in URL
    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        showSection(hash);
    }
}

// =============================================
// CANVAS UTILITIES
// =============================================

const COLORS = {
    vecU: '#ef4444',
    vecV: '#3b82f6',
    angle: '#f59e0b',
    grid: 'rgba(255, 255, 255, 0.08)',
    axis: 'rgba(255, 255, 255, 0.3)',
    bg: '#0a0a0f',
    text: 'rgba(255, 255, 255, 0.6)'
};

function setupCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 50;
    return { ctx, width, height, centerX, centerY, scale };
}

function drawGrid(ctx, width, height, centerX, centerY, scale) {
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let x = centerX % scale; x < width; x += scale) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = centerY % scale; y < height; y += scale) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
}

function drawAxes(ctx, width, height, centerX, centerY) {
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 2;
    // X axis
    ctx.beginPath(); ctx.moveTo(0, centerY); ctx.lineTo(width, centerY); ctx.stroke();
    // Y axis
    ctx.beginPath(); ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height); ctx.stroke();

    // Arrow tips
    ctx.fillStyle = COLORS.axis;
    ctx.beginPath(); ctx.moveTo(width - 10, centerY - 5); ctx.lineTo(width, centerY); ctx.lineTo(width - 10, centerY + 5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(centerX - 5, 10); ctx.lineTo(centerX, 0); ctx.lineTo(centerX + 5, 10); ctx.fill();

    // Labels
    ctx.fillStyle = COLORS.text;
    ctx.font = '13px Inter, sans-serif';
    ctx.fillText('x', width - 20, centerY - 10);
    ctx.fillText('y', centerX + 10, 20);
}

function toCanvasX(x, cX, s) { return cX + x * s; }
function toCanvasY(y, cY, s) { return cY - y * s; }
function toMathX(cx, cX, s) { return (cx - cX) / s; }
function toMathY(cy, cY, s) { return (cY - cy) / s; }

function drawVector(ctx, x1, y1, x2, y2, color, label) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Arrow head
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLen = 12;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    // Label with manually drawn arrow above letter
    if (label) {
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const perpAngle = angle + Math.PI / 2;
        const offset = 18;
        const lx = midX + Math.cos(perpAngle) * offset;
        const ly = midY + Math.sin(perpAngle) * offset;

        // Draw the letter
        ctx.fillStyle = color;
        ctx.font = 'bold italic 15px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, lx, ly);

        // Draw arrow above the letter
        const arrowY = ly - 10;
        const arrowHalfW = 6;
        const arrowHeadSize = 3;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(lx - arrowHalfW, arrowY);
        ctx.lineTo(lx + arrowHalfW, arrowY);
        ctx.stroke();
        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(lx + arrowHalfW, arrowY);
        ctx.lineTo(lx + arrowHalfW - arrowHeadSize, arrowY - arrowHeadSize);
        ctx.moveTo(lx + arrowHalfW, arrowY);
        ctx.lineTo(lx + arrowHalfW - arrowHeadSize, arrowY + arrowHeadSize);
        ctx.stroke();
    }
}

function drawDragPoint(ctx, x, y, color) {
    // Outer glow
    ctx.fillStyle = color + '40';
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();
    // Solid point
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    // Inner white dot
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
}

function drawAngleArc(ctx, cx, cy, vecU, vecV) {
    const angleU = Math.atan2(-vecU.y, vecU.x);
    const angleV = Math.atan2(-vecV.y, vecV.x);

    let startAngle = angleU;
    let endAngle = angleV;

    // Draw the smaller arc
    let diff = endAngle - startAngle;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    while (diff > Math.PI) diff -= 2 * Math.PI;

    if (diff < 0) {
        startAngle = angleU + diff;
        endAngle = angleU;
    } else {
        startAngle = angleU;
        endAngle = angleU + diff;
    }

    ctx.strokeStyle = COLORS.angle + '80';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 35, startAngle, endAngle);
    ctx.stroke();

    // Fill angle sector lightly
    ctx.fillStyle = COLORS.angle + '15';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, 35, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();
}

// Math helpers
function mag(v) { return Math.sqrt(v.x * v.x + v.y * v.y); }
function dot(u, v) { return u.x * v.x + u.y * v.y; }
function angleDeg(u, v) {
    const d = dot(u, v);
    const m = mag(u) * mag(v);
    if (m === 0) return 0;
    return Math.acos(Math.max(-1, Math.min(1, d / m))) * 180 / Math.PI;
}

// Dragging helper
function makeDraggable(canvas, centerX, centerY, scale, vectors, drawFn) {
    let dragging = null;

    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function isNear(mx, my, px, py) {
        return Math.sqrt((mx - px) ** 2 + (my - py) ** 2) < 18;
    }

    canvas.addEventListener('mousedown', (e) => {
        const pos = getMousePos(e);
        for (const key of Object.keys(vectors)) {
            const v = vectors[key];
            const cx = toCanvasX(v.x, centerX, scale);
            const cy = toCanvasY(v.y, centerY, scale);
            if (isNear(pos.x, pos.y, cx, cy)) {
                dragging = key;
                canvas.style.cursor = 'grabbing';
                break;
            }
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        const pos = getMousePos(e);
        if (dragging) {
            vectors[dragging].x = Math.round(toMathX(pos.x, centerX, scale) * 2) / 2;
            vectors[dragging].y = Math.round(toMathY(pos.y, centerY, scale) * 2) / 2;
            drawFn();
        } else {
            let nearAny = false;
            for (const key of Object.keys(vectors)) {
                const v = vectors[key];
                const cx = toCanvasX(v.x, centerX, scale);
                const cy = toCanvasY(v.y, centerY, scale);
                if (isNear(pos.x, pos.y, cx, cy)) { nearAny = true; break; }
            }
            canvas.style.cursor = nearAny ? 'grab' : 'crosshair';
        }
    });

    canvas.addEventListener('mouseup', () => {
        dragging = null;
        canvas.style.cursor = 'crosshair';
    });

    canvas.addEventListener('mouseleave', () => {
        dragging = null;
        canvas.style.cursor = 'crosshair';
    });
}

// =============================================
// CALCULATION DEMO
// =============================================

function initCalcDemo() {
    const canvas = document.getElementById('calcCanvas');
    if (!canvas) return;

    const { ctx, width, height, centerX, centerY, scale } = setupCanvas(canvas);
    const vectors = {
        u: { x: 3, y: 1 },
        v: { x: 1, y: 2 }
    };

    function draw() {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, width, height);
        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY);

        const ux = toCanvasX(vectors.u.x, centerX, scale);
        const uy = toCanvasY(vectors.u.y, centerY, scale);
        const vx = toCanvasX(vectors.v.x, centerX, scale);
        const vy = toCanvasY(vectors.v.y, centerY, scale);

        drawVector(ctx, centerX, centerY, ux, uy, COLORS.vecU, 'u');
        drawVector(ctx, centerX, centerY, vx, vy, COLORS.vecV, 'v');

        drawDragPoint(ctx, ux, uy, COLORS.vecU);
        drawDragPoint(ctx, vx, vy, COLORS.vecV);

        updateCalcInfo();
    }

    function updateCalcInfo() {
        const u = vectors.u, v = vectors.v;
        const d = dot(u, v);

        document.getElementById('calcVecU').textContent = `(${u.x.toFixed(1)}, ${u.y.toFixed(1)})`;
        document.getElementById('calcVecV').textContent = `(${v.x.toFixed(1)}, ${v.y.toFixed(1)})`;
        document.getElementById('calcResult').textContent = d.toFixed(1);

        const steps = document.getElementById('calcSteps');
        if (steps) {
            steps.innerHTML = `
                <span class="vec">u</span> · <span class="vec">v</span> = u₁·v₁ + u₂·v₂<br>
                = (${u.x.toFixed(1)})·(${v.x.toFixed(1)}) + (${u.y.toFixed(1)})·(${v.y.toFixed(1)})<br>
                = ${(u.x * v.x).toFixed(1)} + ${(u.y * v.y).toFixed(1)}<br>
                = <strong>${d.toFixed(1)}</strong>
            `;
        }
    }

    makeDraggable(canvas, centerX, centerY, scale, vectors, draw);
    draw();
}

// =============================================
// ANGLE DEMO
// =============================================

function initAngleDemo() {
    const canvas = document.getElementById('angleCanvas');
    if (!canvas) return;

    const { ctx, width, height, centerX, centerY, scale } = setupCanvas(canvas);
    const vectors = {
        u: { x: 3, y: 0 },
        v: { x: 2, y: 2 }
    };

    function draw() {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, width, height);
        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY);

        const ux = toCanvasX(vectors.u.x, centerX, scale);
        const uy = toCanvasY(vectors.u.y, centerY, scale);
        const vx = toCanvasX(vectors.v.x, centerX, scale);
        const vy = toCanvasY(vectors.v.y, centerY, scale);

        // Draw angle arc
        drawAngleArc(ctx, centerX, centerY, vectors.u, vectors.v);

        drawVector(ctx, centerX, centerY, ux, uy, COLORS.vecU, 'u');
        drawVector(ctx, centerX, centerY, vx, vy, COLORS.vecV, 'v');
        drawDragPoint(ctx, ux, uy, COLORS.vecU);
        drawDragPoint(ctx, vx, vy, COLORS.vecV);

        // Angle label
        const a = angleDeg(vectors.u, vectors.v);
        ctx.fillStyle = COLORS.angle;
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${a.toFixed(0)}°`, centerX + 50, centerY - 15);

        updateAngleInfo();
    }

    function updateAngleInfo() {
        const u = vectors.u, v = vectors.v;
        const d = dot(u, v);
        const mu = mag(u), mv = mag(v);
        const a = angleDeg(u, v);
        const cosA = (mu * mv !== 0) ? d / (mu * mv) : 0;

        document.getElementById('angleVecU').textContent = `(${u.x.toFixed(1)}, ${u.y.toFixed(1)})`;
        document.getElementById('angleVecV').textContent = `(${v.x.toFixed(1)}, ${v.y.toFixed(1)})`;
        document.getElementById('angleDot').textContent = d.toFixed(1);
        document.getElementById('angleMags').textContent = `${(mu * mv).toFixed(2)}`;
        document.getElementById('cosVal').textContent = cosA.toFixed(3);
        document.getElementById('angleVal').textContent = `${a.toFixed(1)}°`;
    }

    makeDraggable(canvas, centerX, centerY, scale, vectors, draw);
    draw();
}

// =============================================
// ORTHOGONALITY DEMO
// =============================================

function initOrthoDemo() {
    const canvas = document.getElementById('orthoCanvas');
    if (!canvas) return;

    const { ctx, width, height, centerX, centerY, scale } = setupCanvas(canvas);
    const vectors = {
        u: { x: 3, y: 1 },
        v: { x: -1, y: 3 }
    };

    function draw() {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, width, height);
        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY);

        const ux = toCanvasX(vectors.u.x, centerX, scale);
        const uy = toCanvasY(vectors.u.y, centerY, scale);
        const vx = toCanvasX(vectors.v.x, centerX, scale);
        const vy = toCanvasY(vectors.v.y, centerY, scale);

        const d = dot(vectors.u, vectors.v);
        const isOrtho = Math.abs(d) < 0.1;

        // Draw right angle indicator if orthogonal
        if (isOrtho) {
            const size = 15;
            const uDir = { x: vectors.u.x / mag(vectors.u), y: vectors.u.y / mag(vectors.u) };
            const vDir = { x: vectors.v.x / mag(vectors.v), y: vectors.v.y / mag(vectors.v) };
            const px1 = centerX + uDir.x * size * scale / 50;
            const py1 = centerY - uDir.y * size * scale / 50;
            const px2 = centerX + vDir.x * size * scale / 50;
            const py2 = centerY - vDir.y * size * scale / 50;
            const px3 = centerX + (uDir.x + vDir.x) * size * scale / 50;
            const py3 = centerY - (uDir.y + vDir.y) * size * scale / 50;

            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(px1, py1);
            ctx.lineTo(px3, py3);
            ctx.lineTo(px2, py2);
            ctx.stroke();
        }

        drawVector(ctx, centerX, centerY, ux, uy, COLORS.vecU, 'u');
        drawVector(ctx, centerX, centerY, vx, vy, COLORS.vecV, 'v');
        drawDragPoint(ctx, ux, uy, COLORS.vecU);
        drawDragPoint(ctx, vx, vy, COLORS.vecV);

        updateOrthoInfo();
    }

    function updateOrthoInfo() {
        const d = dot(vectors.u, vectors.v);
        const isOrtho = Math.abs(d) < 0.1;

        document.getElementById('orthoDot').textContent = d.toFixed(1);
        document.getElementById('orthoDot').style.color = isOrtho ? '#10b981' : '#ef4444';

        const status = document.getElementById('orthoStatus');
        if (isOrtho) {
            status.textContent = '✓ ANO — vektory jsou na sebe kolmé';
            status.style.color = '#10b981';
        } else {
            status.textContent = '✗ NE — vektory nejsou kolmé';
            status.style.color = '#ef4444';
        }
    }

    // Make orthogonal button
    const orthoBtn = document.getElementById('makeOrthoBtn');
    if (orthoBtn) {
        orthoBtn.addEventListener('click', () => {
            vectors.v.x = -vectors.u.y;
            vectors.v.y = vectors.u.x;
            draw();
        });
    }

    makeDraggable(canvas, centerX, centerY, scale, vectors, draw);
    draw();
}

// =============================================
// PLAYGROUND
// =============================================

function initPlayground() {
    const canvas = document.getElementById('playgroundCanvas');
    if (!canvas) return;

    const { ctx, width, height, centerX, centerY, scale } = setupCanvas(canvas);
    const vectors = {
        u: { x: 2, y: 1 },
        v: { x: 1, y: 3 }
    };

    function draw() {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, width, height);
        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY);

        const ux = toCanvasX(vectors.u.x, centerX, scale);
        const uy = toCanvasY(vectors.u.y, centerY, scale);
        const vx = toCanvasX(vectors.v.x, centerX, scale);
        const vy = toCanvasY(vectors.v.y, centerY, scale);

        // Draw angle arc
        drawAngleArc(ctx, centerX, centerY, vectors.u, vectors.v);

        drawVector(ctx, centerX, centerY, ux, uy, COLORS.vecU, 'u');
        drawVector(ctx, centerX, centerY, vx, vy, COLORS.vecV, 'v');
        drawDragPoint(ctx, ux, uy, COLORS.vecU);
        drawDragPoint(ctx, vx, vy, COLORS.vecV);

        updatePlaygroundInfo();
    }

    function updatePlaygroundInfo() {
        const u = vectors.u, v = vectors.v;
        const d = dot(u, v);
        const a = angleDeg(u, v);
        const mu = mag(u), mv = mag(v);
        const isOrtho = Math.abs(d) < 0.1;

        document.getElementById('playVecU').innerHTML =
            `<span class="vec">u</span> = (${u.x.toFixed(1)}, ${u.y.toFixed(1)})`;
        document.getElementById('playVecV').innerHTML =
            `<span class="vec">v</span> = (${v.x.toFixed(1)}, ${v.y.toFixed(1)})`;
        document.getElementById('playDot').textContent = d.toFixed(1);
        document.getElementById('playAngle').textContent = `${a.toFixed(1)}°`;
        document.getElementById('playMagU').textContent = mu.toFixed(2);
        document.getElementById('playMagV').textContent = mv.toFixed(2);

        const orthoStatus = document.getElementById('playOrthoStatus');
        if (isOrtho) {
            orthoStatus.innerHTML = '<span style="color: #10b981;">✓ Kolmé</span>';
        } else {
            orthoStatus.innerHTML = '<span style="color: var(--text-tertiary);">Nejsou kolmé</span>';
        }
    }

    // Reset
    const resetBtn = document.getElementById('playResetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            vectors.u.x = 2; vectors.u.y = 1;
            vectors.v.x = 1; vectors.v.y = 3;
            draw();
        });
    }

    // Make orthogonal
    const orthoBtn = document.getElementById('playOrthoBtn');
    if (orthoBtn) {
        orthoBtn.addEventListener('click', () => {
            vectors.v.x = -vectors.u.y;
            vectors.v.y = vectors.u.x;
            draw();
        });
    }

    makeDraggable(canvas, centerX, centerY, scale, vectors, draw);
    draw();
}

// =============================================
// EXERCISES
// =============================================

function initExercises() {
    const feedbackMessages = {
        1: {
            correct: 'Správně! 2·4 + (−3)·1 = 8 − 3 = 5',
            incorrect: 'Zkuste to znovu. Spočítejte 2·4 + (−3)·1.'
        },
        2: {
            correct: 'Správně! 3·(−4) + 2·6 = −12 + 12 = 0, tedy vektory jsou kolmé.',
            incorrect: 'Zkuste to znovu. Spočítejte skalární součin a ověřte, zda je roven nule.'
        },
        3: {
            correct: 'Správně! Standardní bázové vektory svírají pravý úhel.',
            incorrect: 'Tip: Spočítejte skalární součin (1,0)·(0,1) a použijte vzorec pro úhel.'
        },
        4: {
            correct: 'Správně! k·6 + 3·(−2) = 0 → 6k − 6 = 0 → k = 1',
            incorrect: 'Podmínka kolmosti: k·6 + 3·(−2) = 0. Vyřešte pro k.'
        },
        5: {
            correct: 'Správně! u · u = |u|² = 5² = 25',
            incorrect: 'Vzpomeňte si: u · u = |u|². Jaká je druhá mocnina čísla 5?'
        }
    };

    document.querySelectorAll('.btn-check').forEach(btn => {
        btn.addEventListener('click', () => {
            const exNum = btn.dataset.exercise;
            const correctVal = btn.dataset.correct;
            const exercise = document.getElementById(`exercise${exNum}`);
            const selected = exercise.querySelector(`input[name="q${exNum}"]:checked`);

            if (!selected) return;

            const isCorrect = selected.value === correctVal;
            const feedback = document.getElementById(`feedback${exNum}`);
            const status = document.getElementById(`status${exNum}`);

            // Reset all options
            exercise.querySelectorAll('.option').forEach(opt => {
                opt.classList.remove('correct', 'incorrect', 'selected');
            });

            // Mark selected
            const selectedOption = selected.closest('.option');
            selectedOption.classList.add(isCorrect ? 'correct' : 'incorrect');

            // Show correct answer if wrong
            if (!isCorrect) {
                exercise.querySelectorAll('.option').forEach(opt => {
                    const radio = opt.querySelector('input');
                    if (radio.value === correctVal) {
                        opt.classList.add('correct');
                    }
                });
            }

            // Feedback
            feedback.textContent = feedbackMessages[exNum][isCorrect ? 'correct' : 'incorrect'];
            feedback.className = `exercise-feedback show ${isCorrect ? 'correct' : 'incorrect'}`;

            // Status
            status.textContent = isCorrect ? 'Správně ✓' : 'Špatně ✗';
            status.className = `exercise-status ${isCorrect ? 'correct' : 'incorrect'}`;

            // Disable further changes
            exercise.querySelectorAll('input').forEach(inp => inp.disabled = true);
            btn.disabled = true;
            btn.textContent = isCorrect ? '✓ Správně' : '✗ Zkuste další';
        });
    });

    // Option click highlight
    document.querySelectorAll('.option').forEach(opt => {
        opt.addEventListener('click', () => {
            const exercise = opt.closest('.exercise');
            exercise.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            opt.querySelector('input').checked = true;
        });
    });
}
