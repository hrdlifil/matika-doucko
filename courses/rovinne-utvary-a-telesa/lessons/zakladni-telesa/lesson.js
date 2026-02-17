// Kapitola 3: Zakladni telesa - interactive lesson

document.addEventListener('DOMContentLoaded', function () {
    var redrawBySection = {};

    initNavigation(redrawBySection);
    initCubeDemo(redrawBySection);
    initCuboidDemo(redrawBySection);
    initCylinderDemo(redrawBySection);
    initPrismDemo(redrawBySection);
    initQuickChecks();
    initExercises();
});

function initNavigation(redrawBySection) {
    var sectionOrder = [
        'krychle-objem-povrch-a-uhlopricka',
        'kvadr-objem-povrch-a-uhlopricka',
        'valec-objem-a-povrch',
        'kolmy-hranol-objem-a-obsah',
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

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function formatNum(value, digits) {
    return Number(value).toFixed(digits == null ? 2 : digits);
}

function toRad(deg) {
    return deg * Math.PI / 180;
}

function setupHiDPI(canvas) {
    var dpr = window.devicePixelRatio || 1;
    var parent = canvas.parentElement;
    var nominalWidth = parseInt(canvas.getAttribute('width'), 10) || 760;
    var nominalHeight = parseInt(canvas.getAttribute('height'), 10) || 440;
    var ratio = nominalHeight / nominalWidth;

    var parentWidth = nominalWidth;
    if (parent) {
        var cw = parent.clientWidth;
        if (cw <= 0) {
            var rect = parent.getBoundingClientRect();
            cw = rect.width;
        }
        parentWidth = cw - 16;
    }
    if (parentWidth <= 0) parentWidth = nominalWidth;

    var width = Math.max(320, Math.min(nominalWidth, parentWidth));
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

    ctx.strokeStyle = 'rgba(148,163,184,0.1)';
    ctx.lineWidth = 1;
    var step = clamp(Math.round(w / 24), 22, 36);

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

function rotatePoint3D(p, yaw, pitch) {
    var cy = Math.cos(yaw);
    var sy = Math.sin(yaw);
    var cp = Math.cos(pitch);
    var sp = Math.sin(pitch);

    var x1 = p.x * cy - p.y * sy;
    var y1 = p.x * sy + p.y * cy;
    var z1 = p.z;

    return {
        x: x1,
        y: y1 * cp - z1 * sp,
        z: y1 * sp + z1 * cp
    };
}

function projectPoint(rotPoint, model) {
    return {
        x: model.cx + rotPoint.x * model.scale,
        y: model.cy + rotPoint.y * model.scale,
        depth: rotPoint.z
    };
}

function drawPolygon2D(ctx, points, fill, stroke, width) {
    if (!points || points.length < 3) return;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (var i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
    }
    if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = width || 2;
        ctx.stroke();
    }
    ctx.restore();
}

function drawLine2D(ctx, a, b, color, width, dashed) {
    ctx.save();
    if (dashed) ctx.setLineDash([7, 5]);
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
}

function averageDepth(face, projected) {
    var sum = 0;
    for (var i = 0; i < face.length; i++) {
        sum += projected[face[i]].depth;
    }
    return sum / face.length;
}

function drawBoxScene(ctx, w, h, vertices, yawDeg, pitchDeg, showBodyDiagonal, showFaceDiagonal) {
    var yaw = toRad(yawDeg);
    var pitch = toRad(pitchDeg);
    var rotated = vertices.map(function (v) {
        return rotatePoint3D(v, yaw, pitch);
    });

    var maxAbs = 0;
    rotated.forEach(function (p) {
        maxAbs = Math.max(maxAbs, Math.abs(p.x), Math.abs(p.y));
    });

    var model = {
        cx: w * 0.5,
        cy: h * 0.58,
        scale: (maxAbs > 0) ? Math.min((w * 0.33) / maxAbs, (h * 0.38) / maxAbs) : 1
    };

    var projected = rotated.map(function (p) {
        return projectPoint(p, model);
    });

    var faces = [
        { idx: [0, 1, 2, 3], fill: 'rgba(59,130,246,0.12)' },
        { idx: [4, 5, 6, 7], fill: 'rgba(34,211,238,0.18)' },
        { idx: [0, 1, 5, 4], fill: 'rgba(99,102,241,0.2)' },
        { idx: [1, 2, 6, 5], fill: 'rgba(16,185,129,0.2)' },
        { idx: [2, 3, 7, 6], fill: 'rgba(14,165,233,0.18)' },
        { idx: [3, 0, 4, 7], fill: 'rgba(59,130,246,0.16)' }
    ];

    faces.sort(function (a, b) {
        return averageDepth(a.idx, projected) - averageDepth(b.idx, projected);
    });

    faces.forEach(function (face) {
        drawPolygon2D(
            ctx,
            face.idx.map(function (i) { return projected[i]; }),
            face.fill,
            'rgba(226,232,240,0.35)',
            1.4
        );
    });

    var edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
    ];

    edges.forEach(function (edge) {
        drawLine2D(ctx, projected[edge[0]], projected[edge[1]], 'rgba(241,245,249,0.82)', 1.9, false);
    });

    if (showFaceDiagonal) {
        drawLine2D(ctx, projected[0], projected[2], '#22d3ee', 2.2, false);
    }
    if (showBodyDiagonal) {
        drawLine2D(ctx, projected[0], projected[6], '#f472b6', 2.4, false);
    }
}

function initCubeDemo(redrawBySection) {
    var sectionId = 'krychle-objem-povrch-a-uhlopricka';
    var canvas = document.getElementById('cubeCanvas');
    if (!canvas) return;

    var sideSlider = document.getElementById('cubeSideSlider');
    var yawSlider = document.getElementById('cubeYawSlider');
    var pitchSlider = document.getElementById('cubePitchSlider');
    var showFaceDiagonal = document.getElementById('cubeShowFaceDiagonal');
    var showBodyDiagonal = document.getElementById('cubeShowBodyDiagonal');

    var sideValue = document.getElementById('cubeSideValue');
    var yawValue = document.getElementById('cubeYawValue');
    var pitchValue = document.getElementById('cubePitchValue');

    var volumeValue = document.getElementById('cubeVolumeValue');
    var surfaceValue = document.getElementById('cubeSurfaceValue');
    var faceDiagonalValue = document.getElementById('cubeFaceDiagonalValue');
    var bodyDiagonalValue = document.getElementById('cubeBodyDiagonalValue');
    var sideFromVolumeValue = document.getElementById('cubeSideFromVolumeValue');

    var resetBtn = document.getElementById('cubeReset');

    function draw() {
        var a = parseFloat(sideSlider.value);
        var yaw = parseInt(yawSlider.value, 10);
        var pitch = parseInt(pitchSlider.value, 10);

        sideValue.textContent = formatNum(a, 1);
        yawValue.textContent = yaw + '°';
        pitchValue.textContent = pitch + '°';

        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);

        var half = a / 2;
        var vertices = [
            { x: -half, y: -half, z: -half },
            { x: half, y: -half, z: -half },
            { x: half, y: half, z: -half },
            { x: -half, y: half, z: -half },
            { x: -half, y: -half, z: half },
            { x: half, y: -half, z: half },
            { x: half, y: half, z: half },
            { x: -half, y: half, z: half }
        ];

        drawBoxScene(ctx, w, h, vertices, yaw, pitch, showBodyDiagonal.checked, showFaceDiagonal.checked);

        var V = a * a * a;
        var S = 6 * a * a;
        var us = a * Math.sqrt(2);
        var ut = a * Math.sqrt(3);

        volumeValue.textContent = formatNum(V, 3);
        surfaceValue.textContent = formatNum(S, 3);
        faceDiagonalValue.textContent = formatNum(us, 3);
        bodyDiagonalValue.textContent = formatNum(ut, 3);
        sideFromVolumeValue.textContent = formatNum(Math.cbrt(V), 3);
    }

    [sideSlider, yawSlider, pitchSlider, showFaceDiagonal, showBodyDiagonal].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    resetBtn.addEventListener('click', function () {
        sideSlider.value = '4';
        yawSlider.value = '42';
        pitchSlider.value = '26';
        showFaceDiagonal.checked = true;
        showBodyDiagonal.checked = true;
        draw();
    });

    redrawBySection[sectionId] = draw;
    draw();
}

