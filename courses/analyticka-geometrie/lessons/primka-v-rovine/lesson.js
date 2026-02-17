// Přímka v rovině - Interactive Lesson JavaScript

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initParametricDemo();
    initGeneralDemo();
    initSlopeDemo();
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

        // Update progress
        updateProgress(sectionId);

        // Scroll to top of content
        document.querySelector('.lesson-content').scrollTop = 0;
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
        const sectionOrder = ['intro', 'parametric', 'general', 'slope', 'interactive', 'exercises'];
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
    const scale = 40; // pixels per unit

    return { ctx, width, height, centerX, centerY, scale };
}

function drawGrid(ctx, width, height, centerX, centerY, scale) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = centerX % scale; x < width; x += scale) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    // Horizontal lines
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

    // X arrow
    ctx.beginPath();
    ctx.moveTo(width - 10, centerY - 5);
    ctx.lineTo(width, centerY);
    ctx.lineTo(width - 10, centerY + 5);
    ctx.fill();

    // Y arrow
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
    ctx.fillText('0', centerX + 5, centerY + 15);

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

function drawLine(ctx, x1, y1, x2, y2, color, lineWidth = 3) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
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

function drawVector(ctx, x1, y1, x2, y2, color) {
    drawLine(ctx, x1, y1, x2, y2, color, 2);

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
// PARAMETRIC DEMO
// =============================================

function initParametricDemo() {
    const canvas = document.getElementById('parametricCanvas');
    if (!canvas) return;

    const { ctx, width, height, centerX, centerY, scale } = setupCanvas(canvas);

    const sliders = {
        x0: document.getElementById('x0Slider'),
        y0: document.getElementById('y0Slider'),
        a: document.getElementById('aSlider'),
        b: document.getElementById('bSlider')
    };

    const displays = {
        x0: document.getElementById('x0Value'),
        y0: document.getElementById('y0Value'),
        a: document.getElementById('aValue'),
        b: document.getElementById('bValue'),
        equation: document.getElementById('parametricEquation')
    };

    function draw() {
        const x0 = parseFloat(sliders.x0.value);
        const y0 = parseFloat(sliders.y0.value);
        const a = parseFloat(sliders.a.value);
        const b = parseFloat(sliders.b.value);

        // Clear
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);

        // Grid and axes
        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY, scale);

        // Draw the line (extended to canvas edges)
        if (a !== 0 || b !== 0) {
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#6366f1');
            gradient.addColorStop(1, '#a855f7');

            // Find t values for canvas edges
            let t1 = -20, t2 = 20;
            const px1 = toCanvasX(x0 + t1 * a, centerX, scale);
            const py1 = toCanvasY(y0 + t1 * b, centerY, scale);
            const px2 = toCanvasX(x0 + t2 * a, centerX, scale);
            const py2 = toCanvasY(y0 + t2 * b, centerY, scale);

            drawLine(ctx, px1, py1, px2, py2, gradient);
        }

        // Draw direction vector
        const vecEndX = toCanvasX(x0 + a, centerX, scale);
        const vecEndY = toCanvasY(y0 + b, centerY, scale);
        const pointX = toCanvasX(x0, centerX, scale);
        const pointY = toCanvasY(y0, centerY, scale);

        drawVector(ctx, pointX, pointY, vecEndX, vecEndY, '#10b981');

        // Draw point A
        drawPoint(ctx, pointX, pointY, '#ef4444', 10, 'A');

        // Label for vector
        ctx.fillStyle = '#10b981';
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText('s\u20D7', (pointX + vecEndX) / 2 + 10, (pointY + vecEndY) / 2 - 10);

        // Update displays
        displays.x0.textContent = x0;
        displays.y0.textContent = y0;
        displays.a.textContent = a;
        displays.b.textContent = b;

        const aSign = a >= 0 ? '+' : '';
        const bSign = b >= 0 ? '+' : '';
        displays.equation.innerHTML = `x = ${x0} ${aSign} t·${a}<br>y = ${y0} ${bSign} t·${b}`;
    }

    Object.values(sliders).forEach(slider => {
        slider.addEventListener('input', draw);
    });

    draw();
}

// =============================================
// GENERAL EQUATION DEMO
// =============================================

