// Vektory v rovině - Interactive Lesson JavaScript

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initIntroDemo();
    initAdditionDemo();
    initScalarDemo();
    initMagnitudeDemo();
    initDotProductDemo();
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
        const sectionOrder = ['intro', 'addition', 'scalar', 'magnitude', 'dotproduct', 'playground', 'exercises'];
        const index = sectionOrder.indexOf(sectionId);
        const progress = ((index + 1) / sectionOrder.length) * 100;
        document.querySelector('.progress-fill-small').style.width = `${progress}%`;
    }
}

// =============================================
// CANVAS UTILITIES
// =============================================

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
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let x = centerX % scale; x < width; x += scale) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = centerY % scale; y < height; y += scale) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
}

function drawAxes(ctx, width, height, centerX, centerY) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, centerY); ctx.lineTo(width, centerY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height); ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath(); ctx.moveTo(width - 10, centerY - 5); ctx.lineTo(width, centerY); ctx.lineTo(width - 10, centerY + 5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(centerX - 5, 10); ctx.lineTo(centerX, 0); ctx.lineTo(centerX + 5, 10); ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText('x', width - 20, centerY - 10);
    ctx.fillText('y', centerX + 10, 20);
}

function toCanvasX(x, centerX, scale) { return centerX + x * scale; }
function toCanvasY(y, centerY, scale) { return centerY - y * scale; }
function toMathX(canvasX, centerX, scale) { return (canvasX - centerX) / scale; }
function toMathY(canvasY, centerY, scale) { return (centerY - canvasY) / scale; }

function drawVector(ctx, x1, y1, x2, y2, color, lineWidth = 3, label = '') {
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    if (typeof color === 'string') {
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, color);
    } else {
        gradient.addColorStop(0, color[0]);
        gradient.addColorStop(1, color[1]);
    }

    ctx.strokeStyle = gradient;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Arrow head
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLength = 12;

    ctx.fillStyle = typeof color === 'string' ? color : color[1];
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    // Label
    if (label) {
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const perpAngle = angle + Math.PI / 2;
        const offset = 15;
        ctx.fillStyle = typeof color === 'string' ? color : color[1];
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, midX + Math.cos(perpAngle) * offset, midY + Math.sin(perpAngle) * offset);
    }
}

function drawPoint(ctx, x, y, color, radius = 8, label = '') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    if (label) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y);
    }
}

function magnitude(v) { return Math.sqrt(v.x * v.x + v.y * v.y); }
function dotProduct(u, v) { return u.x * v.x + u.y * v.y; }
function angleBetween(u, v) {
    const dot = dotProduct(u, v);
    const mags = magnitude(u) * magnitude(v);
    if (mags === 0) return 0;
    return Math.acos(Math.max(-1, Math.min(1, dot / mags))) * 180 / Math.PI;
}

// =============================================
// INTRO DEMO
// =============================================

