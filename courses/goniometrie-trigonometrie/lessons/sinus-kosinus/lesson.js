/* Chapter 2: Sinus a kosinus jako funkce – Lesson JS */
document.addEventListener('DOMContentLoaded', () => {

    /* ======= SECTION REDRAW CALLBACKS ======= */
    const sectionDrawCallbacks = {}; // { sectionId: drawFunction }

    /* ======= SECTION NAVIGATION ======= */
    const sections = document.querySelectorAll('.lesson-section');
    const sidebarLinks = document.querySelectorAll('.sidebar-link[data-section]');
    const progressFill = document.querySelector('.progress-fill-small');

    function showSection(id) {
        sections.forEach(s => s.classList.remove('active'));
        sidebarLinks.forEach(l => l.classList.remove('active'));
        const sec = document.getElementById(id);
        if (sec) sec.classList.add('active');
        sidebarLinks.forEach(l => { if (l.dataset.section === id) l.classList.add('active'); });
        // progress
        const idx = Array.from(sections).findIndex(s => s.id === id);
        if (progressFill && sections.length) progressFill.style.width = ((idx + 1) / sections.length * 100) + '%';
        window.location.hash = id;
        // Notify canvas demos that a section became visible so they can redraw
        setTimeout(() => { if (sectionDrawCallbacks[id]) sectionDrawCallbacks[id](); }, 50);
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            showSection(link.dataset.section);
        });
    });

    // Handle initial hash
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(hash)) showSection(hash);

    /* ======= CANVAS HELPERS ======= */

    function setupHiDPI(canvas) {
        const dpr = window.devicePixelRatio || 1;
        // Use the parent container's width so the canvas adapts responsively
        const parent = canvas.parentElement;
        const parentW = parent ? Math.max(0, parent.clientWidth - 24) : 700; // 24 = 2×0.75rem padding
        const nomW = parseInt(canvas.getAttribute('width')) || 750;
        const nomH = parseInt(canvas.getAttribute('height')) || 350;
        const ratio = nomH / nomW;
        const w = Math.min(nomW, parentW);
        const h = Math.round(w * ratio);
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        return { ctx, w, h, dpr };
    }

    function clearCanvas(ctx, w, h) {
        ctx.clearRect(0, 0, w * 3, h * 3);
    }

    function isDark() {
        return document.documentElement.getAttribute('data-theme') !== 'light';
    }

    function getColors() {
        const d = isDark();
        return {
            bg: d ? '#0f172a' : '#f8fafc',
            bgGrad: d ? '#1e293b' : '#e2e8f0',
            grid: d ? 'rgba(148,163,184,0.08)' : 'rgba(100,116,139,0.1)',
            axis: d ? 'rgba(203,213,225,0.5)' : 'rgba(71,85,105,0.6)',
            axisLabel: d ? 'rgba(203,213,225,0.7)' : 'rgba(51,65,85,0.8)',
            sin: '#f87171',
            sinGlow: 'rgba(248,113,113,0.4)',
            cos: '#60a5fa',
            cosGlow: 'rgba(96,165,250,0.4)',
            accent: '#818cf8',
            accentGlow: 'rgba(129,140,248,0.4)',
            green: '#34d399',
            greenGlow: 'rgba(52,211,153,0.4)',
            yellow: '#fbbf24',
            yellowGlow: 'rgba(251,191,36,0.4)',
            text: d ? '#e2e8f0' : '#1e293b',
            textMuted: d ? 'rgba(203,213,225,0.6)' : 'rgba(71,85,105,0.6)',
            ref: d ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.15)',
        };
    }

    function fillBg(ctx, w, h) {
        const c = getColors();
        const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
        g.addColorStop(0, c.bgGrad);
        g.addColorStop(1, c.bg);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
    }

    // Draw a graph-style coordinate system
    // cx, cy = pixel center; scaleX, scaleY = pixels per unit
    function drawGraphAxes(ctx, cx, cy, scaleX, scaleY, w, h, c, opts) {
        opts = opts || {};
        const xMin = -cx / scaleX, xMax = (w - cx) / scaleX;
        const yMin = -(h - cy) / scaleY, yMax = cy / scaleY;

        // grid
        ctx.strokeStyle = c.grid;
        ctx.lineWidth = 1;
        // vertical grid at multiples of π/2
        const step = opts.xStep || (Math.PI / 2);
        for (let v = Math.ceil(xMin / step) * step; v <= xMax; v += step) {
            const px = cx + v * scaleX;
            ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, h); ctx.stroke();
        }
        // horizontal grid at 0.5
        const yStep = opts.yStep || 0.5;
        for (let v = Math.ceil(yMin / yStep) * yStep; v <= yMax; v += yStep) {
            const py = cy - v * scaleY;
            ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(w, py); ctx.stroke();
        }

        // axes
        ctx.strokeStyle = c.axis;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke(); // x-axis
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke(); // y-axis

        // x-axis labels (multiples of π/2)
        ctx.fillStyle = c.axisLabel;
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const piLabels = { '-2': '−2π', '-1.5': '−3π/2', '-1': '−π', '-0.5': '−π/2', '0.5': 'π/2', '1': 'π', '1.5': '3π/2', '2': '2π' };
        for (let v = Math.ceil(xMin / step) * step; v <= xMax; v += step) {
            if (Math.abs(v) < 0.01) continue;
            const key = (v / Math.PI).toFixed(1);
            const label = piLabels[key] || (v / Math.PI).toFixed(1) + 'π';
            const px = cx + v * scaleX;
            ctx.fillText(label, px, cy + 6);
        }

        // y-axis labels
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let v = Math.ceil(yMin); v <= yMax; v++) {
            if (v === 0) continue;
            const py = cy - v * scaleY;
            ctx.fillText(v.toString(), cx - 8, py);
        }
    }

    function drawSineCurve(ctx, cx, cy, scaleX, scaleY, w, color, glowColor, lw, fn) {
        fn = fn || Math.sin;
        ctx.save();
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = color;
        ctx.lineWidth = lw || 2.5;
        ctx.beginPath();
        for (let px = 0; px <= w; px++) {
            const x = (px - cx) / scaleX;
            const y = fn(x);
            const py = cy - y * scaleY;
            if (px === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.restore();
    }

    function drawDot(ctx, px, py, color, r, label, glowColor) {
        ctx.save();
        if (glowColor) { ctx.shadowColor = glowColor; ctx.shadowBlur = 12; }
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(px, py, r || 5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        if (label) {
            ctx.fillStyle = color;
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(label, px, py - r - 4);
        }
    }

    /* ======= SECTION 1: Unit circle → Graph tracer ======= */
    (function initTracerDemo() {
        const canvas = document.getElementById('tracerCanvas');
        if (!canvas) return;
        const slider = document.getElementById('tracerSlider');
        const angleSpan = document.getElementById('tracerAngleVal');
        const radSpan = document.getElementById('tracerRadVal');
        const showSin = document.getElementById('tracerShowSin');
        const showCos = document.getElementById('tracerShowCos');

        function draw() {
            const { ctx, w, h } = setupHiDPI(canvas);
            const c = getColors();
            clearCanvas(ctx, w, h);
            fillBg(ctx, w, h);

            const angle = parseFloat(slider.value);
            const rad = angle * Math.PI / 180;
            angleSpan.textContent = Math.round(angle);
            radSpan.textContent = rad.toFixed(2);

            // ===== KEY LAYOUT CONSTANT =====
            // Circle and graph share the SAME y-scale so connection lines are horizontal
            const yScale = Math.round(Math.min(h * 0.35, 110)); // px per unit (1 = radius)

            // ===== LEFT: Unit circle =====
            const circR = yScale;
            const circCx = circR + 30; // left padding + radius
            const circCy = Math.round(h / 2);

            // ===== RIGHT: Graph =====
            const graphLeft = circCx + circR + 50;
            const graphRight = w - 12;
            const graphW = graphRight - graphLeft;
            const graphCy = circCy; // SAME vertical center → horizontal lines work
            const graphScaleX = graphW / (4 * Math.PI);
            const graphScaleY = yScale;

            // ========== DRAW UNIT CIRCLE ==========
            // Glow outline
            ctx.save();
            ctx.shadowColor = c.accentGlow; ctx.shadowBlur = 12;
            ctx.strokeStyle = c.accent; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(circCx, circCy, circR, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();

            // Axes
            ctx.strokeStyle = c.axis; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(circCx - circR - 8, circCy); ctx.lineTo(circCx + circR + 8, circCy); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(circCx, circCy - circR - 8); ctx.lineTo(circCx, circCy + circR + 8); ctx.stroke();

            // Axis tick labels
            ctx.fillStyle = c.textMuted; ctx.font = '9px Inter, sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillText('1', circCx + circR, circCy + 5);
            ctx.fillText('−1', circCx - circR, circCy + 5);
            ctx.textBaseline = 'bottom';
            ctx.fillText('1', circCx - 10, circCy - circR - 1);
            ctx.fillText('−1', circCx - 10, circCy + circR + 10);

            // Point on the circle
            const sinVal = Math.sin(rad);
            const cosVal = Math.cos(rad);
            const cpx = circCx + circR * cosVal;
            const cpy = circCy - circR * sinVal;

            // Angle arc — show at most one revolution
            const arcAngle = Math.min(rad, 2 * Math.PI);
            if (arcAngle > 0.02) {
                ctx.save();
                ctx.strokeStyle = c.yellow; ctx.lineWidth = 2;
                const arcR2 = Math.min(circR * 0.25, 24);
                ctx.beginPath();
                ctx.arc(circCx, circCy, arcR2, 0, -arcAngle, true);
                ctx.stroke();
                // Label "x"
                if (arcAngle < Math.PI * 1.8) {
                    const midA = -arcAngle / 2;
                    ctx.fillStyle = c.yellow; ctx.font = 'bold 11px Inter, sans-serif';
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText('x', circCx + (arcR2 + 11) * Math.cos(midA), circCy + (arcR2 + 11) * Math.sin(midA));
                }
                ctx.restore();
            }

            // Radius line
            ctx.strokeStyle = c.text; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(circCx, circCy); ctx.lineTo(cpx, cpy); ctx.stroke();

            // ===== Projection segments =====
            if (showSin.checked && Math.abs(sinVal) > 0.015) {
                // sin: vertical bar from x-axis to point (red, thick, glowing)
                ctx.save();
                ctx.strokeStyle = c.sin; ctx.lineWidth = 3;
                ctx.shadowColor = c.sinGlow; ctx.shadowBlur = 6;
                ctx.beginPath(); ctx.moveTo(cpx, circCy); ctx.lineTo(cpx, cpy); ctx.stroke();
                ctx.restore();
            }
            if (showCos.checked && Math.abs(cosVal) > 0.015) {
                // cos: horizontal bar from origin to x-projection (blue, thick, glowing)
                ctx.save();
                ctx.strokeStyle = c.cos; ctx.lineWidth = 3;
                ctx.shadowColor = c.cosGlow; ctx.shadowBlur = 6;
                ctx.beginPath(); ctx.moveTo(circCx, circCy); ctx.lineTo(cpx, circCy); ctx.stroke();
                ctx.restore();
            }

            // The point itself
            drawDot(ctx, cpx, cpy, c.accent, 6, '', c.accentGlow);

            // Value readouts below circle
            ctx.font = 'bold 11px Inter, sans-serif'; ctx.textBaseline = 'top';
            const lblY = circCy + circR + 18;
            if (showSin.checked) {
                ctx.fillStyle = c.sin; ctx.textAlign = 'center';
                ctx.fillText('sin = ' + sinVal.toFixed(2), circCx - (showCos.checked ? 40 : 0), lblY);
            }
            if (showCos.checked) {
                ctx.fillStyle = c.cos; ctx.textAlign = 'center';
                ctx.fillText('cos = ' + cosVal.toFixed(2), circCx + (showSin.checked ? 42 : 0), lblY);
            }

            // ========== DRAW GRAPH ==========
            // x-axis
            ctx.strokeStyle = c.axis; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(graphLeft, graphCy); ctx.lineTo(graphRight, graphCy); ctx.stroke();

            // ±1 horizontals
            ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(graphLeft, graphCy - graphScaleY); ctx.lineTo(graphRight, graphCy - graphScaleY); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(graphLeft, graphCy + graphScaleY); ctx.lineTo(graphRight, graphCy + graphScaleY); ctx.stroke();

            // π gridlines
            ctx.fillStyle = c.axisLabel; ctx.font = '9px Inter, sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            const piL = ['0', 'π', '2π', '3π', '4π'];
            for (let i = 0; i <= 4; i++) {
                const gx = graphLeft + i * Math.PI * graphScaleX;
                if (gx > graphRight + 2) break;
                ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(gx, graphCy - graphScaleY - 3); ctx.lineTo(gx, graphCy + graphScaleY + 3); ctx.stroke();
                ctx.fillText(piL[i], gx, graphCy + graphScaleY + 5);
            }
            // y-axis labels
            ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
            ctx.fillText('1', graphLeft - 4, graphCy - graphScaleY);
            ctx.fillText('−1', graphLeft - 4, graphCy + graphScaleY);

            // Full faded curves (background, so graph is never empty)
            function drawFullFaded(fn, col) {
                ctx.save(); ctx.globalAlpha = 0.12;
                ctx.strokeStyle = col; ctx.lineWidth = 1.5;
                ctx.beginPath();
                for (let px = 0; px <= graphW; px += 2) {
                    const x = px / graphScaleX;
                    const gy = graphCy - fn(x) * graphScaleY;
                    px === 0 ? ctx.moveTo(graphLeft, gy) : ctx.lineTo(graphLeft + px, gy);
                }
                ctx.stroke(); ctx.restore();
            }
            if (showSin.checked) drawFullFaded(Math.sin, c.sin);
            if (showCos.checked) drawFullFaded(Math.cos, c.cos);

            // Traced (solid) portion up to current angle
            const maxPx = Math.min(rad, 4 * Math.PI) * graphScaleX;
            function drawTraced(fn, col, glow) {
                if (maxPx < 1) return;
                ctx.save();
                ctx.shadowColor = glow; ctx.shadowBlur = 6;
                ctx.strokeStyle = col; ctx.lineWidth = 2.5;
                ctx.beginPath();
                for (let px = 0; px <= maxPx; px += 1) {
                    const x = px / graphScaleX;
                    const gy = graphCy - fn(x) * graphScaleY;
                    px === 0 ? ctx.moveTo(graphLeft, gy) : ctx.lineTo(graphLeft + px, gy);
                }
                ctx.stroke(); ctx.restore();
            }
            if (showSin.checked) drawTraced(Math.sin, c.sin, c.sinGlow);
            if (showCos.checked) drawTraced(Math.cos, c.cos, c.cosGlow);

            // Current-angle dots + horizontal connection lines
            if (rad >= 0) {
                const dotGx = graphLeft + Math.min(rad, 4 * Math.PI) * graphScaleX;

                // Vertical marker at current x on graph
                ctx.save();
                ctx.setLineDash([3, 3]); ctx.strokeStyle = c.accent; ctx.lineWidth = 1; ctx.globalAlpha = 0.25;
                ctx.beginPath(); ctx.moveTo(dotGx, graphCy - graphScaleY - 3); ctx.lineTo(dotGx, graphCy + graphScaleY + 3); ctx.stroke();
                ctx.setLineDash([]); ctx.restore();

                if (showSin.checked) {
                    // Because yScale == circR == graphScaleY, the y-coordinates match perfectly!
                    const sinPy = graphCy - sinVal * graphScaleY; // = cpy!
                    drawDot(ctx, dotGx, sinPy, c.sin, 5, '', c.sinGlow);
                    // Horizontal connection from circle to graph (same y because scales match)
                    ctx.save();
                    ctx.setLineDash([3, 4]); ctx.strokeStyle = c.sin; ctx.lineWidth = 1; ctx.globalAlpha = 0.35;
                    ctx.beginPath(); ctx.moveTo(cpx, cpy); ctx.lineTo(dotGx, sinPy); ctx.stroke();
                    ctx.setLineDash([]); ctx.restore();
                }
                if (showCos.checked) {
                    const cosPy = graphCy - cosVal * graphScaleY;
                    drawDot(ctx, dotGx, cosPy, c.cos, 5, '', c.cosGlow);
                }
            }

            // Graph legend (top-right of graph)
            ctx.font = 'bold 10px Inter, sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'top';
            let ly = graphCy - graphScaleY - 18;
            if (showSin.checked) { ctx.fillStyle = c.sin; ctx.fillText('── sin x', graphRight, ly); ly += 14; }
            if (showCos.checked) { ctx.fillStyle = c.cos; ctx.fillText('── cos x', graphRight, ly); }
        }

        slider.addEventListener('input', draw);
        showSin.addEventListener('change', draw);
        showCos.addEventListener('change', draw);
        draw();
    })();

    /* ======= SECTION 2: Sin/Cos Graph Explorer ======= */
    (function initGraphDemo() {
        const canvas = document.getElementById('graphCanvas');
        if (!canvas) return;
        const slider = document.getElementById('graphSlider');
        const xValSpan = document.getElementById('graphXVal');
        const sinValSpan = document.getElementById('graphSinVal');
        const cosValSpan = document.getElementById('graphCosVal');
        const showSin = document.getElementById('graphShowSin');
        const showCos = document.getElementById('graphShowCos');

        function draw() {
            const { ctx, w, h } = setupHiDPI(canvas);
            const c = getColors();
            clearCanvas(ctx, w, h);
            fillBg(ctx, w, h);

            const xVal = parseFloat(slider.value) / 100; // range is -628 to 628 → -6.28 to 6.28
            const cx = w / 2, cy = h / 2;
            const scaleX = (w - 80) / (4 * Math.PI);
            const scaleY = (h - 100) / 2.4;

            drawGraphAxes(ctx, cx, cy, scaleX, scaleY, w, h, c);

            // Draw curves
            if (showSin.checked) drawSineCurve(ctx, cx, cy, scaleX, scaleY, w, c.sin, c.sinGlow, 2.5, Math.sin);
            if (showCos.checked) drawSineCurve(ctx, cx, cy, scaleX, scaleY, w, c.cos, c.cosGlow, 2.5, Math.cos);

            // Vertical line at x
            const xPx = cx + xVal * scaleX;
            ctx.save();
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = c.accent;
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(xPx, 0); ctx.lineTo(xPx, h); ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            // Points on curves
            if (showSin.checked) {
                const sy = cy - Math.sin(xVal) * scaleY;
                drawDot(ctx, xPx, sy, c.sin, 6, 'sin', c.sinGlow);
            }
            if (showCos.checked) {
                const cy2 = cy - Math.cos(xVal) * scaleY;
                drawDot(ctx, xPx, cy2, c.cos, 6, 'cos', c.cosGlow);
            }

            // Update displays
            const piStr = (xVal / Math.PI).toFixed(2) + 'π';
            xValSpan.textContent = xVal.toFixed(2) + ' ≈ ' + piStr;
            sinValSpan.textContent = Math.sin(xVal).toFixed(3);
            cosValSpan.textContent = Math.cos(xVal).toFixed(3);

            // Legend
            ctx.font = 'bold 12px Inter'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
            let ly = 12;
            if (showSin.checked) { ctx.fillStyle = c.sin; ctx.fillText('── sin x', 12, ly); ly += 18; }
            if (showCos.checked) { ctx.fillStyle = c.cos; ctx.fillText('── cos x', 12, ly); }
        }

        slider.addEventListener('input', draw);
        showSin.addEventListener('change', draw);
        showCos.addEventListener('change', draw);
        // Redraw when section becomes visible (canvas needs non-zero dimensions)
        sectionDrawCallbacks['graphs'] = draw;
        window.addEventListener('resize', draw);
        draw();
    })();

    /* ======= SECTION 3: Transformations ======= */
    (function initTransformDemo() {
        const canvas = document.getElementById('transformCanvas');
        if (!canvas) return;
        const ampSlider = document.getElementById('ampSlider');
        const omegaSlider = document.getElementById('omegaSlider');
        const phiSlider = document.getElementById('phiSlider');
        const shiftSlider = document.getElementById('shiftSlider');
        const ampVal = document.getElementById('ampVal');
        const omegaVal = document.getElementById('omegaVal');
        const phiVal = document.getElementById('phiVal');
        const shiftVal = document.getElementById('shiftVal');
        const eqDisplay = document.getElementById('transformEq');
        const calcAmp = document.getElementById('calcAmp');
        const calcPeriod = document.getElementById('calcPeriod');
        const calcPhase = document.getElementById('calcPhase');
        const calcShift = document.getElementById('calcShift');

        function draw() {
            const { ctx, w, h } = setupHiDPI(canvas);
            const c = getColors();
            clearCanvas(ctx, w, h);
            fillBg(ctx, w, h);

            const A = parseFloat(ampSlider.value) / 10;
            const omega = parseFloat(omegaSlider.value) / 10;
            const phi = parseFloat(phiSlider.value) / 100;
            const k = parseFloat(shiftSlider.value) / 10;

            ampVal.textContent = A.toFixed(1);
            omegaVal.textContent = omega.toFixed(1);
            phiVal.textContent = phi.toFixed(2);
            shiftVal.textContent = k.toFixed(1);

            // Equation display
            const aStr = A < 0 ? `(${A.toFixed(1)})` : A.toFixed(1);
            const phiStr = phi >= 0 ? `+ ${phi.toFixed(2)}` : `− ${Math.abs(phi).toFixed(2)}`;
            const kStr = k >= 0 ? `+ ${k.toFixed(1)}` : `− ${Math.abs(k).toFixed(1)}`;
            eqDisplay.textContent = `y = ${aStr} · sin(${omega.toFixed(1)} · x ${phiStr}) ${kStr}`;

            // Calc display
            calcAmp.textContent = Math.abs(A).toFixed(1);
            calcPeriod.textContent = omega !== 0 ? (2 * Math.PI / Math.abs(omega)).toFixed(3) : '∞';
            calcPhase.textContent = omega !== 0 ? (-phi / omega).toFixed(3) : '—';
            calcShift.textContent = k.toFixed(1);

            const cx = w / 2, cy = h / 2;
            const scaleX = (w - 80) / (4 * Math.PI);
            const maxAmp = Math.max(Math.abs(A) + Math.abs(k), 1.5);
            const scaleY = (h - 60) / (2 * maxAmp);

            drawGraphAxes(ctx, cx, cy, scaleX, scaleY, w, h, c);

            // Reference: basic sin x (faded)
            ctx.save();
            ctx.globalAlpha = 0.2;
            drawSineCurve(ctx, cx, cy, scaleX, scaleY, w, c.sin, 'transparent', 1.5, Math.sin);
            ctx.restore();

            // Transformed curve
            const fn = x => A * Math.sin(omega * x + phi) + k;
            drawSineCurve(ctx, cx, cy, scaleX, scaleY, w, c.green, c.greenGlow, 3, fn);

            // Vertical shift line
            if (Math.abs(k) > 0.05) {
                ctx.save();
                ctx.setLineDash([5, 5]);
                ctx.strokeStyle = c.yellow;
                ctx.lineWidth = 1;
                const ky = cy - k * scaleY;
                ctx.beginPath(); ctx.moveTo(0, ky); ctx.lineTo(w, ky); ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = c.yellow;
                ctx.font = '11px Inter'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
                ctx.fillText('k = ' + k.toFixed(1), 8, ky - 4);
                ctx.restore();
            }

            // Amplitude markers
            if (Math.abs(A) > 0.05) {
                const topY = cy - (k + Math.abs(A)) * scaleY;
                const botY = cy - (k - Math.abs(A)) * scaleY;
                ctx.save();
                ctx.setLineDash([3, 3]);
                ctx.strokeStyle = c.accent;
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(0, topY); ctx.lineTo(w, topY); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, botY); ctx.lineTo(w, botY); ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
            }

            // Legend
            ctx.font = 'bold 11px Inter'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
            ctx.fillStyle = 'rgba(148,163,184,0.4)'; ctx.fillText('── sin x (referenční)', 8, 8);
            ctx.fillStyle = c.green; ctx.fillText('── transformovaný', 8, 24);
        }

        [ampSlider, omegaSlider, phiSlider, shiftSlider].forEach(s => s.addEventListener('input', draw));
        sectionDrawCallbacks['transforms'] = draw;
        window.addEventListener('resize', draw);

        // Presets
        const presets = {
            'default': { a: 10, o: 10, p: 0, k: 0 },
            'double-amp': { a: 20, o: 10, p: 0, k: 0 },
            'half-period': { a: 10, o: 20, p: 0, k: 0 },
            'phase-shift': { a: 10, o: 10, p: 157, k: 0 },  // π/2
            'cosine': { a: 10, o: 10, p: 157, k: 0 },   // cos = sin(x + π/2)
            'shifted-up': { a: 10, o: 10, p: 0, k: 10 },
        };
        document.querySelectorAll('.preset-btn[data-preset]').forEach(btn => {
            btn.addEventListener('click', () => {
                const p = presets[btn.dataset.preset];
                if (!p) return;
                ampSlider.value = p.a; omegaSlider.value = p.o; phiSlider.value = p.p; shiftSlider.value = p.k;
                draw();
            });
        });

        draw();
    })();

    /* ======= SECTION 4: Properties Explorer ======= */
    (function initPropsDemo() {
        const canvas = document.getElementById('propsCanvas');
        if (!canvas) return;
        const cbZeros = document.getElementById('propZeros');
        const cbExtrema = document.getElementById('propExtrema');
        const cbPeriod = document.getElementById('propPeriod');
        const cbMonotone = document.getElementById('propMonotone');
        const cbParity = document.getElementById('propParity');
        const cbSin = document.getElementById('propFuncSin');
        const cbCos = document.getElementById('propFuncCos');

        function draw() {
            const { ctx, w, h } = setupHiDPI(canvas);
            const c = getColors();
            clearCanvas(ctx, w, h);
            fillBg(ctx, w, h);

            const cx = w / 2, cy = h / 2;
            const scaleX = (w - 80) / (4 * Math.PI);
            const scaleY = (h - 100) / 2.4;

            drawGraphAxes(ctx, cx, cy, scaleX, scaleY, w, h, c);

            const doSin = cbSin.checked, doCos = cbCos.checked;

            // Draw curves
            if (doSin) drawSineCurve(ctx, cx, cy, scaleX, scaleY, w, c.sin, c.sinGlow, 2.5, Math.sin);
            if (doCos) drawSineCurve(ctx, cx, cy, scaleX, scaleY, w, c.cos, c.cosGlow, 2.5, Math.cos);

            const xMin = -2 * Math.PI, xMax = 2 * Math.PI;

            // Zeros
            if (cbZeros.checked) {
                if (doSin) {
                    for (let k = -2; k <= 2; k++) {
                        const xz = k * Math.PI;
                        const px = cx + xz * scaleX;
                        drawDot(ctx, px, cy, c.sin, 5, '', c.sinGlow);
                    }
                }
                if (doCos) {
                    for (let k = -2; k <= 1; k++) {
                        const xz = Math.PI / 2 + k * Math.PI;
                        const px = cx + xz * scaleX;
                        drawDot(ctx, px, cy, c.cos, 5, '', c.cosGlow);
                    }
                }
            }

            // Extrema
            if (cbExtrema.checked) {
                if (doSin) {
                    // max at π/2 + 2kπ, min at -π/2 + 2kπ
                    for (let k = -1; k <= 1; k++) {
                        const xMax2 = Math.PI / 2 + 2 * k * Math.PI;
                        const xMin2 = -Math.PI / 2 + 2 * k * Math.PI;
                        if (xMax2 >= xMin && xMax2 <= xMax) {
                            drawDot(ctx, cx + xMax2 * scaleX, cy - scaleY, c.yellow, 6, 'max', c.yellowGlow);
                        }
                        if (xMin2 >= xMin && xMin2 <= xMax) {
                            drawDot(ctx, cx + xMin2 * scaleX, cy + scaleY, c.yellow, 6, 'min', c.yellowGlow);
                        }
                    }
                }
                if (doCos) {
                    for (let k = -1; k <= 1; k++) {
                        const xMax2 = 2 * k * Math.PI;
                        const xMin2 = Math.PI + 2 * k * Math.PI;
                        if (xMax2 >= xMin && xMax2 <= xMax) {
                            drawDot(ctx, cx + xMax2 * scaleX, cy - scaleY, '#fbbf24', 6, 'max', c.yellowGlow);
                        }
                        if (xMin2 >= xMin && xMin2 <= xMax) {
                            drawDot(ctx, cx + xMin2 * scaleX, cy + scaleY, '#fbbf24', 6, 'min', c.yellowGlow);
                        }
                    }
                }
            }

            // Period
            if (cbPeriod.checked) {
                // Highlight one period with a shaded region
                ctx.save();
                ctx.fillStyle = 'rgba(99, 102, 241, 0.08)';
                const pLeft = cx; // x = 0
                const pRight = cx + 2 * Math.PI * scaleX; // x = 2π
                ctx.fillRect(pLeft, 0, pRight - pLeft, h);
                // arrows
                ctx.strokeStyle = c.accent;
                ctx.lineWidth = 2;
                const arrowY = cy + scaleY + 25;
                ctx.beginPath(); ctx.moveTo(pLeft, arrowY); ctx.lineTo(pRight, arrowY); ctx.stroke();
                // arrow heads
                ctx.beginPath(); ctx.moveTo(pLeft, arrowY); ctx.lineTo(pLeft + 8, arrowY - 4); ctx.lineTo(pLeft + 8, arrowY + 4); ctx.closePath(); ctx.fillStyle = c.accent; ctx.fill();
                ctx.beginPath(); ctx.moveTo(pRight, arrowY); ctx.lineTo(pRight - 8, arrowY - 4); ctx.lineTo(pRight - 8, arrowY + 4); ctx.closePath(); ctx.fill();
                ctx.fillStyle = c.accent; ctx.font = 'bold 12px Inter'; ctx.textAlign = 'center';
                ctx.fillText('T = 2π', (pLeft + pRight) / 2, arrowY - 8);
                ctx.restore();
            }

            // Monotonicity
            if (cbMonotone.checked && doSin) {
                // Increasing: (-π/2, π/2) — green zone
                // Decreasing: (π/2, 3π/2) — red zone
                ctx.save();
                ctx.globalAlpha = 0.08;
                // increasing
                const incLeft = cx + (-Math.PI / 2) * scaleX;
                const incRight = cx + (Math.PI / 2) * scaleX;
                ctx.fillStyle = '#10b981';
                ctx.fillRect(incLeft, 0, incRight - incLeft, h);
                // decreasing
                const decLeft = cx + (Math.PI / 2) * scaleX;
                const decRight = cx + (3 * Math.PI / 2) * scaleX;
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(decLeft, 0, decRight - decLeft, h);
                ctx.restore();
                // Labels
                ctx.font = 'bold 11px Inter'; ctx.textBaseline = 'top';
                ctx.fillStyle = '#10b981'; ctx.textAlign = 'center';
                ctx.fillText('↗ rostoucí', (incLeft + incRight) / 2, 8);
                ctx.fillStyle = '#ef4444';
                ctx.fillText('↘ klesající', (decLeft + decRight) / 2, 8);
            }

            // Parity
            if (cbParity.checked) {
                if (doSin) {
                    // Odd: rotate 180° around origin — show a point and its mirror
                    const px1 = Math.PI / 3;
                    const sinPx = cx + px1 * scaleX, sinPy = cy - Math.sin(px1) * scaleY;
                    const sinMx = cx - px1 * scaleX, sinMy = cy + Math.sin(px1) * scaleY;
                    drawDot(ctx, sinPx, sinPy, c.sin, 6, '', c.sinGlow);
                    drawDot(ctx, sinMx, sinMy, c.sin, 6, '', c.sinGlow);
                    ctx.save();
                    ctx.setLineDash([3, 3]); ctx.strokeStyle = c.sin; ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(sinPx, sinPy); ctx.lineTo(sinMx, sinMy); ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.fillStyle = c.sin; ctx.font = '10px Inter'; ctx.textAlign = 'right';
                    ctx.fillText('sin(−x) = −sin(x)', sinMx - 4, sinMy - 4);
                    ctx.restore();
                }
                if (doCos) {
                    // Even: reflect in y-axis
                    const px1 = Math.PI / 3;
                    const cosPx = cx + px1 * scaleX, cosPy = cy - Math.cos(px1) * scaleY;
                    const cosMx = cx - px1 * scaleX, cosMy = cy - Math.cos(px1) * scaleY; // same y!
                    drawDot(ctx, cosPx, cosPy, c.cos, 6, '', c.cosGlow);
                    drawDot(ctx, cosMx, cosMy, c.cos, 6, '', c.cosGlow);
                    ctx.save();
                    ctx.setLineDash([3, 3]); ctx.strokeStyle = c.cos; ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(cosPx, cosPy); ctx.lineTo(cosMx, cosMy); ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.fillStyle = c.cos; ctx.font = '10px Inter'; ctx.textAlign = 'left';
                    ctx.fillText('cos(−x) = cos(x)', cosMx + 4, cosMy + 14);
                    ctx.restore();
                }
            }
        }

        [cbZeros, cbExtrema, cbPeriod, cbMonotone, cbParity, cbSin, cbCos].forEach(el => el.addEventListener('change', draw));
        sectionDrawCallbacks['properties'] = draw;
        window.addEventListener('resize', draw);
        draw();
    })();

    /* ======= SECTION 5: Flashcards & Quiz ======= */
    (function initValuesSection() {
        // Flashcards
        const grid = document.getElementById('flashcardGrid');
        if (!grid) return;

        const cards = [
            { q: 'sin 0°', a: '0' },
            { q: 'sin 30°', a: '1/2' },
            { q: 'sin 45°', a: '√2/2' },
            { q: 'sin 60°', a: '√3/2' },
            { q: 'sin 90°', a: '1' },
            { q: 'cos 0°', a: '1' },
            { q: 'cos 30°', a: '√3/2' },
            { q: 'cos 45°', a: '√2/2' },
            { q: 'cos 60°', a: '1/2' },
            { q: 'cos 90°', a: '0' },
        ];

        function renderCards() {
            grid.innerHTML = '';
            cards.forEach((card, i) => {
                const div = document.createElement('div');
                div.className = 'flashcard';
                div.innerHTML = `<div class="fc-question">${card.q}</div><div class="fc-answer">${card.a}</div>`;
                div.addEventListener('click', () => div.classList.toggle('revealed'));
                grid.appendChild(div);
            });
        }
        renderCards();

        document.getElementById('resetCards').addEventListener('click', () => {
            // Shuffle
            for (let i = cards.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [cards[i], cards[j]] = [cards[j], cards[i]];
            }
            renderCards();
        });

        // Quiz
        const quizQ = document.getElementById('quizQuestion');
        const quizOpts = document.getElementById('quizOptions');
        const quizScore = document.getElementById('quizScore');
        const quizNext = document.getElementById('quizNext');
        let score = 0, total = 0;

        const quizData = [
            { q: 'sin 0°', a: '0', opts: ['0', '1', '1/2', '√2/2'] },
            { q: 'sin 30°', a: '1/2', opts: ['√3/2', '1/2', '0', '√2/2'] },
            { q: 'sin 45°', a: '√2/2', opts: ['1/2', '1', '√2/2', '√3/2'] },
            { q: 'sin 60°', a: '√3/2', opts: ['√3/2', '√2/2', '1', '1/2'] },
            { q: 'sin 90°', a: '1', opts: ['0', '1/2', '√2/2', '1'] },
            { q: 'cos 0°', a: '1', opts: ['0', '1', '1/2', '√3/2'] },
            { q: 'cos 30°', a: '√3/2', opts: ['1/2', '√2/2', '√3/2', '1'] },
            { q: 'cos 45°', a: '√2/2', opts: ['0', '√2/2', '1/2', '√3/2'] },
            { q: 'cos 60°', a: '1/2', opts: ['1/2', '√3/2', '√2/2', '0'] },
            { q: 'cos 90°', a: '0', opts: ['1', '1/2', '√2/2', '0'] },
            { q: 'sin 180°', a: '0', opts: ['0', '−1', '1', '1/2'] },
            { q: 'cos 180°', a: '−1', opts: ['0', '1', '−1', '1/2'] },
            { q: 'sin 270°', a: '−1', opts: ['0', '1', '−1', '−1/2'] },
            { q: 'cos 270°', a: '0', opts: ['−1', '0', '1', '1/2'] },
            { q: 'sin 360°', a: '0', opts: ['1', '0', '−1', '1/2'] },
            { q: 'cos 360°', a: '1', opts: ['0', '1', '−1', '1/2'] },
        ];

        function newQuestion() {
            const q = quizData[Math.floor(Math.random() * quizData.length)];
            quizQ.textContent = q.q + ' = ?';
            quizOpts.innerHTML = '';
            // Shuffle options
            const opts = [...q.opts].sort(() => Math.random() - 0.5);
            opts.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'quiz-option';
                btn.textContent = opt;
                btn.addEventListener('click', () => {
                    if (btn.classList.contains('correct-answer') || btn.classList.contains('wrong-answer')) return;
                    total++;
                    if (opt === q.a) {
                        score++;
                        btn.classList.add('correct-answer');
                    } else {
                        btn.classList.add('wrong-answer');
                        // Highlight correct
                        quizOpts.querySelectorAll('.quiz-option').forEach(b => {
                            if (b.textContent === q.a) b.classList.add('correct-answer');
                        });
                    }
                    quizScore.textContent = `Skóre: ${score}/${total}`;
                });
                quizOpts.appendChild(btn);
            });
        }

        quizNext.addEventListener('click', newQuestion);
        newQuestion();
    })();

    /* ======= SECTION 6: Playground ======= */
    (function initPlayground() {
        const canvas = document.getElementById('playgroundCanvas');
        if (!canvas) return;
        const angleSlider = document.getElementById('pgAngleSlider');
        const ampSlider = document.getElementById('pgAmpSlider');
        const omegaSlider = document.getElementById('pgOmegaSlider');
        const shiftSlider = document.getElementById('pgShiftSlider');
        const angleVal = document.getElementById('pgAngleVal');
        const ampVal = document.getElementById('pgAmpVal');
        const omegaVal = document.getElementById('pgOmegaVal');
        const shiftVal = document.getElementById('pgShiftVal');

        function draw() {
            const { ctx, w, h } = setupHiDPI(canvas);
            const c = getColors();
            clearCanvas(ctx, w, h);
            fillBg(ctx, w, h);

            const angle = parseFloat(angleSlider.value);
            const A = parseFloat(ampSlider.value) / 10;
            const omega = parseFloat(omegaSlider.value) / 10;
            const k = parseFloat(shiftSlider.value) / 10;

            angleVal.textContent = angle;
            ampVal.textContent = A.toFixed(1);
            omegaVal.textContent = omega.toFixed(1);
            shiftVal.textContent = k.toFixed(1);

            const rad = angle * Math.PI / 180;

            // Layout: unit circle left, graph right
            const circR = Math.min(h * 0.35, 130);
            const circCx = circR + 40, circCy = h / 2;

            // Graph area
            const graphLeft = circCx + circR + 50;
            const graphRight = w - 20;
            const graphW = graphRight - graphLeft;
            const graphCy = h / 2;
            const graphScaleX = graphW / (4 * Math.PI);
            const maxAmp = Math.max(Math.abs(A) + Math.abs(k), 1.5);
            const graphScaleY = (h - 60) / (2 * maxAmp);

            // --- Unit Circle ---
            ctx.save();
            ctx.shadowColor = c.accentGlow; ctx.shadowBlur = 10;
            ctx.strokeStyle = c.accent; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(circCx, circCy, circR, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();

            // circle axes
            ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(circCx - circR - 8, circCy); ctx.lineTo(circCx + circR + 8, circCy); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(circCx, circCy - circR - 8); ctx.lineTo(circCx, circCy + circR + 8); ctx.stroke();

            // Point on circle
            const cpx = circCx + circR * Math.cos(rad);
            const cpy = circCy - circR * Math.sin(rad);

            // Angle arc
            ctx.strokeStyle = c.yellow; ctx.lineWidth = 2;
            const arcR = Math.min(circR * 0.25, 20);
            ctx.beginPath(); ctx.arc(circCx, circCy, arcR, 0, -rad, rad > 0); ctx.stroke();

            // Radius
            ctx.strokeStyle = 'rgba(203,213,225,0.6)'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(circCx, circCy); ctx.lineTo(cpx, cpy); ctx.stroke();

            // Projections
            ctx.save();
            ctx.setLineDash([3, 3]);
            ctx.strokeStyle = c.sin; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(cpx, cpy); ctx.lineTo(cpx, circCy); ctx.stroke();
            ctx.strokeStyle = c.cos;
            ctx.beginPath(); ctx.moveTo(cpx, cpy); ctx.lineTo(circCx, cpy); ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            drawDot(ctx, cpx, cpy, c.accent, 6, '', c.accentGlow);

            // Circle labels
            ctx.fillStyle = c.sin; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'left';
            ctx.fillText('sin=' + Math.sin(rad).toFixed(2), circCx - circR, circCy + circR + 14);
            ctx.fillStyle = c.cos;
            ctx.fillText('cos=' + Math.cos(rad).toFixed(2), circCx - circR, circCy + circR + 28);

            // --- Graph ---
            // axes
            ctx.strokeStyle = c.axis; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(graphLeft, graphCy); ctx.lineTo(graphRight, graphCy); ctx.stroke();

            // grid lines
            ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
            for (let i = 0; i <= 4; i++) {
                const gx = graphLeft + i * Math.PI * graphScaleX;
                ctx.beginPath(); ctx.moveTo(gx, graphCy - graphScaleY * maxAmp); ctx.lineTo(gx, graphCy + graphScaleY * maxAmp); ctx.stroke();
            }
            // y lines at ±1, ±A, k
            [-1, 1].forEach(v => {
                const gy = graphCy - v * graphScaleY;
                ctx.beginPath(); ctx.moveTo(graphLeft, gy); ctx.lineTo(graphRight, gy); ctx.stroke();
            });

            // x labels
            ctx.fillStyle = c.axisLabel; ctx.font = '10px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ['0', 'π', '2π', '3π', '4π'].forEach((l, i) => {
                ctx.fillText(l, graphLeft + i * Math.PI * graphScaleX, graphCy + 4);
            });

            // Reference sin x (faded)
            ctx.save(); ctx.globalAlpha = 0.15;
            ctx.strokeStyle = c.sin; ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let px = graphLeft; px <= graphRight; px++) {
                const x = (px - graphLeft) / graphScaleX;
                const y = Math.sin(x);
                const gy = graphCy - y * graphScaleY;
                if (px === graphLeft) ctx.moveTo(px, gy); else ctx.lineTo(px, gy);
            }
            ctx.stroke();
            ctx.restore();

            // Transformed curve
            ctx.save();
            ctx.shadowColor = c.greenGlow; ctx.shadowBlur = 8;
            ctx.strokeStyle = c.green; ctx.lineWidth = 2.5;
            ctx.beginPath();
            for (let px = graphLeft; px <= graphRight; px++) {
                const x = (px - graphLeft) / graphScaleX;
                const y = A * Math.sin(omega * x) + k;
                const gy = graphCy - y * graphScaleY;
                if (px === graphLeft) ctx.moveTo(px, gy); else ctx.lineTo(px, gy);
            }
            ctx.stroke();
            ctx.restore();

            // Current angle marker on graph
            if (rad >= 0 && rad <= 4 * Math.PI) {
                const dotX = graphLeft + rad * graphScaleX;
                const dotY = graphCy - (A * Math.sin(omega * rad) + k) * graphScaleY;
                drawDot(ctx, dotX, dotY, c.green, 6, '', c.greenGlow);

                // Vertical line
                ctx.save();
                ctx.setLineDash([3, 3]); ctx.strokeStyle = c.accent; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(dotX, graphCy - graphScaleY * maxAmp); ctx.lineTo(dotX, graphCy + graphScaleY * maxAmp); ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
            }
        }

        [angleSlider, ampSlider, omegaSlider, shiftSlider].forEach(s => s.addEventListener('input', draw));
        sectionDrawCallbacks['playground'] = draw;
        window.addEventListener('resize', draw);
        draw();
    })();

    /* ======= EXERCISES ======= */
    window.checkExercise = function (exId, correct) {
        const ex = document.getElementById(exId);
        if (!ex) return;
        const selected = ex.querySelector(`input[name="${exId}"]:checked`);
        const feedback = document.getElementById(exId + 'Feedback');
        const status = document.getElementById(exId + 'Status');
        if (!selected) {
            feedback.textContent = 'Vyberte odpověď.';
            feedback.className = 'exercise-feedback show incorrect';
            return;
        }
        const val = selected.value;
        const options = ex.querySelectorAll('.option');
        options.forEach(opt => {
            const radio = opt.querySelector('input[type="radio"]');
            if (radio.value === correct) opt.classList.add('correct');
            else if (radio.checked) opt.classList.add('incorrect');
        });
        if (val === correct) {
            feedback.textContent = '✅ Správně!';
            feedback.className = 'exercise-feedback show correct';
            if (status) status.textContent = '✅';
        } else {
            const explanations = {
                ex1: 'Perioda funkce sin x je 2π, protože sin(x + 2π) = sin x.',
                ex2: 'Kosinus je sudá funkce, protože cos(−x) = cos x.',
                ex3: 'Perioda y = sin(2x) je 2π/|ω| = 2π/2 = π.',
                ex4: 'sin 30° = 1/2 (z tabulky základních hodnot).',
                ex5: 'V y = 3sin(x) + 2 je A = 3 (amplituda) a k = 2 (vertikální posun).',
            };
            feedback.textContent = '❌ Špatně. ' + (explanations[exId] || '');
            feedback.className = 'exercise-feedback show incorrect';
            if (status) status.textContent = '❌';
        }

        // Check if all exercises are done
        const allDone = ['ex1', 'ex2', 'ex3', 'ex4', 'ex5'].every(id => {
            const fb = document.getElementById(id + 'Feedback');
            return fb && fb.classList.contains('show');
        });
        if (allDone) {
            const complete = document.getElementById('lessonComplete');
            if (complete) complete.style.display = 'block';
        }
    };

}); // end DOMContentLoaded