function initGeneralDemo() {
    const canvas = document.getElementById('generalCanvas');
    if (!canvas) return;

    const { ctx, width, height, centerX, centerY, scale } = setupCanvas(canvas);

    const sliders = {
        a: document.getElementById('gASlider'),
        b: document.getElementById('gBSlider'),
        c: document.getElementById('gCSlider')
    };

    const displays = {
        a: document.getElementById('gAValue'),
        b: document.getElementById('gBValue'),
        c: document.getElementById('gCValue'),
        equation: document.getElementById('generalEquation'),
        normal: document.getElementById('normalVector')
    };

    function draw() {
        const a = parseFloat(sliders.a.value);
        const b = parseFloat(sliders.b.value);
        const c = parseFloat(sliders.c.value);

        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);

        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY, scale);

        // Draw line: ax + by + c = 0
        if (a !== 0 || b !== 0) {
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#6366f1');
            gradient.addColorStop(1, '#a855f7');

            let x1, y1, x2, y2;

            if (Math.abs(b) > Math.abs(a)) {
                // More horizontal - use x endpoints
                x1 = -10;
                y1 = (-a * x1 - c) / b;
                x2 = 10;
                y2 = (-a * x2 - c) / b;
            } else {
                // More vertical - use y endpoints
                y1 = -10;
                x1 = (-b * y1 - c) / a;
                y2 = 10;
                x2 = (-b * y2 - c) / a;
            }

            const px1 = toCanvasX(x1, centerX, scale);
            const py1 = toCanvasY(y1, centerY, scale);
            const px2 = toCanvasX(x2, centerX, scale);
            const py2 = toCanvasY(y2, centerY, scale);

            drawLine(ctx, px1, py1, px2, py2, gradient);

            // Draw normal vector from a point on the line
            let pointOnLineX, pointOnLineY;
            if (b !== 0) {
                pointOnLineX = 0;
                pointOnLineY = -c / b;
            } else {
                pointOnLineX = -c / a;
                pointOnLineY = 0;
            }

            const normalScale = 0.5;
            const normalEndX = pointOnLineX + a * normalScale;
            const normalEndY = pointOnLineY + b * normalScale;

            const npx = toCanvasX(pointOnLineX, centerX, scale);
            const npy = toCanvasY(pointOnLineY, centerY, scale);
            const nex = toCanvasX(normalEndX, centerX, scale);
            const ney = toCanvasY(normalEndY, centerY, scale);

            drawVector(ctx, npx, npy, nex, ney, '#f59e0b');

            ctx.fillStyle = '#f59e0b';
            ctx.font = '14px Inter, sans-serif';
            ctx.fillText('n\u20D7', nex + 10, ney);
        }

        // Update displays
        displays.a.textContent = a;
        displays.b.textContent = b;
        displays.c.textContent = c;

        const cSign = c >= 0 ? '+' : '';
        displays.equation.textContent = `${a}x + ${b}y ${cSign} ${c} = 0`;
        displays.normal.textContent = `${a}, ${b}`;
    }

    Object.values(sliders).forEach(slider => {
        slider.addEventListener('input', draw);
    });

    draw();
}

// =============================================
// SLOPE-INTERCEPT DEMO
// =============================================

