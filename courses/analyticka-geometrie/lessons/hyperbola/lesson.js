/* Lesson 9: Hyperbola – Interactive JavaScript */
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initDefinitionDemo();
    initEquationDemo();
    initAsymptoteDemo();
    initEccentricityDemo();
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
        if (target) {
            target.classList.add('active');
            visited.add(id);
        }
        sidebarLinks.forEach(l => {
            if (l.dataset.section === id) l.classList.add('active');
        });
        updateProgress();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            showSection(link.dataset.section);
        });
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

    if (window.location.hash) {
        const id = window.location.hash.slice(1);
        showSection(id);
    }
}

/* ==============================
   CANVAS UTILITIES
   ============================== */
function setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || canvas.width;
    const height = rect.height || canvas.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 40;
    return { ctx, width, height, centerX, centerY, scale };
}

function toCanvas(x, y, cx, cy, s) {
    return [cx + x * s, cy - y * s];
}
function fromCanvas(px, py, cx, cy, s) {
    return [(px - cx) / s, (cy - py) / s];
}

function drawGrid(ctx, w, h, cx, cy, s) {
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let x = cx % s; x < w; x += s) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = cy % s; y < h; y += s) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
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
    // Labels
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '600 12px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('x', w - 14, cy + 16);
    ctx.fillText('y', cx + 10, 14);
    // Ticks
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    const maxVal = Math.ceil(w / s);
    for (let i = -maxVal; i <= maxVal; i++) {
        if (i === 0) continue;
        const px = cx + i * s;
        if (px > 10 && px < w - 10) {
            ctx.beginPath(); ctx.moveTo(px, cy - 3); ctx.lineTo(px, cy + 3); ctx.stroke();
            ctx.fillText(i, px, cy + 16);
        }
        const py = cy - i * s;
        if (py > 10 && py < h - 10) {
            ctx.beginPath(); ctx.moveTo(cx - 3, py); ctx.lineTo(cx + 3, py); ctx.stroke();
            ctx.textAlign = 'right';
            ctx.fillText(i, cx - 8, py + 4);
            ctx.textAlign = 'center';
        }
    }
}

function drawHyperbola(ctx, a, b, cx, cy, s, w, color, lw) {
    ctx.strokeStyle = color || '#6366f1';
    ctx.lineWidth = lw || 2.5;
    // Right branch
    ctx.beginPath();
    let first = true;
    for (let t = -3; t <= 3; t += 0.02) {
        const xh = a * Math.cosh(t);
        const yh = b * Math.sinh(t);
        const [px, py] = toCanvas(xh, yh, cx, cy, s);
        if (px < -20 || px > w + 20) continue;
        if (first) { ctx.moveTo(px, py); first = false; }
        else ctx.lineTo(px, py);
    }
    ctx.stroke();
    // Left branch
    ctx.beginPath();
    first = true;
    for (let t = -3; t <= 3; t += 0.02) {
        const xh = -a * Math.cosh(t);
        const yh = b * Math.sinh(t);
        const [px, py] = toCanvas(xh, yh, cx, cy, s);
        if (px < -20 || px > w + 20) continue;
        if (first) { ctx.moveTo(px, py); first = false; }
        else ctx.lineTo(px, py);
    }
    ctx.stroke();
}