function initIntroDemo() {
    const canvas = document.getElementById('introCanvas');
    if (!canvas) return;

    const { ctx, width, height, centerX, centerY, scale } = setupCanvas(canvas);
    let vector = { x: 3, y: 2 };
    let dragging = false;

    function draw() {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);
        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY);

        const vx = toCanvasX(vector.x, centerX, scale);
        const vy = toCanvasY(vector.y, centerY, scale);

        drawVector(ctx, centerX, centerY, vx, vy, ['#6366f1', '#a855f7'], 4, 'u⃗');
        drawPoint(ctx, vx, vy, '#a855f7', 10);

        updateIntroInfo();
    }

    function updateIntroInfo() {
        document.getElementById('introVector').textContent = `(${vector.x.toFixed(1)}, ${vector.y.toFixed(1)})`;
        document.getElementById('introMagnitude').textContent = magnitude(vector).toFixed(2);
        const angle = Math.atan2(vector.y, vector.x) * 180 / Math.PI;
        document.getElementById('introAngle').textContent = `${angle.toFixed(1)}°`;
    }

    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function isNearPoint(mouseX, mouseY, px, py, threshold = 15) {
        return Math.sqrt((mouseX - px) ** 2 + (mouseY - py) ** 2) < threshold;
    }

    canvas.addEventListener('mousedown', (e) => {
        const pos = getMousePos(e);
        const vx = toCanvasX(vector.x, centerX, scale);
        const vy = toCanvasY(vector.y, centerY, scale);
        if (isNearPoint(pos.x, pos.y, vx, vy)) {
            dragging = true;
            canvas.style.cursor = 'grabbing';
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        const pos = getMousePos(e);
        if (dragging) {
            vector.x = Math.round(toMathX(pos.x, centerX, scale) * 2) / 2;
            vector.y = Math.round(toMathY(pos.y, centerY, scale) * 2) / 2;
            draw();
        } else {
            const vx = toCanvasX(vector.x, centerX, scale);
            const vy = toCanvasY(vector.y, centerY, scale);
            canvas.style.cursor = isNearPoint(pos.x, pos.y, vx, vy) ? 'grab' : 'crosshair';
        }
    });

    canvas.addEventListener('mouseup', () => { dragging = false; });
    canvas.addEventListener('mouseleave', () => { dragging = false; });

    draw();
}

// =============================================
// ADDITION DEMO
// =============================================

function initAdditionDemo() {
    const canvas = document.getElementById('additionCanvas');
    if (!canvas) return;

    const { ctx, width, height, centerX, centerY, scale } = setupCanvas(canvas);
    let vecU = { x: 3, y: 1 };
    let vecV = { x: 1, y: 2 };
    let dragging = null;
    let showParallelogram = true;
    let showDifference = false;

    function draw() {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);
        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY);

        const ux = toCanvasX(vecU.x, centerX, scale);
        const uy = toCanvasY(vecU.y, centerY, scale);
        const vx = toCanvasX(vecV.x, centerX, scale);
        const vy = toCanvasY(vecV.y, centerY, scale);

        const sumX = toCanvasX(vecU.x + vecV.x, centerX, scale);
        const sumY = toCanvasY(vecU.y + vecV.y, centerY, scale);

        // Draw parallelogram
        if (showParallelogram) {
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(ux, uy);
            ctx.lineTo(sumX, sumY);
            ctx.lineTo(vx, vy);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Draw vectors
        drawVector(ctx, centerX, centerY, ux, uy, '#ef4444', 3, 'u⃗');
        drawVector(ctx, centerX, centerY, vx, vy, '#3b82f6', 3, 'v⃗');
        drawVector(ctx, centerX, centerY, sumX, sumY, '#10b981', 4, 'u⃗+v⃗');

        // Draw difference
        if (showDifference) {
            const diffX = toCanvasX(vecU.x - vecV.x, centerX, scale);
            const diffY = toCanvasY(vecU.y - vecV.y, centerY, scale);
            drawVector(ctx, centerX, centerY, diffX, diffY, '#f59e0b', 3, 'u⃗-v⃗');
        }

        // Draw draggable points
        drawPoint(ctx, ux, uy, '#ef4444', 10);
        drawPoint(ctx, vx, vy, '#3b82f6', 10);

        updateAdditionInfo();
    }

    function updateAdditionInfo() {
        document.getElementById('addVecU').textContent = `(${vecU.x.toFixed(1)}, ${vecU.y.toFixed(1)})`;
        document.getElementById('addVecV').textContent = `(${vecV.x.toFixed(1)}, ${vecV.y.toFixed(1)})`;
        document.getElementById('addResult').textContent = `(${(vecU.x + vecV.x).toFixed(1)}, ${(vecU.y + vecV.y).toFixed(1)})`;
        document.getElementById('subResult').textContent = `(${(vecU.x - vecV.x).toFixed(1)}, ${(vecU.y - vecV.y).toFixed(1)})`;
    }

    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function isNearPoint(mouseX, mouseY, px, py, threshold = 15) {
        return Math.sqrt((mouseX - px) ** 2 + (mouseY - py) ** 2) < threshold;
    }

    canvas.addEventListener('mousedown', (e) => {
        const pos = getMousePos(e);
        const ux = toCanvasX(vecU.x, centerX, scale);
        const uy = toCanvasY(vecU.y, centerY, scale);
        const vx = toCanvasX(vecV.x, centerX, scale);
        const vy = toCanvasY(vecV.y, centerY, scale);

        if (isNearPoint(pos.x, pos.y, ux, uy)) dragging = 'U';
        else if (isNearPoint(pos.x, pos.y, vx, vy)) dragging = 'V';
        canvas.style.cursor = dragging ? 'grabbing' : 'crosshair';
    });

    canvas.addEventListener('mousemove', (e) => {
        const pos = getMousePos(e);
        if (dragging) {
            const target = dragging === 'U' ? vecU : vecV;
            target.x = Math.round(toMathX(pos.x, centerX, scale) * 2) / 2;
            target.y = Math.round(toMathY(pos.y, centerY, scale) * 2) / 2;
            draw();
        }
    });

    canvas.addEventListener('mouseup', () => { dragging = null; });

    document.getElementById('showParallelogram')?.addEventListener('change', (e) => {
        showParallelogram = e.target.checked;
        draw();
    });

    document.getElementById('showDifference')?.addEventListener('change', (e) => {
        showDifference = e.target.checked;
        draw();
    });

    draw();
}

