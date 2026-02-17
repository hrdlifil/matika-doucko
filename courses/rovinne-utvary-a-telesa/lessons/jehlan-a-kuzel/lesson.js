// Kapitola 4: Jehlan a kuzel - interactive lesson

document.addEventListener('DOMContentLoaded', function () {
    var redrawBySection = {};

    initNavigation(redrawBySection);
    initPyramidDemo(redrawBySection);
    initConeDemo(redrawBySection);
    initFrustumPyramidDemo(redrawBySection);
    initFrustumConeDemo(redrawBySection);
    initQuickChecks();
    initExercises();
});

function initNavigation(redrawBySection) {
    var sectionOrder = [
        'jehlan-objem-a-povrch',
        'rotacni-kuzel-objem-a-povrch',
        'komoly-jehlan-objem-a-povrch',
        'komoly-rotacni-kuzel-objem-a-povrch',
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
        }, 130);
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

function drawPoint2D(ctx, p, color, radius) {
    ctx.save();
    ctx.fillStyle = color || '#f8fafc';
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius || 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function averageDepth(face, projected) {
    var sum = 0;
    for (var i = 0; i < face.length; i++) {
        sum += projected[face[i]].depth;
    }
    return sum / face.length;
}

function buildRegularPolygonPoints(n, radius, z) {
    var pts = [];
    for (var i = 0; i < n; i++) {
        var angle = -Math.PI / 2 + (i * 2 * Math.PI / n);
        pts.push({
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle),
            z: z
        });
    }
    return pts;
}

