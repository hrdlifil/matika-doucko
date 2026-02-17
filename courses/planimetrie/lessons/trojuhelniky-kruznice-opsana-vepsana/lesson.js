
// Kapitola 2: Trojuhelniky, kruznice opsana a vepsana - interactive lesson

document.addEventListener('DOMContentLoaded', function () {
    var redrawBySection = {};

    initTriangleElementsDemo(redrawBySection);
    initIncircleDemo(redrawBySection);
    initCircumcircleDemo(redrawBySection);
    initCongruenceDemo(redrawBySection);
    initSimilarityDemo(redrawBySection);
    initSimilarityCriteriaDemo(redrawBySection);
    initExercises();
    initNavigation(redrawBySection);
});

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function distance(a, b) {
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function dot(a, b) {
    return a.x * b.x + a.y * b.y;
}

function cross(a, b) {
    return a.x * b.y - a.y * b.x;
}

function vector(from, to) {
    return { x: to.x - from.x, y: to.y - from.y };
}

function normalize(v) {
    var len = Math.sqrt(v.x * v.x + v.y * v.y);
    if (len < 1e-9) return { x: 1, y: 0 };
    return { x: v.x / len, y: v.y / len };
}

function midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function triangleArea(A, B, C) {
    return Math.abs(cross(vector(A, B), vector(A, C))) / 2;
}

function triangleAngles(A, B, C) {
    function ang(P, Q, R) {
        var u = normalize(vector(Q, P));
        var v = normalize(vector(Q, R));
        return Math.acos(clamp(dot(u, v), -1, 1)) * 180 / Math.PI;
    }
    return {
        A: ang(B, A, C),
        B: ang(A, B, C),
        C: ang(A, C, B)
    };
}

function triangleByControls(base, height, shift) {
    return {
        A: { x: -base / 2, y: 0 },
        B: { x: base / 2, y: 0 },
        C: { x: shift, y: height }
    };
}

function projectPointToLine(P, A, B) {
    var AB = vector(A, B);
    var AP = vector(A, P);
    var t = dot(AP, AB) / Math.max(dot(AB, AB), 1e-9);
    return {
        x: A.x + t * AB.x,
        y: A.y + t * AB.y,
        t: t
    };
}

function distancePointToLine(P, A, B) {
    var AB = vector(A, B);
    return Math.abs(cross(AB, vector(A, P))) / Math.max(distance(A, B), 1e-9);
}

function lineIntersection(P1, d1, P2, d2) {
    var den = cross(d1, d2);
    if (Math.abs(den) < 1e-9) return null;
    var t = cross(vector(P1, P2), d2) / den;
    return {
        x: P1.x + t * d1.x,
        y: P1.y + t * d1.y
    };
}

function incenter(A, B, C) {
    var a = distance(B, C);
    var b = distance(A, C);
    var c = distance(A, B);
    var sum = a + b + c;
    return {
        x: (a * A.x + b * B.x + c * C.x) / sum,
        y: (a * A.y + b * B.y + c * C.y) / sum
    };
}

function circumcenter(A, B, C) {
    var D = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
    if (Math.abs(D) < 1e-9) return null;

    var ux = ((A.x * A.x + A.y * A.y) * (B.y - C.y) +
        (B.x * B.x + B.y * B.y) * (C.y - A.y) +
        (C.x * C.x + C.y * C.y) * (A.y - B.y)) / D;

    var uy = ((A.x * A.x + A.y * A.y) * (C.x - B.x) +
        (B.x * B.x + B.y * B.y) * (A.x - C.x) +
        (C.x * C.x + C.y * C.y) * (B.x - A.x)) / D;

    return { x: ux, y: uy };
}

function setupHiDPI(canvas) {
    var dpr = window.devicePixelRatio || 1;
    var parent = canvas.parentElement;
    var nominalWidth = parseInt(canvas.getAttribute('width'), 10) || 700;
    var nominalHeight = parseInt(canvas.getAttribute('height'), 10) || 430;
    var ratio = nominalHeight / nominalWidth;

    var parentWidth = nominalWidth;
    if (parent) {
        var cw = parent.clientWidth;
        if (cw <= 0) {
            var rect = parent.getBoundingClientRect();
            cw = rect.width;
        }
        parentWidth = cw - 24;
    }
    if (parentWidth <= 0) parentWidth = nominalWidth;

    var width = Math.max(280, Math.min(nominalWidth, parentWidth));
    var height = Math.round(width * ratio);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: width, h: height };
}

function drawBackdrop(ctx, w, h) {
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#17253f');
    grad.addColorStop(1, '#0b1220');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(148,163,184,0.08)';
    ctx.lineWidth = 1;
    var step = clamp(Math.round(w / 24), 24, 36);

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
}