function initCuboidDemo(redrawBySection) {
    var sectionId = 'kvadr-objem-povrch-a-uhlopricka';
    var canvas = document.getElementById('cuboidCanvas');
    if (!canvas) return;

    var aSlider = document.getElementById('cuboidASlider');
    var bSlider = document.getElementById('cuboidBSlider');
    var cSlider = document.getElementById('cuboidCSlider');
    var yawSlider = document.getElementById('cuboidYawSlider');
    var showBodyDiagonal = document.getElementById('cuboidShowBodyDiagonal');
    var showFaceDiagonal = document.getElementById('cuboidShowFaceDiagonal');

    var aValue = document.getElementById('cuboidAValue');
    var bValue = document.getElementById('cuboidBValue');
    var cValue = document.getElementById('cuboidCValue');
    var yawValue = document.getElementById('cuboidYawValue');

    var volumeValue = document.getElementById('cuboidVolumeValue');
    var surfaceValue = document.getElementById('cuboidSurfaceValue');
    var bodyDiagValue = document.getElementById('cuboidBodyDiagonalValue');
    var diagABValue = document.getElementById('cuboidDiagABValue');
    var diagACValue = document.getElementById('cuboidDiagACValue');
    var diagBCValue = document.getElementById('cuboidDiagBCValue');

    var resetBtn = document.getElementById('cuboidReset');

    function draw() {
        var a = parseFloat(aSlider.value);
        var b = parseFloat(bSlider.value);
        var c = parseFloat(cSlider.value);
        var yaw = parseInt(yawSlider.value, 10);

        aValue.textContent = formatNum(a, 1);
        bValue.textContent = formatNum(b, 1);
        cValue.textContent = formatNum(c, 1);
        yawValue.textContent = yaw + '°';

        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);

        var hx = a / 2;
        var hy = b / 2;
        var hz = c / 2;

        var vertices = [
            { x: -hx, y: -hy, z: -hz },
            { x: hx, y: -hy, z: -hz },
            { x: hx, y: hy, z: -hz },
            { x: -hx, y: hy, z: -hz },
            { x: -hx, y: -hy, z: hz },
            { x: hx, y: -hy, z: hz },
            { x: hx, y: hy, z: hz },
            { x: -hx, y: hy, z: hz }
        ];

        drawBoxScene(ctx, w, h, vertices, yaw, 24, showBodyDiagonal.checked, showFaceDiagonal.checked);

        var V = a * b * c;
        var S = 2 * (a * b + a * c + b * c);
        var body = Math.sqrt(a * a + b * b + c * c);
        var dab = Math.sqrt(a * a + b * b);
        var dac = Math.sqrt(a * a + c * c);
        var dbc = Math.sqrt(b * b + c * c);

        volumeValue.textContent = formatNum(V, 3);
        surfaceValue.textContent = formatNum(S, 3);
        bodyDiagValue.textContent = formatNum(body, 3);
        diagABValue.textContent = formatNum(dab, 3);
        diagACValue.textContent = formatNum(dac, 3);
        diagBCValue.textContent = formatNum(dbc, 3);
    }

    [aSlider, bSlider, cSlider, yawSlider, showBodyDiagonal, showFaceDiagonal].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    resetBtn.addEventListener('click', function () {
        aSlider.value = '6.5';
        bSlider.value = '4';
        cSlider.value = '3.5';
        yawSlider.value = '38';
        showBodyDiagonal.checked = true;
        showFaceDiagonal.checked = true;
        draw();
    });

    redrawBySection[sectionId] = draw;
    draw();
}

