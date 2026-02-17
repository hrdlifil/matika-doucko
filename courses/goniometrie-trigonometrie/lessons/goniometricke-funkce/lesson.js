/* ============================================================
   Chapter 1: Goniometrické funkce – Interactive Lesson Script
   ============================================================ */

// ─── Section Navigation ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initTriangleDemo();
    initUnitCircleDemo();
    initSpecialTrianglesDemo();
    initIdentityDemo();
    initRadianDemo();
    initPlayground();
    initExercises();
});

/* ======= NAVIGATION ======= */
function initNavigation() {
    const links = document.querySelectorAll('.sidebar-link');
    const sections = document.querySelectorAll('.lesson-section');
    const progressFill = document.querySelector('.progress-fill-small');

    function showSection(id) {
        sections.forEach(s => s.classList.remove('active'));
        links.forEach(l => l.classList.remove('active'));
        const target = document.getElementById(id);
        if (target) {
            target.classList.add('active');
            const link = document.querySelector(`.sidebar-link[data-section="${id}"]`);
            if (link) link.classList.add('active');
        }
        // Update progress
        const idx = Array.from(sections).findIndex(s => s.id === id);
        const pct = ((idx + 1) / sections.length) * 100;
        if (progressFill) progressFill.style.width = pct + '%';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    links.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const id = link.dataset.section;
            showSection(id);
            history.replaceState(null, '', '#' + id);
        });
    });

    document.querySelectorAll('.btn-next').forEach(btn => {
        btn.addEventListener('click', () => {
            showSection(btn.dataset.next);
            history.replaceState(null, '', '#' + btn.dataset.next);
        });
    });

    document.querySelectorAll('.btn-prev').forEach(btn => {
        btn.addEventListener('click', () => {
            showSection(btn.dataset.prev);
            history.replaceState(null, '', '#' + btn.dataset.prev);
        });
    });

    // check hash on load
    if (window.location.hash) {
        const id = window.location.hash.substring(1);
        showSection(id);
    }
}

/* ======= CANVAS HELPERS ======= */

// HiDPI canvas setup — makes circles and lines crisp on Retina/HiDPI screens
// IMPORTANT: Uses the canvas element's width/height ATTRIBUTES as logical size,
// NOT getBoundingClientRect() which returns CSS-stretched dimensions.
function setupHiDPI(canvas) {
    const dpr = window.devicePixelRatio || 1;
    // Read the original HTML width/height attributes (e.g. width="500" height="500")
    const w = parseInt(canvas.getAttribute('width')) || 500;
    const h = parseInt(canvas.getAttribute('height')) || 500;
    // Set the actual pixel buffer to be HiDPI-scaled
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    // CRITICAL: Set CSS dimensions to match the LOGICAL size exactly.
    // This prevents the browser from stretching the canvas to fill
    // the parent container and distorting circles into ellipses.
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, w, h, dpr };
}

function clearCanvas(ctx, w, h) {
    ctx.clearRect(0, 0, w * 3, h * 3); // extra for HiDPI
}

function getCanvasColors() {
    return {
        grid: 'rgba(148,163,184,0.1)',
        gridMajor: 'rgba(148,163,184,0.2)',
        axis: '#94a3b8',
        axisLight: 'rgba(148,163,184,0.6)',
        text: '#e2e8f0',
        accent: '#818cf8',
        accentGlow: 'rgba(99,102,241,0.4)',
        red: '#f87171',
        redGlow: 'rgba(248,113,113,0.3)',
        blue: '#60a5fa',
        blueGlow: 'rgba(96,165,250,0.3)',
        green: '#34d399',
        greenGlow: 'rgba(52,211,153,0.35)',
        yellow: '#fbbf24',
        yellowGlow: 'rgba(251,191,36,0.3)',
        purple: '#c4b5fd',
        bg: '#0f172a',
        bgCard: '#1e293b',
        circle: 'rgba(129,140,248,0.35)',
        circleGlow: 'rgba(99,102,241,0.12)',
        sectorFill: 'rgba(99,102,241,0.08)',
        subtleText: 'rgba(148,163,184,0.5)'
    };
}

function drawGrid(ctx, cx, cy, scale, w, h) {
    const c = getCanvasColors();
    // Minor grid
    ctx.strokeStyle = c.grid;
    ctx.lineWidth = 0.5;
    for (let x = cx % scale; x < w; x += scale) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = cy % scale; y < h; y += scale) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    // Major grid (every 2 units)
    ctx.strokeStyle = c.gridMajor;
    ctx.lineWidth = 0.8;
    for (let x = cx % (scale * 2); x < w; x += scale * 2) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = cy % (scale * 2); y < h; y += scale * 2) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
}

function drawAxes(ctx, cx, cy, w, h, scale) {
    const c = getCanvasColors();
    // Axis lines with subtle gradient feel
    ctx.strokeStyle = c.axisLight;
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();

    // Arrowheads
    ctx.fillStyle = c.axisLight;
    // X arrow
    ctx.beginPath(); ctx.moveTo(w - 2, cy); ctx.lineTo(w - 10, cy - 4); ctx.lineTo(w - 10, cy + 4); ctx.closePath(); ctx.fill();
    // Y arrow
    ctx.beginPath(); ctx.moveTo(cx, 2); ctx.lineTo(cx - 4, 10); ctx.lineTo(cx + 4, 10); ctx.closePath(); ctx.fill();

    // Tick marks + labels
    ctx.fillStyle = c.subtleText;
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    for (let i = -10; i <= 10; i++) {
        if (i === 0) continue;
        const x = cx + i * scale;
        if (x > 10 && x < w - 10) {
            ctx.strokeStyle = c.axisLight;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(x, cy - 4); ctx.lineTo(x, cy + 4); ctx.stroke();
            ctx.fillText(i, x, cy + 18);
        }
        const y = cy - i * scale;
        if (y > 10 && y < h - 10) {
            ctx.strokeStyle = c.axisLight;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(cx - 4, y); ctx.lineTo(cx + 4, y); ctx.stroke();
            ctx.textAlign = 'right';
            ctx.fillText(i, cx - 10, y + 4);
            ctx.textAlign = 'center';
        }
    }
    // Origin label
    ctx.fillStyle = c.subtleText;
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('0', cx - 8, cy + 16);

    // Axis labels
    ctx.fillStyle = c.axisLight;
    ctx.font = 'italic 13px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('x', w - 18, cy - 10);
    ctx.textAlign = 'center';
    ctx.fillText('y', cx + 14, 16);
}

