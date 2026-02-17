// Kapitola 5: Heronův vzorec - interactive lesson

document.addEventListener('DOMContentLoaded', function () {
    var redrawBySection = {};

    initHeronApplicationDemo(redrawBySection);
    initHeronDerivationDemo(redrawBySection);
    initExercises();
    initNavigation(redrawBySection);
    initSectionJumps();
});

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function approx(a, b, eps) {
    return Math.abs(a - b) <= eps;
}

function distance(a, b) {
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
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

function drawTriangle(ctx, plane, A, B, C, stroke, fill, width) {
    var Ap = toCanvas(plane, A);
    var Bp = toCanvas(plane, B);
    var Cp = toCanvas(plane, C);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(Ap.x, Ap.y);
    ctx.lineTo(Bp.x, Bp.y);
    ctx.lineTo(Cp.x, Cp.y);
    ctx.closePath();

    if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
    }

    ctx.strokeStyle = stroke || '#e2e8f0';
    ctx.lineWidth = width || 2.2;
    ctx.stroke();
    ctx.restore();
}

function drawWorldText(ctx, plane, point, text, color, align) {
    var p = toCanvas(plane, point);
    ctx.save();
    ctx.fillStyle = color || '#e2e8f0';
    ctx.font = '700 12px Inter';
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, p.x, p.y);
    ctx.restore();
}

function formatNum(value, digits) {
    return value.toFixed(digits == null ? 2 : digits);
}

function syncThirdSideSlider(a, b, slider, hardMin, hardMax) {
    var min = Math.max(hardMin, Math.abs(a - b) + 0.2);
    var max = Math.min(hardMax, a + b - 0.2);

    if (max <= min) {
        max = min + 0.1;
    }

    slider.min = min.toFixed(2);
    slider.max = max.toFixed(2);

    var v = parseFloat(slider.value);
    if (isNaN(v)) v = min;
    v = clamp(v, min, max);
    v = Math.round(v * 10) / 10;
    slider.value = v.toFixed(1);

    return v;
}

function buildTriangleFromSides(a, b, c) {
    var x = (b * b + c * c - a * a) / (2 * c);
    var y2 = b * b - x * x;
    if (y2 < 0) y2 = 0;
    var y = Math.sqrt(y2);

    var A = { x: 0, y: 0 };
    var B = { x: c, y: 0 };
    var C = { x: x, y: y };
    var H = { x: x, y: 0 };

    return {
        A: A,
        B: B,
        C: C,
        H: H,
        x: x,
        height: y
    };
}

function classifyTriangle(a, b, c) {
    var eps = 0.12;
    var sideType = 'různostranný';

    if (approx(a, b, eps) && approx(b, c, eps)) {
        sideType = 'rovnostranný';
    } else if (approx(a, b, eps) || approx(b, c, eps) || approx(c, a, eps)) {
        sideType = 'rovnoramenný';
    }

    var sides = [a, b, c].sort(function (x, y) { return x - y; });
    var l2 = sides[2] * sides[2];
    var sum2 = sides[0] * sides[0] + sides[1] * sides[1];

    var angleType = 'ostroúhlý';
    if (approx(l2, sum2, 0.18)) {
        angleType = 'pravoúhlý';
    } else if (l2 > sum2) {
        angleType = 'tupoúhlý';
    }

    return sideType + ', ' + angleType;
}

function randomTriangleSides() {
    for (var i = 0; i < 100; i++) {
        var a = Math.round((3 + Math.random() * 7) * 10) / 10;
        var b = Math.round((3 + Math.random() * 7) * 10) / 10;
        var cMin = Math.abs(a - b) + 0.4;
        var cMax = Math.min(10.8, a + b - 0.4);

        if (cMax <= cMin) continue;

        var c = Math.round((cMin + Math.random() * (cMax - cMin)) * 10) / 10;
        return { a: a, b: b, c: c };
    }

    return { a: 6.0, b: 7.0, c: 8.0 };
}

function triangleRanges(a, b, c) {
    var xMax = Math.max(11.5, c + 1.8);
    var yMax = Math.max(7.5, Math.max(2, (b * b - Math.pow((b * b + c * c - a * a) / (2 * c), 2)) > 0 ? Math.sqrt(Math.max(0, b * b - Math.pow((b * b + c * c - a * a) / (2 * c), 2))) + 1.8 : 4));

    return {
        xMin: -1.4,
        xMax: xMax,
        yMin: -1.2,
        yMax: yMax
    };
}

