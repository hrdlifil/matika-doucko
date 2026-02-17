// Vzdálenosti a odchylky - Interactive Lesson JavaScript

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initPointLineDemo();
    initParallelDemo();
    initAngleDemo();
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
        const sectionOrder = ['intro', 'point-line', 'parallel', 'angle', 'playground', 'exercises'];
        const index = sectionOrder.indexOf(sectionId);
        const progress = ((index + 1) / sectionOrder.length) * 100;
        const fill = document.querySelector('.progress-fill-small');
        if (fill) fill.style.width = `${progress}%`;
    }

    if (window.location.hash) {
        showSection(window.location.hash.substring(1));
    }
}

// =============================================
// CANVAS UTILITIES
// =============================================

const COLORS = {
    lineP: '#6366f1',
    lineQ: '#8b5cf6',
    point: '#f59e0b',
    distance: '#10b981',
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
    ctx.beginPath(); ctx.moveTo(0, centerY); ctx.lineTo(width, centerY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height); ctx.stroke();

    ctx.fillStyle = COLORS.axis;
    ctx.beginPath(); ctx.moveTo(width - 10, centerY - 5); ctx.lineTo(width, centerY); ctx.lineTo(width - 10, centerY + 5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(centerX - 5, 10); ctx.lineTo(centerX, 0); ctx.lineTo(centerX + 5, 10); ctx.fill();

    ctx.fillStyle = COLORS.text;
    ctx.font = '13px Inter, sans-serif';
    ctx.fillText('x', width - 20, centerY - 10);
    ctx.fillText('y', centerX + 10, 20);
}

function toCanvasX(x, cX, s) { return cX + x * s; }
function toCanvasY(y, cY, s) { return cY - y * s; }
function toMathX(cx, cX, s) { return (cx - cX) / s; }
function toMathY(cy, cY, s) { return (cY - cy) / s; }

// Draw line from general equation ax + by + c = 0
function drawGeneralLine(ctx, a, b, c, width, height, centerX, centerY, scale, color, lineWidth = 2.5) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    if (Math.abs(b) > 0.001) {
        // y = (-ax - c) / b
        const xLeft = toMathX(0, centerX, scale);
        const xRight = toMathX(width, centerX, scale);
        const yLeft = (-a * xLeft - c) / b;
        const yRight = (-a * xRight - c) / b;
        ctx.beginPath();
        ctx.moveTo(0, toCanvasY(yLeft, centerY, scale));
        ctx.lineTo(width, toCanvasY(yRight, centerY, scale));
        ctx.stroke();
    } else if (Math.abs(a) > 0.001) {
        // x = -c / a
        const x = -c / a;
        const cx = toCanvasX(x, centerX, scale);
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, height);
        ctx.stroke();
    }
}

function drawPoint(ctx, x, y, color, radius, label) {
    // Outer glow
    ctx.fillStyle = color + '40';
    ctx.beginPath();
    ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
    ctx.fill();
    // Solid circle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    // Label
    if (label) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y);
    }
}

// Draw dashed line between two canvas points
function drawDashed(ctx, x1, y1, x2, y2, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
}

// Foot of perpendicular from point to line ax+by+c=0
function footOfPerp(a, b, c, mx, my) {
    const denom = a * a + b * b;
    return {
        x: (b * (b * mx - a * my) - a * c) / denom,
        y: (a * (-b * mx + a * my) - b * c) / denom
    };
}

// =============================================
// POINT-LINE DISTANCE DEMO
// =============================================