// =============================================
// SCALAR MULTIPLICATION DEMO
// =============================================

function initScalarDemo() {
    const canvas = document.getElementById('scalarCanvas');
    if (!canvas) return;

    const { ctx, width, height, centerX, centerY, scale } = setupCanvas(canvas);
    let vecU = { x: 2, y: 1 };
    let dragging = false;
    const slider = document.getElementById('scalarSlider');

    function draw() {
        const k = parseFloat(slider.value);

        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);
        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY);

        const ux = toCanvasX(vecU.x, centerX, scale);
        const uy = toCanvasY(vecU.y, centerY, scale);
        const scaledX = toCanvasX(vecU.x * k, centerX, scale);
        const scaledY = toCanvasY(vecU.y * k, centerY, scale);

        // Draw original vector (faded)
        drawVector(ctx, centerX, centerY, ux, uy, 'rgba(99, 102, 241, 0.3)', 2, 'u⃗');

        // Draw scaled vector
        const color = k < 0 ? '#ef4444' : (k === 0 ? '#9ca3af' : '#10b981');
        if (k !== 0) {
            drawVector(ctx, centerX, centerY, scaledX, scaledY, color, 4, `${k}·u⃗`);
            drawPoint(ctx, scaledX, scaledY, color, 10);
        }

        drawPoint(ctx, ux, uy, '#6366f1', 8);

        updateScalarInfo(k);
    }

    function updateScalarInfo(k) {
        document.getElementById('scalarValue').textContent = k.toFixed(1);
        document.getElementById('scalarVecU').textContent = `(${vecU.x.toFixed(1)}, ${vecU.y.toFixed(1)})`;
        document.getElementById('scalarOperation').innerHTML = `${k.toFixed(1)} · <span class="vec">u</span> = `;
        document.getElementById('scalarResult').textContent = `(${(vecU.x * k).toFixed(1)}, ${(vecU.y * k).toFixed(1)})`;

        const origMag = magnitude(vecU);
        const scaledMag = Math.abs(k) * origMag;
        document.getElementById('origMagnitude').textContent = origMag.toFixed(2);
        document.getElementById('scaledMagnitude').textContent = scaledMag.toFixed(2);
        document.getElementById('magnitudeRatio').textContent = origMag > 0 ? `${Math.abs(k).toFixed(2)}×` : '0×';

        const effectEl = document.getElementById('scalarEffect');
        if (k === 0) {
            effectEl.textContent = 'Nulový vektor';
            effectEl.className = 'effect-badge effect-zero';
        } else if (k === 1) {
            effectEl.textContent = 'Vektor se nemění';
            effectEl.className = 'effect-badge effect-positive';
        } else if (k === -1) {
            effectEl.textContent = 'Opačný vektor';
            effectEl.className = 'effect-badge effect-negative';
        } else if (k > 0) {
            effectEl.textContent = `Vektor je ${Math.abs(k)}× delší, stejný směr`;
            effectEl.className = 'effect-badge effect-positive';
        } else {
            effectEl.textContent = `Vektor je ${Math.abs(k)}× delší, opačný směr`;
            effectEl.className = 'effect-badge effect-negative';
        }
    }

    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    canvas.addEventListener('mousedown', (e) => {
        const pos = getMousePos(e);
        const ux = toCanvasX(vecU.x, centerX, scale);
        const uy = toCanvasY(vecU.y, centerY, scale);
        if (Math.sqrt((pos.x - ux) ** 2 + (pos.y - uy) ** 2) < 15) {
            dragging = true;
            canvas.style.cursor = 'grabbing';
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        const pos = getMousePos(e);
        if (dragging) {
            vecU.x = Math.round(toMathX(pos.x, centerX, scale) * 2) / 2;
            vecU.y = Math.round(toMathY(pos.y, centerY, scale) * 2) / 2;
            draw();
        }
    });

    canvas.addEventListener('mouseup', () => { dragging = false; });
    slider.addEventListener('input', draw);

    draw();
}

