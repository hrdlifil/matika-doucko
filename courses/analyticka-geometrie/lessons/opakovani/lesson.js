/* Lesson 12: Závěrečné opakování – Interactive JavaScript */
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initAccordion();
    initReview2D();
    initConicsReview();
    initReview3D();
    initExercises();
    initFinalTest();
});

/* ==============================
   NAVIGATION
   ============================== */
function initNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const sections = document.querySelectorAll('.lesson-section');
    const visited = new Set(['intro']);

    function showSection(id) {
        sections.forEach(s => s.classList.remove('active'));
        sidebarLinks.forEach(l => l.classList.remove('active'));
        const target = document.getElementById(id);
        if (target) { target.classList.add('active'); visited.add(id); }
        sidebarLinks.forEach(l => { if (l.dataset.section === id) l.classList.add('active'); });
        updateProgress();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', e => { e.preventDefault(); showSection(link.dataset.section); });
    });
    document.querySelectorAll('.btn-next').forEach(btn => {
        btn.addEventListener('click', () => showSection(btn.dataset.next));
    });
    document.querySelectorAll('.btn-prev').forEach(btn => {
        btn.addEventListener('click', () => showSection(btn.dataset.prev));
    });

    function updateProgress() {
        const total = sections.length;
        const pct = Math.round((visited.size / total) * 100);
        const fill = document.querySelector('.progress-fill-small');
        if (fill) fill.style.width = pct + '%';
    }

    if (window.location.hash) showSection(window.location.hash.slice(1));
}

/* ==============================
   FORMULA ACCORDION
   ============================== */
function initAccordion() {
    document.querySelectorAll('.category-header').forEach(header => {
        header.addEventListener('click', () => {
            const cat = header.closest('.formula-category');
            cat.classList.toggle('open');
        });
    });
    // Open first by default
    const first = document.querySelector('.formula-category');
    if (first) first.classList.add('open');
}

/* ==============================
   CANVAS UTILITIES
   ============================== */
const COLORS = {
    ptA: '#6366f1', ptB: '#f59e0b', ptS: '#10b981',
    line: '#a78bfa', vec: '#6366f1',
    grid: 'rgba(255,255,255,0.08)', axis: 'rgba(255,255,255,0.3)',
    text: 'rgba(255,255,255,0.6)'
};

function setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.width;
    const h = rect.height || canvas.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, w, h, cx: w / 2, cy: h / 2 };
}

function drawGrid(ctx, w, h, cx, cy, s) {
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let x = cx % s; x < w; x += s) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = cy % s; y < h; y += s) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
}

function drawAxes(ctx, w, h, cx, cy) {
    ctx.strokeStyle = COLORS.axis; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
    // Arrows
    ctx.fillStyle = COLORS.axis;
    ctx.beginPath(); ctx.moveTo(w - 8, cy - 5); ctx.lineTo(w, cy); ctx.lineTo(w - 8, cy + 5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - 5, 8); ctx.lineTo(cx, 0); ctx.lineTo(cx + 5, 8); ctx.fill();
    // Labels
    ctx.font = '600 12px Inter, sans-serif'; ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'left'; ctx.fillText('x', w - 18, cy - 10);
    ctx.textAlign = 'center'; ctx.fillText('y', cx + 14, 16);
}

function toCanvasX(x, cx, s) { return cx + x * s; }
function toCanvasY(y, cy, s) { return cy - y * s; }
function toMathX(px, cx, s) { return Math.round((px - cx) / s); }
function toMathY(py, cy, s) { return Math.round((cy - py) / s); }

function drawPoint(ctx, x, y, cx, cy, s, color, label, offset) {
    const px = toCanvasX(x, cx, s), py = toCanvasY(y, cy, s);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.stroke();
    if (label) {
        const ox = offset ? offset[0] : 0, oy = offset ? offset[1] : -14;
        ctx.font = '700 14px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillStyle = color;
        ctx.fillText(label, px + ox, py + oy);
    }
}

function drawVector(ctx, x1, y1, x2, y2, cx, cy, s, color, label) {
    const px1 = toCanvasX(x1, cx, s), py1 = toCanvasY(y1, cy, s);
    const px2 = toCanvasX(x2, cx, s), py2 = toCanvasY(y2, cy, s);
    ctx.strokeStyle = color; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(px1, py1); ctx.lineTo(px2, py2); ctx.stroke();
    const angle = Math.atan2(py2 - py1, px2 - px1);
    const aLen = 10;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(px2, py2);
    ctx.lineTo(px2 - aLen * Math.cos(angle - 0.3), py2 - aLen * Math.sin(angle - 0.3));
    ctx.lineTo(px2 - aLen * Math.cos(angle + 0.3), py2 - aLen * Math.sin(angle + 0.3));
    ctx.closePath(); ctx.fill();
    if (label) {
        ctx.fillStyle = color;
        ctx.font = '600 13px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(label, (px1 + px2) / 2 + 12, (py1 + py2) / 2 - 10);
    }
}

