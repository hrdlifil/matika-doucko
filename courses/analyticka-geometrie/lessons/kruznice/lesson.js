/* Lesson 7: Kružnice - Interactive JavaScript */
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initCenterFormDemo();
    initGeneralFormDemo();
    initLineCircleDemo();
    initTangentDemo();
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

    // Handle #hash on load
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
    return { ctx, width, height, centerX, centerY, scale, dpr };
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
    // Arrow tips
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

function drawCircle(ctx, mx, my, r, cx, cy, s, color, lineWidth) {
    const [px, py] = toCanvas(mx, my, cx, cy, s);
    ctx.strokeStyle = color || '#6366f1';
    ctx.lineWidth = lineWidth || 2.5;
    ctx.beginPath();
    ctx.arc(px, py, r * s, 0, Math.PI * 2);
    ctx.stroke();
}

function drawCircleFill(ctx, mx, my, r, cx, cy, s, color) {
    const [px, py] = toCanvas(mx, my, cx, cy, s);
    ctx.fillStyle = color || 'rgba(99, 102, 241, 0.08)';
    ctx.beginPath();
    ctx.arc(px, py, r * s, 0, Math.PI * 2);
    ctx.fill();
}

function drawPoint(ctx, x, y, cx, cy, s, color, radius, label, labelOffset) {
    const [px, py] = toCanvas(x, y, cx, cy, s);
    ctx.fillStyle = color || '#f59e0b';
    ctx.beginPath();
    ctx.arc(px, py, radius || 6, 0, Math.PI * 2);
    ctx.fill();
    // White border
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (label) {
        ctx.fillStyle = color || '#f59e0b';
        ctx.font = '600 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        const ox = labelOffset ? labelOffset[0] : 0;
        const oy = labelOffset ? labelOffset[1] : -14;
        ctx.fillText(label, px + ox, py + oy);
    }
}

function drawGeneralLine(ctx, a, b, c, w, h, cx, cy, s, color, lw) {
    if (a === 0 && b === 0) return;
    ctx.strokeStyle = color || '#f59e0b';
    ctx.lineWidth = lw || 2;
    let x1, y1, x2, y2;
    if (Math.abs(b) > Math.abs(a)) {
        x1 = (0 - cx) / s;
        y1 = -(a * x1 + c) / b;
        x2 = (w - cx) / s;
        y2 = -(a * x2 + c) / b;
    } else {
        y1 = (cy - 0) / s;
        x1 = -(b * y1 + c) / a;
        y2 = (cy - h) / s;
        x2 = -(b * y2 + c) / a;
    }
    const [px1, py1] = toCanvas(x1, y1, cx, cy, s);
    const [px2, py2] = toCanvas(x2, y2, cx, cy, s);
    ctx.beginPath();
    ctx.moveTo(px1, py1);
    ctx.lineTo(px2, py2);
    ctx.stroke();
}