function drawCircle(ctx, cx, cy, radius, color, glowColor, lineWidth) {
    // Glow
    if (glowColor) {
        ctx.save();
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 15;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth || 2;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    // Crisp circle
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth || 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
}

function drawPoint(ctx, x, y, color, radius, label, glowColor) {
    const r = radius || 5;
    // Glow
    if (glowColor || true) {
        ctx.save();
        ctx.shadowColor = glowColor || color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    // Solid point with white center highlight
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    // Inner highlight
    if (r >= 5) {
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.arc(x - r * 0.15, y - r * 0.15, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }
    if (label) {
        ctx.fillStyle = color;
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(label, x + r + 6, y - r);
    }
}

function drawGlowLine(ctx, x1, y1, x2, y2, color, glowColor, lineWidth) {
    ctx.save();
    ctx.shadowColor = glowColor || color;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth || 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
}

function fillBackground(ctx, w, h) {
    // Subtle radial gradient background
    const c = getCanvasColors();
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
    grad.addColorStop(0, '#131c31');
    grad.addColorStop(1, c.bg);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
}

/* ======= SECTION 1: RIGHT TRIANGLE DEMO ======= */
function initTriangleDemo() {
    const canvas = document.getElementById('triangleCanvas');
    if (!canvas) return;
    const { ctx, w, h } = setupHiDPI(canvas);
    const slider = document.getElementById('triAngleSlider');
    const angleVal = document.getElementById('triAngleVal');

    function draw() {
        const angle = parseFloat(slider.value);
        const rad = angle * Math.PI / 180;
        const c = getCanvasColors();
        clearCanvas(ctx, w, h);
        fillBackground(ctx, w, h);

        // Triangle dimensions — use generous size
        const hyp = Math.min(w, h) * 0.55;
        const opp = hyp * Math.sin(rad);
        const adj = hyp * Math.cos(rad);

        // Center the triangle with room for labels on all sides
        const labelPad = 55;
        const ox = Math.max(labelPad, (w - adj) / 2);
        const oy = Math.min(h - 40, (h + opp) / 2 + 15);
        const Cx = ox, Cy = oy;          // right-angle corner (bottom-left)
        const Bx = ox + adj, By = oy;    // angle α corner (bottom-right)  
        const Ax = ox, Ay = oy - opp;    // top corner

        // Subtle background grid lines
        ctx.save();
        ctx.strokeStyle = 'rgba(148,163,184,0.06)';
        ctx.lineWidth = 1;
        for (let i = 0; i < w; i += 40) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
        }
        for (let i = 0; i < h; i += 40) {
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
        }
        ctx.restore();

        // Triangle gradient fill
        const triGrad = ctx.createLinearGradient(Cx, Cy, Bx, Ay);
        triGrad.addColorStop(0, 'rgba(99, 102, 241, 0.08)');
        triGrad.addColorStop(1, 'rgba(99, 102, 241, 0.02)');
        ctx.fillStyle = triGrad;
        ctx.beginPath();
        ctx.moveTo(Cx, Cy); ctx.lineTo(Bx, By); ctx.lineTo(Ax, Ay); ctx.closePath();
        ctx.fill();

        // Outer glow behind triangle
        ctx.save();
        ctx.shadowColor = 'rgba(99, 102, 241, 0.15)';
        ctx.shadowBlur = 20;
        ctx.strokeStyle = 'rgba(129,140,248,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(Cx, Cy); ctx.lineTo(Bx, By); ctx.lineTo(Ax, Ay); ctx.closePath();
        ctx.stroke();
        ctx.restore();

        // Dashed projections from A to base/side (show sin/cos relationship)
        ctx.save();
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = 'rgba(148,163,184,0.15)';
        ctx.lineWidth = 1;
        // Horizontal dashed from A to the right (shows height = opp = sin)
        ctx.beginPath(); ctx.moveTo(Ax + 2, Ay); ctx.lineTo(Bx, Ay); ctx.stroke();
        // Vertical dashed from A's x-projection (shows base extent)
        ctx.beginPath(); ctx.moveTo(Bx, Ay); ctx.lineTo(Bx, By - 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Side a (protilehlá = AC, vertical) – red with glow
        drawGlowLine(ctx, Cx, Cy, Ax, Ay, c.red, c.redGlow, 3);
        // Side b (přilehlá = BC, horizontal) – blue with glow
        drawGlowLine(ctx, Cx, Cy, Bx, By, c.blue, c.blueGlow, 3);
        // Side c (přepona = AB, hypotenuse) – green with glow
        drawGlowLine(ctx, Ax, Ay, Bx, By, c.green, c.greenGlow, 3.5);

        // Right angle marker at C — with subtle fill
        const sq = Math.min(16, adj * 0.15, opp * 0.15);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.06)';
        ctx.fillRect(Cx, Cy - sq, sq, sq);
        ctx.strokeStyle = 'rgba(148,163,184,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(Cx + sq, Cy); ctx.lineTo(Cx + sq, Cy - sq); ctx.lineTo(Cx, Cy - sq);
        ctx.stroke();
        ctx.fillStyle = 'rgba(148,163,184,0.35)';
        ctx.beginPath(); ctx.arc(Cx + sq / 2, Cy - sq / 2, 1.5, 0, Math.PI * 2); ctx.fill();

        // Angle arc at B — DYNAMIC RADIUS that shrinks for large angles
        // At 90° adj→0, so clamp arc radius to fit inside the triangle
        const maxArcR = Math.min(40, adj * 0.5, opp * 0.5);
        const arcR = Math.max(15, maxArcR);
        const angleToA = Math.atan2(Ay - By, Ax - Bx);
        const angleToC = Math.PI;

        // Arc glow
        ctx.save();
        ctx.shadowColor = c.yellowGlow;
        ctx.shadowBlur = 12;
        ctx.strokeStyle = c.yellow;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(Bx, By, arcR, angleToA, angleToC);
        ctx.stroke();
        ctx.restore();

        // Arc fill
        ctx.fillStyle = 'rgba(251,191,36,0.1)';
        ctx.beginPath();
        ctx.moveTo(Bx, By);
        ctx.arc(Bx, By, arcR, angleToA, angleToC);
        ctx.closePath();
        ctx.fill();

        // Label α inside the arc
        ctx.fillStyle = c.yellow;
        ctx.font = 'bold 15px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const labelAngle = (angleToA + angleToC) / 2;
        const labelR = arcR + 14;
        ctx.fillText('α', Bx + labelR * Math.cos(labelAngle), By + labelR * Math.sin(labelAngle));
        ctx.textBaseline = 'alphabetic';

        // Side labels — bold letter + smaller descriptor
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;

        // a (protilehlá) — left of the vertical line, clamped to canvas
        const aLabelY = Math.max(30, Math.min(h - 10, (Cy + Ay) / 2));
        ctx.fillStyle = c.red;
        ctx.textAlign = 'right';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.fillText('a', Math.max(45, Cx - 12), aLabelY);
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = 'rgba(248,113,113,0.7)';
        ctx.fillText('protilehlá', Math.max(45, Cx - 12), aLabelY + 14);

        // b (přilehlá) — below the horizontal line
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.fillStyle = c.blue;
        ctx.textAlign = 'center';
        ctx.fillText('b', (Cx + Bx) / 2, Math.min(h - 5, Cy + 22));
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = 'rgba(96,165,250,0.7)';
        ctx.fillText('přilehlá', (Cx + Bx) / 2, Math.min(h - 5, Cy + 35));

        // c (přepona) — to the right of the hypotenuse midpoint
        const mx = (Ax + Bx) / 2, my = (Ay + By) / 2;
        // Offset perpendicular to the hypotenuse so label doesn't overlap
        const hypAngle = Math.atan2(By - Ay, Bx - Ax);
        const offX = 14 * Math.cos(hypAngle - Math.PI / 2);
        const offY = 14 * Math.sin(hypAngle - Math.PI / 2);
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.fillStyle = c.green;
        ctx.textAlign = 'left';
        ctx.fillText('c', mx + offX, my + offY);
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = 'rgba(52,211,153,0.7)';
        ctx.fillText('přepona', mx + offX, my + offY + 14);
        ctx.restore();

        // Vertex points with glow
        drawPoint(ctx, Cx, Cy, c.accent, 5, 'C', c.accentGlow);
        drawPoint(ctx, Bx, By, c.accent, 5, 'B', c.accentGlow);
        drawPoint(ctx, Ax, Ay, c.accent, 5, 'A', c.accentGlow);

        // Update values
        const sinVal = Math.sin(rad);
        const cosVal = Math.cos(rad);
        const tanVal = Math.tan(rad);
        const cotVal = 1 / tanVal;

        angleVal.textContent = angle;
        document.getElementById('triSin').textContent = sinVal.toFixed(3);
        document.getElementById('triCos').textContent = cosVal.toFixed(3);
        document.getElementById('triTan').textContent = tanVal.toFixed(3);
        document.getElementById('triCot').textContent = (angle === 90) ? '—' : cotVal.toFixed(3);
        document.getElementById('triA').textContent = (sinVal * 10).toFixed(2);
        document.getElementById('triB').textContent = (cosVal * 10).toFixed(2);
        document.getElementById('triC').textContent = '10.00';
    }

    slider.addEventListener('input', draw);
    draw();
}

/* ======= SECTION 2: UNIT CIRCLE DEMO ======= */
function initUnitCircleDemo() {
    const canvas = document.getElementById('unitCircleCanvas');
    if (!canvas) return;
    const { ctx, w, h } = setupHiDPI(canvas);
    const slider = document.getElementById('ucAngleSlider');
    const angleVal = document.getElementById('ucAngleVal');

    let dragging = false;

    function draw() {
        const deg = parseFloat(slider.value);
        const rad = deg * Math.PI / 180;
        const c = getCanvasColors();
        clearCanvas(ctx, w, h);
        fillBackground(ctx, w, h);

        const cx = w / 2, cy = h / 2;
        const scale = Math.min(w, h) * 0.38;

        drawGrid(ctx, cx, cy, scale / 2, w, h);

        // Unit circle with glow effect
        drawCircle(ctx, cx, cy, scale, c.circle, c.circleGlow, 2.5);

        // Subtle circle fill
        ctx.fillStyle = 'rgba(99,102,241,0.03)';
        ctx.beginPath();
        ctx.arc(cx, cy, scale, 0, Math.PI * 2);
        ctx.fill();

        const cosV = Math.cos(rad);
        const sinV = Math.sin(rad);
        const px = cx + scale * cosV;
        const py = cy - scale * sinV;

        // Sector fill
        if (deg > 0) {
            ctx.fillStyle = c.sectorFill;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, scale, 0, -rad, true);
            ctx.closePath();
            ctx.fill();
        }

        // Angle arc with glow
        ctx.save();
        ctx.shadowColor = c.yellowGlow;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = c.yellow;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 30, 0, -rad, rad > 0);
        ctx.stroke();
        ctx.restore();

        // Angle fill
        if (deg > 0 && deg < 360) {
            ctx.fillStyle = 'rgba(251,191,36,0.06)';
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, 30, 0, -rad, true);
            ctx.closePath();
            ctx.fill();
        }

        // Angle label
        if (deg > 5) {
            ctx.fillStyle = c.yellow;
            ctx.font = 'bold 13px Inter, sans-serif';
            ctx.textAlign = 'center';
            const labelA = -rad / 2;
            ctx.fillText(deg + '°', cx + 45 * Math.cos(labelA), cy + 45 * Math.sin(labelA) + 4);
        }

        // Radius line with glow
        drawGlowLine(ctx, cx, cy, px, py, c.accent, c.accentGlow, 2);

        // cos α projection (horizontal) – blue glow
        drawGlowLine(ctx, cx, cy, px, cy, c.blue, c.blueGlow, 3);

        // sin α projection (vertical) – red glow
        drawGlowLine(ctx, px, cy, px, py, c.red, c.redGlow, 3);

        // Dashed guide lines
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(148,163,184,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(cx, py); ctx.stroke();
        ctx.setLineDash([]);

        // Draw axes on top
        drawAxes(ctx, cx, cy, w, h, scale);

        // Labels on projections with text shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 4;
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.fillStyle = c.blue;
        ctx.textAlign = 'center';
        const cosLabelY = sinV >= 0 ? cy + 20 : cy - 10;
        ctx.fillText('cos α = ' + cosV.toFixed(2), (cx + px) / 2, cosLabelY);
        ctx.fillStyle = c.red;
        ctx.textAlign = 'left';
        const sinLabelX = cosV >= 0 ? px + 10 : px - 85;
        ctx.fillText('sin α = ' + sinV.toFixed(2), sinLabelX, (cy + py) / 2 + 5);
        ctx.restore();

        // Point P with glow
        drawPoint(ctx, px, py, c.green, 7, 'P', c.greenGlow);
        drawPoint(ctx, cx, cy, c.accent, 3, '');

        // Quadrant labels
        ctx.font = '13px Inter, sans-serif';
        ctx.fillStyle = 'rgba(148,163,184,0.3)';
        ctx.textAlign = 'center';
        ctx.fillText('I', cx + scale * 0.55, cy - scale * 0.55);
        ctx.fillText('II', cx - scale * 0.55, cy - scale * 0.55);
        ctx.fillText('III', cx - scale * 0.55, cy + scale * 0.55);
        ctx.fillText('IV', cx + scale * 0.55, cy + scale * 0.55);

        // Coordinate readout on circle edge markers (0°, 90°, 180°, 270°)
        ctx.fillStyle = c.subtleText;
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('(1, 0)', cx + scale + 6, cy + 4);
        ctx.textAlign = 'right';
        ctx.fillText('(−1, 0)', cx - scale - 6, cy + 4);
        ctx.textAlign = 'center';
        ctx.fillText('(0, 1)', cx, cy - scale - 8);
        ctx.fillText('(0, −1)', cx, cy + scale + 16);

        // Update displays
        angleVal.textContent = deg;
        document.getElementById('ucSin').textContent = sinV.toFixed(3);
        document.getElementById('ucCos').textContent = cosV.toFixed(3);
        document.getElementById('ucTan').textContent = (Math.abs(cosV) < 0.001) ? '—' : (sinV / cosV).toFixed(3);
        document.getElementById('ucCot').textContent = (Math.abs(sinV) < 0.001) ? '—' : (cosV / sinV).toFixed(3);
        document.getElementById('ucPoint').textContent = `[${cosV.toFixed(3)}, ${sinV.toFixed(3)}]`;

        let q = 'I';
        if (deg > 90 && deg <= 180) q = 'II';
        else if (deg > 180 && deg <= 270) q = 'III';
        else if (deg > 270) q = 'IV';
        document.getElementById('ucQuadrant').textContent = q;
    }

    slider.addEventListener('input', draw);

    // Drag on canvas — use logical coordinates 
    canvas.addEventListener('mousedown', () => { dragging = true; });
    canvas.addEventListener('mouseup', () => { dragging = false; });
    canvas.addEventListener('mouseleave', () => { dragging = false; });
    canvas.addEventListener('mousemove', e => {
        if (!dragging) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const ccx = w / 2, ccy = h / 2;
        let angle = Math.atan2(ccy - my, mx - ccx);
        let deg = angle * 180 / Math.PI;
        if (deg < 0) deg += 360;
        slider.value = Math.round(deg);
        draw();
    });

    draw();
}