function mag(v) { return Math.sqrt(v[0] * v[0] + v[1] * v[1]); }
function mag3(x, y, z) { return Math.sqrt(x * x + y * y + z * z); }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1]; }
function dot3(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function cross3(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }

/* ==============================
   DRAGGING HELPER
   ============================== */
function makeDraggable(canvas, cx, cy, scale, points, drawFn) {
    let dragging = null, lastX, lastY;
    function getPos(e) {
        const r = canvas.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    function isNear(mx, my, px, py) {
        return Math.hypot(mx - px, my - py) < 15;
    }
    canvas.addEventListener('mousedown', e => {
        const { x, y } = getPos(e);
        for (const p of points) {
            const px = toCanvasX(p.x, cx, scale), py = toCanvasY(p.y, cy, scale);
            if (isNear(x, y, px, py)) { dragging = p; break; }
        }
    });
    canvas.addEventListener('mousemove', e => {
        if (!dragging) return;
        const { x, y } = getPos(e);
        dragging.x = toMathX(x, cx, scale);
        dragging.y = toMathY(y, cy, scale);
        dragging.x = Math.max(-6, Math.min(6, dragging.x));
        dragging.y = Math.max(-5, Math.min(5, dragging.y));
        drawFn();
    });
    canvas.addEventListener('mouseup', () => { dragging = null; });
    canvas.addEventListener('mouseleave', () => { dragging = null; });
}

/* ==============================
   2D REVIEW DEMO
   ============================== */
function initReview2D() {
    const canvas = document.getElementById('review2dCanvas');
    if (!canvas) return;
    const C = setupCanvas(canvas);
    const { ctx, w, h, cx, cy } = C;
    const s = 40;

    const ptA = { x: 2, y: 3 };
    const ptB = { x: -1, y: 1 };

    function draw() {
        const showLine = document.getElementById('r2dShowLine')?.checked;
        const showMid = document.getElementById('r2dShowMid')?.checked;

        ctx.clearRect(0, 0, w, h);
        drawGrid(ctx, w, h, cx, cy, s);
        drawAxes(ctx, w, h, cx, cy);

        // Vector AB
        const vx = ptB.x - ptA.x, vy = ptB.y - ptA.y;
        const d = Math.sqrt(vx * vx + vy * vy);
        const mx = (ptA.x + ptB.x) / 2, my = (ptA.y + ptB.y) / 2;

        // Line through A,B
        if (showLine) {
            const a = -(ptB.y - ptA.y), b = ptB.x - ptA.x;
            const c = -(a * ptA.x + b * ptA.y);
            // Draw extended line
            ctx.strokeStyle = 'rgba(167,139,250,0.4)'; ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 4]);
            if (Math.abs(b) > 0.01) {
                const x1 = -8, x2 = 8;
                const y1 = (-a * x1 - c) / b, y2 = (-a * x2 - c) / b;
                ctx.beginPath();
                ctx.moveTo(toCanvasX(x1, cx, s), toCanvasY(y1, cy, s));
                ctx.lineTo(toCanvasX(x2, cx, s), toCanvasY(y2, cy, s));
                ctx.stroke();
            }
            ctx.setLineDash([]);
        }

        // Vector arrow
        drawVector(ctx, ptA.x, ptA.y, ptB.x, ptB.y, cx, cy, s, COLORS.vec, 'AB\u2192');

        // Points
        drawPoint(ctx, ptA.x, ptA.y, cx, cy, s, COLORS.ptA, 'A');
        drawPoint(ctx, ptB.x, ptB.y, cx, cy, s, COLORS.ptB, 'B');

        // Midpoint
        if (showMid) {
            drawPoint(ctx, mx, my, cx, cy, s, COLORS.ptS, 'S');
        }

        // Update info
        document.getElementById('r2dA').textContent = `[${ptA.x}, ${ptA.y}]`;
        document.getElementById('r2dB').textContent = `[${ptB.x}, ${ptB.y}]`;
        document.getElementById('r2dVec').textContent = `(${vx}, ${vy})`;
        document.getElementById('r2dDist').textContent = d.toFixed(2);
        document.getElementById('r2dMid').textContent = `[${mx.toFixed(1)}, ${my.toFixed(1)}]`;

        // Line equation
        const a = -(ptB.y - ptA.y), b2 = ptB.x - ptA.x;
        const c2 = -(a * ptA.x + b2 * ptA.y);
        const lineEq = `${a}x + ${b2}y + ${c2} = 0`.replace(/\+ -/g, '- ');
        document.getElementById('r2dLine').textContent = lineEq;

        const slope = b2 !== 0 ? (-a / b2).toFixed(2) : '∞';
        document.getElementById('r2dSlope').textContent = slope;
    }

    makeDraggable(canvas, cx, cy, s, [ptA, ptB], draw);
    document.getElementById('r2dShowLine')?.addEventListener('change', draw);
    document.getElementById('r2dShowMid')?.addEventListener('change', draw);
    draw();
}