function initPyramidDemo(redrawBySection) {
    var sectionId = 'jehlan-objem-a-povrch';
    var canvas = document.getElementById('pyramidCanvas');
    if (!canvas) return;

    var nSlider = document.getElementById('pyramidN');
    var sideSlider = document.getElementById('pyramidSide');
    var heightSlider = document.getElementById('pyramidHeight');
    var yawSlider = document.getElementById('pyramidYaw');
    var showHeight = document.getElementById('pyramidShowHeight');
    var showSlant = document.getElementById('pyramidShowSlant');
    var resetBtn = document.getElementById('pyramidReset');

    var nValue = document.getElementById('pyramidNValue');
    var sideValue = document.getElementById('pyramidSideValue');
    var heightValue = document.getElementById('pyramidHeightValue');
    var yawValue = document.getElementById('pyramidYawValue');

    var baseAreaValue = document.getElementById('pyramidBaseAreaValue');
    var perimeterValue = document.getElementById('pyramidPerimeterValue');
    var inradiusValue = document.getElementById('pyramidInradiusValue');
    var slantValue = document.getElementById('pyramidSlantValue');
    var lateralValue = document.getElementById('pyramidLateralValue');
    var surfaceValue = document.getElementById('pyramidSurfaceValue');
    var volumeValue = document.getElementById('pyramidVolumeValue');

    function draw() {
        var n = parseInt(nSlider.value, 10);
        var a = parseFloat(sideSlider.value);
        var v = parseFloat(heightSlider.value);
        var yawDeg = parseInt(yawSlider.value, 10);

        var R = a / (2 * Math.sin(Math.PI / n));
        var rho = a / (2 * Math.tan(Math.PI / n));
        var Sbase = (n * a * a) / (4 * Math.tan(Math.PI / n));
        var perimeter = n * a;
        var s = Math.sqrt(v * v + rho * rho);
        var Slateral = 0.5 * perimeter * s;
        var Stotal = Sbase + Slateral;
        var volume = (Sbase * v) / 3;

        nValue.textContent = String(n);
        sideValue.textContent = formatNum(a, 1);
        heightValue.textContent = formatNum(v, 1);
        yawValue.textContent = yawDeg + '°';

        baseAreaValue.textContent = formatNum(Sbase, 3);
        perimeterValue.textContent = formatNum(perimeter, 3);
        inradiusValue.textContent = formatNum(rho, 3);
        slantValue.textContent = formatNum(s, 3);
        lateralValue.textContent = formatNum(Slateral, 3);
        surfaceValue.textContent = formatNum(Stotal, 3);
        volumeValue.textContent = formatNum(volume, 3);

        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);

        var base = buildRegularPolygonPoints(n, R, -v / 2);
        var apex = { x: 0, y: 0, z: v / 2 };
        var points = base.concat([apex]);

        var yaw = toRad(yawDeg);
        var pitch = toRad(24);
        var rotated = points.map(function (p) {
            return rotatePoint3D(p, yaw, pitch);
        });

        var maxAbs = 0;
        rotated.forEach(function (p) {
            maxAbs = Math.max(maxAbs, Math.abs(p.x), Math.abs(p.y));
        });
        maxAbs = Math.max(maxAbs, 0.1);

        var model = {
            cx: w * 0.5,
            cy: h * 0.62,
            scale: Math.min((w * 0.35) / maxAbs, (h * 0.42) / maxAbs)
        };

        var projected = rotated.map(function (p) {
            return projectPoint(p, model);
        });

        var faces = [];
        var baseFace = [];
        for (var i = 0; i < n; i++) {
            baseFace.push(i);
        }
        faces.push({ idx: baseFace, fill: 'rgba(56,189,248,0.18)', stroke: 'rgba(226,232,240,0.6)' });

        for (var j = 0; j < n; j++) {
            var next = (j + 1) % n;
            faces.push({
                idx: [j, next, n],
                fill: (j % 2 === 0) ? 'rgba(99,102,241,0.2)' : 'rgba(59,130,246,0.16)',
                stroke: 'rgba(226,232,240,0.55)'
            });
        }

        faces.sort(function (aFace, bFace) {
            return averageDepth(aFace.idx, projected) - averageDepth(bFace.idx, projected);
        });

        faces.forEach(function (face) {
            drawPolygon2D(
                ctx,
                face.idx.map(function (idx) { return projected[idx]; }),
                face.fill,
                face.stroke,
                1.4
            );
        });

        for (var e = 0; e < n; e++) {
            var eNext = (e + 1) % n;
            drawLine2D(ctx, projected[e], projected[eNext], 'rgba(241,245,249,0.82)', 1.8, false);
            drawLine2D(ctx, projected[e], projected[n], 'rgba(226,232,240,0.72)', 1.6, false);
        }

        if (showHeight.checked) {
            var baseCenter = rotatePoint3D({ x: 0, y: 0, z: -v / 2 }, yaw, pitch);
            var centerProjected = projectPoint(baseCenter, model);
            drawLine2D(ctx, projected[n], centerProjected, '#22c55e', 2.3, true);
        }

        if (showSlant.checked) {
            var pA = base[0];
            var pB = base[1];
            var mid = {
                x: (pA.x + pB.x) / 2,
                y: (pA.y + pB.y) / 2,
                z: -v / 2
            };
            var midProjected = projectPoint(rotatePoint3D(mid, yaw, pitch), model);
            drawLine2D(ctx, projected[n], midProjected, '#22d3ee', 2.3, false);
        }

        drawPoint2D(ctx, projected[n], '#f59e0b', 4.7);
    }

    [nSlider, sideSlider, heightSlider, yawSlider, showHeight, showSlant].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    resetBtn.addEventListener('click', function () {
        nSlider.value = '4';
        sideSlider.value = '6';
        heightSlider.value = '8';
        yawSlider.value = '34';
        showHeight.checked = true;
        showSlant.checked = true;
        draw();
    });

    redrawBySection[sectionId] = draw;
    draw();
}
function initConeDemo(redrawBySection) {
    var sectionId = 'rotacni-kuzel-objem-a-povrch';
    var canvas = document.getElementById('coneCanvas');
    if (!canvas) return;

    var radiusSlider = document.getElementById('coneRadius');
    var heightSlider = document.getElementById('coneHeight');
    var perspectiveSlider = document.getElementById('conePerspective');
    var showNet = document.getElementById('coneShowNet');
    var resetBtn = document.getElementById('coneReset');

    var radiusValue = document.getElementById('coneRadiusValue');
    var heightValue = document.getElementById('coneHeightValue');
    var perspectiveValue = document.getElementById('conePerspectiveValue');

    var slantValue = document.getElementById('coneSlantValue');
    var baseAreaValue = document.getElementById('coneBaseAreaValue');
    var lateralValue = document.getElementById('coneLateralValue');
    var surfaceValue = document.getElementById('coneSurfaceValue');
    var volumeValue = document.getElementById('coneVolumeValue');
    var netAngleValue = document.getElementById('coneNetAngleValue');

    function drawConeBody(ctx, xCenter, apexY, rPx, baseY, ellipseRatio) {
        var ry = rPx * ellipseRatio;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(xCenter, apexY);
        ctx.lineTo(xCenter - rPx, baseY);
        ctx.ellipse(xCenter, baseY, rPx, ry, 0, Math.PI, 0, false);
        ctx.closePath();
        ctx.fillStyle = 'rgba(59,130,246,0.24)';
        ctx.fill();

        ctx.strokeStyle = 'rgba(226,232,240,0.84)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(xCenter, apexY);
        ctx.lineTo(xCenter - rPx, baseY);
        ctx.moveTo(xCenter, apexY);
        ctx.lineTo(xCenter + rPx, baseY);
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(xCenter, baseY, rPx, ry, 0, 0, Math.PI, true);
        ctx.strokeStyle = 'rgba(226,232,240,0.45)';
        ctx.lineWidth = 1.7;
        ctx.setLineDash([6, 4]);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.ellipse(xCenter, baseY, rPx, ry, 0, Math.PI, 0, false);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2.1;
        ctx.stroke();
        ctx.restore();
    }

    function drawConeNet(ctx, centerX, centerY, radius, angleRad) {
        var start = -Math.PI / 2 - angleRad / 2;
        var end = -Math.PI / 2 + angleRad / 2;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, start, end, false);
        ctx.closePath();
        ctx.fillStyle = 'rgba(16,185,129,0.18)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(16,185,129,0.95)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.strokeStyle = 'rgba(34,211,238,0.95)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + radius * Math.cos(start), centerY + radius * Math.sin(start));
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + radius * Math.cos(end), centerY + radius * Math.sin(end));
        ctx.stroke();

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '600 12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('s', centerX, centerY - radius - 8);
        ctx.restore();
    }

    function draw() {
        var r = parseFloat(radiusSlider.value);
        var v = parseFloat(heightSlider.value);
        var perspective = parseFloat(perspectiveSlider.value);

        var s = Math.sqrt(r * r + v * v);
        var Sbase = Math.PI * r * r;
        var Slateral = Math.PI * r * s;
        var Stotal = Sbase + Slateral;
        var V = (Math.PI * r * r * v) / 3;
        var alpha = (2 * Math.PI * r) / s;

        radiusValue.textContent = formatNum(r, 1);
        heightValue.textContent = formatNum(v, 1);
        perspectiveValue.textContent = formatNum(perspective, 2);

        slantValue.textContent = formatNum(s, 3);
        baseAreaValue.textContent = formatNum(Sbase, 3);
        lateralValue.textContent = formatNum(Slateral, 3);
        surfaceValue.textContent = formatNum(Stotal, 3);
        volumeValue.textContent = formatNum(V, 3);
        netAngleValue.textContent = formatNum(alpha * 180 / Math.PI, 2) + '°';

        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);

        var showNetEnabled = showNet.checked;
        var leftWidth = showNetEnabled ? w * 0.58 : w * 0.9;

        var scale = Math.min((leftWidth * 0.26) / (r + 0.2), (h * 0.62) / (v + 0.6));
        var rPx = r * scale;
        var apexY = h * 0.14;
        var baseY = apexY + v * scale;
        var xCenter = leftWidth * 0.52;

        drawConeBody(ctx, xCenter, apexY, rPx, baseY, perspective);

        var baseCenter = { x: xCenter, y: baseY };
        drawLine2D(ctx, { x: xCenter, y: apexY }, baseCenter, '#22c55e', 2.2, true);
        drawLine2D(ctx, { x: xCenter, y: apexY }, { x: xCenter + rPx, y: baseY }, '#22d3ee', 2.2, false);

        ctx.fillStyle = '#22c55e';
        ctx.font = '600 12px Inter';
        ctx.fillText('v', xCenter + 6, (apexY + baseY) / 2);
        ctx.fillStyle = '#22d3ee';
        ctx.fillText('s', xCenter + rPx * 0.55, apexY + (baseY - apexY) * 0.58);

        if (showNetEnabled) {
            var netScale = Math.min((w * 0.34) / (2 * s + 1), (h * 0.58) / (s + 1));
            var netRadius = s * netScale;
            var centerX = w * 0.78;
            var centerY = h * 0.73;
            drawConeNet(ctx, centerX, centerY, netRadius, alpha);

            ctx.fillStyle = '#93c5fd';
            ctx.font = '600 12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('oblouk = 2πr', centerX, centerY + 18);
        }
    }

    [radiusSlider, heightSlider, perspectiveSlider, showNet].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    resetBtn.addEventListener('click', function () {
        radiusSlider.value = '5';
        heightSlider.value = '12';
        perspectiveSlider.value = '0.34';
        showNet.checked = true;
        draw();
    });

    redrawBySection[sectionId] = draw;
    draw();
}