function initSlopeDemo() {
    const canvas = document.getElementById('slopeCanvas');
    if (!canvas) return;

    const { ctx, width, height, centerX, centerY, scale } = setupCanvas(canvas);

    const sliders = {
        k: document.getElementById('kSlider'),
        q: document.getElementById('qSlider')
    };

    const displays = {
        k: document.getElementById('kValue'),
        q: document.getElementById('qValue'),
        equation: document.getElementById('slopeEquation'),
        angle: document.getElementById('angleValue')
    };

    function draw() {
        const k = parseFloat(sliders.k.value);
        const q = parseFloat(sliders.q.value);

        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);

        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY, scale);

        // Draw line: y = kx + q
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(1, '#a855f7');

        const x1 = -10;
        const y1 = k * x1 + q;
        const x2 = 10;
        const y2 = k * x2 + q;

        const px1 = toCanvasX(x1, centerX, scale);
        const py1 = toCanvasY(y1, centerY, scale);
        const px2 = toCanvasX(x2, centerX, scale);
        const py2 = toCanvasY(y2, centerY, scale);

        drawLine(ctx, px1, py1, px2, py2, gradient);

        // Draw y-intercept point
        const interceptX = toCanvasX(0, centerX, scale);
        const interceptY = toCanvasY(q, centerY, scale);
        drawPoint(ctx, interceptX, interceptY, '#10b981', 8);

        // Label
        ctx.fillStyle = '#10b981';
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText(`(0, ${q})`, interceptX + 15, interceptY);

        // Draw angle arc
        if (k !== 0) {
            const arcRadius = 40;
            const angle = Math.atan(k);

            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            if (k > 0) {
                ctx.arc(interceptX, interceptY, arcRadius, 0, -angle, true);
            } else {
                ctx.arc(interceptX, interceptY, arcRadius, 0, -angle, false);
            }
            ctx.stroke();
        }

        // Update displays
        displays.k.textContent = k;
        displays.q.textContent = q;

        const kSign = k >= 0 ? '' : '';
        const qSign = q >= 0 ? '+' : '';
        displays.equation.textContent = `y = ${k}x ${qSign} ${q}`;

        const angleDeg = Math.round(Math.atan(k) * 180 / Math.PI);
        displays.angle.textContent = `${angleDeg}°`;
    }

    Object.values(sliders).forEach(slider => {
        slider.addEventListener('input', draw);
    });

    draw();
}