function roundedRect(ctx, x, y, w, h, r) {
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

function createPlane(x, y, w, h, xMin, xMax, yMin, yMax) {
    var sx = w / (xMax - xMin);
    var sy = h / (yMax - yMin);
    var scale = Math.min(sx, sy);

    var usedW = (xMax - xMin) * scale;
    var usedH = (yMax - yMin) * scale;
    var left = x + (w - usedW) / 2;
    var top = y + (h - usedH) / 2;
    var right = left + usedW;
    var bottom = top + usedH;

    return {
        xMin: xMin,
        xMax: xMax,
        yMin: yMin,
        yMax: yMax,
        scale: scale,
        left: left,
        right: right,
        top: top,
        bottom: bottom,
        cx: left - xMin * scale,
        cy: bottom + yMin * scale
    };
}

function toCanvas(plane, p) {
    return {
        x: plane.cx + p.x * plane.scale,
        y: plane.cy - p.y * plane.scale
    };
}

function drawPlaneGrid(ctx, plane) {
    roundedRect(ctx, plane.left - 1, plane.top - 1, (plane.right - plane.left) + 2, (plane.bottom - plane.top) + 2, 10);
    ctx.fillStyle = 'rgba(15,23,42,0.62)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(148,163,184,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.save();
    roundedRect(ctx, plane.left, plane.top, plane.right - plane.left, plane.bottom - plane.top, 9);
    ctx.clip();

    for (var x = Math.ceil(plane.xMin); x <= Math.floor(plane.xMax); x++) {
        var px = toCanvas(plane, { x: x, y: 0 }).x;
        ctx.strokeStyle = (x === 0) ? 'rgba(148,163,184,0.55)' : 'rgba(148,163,184,0.12)';
        ctx.lineWidth = (x === 0) ? 1.8 : 1;
        ctx.beginPath();
        ctx.moveTo(px, plane.top);
        ctx.lineTo(px, plane.bottom);
        ctx.stroke();
    }

    for (var y = Math.ceil(plane.yMin); y <= Math.floor(plane.yMax); y++) {
        var py = toCanvas(plane, { x: 0, y: y }).y;
        ctx.strokeStyle = (y === 0) ? 'rgba(148,163,184,0.55)' : 'rgba(148,163,184,0.12)';
        ctx.lineWidth = (y === 0) ? 1.8 : 1;
        ctx.beginPath();
        ctx.moveTo(plane.left, py);
        ctx.lineTo(plane.right, py);
        ctx.stroke();
    }

    ctx.restore();
}

function drawPoint(ctx, plane, point, color, label, radius) {
    var p = toCanvas(plane, point);
    var r = radius || 5.2;

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (label) {
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '700 12px Inter';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, p.x + 8, p.y - 10);
    }
}

function drawSegment(ctx, plane, a, b, color, width, dashed) {
    var A = toCanvas(plane, a);
    var B = toCanvas(plane, b);
    ctx.save();
    if (dashed) ctx.setLineDash([6, 4]);
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 2;
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.stroke();
    ctx.restore();
}

function drawInfiniteLine(ctx, plane, point, dir, color, width, dashed) {
    var p1 = { x: point.x - dir.x * 40, y: point.y - dir.y * 40 };
    var p2 = { x: point.x + dir.x * 40, y: point.y + dir.y * 40 };
    drawSegment(ctx, plane, p1, p2, color, width, dashed);
}

function drawTriangle(ctx, plane, A, B, C, stroke, fill, width) {
    ctx.beginPath();
    var a = toCanvas(plane, A);
    var b = toCanvas(plane, B);
    var c = toCanvas(plane, C);
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.closePath();
    ctx.fillStyle = fill || 'rgba(99,102,241,0.16)';
    ctx.fill();
    ctx.strokeStyle = stroke || '#a78bfa';
    ctx.lineWidth = width || 2.4;
    ctx.stroke();
}

function rotatePoint(p, deg) {
    var rad = deg * Math.PI / 180;
    var c = Math.cos(rad);
    var s = Math.sin(rad);
    return { x: p.x * c - p.y * s, y: p.x * s + p.y * c };
}

function transformTriangle(tri, scale, rotateDeg, shift) {
    function tx(p) {
        var q = { x: p.x * scale, y: p.y * scale };
        q = rotatePoint(q, rotateDeg);
        return { x: q.x + shift.x, y: q.y + shift.y };
    }
    return {
        A: tx(tri.A),
        B: tx(tri.B),
        C: tx(tri.C)
    };
}