function initCylinderDemo(redrawBySection) {
    var sectionId = 'valec-objem-a-povrch';
    var canvas = document.getElementById('cylinderCanvas');
    if (!canvas) return;

    var radiusSlider = document.getElementById('cylinderRadiusSlider');
    var heightSlider = document.getElementById('cylinderHeightSlider');
    var perspectiveSlider = document.getElementById('cylinderPerspectiveSlider');
    var showNet = document.getElementById('cylinderShowNet');

    var radiusValue = document.getElementById('cylinderRadiusValue');
    var heightValue = document.getElementById('cylinderHeightValue');
    var perspectiveValue = document.getElementById('cylinderPerspectiveValue');

    var baseAreaValue = document.getElementById('cylinderBaseAreaValue');
    var lateralValue = document.getElementById('cylinderLateralValue');
    var surfaceValue = document.getElementById('cylinderSurfaceValue');
    var volumeValue = document.getElementById('cylinderVolumeValue');
    var circumferenceValue = document.getElementById('cylinderCircumferenceValue');

    var resetBtn = document.getElementById('cylinderReset');

    function drawCylinderShape(ctx, xCenter, topY, rPx, hPx, ellipseRatio) {
        var bottomY = topY + hPx;
        var ry = rPx * ellipseRatio;

        ctx.save();

        ctx.beginPath();
        ctx.moveTo(xCenter - rPx, topY);
        ctx.lineTo(xCenter - rPx, bottomY);
        ctx.ellipse(xCenter, bottomY, rPx, ry, 0, Math.PI, 0, true);
        ctx.lineTo(xCenter + rPx, topY);
        ctx.closePath();
        ctx.fillStyle = 'rgba(59,130,246,0.25)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(226,232,240,0.65)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(xCenter, topY, rPx, ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(34,211,238,0.22)';
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(xCenter, bottomY, rPx, ry, 0, 0, Math.PI, true);
        ctx.strokeStyle = 'rgba(226,232,240,0.45)';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([6, 4]);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.ellipse(xCenter, bottomY, rPx, ry, 0, Math.PI, 0, false);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    function drawNet(ctx, x, y, r, h, scale) {
        var width = 2 * Math.PI * r * scale;
        var height = h * scale;
        var radius = r * scale;

        ctx.save();

        ctx.fillStyle = 'rgba(16,185,129,0.18)';
        ctx.strokeStyle = 'rgba(16,185,129,0.85)';
        ctx.lineWidth = 1.8;
        ctx.fillRect(x, y, width, height);
        ctx.strokeRect(x, y, width, height);

        ctx.beginPath();
        ctx.arc(x + radius, y - radius - 12, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(14,165,233,0.2)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(14,165,233,0.95)';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x + width - radius, y + height + radius + 12, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(14,165,233,0.2)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(14,165,233,0.95)';
        ctx.stroke();

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '600 12px Inter';
        ctx.textAlign = 'left';
        ctx.fillText('2πr', x + width * 0.42, y + height + 18);
        ctx.fillText('v', x - 14, y + height * 0.56);
        ctx.fillText('r', x + radius - 4, y - 12);

        ctx.restore();
    }

    function draw() {
        var r = parseFloat(radiusSlider.value);
        var v = parseFloat(heightSlider.value);
        var perspective = parseFloat(perspectiveSlider.value);

        radiusValue.textContent = formatNum(r, 1);
        heightValue.textContent = formatNum(v, 1);
        perspectiveValue.textContent = formatNum(perspective, 2);

        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);

        var drawNetEnabled = showNet.checked;
        var leftWidth = drawNetEnabled ? w * 0.58 : w * 0.92;

        var cylScale = Math.min((leftWidth * 0.38) / (r + 0.2), (h * 0.52) / (v + 0.6));
        var rPx = r * cylScale;
        var hPx = v * cylScale;

        drawCylinderShape(ctx, leftWidth * 0.52, h * 0.22, rPx, hPx, perspective);

        if (drawNetEnabled) {
            var netScale = Math.min((w * 0.34) / (2 * Math.PI * r + 1), (h * 0.45) / (v + 1));
            var netX = w * 0.64;
            var netY = h * 0.3;
            drawNet(ctx, netX, netY, r, v, netScale);
        }

        var Sp = Math.PI * r * r;
        var Spl = 2 * Math.PI * r * v;
        var S = 2 * Sp + Spl;
        var V = Sp * v;
        var o = 2 * Math.PI * r;

        baseAreaValue.textContent = formatNum(Sp, 3);
        lateralValue.textContent = formatNum(Spl, 3);
        surfaceValue.textContent = formatNum(S, 3);
        volumeValue.textContent = formatNum(V, 3);
        circumferenceValue.textContent = formatNum(o, 3);
    }

    [radiusSlider, heightSlider, perspectiveSlider, showNet].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    resetBtn.addEventListener('click', function () {
        radiusSlider.value = '3.5';
        heightSlider.value = '7';
        perspectiveSlider.value = '0.35';
        showNet.checked = true;
        draw();
    });

    redrawBySection[sectionId] = draw;
    draw();
}

function initPrismDemo(redrawBySection) {
    var sectionId = 'kolmy-hranol-objem-a-obsah';
    var canvas = document.getElementById('prismCanvas');
    if (!canvas) return;

    var nSlider = document.getElementById('prismNSlider');
    var sideSlider = document.getElementById('prismSideSlider');
    var heightSlider = document.getElementById('prismHeightSlider');
    var yawSlider = document.getElementById('prismYawSlider');
    var showTriangulation = document.getElementById('prismShowTriangulation');

    var nValue = document.getElementById('prismNValue');
    var sideValue = document.getElementById('prismSideValue');
    var heightValue = document.getElementById('prismHeightValue');
    var yawValue = document.getElementById('prismYawValue');

    var perimeterValue = document.getElementById('prismPerimeterValue');
    var baseAreaValue = document.getElementById('prismBaseAreaValue');
    var lateralValue = document.getElementById('prismLateralValue');
    var surfaceValue = document.getElementById('prismSurfaceValue');
    var volumeValue = document.getElementById('prismVolumeValue');

    var resetBtn = document.getElementById('prismReset');

    function buildPrismVertices(n, a, h) {
        var R = a / (2 * Math.sin(Math.PI / n));
        var bottom = [];
        var top = [];

        for (var i = 0; i < n; i++) {
            var angle = -Math.PI / 2 + (i * 2 * Math.PI / n);
            var x = R * Math.cos(angle);
            var y = R * Math.sin(angle);
            bottom.push({ x: x, y: y, z: -h / 2 });
            top.push({ x: x, y: y, z: h / 2 });
        }

        return bottom.concat(top);
    }

    function draw() {
        var n = parseInt(nSlider.value, 10);
        var a = parseFloat(sideSlider.value);
        var hPrism = parseFloat(heightSlider.value);
        var yaw = parseInt(yawSlider.value, 10);

        nValue.textContent = String(n);
        sideValue.textContent = formatNum(a, 1);
        heightValue.textContent = formatNum(hPrism, 1);
        yawValue.textContent = yaw + '°';

        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);

        var vertices = buildPrismVertices(n, a, hPrism);
        var rotated = vertices.map(function (v) {
            return rotatePoint3D(v, toRad(yaw), toRad(22));
        });

        var maxAbs = 0;
        rotated.forEach(function (p) {
            maxAbs = Math.max(maxAbs, Math.abs(p.x), Math.abs(p.y));
        });

        var model = {
            cx: w * 0.5,
            cy: h * 0.58,
            scale: (maxAbs > 0) ? Math.min((w * 0.34) / maxAbs, (h * 0.4) / maxAbs) : 1
        };

        var projected = rotated.map(function (p) {
            return projectPoint(p, model);
        });

        var sideFaces = [];
        for (var i = 0; i < n; i++) {
            var j = (i + 1) % n;
            sideFaces.push([i, j, j + n, i + n]);
        }

        sideFaces.sort(function (f1, f2) {
            return averageDepth(f1, projected) - averageDepth(f2, projected);
        });

        sideFaces.forEach(function (face, idx) {
            var tone = 0.16 + (idx % 2) * 0.06;
            drawPolygon2D(
                ctx,
                [projected[face[0]], projected[face[1]], projected[face[2]], projected[face[3]]],
                'rgba(59,130,246,' + tone + ')',
                'rgba(226,232,240,0.42)',
                1.4
            );
        });

        var topFace = [];
        var bottomFace = [];
        for (var k = 0; k < n; k++) {
            bottomFace.push(projected[k]);
            topFace.push(projected[k + n]);
        }

        drawPolygon2D(ctx, bottomFace, 'rgba(14,165,233,0.12)', 'rgba(226,232,240,0.35)', 1.5);
        drawPolygon2D(ctx, topFace, 'rgba(16,185,129,0.2)', 'rgba(226,232,240,0.9)', 2);

        for (var m = 0; m < n; m++) {
            var next = (m + 1) % n;
            drawLine2D(ctx, projected[m], projected[next], 'rgba(241,245,249,0.78)', 1.5, false);
            drawLine2D(ctx, projected[m + n], projected[next + n], '#f8fafc', 1.9, false);
            drawLine2D(ctx, projected[m], projected[m + n], 'rgba(226,232,240,0.72)', 1.4, false);
        }

        if (showTriangulation.checked) {
            var centerTop = { x: 0, y: 0, z: hPrism / 2 };
            var centerTopProjected = projectPoint(rotatePoint3D(centerTop, toRad(yaw), toRad(22)), model);
            for (var t = 0; t < n; t++) {
                drawLine2D(ctx, centerTopProjected, projected[t + n], 'rgba(34,211,238,0.7)', 1.3, true);
            }
        }

        var perimeter = n * a;
        var baseArea = (n * a * a) / (4 * Math.tan(Math.PI / n));
        var lateral = perimeter * hPrism;
        var surface = 2 * baseArea + lateral;
        var volume = baseArea * hPrism;

        perimeterValue.textContent = formatNum(perimeter, 3);
        baseAreaValue.textContent = formatNum(baseArea, 3);
        lateralValue.textContent = formatNum(lateral, 3);
        surfaceValue.textContent = formatNum(surface, 3);
        volumeValue.textContent = formatNum(volume, 3);
    }

    [nSlider, sideSlider, heightSlider, yawSlider, showTriangulation].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    resetBtn.addEventListener('click', function () {
        nSlider.value = '6';
        sideSlider.value = '3.5';
        heightSlider.value = '8';
        yawSlider.value = '32';
        showTriangulation.checked = true;
        draw();
    });

    redrawBySection[sectionId] = draw;
    draw();
}

