/* Lesson 10: Parabola – Interactive JavaScript */
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initDefinitionDemo();
    initEquationDemo();
    initPropertiesDemo();
    initOrientationDemo();
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
   CANVAS UTILITIES
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
    return { ctx, w, h, cx: w / 2, cy: h / 2, s: 40 };
}

function toC(x, y, cx, cy, s) { return [cx + x * s, cy - y * s]; }
function fromC(px, py, cx, cy, s) { return [(px - cx) / s, (cy - py) / s]; }

function drawGrid(ctx, w, h, cx, cy, s) {
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let x = cx % s; x < w; x += s) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = cy % s; y < h; y += s) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
}

function drawAxes(ctx, w, h, cx, cy, s) {
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
    // Arrows
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.moveTo(w - 2, cy); ctx.lineTo(w - 10, cy - 4); ctx.lineTo(w - 10, cy + 4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx, 2); ctx.lineTo(cx - 4, 10); ctx.lineTo(cx + 4, 10); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '600 12px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('x', w - 14, cy + 16);
    ctx.fillText('y', cx + 10, 14);
    // Ticks
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    const maxV = Math.ceil(w / s);
    for (let i = -maxV; i <= maxV; i++) {
        if (i === 0) continue;
        const px = cx + i * s;
        if (px > 10 && px < w - 10) {
            ctx.beginPath(); ctx.moveTo(px, cy - 3); ctx.lineTo(px, cy + 3); ctx.stroke();
            ctx.fillText(i, px, cy + 16);
        }
        const py = cy - i * s;
        if (py > 10 && py < h - 10) {
            ctx.beginPath(); ctx.moveTo(cx - 3, py); ctx.lineTo(cx + 3, py); ctx.stroke();
            ctx.textAlign = 'right'; ctx.fillText(i, cx - 8, py + 4); ctx.textAlign = 'center';
        }
    }
}

// Draw parabola y^2 = 2px (right-opening) with offset center
function drawParabola(ctx, p, cx, cy, s, w, h, ox, oy, color, lw, dir) {
    ctx.strokeStyle = color || '#6366f1';
    ctx.lineWidth = lw || 2.5;
    ctx.beginPath();
    let first = true;
    const tMax = 8;
    for (let t = -tMax; t <= tMax; t += 0.04) {
        let xp, yp;
        if (dir === 'right') { xp = ox + t * t / (2 * p); yp = oy + t; }
        else if (dir === 'left') { xp = ox - t * t / (2 * p); yp = oy + t; }
        else if (dir === 'up') { xp = ox + t; yp = oy + t * t / (2 * p); }
        else if (dir === 'down') { xp = ox + t; yp = oy - t * t / (2 * p); }
        else { xp = ox + t * t / (2 * p); yp = oy + t; } // default right
        const [px2, py2] = toC(xp, yp, cx, cy, s);
        if (px2 < -20 || px2 > w + 20 || py2 < -20 || py2 > h + 20) { first = true; continue; }
        if (first) { ctx.moveTo(px2, py2); first = false; }
        else ctx.lineTo(px2, py2);
    }
    ctx.stroke();
}

function drawPoint(ctx, x, y, cx, cy, s, color, radius, label, off) {
    const [px, py] = toC(x, y, cx, cy, s);
    ctx.fillStyle = color || '#f59e0b';
    ctx.beginPath(); ctx.arc(px, py, radius || 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2; ctx.stroke();
    if (label) {
        ctx.fillStyle = color || '#f59e0b';
        ctx.font = '600 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        const ox = off ? off[0] : 0, oy = off ? off[1] : -14;
        ctx.fillText(label, px + ox, py + oy);
    }
}

function drawDashed(ctx, x1, y1, x2, y2, cx, cy, s, color, lw) {
    const [p1, q1] = toC(x1, y1, cx, cy, s);
    const [p2, q2] = toC(x2, y2, cx, cy, s);
    ctx.strokeStyle = color || '#10b981'; ctx.lineWidth = lw || 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(p1, q1); ctx.lineTo(p2, q2); ctx.stroke();
    ctx.setLineDash([]);
}

function drawVertLine(ctx, x, cx, cy, s, w, h, color, lw) {
    const [px] = toC(x, 0, cx, cy, s);
    ctx.strokeStyle = color || '#ef4444';
    ctx.lineWidth = lw || 2;
    ctx.setLineDash([8, 5]);
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, h); ctx.stroke();
    ctx.setLineDash([]);
}