function initNavigation(redrawBySection) {
    var sectionOrder = [
        'trojuhelniky-vyska-teznice-a-pricka',
        'kruznice-vepsana-a-jeji-konstrukce',
        'kruznice-opsana-a-jeji-konstrukce',
        'vety-o-shodnosti-trojuhelniku',
        'podobnost-trojuhelniku',
        'vety-o-podobnosti-trojuhelniku',
        'exercises'
    ];

    var sections = document.querySelectorAll('.lesson-section');
    var sidebarLinks = document.querySelectorAll('.sidebar-link[data-section]');
    var nextButtons = document.querySelectorAll('.btn-next');
    var prevButtons = document.querySelectorAll('.btn-prev');
    var progressFill = document.querySelector('.progress-fill-small');

    function showSection(id, updateHash, smoothScroll) {
        sections.forEach(function (section) {
            section.classList.toggle('active', section.id === id);
        });

        sidebarLinks.forEach(function (link) {
            link.classList.toggle('active', link.getAttribute('data-section') === id);
        });

        var index = sectionOrder.indexOf(id);
        if (index >= 0 && progressFill) {
            progressFill.style.width = Math.round(((index + 1) / sectionOrder.length) * 100) + '%';
        }

        if (updateHash !== false) {
            window.history.replaceState(null, '', '#' + id);
        }

        var content = document.querySelector('.lesson-content');
        if (content && smoothScroll !== false) {
            if (typeof content.scrollTo === 'function') {
                content.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                content.scrollTop = 0;
            }
        }

        window.requestAnimationFrame(function () {
            if (redrawBySection[id]) redrawBySection[id]();
        });
    }

    sidebarLinks.forEach(function (link) {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            showSection(link.getAttribute('data-section'), true, true);
        });
    });

    nextButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            showSection(button.getAttribute('data-next'), true, true);
        });
    });

    prevButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            showSection(button.getAttribute('data-prev'), true, true);
        });
    });

    var initial = window.location.hash ? window.location.hash.slice(1) : '';
    if (sectionOrder.indexOf(initial) >= 0) {
        showSection(initial, false, false);
    } else {
        showSection(sectionOrder[0], false, false);
    }

    var resizeTimer = null;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            var active = document.querySelector('.lesson-section.active');
            if (active && redrawBySection[active.id]) {
                redrawBySection[active.id]();
            }
        }, 120);
    });
}
function initTriangleElementsDemo(redrawBySection) {
    var sectionId = 'trojuhelniky-vyska-teznice-a-pricka';
    var canvas = document.getElementById('triangleElementsCanvas');
    if (!canvas) return;

    var baseSlider = document.getElementById('triBaseSlider');
    var heightSlider = document.getElementById('triHeightSlider');
    var shiftSlider = document.getElementById('triShiftSlider');

    var showAltitude = document.getElementById('showAltitude');
    var showMedian = document.getElementById('showMedian');
    var showMidsegment = document.getElementById('showMidsegment');

    var baseValue = document.getElementById('triBaseValue');
    var heightValue = document.getElementById('triHeightValue');
    var shiftValue = document.getElementById('triShiftValue');

    var sideCValue = document.getElementById('sideCValue');
    var altitudeLengthValue = document.getElementById('altitudeLengthValue');
    var medianLengthValue = document.getElementById('medianLengthValue');
    var midsegmentRatioValue = document.getElementById('midsegmentRatioValue');
    var midsegmentParallelState = document.getElementById('midsegmentParallelState');

    var resetBtn = document.getElementById('resetTriangleElements');

    function draw() {
        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);
        var plane = createPlane(14, 14, w - 28, h - 28, -8, 8, -2.5, 9);
        drawPlaneGrid(ctx, plane);

        var base = parseFloat(baseSlider.value);
        var height = parseFloat(heightSlider.value);
        var shift = parseFloat(shiftSlider.value);
        var tri = triangleByControls(base, height, shift);
        var A = tri.A, B = tri.B, C = tri.C;

        drawTriangle(ctx, plane, A, B, C, '#a78bfa', 'rgba(99,102,241,0.16)', 2.5);

        var H = projectPointToLine(C, A, B);
        var M = midpoint(A, B);
        var N1 = midpoint(A, C);
        var N2 = midpoint(B, C);

        if (showAltitude.checked) {
            drawSegment(ctx, plane, C, H, '#f87171', 2.2, true);
            drawPoint(ctx, plane, H, '#f87171', 'H', 4.2);
        }
        if (showMedian.checked) {
            drawSegment(ctx, plane, C, M, '#34d399', 2.2, true);
            drawPoint(ctx, plane, M, '#34d399', 'M', 4.2);
        }
        if (showMidsegment.checked) {
            drawSegment(ctx, plane, N1, N2, '#fbbf24', 2.5, false);
            drawPoint(ctx, plane, N1, '#fbbf24', 'N', 4.2);
            drawPoint(ctx, plane, N2, '#fbbf24', 'P', 4.2);
        }

        drawPoint(ctx, plane, A, '#f8fafc', 'A', 4.8);
        drawPoint(ctx, plane, B, '#f8fafc', 'B', 4.8);
        drawPoint(ctx, plane, C, '#f8fafc', 'C', 4.8);

        var c = distance(A, B);
        var alt = distance(C, H);
        var med = distance(C, M);
        var mid = distance(N1, N2);

        var AB = normalize(vector(A, B));
        var MN = normalize(vector(N1, N2));
        var parallel = Math.abs(cross(AB, MN)) < 0.02;

        baseValue.textContent = base.toFixed(1);
        heightValue.textContent = height.toFixed(1);
        shiftValue.textContent = shift.toFixed(1);

        sideCValue.textContent = c.toFixed(3);
        altitudeLengthValue.textContent = alt.toFixed(3);
        medianLengthValue.textContent = med.toFixed(3);
        midsegmentRatioValue.textContent = (mid / Math.max(c, 1e-9)).toFixed(3);

        midsegmentParallelState.classList.remove('equal', 'different');
        if (parallel) {
            midsegmentParallelState.textContent = 'ano';
            midsegmentParallelState.classList.add('equal');
        } else {
            midsegmentParallelState.textContent = 'ne';
            midsegmentParallelState.classList.add('different');
        }
    }

    [baseSlider, heightSlider, shiftSlider, showAltitude, showMedian, showMidsegment].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    resetBtn.addEventListener('click', function () {
        baseSlider.value = '7';
        heightSlider.value = '5.2';
        shiftSlider.value = '0.8';
        showAltitude.checked = true;
        showMedian.checked = true;
        showMidsegment.checked = true;
        draw();
    });

    redrawBySection[sectionId] = draw;
    draw();
}

