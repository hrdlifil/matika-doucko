// Úvod do analytické geometrie - Interactive Lesson JavaScript

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initCoordinateDemo();
    initPointDemo();
    initVectorDemo();
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
        const sectionOrder = ['intro', 'coordinates', 'points', 'vectors', 'playground', 'exercises'];
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
    const scale = 40;

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

    // X-axis
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // Arrows
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

    // Labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText('x', width - 20, centerY - 10);
    ctx.fillText('y', centerX + 10, 20);
    ctx.fillText('O', centerX + 5, centerY + 15);

    // Tick marks
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '11px Inter, sans-serif';
    for (let i = -Math.floor(centerX / scale); i <= Math.floor((width - centerX) / scale); i++) {
        if (i !== 0) {
            const x = centerX + i * scale;
            ctx.fillText(i.toString(), x - 4, centerY + 15);
        }
    }
    for (let i = -Math.floor((height - centerY) / scale); i <= Math.floor(centerY / scale); i++) {
        if (i !== 0) {
            const y = centerY - i * scale;
            ctx.fillText(i.toString(), centerX + 5, y + 4);
        }
    }
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

function drawPoint(ctx, x, y, color, radius = 8, label = '') {
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

function drawVector(ctx, x1, y1, x2, y2, color, lineWidth = 3) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Arrow head
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLength = 12;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
        x2 - headLength * Math.cos(angle - Math.PI / 6),
        y2 - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
        x2 - headLength * Math.cos(angle + Math.PI / 6),
        y2 - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
}

// =============================================
// COORDINATE SYSTEM DEMO
// =============================================

function initCoordinateDemo() {
    const canvas = document.getElementById('coordCanvas');
    if (!canvas) return;

    const { ctx, width, height, centerX, centerY, scale } = setupCanvas(canvas);
    let clickedPoint = null;

    function draw() {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);

        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY, scale);

        // Draw quadrant labels
        ctx.font = '24px Inter, sans-serif';
        ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
        ctx.fillText('I', centerX + 60, centerY - 60);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.fillText('II', centerX - 80, centerY - 60);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
        ctx.fillText('III', centerX - 80, centerY + 80);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.fillText('IV', centerX + 60, centerY + 80);

        if (clickedPoint) {
            const cx = toCanvasX(clickedPoint.x, centerX, scale);
            const cy = toCanvasY(clickedPoint.y, centerY, scale);

            // Draw dashed lines to axes
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx, centerY);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(centerX, cy);
            ctx.stroke();

            ctx.setLineDash([]);

            // Draw point
            drawPoint(ctx, cx, cy, '#6366f1', 10);

            // Draw coordinate label
            ctx.fillStyle = '#fff';
            ctx.font = '14px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`[${clickedPoint.x.toFixed(1)}, ${clickedPoint.y.toFixed(1)}]`, cx + 15, cy - 10);
        }
    }

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;

        const mathX = Math.round(toMathX(canvasX, centerX, scale) * 2) / 2;
        const mathY = Math.round(toMathY(canvasY, centerY, scale) * 2) / 2;

        clickedPoint = { x: mathX, y: mathY };

        // Determine quadrant
        let quadrant = '';
        if (mathX > 0 && mathY > 0) quadrant = 'I. kvadrant';
        else if (mathX < 0 && mathY > 0) quadrant = 'II. kvadrant';
        else if (mathX < 0 && mathY < 0) quadrant = 'III. kvadrant';
        else if (mathX > 0 && mathY < 0) quadrant = 'IV. kvadrant';
        else if (mathX === 0 && mathY === 0) quadrant = 'Počátek';
        else if (mathX === 0) quadrant = 'Osa y';
        else quadrant = 'Osa x';

        document.getElementById('clickedPoint').innerHTML =
            `[${mathX.toFixed(1)}, ${mathY.toFixed(1)}]<br><small style="color: var(--text-tertiary)">${quadrant}</small>`;

        draw();
    });

    draw();
}

// =============================================
// POINT DEMO
// =============================================