/* ==============================
   CONICS REVIEW
   ============================== */
function initConicsReview() {
    const canvas = document.getElementById('conicCanvas');
    if (!canvas) return;
    const C = setupCanvas(canvas);
    const { ctx, w, h, cx, cy } = C;
    const s = 40;

    let currentConic = 'circle';
    const sliderA = document.getElementById('conicSliderA');
    const sliderB = document.getElementById('conicSliderB');
    const showFoci = document.getElementById('conicShowFoci');

    const tabs = document.querySelectorAll('.conic-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentConic = tab.dataset.conic;
            updateUI();
            draw();
        });
    });

    function updateUI() {
        const paramBGroup = document.getElementById('conicParamBGroup');
        const titleEl = document.getElementById('conicTitle');
        const eqEl = document.getElementById('conicEq');
        const valuesEl = document.getElementById('conicValues');

        switch (currentConic) {
            case 'circle':
                titleEl.textContent = '\u2b55 Kru\u017enice';
                eqEl.textContent = '(x\u2212m)\u00b2 + (y\u2212n)\u00b2 = r\u00b2';
                paramBGroup.style.display = 'none';
                break;
            case 'ellipse':
                titleEl.textContent = '\u2b2d Elipsa';
                eqEl.textContent = 'x\u00b2/a\u00b2 + y\u00b2/b\u00b2 = 1';
                paramBGroup.style.display = 'block';
                break;
            case 'hyperbola':
                titleEl.textContent = '\u2194 Hyperbola';
                eqEl.textContent = 'x\u00b2/a\u00b2 \u2212 y\u00b2/b\u00b2 = 1';
                paramBGroup.style.display = 'block';
                break;
            case 'parabola':
                titleEl.textContent = '\u2312 Parabola';
                eqEl.textContent = 'y\u00b2 = 2px';
                paramBGroup.style.display = 'none';
                break;
        }
    }

    function draw() {
        const a = +sliderA.value;
        const b = +sliderB.value;

        document.getElementById('conicParamA').textContent = a;
        document.getElementById('conicParamB').textContent = b;

        ctx.clearRect(0, 0, w, h);
        drawGrid(ctx, w, h, cx, cy, s);
        drawAxes(ctx, w, h, cx, cy);

        const showF = showFoci.checked;
        const valuesEl = document.getElementById('conicValues');

        switch (currentConic) {
            case 'circle':
                drawCircle(ctx, cx, cy, s, a, showF);
                valuesEl.innerHTML = `
                    <div class="calc-step"><span>St\u0159ed</span><span class="calc-value">[0, 0]</span></div>
                    <div class="calc-step"><span>Polom\u011br r</span><span id="conicR" class="calc-value highlight">${a}</span></div>`;
                break;
            case 'ellipse':
                drawEllipse(ctx, cx, cy, s, a, b, showF);
                const ce = Math.sqrt(Math.abs(a * a - b * b));
                valuesEl.innerHTML = `
                    <div class="calc-step"><span>a</span><span class="calc-value">${a}</span></div>
                    <div class="calc-step"><span>b</span><span class="calc-value">${b}</span></div>
                    <div class="calc-step"><span>c = \u221a(a\u00b2\u2212b\u00b2)</span><span class="calc-value highlight">${ce.toFixed(2)}</span></div>
                    <div class="calc-step"><span>e = c/a</span><span class="calc-value">${(ce / a).toFixed(3)}</span></div>`;
                break;
            case 'hyperbola':
                drawHyperbola(ctx, cx, cy, s, a, b, showF);
                const ch = Math.sqrt(a * a + b * b);
                valuesEl.innerHTML = `
                    <div class="calc-step"><span>a</span><span class="calc-value">${a}</span></div>
                    <div class="calc-step"><span>b</span><span class="calc-value">${b}</span></div>
                    <div class="calc-step"><span>c = \u221a(a\u00b2+b\u00b2)</span><span class="calc-value highlight">${ch.toFixed(2)}</span></div>
                    <div class="calc-step"><span>Asymptoty</span><span class="calc-value">y = \u00b1${(b / a).toFixed(2)}x</span></div>`;
                break;
            case 'parabola':
                const p = a;
                drawParabola(ctx, cx, cy, s, p, showF);
                valuesEl.innerHTML = `
                    <div class="calc-step"><span>p</span><span class="calc-value">${p}</span></div>
                    <div class="calc-step"><span>Ohnisko F</span><span class="calc-value highlight">[${(p / 2).toFixed(1)}, 0]</span></div>
                    <div class="calc-step"><span>\u0158\u00eddic\u00ed p\u0159\u00edmka</span><span class="calc-value">x = ${(-p / 2).toFixed(1)}</span></div>`;
                break;
        }
    }

    function drawCircle(ctx, cx, cy, s, r, showF) {
        ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(cx, cy, r * s, 0, Math.PI * 2); ctx.stroke();
        // Center
        ctx.fillStyle = COLORS.ptS;
        ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
        ctx.font = '600 12px Inter'; ctx.textAlign = 'center';
        ctx.fillText('S', cx + 12, cy - 10);
    }

    function drawEllipse(ctx, cx, cy, s, a, b, showF) {
        ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let t = 0; t <= Math.PI * 2; t += 0.02) {
            const x = cx + a * Math.cos(t) * s;
            const y = cy - b * Math.sin(t) * s;
            if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath(); ctx.stroke();
        if (showF) {
            const c = Math.sqrt(Math.abs(a * a - b * b));
            drawPoint(ctx, c, 0, cx, cy, s, '#ef4444', 'F\u2081', [0, 14]);
            drawPoint(ctx, -c, 0, cx, cy, s, '#ef4444', 'F\u2082', [0, 14]);
        }
    }

    function drawHyperbola(ctx, cx, cy, s, a, b, showF) {
        // Draw asymptotes
        ctx.strokeStyle = 'rgba(245,158,11,0.3)'; ctx.lineWidth = 1;
        ctx.setLineDash([6, 4]);
        const slope = b / a;
        const x1 = -7, x2 = 7;
        ctx.beginPath();
        ctx.moveTo(toCanvasX(x1, cx, s), toCanvasY(slope * x1, cy, s));
        ctx.lineTo(toCanvasX(x2, cx, s), toCanvasY(slope * x2, cy, s));
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(toCanvasX(x1, cx, s), toCanvasY(-slope * x1, cy, s));
        ctx.lineTo(toCanvasX(x2, cx, s), toCanvasY(-slope * x2, cy, s));
        ctx.stroke();
        ctx.setLineDash([]);

        // Right branch
        ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let t = -1.5; t <= 1.5; t += 0.02) {
            const x = a * Math.cosh(t), y = b * Math.sinh(t);
            const px = cx + x * s, py = cy - y * s;
            if (t === -1.5) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
        // Left branch
        ctx.beginPath();
        for (let t = -1.5; t <= 1.5; t += 0.02) {
            const x = -a * Math.cosh(t), y = b * Math.sinh(t);
            const px = cx + x * s, py = cy - y * s;
            if (t === -1.5) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();

        if (showF) {
            const c = Math.sqrt(a * a + b * b);
            drawPoint(ctx, c, 0, cx, cy, s, '#ef4444', 'F\u2081', [0, 14]);
            drawPoint(ctx, -c, 0, cx, cy, s, '#ef4444', 'F\u2082', [0, 14]);
        }
    }

    function drawParabola(ctx, cx, cy, s, p, showF) {
        ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let t = -5; t <= 5; t += 0.05) {
            const y = t, x = (t * t) / (2 * p);
            const px = cx + x * s, py = cy - y * s;
            if (t === -5) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Directrix
        ctx.strokeStyle = 'rgba(245,158,11,0.4)'; ctx.lineWidth = 1;
        ctx.setLineDash([6, 4]);
        const dx = cx + (-p / 2) * s;
        ctx.beginPath(); ctx.moveTo(dx, 0); ctx.lineTo(dx, h); ctx.stroke();
        ctx.setLineDash([]);

        if (showF) {
            drawPoint(ctx, p / 2, 0, cx, cy, s, '#ef4444', 'F', [0, 14]);
        }
    }

    sliderA.addEventListener('input', draw);
    sliderB.addEventListener('input', draw);
    showFoci.addEventListener('change', draw);
    updateUI();
    draw();
}