function drawPoint(ctx, x, y, cx, cy, s, color, radius, label, labelOff) {
    const [px, py] = toCanvas(x, y, cx, cy, s);
    ctx.fillStyle = color || '#f59e0b';
    ctx.beginPath();
    ctx.arc(px, py, radius || 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (label) {
        ctx.fillStyle = color || '#f59e0b';
        ctx.font = '600 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        const ox = labelOff ? labelOff[0] : 0;
        const oy = labelOff ? labelOff[1] : -14;
        ctx.fillText(label, px + ox, py + oy);
    }
}

function drawDashed(ctx, x1, y1, x2, y2, cx, cy, s, color, lw) {
    const [px1, py1] = toCanvas(x1, y1, cx, cy, s);
    const [px2, py2] = toCanvas(x2, y2, cx, cy, s);
    ctx.strokeStyle = color || '#10b981';
    ctx.lineWidth = lw || 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(px1, py1); ctx.lineTo(px2, py2);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawLine(ctx, x1, y1, x2, y2, cx, cy, s, w, h, color, lw, dash) {
    // Extend line through the whole canvas
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) return;
    const ext = 50;
    const xa = x1 - dx * ext;
    const ya = y1 - dy * ext;
    const xb = x1 + dx * ext;
    const yb = y1 + dy * ext;
    const [pa, qa] = toCanvas(xa, ya, cx, cy, s);
    const [pb, qb] = toCanvas(xb, yb, cx, cy, s);
    ctx.strokeStyle = color || '#a78bfa';
    ctx.lineWidth = lw || 1.5;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(pa, qa); ctx.lineTo(pb, qb);
    ctx.stroke();
    if (dash) ctx.setLineDash([]);
}

function dist(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

/* ==============================
   DEFINITION DEMO
   ============================== */
function initDefinitionDemo() {
    const canvas = document.getElementById('definitionCanvas');
    if (!canvas) return;
    const C = setupCanvas(canvas);
    const { ctx, width, height, centerX, centerY, scale } = C;

    const aSlider = document.getElementById('defASlider');
    const bSlider = document.getElementById('defBSlider');

    let param = 0.5; // parametric t for cosh/sinh
    let dragging = false;
    let onRight = true; // which branch

    function draw() {
        const a = parseFloat(aSlider.value);
        const b = parseFloat(bSlider.value);
        const e = Math.sqrt(a * a + b * b);
        const f1x = -e, f1y = 0;
        const f2x = e, f2y = 0;

        // Point X on hyperbola (right or left branch)
        const sign = onRight ? 1 : -1;
        const xPt = sign * a * Math.cosh(param);
        const yPt = b * Math.sinh(param);

        ctx.clearRect(0, 0, width, height);
        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY, scale);

        // Hyperbola
        drawHyperbola(ctx, a, b, centerX, centerY, scale, width, '#6366f1', 2.5);

        // Lines from X to F1, F2
        const d1 = dist(xPt, yPt, f1x, f1y);
        const d2 = dist(xPt, yPt, f2x, f2y);

        const [pf1x, pf1y] = toCanvas(f1x, f1y, centerX, centerY, scale);
        const [pf2x, pf2y] = toCanvas(f2x, f2y, centerX, centerY, scale);
        const [pxx, pxy] = toCanvas(xPt, yPt, centerX, centerY, scale);

        ctx.strokeStyle = 'rgba(245,158,11,0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(pf1x, pf1y); ctx.lineTo(pxx, pxy); ctx.stroke();
        ctx.strokeStyle = 'rgba(59,130,246,0.6)';
        ctx.beginPath(); ctx.moveTo(pf2x, pf2y); ctx.lineTo(pxx, pxy); ctx.stroke();

        // Distance labels
        const mid1x = (pf1x + pxx) / 2;
        const mid1y = (pf1y + pxy) / 2;
        ctx.fillStyle = '#f59e0b';
        ctx.font = '600 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(d1.toFixed(1), mid1x - 10, mid1y - 8);

        const mid2x = (pf2x + pxx) / 2;
        const mid2y = (pf2y + pxy) / 2;
        ctx.fillStyle = '#3b82f6';
        ctx.fillText(d2.toFixed(1), mid2x + 10, mid2y - 8);

        // Points
        drawPoint(ctx, f1x, f1y, centerX, centerY, scale, '#f59e0b', 7, 'F₁', [-14, 8]);
        drawPoint(ctx, f2x, f2y, centerX, centerY, scale, '#3b82f6', 7, 'F₂', [14, 8]);
        drawPoint(ctx, 0, 0, centerX, centerY, scale, '#10b981', 5, 'S', [10, 14]);
        drawPoint(ctx, xPt, yPt, centerX, centerY, scale, '#a78bfa', 8, 'X', [0, -16]);

        // UI
        document.getElementById('defAVal').textContent = a.toFixed(1);
        document.getElementById('defBVal').textContent = b.toFixed(1);
        document.getElementById('defPointX').textContent = `[${xPt.toFixed(1)}, ${yPt.toFixed(1)}]`;
        document.getElementById('defDist1').textContent = d1.toFixed(2);
        document.getElementById('defDist2').textContent = d2.toFixed(2);
        document.getElementById('defDiff').textContent = Math.abs(d1 - d2).toFixed(2);
        document.getElementById('def2a').textContent = `2a = ${(2 * a).toFixed(1)}`;
    }

    canvas.addEventListener('mousedown', ev => {
        const rect = canvas.getBoundingClientRect();
        const [mx, my] = fromCanvas(ev.clientX - rect.left, ev.clientY - rect.top, centerX, centerY, scale);
        const a = parseFloat(aSlider.value);
        const b = parseFloat(bSlider.value);
        const sign = onRight ? 1 : -1;
        const xPt = sign * a * Math.cosh(param);
        const yPt = b * Math.sinh(param);
        if (dist(mx, my, xPt, yPt) < 1.2) dragging = true;
    });
    canvas.addEventListener('mousemove', ev => {
        if (!dragging) return;
        const rect = canvas.getBoundingClientRect();
        const [mx, my] = fromCanvas(ev.clientX - rect.left, ev.clientY - rect.top, centerX, centerY, scale);
        const a = parseFloat(aSlider.value);
        const b = parseFloat(bSlider.value);
        onRight = mx >= 0;
        // Find parametric t closest to mouse
        // x = ±a*cosh(t), y = b*sinh(t) → sinh(t) = y/b → t = asinh(y/b)
        param = Math.asinh(my / b);
        // Clamp
        param = Math.max(-2.5, Math.min(2.5, param));
        draw();
    });
    canvas.addEventListener('mouseup', () => { dragging = false; });
    canvas.addEventListener('mouseleave', () => { dragging = false; });

    aSlider.addEventListener('input', draw);
    bSlider.addEventListener('input', draw);

    draw();
}

/* ==============================
   EQUATION DEMO
   ============================== */
function initEquationDemo() {
    const canvas = document.getElementById('equationCanvas');
    if (!canvas) return;
    const C = setupCanvas(canvas);
    const { ctx, width, height, centerX, centerY, scale } = C;

    const aSlider = document.getElementById('eqASlider');
    const bSlider = document.getElementById('eqBSlider');

    function draw() {
        const a = parseFloat(aSlider.value);
        const b = parseFloat(bSlider.value);
        const e = Math.sqrt(a * a + b * b);

        ctx.clearRect(0, 0, width, height);
        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY, scale);

        drawHyperbola(ctx, a, b, centerX, centerY, scale, width, '#6366f1', 2.5);

        // Semi-axes (dashed)
        drawDashed(ctx, 0, 0, a, 0, centerX, centerY, scale, '#6366f1', 1.5);
        drawDashed(ctx, 0, 0, 0, b, centerX, centerY, scale, '#a78bfa', 1.5);

        // Labels
        const [lax, lay] = toCanvas(a / 2, 0, centerX, centerY, scale);
        ctx.fillStyle = '#6366f1';
        ctx.font = '600 13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('a', lax, lay - 10);

        const [lbx, lby] = toCanvas(0, b / 2, centerX, centerY, scale);
        ctx.fillStyle = '#a78bfa';
        ctx.fillText('b', lbx + 14, lby + 4);

        // Foci
        drawPoint(ctx, -e, 0, centerX, centerY, scale, '#f59e0b', 6, 'F₁', [-14, 8]);
        drawPoint(ctx, e, 0, centerX, centerY, scale, '#f59e0b', 6, 'F₂', [14, 8]);

        // Vertices
        drawPoint(ctx, -a, 0, centerX, centerY, scale, '#ef4444', 5, 'A₁', [-14, -8]);
        drawPoint(ctx, a, 0, centerX, centerY, scale, '#ef4444', 5, 'A₂', [14, -8]);

        // Center
        drawPoint(ctx, 0, 0, centerX, centerY, scale, '#10b981', 5, 'S', [10, 14]);

        // UI
        document.getElementById('eqAVal').textContent = a.toFixed(1);
        document.getElementById('eqBVal').textContent = b.toFixed(1);
        document.getElementById('eqA').textContent = a.toFixed(2);
        document.getElementById('eqB').textContent = b.toFixed(2);
        document.getElementById('eqE').textContent = e.toFixed(2);
        document.getElementById('eqEquation').textContent = `x²/${(a * a).toFixed(0)} − y²/${(b * b).toFixed(0)} = 1`;
        document.getElementById('eqVert').textContent = `[±${a.toFixed(0)}, 0]`;
        document.getElementById('eqFoci').textContent = `[±${e.toFixed(1)}, 0]`;
    }

    aSlider.addEventListener('input', draw);
    bSlider.addEventListener('input', draw);

    draw();
}