function initPointLineDemo() {
    const canvas = document.getElementById('pointLineCanvas');
    if (!canvas) return;

    const { ctx, width, height, centerX, centerY, scale } = setupCanvas(canvas);

    let point = { x: 1, y: 3 };
    let dragging = false;

    const aSlider = document.getElementById('aSlider');
    const bSlider = document.getElementById('bSlider');
    const cSlider = document.getElementById('cSlider');

    function getLine() {
        return {
            a: parseInt(aSlider.value),
            b: parseInt(bSlider.value),
            c: parseInt(cSlider.value)
        };
    }

    function draw() {
        const { a, b, c } = getLine();

        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, width, height);
        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY);

        // Draw line
        if (Math.abs(a) > 0 || Math.abs(b) > 0) {
            drawGeneralLine(ctx, a, b, c, width, height, centerX, centerY, scale, COLORS.lineP);

            // Line label
            ctx.fillStyle = COLORS.lineP;
            ctx.font = 'bold 14px Inter, sans-serif';
            ctx.textAlign = 'left';
            let labelStr = '';
            if (a !== 0) labelStr += `${a === 1 ? '' : a === -1 ? '−' : a}x`;
            if (b !== 0) labelStr += ` ${b > 0 ? '+' : '−'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}y`;
            if (c !== 0) labelStr += ` ${c > 0 ? '+' : '−'} ${Math.abs(c)}`;
            labelStr += ' = 0';
            ctx.fillText('p: ' + labelStr, 15, 25);

            // Foot of perpendicular
            const foot = footOfPerp(a, b, c, point.x, point.y);
            const fx = toCanvasX(foot.x, centerX, scale);
            const fy = toCanvasY(foot.y, centerY, scale);
            const mx = toCanvasX(point.x, centerX, scale);
            const my = toCanvasY(point.y, centerY, scale);

            // Perpendicular dashed line
            drawDashed(ctx, mx, my, fx, fy, COLORS.distance);

            // Right angle indicator
            const len = Math.sqrt((mx - fx) ** 2 + (my - fy) ** 2);
            if (len > 20) {
                const ux = (mx - fx) / len;
                const uy = (my - fy) / len;
                const sz = 10;
                // Perpendicular direction along line
                const px = -uy;
                const py = ux;
                ctx.strokeStyle = COLORS.distance;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(fx + ux * sz, fy + uy * sz);
                ctx.lineTo(fx + ux * sz + px * sz, fy + uy * sz + py * sz);
                ctx.lineTo(fx + px * sz, fy + py * sz);
                ctx.stroke();
            }

            // Foot point
            ctx.fillStyle = COLORS.distance;
            ctx.beginPath();
            ctx.arc(fx, fy, 5, 0, Math.PI * 2);
            ctx.fill();

            // Distance label at midpoint
            const dist = Math.abs(a * point.x + b * point.y + c) / Math.sqrt(a * a + b * b);
            const midPx = (mx + fx) / 2;
            const midPy = (my + fy) / 2;
            ctx.fillStyle = COLORS.distance;
            ctx.font = 'bold 14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`d = ${dist.toFixed(2)}`, midPx + 20, midPy - 10);
        }

        // Draw point
        const mx = toCanvasX(point.x, centerX, scale);
        const my = toCanvasY(point.y, centerY, scale);
        drawPoint(ctx, mx, my, COLORS.point, 10, 'M');

        updatePointLineInfo();
    }

    function updatePointLineInfo() {
        const { a, b, c } = getLine();
        const num = Math.abs(a * point.x + b * point.y + c);
        const den = Math.sqrt(a * a + b * b);
        const dist = den > 0 ? num / den : 0;

        document.getElementById('aValue').textContent = a;
        document.getElementById('bValue').textContent = b;
        document.getElementById('cValue').textContent = c;
        document.getElementById('plPointM').textContent = `[${point.x.toFixed(1)}, ${point.y.toFixed(1)}]`;
        document.getElementById('plNumerator').textContent = num.toFixed(1);
        document.getElementById('plDenominator').textContent = den.toFixed(2);
        document.getElementById('plDistance').textContent = dist.toFixed(2);
    }

    // Dragging
    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function isNear(mx, my) {
        const px = toCanvasX(point.x, centerX, scale);
        const py = toCanvasY(point.y, centerY, scale);
        return Math.sqrt((mx - px) ** 2 + (my - py) ** 2) < 18;
    }

    canvas.addEventListener('mousedown', (e) => {
        const pos = getMousePos(e);
        if (isNear(pos.x, pos.y)) {
            dragging = true;
            canvas.style.cursor = 'grabbing';
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        const pos = getMousePos(e);
        if (dragging) {
            point.x = Math.round(toMathX(pos.x, centerX, scale) * 2) / 2;
            point.y = Math.round(toMathY(pos.y, centerY, scale) * 2) / 2;
            draw();
        } else {
            canvas.style.cursor = isNear(pos.x, pos.y) ? 'grab' : 'crosshair';
        }
    });

    canvas.addEventListener('mouseup', () => { dragging = false; canvas.style.cursor = 'crosshair'; });
    canvas.addEventListener('mouseleave', () => { dragging = false; canvas.style.cursor = 'crosshair'; });

    aSlider.addEventListener('input', draw);
    bSlider.addEventListener('input', draw);
    cSlider.addEventListener('input', draw);

    draw();
}