function initIncircleDemo(redrawBySection) {
    var sectionId = 'kruznice-vepsana-a-jeji-konstrukce';
    var canvas = document.getElementById('incircleCanvas');
    if (!canvas) return;

    var baseSlider = document.getElementById('inBaseSlider');
    var heightSlider = document.getElementById('inHeightSlider');
    var shiftSlider = document.getElementById('inShiftSlider');

    var showBisectors = document.getElementById('showBisectorsIncircle');
    var showRadius = document.getElementById('showRadiusIncircle');

    var baseValue = document.getElementById('inBaseValue');
    var heightValue = document.getElementById('inHeightValue');
    var shiftValue = document.getElementById('inShiftValue');

    var incenterCoordValue = document.getElementById('incenterCoordValue');
    var inRadiusValue = document.getElementById('inRadiusValue');
    var semiperimeterValue = document.getElementById('semiperimeterValue');
    var triangleAreaInValue = document.getElementById('triangleAreaInValue');
    var rTimesSValue = document.getElementById('rTimesSValue');

    var resetBtn = document.getElementById('resetIncircle');

    function draw() {
        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);
        var plane = createPlane(14, 14, w - 28, h - 28, -8, 8, -2.5, 9);
        drawPlaneGrid(ctx, plane);

        var base = parseFloat(baseSlider.value);
        var height = parseFloat(heightSlider.value);
        var shift = parseFloat(shiftSlider.value);
        var tri = triangleByControls(base, height, shift);
        var A = tri.A, B = tri.B, C = tri.C;

        drawTriangle(ctx, plane, A, B, C, '#34d399', 'rgba(52,211,153,0.15)', 2.5);

        var I = incenter(A, B, C);
        var r = distancePointToLine(I, A, B);

        var cA = toCanvas(plane, I);
        ctx.save();
        ctx.strokeStyle = 'rgba(52,211,153,0.95)';
        ctx.lineWidth = 1.9;
        ctx.beginPath();
        ctx.arc(cA.x, cA.y, r * plane.scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        if (showBisectors.checked) {
            var bisA = normalize({
                x: normalize(vector(A, B)).x + normalize(vector(A, C)).x,
                y: normalize(vector(A, B)).y + normalize(vector(A, C)).y
            });
            var bisB = normalize({
                x: normalize(vector(B, A)).x + normalize(vector(B, C)).x,
                y: normalize(vector(B, A)).y + normalize(vector(B, C)).y
            });
            drawInfiniteLine(ctx, plane, A, bisA, 'rgba(125,211,252,0.78)', 1.8, true);
            drawInfiniteLine(ctx, plane, B, bisB, 'rgba(125,211,252,0.78)', 1.8, true);
        }

        if (showRadius.checked) {
            var T = projectPointToLine(I, A, B);
            drawSegment(ctx, plane, I, T, '#fbbf24', 2.2, true);
            drawPoint(ctx, plane, T, '#fbbf24', 'T', 4.1);
        }

        drawPoint(ctx, plane, A, '#f8fafc', 'A', 4.8);
        drawPoint(ctx, plane, B, '#f8fafc', 'B', 4.8);
        drawPoint(ctx, plane, C, '#f8fafc', 'C', 4.8);
        drawPoint(ctx, plane, I, '#60a5fa', 'I', 4.6);

        var a = distance(B, C);
        var b = distance(A, C);
        var c = distance(A, B);
        var s = (a + b + c) / 2;
        var area = triangleArea(A, B, C);

        baseValue.textContent = base.toFixed(1);
        heightValue.textContent = height.toFixed(1);
        shiftValue.textContent = shift.toFixed(1);

        incenterCoordValue.textContent = '(' + I.x.toFixed(2) + ', ' + I.y.toFixed(2) + ')';
        inRadiusValue.textContent = r.toFixed(3);
        semiperimeterValue.textContent = s.toFixed(3);
        triangleAreaInValue.textContent = area.toFixed(3);
        rTimesSValue.textContent = (r * s).toFixed(3);
    }

    [baseSlider, heightSlider, shiftSlider, showBisectors, showRadius].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    resetBtn.addEventListener('click', function () {
        baseSlider.value = '7';
        heightSlider.value = '5';
        shiftSlider.value = '0.3';
        showBisectors.checked = true;
        showRadius.checked = true;
        draw();
    });

    redrawBySection[sectionId] = draw;
    draw();
}

function triangleTypeByAngles(ang) {
    var eps = 0.5;
    if (Math.abs(ang.A - 90) < eps || Math.abs(ang.B - 90) < eps || Math.abs(ang.C - 90) < eps) {
        return 'pravoúhlý';
    }
    if (ang.A > 90 + eps || ang.B > 90 + eps || ang.C > 90 + eps) {
        return 'tupoúhlý';
    }
    return 'ostroúhlý';
}