/* ==============================
   ASYMPTOTE DEMO
   ============================== */
function initAsymptoteDemo() {
    const canvas = document.getElementById('asymptoteCanvas');
    if (!canvas) return;
    const C = setupCanvas(canvas);
    const { ctx, width, height, centerX, centerY, scale } = C;

    const aSlider = document.getElementById('asyASlider');
    const bSlider = document.getElementById('asyBSlider');
    const showRect = document.getElementById('asyShowRect');

    function draw() {
        const a = parseFloat(aSlider.value);
        const b = parseFloat(bSlider.value);
        const k = b / a;

        ctx.clearRect(0, 0, width, height);
        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY, scale);

        // Reference rectangle
        if (showRect.checked) {
            const [r1x, r1y] = toCanvas(-a, b, centerX, centerY, scale);
            const [r2x, r2y] = toCanvas(a, -b, centerX, centerY, scale);
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(r1x, r1y, r2x - r1x, r2y - r1y);
            ctx.setLineDash([]);
        }

        // Asymptotes
        drawLine(ctx, 0, 0, 1, k, centerX, centerY, scale, width, height, '#f59e0b', 2, [8, 5]);
        drawLine(ctx, 0, 0, 1, -k, centerX, centerY, scale, width, height, '#f59e0b', 2, [8, 5]);

        // Labels on asymptotes
        const labelX = 5;
        const [la1x, la1y] = toCanvas(labelX, k * labelX, centerX, centerY, scale);
        const [la2x, la2y] = toCanvas(labelX, -k * labelX, centerX, centerY, scale);
        ctx.fillStyle = '#f59e0b';
        ctx.font = '600 12px Inter, sans-serif';
        ctx.textAlign = 'left';
        if (la1y > 10) ctx.fillText(`y = ${k.toFixed(2)}x`, la1x + 4, la1y - 6);
        if (la2y < height - 10) ctx.fillText(`y = −${k.toFixed(2)}x`, la2x + 4, la2y + 14);

        // Hyperbola
        drawHyperbola(ctx, a, b, centerX, centerY, scale, width, '#6366f1', 2.5);

        // Center
        drawPoint(ctx, 0, 0, centerX, centerY, scale, '#10b981', 5, 'S', [10, 14]);

        // Vertices
        drawPoint(ctx, -a, 0, centerX, centerY, scale, '#ef4444', 5, 'A₁', [-14, -8]);
        drawPoint(ctx, a, 0, centerX, centerY, scale, '#ef4444', 5, 'A₂', [14, -8]);

        // UI
        document.getElementById('asyAVal').textContent = a.toFixed(1);
        document.getElementById('asyBVal').textContent = b.toFixed(1);
        document.getElementById('asySlope').textContent = `±${k.toFixed(3)}`;
        document.getElementById('asyEq1').textContent = `y = ${k.toFixed(2)}x`;
        document.getElementById('asyEq2').textContent = `y = −${k.toFixed(2)}x`;

        // Angle between asymptotes
        const angleRad = 2 * Math.atan(k);
        const angleDeg = (angleRad * 180 / Math.PI).toFixed(1);
        document.getElementById('asyAngle').textContent = angleDeg + '°';
    }

    aSlider.addEventListener('input', draw);
    bSlider.addEventListener('input', draw);
    showRect.addEventListener('change', draw);

    draw();
}