function initPointDemo() {
    const canvas = document.getElementById('pointCanvas');
    if (!canvas) return;

    const { ctx, width, height, centerX, centerY, scale } = setupCanvas(canvas);

    const sliders = {
        x: document.getElementById('ptXSlider'),
        y: document.getElementById('ptYSlider')
    };

    const displays = {
        x: document.getElementById('ptXValue'),
        y: document.getElementById('ptYValue'),
        point: document.getElementById('pointDisplay'),
        distance: document.getElementById('distanceFromOrigin')
    };

    let pointB = null;

    function draw() {
        const x = parseFloat(sliders.x.value);
        const y = parseFloat(sliders.y.value);

        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);

        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY, scale);

        const px = toCanvasX(x, centerX, scale);
        const py = toCanvasY(y, centerY, scale);

        // Draw dashed lines to axes
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px, centerY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(centerX, py);
        ctx.stroke();

        ctx.setLineDash([]);

        // Draw origin
        drawPoint(ctx, centerX, centerY, '#666', 5);

        // Draw point A
        drawPoint(ctx, px, py, '#ef4444', 12, 'A');

        // Draw point B if exists
        if (pointB) {
            const bx = toCanvasX(pointB.x, centerX, scale);
            const by = toCanvasY(pointB.y, centerY, scale);
            drawPoint(ctx, bx, by, '#3b82f6', 12, 'B');

            // Draw distance line
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(bx, by);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Update displays
        displays.x.textContent = x;
        displays.y.textContent = y;
        displays.point.textContent = `A = [${x}, ${y}]`;

        const distance = Math.sqrt(x * x + y * y);
        displays.distance.textContent = distance.toFixed(2);
    }

    Object.values(sliders).forEach(slider => {
        if (slider) slider.addEventListener('input', draw);
    });

    // Add point B button
    const addBtn = document.getElementById('addPointBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            if (!pointB) {
                pointB = { x: -2, y: 3 };
                addBtn.textContent = '- Odebrat bod B';
            } else {
                pointB = null;
                addBtn.textContent = '+ Přidat bod B';
            }
            draw();
        });
    }

    draw();
}

// =============================================
// VECTOR DEMO
// =============================================