function initCircumcircleDemo(redrawBySection) {
    var sectionId = 'kruznice-opsana-a-jeji-konstrukce';
    var canvas = document.getElementById('circumcircleCanvas');
    if (!canvas) return;

    var baseSlider = document.getElementById('outBaseSlider');
    var heightSlider = document.getElementById('outHeightSlider');
    var shiftSlider = document.getElementById('outShiftSlider');
    var showBisectors = document.getElementById('showPerpBisectors');
    var showRadii = document.getElementById('showRadiiCircum');

    var baseValue = document.getElementById('outBaseValue');
    var heightValue = document.getElementById('outHeightValue');
    var shiftValue = document.getElementById('outShiftValue');

    var circumcenterCoordValue = document.getElementById('circumcenterCoordValue');
    var circumRadiusValue = document.getElementById('circumRadiusValue');
    var oaObOcValue = document.getElementById('oaObOcValue');
    var circumTypeValue = document.getElementById('circumTypeValue');

    var resetBtn = document.getElementById('resetCircum');

    function draw() {
        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);
        var plane = createPlane(14, 14, w - 28, h - 28, -9, 9, -4.5, 9);
        drawPlaneGrid(ctx, plane);

        var base = parseFloat(baseSlider.value);
        var height = parseFloat(heightSlider.value);
        var shift = parseFloat(shiftSlider.value);
        var tri = triangleByControls(base, height, shift);
        var A = tri.A, B = tri.B, C = tri.C;

        drawTriangle(ctx, plane, A, B, C, '#60a5fa', 'rgba(96,165,250,0.15)', 2.5);

        var O = circumcenter(A, B, C);
        if (!O) return;
        var R = distance(O, A);

        var oPx = toCanvas(plane, O);
        ctx.save();
        ctx.strokeStyle = 'rgba(96,165,250,0.95)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(oPx.x, oPx.y, R * plane.scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        if (showBisectors.checked) {
            var M1 = midpoint(A, B);
            var M2 = midpoint(B, C);
            var dAB = normalize({ x: -(B.y - A.y), y: (B.x - A.x) });
            var dBC = normalize({ x: -(C.y - B.y), y: (C.x - B.x) });
            drawInfiniteLine(ctx, plane, M1, dAB, 'rgba(244,114,182,0.85)', 1.8, true);
            drawInfiniteLine(ctx, plane, M2, dBC, 'rgba(244,114,182,0.85)', 1.8, true);
        }

        if (showRadii.checked) {
            drawSegment(ctx, plane, O, A, '#fbbf24', 1.8, true);
            drawSegment(ctx, plane, O, B, '#fbbf24', 1.8, true);
            drawSegment(ctx, plane, O, C, '#fbbf24', 1.8, true);
        }

        drawPoint(ctx, plane, A, '#f8fafc', 'A', 4.8);
        drawPoint(ctx, plane, B, '#f8fafc', 'B', 4.8);
        drawPoint(ctx, plane, C, '#f8fafc', 'C', 4.8);
        drawPoint(ctx, plane, O, '#34d399', 'O', 4.6);

        var OA = distance(O, A);
        var OB = distance(O, B);
        var OC = distance(O, C);

        var ang = triangleAngles(A, B, C);
        var type = triangleTypeByAngles(ang);

        baseValue.textContent = base.toFixed(1);
        heightValue.textContent = height.toFixed(1);
        shiftValue.textContent = shift.toFixed(1);

        circumcenterCoordValue.textContent = '(' + O.x.toFixed(2) + ', ' + O.y.toFixed(2) + ')';
        circumRadiusValue.textContent = R.toFixed(3);
        oaObOcValue.textContent = OA.toFixed(3) + ' / ' + OB.toFixed(3) + ' / ' + OC.toFixed(3);

        circumTypeValue.classList.remove('equal', 'different');
        if (type === 'ostroúhlý') {
            circumTypeValue.textContent = 'uvnitř trojúhelníku';
            circumTypeValue.classList.add('equal');
        } else if (type === 'pravoúhlý') {
            circumTypeValue.textContent = 'na středu přepony';
            circumTypeValue.classList.add('different');
        } else {
            circumTypeValue.textContent = 'vně trojúhelníku';
            circumTypeValue.classList.add('different');
        }
    }

    [baseSlider, heightSlider, shiftSlider, showBisectors, showRadii].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    resetBtn.addEventListener('click', function () {
        baseSlider.value = '7';
        heightSlider.value = '5.6';
        shiftSlider.value = '-0.5';
        showBisectors.checked = true;
        showRadii.checked = true;
        draw();
    });

    redrawBySection[sectionId] = draw;
    draw();
}
function triangleMetrics(tri) {
    var A = tri.A, B = tri.B, C = tri.C;
    var AB = distance(A, B);
    var BC = distance(B, C);
    var CA = distance(C, A);
    var ang = triangleAngles(A, B, C);
    return {
        AB: AB,
        BC: BC,
        CA: CA,
        A: ang.A,
        B: ang.B,
        C: ang.C,
        area: triangleArea(A, B, C)
    };
}

function approx(a, b, eps) {
    return Math.abs(a - b) <= (eps || 0.02);
}