function drawHorizLine(ctx, y, cx, cy, s, w, h, color, lw) {
    const [, py] = toC(0, y, cx, cy, s);
    ctx.strokeStyle = color || '#ef4444';
    ctx.lineWidth = lw || 2;
    ctx.setLineDash([8, 5]);
    ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(w, py); ctx.stroke();
    ctx.setLineDash([]);
}

function dist(x1, y1, x2, y2) { return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2); }

/* ==============================
   DEFINITION DEMO
   ============================== */
function initDefinitionDemo() {
    const canvas = document.getElementById('definitionCanvas');
    if (!canvas) return;
    const C = setupCanvas(canvas);
    const { ctx, w, h, cx, cy, s } = C;

    const pSlider = document.getElementById('defPSlider');
    let tParam = 1.5; // y-value along parabola
    let dragging = false;

    function draw() {
        const p = parseFloat(pSlider.value);
        const halfP = p / 2;
        // Focus and directrix
        const fx = halfP, fy = 0;
        const dirX = -halfP;

        // Point X on parabola: y^2 = 2px → x = t^2/(2p)
        const xPt = tParam * tParam / (2 * p);
        const yPt = tParam;

        const distF = dist(xPt, yPt, fx, fy);
        const distD = xPt - dirX; // horizontal distance to directrix

        ctx.clearRect(0, 0, w, h);
        drawGrid(ctx, w, h, cx, cy, s);
        drawAxes(ctx, w, h, cx, cy, s);

        // Directrix
        drawVertLine(ctx, dirX, cx, cy, s, w, h, '#ef4444', 2);
        // Label directrix
        const [dlx] = toC(dirX, 0, cx, cy, s);
        ctx.fillStyle = '#ef4444';
        ctx.font = '600 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('d', dlx, 16);

        // Parabola
        drawParabola(ctx, p, cx, cy, s, w, h, 0, 0, '#6366f1', 2.5, 'right');

        // Lines from X to F and to directrix
        const [pfx, pfy] = toC(fx, fy, cx, cy, s);
        const [pxx, pxy] = toC(xPt, yPt, cx, cy, s);
        const [pdx, pdy] = toC(dirX, yPt, cx, cy, s);

        // X → F
        ctx.strokeStyle = 'rgba(245,158,11,0.6)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(pxx, pxy); ctx.lineTo(pfx, pfy); ctx.stroke();

        // X → directrix (horizontal)
        ctx.strokeStyle = 'rgba(59,130,246,0.6)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(pxx, pxy); ctx.lineTo(pdx, pdy); ctx.stroke();

        // Distance labels
        ctx.font = '600 12px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(`|XF| = ${distF.toFixed(2)}`, (pxx + pfx) / 2, (pxy + pfy) / 2 - 10);
        ctx.fillStyle = '#3b82f6';
        ctx.fillText(`d = ${distD.toFixed(2)}`, (pxx + pdx) / 2, pdy - 10);

        // Right-angle indicator at directrix foot
        const ra = 8;
        ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pdx + ra, pdy); ctx.lineTo(pdx + ra, pdy - ra); ctx.lineTo(pdx, pdy - ra);
        ctx.stroke();

        // Points
        drawPoint(ctx, fx, fy, cx, cy, s, '#f59e0b', 7, 'F', [0, 16]);
        drawPoint(ctx, 0, 0, cx, cy, s, '#10b981', 5, 'V', [10, 14]);
        drawPoint(ctx, xPt, yPt, cx, cy, s, '#a78bfa', 8, 'X', [0, -16]);
        drawPoint(ctx, dirX, yPt, cx, cy, s, '#3b82f6', 4, '', null);

        // UI
        document.getElementById('defPVal').textContent = p.toFixed(1);
        document.getElementById('defPointX').textContent = `[${xPt.toFixed(1)}, ${yPt.toFixed(1)}]`;
        document.getElementById('defDistF').textContent = distF.toFixed(2);
        document.getElementById('defDistD').textContent = distD.toFixed(2);
        document.getElementById('defDiff').textContent = Math.abs(distF - distD).toFixed(4);
        document.getElementById('defFocus').textContent = `[${halfP.toFixed(1)}, 0]`;
        document.getElementById('defDirectrix').textContent = `x = −${halfP.toFixed(1)}`;
        document.getElementById('defVertex').textContent = '[0, 0]';
    }

    canvas.addEventListener('mousedown', ev => {
        const rect = canvas.getBoundingClientRect();
        const [mx, my] = fromC(ev.clientX - rect.left, ev.clientY - rect.top, cx, cy, s);
        const p = parseFloat(pSlider.value);
        const xPt = tParam * tParam / (2 * p);
        if (dist(mx, my, xPt, tParam) < 1.0) dragging = true;
    });
    canvas.addEventListener('mousemove', ev => {
        if (!dragging) return;
        const rect = canvas.getBoundingClientRect();
        const [, my] = fromC(ev.clientX - rect.left, ev.clientY - rect.top, cx, cy, s);
        tParam = Math.max(-5, Math.min(5, my));
        draw();
    });
    canvas.addEventListener('mouseup', () => { dragging = false; });
    canvas.addEventListener('mouseleave', () => { dragging = false; });
    pSlider.addEventListener('input', draw);

    draw();
}