/* ======= SECTION 3: SPECIAL TRIANGLES DEMO ======= */
function initSpecialTrianglesDemo() {
    const canvas = document.getElementById('specialCanvas');
    if (!canvas) return;
    const { ctx, w, h } = setupHiDPI(canvas);
    const buttons = document.querySelectorAll('.angle-btn');
    const panel = document.getElementById('specialDerivation');
    let currentAngle = 30;

    const derivations = {
        30: {
            triangle: { angles: [90, 60, 30], sides: [2, Math.sqrt(3), 1], labels: ['2', '√3', '1'] },
            html: `
                <div class="deriv-step">Rovnostranný △ se stranou 2, rozpůlíme výškou.</div>
                <div class="deriv-step">Přepona = 2, kratší odvěsna = 1</div>
                <div class="deriv-step">Delší odvěsna = √(4 − 1) = √3</div>
                <div class="deriv-step deriv-result">sin 30° = 1/2 = 0.5</div>
                <div class="deriv-step deriv-result">cos 30° = √3/2 ≈ 0.866</div>
                <div class="deriv-step deriv-result">tan 30° = 1/√3 = √3/3 ≈ 0.577</div>
                <div class="deriv-step deriv-result">cot 30° = √3 ≈ 1.732</div>
            `
        },
        45: {
            triangle: { angles: [90, 45, 45], sides: [Math.sqrt(2), 1, 1], labels: ['√2', '1', '1'] },
            html: `
                <div class="deriv-step">Rovnoramenný pravoúhlý △, obě odvěsny = 1.</div>
                <div class="deriv-step">Přepona = √(1 + 1) = √2</div>
                <div class="deriv-step deriv-result">sin 45° = 1/√2 = √2/2 ≈ 0.707</div>
                <div class="deriv-step deriv-result">cos 45° = 1/√2 = √2/2 ≈ 0.707</div>
                <div class="deriv-step deriv-result">tan 45° = 1/1 = 1</div>
                <div class="deriv-step deriv-result">cot 45° = 1/1 = 1</div>
            `
        },
        60: {
            triangle: { angles: [90, 30, 60], sides: [2, 1, Math.sqrt(3)], labels: ['2', '1', '√3'] },
            html: `
                <div class="deriv-step">Stejný △ jako pro 30°, ale díváme se z úhlu 60°.</div>
                <div class="deriv-step">Protilehlá k 60° = √3, přilehlá k 60° = 1</div>
                <div class="deriv-step deriv-result">sin 60° = √3/2 ≈ 0.866</div>
                <div class="deriv-step deriv-result">cos 60° = 1/2 = 0.5</div>
                <div class="deriv-step deriv-result">tan 60° = √3 ≈ 1.732</div>
                <div class="deriv-step deriv-result">cot 60° = 1/√3 = √3/3 ≈ 0.577</div>
            `
        }
    };

    function draw() {
        const c = getCanvasColors();
        clearCanvas(ctx, w, h);
        fillBackground(ctx, w, h);

        const data = derivations[currentAngle];
        const tri = data.triangle;

        // Scale triangle to fit canvas
        const maxSide = Math.max(...tri.sides);
        const sc = 200 / maxSide;
        const ox = 100, oy = h - 80;

        // Triangle vertices: right angle at C (bottom-left)
        // For 30°: angle at top is 30°, hypotenuse=2, opposite to 30°=1(horizontal? no...)
        // Let's normalize: C at bottom-left (right angle), B at bottom-right, A at top-left
        // For angle 30° at B: protilehlá = AC (vertical) = 1, přilehlá = BC (horizontal) = √3, přepona = AB = 2
        // For angle 45° at B: protilehlá = AC = 1, přilehlá = BC = 1, přepona = AB = √2
        // For angle 60° at B: protilehlá = AC = √3, přilehlá = BC = 1, přepona = AB = 2

        let vertical, horizontal;
        if (currentAngle === 30) { vertical = 1; horizontal = Math.sqrt(3); }
        else if (currentAngle === 45) { vertical = 1; horizontal = 1; }
        else { vertical = Math.sqrt(3); horizontal = 1; }

        const Cx = ox, Cy = oy;
        const Bx = ox + horizontal * sc, By = oy;
        const Ax = ox, Ay = oy - vertical * sc;

        // Fill
        ctx.fillStyle = 'rgba(99,102,241,0.08)';
        ctx.beginPath();
        ctx.moveTo(Cx, Cy); ctx.lineTo(Bx, By); ctx.lineTo(Ax, Ay); ctx.closePath();
        ctx.fill();

        // Sides
        // AC (vertical, protilehlá) - red with glow
        drawGlowLine(ctx, Cx, Cy, Ax, Ay, c.red, c.redGlow, 3);
        // BC (horizontal, přilehlá) - blue with glow
        drawGlowLine(ctx, Cx, Cy, Bx, By, c.blue, c.blueGlow, 3);
        // AB (přepona) - green with glow
        drawGlowLine(ctx, Ax, Ay, Bx, By, c.green, c.greenGlow, 3);

        // Right angle at C
        const sq = 12;
        ctx.strokeStyle = c.axis;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(Cx + sq, Cy); ctx.lineTo(Cx + sq, Cy - sq); ctx.lineTo(Cx, Cy - sq);
        ctx.stroke();

        // Angle arc at B
        ctx.strokeStyle = c.yellow;
        ctx.lineWidth = 2;
        const arcR = 30;
        const angleToA = Math.atan2(Ay - By, Ax - Bx);
        ctx.beginPath();
        ctx.arc(Bx, By, arcR, angleToA, Math.PI);
        ctx.stroke();

        ctx.fillStyle = c.yellow;
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(currentAngle + '°', Bx - arcR - 15, By - 8);

        // Side labels
        ctx.font = 'bold 15px Inter, sans-serif';
        // vertical side label
        let vertLabel = (currentAngle === 30) ? '1' : (currentAngle === 45) ? '1' : '√3';
        ctx.fillStyle = c.red;
        ctx.textAlign = 'right';
        ctx.fillText(vertLabel, Cx - 10, (Cy + Ay) / 2 + 5);

        // horizontal side label
        let horizLabel = (currentAngle === 30) ? '√3' : (currentAngle === 45) ? '1' : '1';
        ctx.fillStyle = c.blue;
        ctx.textAlign = 'center';
        ctx.fillText(horizLabel, (Cx + Bx) / 2, Cy + 22);

        // hypotenuse label
        let hypLabel = (currentAngle === 45) ? '√2' : '2';
        ctx.fillStyle = c.green;
        ctx.textAlign = 'left';
        ctx.fillText(hypLabel, (Ax + Bx) / 2 + 8, (Ay + By) / 2 - 8);

        // Vertex labels
        drawPoint(ctx, Cx, Cy, c.accent, 4, 'C');
        drawPoint(ctx, Bx, By, c.accent, 4, 'B');
        drawPoint(ctx, Ax, Ay, c.accent, 4, 'A');

        // If 30° or 60°, also show the original equilateral (faded)
        if (currentAngle === 30 || currentAngle === 60) {
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = 'rgba(148,163,184,0.25)';
            ctx.lineWidth = 1.5;
            // The equilateral triangle: mirror A across BC
            const Aprime_x = ox;
            const Aprime_y = oy + vertical * sc; // mirrored below
            ctx.beginPath();
            ctx.moveTo(Ax, Ay);
            ctx.lineTo(Bx, By);
            ctx.lineTo(Aprime_x, Aprime_y);
            ctx.closePath();
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = 'rgba(148,163,184,0.3)';
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('původní rovnostranný △', Bx + 15, (Ay + By) / 2);
        }

        // Update derivation panel
        panel.innerHTML = data.html;
    }

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentAngle = parseInt(btn.dataset.angle);
            draw();
        });
    });

    draw();
}