function initCongruenceDemo(redrawBySection) {
    var sectionId = 'vety-o-shodnosti-trojuhelniku';
    var canvas = document.getElementById('congruenceCanvas');
    if (!canvas) return;

    var criterionSelect = document.getElementById('congruenceCriterionSelect');
    var rotationSlider = document.getElementById('congruenceRotationSlider');
    var mismatchSlider = document.getElementById('congruenceMismatchSlider');

    var rotationValue = document.getElementById('congruenceRotationValue');
    var mismatchValue = document.getElementById('congruenceMismatchValue');

    var givenValue = document.getElementById('congruenceGivenValue');
    var dataValue = document.getElementById('congruenceDataValue');
    var checkValue = document.getElementById('congruenceCheckValue');
    var reasonValue = document.getElementById('congruenceReasonValue');

    var resetBtn = document.getElementById('resetCongruence');

    function localSecondTriangle(criterion, mismatch) {
        var A = { x: -2.5, y: 0 };
        var B = { x: 2.8, y: 0 };
        var C = { x: -0.6, y: 3.9 };
        var m = mismatch / 100;

        if (criterion === 'sus') {
            var AC = vector(A, C);
            var dir = normalize(AC);
            var newLen = distance(A, C) * (1 + m);
            C = { x: A.x + dir.x * newLen, y: A.y + dir.y * newLen };
        } else if (criterion === 'sss' || criterion === 'usu') {
            var s = 1 + m;
            A = { x: A.x * s, y: A.y * s };
            B = { x: B.x * s, y: B.y * s };
            C = { x: C.x * s, y: C.y * s };
        }

        return { A: A, B: B, C: C };
    }

    function draw() {
        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);

        var leftPlane = createPlane(12, 12, (w - 36) / 2, h - 24, -7, 7, -4.5, 7);
        var rightPlane = createPlane(24 + (w - 36) / 2, 12, (w - 36) / 2, h - 24, -7, 7, -4.5, 7);

        drawPlaneGrid(ctx, leftPlane);
        drawPlaneGrid(ctx, rightPlane);

        var criterion = criterionSelect.value;
        var rot = parseFloat(rotationSlider.value);
        var mismatch = parseFloat(mismatchSlider.value);

        var T1 = {
            A: { x: -2.5, y: 0 },
            B: { x: 2.8, y: 0 },
            C: { x: -0.6, y: 3.9 }
        };
        var T2Local = localSecondTriangle(criterion, mismatch);
        var T2 = transformTriangle(T2Local, 1, rot, { x: 0, y: 0 });

        drawTriangle(ctx, leftPlane, T1.A, T1.B, T1.C, '#f59e0b', 'rgba(245,158,11,0.14)', 2.5);
        drawTriangle(ctx, rightPlane, T2.A, T2.B, T2.C, '#34d399', 'rgba(52,211,153,0.14)', 2.5);

        drawPoint(ctx, leftPlane, T1.A, '#f8fafc', 'A', 4.7);
        drawPoint(ctx, leftPlane, T1.B, '#f8fafc', 'B', 4.7);
        drawPoint(ctx, leftPlane, T1.C, '#f8fafc', 'C', 4.7);

        drawPoint(ctx, rightPlane, T2.A, '#f8fafc', "A'", 4.7);
        drawPoint(ctx, rightPlane, T2.B, '#f8fafc', "B'", 4.7);
        drawPoint(ctx, rightPlane, T2.C, '#f8fafc', "C'", 4.7);

        var M1 = triangleMetrics(T1);
        var M2 = triangleMetrics(T2);

        var epsLen = 0.08;
        var epsAng = 0.7;

        var sss = approx(M1.AB, M2.AB, epsLen) && approx(M1.BC, M2.BC, epsLen) && approx(M1.CA, M2.CA, epsLen);
        var sus = approx(M1.AB, M2.AB, epsLen) && approx(M1.CA, M2.CA, epsLen) && approx(M1.A, M2.A, epsAng);
        var usu = approx(M1.A, M2.A, epsAng) && approx(M1.B, M2.B, epsAng) && approx(M1.AB, M2.AB, epsLen);

        var ok = false;
        if (criterion === 'sss') ok = sss;
        if (criterion === 'sus') ok = sus;
        if (criterion === 'usu') ok = usu;

        var reason;
        var data;
        if (criterion === 'sss') {
            reason = '|AB|=' + M1.AB.toFixed(2) + ' vs ' + M2.AB.toFixed(2) + ', |BC|=' + M1.BC.toFixed(2) + ' vs ' + M2.BC.toFixed(2);
            data = '|AB|, |BC|, |CA|';
        } else if (criterion === 'sus') {
            reason = '|AB|=' + M1.AB.toFixed(2) + ' vs ' + M2.AB.toFixed(2) + ', ∠A=' + M1.A.toFixed(1) + '° vs ' + M2.A.toFixed(1) + '°';
            data = '|AB|, |AC|, ∠A';
        } else {
            reason = '∠A=' + M1.A.toFixed(1) + '° vs ' + M2.A.toFixed(1) + '°, ∠B=' + M1.B.toFixed(1) + '° vs ' + M2.B.toFixed(1) + '°';
            data = '∠A, ∠B, |AB|';
        }

        rotationValue.textContent = Math.round(rot) + '°';
        mismatchValue.textContent = Math.round(mismatch) + '%';

        givenValue.textContent = criterion.toUpperCase();
        dataValue.textContent = data;
        reasonValue.textContent = reason;

        checkValue.classList.remove('equal', 'different');
        if (ok) {
            checkValue.textContent = 'shodné';
            checkValue.classList.add('equal');
        } else {
            checkValue.textContent = 'neshodné';
            checkValue.classList.add('different');
        }
    }

    [criterionSelect, rotationSlider, mismatchSlider].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    resetBtn.addEventListener('click', function () {
        criterionSelect.value = 'sss';
        rotationSlider.value = '20';
        mismatchSlider.value = '0';
        draw();
    });

    redrawBySection[sectionId] = draw;
    draw();
}