function initQuickChecks() {
    var cards = Array.prototype.slice.call(document.querySelectorAll('.quick-check'));
    if (cards.length === 0) return;

    cards.forEach(function (card) {
        var input = card.querySelector('.quick-check-input');
        var button = card.querySelector('.quick-check-btn');
        var feedback = card.querySelector('.quick-check-feedback');

        var answer = parseFloat(card.getAttribute('data-answer'));
        var tolerance = parseFloat(card.getAttribute('data-tolerance') || '0.01');
        var answerDisplay = card.getAttribute('data-answer-display') || formatNum(answer, 3);

        function check() {
            var raw = (input.value || '').trim().replace(',', '.');
            var value = parseFloat(raw);

            if (isNaN(value)) {
                feedback.textContent = 'Zadejte prosím číselnou hodnotu.';
                feedback.className = 'quick-check-feedback show incorrect';
                return;
            }

            var ok = Math.abs(value - answer) <= tolerance;
            if (ok) {
                feedback.textContent = 'Správně. Výsledek je v povolené toleranci.';
                feedback.className = 'quick-check-feedback show correct';
                card.setAttribute('data-done', 'true');
                input.disabled = true;
                button.disabled = true;
            } else {
                feedback.textContent = 'Nesprávně. Správný výsledek: ' + answerDisplay + '.';
                feedback.className = 'quick-check-feedback show incorrect';
            }
        }

        button.addEventListener('click', check);
        input.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                check();
            }
        });
    });
}