function initVectorDemo() {
    const canvas = document.getElementById('vectorCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 50;

    let pointA = { x: 0, y: 0 };
    let pointB = { x: 3, y: 2 };
    let dragging = null;
    let canMoveA = false;

    function draw() {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);

        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY, scale);

        const ax = toCanvasX(pointA.x, centerX, scale);
        const ay = toCanvasY(pointA.y, centerY, scale);
        const bx = toCanvasX(pointB.x, centerX, scale);
        const by = toCanvasY(pointB.y, centerY, scale);

        // Draw vector
        const gradient = ctx.createLinearGradient(ax, ay, bx, by);
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(1, '#a855f7');
        drawVector(ctx, ax, ay, bx, by, gradient, 4);

        // Draw points
        drawPoint(ctx, ax, ay, '#ef4444', 12, 'A');
        drawPoint(ctx, bx, by, '#3b82f6', 12, 'B');

        // Update displays
        updateVectorInfo();
    }

    function updateVectorInfo() {
        const dx = pointB.x - pointA.x;
        const dy = pointB.y - pointA.y;
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        document.getElementById('vecPointA').textContent = `[${pointA.x.toFixed(1)}, ${pointA.y.toFixed(1)}]`;
        document.getElementById('vecPointB').textContent = `[${pointB.x.toFixed(1)}, ${pointB.y.toFixed(1)}]`;
        document.getElementById('vectorCoords').textContent = `(${dx.toFixed(1)}, ${dy.toFixed(1)})`;
        document.getElementById('vectorMagnitude').textContent = magnitude.toFixed(2);
        document.getElementById('vectorAngle').textContent = `${angle.toFixed(1)}°`;
    }

    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    function isNearPoint(mouseX, mouseY, point, threshold = 15) {
        const px = toCanvasX(point.x, centerX, scale);
        const py = toCanvasY(point.y, centerY, scale);
        const dist = Math.sqrt((mouseX - px) ** 2 + (mouseY - py) ** 2);
        return dist < threshold;
    }

    canvas.addEventListener('mousedown', (e) => {
        const pos = getMousePos(e);

        if (isNearPoint(pos.x, pos.y, pointB)) {
            dragging = 'B';
        } else if (canMoveA && isNearPoint(pos.x, pos.y, pointA)) {
            dragging = 'A';
        }

        canvas.style.cursor = dragging ? 'grabbing' : 'crosshair';
    });

    canvas.addEventListener('mousemove', (e) => {
        const pos = getMousePos(e);

        if (dragging) {
            const mathX = Math.round(toMathX(pos.x, centerX, scale) * 2) / 2;
            const mathY = Math.round(toMathY(pos.y, centerY, scale) * 2) / 2;

            if (dragging === 'A') {
                pointA.x = mathX;
                pointA.y = mathY;
            } else {
                pointB.x = mathX;
                pointB.y = mathY;
            }

            draw();
        } else {
            if (isNearPoint(pos.x, pos.y, pointB) || (canMoveA && isNearPoint(pos.x, pos.y, pointA))) {
                canvas.style.cursor = 'grab';
            } else {
                canvas.style.cursor = 'crosshair';
            }
        }
    });

    canvas.addEventListener('mouseup', () => {
        dragging = null;
        canvas.style.cursor = 'crosshair';
    });

    canvas.addEventListener('mouseleave', () => {
        dragging = null;
    });

    // Toggle point A movement
    const moveABtn = document.getElementById('moveStartPoint');
    if (moveABtn) {
        moveABtn.addEventListener('click', () => {
            canMoveA = !canMoveA;
            moveABtn.textContent = canMoveA ? 'Zamknout bod A' : 'Povolit pohyb bodu A';
            moveABtn.classList.toggle('active', canMoveA);
        });
    }

    // Reset button
    const resetBtn = document.getElementById('resetVector');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            pointA = { x: 0, y: 0 };
            pointB = { x: 3, y: 2 };
            draw();
        });
    }

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

    let points = [
        { x: 2, y: 3, label: 'A' },
        { x: 5, y: 1, label: 'B' }
    ];
    let dragging = null;
    let showGrid = true;
    const pointLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

    function draw() {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);

        if (showGrid) {
            drawGrid(ctx, width, height, centerX, centerY, scale);
        }
        drawAxes(ctx, width, height, centerX, centerY, scale);

        // Draw vectors between consecutive points
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const x1 = toCanvasX(p1.x, centerX, scale);
            const y1 = toCanvasY(p1.y, centerY, scale);
            const x2 = toCanvasX(p2.x, centerX, scale);
            const y2 = toCanvasY(p2.y, centerY, scale);

            ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.setLineDash([]);
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
        // Update points list
        const pointsList = document.getElementById('pointsList');
        if (pointsList) {
            pointsList.innerHTML = points.map((p, i) => `
                <div class="point-item">
                    <span class="point-marker" style="background: ${colors[i % colors.length]}">${p.label}</span>
                    <span>[${p.x.toFixed(1)}, ${p.y.toFixed(1)}]</span>
                </div>
            `).join('');
        }

        // Update vectors list
        const vectorsList = document.getElementById('vectorsList');
        if (vectorsList && points.length >= 2) {
            let html = '';
            for (let i = 0; i < points.length - 1; i++) {
                const dx = points[i + 1].x - points[i].x;
                const dy = points[i + 1].y - points[i].y;
                html += `
                    <div class="vector-item">
                        <span><span class="vec">${points[i].label}${points[i + 1].label}</span> = </span>
                        <span class="vector-value">(${dx.toFixed(1)}, ${dy.toFixed(1)})</span>
                    </div>
                `;
            }
            vectorsList.innerHTML = html || '<div class="vector-item"><span>Přidejte alespoň 2 body</span></div>';
        }

        // Update distances list
        const distancesList = document.getElementById('distancesList');
        if (distancesList && points.length >= 2) {
            let html = '';
            for (let i = 0; i < points.length - 1; i++) {
                const dx = points[i + 1].x - points[i].x;
                const dy = points[i + 1].y - points[i].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                html += `
                    <div class="distance-item">
                        <span>|${points[i].label}${points[i + 1].label}| = </span>
                        <span class="distance-value">${dist.toFixed(2)}</span>
                    </div>
                `;
            }
            distancesList.innerHTML = html || '<div class="distance-item"><span>Přidejte alespoň 2 body</span></div>';
        }
    }

    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    function findNearPoint(mouseX, mouseY, threshold = 15) {
        for (let i = 0; i < points.length; i++) {
            const px = toCanvasX(points[i].x, centerX, scale);
            const py = toCanvasY(points[i].y, centerY, scale);
            const dist = Math.sqrt((mouseX - px) ** 2 + (mouseY - py) ** 2);
            if (dist < threshold) return i;
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

    canvas.addEventListener('mouseup', () => {
        dragging = null;
        canvas.style.cursor = 'crosshair';
    });

    canvas.addEventListener('click', (e) => {
        if (dragging !== null) return;

        const pos = getMousePos(e);
        const nearIndex = findNearPoint(pos.x, pos.y);

        if (nearIndex < 0 && points.length < 10) {
            const mathX = Math.round(toMathX(pos.x, centerX, scale) * 2) / 2;
            const mathY = Math.round(toMathY(pos.y, centerY, scale) * 2) / 2;
            points.push({
                x: mathX,
                y: mathY,
                label: pointLabels[points.length]
            });
            draw();
        }
    });

    // Clear button
    const clearBtn = document.getElementById('clearPlayground');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            points = [];
            draw();
        });
    }

    // Toggle grid button
    const gridBtn = document.getElementById('toggleGrid');
    if (gridBtn) {
        gridBtn.addEventListener('click', () => {
            showGrid = !showGrid;
            gridBtn.classList.toggle('active', showGrid);
            draw();
        });
    }

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