/* ======= SECTION 4: IDENTITY VERIFIER ======= */
function initIdentityDemo() {
    const canvas = document.getElementById('identityCanvas');
    if (!canvas) return;
    const { ctx, w, h } = setupHiDPI(canvas);
    const slider = document.getElementById('idAngleSlider');
    const angleVal = document.getElementById('idAngleVal');

    function draw() {
        const deg = parseFloat(slider.value);
        const rad = deg * Math.PI / 180;
        const c = getCanvasColors();
        clearCanvas(ctx, w, h);
        fillBackground(ctx, w, h);

        const cx = w / 2, cy = h / 2;
        const scale = Math.min(w, h) * 0.3;

        drawGrid(ctx, cx, cy, scale, w, h);

        // Unit circle with glow
        drawCircle(ctx, cx, cy, scale, c.circle, c.circleGlow, 2);

        const cosV = Math.cos(rad);
        const sinV = Math.sin(rad);
        const px = cx + scale * cosV;
        const py = cy - scale * sinV;

        // Draw sin² and cos² as areas
        // cos² area (blue rectangle)
        const cos2w = Math.abs(cosV) * scale;
        const cos2h = Math.abs(cosV) * scale;
        ctx.fillStyle = 'rgba(59,130,246,0.15)';
        ctx.fillRect(cx, cy, cosV * scale, -cosV * scale);
        ctx.strokeStyle = c.blue;
        ctx.lineWidth = 1;
        ctx.strokeRect(cx, cy, cosV * scale, -cosV * scale);

        // sin² area (red rectangle)
        ctx.fillStyle = 'rgba(239,68,68,0.15)';
        ctx.fillRect(cx + cosV * scale, cy, sinV * scale, -sinV * scale);

        // Radius
        ctx.strokeStyle = c.accent;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();

        // Projections
        ctx.strokeStyle = c.blue;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, cy); ctx.stroke();
        ctx.strokeStyle = c.red;
        ctx.beginPath(); ctx.moveTo(px, cy); ctx.lineTo(px, py); ctx.stroke();

        drawPoint(ctx, px, py, c.green, 6, 'P');

        // Labels
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.fillStyle = c.blue;
        ctx.textAlign = 'center';
        ctx.fillText('cos²α = ' + (cosV * cosV).toFixed(3), cx + cosV * scale / 2, cy + 20);
        ctx.fillStyle = c.red;
        ctx.fillText('sin²α = ' + (sinV * sinV).toFixed(3), px + 50, (cy + py) / 2);

        // Identity equation at top
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.fillStyle = c.text;
        ctx.textAlign = 'center';
        ctx.fillText(`sin²${deg}° + cos²${deg}° = ${(sinV * sinV + cosV * cosV).toFixed(3)} ✓`, w / 2, 30);

        drawAxes(ctx, cx, cy, w, h, scale);

        // Update values
        angleVal.textContent = deg;

        const tanV = (Math.abs(cosV) < 0.001) ? null : sinV / cosV;
        const cotV = (Math.abs(sinV) < 0.001) ? null : cosV / sinV;

        document.getElementById('idPythag').textContent = '= ' + (sinV * sinV + cosV * cosV).toFixed(3) + ' ✓';

        if (tanV !== null && cotV !== null) {
            document.getElementById('idProduct').textContent = '= ' + (tanV * cotV).toFixed(3) + ' ✓';
        } else {
            document.getElementById('idProduct').textContent = '— (nedefinováno)';
        }

        if (tanV !== null) {
            document.getElementById('idTanSq').textContent = (1 + tanV * tanV).toFixed(3);
            document.getElementById('idSecSq').textContent = (1 / (cosV * cosV)).toFixed(3);
        } else {
            document.getElementById('idTanSq').textContent = '—';
            document.getElementById('idSecSq').textContent = '—';
        }

        if (cotV !== null) {
            document.getElementById('idCotSq').textContent = (1 + cotV * cotV).toFixed(3);
            document.getElementById('idCscSq').textContent = (1 / (sinV * sinV)).toFixed(3);
        } else {
            document.getElementById('idCotSq').textContent = '—';
            document.getElementById('idCscSq').textContent = '—';
        }
    }

    slider.addEventListener('input', draw);
    draw();
}