// =============================================
// PARALLEL LINES DISTANCE DEMO
// =============================================

function initParallelDemo() {
    const canvas = document.getElementById('parallelCanvas');
    if (!canvas) return;

    const { ctx, width, height, centerX, centerY, scale } = setupCanvas(canvas);

    const parASlider = document.getElementById('parASlider');
    const parBSlider = document.getElementById('parBSlider');
    const c1Slider = document.getElementById('c1Slider');
    const c2Slider = document.getElementById('c2Slider');

    function draw() {
        const a = parseInt(parASlider.value);
        const b = parseInt(parBSlider.value);
        const c1 = parseInt(c1Slider.value);
        const c2 = parseInt(c2Slider.value);

        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, width, height);
        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY);

        if (Math.abs(a) === 0 && Math.abs(b) === 0) {
            updateParallelInfo(a, b, c1, c2);
            return;
        }

        // Draw both lines
        drawGeneralLine(ctx, a, b, c1, width, height, centerX, centerY, scale, COLORS.lineP);
        drawGeneralLine(ctx, a, b, c2, width, height, centerX, centerY, scale, COLORS.lineQ);

        // Labels
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = COLORS.lineP;
        ctx.fillText('p', 15, 25);
        ctx.fillStyle = COLORS.lineQ;
        ctx.fillText('q', 15, 45);

        // Show distance: pick a point on line p, draw perpendicular to line q
        // Pick a point on p: if b!=0 then x=0, y=-c1/b
        let px, py;
        if (Math.abs(b) > 0.001) {
            px = 0; py = -c1 / b;
        } else {
            px = -c1 / a; py = 0;
        }

        const foot = footOfPerp(a, b, c2, px, py);

        const cpx = toCanvasX(px, centerX, scale);
        const cpy = toCanvasY(py, centerY, scale);
        const cfx = toCanvasX(foot.x, centerX, scale);
        const cfy = toCanvasY(foot.y, centerY, scale);

        // Distance line
        drawDashed(ctx, cpx, cpy, cfx, cfy, COLORS.distance);

        // Points
        drawPoint(ctx, cpx, cpy, COLORS.lineP, 6, '');
        drawPoint(ctx, cfx, cfy, COLORS.lineQ, 6, '');

        // Distance label
        const dist = Math.abs(c1 - c2) / Math.sqrt(a * a + b * b);
        const midX = (cpx + cfx) / 2;
        const midY = (cpy + cfy) / 2;
        ctx.fillStyle = COLORS.distance;
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`d = ${dist.toFixed(2)}`, midX + 25, midY - 10);

        updateParallelInfo(a, b, c1, c2);
    }

    function updateParallelInfo(a, b, c1, c2) {
        const den = Math.sqrt(a * a + b * b);
        const num = Math.abs(c1 - c2);
        const dist = den > 0 ? num / den : 0;

        document.getElementById('parAValue').textContent = a;
        document.getElementById('parBValue').textContent = b;
        document.getElementById('c1Value').textContent = c1;
        document.getElementById('c2Value').textContent = c2;
        document.getElementById('parNumerator').textContent = num.toFixed(1);
        document.getElementById('parDenominator').textContent = den.toFixed(2);
        document.getElementById('parDistance').textContent = dist.toFixed(2);
    }

    parASlider.addEventListener('input', draw);
    parBSlider.addEventListener('input', draw);
    c1Slider.addEventListener('input', draw);
    c2Slider.addEventListener('input', draw);

    draw();
}

// =============================================
// ANGLE BETWEEN LINES DEMO
// =============================================

