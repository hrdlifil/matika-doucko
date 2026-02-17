
// Kapitola 3: Mnohouhelniky - interactive lesson

document.addEventListener('DOMContentLoaded', function () {
    var redrawBySection = {};

    initPolygonBasicsDemo(redrawBySection);
    initRegularPolygonDemo(redrawBySection);
    initQuadrilateralDemo(redrawBySection);
    initSpecialQuadrilateralDemo(redrawBySection);
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

function dot(a, b) {
    return a.x * b.x + a.y * b.y;
}

function cross(a, b) {
    return a.x * b.y - a.y * b.x;
}

function vector(from, to) {
    return { x: to.x - from.x, y: to.y - from.y };
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
    var p1 = { x: point.x - dir.x * 40, y: point.y - dir.y * 40 };
    var p2 = { x: point.x + dir.x * 40, y: point.y + dir.y * 40 };
    drawSegment(ctx, plane, p1, p2, color, width, dashed);
}

function drawPolygon(ctx, plane, vertices, options) {
    if (!vertices || vertices.length < 3) return;

    var stroke = options && options.stroke ? options.stroke : '#f8fafc';
    var fill = options && options.fill ? options.fill : 'rgba(99,102,241,0.15)';
    var width = options && options.width ? options.width : 2.2;

    ctx.beginPath();
    var first = toCanvas(plane, vertices[0]);
    ctx.moveTo(first.x, first.y);
    for (var i = 1; i < vertices.length; i++) {
        var p = toCanvas(plane, vertices[i]);
        ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
}

function initNavigation(redrawBySection) {
    var sectionOrder = [
        'mnohouhelniky-n-uhelniky',
        'pravidelny-n-uhelnik',
        'ctyruhelniky',
        'tecnovy-a-tetivovy-ctyruhelnik',
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

function polygonName(n) {
    var names = {
        3: 'trojúhelník',
        4: 'čtyřúhelník',
        5: 'pětiúhelník',
        6: 'šestiúhelník',
        7: 'sedmiúhelník',
        8: 'osmiúhelník',
        9: 'devítiúhelník',
        10: 'desetiúhelník',
        11: 'jedenáctiúhelník',
        12: 'dvanáctiúhelník',
        13: 'třináctiúhelník',
        14: 'čtrnáctiúhelník'
    };
    return names[n] || (n + '-úhelník');
}

function createRegularPolygon(n, radius, rotationDeg) {
    var vertices = [];
    var start = (rotationDeg || 0) * Math.PI / 180 - Math.PI / 2;

    for (var i = 0; i < n; i++) {
        var angle = start + (2 * Math.PI * i / n);
        vertices.push({
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        });
    }

    return vertices;
}
function initPolygonBasicsDemo(redrawBySection) {
    var sectionId = 'mnohouhelniky-n-uhelniky';
    var canvas = document.getElementById('polygonBasicsCanvas');
    if (!canvas) return;

    var nSlider = document.getElementById('nSidesSlider');
    var showDiagonals = document.getElementById('showDiagonals');
    var showTriangulation = document.getElementById('showTriangulation');
    var resetBtn = document.getElementById('resetBasics');

    var nValue = document.getElementById('nSidesValue');
    var polygonNameValue = document.getElementById('polygonNameValue');
    var diagonalCountValue = document.getElementById('diagonalCountValue');
    var angleSumValue = document.getElementById('angleSumValue');
    var triangleCountValue = document.getElementById('triangleCountValue');

    function draw() {
        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);
        var plane = createPlane(14, 14, w - 28, h - 28, -8, 8, -6, 6);
        drawPlaneGrid(ctx, plane);

        var n = parseInt(nSlider.value, 10);
        var vertices = createRegularPolygon(n, 4.2, 0);

        if (showDiagonals.checked) {
            for (var i = 0; i < n; i++) {
                for (var j = i + 1; j < n; j++) {
                    var adjacent = (j === i + 1) || (i === 0 && j === n - 1);
                    if (!adjacent) {
                        drawSegment(ctx, plane, vertices[i], vertices[j], 'rgba(125,211,252,0.28)', 1.3, true);
                    }
                }
            }
        }

        if (showTriangulation.checked) {
            for (var k = 2; k <= n - 2; k++) {
                drawSegment(ctx, plane, vertices[0], vertices[k], 'rgba(251,191,36,0.85)', 1.9, false);
            }
        }

        drawPolygon(ctx, plane, vertices, {
            stroke: '#a78bfa',
            fill: 'rgba(99,102,241,0.18)',
            width: 2.5
        });

        for (var p = 0; p < n; p++) {
            var label = String.fromCharCode(65 + p);
            drawPoint(ctx, plane, vertices[p], '#f8fafc', label, 4.5);
        }

        var diagonals = n * (n - 3) / 2;
        var sumAngles = (n - 2) * 180;
        var triangles = n - 2;

        nValue.textContent = n.toString();
        polygonNameValue.textContent = polygonName(n);
        diagonalCountValue.textContent = diagonals.toString();
        angleSumValue.textContent = sumAngles.toString() + '°';
        triangleCountValue.textContent = triangles.toString();
    }

    [nSlider, showDiagonals, showTriangulation].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    resetBtn.addEventListener('click', function () {
        nSlider.value = '6';
        showDiagonals.checked = true;
        showTriangulation.checked = true;
        draw();
    });

    redrawBySection[sectionId] = draw;
    draw();
}

function initRegularPolygonDemo(redrawBySection) {
    var sectionId = 'pravidelny-n-uhelnik';
    var canvas = document.getElementById('regularPolygonCanvas');
    if (!canvas) return;

    var nSlider = document.getElementById('regNSlider');
    var radiusSlider = document.getElementById('regRadiusSlider');
    var rotationSlider = document.getElementById('regRotationSlider');

    var showCircumcircle = document.getElementById('showCircumcircle');
    var showIncircle = document.getElementById('showIncircle');
    var showCentralAngle = document.getElementById('showCentralAngle');
    var resetBtn = document.getElementById('resetRegular');

    var regNValue = document.getElementById('regNValue');
    var regRadiusValue = document.getElementById('regRadiusValue');
    var regRotationValue = document.getElementById('regRotationValue');

    var centralAngleValue = document.getElementById('centralAngleValue');
    var interiorAngleValue = document.getElementById('interiorAngleValue');
    var sideLengthValue = document.getElementById('sideLengthValue');
    var perimeterValue = document.getElementById('perimeterValue');
    var apothemValue = document.getElementById('apothemValue');

    function draw() {
        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);
        var plane = createPlane(14, 14, w - 28, h - 28, -8, 8, -6, 6);
        drawPlaneGrid(ctx, plane);

        var n = parseInt(nSlider.value, 10);
        var R = parseFloat(radiusSlider.value);
        var rotation = parseFloat(rotationSlider.value);

        var vertices = createRegularPolygon(n, R, rotation);

        if (showCircumcircle.checked) {
            var c = toCanvas(plane, { x: 0, y: 0 });
            ctx.save();
            ctx.strokeStyle = 'rgba(56,189,248,0.9)';
            ctx.lineWidth = 1.7;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.arc(c.x, c.y, R * plane.scale, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        var apothem = R * Math.cos(Math.PI / n);
        if (showIncircle.checked) {
            var c2 = toCanvas(plane, { x: 0, y: 0 });
            ctx.save();
            ctx.strokeStyle = 'rgba(52,211,153,0.95)';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(c2.x, c2.y, apothem * plane.scale, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        if (showCentralAngle.checked) {
            drawSegment(ctx, plane, { x: 0, y: 0 }, vertices[0], '#f59e0b', 2.4, false);
            drawSegment(ctx, plane, { x: 0, y: 0 }, vertices[1], '#f59e0b', 2.4, false);

            ctx.save();
            ctx.fillStyle = 'rgba(245,158,11,0.22)';
            ctx.beginPath();
            var center = toCanvas(plane, { x: 0, y: 0 });
            ctx.moveTo(center.x, center.y);
            var start = Math.atan2(vertices[0].y, vertices[0].x);
            var end = Math.atan2(vertices[1].y, vertices[1].x);
            if (end < start) end += Math.PI * 2;
            var step = (end - start) / 28;
            for (var a = start; a <= end + 1e-6; a += step) {
                var q = toCanvas(plane, { x: 1.3 * Math.cos(a), y: 1.3 * Math.sin(a) });
                ctx.lineTo(q.x, q.y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        drawPolygon(ctx, plane, vertices, {
            stroke: '#f472b6',
            fill: 'rgba(236,72,153,0.16)',
            width: 2.6
        });

        drawPoint(ctx, plane, { x: 0, y: 0 }, '#60a5fa', 'O', 5);
        drawPoint(ctx, plane, vertices[0], '#f8fafc', 'A', 4.5);
        drawPoint(ctx, plane, vertices[1], '#f8fafc', 'B', 4.5);

        var central = 360 / n;
        var interior = (n - 2) * 180 / n;
        var side = 2 * R * Math.sin(Math.PI / n);
        var perimeter = n * side;

        regNValue.textContent = n.toString();
        regRadiusValue.textContent = R.toFixed(1);
        regRotationValue.textContent = Math.round(rotation) + '°';

        centralAngleValue.textContent = central.toFixed(2) + '°';
        interiorAngleValue.textContent = interior.toFixed(2) + '°';
        sideLengthValue.textContent = side.toFixed(3);
        perimeterValue.textContent = perimeter.toFixed(3);
        apothemValue.textContent = apothem.toFixed(3);
    }

    [nSlider, radiusSlider, rotationSlider, showCircumcircle, showIncircle, showCentralAngle].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    resetBtn.addEventListener('click', function () {
        nSlider.value = '6';
        radiusSlider.value = '4';
        rotationSlider.value = '0';
        showCircumcircle.checked = true;
        showIncircle.checked = true;
        showCentralAngle.checked = true;
        draw();
    });

    redrawBySection[sectionId] = draw;
    draw();
}
function quadrilateralVertices(type, width, height, skew) {
    var w = width;
    var h = height;
    var s = skew;

    switch (type) {
        case 'trapezoid': {
            var top = w * 0.55;
            var shift = s * 0.6;
            return [
                { x: -w / 2, y: -h / 2 },
                { x: w / 2, y: -h / 2 },
                { x: shift + top / 2, y: h / 2 },
                { x: shift - top / 2, y: h / 2 }
            ];
        }
        case 'parallelogram':
            return [
                { x: -w / 2, y: -h / 2 },
                { x: w / 2, y: -h / 2 },
                { x: w / 2 + s, y: h / 2 },
                { x: -w / 2 + s, y: h / 2 }
            ];
        case 'rectangle':
            return [
                { x: -w / 2, y: -h / 2 },
                { x: w / 2, y: -h / 2 },
                { x: w / 2, y: h / 2 },
                { x: -w / 2, y: h / 2 }
            ];
        case 'rhombus':
            return [
                { x: 0, y: -h / 2 },
                { x: w / 2, y: 0 },
                { x: 0, y: h / 2 },
                { x: -w / 2, y: 0 }
            ];
        case 'square': {
            var a = Math.min(w, h);
            return [
                { x: -a / 2, y: -a / 2 },
                { x: a / 2, y: -a / 2 },
                { x: a / 2, y: a / 2 },
                { x: -a / 2, y: a / 2 }
            ];
        }
        case 'kite':
            return [
                { x: 0, y: -h / 2 },
                { x: w / 2, y: 0 },
                { x: 0, y: h * 0.68 },
                { x: -w / 2, y: 0 }
            ];
        default:
            return [
                { x: -w / 2, y: -h / 2 },
                { x: w / 2, y: -h / 2 + 0.45 * s },
                { x: w / 2 + s, y: h / 2 },
                { x: -w / 2 - 0.55 * s, y: h / 2 - 0.25 * s }
            ];
    }
}

function polygonArea(vertices) {
    var sum = 0;
    for (var i = 0; i < vertices.length; i++) {
        var j = (i + 1) % vertices.length;
        sum += vertices[i].x * vertices[j].y - vertices[j].x * vertices[i].y;
    }
    return Math.abs(sum) / 2;
}

function approxEqual(a, b, eps) {
    return Math.abs(a - b) <= (eps || 0.08);
}

function initQuadrilateralDemo(redrawBySection) {
    var sectionId = 'ctyruhelniky';
    var canvas = document.getElementById('quadrilateralCanvas');
    if (!canvas) return;

    var typeSelect = document.getElementById('quadTypeSelect');
    var widthSlider = document.getElementById('quadWidthSlider');
    var heightSlider = document.getElementById('quadHeightSlider');
    var skewSlider = document.getElementById('quadSkewSlider');
    var resetBtn = document.getElementById('resetQuad');

    var widthValue = document.getElementById('quadWidthValue');
    var heightValue = document.getElementById('quadHeightValue');
    var skewValue = document.getElementById('quadSkewValue');

    var quadTypeValue = document.getElementById('quadTypeValue');
    var parallelPairsValue = document.getElementById('parallelPairsValue');
    var rightAnglesValue = document.getElementById('rightAnglesValue');
    var sideEqualityValue = document.getElementById('sideEqualityValue');
    var diagPropsValue = document.getElementById('diagPropsValue');
    var quadAreaValue = document.getElementById('quadAreaValue');

    var typeNames = {
        general: 'obecný',
        trapezoid: 'lichoběžník',
        parallelogram: 'rovnoběžník',
        rectangle: 'obdélník',
        rhombus: 'kosočtverec',
        square: 'čtverec',
        kite: 'deltoid'
    };

    function draw() {
        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var wPx = setup.w;
        var hPx = setup.h;

        drawBackdrop(ctx, wPx, hPx);
        var plane = createPlane(14, 14, wPx - 28, hPx - 28, -8, 8, -6, 6);
        drawPlaneGrid(ctx, plane);

        var type = typeSelect.value;
        var width = parseFloat(widthSlider.value);
        var height = parseFloat(heightSlider.value);
        var skew = parseFloat(skewSlider.value);

        if (type === 'rectangle' || type === 'square' || type === 'rhombus' || type === 'kite') {
            skewSlider.disabled = true;
        } else {
            skewSlider.disabled = false;
        }

        var V = quadrilateralVertices(type, width, height, skew);
        drawPolygon(ctx, plane, V, {
            stroke: '#38bdf8',
            fill: 'rgba(56,189,248,0.17)',
            width: 2.5
        });

        drawSegment(ctx, plane, V[0], V[2], 'rgba(244,114,182,0.9)', 1.8, true);
        drawSegment(ctx, plane, V[1], V[3], 'rgba(244,114,182,0.9)', 1.8, true);

        var labels = ['A', 'B', 'C', 'D'];
        for (var i = 0; i < 4; i++) {
            drawPoint(ctx, plane, V[i], '#f8fafc', labels[i], 4.8);
        }

        var AB = distance(V[0], V[1]);
        var BC = distance(V[1], V[2]);
        var CD = distance(V[2], V[3]);
        var DA = distance(V[3], V[0]);

        var e1 = vector(V[0], V[1]);
        var e2 = vector(V[1], V[2]);
        var e3 = vector(V[2], V[3]);
        var e4 = vector(V[3], V[0]);

        var parallelPairs = 0;
        if (Math.abs(cross(e1, e3)) <= 0.12) parallelPairs++;
        if (Math.abs(cross(e2, e4)) <= 0.12) parallelPairs++;

        var rightAngles = 0;
        var verts = V;
        for (var k = 0; k < 4; k++) {
            var prev = verts[(k + 3) % 4];
            var curr = verts[k];
            var next = verts[(k + 1) % 4];
            var u = normalize(vector(curr, prev));
            var v = normalize(vector(curr, next));
            if (Math.abs(dot(u, v)) <= 0.05) rightAngles++;
        }

        var allEqual = approxEqual(AB, BC) && approxEqual(BC, CD) && approxEqual(CD, DA);
        var oppositeEqual = approxEqual(AB, CD) && approxEqual(BC, DA);
        var kiteEqual = approxEqual(AB, DA) && approxEqual(BC, CD);

        var AC = distance(V[0], V[2]);
        var BD = distance(V[1], V[3]);
        var diagPerp = Math.abs(dot(vector(V[0], V[2]), vector(V[1], V[3]))) <= 0.12;

        var sideText = 'žádná speciální';
        if (allEqual) sideText = 'všechny 4 strany shodné';
        else if (oppositeEqual) sideText = 'protější strany shodné';
        else if (kiteEqual) sideText = 'dvojice sousedních stran shodné';

        var diagText = '|AC|=' + AC.toFixed(2) + ', |BD|=' + BD.toFixed(2);
        if (approxEqual(AC, BD, 0.12)) diagText += ' (shodné)';
        if (diagPerp) diagText += ', kolmé';

        widthValue.textContent = width.toFixed(1);
        heightValue.textContent = height.toFixed(1);
        skewValue.textContent = skew.toFixed(1);

        quadTypeValue.textContent = typeNames[type] || type;
        parallelPairsValue.textContent = parallelPairs.toString();
        rightAnglesValue.textContent = rightAngles.toString();
        sideEqualityValue.textContent = sideText;
        diagPropsValue.textContent = diagText;
        quadAreaValue.textContent = polygonArea(V).toFixed(2);
    }

    [typeSelect, widthSlider, heightSlider, skewSlider].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    resetBtn.addEventListener('click', function () {
        typeSelect.value = 'general';
        widthSlider.value = '7';
        heightSlider.value = '5';
        skewSlider.value = '1';
        draw();
    });

    redrawBySection[sectionId] = draw;
    draw();
}
function angleAtVertex(prev, vertex, next) {
    var u = normalize(vector(vertex, prev));
    var v = normalize(vector(vertex, next));
    var c = clamp(dot(u, v), -1, 1);
    return Math.acos(c) * 180 / Math.PI;
}

function lineIntersection(n1, d1, n2, d2) {
    var det = n1.x * n2.y - n1.y * n2.x;
    if (Math.abs(det) < 1e-8) {
        return { x: 0, y: 0 };
    }
    return {
        x: (d1 * n2.y - n1.y * d2) / det,
        y: (n1.x * d2 - d1 * n2.x) / det
    };
}

function initSpecialQuadrilateralDemo(redrawBySection) {
    var sectionId = 'tecnovy-a-tetivovy-ctyruhelnik';
    var canvas = document.getElementById('specialQuadCanvas');
    if (!canvas) return;

    var cyclicRotateSlider = document.getElementById('cyclicRotateSlider');
    var cyclicSkewSlider = document.getElementById('cyclicSkewSlider');
    var tangentRotateSlider = document.getElementById('tangentRotateSlider');
    var tangentSkewSlider = document.getElementById('tangentSkewSlider');
    var incircleRadiusSlider = document.getElementById('incircleRadiusSlider');
    var showTangencyPoints = document.getElementById('showTangencyPoints');
    var resetBtn = document.getElementById('resetSpecial');

    var cyclicRotateValue = document.getElementById('cyclicRotateValue');
    var cyclicSkewValue = document.getElementById('cyclicSkewValue');
    var tangentRotateValue = document.getElementById('tangentRotateValue');
    var tangentSkewValue = document.getElementById('tangentSkewValue');
    var incircleRadiusValue = document.getElementById('incircleRadiusValue');

    var cyclicAnglesValue = document.getElementById('cyclicAnglesValue');
    var tangentialSidesValue = document.getElementById('tangentialSidesValue');
    var specialConclusionValue = document.getElementById('specialConclusionValue');

    function drawCyclic(ctx, rect, rotate, skew) {
        var plane = createPlane(rect.x + 8, rect.y + 8, rect.w - 16, rect.h - 16, -7, 7, -5.7, 5.7);
        drawPlaneGrid(ctx, plane);

        var base = [28, 118, 208, 320];
        var tweaks = [0.25, -0.2, 0.15, -0.2];
        var angles = base.map(function (a, i) {
            return (a + rotate + tweaks[i] * skew) * Math.PI / 180;
        });

        var R = 4.2;
        var V = angles.map(function (a) {
            return { x: R * Math.cos(a), y: R * Math.sin(a) };
        });

        var c = toCanvas(plane, { x: 0, y: 0 });
        ctx.save();
        ctx.strokeStyle = 'rgba(96,165,250,0.85)';
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.arc(c.x, c.y, R * plane.scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        drawPolygon(ctx, plane, V, {
            stroke: '#f59e0b',
            fill: 'rgba(245,158,11,0.14)',
            width: 2.4
        });

        drawSegment(ctx, plane, V[0], V[2], 'rgba(244,114,182,0.85)', 1.6, true);
        drawSegment(ctx, plane, V[1], V[3], 'rgba(244,114,182,0.85)', 1.6, true);

        ['A', 'B', 'C', 'D'].forEach(function (label, i) {
            drawPoint(ctx, plane, V[i], '#f8fafc', label, 4.5);
        });

        var A = angleAtVertex(V[3], V[0], V[1]);
        var B = angleAtVertex(V[0], V[1], V[2]);
        var C = angleAtVertex(V[1], V[2], V[3]);
        var D = angleAtVertex(V[2], V[3], V[0]);

        return {
            sumAC: A + C,
            sumBD: B + D
        };
    }

    function drawTangential(ctx, rect, rotate, skew, radius, showPoints) {
        var plane = createPlane(rect.x + 8, rect.y + 8, rect.w - 16, rect.h - 16, -8, 8, -6, 6);
        drawPlaneGrid(ctx, plane);

        var base = [20, 125, 220, 325];
        var tweaks = [0.22, -0.14, 0.2, -0.18];
        var anglesDeg = base.map(function (a, i) {
            return a + rotate + tweaks[i] * skew;
        });

        var normals = anglesDeg.map(function (deg) {
            var rad = deg * Math.PI / 180;
            return { x: Math.cos(rad), y: Math.sin(rad) };
        });

        var r = radius;
        var A = lineIntersection(normals[0], r, normals[1], r);
        var B = lineIntersection(normals[1], r, normals[2], r);
        var C = lineIntersection(normals[2], r, normals[3], r);
        var D = lineIntersection(normals[3], r, normals[0], r);
        var V = [A, B, C, D];

        drawPolygon(ctx, plane, V, {
            stroke: '#34d399',
            fill: 'rgba(52,211,153,0.14)',
            width: 2.4
        });

        var centerPx = toCanvas(plane, { x: 0, y: 0 });
        ctx.save();
        ctx.strokeStyle = 'rgba(52,211,153,0.95)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(centerPx.x, centerPx.y, r * plane.scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ['A', 'B', 'C', 'D'].forEach(function (label, i) {
            drawPoint(ctx, plane, V[i], '#f8fafc', label, 4.5);
        });
        drawPoint(ctx, plane, { x: 0, y: 0 }, '#60a5fa', 'O', 4.2);

        var tangency = [
            { x: r * normals[1].x, y: r * normals[1].y },
            { x: r * normals[2].x, y: r * normals[2].y },
            { x: r * normals[3].x, y: r * normals[3].y },
            { x: r * normals[0].x, y: r * normals[0].y }
        ];

        if (showPoints) {
            tangency.forEach(function (t) {
                drawPoint(ctx, plane, t, '#fbbf24', null, 3.6);
            });
        }

        var a = distance(A, B);
        var b = distance(B, C);
        var c = distance(C, D);
        var d = distance(D, A);

        return {
            ac: a + c,
            bd: b + d
        };
    }

    function draw() {
        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);

        var pad = 12;
        var gap = 12;
        var panelW = (w - 2 * pad - gap) / 2;
        var panelH = h - 2 * pad;

        var left = { x: pad, y: pad, w: panelW, h: panelH };
        var right = { x: pad + panelW + gap, y: pad, w: panelW, h: panelH };

        roundedRect(ctx, left.x, left.y, left.w, left.h, 12);
        ctx.fillStyle = 'rgba(15,23,42,0.42)';
        ctx.fill();
        roundedRect(ctx, right.x, right.y, right.w, right.h, 12);
        ctx.fillStyle = 'rgba(15,23,42,0.42)';
        ctx.fill();

        var cyclicRotate = parseFloat(cyclicRotateSlider.value);
        var cyclicSkew = parseFloat(cyclicSkewSlider.value);
        var tangentRotate = parseFloat(tangentRotateSlider.value);
        var tangentSkew = parseFloat(tangentSkewSlider.value);
        var incircleR = parseFloat(incircleRadiusSlider.value);

        var cyclicData = drawCyclic(ctx, left, cyclicRotate, cyclicSkew);
        var tangentialData = drawTangential(ctx, right, tangentRotate, tangentSkew, incircleR, showTangencyPoints.checked);

        ctx.fillStyle = 'rgba(226,232,240,0.86)';
        ctx.font = '700 12px Inter';
        ctx.textAlign = 'left';
        ctx.fillText('Tětivový čtyřúhelník', left.x + 14, left.y + 18);
        ctx.fillText('Tečnový čtyřúhelník', right.x + 14, right.y + 18);

        cyclicRotateValue.textContent = Math.round(cyclicRotate) + '°';
        cyclicSkewValue.textContent = Math.round(cyclicSkew) + '°';
        tangentRotateValue.textContent = Math.round(tangentRotate) + '°';
        tangentSkewValue.textContent = Math.round(tangentSkew) + '°';
        incircleRadiusValue.textContent = incircleR.toFixed(1);

        var sumAC = cyclicData.sumAC;
        var sumBD = cyclicData.sumBD;
        var ac = tangentialData.ac;
        var bd = tangentialData.bd;

        cyclicAnglesValue.textContent = sumAC.toFixed(2) + '° / ' + sumBD.toFixed(2) + '°';
        tangentialSidesValue.textContent = ac.toFixed(3) + ' / ' + bd.toFixed(3);

        var cyclicOk = Math.abs(sumAC - 180) < 0.25 && Math.abs(sumBD - 180) < 0.25;
        var tangentialOk = Math.abs(ac - bd) < 0.08;

        specialConclusionValue.classList.remove('equal', 'different');
        if (cyclicOk && tangentialOk) {
            specialConclusionValue.textContent = 'obě věty potvrzeny';
            specialConclusionValue.classList.add('equal');
        } else {
            specialConclusionValue.textContent = 'odchylka kvůli zaokrouhlení';
            specialConclusionValue.classList.add('different');
        }
    }

    [
        cyclicRotateSlider,
        cyclicSkewSlider,
        tangentRotateSlider,
        tangentSkewSlider,
        incircleRadiusSlider,
        showTangencyPoints
    ].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    resetBtn.addEventListener('click', function () {
        cyclicRotateSlider.value = '0';
        cyclicSkewSlider.value = '0';
        tangentRotateSlider.value = '0';
        tangentSkewSlider.value = '0';
        incircleRadiusSlider.value = '3';
        showTangencyPoints.checked = true;
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