function drawDashed(ctx, x1, y1, x2, y2, cx, cy, s, color) {
    const [px1, py1] = toCanvas(x1, y1, cx, cy, s);
    const [px2, py2] = toCanvas(x2, y2, cx, cy, s);
    ctx.strokeStyle = color || '#10b981';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(px1, py1);
    ctx.lineTo(px2, py2);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawRadiusLine(ctx, sx, sy, tx, ty, cx, cy, s, color) {
    const [px1, py1] = toCanvas(sx, sy, cx, cy, s);
    const [px2, py2] = toCanvas(tx, ty, cx, cy, s);
    ctx.strokeStyle = color || 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(px1, py1);
    ctx.lineTo(px2, py2);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawRightAngle(ctx, px, py, angle, size) {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(size, -size);
    ctx.lineTo(0, -size);
    ctx.stroke();
    ctx.restore();
}

function dist(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function pointLineDist(a, b, c, x, y) {
    return Math.abs(a * x + b * y + c) / Math.sqrt(a * a + b * b);
}

/* ==============================
   CENTER FORM DEMO
   ============================== */
function initCenterFormDemo() {
    const canvas = document.getElementById('centerFormCanvas');
    if (!canvas) return;
    const C = setupCanvas(canvas);
    const { ctx, width, height, centerX, centerY, scale } = C;

    let sm = 0, sn = 0, r = 3;
    let testPoint = null;
    let dragging = false;

    const rSlider = document.getElementById('cfRadiusSlider');

    function draw() {
        ctx.clearRect(0, 0, width, height);
        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY, scale);

        // Circle fill + stroke
        drawCircleFill(ctx, sm, sn, r, centerX, centerY, scale, 'rgba(99, 102, 241, 0.07)');
        drawCircle(ctx, sm, sn, r, centerX, centerY, scale, '#6366f1', 2.5);

        // Radius line
        const rx = sm + r;
        drawRadiusLine(ctx, sm, sn, rx, sn, centerX, centerY, scale, 'rgba(99,102,241,0.5)');
        // Radius label
        const [rmx, rmy] = toCanvas(sm + r / 2, sn, centerX, centerY, scale);
        ctx.fillStyle = '#a78bfa';
        ctx.font = '600 13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('r = ' + r.toFixed(1), rmx, rmy - 10);

        // Center point
        drawPoint(ctx, sm, sn, centerX, centerY, scale, '#10b981', 7, 'S', [0, -16]);

        // Test point
        if (testPoint) {
            const d = dist(testPoint[0], testPoint[1], sm, sn);
            let tColor = '#f59e0b';
            let tLabel = 'P (uvnitř)';
            if (Math.abs(d - r) < 0.15) {
                tColor = '#10b981';
                tLabel = 'P (na kružnici)';
            } else if (d > r) {
                tColor = '#ef4444';
                tLabel = 'P (vně)';
            }
            drawDashed(ctx, sm, sn, testPoint[0], testPoint[1], centerX, centerY, scale, tColor);
            drawPoint(ctx, testPoint[0], testPoint[1], centerX, centerY, scale, tColor, 6, 'P', [0, -14]);

            document.getElementById('cfTestPoint').textContent = `[${testPoint[0].toFixed(1)}, ${testPoint[1].toFixed(1)}]`;
            document.getElementById('cfTestDist').textContent = d.toFixed(2);
            const poloha = Math.abs(d - r) < 0.15 ? 'Na kružnici ✓' : (d < r ? 'Uvnitř' : 'Vně');
            document.getElementById('cfTestResult').textContent = poloha;
            document.getElementById('cfTestResult').style.color = tColor;
        }

        // Update info
        document.getElementById('cfCenter').textContent = `[${sm.toFixed(1)}, ${sn.toFixed(1)}]`;
        document.getElementById('cfRadiusVal').textContent = r.toFixed(1);

        // Equation
        const mPart = sm === 0 ? 'x²' : `(x ${sm > 0 ? '− ' + sm.toFixed(0) : '+ ' + (-sm).toFixed(0)})²`;
        const nPart = sn === 0 ? 'y²' : `(y ${sn > 0 ? '− ' + sn.toFixed(0) : '+ ' + (-sn).toFixed(0)})²`;
        document.getElementById('cfEquation').textContent = `${mPart} + ${nPart} = ${(r * r).toFixed(0)}`;
    }

    rSlider.addEventListener('input', () => {
        r = parseFloat(rSlider.value);
        draw();
    });

    canvas.addEventListener('mousedown', e => {
        const rect = canvas.getBoundingClientRect();
        const [mx, my] = fromCanvas(e.clientX - rect.left, e.clientY - rect.top, centerX, centerY, scale);
        if (dist(mx, my, sm, sn) < 0.75) {
            dragging = true;
        } else {
            testPoint = [Math.round(mx * 2) / 2, Math.round(my * 2) / 2];
            draw();
        }
    });
    canvas.addEventListener('mousemove', e => {
        if (!dragging) return;
        const rect = canvas.getBoundingClientRect();
        const [mx, my] = fromCanvas(e.clientX - rect.left, e.clientY - rect.top, centerX, centerY, scale);
        sm = Math.round(mx * 2) / 2;
        sn = Math.round(my * 2) / 2;
        draw();
    });
    canvas.addEventListener('mouseup', () => { dragging = false; });
    canvas.addEventListener('mouseleave', () => { dragging = false; });

    draw();
}

/* ==============================
   GENERAL FORM DEMO
   ============================== */
function initGeneralFormDemo() {
    const canvas = document.getElementById('generalFormCanvas');
    if (!canvas) return;
    const C = setupCanvas(canvas);
    const { ctx, width, height, centerX, centerY, scale } = C;

    const dSlider = document.getElementById('gfDSlider');
    const eSlider = document.getElementById('gfESlider');
    const fSlider = document.getElementById('gfFSlider');

    function draw() {
        const D = parseInt(dSlider.value);
        const E = parseInt(eSlider.value);
        const F = parseInt(fSlider.value);

        document.getElementById('gfDValue').textContent = D;
        document.getElementById('gfEValue').textContent = E;
        document.getElementById('gfFValue').textContent = F;

        const mx = -D / 2;
        const ny = -E / 2;
        const r2 = D * D / 4 + E * E / 4 - F;

        ctx.clearRect(0, 0, width, height);
        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY, scale);

        document.getElementById('gfCenter').textContent = `[${mx.toFixed(1)}, ${ny.toFixed(1)}]`;
        document.getElementById('gfR2').textContent = r2.toFixed(2);

        if (r2 > 0) {
            const r = Math.sqrt(r2);
            document.getElementById('gfRadius').textContent = r.toFixed(2);
            drawCircleFill(ctx, mx, ny, r, centerX, centerY, scale, 'rgba(99,102,241,0.07)');
            drawCircle(ctx, mx, ny, r, centerX, centerY, scale, '#6366f1', 2.5);
            drawPoint(ctx, mx, ny, centerX, centerY, scale, '#10b981', 7, 'S', [0, -16]);

            // Radius line
            drawRadiusLine(ctx, mx, ny, mx + r, ny, centerX, centerY, scale, 'rgba(99,102,241,0.5)');

            const mPart = mx === 0 ? 'x²' : `(x ${mx > 0 ? '− ' + mx.toFixed(0) : '+ ' + (-mx).toFixed(0)})²`;
            const nPart = ny === 0 ? 'y²' : `(y ${ny > 0 ? '− ' + ny.toFixed(0) : '+ ' + (-ny).toFixed(0)})²`;
            document.getElementById('gfCenterEq').textContent = `${mPart} + ${nPart} = ${r2.toFixed(0)}`;
            document.getElementById('gfCenterEq').style.color = '#10b981';
            document.getElementById('gfStatus').textContent = '✅ Kružnice';
            document.getElementById('gfStatus').style.color = '#10b981';
        } else if (r2 === 0) {
            document.getElementById('gfRadius').textContent = '0';
            drawPoint(ctx, mx, ny, centerX, centerY, scale, '#f59e0b', 8, 'S', [0, -16]);
            document.getElementById('gfCenterEq').textContent = `Jediný bod [${mx.toFixed(0)}, ${ny.toFixed(0)}]`;
            document.getElementById('gfCenterEq').style.color = '#f59e0b';
            document.getElementById('gfStatus').textContent = '⚠️ Bod (r² = 0)';
            document.getElementById('gfStatus').style.color = '#f59e0b';
        } else {
            document.getElementById('gfRadius').textContent = '∅';
            document.getElementById('gfCenterEq').textContent = 'Prázdná množina';
            document.getElementById('gfCenterEq').style.color = '#ef4444';
            document.getElementById('gfStatus').textContent = '❌ Neexistuje (r² < 0)';
            document.getElementById('gfStatus').style.color = '#ef4444';
            // Draw a dimmed center
            drawPoint(ctx, mx, ny, centerX, centerY, scale, 'rgba(239,68,68,0.5)', 5, 'S?', [0, -14]);
        }
    }

    dSlider.addEventListener('input', draw);
    eSlider.addEventListener('input', draw);
    fSlider.addEventListener('input', draw);
    draw();
}

/* ==============================
   LINE-CIRCLE DEMO
   ============================== */
function initLineCircleDemo() {
    const canvas = document.getElementById('lineCircleCanvas');
    if (!canvas) return;
    const C = setupCanvas(canvas);
    const { ctx, width, height, centerX, centerY, scale } = C;

    let sm = 0, sn = 0;
    let dragging = false;

    const rSlider = document.getElementById('lcRadiusSlider');
    const aSlider = document.getElementById('lcASlider');
    const bSlider = document.getElementById('lcBSlider');
    const cSlider = document.getElementById('lcCSlider');

    function draw() {
        const r = parseFloat(rSlider.value);
        const a = parseInt(aSlider.value);
        const b = parseInt(bSlider.value);
        const c = parseInt(cSlider.value);

        document.getElementById('lcAValue').textContent = a;
        document.getElementById('lcBValue').textContent = b;
        document.getElementById('lcCValue').textContent = c;
        document.getElementById('lcRadiusVal').textContent = r.toFixed(1);
        document.getElementById('lcCenter').textContent = `[${sm.toFixed(1)}, ${sn.toFixed(1)}]`;

        ctx.clearRect(0, 0, width, height);
        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY, scale);

        // Circle
        drawCircleFill(ctx, sm, sn, r, centerX, centerY, scale, 'rgba(99,102,241,0.07)');
        drawCircle(ctx, sm, sn, r, centerX, centerY, scale, '#6366f1', 2.5);
        drawPoint(ctx, sm, sn, centerX, centerY, scale, '#10b981', 6, 'S', [0, -14]);

        // Line (only if a or b != 0)
        if (a !== 0 || b !== 0) {
            drawGeneralLine(ctx, a, b, c, width, height, centerX, centerY, scale, '#f59e0b', 2.5);

            const d = pointLineDist(a, b, c, sm, sn);
            document.getElementById('lcDist').textContent = d.toFixed(2);
            document.getElementById('lcR').textContent = r.toFixed(2);

            // Draw perpendicular from center to line
            const norm = a * a + b * b;
            const footX = sm - a * (a * sm + b * sn + c) / norm;
            const footY = sn - b * (a * sm + b * sn + c) / norm;
            drawDashed(ctx, sm, sn, footX, footY, centerX, centerY, scale, 'rgba(255,255,255,0.4)');

            // Distance label
            const [dLx, dLy] = toCanvas((sm + footX) / 2, (sn + footY) / 2, centerX, centerY, scale);
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '600 12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('d = ' + d.toFixed(2), dLx + 20, dLy - 8);

            // Find intersections and status
            let statusText, statusColor, compareText;
            if (Math.abs(d - r) < 0.05) {
                statusText = '🟡 Tečna — 1 průsečík';
                statusColor = '#f59e0b';
                compareText = 'd ≈ r';
                // Draw tangent point
                drawPoint(ctx, footX, footY, centerX, centerY, scale, '#f59e0b', 7, 'T', [0, -14]);
            } else if (d > r) {
                statusText = '🔴 Vnější přímka — 0 průsečíků';
                statusColor = '#ef4444';
                compareText = 'd > r';
            } else {
                statusText = '🟢 Sečna — 2 průsečíky';
                statusColor = '#10b981';
                compareText = 'd < r';

                // Compute intersection points
                const halfChord = Math.sqrt(r * r - d * d);
                const dirX = -b / Math.sqrt(norm);
                const dirY = a / Math.sqrt(norm);
                const p1x = footX + halfChord * dirX;
                const p1y = footY + halfChord * dirY;
                const p2x = footX - halfChord * dirX;
                const p2y = footY - halfChord * dirY;
                drawPoint(ctx, p1x, p1y, centerX, centerY, scale, '#10b981', 6, 'P₁', [12, -10]);
                drawPoint(ctx, p2x, p2y, centerX, centerY, scale, '#10b981', 6, 'P₂', [-12, -10]);
            }

            document.getElementById('lcCompare').textContent = compareText;
            document.getElementById('lcCompare').style.color = statusColor;
            document.getElementById('lcStatus').textContent = statusText;
            document.getElementById('lcStatus').style.color = statusColor;
        } else {
            document.getElementById('lcDist').textContent = '—';
            document.getElementById('lcR').textContent = r.toFixed(2);
            document.getElementById('lcCompare').textContent = '—';
            document.getElementById('lcStatus').textContent = 'Přímka nedefinována (a=b=0)';
            document.getElementById('lcStatus').style.color = '#ef4444';
        }
    }

    rSlider.addEventListener('input', draw);
    aSlider.addEventListener('input', draw);
    bSlider.addEventListener('input', draw);
    cSlider.addEventListener('input', draw);

    canvas.addEventListener('mousedown', e => {
        const rect = canvas.getBoundingClientRect();
        const [mx, my] = fromCanvas(e.clientX - rect.left, e.clientY - rect.top, centerX, centerY, scale);
        if (dist(mx, my, sm, sn) < 0.75) dragging = true;
    });
    canvas.addEventListener('mousemove', e => {
        if (!dragging) return;
        const rect = canvas.getBoundingClientRect();
        const [mx, my] = fromCanvas(e.clientX - rect.left, e.clientY - rect.top, centerX, centerY, scale);
        sm = Math.round(mx * 2) / 2;
        sn = Math.round(my * 2) / 2;
        draw();
    });
    canvas.addEventListener('mouseup', () => { dragging = false; });
    canvas.addEventListener('mouseleave', () => { dragging = false; });

    draw();
}