/* ==============================
   ECCENTRICITY DEMO
   ============================== */
function initEccentricityDemo() {
    const canvas = document.getElementById('eccentricityCanvas');
    if (!canvas) return;
    const C = setupCanvas(canvas);
    const { ctx, width, height, centerX, centerY, scale } = C;

    const eccSlider = document.getElementById('eccSlider');
    const eccASlider = document.getElementById('eccASlider');

    function draw() {
        const eps = parseFloat(eccSlider.value);
        const a = parseFloat(eccASlider.value);
        const e = eps * a;
        const b = Math.sqrt(Math.max(e * e - a * a, 0.01));

        ctx.clearRect(0, 0, width, height);
        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY, scale);

        // Arrows showing asymptotes for reference
        const k = b / a;
        drawLine(ctx, 0, 0, 1, k, centerX, centerY, scale, width, height, 'rgba(245,158,11,0.3)', 1, [4, 4]);
        drawLine(ctx, 0, 0, 1, -k, centerX, centerY, scale, width, height, 'rgba(245,158,11,0.3)', 1, [4, 4]);

        // Hyperbola
        drawHyperbola(ctx, a, b, centerX, centerY, scale, width, '#6366f1', 2.5);

        // Foci
        drawPoint(ctx, -e, 0, centerX, centerY, scale, '#f59e0b', 6, 'F₁', [-14, 8]);
        drawPoint(ctx, e, 0, centerX, centerY, scale, '#f59e0b', 6, 'F₂', [14, 8]);
        drawPoint(ctx, 0, 0, centerX, centerY, scale, '#10b981', 5, 'S', [10, 14]);

        // Vertices
        drawPoint(ctx, -a, 0, centerX, centerY, scale, '#ef4444', 4, '', null);
        drawPoint(ctx, a, 0, centerX, centerY, scale, '#ef4444', 4, '', null);

        // e line
        drawDashed(ctx, 0, 0, e, 0, centerX, centerY, scale, '#f59e0b', 1.5);

        // UI
        document.getElementById('eccVal').textContent = eps.toFixed(2);
        document.getElementById('eccAVal').textContent = a.toFixed(1);
        document.getElementById('eccA').textContent = a.toFixed(2);
        document.getElementById('eccE').textContent = e.toFixed(2);
        document.getElementById('eccB').textContent = b.toFixed(2);

        let shape;
        if (eps < 1.05) shape = '📐 Téměř „nekonečně úzká"';
        else if (eps < 1.2) shape = 'Úzká, špičatá hyperbola';
        else if (eps < 1.5) shape = 'Mírně otevřená';
        else if (eps < 2.5) shape = 'Otevřená hyperbola';
        else shape = '⚡ Velmi otevřená, téměř přímky';
        document.getElementById('eccShape').textContent = shape;
    }

    eccSlider.addEventListener('input', draw);
    eccASlider.addEventListener('input', draw);

    draw();
}