function initNavigation(redrawBySection) {
    var sectionOrder = [
        'aplikace-heronova-vzorce',
        'odvozeni-heronova-vzorce',
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

function initSectionJumps() {
    var jumpLinks = document.querySelectorAll('[data-section-jump]');
    if (jumpLinks.length === 0) return;

    jumpLinks.forEach(function (link) {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            var section = link.getAttribute('data-section-jump');
            var sidebarLink = document.querySelector('.sidebar-link[data-section="' + section + '"]');
            if (sidebarLink) {
                sidebarLink.click();
            }
        });
    });
}

function initHeronApplicationDemo(redrawBySection) {
    var sectionId = 'aplikace-heronova-vzorce';
    var canvas = document.getElementById('heronApplicationCanvas');
    if (!canvas) return;

    var sideASlider = document.getElementById('sideASlider');
    var sideBSlider = document.getElementById('sideBSlider');
    var sideCSlider = document.getElementById('sideCSlider');

    var showAltitude = document.getElementById('showAltitudeHeron');
    var showSideLabels = document.getElementById('showSideLabelsHeron');

    var sideAValue = document.getElementById('sideAValue');
    var sideBValue = document.getElementById('sideBValue');
    var sideCValue = document.getElementById('sideCValue');

    var perimeterValue = document.getElementById('perimeterValue');
    var semiperimeterValue = document.getElementById('semiperimeterValue');
    var heronProductValue = document.getElementById('heronProductValue');
    var heronAreaValue = document.getElementById('heronAreaValue');
    var baseHeightAreaValue = document.getElementById('baseHeightAreaValue');
    var areaDiffValue = document.getElementById('areaDiffValue');
    var triangleTypeValue = document.getElementById('triangleTypeValue');

    var randomBtn = document.getElementById('randomApplicationTriangle');
    var resetBtn = document.getElementById('resetApplication');

    function draw() {
        var a = parseFloat(sideASlider.value);
        var b = parseFloat(sideBSlider.value);
        var c = syncThirdSideSlider(a, b, sideCSlider, 2.5, 11);

        sideAValue.textContent = formatNum(a, 1);
        sideBValue.textContent = formatNum(b, 1);
        sideCValue.textContent = formatNum(c, 1);

        var tri = buildTriangleFromSides(a, b, c);

        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);

        var range = triangleRanges(a, b, c);
        var plane = createPlane(14, 14, w - 28, h - 28, range.xMin, range.xMax, range.yMin, range.yMax);
        drawPlaneGrid(ctx, plane);

        drawTriangle(ctx, plane, tri.A, tri.B, tri.C, '#f8fafc', 'rgba(99,102,241,0.18)', 2.4);

        if (showAltitude.checked) {
            drawSegment(ctx, plane, tri.C, tri.H, '#34d399', 2.2, true);
            drawPoint(ctx, plane, tri.H, '#34d399', 'H', 4.2);
            drawWorldText(ctx, plane, {
                x: tri.H.x + 0.25,
                y: tri.height / 2
            }, 'v_c', '#34d399', 'left');
        }

        drawPoint(ctx, plane, tri.A, '#60a5fa', 'A', 4.8);
        drawPoint(ctx, plane, tri.B, '#60a5fa', 'B', 4.8);
        drawPoint(ctx, plane, tri.C, '#f59e0b', 'C', 4.8);

        if (showSideLabels.checked) {
            var midAB = { x: (tri.A.x + tri.B.x) / 2, y: 0.35 };
            var midBC = { x: (tri.B.x + tri.C.x) / 2 + 0.2, y: (tri.B.y + tri.C.y) / 2 };
            var midCA = { x: (tri.C.x + tri.A.x) / 2 - 0.25, y: (tri.C.y + tri.A.y) / 2 };

            drawWorldText(ctx, plane, midAB, 'c = ' + formatNum(c, 2), '#f8fafc', 'center');
            drawWorldText(ctx, plane, midBC, 'a = ' + formatNum(a, 2), '#f8fafc', 'left');
            drawWorldText(ctx, plane, midCA, 'b = ' + formatNum(b, 2), '#f8fafc', 'right');
        }

        var p = a + b + c;
        var s = p / 2;
        var product = s * (s - a) * (s - b) * (s - c);
        if (product < 0) product = 0;

        var heronArea = Math.sqrt(product);
        var baseHeightArea = 0.5 * c * tri.height;
        var diff = Math.abs(heronArea - baseHeightArea);

        perimeterValue.textContent = formatNum(p, 3);
        semiperimeterValue.textContent = formatNum(s, 3);
        heronProductValue.textContent = formatNum(product, 5);
        heronAreaValue.textContent = formatNum(heronArea, 4);
        baseHeightAreaValue.textContent = formatNum(baseHeightArea, 4);
        areaDiffValue.textContent = formatNum(diff, 8);

        triangleTypeValue.textContent = classifyTriangle(a, b, c);
        triangleTypeValue.className = 'status-chip';
        triangleTypeValue.classList.add(diff < 1e-4 ? 'equal' : 'different');
    }

    [
        sideASlider,
        sideBSlider,
        sideCSlider,
        showAltitude,
        showSideLabels
    ].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    randomBtn.addEventListener('click', function () {
        var rnd = randomTriangleSides();
        sideASlider.value = rnd.a.toFixed(1);
        sideBSlider.value = rnd.b.toFixed(1);
        sideCSlider.value = rnd.c.toFixed(1);
        draw();
    });

    resetBtn.addEventListener('click', function () {
        sideASlider.value = '7.0';
        sideBSlider.value = '6.2';
        sideCSlider.value = '8.0';
        showAltitude.checked = true;
        showSideLabels.checked = true;
        draw();
    });

    redrawBySection[sectionId] = draw;
    draw();
}