// =============================================
// MAGNITUDE DEMO
// =============================================

function initMagnitudeDemo() {
    const canvas = document.getElementById('magnitudeCanvas');
    if (!canvas) return;

    const { ctx, width, height, centerX, centerY, scale } = setupCanvas(canvas);
    let vector = { x: 3, y: 4 };
    let dragging = false;
    let showUnitVector = true;

    function draw() {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);
        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY);

        const vx = toCanvasX(vector.x, centerX, scale);
        const vy = toCanvasY(vector.y, centerY, scale);
        const mag = magnitude(vector);

        // Draw vector
        drawVector(ctx, centerX, centerY, vx, vy, ['#6366f1', '#a855f7'], 4, 'u⃗');
        drawPoint(ctx, vx, vy, '#a855f7', 10);

        // Draw unit vector
        if (showUnitVector && mag > 0) {
            const unitX = toCanvasX(vector.x / mag, centerX, scale);
            const unitY = toCanvasY(vector.y / mag, centerY, scale);
            drawVector(ctx, centerX, centerY, unitX, unitY, '#10b981', 3, 'u⃗₀');

            // Draw unit circle arc
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(centerX, centerY, scale, 0, Math.PI * 2);
            ctx.stroke();
        }

        updateMagnitudeInfo(mag);
    }

    function updateMagnitudeInfo(mag) {
        document.getElementById('magVector').textContent = `(${vector.x.toFixed(1)}, ${vector.y.toFixed(1)})`;
        document.getElementById('magResult').textContent = mag.toFixed(2);

        const calcDetails = document.getElementById('magCalcDetails');
        if (calcDetails) {
            calcDetails.innerHTML = `
                |<span class="vec">u</span>| = √(${vector.x.toFixed(1)}² + ${vector.y.toFixed(1)}²)<br>
                |<span class="vec">u</span>| = √(${(vector.x * vector.x).toFixed(1)} + ${(vector.y * vector.y).toFixed(1)})<br>
                |<span class="vec">u</span>| = √${(vector.x * vector.x + vector.y * vector.y).toFixed(1)} = ${mag.toFixed(2)}
            `;
        }

        if (mag > 0) {
            document.getElementById('unitVector').textContent = `(${(vector.x / mag).toFixed(2)}, ${(vector.y / mag).toFixed(2)})`;
        } else {
            document.getElementById('unitVector').textContent = 'nedefinován';
        }
    }

    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    canvas.addEventListener('mousedown', (e) => {
        const pos = getMousePos(e);
        const vx = toCanvasX(vector.x, centerX, scale);
        const vy = toCanvasY(vector.y, centerY, scale);
        if (Math.sqrt((pos.x - vx) ** 2 + (pos.y - vy) ** 2) < 15) {
            dragging = true;
            canvas.style.cursor = 'grabbing';
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        const pos = getMousePos(e);
        if (dragging) {
            vector.x = Math.round(toMathX(pos.x, centerX, scale) * 2) / 2;
            vector.y = Math.round(toMathY(pos.y, centerY, scale) * 2) / 2;
            draw();
        }
    });

    canvas.addEventListener('mouseup', () => { dragging = false; });

    document.getElementById('showUnitVector')?.addEventListener('change', (e) => {
        showUnitVector = e.target.checked;
        draw();
    });

    draw();
}