// =============================================
// INTERACTIVE PLAYGROUND
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

    // Points (in math coordinates)
    let pointA = { x: 2, y: 1 };
    let pointB = { x: 5, y: 4 };

    let dragging = null;
    let dragOffset = { x: 0, y: 0 };

    function draw() {
        // Clear
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);

        // Grid and axes
        drawGrid(ctx, width, height, centerX, centerY, scale);
        drawAxes(ctx, width, height, centerX, centerY, scale);

        // Calculate line parameters
        const dx = pointB.x - pointA.x;
        const dy = pointB.y - pointA.y;

        // Draw line
        if (dx !== 0 || dy !== 0) {
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#6366f1');
            gradient.addColorStop(1, '#a855f7');

            // Extend line
            const t1 = -20, t2 = 20;
            const lx1 = pointA.x + t1 * dx;
            const ly1 = pointA.y + t1 * dy;
            const lx2 = pointA.x + t2 * dx;
            const ly2 = pointA.y + t2 * dy;

            drawLine(
                ctx,
                toCanvasX(lx1, centerX, scale),
                toCanvasY(ly1, centerY, scale),
                toCanvasX(lx2, centerX, scale),
                toCanvasY(ly2, centerY, scale),
                gradient,
                4
            );
        }

        // Draw points
        const pax = toCanvasX(pointA.x, centerX, scale);
        const pay = toCanvasY(pointA.y, centerY, scale);
        const pbx = toCanvasX(pointB.x, centerX, scale);
        const pby = toCanvasY(pointB.y, centerY, scale);

        drawPoint(ctx, pax, pay, '#ef4444', 12, 'A');
        drawPoint(ctx, pbx, pby, '#3b82f6', 12, 'B');

        // Draw direction vector
        drawVector(ctx, pax, pay, pbx, pby, '#10b981');

        // Update equations
        updateEquations(pointA, pointB);
    }

    function updateEquations(a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;

        // Point coordinates
        document.getElementById('pointACoords').textContent = `[${a.x.toFixed(1)}, ${a.y.toFixed(1)}]`;
        document.getElementById('pointBCoords').textContent = `[${b.x.toFixed(1)}, ${b.y.toFixed(1)}]`;

        // Parametric
        const dxSign = dx >= 0 ? '+' : '';
        const dySign = dy >= 0 ? '+' : '';
        document.getElementById('playParamEq').innerHTML =
            `x = ${a.x.toFixed(1)} ${dxSign} t·${dx.toFixed(1)}<br>y = ${a.y.toFixed(1)} ${dySign} t·${dy.toFixed(1)}`;

        // General: dy*x - dx*y + (dx*a.y - dy*a.x) = 0
        const gA = dy;
        const gB = -dx;
        const gC = dx * a.y - dy * a.x;
        const gcSign = gC >= 0 ? '+' : '';
        document.getElementById('playGeneralEq').textContent =
            `${gA.toFixed(1)}x + ${gB.toFixed(1)}y ${gcSign} ${gC.toFixed(1)} = 0`;

        // Slope-intercept (if not vertical)
        if (dx !== 0) {
            const k = dy / dx;
            const q = a.y - k * a.x;
            const qSign = q >= 0 ? '+' : '';
            document.getElementById('playSlopeEq').textContent = `y = ${k.toFixed(2)}x ${qSign} ${q.toFixed(2)}`;
            document.getElementById('propSlope').textContent = `k = ${k.toFixed(2)}`;
            document.getElementById('propAngle').textContent = `${Math.round(Math.atan(k) * 180 / Math.PI)}°`;
        } else {
            document.getElementById('playSlopeEq').textContent = `x = ${a.x.toFixed(1)} (svislá)`;
            document.getElementById('propSlope').textContent = 'k = ∞';
            document.getElementById('propAngle').textContent = '90°';
        }

        // Properties
        document.getElementById('propDirection').innerHTML = `<span class="vec">s</span> = (${dx.toFixed(1)}, ${dy.toFixed(1)})`;
        document.getElementById('propNormal').innerHTML = `<span class="vec">n</span> = (${dy.toFixed(1)}, ${(-dx).toFixed(1)})`;
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

        if (isNearPoint(pos.x, pos.y, pointA)) {
            dragging = 'A';
        } else if (isNearPoint(pos.x, pos.y, pointB)) {
            dragging = 'B';
        }

        canvas.style.cursor = dragging ? 'grabbing' : 'crosshair';
    });

    canvas.addEventListener('mousemove', (e) => {
        const pos = getMousePos(e);

        if (dragging) {
            const mathX = toMathX(pos.x, centerX, scale);
            const mathY = toMathY(pos.y, centerY, scale);

            // Snap to grid (0.5 increments)
            const snappedX = Math.round(mathX * 2) / 2;
            const snappedY = Math.round(mathY * 2) / 2;

            if (dragging === 'A') {
                pointA.x = snappedX;
                pointA.y = snappedY;
            } else {
                pointB.x = snappedX;
                pointB.y = snappedY;
            }

            draw();
        } else {
            // Hover cursor change
            if (isNearPoint(pos.x, pos.y, pointA) || isNearPoint(pos.x, pos.y, pointB)) {
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
        canvas.style.cursor = 'crosshair';
    });

    // Reset button
    document.getElementById('resetPlayground')?.addEventListener('click', () => {
        pointA = { x: 2, y: 1 };
        pointB = { x: 5, y: 4 };
        draw();
    });

    // Random line button
    document.getElementById('randomLine')?.addEventListener('click', () => {
        pointA = {
            x: Math.round((Math.random() * 8 - 4) * 2) / 2,
            y: Math.round((Math.random() * 6 - 3) * 2) / 2
        };
        pointB = {
            x: Math.round((Math.random() * 8 - 4) * 2) / 2,
            y: Math.round((Math.random() * 6 - 3) * 2) / 2
        };
        // Ensure points are different
        if (pointA.x === pointB.x && pointA.y === pointB.y) {
            pointB.x += 1;
            pointB.y += 1;
        }
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

            // Disable further input
            options.forEach(opt => opt.disabled = true);
            btn.disabled = true;

            // Check answer
            const isCorrect = selectedOption.value === correctAnswer;

            // Style selected option
            selectedOption.parentElement.classList.add(isCorrect ? 'correct' : 'incorrect');

            // Show correct answer if wrong
            if (!isCorrect) {
                options.forEach(opt => {
                    if (opt.value === correctAnswer) {
                        opt.parentElement.classList.add('correct');
                    }
                });
            }

            // Update status
            status.textContent = isCorrect ? '✓ Správně' : '✗ Špatně';
            status.className = 'exercise-status ' + (isCorrect ? 'correct' : 'incorrect');

            // Show feedback
            feedback.textContent = isCorrect
                ? 'Výborně! Správná odpověď.'
                : 'Bohužel špatně. Správná odpověď je zvýrazněna.';
            feedback.className = 'exercise-feedback show ' + (isCorrect ? 'correct' : 'incorrect');

            // Check if all exercises completed
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
