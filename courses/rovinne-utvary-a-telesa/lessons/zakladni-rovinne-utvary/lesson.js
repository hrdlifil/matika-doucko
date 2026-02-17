// Kapitola 1: Zakladni rovinne utvary - interactive lesson

document.addEventListener('DOMContentLoaded', function () {
    var redrawBySection = {};

    initSquareDemo(redrawBySection);
    initRectangleDemo(redrawBySection);
    initTriangleDemo(redrawBySection);
    initParallelogramDemo(redrawBySection);
    initTrapezoidDemo(redrawBySection);
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

function normalize(v) {
    var len = Math.sqrt(v.x * v.x + v.y * v.y);
    if (len < 1e-9) return { x: 1, y: 0 };
    return { x: v.x / len, y: v.y / len };
}

function approx(a, b, eps) {
    return Math.abs(a - b) <= eps;
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
    roundedRect(
        ctx,
        plane.left - 1,
        plane.top - 1,
        (plane.right - plane.left) + 2,
        (plane.bottom - plane.top) + 2,
        10
    );
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
    var r = radius || 5.5;

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
    ctx.lineWidth = width || 2.2;
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.stroke();
    ctx.restore();
}

function drawInfiniteLine(ctx, plane, point, dir, color, width, dashed) {
    var unit = normalize(dir);
    var t = 1000;
    drawSegment(
        ctx,
        plane,
        { x: point.x - unit.x * t, y: point.y - unit.y * t },
        { x: point.x + unit.x * t, y: point.y + unit.y * t },
        color,
        width,
        dashed
    );
}

function drawCircle(ctx, plane, center, radius, stroke, fill, width) {
    var c = toCanvas(plane, center);
    ctx.save();
    ctx.beginPath();
    ctx.arc(c.x, c.y, radius * plane.scale, 0, Math.PI * 2);
    if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
    }
    if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = width || 2.2;
        ctx.stroke();
    }
    ctx.restore();
}

function drawPolygon(ctx, plane, points, stroke, fill, width) {
    if (!points || points.length < 3) return;
    ctx.save();
    ctx.beginPath();
    var p0 = toCanvas(plane, points[0]);
    ctx.moveTo(p0.x, p0.y);
    for (var i = 1; i < points.length; i++) {
        var pi = toCanvas(plane, points[i]);
        ctx.lineTo(pi.x, pi.y);
    }
    ctx.closePath();
    if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
    }
    if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = width || 2.2;
        ctx.stroke();
    }
    ctx.restore();
}

function rotatePoint(p, angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    return {
        x: p.x * c - p.y * s,
        y: p.x * s + p.y * c
    };
}

function midpoint(a, b) {
    return {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2
    };
}

function drawRightAngleMarker(ctx, plane, at, ux, uy, size, color) {
    var s = size || 0.35;
    var p1 = at;
    var p2 = { x: at.x + ux.x * s, y: at.y + ux.y * s };
    var p3 = { x: p2.x + uy.x * s, y: p2.y + uy.y * s };
    var p4 = { x: at.x + uy.x * s, y: at.y + uy.y * s };

    var c1 = toCanvas(plane, p1);
    var c2 = toCanvas(plane, p2);
    var c3 = toCanvas(plane, p3);
    var c4 = toCanvas(plane, p4);

    ctx.save();
    ctx.strokeStyle = color || '#fbbf24';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(c1.x, c1.y);
    ctx.lineTo(c2.x, c2.y);
    ctx.lineTo(c3.x, c3.y);
    ctx.lineTo(c4.x, c4.y);
    ctx.stroke();
    ctx.restore();
}

function formatNum(value, digits) {
    return value.toFixed(digits == null ? 2 : digits);
}

