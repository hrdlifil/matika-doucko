// Kapitola 4: Kruh a kružnice - interactive lesson

document.addEventListener('DOMContentLoaded', function () {
    var redrawBySection = {};

    initCircleBasicsDemo(redrawBySection);
    initLineCircleDemo(redrawBySection);
    initTwoCirclesDemo(redrawBySection);
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

function formatNum(value, digits) {
    return value.toFixed(digits == null ? 2 : digits);
}

function initNavigation(redrawBySection) {
    var sectionOrder = [
        'kruznice-kruh-tetiva-usec-a-vysec',
        'secna-tecna-a-vnejsi-primka',
        'vzajemna-poloha-dvou-kruznic',
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

function initCircleBasicsDemo(redrawBySection) {
    var sectionId = 'kruznice-kruh-tetiva-usec-a-vysec';
    var canvas = document.getElementById('circleBasicsCanvas');
    if (!canvas) return;

    var radiusSlider = document.getElementById('circleRadiusSlider');
    var angleSlider = document.getElementById('centralAngleSlider');
    var rotationSlider = document.getElementById('radiusRotationSlider');

    var showSector = document.getElementById('showSector');
    var showSegment = document.getElementById('showSegment');
    var showChord = document.getElementById('showChord');
    var showRadii = document.getElementById('showRadii');
    var showArc = document.getElementById('showArc');

    var radiusValue = document.getElementById('circleRadiusValue');
    var angleValue = document.getElementById('centralAngleValue');
    var rotationValue = document.getElementById('radiusRotationValue');

    var circumferenceValue = document.getElementById('circumferenceValue');
    var diskAreaValue = document.getElementById('diskAreaValue');
    var chordLengthValue = document.getElementById('chordLengthValue');
    var arcLengthValue = document.getElementById('arcLengthValue');
    var sectorAreaValue = document.getElementById('sectorAreaValue');
    var segmentAreaValue = document.getElementById('segmentAreaValue');
    var angleRadiansValue = document.getElementById('angleRadiansValue');

    var resetBtn = document.getElementById('resetCircleBasics');

    function draw() {
        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);
        var plane = createPlane(14, 14, w - 28, h - 28, -8, 8, -5.8, 5.8);
        drawPlaneGrid(ctx, plane);

        var r = parseFloat(radiusSlider.value);
        var phiDeg = parseFloat(angleSlider.value);
        var rotDeg = parseFloat(rotationSlider.value);

        var phi = phiDeg * Math.PI / 180;
        var rot = rotDeg * Math.PI / 180;

        var O = { x: 0, y: 0 };
        var A = { x: r * Math.cos(rot), y: r * Math.sin(rot) };
        var B = { x: r * Math.cos(rot + phi), y: r * Math.sin(rot + phi) };

        var Cpx = toCanvas(plane, O);
        var Ac = toCanvas(plane, A);
        var Bc = toCanvas(plane, B);
        var rp = r * plane.scale;

        if (showSector.checked) {
            ctx.save();
            ctx.fillStyle = 'rgba(99,102,241,0.28)';
            ctx.beginPath();
            ctx.moveTo(Cpx.x, Cpx.y);
            ctx.lineTo(Ac.x, Ac.y);
            ctx.arc(Cpx.x, Cpx.y, rp, -rot, -(rot + phi), true);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        if (showSegment.checked) {
            ctx.save();
            ctx.fillStyle = 'rgba(245,158,11,0.24)';
            ctx.beginPath();
            ctx.moveTo(Ac.x, Ac.y);
            ctx.arc(Cpx.x, Cpx.y, rp, -rot, -(rot + phi), true);
            ctx.lineTo(Ac.x, Ac.y);
            ctx.fill();
            ctx.restore();
        }

        drawCircle(ctx, plane, O, r, '#e2e8f0', 'rgba(148,163,184,0.05)', 2.2);

        if (showArc.checked) {
            ctx.save();
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 3.1;
            ctx.beginPath();
            ctx.arc(Cpx.x, Cpx.y, rp, -rot, -(rot + phi), true);
            ctx.stroke();
            ctx.restore();
        }

        if (showChord.checked) {
            drawSegment(ctx, plane, A, B, '#f472b6', 2.4, false);
        }

        if (showRadii.checked) {
            drawSegment(ctx, plane, O, A, '#34d399', 2.2, false);
            drawSegment(ctx, plane, O, B, '#34d399', 2.2, false);
        }

        drawPoint(ctx, plane, O, '#60a5fa', 'O', 4.6);
        drawPoint(ctx, plane, A, '#f8fafc', 'A', 4.6);
        drawPoint(ctx, plane, B, '#f8fafc', 'B', 4.6);

        var mid = rot + phi / 2;
        var labelPoint = {
            x: 0.95 * Math.cos(mid),
            y: 0.95 * Math.sin(mid)
        };
        var lp = toCanvas(plane, labelPoint);

        ctx.save();
        ctx.strokeStyle = 'rgba(52,211,153,0.9)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(Cpx.x, Cpx.y, 0.75 * plane.scale, -rot, -(rot + phi), true);
        ctx.stroke();
        ctx.fillStyle = '#34d399';
        ctx.font = '700 12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('φ', lp.x, lp.y);
        ctx.restore();

        var circumference = 2 * Math.PI * r;
        var diskArea = Math.PI * r * r;
        var chord = 2 * r * Math.sin(phi / 2);
        var arc = r * phi;
        var sector = 0.5 * r * r * phi;
        var segment = sector - 0.5 * r * r * Math.sin(phi);

        radiusValue.textContent = formatNum(r, 1);
        angleValue.textContent = Math.round(phiDeg) + '°';
        rotationValue.textContent = Math.round(rotDeg) + '°';

        circumferenceValue.textContent = formatNum(circumference, 3);
        diskAreaValue.textContent = formatNum(diskArea, 3);
        chordLengthValue.textContent = formatNum(chord, 3);
        arcLengthValue.textContent = formatNum(arc, 3);
        sectorAreaValue.textContent = formatNum(sector, 3);
        segmentAreaValue.textContent = formatNum(segment, 3);
        angleRadiansValue.textContent = formatNum(phi, 4);
    }

    [
        radiusSlider,
        angleSlider,
        rotationSlider,
        showSector,
        showSegment,
        showChord,
        showRadii,
        showArc
    ].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    resetBtn.addEventListener('click', function () {
        radiusSlider.value = '4';
        angleSlider.value = '110';
        rotationSlider.value = '20';
        showSector.checked = true;
        showSegment.checked = true;
        showChord.checked = true;
        showRadii.checked = true;
        showArc.checked = true;
        draw();
    });

    redrawBySection[sectionId] = draw;
    draw();
}

function initLineCircleDemo(redrawBySection) {
    var sectionId = 'secna-tecna-a-vnejsi-primka';
    var canvas = document.getElementById('lineCircleCanvas');
    if (!canvas) return;

    var radiusSlider = document.getElementById('lineCircleRadiusSlider');
    var distanceSlider = document.getElementById('lineDistanceSlider');
    var angleSlider = document.getElementById('lineAngleSlider');

    var showDistancePerp = document.getElementById('showDistancePerp');
    var showChordLength = document.getElementById('showChordLength');

    var radiusValue = document.getElementById('lineCircleRadiusValue');
    var distanceValue = document.getElementById('lineDistanceValue');
    var angleValue = document.getElementById('lineAngleValue');

    var lineAbsDistanceValue = document.getElementById('lineAbsDistanceValue');
    var lineComparisonValue = document.getElementById('lineComparisonValue');
    var lineIntersectionCountValue = document.getElementById('lineIntersectionCountValue');
    var lineChordLengthValue = document.getElementById('lineChordLengthValue');
    var lineTypeValue = document.getElementById('lineTypeValue');

    var resetBtn = document.getElementById('resetLineCircle');

    function drawRightAngleMarker(ctx, plane, N, n, u) {
        var s = 0.35;
        var p1 = N;
        var p2 = { x: N.x + u.x * s, y: N.y + u.y * s };
        var p3 = { x: p2.x - n.x * s, y: p2.y - n.y * s };
        var p4 = { x: N.x - n.x * s, y: N.y - n.y * s };

        var c1 = toCanvas(plane, p1);
        var c2 = toCanvas(plane, p2);
        var c3 = toCanvas(plane, p3);
        var c4 = toCanvas(plane, p4);

        ctx.save();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(c1.x, c1.y);
        ctx.lineTo(c2.x, c2.y);
        ctx.lineTo(c3.x, c3.y);
        ctx.lineTo(c4.x, c4.y);
        ctx.stroke();
        ctx.restore();
    }

    function draw() {
        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);
        var plane = createPlane(14, 14, w - 28, h - 28, -8, 8, -6, 6);
        drawPlaneGrid(ctx, plane);

        var r = parseFloat(radiusSlider.value);
        var d = parseFloat(distanceSlider.value);
        var theta = parseFloat(angleSlider.value) * Math.PI / 180;

        var n = { x: Math.cos(theta), y: Math.sin(theta) };
        var u = { x: -n.y, y: n.x };

        var O = { x: 0, y: 0 };
        var N = { x: d * n.x, y: d * n.y };

        drawCircle(ctx, plane, O, r, '#e2e8f0', 'rgba(96,165,250,0.08)', 2.2);
        drawInfiniteLine(ctx, plane, N, u, '#f59e0b', 2.6, false);

        if (showDistancePerp.checked) {
            drawSegment(ctx, plane, O, N, '#34d399', 2, true);
            drawRightAngleMarker(ctx, plane, N, n, u);
        }

        var eps = 0.03;
        var type = '';
        var count = 0;
        var chord = null;
        var relation = '';

        if (d < r - eps) {
            type = 'sečna';
            count = 2;
            relation = 'd < r';

            var hDist = Math.sqrt(Math.max(0, r * r - d * d));
            var P = { x: N.x + u.x * hDist, y: N.y + u.y * hDist };
            var Q = { x: N.x - u.x * hDist, y: N.y - u.y * hDist };
            chord = 2 * hDist;

            if (showChordLength.checked) {
                drawSegment(ctx, plane, P, Q, '#f472b6', 2.4, false);
            }

            drawPoint(ctx, plane, P, '#f8fafc', 'P', 4.5);
            drawPoint(ctx, plane, Q, '#f8fafc', 'Q', 4.5);
        } else if (approx(d, r, eps)) {
            type = 'tečna';
            count = 1;
            relation = 'd = r';

            drawPoint(ctx, plane, N, '#f8fafc', 'T', 4.8);
        } else {
            type = 'vnější přímka';
            count = 0;
            relation = 'd > r';
        }

        drawPoint(ctx, plane, O, '#60a5fa', 'O', 4.8);
        drawPoint(ctx, plane, N, '#fbbf24', 'N', 4.3);

        radiusValue.textContent = formatNum(r, 1);
        distanceValue.textContent = formatNum(d, 1);
        angleValue.textContent = Math.round(parseFloat(angleSlider.value)) + '°';

        lineAbsDistanceValue.textContent = formatNum(d, 3);
        lineComparisonValue.textContent = relation;
        lineIntersectionCountValue.textContent = String(count);
        lineChordLengthValue.textContent = chord == null ? '—' : formatNum(chord, 3);

        lineTypeValue.textContent = type;
        lineTypeValue.className = 'status-chip';
        if (type === 'tečna') {
            lineTypeValue.classList.add('equal');
        } else if (type === 'vnější přímka') {
            lineTypeValue.classList.add('different');
        }
    }

    [
        radiusSlider,
        distanceSlider,
        angleSlider,
        showDistancePerp,
        showChordLength
    ].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    resetBtn.addEventListener('click', function () {
        radiusSlider.value = '3.5';
        distanceSlider.value = '2.0';
        angleSlider.value = '35';
        showDistancePerp.checked = true;
        showChordLength.checked = true;
        draw();
    });

    redrawBySection[sectionId] = draw;
    draw();
}

function classifyTwoCircles(r1, r2, d) {
    var eps = 0.03;
    var sum = r1 + r2;
    var diff = Math.abs(r1 - r2);

    if (d < eps && Math.abs(r1 - r2) < eps) {
        return {
            count: Infinity,
            label: 'splývající kružnice'
        };
    }

    if (d > sum + eps) {
        return {
            count: 0,
            label: 'vnější bez společných bodů'
        };
    }

    if (approx(d, sum, eps)) {
        return {
            count: 1,
            label: 'vnější dotyk'
        };
    }

    if (d < diff - eps) {
        return {
            count: 0,
            label: 'jedna uvnitř druhé bez průniku'
        };
    }

    if (approx(d, diff, eps)) {
        return {
            count: 1,
            label: 'vnitřní dotyk'
        };
    }

    return {
        count: 2,
        label: 'protínají se ve dvou bodech'
    };
}

function circleIntersections(O1, r1, O2, r2) {
    var d = distance(O1, O2);
    if (d < 1e-9) return [];

    var vx = (O2.x - O1.x) / d;
    var vy = (O2.y - O1.y) / d;

    var a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    var h2 = r1 * r1 - a * a;

    if (h2 < -1e-7) return [];

    var px = O1.x + a * vx;
    var py = O1.y + a * vy;

    if (Math.abs(h2) <= 1e-7) {
        return [{ x: px, y: py }];
    }

    var h = Math.sqrt(Math.max(0, h2));
    var rx = -vy * h;
    var ry = vx * h;

    return [
        { x: px + rx, y: py + ry },
        { x: px - rx, y: py - ry }
    ];
}

function initTwoCirclesDemo(redrawBySection) {
    var sectionId = 'vzajemna-poloha-dvou-kruznic';
    var canvas = document.getElementById('twoCirclesCanvas');
    if (!canvas) return;

    var r1Slider = document.getElementById('circle1RadiusSlider');
    var r2Slider = document.getElementById('circle2RadiusSlider');
    var dSlider = document.getElementById('centerDistanceSlider');
    var angleSlider = document.getElementById('centerAngleSlider');

    var showCenterLine = document.getElementById('showCenterLine');
    var showCommonChord = document.getElementById('showCommonChord');

    var r1Value = document.getElementById('circle1RadiusValue');
    var r2Value = document.getElementById('circle2RadiusValue');
    var centerDistanceValue = document.getElementById('centerDistanceValue');
    var centerAngleValue = document.getElementById('centerAngleValue');

    var sumRadiiValue = document.getElementById('sumRadiiValue');
    var diffRadiiValue = document.getElementById('diffRadiiValue');
    var actualDistanceValue = document.getElementById('actualDistanceValue');
    var circleIntersectionsValue = document.getElementById('circleIntersectionsValue');
    var intersectionCoordsValue = document.getElementById('intersectionCoordsValue');
    var circlesPositionValue = document.getElementById('circlesPositionValue');

    var resetBtn = document.getElementById('resetTwoCircles');

    function draw() {
        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);
        var plane = createPlane(14, 14, w - 28, h - 28, -12, 12, -8, 8);
        drawPlaneGrid(ctx, plane);

        var r1 = parseFloat(r1Slider.value);
        var r2 = parseFloat(r2Slider.value);
        var d = parseFloat(dSlider.value);
        var angleDeg = parseFloat(angleSlider.value);
        var ang = angleDeg * Math.PI / 180;

        var O1 = { x: 0, y: 0 };
        var O2 = { x: d * Math.cos(ang), y: d * Math.sin(ang) };

        drawCircle(ctx, plane, O1, r1, '#60a5fa', 'rgba(96,165,250,0.14)', 2.2);
        drawCircle(ctx, plane, O2, r2, '#f59e0b', 'rgba(245,158,11,0.14)', 2.2);

        if (showCenterLine.checked) {
            drawSegment(ctx, plane, O1, O2, 'rgba(226,232,240,0.75)', 1.8, true);
        }

        var klass = classifyTwoCircles(r1, r2, d);
        var intersections = [];

        if (klass.count === 1 || klass.count === 2) {
            intersections = circleIntersections(O1, r1, O2, r2);
        }

        if (klass.count === 2 && intersections.length >= 2) {
            var X = intersections[0];
            var Y = intersections[1];
            drawPoint(ctx, plane, X, '#f8fafc', 'X', 4.4);
            drawPoint(ctx, plane, Y, '#f8fafc', 'Y', 4.4);

            if (showCommonChord.checked) {
                drawSegment(ctx, plane, X, Y, '#f472b6', 2.4, false);
            }
        } else if (klass.count === 1 && intersections.length >= 1) {
            drawPoint(ctx, plane, intersections[0], '#f8fafc', 'T', 4.7);
        }

        drawPoint(ctx, plane, O1, '#60a5fa', 'O1', 4.8);
        drawPoint(ctx, plane, O2, '#f59e0b', 'O2', 4.8);

        if (klass.count === Infinity) {
            ctx.save();
            ctx.fillStyle = '#e2e8f0';
            ctx.font = '700 13px Inter';
            ctx.textAlign = 'left';
            ctx.fillText('Kružnice splývají: nekonečně mnoho společných bodů.', 24, 28);
            ctx.restore();
        }

        r1Value.textContent = formatNum(r1, 1);
        r2Value.textContent = formatNum(r2, 1);
        centerDistanceValue.textContent = formatNum(d, 1);
        centerAngleValue.textContent = Math.round(angleDeg) + '°';

        var sum = r1 + r2;
        var diff = Math.abs(r1 - r2);

        sumRadiiValue.textContent = formatNum(sum, 3);
        diffRadiiValue.textContent = formatNum(diff, 3);
        actualDistanceValue.textContent = formatNum(d, 3);
        circleIntersectionsValue.textContent = klass.count === Infinity ? '∞' : String(klass.count);

        if (klass.count === 2 && intersections.length >= 2) {
            intersectionCoordsValue.textContent =
                'X(' + formatNum(intersections[0].x, 2) + ', ' + formatNum(intersections[0].y, 2) +
                '), Y(' + formatNum(intersections[1].x, 2) + ', ' + formatNum(intersections[1].y, 2) + ')';
        } else if (klass.count === 1 && intersections.length >= 1) {
            intersectionCoordsValue.textContent =
                'T(' + formatNum(intersections[0].x, 2) + ', ' + formatNum(intersections[0].y, 2) + ')';
        } else if (klass.count === Infinity) {
            intersectionCoordsValue.textContent = 'všechny body jsou společné';
        } else {
            intersectionCoordsValue.textContent = '—';
        }

        circlesPositionValue.textContent = klass.label;
        circlesPositionValue.className = 'status-chip';
        if (klass.count === 2 || klass.count === 1 || klass.count === Infinity) {
            circlesPositionValue.classList.add('equal');
        }
        if (klass.count === 0) {
            circlesPositionValue.classList.add('different');
        }
    }

    [
        r1Slider,
        r2Slider,
        dSlider,
        angleSlider,
        showCenterLine,
        showCommonChord
    ].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    resetBtn.addEventListener('click', function () {
        r1Slider.value = '3.6';
        r2Slider.value = '2.4';
        dSlider.value = '5.2';
        angleSlider.value = '10';
        showCenterLine.checked = true;
        showCommonChord.checked = true;
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

