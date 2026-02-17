// Kapitola 2: Mnohouhelnik a kruh - interactive lesson

document.addEventListener('DOMContentLoaded', function () {
    var redrawBySection = {};

    initNavigation(redrawBySection);
    initRegularPolygonDemo(redrawBySection);
    initCircleDerivationDemo(redrawBySection);
    initPrecisionDemo(redrawBySection);
    initCircularPartsDemo(redrawBySection);
    initQuickChecks();
});

function initNavigation(redrawBySection) {
    var sectionOrder = [
        'pravidelny-n-uhelnik-obsah-a-obvod',
        'kruh-obsah-obvod-a-odvozeni',
        'presnejsi-odvozeni-obvodu-a-obsahu-kruhu',
        'kruhova-vysec-kruhova-usec-a-mezikruzi'
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
        }, 140);
    });
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function formatNum(value, digits) {
    return Number(value).toFixed(digits == null ? 2 : digits);
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
        parentWidth = cw - 18;
    }
    if (parentWidth <= 0) parentWidth = nominalWidth;

    var width = Math.max(300, Math.min(nominalWidth, parentWidth));
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
        ctx.strokeStyle = (x === 0) ? 'rgba(148,163,184,0.52)' : 'rgba(148,163,184,0.11)';
        ctx.lineWidth = (x === 0) ? 1.8 : 1;
        ctx.beginPath();
        ctx.moveTo(px, plane.top);
        ctx.lineTo(px, plane.bottom);
        ctx.stroke();
    }

    for (var y = Math.ceil(plane.yMin); y <= Math.floor(plane.yMax); y++) {
        var py = toCanvas(plane, { x: 0, y: y }).y;
        ctx.strokeStyle = (y === 0) ? 'rgba(148,163,184,0.52)' : 'rgba(148,163,184,0.11)';
        ctx.lineWidth = (y === 0) ? 1.8 : 1;
        ctx.beginPath();
        ctx.moveTo(plane.left, py);
        ctx.lineTo(plane.right, py);
        ctx.stroke();
    }

    ctx.restore();
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