function initNavigation(redrawBySection) {
    var sectionOrder = [
        'ctverec-obsah-obvod-a-dalsi',
        'obdelnik-obsah-obvod-a-dalsi',
        'trojuhelnik-obsah-obvod-a-dalsi',
        'rovnobeznik-kosodelnik-a-kosoctverec',
        'lichobeznik-obsah-a-obvod',
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

function initSquareDemo(redrawBySection) {
    var sectionId = 'ctverec-obsah-obvod-a-dalsi';
    var canvas = document.getElementById('squareCanvas');
    if (!canvas) return;

    var sideSlider = document.getElementById('squareSideSlider');
    var rotationSlider = document.getElementById('squareRotationSlider');
    var showDiagonal = document.getElementById('showSquareDiagonal');
    var showIncircle = document.getElementById('showSquareIncircle');
    var showCircumcircle = document.getElementById('showSquareCircumcircle');

    var sideValue = document.getElementById('squareSideValue');
    var rotationValue = document.getElementById('squareRotationValue');
    var perimeterValue = document.getElementById('squarePerimeterValue');
    var areaValue = document.getElementById('squareAreaValue');
    var diagonalValue = document.getElementById('squareDiagonalValue');
    var inradiusValue = document.getElementById('squareInradiusValue');
    var circumradiusValue = document.getElementById('squareCircumradiusValue');

    var resetBtn = document.getElementById('resetSquare');

    function draw() {
        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);
        var plane = createPlane(14, 14, w - 28, h - 28, -8, 8, -6, 6);
        drawPlaneGrid(ctx, plane);

        var a = parseFloat(sideSlider.value);
        var rotDeg = parseFloat(rotationSlider.value);
        var rot = rotDeg * Math.PI / 180;
        var half = a / 2;

        var A = rotatePoint({ x: -half, y: -half }, rot);
        var B = rotatePoint({ x: half, y: -half }, rot);
        var C = rotatePoint({ x: half, y: half }, rot);
        var D = rotatePoint({ x: -half, y: half }, rot);
        var O = { x: 0, y: 0 };

        drawPolygon(ctx, plane, [A, B, C, D], '#e2e8f0', 'rgba(99,102,241,0.18)', 2.3);

        if (showCircumcircle.checked) {
            drawCircle(ctx, plane, O, a / Math.sqrt(2), '#f59e0b', 'rgba(245,158,11,0.08)', 2.1);
        }
        if (showIncircle.checked) {
            drawCircle(ctx, plane, O, a / 2, '#34d399', 'rgba(52,211,153,0.08)', 2.1);
        }
        if (showDiagonal.checked) {
            drawSegment(ctx, plane, A, C, '#f472b6', 2.3, false);
            drawSegment(ctx, plane, B, D, '#f472b6', 2.3, false);
        }

        drawPoint(ctx, plane, A, '#f8fafc', 'A', 4.3);
        drawPoint(ctx, plane, B, '#f8fafc', 'B', 4.3);
        drawPoint(ctx, plane, C, '#f8fafc', 'C', 4.3);
        drawPoint(ctx, plane, D, '#f8fafc', 'D', 4.3);
        drawPoint(ctx, plane, O, '#60a5fa', 'O', 4.6);

        var perimeter = 4 * a;
        var area = a * a;
        var diagonal = a * Math.sqrt(2);
        var inradius = a / 2;
        var circumradius = a / Math.sqrt(2);

        sideValue.textContent = formatNum(a, 1);
        rotationValue.textContent = Math.round(rotDeg) + '°';
        perimeterValue.textContent = formatNum(perimeter, 3);
        areaValue.textContent = formatNum(area, 3);
        diagonalValue.textContent = formatNum(diagonal, 3);
        inradiusValue.textContent = formatNum(inradius, 3);
        circumradiusValue.textContent = formatNum(circumradius, 3);
    }

    [sideSlider, rotationSlider, showDiagonal, showIncircle, showCircumcircle].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    resetBtn.addEventListener('click', function () {
        sideSlider.value = '4.5';
        rotationSlider.value = '18';
        showDiagonal.checked = true;
        showIncircle.checked = true;
        showCircumcircle.checked = true;
        draw();
    });

    redrawBySection[sectionId] = draw;
    draw();
}

function initRectangleDemo(redrawBySection) {
    var sectionId = 'obdelnik-obsah-obvod-a-dalsi';
    var canvas = document.getElementById('rectangleCanvas');
    if (!canvas) return;

    var aSlider = document.getElementById('rectASlider');
    var bSlider = document.getElementById('rectBSlider');
    var rotationSlider = document.getElementById('rectRotationSlider');
    var showDiagonals = document.getElementById('showRectDiagonals');
    var showCircumcircle = document.getElementById('showRectCircumcircle');
    var showIncircle = document.getElementById('showRectIncircle');

    var aValue = document.getElementById('rectAValue');
    var bValue = document.getElementById('rectBValue');
    var rotationValue = document.getElementById('rectRotationValue');
    var perimeterValue = document.getElementById('rectPerimeterValue');
    var areaValue = document.getElementById('rectAreaValue');
    var diagonalValue = document.getElementById('rectDiagonalValue');
    var circumradiusValue = document.getElementById('rectCircumradiusValue');
    var angleValue = document.getElementById('rectAngleValue');
    var ratioValue = document.getElementById('rectRatioValue');
    var typeValue = document.getElementById('rectTypeValue');
    var incircleValue = document.getElementById('rectIncircleValue');

    var resetBtn = document.getElementById('resetRectangle');

    function draw() {
        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);
        var plane = createPlane(14, 14, w - 28, h - 28, -9, 9, -6.8, 6.8);
        drawPlaneGrid(ctx, plane);

        var a = parseFloat(aSlider.value);
        var b = parseFloat(bSlider.value);
        var rotDeg = parseFloat(rotationSlider.value);
        var rot = rotDeg * Math.PI / 180;

        var A = rotatePoint({ x: -a / 2, y: -b / 2 }, rot);
        var B = rotatePoint({ x: a / 2, y: -b / 2 }, rot);
        var C = rotatePoint({ x: a / 2, y: b / 2 }, rot);
        var D = rotatePoint({ x: -a / 2, y: b / 2 }, rot);
        var O = { x: 0, y: 0 };

        drawPolygon(ctx, plane, [A, B, C, D], '#e2e8f0', 'rgba(59,130,246,0.14)', 2.3);

        if (showDiagonals.checked) {
            drawSegment(ctx, plane, A, C, '#f472b6', 2.2, false);
            drawSegment(ctx, plane, B, D, '#f472b6', 2.2, false);
        }
        if (showCircumcircle.checked) {
            drawCircle(ctx, plane, O, Math.sqrt(a * a + b * b) / 2, '#f59e0b', 'rgba(245,158,11,0.08)', 2.1);
        }

        var canHaveIncircle = Math.abs(a - b) < 0.02;
        if (showIncircle.checked && canHaveIncircle) {
            drawCircle(ctx, plane, O, a / 2, '#34d399', 'rgba(52,211,153,0.08)', 2.1);
        }

        drawPoint(ctx, plane, A, '#f8fafc', 'A', 4.2);
        drawPoint(ctx, plane, B, '#f8fafc', 'B', 4.2);
        drawPoint(ctx, plane, C, '#f8fafc', 'C', 4.2);
        drawPoint(ctx, plane, D, '#f8fafc', 'D', 4.2);
        drawPoint(ctx, plane, O, '#60a5fa', 'O', 4.6);

        var perimeter = 2 * (a + b);
        var area = a * b;
        var diagonal = Math.sqrt(a * a + b * b);
        var circumradius = diagonal / 2;
        var diagAngle = Math.atan2(b, a) * 180 / Math.PI;

        aValue.textContent = formatNum(a, 1);
        bValue.textContent = formatNum(b, 1);
        rotationValue.textContent = Math.round(rotDeg) + '°';
        perimeterValue.textContent = formatNum(perimeter, 3);
        areaValue.textContent = formatNum(area, 3);
        diagonalValue.textContent = formatNum(diagonal, 3);
        circumradiusValue.textContent = formatNum(circumradius, 3);
        angleValue.textContent = formatNum(diagAngle, 2) + '°';
        ratioValue.textContent = formatNum(a / b, 3) + ' : 1';

        typeValue.className = 'status-chip';
        if (canHaveIncircle) {
            typeValue.textContent = 'čtverec (speciální obdélník)';
            typeValue.classList.add('equal');
        } else {
            typeValue.textContent = 'obecný obdélník';
        }

        incircleValue.className = 'status-chip';
        if (!showIncircle.checked) {
            incircleValue.textContent = 'není aktivní';
        } else if (canHaveIncircle) {
            incircleValue.textContent = 'existuje (a = b)';
            incircleValue.classList.add('equal');
        } else {
            incircleValue.textContent = 'neexistuje (a ≠ b)';
            incircleValue.classList.add('different');
        }
    }

    [aSlider, bSlider, rotationSlider, showDiagonals, showCircumcircle, showIncircle].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    resetBtn.addEventListener('click', function () {
        aSlider.value = '8';
        bSlider.value = '4.8';
        rotationSlider.value = '12';
        showDiagonals.checked = true;
        showCircumcircle.checked = true;
        showIncircle.checked = false;
        draw();
    });

    redrawBySection[sectionId] = draw;
    draw();
}

