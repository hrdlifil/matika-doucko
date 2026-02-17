/* Lesson 11: Analytická geometrie v prostoru – Interactive JavaScript */
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initCoordDemo();
    initVectorDemo();
    initCrossDemo();
    initLineDemo();
    initPlaneDemo();
    initPlayground();
    initExercises();
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
   3D PROJECTION ENGINE
   ============================== */
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

// Camera / rotation state factory
function createCam(rotX, rotY) {
    return { rotX: rotX || -0.5, rotY: rotY || 0.6 };
}

// 3D → 2D isometric-like projection
function project(x, y, z, cam, cx, cy, scale) {
    const s = scale || 40;
    const cosX = Math.cos(cam.rotX), sinX = Math.sin(cam.rotX);
    const cosY = Math.cos(cam.rotY), sinY = Math.sin(cam.rotY);
    // Rotate around Y
    let x1 = x * cosY - z * sinY;
    let z1 = x * sinY + z * cosY;
    // Rotate around X
    let y1 = y * cosX - z1 * sinX;
    let z2 = y * sinX + z1 * cosX;
    // Simple projection (no perspective for clarity)
    return { px: cx + x1 * s, py: cy - y1 * s, depth: z2 };
}

// Attach drag-to-rotate to canvas
function attachRotation(canvas, cam, onDraw) {
    let dragging = false, lastX, lastY;
    canvas.addEventListener('mousedown', e => {
        dragging = true; lastX = e.clientX; lastY = e.clientY;
        canvas.style.cursor = 'grabbing';
    });
    canvas.addEventListener('mousemove', e => {
        if (!dragging) return;
        cam.rotY += (e.clientX - lastX) * 0.008;
        cam.rotX += (e.clientY - lastY) * 0.008;
        cam.rotX = Math.max(-1.2, Math.min(0.4, cam.rotX));
        lastX = e.clientX; lastY = e.clientY;
        onDraw();
    });
    canvas.addEventListener('mouseup', () => { dragging = false; canvas.style.cursor = 'grab'; });
    canvas.addEventListener('mouseleave', () => { dragging = false; canvas.style.cursor = 'grab'; });
}

// Draw 3D axes
function draw3DAxes(ctx, cam, cx, cy, w, h, scale) {
    const s = scale || 40;
    const len = 5;
    const colors = ['#ef4444', '#10b981', '#3b82f6']; // x, y, z
    const labels = ['x', 'y', 'z'];
    const dirs = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

    // Grid on XZ plane (at y=0)
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    for (let i = -len; i <= len; i++) {
        const a = project(i, 0, -len, cam, cx, cy, s);
        const b = project(i, 0, len, cam, cx, cy, s);
        ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
        const c = project(-len, 0, i, cam, cx, cy, s);
        const d = project(len, 0, i, cam, cx, cy, s);
        ctx.beginPath(); ctx.moveTo(c.px, c.py); ctx.lineTo(d.px, d.py); ctx.stroke();
    }

    // Axes
    for (let a = 0; a < 3; a++) {
        const o = project(0, 0, 0, cam, cx, cy, s);
        const tip = project(dirs[a][0] * len, dirs[a][1] * len, dirs[a][2] * len, cam, cx, cy, s);
        const neg = project(-dirs[a][0] * len, -dirs[a][1] * len, -dirs[a][2] * len, cam, cx, cy, s);
        // Negative half
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(o.px, o.py); ctx.lineTo(neg.px, neg.py); ctx.stroke();
        ctx.setLineDash([]);
        // Positive half
        ctx.strokeStyle = colors[a]; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(o.px, o.py); ctx.lineTo(tip.px, tip.py); ctx.stroke();
        // Arrow
        ctx.fillStyle = colors[a];
        ctx.beginPath(); ctx.arc(tip.px, tip.py, 3, 0, Math.PI * 2); ctx.fill();
        // Label
        ctx.font = '600 13px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(labels[a], tip.px + 10, tip.py - 5);
        // Ticks on positive
        for (let t = 1; t <= len - 1; t++) {
            const tp = project(dirs[a][0] * t, dirs[a][1] * t, dirs[a][2] * t, cam, cx, cy, s);
            ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.font = '10px Inter';
            ctx.fillText(t, tp.px + 4, tp.py - 4);
        }
    }
    // Origin
    const oP = project(0, 0, 0, cam, cx, cy, s);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '600 12px Inter, sans-serif'; ctx.textAlign = 'right';
    ctx.fillText('0', oP.px - 6, oP.py + 14);
}

