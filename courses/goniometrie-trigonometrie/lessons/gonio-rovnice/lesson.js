/* Chapter 5: Goniometrické výrazy a rovnice */
document.addEventListener('DOMContentLoaded', function () {

    /* ======= NAVIGATION ======= */
    const sections = document.querySelectorAll('.lesson-section');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const progressFill = document.querySelector('.progress-fill-small');
    const visited = new Set();

    function showSection(id) {
        sections.forEach(s => s.classList.toggle('active', s.id === id));
        sidebarLinks.forEach(l => {
            if (l.dataset.section) l.classList.toggle('active', l.dataset.section === id);
        });
        visited.add(id);
        if (progressFill) progressFill.style.width = Math.round(visited.size / sections.length * 100) + '%';
        document.querySelector('.lesson-content').scrollTo({ top: 0, behavior: 'smooth' });
        drawChartsForSection(id);
    }

    sidebarLinks.forEach(l => {
        if (l.dataset.section) l.addEventListener('click', e => { e.preventDefault(); showSection(l.dataset.section); });
    });

    if (location.hash) { const id = location.hash.slice(1); if (document.getElementById(id)) showSection(id); }

    /* ======= COLLAPSIBLE SOLUTIONS ======= */
    document.querySelectorAll('.solution-toggle').forEach(btn => {
        btn.addEventListener('click', function () {
            const wrapper = this.closest('.example-card');
            const steps = wrapper.querySelector('.solution-steps');
            const isOpen = steps.classList.contains('open');
            steps.classList.toggle('open');
            this.textContent = isOpen ? '👁 Zobrazit řešení' : '🔽 Skrýt řešení';
        });
    });

    /* ======= EXERCISES ======= */
    window.checkExercise = function (id, correct) {
        const chosen = document.querySelector('input[name="' + id + '"]:checked');
        const fb = document.getElementById(id + 'Feedback');
        const st = document.getElementById(id + 'Status');
        if (!chosen) { fb.textContent = 'Vyberte odpověď.'; fb.className = 'exercise-feedback wrong'; return; }
        if (chosen.value === correct) {
            fb.textContent = '✅ Správně!'; fb.className = 'exercise-feedback correct'; st.textContent = '✅';
        } else {
            fb.textContent = '❌ Špatně, zkuste to znovu.'; fb.className = 'exercise-feedback wrong'; st.textContent = '❌';
        }
    };

    /* ======= CANVAS HELPERS ======= */
    function setupHiDPI(canvas) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const w = rect.width, h = rect.height;
        canvas.width = w * dpr; canvas.height = h * dpr;
        canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        return { ctx, w, h };
    }

    const C = {
        axis: 'rgba(203,213,225,0.4)', axisLabel: 'rgba(203,213,225,0.65)',
        grid: 'rgba(148,163,184,0.06)', text: '#e2e8f0',
        sin: '#f87171', cos: '#60a5fa', tan: '#fb923c',
        green: '#34d399', accent: '#818cf8',
        sinGlow: 'rgba(248,113,113,0.35)', cosGlow: 'rgba(96,165,250,0.35)',
        tanGlow: 'rgba(251,146,60,0.35)', greenGlow: 'rgba(52,211,153,0.35)',
        accentGlow: 'rgba(129,140,248,0.35)'
    };

    function drawAxes(ctx, ox, oy, w, h, xMin, xMax, yMin, yMax) {
        ctx.strokeStyle = C.axis; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(w, oy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, h); ctx.stroke();
        // Arrow tips
        ctx.fillStyle = C.axis;
        ctx.beginPath(); ctx.moveTo(w - 1, oy); ctx.lineTo(w - 7, oy - 3); ctx.lineTo(w - 7, oy + 3); ctx.fill();
        ctx.beginPath(); ctx.moveTo(ox, 1); ctx.lineTo(ox - 3, 7); ctx.lineTo(ox + 3, 7); ctx.fill();
    }

    function toPixel(x, y, ox, oy, sx, sy) {
        return [ox + x * sx, oy - y * sy];
    }

    function drawGrid(ctx, ox, oy, w, h, sx, sy, xStep, yStep) {
        ctx.strokeStyle = C.grid; ctx.lineWidth = 0.5;
        for (let x = xStep; ox + x * sx < w; x += xStep) {
            ctx.beginPath(); ctx.moveTo(ox + x * sx, 0); ctx.lineTo(ox + x * sx, h); ctx.stroke();
        }
        for (let x = -xStep; ox + x * sx > 0; x -= xStep) {
            ctx.beginPath(); ctx.moveTo(ox + x * sx, 0); ctx.lineTo(ox + x * sx, h); ctx.stroke();
        }
        for (let y = yStep; oy - y * sy > 0; y += yStep) {
            ctx.beginPath(); ctx.moveTo(0, oy - y * sy); ctx.lineTo(w, oy - y * sy); ctx.stroke();
        }
        for (let y = -yStep; oy - y * sy < h; y -= yStep) {
            ctx.beginPath(); ctx.moveTo(0, oy - y * sy); ctx.lineTo(w, oy - y * sy); ctx.stroke();
        }
    }

    function drawCurve(ctx, ox, oy, sx, sy, fn, xMin, xMax, color, lw) {
        ctx.strokeStyle = color; ctx.lineWidth = lw || 2.5;
        ctx.beginPath();
        const steps = 600;
        for (let i = 0; i <= steps; i++) {
            const x = xMin + (i / steps) * (xMax - xMin);
            const y = fn(x);
            if (Math.abs(y) > 20) { ctx.stroke(); ctx.beginPath(); continue; }
            const [px, py] = toPixel(x, y, ox, oy, sx, sy);
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();
    }

    function drawDot(ctx, px, py, color, glow, r) {
        ctx.save(); ctx.shadowColor = glow; ctx.shadowBlur = 12;
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(px, py, r || 5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    function drawXLabel(ctx, ox, oy, sx, val, txt) {
        const px = ox + val * sx;
        ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(px, oy - 3); ctx.lineTo(px, oy + 3); ctx.stroke();
        ctx.fillStyle = C.axisLabel; ctx.font = '10px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(txt, px, oy + 5);
    }

    function drawYLabel(ctx, ox, oy, sy, val, txt) {
        const py = oy - val * sy;
        ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(ox - 3, py); ctx.lineTo(ox + 3, py); ctx.stroke();
        ctx.fillStyle = C.axisLabel; ctx.font = '10px Inter'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText(txt, ox - 6, py);
    }

    /* ======= CHART DRAWING ======= */
    const chartDrawn = {};

    function drawChartsForSection(id) {
        if (id === 'basic-eq' && !chartDrawn['sinEq']) { drawSinEqChart(); chartDrawn['sinEq'] = true; }
        if (id === 'basic-subst' && !chartDrawn['subst']) { drawSubstChart(); chartDrawn['subst'] = true; }
        if (id === 'hard-eq' && !chartDrawn['hardEq']) { drawHardEqChart(); chartDrawn['hardEq'] = true; }
    }

    /* --- Chart 1: sin x = 1/2 (unit circle + graph) --- */
    function drawSinEqChart() {
        const canvas = document.getElementById('sinEqCanvas');
        if (!canvas) return;
        const { ctx, w, h } = setupHiDPI(canvas);
        ctx.clearRect(0, 0, w * 3, h * 3);

        // --- Left: Unit circle ---
        const ccx = 130, ccy = h / 2, cr = Math.min(100, h / 2 - 30);

        // Circle glow
        ctx.save(); ctx.shadowColor = C.accentGlow; ctx.shadowBlur = 15;
        ctx.strokeStyle = C.accent; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.3;
        ctx.beginPath(); ctx.arc(ccx, ccy, cr, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();

        // Circle solid
        ctx.strokeStyle = 'rgba(203,213,225,0.3)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(ccx, ccy, cr, 0, Math.PI * 2); ctx.stroke();

        // Circle axes
        ctx.strokeStyle = C.axis; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(ccx - cr - 12, ccy); ctx.lineTo(ccx + cr + 12, ccy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ccx, ccy - cr - 12); ctx.lineTo(ccx, ccy + cr + 12); ctx.stroke();

        // y = 1/2 dashed line
        const halfY = ccy - cr * 0.5;
        ctx.setLineDash([5, 4]); ctx.strokeStyle = C.sin; ctx.lineWidth = 1; ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.moveTo(ccx - cr - 8, halfY); ctx.lineTo(ccx + cr + 8, halfY); ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 1;

        ctx.fillStyle = C.sin; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'left';
        ctx.fillText('y = ½', ccx + cr + 12, halfY - 5);

        // Solution arcs + dots
        [Math.PI / 6, 5 * Math.PI / 6].forEach((a, i) => {
            const px = ccx + cr * Math.cos(a), py = ccy - cr * Math.sin(a);
            // Radius line
            ctx.strokeStyle = C.accent; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.7;
            ctx.beginPath(); ctx.moveTo(ccx, ccy); ctx.lineTo(px, py); ctx.stroke();
            ctx.globalAlpha = 1;
            // Arc for angle
            ctx.strokeStyle = C.accent; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(ccx, ccy, 20, -a, 0); ctx.stroke();
            // Dot
            drawDot(ctx, px, py, C.green, C.greenGlow, 5);
            // Label
            ctx.fillStyle = C.text; ctx.font = 'bold 12px Inter'; ctx.textAlign = 'center';
            ctx.fillText(i === 0 ? 'π/6' : '5π/6', px + (i === 0 ? 16 : -16), py - 12);
        });

        // "Jednotková kružnice" label
        ctx.fillStyle = C.axisLabel; ctx.font = '11px Inter'; ctx.textAlign = 'center';
        ctx.fillText('Jednotková kružnice', ccx, h - 8);

        // --- Right: Graph of y = sin x ---
        var gL = 290, gR = w - 20, gW = gR - gL;
        var gCy = h / 2, gAmp = Math.min(90, h / 2 - 30);
        var xMin = -0.5, xMax = 3.3 * Math.PI;
        var sx = gW / (xMax - xMin), ox = gL - xMin * sx, sy = gAmp;

        drawGrid(ctx, ox, gCy, gR, h, sx, sy, Math.PI / 2, 0.5);
        drawAxes(ctx, ox, gCy, gR, h, xMin, xMax, -1.3, 1.3);

        // x labels
        [[Math.PI, 'π'], [2 * Math.PI, '2π'], [3 * Math.PI, '3π'],
        [Math.PI / 2, 'π/2'], [3 * Math.PI / 2, '3π/2'], [5 * Math.PI / 2, '5π/2']].forEach(
            ([v, t]) => { if (ox + v * sx < gR - 5) drawXLabel(ctx, ox, gCy, sx, v, t); }
        );
        drawYLabel(ctx, ox, gCy, sy, 1, '1');
        drawYLabel(ctx, ox, gCy, sy, -1, '-1');

        // sin curve with glow
        ctx.save(); ctx.shadowColor = C.sinGlow; ctx.shadowBlur = 6;
        drawCurve(ctx, ox, gCy, sx, sy, Math.sin, xMin, xMax, C.sin, 2.5);
        ctx.restore();

        // y = 0.5 line
        var hpx = gCy - 0.5 * sy;
        ctx.setLineDash([5, 4]); ctx.strokeStyle = C.accent; ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.moveTo(gL, hpx); ctx.lineTo(gR, hpx); ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 1;

        // Solution dots on graph
        [Math.PI / 6, 5 * Math.PI / 6, Math.PI / 6 + 2 * Math.PI, 5 * Math.PI / 6 + 2 * Math.PI].forEach(x => {
            var [px, py] = toPixel(x, 0.5, ox, gCy, sx, sy);
            if (px > gL && px < gR) drawDot(ctx, px, py, C.green, C.greenGlow, 5);
        });

        // Label
        ctx.fillStyle = C.axisLabel; ctx.font = '11px Inter'; ctx.textAlign = 'center';
        ctx.fillText('y = sin x', gL + gW / 2, h - 8);

        // Legend
        ctx.fillStyle = C.sin; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'left';
        ctx.fillText('sin x', gL + 5, 16);
        ctx.fillStyle = C.green; ctx.fillText('● řešení', gL + 55, 16);
    }

    /* --- Chart 2: f(x) = 2sin²x − sin x − 1 --- */
    function drawSubstChart() {
        const canvas = document.getElementById('substCanvas');
        if (!canvas) return;
        const { ctx, w, h } = setupHiDPI(canvas);
        ctx.clearRect(0, 0, w * 3, h * 3);

        var xMin = -2.2 * Math.PI, xMax = 2.2 * Math.PI;
        var padL = 45, padR = 20;
        var gW = w - padL - padR;
        var sx = gW / (xMax - xMin), ox = padL - xMin * sx;
        var gCy = h / 2, sy = (h / 2 - 25) / 2;

        drawGrid(ctx, ox, gCy, w, h, sx, sy, Math.PI / 2, 0.5);
        drawAxes(ctx, ox, gCy, w, h, xMin, xMax, -2.5, 2.5);

        [[-2 * Math.PI, '-2π'], [-Math.PI, '-π'], [Math.PI, 'π'], [2 * Math.PI, '2π']].forEach(
            ([v, t]) => drawXLabel(ctx, ox, gCy, sx, v, t)
        );
        drawYLabel(ctx, ox, gCy, sy, 1, '1'); drawYLabel(ctx, ox, gCy, sy, -1, '-1');
        drawYLabel(ctx, ox, gCy, sy, 2, '2');

        // Curve with glow
        var fn = x => { var s = Math.sin(x); return 2 * s * s - s - 1; };
        ctx.save(); ctx.shadowColor = C.tanGlow; ctx.shadowBlur = 6;
        drawCurve(ctx, ox, gCy, sx, sy, fn, xMin, xMax, C.tan, 2.5);
        ctx.restore();

        // Zero dots
        [Math.PI / 2, -3 * Math.PI / 2, -Math.PI / 6, 7 * Math.PI / 6,
        -Math.PI / 6 - 2 * Math.PI, 7 * Math.PI / 6 - 2 * Math.PI,
        -Math.PI / 6 + 2 * Math.PI, Math.PI / 2 - 2 * Math.PI].forEach(z => {
            var [px, py] = toPixel(z, 0, ox, gCy, sx, sy);
            if (px > padL && px < w - padR) drawDot(ctx, px, py, C.green, C.greenGlow, 5);
        });

        // Legend
        ctx.fillStyle = C.tan; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'left';
        ctx.fillText('f(x) = 2sin²x − sin x − 1', padL + 5, 16);
        ctx.fillStyle = C.green; ctx.fillText('● kořeny  f(x) = 0', padL + 220, 16);
    }

    /* --- Chart 3: sin 2x vs cos x --- */
    function drawHardEqChart() {
        const canvas = document.getElementById('hardEqCanvas');
        if (!canvas) return;
        const { ctx, w, h } = setupHiDPI(canvas);
        ctx.clearRect(0, 0, w * 3, h * 3);

        var xMin = -2.2 * Math.PI, xMax = 2.2 * Math.PI;
        var padL = 45, padR = 20;
        var gW = w - padL - padR;
        var sx = gW / (xMax - xMin), ox = padL - xMin * sx;
        var gCy = h / 2, sy = (h / 2 - 25);

        drawGrid(ctx, ox, gCy, w, h, sx, sy, Math.PI / 2, 0.5);
        drawAxes(ctx, ox, gCy, w, h, xMin, xMax, -1.3, 1.3);

        [[-2 * Math.PI, '-2π'], [-Math.PI, '-π'], [Math.PI, 'π'], [2 * Math.PI, '2π']].forEach(
            ([v, t]) => drawXLabel(ctx, ox, gCy, sx, v, t)
        );
        drawYLabel(ctx, ox, gCy, sy, 1, '1'); drawYLabel(ctx, ox, gCy, sy, -1, '-1');

        // sin 2x with glow
        ctx.save(); ctx.shadowColor = C.tanGlow; ctx.shadowBlur = 6;
        drawCurve(ctx, ox, gCy, sx, sy, x => Math.sin(2 * x), xMin, xMax, C.tan, 2.5);
        ctx.restore();

        // cos x with glow
        ctx.save(); ctx.shadowColor = C.cosGlow; ctx.shadowBlur = 6;
        drawCurve(ctx, ox, gCy, sx, sy, Math.cos, xMin, xMax, C.cos, 2.5);
        ctx.restore();

        // Intersection dots
        [-3 * Math.PI / 2, -Math.PI / 2, Math.PI / 2, 3 * Math.PI / 2,
        Math.PI / 6, 5 * Math.PI / 6, Math.PI / 6 - 2 * Math.PI, 5 * Math.PI / 6 - 2 * Math.PI].forEach(t => {
            var [px, py] = toPixel(t, Math.cos(t), ox, gCy, sx, sy);
            if (px > padL && px < w - padR) drawDot(ctx, px, py, C.green, C.greenGlow, 5);
        });

        // Legend
        ctx.fillStyle = C.tan; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'left';
        ctx.fillText('sin 2x', padL + 5, 16);
        ctx.fillStyle = C.cos; ctx.fillText('cos x', padL + 65, 16);
        ctx.fillStyle = C.green; ctx.fillText('● průsečíky', padL + 125, 16);
    }

    // Draw charts for initial section
    drawChartsForSection('basic-eq');
});