function initTriangleDemo(redrawBySection) {
    var sectionId = 'trojuhelnik-obsah-obvod-a-dalsi';
    var canvas = document.getElementById('triangleCanvas');
    if (!canvas) return;

    var aSlider = document.getElementById('triASlider');
    var bSlider = document.getElementById('triBSlider');
    var cSlider = document.getElementById('triCSlider');
    var showHeight = document.getElementById('showTriHeight');
    var showMedian = document.getElementById('showTriMedian');
    var showIncircle = document.getElementById('showTriIncircle');

    var aValue = document.getElementById('triAValue');
    var bValue = document.getElementById('triBValue');
    var cValue = document.getElementById('triCValue');
    var perimeterValue = document.getElementById('triPerimeterValue');
    var semiperimeterValue = document.getElementById('triSemiperimeterValue');
    var heightValue = document.getElementById('triHeightValue');
    var areaHeronValue = document.getElementById('triAreaHeronValue');
    var areaBaseHeightValue = document.getElementById('triAreaBaseHeightValue');
    var medianValue = document.getElementById('triMedianValue');
    var inradiusValue = document.getElementById('triInradiusValue');
    var circumradiusValue = document.getElementById('triCircumradiusValue');
    var angleTypeValue = document.getElementById('triAngleTypeValue');

    var resetBtn = document.getElementById('resetTriangle');

    function classifyTriangleByAngles(a, b, c) {
        var sides = [a, b, c].sort(function (x, y) { return x - y; });
        var s1 = sides[0] * sides[0] + sides[1] * sides[1];
        var s2 = sides[2] * sides[2];
        if (Math.abs(s1 - s2) < 0.06) return 'pravoúhlý';
        if (s1 > s2) return 'ostroúhlý';
        return 'tupoúhlý';
    }

    function draw() {
        var a = parseFloat(aSlider.value);
        var b = parseFloat(bSlider.value);
        var c = parseFloat(cSlider.value);

        var minC = Math.abs(a - b) + 0.2;
        var maxC = a + b - 0.2;
        c = clamp(c, minC, maxC);
        cSlider.value = c.toFixed(1);

        var A = { x: -c / 2, y: 0 };
        var B = { x: c / 2, y: 0 };
        var x = (b * b + c * c - a * a) / (2 * c);
        var h2 = Math.max(0, b * b - x * x);
        var h = Math.sqrt(h2);
        var C = { x: A.x + x, y: h };
        var H = { x: C.x, y: 0 };
        var M = midpoint(A, B);

        var s = (a + b + c) / 2;
        var areaHeron = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
        var height = (2 * areaHeron) / c;
        var areaBaseHeight = 0.5 * c * height;
        var median = 0.5 * Math.sqrt(Math.max(0, 2 * a * a + 2 * b * b - c * c));
        var inradius = areaHeron / s;
        var circumradius = (a * b * c) / Math.max(1e-9, 4 * areaHeron);

        var xMin = Math.min(A.x, B.x, C.x) - 1.8;
        var xMax = Math.max(A.x, B.x, C.x) + 1.8;
        var yMax = Math.max(C.y, 1) + 1.8;

        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var hCanvas = setup.h;

        drawBackdrop(ctx, w, hCanvas);
        var plane = createPlane(14, 14, w - 28, hCanvas - 28, xMin, xMax, -1.6, yMax);
        drawPlaneGrid(ctx, plane);

        drawPolygon(ctx, plane, [A, B, C], '#e2e8f0', 'rgba(99,102,241,0.18)', 2.3);

        if (showHeight.checked) {
            drawSegment(ctx, plane, C, H, '#34d399', 2.1, true);
            drawRightAngleMarker(ctx, plane, H, { x: 1, y: 0 }, { x: 0, y: 1 }, 0.35, '#34d399');
            drawPoint(ctx, plane, H, '#34d399', 'H', 4.2);
        }

        if (showMedian.checked) {
            drawSegment(ctx, plane, C, M, '#f59e0b', 2.1, false);
            drawPoint(ctx, plane, M, '#f59e0b', 'M', 4.2);
        }

        if (showIncircle.checked) {
            var I = {
                x: (a * A.x + b * B.x + c * C.x) / (a + b + c),
                y: (a * A.y + b * B.y + c * C.y) / (a + b + c)
            };
            drawCircle(ctx, plane, I, inradius, '#f472b6', 'rgba(244,114,182,0.10)', 2.1);
            drawPoint(ctx, plane, I, '#f472b6', 'I', 4.2);
        }

        drawPoint(ctx, plane, A, '#f8fafc', 'A', 4.2);
        drawPoint(ctx, plane, B, '#f8fafc', 'B', 4.2);
        drawPoint(ctx, plane, C, '#f8fafc', 'C', 4.2);

        aValue.textContent = formatNum(a, 1);
        bValue.textContent = formatNum(b, 1);
        cValue.textContent = formatNum(c, 1);
        perimeterValue.textContent = formatNum(a + b + c, 3);
        semiperimeterValue.textContent = formatNum(s, 3);
        heightValue.textContent = formatNum(height, 3);
        areaHeronValue.textContent = formatNum(areaHeron, 3);
        areaBaseHeightValue.textContent = formatNum(areaBaseHeight, 3);
        medianValue.textContent = formatNum(median, 3);
        inradiusValue.textContent = formatNum(inradius, 3);
        circumradiusValue.textContent = formatNum(circumradius, 3);

        var angleType = classifyTriangleByAngles(a, b, c);
        angleTypeValue.textContent = angleType;
        angleTypeValue.className = 'status-chip';
        if (angleType === 'pravoúhlý') {
            angleTypeValue.classList.add('equal');
        } else if (angleType === 'tupoúhlý') {
            angleTypeValue.classList.add('different');
        }
    }

    [aSlider, bSlider, cSlider, showHeight, showMedian, showIncircle].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    resetBtn.addEventListener('click', function () {
        aSlider.value = '6.8';
        bSlider.value = '5.6';
        cSlider.value = '7.4';
        showHeight.checked = true;
        showMedian.checked = true;
        showIncircle.checked = true;
        draw();
    });

    redrawBySection[sectionId] = draw;
    draw();
}