/* ==============================
   3D REVIEW
   ============================== */
function initReview3D() {
    const canvas = document.getElementById('review3dCanvas');
    if (!canvas) return;
    const C = setupCanvas(canvas);
    const { ctx, w, h, cx, cy } = C;
    const cam = { rotX: -0.5, rotY: 0.6 };
    const sc = 40;

    const sl = {
        u1: document.getElementById('r3U1S'), u2: document.getElementById('r3U2S'), u3: document.getElementById('r3U3S'),
        v1: document.getElementById('r3V1S'), v2: document.getElementById('r3V2S'), v3: document.getElementById('r3V3S'),
    };

    function project(x, y, z) {
        const cosX = Math.cos(cam.rotX), sinX = Math.sin(cam.rotX);
        const cosY = Math.cos(cam.rotY), sinY = Math.sin(cam.rotY);
        let x1 = x * cosY - z * sinY;
        let z1 = x * sinY + z * cosY;
        let y1 = y * cosX - z1 * sinX;
        return { px: cx + x1 * sc, py: cy - y1 * sc };
    }

    function draw3DAxes() {
        const len = 4;
        const colors = ['#ef4444', '#10b981', '#3b82f6'];
        const labels = ['x', 'y', 'z'];
        const dirs = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

        // Grid on XZ plane
        ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 0.5;
        for (let i = -len; i <= len; i++) {
            let a = project(i, 0, -len), b = project(i, 0, len);
            ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
            a = project(-len, 0, i); b = project(len, 0, i);
            ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
        }

        for (let a = 0; a < 3; a++) {
            const o = project(0, 0, 0);
            const tip = project(dirs[a][0] * len, dirs[a][1] * len, dirs[a][2] * len);
            ctx.strokeStyle = colors[a]; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(o.px, o.py); ctx.lineTo(tip.px, tip.py); ctx.stroke();
            ctx.fillStyle = colors[a];
            ctx.beginPath(); ctx.arc(tip.px, tip.py, 3, 0, Math.PI * 2); ctx.fill();
            ctx.font = '600 13px Inter, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(labels[a], tip.px + 10, tip.py - 5);
        }
    }

    function draw3DVector(ox, oy, oz, dx, dy, dz, color, label) {
        const from = project(ox, oy, oz);
        const to = project(ox + dx, oy + dy, oz + dz);
        ctx.strokeStyle = color; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(from.px, from.py); ctx.lineTo(to.px, to.py); ctx.stroke();
        const angle = Math.atan2(to.py - from.py, to.px - from.px);
        const aLen = 10;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(to.px, to.py);
        ctx.lineTo(to.px - aLen * Math.cos(angle - 0.3), to.py - aLen * Math.sin(angle - 0.3));
        ctx.lineTo(to.px - aLen * Math.cos(angle + 0.3), to.py - aLen * Math.sin(angle + 0.3));
        ctx.closePath(); ctx.fill();
        if (label) {
            ctx.fillStyle = color;
            ctx.font = '600 13px Inter, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(label, to.px + 12, to.py - 8);
        }
    }

    function draw() {
        const u = [+sl.u1.value, +sl.u2.value, +sl.u3.value];
        const v = [+sl.v1.value, +sl.v2.value, +sl.v3.value];

        document.getElementById('r3U1').textContent = u[0];
        document.getElementById('r3U2').textContent = u[1];
        document.getElementById('r3U3').textContent = u[2];
        document.getElementById('r3V1').textContent = v[0];
        document.getElementById('r3V2').textContent = v[1];
        document.getElementById('r3V3').textContent = v[2];

        const dp = dot3(u, v);
        const cr = cross3(u, v);
        const crMag = mag3(...cr);
        const mu = mag3(...u), mv = mag3(...v);
        let angle = 0;
        if (mu > 0 && mv > 0) angle = Math.acos(Math.min(1, Math.max(-1, dp / (mu * mv)))) * 180 / Math.PI;

        document.getElementById('r3Dot').textContent = dp;
        document.getElementById('r3Cross').textContent = `(${cr[0]}, ${cr[1]}, ${cr[2]})`;
        document.getElementById('r3CrossMag').textContent = crMag.toFixed(2);
        document.getElementById('r3Angle').textContent = angle.toFixed(1) + '\u00b0';

        ctx.clearRect(0, 0, w, h);
        draw3DAxes();

        draw3DVector(0, 0, 0, u[0], u[1], u[2], '#6366f1', 'u\u2192');
        draw3DVector(0, 0, 0, v[0], v[1], v[2], '#f59e0b', 'v\u2192');
        if (crMag > 0.1) {
            // Normalize cross product for display
            const scale = Math.min(3, crMag);
            const cn = [cr[0] / crMag * scale, cr[1] / crMag * scale, cr[2] / crMag * scale];
            draw3DVector(0, 0, 0, cn[0], cn[1], cn[2], '#10b981', 'u\u2192\u00d7v\u2192');
        }
    }

    // Attach rotation
    let dragging = false, lastX, lastY;
    canvas.style.cursor = 'grab';
    canvas.addEventListener('mousedown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.style.cursor = 'grabbing'; });
    canvas.addEventListener('mousemove', e => {
        if (!dragging) return;
        cam.rotY += (e.clientX - lastX) * 0.008;
        cam.rotX += (e.clientY - lastY) * 0.008;
        cam.rotX = Math.max(-1.2, Math.min(0.4, cam.rotX));
        lastX = e.clientX; lastY = e.clientY;
        draw();
    });
    canvas.addEventListener('mouseup', () => { dragging = false; canvas.style.cursor = 'grab'; });
    canvas.addEventListener('mouseleave', () => { dragging = false; canvas.style.cursor = 'grab'; });

    Object.values(sl).forEach(s => s.addEventListener('input', draw));
    draw();
}

/* ==============================
   EXERCISES
   ============================== */
function initExercises() {
    const feedbackMessages = {
        1: { correct: '\u2705 Spr\u00e1vn\u011b! |\u{1d416}| = \u221a(9 + 16) = \u221a25 = 5.', incorrect: '\u274c Zkuste znovu. |u\u2192| = \u221a(3\u00b2 + (-4)\u00b2) = \u221a(9+16) = 5.' },
        2: { correct: '\u2705 Spr\u00e1vn\u011b! u\u2192\u00b7v\u2192 = 2\u00b7(-3) + 3\u00b72 = -6 + 6 = 0 \u2192 kolm\u00e9.', incorrect: '\u274c Zkuste znovu. Spo\u010d\u00edtejte: u\u2192\u00b7v\u2192 = 2\u00b7(-3) + 3\u00b72 = 0.' },
        3: { correct: '\u2705 Spr\u00e1vn\u011b! d = |3\u00b73 + 4\u00b74 - 10| / \u221a(9+16) = |15| / 5 = 3.', incorrect: '\u274c Zkuste znovu. Dosa\u010fte do vzorce d = |ax\u2080+by\u2080+c| / \u221a(a\u00b2+b\u00b2).' },
        4: { correct: '\u2705 Spr\u00e1vn\u011b! k = (y\u2082-y\u2081)/(x\u2082-x\u2081) = (6-2)/(3-1) = 4/2 = 2.', incorrect: '\u274c Zkuste znovu. Sm\u011brnice k = \u0394y/\u0394x = (6-2)/(3-1) = 2.' },
        5: { correct: '\u2705 Spr\u00e1vn\u011b! St\u0159ed [2, -1], polom\u011br r = \u221a9 = 3.', incorrect: '\u274c Zkuste znovu. V (x-m)\u00b2 + (y-n)\u00b2 = r\u00b2 je S = [m, n], r = \u221ar\u00b2.' },
        6: { correct: '\u2705 Spr\u00e1vn\u011b! c\u00b2 = a\u00b2 - b\u00b2 = 25-9 = 16, c = 4, 2c = 8.', incorrect: '\u274c Zkuste znovu. Pro elipsu: c\u00b2 = a\u00b2 - b\u00b2.' },
        7: { correct: '\u2705 Spr\u00e1vn\u011b! Asymptoty hyperboly x\u00b2/a\u00b2 - y\u00b2/b\u00b2 = 1 jsou y = \u00b1(b/a)x = \u00b1(3/2)x.', incorrect: '\u274c Zkuste znovu. Asymptoty: y = \u00b1(b/a)x.' },
        8: { correct: '\u2705 Spr\u00e1vn\u011b! y\u00b2 = 2px \u2192 2p = 8, p = 4, F = [p/2, 0] = [2, 0].', incorrect: '\u274c Zkuste znovu. y\u00b2 = 2px: ohnisko F = [p/2, 0].' },
        9: { correct: '\u2705 Spr\u00e1vn\u011b! n\u2081 = (2,-1), n\u2082 = (1,2), n\u2081\u00b7n\u2082 = 2-2 = 0 \u2192 kolm\u00e9 (90\u00b0).', incorrect: '\u274c Zkuste znovu. Norm\u00e1ly: (2,-1) a (1,2). Spo\u010d\u00edtejte skal\u00e1rn\u00ed sou\u010din.' },
        10: { correct: '\u2705 Spr\u00e1vn\u011b! |AB| = \u221a(9+16+0) = \u221a25 = 5.', incorrect: '\u274c Zkuste znovu. |AB| = \u221a((4-1)\u00b2 + (4-0)\u00b2 + (2-2)\u00b2) = \u221a25 = 5.' },
        11: { correct: '\u2705 Spr\u00e1vn\u011b! u\u2192\u00d7v\u2192 = (0,0,3), |u\u2192\u00d7v\u2192| = 3 = plocha rovnob\u011b\u017en\u00edku.', incorrect: '\u274c Zkuste znovu. Plocha = |u\u2192\u00d7v\u2192|. Vypo\u010dt\u011bte vektorov\u00fd sou\u010din.' },
        12: { correct: '\u2705 Spr\u00e1vn\u011b! d = |0+0+0-3| / \u221a(4+4+1) = 3/3 = 1.', incorrect: '\u274c Zkuste znovu. d = |ax\u2080+by\u2080+cz\u2080+d| / \u221a(a\u00b2+b\u00b2+c\u00b2).' },
    };

    let correctCount = 0;

    document.querySelectorAll('.exercise .btn-check').forEach(btn => {
        btn.addEventListener('click', () => {
            const n = btn.dataset.exercise;
            const correct = btn.dataset.correct;
            const sel = document.querySelector(`input[name="ex${n}"]:checked`);
            if (!sel) return;
            const ok = sel.value === correct;

            if (ok && !btn.dataset.answered) {
                correctCount++;
                btn.dataset.answered = 'true';
            }

            const fb = document.getElementById(`ex${n}Feedback`);
            const st = document.getElementById(`ex${n}Status`);
            fb.textContent = feedbackMessages[n][ok ? 'correct' : 'incorrect'];
            fb.className = 'exercise-feedback show ' + (ok ? 'correct' : 'incorrect');
            st.textContent = ok ? '\u2713 Spr\u00e1vn\u011b' : '\u2717 \u0160patn\u011b';
            st.className = 'exercise-status ' + (ok ? 'correct' : 'incorrect');

            document.querySelectorAll(`input[name="ex${n}"]`).forEach(input => {
                const opt = input.closest('.option');
                opt.classList.remove('correct', 'incorrect');
                if (input.value === correct) opt.classList.add('correct');
                else if (input.checked) opt.classList.add('incorrect');
            });

            updateScore();
        });
    });

    function updateScore() {
        document.getElementById('exerciseScore').textContent = correctCount;
        const pct = (correctCount / 12) * 100;
        document.getElementById('scoreFill').style.width = pct + '%';
    }
}

/* ==============================
   FINAL TEST
   ============================== */
function initFinalTest() {
    const testQuestions = [
        {
            q: 'St\u0159ed \u00fase\u010dky AB, kde A = [2, 6] a B = [8, 2], je:',
            opts: ['[5, 4]', '[10, 8]', '[6, 4]', '[3, 2]'],
            correct: 0
        },
        {
            q: 'Jak\u00e1 je velikost vektoru \u{1d416} = (5, 12)?',
            opts: ['17', '13', '\u221a17', '7'],
            correct: 1
        },
        {
            q: 'Jak\u00fd je skal\u00e1rn\u00ed sou\u010din vektor\u016f (1, 0) a (0, 1)?',
            opts: ['1', '0', '\u22121', '2'],
            correct: 1
        },
        {
            q: 'P\u0159\u00edmka 2x \u2212 y + 3 = 0 m\u00e1 sm\u011brnici k =',
            opts: ['2', '\u22122', '1/2', '3'],
            correct: 0
        },
        {
            q: 'Kru\u017enice x\u00b2 + y\u00b2 \u2212 6x + 4y + 4 = 0 m\u00e1 st\u0159ed:',
            opts: ['[3, \u22122]', '[\u22123, 2]', '[6, \u22124]', '[3, 2]'],
            correct: 0
        },
        {
            q: 'Elipsa x\u00b2/16 + y\u00b2/9 = 1 m\u00e1 excentricitu e =',
            opts: ['\u221a7/4', '7/4', '3/4', '4/3'],
            correct: 0
        },
        {
            q: 'Jak\u00fd je norm\u00e1lov\u00fd vektor roviny 3x \u2212 2y + z \u2212 5 = 0?',
            opts: ['(3, \u22122, 1)', '(3, 2, 1)', '(3, \u22122, \u22125)', '(\u22123, 2, \u22121)'],
            correct: 0
        },
        {
            q: 'Vzd\u00e1lenost bodu [0, 0] od p\u0159\u00edmky 3x + 4y \u2212 15 = 0 je:',
            opts: ['3', '15', '5', '\u221a15'],
            correct: 0
        },
        {
            q: 'Vektorov\u00fd sou\u010din (1, 0, 0) \u00d7 (0, 1, 0) =',
            opts: ['(0, 0, 1)', '(0, 0, \u22121)', '(1, 1, 0)', '0'],
            correct: 0
        },
        {
            q: 'Parabola x\u00b2 = 12y m\u00e1 ohnisko v bod\u011b:',
            opts: ['[0, 3]', '[3, 0]', '[0, 6]', '[0, 12]'],
            correct: 0
        }
    ];

    let currentQ = 0;
    let answers = new Array(testQuestions.length).fill(-1);
    let timerInterval = null;
    let timeLeft = 15 * 60; // 15 minutes in seconds
    let testStartTime = 0;
    let testActive = false;

    const startBtn = document.getElementById('testStartBtn');
    const startScreen = document.getElementById('testStart');
    const container = document.getElementById('testContainer');
    const resultsScreen = document.getElementById('testResults');
    const retryBtn = document.getElementById('testRetry');
    const prevBtn = document.getElementById('testPrev');
    const nextBtn = document.getElementById('testNext');

    if (!startBtn) return;

    startBtn.addEventListener('click', startTest);
    retryBtn.addEventListener('click', retryTest);
    prevBtn.addEventListener('click', () => { if (currentQ > 0) { currentQ--; renderQuestion(); } });
    nextBtn.addEventListener('click', () => {
        if (currentQ < testQuestions.length - 1) {
            currentQ++;
            renderQuestion();
        } else {
            finishTest();
        }
    });

    function startTest() {
        startScreen.style.display = 'none';
        container.classList.add('active');
        resultsScreen.style.display = 'none';
        testActive = true;
        testStartTime = Date.now();
        timeLeft = 15 * 60;
        currentQ = 0;
        answers = new Array(testQuestions.length).fill(-1);
        renderQuestion();
        timerInterval = setInterval(updateTimer, 1000);
    }

    function retryTest() {
        resultsScreen.style.display = 'none';
        startScreen.style.display = 'block';
        container.classList.remove('active');
    }

    function updateTimer() {
        timeLeft--;
        if (timeLeft <= 0) {
            finishTest();
            return;
        }
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        const display = document.getElementById('timerDisplay');
        display.textContent = `${m}:${s.toString().padStart(2, '0')}`;

        const timerEl = document.querySelector('.test-timer');
        timerEl.classList.remove('warning', 'danger');
        if (timeLeft < 60) timerEl.classList.add('danger');
        else if (timeLeft < 180) timerEl.classList.add('warning');
    }

    function renderQuestion() {
        const q = testQuestions[currentQ];
        const questionEl = document.getElementById('testQuestion');

        let html = `<p><strong>Ot\u00e1zka ${currentQ + 1}.</strong> ${q.q}</p>`;
        html += '<div class="test-options">';
        q.opts.forEach((opt, i) => {
            const selected = answers[currentQ] === i ? 'selected' : '';
            html += `<label class="test-option ${selected}">
                <input type="radio" name="testQ" value="${i}" ${answers[currentQ] === i ? 'checked' : ''}>
                <span>${opt}</span>
            </label>`;
        });
        html += '</div>';
        questionEl.innerHTML = html;

        // Bind option clicks
        questionEl.querySelectorAll('.test-option').forEach(opt => {
            opt.addEventListener('click', () => {
                const input = opt.querySelector('input');
                input.checked = true;
                answers[currentQ] = parseInt(input.value);
                questionEl.querySelectorAll('.test-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
            });
        });

        document.getElementById('testCurrent').textContent = currentQ + 1;
        prevBtn.disabled = currentQ === 0;
        nextBtn.textContent = currentQ === testQuestions.length - 1 ? 'Vyhodnotit \u2713' : 'Dal\u0161\u00ed \u2192';
    }

    function finishTest() {
        clearInterval(timerInterval);
        testActive = false;
        container.classList.remove('active');

        const elapsed = Math.floor((Date.now() - testStartTime) / 1000);
        const em = Math.floor(elapsed / 60);
        const es = elapsed % 60;

        let score = 0;
        testQuestions.forEach((q, i) => {
            if (answers[i] === q.correct) score++;
        });

        resultsScreen.style.display = 'block';

        document.getElementById('resultScore').textContent = score;
        document.getElementById('resultTime').textContent = `${em}:${es.toString().padStart(2, '0')}`;

        const pct = (score / testQuestions.length) * 100;
        const fill = document.getElementById('resultsFill');
        fill.style.width = '0%';
        setTimeout(() => { fill.style.width = pct + '%'; }, 100);

        if (pct >= 80) {
            fill.className = 'results-fill excellent';
            document.getElementById('resultsIcon').textContent = '\ud83c\udf89';
            document.getElementById('resultsTitle').textContent = 'V\u00fdborn\u011b!';
            document.getElementById('resultsMsg').textContent = 'Skv\u011bl\u00fd v\u00fdsledek! Jste p\u0159ipraveni na zkou\u0161ku.';
        } else if (pct >= 50) {
            fill.className = 'results-fill good';
            document.getElementById('resultsIcon').textContent = '\ud83d\udc4d';
            document.getElementById('resultsTitle').textContent = 'Dobr\u00fd v\u00fdsledek';
            document.getElementById('resultsMsg').textContent = 'Zopakujte si t\u00e9mata, kde jste chybovali.';
        } else {
            fill.className = 'results-fill poor';
            document.getElementById('resultsIcon').textContent = '\ud83d\udcda';
            document.getElementById('resultsTitle').textContent = 'Pot\u0159ebujete opakov\u00e1n\u00ed';
            document.getElementById('resultsMsg').textContent = 'Vra\u0165te se k p\u0159edchoz\u00edm kapitol\u00e1m a posilte sv\u00e9 znalosti.';
        }

        // Detail dots
        const detail = document.getElementById('resultsDetail');
        detail.innerHTML = '';
        testQuestions.forEach((q, i) => {
            const cls = answers[i] === -1 ? 'unanswered' : (answers[i] === q.correct ? 'correct' : 'incorrect');
            const icon = answers[i] === -1 ? '?' : (answers[i] === q.correct ? '\u2713' : '\u2717');
            detail.innerHTML += `<div class="result-dot ${cls}">${icon}</div>`;
        });

        // Show course complete if score >= 8
        if (score >= 8) {
            setTimeout(() => {
                const complete = document.getElementById('lessonComplete');
                if (complete) complete.style.display = 'block';
            }, 1500);
        }
    }
}
