// Vzdálenost a střed úsečky - Interactive Lesson JavaScript

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initDistanceDemo();
    initMidpointDemo();
    initRatioDemo();
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
        btn.addEventListener('click', () => {
            showSection(btn.dataset.next);
        });
    });

    prevButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            showSection(btn.dataset.prev);
        });
    });

    function updateProgress(sectionId) {
        const sectionOrder = ['intro', 'distance', 'midpoint', 'ratio', 'playground', 'exercises'];
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
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    for (let y = centerY % scale; y < height; y += scale) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
}

function drawAxes(ctx, width, height, centerX, centerY, scale) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(width - 10, centerY - 5);
    ctx.lineTo(width, centerY);
    ctx.lineTo(width - 10, centerY + 5);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(centerX - 5, 10);
    ctx.lineTo(centerX, 0);
    ctx.lineTo(centerX + 5, 10);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText('x', width - 20, centerY - 10);
    ctx.fillText('y', centerX + 10, 20);
}

function toCanvasX(x, centerX, scale) {
    return centerX + x * scale;
}

function toCanvasY(y, centerY, scale) {
    return centerY - y * scale;
}

function toMathX(canvasX, centerX, scale) {
    return (canvasX - centerX) / scale;
}

function toMathY(canvasY, centerY, scale) {
    return (centerY - canvasY) / scale;
}

function drawPoint(ctx, x, y, color, radius = 10, label = '') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    if (label) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y);
    }
}

function drawLine(ctx, x1, y1, x2, y2, color, lineWidth = 2, dashed = false) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    if (dashed) {
        ctx.setLineDash([5, 5]);
    } else {
        ctx.setLineDash([]);
    }
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
}