/* ======= SECTION 5: RADIAN DEMO ======= */
function initRadianDemo() {
    const canvas = document.getElementById('radianCanvas');
    if (!canvas) return;
    const { ctx, w, h } = setupHiDPI(canvas);
    const slider = document.getElementById('radDegSlider');
    const degVal = document.getElementById('radDegVal');

    // Known fractions of π
    function piStr(deg) {
        const map = {
            0: '0', 30: 'π/6', 45: 'π/4', 60: 'π/3', 90: 'π/2',
            120: '2π/3', 135: '3π/4', 150: '5π/6', 180: 'π',
            210: '7π/6', 225: '5π/4', 240: '4π/3', 270: '3π/2',
            300: '5π/3', 315: '7π/4', 330: '11π/6', 360: '2π'
        };
        if (map[deg]) return map[deg];
        return (deg * Math.PI / 180).toFixed(3);
    }

    function fracStr(deg) {
        const map = {
            0: '0', 30: '1/12', 45: '1/8', 60: '1/6', 90: '1/4',
            120: '1/3', 180: '1/2', 240: '2/3', 270: '3/4', 360: '1'
        };
        return map[deg] || (deg / 360).toFixed(3);
    }

    function draw() {
        const deg = parseFloat(slider.value);
        const rad = deg * Math.PI / 180;
        const c = getCanvasColors();
        clearCanvas(ctx, w, h);
        fillBackground(ctx, w, h);

        const cx = w / 2, cy = h / 2;
        const scale = Math.min(w, h) * 0.38;

        // Grid
        drawGrid(ctx, cx, cy, scale, w, h);

        // Circle with glow
        drawCircle(ctx, cx, cy, scale, c.circle, c.circleGlow, 2.5);

        // Filled arc sector
        if (deg > 0) {
            ctx.fillStyle = 'rgba(99,102,241,0.12)';
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, scale, 0, -rad, true);
            ctx.closePath();
            ctx.fill();
        }

        // Arc highlight (the arc itself, in red)
        if (deg > 0) {
            ctx.strokeStyle = c.red;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(cx, cy, scale, 0, -rad, true);
            ctx.stroke();
        }

        // Radius to point
        const px = cx + scale * Math.cos(rad);
        const py = cy - scale * Math.sin(rad);
        ctx.strokeStyle = c.accent;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();

        // Starting radius (positive x)
        ctx.strokeStyle = 'rgba(148,163,184,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + scale, cy); ctx.stroke();

        // Arc length label
        if (deg > 0) {
            const midAngle = rad / 2;
            const labelR = scale + 20;
            ctx.fillStyle = c.red;
            ctx.font = 'bold 14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(
                'oblouk = ' + piStr(deg),
                cx + labelR * Math.cos(midAngle),
                cy - labelR * Math.sin(midAngle)
            );
        }

        // r = 1 label
        ctx.fillStyle = c.axis;
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('r = 1', cx + scale / 2, cy + 16);

        drawPoint(ctx, px, py, c.green, 6, '');
        drawPoint(ctx, cx + scale, cy, c.axis, 4, '');
        drawAxes(ctx, cx, cy, w, h, scale);

        // Common angle markers on circle
        const commonAngles = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
        commonAngles.forEach(a => {
            const ar = a * Math.PI / 180;
            const mx = cx + scale * Math.cos(ar);
            const my = cy - scale * Math.sin(ar);
            ctx.fillStyle = 'rgba(148,163,184,0.4)';
            ctx.beginPath();
            ctx.arc(mx, my, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Update displays
        const radValue = deg * Math.PI / 180;
        degVal.textContent = deg;
        document.getElementById('radDeg').textContent = deg + '°';
        document.getElementById('radRad').textContent = piStr(deg) + ' ≈ ' + radValue.toFixed(3);
        document.getElementById('radArc').textContent = piStr(deg) + ' ≈ ' + radValue.toFixed(3);
        document.getElementById('radFrac').textContent = fracStr(deg);
        document.getElementById('radCalc').textContent = `${deg}·π/180 = ${piStr(deg)}`;
    }

    slider.addEventListener('input', draw);

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            slider.value = btn.dataset.deg;
            draw();
        });
    });

    draw();
}