/* ==============================
   PLAYGROUND
   ============================== */
function initPlayground() {
    const canvas = document.getElementById('playgroundCanvas');
    if (!canvas) return;
    const C = setupCanvas(canvas);
    const { ctx, width, height, centerX, centerY, scale } = C;

    let sm = 0, sn = 0;
    let testPoint = null;
    let dragging = false;

    const aSlider = document.getElementById('playASlider');
    const bSlider = document.getElementById('playBSlider');

    function draw() {
        const a = parseFloat(aSlider.value);
        const b = parseFloat(bSlider.value);
        const e = Math.sqrt(a * a + b * b);
        const eps = e / a;

        document.getElementById('playAVal').textContent = a.toFixed(1);
        document.getElementById('playBVal').textContent = b.toFixed(1);
        document.getElementById('playCenter').textContent = `[${sm.toFixed(1)}, ${sn.toFixed(1)}]`;
        document.getElementById('playE').textContent = e.toFixed(2);
        document.getElementById('playEcc').textContent = eps.toFixed(3);
        document.getElementById('playEq').textContent = `x²/${(a * a).toFixed(0)} − y²/${(b * b).toFixed(0)} = 1`;

        ctx.clearRect(0, 0, width, height);
        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY, scale);

        // Draw hyperbola at offset center
        // We do custom drawing here for offset
        const k = b / a;
        // Asymptotes from center
        drawLine(ctx, sm, sn, sm + 1, sn + k, centerX, centerY, scale, width, height, 'rgba(245,158,11,0.2)', 1, [4, 4]);
        drawLine(ctx, sm, sn, sm + 1, sn - k, centerX, centerY, scale, width, height, 'rgba(245,158,11,0.2)', 1, [4, 4]);

        // Right branch
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        let first = true;
        for (let t = -3; t <= 3; t += 0.02) {
            const xh = sm + a * Math.cosh(t);
            const yh = sn + b * Math.sinh(t);
            const [px, py] = toCanvas(xh, yh, centerX, centerY, scale);
            if (px < -20 || px > width + 20) continue;
            if (first) { ctx.moveTo(px, py); first = false; }
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
        // Left branch
        ctx.beginPath();
        first = true;
        for (let t = -3; t <= 3; t += 0.02) {
            const xh = sm - a * Math.cosh(t);
            const yh = sn + b * Math.sinh(t);
            const [px, py] = toCanvas(xh, yh, centerX, centerY, scale);
            if (px < -20 || px > width + 20) continue;
            if (first) { ctx.moveTo(px, py); first = false; }
            else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Foci
        drawPoint(ctx, sm - e, sn, centerX, centerY, scale, '#f59e0b', 5, 'F₁', [-12, 8]);
        drawPoint(ctx, sm + e, sn, centerX, centerY, scale, '#f59e0b', 5, 'F₂', [12, 8]);

        drawPoint(ctx, sm, sn, centerX, centerY, scale, '#10b981', 6, 'S', [0, -14]);

        // Test point
        if (testPoint) {
            const tx = testPoint[0] - sm;
            const ty = testPoint[1] - sn;
            const val = (tx * tx) / (a * a) - (ty * ty) / (b * b);
            let tColor, tLabel;
            if (Math.abs(val - 1) < 0.1) {
                tColor = '#10b981'; tLabel = 'Na hyperbole ✓';
            } else if (val > 1) {
                tColor = '#ef4444'; tLabel = 'Za větvemi (vně)';
            } else {
                tColor = '#f59e0b'; tLabel = 'Mezi větvemi';
            }
            drawDashed(ctx, sm, sn, testPoint[0], testPoint[1], centerX, centerY, scale, tColor);
            drawPoint(ctx, testPoint[0], testPoint[1], centerX, centerY, scale, tColor, 6, 'P', [0, -14]);
            document.getElementById('playTestP').textContent = `[${testPoint[0].toFixed(1)}, ${testPoint[1].toFixed(1)}]`;
            document.getElementById('playTestResult').textContent = tLabel;
            document.getElementById('playTestResult').style.color = tColor;
        }
    }

    aSlider.addEventListener('input', draw);
    bSlider.addEventListener('input', draw);

    canvas.addEventListener('mousedown', ev => {
        const rect = canvas.getBoundingClientRect();
        const [mx, my] = fromCanvas(ev.clientX - rect.left, ev.clientY - rect.top, centerX, centerY, scale);
        if (dist(mx, my, sm, sn) < 0.75) {
            dragging = true;
        } else {
            testPoint = [Math.round(mx * 2) / 2, Math.round(my * 2) / 2];
            draw();
        }
    });
    canvas.addEventListener('mousemove', ev => {
        if (!dragging) return;
        const rect = canvas.getBoundingClientRect();
        const [mx, my] = fromCanvas(ev.clientX - rect.left, ev.clientY - rect.top, centerX, centerY, scale);
        sm = Math.round(mx * 2) / 2;
        sn = Math.round(my * 2) / 2;
        draw();
    });
    canvas.addEventListener('mouseup', () => { dragging = false; });
    canvas.addEventListener('mouseleave', () => { dragging = false; });

    document.getElementById('playResetBtn')?.addEventListener('click', () => {
        sm = 0; sn = 0; testPoint = null;
        aSlider.value = 3; bSlider.value = 2;
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
            correct: '✅ Správně! e = √(a² + b²) = √(9 + 16) = √25 = 5.',
            incorrect: '❌ Zkuste znovu. U hyperboly platí e² = a² + b² (sčítáme!), tedy e = √(a² + b²).'
        },
        2: {
            correct: '✅ Správně! x²/a² − y²/b² = 1 → x²/16 − y²/9 = 1.',
            incorrect: '❌ Zkuste znovu. Kanonická rovnice hyperboly s reálnou osou na x: x²/a² − y²/b² = 1.'
        },
        3: {
            correct: '✅ Správně! a² = 9 → a = 3, b² = 16 → b = 4. Asymptoty: y = ±(b/a)x = ±(4/3)x.',
            incorrect: '❌ Zkuste znovu. Asymptoty: y = ±(b/a)x. a² je pod x², b² je pod y².'
        },
        4: {
            correct: '✅ Správně! e = √(9 + 16) = √25 = 5. ε = e/a = 5/3 ≈ 1.67.',
            incorrect: '❌ Zkuste znovu. ε = e/a = √(a² + b²)/a. Pozor, u hyperboly ε > 1!'
        },
        5: {
            correct: '✅ Správně! e = 5, a = 3 → b = √(e² − a²) = √(25 − 9) = √16 = 4.',
            incorrect: '❌ Zkuste znovu. U hyperboly e² = a² + b² → b² = e² − a² = 25 − 9 = 16.'
        },
        6: {
            correct: '✅ Správně! 25/9 − 9/16 = 2.778 − 0.5625 = 2.215 > 1 → vně (za větvemi).',
            incorrect: '❌ Zkuste znovu. Dosadíme do x²/a² − y²/b². Pokud > 1 → vně, = 1 → na, < 1 → mezi větvemi.'
        }
    };

    document.querySelectorAll('.btn-check').forEach(btn => {
        btn.addEventListener('click', () => {
            const exNum = btn.dataset.exercise;
            const correct = btn.dataset.correct;
            const selected = document.querySelector(`input[name="ex${exNum}"]:checked`);
            if (!selected) return;

            const isCorrect = selected.value === correct;
            const feedback = document.getElementById(`ex${exNum}Feedback`);
            const status = document.getElementById(`ex${exNum}Status`);

            feedback.textContent = feedbackMessages[exNum][isCorrect ? 'correct' : 'incorrect'];
            feedback.className = 'exercise-feedback show ' + (isCorrect ? 'correct' : 'incorrect');
            status.textContent = isCorrect ? '✓ Správně' : '✗ Špatně';
            status.className = 'exercise-status ' + (isCorrect ? 'correct' : 'incorrect');

            document.querySelectorAll(`input[name="ex${exNum}"]`).forEach(input => {
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
            const complete = document.getElementById('lessonComplete');
            if (complete) complete.style.display = 'block';
        }
    }
}