/* ==============================
   TANGENT DEMO
   ============================== */
function initTangentDemo() {
    const canvas = document.getElementById('tangentCanvas');
    if (!canvas) return;
    const C = setupCanvas(canvas);
    const { ctx, width, height, centerX, centerY, scale } = C;

    const sm = 0, sn = 0, r = 3;
    let angle = 0; // angle on the circle for the tangent point
    let dragging = false;

    function draw() {
        const tx = sm + r * Math.cos(angle);
        const ty = sn + r * Math.sin(angle);

        ctx.clearRect(0, 0, width, height);
        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY, scale);

        // Circle
        drawCircleFill(ctx, sm, sn, r, centerX, centerY, scale, 'rgba(99,102,241,0.07)');
        drawCircle(ctx, sm, sn, r, centerX, centerY, scale, '#6366f1', 2.5);

        // Radius to T
        drawRadiusLine(ctx, sm, sn, tx, ty, centerX, centerY, scale, 'rgba(99,102,241,0.5)');

        // Tangent line: x0*x + y0*y = r^2 for circle centered at origin
        // General form: tx*x + ty*y - r^2 = 0  =>  a=tx, b=ty, c=-r^2
        const ta = tx - sm;
        const tb = ty - sn;
        const tc = -(ta * tx + tb * ty);
        // But for x²+y²=r²: a=tx, b=ty, c=-r²
        const lineA = tx;
        const lineB = ty;
        const lineC = -(r * r);

        drawGeneralLine(ctx, lineA, lineB, lineC, width, height, centerX, centerY, scale, '#f59e0b', 2.5);

        // Right angle indicator at T
        const [tpx, tpy] = toCanvas(tx, ty, centerX, centerY, scale);
        const raAngle = Math.atan2(-(sn - ty), -(sm - tx));
        drawRightAngle(ctx, tpx, tpy, raAngle, 10);

        // Points
        drawPoint(ctx, sm, sn, centerX, centerY, scale, '#10b981', 7, 'S', [0, -16]);
        drawPoint(ctx, tx, ty, centerX, centerY, scale, '#f59e0b', 7, 'T', [0, -16]);

        // Update info
        document.getElementById('tanCenter').textContent = `[${sm.toFixed(1)}, ${sn.toFixed(1)}]`;
        document.getElementById('tanRadius').textContent = r.toFixed(2);
        document.getElementById('tanTouchPoint').textContent = `[${tx.toFixed(1)}, ${ty.toFixed(1)}]`;

        // Tangent equation string
        let eqStr;
        if (Math.abs(ty) < 0.001) {
            eqStr = `x = ${(r * r / tx).toFixed(1)}`;
        } else if (Math.abs(tx) < 0.001) {
            eqStr = `y = ${(r * r / ty).toFixed(1)}`;
        } else {
            const coefX = tx.toFixed(1);
            const coefY = ty >= 0 ? `+ ${ty.toFixed(1)}` : `− ${(-ty).toFixed(1)}`;
            eqStr = `${coefX}x ${coefY}y = ${(r * r).toFixed(0)}`;
        }
        document.getElementById('tanEquation').textContent = eqStr;

        // Verification
        const dCheck = pointLineDist(lineA, lineB, lineC, sm, sn);
        document.getElementById('tanDistCheck').textContent = dCheck.toFixed(2);
        document.getElementById('tanVerify').textContent = Math.abs(dCheck - r) < 0.05 ? '✓ Ano' : '✗ Ne';
        document.getElementById('tanVerify').style.color = Math.abs(dCheck - r) < 0.05 ? '#10b981' : '#ef4444';
    }

    canvas.addEventListener('mousedown', e => {
        const rect = canvas.getBoundingClientRect();
        const [mx, my] = fromCanvas(e.clientX - rect.left, e.clientY - rect.top, centerX, centerY, scale);
        const tx = sm + r * Math.cos(angle);
        const ty = sn + r * Math.sin(angle);
        if (dist(mx, my, tx, ty) < 1) {
            dragging = true;
        }
    });
    canvas.addEventListener('mousemove', e => {
        if (!dragging) return;
        const rect = canvas.getBoundingClientRect();
        const [mx, my] = fromCanvas(e.clientX - rect.left, e.clientY - rect.top, centerX, centerY, scale);
        angle = Math.atan2(my - sn, mx - sm);
        draw();
    });
    canvas.addEventListener('mouseup', () => { dragging = false; });
    canvas.addEventListener('mouseleave', () => { dragging = false; });

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
    let dragging = false;

    const rSlider = document.getElementById('playRSlider');
    const paSlider = document.getElementById('playPASlider');
    const pbSlider = document.getElementById('playPBSlider');
    const pcSlider = document.getElementById('playPCSlider');

    function draw() {
        const r = parseFloat(rSlider.value);
        const a = parseInt(paSlider.value);
        const b = parseInt(pbSlider.value);
        const c = parseInt(pcSlider.value);

        document.getElementById('playRVal').textContent = r.toFixed(1);
        document.getElementById('playPAVal').textContent = a;
        document.getElementById('playPBVal').textContent = b;
        document.getElementById('playPCVal').textContent = c;
        document.getElementById('playCenter').textContent = `[${sm.toFixed(1)}, ${sn.toFixed(1)}]`;

        ctx.clearRect(0, 0, width, height);
        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY, scale);

        // Circle
        drawCircleFill(ctx, sm, sn, r, centerX, centerY, scale, 'rgba(99,102,241,0.07)');
        drawCircle(ctx, sm, sn, r, centerX, centerY, scale, '#6366f1', 2.5);
        drawPoint(ctx, sm, sn, centerX, centerY, scale, '#10b981', 6, 'S', [0, -14]);

        // Line
        if (a !== 0 || b !== 0) {
            drawGeneralLine(ctx, a, b, c, width, height, centerX, centerY, scale, '#f59e0b', 2);
            const d = pointLineDist(a, b, c, sm, sn);
            document.getElementById('playDist').textContent = d.toFixed(2);
            if (Math.abs(d - r) < 0.05) {
                document.getElementById('playPosition').textContent = 'Tečna';
                document.getElementById('playPosition').style.color = '#f59e0b';
            } else if (d > r) {
                document.getElementById('playPosition').textContent = 'Vnější';
                document.getElementById('playPosition').style.color = '#ef4444';
            } else {
                document.getElementById('playPosition').textContent = 'Sečna';
                document.getElementById('playPosition').style.color = '#10b981';

                // Intersections
                const norm = a * a + b * b;
                const footX = sm - a * (a * sm + b * sn + c) / norm;
                const footY = sn - b * (a * sm + b * sn + c) / norm;
                const halfChord = Math.sqrt(r * r - d * d);
                const dirX = -b / Math.sqrt(norm);
                const dirY = a / Math.sqrt(norm);
                drawPoint(ctx, footX + halfChord * dirX, footY + halfChord * dirY, centerX, centerY, scale, '#10b981', 5);
                drawPoint(ctx, footX - halfChord * dirX, footY - halfChord * dirY, centerX, centerY, scale, '#10b981', 5);
            }
        } else {
            document.getElementById('playDist').textContent = '—';
            document.getElementById('playPosition').textContent = '—';
        }

        // Equation
        const mPart = sm === 0 ? 'x²' : `(x ${sm > 0 ? '− ' + sm.toFixed(0) : '+ ' + (-sm).toFixed(0)})²`;
        const nPart = sn === 0 ? 'y²' : `(y ${sn > 0 ? '− ' + sn.toFixed(0) : '+ ' + (-sn).toFixed(0)})²`;
        document.getElementById('playEq').textContent = `${mPart} + ${nPart} = ${(r * r).toFixed(0)}`;
    }

    rSlider.addEventListener('input', draw);
    paSlider.addEventListener('input', draw);
    pbSlider.addEventListener('input', draw);
    pcSlider.addEventListener('input', draw);

    canvas.addEventListener('mousedown', e => {
        const rect = canvas.getBoundingClientRect();
        const [mx, my] = fromCanvas(e.clientX - rect.left, e.clientY - rect.top, centerX, centerY, scale);
        if (dist(mx, my, sm, sn) < 0.75) dragging = true;
    });
    canvas.addEventListener('mousemove', e => {
        if (!dragging) return;
        const rect = canvas.getBoundingClientRect();
        const [mx, my] = fromCanvas(e.clientX - rect.left, e.clientY - rect.top, centerX, centerY, scale);
        sm = Math.round(mx * 2) / 2;
        sn = Math.round(my * 2) / 2;
        draw();
    });
    canvas.addEventListener('mouseup', () => { dragging = false; });
    canvas.addEventListener('mouseleave', () => { dragging = false; });

    document.getElementById('playResetBtn')?.addEventListener('click', () => {
        sm = 0; sn = 0;
        rSlider.value = 3;
        paSlider.value = 1; pbSlider.value = 0; pcSlider.value = -4;
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
            correct: '✅ Správně! S = [2, −3], takže (x − 2)² + (y − (−3))² = (x − 2)² + (y + 3)² = 25.',
            incorrect: '❌ Zkuste znovu. Vzpomeňte: (x − m)² + (y − n)² = r². Dávejte pozor na znaménka u středu.'
        },
        2: {
            correct: '✅ Správně! D = −6, E = 4, F = −12. S = [3, −2], r² = 9 + 4 + 12 = 25, r = 5.',
            incorrect: '❌ Zkuste znovu. Střed = [−D/2, −E/2], r = √(D²/4 + E²/4 − F).'
        },
        3: {
            correct: '✅ Správně! Kružnice má S = [0,0], r = 4. Přímka y = 5 → d = 5 > 4 = r → vnější přímka.',
            incorrect: '❌ Zkuste znovu. Porovnejte vzdálenost středu od přímky s poloměrem.'
        },
        4: {
            correct: '✅ Správně! Tečna v bodě [x₀, y₀] na kružnici x² + y² = r² je x₀·x + y₀·y = r².',
            incorrect: '❌ Zkuste znovu. Vzorec tečny: x₀·x + y₀·y = r², kde T = [x₀, y₀].'
        },
        5: {
            correct: '✅ Správně! |SA|² = (1−1)² + (2−1)² = 1 < r² = 4 → bod leží uvnitř kružnice.',
            incorrect: '❌ Zkuste znovu. Spočítejte (x₀−m)² + (y₀−n)² a porovnejte s r².'
        },
        6: {
            correct: '✅ Správně! D=2, E=−4, F=5. r² = 1 + 4 − 5 = 0. Jde o bod [−1, 2].',
            incorrect: '❌ Zkuste znovu. r² = D²/4 + E²/4 − F. Jaký je výsledek?'
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

            // Highlight options
            document.querySelectorAll(`input[name="ex${exNum}"]`).forEach(input => {
                const opt = input.closest('.option');
                opt.classList.remove('correct', 'incorrect');
                if (input.value === correct) opt.classList.add('correct');
                else if (input.checked) opt.classList.add('incorrect');
            });

            // Show completion message after all exercises
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