/* ======= SECTION 6: PLAYGROUND ======= */
function initPlayground() {
    const canvas = document.getElementById('playgroundCanvas');
    if (!canvas) return;
    const { ctx, w, h } = setupHiDPI(canvas);
    const slider = document.getElementById('pgAngleSlider');
    const showTriangle = document.getElementById('pgShowTriangle');
    const showTan = document.getElementById('pgShowTan');
    const resetBtn = document.getElementById('pgResetBtn');

    let dragging = false;

    function draw() {
        const deg = parseFloat(slider.value);
        const rad = deg * Math.PI / 180;
        const c = getCanvasColors();
        clearCanvas(ctx, w, h);
        fillBackground(ctx, w, h);

        const cx = w / 2, cy = h / 2;
        const scale = Math.min(w, h) * 0.42;

        drawGrid(ctx, cx, cy, scale / 2, w, h);
        drawAxes(ctx, cx, cy, w, h, scale);

        // Unit circle with glow
        drawCircle(ctx, cx, cy, scale, c.circle, c.circleGlow, 2.5);

        const cosV = Math.cos(rad);
        const sinV = Math.sin(rad);
        const px = cx + scale * cosV;
        const py = cy - scale * sinV;

        // Filled sector
        ctx.fillStyle = 'rgba(99,102,241,0.06)';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, scale, 0, -rad, true);
        ctx.closePath();
        ctx.fill();

        // Angle arc
        ctx.strokeStyle = c.yellow;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 35, 0, -rad, true);
        ctx.stroke();

        // Radius
        ctx.strokeStyle = c.accent;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();

        if (showTriangle.checked) {
            // cos line
            ctx.strokeStyle = c.blue;
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, cy); ctx.stroke();
            // sin line
            ctx.strokeStyle = c.red;
            ctx.beginPath(); ctx.moveTo(px, cy); ctx.lineTo(px, py); ctx.stroke();

            // Labels
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.fillStyle = c.blue;
            ctx.textAlign = 'center';
            ctx.fillText('cos', (cx + px) / 2, cy + (sinV >= 0 ? 16 : -8));
            ctx.fillStyle = c.red;
            ctx.textAlign = 'left';
            ctx.fillText('sin', px + (cosV >= 0 ? 8 : -28), (cy + py) / 2 + 5);
        }

        // Tangent line visualization
        if (showTan.checked && Math.abs(cosV) > 0.02) {
            const tanV = sinV / cosV;
            // Tangent line at x=1 (from intersection of radius extension with x=1 line)
            const tanY = cy - scale * tanV;
            const tanX = cx + scale; // x=1 on circle

            // Line from origin through P to tangent line at x=1
            ctx.strokeStyle = c.yellow;
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(tanX, tanY); ctx.stroke();
            ctx.setLineDash([]);

            // Tangent segment (vertical at x=1)
            ctx.strokeStyle = c.yellow;
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(tanX, cy); ctx.lineTo(tanX, tanY); ctx.stroke();

            // Label
            ctx.fillStyle = c.yellow;
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('tan', tanX + 6, (cy + tanY) / 2);

            drawPoint(ctx, tanX, tanY, c.yellow, 4, '');
        }

        // Point P
        drawPoint(ctx, px, py, c.green, 7, 'P');

        // Update values
        document.getElementById('pgAngleVal').textContent = deg;
        document.getElementById('pgSin').textContent = sinV.toFixed(4);
        document.getElementById('pgCos').textContent = cosV.toFixed(4);

        const tanV = (Math.abs(cosV) < 0.001) ? null : sinV / cosV;
        const cotV = (Math.abs(sinV) < 0.001) ? null : cosV / sinV;

        document.getElementById('pgTan').textContent = tanV !== null ? tanV.toFixed(4) : '—';
        document.getElementById('pgCot').textContent = cotV !== null ? cotV.toFixed(4) : '—';
        document.getElementById('pgRad').textContent = (rad).toFixed(4) + ' rad';
        document.getElementById('pgPythag').textContent = '= ' + (sinV * sinV + cosV * cosV).toFixed(3) + ' ✓';
    }

    slider.addEventListener('input', draw);
    showTriangle.addEventListener('change', draw);
    showTan.addEventListener('change', draw);

    resetBtn.addEventListener('click', () => {
        slider.value = 45;
        showTriangle.checked = true;
        showTan.checked = true;
        draw();
    });

    // Drag — use logical coordinates
    canvas.addEventListener('mousedown', () => { dragging = true; });
    canvas.addEventListener('mouseup', () => { dragging = false; });
    canvas.addEventListener('mouseleave', () => { dragging = false; });
    canvas.addEventListener('mousemove', e => {
        if (!dragging) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const ccx = w / 2, ccy = h / 2;
        let angle = Math.atan2(ccy - my, mx - ccx);
        let d = angle * 180 / Math.PI;
        if (d < 0) d += 360;
        slider.value = Math.round(d);
        draw();
    });

    draw();
}