/* ==============================
   EQUATION DEMO
   ============================== */
function initEquationDemo() {
    const canvas = document.getElementById('equationCanvas');
    if (!canvas) return;
    const C = setupCanvas(canvas);
    const { ctx, w, h, cx, cy, s } = C;

    const pSlider = document.getElementById('eqPSlider');

    function draw() {
        const p = parseFloat(pSlider.value);
        const halfP = p / 2;

        ctx.clearRect(0, 0, w, h);
        drawGrid(ctx, w, h, cx, cy, s);
        drawAxes(ctx, w, h, cx, cy, s);

        // Directrix
        drawVertLine(ctx, -halfP, cx, cy, s, w, h, '#ef4444', 1.5);
        const [dlx] = toC(-halfP, 0, cx, cy, s);
        ctx.fillStyle = '#ef4444'; ctx.font = '600 11px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('d', dlx, 16);

        // Parabola
        drawParabola(ctx, p, cx, cy, s, w, h, 0, 0, '#6366f1', 2.5, 'right');

        // Latus rectum
        const lrY = p; // y^2 = 2p*(p/2) = p^2 → y = p
        drawDashed(ctx, halfP, -lrY, halfP, lrY, cx, cy, s, '#f59e0b', 1.5);

        // Focus, vertex
        drawPoint(ctx, halfP, 0, cx, cy, s, '#f59e0b', 7, 'F', [0, 16]);
        drawPoint(ctx, 0, 0, cx, cy, s, '#10b981', 5, 'V', [10, 14]);

        // Semi-axis dash
        drawDashed(ctx, 0, 0, halfP, 0, cx, cy, s, '#a78bfa', 1.5);
        const [midx, midy] = toC(halfP / 2, 0, cx, cy, s);
        ctx.fillStyle = '#a78bfa'; ctx.font = '600 12px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('p/2', midx, midy - 10);

        // UI
        document.getElementById('eqPVal').textContent = p.toFixed(1);
        document.getElementById('eqP').textContent = p.toFixed(2);
        document.getElementById('eqFocus').textContent = `[${halfP.toFixed(1)}, 0]`;
        document.getElementById('eqDir').textContent = `x = −${halfP.toFixed(1)}`;
        document.getElementById('eqEquation').textContent = `y² = ${(2 * p).toFixed(0)}x`;
        document.getElementById('eqLR').textContent = `2p = ${(2 * p).toFixed(0)}`;
    }

    pSlider.addEventListener('input', draw);
    draw();
}

/* ==============================
   PROPERTIES DEMO
   ============================== */