function initSimilarityDemo(redrawBySection) {
    var sectionId = 'podobnost-trojuhelniku';
    var canvas = document.getElementById('similarityCanvas');
    if (!canvas) return;

    var scaleSlider = document.getElementById('simScaleSlider');
    var rotationSlider = document.getElementById('simRotationSlider');
    var shiftSlider = document.getElementById('simShiftSlider');

    var scaleValue = document.getElementById('simScaleValue');
    var rotationValue = document.getElementById('simRotationValue');
    var shiftValue = document.getElementById('simShiftValue');

    var ratioABValue = document.getElementById('simRatioABValue');
    var ratioACValue = document.getElementById('simRatioACValue');
    var ratioBCValue = document.getElementById('simRatioBCValue');
    var areaRatioValue = document.getElementById('simAreaRatioValue');
    var conclusionValue = document.getElementById('simConclusionValue');

    var resetBtn = document.getElementById('resetSimilarity');

    function draw() {
        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);

        var leftPlane = createPlane(12, 12, (w - 36) / 2, h - 24, -7, 7, -4.5, 7);
        var rightPlane = createPlane(24 + (w - 36) / 2, 12, (w - 36) / 2, h - 24, -10, 10, -7, 10);

        drawPlaneGrid(ctx, leftPlane);
        drawPlaneGrid(ctx, rightPlane);

        var k = parseFloat(scaleSlider.value);
        var rot = parseFloat(rotationSlider.value);
        var shift = parseFloat(shiftSlider.value);

        var T1 = {
            A: { x: -2.7, y: 0 },
            B: { x: 2.9, y: 0 },
            C: { x: -0.8, y: 4.1 }
        };
        var T2 = transformTriangle(T1, k, rot, { x: shift, y: shift * 0.45 });

        drawTriangle(ctx, leftPlane, T1.A, T1.B, T1.C, '#a78bfa', 'rgba(167,139,250,0.16)', 2.5);
        drawTriangle(ctx, rightPlane, T2.A, T2.B, T2.C, '#38bdf8', 'rgba(56,189,248,0.16)', 2.5);

        drawPoint(ctx, leftPlane, T1.A, '#f8fafc', 'A', 4.7);
        drawPoint(ctx, leftPlane, T1.B, '#f8fafc', 'B', 4.7);
        drawPoint(ctx, leftPlane, T1.C, '#f8fafc', 'C', 4.7);

        drawPoint(ctx, rightPlane, T2.A, '#f8fafc', "A'", 4.7);
        drawPoint(ctx, rightPlane, T2.B, '#f8fafc', "B'", 4.7);
        drawPoint(ctx, rightPlane, T2.C, '#f8fafc', "C'", 4.7);

        var M1 = triangleMetrics(T1);
        var M2 = triangleMetrics(T2);

        var rAB = M2.AB / M1.AB;
        var rAC = M2.CA / M1.CA;
        var rBC = M2.BC / M1.BC;
        var rS = M2.area / M1.area;

        scaleValue.textContent = k.toFixed(2);
        rotationValue.textContent = Math.round(rot) + '°';
        shiftValue.textContent = shift.toFixed(1);

        ratioABValue.textContent = rAB.toFixed(3);
        ratioACValue.textContent = rAC.toFixed(3);
        ratioBCValue.textContent = rBC.toFixed(3);
        areaRatioValue.textContent = rS.toFixed(3);

        var similar = Math.abs(rAB - rAC) < 0.02 && Math.abs(rAB - rBC) < 0.02;
        conclusionValue.classList.remove('equal', 'different');
        if (similar) {
            conclusionValue.textContent = 'podobné';
            conclusionValue.classList.add('equal');
        } else {
            conclusionValue.textContent = 'nepodobné';
            conclusionValue.classList.add('different');
        }
    }

    [scaleSlider, rotationSlider, shiftSlider].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    resetBtn.addEventListener('click', function () {
        scaleSlider.value = '1.4';
        rotationSlider.value = '30';
        shiftSlider.value = '0';
        draw();
    });

    redrawBySection[sectionId] = draw;
    draw();
}
function rotateAround(point, center, deg) {
    var q = { x: point.x - center.x, y: point.y - center.y };
    q = rotatePoint(q, deg);
    return { x: q.x + center.x, y: q.y + center.y };
}