function calculateDistance(p1, p2) {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

function calculateMidpoint(p1, p2) {
    return {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2
    };
}

// =============================================
// DISTANCE DEMO
// =============================================

function initDistanceDemo() {
    const canvas = document.getElementById('distanceCanvas');
    if (!canvas) return;

    const { ctx, width, height, centerX, centerY, scale } = setupCanvas(canvas);

    let pointA = { x: 1, y: 1 };
    let pointB = { x: 4, y: 5 };
    let dragging = null;

    function draw() {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);

        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY, scale);

        const ax = toCanvasX(pointA.x, centerX, scale);
        const ay = toCanvasY(pointA.y, centerY, scale);
        const bx = toCanvasX(pointB.x, centerX, scale);
        const by = toCanvasY(pointB.y, centerY, scale);

        // Draw right triangle
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw Δx and Δy labels
        ctx.fillStyle = 'rgba(99, 102, 241, 0.8)';
        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Δx = ${(pointB.x - pointA.x).toFixed(1)}`, (ax + bx) / 2, ay + 20);
        ctx.fillText(`Δy = ${(pointB.y - pointA.y).toFixed(1)}`, bx + 25, (ay + by) / 2);

        // Draw distance line
        const gradient = ctx.createLinearGradient(ax, ay, bx, by);
        gradient.addColorStop(0, '#ef4444');
        gradient.addColorStop(1, '#3b82f6');
        drawLine(ctx, ax, ay, bx, by, gradient, 3);

        // Draw distance label
        const midX = (ax + bx) / 2;
        const midY = (ay + by) / 2;
        const distance = calculateDistance(pointA, pointB);

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.fillText(`|AB| = ${distance.toFixed(2)}`, midX - 40, midY - 15);

        // Draw points
        drawPoint(ctx, ax, ay, '#ef4444', 12, 'A');
        drawPoint(ctx, bx, by, '#3b82f6', 12, 'B');

        updateDistanceInfo();
    }

    function updateDistanceInfo() {
        const dx = pointB.x - pointA.x;
        const dy = pointB.y - pointA.y;
        const distance = calculateDistance(pointA, pointB);

        document.getElementById('distPointA').textContent = `[${pointA.x.toFixed(1)}, ${pointA.y.toFixed(1)}]`;
        document.getElementById('distPointB').textContent = `[${pointB.x.toFixed(1)}, ${pointB.y.toFixed(1)}]`;
        document.getElementById('deltaX').textContent = dx.toFixed(1);
        document.getElementById('deltaY').textContent = dy.toFixed(1);
        document.getElementById('distanceResult').textContent = distance.toFixed(2);

        // Detailed calculation
        const detailed = document.getElementById('detailedCalc');
        if (detailed) {
            detailed.innerHTML = `
                |AB| = √[(${pointB.x.toFixed(1)}-${pointA.x.toFixed(1)})² + (${pointB.y.toFixed(1)}-${pointA.y.toFixed(1)})²]<br>
                |AB| = √[${dx.toFixed(1)}² + ${dy.toFixed(1)}²]<br>
                |AB| = √[${(dx * dx).toFixed(1)} + ${(dy * dy).toFixed(1)}]<br>
                |AB| = √${(dx * dx + dy * dy).toFixed(1)} = ${distance.toFixed(2)}
            `;
        }
    }

    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function isNearPoint(mouseX, mouseY, point, threshold = 15) {
        const px = toCanvasX(point.x, centerX, scale);
        const py = toCanvasY(point.y, centerY, scale);
        return Math.sqrt((mouseX - px) ** 2 + (mouseY - py) ** 2) < threshold;
    }

    canvas.addEventListener('mousedown', (e) => {
        const pos = getMousePos(e);
        if (isNearPoint(pos.x, pos.y, pointA)) dragging = 'A';
        else if (isNearPoint(pos.x, pos.y, pointB)) dragging = 'B';
        canvas.style.cursor = dragging ? 'grabbing' : 'crosshair';
    });

    canvas.addEventListener('mousemove', (e) => {
        const pos = getMousePos(e);
        if (dragging) {
            const mathX = Math.round(toMathX(pos.x, centerX, scale) * 2) / 2;
            const mathY = Math.round(toMathY(pos.y, centerY, scale) * 2) / 2;
            if (dragging === 'A') { pointA.x = mathX; pointA.y = mathY; }
            else { pointB.x = mathX; pointB.y = mathY; }
            draw();
        } else {
            canvas.style.cursor = (isNearPoint(pos.x, pos.y, pointA) || isNearPoint(pos.x, pos.y, pointB)) ? 'grab' : 'crosshair';
        }
    });

    canvas.addEventListener('mouseup', () => { dragging = null; });
    canvas.addEventListener('mouseleave', () => { dragging = null; });

    draw();
}

// =============================================
// MIDPOINT DEMO
// =============================================

function initMidpointDemo() {
    const canvas = document.getElementById('midpointCanvas');
    if (!canvas) return;

    const { ctx, width, height, centerX, centerY, scale } = setupCanvas(canvas);

    let pointA = { x: 0, y: 0 };
    let pointB = { x: 4, y: 2 };
    let dragging = null;

    function draw() {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);

        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY, scale);

        const ax = toCanvasX(pointA.x, centerX, scale);
        const ay = toCanvasY(pointA.y, centerY, scale);
        const bx = toCanvasX(pointB.x, centerX, scale);
        const by = toCanvasY(pointB.y, centerY, scale);

        const midpoint = calculateMidpoint(pointA, pointB);
        const sx = toCanvasX(midpoint.x, centerX, scale);
        const sy = toCanvasY(midpoint.y, centerY, scale);

        // Draw segment
        drawLine(ctx, ax, ay, bx, by, 'rgba(99, 102, 241, 0.5)', 3);

        // Draw AS and SB with different colors
        drawLine(ctx, ax, ay, sx, sy, '#ef4444', 2);
        drawLine(ctx, sx, sy, bx, by, '#3b82f6', 2);

        // Draw points
        drawPoint(ctx, ax, ay, '#ef4444', 12, 'A');
        drawPoint(ctx, bx, by, '#3b82f6', 12, 'B');
        drawPoint(ctx, sx, sy, '#10b981', 12, 'S');

        updateMidpointInfo();
    }

    function updateMidpointInfo() {
        const midpoint = calculateMidpoint(pointA, pointB);
        const distAS = calculateDistance(pointA, midpoint);
        const distSB = calculateDistance(midpoint, pointB);

        document.getElementById('midPointA').textContent = `[${pointA.x.toFixed(1)}, ${pointA.y.toFixed(1)}]`;
        document.getElementById('midPointB').textContent = `[${pointB.x.toFixed(1)}, ${pointB.y.toFixed(1)}]`;
        document.getElementById('midX').textContent = midpoint.x.toFixed(1);
        document.getElementById('midY').textContent = midpoint.y.toFixed(1);
        document.getElementById('midpointResult').textContent = `[${midpoint.x.toFixed(1)}, ${midpoint.y.toFixed(1)}]`;
        document.getElementById('verifyAS').textContent = distAS.toFixed(2);
        document.getElementById('verifySB').textContent = distSB.toFixed(2);

        const status = document.getElementById('verifyStatus');
        if (Math.abs(distAS - distSB) < 0.01) {
            status.textContent = '✓ Vzdálenosti jsou stejné';
            status.className = 'verify-ok';
        }
    }

    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function isNearPoint(mouseX, mouseY, point, threshold = 15) {
        const px = toCanvasX(point.x, centerX, scale);
        const py = toCanvasY(point.y, centerY, scale);
        return Math.sqrt((mouseX - px) ** 2 + (mouseY - py) ** 2) < threshold;
    }

    canvas.addEventListener('mousedown', (e) => {
        const pos = getMousePos(e);
        if (isNearPoint(pos.x, pos.y, pointA)) dragging = 'A';
        else if (isNearPoint(pos.x, pos.y, pointB)) dragging = 'B';
        canvas.style.cursor = dragging ? 'grabbing' : 'crosshair';
    });

    canvas.addEventListener('mousemove', (e) => {
        const pos = getMousePos(e);
        if (dragging) {
            const mathX = Math.round(toMathX(pos.x, centerX, scale) * 2) / 2;
            const mathY = Math.round(toMathY(pos.y, centerY, scale) * 2) / 2;
            if (dragging === 'A') { pointA.x = mathX; pointA.y = mathY; }
            else { pointB.x = mathX; pointB.y = mathY; }
            draw();
        } else {
            canvas.style.cursor = (isNearPoint(pos.x, pos.y, pointA) || isNearPoint(pos.x, pos.y, pointB)) ? 'grab' : 'crosshair';
        }
    });

    canvas.addEventListener('mouseup', () => { dragging = null; });
    canvas.addEventListener('mouseleave', () => { dragging = null; });

    draw();
}

// =============================================
// RATIO DEMO
// =============================================

function initRatioDemo() {
    const canvas = document.getElementById('ratioCanvas');
    if (!canvas) return;

    const { ctx, width, height, centerX, centerY, scale } = setupCanvas(canvas);

    let pointA = { x: 0, y: 0 };
    let pointB = { x: 6, y: 4 };
    let dragging = null;

    const mSlider = document.getElementById('mSlider');
    const nSlider = document.getElementById('nSlider');

    function draw() {
        const m = parseInt(mSlider.value);
        const n = parseInt(nSlider.value);

        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);

        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY, scale);

        const ax = toCanvasX(pointA.x, centerX, scale);
        const ay = toCanvasY(pointA.y, centerY, scale);
        const bx = toCanvasX(pointB.x, centerX, scale);
        const by = toCanvasY(pointB.y, centerY, scale);

        // Calculate T point
        const tx = (n * pointA.x + m * pointB.x) / (m + n);
        const ty = (n * pointA.y + m * pointB.y) / (m + n);
        const tcx = toCanvasX(tx, centerX, scale);
        const tcy = toCanvasY(ty, centerY, scale);

        // Draw segment
        drawLine(ctx, ax, ay, tcx, tcy, '#ef4444', 3);
        drawLine(ctx, tcx, tcy, bx, by, '#3b82f6', 3);

        // Draw points
        drawPoint(ctx, ax, ay, '#ef4444', 12, 'A');
        drawPoint(ctx, bx, by, '#3b82f6', 12, 'B');
        drawPoint(ctx, tcx, tcy, '#f59e0b', 12, 'T');

        // Labels
        ctx.fillStyle = '#ef4444';
        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`m = ${m}`, (ax + tcx) / 2, (ay + tcy) / 2 - 15);

        ctx.fillStyle = '#3b82f6';
        ctx.fillText(`n = ${n}`, (tcx + bx) / 2, (tcy + by) / 2 - 15);

        updateRatioInfo(m, n, tx, ty);
    }

    function updateRatioInfo(m, n, tx, ty) {
        document.getElementById('mValue').textContent = m;
        document.getElementById('nValue').textContent = n;
        document.getElementById('ratioPointA').textContent = `[${pointA.x.toFixed(1)}, ${pointA.y.toFixed(1)}]`;
        document.getElementById('ratioPointB').textContent = `[${pointB.x.toFixed(1)}, ${pointB.y.toFixed(1)}]`;
        document.getElementById('ratioDisplay').textContent = `${m} : ${n}`;
        document.getElementById('ratioResult').textContent = `[${tx.toFixed(1)}, ${ty.toFixed(1)}]`;

        // Update visual bar
        document.getElementById('ratioBarM').style.flex = m;
        document.getElementById('ratioBarN').style.flex = n;
    }

    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function isNearPoint(mouseX, mouseY, point, threshold = 15) {
        const px = toCanvasX(point.x, centerX, scale);
        const py = toCanvasY(point.y, centerY, scale);
        return Math.sqrt((mouseX - px) ** 2 + (mouseY - py) ** 2) < threshold;
    }

    canvas.addEventListener('mousedown', (e) => {
        const pos = getMousePos(e);
        if (isNearPoint(pos.x, pos.y, pointA)) dragging = 'A';
        else if (isNearPoint(pos.x, pos.y, pointB)) dragging = 'B';
        canvas.style.cursor = dragging ? 'grabbing' : 'crosshair';
    });

    canvas.addEventListener('mousemove', (e) => {
        const pos = getMousePos(e);
        if (dragging) {
            const mathX = Math.round(toMathX(pos.x, centerX, scale) * 2) / 2;
            const mathY = Math.round(toMathY(pos.y, centerY, scale) * 2) / 2;
            if (dragging === 'A') { pointA.x = mathX; pointA.y = mathY; }
            else { pointB.x = mathX; pointB.y = mathY; }
            draw();
        } else {
            canvas.style.cursor = (isNearPoint(pos.x, pos.y, pointA) || isNearPoint(pos.x, pos.y, pointB)) ? 'grab' : 'crosshair';
        }
    });

    canvas.addEventListener('mouseup', () => { dragging = null; });
    canvas.addEventListener('mouseleave', () => { dragging = null; });

    mSlider.addEventListener('input', draw);
    nSlider.addEventListener('input', draw);

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

    let points = [];
    let dragging = null;
    let showMidpoints = true;
    const pointLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

    function draw() {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);

        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY, scale);

        // Draw segments between consecutive points
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const x1 = toCanvasX(p1.x, centerX, scale);
            const y1 = toCanvasY(p1.y, centerY, scale);
            const x2 = toCanvasX(p2.x, centerX, scale);
            const y2 = toCanvasY(p2.y, centerY, scale);

            drawLine(ctx, x1, y1, x2, y2, 'rgba(99, 102, 241, 0.5)', 2);
        }

        // Draw midpoints
        if (showMidpoints && points.length >= 2) {
            for (let i = 0; i < points.length - 1; i++) {
                const mid = calculateMidpoint(points[i], points[i + 1]);
                const mx = toCanvasX(mid.x, centerX, scale);
                const my = toCanvasY(mid.y, centerY, scale);

                ctx.fillStyle = 'rgba(16, 185, 129, 0.7)';
                ctx.beginPath();
                ctx.arc(mx, my, 6, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw points
        points.forEach((point, i) => {
            const px = toCanvasX(point.x, centerX, scale);
            const py = toCanvasY(point.y, centerY, scale);
            drawPoint(ctx, px, py, colors[i % colors.length], 12, point.label);
        });

        updatePlaygroundInfo();
    }

    function updatePlaygroundInfo() {
        document.getElementById('pointCount').textContent = points.length;

        // Points list
        const pointsList = document.getElementById('pointsList');
        if (points.length === 0) {
            pointsList.innerHTML = '<div class="empty-message">Klikněte na plátno pro přidání bodů</div>';
        } else {
            pointsList.innerHTML = points.map((p, i) => `
                <div class="point-item">
                    <span class="point-marker" style="background: ${colors[i % colors.length]}">${p.label}</span>
                    <span>[${p.x.toFixed(1)}, ${p.y.toFixed(1)}]</span>
                </div>
            `).join('');
        }

        // Distances list
        const distancesList = document.getElementById('distancesList');
        if (points.length < 2) {
            distancesList.innerHTML = '<div class="empty-message">Přidejte alespoň 2 body</div>';
        } else {
            let html = '';
            for (let i = 0; i < points.length - 1; i++) {
                const dist = calculateDistance(points[i], points[i + 1]);
                html += `
                    <div class="distance-item">
                        <span>|${points[i].label}${points[i + 1].label}| = </span>
                        <span style="color: var(--accent-primary)">${dist.toFixed(2)}</span>
                    </div>
                `;
            }
            distancesList.innerHTML = html;
        }

        // Midpoints list
        const midpointsList = document.getElementById('midpointsList');
        if (points.length < 2) {
            midpointsList.innerHTML = '<div class="empty-message">Přidejte alespoň 2 body</div>';
        } else {
            let html = '';
            for (let i = 0; i < points.length - 1; i++) {
                const mid = calculateMidpoint(points[i], points[i + 1]);
                html += `
                    <div class="midpoint-item">
                        <span>S(${points[i].label}${points[i + 1].label}) = </span>
                        <span style="color: #10b981">[${mid.x.toFixed(1)}, ${mid.y.toFixed(1)}]</span>
                    </div>
                `;
            }
            midpointsList.innerHTML = html;
        }
    }

    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function findNearPoint(mouseX, mouseY, threshold = 15) {
        for (let i = 0; i < points.length; i++) {
            const px = toCanvasX(points[i].x, centerX, scale);
            const py = toCanvasY(points[i].y, centerY, scale);
            if (Math.sqrt((mouseX - px) ** 2 + (mouseY - py) ** 2) < threshold) return i;
        }
        return -1;
    }

    canvas.addEventListener('mousedown', (e) => {
        const pos = getMousePos(e);
        const nearIndex = findNearPoint(pos.x, pos.y);
        if (nearIndex >= 0) {
            dragging = nearIndex;
            canvas.style.cursor = 'grabbing';
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        const pos = getMousePos(e);
        if (dragging !== null) {
            const mathX = Math.round(toMathX(pos.x, centerX, scale) * 2) / 2;
            const mathY = Math.round(toMathY(pos.y, centerY, scale) * 2) / 2;
            points[dragging].x = mathX;
            points[dragging].y = mathY;
            draw();
        } else {
            const nearIndex = findNearPoint(pos.x, pos.y);
            canvas.style.cursor = nearIndex >= 0 ? 'grab' : 'crosshair';
        }
    });

    canvas.addEventListener('mouseup', () => { dragging = null; });

    canvas.addEventListener('click', (e) => {
        if (dragging !== null) return;
        const pos = getMousePos(e);
        const nearIndex = findNearPoint(pos.x, pos.y);
        if (nearIndex < 0 && points.length < 10) {
            const mathX = Math.round(toMathX(pos.x, centerX, scale) * 2) / 2;
            const mathY = Math.round(toMathY(pos.y, centerY, scale) * 2) / 2;
            points.push({ x: mathX, y: mathY, label: pointLabels[points.length] });
            draw();
        }
    });

    canvas.addEventListener('dblclick', (e) => {
        const pos = getMousePos(e);
        const nearIndex = findNearPoint(pos.x, pos.y);
        if (nearIndex >= 0) {
            points.splice(nearIndex, 1);
            points.forEach((p, i) => p.label = pointLabels[i]);
            draw();
        }
    });

    // Controls
    document.getElementById('clearPlayground')?.addEventListener('click', () => {
        points = [];
        draw();
    });

    document.getElementById('addRandomPoints')?.addEventListener('click', () => {
        points = [];
        for (let i = 0; i < 3; i++) {
            points.push({
                x: Math.round((Math.random() * 10 - 5) * 2) / 2,
                y: Math.round((Math.random() * 8 - 4) * 2) / 2,
                label: pointLabels[i]
            });
        }
        draw();
    });

    document.getElementById('showMidpoints')?.addEventListener('change', (e) => {
        showMidpoints = e.target.checked;
        draw();
    });

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