function drawPolyline(ctx, plane, points, color, width, dashed) {
    if (!points || points.length < 2) return;
    ctx.save();
    if (dashed) ctx.setLineDash([6, 4]);
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 2;
    ctx.beginPath();
    var p0 = toCanvas(plane, points[0]);
    ctx.moveTo(p0.x, p0.y);
    for (var i = 1; i < points.length; i++) {
        var p = toCanvas(plane, points[i]);
        ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
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

function drawPoint(ctx, plane, point, color, label, radius) {
    var p = toCanvas(plane, point);
    var r = radius || 5;
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 9;
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

function regularPolygonPoints(n, radius, rotation) {
    var points = [];
    for (var i = 0; i < n; i++) {
        var angle = rotation + (2 * Math.PI * i) / n;
        points.push({
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        });
    }
    return points;
}

function arcPoints(radius, start, end, steps) {
    var points = [];
    for (var i = 0; i <= steps; i++) {
        var t = start + (end - start) * (i / steps);
        points.push({
            x: radius * Math.cos(t),
            y: radius * Math.sin(t)
        });
    }
    return points;
}

function initRegularPolygonDemo(redrawBySection) {
    var sectionId = 'pravidelny-n-uhelnik-obsah-a-obvod';
    var canvas = document.getElementById('regularPolygonCanvas');
    if (!canvas) return;

    var modeSelect = document.getElementById('polyInputMode');
    var nSlider = document.getElementById('polyN');
    var measureSlider = document.getElementById('polyMeasure');
    var rotationSlider = document.getElementById('polyRotation');
    var showTriangles = document.getElementById('polyShowTriangles');
    var showIncircle = document.getElementById('polyShowIncircle');
    var showCircumcircle = document.getElementById('polyShowCircumcircle');
    var resetBtn = document.getElementById('polyReset');

    var nValue = document.getElementById('polyNValue');
    var measureLabel = document.getElementById('polyMeasureLabel');
    var measureValue = document.getElementById('polyMeasureValue');
    var rotationValue = document.getElementById('polyRotationValue');

    var sideValue = document.getElementById('polySideValue');
    var inradiusValue = document.getElementById('polyInradiusValue');
    var circumradiusValue = document.getElementById('polyCircumradiusValue');
    var perimeterValue = document.getElementById('polyPerimeterValue');
    var areaValue = document.getElementById('polyAreaValue');
    var areaAltValue = document.getElementById('polyAreaAltValue');
    var interiorAngleValue = document.getElementById('polyInteriorAngleValue');
    var centralAngleValue = document.getElementById('polyCentralAngleValue');
    var circlePerimeterRef = document.getElementById('polyCirclePerimeterRef');
    var circleAreaRef = document.getElementById('polyCircleAreaRef');
    var perimeterRatio = document.getElementById('polyPerimeterRatio');
    var areaRatio = document.getElementById('polyAreaRatio');

    function applyMode() {
        if (modeSelect.value === 'side') {
            measureLabel.textContent = 'Strana a';
            measureSlider.min = '1';
            measureSlider.max = '8';
            measureSlider.step = '0.1';
            if (parseFloat(measureSlider.value) < 1 || parseFloat(measureSlider.value) > 8) {
                measureSlider.value = '4';
            }
        } else {
            measureLabel.textContent = 'Opsaný poloměr R';
            measureSlider.min = '1';
            measureSlider.max = '8';
            measureSlider.step = '0.1';
            if (parseFloat(measureSlider.value) < 1 || parseFloat(measureSlider.value) > 8) {
                measureSlider.value = '3.2';
            }
        }
    }

    function draw() {
        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);

        var n = parseInt(nSlider.value, 10);
        var measure = parseFloat(measureSlider.value);
        var rotationDeg = parseFloat(rotationSlider.value);
        var rotation = rotationDeg * Math.PI / 180;

        var a;
        var R;
        var r;
        if (modeSelect.value === 'side') {
            a = measure;
            R = a / (2 * Math.sin(Math.PI / n));
            r = a / (2 * Math.tan(Math.PI / n));
        } else {
            R = measure;
            a = 2 * R * Math.sin(Math.PI / n);
            r = R * Math.cos(Math.PI / n);
        }

        var perimeter = n * a;
        var area = (n * a * a) / (4 * Math.tan(Math.PI / n));
        var areaAlt = 0.5 * perimeter * r;
        var interior = ((n - 2) * 180) / n;
        var central = 360 / n;

        var refCirclePerimeter = 2 * Math.PI * R;
        var refCircleArea = Math.PI * R * R;

        var bound = Math.max(2.8, R * 1.42);
        var plane = createPlane(14, 14, w - 28, h - 28, -bound, bound, -bound, bound);
        drawPlaneGrid(ctx, plane);

        var points = regularPolygonPoints(n, R, rotation);

        if (showCircumcircle.checked) {
            drawCircle(ctx, plane, { x: 0, y: 0 }, R, '#f59e0b', 'rgba(245,158,11,0.08)', 2.1);
        }
        if (showIncircle.checked) {
            drawCircle(ctx, plane, { x: 0, y: 0 }, r, '#34d399', 'rgba(52,211,153,0.08)', 2.1);
        }

        drawPolygon(ctx, plane, points, '#e2e8f0', 'rgba(99,102,241,0.19)', 2.3);

        if (showTriangles.checked) {
            for (var i = 0; i < points.length; i++) {
                drawSegment(ctx, plane, { x: 0, y: 0 }, points[i], 'rgba(148,163,184,0.45)', 1.4, true);
            }
        }

        if (n <= 14) {
            for (var j = 0; j < points.length; j++) {
                drawPoint(ctx, plane, points[j], '#f8fafc', String.fromCharCode(65 + j), 3.9);
            }
        } else {
            drawPoint(ctx, plane, points[0], '#f8fafc', 'A', 4.2);
            drawPoint(ctx, plane, points[Math.floor(n / 4)], '#f8fafc', 'B', 4.2);
            drawPoint(ctx, plane, points[Math.floor(n / 2)], '#f8fafc', 'C', 4.2);
        }
        drawPoint(ctx, plane, { x: 0, y: 0 }, '#60a5fa', 'O', 4.6);

        nValue.textContent = n;
        measureValue.textContent = formatNum(measure, 1);
        rotationValue.textContent = Math.round(rotationDeg) + '°';

        sideValue.textContent = formatNum(a, 4);
        inradiusValue.textContent = formatNum(r, 4);
        circumradiusValue.textContent = formatNum(R, 4);
        perimeterValue.textContent = formatNum(perimeter, 4);
        areaValue.textContent = formatNum(area, 4);
        areaAltValue.textContent = formatNum(areaAlt, 4);
        interiorAngleValue.textContent = formatNum(interior, 3) + '°';
        centralAngleValue.textContent = formatNum(central, 3) + '°';
        circlePerimeterRef.textContent = formatNum(refCirclePerimeter, 4);
        circleAreaRef.textContent = formatNum(refCircleArea, 4);
        perimeterRatio.textContent = formatNum(perimeter / refCirclePerimeter, 6);
        areaRatio.textContent = formatNum(area / refCircleArea, 6);
    }

    [modeSelect, nSlider, measureSlider, rotationSlider, showTriangles, showIncircle, showCircumcircle].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    modeSelect.addEventListener('change', function () {
        applyMode();
        draw();
    });

    resetBtn.addEventListener('click', function () {
        modeSelect.value = 'side';
        nSlider.value = '6';
        measureSlider.value = '4';
        rotationSlider.value = '12';
        showTriangles.checked = true;
        showIncircle.checked = true;
        showCircumcircle.checked = true;
        applyMode();
        draw();
    });

    redrawBySection[sectionId] = draw;
    applyMode();
    draw();
}

function initCircleDerivationDemo(redrawBySection) {
    var sectionId = 'kruh-obsah-obvod-a-odvozeni';
    var canvas = document.getElementById('circleDerivationCanvas');
    if (!canvas) return;

    var radiusSlider = document.getElementById('circleRadius');
    var slicesSlider = document.getElementById('circleSlices');
    var showRectangle = document.getElementById('circleShowRectangle');
    var resetBtn = document.getElementById('circleReset');

    var radiusValue = document.getElementById('circleRadiusValue');
    var slicesValue = document.getElementById('circleSlicesValue');
    var diameterValue = document.getElementById('circleDiameterValue');
    var circumferenceValue = document.getElementById('circleCircumferenceValue');
    var areaValue = document.getElementById('circleAreaValue');
    var sliceArcValue = document.getElementById('circleSliceArcValue');
    var triBaseValue = document.getElementById('circleTriBaseValue');
    var triHeightValue = document.getElementById('circleTriHeightValue');
    var rectWidthValue = document.getElementById('circleRectWidthValue');
    var rectHeightValue = document.getElementById('circleRectHeightValue');
    var rectAreaValue = document.getElementById('circleRectAreaValue');

    function draw() {
        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);

        var radius = parseFloat(radiusSlider.value);
        var slices = parseInt(slicesSlider.value, 10);
        slices = clamp(slices, 6, 200);

        var diameter = 2 * radius;
        var circumference = 2 * Math.PI * radius;
        var area = Math.PI * radius * radius;
        var sliceArc = circumference / slices;
        var triBase = circumference;
        var triHeight = radius;
        var rectWidth = Math.PI * radius;
        var rectHeight = radius;
        var rectArea = rectWidth * rectHeight;

        radiusValue.textContent = formatNum(radius, 1);
        slicesValue.textContent = slices;
        diameterValue.textContent = formatNum(diameter, 4);
        circumferenceValue.textContent = formatNum(circumference, 4);
        areaValue.textContent = formatNum(area, 4);
        sliceArcValue.textContent = formatNum(sliceArc, 4);
        triBaseValue.textContent = formatNum(triBase, 4);
        triHeightValue.textContent = formatNum(triHeight, 4);
        rectWidthValue.textContent = formatNum(rectWidth, 4);
        rectHeightValue.textContent = formatNum(rectHeight, 4);
        rectAreaValue.textContent = formatNum(rectArea, 4);

        var gap = 14;
        var panelW = (w - 3 * gap) / 2;
        var panelH = h - 2 * gap;
        var leftX = gap;
        var rightX = leftX + panelW + gap;
        var panelY = gap;

        roundedRect(ctx, leftX, panelY, panelW, panelH, 12);
        ctx.fillStyle = 'rgba(15,23,42,0.52)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(148,163,184,0.3)';
        ctx.stroke();

        roundedRect(ctx, rightX, panelY, panelW, panelH, 12);
        ctx.fillStyle = 'rgba(15,23,42,0.52)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(148,163,184,0.3)';
        ctx.stroke();

        var cx = leftX + panelW * 0.5;
        var cy = panelY + panelH * 0.55;
        var minR = Math.min(panelW, panelH) * 0.16;
        var maxR = Math.min(panelW, panelH) * 0.38;
        var rPx = minR + ((radius - 1) / 9) * (maxR - minR);

        ctx.beginPath();
        ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(99,102,241,0.12)';
        ctx.fill();

        for (var i = 1; i <= slices; i++) {
            var rr = (i / slices) * rPx;
            ctx.beginPath();
            ctx.arc(cx, cy, rr, 0, Math.PI * 2);
            ctx.strokeStyle = i % 2 === 0 ? 'rgba(99,102,241,0.32)' : 'rgba(129,140,248,0.22)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2.1;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + rPx, cy);
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        ctx.fillStyle = '#34d399';
        ctx.font = '700 12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('r', cx + rPx / 2, cy - 9);

        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(226,232,240,0.9)';
        ctx.font = '700 13px Inter';
        ctx.fillText('Kruh rozdělený na soustředné proužky', leftX + 14, panelY + 22);

        var triBasePxRaw = triBase;
        var triHeightRaw = triHeight;
        var drawScale = Math.min((panelW * 0.78) / triBasePxRaw, (panelH * 0.72) / triHeightRaw);
        var visualHeightBoost = 1.35;
        var triBasePx = triBasePxRaw * drawScale;
        var triHeightPx = Math.min(panelH * 0.74, triHeightRaw * drawScale * visualHeightBoost);
        var barH = triHeightPx / slices;
        var barGap = Math.min(1.1, barH * 0.22);
        var yBottom = panelY + panelH * 0.86;
        var xCenter = rightX + panelW * 0.5;
        var xLeft = xCenter - triBasePx / 2;
        var xRight = xCenter + triBasePx / 2;
        var yTop = yBottom - triHeightPx;

        var triGrad = ctx.createLinearGradient(0, yTop, 0, yBottom);
        triGrad.addColorStop(0, 'rgba(59,130,246,0.07)');
        triGrad.addColorStop(1, 'rgba(59,130,246,0.18)');
        ctx.fillStyle = triGrad;
        ctx.beginPath();
        ctx.moveTo(xLeft, yBottom);
        ctx.lineTo(xCenter, yTop);
        ctx.lineTo(xRight, yBottom);
        ctx.closePath();
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(xLeft, yBottom);
        ctx.lineTo(xCenter, yTop);
        ctx.lineTo(xRight, yBottom);
        ctx.closePath();
        ctx.clip();

        for (var j = 0; j < slices; j++) {
            var rho = radius * (1 - (j + 0.5) / slices);
            var barWidth = (2 * Math.PI * rho) * drawScale;
            var y = yBottom - (j + 1) * barH + barGap * 0.5;
            var x = xCenter - barWidth / 2;
            var hBand = Math.max(0.35, barH - barGap);
            ctx.fillStyle = j % 2 === 0 ? 'rgba(59,130,246,0.35)' : 'rgba(129,140,248,0.28)';
            ctx.fillRect(x, y, barWidth, hBand);
        }
        ctx.restore();

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2.1;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(xLeft, yBottom);
        ctx.lineTo(xCenter, yTop);
        ctx.lineTo(xRight, yBottom);
        ctx.stroke();

        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(148,163,184,0.55)';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(xCenter, yBottom);
        ctx.lineTo(xCenter, yTop);
        ctx.stroke();
        ctx.restore();

        if (showRectangle.checked) {
            var rectW = rectWidth * drawScale;
            var rectH = rectHeight * drawScale * visualHeightBoost;
            var rx = xCenter - rectW / 2;
            var ry = yBottom - rectH;
            ctx.save();
            ctx.setLineDash([6, 4]);
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.8;
            ctx.strokeRect(rx, ry, rectW, rectH);
            ctx.restore();
        }

        ctx.fillStyle = 'rgba(226,232,240,0.9)';
        ctx.font = '700 13px Inter';
        ctx.textAlign = 'left';
        ctx.fillText('Rozbalené proužky => trojúhelník s bází 2πr', rightX + 14, panelY + 22);

        ctx.font = '600 12px Inter';
        ctx.fillStyle = '#93c5fd';
        ctx.fillText('základna ≈ 2πr', xCenter - triBasePx / 2 + 8, yBottom + 16);
        ctx.fillStyle = '#34d399';
        ctx.fillText('výška = r', xCenter + 8, yBottom - triHeightPx / 2);
    }

    [radiusSlider, slicesSlider, showRectangle].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    resetBtn.addEventListener('click', function () {
        radiusSlider.value = '4';
        slicesSlider.value = '24';
        showRectangle.checked = true;
        draw();
    });

    redrawBySection[sectionId] = draw;
    draw();
}

function initPrecisionDemo(redrawBySection) {
    var sectionId = 'presnejsi-odvozeni-obvodu-a-obsahu-kruhu';
    var canvas = document.getElementById('precisionCanvas');
    if (!canvas) return;

    var radiusSlider = document.getElementById('precisionRadius');
    var nSlider = document.getElementById('precisionN');
    var rotationSlider = document.getElementById('precisionRotation');
    var showIn = document.getElementById('precisionShowInscribed');
    var showOut = document.getElementById('precisionShowCircumscribed');
    var doubleBtn = document.getElementById('precisionDoubleN');
    var resetBtn = document.getElementById('precisionReset');

    var radiusValue = document.getElementById('precisionRadiusValue');
    var nValue = document.getElementById('precisionNValue');
    var rotationValue = document.getElementById('precisionRotationValue');

    var pInValue = document.getElementById('precisionPInValue');
    var pOutValue = document.getElementById('precisionPOutValue');
    var circlePValue = document.getElementById('precisionCirclePValue');
    var aInValue = document.getElementById('precisionAInValue');
    var aOutValue = document.getElementById('precisionAOutValue');
    var circleAValue = document.getElementById('precisionCircleAValue');
    var piLowerPValue = document.getElementById('precisionPiLowerPValue');
    var piUpperPValue = document.getElementById('precisionPiUpperPValue');
    var piLowerAValue = document.getElementById('precisionPiLowerAValue');
    var piUpperAValue = document.getElementById('precisionPiUpperAValue');
    var perimeterGapValue = document.getElementById('precisionPerimeterGapValue');
    var areaGapValue = document.getElementById('precisionAreaGapValue');
    var archimedesValue = document.getElementById('precisionArchimedesValue');

    function draw() {
        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);

        var r = parseFloat(radiusSlider.value);
        var n = parseInt(nSlider.value, 10);
        var rotationDeg = parseFloat(rotationSlider.value);
        var rotation = rotationDeg * Math.PI / 180;

        n = clamp(n, 3, 384);
        var pIn = 2 * n * r * Math.sin(Math.PI / n);
        var pOut = 2 * n * r * Math.tan(Math.PI / n);
        var aIn = 0.5 * n * r * r * Math.sin((2 * Math.PI) / n);
        var aOut = n * r * r * Math.tan(Math.PI / n);
        var pCircle = 2 * Math.PI * r;
        var aCircle = Math.PI * r * r;

        var piLowerP = pIn / (2 * r);
        var piUpperP = pOut / (2 * r);
        var piLowerA = aIn / (r * r);
        var piUpperA = aOut / (r * r);

        var perGap = pOut - pIn;
        var areaGap = aOut - aIn;

        radiusValue.textContent = formatNum(r, 1);
        nValue.textContent = n;
        rotationValue.textContent = Math.round(rotationDeg) + '°';

        pInValue.textContent = formatNum(pIn, 6);
        pOutValue.textContent = formatNum(pOut, 6);
        circlePValue.textContent = formatNum(pCircle, 6);
        aInValue.textContent = formatNum(aIn, 6);
        aOutValue.textContent = formatNum(aOut, 6);
        circleAValue.textContent = formatNum(aCircle, 6);
        piLowerPValue.textContent = formatNum(piLowerP, 7);
        piUpperPValue.textContent = formatNum(piUpperP, 7);
        piLowerAValue.textContent = formatNum(piLowerA, 7);
        piUpperAValue.textContent = formatNum(piUpperA, 7);
        perimeterGapValue.textContent = formatNum(perGap, 7);
        areaGapValue.textContent = formatNum(areaGap, 7);

        var archLower = 96 * Math.sin(Math.PI / 96);
        var archUpper = 96 * Math.tan(Math.PI / 96);
        archimedesValue.textContent = formatNum(archLower, 6) + ' < π < ' + formatNum(archUpper, 6);
        archimedesValue.className = 'status-chip equal';

        var rout = r / Math.cos(Math.PI / n);
        var bound = Math.max(2.4, rout * 1.35);
        var plane = createPlane(14, 14, w - 28, h - 28, -bound, bound, -bound, bound);
        drawPlaneGrid(ctx, plane);

        drawCircle(ctx, plane, { x: 0, y: 0 }, r, '#34d399', 'rgba(52,211,153,0.08)', 2.2);

        if (showOut.checked) {
            var outerPoints = regularPolygonPoints(n, rout, rotation + Math.PI / n);
            drawPolygon(ctx, plane, outerPoints, '#f59e0b', 'rgba(245,158,11,0.12)', 2);
        }
        if (showIn.checked) {
            var innerPoints = regularPolygonPoints(n, r, rotation);
            drawPolygon(ctx, plane, innerPoints, '#60a5fa', 'rgba(59,130,246,0.2)', 2.2);
        }

        drawPoint(ctx, plane, { x: 0, y: 0 }, '#f8fafc', 'O', 4.6);
    }

    [radiusSlider, nSlider, rotationSlider, showIn, showOut].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    doubleBtn.addEventListener('click', function () {
        var current = parseInt(nSlider.value, 10);
        var maxN = parseInt(nSlider.max, 10);
        nSlider.value = Math.min(maxN, current * 2);
        draw();
    });

    resetBtn.addEventListener('click', function () {
        radiusSlider.value = '3';
        nSlider.value = '24';
        rotationSlider.value = '0';
        showIn.checked = true;
        showOut.checked = true;
        draw();
    });

    redrawBySection[sectionId] = draw;
    draw();
}

function initCircularPartsDemo(redrawBySection) {
    var sectionId = 'kruhova-vysec-kruhova-usec-a-mezikruzi';
    var canvas = document.getElementById('circularPartsCanvas');
    if (!canvas) return;

    var modeSelect = document.getElementById('partsMode');
    var outerSlider = document.getElementById('partsOuterRadius');
    var innerSlider = document.getElementById('partsInnerRadius');
    var angleSlider = document.getElementById('partsAngle');
    var showFullCircle = document.getElementById('partsShowFullCircle');
    var showHelpers = document.getElementById('partsShowHelpers');
    var resetBtn = document.getElementById('partsReset');
    var innerGroup = document.getElementById('partsInnerGroup');

    var outerValue = document.getElementById('partsOuterRadiusValue');
    var innerValue = document.getElementById('partsInnerRadiusValue');
    var angleValue = document.getElementById('partsAngleValue');

    var modeValue = document.getElementById('partsModeValue');
    var arcOuterValue = document.getElementById('partsArcOuterValue');
    var arcInnerValue = document.getElementById('partsArcInnerValue');
    var chordValue = document.getElementById('partsChordValue');
    var sectorAreaValue = document.getElementById('partsSectorAreaValue');
    var segmentAreaValue = document.getElementById('partsSegmentAreaValue');
    var segmentHeightValue = document.getElementById('partsSegmentHeightValue');
    var annulusAreaValue = document.getElementById('partsAnnulusAreaValue');
    var annulusPerimeterValue = document.getElementById('partsAnnulusPerimeterValue');
    var annularSectorAreaValue = document.getElementById('partsAnnularSectorAreaValue');
    var currentFormulaValue = document.getElementById('partsCurrentFormula');

    function updateModeVisibility() {
        var isAnnulus = modeSelect.value === 'annulus';
        innerGroup.style.display = isAnnulus ? 'flex' : 'none';
        innerSlider.disabled = !isAnnulus;
    }

    function draw() {
        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);

        var mode = modeSelect.value;
        var R = parseFloat(outerSlider.value);
        var r = parseFloat(innerSlider.value);
        var thetaDeg = parseFloat(angleSlider.value);
        var theta = thetaDeg * Math.PI / 180;

        r = clamp(r, 0.2, R - 0.1);
        innerSlider.value = r.toFixed(1);

        outerValue.textContent = formatNum(R, 1);
        innerValue.textContent = formatNum(r, 1);
        angleValue.textContent = Math.round(thetaDeg) + '°';

        var start = -theta / 2;
        var end = theta / 2;

        var arcOuter = R * theta;
        var arcInner = r * theta;
        var chord = 2 * R * Math.sin(theta / 2);
        var sectorArea = 0.5 * R * R * theta;
        var segmentArea = 0.5 * R * R * (theta - Math.sin(theta));
        var segmentHeight = R * (1 - Math.cos(theta / 2));
        var annulusArea = Math.PI * (R * R - r * r);
        var annulusPerimeter = 2 * Math.PI * (R + r);
        var annularSectorArea = 0.5 * theta * (R * R - r * r);

        var bound = Math.max(2.6, R * 1.35);
        var plane = createPlane(14, 14, w - 28, h - 28, -bound, bound, -bound, bound);
        drawPlaneGrid(ctx, plane);

        var outerArc = arcPoints(R, start, end, 90);
        var innerArc = arcPoints(r, end, start, 90);

        if (showFullCircle.checked) {
            drawCircle(ctx, plane, { x: 0, y: 0 }, R, 'rgba(148,163,184,0.55)', 'rgba(148,163,184,0.05)', 1.5);
            if (mode === 'annulus') {
                drawCircle(ctx, plane, { x: 0, y: 0 }, r, 'rgba(148,163,184,0.55)', null, 1.5);
            }
        }

        if (mode === 'sector') {
            var sectorPoly = [{ x: 0, y: 0 }].concat(outerArc);
            drawPolygon(ctx, plane, sectorPoly, '#22d3ee', 'rgba(34,211,238,0.22)', 2.2);
            if (showHelpers.checked) {
                drawSegment(ctx, plane, { x: 0, y: 0 }, outerArc[0], '#22d3ee', 2, false);
                drawSegment(ctx, plane, { x: 0, y: 0 }, outerArc[outerArc.length - 1], '#22d3ee', 2, false);
                drawPolyline(ctx, plane, outerArc, '#67e8f9', 2.4, false);
            }

            modeValue.textContent = 'výseč';
            modeValue.className = 'status-chip equal';
            currentFormulaValue.textContent = 'S_v = (1/2)R²θ';
            arcInnerValue.textContent = '—';
            segmentAreaValue.textContent = '—';
            segmentHeightValue.textContent = '—';
            annulusAreaValue.textContent = '—';
            annulusPerimeterValue.textContent = '—';
            annularSectorAreaValue.textContent = '—';
        } else if (mode === 'segment') {
            var segPoly = outerArc.slice();
            segPoly.push(outerArc[0]);
            drawPolygon(ctx, plane, segPoly, '#f472b6', 'rgba(244,114,182,0.22)', 2.2);
            if (showHelpers.checked) {
                drawSegment(ctx, plane, outerArc[0], outerArc[outerArc.length - 1], '#f472b6', 2.2, false);
                drawPolyline(ctx, plane, outerArc, '#f9a8d4', 2.1, false);
                drawSegment(ctx, plane, { x: 0, y: 0 }, { x: R, y: 0 }, 'rgba(52,211,153,0.7)', 1.7, true);
            }

            modeValue.textContent = 'úseč';
            modeValue.className = 'status-chip equal';
            currentFormulaValue.textContent = 'S_u = (1/2)R²(θ - sinθ)';
            arcInnerValue.textContent = '—';
            annulusAreaValue.textContent = '—';
            annulusPerimeterValue.textContent = '—';
            annularSectorAreaValue.textContent = '—';
        } else {
            drawCircle(ctx, plane, { x: 0, y: 0 }, R, '#f59e0b', 'rgba(245,158,11,0.09)', 2.1);
            drawCircle(ctx, plane, { x: 0, y: 0 }, r, '#f59e0b', 'rgba(11,18,32,0.85)', 2.1);

            var annularSectorPoly = outerArc.concat(innerArc);
            drawPolygon(ctx, plane, annularSectorPoly, '#f97316', 'rgba(249,115,22,0.25)', 2.2);
            if (showHelpers.checked) {
                drawSegment(ctx, plane, outerArc[0], innerArc[innerArc.length - 1], '#fb923c', 2, false);
                drawSegment(ctx, plane, outerArc[outerArc.length - 1], innerArc[0], '#fb923c', 2, false);
            }

            modeValue.textContent = 'mezikruží';
            modeValue.className = 'status-chip equal';
            currentFormulaValue.textContent = 'S_m = π(R² - r²)';
        }

        drawPoint(ctx, plane, { x: 0, y: 0 }, '#e2e8f0', 'O', 4.4);

        arcOuterValue.textContent = formatNum(arcOuter, 4);
        chordValue.textContent = formatNum(chord, 4);
        sectorAreaValue.textContent = formatNum(sectorArea, 4);
        if (mode === 'segment') {
            segmentAreaValue.textContent = formatNum(segmentArea, 4);
            segmentHeightValue.textContent = formatNum(segmentHeight, 4);
        }
        if (mode === 'annulus') {
            arcInnerValue.textContent = formatNum(arcInner, 4);
            annulusAreaValue.textContent = formatNum(annulusArea, 4);
            annulusPerimeterValue.textContent = formatNum(annulusPerimeter, 4);
            annularSectorAreaValue.textContent = formatNum(annularSectorArea, 4);
            segmentAreaValue.textContent = '—';
            segmentHeightValue.textContent = '—';
        }
    }

    [modeSelect, outerSlider, innerSlider, angleSlider, showFullCircle, showHelpers].forEach(function (el) {
        el.addEventListener('input', function () {
            updateModeVisibility();
            draw();
        });
        el.addEventListener('change', function () {
            updateModeVisibility();
            draw();
        });
    });

    resetBtn.addEventListener('click', function () {
        modeSelect.value = 'sector';
        outerSlider.value = '6';
        innerSlider.value = '3';
        angleSlider.value = '90';
        showFullCircle.checked = true;
        showHelpers.checked = true;
        updateModeVisibility();
        draw();
    });

    redrawBySection[sectionId] = draw;
    updateModeVisibility();
    draw();
}

function initQuickChecks() {
    var cards = Array.prototype.slice.call(document.querySelectorAll('.quick-check'));
    if (cards.length === 0) return;

    function updateCompletion() {
        var done = cards.every(function (card) {
            return card.getAttribute('data-done') === 'true';
        });
        var complete = document.getElementById('lessonComplete');
        if (complete) {
            complete.style.display = done ? 'block' : 'none';
        }
    }

    cards.forEach(function (card) {
        var input = card.querySelector('.quick-check-input');
        var button = card.querySelector('.quick-check-btn');
        var feedback = card.querySelector('.quick-check-feedback');
        var answer = parseFloat(card.getAttribute('data-answer'));
        var tolerance = parseFloat(card.getAttribute('data-tolerance') || '0.01');

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
                feedback.textContent = 'Ještě ne. Zkuste to znovu s přesnějším výpočtem.';
                feedback.className = 'quick-check-feedback show incorrect';
            }

            updateCompletion();
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