/* ======= SECTION 7: EXERCISES ======= */
function initExercises() {
    const feedbackData = {
        1: {
            correct: 'Správně! sin α = protilehlá / přepona = 6/10 = 0.6',
            incorrect: 'Nesprávně. sin α = protilehlá / přepona = 6/10 = 0.6. Správná odpověď je b) 0.6.'
        },
        2: {
            correct: 'Správně! cos 60° = 1/2. Z trojúhelníku 30°-60°-90°: přilehlá k 60° je 1, přepona je 2.',
            incorrect: 'Nesprávně. cos 60° = přilehlá/přepona = 1/2. Správná odpověď je c) 1/2.'
        },
        3: {
            correct: 'Správně! 120° = 120·π/180 = 2π/3 rad.',
            incorrect: 'Nesprávně. Převod: 120° × π/180 = 120π/180 = 2π/3. Správná odpověď je b) 2π/3.'
        },
        4: {
            correct: 'Správně! Z identity sin²α + cos²α = 1: cos²α = 1 − 9/25 = 16/25, tedy cos α = 4/5.',
            incorrect: 'Nesprávně. Použijeme sin²α + cos²α = 1: (3/5)² + cos²α = 1, cos²α = 1 − 9/25 = 16/25, cos α = 4/5. Odpověď je a).'
        },
        5: {
            correct: 'Správně! tan 30° = sin 30°/cos 30° = (1/2)/(√3/2) = 1/√3 = √3/3.',
            incorrect: 'Nesprávně. tan 30° = 1/√3 = √3/3 ≈ 0.577. Správná odpověď je c) √3/3.'
        },
        6: {
            correct: 'Správně! V II. kvadrantu je sin > 0 a cos < 0 (y je kladné, x je záporné).',
            incorrect: 'Nesprávně. V II. kvadrantu (90°–180°) je y-souřadnice kladná (sin > 0) a x-souřadnice záporná (cos < 0). Správně je b).'
        },
        7: {
            correct: 'Správně! 270° = 270·π/180 = 3π/2 rad.',
            incorrect: 'Nesprávně. 270° × π/180 = 270π/180 = 3π/2. Správná odpověď je c) 3π/2.'
        },
        8: {
            correct: 'Správně! sin²α + cos²α = 1 a tan α · cot α = 1, takže výsledek je 1 + 1 = 2.',
            incorrect: 'Nesprávně. sin²α + cos²α = 1 (Pythagorova identita) a tan α · cot α = 1 (součinová identita). Celkem 1 + 1 = 2. Správně je b).'
        }
    };

    document.querySelectorAll('.btn-check').forEach(btn => {
        btn.addEventListener('click', () => {
            const exNum = btn.dataset.exercise;
            const correctAnswer = btn.dataset.correct;
            const selected = document.querySelector(`input[name="ex${exNum}"]:checked`);
            const feedback = document.getElementById(`ex${exNum}Feedback`);
            const status = document.getElementById(`ex${exNum}Status`);

            if (!selected) return;

            const isCorrect = selected.value === correctAnswer;

            // Highlight options
            const options = document.querySelectorAll(`input[name="ex${exNum}"]`);
            options.forEach(opt => {
                const label = opt.closest('.option');
                label.classList.remove('correct', 'incorrect');
                if (opt.value === correctAnswer) label.classList.add('correct');
                else if (opt.checked && !isCorrect) label.classList.add('incorrect');
                opt.disabled = true;
            });

            btn.disabled = true;

            feedback.className = 'exercise-feedback show ' + (isCorrect ? 'correct' : 'incorrect');
            feedback.textContent = isCorrect ? feedbackData[exNum].correct : feedbackData[exNum].incorrect;

            status.textContent = isCorrect ? '✅' : '❌';

            // Check if all done
            checkAllDone();
        });
    });

    function checkAllDone() {
        const allBtns = document.querySelectorAll('.btn-check');
        const allDone = Array.from(allBtns).every(b => b.disabled);
        if (allDone) {
            const banner = document.getElementById('lessonComplete');
            if (banner) banner.style.display = 'block';
        }
    }
}