// =============================================
// DOT PRODUCT DEMO
// =============================================

function initDotProductDemo() {
    const canvas = document.getElementById('dotCanvas');
    if (!canvas) return;

    const { ctx, width, height, centerX, centerY, scale } = setupCanvas(canvas);
    let vecU = { x: 3, y: 1 };
    let vecV = { x: 1, y: 2 };
    let dragging = null;

    function draw() {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);
        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY);

        const ux = toCanvasX(vecU.x, centerX, scale);
        const uy = toCanvasY(vecU.y, centerY, scale);
        const vx = toCanvasX(vecV.x, centerX, scale);
        const vy = toCanvasY(vecV.y, centerY, scale);

        // Draw angle arc
        const angleU = Math.atan2(-vecU.y, vecU.x);
        const angleV = Math.atan2(-vecV.y, vecV.x);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 40, Math.min(angleU, angleV), Math.max(angleU, angleV));
        ctx.stroke();

        // Draw vectors
        drawVector(ctx, centerX, centerY, ux, uy, '#ef4444', 3, 'u⃗');
        drawVector(ctx, centerX, centerY, vx, vy, '#3b82f6', 3, 'v⃗');

        drawPoint(ctx, ux, uy, '#ef4444', 10);
        drawPoint(ctx, vx, vy, '#3b82f6', 10);

        updateDotProductInfo();
    }

    function updateDotProductInfo() {
        const dot = dotProduct(vecU, vecV);
        const angle = angleBetween(vecU, vecV);
        const magU = magnitude(vecU);
        const magV = magnitude(vecV);

        document.getElementById('dotVecU').textContent = `(${vecU.x.toFixed(1)}, ${vecU.y.toFixed(1)})`;
        document.getElementById('dotVecV').textContent = `(${vecV.x.toFixed(1)}, ${vecV.y.toFixed(1)})`;
        document.getElementById('dotResult').textContent = dot.toFixed(1);
        document.getElementById('angleResult').textContent = `${angle.toFixed(1)}°`;

        const calcDetails = document.getElementById('dotCalcDetails');
        if (calcDetails) {
            calcDetails.innerHTML = `
                <span class="vec">u</span> · <span class="vec">v</span> = ${vecU.x.toFixed(1)}·${vecV.x.toFixed(1)} + ${vecU.y.toFixed(1)}·${vecV.y.toFixed(1)}<br>
                <span class="vec">u</span> · <span class="vec">v</span> = ${(vecU.x * vecV.x).toFixed(1)} + ${(vecU.y * vecV.y).toFixed(1)} = ${dot.toFixed(1)}
            `;
        }

        // Update interpretation
        const interp = document.getElementById('angleInterpretation');
        if (Math.abs(angle - 90) < 1) {
            interp.textContent = 'Vektory jsou kolmé (⊥)';
        } else if (angle < 90) {
            interp.textContent = 'Ostrý úhel (vektory míří podobným směrem)';
        } else {
            interp.textContent = 'Tupý úhel (vektory míří opačnými směry)';
        }

        // Update indicator
        const normalized = (magU > 0 && magV > 0) ? dot / (magU * magV) : 0;
        const indicatorPos = ((normalized + 1) / 2) * 100;
        document.getElementById('dotIndicator').style.left = `${indicatorPos}%`;
    }

    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function isNearPoint(mouseX, mouseY, px, py, threshold = 15) {
        return Math.sqrt((mouseX - px) ** 2 + (mouseY - py) ** 2) < threshold;
    }

    canvas.addEventListener('mousedown', (e) => {
        const pos = getMousePos(e);
        const ux = toCanvasX(vecU.x, centerX, scale);
        const uy = toCanvasY(vecU.y, centerY, scale);
        const vx = toCanvasX(vecV.x, centerX, scale);
        const vy = toCanvasY(vecV.y, centerY, scale);

        if (isNearPoint(pos.x, pos.y, ux, uy)) dragging = 'U';
        else if (isNearPoint(pos.x, pos.y, vx, vy)) dragging = 'V';
        canvas.style.cursor = dragging ? 'grabbing' : 'crosshair';
    });

    canvas.addEventListener('mousemove', (e) => {
        const pos = getMousePos(e);
        if (dragging) {
            const target = dragging === 'U' ? vecU : vecV;
            target.x = Math.round(toMathX(pos.x, centerX, scale) * 2) / 2;
            target.y = Math.round(toMathY(pos.y, centerY, scale) * 2) / 2;
            draw();
        }
    });

    canvas.addEventListener('mouseup', () => { dragging = null; });

    draw();
}