function initHeronDerivationDemo(redrawBySection) {
    var sectionId = 'odvozeni-heronova-vzorce';
    var canvas = document.getElementById('heronDerivationCanvas');
    if (!canvas) return;

    var sideASlider = document.getElementById('derSideASlider');
    var sideBSlider = document.getElementById('derSideBSlider');
    var sideCSlider = document.getElementById('derSideCSlider');
    var stepSlider = document.getElementById('derivationStepSlider');

    var showAllSteps = document.getElementById('showAllDerivationSteps');
    var showAltitude = document.getElementById('showAltitudeDerivation');

    var sideAValue = document.getElementById('derSideAValue');
    var sideBValue = document.getElementById('derSideBValue');
    var sideCValue = document.getElementById('derSideCValue');
    var stepValue = document.getElementById('derivationStepValue');

    var xSegmentValue = document.getElementById('xSegmentValue');
    var heightValue = document.getElementById('heightDerivationValue');
    var sValue = document.getElementById('sDerivationValue');
    var stepLeftValue = document.getElementById('stepLeftValue');
    var stepRightValue = document.getElementById('stepRightValue');
    var diffValue = document.getElementById('derivationDifferenceValue');
    var statusValue = document.getElementById('derivationStatusValue');

    var explanation = document.getElementById('currentStepExplanation');

    var randomBtn = document.getElementById('randomDerivationTriangle');
    var resetBtn = document.getElementById('resetDerivation');

    var stepDescriptions = {
        1: 'Krok 1: Definujeme obsah přes základnu c a výšku v_c, tedy S = c·v_c/2.',
        2: 'Krok 2: Z pravoúhlého trojúhelníku u paty výšky dostáváme vztah v_c² = b² - x².',
        3: 'Krok 3: Z kosinové věty (resp. úprav) vyjádříme x = (b² + c² - a²)/(2c).',
        4: 'Krok 4: Dosadíme do S² = (1/4)c²v_c² a přepíšeme přes b² - x².',
        5: 'Krok 5: Po odstranění zlomků vychází kompaktní tvar [4b²c² - (b² + c² - a²)²]/16.',
        6: 'Krok 6: Algebraickou faktorizací získáme S² = s(s-a)(s-b)(s-c), tedy Heronův vzorec.'
    };

    function updateStepsVisual(step, showAll) {
        for (var i = 1; i <= 6; i++) {
            var item = document.getElementById('derivationStep' + i);
            if (!item) continue;
            item.classList.toggle('active', showAll || i === step);
        }
    }

    function drawRightAngleMarker(ctx, plane, H) {
        var s = 0.35;
        var p1 = H;
        var p2 = { x: H.x + s, y: H.y };
        var p3 = { x: H.x + s, y: H.y + s };
        var p4 = { x: H.x, y: H.y + s };

        drawSegment(ctx, plane, p1, p2, '#fbbf24', 1.8, false);
        drawSegment(ctx, plane, p2, p3, '#fbbf24', 1.8, false);
        drawSegment(ctx, plane, p3, p4, '#fbbf24', 1.8, false);
    }

    function draw() {
        var a = parseFloat(sideASlider.value);
        var b = parseFloat(sideBSlider.value);
        var c = syncThirdSideSlider(a, b, sideCSlider, 2.5, 11);
        var step = parseInt(stepSlider.value, 10);

        sideAValue.textContent = formatNum(a, 1);
        sideBValue.textContent = formatNum(b, 1);
        sideCValue.textContent = formatNum(c, 1);
        stepValue.textContent = String(step);

        updateStepsVisual(step, showAllSteps.checked);

        var tri = buildTriangleFromSides(a, b, c);
        var x = tri.x;
        var h = tri.height;
        var s = (a + b + c) / 2;

        var area = 0.5 * c * h;
        var area2 = area * area;
        var heronProduct = s * (s - a) * (s - b) * (s - c);
        if (heronProduct < 0) heronProduct = 0;

        var xFormula = (b * b + c * c - a * a) / (2 * c);
        var eq2Left = h * h;
        var eq2Right = b * b - x * x;

        var eq4Right = 0.25 * c * c * (b * b - x * x);
        var eq5Right = (4 * b * b * c * c - Math.pow(b * b + c * c - a * a, 2)) / 16;

        var left = 0;
        var right = 0;

        if (step === 1) {
            left = area;
            right = 0.5 * c * h;
        } else if (step === 2) {
            left = eq2Left;
            right = eq2Right;
        } else if (step === 3) {
            left = x;
            right = xFormula;
        } else if (step === 4) {
            left = area2;
            right = eq4Right;
        } else if (step === 5) {
            left = area2;
            right = eq5Right;
        } else {
            left = area2;
            right = heronProduct;
        }

        var diff = Math.abs(left - right);

        xSegmentValue.textContent = formatNum(x, 5);
        heightValue.textContent = formatNum(h, 5);
        sValue.textContent = formatNum(s, 5);
        stepLeftValue.textContent = formatNum(left, 8);
        stepRightValue.textContent = formatNum(right, 8);
        diffValue.textContent = formatNum(diff, 10);

        statusValue.textContent = diff < 1e-6 ? 'rovnost platí' : 'odchylka zaokrouhlení';
        statusValue.className = 'status-chip';
        statusValue.classList.add(diff < 1e-6 ? 'equal' : 'different');

        if (explanation) {
            explanation.textContent = stepDescriptions[step];
        }

        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var hCanvas = setup.h;

        drawBackdrop(ctx, w, hCanvas);
        var range = triangleRanges(a, b, c);
        var plane = createPlane(14, 14, w - 28, hCanvas - 28, range.xMin, range.xMax, range.yMin, range.yMax);
        drawPlaneGrid(ctx, plane);

        drawTriangle(ctx, plane, tri.A, tri.B, tri.C, '#f8fafc', 'rgba(245,158,11,0.16)', 2.4);

        if (showAltitude.checked) {
            drawSegment(ctx, plane, tri.C, tri.H, '#34d399', 2.2, true);
            drawRightAngleMarker(ctx, plane, tri.H);

            drawWorldText(ctx, plane, {
                x: tri.H.x / 2,
                y: -0.35
            }, 'x = ' + formatNum(x, 3), '#34d399', 'center');

            drawWorldText(ctx, plane, {
                x: (tri.H.x + tri.B.x) / 2,
                y: -0.35
            }, 'c - x = ' + formatNum(c - x, 3), '#34d399', 'center');

            drawWorldText(ctx, plane, {
                x: tri.H.x + 0.25,
                y: tri.height / 2
            }, 'v_c', '#34d399', 'left');
        }

        drawPoint(ctx, plane, tri.A, '#60a5fa', 'A', 4.8);
        drawPoint(ctx, plane, tri.B, '#60a5fa', 'B', 4.8);
        drawPoint(ctx, plane, tri.C, '#f59e0b', 'C', 4.8);
        drawPoint(ctx, plane, tri.H, '#34d399', 'H', 4.4);

        drawWorldText(ctx, plane, {
            x: (tri.B.x + tri.C.x) / 2 + 0.2,
            y: (tri.B.y + tri.C.y) / 2
        }, 'a', '#f8fafc', 'left');
        drawWorldText(ctx, plane, {
            x: (tri.C.x + tri.A.x) / 2 - 0.2,
            y: (tri.C.y + tri.A.y) / 2
        }, 'b', '#f8fafc', 'right');
        drawWorldText(ctx, plane, {
            x: (tri.A.x + tri.B.x) / 2,
            y: 0.35
        }, 'c', '#f8fafc', 'center');
    }

    [
        sideASlider,
        sideBSlider,
        sideCSlider,
        stepSlider,
        showAllSteps,
        showAltitude
    ].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    randomBtn.addEventListener('click', function () {
        var rnd = randomTriangleSides();
        sideASlider.value = rnd.a.toFixed(1);
        sideBSlider.value = rnd.b.toFixed(1);
        sideCSlider.value = rnd.c.toFixed(1);
        stepSlider.value = String(1 + Math.floor(Math.random() * 6));
        draw();
    });

    resetBtn.addEventListener('click', function () {
        sideASlider.value = '6.6';
        sideBSlider.value = '7.5';
        sideCSlider.value = '8.4';
        stepSlider.value = '1';
        showAllSteps.checked = true;
        showAltitude.checked = true;
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
