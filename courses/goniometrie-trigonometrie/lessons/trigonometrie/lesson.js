/* Chapter 6: Trigonometrie */
document.addEventListener('DOMContentLoaded', function () {

    /* ======= NAVIGATION ======= */
    var sections = document.querySelectorAll('.lesson-section');
    var sidebarLinks = document.querySelectorAll('.sidebar-link');
    var progressFill = document.querySelector('.progress-fill-small');
    var visited = {};
    var visitedCount = 0;

    function showSection(id) {
        for (var i = 0; i < sections.length; i++) {
            if (sections[i].id === id) {
                sections[i].classList.add('active');
            } else {
                sections[i].classList.remove('active');
            }
        }
        for (var i = 0; i < sidebarLinks.length; i++) {
            var ds = sidebarLinks[i].getAttribute('data-section');
            if (ds) {
                if (ds === id) {
                    sidebarLinks[i].classList.add('active');
                } else {
                    sidebarLinks[i].classList.remove('active');
                }
            }
        }
        if (!visited[id]) {
            visited[id] = true;
            visitedCount++;
        }
        if (progressFill) {
            progressFill.style.width = Math.round(visitedCount / sections.length * 100) + '%';
        }
        var content = document.querySelector('.lesson-content');
        if (content) {
            if (typeof content.scrollTo === 'function') {
                content.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                content.scrollTop = 0;
            }
        }
        drawChartsForSection(id);
    }

    for (var i = 0; i < sidebarLinks.length; i++) {
        (function (link) {
            var ds = link.getAttribute('data-section');
            if (ds) {
                link.addEventListener('click', function (e) {
                    e.preventDefault();
                    showSection(ds);
                });
            }
        })(sidebarLinks[i]);
    }

    /* ======= COLLAPSIBLE SOLUTIONS ======= */
    var toggles = document.querySelectorAll('.solution-toggle');
    for (var i = 0; i < toggles.length; i++) {
        (function (btn) {
            btn.addEventListener('click', function () {
                var wrapper = btn.closest('.example-card');
                if (!wrapper) return;
                var steps = wrapper.querySelector('.solution-steps');
                if (!steps) return;
                var isOpen = steps.classList.contains('open');
                if (isOpen) {
                    steps.classList.remove('open');
                    btn.textContent = '\uD83D\uDC41 Zobrazit \u0159e\u0161en\u00ed';
                } else {
                    steps.classList.add('open');
                    btn.textContent = '\uD83D\uDD3D Skr\u00fdt \u0159e\u0161en\u00ed';
                }
            });
        })(toggles[i]);
    }

    /* ======= EXERCISES ======= */
    window.checkExercise = function (id, correct) {
        var radios = document.querySelectorAll('input[name="' + id + '"]');
        var chosen = null;
        for (var i = 0; i < radios.length; i++) {
            if (radios[i].checked) chosen = radios[i];
        }
        var fb = document.getElementById(id + 'Feedback');
        var st = document.getElementById(id + 'Status');
        if (!chosen) {
            if (fb) { fb.textContent = 'Vyberte odpov\u011b\u010f.'; fb.className = 'exercise-feedback wrong'; }
            return;
        }
        if (chosen.value === correct) {
            if (fb) { fb.textContent = '\u2705 Spr\u00e1vn\u011b!'; fb.className = 'exercise-feedback correct'; }
            if (st) st.textContent = '\u2705';
        } else {
            if (fb) { fb.textContent = '\u274C \u0160patn\u011b, zkuste to znovu.'; fb.className = 'exercise-feedback wrong'; }
            if (st) st.textContent = '\u274C';
        }
    };

    /* ======= CANVAS HELPERS ======= */
    function setupHiDPI(canvas) {
        var dpr = window.devicePixelRatio || 1;
        var rect = canvas.getBoundingClientRect();
        var w = rect.width;
        var h = rect.height;
        if (w === 0) w = 700;
        if (h === 0) h = 380;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        var ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        return { ctx: ctx, w: w, h: h };
    }

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function isDarkTheme() {
        return document.documentElement.getAttribute('data-theme') !== 'light';
    }

    function getColors() {
        var dark = isDarkTheme();
        return {
            bgTop: dark ? '#172135' : '#eef3ff',
            bgBottom: dark ? '#0b1220' : '#f8fafc',
            panel: dark ? 'rgba(15,23,42,0.75)' : 'rgba(255,255,255,0.86)',
            panelBorder: dark ? 'rgba(148,163,184,0.28)' : 'rgba(99,102,241,0.24)',
            grid: dark ? 'rgba(148,163,184,0.1)' : 'rgba(99,102,241,0.09)',
            axis: dark ? 'rgba(203,213,225,0.42)' : 'rgba(71,85,105,0.5)',
            axisLabel: dark ? 'rgba(203,213,225,0.72)' : 'rgba(71,85,105,0.8)',
            text: dark ? '#e2e8f0' : '#1e293b',
            textMuted: dark ? 'rgba(203,213,225,0.7)' : 'rgba(71,85,105,0.74)',
            sin: '#fb7185',
            sinGlow: 'rgba(251,113,133,0.38)',
            cos: '#60a5fa',
            cosGlow: 'rgba(96,165,250,0.38)',
            tan: '#fb923c',
            tanGlow: 'rgba(251,146,60,0.34)',
            green: '#34d399',
            greenGlow: 'rgba(52,211,153,0.36)',
            accent: '#818cf8',
            accentGlow: 'rgba(129,140,248,0.4)'
        };
    }

    function roundedRectPath(ctx, x, y, w, h, r) {
        var rr = Math.max(0, Math.min(r, w / 2, h / 2));
        ctx.beginPath();
        ctx.moveTo(x + rr, y);
        ctx.lineTo(x + w - rr, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
        ctx.lineTo(x + w, y + h - rr);
        ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
        ctx.lineTo(x + rr, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
        ctx.lineTo(x, y + rr);
        ctx.quadraticCurveTo(x, y, x + rr, y);
        ctx.closePath();
    }

    function drawCanvasBackdrop(ctx, w, h, c) {
        var grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, c.bgTop);
        grad.addColorStop(1, c.bgBottom);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.strokeStyle = c.grid;
        ctx.lineWidth = 1;
        var step = clamp(Math.round(w / 18), 26, 40);
        for (var x = step + 0.5; x < w; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (var y = step + 0.5; y < h; y += step) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawDot(ctx, px, py, color, glow, r) {
        ctx.save();
        ctx.shadowColor = glow;
        ctx.shadowBlur = 12;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, r || 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawChip(ctx, text, x, y, fg, bg, border) {
        ctx.save();
        ctx.font = '600 12px Inter';
        var padX = 8;
        var padY = 5;
        var tw = ctx.measureText(text).width;
        var bw = tw + padX * 2;
        var bh = 24;
        roundedRectPath(ctx, x - bw / 2, y - bh / 2, bw, bh, 8);
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.strokeStyle = border;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = fg;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y + 0.5);
        ctx.restore();
    }

    function drawSegmentLabel(ctx, p1, p2, text, color, c, offset) {
        var dx = p2.x - p1.x;
        var dy = p2.y - p1.y;
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        var nx = -dy / len;
        var ny = dx / len;
        var mx = (p1.x + p2.x) / 2 + nx * offset;
        var my = (p1.y + p2.y) / 2 + ny * offset;
        drawChip(ctx, text, mx, my, color, c.panel, c.panelBorder);
    }

    function drawInteriorAngle(ctx, v, p1, p2, radius, label, color) {
        var twoPi = Math.PI * 2;
        var a1 = Math.atan2(p1.y - v.y, p1.x - v.x);
        var a2 = Math.atan2(p2.y - v.y, p2.x - v.x);
        var cw = (a2 - a1 + twoPi) % twoPi;
        var ccw = (a1 - a2 + twoPi) % twoPi;
        var start, sweep;
        if (cw <= ccw) {
            start = a1;
            sweep = cw;
        } else {
            start = a2;
            sweep = ccw;
        }

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(v.x, v.y, radius, start, start + sweep, false);
        ctx.stroke();
        var mid = start + sweep / 2;
        ctx.fillStyle = color;
        ctx.font = '600 13px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, v.x + Math.cos(mid) * (radius + 12), v.y + Math.sin(mid) * (radius + 12));
        ctx.restore();
    }

    function drawFormulaPanel(ctx, x, y, w, h, title, lines, c) {
        roundedRectPath(ctx, x, y, w, h, 14);
        ctx.fillStyle = c.panel;
        ctx.fill();
        ctx.strokeStyle = c.panelBorder;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = c.textMuted;
        ctx.font = '600 11px Inter';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(title, x + 14, y + 12);

        ctx.fillStyle = c.text;
        ctx.font = '700 15px Inter';
        var lineY = y + 34;
        for (var i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], x + 14, lineY);
            lineY += 24;
        }
    }

    /* ======= CHART DRAWING ======= */
    function drawChartsForSection(id) {
        if (id === 'sine-rule') {
            drawSineRuleChart();
        }
        if (id === 'cosine-rule') {
            drawCosineRuleChart();
        }
    }

    /* --- Chart 1: Triangle + circumscribed circle --- */
    function drawSineRuleChart() {
        var canvas = document.getElementById('sineRuleCanvas');
        if (!canvas) return;
        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx, w = setup.w, h = setup.h;
        ctx.clearRect(0, 0, w * 3, h * 3);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        var c = getColors();
        drawCanvasBackdrop(ctx, w, h, c);

        var pad = clamp(w * 0.045, 16, 30);
        var compact = w < 620;
        var panelW = compact ? 0 : Math.min(250, w * 0.34);
        var drawX = pad;
        var drawY = pad;
        var drawW = w - pad * 2 - panelW - (compact ? 0 : pad * 0.9);
        var drawH = h - pad * 2 - (compact ? 42 : 0);

        var cx = drawX + drawW * 0.53;
        var cy = drawY + drawH * 0.5;
        var R = Math.min(drawW * 0.36, drawH * 0.4);
        R = clamp(R, 54, 150);

        var A = { x: cx + R * Math.cos(-Math.PI / 9), y: cy + R * Math.sin(-Math.PI / 9) };
        var B = { x: cx + R * Math.cos(Math.PI * 0.78), y: cy + R * Math.sin(Math.PI * 0.78) };
        var Cc = { x: cx + R * Math.cos(-Math.PI * 0.62), y: cy + R * Math.sin(-Math.PI * 0.62) };

        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = c.axis;
        ctx.lineWidth = 1;
        [A, B, Cc].forEach(function (p) {
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
        });
        ctx.restore();

        ctx.save();
        ctx.shadowColor = c.accentGlow;
        ctx.shadowBlur = 16;
        ctx.strokeStyle = c.accent;
        ctx.globalAlpha = 0.28;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.strokeStyle = c.axis;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.stroke();

        var fillGrad = ctx.createLinearGradient(B.x, B.y, A.x, A.y);
        fillGrad.addColorStop(0, 'rgba(96,165,250,0.08)');
        fillGrad.addColorStop(1, 'rgba(129,140,248,0.18)');
        ctx.fillStyle = fillGrad;
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);
        ctx.lineTo(Cc.x, Cc.y);
        ctx.closePath();
        ctx.fill();

        function strokeEdge(p1, p2, color, glow) {
            ctx.save();
            ctx.shadowColor = glow;
            ctx.shadowBlur = 8;
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.restore();
        }

        strokeEdge(B, Cc, c.sin, c.sinGlow);
        strokeEdge(Cc, A, c.green, c.greenGlow);
        strokeEdge(A, B, c.cos, c.cosGlow);

        drawSegmentLabel(ctx, B, Cc, 'a', c.sin, c, 15);
        drawSegmentLabel(ctx, Cc, A, 'b', c.green, c, 15);
        drawSegmentLabel(ctx, A, B, 'c', c.cos, c, 15);

        drawInteriorAngle(ctx, A, B, Cc, clamp(R * 0.17, 16, 25), 'α', c.sin);
        drawInteriorAngle(ctx, B, Cc, A, clamp(R * 0.17, 16, 25), 'β', c.green);
        drawInteriorAngle(ctx, Cc, A, B, clamp(R * 0.17, 16, 25), 'γ', c.accent);

        ctx.fillStyle = c.text;
        ctx.font = '700 15px Inter';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('A', A.x + 12, A.y - 10);
        ctx.fillText('B', B.x - 20, B.y - 8);
        ctx.fillText('C', Cc.x - 10, Cc.y + 18);

        drawDot(ctx, A.x, A.y, c.green, c.greenGlow, 5);
        drawDot(ctx, B.x, B.y, c.green, c.greenGlow, 5);
        drawDot(ctx, Cc.x, Cc.y, c.green, c.greenGlow, 5);

        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = c.axisLabel;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(A.x, A.y);
        ctx.stroke();
        ctx.restore();

        drawDot(ctx, cx, cy, c.axisLabel, 'rgba(203,213,225,0.24)', 3.2);
        ctx.fillStyle = c.axisLabel;
        ctx.font = '600 12px Inter';
        ctx.textAlign = 'left';
        ctx.fillText('R', (cx + A.x) / 2 + 8, (cy + A.y) / 2 - 8);
        ctx.fillText('O', cx + 8, cy - 8);

        if (compact) {
            var boxY = h - pad - 30;
            drawFormulaPanel(
                ctx,
                pad,
                boxY - 24,
                w - pad * 2,
                46,
                'Sinová věta',
                w < 430 ? ['a/sin α = b/sin β', '= c/sin γ = 2R'] : ['a/sin α = b/sin β = c/sin γ = 2R'],
                c
            );
        } else {
            var panelX = drawX + drawW + pad * 0.9;
            var panelY = drawY + 8;
            drawFormulaPanel(
                ctx,
                panelX,
                panelY,
                panelW,
                drawH - 16,
                'Sinová věta',
                ['a/sin α = b/sin β', '= c/sin γ = 2R'],
                c
            );
            drawChip(ctx, 'a ↔ α', panelX + panelW / 2, panelY + 96, c.sin, 'rgba(251,113,133,0.16)', c.panelBorder);
            drawChip(ctx, 'b ↔ β', panelX + panelW / 2, panelY + 126, c.green, 'rgba(52,211,153,0.16)', c.panelBorder);
            drawChip(ctx, 'c ↔ γ', panelX + panelW / 2, panelY + 156, c.cos, 'rgba(96,165,250,0.16)', c.panelBorder);
            ctx.fillStyle = c.textMuted;
            ctx.font = '500 11px Inter';
            ctx.textAlign = 'left';
            ctx.fillText('R je poloměr opsané kružnice.', panelX + 14, panelY + 192);
            ctx.fillText('Poměr strany ku sinu protilehlého', panelX + 14, panelY + 210);
            ctx.fillText('úhlu je v celém trojúhelníku stejný.', panelX + 14, panelY + 228);
        }
    }

    /* --- Chart 2: Cosine rule triangle --- */
    function drawCosineRuleChart() {
        var canvas = document.getElementById('cosineRuleCanvas');
        if (!canvas) return;
        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx, w = setup.w, h = setup.h;
        ctx.clearRect(0, 0, w * 3, h * 3);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        var c = getColors();
        drawCanvasBackdrop(ctx, w, h, c);

        var pad = clamp(w * 0.045, 16, 30);
        var compact = w < 640;
        var panelW = compact ? 0 : Math.min(265, w * 0.36);
        var drawX = pad;
        var drawY = pad;
        var drawW = w - pad * 2 - panelW - (compact ? 0 : pad * 0.9);
        var drawH = h - pad * 2 - (compact ? 44 : 0);

        var gamma = Math.PI * 0.34;
        var baseY = drawY + drawH * 0.78;
        var Cpt = { x: drawX + drawW * 0.13, y: baseY };
        var Bpt = { x: drawX + drawW * 0.9, y: baseY };
        var bLen = Math.min(drawW * 0.52, drawH * 0.66);
        var Apt = { x: Cpt.x + Math.cos(gamma) * bLen, y: Cpt.y - Math.sin(gamma) * bLen };

        ctx.strokeStyle = c.axis;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(drawX + 6, baseY);
        ctx.lineTo(drawX + drawW - 6, baseY);
        ctx.stroke();

        var triGrad = ctx.createLinearGradient(Cpt.x, Cpt.y, Apt.x, Apt.y);
        triGrad.addColorStop(0, 'rgba(52,211,153,0.08)');
        triGrad.addColorStop(1, 'rgba(129,140,248,0.16)');
        ctx.fillStyle = triGrad;
        ctx.beginPath();
        ctx.moveTo(Apt.x, Apt.y);
        ctx.lineTo(Bpt.x, Bpt.y);
        ctx.lineTo(Cpt.x, Cpt.y);
        ctx.closePath();
        ctx.fill();

        function strokeEdge(p1, p2, color, glow) {
            ctx.save();
            ctx.shadowColor = glow;
            ctx.shadowBlur = 8;
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.restore();
        }

        strokeEdge(Cpt, Bpt, c.cos, c.cosGlow);
        strokeEdge(Cpt, Apt, c.accent, c.accentGlow);
        strokeEdge(Apt, Bpt, c.sin, c.sinGlow);

        drawSegmentLabel(ctx, Cpt, Bpt, 'a', c.cos, c, 16);
        drawSegmentLabel(ctx, Cpt, Apt, 'b', c.accent, c, -14);
        drawSegmentLabel(ctx, Apt, Bpt, 'c', c.sin, c, -14);

        drawInteriorAngle(ctx, Cpt, Apt, Bpt, clamp(drawW * 0.06, 18, 28), 'γ', c.green);

        var foot = { x: Apt.x, y: baseY };
        ctx.save();
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = c.axisLabel;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(Apt.x, Apt.y);
        ctx.lineTo(foot.x, foot.y);
        ctx.stroke();
        ctx.restore();

        ctx.strokeStyle = c.axisLabel;
        ctx.lineWidth = 1;
        ctx.strokeRect(foot.x - 8, foot.y - 8, 8, 8);
        ctx.fillStyle = c.axisLabel;
        ctx.font = '600 12px Inter';
        ctx.textAlign = 'left';
        ctx.fillText('v', foot.x + 7, (Apt.y + foot.y) / 2);
        ctx.fillText('b cos γ', (Cpt.x + foot.x) / 2 - 14, foot.y + 16);

        ctx.fillStyle = c.text;
        ctx.font = '700 15px Inter';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('C', Cpt.x - 18, Cpt.y + 4);
        ctx.fillText('B', Bpt.x + 10, Bpt.y + 4);
        ctx.fillText('A', Apt.x - 6, Apt.y - 14);

        drawDot(ctx, Apt.x, Apt.y, c.green, c.greenGlow, 5);
        drawDot(ctx, Bpt.x, Bpt.y, c.green, c.greenGlow, 5);
        drawDot(ctx, Cpt.x, Cpt.y, c.green, c.greenGlow, 5);

        if (compact) {
            drawFormulaPanel(
                ctx,
                pad,
                h - pad - 54,
                w - pad * 2,
                46,
                'Kosinová věta',
                ['c² = a² + b² − 2ab · cos γ'],
                c
            );
        } else {
            var panelX = drawX + drawW + pad * 0.9;
            var panelY = drawY + 8;
            drawFormulaPanel(
                ctx,
                panelX,
                panelY,
                panelW,
                drawH - 16,
                'Kosinová věta',
                ['c² = a² + b² − 2ab · cos γ'],
                c
            );

            drawChip(ctx, 'γ = 90°  →  c² = a² + b²', panelX + panelW / 2, panelY + 88, c.cos, 'rgba(96,165,250,0.14)', c.panelBorder);
            drawChip(ctx, 'γ < 90°  →  c je menší', panelX + panelW / 2, panelY + 120, c.green, 'rgba(52,211,153,0.14)', c.panelBorder);
            drawChip(ctx, 'γ > 90°  →  c je větší', panelX + panelW / 2, panelY + 152, c.sin, 'rgba(251,113,133,0.14)', c.panelBorder);

            ctx.fillStyle = c.textMuted;
            ctx.font = '500 11px Inter';
            ctx.textAlign = 'left';
            ctx.fillText('Člen −2ab·cosγ je korekce oproti', panelX + 14, panelY + 188);
            ctx.fillText('Pythagorově větě pro obecný trojúhelník.', panelX + 14, panelY + 206);
        }
    }

    var resizeTimer = null;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            var active = document.querySelector('.lesson-section.active');
            if (active) drawChartsForSection(active.id);
        }, 120);
    });

    if (location.hash) {
        var id = location.hash.slice(1);
        if (document.getElementById(id)) showSection(id);
    }

    // Draw initial chart for default visible section
    drawChartsForSection('sine-rule');
});
