/* Chapter 4: Vzorce pro goniometrické funkce – Lesson JS */
document.addEventListener('DOMContentLoaded', function () {
    /* ======= NAVIGATION ======= */
    const sections = document.querySelectorAll('.lesson-section');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const progressFill = document.querySelector('.progress-fill-small');
    const sectionDrawCallbacks = {};

    function showSection(id) {
        sections.forEach(s => s.classList.remove('active'));
        sidebarLinks.forEach(l => l.classList.remove('active'));
        const sec = document.getElementById(id);
        if (sec) sec.classList.add('active');
        sidebarLinks.forEach(l => { if (l.dataset.section === id) l.classList.add('active'); });
        const idx = Array.from(sections).findIndex(s => s.id === id);
        if (progressFill && sections.length) progressFill.style.width = ((idx + 1) / sections.length * 100) + '%';
        window.location.hash = id;
        const redraw = () => { if (sectionDrawCallbacks[id]) sectionDrawCallbacks[id](); };
        requestAnimationFrame(() => { requestAnimationFrame(redraw); });
        setTimeout(redraw, 300);
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            if (this.dataset.section) showSection(this.dataset.section);
        });
    });

    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(hash)) showSection(hash);

    /* ======= CANVAS HELPERS ======= */
    function setupHiDPI(canvas) {
        const dpr = window.devicePixelRatio || 1;
        const parent = canvas.parentElement;
        let parentW = 0;
        if (parent) {
            parentW = parent.clientWidth;
            if (parentW <= 0) { parentW = parent.getBoundingClientRect().width; }
            parentW = Math.max(0, parentW - 24);
        }
        if (parentW <= 0) parentW = 700;
        const nomW = parseInt(canvas.getAttribute('width')) || 750;
        const nomH = parseInt(canvas.getAttribute('height')) || 350;
        const ratio = nomH / nomW;
        const w = Math.max(1, Math.min(nomW, parentW));
        const h = Math.round(w * ratio);
        canvas.width = w * dpr; canvas.height = h * dpr;
        canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
        const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
        return { ctx, w, h, dpr };
    }
    function isDark() { return document.documentElement.getAttribute('data-theme') !== 'light'; }
    function getColors() {
        const d = isDark();
        return {
            bg: d ? '#0f172a' : '#f8fafc',
            bgGrad: d ? '#1e293b' : '#e2e8f0',
            grid: d ? 'rgba(148,163,184,0.08)' : 'rgba(100,116,139,0.1)',
            axis: d ? 'rgba(203,213,225,0.5)' : 'rgba(71,85,105,0.6)',
            axisLabel: d ? 'rgba(203,213,225,0.7)' : 'rgba(51,65,85,0.8)',
            sin: '#f87171', sinGlow: 'rgba(248,113,113,0.4)',
            cos: '#60a5fa', cosGlow: 'rgba(96,165,250,0.4)',
            tan: '#fb923c', tanGlow: 'rgba(251,146,60,0.4)',
            cot: '#a78bfa', cotGlow: 'rgba(167,139,250,0.4)',
            green: '#34d399', greenGlow: 'rgba(52,211,153,0.4)',
            orange: '#fb923c', purple: '#a78bfa',
            accent: '#818cf8', accentGlow: 'rgba(129,140,248,0.4)',
            text: d ? '#e2e8f0' : '#1e293b',
            textMuted: d ? 'rgba(203,213,225,0.6)' : 'rgba(71,85,105,0.6)',
        };
    }
    function clearCanvas(ctx, w, h) { ctx.clearRect(0, 0, w * 3, h * 3); }
    function drawDot(ctx, x, y, color, r, label, glow) {
        if (glow) { ctx.save(); ctx.shadowColor = glow; ctx.shadowBlur = 10; }
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
        if (glow) ctx.restore();
        if (label) { ctx.fillStyle = color; ctx.font = '11px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(label, x, y - r - 3); }
    }

    /* ======= SECTION 1: SOUČTOVÉ VZORCE ======= */
    (function () {
        const canvas = document.getElementById('sumDiffCanvas');
        if (!canvas) return;
        const alphaS = document.getElementById('sumAlphaSlider'), betaS = document.getElementById('sumBetaSlider');
        const alphaV = document.getElementById('sumAlphaVal'), betaV = document.getElementById('sumBetaVal');

        function draw() {
            const { ctx, w, h } = setupHiDPI(canvas);
            if (w < 2) return;
            const c = getColors();
            clearCanvas(ctx, w, h);
            const aD = +alphaS.value, bD = +betaS.value;
            alphaV.textContent = aD; betaV.textContent = bD;
            const aR = aD * Math.PI / 180, bR = bD * Math.PI / 180;
            const sinA = Math.sin(aR), cosA = Math.cos(aR);
            const sinB = Math.sin(bR), cosB = Math.cos(bR);
            const sinAB = sinA * cosB + cosA * sinB;
            const cosAB = cosA * cosB - sinA * sinB;
            const sinAmB = sinA * cosB - cosA * sinB;
            const cosAmB = cosA * cosB + sinA * sinB;

            document.getElementById('sumSinA').textContent = sinA.toFixed(3);
            document.getElementById('sumCosA').textContent = cosA.toFixed(3);
            document.getElementById('sumSinB').textContent = sinB.toFixed(3);
            document.getElementById('sumCosB').textContent = cosB.toFixed(3);
            document.getElementById('sumSinAB').textContent = sinAB.toFixed(3);
            document.getElementById('sumCosAB').textContent = cosAB.toFixed(3);
            document.getElementById('sumSinAB2').textContent = sinAmB.toFixed(3);
            document.getElementById('sumCosAB2').textContent = cosAmB.toFixed(3);

            // Unit circle
            const R = Math.min(w * 0.22, h * 0.42);
            const cx = R + 30, cy = h / 2;

            // Axes
            ctx.strokeStyle = c.axis; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(cx - R - 15, cy); ctx.lineTo(cx + R + 15, cy); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx, cy - R - 15); ctx.lineTo(cx, cy + R + 15); ctx.stroke();

            // Circle
            ctx.strokeStyle = c.axis; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();

            // Angle arcs + rays
            function drawAngleArc(startR, endR, color, label, radius) {
                ctx.strokeStyle = color; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(cx, cy, radius, -endR, -startR); ctx.stroke();
                const midA = -(startR + endR) / 2;
                ctx.fillStyle = color; ctx.font = 'bold 12px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(label, cx + (radius + 14) * Math.cos(midA), cy + (radius + 14) * Math.sin(midA));
            }

            // α arc (red)
            ctx.strokeStyle = c.sin; ctx.lineWidth = 2; ctx.setLineDash([]);
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * cosA, cy - R * sinA); ctx.stroke();
            drawAngleArc(0, aR, c.sin, 'α', R * 0.3);

            // β arc (blue)
            ctx.strokeStyle = c.cos; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * cosB, cy - R * sinB); ctx.stroke();
            drawAngleArc(0, bR, c.cos, 'β', R * 0.22);

            // α+β ray (accent)
            const abR = aR + bR;
            ctx.strokeStyle = c.accent; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.cos(abR), cy - R * Math.sin(abR)); ctx.stroke();
            drawAngleArc(0, abR, c.accent, 'α+β', R * 0.45);

            // Points
            drawDot(ctx, cx + R * cosA, cy - R * sinA, c.sin, 5, 'P(α)', c.sinGlow);
            drawDot(ctx, cx + R * cosB, cy - R * sinB, c.cos, 5, 'P(β)', c.cosGlow);
            drawDot(ctx, cx + R * Math.cos(abR), cy - R * Math.sin(abR), c.accent, 6, 'P(α+β)', c.accentGlow);

            // α-β ray (purple, dashed)
            const amR = aR - bR;
            ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = c.purple; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.cos(amR), cy - R * Math.sin(amR)); ctx.stroke();
            ctx.restore();
            drawDot(ctx, cx + R * Math.cos(amR), cy - R * Math.sin(amR), c.purple, 4, 'P(α−β)');

            // Projection lines for α+β point
            const abx = cx + R * Math.cos(abR), aby = cy - R * Math.sin(abR);
            ctx.save(); ctx.setLineDash([3, 3]); ctx.globalAlpha = 0.5;
            ctx.strokeStyle = c.accent; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(abx, aby); ctx.lineTo(abx, cy); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(abx, aby); ctx.lineTo(cx, aby); ctx.stroke();
            ctx.restore();

            // Labels for projections
            ctx.fillStyle = c.accent; ctx.font = '10px Inter';
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillText('cos(α+β)', abx, cy + 4);
            ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
            ctx.fillText('sin(α+β)', cx - 4, aby);

            // Formula text
            ctx.fillStyle = c.text; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
            const tx = cx + R + 40;
            ctx.fillText('Součtové vzorce:', tx, 15);
            ctx.font = '10px Inter';
            ctx.fillStyle = c.accent;
            ctx.fillText('sin(α+β) = sin α·cos β + cos α·sin β', tx, 35);
            ctx.fillText('cos(α+β) = cos α·cos β − sin α·sin β', tx, 52);
            ctx.fillStyle = c.purple;
            ctx.fillText('sin(α−β) = sin α·cos β − cos α·sin β', tx, 75);
            ctx.fillText('cos(α−β) = cos α·cos β + sin α·sin β', tx, 92);
        }

        alphaS.addEventListener('input', draw);
        betaS.addEventListener('input', draw);
        sectionDrawCallbacks['sum-diff'] = draw;
        window.addEventListener('resize', draw);
        draw();
    })();

    /* ======= SECTION 2: DVOJNÁSOBNÝ ÚHEL ======= */
    (function () {
        const canvas = document.getElementById('doubleAngleCanvas');
        if (!canvas) return;
        const alphaS = document.getElementById('dblAlphaSlider');
        const alphaV = document.getElementById('dblAlphaVal');

        function draw() {
            const { ctx, w, h } = setupHiDPI(canvas);
            if (w < 2) return;
            const c = getColors();
            clearCanvas(ctx, w, h);
            const aD = +alphaS.value;
            alphaV.textContent = aD;
            const aR = aD * Math.PI / 180;
            const sinA = Math.sin(aR), cosA = Math.cos(aR);
            const sin2A = 2 * sinA * cosA;
            const cos2A = cosA * cosA - sinA * sinA;
            const tg2A = Math.abs(Math.cos(2 * aR)) > 0.01 ? Math.tan(2 * aR) : NaN;

            document.getElementById('dblSinA').textContent = sinA.toFixed(3);
            document.getElementById('dblCosA').textContent = cosA.toFixed(3);
            document.getElementById('dblSin2A').textContent = sin2A.toFixed(3);
            document.getElementById('dblSin2Acheck').textContent = sin2A.toFixed(3);
            document.getElementById('dblCos2A').textContent = cos2A.toFixed(3);
            document.getElementById('dblCos2Acheck').textContent = cos2A.toFixed(3);
            document.getElementById('dblTg2A').textContent = isNaN(tg2A) ? 'nedef.' : tg2A.toFixed(3);

            const R = Math.min(w * 0.22, h * 0.42);
            const cx = R + 30, cy = h / 2;

            ctx.strokeStyle = c.axis; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(cx - R - 15, cy); ctx.lineTo(cx + R + 15, cy); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx, cy - R - 15); ctx.lineTo(cx, cy + R + 15); ctx.stroke();
            ctx.strokeStyle = c.axis; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();

            // α ray
            ctx.strokeStyle = c.sin; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * cosA, cy - R * sinA); ctx.stroke();
            // α arc
            ctx.beginPath(); ctx.arc(cx, cy, R * 0.25, 0, -aR, true); ctx.strokeStyle = c.sin; ctx.stroke();
            ctx.fillStyle = c.sin; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center';
            const aM = -aR / 2;
            ctx.fillText('α', cx + (R * 0.25 + 12) * Math.cos(aM), cy + (R * 0.25 + 12) * Math.sin(aM));

            // 2α ray
            const a2R = 2 * aR;
            ctx.strokeStyle = c.orange; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.cos(a2R), cy - R * Math.sin(a2R)); ctx.stroke();
            // 2α arc
            ctx.beginPath(); ctx.arc(cx, cy, R * 0.38, 0, -a2R, true); ctx.strokeStyle = c.orange; ctx.stroke();
            const a2M = -a2R / 2;
            ctx.fillStyle = c.orange; ctx.font = 'bold 11px Inter';
            ctx.fillText('2α', cx + (R * 0.38 + 14) * Math.cos(a2M), cy + (R * 0.38 + 14) * Math.sin(a2M));

            drawDot(ctx, cx + R * cosA, cy - R * sinA, c.sin, 5, 'P(α)', c.sinGlow);
            drawDot(ctx, cx + R * Math.cos(a2R), cy - R * Math.sin(a2R), c.orange, 6, 'P(2α)', c.tanGlow);

            // Graph area — small sin2α graph
            const gL = cx + R + 50, gR = w - 15, gW = gR - gL, gCx = gL + gW / 2, gCy = cy;
            const gSx = gW / (2.5 * Math.PI), gSy = h / 5;

            ctx.strokeStyle = c.axis; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(gL, gCy); ctx.lineTo(gR, gCy); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(gCx, 10); ctx.lineTo(gCx, h - 10); ctx.stroke();

            ctx.fillStyle = c.axisLabel; ctx.font = '9px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            [[-1, '−π'], [-0.5, '−π/2'], [0.5, 'π/2'], [1, 'π']].forEach(([p, lbl]) => {
                const px = gCx + p * Math.PI * gSx;
                if (px > gL && px < gR) ctx.fillText(lbl, px, gCy + 4);
            });

            // sin α curve
            ctx.save(); ctx.shadowColor = c.sinGlow; ctx.shadowBlur = 4;
            ctx.strokeStyle = c.sin; ctx.lineWidth = 2; ctx.beginPath();
            for (let px = gL; px <= gR; px++) { const x = (px - gCx) / gSx; const y = Math.sin(x); const py = gCy - y * gSy; if (px === gL) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
            ctx.stroke(); ctx.restore();

            // sin 2α curve
            ctx.save(); ctx.shadowColor = c.tanGlow; ctx.shadowBlur = 4;
            ctx.strokeStyle = c.orange; ctx.lineWidth = 2.5; ctx.beginPath();
            for (let px = gL; px <= gR; px++) { const x = (px - gCx) / gSx; const y = Math.sin(2 * x); const py = gCy - y * gSy; if (px === gL) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
            ctx.stroke(); ctx.restore();

            // Current angle marker
            const dotGX = gCx + aR * gSx;
            if (dotGX > gL && dotGX < gR) {
                ctx.save(); ctx.setLineDash([3, 3]); ctx.strokeStyle = c.text; ctx.lineWidth = 0.5; ctx.globalAlpha = 0.4;
                ctx.beginPath(); ctx.moveTo(dotGX, 10); ctx.lineTo(dotGX, h - 10); ctx.stroke(); ctx.restore();
                drawDot(ctx, dotGX, gCy - sinA * gSy, c.sin, 4);
                drawDot(ctx, dotGX, gCy - sin2A * gSy, c.orange, 5);
            }

            // Legend
            ctx.font = '10px Inter'; ctx.textAlign = 'left';
            ctx.fillStyle = c.sin; ctx.fillText('sin α', gL + 5, 18);
            ctx.fillStyle = c.orange; ctx.fillText('sin 2α', gL + 5, 32);
        }

        alphaS.addEventListener('input', draw);
        sectionDrawCallbacks['double-angle'] = draw;
        window.addEventListener('resize', draw);
        draw();
    })();

    /* ======= SECTION 3: POLOVIČNÍ ÚHEL ======= */
    (function () {
        const canvas = document.getElementById('halfAngleCanvas');
        if (!canvas) return;
        const alphaS = document.getElementById('halfAlphaSlider');
        const alphaV = document.getElementById('halfAlphaVal');

        function draw() {
            const { ctx, w, h } = setupHiDPI(canvas);
            if (w < 2) return;
            const c = getColors();
            clearCanvas(ctx, w, h);
            const aD = +alphaS.value;
            alphaV.textContent = aD;
            const aR = aD * Math.PI / 180, hR = aR / 2;
            const sinA = Math.sin(aR), cosA = Math.cos(aR);
            const sinH = Math.sin(hR), cosH = Math.cos(hR);
            const sinHformula = Math.sqrt((1 - cosA) / 2);
            const cosHformula = Math.sqrt((1 + cosA) / 2);

            document.getElementById('halfHalfVal').textContent = (aD / 2).toFixed(1) + '°';
            document.getElementById('halfSinA').textContent = sinA.toFixed(3);
            document.getElementById('halfCosA').textContent = cosA.toFixed(3);
            document.getElementById('halfSinH').textContent = sinH.toFixed(3);
            document.getElementById('halfSinHcheck').textContent = sinHformula.toFixed(3);
            document.getElementById('halfCosH').textContent = cosH.toFixed(3);
            document.getElementById('halfCosHcheck').textContent = cosHformula.toFixed(3);

            const R = Math.min(w * 0.22, h * 0.42);
            const cx = R + 30, cy = h / 2;

            ctx.strokeStyle = c.axis; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(cx - R - 15, cy); ctx.lineTo(cx + R + 15, cy); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx, cy - R - 15); ctx.lineTo(cx, cy + R + 15); ctx.stroke();
            ctx.strokeStyle = c.axis; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();

            // α ray + arc
            ctx.strokeStyle = c.sin; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * cosA, cy - R * sinA); ctx.stroke();
            ctx.beginPath(); ctx.arc(cx, cy, R * 0.35, 0, -aR, true); ctx.stroke();
            ctx.fillStyle = c.sin; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center';
            const aM = -aR / 2;
            ctx.fillText('α', cx + (R * 0.35 + 14) * Math.cos(aM), cy + (R * 0.35 + 14) * Math.sin(aM));

            // α/2 ray + arc (orange)
            ctx.strokeStyle = c.orange; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * cosH, cy - R * sinH); ctx.stroke();
            ctx.beginPath(); ctx.arc(cx, cy, R * 0.22, 0, -hR, true); ctx.strokeStyle = c.orange; ctx.stroke();
            const hM = -hR / 2;
            ctx.fillStyle = c.orange; ctx.font = 'bold 11px Inter';
            ctx.fillText('α/2', cx + (R * 0.22 + 14) * Math.cos(hM), cy + (R * 0.22 + 14) * Math.sin(hM));

            drawDot(ctx, cx + R * cosA, cy - R * sinA, c.sin, 5, 'P(α)', c.sinGlow);
            drawDot(ctx, cx + R * cosH, cy - R * sinH, c.orange, 6, 'P(α/2)', c.tanGlow);

            // Graph area
            const gL = cx + R + 50, gR = w - 15, gW = gR - gL, gCx = gL + gW / 2, gCy = cy;
            const gSx = gW / (2.5 * Math.PI), gSy = h / 5;
            ctx.strokeStyle = c.axis; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(gL, gCy); ctx.lineTo(gR, gCy); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(gCx, 10); ctx.lineTo(gCx, h - 10); ctx.stroke();

            // sin(x) curve
            ctx.save(); ctx.shadowColor = c.sinGlow; ctx.shadowBlur = 4;
            ctx.strokeStyle = c.sin; ctx.lineWidth = 2; ctx.beginPath();
            for (let px = gL; px <= gR; px++) { const x = (px - gCx) / gSx; const py = gCy - Math.sin(x) * gSy; if (px === gL) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
            ctx.stroke(); ctx.restore();

            // sin(x/2) curve
            ctx.save(); ctx.shadowColor = c.tanGlow; ctx.shadowBlur = 4;
            ctx.strokeStyle = c.orange; ctx.lineWidth = 2.5; ctx.beginPath();
            for (let px = gL; px <= gR; px++) { const x = (px - gCx) / gSx; const py = gCy - Math.sin(x / 2) * gSy; if (px === gL) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
            ctx.stroke(); ctx.restore();

            const dotGX = gCx + aR * gSx;
            if (dotGX > gL && dotGX < gR) {
                ctx.save(); ctx.setLineDash([3, 3]); ctx.strokeStyle = c.text; ctx.lineWidth = 0.5; ctx.globalAlpha = 0.4;
                ctx.beginPath(); ctx.moveTo(dotGX, 10); ctx.lineTo(dotGX, h - 10); ctx.stroke(); ctx.restore();
                drawDot(ctx, dotGX, gCy - sinA * gSy, c.sin, 4);
                drawDot(ctx, dotGX, gCy - sinH * gSy, c.orange, 5);
            }
            ctx.font = '10px Inter'; ctx.textAlign = 'left';
            ctx.fillStyle = c.sin; ctx.fillText('sin α', gL + 5, 18);
            ctx.fillStyle = c.orange; ctx.fillText('sin(α/2)', gL + 5, 32);
        }

        alphaS.addEventListener('input', draw);
        sectionDrawCallbacks['half-angle'] = draw;
        window.addEventListener('resize', draw);
        draw();
    })();

    /* ======= SECTION 4: SOUČET/ROZDÍL ↔ SOUČIN ======= */
    (function () {
        const canvas = document.getElementById('sumProdCanvas');
        if (!canvas) return;
        const alphaS = document.getElementById('spAlphaSlider'), betaS = document.getElementById('spBetaSlider');
        const alphaV = document.getElementById('spAlphaVal'), betaV = document.getElementById('spBetaVal');
        const output = document.getElementById('spOutput');
        const btns = document.querySelectorAll('[data-sp-formula]');
        let formula = 'sinsum';

        btns.forEach(b => b.addEventListener('click', function () {
            btns.forEach(x => x.classList.remove('active'));
            this.classList.add('active');
            formula = this.dataset.spFormula;
            draw();
        }));

        function draw() {
            const { ctx, w, h } = setupHiDPI(canvas);
            if (w < 2) return;
            const c = getColors();
            clearCanvas(ctx, w, h);
            const aD = +alphaS.value, bD = +betaS.value;
            alphaV.textContent = aD; betaV.textContent = bD;
            const aR = aD * Math.PI / 180, bR = bD * Math.PI / 180;
            const sinA = Math.sin(aR), cosA = Math.cos(aR);
            const sinB = Math.sin(bR), cosB = Math.cos(bR);
            const sHalf = (aR + bR) / 2, dHalf = (aR - bR) / 2;

            let leftVal, rightVal, leftLabel, rightLabel, stepHtml;
            if (formula === 'sinsum') {
                leftVal = sinA + sinB;
                rightVal = 2 * Math.sin(sHalf) * Math.cos(dHalf);
                leftLabel = 'sin α + sin β';
                rightLabel = '2·sin((α+β)/2)·cos((α−β)/2)';
                stepHtml = '<div class="calc-step"><span>' + leftLabel + '</span><span class="calc-value">' + leftVal.toFixed(4) + '</span></div>' +
                    '<div class="calc-divider"></div>' +
                    '<div class="calc-step"><span>(α+β)/2 = ' + ((aD + bD) / 2).toFixed(1) + '°</span><span></span></div>' +
                    '<div class="calc-step"><span>(α−β)/2 = ' + ((aD - bD) / 2).toFixed(1) + '°</span><span></span></div>' +
                    '<div class="calc-divider"></div>' +
                    '<div class="calc-step"><span>' + rightLabel + '</span><span class="calc-value highlight">' + rightVal.toFixed(4) + '</span></div>';
            } else if (formula === 'sindiff') {
                leftVal = sinA - sinB;
                rightVal = 2 * Math.cos(sHalf) * Math.sin(dHalf);
                leftLabel = 'sin α − sin β';
                rightLabel = '2·cos((α+β)/2)·sin((α−β)/2)';
                stepHtml = '<div class="calc-step"><span>' + leftLabel + '</span><span class="calc-value">' + leftVal.toFixed(4) + '</span></div>' +
                    '<div class="calc-divider"></div>' +
                    '<div class="calc-step"><span>(α+β)/2 = ' + ((aD + bD) / 2).toFixed(1) + '°</span><span></span></div>' +
                    '<div class="calc-step"><span>(α−β)/2 = ' + ((aD - bD) / 2).toFixed(1) + '°</span><span></span></div>' +
                    '<div class="calc-divider"></div>' +
                    '<div class="calc-step"><span>' + rightLabel + '</span><span class="calc-value highlight">' + rightVal.toFixed(4) + '</span></div>';
            } else if (formula === 'cossum') {
                leftVal = cosA + cosB;
                rightVal = 2 * Math.cos(sHalf) * Math.cos(dHalf);
                leftLabel = 'cos α + cos β';
                rightLabel = '2·cos((α+β)/2)·cos((α−β)/2)';
                stepHtml = '<div class="calc-step"><span>' + leftLabel + '</span><span class="calc-value">' + leftVal.toFixed(4) + '</span></div>' +
                    '<div class="calc-divider"></div>' +
                    '<div class="calc-step"><span>' + rightLabel + '</span><span class="calc-value highlight">' + rightVal.toFixed(4) + '</span></div>';
            } else {
                leftVal = cosA - cosB;
                rightVal = -2 * Math.sin(sHalf) * Math.sin(dHalf);
                leftLabel = 'cos α − cos β';
                rightLabel = '−2·sin((α+β)/2)·sin((α−β)/2)';
                stepHtml = '<div class="calc-step"><span>' + leftLabel + '</span><span class="calc-value">' + leftVal.toFixed(4) + '</span></div>' +
                    '<div class="calc-divider"></div>' +
                    '<div class="calc-step"><span>' + rightLabel + '</span><span class="calc-value highlight">' + rightVal.toFixed(4) + '</span></div>';
            }
            output.innerHTML = stepHtml;

            // Draw graph comparing both sides
            const gL = 15, gR2 = w - 15, gW = gR2 - gL, gCx = gL + gW / 2, gCy = h / 2;
            const gSx = gW / (3 * Math.PI), gSy = h / 5;
            ctx.strokeStyle = c.axis; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(gL, gCy); ctx.lineTo(gR2, gCy); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(gCx, 10); ctx.lineTo(gCx, h - 10); ctx.stroke();

            ctx.fillStyle = c.axisLabel; ctx.font = '9px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            [[-1, '−π'], [-0.5, '−π/2'], [0.5, 'π/2'], [1, 'π']].forEach(([p, lbl]) => {
                const px = gCx + p * Math.PI * gSx;
                if (px > gL + 10 && px < gR2 - 10) ctx.fillText(lbl, px, gCy + 4);
            });

            // Left side curve (blue solid)
            ctx.save(); ctx.shadowColor = c.cosGlow; ctx.shadowBlur = 5;
            ctx.strokeStyle = c.cos; ctx.lineWidth = 3; ctx.beginPath();
            for (let px = gL; px <= gR2; px++) {
                const x = (px - gCx) / gSx;
                let y;
                if (formula === 'sinsum') y = Math.sin(x) + Math.sin(bR);
                else if (formula === 'sindiff') y = Math.sin(x) - Math.sin(bR);
                else if (formula === 'cossum') y = Math.cos(x) + Math.cos(bR);
                else y = Math.cos(x) - Math.cos(bR);
                const py = gCy - y * gSy;
                if (px === gL) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.stroke(); ctx.restore();

            // Right side curve (orange dashed)
            ctx.save(); ctx.setLineDash([6, 4]); ctx.shadowColor = c.tanGlow; ctx.shadowBlur = 5;
            ctx.strokeStyle = c.orange; ctx.lineWidth = 2.5; ctx.beginPath();
            for (let px = gL; px <= gR2; px++) {
                const x = (px - gCx) / gSx;
                let y;
                const s2 = (x + bR) / 2, d2 = (x - bR) / 2;
                if (formula === 'sinsum') y = 2 * Math.sin(s2) * Math.cos(d2);
                else if (formula === 'sindiff') y = 2 * Math.cos(s2) * Math.sin(d2);
                else if (formula === 'cossum') y = 2 * Math.cos(s2) * Math.cos(d2);
                else y = -2 * Math.sin(s2) * Math.sin(d2);
                const py = gCy - y * gSy;
                if (px === gL) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.stroke(); ctx.restore();

            // Current α marker
            const dotGX = gCx + aR * gSx;
            if (dotGX > gL && dotGX < gR2) {
                ctx.save(); ctx.setLineDash([2, 2]); ctx.strokeStyle = c.accent; ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
                ctx.beginPath(); ctx.moveTo(dotGX, 10); ctx.lineTo(dotGX, h - 10); ctx.stroke(); ctx.restore();
                drawDot(ctx, dotGX, gCy - leftVal * gSy, c.accent, 5);
            }

            // Legend
            ctx.font = '10px Inter'; ctx.textAlign = 'left';
            ctx.fillStyle = c.cos; ctx.fillText(leftLabel + ' (levá)', gL + 5, 16);
            ctx.fillStyle = c.orange; ctx.fillText(rightLabel + ' (pravá)', gL + 5, 30);
        }

        alphaS.addEventListener('input', draw);
        betaS.addEventListener('input', draw);
        sectionDrawCallbacks['sum-product'] = draw;
        window.addEventListener('resize', draw);
        draw();
    })();

    /* ======= SECTION 5: GRAFY S VYUŽITÍM VZORCŮ ======= */
    (function () {
        const canvas = document.getElementById('graphCompareCanvas');
        if (!canvas) return;
        const info = document.getElementById('graphCompareInfo');
        const btns = document.querySelectorAll('[data-graph-preset]');
        let preset = 'sin2x';

        const presets = {
            sin2x: {
                origFn: x => Math.sin(2 * x),
                simpFn: x => 2 * Math.sin(x) * Math.cos(x),
                origLabel: 'sin 2x',
                simpLabel: '2·sin x·cos x',
                desc: 'Použijeme vzorec pro dvojnásobný úhel: sin 2x = 2 sin x cos x'
            },
            cos2x: {
                origFn: x => Math.cos(2 * x),
                simpFn: x => Math.cos(x) * Math.cos(x) - Math.sin(x) * Math.sin(x),
                origLabel: 'cos 2x',
                simpLabel: 'cos²x − sin²x',
                desc: 'Použijeme vzorec pro dvojnásobný úhel: cos 2x = cos²x − sin²x'
            },
            sincos: {
                origFn: x => Math.sin(x) * Math.sin(x) + Math.cos(x) * Math.cos(x),
                simpFn: x => 1,
                origLabel: 'sin²x + cos²x',
                simpLabel: '1',
                desc: 'Základní goniometrická identita: sin²x + cos²x = 1 (konstantní funkce)'
            },
            sumsin: {
                origFn: x => Math.sin(x) + Math.sin(3 * x),
                simpFn: x => 2 * Math.sin(2 * x) * Math.cos(x),
                origLabel: 'sin x + sin 3x',
                simpLabel: '2·sin 2x·cos x',
                desc: 'Vzorec součet → součin: sin α + sin β = 2·sin((α+β)/2)·cos((α−β)/2). Zde α=x, β=3x.'
            },
            power: {
                origFn: x => Math.cos(x) * Math.cos(x),
                simpFn: x => (1 + Math.cos(2 * x)) / 2,
                origLabel: 'cos²x',
                simpLabel: '(1 + cos 2x) / 2',
                desc: 'Z cos 2x = 2cos²x − 1 vyjádříme cos²x = (1 + cos 2x) / 2'
            }
        };

        btns.forEach(b => b.addEventListener('click', function () {
            btns.forEach(x => x.classList.remove('active'));
            this.classList.add('active');
            preset = this.dataset.graphPreset;
            draw();
        }));

        function draw() {
            const { ctx, w, h } = setupHiDPI(canvas);
            if (w < 2) return;
            const c = getColors();
            clearCanvas(ctx, w, h);
            const p = presets[preset];

            const gL = 30, gR2 = w - 15, gW = gR2 - gL, gCx = gL + gW / 2, gCy = h / 2;
            const gSx = gW / (3 * Math.PI), gSy = h / 4;

            // Grid
            ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
            for (let i = -3; i <= 3; i++) {
                const px = gCx + i * gSx; if (px > gL && px < gR2) { ctx.beginPath(); ctx.moveTo(px, 10); ctx.lineTo(px, h - 10); ctx.stroke(); }
            }
            for (let i = -2; i <= 2; i++) {
                const py = gCy - i * gSy; ctx.beginPath(); ctx.moveTo(gL, py); ctx.lineTo(gR2, py); ctx.stroke();
            }

            ctx.strokeStyle = c.axis; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(gL, gCy); ctx.lineTo(gR2, gCy); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(gCx, 10); ctx.lineTo(gCx, h - 10); ctx.stroke();

            ctx.fillStyle = c.axisLabel; ctx.font = '9px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            [[-1, '−π'], [-0.5, '−π/2'], [0.5, 'π/2'], [1, 'π']].forEach(([pv, lbl]) => {
                const px = gCx + pv * Math.PI * gSx;
                if (px > gL + 10 && px < gR2 - 10) ctx.fillText(lbl, px, gCy + 5);
            });
            ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
            [-2, -1, 1, 2].forEach(v => { const py = gCy - v * gSy; ctx.fillText(v.toString(), gCx - 5, py); });

            // Original curve (blue, thick)
            ctx.save(); ctx.shadowColor = c.cosGlow; ctx.shadowBlur = 6;
            ctx.strokeStyle = c.cos; ctx.lineWidth = 3; ctx.beginPath();
            for (let px = gL; px <= gR2; px++) {
                const x = (px - gCx) / gSx, y = p.origFn(x), py = gCy - y * gSy;
                if (py > -50 && py < h + 50) { if (px === gL) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
            }
            ctx.stroke(); ctx.restore();

            // Simplified curve (orange, dashed)
            ctx.save(); ctx.setLineDash([8, 5]); ctx.shadowColor = c.tanGlow; ctx.shadowBlur = 6;
            ctx.strokeStyle = c.orange; ctx.lineWidth = 2.5; ctx.beginPath();
            for (let px = gL; px <= gR2; px++) {
                const x = (px - gCx) / gSx, y = p.simpFn(x), py = gCy - y * gSy;
                if (py > -50 && py < h + 50) { if (px === gL) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
            }
            ctx.stroke(); ctx.restore();

            // Legend
            ctx.font = 'bold 11px Inter'; ctx.textAlign = 'left';
            ctx.fillStyle = c.cos; ctx.fillText('━ ' + p.origLabel, gL + 5, 18);
            ctx.fillStyle = c.orange; ctx.fillText('╌ ' + p.simpLabel, gL + 5, 34);

            // Info panel
            info.innerHTML = '<h4>📝 ' + p.origLabel + ' = ' + p.simpLabel + '</h4><p style="font-size:0.9rem;line-height:1.6;color:var(--text-secondary)">' + p.desc + '</p>';
        }

        sectionDrawCallbacks['graphs'] = draw;
        window.addEventListener('resize', draw);
        draw();
    })();

    /* ======= SECTION 6: PŘEHLED VZORCŮ – FLASHCARDS + QUIZ ======= */
    (function () {
        const grid = document.getElementById('formulaFlashcardGrid');
        if (!grid) return;

        const formulas = [
            { q: 'sin(α + β)', a: 'sinα·cosβ + cosα·sinβ' },
            { q: 'sin(α − β)', a: 'sinα·cosβ − cosα·sinβ' },
            { q: 'cos(α + β)', a: 'cosα·cosβ − sinα·sinβ' },
            { q: 'cos(α − β)', a: 'cosα·cosβ + sinα·sinβ' },
            { q: 'tg(α + β)', a: '(tgα+tgβ)/(1−tgα·tgβ)' },
            { q: 'sin 2α', a: '2·sinα·cosα' },
            { q: 'cos 2α', a: 'cos²α − sin²α' },
            { q: 'tg 2α', a: '2tgα/(1−tg²α)' },
            { q: 'sin(α/2)', a: '±√((1−cosα)/2)' },
            { q: 'cos(α/2)', a: '±√((1+cosα)/2)' },
            { q: 'sinα + sinβ', a: '2sin((α+β)/2)cos((α−β)/2)' },
            { q: 'cosα − cosβ', a: '−2sin((α+β)/2)sin((α−β)/2)' },
        ];

        function renderCards() {
            grid.innerHTML = '';
            const shuffled = [...formulas].sort(() => Math.random() - 0.5);
            shuffled.forEach(f => {
                const card = document.createElement('div');
                card.className = 'flashcard';
                card.innerHTML = '<div class="fc-question">' + f.q + '</div><div class="fc-answer">' + f.a + '</div>';
                card.addEventListener('click', () => card.classList.toggle('revealed'));
                grid.appendChild(card);
            });
        }
        renderCards();
        const resetBtn = document.getElementById('resetFormulaCards');
        if (resetBtn) resetBtn.addEventListener('click', renderCards);

        // Quiz
        const quizQ = document.getElementById('formulaQuizQ');
        const quizOpts = document.getElementById('formulaQuizOpts');
        const quizScore = document.getElementById('formulaQuizScore');
        const quizNext = document.getElementById('formulaQuizNext');
        let score = 0, total = 0;

        function nextQuiz() {
            const f = formulas[Math.floor(Math.random() * formulas.length)];
            quizQ.textContent = f.q + ' = ?';
            const wrongPool = formulas.filter(x => x.a !== f.a).sort(() => Math.random() - 0.5).slice(0, 3);
            const options = [f, ...wrongPool].sort(() => Math.random() - 0.5);
            quizOpts.innerHTML = '';
            options.forEach(o => {
                const btn = document.createElement('button');
                btn.className = 'quiz-option';
                btn.textContent = o.a;
                btn.addEventListener('click', function () {
                    total++;
                    quizOpts.querySelectorAll('.quiz-option').forEach(b => {
                        b.disabled = true;
                        if (b.textContent === f.a) b.classList.add('correct-answer');
                    });
                    if (o.a === f.a) { score++; }
                    else { this.classList.add('wrong-answer'); }
                    quizScore.textContent = 'Skóre: ' + score + '/' + total;
                });
                quizOpts.appendChild(btn);
            });
        }
        nextQuiz();
        quizNext.addEventListener('click', nextQuiz);
    })();

    /* ======= SECTION 7: HŘIŠTĚ (PLAYGROUND) ======= */
    (function () {
        const canvas = document.getElementById('playgroundCanvas');
        if (!canvas) return;
        const alphaS = document.getElementById('pgAlphaSlider'), betaS = document.getElementById('pgBetaSlider');
        const alphaV = document.getElementById('pgAlphaVal'), betaV = document.getElementById('pgBetaVal');
        const cbSinSum = document.getElementById('pgShowSinSum');
        const cbCosSum = document.getElementById('pgShowCosSum');
        const cbSin2 = document.getElementById('pgShowSin2');
        const cbCos2 = document.getElementById('pgShowCos2');

        function draw() {
            const { ctx, w, h } = setupHiDPI(canvas);
            if (w < 2) return;
            const c = getColors();
            fillBg(ctx, w, h, c);
            const aD = +alphaS.value, bD = +betaS.value;
            alphaV.textContent = aD; betaV.textContent = bD;
            const aR = aD * Math.PI / 180, bR = bD * Math.PI / 180;

            // Unit circle
            const R = Math.min(w * 0.18, h * 0.38);
            const circCx = R + 25, circCy = h / 2;
            ctx.strokeStyle = c.axis; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(circCx - R - 10, circCy); ctx.lineTo(circCx + R + 10, circCy); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(circCx, circCy - R - 10); ctx.lineTo(circCx, circCy + R + 10); ctx.stroke();
            ctx.strokeStyle = c.axis; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(circCx, circCy, R, 0, Math.PI * 2); ctx.stroke();

            // Draw angle rays
            const cosA = Math.cos(aR), sinA = Math.sin(aR);
            const cosB = Math.cos(bR), sinB = Math.sin(bR);
            ctx.strokeStyle = c.sin; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(circCx, circCy); ctx.lineTo(circCx + R * cosA, circCy - R * sinA); ctx.stroke();
            ctx.strokeStyle = c.cos; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(circCx, circCy); ctx.lineTo(circCx + R * cosB, circCy - R * sinB); ctx.stroke();

            const abR = aR + bR;
            ctx.strokeStyle = c.accent; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(circCx, circCy); ctx.lineTo(circCx + R * Math.cos(abR), circCy - R * Math.sin(abR)); ctx.stroke();

            drawDot(ctx, circCx + R * cosA, circCy - R * sinA, c.sin, 4, 'α');
            drawDot(ctx, circCx + R * cosB, circCy - R * sinB, c.cos, 4, 'β');
            drawDot(ctx, circCx + R * Math.cos(abR), circCy - R * Math.sin(abR), c.accent, 5, 'α+β', c.accentGlow);

            // Graph area
            const gL = circCx + R + 40, gR2 = w - 10, gW = gR2 - gL, gCx = gL + gW / 2, gCy2 = circCy;
            const gSx = gW / (3 * Math.PI), gSy = h / 5;

            ctx.strokeStyle = c.axis; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(gL, gCy2); ctx.lineTo(gR2, gCy2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(gCx, 10); ctx.lineTo(gCx, h - 10); ctx.stroke();

            ctx.fillStyle = c.axisLabel; ctx.font = '9px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            [[-1, '−π'], [1, 'π']].forEach(([p, lbl]) => {
                const px = gCx + p * Math.PI * gSx;
                if (px > gL + 10 && px < gR2 - 10) ctx.fillText(lbl, px, gCy2 + 4);
            });

            function drawCurve(fn, checkFn, color, glow, label) {
                ctx.save(); ctx.shadowColor = glow; ctx.shadowBlur = 5;
                ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.beginPath(); let d = false;
                for (let px = gL; px <= gR2; px++) {
                    const x = (px - gCx) / gSx;
                    if (checkFn && Math.abs(checkFn(x)) < 0.02) { d = false; continue; }
                    const y = fn(x), py = gCy2 - y * gSy;
                    if (py < -30 || py > h + 30) { d = false; continue; }
                    if (!d) { ctx.moveTo(px, py); d = true; } else ctx.lineTo(px, py);
                }
                ctx.stroke(); ctx.restore();
            }

            let legendY = 15;
            if (cbSinSum.checked) {
                drawCurve(x => Math.sin(x + bR), null, c.accent, c.accentGlow, 'sin(x+β)');
                ctx.fillStyle = c.accent; ctx.font = '10px Inter'; ctx.textAlign = 'left';
                ctx.fillText('sin(x+β)', gL + 5, legendY); legendY += 14;
            }
            if (cbCosSum.checked) {
                drawCurve(x => Math.cos(x + bR), null, c.green, c.greenGlow, 'cos(x+β)');
                ctx.fillStyle = c.green; ctx.font = '10px Inter'; ctx.textAlign = 'left';
                ctx.fillText('cos(x+β)', gL + 5, legendY); legendY += 14;
            }
            if (cbSin2.checked) {
                drawCurve(x => Math.sin(2 * x), null, c.orange, c.tanGlow, 'sin 2x');
                ctx.fillStyle = c.orange; ctx.font = '10px Inter'; ctx.textAlign = 'left';
                ctx.fillText('sin 2x', gL + 5, legendY); legendY += 14;
            }
            if (cbCos2.checked) {
                drawCurve(x => Math.cos(2 * x), null, c.purple, c.cotGlow, 'cos 2x');
                ctx.fillStyle = c.purple; ctx.font = '10px Inter'; ctx.textAlign = 'left';
                ctx.fillText('cos 2x', gL + 5, legendY); legendY += 14;
            }

            // Current angle marker on graph
            const dotGX = gCx + aR * gSx;
            if (dotGX > gL && dotGX < gR2) {
                ctx.save(); ctx.setLineDash([3, 3]); ctx.strokeStyle = c.text; ctx.lineWidth = 0.5; ctx.globalAlpha = 0.4;
                ctx.beginPath(); ctx.moveTo(dotGX, 10); ctx.lineTo(dotGX, h - 10); ctx.stroke(); ctx.restore();
            }
        }

        alphaS.addEventListener('input', draw);
        betaS.addEventListener('input', draw);
        [cbSinSum, cbCosSum, cbSin2, cbCos2].forEach(cb => cb.addEventListener('change', draw));
        sectionDrawCallbacks['playground'] = draw;
        window.addEventListener('resize', draw);
        draw();
    })();

    /* ======= SECTION 8: EXERCISES ======= */
    window.checkExercise = function (exId, correct) {
        const ex = document.getElementById(exId);
        const feedback = document.getElementById(exId + 'Feedback');
        const status = document.getElementById(exId + 'Status');
        const selected = ex.querySelector('input[name="' + exId + '"]:checked');
        if (!selected) return;
        ex.querySelectorAll('.option').forEach(o => {
            const val = o.querySelector('input').value;
            o.classList.remove('correct', 'incorrect');
            if (val === correct) o.classList.add('correct');
            else if (val === selected.value) o.classList.add('incorrect');
        });
        if (selected.value === correct) {
            feedback.textContent = '✅ Správně!';
            feedback.className = 'exercise-feedback show correct';
            status.textContent = '✅';
        } else {
            feedback.textContent = '❌ Špatně. Zkuste to znovu.';
            feedback.className = 'exercise-feedback show incorrect';
            status.textContent = '❌';
        }
        const allDone = document.querySelectorAll('.exercise-status');
        const solved = Array.from(allDone).filter(s => s.textContent === '✅').length;
        if (solved === allDone.length) {
            const comp = document.getElementById('lessonComplete');
            if (comp) comp.style.display = 'block';
        }
    };

}); // end DOMContentLoaded