function initParallelogramDemo(redrawBySection) {
    var sectionId = 'rovnobeznik-kosodelnik-a-kosoctverec';
    var canvas = document.getElementById('parallelogramCanvas');
    if (!canvas) return;

    var typeSelect = document.getElementById('paraTypeSelect');
    var aSlider = document.getElementById('paraASlider');
    var bSlider = document.getElementById('paraBSlider');
    var angleSlider = document.getElementById('paraAngleSlider');
    var showHeight = document.getElementById('showParaHeight');
    var showDiagonals = document.getElementById('showParaDiagonals');

    var aValue = document.getElementById('paraAValue');
    var bValue = document.getElementById('paraBValue');
    var angleValue = document.getElementById('paraAngleValue');
    var perimeterValue = document.getElementById('paraPerimeterValue');
    var heightValue = document.getElementById('paraHeightValue');
    var areaValue = document.getElementById('paraAreaValue');
    var diag1Value = document.getElementById('paraDiag1Value');
    var diag2Value = document.getElementById('paraDiag2Value');
    var areaFromDiagsValue = document.getElementById('paraAreaFromDiagsValue');
    var typeValue = document.getElementById('paraTypeValue');

    var resetBtn = document.getElementById('resetParallelogram');

    function draw() {
        var mode = typeSelect.value;
        var a = parseFloat(aSlider.value);
        var b = parseFloat(bSlider.value);
        if (mode === 'kosoctverec') {
            b = a;
            bSlider.value = a.toFixed(1);
            bSlider.disabled = true;
        } else {
            bSlider.disabled = false;
        }
        var gammaDeg = parseFloat(angleSlider.value);
        var gamma = gammaDeg * Math.PI / 180;

        var A0 = { x: 0, y: 0 };
        var B0 = { x: a, y: 0 };
        var D0 = { x: b * Math.cos(gamma), y: b * Math.sin(gamma) };
        var C0 = { x: B0.x + D0.x, y: B0.y + D0.y };
        var H0 = { x: D0.x, y: 0 };

        var center = {
            x: (A0.x + B0.x + C0.x + D0.x) / 4,
            y: (A0.y + B0.y + C0.y + D0.y) / 4
        };
        function shift(p) {
            return { x: p.x - center.x, y: p.y - center.y };
        }

        var A = shift(A0);
        var B = shift(B0);
        var C = shift(C0);
        var D = shift(D0);
        var H = shift(H0);

        var xs = [A.x, B.x, C.x, D.x];
        var ys = [A.y, B.y, C.y, D.y];
        var xMin = Math.min.apply(null, xs) - 1.8;
        var xMax = Math.max.apply(null, xs) + 1.8;
        var yMin = Math.min.apply(null, ys) - 1.8;
        var yMax = Math.max.apply(null, ys) + 1.8;

        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var hCanvas = setup.h;

        drawBackdrop(ctx, w, hCanvas);
        var plane = createPlane(14, 14, w - 28, hCanvas - 28, xMin, xMax, yMin, yMax);
        drawPlaneGrid(ctx, plane);

        drawPolygon(ctx, plane, [A, B, C, D], '#e2e8f0', 'rgba(99,102,241,0.18)', 2.3);

        if (showDiagonals.checked) {
            drawSegment(ctx, plane, A, C, '#f472b6', 2.2, false);
            drawSegment(ctx, plane, B, D, '#f59e0b', 2.2, false);
        }

        if (showHeight.checked) {
            drawSegment(ctx, plane, D, H, '#34d399', 2.1, true);
            drawRightAngleMarker(ctx, plane, H, { x: 1, y: 0 }, { x: 0, y: 1 }, 0.33, '#34d399');
            drawPoint(ctx, plane, H, '#34d399', 'H', 4.1);
        }

        drawPoint(ctx, plane, A, '#f8fafc', 'A', 4.2);
        drawPoint(ctx, plane, B, '#f8fafc', 'B', 4.2);
        drawPoint(ctx, plane, C, '#f8fafc', 'C', 4.2);
        drawPoint(ctx, plane, D, '#f8fafc', 'D', 4.2);

        var vA = b * Math.sin(gamma);
        var perimeter = 2 * (a + b);
        var area = a * vA;
        var diag1 = Math.sqrt(a * a + b * b + 2 * a * b * Math.cos(gamma));
        var diag2 = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(gamma));
        var areaFromDiags = (mode === 'kosoctverec') ? 0.5 * diag1 * diag2 : null;

        aValue.textContent = formatNum(a, 1);
        bValue.textContent = formatNum(b, 1);
        angleValue.textContent = Math.round(gammaDeg) + '°';
        perimeterValue.textContent = formatNum(perimeter, 3);
        heightValue.textContent = formatNum(vA, 3);
        areaValue.textContent = formatNum(area, 3);
        diag1Value.textContent = formatNum(diag1, 3);
        diag2Value.textContent = formatNum(diag2, 3);
        areaFromDiagsValue.textContent = areaFromDiags == null ? '—' : formatNum(areaFromDiags, 3);

        typeValue.className = 'status-chip';
        if (mode === 'kosoctverec') {
            typeValue.textContent = 'kosočtverec';
            typeValue.classList.add('equal');
        } else {
            typeValue.textContent = 'kosodélník';
        }
    }

    [typeSelect, aSlider, bSlider, angleSlider, showHeight, showDiagonals].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    resetBtn.addEventListener('click', function () {
        typeSelect.value = 'kosodelnik';
        aSlider.value = '7.2';
        bSlider.value = '5.0';
        bSlider.disabled = false;
        angleSlider.value = '58';
        showHeight.checked = true;
        showDiagonals.checked = true;
        draw();
    });

    redrawBySection[sectionId] = draw;
    draw();
}