function initPropertiesDemo() {
    const canvas = document.getElementById('propertiesCanvas');
    if (!canvas) return;
    const C = setupCanvas(canvas);
    const { ctx, w, h, cx, cy, s } = C;

    const pSlider = document.getElementById('propPSlider');
    const showLR = document.getElementById('propShowLR');
    const showDir = document.getElementById('propShowDirectrix');

    function draw() {
        const p = parseFloat(pSlider.value);
        const halfP = p / 2;

        ctx.clearRect(0, 0, w, h);
        drawGrid(ctx, w, h, cx, cy, s);
        drawAxes(ctx, w, h, cx, cy, s);

        // Directrix
        if (showDir.checked) {
            drawVertLine(ctx, -halfP, cx, cy, s, w, h, '#ef4444', 2);
            const [dlx] = toC(-halfP, 0, cx, cy, s);
            ctx.fillStyle = '#ef4444'; ctx.font = '600 12px Inter, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('d', dlx, 16);
        }

        // Parabola
        drawParabola(ctx, p, cx, cy, s, w, h, 0, 0, '#6366f1', 2.5, 'right');

        // Axis of symmetry (the x-axis, highlighted)
        ctx.strokeStyle = 'rgba(168,139,250,0.3)'; ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#a78bfa'; ctx.font = '600 11px Inter, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('osa paraboly', 10, cy - 8);

        // Latus rectum
        if (showLR.checked) {
            const lrY = p;
            ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.5;
            ctx.beginPath();
            const [lx1, ly1] = toC(halfP, -lrY, cx, cy, s);
            const [lx2, ly2] = toC(halfP, lrY, cx, cy, s);
            ctx.moveTo(lx1, ly1); ctx.lineTo(lx2, ly2); ctx.stroke();
            drawPoint(ctx, halfP, lrY, cx, cy, s, '#f59e0b', 4, '', null);
            drawPoint(ctx, halfP, -lrY, cx, cy, s, '#f59e0b', 4, '', null);
            ctx.fillStyle = '#f59e0b'; ctx.font = '600 11px Inter, sans-serif'; ctx.textAlign = 'left';
            ctx.fillText(`LR = ${(2 * p).toFixed(0)}`, lx2 + 6, (ly1 + ly2) / 2);
        }

        // Focus, vertex
        drawPoint(ctx, halfP, 0, cx, cy, s, '#f59e0b', 7, 'F', [0, 16]);
        drawPoint(ctx, 0, 0, cx, cy, s, '#10b981', 6, 'V', [10, 14]);

        // p/2 annotation
        drawDashed(ctx, 0, 0, halfP, 0, cx, cy, s, '#a78bfa', 1.5);

        // UI
        document.getElementById('propPVal').textContent = p.toFixed(1);
        document.getElementById('propF').textContent = `[${halfP.toFixed(1)}, 0]`;
        document.getElementById('propDir').textContent = `x = −${halfP.toFixed(1)}`;
        document.getElementById('propLR').textContent = `2p = ${(2 * p).toFixed(0)}`;
    }

    pSlider.addEventListener('input', draw);
    showLR.addEventListener('change', draw);
    showDir.addEventListener('change', draw);
    draw();
}

/* ==============================
   ORIENTATION DEMO
   ============================== */
function initOrientationDemo() {
    const canvas = document.getElementById('orientationCanvas');
    if (!canvas) return;
    const C = setupCanvas(canvas);
    const { ctx, w, h, cx, cy, s } = C;

    const pSlider = document.getElementById('oriPSlider');
    const buttons = document.querySelectorAll('.btn-orientation');
    let direction = 'right';

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            direction = btn.dataset.dir;
            draw();
        });
    });

    function draw() {
        const p = parseFloat(pSlider.value);
        const halfP = p / 2;

        ctx.clearRect(0, 0, w, h);
        drawGrid(ctx, w, h, cx, cy, s);
        drawAxes(ctx, w, h, cx, cy, s);

        let fx, fy, eqStr, dirStr, axisStr;
        if (direction === 'right') {
            fx = halfP; fy = 0;
            drawVertLine(ctx, -halfP, cx, cy, s, w, h, '#ef4444', 2);
            eqStr = `y² = ${(2 * p).toFixed(0)}x`;
            dirStr = `x = −${halfP.toFixed(1)}`;
            axisStr = 'osa x (vodorovná)';
        } else if (direction === 'left') {
            fx = -halfP; fy = 0;
            drawVertLine(ctx, halfP, cx, cy, s, w, h, '#ef4444', 2);
            eqStr = `y² = −${(2 * p).toFixed(0)}x`;
            dirStr = `x = ${halfP.toFixed(1)}`;
            axisStr = 'osa x (vodorovná)';
        } else if (direction === 'up') {
            fx = 0; fy = halfP;
            drawHorizLine(ctx, -halfP, cx, cy, s, w, h, '#ef4444', 2);
            eqStr = `x² = ${(2 * p).toFixed(0)}y`;
            dirStr = `y = −${halfP.toFixed(1)}`;
            axisStr = 'osa y (svislá)';
        } else { // down
            fx = 0; fy = -halfP;
            drawHorizLine(ctx, halfP, cx, cy, s, w, h, '#ef4444', 2);
            eqStr = `x² = −${(2 * p).toFixed(0)}y`;
            dirStr = `y = ${halfP.toFixed(1)}`;
            axisStr = 'osa y (svislá)';
        }

        // Parabola
        drawParabola(ctx, p, cx, cy, s, w, h, 0, 0, '#6366f1', 2.5, direction);

        // Focus, vertex
        drawPoint(ctx, fx, fy, cx, cy, s, '#f59e0b', 7, 'F', [direction === 'left' ? -14 : 14, direction === 'down' ? 16 : -14]);
        drawPoint(ctx, 0, 0, cx, cy, s, '#10b981', 5, 'V', [10, 14]);

        // UI
        document.getElementById('oriPVal').textContent = p.toFixed(1);
        document.getElementById('oriEquation').textContent = eqStr;
        document.getElementById('oriFocus').textContent = `[${fx.toFixed(1)}, ${fy.toFixed(1)}]`;
        document.getElementById('oriDir').textContent = dirStr;
        document.getElementById('oriAxis').textContent = axisStr;
    }

    pSlider.addEventListener('input', draw);
    draw();
}