// =============================================
// PLAYGROUND
// =============================================

function initPlayground() {
    const canvas = document.getElementById('playgroundCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 50;

    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
    const labels = ['u⃗', 'v⃗', 'w⃗', 'p⃗', 'q⃗'];

    let vectors = [
        { x: 3, y: 2 },
        { x: -2, y: 3 }
    ];
    let dragging = null;
    let showSum = true;
    let showLabels = true;
    let showAngleArc = false;

    function draw() {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);
        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY);

        // Draw sum vector
        if (showSum && vectors.length >= 2) {
            const sum = vectors.reduce((acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y }), { x: 0, y: 0 });
            const sumX = toCanvasX(sum.x, centerX, scale);
            const sumY = toCanvasY(sum.y, centerY, scale);
            ctx.strokeStyle = 'rgba(156, 163, 175, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(sumX, sumY);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Draw angle arc
        if (showAngleArc && vectors.length >= 2) {
            const angleU = Math.atan2(-vectors[0].y, vectors[0].x);
            const angleV = Math.atan2(-vectors[1].y, vectors[1].x);
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 30, Math.min(angleU, angleV), Math.max(angleU, angleV));
            ctx.stroke();
        }

        // Draw vectors
        vectors.forEach((v, i) => {
            const vx = toCanvasX(v.x, centerX, scale);
            const vy = toCanvasY(v.y, centerY, scale);
            drawVector(ctx, centerX, centerY, vx, vy, colors[i % colors.length], 3, showLabels ? labels[i] : '');
            drawPoint(ctx, vx, vy, colors[i % colors.length], 10);
        });

        updatePlaygroundInfo();
    }

    function updatePlaygroundInfo() {
        document.getElementById('vectorCount').textContent = vectors.length;

        const vectorsList = document.getElementById('vectorsList');
        vectorsList.innerHTML = vectors.map((v, i) => `
            <div class="vector-item">
                <span class="vector-marker" style="background: ${colors[i % colors.length]}">${labels[i]}</span>
                <span>(${v.x.toFixed(1)}, ${v.y.toFixed(1)})</span>
            </div>
        `).join('');

        if (vectors.length >= 2) {
            const sum = { x: vectors[0].x + vectors[1].x, y: vectors[0].y + vectors[1].y };
            const dot = dotProduct(vectors[0], vectors[1]);
            const angle = angleBetween(vectors[0], vectors[1]);

            document.getElementById('playSum').textContent = `(${sum.x.toFixed(1)}, ${sum.y.toFixed(1)})`;
            document.getElementById('playDot').textContent = dot.toFixed(1);
            document.getElementById('playAngle').textContent = `${angle.toFixed(1)}°`;
        }
    }

    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function findNearVector(mouseX, mouseY, threshold = 15) {
        for (let i = 0; i < vectors.length; i++) {
            const vx = toCanvasX(vectors[i].x, centerX, scale);
            const vy = toCanvasY(vectors[i].y, centerY, scale);
            if (Math.sqrt((mouseX - vx) ** 2 + (mouseY - vy) ** 2) < threshold) return i;
        }
        return -1;
    }

    canvas.addEventListener('mousedown', (e) => {
        const pos = getMousePos(e);
        const nearIndex = findNearVector(pos.x, pos.y);
        if (nearIndex >= 0) {
            dragging = nearIndex;
            canvas.style.cursor = 'grabbing';
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        const pos = getMousePos(e);
        if (dragging !== null) {
            vectors[dragging].x = Math.round(toMathX(pos.x, centerX, scale) * 2) / 2;
            vectors[dragging].y = Math.round(toMathY(pos.y, centerY, scale) * 2) / 2;
            draw();
        } else {
            canvas.style.cursor = findNearVector(pos.x, pos.y) >= 0 ? 'grab' : 'crosshair';
        }
    });

    canvas.addEventListener('mouseup', () => { dragging = null; });

    canvas.addEventListener('click', (e) => {
        if (dragging !== null) return;
        const pos = getMousePos(e);
        if (findNearVector(pos.x, pos.y) < 0 && vectors.length < 5) {
            vectors.push({
                x: Math.round(toMathX(pos.x, centerX, scale) * 2) / 2,
                y: Math.round(toMathY(pos.y, centerY, scale) * 2) / 2
            });
            draw();
        }
    });

    document.getElementById('clearVectors')?.addEventListener('click', () => {
        vectors = [];
        draw();
    });

    document.getElementById('randomVectors')?.addEventListener('click', () => {
        vectors = [
            { x: Math.round((Math.random() * 8 - 4) * 2) / 2, y: Math.round((Math.random() * 6 - 3) * 2) / 2 },
            { x: Math.round((Math.random() * 8 - 4) * 2) / 2, y: Math.round((Math.random() * 6 - 3) * 2) / 2 }
        ];
        draw();
    });

    document.getElementById('showSum')?.addEventListener('change', (e) => { showSum = e.target.checked; draw(); });
    document.getElementById('showLabels')?.addEventListener('change', (e) => { showLabels = e.target.checked; draw(); });
    document.getElementById('showAngleArc')?.addEventListener('change', (e) => { showAngleArc = e.target.checked; draw(); });

    draw();
}