function initSimilarityCriteriaDemo(redrawBySection) {
    var sectionId = 'vety-o-podobnosti-trojuhelniku';
    var canvas = document.getElementById('similarityCriteriaCanvas');
    if (!canvas) return;

    var criterionSelect = document.getElementById('simCriterionSelect');
    var scaleSlider = document.getElementById('simCriterionScaleSlider');
    var mismatchSlider = document.getElementById('simCriterionMismatchSlider');

    var scaleValue = document.getElementById('simCriterionScaleValue');
    var mismatchValue = document.getElementById('simCriterionMismatchValue');

    var givenValue = document.getElementById('simCriterionGivenValue');
    var dataValue = document.getElementById('simCriterionDataValue');
    var errorValue = document.getElementById('simCriterionErrorValue');
    var resultValue = document.getElementById('simCriterionResultValue');

    var resetBtn = document.getElementById('resetSimilarityCriteria');

    function buildTriangles(criterion, k, mismatch) {
        var T1 = {
            A: { x: -2.5, y: 0 },
            B: { x: 2.9, y: 0 },
            C: { x: -0.7, y: 3.9 }
        };

        var T2 = transformTriangle(T1, k, 0, { x: 0, y: 0 });
        var m = mismatch / 100;

        if (criterion === 'uu' || criterion === 'sus') {
            var delta = mismatch * 0.55;
            T2.C = rotateAround(T2.C, T2.A, delta);
        } else if (criterion === 'sss') {
            T2.C = {
                x: T2.C.x + (T2.B.x - T2.A.x) * m * 0.8,
                y: T2.C.y
            };
        }

        return { T1: T1, T2: T2 };
    }

    function draw() {
        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);

        var leftPlane = createPlane(12, 12, (w - 36) / 2, h - 24, -7, 7, -4.5, 7);
        var rightPlane = createPlane(24 + (w - 36) / 2, 12, (w - 36) / 2, h - 24, -10, 10, -7, 10);

        drawPlaneGrid(ctx, leftPlane);
        drawPlaneGrid(ctx, rightPlane);

        var criterion = criterionSelect.value;
        var k = parseFloat(scaleSlider.value);
        var mismatch = parseFloat(mismatchSlider.value);

        var data = buildTriangles(criterion, k, mismatch);
        var T1 = data.T1;
        var T2 = transformTriangle(data.T2, 1, 25, { x: 1.4, y: 0.5 });

        drawTriangle(ctx, leftPlane, T1.A, T1.B, T1.C, '#f59e0b', 'rgba(245,158,11,0.15)', 2.4);
        drawTriangle(ctx, rightPlane, T2.A, T2.B, T2.C, '#22d3ee', 'rgba(34,211,238,0.15)', 2.4);

        drawPoint(ctx, leftPlane, T1.A, '#f8fafc', 'A', 4.6);
        drawPoint(ctx, leftPlane, T1.B, '#f8fafc', 'B', 4.6);
        drawPoint(ctx, leftPlane, T1.C, '#f8fafc', 'C', 4.6);

        drawPoint(ctx, rightPlane, T2.A, '#f8fafc', "A'", 4.6);
        drawPoint(ctx, rightPlane, T2.B, '#f8fafc', "B'", 4.6);
        drawPoint(ctx, rightPlane, T2.C, '#f8fafc', "C'", 4.6);

        var M1 = triangleMetrics(T1);
        var M2 = triangleMetrics(T2);

        var rAB = M2.AB / M1.AB;
        var rAC = M2.CA / M1.CA;
        var rBC = M2.BC / M1.BC;

        var epsR = 0.03;
        var epsA = 0.9;

        var uu = Math.abs(M1.A - M2.A) < epsA && Math.abs(M1.B - M2.B) < epsA;
        var sus = Math.abs(rAB - rAC) < epsR && Math.abs(M1.A - M2.A) < epsA;
        var sss = Math.abs(rAB - rAC) < epsR && Math.abs(rAB - rBC) < epsR;

        var ok;
        var dataText;
        var err;

        if (criterion === 'uu') {
            ok = uu;
            dataText = '∠A, ∠B';
            err = 'Δ∠ max = ' + Math.max(Math.abs(M1.A - M2.A), Math.abs(M1.B - M2.B)).toFixed(2) + '°';
        } else if (criterion === 'sus') {
            ok = sus;
            dataText = 'AB/AC a ∠A';
            err = 'Δr = ' + Math.abs(rAB - rAC).toFixed(3) + ', Δ∠A = ' + Math.abs(M1.A - M2.A).toFixed(2) + '°';
        } else {
            ok = sss;
            dataText = 'AB, AC, BC v poměru';
            err = 'max Δr = ' + Math.max(Math.abs(rAB - rAC), Math.abs(rAB - rBC)).toFixed(3);
        }

        scaleValue.textContent = k.toFixed(2);
        mismatchValue.textContent = Math.round(mismatch) + '%';

        givenValue.textContent = criterion;
        dataValue.textContent = dataText;
        errorValue.textContent = err;

        resultValue.classList.remove('equal', 'different');
        if (ok) {
            resultValue.textContent = 'podobné';
            resultValue.classList.add('equal');
        } else {
            resultValue.textContent = 'nepodobné';
            resultValue.classList.add('different');
        }
    }

    [criterionSelect, scaleSlider, mismatchSlider].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    resetBtn.addEventListener('click', function () {
        criterionSelect.value = 'uu';
        scaleSlider.value = '1.3';
        mismatchSlider.value = '0';
        draw();
    });

    redrawBySection[sectionId] = draw;
    draw();
}

function initExercises() {
    var checkButtons = document.querySelectorAll('.btn-check');
    if (checkButtons.length === 0) return;

    checkButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            var ex = button.getAttribute('data-exercise');
            var correct = button.getAttribute('data-correct');
            var selected = document.querySelector('input[name="ex' + ex + '"]:checked');

            if (!selected) {
                alert('Vyberte prosím jednu odpověď.');
                return;
            }

            var feedback = document.getElementById('ex' + ex + 'Feedback');
            var status = document.getElementById('ex' + ex + 'Status');
            var options = document.querySelectorAll('input[name="ex' + ex + '"]');
            var isCorrect = selected.value === correct;

            options.forEach(function (opt) {
                opt.disabled = true;
                opt.parentElement.classList.remove('correct', 'incorrect');
            });
            button.disabled = true;

            selected.parentElement.classList.add(isCorrect ? 'correct' : 'incorrect');
            if (!isCorrect) {
                options.forEach(function (opt) {
                    if (opt.value === correct) {
                        opt.parentElement.classList.add('correct');
                    }
                });
            }

            status.textContent = isCorrect ? '✓ Správně' : '✗ Chyba';
            status.className = 'exercise-status ' + (isCorrect ? 'correct' : 'incorrect');

            feedback.textContent = isCorrect
                ? 'Správně. Pokračujte na další otázku.'
                : 'Nesprávně. Správná odpověď je zvýrazněna zeleně.';
            feedback.className = 'exercise-feedback show ' + (isCorrect ? 'correct' : 'incorrect');

            var allDone = Array.from(document.querySelectorAll('.btn-check')).every(function (btn) {
                return btn.disabled;
            });
            var complete = document.getElementById('lessonComplete');
            if (complete) complete.style.display = allDone ? 'block' : 'none';
        });
    });
}