// Draw 3D point
function draw3DPoint(ctx, x, y, z, cam, cx, cy, s, color, label, labelOff) {
    const p = project(x, y, z, cam, cx, cy, s);
    // Drop-line to XZ plane
    const pFloor = project(x, 0, z, cam, cx, cy, s);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(pFloor.px, pFloor.py); ctx.stroke();
    ctx.setLineDash([]);
    // Shadow dot
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath(); ctx.arc(pFloor.px, pFloor.py, 3, 0, Math.PI * 2); ctx.fill();
    // Point
    ctx.fillStyle = color || '#f59e0b';
    ctx.beginPath(); ctx.arc(p.px, p.py, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.stroke();
    // Label
    if (label) {
        const ox = labelOff ? labelOff[0] : 0, oy = labelOff ? labelOff[1] : -14;
        ctx.fillStyle = color || '#f59e0b';
        ctx.font = '600 14px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(label, p.px + ox, p.py + oy);
    }
}

// Draw 3D vector (from origin or from a point)
function draw3DVector(ctx, ox, oy, oz, dx, dy, dz, cam, cx, cy, s, color, label) {
    const from = project(ox, oy, oz, cam, cx, cy, s);
    const to = project(ox + dx, oy + dy, oz + dz, cam, cx, cy, s);
    ctx.strokeStyle = color || '#6366f1'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(from.px, from.py); ctx.lineTo(to.px, to.py); ctx.stroke();
    // Arrowhead
    const angle = Math.atan2(to.py - from.py, to.px - from.px);
    const aLen = 10;
    ctx.fillStyle = color || '#6366f1';
    ctx.beginPath();
    ctx.moveTo(to.px, to.py);
    ctx.lineTo(to.px - aLen * Math.cos(angle - 0.3), to.py - aLen * Math.sin(angle - 0.3));
    ctx.lineTo(to.px - aLen * Math.cos(angle + 0.3), to.py - aLen * Math.sin(angle + 0.3));
    ctx.closePath(); ctx.fill();
    if (label) {
        ctx.fillStyle = color || '#6366f1';
        ctx.font = '600 13px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(label, to.px + 12, to.py - 8);
    }
}

// Draw 3D dashed line between two 3D points
function draw3DDashed(ctx, x1, y1, z1, x2, y2, z2, cam, cx, cy, s, color) {
    const a = project(x1, y1, z1, cam, cx, cy, s);
    const b = project(x2, y2, z2, cam, cx, cy, s);
    ctx.strokeStyle = color || '#10b981'; ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
    ctx.setLineDash([]);
}

// Draw 3D line (infinite extent through point with direction)
function draw3DLine(ctx, ax, ay, az, dx, dy, dz, cam, cx, cy, s, color) {
    const tMin = -6, tMax = 6;
    ctx.strokeStyle = color || '#6366f1'; ctx.lineWidth = 2;
    ctx.beginPath();
    let first = true;
    for (let t = tMin; t <= tMax; t += 0.1) {
        const p = project(ax + dx * t, ay + dy * t, az + dz * t, cam, cx, cy, s);
        if (first) { ctx.moveTo(p.px, p.py); first = false; }
        else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
}

// Draw a filled plane quad
function draw3DPlane(ctx, pts, cam, cx, cy, s, color) {
    const projected = pts.map(p => project(p[0], p[1], p[2], cam, cx, cy, s));
    ctx.fillStyle = color || 'rgba(99,102,241,0.15)';
    ctx.strokeStyle = color ? color.replace('0.15', '0.4') : 'rgba(99,102,241,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(projected[0].px, projected[0].py);
    for (let i = 1; i < projected.length; i++) ctx.lineTo(projected[i].px, projected[i].py);
    ctx.closePath(); ctx.fill(); ctx.stroke();
}

function dist3(x1, y1, z1, x2, y2, z2) { return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2); }
function mag3(x, y, z) { return Math.sqrt(x * x + y * y + z * z); }
function dot3(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function cross3(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }

/* ==============================
   COORDINATES DEMO
   ============================== */
function initCoordDemo() {
    const canvas = document.getElementById('coordCanvas');
    if (!canvas) return;
    const C = setupCanvas(canvas);
    const { ctx, w, h, cx, cy } = C;
    const cam = createCam(-0.45, 0.65);
    const s = 40;

    const sliders = {
        ax: document.getElementById('coordAxSlider'),
        ay: document.getElementById('coordAySlider'),
        az: document.getElementById('coordAzSlider'),
        bx: document.getElementById('coordBxSlider'),
        by: document.getElementById('coordBySlider'),
        bz: document.getElementById('coordBzSlider'),
    };

    function draw() {
        const ax = +sliders.ax.value, ay = +sliders.ay.value, az = +sliders.az.value;
        const bx = +sliders.bx.value, by = +sliders.by.value, bz = +sliders.bz.value;

        document.getElementById('coordAx').textContent = ax;
        document.getElementById('coordAy').textContent = ay;
        document.getElementById('coordAz').textContent = az;
        document.getElementById('coordBx').textContent = bx;
        document.getElementById('coordBy').textContent = by;
        document.getElementById('coordBz').textContent = bz;

        const d = dist3(ax, ay, az, bx, by, bz);
        const mx = (ax + bx) / 2, my2 = (ay + by) / 2, mz = (az + bz) / 2;
        document.getElementById('coordDist').textContent = d.toFixed(2);
        document.getElementById('coordMid').textContent = `[${mx.toFixed(1)}, ${my2.toFixed(1)}, ${mz.toFixed(1)}]`;

        ctx.clearRect(0, 0, w, h);
        draw3DAxes(ctx, cam, cx, cy, w, h, s);

        // Segment A-B
        draw3DDashed(ctx, ax, ay, az, bx, by, bz, cam, cx, cy, s, '#f59e0b');

        // Midpoint
        draw3DPoint(ctx, mx, my2, mz, cam, cx, cy, s, '#10b981', 'S', [0, -16]);

        // Points
        draw3DPoint(ctx, ax, ay, az, cam, cx, cy, s, '#6366f1', 'A', [0, -16]);
        draw3DPoint(ctx, bx, by, bz, cam, cx, cy, s, '#f59e0b', 'B', [0, -16]);

        // Distance label
        const pA = project(ax, ay, az, cam, cx, cy, s);
        const pB = project(bx, by, bz, cam, cx, cy, s);
        ctx.fillStyle = '#f59e0b'; ctx.font = '600 12px Inter'; ctx.textAlign = 'center';
        ctx.fillText(`|AB| = ${d.toFixed(2)}`, (pA.px + pB.px) / 2, (pA.py + pB.py) / 2 - 12);
    }

    Object.values(sliders).forEach(sl => sl.addEventListener('input', draw));
    attachRotation(canvas, cam, draw);
    draw();
}

/* ==============================
   VECTORS 3D DEMO
   ============================== */
function initVectorDemo() {
    const canvas = document.getElementById('vectorCanvas');
    if (!canvas) return;
    const C = setupCanvas(canvas);
    const { ctx, w, h, cx, cy } = C;
    const cam = createCam(-0.45, 0.65);
    const s = 40;

    const sl = {
        u1: document.getElementById('vecU1Slider'),
        u2: document.getElementById('vecU2Slider'),
        u3: document.getElementById('vecU3Slider'),
        v1: document.getElementById('vecV1Slider'),
        v2: document.getElementById('vecV2Slider'),
        v3: document.getElementById('vecV3Slider'),
    };
    const showSum = document.getElementById('vecShowSum');

    function draw() {
        const u = [+sl.u1.value, +sl.u2.value, +sl.u3.value];
        const v = [+sl.v1.value, +sl.v2.value, +sl.v3.value];

        document.getElementById('vecU1').textContent = u[0];
        document.getElementById('vecU2').textContent = u[1];
        document.getElementById('vecU3').textContent = u[2];
        document.getElementById('vecV1').textContent = v[0];
        document.getElementById('vecV2').textContent = v[1];
        document.getElementById('vecV3').textContent = v[2];

        const magU = mag3(...u), magV = mag3(...v);
        const dp = dot3(u, v);
        let angle = 0;
        if (magU > 0 && magV > 0) angle = Math.acos(Math.min(1, Math.max(-1, dp / (magU * magV)))) * 180 / Math.PI;

        document.getElementById('vecMagU').textContent = magU.toFixed(2);
        document.getElementById('vecMagV').textContent = magV.toFixed(2);
        document.getElementById('vecDot').textContent = dp.toFixed(0);
        document.getElementById('vecAngle').textContent = angle.toFixed(1) + '°';

        ctx.clearRect(0, 0, w, h);
        draw3DAxes(ctx, cam, cx, cy, w, h, s);

        // Vector u
        draw3DVector(ctx, 0, 0, 0, u[0], u[1], u[2], cam, cx, cy, s, '#6366f1', 'u\u2192');
        // Vector v
        draw3DVector(ctx, 0, 0, 0, v[0], v[1], v[2], cam, cx, cy, s, '#f59e0b', 'v\u2192');
        // Sum
        if (showSum.checked) {
            const sum = [u[0] + v[0], u[1] + v[1], u[2] + v[2]];
            // Ghost parallelogram
            draw3DDashed(ctx, u[0], u[1], u[2], sum[0], sum[1], sum[2], cam, cx, cy, s, 'rgba(16,185,129,0.3)');
            draw3DDashed(ctx, v[0], v[1], v[2], sum[0], sum[1], sum[2], cam, cx, cy, s, 'rgba(16,185,129,0.3)');
            draw3DVector(ctx, 0, 0, 0, sum[0], sum[1], sum[2], cam, cx, cy, s, '#10b981', 'u\u2192+v\u2192');
        }
    }

    Object.values(sl).forEach(s => s.addEventListener('input', draw));
    showSum.addEventListener('change', draw);
    attachRotation(canvas, cam, draw);
    draw();
}

/* ==============================
   CROSS PRODUCT DEMO
   ============================== */
function initCrossDemo() {
    const canvas = document.getElementById('crossCanvas');
    if (!canvas) return;
    const C = setupCanvas(canvas);
    const { ctx, w, h, cx, cy } = C;
    const cam = createCam(-0.5, 0.6);
    const sc = 40;

    const sl = {
        u1: document.getElementById('crU1S'), u2: document.getElementById('crU2S'), u3: document.getElementById('crU3S'),
        v1: document.getElementById('crV1S'), v2: document.getElementById('crV2S'), v3: document.getElementById('crV3S'),
    };
    const showPlane = document.getElementById('crossShowPlane');

    function draw() {
        const u = [+sl.u1.value, +sl.u2.value, +sl.u3.value];
        const v = [+sl.v1.value, +sl.v2.value, +sl.v3.value];
        const c = cross3(u, v);
        const cmag = mag3(...c);

        document.getElementById('crU1').textContent = u[0];
        document.getElementById('crU2').textContent = u[1];
        document.getElementById('crU3').textContent = u[2];
        document.getElementById('crV1').textContent = v[0];
        document.getElementById('crV2').textContent = v[1];
        document.getElementById('crV3').textContent = v[2];
        document.getElementById('crossResult').textContent = `(${c[0]}, ${c[1]}, ${c[2]})`;
        document.getElementById('crossMag').textContent = cmag.toFixed(2);
        document.getElementById('crossArea').textContent = cmag.toFixed(2);

        ctx.clearRect(0, 0, w, h);
        draw3DAxes(ctx, cam, cx, cy, w, h, sc);

        // Parallelogram
        if (showPlane.checked && cmag > 0.1) {
            const pts = [
                [0, 0, 0],
                [u[0], u[1], u[2]],
                [u[0] + v[0], u[1] + v[1], u[2] + v[2]],
                [v[0], v[1], v[2]]
            ];
            draw3DPlane(ctx, pts, cam, cx, cy, sc, 'rgba(168,85,247,0.15)');
        }

        // Vectors
        draw3DVector(ctx, 0, 0, 0, u[0], u[1], u[2], cam, cx, cy, sc, '#6366f1', 'u\u2192');
        draw3DVector(ctx, 0, 0, 0, v[0], v[1], v[2], cam, cx, cy, sc, '#f59e0b', 'v\u2192');
        // Cross product vector
        if (cmag > 0.1) {
            draw3DVector(ctx, 0, 0, 0, c[0], c[1], c[2], cam, cx, cy, sc, '#10b981', 'u\u2192\u00d7v\u2192');
        }
    }

    Object.values(sl).forEach(s => s.addEventListener('input', draw));
    showPlane.addEventListener('change', draw);
    attachRotation(canvas, cam, draw);
    draw();
}

/* ==============================
   LINE IN 3D DEMO
   ============================== */
function initLineDemo() {
    const canvas = document.getElementById('lineCanvas');
    if (!canvas) return;
    const C = setupCanvas(canvas);
    const { ctx, w, h, cx, cy } = C;
    const cam = createCam(-0.45, 0.7);
    const sc = 40;

    const sl = {
        ax: document.getElementById('lineAxS'), ay: document.getElementById('lineAyS'), az: document.getElementById('lineAzS'),
        ux: document.getElementById('lineUxS'), uy: document.getElementById('lineUyS'), uz: document.getElementById('lineUzS'),
    };

    function signStr(n) { return n >= 0 ? `+ ${n}t` : `− ${Math.abs(n)}t`; }

    function draw() {
        const a = [+sl.ax.value, +sl.ay.value, +sl.az.value];
        const u = [+sl.ux.value, +sl.uy.value, +sl.uz.value];

        document.getElementById('lineAx').textContent = a[0];
        document.getElementById('lineAy').textContent = a[1];
        document.getElementById('lineAz').textContent = a[2];
        document.getElementById('lineUx').textContent = u[0];
        document.getElementById('lineUy').textContent = u[1];
        document.getElementById('lineUz').textContent = u[2];

        const eqEl = document.getElementById('lineEq');
        eqEl.innerHTML = `x = ${a[0]} ${signStr(u[0])}<br>y = ${a[1]} ${signStr(u[1])}<br>z = ${a[2]} ${signStr(u[2])}`;

        ctx.clearRect(0, 0, w, h);
        draw3DAxes(ctx, cam, cx, cy, w, h, sc);

        // Line
        draw3DLine(ctx, a[0], a[1], a[2], u[0], u[1], u[2], cam, cx, cy, sc, '#6366f1');

        // Direction vector from A
        draw3DVector(ctx, a[0], a[1], a[2], u[0], u[1], u[2], cam, cx, cy, sc, '#f59e0b', 'u\u2192');

        // Points along line for t = -2, -1, 0, 1, 2
        for (let t = -2; t <= 2; t++) {
            const px = a[0] + u[0] * t, py2 = a[1] + u[1] * t, pz = a[2] + u[2] * t;
            const color = t === 0 ? '#10b981' : 'rgba(255,255,255,0.3)';
            draw3DPoint(ctx, px, py2, pz, cam, cx, cy, sc, color,
                t === 0 ? 'A' : `t=${t}`, [0, -14]);
        }
    }

    Object.values(sl).forEach(s => s.addEventListener('input', draw));
    attachRotation(canvas, cam, draw);
    draw();
}

/* ==============================
   PLANE DEMO
   ============================== */
function initPlaneDemo() {
    const canvas = document.getElementById('planeCanvas');
    if (!canvas) return;
    const C = setupCanvas(canvas);
    const { ctx, w, h, cx, cy } = C;
    const cam = createCam(-0.45, 0.7);
    const sc = 35;

    const sl = {
        nx: document.getElementById('plNxS'), ny: document.getElementById('plNyS'), nz: document.getElementById('plNzS'),
        ax: document.getElementById('plAxS'), ay: document.getElementById('plAyS'), az: document.getElementById('plAzS'),
        px: document.getElementById('plPxS'), py: document.getElementById('plPyS'), pz: document.getElementById('plPzS'),
    };

    function draw() {
        const n = [+sl.nx.value, +sl.ny.value, +sl.nz.value];
        const a = [+sl.ax.value, +sl.ay.value, +sl.az.value];
        const p = [+sl.px.value, +sl.py.value, +sl.pz.value];
        const d = -(n[0] * a[0] + n[1] * a[1] + n[2] * a[2]);

        document.getElementById('plNx').textContent = n[0];
        document.getElementById('plNy').textContent = n[1];
        document.getElementById('plNz').textContent = n[2];
        document.getElementById('plAx').textContent = a[0];
        document.getElementById('plAy').textContent = a[1];
        document.getElementById('plAz').textContent = a[2];
        document.getElementById('plPx').textContent = p[0];
        document.getElementById('plPy').textContent = p[1];
        document.getElementById('plPz').textContent = p[2];

        // Equation string
        let eq = '';
        const cs = [n[0], n[1], n[2]];
        const vars = ['x', 'y', 'z'];
        for (let i = 0; i < 3; i++) {
            if (cs[i] === 0) continue;
            if (eq.length > 0 && cs[i] > 0) eq += ' + ';
            if (cs[i] < 0) eq += ' − ';
            if (Math.abs(cs[i]) !== 1) eq += Math.abs(cs[i]);
            eq += vars[i];
        }
        if (d > 0) eq += ` + ${d}`;
        else if (d < 0) eq += ` − ${Math.abs(d)}`;
        eq += ' = 0';
        if (n[0] === 0 && n[1] === 0 && n[2] === 0) eq = '(neurčená)';
        document.getElementById('planeEq').textContent = eq;

        // Distance of P
        const nMag = mag3(...n);
        let distP = 0;
        if (nMag > 0) distP = Math.abs(n[0] * p[0] + n[1] * p[1] + n[2] * p[2] + d) / nMag;
        document.getElementById('plDist').textContent = distP.toFixed(2);

        ctx.clearRect(0, 0, w, h);
        draw3DAxes(ctx, cam, cx, cy, w, h, sc);

        // Draw plane quad if normal is nonzero
        if (nMag > 0) {
            // Build two tangent vectors to the plane
            let t1, t2;
            if (Math.abs(n[0]) < 0.9) t1 = cross3(n, [1, 0, 0]);
            else t1 = cross3(n, [0, 1, 0]);
            const m1 = mag3(...t1);
            t1 = [t1[0] / m1, t1[1] / m1, t1[2] / m1];
            t2 = cross3(n, t1);
            const m2 = mag3(...t2);
            t2 = [t2[0] / m2, t2[1] / m2, t2[2] / m2];

            const r = 4;
            const pts = [
                [a[0] - t1[0] * r - t2[0] * r, a[1] - t1[1] * r - t2[1] * r, a[2] - t1[2] * r - t2[2] * r],
                [a[0] + t1[0] * r - t2[0] * r, a[1] + t1[1] * r - t2[1] * r, a[2] + t1[2] * r - t2[2] * r],
                [a[0] + t1[0] * r + t2[0] * r, a[1] + t1[1] * r + t2[1] * r, a[2] + t1[2] * r + t2[2] * r],
                [a[0] - t1[0] * r + t2[0] * r, a[1] - t1[1] * r + t2[1] * r, a[2] - t1[2] * r + t2[2] * r],
            ];
            draw3DPlane(ctx, pts, cam, cx, cy, sc, 'rgba(99,102,241,0.12)');
        }

        // Normal vector from A
        if (nMag > 0) {
            const nNorm = [n[0] / nMag * 2, n[1] / nMag * 2, n[2] / nMag * 2];
            draw3DVector(ctx, a[0], a[1], a[2], nNorm[0], nNorm[1], nNorm[2], cam, cx, cy, sc, '#ef4444', 'n\u2192');
        }

        // Point A on plane
        draw3DPoint(ctx, a[0], a[1], a[2], cam, cx, cy, sc, '#10b981', 'A', [0, -16]);

        // Test point P
        draw3DPoint(ctx, p[0], p[1], p[2], cam, cx, cy, sc, '#f59e0b', 'P', [0, -16]);

        // Dashed line P to its projection on plane
        if (nMag > 0) {
            const t = -(n[0] * p[0] + n[1] * p[1] + n[2] * p[2] + d) / (nMag * nMag);
            const projP = [p[0] + n[0] * t, p[1] + n[1] * t, p[2] + n[2] * t];
            draw3DDashed(ctx, p[0], p[1], p[2], projP[0], projP[1], projP[2], cam, cx, cy, sc, '#f59e0b');
        }
    }

    Object.values(sl).forEach(s => s.addEventListener('input', draw));
    attachRotation(canvas, cam, draw);
    draw();
}

/* ==============================
   PLAYGROUND
   ============================== */
function initPlayground() {
    const canvas = document.getElementById('playgroundCanvas');
    if (!canvas) return;
    const C = setupCanvas(canvas);
    const { ctx, w, h, cx, cy } = C;
    const cam = createCam(-0.45, 0.65);
    const sc = 40;

    const sl = {
        ax: document.getElementById('pgAxS'), ay: document.getElementById('pgAyS'), az: document.getElementById('pgAzS'),
        bx: document.getElementById('pgBxS'), by: document.getElementById('pgByS'), bz: document.getElementById('pgBzS'),
    };

    function draw() {
        const a = [+sl.ax.value, +sl.ay.value, +sl.az.value];
        const b = [+sl.bx.value, +sl.by.value, +sl.bz.value];
        const v = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
        const d = mag3(...v);
        const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];

        document.getElementById('pgAx').textContent = a[0];
        document.getElementById('pgAy').textContent = a[1];
        document.getElementById('pgAz').textContent = a[2];
        document.getElementById('pgBx').textContent = b[0];
        document.getElementById('pgBy').textContent = b[1];
        document.getElementById('pgBz').textContent = b[2];
        document.getElementById('pgDist').textContent = d.toFixed(2);
        document.getElementById('pgMid').textContent = `[${mid[0].toFixed(1)}, ${mid[1].toFixed(1)}, ${mid[2].toFixed(1)}]`;
        document.getElementById('pgVec').textContent = `(${v[0]}, ${v[1]}, ${v[2]})`;

        ctx.clearRect(0, 0, w, h);
        draw3DAxes(ctx, cam, cx, cy, w, h, sc);

        // Vector AB
        draw3DVector(ctx, a[0], a[1], a[2], v[0], v[1], v[2], cam, cx, cy, sc, 'rgba(168,139,250,0.6)', 'AB\u2192');

        // Points
        draw3DPoint(ctx, a[0], a[1], a[2], cam, cx, cy, sc, '#6366f1', 'A', [0, -16]);
        draw3DPoint(ctx, b[0], b[1], b[2], cam, cx, cy, sc, '#f59e0b', 'B', [0, -16]);
        draw3DPoint(ctx, mid[0], mid[1], mid[2], cam, cx, cy, sc, '#10b981', 'S', [0, -16]);
    }

    Object.values(sl).forEach(s => s.addEventListener('input', draw));
    attachRotation(canvas, cam, draw);

    document.getElementById('pgResetBtn')?.addEventListener('click', () => {
        cam.rotX = -0.45; cam.rotY = 0.65;
        draw();
    });

    draw();
}

/* ==============================
   EXERCISES
   ============================== */
function initExercises() {
    const feedbackMessages = {
        1: {
            correct: '✅ Správně! |AB| = √((4−1)²+(6−2)²+(3−3)²) = √(9+16+0) = √25 = 5.',
            incorrect: '❌ Zkuste znovu. |AB| = √((4−1)²+(6−2)²+(3−3)²) = √(9+16+0) = 5.'
        },
        2: {
            correct: '\u2705 Správně! u\u2192\u00b7v\u2192 = 1\u00b74 + (\u22122)\u00b70 + 3\u00b7(\u22121) = 4 + 0 \u2212 3 = 1.',
            incorrect: '\u274c Zkuste znovu. u\u2192\u00b7v\u2192 = 1\u00b74 + (\u22122)\u00b70 + 3\u00b7(\u22121) = 4 \u2212 3 = 1.'
        },
        3: {
            correct: '\u2705 Správně! e\u2192\u2081 \u00d7 e\u2192\u2082 = (0\u00b70\u22120\u00b71, 0\u00b70\u22121\u00b70, 1\u00b71\u22120\u00b70) = (0, 0, 1) = e\u2192\u2083.',
            incorrect: '\u274c Zkuste znovu. Použijte vzorec: u\u2192\u00d7v\u2192 = (u\u2082v\u2083\u2212u\u2083v\u2082, u\u2083v\u2081\u2212u\u2081v\u2083, u\u2081v\u2082\u2212u\u2082v\u2081).'
        },
        4: {
            correct: '\u2705 Správně! Normálový vektor odpovídá koeficientům u x, y, z: n\u2192 = (2, \u22123, 1).',
            incorrect: '\u274c Zkuste znovu. V rovnici ax+by+cz+d=0 je normálový vektor n\u2192 = (a, b, c).'
        },
        5: {
            correct: '\u2705 Správně! d = |1+1+1\u22126| / \u221a(1+1+1) = |\u22123| / \u221a3 = 3/\u221a3 = \u221a3.',
            incorrect: '\u274c Zkuste znovu. d = |ax\u2080+by\u2080+cz\u2080+d| / \u221a(a²+b²+c²) = |1+1+1\u22126| / \u221a3 = 3/\u221a3 = \u221a3.'
        },
        6: {
            correct: '\u2705 Správně! v\u2192 = 2\u00b7u\u2192, takže jsou kolineární (lineárně závislé).',
            incorrect: '\u274c Zkuste znovu. Porovnejte poměry: 2/1 = 4/2 = 6/3 = 2 \u2192 v\u2192 = 2\u00b7u\u2192.'
        }
    };

    document.querySelectorAll('.btn-check').forEach(btn => {
        btn.addEventListener('click', () => {
            const n = btn.dataset.exercise;
            const correct = btn.dataset.correct;
            const sel = document.querySelector(`input[name="ex${n}"]:checked`);
            if (!sel) return;
            const ok = sel.value === correct;
            const fb = document.getElementById(`ex${n}Feedback`);
            const st = document.getElementById(`ex${n}Status`);
            fb.textContent = feedbackMessages[n][ok ? 'correct' : 'incorrect'];
            fb.className = 'exercise-feedback show ' + (ok ? 'correct' : 'incorrect');
            st.textContent = ok ? '✓ Správně' : '✗ Špatně';
            st.className = 'exercise-status ' + (ok ? 'correct' : 'incorrect');
            document.querySelectorAll(`input[name="ex${n}"]`).forEach(input => {
                const opt = input.closest('.option');
                opt.classList.remove('correct', 'incorrect');
                if (input.value === correct) opt.classList.add('correct');
                else if (input.checked) opt.classList.add('incorrect');
            });
            checkAllDone();
        });
    });

    function checkAllDone() {
        const total = document.querySelectorAll('.exercise').length;
        const done = document.querySelectorAll('.exercise-status.correct').length;
        if (done === total) {
            const c = document.getElementById('lessonComplete');
            if (c) c.style.display = 'block';
        }
    }
}