function initTrapezoidDemo(redrawBySection) {
    var sectionId = 'lichobeznik-obsah-a-obvod';
    var canvas = document.getElementById('trapezoidCanvas');
    if (!canvas) return;

    var aSlider = document.getElementById('trapASlider');
    var cSlider = document.getElementById('trapCSlider');
    var heightSlider = document.getElementById('trapHeightSlider');
    var shiftSlider = document.getElementById('trapShiftSlider');
    var showHeight = document.getElementById('showTrapHeight');
    var showMidline = document.getElementById('showTrapMidline');
    var showDiagonals = document.getElementById('showTrapDiagonals');

    var aValue = document.getElementById('trapAValue');
    var cValue = document.getElementById('trapCValue');
    var heightValue = document.getElementById('trapHeightValue');
    var shiftValue = document.getElementById('trapShiftValue');
    var bValue = document.getElementById('trapBValue');
    var dValue = document.getElementById('trapDValue');
    var midlineValue = document.getElementById('trapMidlineValue');
    var areaValue = document.getElementById('trapAreaValue');
    var perimeterValue = document.getElementById('trapPerimeterValue');
    var diagACValue = document.getElementById('trapDiagACValue');
    var diagBDValue = document.getElementById('trapDiagBDValue');
    var typeValue = document.getElementById('trapTypeValue');

    var resetBtn = document.getElementById('resetTrapezoid');

    function draw() {
        var a = parseFloat(aSlider.value);
        var c = parseFloat(cSlider.value);
        var v = parseFloat(heightSlider.value);
        var shift = parseFloat(shiftSlider.value);

        var A0 = { x: -a / 2, y: 0 };
        var B0 = { x: a / 2, y: 0 };
        var D0 = { x: shift - c / 2, y: v };
        var C0 = { x: shift + c / 2, y: v };
        var H0 = { x: D0.x, y: 0 };
        var M10 = midpoint(A0, D0);
        var M20 = midpoint(B0, C0);

        var center = {
            x: (A0.x + B0.x + C0.x + D0.x) / 4,
            y: (A0.y + B0.y + C0.y + D0.y) / 4
        };
        function shiftPoint(p) {
            return { x: p.x - center.x, y: p.y - center.y };
        }

        var A = shiftPoint(A0);
        var B = shiftPoint(B0);
        var C = shiftPoint(C0);
        var D = shiftPoint(D0);
        var H = shiftPoint(H0);
        var M1 = shiftPoint(M10);
        var M2 = shiftPoint(M20);

        var xs = [A.x, B.x, C.x, D.x];
        var ys = [A.y, B.y, C.y, D.y];
        var xMin = Math.min.apply(null, xs) - 2;
        var xMax = Math.max.apply(null, xs) + 2;
        var yMin = Math.min.apply(null, ys) - 1.8;
        var yMax = Math.max.apply(null, ys) + 1.8;

        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var hCanvas = setup.h;

        drawBackdrop(ctx, w, hCanvas);
        var plane = createPlane(14, 14, w - 28, hCanvas - 28, xMin, xMax, yMin, yMax);
        drawPlaneGrid(ctx, plane);

        drawPolygon(ctx, plane, [A, B, C, D], '#e2e8f0', 'rgba(59,130,246,0.16)', 2.3);

        if (showHeight.checked) {
            drawSegment(ctx, plane, D, H, '#34d399', 2.1, true);
            drawRightAngleMarker(ctx, plane, H, { x: 1, y: 0 }, { x: 0, y: 1 }, 0.33, '#34d399');
            drawPoint(ctx, plane, H, '#34d399', 'H', 4.1);
        }
        if (showMidline.checked) {
            drawSegment(ctx, plane, M1, M2, '#f59e0b', 2.3, false);
            drawPoint(ctx, plane, M1, '#f59e0b', 'M1', 4.0);
            drawPoint(ctx, plane, M2, '#f59e0b', 'M2', 4.0);
        }
        if (showDiagonals.checked) {
            drawSegment(ctx, plane, A, C, '#f472b6', 2.1, false);
            drawSegment(ctx, plane, B, D, '#f472b6', 2.1, false);
        }

        drawPoint(ctx, plane, A, '#f8fafc', 'A', 4.2);
        drawPoint(ctx, plane, B, '#f8fafc', 'B', 4.2);
        drawPoint(ctx, plane, C, '#f8fafc', 'C', 4.2);
        drawPoint(ctx, plane, D, '#f8fafc', 'D', 4.2);

        var bLen = distance(B0, C0);
        var dLen = distance(A0, D0);
        var midline = (a + c) / 2;
        var area = midline * v;
        var perimeter = a + bLen + c + dLen;
        var diagAC = distance(A0, C0);
        var diagBD = distance(B0, D0);

        var isIsosceles = Math.abs(bLen - dLen) < 0.05;
        var isRight = Math.abs(D0.x - A0.x) < 0.05 || Math.abs(C0.x - B0.x) < 0.05;
        var typeText = 'obecný lichoběžník';
        if (isIsosceles && isRight) typeText = 'rovnoramenný pravoúhlý';
        else if (isIsosceles) typeText = 'rovnoramenný';
        else if (isRight) typeText = 'pravoúhlý';

        aValue.textContent = formatNum(a, 1);
        cValue.textContent = formatNum(c, 1);
        heightValue.textContent = formatNum(v, 1);
        shiftValue.textContent = formatNum(shift, 1);
        bValue.textContent = formatNum(bLen, 3);
        dValue.textContent = formatNum(dLen, 3);
        midlineValue.textContent = formatNum(midline, 3);
        areaValue.textContent = formatNum(area, 3);
        perimeterValue.textContent = formatNum(perimeter, 3);
        diagACValue.textContent = formatNum(diagAC, 3);
        diagBDValue.textContent = formatNum(diagBD, 3);

        typeValue.textContent = typeText;
        typeValue.className = 'status-chip';
        if (isIsosceles || isRight) {
            typeValue.classList.add('equal');
        }
    }

    [aSlider, cSlider, heightSlider, shiftSlider, showHeight, showMidline, showDiagonals].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    resetBtn.addEventListener('click', function () {
        aSlider.value = '9';
        cSlider.value = '5';
        heightSlider.value = '3.6';
        shiftSlider.value = '0';
        showHeight.checked = true;
        showMidline.checked = true;
        showDiagonals.checked = false;
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
                ? 'Správně. Pokračujte na další úlohu.'
                : 'Nesprávně. Správná možnost je zvýrazněna zeleně.';
            feedback.className = 'exercise-feedback show ' + (isCorrect ? 'correct' : 'incorrect');

            var allDone = Array.from(document.querySelectorAll('.btn-check')).every(function (btn) {
                return btn.disabled;
            });
            var complete = document.getElementById('lessonComplete');
            if (complete) {
                complete.style.display = allDone ? 'block' : 'none';
            }
        });
    });
}