function initExercises() {
    var checkButtons = document.querySelectorAll('.btn-check');
    if (checkButtons.length === 0) return;

    var messages = {
        '1': {
            correct: 'Správně. S = 6a² = 6·25 = 150 cm².',
            incorrect: 'Nesprávně. Správně je b): S = 6a² = 6·25 = 150 cm².'
        },
        '2': {
            correct: 'Správně. Tělesová úhlopříčka krychle je u_t = a√3 = 2√3.',
            incorrect: 'Nesprávně. Správně je c): u_t = a√3, tedy 2√3.'
        },
        '3': {
            correct: 'Správně. u = √(3²+4²+12²) = √169 = 13.',
            incorrect: 'Nesprávně. Správně je a): u = 13.'
        },
        '4': {
            correct: 'Správně. S = 2(ab+ac+bc) = 2(6+8+12) = 52.',
            incorrect: 'Nesprávně. Správně je b): 52.'
        },
        '5': {
            correct: 'Správně. V = πr²v = π·4·5 = 20π.',
            incorrect: 'Nesprávně. Správně je a): 20π.'
        },
        '6': {
            correct: 'Správně. S = 2πr(r+v) = 2π·4·(4+6) = 80π.',
            incorrect: 'Nesprávně. Správně je b): 80π.'
        },
        '7': {
            correct: 'Správně. V = S_p·v = 18·7 = 126 cm³.',
            incorrect: 'Nesprávně. Správně je a): 126 cm³.'
        },
        '8': {
            correct: 'Správně. S = 2S_p + o_pv = 36 + 140 = 176 cm².',
            incorrect: 'Nesprávně. Správně je a): 176 cm².'
        }
    };

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

            var msg = messages[ex] || {
                correct: 'Správně.',
                incorrect: 'Nesprávně. Správná odpověď je zvýrazněna zeleně.'
            };
            feedback.textContent = isCorrect ? msg.correct : msg.incorrect;
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