function initAngleDemo() {
    const canvas = document.getElementById('angleCanvas');
    if (!canvas) return;

    const { ctx, width, height, centerX, centerY, scale } = setupCanvas(canvas);

    // Define two lines by draggable direction points
    let lineP = { x: 4, y: 2 };   // direction point of line p (through origin)
    let lineQ = { x: -1, y: 3 };  // direction point of line q (through origin)
    let dragging = null;

    function draw() {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, width, height);
        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY);

        // Line p: through origin and lineP
        // General eq: lineP.y · x - lineP.x · y = 0 → a1=lineP.y, b1=-lineP.x, c1=0
        const a1 = lineP.y, b1 = -lineP.x, c1 = 0;
        const a2 = lineQ.y, b2 = -lineQ.x, c2 = 0;

        // Draw lines
        drawGeneralLine(ctx, a1, b1, c1, width, height, centerX, centerY, scale, COLORS.lineP, 3);
        drawGeneralLine(ctx, a2, b2, c2, width, height, centerX, centerY, scale, COLORS.lineQ, 3);

        // Draw angle arc at origin
        const angleP = Math.atan2(lineP.y, lineP.x);
        const angleQ = Math.atan2(lineQ.y, lineQ.x);

        // Calculate the deviation angle
        const dotProd = Math.abs(a1 * a2 + b1 * b2);
        const magN1 = Math.sqrt(a1 * a1 + b1 * b1);
        const magN2 = Math.sqrt(a2 * a2 + b2 * b2);
        const cosAlpha = (magN1 * magN2 > 0) ? dotProd / (magN1 * magN2) : 1;
        const alphaDeg = Math.acos(Math.min(1, cosAlpha)) * 180 / Math.PI;

        // Draw angle arc between the directions
        let startAng = Math.atan2(-lineP.y, lineP.x);  // canvas angle for lineP
        let endAng = Math.atan2(-lineQ.y, lineQ.x);    // canvas angle for lineQ

        // Ensure we draw the smaller arc
        let diff = endAng - startAng;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        while (diff > Math.PI) diff -= 2 * Math.PI;

        if (diff < 0) {
            const temp = startAng;
            startAng = startAng + diff;
            endAng = temp;
        } else {
            endAng = startAng + diff;
        }

        ctx.strokeStyle = COLORS.angle + '80';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 40, startAng, endAng);
        ctx.stroke();

        ctx.fillStyle = COLORS.angle + '15';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, 40, startAng, endAng);
        ctx.closePath();
        ctx.fill();

        // Angle label
        const midAng = (startAng + endAng) / 2;
        ctx.fillStyle = COLORS.angle;
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${alphaDeg.toFixed(1)}°`, centerX + Math.cos(midAng) * 60, centerY + Math.sin(midAng) * 60);

        // Draw drag points
        const px = toCanvasX(lineP.x, centerX, scale);
        const py = toCanvasY(lineP.y, centerY, scale);
        const qx = toCanvasX(lineQ.x, centerX, scale);
        const qy = toCanvasY(lineQ.y, centerY, scale);

        drawPoint(ctx, px, py, COLORS.lineP, 8, '');
        drawPoint(ctx, qx, qy, COLORS.lineQ, 8, '');

        // Line labels near points
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = COLORS.lineP;
        ctx.fillText('p', px + 14, py - 14);
        ctx.fillStyle = COLORS.lineQ;
        ctx.fillText('q', qx + 14, qy - 14);

        updateAngleInfo(a1, b1, a2, b2, cosAlpha, alphaDeg);
    }

    function updateAngleInfo(a1, b1, a2, b2, cosA, deg) {
        const dotVal = Math.abs(a1 * a2 + b1 * b2);
        const magN1 = Math.sqrt(a1 * a1 + b1 * b1);
        const magN2 = Math.sqrt(a2 * a2 + b2 * b2);

        // Update line equations
        const slope1 = Math.abs(lineP.x) > 0.001 ? lineP.y / lineP.x : Infinity;
        const slope2 = Math.abs(lineQ.x) > 0.001 ? lineQ.y / lineQ.x : Infinity;

        document.getElementById('angleLine1').textContent =
            slope1 === Infinity ? 'x = 0' : `y = ${slope1.toFixed(2)}x`;
        document.getElementById('angleLine2').textContent =
            slope2 === Infinity ? 'x = 0' : `y = ${slope2.toFixed(2)}x`;

        document.getElementById('angDot').textContent = dotVal.toFixed(1);
        document.getElementById('angMags').textContent = (magN1 * magN2).toFixed(2);
        document.getElementById('angCos').textContent = cosA.toFixed(3);
        document.getElementById('angResult').textContent = `${deg.toFixed(1)}°`;

        const status = document.getElementById('angStatus');
        if (deg < 0.5) {
            status.textContent = '↔ Rovnoběžné přímky';
            status.style.color = '#3b82f6';
        } else if (deg > 89.5) {
            status.textContent = '⊥ Kolmé přímky';
            status.style.color = '#10b981';
        } else {
            status.textContent = `↗ Různoběžné přímky (α = ${deg.toFixed(1)}°)`;
            status.style.color = COLORS.angle;
        }
    }

    // Dragging
    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function isNear(mx, my, pt) {
        const cx = toCanvasX(pt.x, centerX, scale);
        const cy = toCanvasY(pt.y, centerY, scale);
        return Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2) < 18;
    }

    canvas.addEventListener('mousedown', (e) => {
        const pos = getMousePos(e);
        if (isNear(pos.x, pos.y, lineP)) dragging = 'P';
        else if (isNear(pos.x, pos.y, lineQ)) dragging = 'Q';
        if (dragging) canvas.style.cursor = 'grabbing';
    });

    canvas.addEventListener('mousemove', (e) => {
        const pos = getMousePos(e);
        if (dragging) {
            const mx = Math.round(toMathX(pos.x, centerX, scale) * 2) / 2;
            const my = Math.round(toMathY(pos.y, centerY, scale) * 2) / 2;
            if (dragging === 'P') { lineP.x = mx; lineP.y = my; }
            else { lineQ.x = mx; lineQ.y = my; }
            draw();
        } else {
            canvas.style.cursor =
                (isNear(pos.x, pos.y, lineP) || isNear(pos.x, pos.y, lineQ)) ? 'grab' : 'crosshair';
        }
    });

    canvas.addEventListener('mouseup', () => { dragging = null; canvas.style.cursor = 'crosshair'; });
    canvas.addEventListener('mouseleave', () => { dragging = null; canvas.style.cursor = 'crosshair'; });

    draw();
}

// =============================================
// PLAYGROUND
// =============================================

function initPlayground() {
    const canvas = document.getElementById('playgroundCanvas');
    if (!canvas) return;

    const { ctx, width, height, centerX, centerY, scale } = setupCanvas(canvas);

    let point = { x: 2, y: 3 };
    let dragging = false;

    const playASlider = document.getElementById('playASlider');
    const playBSlider = document.getElementById('playBSlider');
    const playCSlider = document.getElementById('playCSlider');

    function getLine() {
        return {
            a: parseInt(playASlider.value),
            b: parseInt(playBSlider.value),
            c: parseInt(playCSlider.value)
        };
    }

    function draw() {
        const { a, b, c } = getLine();

        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, width, height);
        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY);

        if (Math.abs(a) > 0 || Math.abs(b) > 0) {
            drawGeneralLine(ctx, a, b, c, width, height, centerX, centerY, scale, COLORS.lineP);

            // Perpendicular from point to line
            const foot = footOfPerp(a, b, c, point.x, point.y);
            const fx = toCanvasX(foot.x, centerX, scale);
            const fy = toCanvasY(foot.y, centerY, scale);
            const mx = toCanvasX(point.x, centerX, scale);
            const my = toCanvasY(point.y, centerY, scale);

            drawDashed(ctx, mx, my, fx, fy, COLORS.distance);

            // Right angle indicator
            const len = Math.sqrt((mx - fx) ** 2 + (my - fy) ** 2);
            if (len > 20) {
                const ux = (mx - fx) / len;
                const uy = (my - fy) / len;
                const sz = 10;
                const px = -uy;
                const py = ux;
                ctx.strokeStyle = COLORS.distance;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(fx + ux * sz, fy + uy * sz);
                ctx.lineTo(fx + ux * sz + px * sz, fy + uy * sz + py * sz);
                ctx.lineTo(fx + px * sz, fy + py * sz);
                ctx.stroke();
            }

            ctx.fillStyle = COLORS.distance;
            ctx.beginPath();
            ctx.arc(fx, fy, 5, 0, Math.PI * 2);
            ctx.fill();

            // Distance label
            const dist = Math.abs(a * point.x + b * point.y + c) / Math.sqrt(a * a + b * b);
            const midPx = (mx + fx) / 2;
            const midPy = (my + fy) / 2;
            ctx.fillStyle = COLORS.distance;
            ctx.font = 'bold 14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`d = ${dist.toFixed(2)}`, midPx + 20, midPy - 10);
        }

        // Draw point
        const mx = toCanvasX(point.x, centerX, scale);
        const my = toCanvasY(point.y, centerY, scale);
        drawPoint(ctx, mx, my, COLORS.point, 10, 'M');

        updatePlaygroundInfo();
    }

    function updatePlaygroundInfo() {
        const { a, b, c } = getLine();
        const den = Math.sqrt(a * a + b * b);
        const dist = den > 0 ? Math.abs(a * point.x + b * point.y + c) / den : 0;

        document.getElementById('playPointM').textContent = `[${point.x.toFixed(1)}, ${point.y.toFixed(1)}]`;
        document.getElementById('playDist').textContent = dist.toFixed(2);
        document.getElementById('playAVal').textContent = a;
        document.getElementById('playBVal').textContent = b;
        document.getElementById('playCVal').textContent = c;

        let eq = '';
        if (a !== 0) eq += `${a === 1 ? '' : a === -1 ? '−' : a}x`;
        if (b !== 0) eq += ` ${b > 0 ? '+ ' : '− '}${Math.abs(b) === 1 ? '' : Math.abs(b)}y`;
        if (c !== 0) eq += ` ${c > 0 ? '+ ' : '− '}${Math.abs(c)}`;
        eq += ' = 0';
        document.getElementById('playEq').textContent = eq;
    }

    // Dragging
    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function isNear(mx, my) {
        const px = toCanvasX(point.x, centerX, scale);
        const py = toCanvasY(point.y, centerY, scale);
        return Math.sqrt((mx - px) ** 2 + (my - py) ** 2) < 18;
    }

    canvas.addEventListener('mousedown', (e) => {
        const pos = getMousePos(e);
        if (isNear(pos.x, pos.y)) {
            dragging = true;
            canvas.style.cursor = 'grabbing';
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        const pos = getMousePos(e);
        if (dragging) {
            point.x = Math.round(toMathX(pos.x, centerX, scale) * 2) / 2;
            point.y = Math.round(toMathY(pos.y, centerY, scale) * 2) / 2;
            draw();
        } else {
            canvas.style.cursor = isNear(pos.x, pos.y) ? 'grab' : 'crosshair';
        }
    });

    canvas.addEventListener('mouseup', () => { dragging = false; canvas.style.cursor = 'crosshair'; });
    canvas.addEventListener('mouseleave', () => { dragging = false; canvas.style.cursor = 'crosshair'; });

    playASlider.addEventListener('input', draw);
    playBSlider.addEventListener('input', draw);
    playCSlider.addEventListener('input', draw);

    document.getElementById('playResetBtn')?.addEventListener('click', () => {
        point.x = 2; point.y = 3;
        playASlider.value = 1;
        playBSlider.value = -1;
        playCSlider.value = 0;
        draw();
    });

    draw();
}

// =============================================
// EXERCISES
// =============================================

function initExercises() {
    const feedbackMessages = {
        1: {
            correct: 'Správně! |3·1 + 4·2 − 5| / √(9+16) = |3+8−5| / 5 = 6/5 = 1.6',
            incorrect: 'Zkuste dosadit: |3·1 + 4·2 − 5| / √(9+16).'
        },
        2: {
            correct: 'Správně! |6 − (−4)| / √(9+16) = 10 / 5 = 2.0',
            incorrect: 'Použijte vzorec: |c₁ − c₂| / √(a² + b²). Nezapomeňte na absolutní hodnotu.'
        },
        3: {
            correct: 'Správně! n₁·n₂ = 1·1 + 1·(−1) = 0 → cos α = 0 → α = 90°. Přímky jsou kolmé.',
            incorrect: 'Spočítejte skalární součin normálových vektorů: (1,1)·(1,−1).'
        },
        4: {
            correct: 'Správně! Bod ležící na přímce splňuje rovnici, takže čitatel vzorce je 0 a vzdálenost je 0.',
            incorrect: 'Pokud bod leží na přímce, dosadíte-li jeho souřadnice do rovnice, dostanete 0.'
        },
        5: {
            correct: 'Správně! Obě přímky mají stejnou směrnici k = 2, jsou tedy rovnoběžné a odchylka je 0°.',
            incorrect: 'Porovnejte směrnice obou přímek. Stejná směrnice → rovnoběžné.'
        }
    };

    document.querySelectorAll('.btn-check').forEach(btn => {
        btn.addEventListener('click', () => {
            const exNum = btn.dataset.exercise;
            const correctVal = btn.dataset.correct;
            const exercise = document.getElementById(`exercise${exNum}`);
            const selected = exercise.querySelector(`input[name="ex${exNum}"]:checked`);

            if (!selected) return;

            const isCorrect = selected.value === correctVal;
            const feedback = document.getElementById(`ex${exNum}Feedback`);
            const status = document.getElementById(`ex${exNum}Status`);

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

            checkAllExercisesComplete();
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

    function checkAllExercisesComplete() {
        const allButtons = document.querySelectorAll('.btn-check');
        const allDisabled = Array.from(allButtons).every(btn => btn.disabled);
        if (allDisabled) {
            document.getElementById('lessonComplete').style.display = 'block';
        }
    }
}