/* ==============================
   PLAYGROUND
   ============================== */
function initPlayground() {
    const canvas = document.getElementById('playgroundCanvas');
    if (!canvas) return;
    const C = setupCanvas(canvas);
    const { ctx, w, h, cx, cy, s } = C;

    let vm = 0, vn = 0; // vertex position
    let testPt = null;
    let dragging = false;

    const pSlider = document.getElementById('playPSlider');
    const oriSelect = document.getElementById('playOrientation');

    function draw() {
        const p = parseFloat(pSlider.value);
        const halfP = p / 2;
        const dir = oriSelect.value;

        let fx, fy, dirLabel, eqLabel;
        if (dir === 'right') {
            fx = vm + halfP; fy = vn;
            dirLabel = `x = ${(vm - halfP).toFixed(1)}`;
            eqLabel = `y² = ${(2 * p).toFixed(0)}x`;
        } else if (dir === 'left') {
            fx = vm - halfP; fy = vn;
            dirLabel = `x = ${(vm + halfP).toFixed(1)}`;
            eqLabel = `y² = −${(2 * p).toFixed(0)}x`;
        } else if (dir === 'up') {
            fx = vm; fy = vn + halfP;
            dirLabel = `y = ${(vn - halfP).toFixed(1)}`;
            eqLabel = `x² = ${(2 * p).toFixed(0)}y`;
        } else {
            fx = vm; fy = vn - halfP;
            dirLabel = `y = ${(vn + halfP).toFixed(1)}`;
            eqLabel = `x² = −${(2 * p).toFixed(0)}y`;
        }

        document.getElementById('playPVal').textContent = p.toFixed(1);
        document.getElementById('playVertex').textContent = `[${vm.toFixed(1)}, ${vn.toFixed(1)}]`;
        document.getElementById('playFocus').textContent = `[${fx.toFixed(1)}, ${fy.toFixed(1)}]`;
        document.getElementById('playEq').textContent = eqLabel;

        ctx.clearRect(0, 0, w, h);
        drawGrid(ctx, w, h, cx, cy, s);
        drawAxes(ctx, w, h, cx, cy, s);

        // Directrix
        if (dir === 'right') drawVertLine(ctx, vm - halfP, cx, cy, s, w, h, '#ef4444', 1.5);
        else if (dir === 'left') drawVertLine(ctx, vm + halfP, cx, cy, s, w, h, '#ef4444', 1.5);
        else if (dir === 'up') drawHorizLine(ctx, vn - halfP, cx, cy, s, w, h, '#ef4444', 1.5);
        else drawHorizLine(ctx, vn + halfP, cx, cy, s, w, h, '#ef4444', 1.5);

        // Parabola at offset
        drawParabola(ctx, p, cx, cy, s, w, h, vm, vn, '#6366f1', 2.5, dir);

        // Focus
        drawPoint(ctx, fx, fy, cx, cy, s, '#f59e0b', 6, 'F', [0, -14]);
        // Vertex
        drawPoint(ctx, vm, vn, cx, cy, s, '#10b981', 6, 'V', [0, 14]);

        // Test point
        if (testPt) {
            const tx = testPt[0] - vm;
            const ty = testPt[1] - vn;
            let val;
            if (dir === 'right') val = ty * ty - 2 * p * tx;
            else if (dir === 'left') val = ty * ty - 2 * p * (-tx);
            else if (dir === 'up') val = tx * tx - 2 * p * ty;
            else val = tx * tx - 2 * p * (-ty);

            let tColor, tLabel;
            if (Math.abs(val) < 0.5) { tColor = '#10b981'; tLabel = 'Na parabole ✓'; }
            else if (val > 0) { tColor = '#ef4444'; tLabel = 'Vně paraboly'; }
            else { tColor = '#3b82f6'; tLabel = 'Uvnitř paraboly'; }

            drawDashed(ctx, vm, vn, testPt[0], testPt[1], cx, cy, s, tColor);
            drawPoint(ctx, testPt[0], testPt[1], cx, cy, s, tColor, 6, 'P', [0, -14]);
            document.getElementById('playTestP').textContent = `[${testPt[0].toFixed(1)}, ${testPt[1].toFixed(1)}]`;
            document.getElementById('playTestResult').textContent = tLabel;
            document.getElementById('playTestResult').style.color = tColor;
        }
    }

    canvas.addEventListener('mousedown', ev => {
        const rect = canvas.getBoundingClientRect();
        const [mx, my] = fromC(ev.clientX - rect.left, ev.clientY - rect.top, cx, cy, s);
        if (dist(mx, my, vm, vn) < 0.75) { dragging = true; }
        else { testPt = [Math.round(mx * 2) / 2, Math.round(my * 2) / 2]; draw(); }
    });
    canvas.addEventListener('mousemove', ev => {
        if (!dragging) return;
        const rect = canvas.getBoundingClientRect();
        const [mx, my] = fromC(ev.clientX - rect.left, ev.clientY - rect.top, cx, cy, s);
        vm = Math.round(mx * 2) / 2;
        vn = Math.round(my * 2) / 2;
        draw();
    });
    canvas.addEventListener('mouseup', () => { dragging = false; });
    canvas.addEventListener('mouseleave', () => { dragging = false; });

    pSlider.addEventListener('input', draw);
    oriSelect.addEventListener('change', draw);

    document.getElementById('playResetBtn')?.addEventListener('click', () => {
        vm = 0; vn = 0; testPt = null;
        pSlider.value = 2; oriSelect.value = 'right';
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
            correct: '✅ Správně! y² = 8x → 2p = 8 → p = 4. Ohnisko: F = [p/2, 0] = [2, 0].',
            incorrect: '❌ Zkuste znovu. y² = 2px → porovnejte: 2p = 8, tedy p = 4. Ohnisko leží v [p/2, 0].'
        },
        2: {
            correct: '✅ Správně! F = [0, 3] → ohnisko nad počátkem → osa y. p/2 = 3 → p = 6 → x² = 2py = 12y.',
            incorrect: '❌ Zkuste znovu. Ohnisko na ose y → rovnice tvaru x² = 2py. p/2 = 3 → p = 6.'
        },
        3: {
            correct: '✅ Správně! Řídící přímka x = −p/2 = −3 → p/2 = 3 → p = 6.',
            incorrect: '❌ Zkuste znovu. Řídící přímka má rovnici x = −p/2. Z x = −3 plyne p/2 = 3.'
        },
        4: {
            correct: '✅ Správně! Doleva → y² = −2px = −10x.',
            incorrect: '❌ Zkuste znovu. Parabola otevřená doleva: y² = −2px (záporné znaménko, y je umocněno).'
        },
        5: {
            correct: '✅ Správně! y² = 6x → 2p = 6, latus rectum = 2p = 6.',
            incorrect: '❌ Zkuste znovu. Latus rectum = 2p. Z y² = 6x je 2p = 6.'
        },
        6: {
            correct: '✅ Správně! y² = 9 < 2px = 8·2 = 16 → bod leží uvnitř paraboly.',
            incorrect: '❌ Zkuste znovu. Dosadíme: y² = 9, 2px = 16. Porovnejte: 9 < 16 → uvnitř.'
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