// =============================================
// EXERCISES
// =============================================

function initExercises() {
    const checkButtons = document.querySelectorAll('.btn-check');

    checkButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const exerciseNum = btn.dataset.exercise;
            const correctAnswer = btn.dataset.correct;
            const selectedOption = document.querySelector(`input[name="ex${exerciseNum}"]:checked`);

            if (!selectedOption) {
                alert('Vyberte prosím odpověď.');
                return;
            }

            const feedback = document.getElementById(`ex${exerciseNum}Feedback`);
            const status = document.getElementById(`ex${exerciseNum}Status`);
            const options = document.querySelectorAll(`input[name="ex${exerciseNum}"]`);

            options.forEach(opt => opt.disabled = true);
            btn.disabled = true;

            const isCorrect = selectedOption.value === correctAnswer;

            selectedOption.parentElement.classList.add(isCorrect ? 'correct' : 'incorrect');

            if (!isCorrect) {
                options.forEach(opt => {
                    if (opt.value === correctAnswer) {
                        opt.parentElement.classList.add('correct');
                    }
                });
            }

            status.textContent = isCorrect ? '✓ Správně' : '✗ Špatně';
            status.className = 'exercise-status ' + (isCorrect ? 'correct' : 'incorrect');

            feedback.textContent = isCorrect
                ? 'Výborně! Správná odpověď.'
                : 'Bohužel špatně. Správná odpověď je zvýrazněna.';
            feedback.className = 'exercise-feedback show ' + (isCorrect ? 'correct' : 'incorrect');

            checkAllExercisesComplete();
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