function initFrustumPyramidDemo(redrawBySection) {
    var sectionId = 'komoly-jehlan-objem-a-povrch';
    var canvas = document.getElementById('frustumPyramidCanvas');
    if (!canvas) return;

    var nSlider = document.getElementById('frustumPyrN');
    var a1Slider = document.getElementById('frustumPyrA1');
    var a2Slider = document.getElementById('frustumPyrA2');
    var heightSlider = document.getElementById('frustumPyrHeight');
    var yawSlider = document.getElementById('frustumPyrYaw');
    var showSlant = document.getElementById('frustumPyrShowSlant');
    var resetBtn = document.getElementById('frustumPyrReset');

    var nValue = document.getElementById('frustumPyrNValue');
    var a1Value = document.getElementById('frustumPyrA1Value');
    var a2Value = document.getElementById('frustumPyrA2Value');
    var heightValue = document.getElementById('frustumPyrHeightValue');
    var yawValue = document.getElementById('frustumPyrYawValue');

    var base1Value = document.getElementById('frustumPyrBase1Value');
    var base2Value = document.getElementById('frustumPyrBase2Value');
    var perimetersValue = document.getElementById('frustumPyrPerimetersValue');
    var slantValue = document.getElementById('frustumPyrSlantValue');
    var lateralValue = document.getElementById('frustumPyrLateralValue');
    var surfaceValue = document.getElementById('frustumPyrSurfaceValue');
    var volumeValue = document.getElementById('frustumPyrVolumeValue');

    function draw() {
        var n = parseInt(nSlider.value, 10);
        var a1 = parseFloat(a1Slider.value);
        var a2 = parseFloat(a2Slider.value);
        var v = parseFloat(heightSlider.value);
        var yawDeg = parseInt(yawSlider.value, 10);

        if (a2 >= a1 - 0.2) {
            a2 = Math.max(0.5, a1 - 0.2);
            a2Slider.value = a2.toFixed(1);
        }

        var R1 = a1 / (2 * Math.sin(Math.PI / n));
        var R2 = a2 / (2 * Math.sin(Math.PI / n));
        var rho1 = a1 / (2 * Math.tan(Math.PI / n));
        var rho2 = a2 / (2 * Math.tan(Math.PI / n));

        var S1 = (n * a1 * a1) / (4 * Math.tan(Math.PI / n));
        var S2 = (n * a2 * a2) / (4 * Math.tan(Math.PI / n));
        var o1 = n * a1;
        var o2 = n * a2;
        var s = Math.sqrt(v * v + (rho1 - rho2) * (rho1 - rho2));
        var Slateral = 0.5 * (o1 + o2) * s;
        var Stotal = S1 + S2 + Slateral;
        var V = (v / 3) * (S1 + S2 + Math.sqrt(S1 * S2));

        nValue.textContent = String(n);
        a1Value.textContent = formatNum(a1, 1);
        a2Value.textContent = formatNum(a2, 1);
        heightValue.textContent = formatNum(v, 1);
        yawValue.textContent = yawDeg + '°';

        base1Value.textContent = formatNum(S1, 3);
        base2Value.textContent = formatNum(S2, 3);
        perimetersValue.textContent = 'o1=' + formatNum(o1, 3) + ', o2=' + formatNum(o2, 3);
        slantValue.textContent = formatNum(s, 3);
        lateralValue.textContent = formatNum(Slateral, 3);
        surfaceValue.textContent = formatNum(Stotal, 3);
        volumeValue.textContent = formatNum(V, 3);

        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);

        var bottom = buildRegularPolygonPoints(n, R1, -v / 2);
        var top = buildRegularPolygonPoints(n, R2, v / 2);
        var points = bottom.concat(top);

        var yaw = toRad(yawDeg);
        var pitch = toRad(24);

        var rotated = points.map(function (p) {
            return rotatePoint3D(p, yaw, pitch);
        });

        var maxAbs = 0;
        rotated.forEach(function (p) {
            maxAbs = Math.max(maxAbs, Math.abs(p.x), Math.abs(p.y));
        });
        maxAbs = Math.max(maxAbs, 0.1);

        var model = {
            cx: w * 0.5,
            cy: h * 0.62,
            scale: Math.min((w * 0.35) / maxAbs, (h * 0.42) / maxAbs)
        };

        var projected = rotated.map(function (p) {
            return projectPoint(p, model);
        });

        var faces = [];
        var bottomFace = [];
        var topFace = [];
        for (var i = 0; i < n; i++) {
            bottomFace.push(i);
            topFace.push(i + n);
        }

        faces.push({ idx: bottomFace, fill: 'rgba(56,189,248,0.16)', stroke: 'rgba(226,232,240,0.45)' });
        faces.push({ idx: topFace, fill: 'rgba(16,185,129,0.24)', stroke: 'rgba(226,232,240,0.82)' });

        for (var j = 0; j < n; j++) {
            var next = (j + 1) % n;
            faces.push({
                idx: [j, next, next + n, j + n],
                fill: (j % 2 === 0) ? 'rgba(99,102,241,0.2)' : 'rgba(59,130,246,0.15)',
                stroke: 'rgba(226,232,240,0.5)'
            });
        }

        faces.sort(function (aFace, bFace) {
            return averageDepth(aFace.idx, projected) - averageDepth(bFace.idx, projected);
        });

        faces.forEach(function (face) {
            drawPolygon2D(
                ctx,
                face.idx.map(function (idx) { return projected[idx]; }),
                face.fill,
                face.stroke,
                1.4
            );
        });

        for (var e = 0; e < n; e++) {
            var eNext = (e + 1) % n;
            drawLine2D(ctx, projected[e], projected[eNext], 'rgba(241,245,249,0.72)', 1.6, false);
            drawLine2D(ctx, projected[e + n], projected[eNext + n], '#f8fafc', 1.9, false);
            drawLine2D(ctx, projected[e], projected[e + n], 'rgba(226,232,240,0.7)', 1.5, false);
        }

        if (showSlant.checked) {
            var b0 = bottom[0];
            var b1 = bottom[1];
            var t0 = top[0];
            var t1 = top[1];
            var midBottom = { x: (b0.x + b1.x) / 2, y: (b0.y + b1.y) / 2, z: -v / 2 };
            var midTop = { x: (t0.x + t1.x) / 2, y: (t0.y + t1.y) / 2, z: v / 2 };
            var pMb = projectPoint(rotatePoint3D(midBottom, yaw, pitch), model);
            var pMt = projectPoint(rotatePoint3D(midTop, yaw, pitch), model);
            drawLine2D(ctx, pMb, pMt, '#22d3ee', 2.3, false);
        }
    }

    [nSlider, a1Slider, a2Slider, heightSlider, yawSlider, showSlant].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    resetBtn.addEventListener('click', function () {
        nSlider.value = '4';
        a1Slider.value = '8';
        a2Slider.value = '4';
        heightSlider.value = '6';
        yawSlider.value = '34';
        showSlant.checked = true;
        draw();
    });

    redrawBySection[sectionId] = draw;
    draw();
}
function initFrustumConeDemo(redrawBySection) {
    var sectionId = 'komoly-rotacni-kuzel-objem-a-povrch';
    var canvas = document.getElementById('frustumConeCanvas');
    if (!canvas) return;

    var RSlider = document.getElementById('frustumConeR');
    var rSlider = document.getElementById('frustumConer');
    var heightSlider = document.getElementById('frustumConeHeight');
    var perspectiveSlider = document.getElementById('frustumConePerspective');
    var showNet = document.getElementById('frustumConeShowNet');
    var resetBtn = document.getElementById('frustumConeReset');

    var RValue = document.getElementById('frustumConeRValue');
    var rValue = document.getElementById('frustumConerValue');
    var heightValue = document.getElementById('frustumConeHeightValue');
    var perspectiveValue = document.getElementById('frustumConePerspectiveValue');

    var slantValue = document.getElementById('frustumConeSlantValue');
    var lateralValue = document.getElementById('frustumConeLateralValue');
    var surfaceValue = document.getElementById('frustumConeSurfaceValue');
    var volumeValue = document.getElementById('frustumConeVolumeValue');
    var netOuterValue = document.getElementById('frustumConeNetOuterValue');
    var netInnerValue = document.getElementById('frustumConeNetInnerValue');
    var netAngleValue = document.getElementById('frustumConeNetAngleValue');

    function drawAnnularSector(ctx, centerX, centerY, outerR, innerR, angleRad) {
        var start = -Math.PI / 2 - angleRad / 2;
        var end = -Math.PI / 2 + angleRad / 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerR, start, end, false);
        ctx.arc(centerX, centerY, innerR, end, start, true);
        ctx.closePath();
        ctx.fillStyle = 'rgba(16,185,129,0.16)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(16,185,129,0.95)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.strokeStyle = 'rgba(34,211,238,0.95)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(centerX + innerR * Math.cos(start), centerY + innerR * Math.sin(start));
        ctx.lineTo(centerX + outerR * Math.cos(start), centerY + outerR * Math.sin(start));
        ctx.moveTo(centerX + innerR * Math.cos(end), centerY + innerR * Math.sin(end));
        ctx.lineTo(centerX + outerR * Math.cos(end), centerY + outerR * Math.sin(end));
        ctx.stroke();

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '600 12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('L1', centerX, centerY - outerR - 8);
        ctx.fillText('L2', centerX, centerY - innerR - 8);
        ctx.restore();
    }

    function draw() {
        var R = parseFloat(RSlider.value);
        var r = parseFloat(rSlider.value);
        var v = parseFloat(heightSlider.value);
        var perspective = parseFloat(perspectiveSlider.value);

        if (r >= R - 0.2) {
            r = Math.max(0.3, R - 0.2);
            rSlider.value = r.toFixed(1);
        }

        var s = Math.sqrt((R - r) * (R - r) + v * v);
        var Slateral = Math.PI * (R + r) * s;
        var Stotal = Slateral + Math.PI * (R * R + r * r);
        var V = (Math.PI * v * (R * R + R * r + r * r)) / 3;

        var L1 = 0;
        var L2 = 0;
        var alpha = 0;
        if (R - r > 1e-8) {
            L1 = (s * R) / (R - r);
            L2 = (s * r) / (R - r);
            alpha = (2 * Math.PI * (R - r)) / s;
        }

        RValue.textContent = formatNum(R, 1);
        rValue.textContent = formatNum(r, 1);
        heightValue.textContent = formatNum(v, 1);
        perspectiveValue.textContent = formatNum(perspective, 2);

        slantValue.textContent = formatNum(s, 3);
        lateralValue.textContent = formatNum(Slateral, 3);
        surfaceValue.textContent = formatNum(Stotal, 3);
        volumeValue.textContent = formatNum(V, 3);
        netOuterValue.textContent = formatNum(L1, 3);
        netInnerValue.textContent = formatNum(L2, 3);
        netAngleValue.textContent = formatNum(alpha * 180 / Math.PI, 2) + '°';

        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);

        var showNetEnabled = showNet.checked;
        var leftWidth = showNetEnabled ? w * 0.58 : w * 0.9;

        var scale = Math.min((leftWidth * 0.23) / (R + 0.2), (h * 0.58) / (v + 0.7));
        var xCenter = leftWidth * 0.52;
        var topY = h * 0.18;
        var bottomY = topY + v * scale;
        var topRx = r * scale;
        var bottomRx = R * scale;
        var topRy = topRx * perspective;
        var bottomRy = bottomRx * perspective;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(xCenter - topRx, topY);
        ctx.lineTo(xCenter - bottomRx, bottomY);
        ctx.ellipse(xCenter, bottomY, bottomRx, bottomRy, 0, Math.PI, 0, false);
        ctx.lineTo(xCenter + topRx, topY);
        ctx.closePath();
        ctx.fillStyle = 'rgba(59,130,246,0.22)';
        ctx.fill();
        ctx.restore();

        ctx.strokeStyle = 'rgba(226,232,240,0.82)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(xCenter - topRx, topY);
        ctx.lineTo(xCenter - bottomRx, bottomY);
        ctx.moveTo(xCenter + topRx, topY);
        ctx.lineTo(xCenter + bottomRx, bottomY);
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(xCenter, topY, topRx, topRy, 0, 0, Math.PI * 2);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(xCenter, bottomY, bottomRx, bottomRy, 0, 0, Math.PI, true);
        ctx.strokeStyle = 'rgba(226,232,240,0.45)';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([6, 4]);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.ellipse(xCenter, bottomY, bottomRx, bottomRy, 0, Math.PI, 0, false);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2.1;
        ctx.stroke();

        drawLine2D(ctx, { x: xCenter + topRx, y: topY }, { x: xCenter + bottomRx, y: bottomY }, '#22d3ee', 2.2, false);
        drawLine2D(ctx, { x: xCenter, y: topY }, { x: xCenter, y: bottomY }, '#22c55e', 2.2, true);

        if (showNetEnabled && L1 > 0 && isFinite(L1) && isFinite(L2)) {
            var netScale = Math.min((w * 0.34) / (2 * L1 + 0.5), (h * 0.58) / (L1 + 0.5));
            var outer = L1 * netScale;
            var inner = L2 * netScale;
            var centerX = w * 0.78;
            var centerY = h * 0.75;

            drawAnnularSector(ctx, centerX, centerY, outer, inner, alpha);

            ctx.fillStyle = '#93c5fd';
            ctx.font = '600 12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('oblouk = 2πR', centerX, centerY + 20);
        }
    }

    [RSlider, rSlider, heightSlider, perspectiveSlider, showNet].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    resetBtn.addEventListener('click', function () {
        RSlider.value = '7';
        rSlider.value = '3';
        heightSlider.value = '8';
        perspectiveSlider.value = '0.34';
        showNet.checked = true;
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
            correct: 'Správně. V = (1/3)·54·10 = 180 cm³.',
            incorrect: 'Nesprávně. Správně je a): V = (1/3)·54·10 = 180 cm³.'
        },
        '2': {
            correct: 'Správně. s = √(v² + (a/2)²) = √(12² + 5²) = √169 = 13.',
            incorrect: 'Nesprávně. Správně je b): s = 13.'
        },
        '3': {
            correct: 'Správně. V = (1/3)πr²v = (1/3)π·9·4 = 12π.',
            incorrect: 'Nesprávně. Správně je a): 12π.'
        },
        '4': {
            correct: 'Správně. s = √(4²+3²)=5, tedy S = πr(r+s)=π·4·9=36π.',
            incorrect: 'Nesprávně. Správně je b): 36π.'
        },
        '5': {
            correct: 'Správně. V = (9/3)(81+25+√2025) = 3·151 = 453.',
            incorrect: 'Nesprávně. Správně je b): 453.'
        },
        '6': {
            correct: 'Správně. s = √(4² + (3−1)²) = √20.',
            incorrect: 'Nesprávně. Správně je b): √20.'
        },
        '7': {
            correct: 'Správně. V = (π·9/3)(36+12+4) = 3π·52 = 156π.',
            incorrect: 'Nesprávně. Správně je b): 156π.'
        },
        '8': {
            correct: 'Správně. s = √((8−5)² + 4²) = 5, takže S_pl = π(8+5)·5 = 65π.',
            incorrect: 'Nesprávně. Správně je b): 65π.'
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
