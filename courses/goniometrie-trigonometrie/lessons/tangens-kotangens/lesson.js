/* Chapter 3: Tangens a kotangens jako funkce – Lesson JS */
document.addEventListener('DOMContentLoaded', () => {

    /* ======= SECTION REDRAW CALLBACKS ======= */
    const sectionDrawCallbacks = {};

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
        const idx = Array.from(sections).findIndex(s => s.id === id);
        if (progressFill && sections.length) progressFill.style.width = ((idx + 1) / sections.length * 100) + '%';
        window.location.hash = id;
        // Use rAF + setTimeout to ensure browser has computed layout before drawing
        const redraw = () => { if (sectionDrawCallbacks[id]) sectionDrawCallbacks[id](); };
        requestAnimationFrame(() => { requestAnimationFrame(redraw); });
        setTimeout(redraw, 300);
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            showSection(link.dataset.section);
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
            if (parentW <= 0) {
                const rect = parent.getBoundingClientRect();
                parentW = rect.width;
            }
            parentW = Math.max(0, parentW - 24);
        }
        if (parentW <= 0) parentW = 700;
        const nomW = parseInt(canvas.getAttribute('width')) || 750;
        const nomH = parseInt(canvas.getAttribute('height')) || 350;
        const ratio = nomH / nomW;
        const w = Math.max(1, Math.min(nomW, parentW));
        const h = Math.round(w * ratio);
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        return { ctx, w, h, dpr };
    }

    function clearCanvas(ctx, w, h) { ctx.clearRect(0, 0, w * 3, h * 3); }

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
            cot: '#34d399', cotGlow: 'rgba(52,211,153,0.4)',
            accent: '#818cf8', accentGlow: 'rgba(129,140,248,0.4)',
            text: d ? '#e2e8f0' : '#1e293b',
            textMuted: d ? 'rgba(203,213,225,0.6)' : 'rgba(71,85,105,0.6)',
            asymptote: d ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.25)',
        };
    }

    function fillBg(ctx, w, h) {
        const c = getColors();
        const r = Math.max(w, h) * 0.7;
        if (r <= 0) return;
        const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, r);
        g.addColorStop(0, c.bgGrad);
        g.addColorStop(1, c.bg);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
    }

    function drawAxes(ctx, cx, cy, w, h, scaleX, scaleY, c, opts) {
        opts = opts || {};
        // Grid
        ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
        const xRange = Math.ceil((w - cx) / scaleX);
        const xStart = Math.floor(-cx / scaleX);
        for (let i = xStart; i <= xRange; i++) {
            const px = cx + i * scaleX;
            ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, h); ctx.stroke();
        }
        const yRange = Math.ceil((h - cy) / scaleY);
        const yStart = Math.floor(-cy / scaleY);
        for (let i = yStart; i <= yRange; i++) {
            const py = cy - i * scaleY;
            ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(w, py); ctx.stroke();
        }
        // Axes
        ctx.strokeStyle = c.axis; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
        // Labels
        ctx.fillStyle = c.axisLabel; ctx.font = '10px Inter'; ctx.textBaseline = 'top';
        if (!opts.noXLabels) {
            const piPositions = opts.piLabels || [-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2];
            const piNames = {
                '-2': '−2π', '-1.5': '−3π/2', '-1': '−π', '-0.5': '−π/2',
                '0.5': 'π/2', '1': 'π', '1.5': '3π/2', '2': '2π'
            };
            piPositions.forEach(p => {
                const px = cx + p * Math.PI * scaleX;
                if (px > 10 && px < w - 10) {
                    ctx.textAlign = 'center';
                    ctx.fillText(piNames['' + p] || '', px, cy + 5);
                }
            });
        }
    }

    function drawDot(ctx, px, py, color, r, label, glowColor) {
        ctx.save();
        if (glowColor) { ctx.shadowColor = glowColor; ctx.shadowBlur = 12; }
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(px, py, r || 5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        if (label) {
            ctx.fillStyle = color; ctx.font = 'bold 12px Inter';
            ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
            ctx.fillText(label, px, py - (r || 5) - 4);
        }
    }

    /* ======= SECTION 1: Unit circle tan/cot tracer ======= */
    (function initTracerDemo() {
        const canvas = document.getElementById('tracerCanvas');
        if (!canvas) return;
        const slider = document.getElementById('tracerSlider');
        const angleSpan = document.getElementById('tracerAngleVal');
        const radSpan = document.getElementById('tracerRadVal');
        const tanValSpan = document.getElementById('tracerTanVal');
        const cotValSpan = document.getElementById('tracerCotVal');
        const sinValSpan = document.getElementById('tracerSinVal');
        const cosValSpan = document.getElementById('tracerCosVal');

        function draw() {
            const { ctx, w, h } = setupHiDPI(canvas);
            if (w < 2) return;
            const c = getColors();
            clearCanvas(ctx, w, h);
            fillBg(ctx, w, h);

            const angle = parseFloat(slider.value);
            const rad = angle * Math.PI / 180;
            angleSpan.textContent = Math.round(angle);
            radSpan.textContent = rad.toFixed(2);

            const sinV = Math.sin(rad);
            const cosV = Math.cos(rad);
            const tanV = Math.abs(cosV) < 1e-10 ? null : sinV / cosV;
            const cotV = Math.abs(sinV) < 1e-10 ? null : cosV / sinV;

            sinValSpan.textContent = sinV.toFixed(3);
            cosValSpan.textContent = cosV.toFixed(3);
            tanValSpan.textContent = tanV !== null ? tanV.toFixed(3) : '—';
            cotValSpan.textContent = cotV !== null ? cotV.toFixed(3) : '—';

            // Layout
            const R = Math.round(Math.min(h * 0.38, w * 0.2, 140));
            const circCx = R + 40;
            const circCy = Math.round(h / 2);

            // Unit circle
            ctx.save();
            ctx.shadowColor = c.accentGlow; ctx.shadowBlur = 12;
            ctx.strokeStyle = c.accent; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(circCx, circCy, R, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();

            // Circle axes
            ctx.strokeStyle = c.axis; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(circCx - R - 10, circCy); ctx.lineTo(circCx + R + 40, circCy); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(circCx, circCy - R - 10); ctx.lineTo(circCx, circCy + R + 10); ctx.stroke();

            // Point on circle
            const cpx = circCx + R * cosV;
            const cpy = circCy - R * sinV;

            // Radius line
            ctx.strokeStyle = c.textMuted; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(circCx, circCy); ctx.lineTo(cpx, cpy); ctx.stroke();

            // Sin line (vertical, red)
            ctx.save(); ctx.strokeStyle = c.sin; ctx.lineWidth = 2.5;
            ctx.shadowColor = c.sinGlow; ctx.shadowBlur = 8;
            ctx.beginPath(); ctx.moveTo(cpx, circCy); ctx.lineTo(cpx, cpy); ctx.stroke();
            ctx.restore();

            // Cos line (horizontal, blue)
            ctx.save(); ctx.strokeStyle = c.cos; ctx.lineWidth = 2.5;
            ctx.shadowColor = c.cosGlow; ctx.shadowBlur = 8;
            ctx.beginPath(); ctx.moveTo(circCx, cpy); ctx.lineTo(cpx, cpy); ctx.stroke();
            ctx.restore();

            // Tangent line on vertical tangent at (1,0)
            const tanLineX = circCx + R; // x = 1 on circle
            if (tanV !== null) {
                const tanPy = circCy - tanV * R;
                const clampedTanPy = Math.max(5, Math.min(h - 5, tanPy));

                // Dashed line from point to tangent point
                ctx.save(); ctx.setLineDash([4, 4]);
                ctx.strokeStyle = c.tan; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(circCx, circCy); ctx.lineTo(tanLineX, clampedTanPy); ctx.stroke();
                ctx.setLineDash([]); ctx.restore();

                // Tangent segment (orange)
                ctx.save(); ctx.strokeStyle = c.tan; ctx.lineWidth = 3;
                ctx.shadowColor = c.tanGlow; ctx.shadowBlur = 8;
                ctx.beginPath(); ctx.moveTo(tanLineX, circCy); ctx.lineTo(tanLineX, clampedTanPy); ctx.stroke();
                ctx.restore();

                // Vertical tangent line (dashed)
                ctx.save(); ctx.setLineDash([3, 3]);
                ctx.strokeStyle = c.asymptote; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(tanLineX, 0); ctx.lineTo(tanLineX, h); ctx.stroke();
                ctx.setLineDash([]); ctx.restore();

                drawDot(ctx, tanLineX, clampedTanPy, c.tan, 4, '', c.tanGlow);

                // Label
                ctx.fillStyle = c.tan; ctx.font = 'bold 11px Inter';
                ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
                ctx.fillText('tg x', tanLineX + 8, clampedTanPy);
            }

            // Cotangent line on horizontal tangent at (0,1)
            const cotLineY = circCy - R; // y = 1 on circle
            if (cotV !== null) {
                const cotPx = circCx + cotV * R;
                const clampedCotPx = Math.max(5, Math.min(w - 5, cotPx));

                // Dashed line from origin to cot point
                ctx.save(); ctx.setLineDash([4, 4]);
                ctx.strokeStyle = c.cot; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(circCx, circCy); ctx.lineTo(clampedCotPx, cotLineY); ctx.stroke();
                ctx.setLineDash([]); ctx.restore();

                // Cotangent segment (green)
                ctx.save(); ctx.strokeStyle = c.cot; ctx.lineWidth = 3;
                ctx.shadowColor = c.cotGlow; ctx.shadowBlur = 8;
                ctx.beginPath(); ctx.moveTo(circCx, cotLineY); ctx.lineTo(clampedCotPx, cotLineY); ctx.stroke();
                ctx.restore();

                // Horizontal tangent line (dashed)
                ctx.save(); ctx.setLineDash([3, 3]);
                ctx.strokeStyle = 'rgba(52,211,153,0.25)'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(0, cotLineY); ctx.lineTo(w, cotLineY); ctx.stroke();
                ctx.setLineDash([]); ctx.restore();

                drawDot(ctx, clampedCotPx, cotLineY, c.cot, 4, '', c.cotGlow);

                ctx.fillStyle = c.cot; ctx.font = 'bold 11px Inter';
                ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
                ctx.fillText('cotg x', clampedCotPx, cotLineY - 8);
            }

            // Point on circle
            drawDot(ctx, cpx, cpy, c.accent, 6, '', c.accentGlow);

            // Axis labels
            ctx.fillStyle = c.textMuted; ctx.font = '9px Inter';
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillText('1', circCx + R, circCy + 5);
            ctx.fillText('−1', circCx - R, circCy + 5);
            ctx.textBaseline = 'bottom';
            ctx.fillText('1', circCx - 10, circCy - R - 1);

            // Angle arc
            if (R > 30) {
                ctx.strokeStyle = c.accent; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.arc(circCx, circCy, 20, 0, -rad, rad > 0);
                ctx.stroke();
            }

            // Legend (right side)
            const lx = w - 150;
            let ly = 20;
            ctx.font = 'bold 11px Inter'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
            ctx.fillStyle = c.sin; ctx.fillText('── sin x', lx, ly); ly += 16;
            ctx.fillStyle = c.cos; ctx.fillText('── cos x', lx, ly); ly += 16;
            ctx.fillStyle = c.tan; ctx.fillText('── tg x', lx, ly); ly += 16;
            ctx.fillStyle = c.cot; ctx.fillText('── cotg x', lx, ly);
        }

        slider.addEventListener('input', draw);
        sectionDrawCallbacks['intro'] = draw;
        window.addEventListener('resize', draw);
        draw();
    })();

    /* ======= SECTION 2: Graph demo (placeholder draw) ======= */
    (function initGraphDemo() {
        const canvas = document.getElementById('graphCanvas');
        if (!canvas) return;
        const slider = document.getElementById('graphSlider');
        const showTan = document.getElementById('graphShowTan');
        const showCot = document.getElementById('graphShowCot');
        const xValSpan = document.getElementById('graphXVal');
        const tanValSpan = document.getElementById('graphTanVal');
        const cotValSpan = document.getElementById('graphCotVal');

        function draw() {
            const { ctx, w, h } = setupHiDPI(canvas);
            if (w < 2) return;
            const c = getColors();
            clearCanvas(ctx, w, h);
            fillBg(ctx, w, h);

            const cx = w / 2, cy = h / 2;
            const scaleX = w / (3 * Math.PI);
            const scaleY = h / 8;

            drawAxes(ctx, cx, cy, w, h, scaleX, scaleY, c);

            const xVal = parseFloat(slider.value) / 100;
            xValSpan.textContent = xVal.toFixed(2);

            // Draw asymptotes for tan
            if (showTan.checked) {
                ctx.save(); ctx.setLineDash([5, 5]);
                ctx.strokeStyle = c.asymptote; ctx.lineWidth = 1;
                for (let k = -3; k <= 3; k++) {
                    const ax = cx + (k * Math.PI + Math.PI / 2) * scaleX;
                    if (ax > 0 && ax < w) {
                        ctx.beginPath(); ctx.moveTo(ax, 0); ctx.lineTo(ax, h); ctx.stroke();
                    }
                    const ax2 = cx + (k * Math.PI - Math.PI / 2) * scaleX;
                    if (ax2 > 0 && ax2 < w) {
                        ctx.beginPath(); ctx.moveTo(ax2, 0); ctx.lineTo(ax2, h); ctx.stroke();
                    }
                }
                ctx.setLineDash([]); ctx.restore();
            }

            // Draw asymptotes for cot
            if (showCot.checked) {
                ctx.save(); ctx.setLineDash([5, 5]);
                ctx.strokeStyle = 'rgba(52,211,153,0.25)'; ctx.lineWidth = 1;
                for (let k = -3; k <= 3; k++) {
                    const ax = cx + k * Math.PI * scaleX;
                    if (ax > 0 && ax < w && Math.abs(ax - cx) > 2) {
                        ctx.beginPath(); ctx.moveTo(ax, 0); ctx.lineTo(ax, h); ctx.stroke();
                    }
                }
                ctx.setLineDash([]); ctx.restore();
            }

            // Draw tan(x) curve
            if (showTan.checked) {
                ctx.save(); ctx.shadowColor = c.tanGlow; ctx.shadowBlur = 6;
                ctx.strokeStyle = c.tan; ctx.lineWidth = 2.5;
                ctx.beginPath();
                let drawing = false;
                for (let px = 0; px <= w; px++) {
                    const x = (px - cx) / scaleX;
                    const cosX = Math.cos(x);
                    if (Math.abs(cosX) < 0.01) { drawing = false; continue; }
                    const y = Math.tan(x);
                    const py = cy - y * scaleY;
                    if (py < -50 || py > h + 50) { drawing = false; continue; }
                    if (!drawing) { ctx.moveTo(px, py); drawing = true; }
                    else ctx.lineTo(px, py);
                }
                ctx.stroke(); ctx.restore();
            }

            // Draw cot(x) curve
            if (showCot.checked) {
                ctx.save(); ctx.shadowColor = c.cotGlow; ctx.shadowBlur = 6;
                ctx.strokeStyle = c.cot; ctx.lineWidth = 2.5;
                ctx.beginPath();
                let drawing = false;
                for (let px = 0; px <= w; px++) {
                    const x = (px - cx) / scaleX;
                    const sinX = Math.sin(x);
                    if (Math.abs(sinX) < 0.01) { drawing = false; continue; }
                    const y = Math.cos(x) / sinX;
                    const py = cy - y * scaleY;
                    if (py < -50 || py > h + 50) { drawing = false; continue; }
                    if (!drawing) { ctx.moveTo(px, py); drawing = true; }
                    else ctx.lineTo(px, py);
                }
                ctx.stroke(); ctx.restore();
            }

            // Dot on graph
            const dotX = cx + xVal * scaleX;
            const cosAtX = Math.cos(xVal);
            const sinAtX = Math.sin(xVal);
            if (showTan.checked && Math.abs(cosAtX) > 0.01) {
                const tVal = Math.tan(xVal);
                const dotY = cy - tVal * scaleY;
                if (dotY > 0 && dotY < h) drawDot(ctx, dotX, dotY, c.tan, 5, '', c.tanGlow);
                tanValSpan.textContent = tVal.toFixed(3);
            } else { tanValSpan.textContent = '—'; }
            if (showCot.checked && Math.abs(sinAtX) > 0.01) {
                const cVal = cosAtX / sinAtX;
                const dotY = cy - cVal * scaleY;
                if (dotY > 0 && dotY < h) drawDot(ctx, dotX, dotY, c.cot, 5, '', c.cotGlow);
                cotValSpan.textContent = cVal.toFixed(3);
            } else { cotValSpan.textContent = '—'; }

            // Vertical cursor line
            ctx.save(); ctx.setLineDash([3, 3]);
            ctx.strokeStyle = c.accent; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(dotX, 0); ctx.lineTo(dotX, h); ctx.stroke();
            ctx.setLineDash([]); ctx.restore();

            // Legend
            ctx.font = 'bold 11px Inter'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
            let ly = 12;
            if (showTan.checked) { ctx.fillStyle = c.tan; ctx.fillText('── tg x', 12, ly); ly += 16; }
            if (showCot.checked) { ctx.fillStyle = c.cot; ctx.fillText('── cotg x', 12, ly); }
        }

        slider.addEventListener('input', draw);
        showTan.addEventListener('change', draw);
        showCot.addEventListener('change', draw);
        sectionDrawCallbacks['graphs'] = draw;
        window.addEventListener('resize', draw);
        draw();
    })();

    /* ======= SECTION 3: Properties Explorer ======= */
    (function initPropsDemo() {
        const canvas = document.getElementById('propsCanvas');
        if (!canvas) return;
        const cbAsymptotes = document.getElementById('propAsymptotes');
        const cbZeros = document.getElementById('propZeros');
        const cbPeriod = document.getElementById('propPeriod');
        const cbMonotone = document.getElementById('propMonotone');
        const cbParity = document.getElementById('propParity');
        const cbTan = document.getElementById('propFuncTan');
        const cbCot = document.getElementById('propFuncCot');

        function draw() {
            const { ctx, w, h } = setupHiDPI(canvas);
            if (w < 2) return;
            const c = getColors();
            clearCanvas(ctx, w, h); fillBg(ctx, w, h);

            const cxC = w / 2, cyC = h / 2;
            const scX = w / (3 * Math.PI), scY = h / 8;
            drawAxes(ctx, cxC, cyC, w, h, scX, scY, c);

            // Draw asymptotes
            if (cbAsymptotes.checked) {
                ctx.save(); ctx.setLineDash([5, 5]); ctx.lineWidth = 1.5;
                if (cbTan.checked) {
                    ctx.strokeStyle = 'rgba(239,68,68,0.4)';
                    for (let k = -3; k <= 3; k++) {
                        const ax = cxC + (k + 0.5) * Math.PI * scX;
                        if (ax > 0 && ax < w) { ctx.beginPath(); ctx.moveTo(ax, 0); ctx.lineTo(ax, h); ctx.stroke(); }
                        const ax2 = cxC + (-k - 0.5) * Math.PI * scX;
                        if (ax2 > 0 && ax2 < w) { ctx.beginPath(); ctx.moveTo(ax2, 0); ctx.lineTo(ax2, h); ctx.stroke(); }
                    }
                }
                if (cbCot.checked) {
                    ctx.strokeStyle = 'rgba(52,211,153,0.35)';
                    for (let k = -3; k <= 3; k++) {
                        const ax = cxC + k * Math.PI * scX;
                        if (Math.abs(ax - cxC) > 2 && ax > 0 && ax < w) {
                            ctx.beginPath(); ctx.moveTo(ax, 0); ctx.lineTo(ax, h); ctx.stroke();
                        }
                    }
                }
                ctx.setLineDash([]); ctx.restore();
            }

            // Draw curves
            function drawCurve(fn, checkFn, color, glow) {
                ctx.save(); ctx.shadowColor = glow; ctx.shadowBlur = 6;
                ctx.strokeStyle = color; ctx.lineWidth = 2.5;
                ctx.beginPath(); let d = false;
                for (let px = 0; px <= w; px++) {
                    const x = (px - cxC) / scX;
                    if (Math.abs(checkFn(x)) < 0.01) { d = false; continue; }
                    const y = fn(x), py = cyC - y * scY;
                    if (py < -50 || py > h + 50) { d = false; continue; }
                    if (!d) { ctx.moveTo(px, py); d = true; } else ctx.lineTo(px, py);
                }
                ctx.stroke(); ctx.restore();
            }
            if (cbTan.checked) drawCurve(Math.tan, Math.cos, c.tan, c.tanGlow);
            if (cbCot.checked) drawCurve(x => Math.cos(x) / Math.sin(x), Math.sin, c.cot, c.cotGlow);

            // Zeros
            if (cbZeros.checked) {
                if (cbTan.checked) {
                    for (let k = -3; k <= 3; k++) {
                        const px = cxC + k * Math.PI * scX;
                        if (px > 5 && px < w - 5) drawDot(ctx, px, cyC, c.tan, 5, '', c.tanGlow);
                    }
                }
                if (cbCot.checked) {
                    for (let k = -3; k <= 3; k++) {
                        const px = cxC + (k + 0.5) * Math.PI * scX;
                        if (px > 5 && px < w - 5) drawDot(ctx, px, cyC, c.cot, 5, '', c.cotGlow);
                    }
                }
            }

            // Period
            if (cbPeriod.checked) {
                ctx.save();
                const p0 = cxC, p1 = cxC + Math.PI * scX;
                ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
                const arrY = h - 25;
                ctx.beginPath(); ctx.moveTo(p0, arrY); ctx.lineTo(p1, arrY); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(p0, arrY - 6); ctx.lineTo(p0, arrY + 6); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(p1, arrY - 6); ctx.lineTo(p1, arrY + 6); ctx.stroke();
                ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 12px Inter';
                ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
                ctx.fillText('T = π', (p0 + p1) / 2, arrY - 4);
                ctx.restore();
            }

            // Monotone
            if (cbMonotone.checked && cbTan.checked) {
                ctx.save();
                ctx.fillStyle = 'rgba(251,146,60,0.08)';
                const left = cxC - Math.PI / 2 * scX, right = cxC + Math.PI / 2 * scX;
                ctx.fillRect(left, 0, right - left, h);
                ctx.fillStyle = c.tan; ctx.font = 'bold 10px Inter';
                ctx.textAlign = 'center'; ctx.textBaseline = 'top';
                ctx.fillText('↑ rostoucí', (left + right) / 2, 8);
                ctx.restore();
            }

            // Parity
            if (cbParity.checked) {
                ctx.save();
                ctx.strokeStyle = c.accent; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
                // Both tan and cot are odd — show symmetry through origin
                const testX = Math.PI / 4;
                const testPx = cxC + testX * scX;
                const mirPx = cxC - testX * scX;
                if (cbTan.checked) {
                    const tv = Math.tan(testX), ty = cyC - tv * scY, my = cyC + tv * scY;
                    ctx.beginPath(); ctx.moveTo(testPx, ty); ctx.lineTo(mirPx, my); ctx.stroke();
                    drawDot(ctx, testPx, ty, c.tan, 4); drawDot(ctx, mirPx, my, c.tan, 4);
                    ctx.fillStyle = c.tan; ctx.font = '10px Inter'; ctx.textAlign = 'left';
                    ctx.fillText('tg(x)', testPx + 6, ty);
                    ctx.fillText('tg(−x) = −tg(x)', mirPx + 6, my);
                }
                ctx.setLineDash([]); ctx.restore();
            }
        }

        [cbAsymptotes, cbZeros, cbPeriod, cbMonotone, cbParity, cbTan, cbCot].forEach(el => el.addEventListener('change', draw));
        sectionDrawCallbacks['properties'] = draw;
        window.addEventListener('resize', draw);
        draw();
    })();

    /* ======= SECTION 4: Flashcards & Quiz ======= */
    (function initValuesSection() {
        const allValues = [
            { q: 'sin 0°', a: '0' }, { q: 'sin 30°', a: '1/2' }, { q: 'sin 45°', a: '√2/2' },
            { q: 'sin 60°', a: '√3/2' }, { q: 'sin 90°', a: '1' },
            { q: 'cos 0°', a: '1' }, { q: 'cos 30°', a: '√3/2' }, { q: 'cos 45°', a: '√2/2' },
            { q: 'cos 60°', a: '1/2' }, { q: 'cos 90°', a: '0' },
            { q: 'tg 0°', a: '0' }, { q: 'tg 30°', a: '√3/3' }, { q: 'tg 45°', a: '1' },
            { q: 'tg 60°', a: '√3' }, { q: 'tg 90°', a: '—' },
            { q: 'cotg 0°', a: '—' }, { q: 'cotg 30°', a: '√3' }, { q: 'cotg 45°', a: '1' },
            { q: 'cotg 60°', a: '√3/3' }, { q: 'cotg 90°', a: '0' },
        ];
        const grid = document.getElementById('flashcardGrid');
        const resetBtn = document.getElementById('resetCards');
        if (!grid) return;

        function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

        function buildCards() {
            grid.innerHTML = '';
            shuffle([...allValues]).forEach(v => {
                const card = document.createElement('div');
                card.className = 'flashcard';
                card.innerHTML = `<div class="fc-question">${v.q}</div><div class="fc-answer">${v.a}</div>`;
                card.addEventListener('click', () => card.classList.toggle('revealed'));
                grid.appendChild(card);
            });
        }
        buildCards();
        if (resetBtn) resetBtn.addEventListener('click', buildCards);

        // Quiz
        const quizQ = document.getElementById('quizQuestion');
        const quizOpts = document.getElementById('quizOptions');
        const quizScore = document.getElementById('quizScore');
        const quizNext = document.getElementById('quizNext');
        if (!quizQ) return;
        let score = 0, total = 0;
        const definedValues = allValues.filter(v => v.a !== '—');

        function newQuestion() {
            const item = definedValues[Math.floor(Math.random() * definedValues.length)];
            quizQ.textContent = item.q + ' = ?';
            const wrong = shuffle(definedValues.filter(v => v.a !== item.a)).slice(0, 3).map(v => v.a);
            const options = shuffle([item.a, ...wrong]);
            quizOpts.innerHTML = '';
            options.forEach(o => {
                const btn = document.createElement('button');
                btn.className = 'quiz-option'; btn.textContent = o;
                btn.addEventListener('click', () => {
                    total++;
                    quizOpts.querySelectorAll('.quiz-option').forEach(b => b.style.pointerEvents = 'none');
                    if (o === item.a) { btn.classList.add('correct-answer'); score++; }
                    else {
                        btn.classList.add('wrong-answer');
                        quizOpts.querySelectorAll('.quiz-option').forEach(b => { if (b.textContent === item.a) b.classList.add('correct-answer'); });
                    }
                    quizScore.textContent = `Skóre: ${score}/${total}`;
                });
                quizOpts.appendChild(btn);
            });
        }
        quizNext.addEventListener('click', newQuestion);
        newQuestion();
    })();

    /* ======= SECTION 5: Derivation demo ======= */
    (function initDerivationDemo() {
        const canvas = document.getElementById('derivationCanvas');
        if (!canvas) return;
        const info = document.getElementById('derivationInfo');
        let currentTriangle = '45';

        function draw() {
            const { ctx, w, h } = setupHiDPI(canvas);
            if (w < 2) return;
            const c = getColors();
            clearCanvas(ctx, w, h); fillBg(ctx, w, h);

            const triW = Math.min(w * 0.5, 300);
            const baseX = w / 2 - triW / 2;
            const baseY = h - 60;

            if (currentTriangle === '45') {
                const side = triW * 0.7;
                const ax = baseX, ay = baseY;
                const bx = baseX + side, by = baseY;
                const cx2 = baseX + side, cy2 = baseY - side;
                // Triangle
                ctx.strokeStyle = c.accent; ctx.lineWidth = 2.5;
                ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx2, cy2); ctx.closePath(); ctx.stroke();
                // Right angle marker
                ctx.strokeStyle = c.textMuted; ctx.lineWidth = 1;
                ctx.strokeRect(bx - 15, by - 15, 15, 15);
                // Labels
                ctx.fillStyle = c.text; ctx.font = 'bold 14px Inter';
                ctx.textAlign = 'center'; ctx.textBaseline = 'top';
                ctx.fillText('1', (ax + bx) / 2, ay + 8);
                ctx.textAlign = 'left';
                ctx.fillText('1', bx + 8, (by + cy2) / 2);
                ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
                ctx.fillText('√2', (ax + cx2) / 2 - 15, (ay + cy2) / 2);
                // Angle labels
                ctx.fillStyle = c.tan; ctx.font = 'bold 13px Inter';
                ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
                ctx.fillText('45°', ax + 8, ay - 5);
                ctx.fillText('45°', cx2 - 5, cy2 + 20);

                info.innerHTML = `
                    <div class="calc-step"><span>sin 45°</span><span class="calc-value" style="color:#f87171">= 1/√2 = √2/2</span></div>
                    <div class="calc-step"><span>cos 45°</span><span class="calc-value" style="color:#60a5fa">= 1/√2 = √2/2</span></div>
                    <div class="calc-step"><span><strong>tg 45°</strong></span><span class="calc-value" style="color:#fb923c">= sin/cos = 1</span></div>
                    <div class="calc-step"><span><strong>cotg 45°</strong></span><span class="calc-value" style="color:#34d399">= cos/sin = 1</span></div>`;
            } else {
                const shortSide = triW * 0.45;
                const longSide = shortSide * Math.sqrt(3);
                const ax = baseX, ay = baseY;
                const bx = baseX + longSide, by = baseY;
                const cx2 = baseX + longSide, cy2 = baseY - shortSide;
                ctx.strokeStyle = c.accent; ctx.lineWidth = 2.5;
                ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx2, cy2); ctx.closePath(); ctx.stroke();
                ctx.strokeStyle = c.textMuted; ctx.lineWidth = 1;
                ctx.strokeRect(bx - 15, by - 15, 15, 15);
                ctx.fillStyle = c.text; ctx.font = 'bold 14px Inter';
                ctx.textAlign = 'center'; ctx.textBaseline = 'top';
                ctx.fillText('√3', (ax + bx) / 2, ay + 8);
                ctx.textAlign = 'left';
                ctx.fillText('1', bx + 8, (by + cy2) / 2);
                ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
                ctx.fillText('2', (ax + cx2) / 2 - 15, (ay + cy2) / 2);
                ctx.fillStyle = c.tan; ctx.font = 'bold 13px Inter';
                ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
                ctx.fillText('30°', ax + 8, ay - 5);
                ctx.fillText('60°', cx2 - 5, cy2 + 20);

                info.innerHTML = `
                    <div class="calc-step"><span>sin 30° = 1/2</span><span class="calc-value" style="color:#fb923c"><strong>tg 30°</strong> = (1/2)/(√3/2) = 1/√3 = <strong>√3/3</strong></span></div>
                    <div class="calc-step"><span>sin 60° = √3/2</span><span class="calc-value" style="color:#fb923c"><strong>tg 60°</strong> = (√3/2)/(1/2) = <strong>√3</strong></span></div>
                    <div class="calc-step"><span>cotg 30°</span><span class="calc-value" style="color:#34d399">= 1/tg 30° = <strong>√3</strong></span></div>
                    <div class="calc-step"><span>cotg 60°</span><span class="calc-value" style="color:#34d399">= 1/tg 60° = <strong>√3/3</strong></span></div>`;
            }
        }

        document.querySelectorAll('[data-triangle]').forEach(btn => {
            btn.addEventListener('click', () => { currentTriangle = btn.dataset.triangle; draw(); });
        });
        sectionDrawCallbacks['derivation'] = draw;
        window.addEventListener('resize', draw);
        draw();
    })();

    /* ======= SECTION 6: tan/cot derivation from sin/cos ======= */
    (function initTanCotDerivation() {
        const out = document.getElementById('deriveOutput');
        if (!out) return;
        const data = {
            '0': { sin: '0', cos: '1', tan: '0 / 1 = 0', cot: '1 / 0 = —  (nedefinován)', tanR: '0', cotR: '—' },
            '30': { sin: '1/2', cos: '√3/2', tan: '(1/2) / (√3/2) = 1/√3 = √3/3', cot: '(√3/2) / (1/2) = √3', tanR: '√3/3', cotR: '√3' },
            '45': { sin: '√2/2', cos: '√2/2', tan: '(√2/2) / (√2/2) = 1', cot: '(√2/2) / (√2/2) = 1', tanR: '1', cotR: '1' },
            '60': { sin: '√3/2', cos: '1/2', tan: '(√3/2) / (1/2) = √3', cot: '(1/2) / (√3/2) = 1/√3 = √3/3', tanR: '√3', cotR: '√3/3' },
            '90': { sin: '1', cos: '0', tan: '1 / 0 = —  (nedefinován)', cot: '0 / 1 = 0', tanR: '—', cotR: '0' },
        };

        document.querySelectorAll('[data-derive-angle]').forEach(btn => {
            btn.addEventListener('click', () => {
                const a = btn.dataset.deriveAngle;
                const d = data[a];
                out.innerHTML = `
                    <div class="derivation-step active">
                        <span class="step-number">1</span><span class="step-title">Známe sin ${a}° a cos ${a}°</span>
                        <div class="step-content">sin ${a}° = <strong>${d.sin}</strong> &nbsp;&nbsp; cos ${a}° = <strong>${d.cos}</strong></div>
                    </div>
                    <div class="derivation-step active">
                        <span class="step-number">2</span><span class="step-title">Vypočítáme tg ${a}°</span>
                        <div class="step-content">tg ${a}° = sin ${a}° / cos ${a}° = <span class="step-formula" style="color:#fb923c">${d.tan}</span></div>
                    </div>
                    <div class="derivation-step active">
                        <span class="step-number">3</span><span class="step-title">Vypočítáme cotg ${a}°</span>
                        <div class="step-content">cotg ${a}° = cos ${a}° / sin ${a}° = <span class="step-formula" style="color:#34d399">${d.cot}</span></div>
                    </div>
                    <div class="derivation-step" style="border-color:rgba(251,146,60,0.4);background:rgba(251,146,60,0.05);">
                        <span class="step-title">✅ Výsledek: <strong style="color:#fb923c">tg ${a}° = ${d.tanR}</strong> &nbsp; <strong style="color:#34d399">cotg ${a}° = ${d.cotR}</strong></span>
                    </div>`;
            });
        });
    })();

    /* ======= SECTION 7: Playground ======= */
    (function initPlayground() {
        const canvas = document.getElementById('playgroundCanvas');
        if (!canvas) return;
        const angleSlider = document.getElementById('pgAngleSlider');
        const angleVal = document.getElementById('pgAngleVal');
        const cbSin = document.getElementById('pgShowSin');
        const cbCos = document.getElementById('pgShowCos');
        const cbTan = document.getElementById('pgShowTan');
        const cbCot = document.getElementById('pgShowCot');

        function draw() {
            const { ctx, w, h } = setupHiDPI(canvas);
            if (w < 2) return;
            const c = getColors();
            clearCanvas(ctx, w, h); fillBg(ctx, w, h);

            const angle = parseFloat(angleSlider.value);
            const rad = angle * Math.PI / 180;
            angleVal.textContent = Math.round(angle);

            const sinV = Math.sin(rad), cosV = Math.cos(rad);
            const R = Math.round(Math.min(h * 0.35, w * 0.15, 120));
            const circCx = R + 35, circCy = Math.round(h / 2);

            // Unit circle
            ctx.save(); ctx.shadowColor = c.accentGlow; ctx.shadowBlur = 10;
            ctx.strokeStyle = c.accent; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(circCx, circCy, R, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
            ctx.strokeStyle = c.axis; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(circCx - R - 8, circCy); ctx.lineTo(circCx + R + 8, circCy); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(circCx, circCy - R - 8); ctx.lineTo(circCx, circCy + R + 8); ctx.stroke();

            const cpx = circCx + R * cosV, cpy = circCy - R * sinV;
            ctx.strokeStyle = c.textMuted; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(circCx, circCy); ctx.lineTo(cpx, cpy); ctx.stroke();
            if (cbSin.checked) {
                ctx.strokeStyle = c.sin; ctx.lineWidth = 2.5;
                ctx.beginPath(); ctx.moveTo(cpx, circCy); ctx.lineTo(cpx, cpy); ctx.stroke();
            }
            if (cbCos.checked) {
                ctx.strokeStyle = c.cos; ctx.lineWidth = 2.5;
                ctx.beginPath(); ctx.moveTo(circCx, cpy); ctx.lineTo(cpx, cpy); ctx.stroke();
            }
            drawDot(ctx, cpx, cpy, c.accent, 5, '', c.accentGlow);

            // Graph area
            const graphLeft = circCx + R + 50;
            const graphRight = w - 15;
            const graphW = graphRight - graphLeft;
            const graphCx = graphLeft + graphW / 2;
            const graphCy = circCy;
            const gScaleX = graphW / (2.5 * Math.PI);
            const gScaleY = h / 8;

            // Graph axes
            ctx.strokeStyle = c.axis; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(graphLeft, graphCy); ctx.lineTo(graphRight, graphCy); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(graphCx, 0); ctx.lineTo(graphCx, h); ctx.stroke();
            ctx.fillStyle = c.axisLabel; ctx.font = '9px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            [[-1, '−π'], [-0.5, '−π/2'], [0.5, 'π/2'], [1, 'π']].forEach(([p, lbl]) => {
                const px = graphCx + p * Math.PI * gScaleX;
                if (px > graphLeft && px < graphRight) ctx.fillText(lbl, px, graphCy + 4);
            });

            // Curves
            function drawGraphCurve(fn, checkFn, color, glow) {
                ctx.save(); ctx.shadowColor = glow; ctx.shadowBlur = 5;
                ctx.strokeStyle = color; ctx.lineWidth = 2;
                ctx.beginPath(); let d = false;
                for (let px = graphLeft; px <= graphRight; px++) {
                    const x = (px - graphCx) / gScaleX;
                    if (Math.abs(checkFn(x)) < 0.02) { d = false; continue; }
                    const y = fn(x), py = graphCy - y * gScaleY;
                    if (py < -30 || py > h + 30) { d = false; continue; }
                    if (!d) { ctx.moveTo(px, py); d = true; } else ctx.lineTo(px, py);
                }
                ctx.stroke(); ctx.restore();
            }
            if (cbSin.checked) drawGraphCurve(Math.sin, () => 1, c.sin, c.sinGlow);
            if (cbCos.checked) drawGraphCurve(Math.cos, () => 1, c.cos, c.cosGlow);
            if (cbTan.checked) drawGraphCurve(Math.tan, Math.cos, c.tan, c.tanGlow);
            if (cbCot.checked) drawGraphCurve(x => Math.cos(x) / Math.sin(x), Math.sin, c.cot, c.cotGlow);

            // Current angle marker on graph
            const dotGX = graphCx + rad * gScaleX;
            if (dotGX > graphLeft && dotGX < graphRight) {
                ctx.save(); ctx.setLineDash([3, 3]); ctx.strokeStyle = c.accent; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(dotGX, 0); ctx.lineTo(dotGX, h); ctx.stroke();
                ctx.setLineDash([]); ctx.restore();

                if (cbSin.checked) drawDot(ctx, dotGX, graphCy - sinV * gScaleY, c.sin, 4);
                if (cbCos.checked) drawDot(ctx, dotGX, graphCy - cosV * gScaleY, c.cos, 4);
                if (cbTan.checked && Math.abs(cosV) > 0.02) {
                    const tv = sinV / cosV, tpy = graphCy - tv * gScaleY;
                    if (tpy > 0 && tpy < h) drawDot(ctx, dotGX, tpy, c.tan, 4);
                }
                if (cbCot.checked && Math.abs(sinV) > 0.02) {
                    const cv = cosV / sinV, cpy2 = graphCy - cv * gScaleY;
                    if (cpy2 > 0 && cpy2 < h) drawDot(ctx, dotGX, cpy2, c.cot, 4);
                }
            }
        }

        angleSlider.addEventListener('input', draw);
        [cbSin, cbCos, cbTan, cbCot].forEach(cb => cb.addEventListener('change', draw));
        sectionDrawCallbacks['playground'] = draw;
        window.addEventListener('resize', draw);
        draw();
    })();

    /* ======= EXERCISES ======= */
    window.checkExercise = function (exId, correct) {
        const ex = document.getElementById(exId);
        const feedback = document.getElementById(exId + 'Feedback');
        const status = document.getElementById(exId + 'Status');
        const selected = ex.querySelector(`input[name="${exId}"]:checked`);
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
        // Check if all done
        const allDone = document.querySelectorAll('.exercise-status');
        const solved = Array.from(allDone).filter(s => s.textContent === '✅').length;
        if (solved === allDone.length) {
            const comp = document.getElementById('lessonComplete');
            if (comp) comp.style.display = 'block';
        }
    };

}); // end DOMContentLoaded
