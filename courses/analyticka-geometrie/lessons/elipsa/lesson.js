/* Lesson 8: Elipsa – Interactive JavaScript */
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initDefinitionDemo();
    initEquationDemo();
    initPropertiesDemo();
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

function drawEllipse(ctx, mx, my, a, b, cx, cy, s, color, lw) {
    const [px, py] = toCanvas(mx, my, cx, cy, s);
    ctx.strokeStyle = color || '#6366f1';
    ctx.lineWidth = lw || 2.5;
    ctx.beginPath();
    ctx.ellipse(px, py, a * s, b * s, 0, 0, Math.PI * 2);
    ctx.stroke();
}

function fillEllipse(ctx, mx, my, a, b, cx, cy, s, color) {
    const [px, py] = toCanvas(mx, my, cx, cy, s);
    ctx.fillStyle = color || 'rgba(99,102,241,0.07)';
    ctx.beginPath();
    ctx.ellipse(px, py, a * s, b * s, 0, 0, Math.PI * 2);
    ctx.fill();
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

function dist(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

/* ==============================
   DEFINITION DEMO (string construction)
   ============================== */
function initDefinitionDemo() {
    const canvas = document.getElementById('definitionCanvas');
    if (!canvas) return;
    const C = setupCanvas(canvas);
    const { ctx, width, height, centerX, centerY, scale } = C;

    const aSlider = document.getElementById('defASlider');
    const bSlider = document.getElementById('defBSlider');

    let angle = 0; // parametric angle
    let dragging = false;

    function draw() {
        let a = parseFloat(aSlider.value);
        let b = parseFloat(bSlider.value);
        // Ensure a >= b
        if (b > a) { b = a; bSlider.value = b; }

        const e = Math.sqrt(a * a - b * b);
        const f1x = -e, f1y = 0;
        const f2x = e, f2y = 0;

        // Point X on ellipse
        const xPt = a * Math.cos(angle);
        const yPt = b * Math.sin(angle);

        ctx.clearRect(0, 0, width, height);
        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY, scale);

        // Ellipse
        fillEllipse(ctx, 0, 0, a, b, centerX, centerY, scale, 'rgba(99,102,241,0.06)');
        drawEllipse(ctx, 0, 0, a, b, centerX, centerY, scale, '#6366f1', 2.5);

        // Lines from X to F1, F2 (the "string")
        const d1 = dist(xPt, yPt, f1x, f1y);
        const d2 = dist(xPt, yPt, f2x, f2y);

        // Draw string
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

        // UI updates
        document.getElementById('defAVal').textContent = a.toFixed(1);
        document.getElementById('defBVal').textContent = b.toFixed(1);
        document.getElementById('defPointX').textContent = `[${xPt.toFixed(1)}, ${yPt.toFixed(1)}]`;
        document.getElementById('defDist1').textContent = d1.toFixed(2);
        document.getElementById('defDist2').textContent = d2.toFixed(2);
        document.getElementById('defSum').textContent = (d1 + d2).toFixed(2);
        document.getElementById('def2a').textContent = `2a = ${(2 * a).toFixed(1)}`;
    }

    canvas.addEventListener('mousedown', e => {
        const rect = canvas.getBoundingClientRect();
        const [mx, my] = fromCanvas(e.clientX - rect.left, e.clientY - rect.top, centerX, centerY, scale);
        const a = parseFloat(aSlider.value);
        const b = parseFloat(bSlider.value);
        const xPt = a * Math.cos(angle);
        const yPt = b * Math.sin(angle);
        if (dist(mx, my, xPt, yPt) < 1) dragging = true;
    });
    canvas.addEventListener('mousemove', e => {
        if (!dragging) return;
        const rect = canvas.getBoundingClientRect();
        const [mx, my] = fromCanvas(e.clientX - rect.left, e.clientY - rect.top, centerX, centerY, scale);
        angle = Math.atan2(my / parseFloat(bSlider.value), mx / parseFloat(aSlider.value));
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
        let a = parseFloat(aSlider.value);
        let b = parseFloat(bSlider.value);

        ctx.clearRect(0, 0, width, height);
        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY, scale);

        // Determine which axis has larger value
        const majorAxis = a >= b ? 'x' : 'y';
        const realA = Math.max(a, b);
        const realB = Math.min(a, b);
        const e = Math.sqrt(realA * realA - realB * realB);

        // Ellipse
        fillEllipse(ctx, 0, 0, a, b, centerX, centerY, scale, 'rgba(99,102,241,0.06)');
        drawEllipse(ctx, 0, 0, a, b, centerX, centerY, scale, '#6366f1', 2.5);

        // Semi-axes (dashed)
        drawDashed(ctx, 0, 0, a, 0, centerX, centerY, scale, '#6366f1', 1.5);
        drawDashed(ctx, 0, 0, 0, b, centerX, centerY, scale, '#a78bfa', 1.5);

        // Semi-axis labels
        const [lax, lay] = toCanvas(a / 2, 0, centerX, centerY, scale);
        ctx.fillStyle = '#6366f1';
        ctx.font = '600 13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('a', lax, lay - 10);

        const [lbx, lby] = toCanvas(0, b / 2, centerX, centerY, scale);
        ctx.fillStyle = '#a78bfa';
        ctx.fillText('b', lbx + 14, lby + 4);

        // Foci
        let f1, f2;
        if (majorAxis === 'x') {
            f1 = [-e, 0]; f2 = [e, 0];
        } else {
            f1 = [0, -e]; f2 = [0, e];
        }
        drawPoint(ctx, f1[0], f1[1], centerX, centerY, scale, '#f59e0b', 6, 'F₁', [-14, majorAxis === 'x' ? 8 : -14]);
        drawPoint(ctx, f2[0], f2[1], centerX, centerY, scale, '#f59e0b', 6, 'F₂', [14, majorAxis === 'x' ? 8 : 14]);

        // Vertices
        drawPoint(ctx, -a, 0, centerX, centerY, scale, '#ef4444', 5, 'A₁', [-14, -8]);
        drawPoint(ctx, a, 0, centerX, centerY, scale, '#ef4444', 5, 'A₂', [14, -8]);
        drawPoint(ctx, 0, -b, centerX, centerY, scale, '#a78bfa', 5, 'B₁', [14, 8]);
        drawPoint(ctx, 0, b, centerX, centerY, scale, '#a78bfa', 5, 'B₂', [14, -8]);

        // Center
        drawPoint(ctx, 0, 0, centerX, centerY, scale, '#10b981', 5, 'S', [10, 14]);

        // Update UI
        document.getElementById('eqAVal').textContent = a.toFixed(1);
        document.getElementById('eqBVal').textContent = b.toFixed(1);
        document.getElementById('eqA').textContent = a.toFixed(2);
        document.getElementById('eqB').textContent = b.toFixed(2);
        document.getElementById('eqE').textContent = e.toFixed(2);

        document.getElementById('eqEquation').textContent = `x²/${(a * a).toFixed(0)} + y²/${(b * b).toFixed(0)} = 1`;

        if (majorAxis === 'x') {
            document.getElementById('eqF1').textContent = `[−${e.toFixed(1)}, 0]`;
            document.getElementById('eqF2').textContent = `[${e.toFixed(1)}, 0]`;
        } else {
            document.getElementById('eqF1').textContent = `[0, −${e.toFixed(1)}]`;
            document.getElementById('eqF2').textContent = `[0, ${e.toFixed(1)}]`;
        }
    }

    aSlider.addEventListener('input', draw);
    bSlider.addEventListener('input', draw);

    draw();
}

/* ==============================
   PROPERTIES DEMO
   ============================== */
function initPropertiesDemo() {
    const canvas = document.getElementById('propertiesCanvas');
    if (!canvas) return;
    const C = setupCanvas(canvas);
    const { ctx, width, height, centerX, centerY, scale } = C;

    const aSlider = document.getElementById('propASlider');
    const bSlider = document.getElementById('propBSlider');
    const showTriangle = document.getElementById('propShowTriangle');

    function draw() {
        let a = parseFloat(aSlider.value);
        let b = parseFloat(bSlider.value);
        if (b > a) { b = a; bSlider.value = b; }

        const e = Math.sqrt(a * a - b * b);

        ctx.clearRect(0, 0, width, height);
        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY, scale);

        // Ellipse
        fillEllipse(ctx, 0, 0, a, b, centerX, centerY, scale, 'rgba(99,102,241,0.06)');
        drawEllipse(ctx, 0, 0, a, b, centerX, centerY, scale, '#6366f1', 2.5);

        // Axes (full, solid colored)
        drawDashed(ctx, -a, 0, a, 0, centerX, centerY, scale, '#6366f1', 2);
        drawDashed(ctx, 0, -b, 0, b, centerX, centerY, scale, '#a78bfa', 2);

        // Focal triangle: F₂, B₂, S
        if (showTriangle.checked && e > 0.1) {
            const [pSx, pSy] = toCanvas(0, 0, centerX, centerY, scale);
            const [pF2x, pF2y] = toCanvas(e, 0, centerX, centerY, scale);
            const [pB2x, pB2y] = toCanvas(0, b, centerX, centerY, scale);

            ctx.strokeStyle = 'rgba(245,158,11,0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(pSx, pSy);
            ctx.lineTo(pF2x, pF2y);
            ctx.lineTo(pB2x, pB2y);
            ctx.closePath();
            ctx.fillStyle = 'rgba(245,158,11,0.08)';
            ctx.fill();
            ctx.stroke();

            // Labels on sides
            const midSF = [(pSx + pF2x) / 2, (pSy + pF2y) / 2];
            ctx.fillStyle = '#f59e0b';
            ctx.font = '600 12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('e', midSF[0], midSF[1] + 16);

            const midSB = [(pSx + pB2x) / 2, (pSy + pB2y) / 2];
            ctx.fillText('b', midSB[0] - 14, midSB[1]);

            const midFB = [(pF2x + pB2x) / 2, (pF2y + pB2y) / 2];
            ctx.fillText('a', midFB[0] + 14, midFB[1]);

            // Right angle at S
            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            ctx.lineWidth = 1.5;
            const raSize = 8;
            ctx.beginPath();
            ctx.moveTo(pSx + raSize, pSy);
            ctx.lineTo(pSx + raSize, pSy - raSize);
            ctx.lineTo(pSx, pSy - raSize);
            ctx.stroke();
        }

        // Points: vertices
        drawPoint(ctx, -a, 0, centerX, centerY, scale, '#ef4444', 6, 'A₁', [-14, -8]);
        drawPoint(ctx, a, 0, centerX, centerY, scale, '#ef4444', 6, 'A₂', [14, -8]);
        drawPoint(ctx, 0, -b, centerX, centerY, scale, '#a78bfa', 6, 'B₁', [14, 10]);
        drawPoint(ctx, 0, b, centerX, centerY, scale, '#a78bfa', 6, 'B₂', [14, -10]);

        // Foci
        drawPoint(ctx, -e, 0, centerX, centerY, scale, '#f59e0b', 6, 'F₁', [-14, 10]);
        drawPoint(ctx, e, 0, centerX, centerY, scale, '#f59e0b', 6, 'F₂', [14, 10]);

        // Center
        drawPoint(ctx, 0, 0, centerX, centerY, scale, '#10b981', 5, 'S', [10, 14]);

        // UI
        document.getElementById('propAVal').textContent = a.toFixed(1);
        document.getElementById('propBVal').textContent = b.toFixed(1);
        document.getElementById('prop2a').textContent = (2 * a).toFixed(1);
        document.getElementById('prop2b').textContent = (2 * b).toFixed(1);
        document.getElementById('propE').textContent = e.toFixed(2);
        document.getElementById('propVertA').textContent = `[−${a.toFixed(0)}, 0], [${a.toFixed(0)}, 0]`;
        document.getElementById('propVertB').textContent = `[0, −${b.toFixed(0)}], [0, ${b.toFixed(0)}]`;
        document.getElementById('propFoci').textContent = `[−${e.toFixed(1)}, 0], [${e.toFixed(1)}, 0]`;
    }

    aSlider.addEventListener('input', draw);
    bSlider.addEventListener('input', draw);
    showTriangle.addEventListener('change', draw);

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
        const b = Math.sqrt(Math.max(a * a - e * e, 0.01));

        ctx.clearRect(0, 0, width, height);
        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY, scale);

        // Ghost circle of radius a for comparison
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        const [pcx, pcy] = toCanvas(0, 0, centerX, centerY, scale);
        ctx.beginPath();
        ctx.arc(pcx, pcy, a * scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Ellipse
        fillEllipse(ctx, 0, 0, a, b, centerX, centerY, scale, 'rgba(99,102,241,0.06)');
        drawEllipse(ctx, 0, 0, a, b, centerX, centerY, scale, '#6366f1', 2.5);

        // Foci
        drawPoint(ctx, -e, 0, centerX, centerY, scale, '#f59e0b', 6, 'F₁', [-14, 8]);
        drawPoint(ctx, e, 0, centerX, centerY, scale, '#f59e0b', 6, 'F₂', [14, 8]);
        drawPoint(ctx, 0, 0, centerX, centerY, scale, '#10b981', 5, 'S', [10, 14]);

        // e line
        drawDashed(ctx, 0, 0, e, 0, centerX, centerY, scale, '#f59e0b', 1.5);
        const [eLx, eLy] = toCanvas(e / 2, 0, centerX, centerY, scale);
        ctx.fillStyle = '#f59e0b';
        ctx.font = '600 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('e', eLx, eLy + 16);

        // UI
        document.getElementById('eccVal').textContent = eps.toFixed(2);
        document.getElementById('eccAVal').textContent = a.toFixed(1);
        document.getElementById('eccA').textContent = a.toFixed(2);
        document.getElementById('eccE').textContent = e.toFixed(2);
        document.getElementById('eccB').textContent = b.toFixed(2);

        let shape;
        if (eps < 0.01) shape = '⭕ Kružnice (ε = 0)';
        else if (eps < 0.3) shape = 'Téměř kruhová elipsa';
        else if (eps < 0.6) shape = 'Mírně protáhlá elipsa';
        else if (eps < 0.85) shape = 'Protáhlá elipsa';
        else shape = '⚡ Velmi protáhlá elipsa';
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
        const realA = Math.max(a, b);
        const realB = Math.min(a, b);
        const e = Math.sqrt(realA * realA - realB * realB);
        const eps = realA > 0 ? e / realA : 0;

        document.getElementById('playAVal').textContent = a.toFixed(1);
        document.getElementById('playBVal').textContent = b.toFixed(1);
        document.getElementById('playCenter').textContent = `[${sm.toFixed(1)}, ${sn.toFixed(1)}]`;
        document.getElementById('playE').textContent = e.toFixed(2);
        document.getElementById('playEcc').textContent = eps.toFixed(3);
        document.getElementById('playEq').textContent = `x²/${(a * a).toFixed(0)} + y²/${(b * b).toFixed(0)} = 1`;

        ctx.clearRect(0, 0, width, height);
        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY, scale);

        // Ellipse
        const [px, py] = toCanvas(sm, sn, centerX, centerY, scale);
        ctx.fillStyle = 'rgba(99,102,241,0.06)';
        ctx.beginPath();
        ctx.ellipse(px, py, a * scale, b * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(px, py, a * scale, b * scale, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Foci (on main axis)
        if (a >= b) {
            drawPoint(ctx, sm - e, sn, centerX, centerY, scale, '#f59e0b', 5, 'F₁', [-12, 8]);
            drawPoint(ctx, sm + e, sn, centerX, centerY, scale, '#f59e0b', 5, 'F₂', [12, 8]);
        } else {
            drawPoint(ctx, sm, sn - e, centerX, centerY, scale, '#f59e0b', 5, 'F₁', [12, 8]);
            drawPoint(ctx, sm, sn + e, centerX, centerY, scale, '#f59e0b', 5, 'F₂', [12, -8]);
        }

        drawPoint(ctx, sm, sn, centerX, centerY, scale, '#10b981', 6, 'S', [0, -14]);

        // Test point
        if (testPoint) {
            const tx = testPoint[0] - sm;
            const ty = testPoint[1] - sn;
            const val = (tx * tx) / (a * a) + (ty * ty) / (b * b);
            let tColor, tLabel;
            if (Math.abs(val - 1) < 0.08) {
                tColor = '#10b981'; tLabel = 'Na elipse ✓';
            } else if (val < 1) {
                tColor = '#f59e0b'; tLabel = 'Uvnitř';
            } else {
                tColor = '#ef4444'; tLabel = 'Vně';
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
        aSlider.value = 4; bSlider.value = 2.5;
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
            correct: '✅ Správně! e = √(a² − b²) = √(25 − 9) = √16 = 4.',
            incorrect: '❌ Zkuste znovu. Použijte vztah e² = a² − b², tedy e = √(a² − b²).'
        },
        2: {
            correct: '✅ Správně! Dosadíme a² = 36, b² = 16 do vzorce x²/a² + y²/b² = 1.',
            incorrect: '❌ Zkuste znovu. Do rovnice dosazujeme a² a b², ne a a b!'
        },
        3: {
            correct: '✅ Správně! a² = 25, b² = 9 → e = √(25−9) = √16 = 4. Protože a² > b², ohniska leží na ose x.',
            incorrect: '❌ Zkuste znovu. Větší jmenovatel = hlavní poloosa → ohniska na té ose. e = √(a²−b²).'
        },
        4: {
            correct: '✅ Správně! a² = 100 → a = 10, e = √(100−64) = √36 = 6. ε = e/a = 6/10 = 0.6.',
            incorrect: '❌ Zkuste znovu. ε = e/a = √(a²−b²)/a. Spočítejte e = √(100−64) a dělte a = 10.'
        },
        5: {
            correct: '✅ Správně! e = 3, a = 5 → b = √(a²−e²) = √(25−9) = √16 = 4.',
            incorrect: '❌ Zkuste znovu. Použijte a² = b² + e² → b² = a² − e² = 25 − 9 = 16.'
        },
        6: {
            correct: '✅ Správně! 9/25 + 4/9 = 0.36 + 0.444 = 0.804 < 1 → bod leží uvnitř.',
            incorrect: '❌ Zkuste znovu. Dosadíte souřadnice bodu do x²/a² + y²/b²: pokud je < 1 → uvnitř, = 1 → na elipse, > 1 → vně.'
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
