// Kapitola 5: Koule a jeji casti - interactive lesson

document.addEventListener('DOMContentLoaded', function () {
    var redrawBySection = {};

    initNavigation(redrawBySection);
    initSphereDemo(redrawBySection);
    initCapAndSectorDemo(redrawBySection);
    initLayerDemo(redrawBySection);
    initQuickChecks();
    initExercises();
});

function initNavigation(redrawBySection) {
    var sectionOrder = [
        'koule-objem-povrch-a-odvozeni',
        'kulova-vysec-kulova-usec-kulova-vrstva-a-vrchlik',
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

function setupHiDPI(canvas) {
    var dpr = window.devicePixelRatio || 1;
    var parent = canvas.parentElement;
    var nominalWidth = parseInt(canvas.getAttribute('width'), 10) || 760;
    var nominalHeight = parseInt(canvas.getAttribute('height'), 10) || 420;
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
    grad.addColorStop(0, '#162339');
    grad.addColorStop(1, '#0a1322');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(148,163,184,0.12)';
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

function drawLine2D(ctx, x1, y1, x2, y2, color, width, dashed) {
    ctx.save();
    if (dashed) ctx.setLineDash([7, 5]);
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
}

function drawText(ctx, text, x, y, color, align, size) {
    ctx.save();
    ctx.fillStyle = color || '#e2e8f0';
    ctx.font = '600 ' + (size || 12) + 'px Inter';
    ctx.textAlign = align || 'left';
    ctx.fillText(text, x, y);
    ctx.restore();
}

function drawSoftPanel(ctx, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(15,23,42,0.74)';
    ctx.strokeStyle = 'rgba(148,163,184,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function initSphereDemo(redrawBySection) {
    var sectionId = 'koule-objem-povrch-a-odvozeni';
    var canvas = document.getElementById('sphereCanvas');
    if (!canvas) return;

    var radiusSlider = document.getElementById('sphereRadius');
    var sliceSlider = document.getElementById('sphereSlice');
    var showSlice = document.getElementById('sphereShowSlice');
    var showDerivative = document.getElementById('sphereShowDerivative');

    var radiusValue = document.getElementById('sphereRadiusValue');
    var sliceValue = document.getElementById('sphereSliceValue');

    var volumeValue = document.getElementById('sphereVolumeValue');
    var surfaceValue = document.getElementById('sphereSurfaceValue');
    var greatCircleValue = document.getElementById('sphereGreatCircleValue');
    var sliceXValue = document.getElementById('sphereSliceXValue');
    var sliceRadiusValue = document.getElementById('sphereSliceRadiusValue');
    var sliceAreaValue = document.getElementById('sphereSliceAreaValue');
    var derivativeValue = document.getElementById('sphereDerivativeValue');
    var ratioValue = document.getElementById('sphereRatioValue');

    var resetBtn = document.getElementById('sphereReset');

    function draw() {
        var r = parseFloat(radiusSlider.value);
        var sliceRatio = parseInt(sliceSlider.value, 10) / 100;
        var x = sliceRatio * r;
        var rho = Math.sqrt(Math.max(0, r * r - x * x));

        var V = (4 * Math.PI * r * r * r) / 3;
        var S = 4 * Math.PI * r * r;
        var Sgreat = Math.PI * r * r;
        var Aslice = Math.PI * rho * rho;
        var deriv = 4 * Math.PI * r * r;
        var ratio = S / V;

        radiusValue.textContent = formatNum(r, 1);
        sliceValue.textContent = formatNum(sliceRatio, 2);

        volumeValue.textContent = formatNum(V, 3);
        surfaceValue.textContent = formatNum(S, 3);
        greatCircleValue.textContent = formatNum(Sgreat, 3);
        sliceXValue.textContent = formatNum(x, 3);
        sliceRadiusValue.textContent = formatNum(rho, 3);
        sliceAreaValue.textContent = formatNum(Aslice, 3);
        derivativeValue.textContent = formatNum(deriv, 3);
        ratioValue.textContent = formatNum(ratio, 4);

        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);

        var leftCx = w * 0.3;
        var leftCy = h * 0.57;
        var leftR = Math.min(w * 0.18, h * 0.34);
        var scale = leftR / r;

        drawLine2D(ctx, leftCx - leftR - 36, leftCy, leftCx + leftR + 36, leftCy, 'rgba(226,232,240,0.45)', 1.3, false);
        drawLine2D(ctx, leftCx, leftCy - leftR - 24, leftCx, leftCy + leftR + 24, 'rgba(226,232,240,0.45)', 1.3, false);

        ctx.beginPath();
        ctx.arc(leftCx, leftCy, leftR, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59,130,246,0.13)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(241,245,249,0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();

        drawLine2D(ctx, leftCx, leftCy, leftCx + leftR, leftCy, '#f472b6', 2, false);
        drawText(ctx, 'r', leftCx + leftR * 0.52, leftCy - 10, '#f472b6', 'center', 12);

        if (showSlice.checked) {
            var xPx = x * scale;
            var rhoPx = rho * scale;

            ctx.fillStyle = 'rgba(34,211,238,0.18)';
            ctx.fillRect(leftCx + xPx - 4, leftCy - rhoPx, 8, rhoPx * 2);

            drawLine2D(ctx, leftCx + xPx, leftCy - rhoPx, leftCx + xPx, leftCy + rhoPx, '#22d3ee', 2.2, false);
            drawLine2D(ctx, leftCx, leftCy, leftCx + xPx, leftCy, '#22c55e', 2, true);

            drawText(ctx, 'x', leftCx + xPx * 0.5, leftCy + 16, '#22c55e', 'center', 12);
            drawText(ctx, 'ρ(x)', leftCx + xPx + 14, leftCy - rhoPx * 0.5, '#22d3ee', 'left', 12);
        }

        drawText(ctx, 'A(x) = π(r² - x²)', leftCx - leftR - 10, leftCy - leftR - 24, '#93c5fd', 'left', 12);

        var rightCx = w * 0.74;
        var rightCy = h * 0.53;
        var rightR = Math.min(w * 0.17, h * 0.31);

        var grad = ctx.createRadialGradient(
            rightCx - rightR * 0.35,
            rightCy - rightR * 0.35,
            rightR * 0.22,
            rightCx,
            rightCy,
            rightR
        );
        grad.addColorStop(0, 'rgba(191,219,254,0.95)');
        grad.addColorStop(0.4, 'rgba(59,130,246,0.72)');
        grad.addColorStop(1, 'rgba(37,99,235,0.35)');

        ctx.beginPath();
        ctx.arc(rightCx, rightCy, rightR, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(226,232,240,0.95)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(rightCx, rightCy, rightR, rightR * 0.27, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(226,232,240,0.36)';
        ctx.lineWidth = 1.4;
        ctx.stroke();

        if (showSlice.checked) {
            var yOffset = -x * scale * 0.9;
            var rx = rho * scale;
            var ry = Math.max(4, rx * 0.28);

            ctx.beginPath();
            ctx.ellipse(rightCx, rightCy + yOffset, rx, ry, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(34,211,238,0.2)';
            ctx.fill();
            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 2;
            ctx.stroke();

            drawLine2D(ctx, rightCx, rightCy - rightR, rightCx, rightCy + yOffset, '#22c55e', 2, true);
        }

        drawLine2D(ctx, rightCx, rightCy, rightCx + rightR, rightCy, '#f8fafc', 1.8, false);
        drawText(ctx, 'r', rightCx + rightR * 0.52, rightCy - 10, '#f8fafc', 'center', 12);

        if (showDerivative.checked) {
            var panelX = w * 0.53;
            var panelY = h * 0.76;
            drawSoftPanel(ctx, panelX, panelY, w * 0.41, 58);
            drawText(ctx, 'dV/dr = 4πr² = S', panelX + 14, panelY + 22, '#86efac', 'left', 13);
            drawText(ctx, 'U koule derivace objemu podle r dává přesně povrch.', panelX + 14, panelY + 42, '#cbd5e1', 'left', 11);
        }
    }

    [radiusSlider, sliceSlider, showSlice, showDerivative].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    resetBtn.addEventListener('click', function () {
        radiusSlider.value = '4';
        sliceSlider.value = '0';
        showSlice.checked = true;
        showDerivative.checked = true;
        draw();
    });

    redrawBySection[sectionId] = draw;
    draw();
}
function initCapAndSectorDemo(redrawBySection) {
    var sectionId = 'kulova-vysec-kulova-usec-kulova-vrstva-a-vrchlik';
    var canvas = document.getElementById('capCanvas');
    if (!canvas) return;

    var radiusSlider = document.getElementById('capRadius');
    var heightSlider = document.getElementById('capHeight');
    var showSector = document.getElementById('capShowSector');
    var showCone = document.getElementById('capShowCone');

    var radiusValue = document.getElementById('capRadiusValue');
    var heightValue = document.getElementById('capHeightValue');

    var baseRadiusValue = document.getElementById('capBaseRadiusValue');
    var surfaceValue = document.getElementById('capSurfaceValue');
    var solidSurfaceValue = document.getElementById('capSolidSurfaceValue');
    var volumeValue = document.getElementById('capVolumeValue');
    var sectorVolumeValue = document.getElementById('sectorVolumeValue');
    var coneVolumeValue = document.getElementById('coneVolumeValue');

    var resetBtn = document.getElementById('capReset');

    function draw() {
        var r = parseFloat(radiusSlider.value);
        var hCap = parseFloat(heightSlider.value);

        var maxCap = Math.max(0.4, r - 0.05);
        if (hCap > maxCap) {
            hCap = maxCap;
            heightSlider.value = hCap.toFixed(2);
        }

        var a = Math.sqrt(Math.max(0, hCap * (2 * r - hCap)));
        var Svrchlik = 2 * Math.PI * r * hCap;
        var Susec = Svrchlik + Math.PI * a * a;
        var Vusec = Math.PI * hCap * hCap * (r - hCap / 3);
        var Vvysec = (2 * Math.PI * r * r * hCap) / 3;
        var Vkuzel = (Math.PI * a * a * (r - hCap)) / 3;

        radiusValue.textContent = formatNum(r, 1);
        heightValue.textContent = formatNum(hCap, 1);

        baseRadiusValue.textContent = formatNum(a, 3);
        surfaceValue.textContent = formatNum(Svrchlik, 3);
        solidSurfaceValue.textContent = formatNum(Susec, 3);
        volumeValue.textContent = formatNum(Vusec, 3);
        sectorVolumeValue.textContent = formatNum(Vvysec, 3);
        coneVolumeValue.textContent = formatNum(Vkuzel, 3);

        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);

        var cx = w * 0.45;
        var cy = h * 0.58;
        var Rpx = Math.min(w * 0.22, h * 0.38);
        var scale = Rpx / r;

        var planeZ = r - hCap;
        var planeY = cy - planeZ * scale;
        var halfBase = a * scale;
        var pLeft = { x: cx - halfBase, y: planeY };
        var pRight = { x: cx + halfBase, y: planeY };

        ctx.beginPath();
        ctx.arc(cx, cy, Rpx, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59,130,246,0.1)';
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, Rpx, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = 'rgba(16,185,129,0.24)';
        ctx.fillRect(cx - Rpx - 3, 0, 2 * Rpx + 6, planeY);
        ctx.restore();

        if (showSector.checked && halfBase > 1) {
            var angleRight = Math.atan2(pRight.y - cy, pRight.x - cx);
            var angleLeft = Math.atan2(pLeft.y - cy, pLeft.x - cx);

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(pRight.x, pRight.y);
            ctx.arc(cx, cy, Rpx, angleRight, angleLeft, true);
            ctx.closePath();
            ctx.fillStyle = 'rgba(34,211,238,0.2)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(34,211,238,0.9)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        drawLine2D(ctx, cx - Rpx - 22, planeY, cx + Rpx + 22, planeY, 'rgba(241,245,249,0.55)', 1.3, true);
        drawLine2D(ctx, pLeft.x, pLeft.y, pRight.x, pRight.y, '#22d3ee', 2.2, false);

        if (showCone.checked) {
            drawLine2D(ctx, cx, cy, pLeft.x, pLeft.y, '#f59e0b', 2, false);
            drawLine2D(ctx, cx, cy, pRight.x, pRight.y, '#f59e0b', 2, false);
        }

        drawLine2D(ctx, cx, cy, cx, cy - Rpx, '#f8fafc', 1.8, false);
        drawLine2D(ctx, cx, cy - Rpx, cx, planeY, '#22c55e', 2.1, true);

        ctx.beginPath();
        ctx.arc(cx, cy, Rpx, 0, Math.PI * 2);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.stroke();

        drawText(ctx, 'r', cx + 10, cy - Rpx * 0.45, '#f8fafc', 'left', 12);
        drawText(ctx, 'v', cx + 10, (cy - Rpx + planeY) * 0.5, '#22c55e', 'left', 12);
        drawText(ctx, 'a', cx + halfBase * 0.52, planeY - 8, '#22d3ee', 'center', 12);

        var panelX = w * 0.66;
        var panelY = h * 0.08;
        drawSoftPanel(ctx, panelX, panelY, w * 0.31, 92);
        drawText(ctx, 'V_úseč = πv²(r - v/3)', panelX + 12, panelY + 24, '#86efac', 'left', 12);
        drawText(ctx, 'V_výseč = (2/3)πr²v', panelX + 12, panelY + 44, '#67e8f9', 'left', 12);
        drawText(ctx, 'S_vrchlík = 2πrv', panelX + 12, panelY + 64, '#c4b5fd', 'left', 12);
    }

    [radiusSlider, heightSlider, showSector, showCone].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    resetBtn.addEventListener('click', function () {
        radiusSlider.value = '5';
        heightSlider.value = '2';
        showSector.checked = true;
        showCone.checked = true;
        draw();
    });

    redrawBySection[sectionId] = function () {
        draw();
        if (redrawBySection._layer) redrawBySection._layer();
    };

    draw();
}

function initLayerDemo(redrawBySection) {
    var canvas = document.getElementById('layerCanvas');
    if (!canvas) return;

    var radiusSlider = document.getElementById('layerRadius');
    var z1Slider = document.getElementById('layerZ1');
    var z2Slider = document.getElementById('layerZ2');
    var showBases = document.getElementById('layerShowBases');

    var radiusValue = document.getElementById('layerRadiusValue');
    var z1Value = document.getElementById('layerZ1Value');
    var z2Value = document.getElementById('layerZ2Value');

    var heightValue = document.getElementById('layerHeightValue');
    var baseAValue = document.getElementById('layerBaseAValue');
    var baseBValue = document.getElementById('layerBaseBValue');
    var zoneAreaValue = document.getElementById('layerZoneAreaValue');
    var volumeValue = document.getElementById('layerVolumeValue');
    var surfaceValue = document.getElementById('layerTotalSurfaceValue');

    var resetBtn = document.getElementById('layerReset');

    function draw() {
        var r = parseFloat(radiusSlider.value);
        var z1 = parseInt(z1Slider.value, 10) / 100 * r;
        var z2 = parseInt(z2Slider.value, 10) / 100 * r;

        if (z2 - z1 < 0.25) {
            z2 = z1 + 0.25;
            if (z2 > 0.95 * r) {
                z2 = 0.95 * r;
                z1 = z2 - 0.25;
            }
            z1Slider.value = String(Math.round((z1 / r) * 100));
            z2Slider.value = String(Math.round((z2 / r) * 100));
        }

        var a = Math.sqrt(Math.max(0, r * r - z1 * z1));
        var b = Math.sqrt(Math.max(0, r * r - z2 * z2));
        var hLayer = z2 - z1;

        var Szone = 2 * Math.PI * r * hLayer;
        var Vlayer = (Math.PI * hLayer * (3 * a * a + 3 * b * b + hLayer * hLayer)) / 6;
        var Stotal = Szone + Math.PI * (a * a + b * b);

        radiusValue.textContent = formatNum(r, 1);
        z1Value.textContent = formatNum(z1 / r, 2);
        z2Value.textContent = formatNum(z2 / r, 2);

        heightValue.textContent = formatNum(hLayer, 3);
        baseAValue.textContent = formatNum(a, 3);
        baseBValue.textContent = formatNum(b, 3);
        zoneAreaValue.textContent = formatNum(Szone, 3);
        volumeValue.textContent = formatNum(Vlayer, 3);
        surfaceValue.textContent = formatNum(Stotal, 3);

        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);

        var cx = w * 0.45;
        var cy = h * 0.58;
        var Rpx = Math.min(w * 0.22, h * 0.38);
        var scale = Rpx / r;

        var y1 = cy - z1 * scale;
        var y2 = cy - z2 * scale;
        var halfA = a * scale;
        var halfB = b * scale;

        ctx.beginPath();
        ctx.arc(cx, cy, Rpx, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59,130,246,0.1)';
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, Rpx, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = 'rgba(167,139,250,0.22)';
        ctx.fillRect(cx - Rpx - 3, y2, 2 * Rpx + 6, y1 - y2);
        ctx.restore();

        drawLine2D(ctx, cx - Rpx - 20, y1, cx + Rpx + 20, y1, 'rgba(241,245,249,0.5)', 1.3, true);
        drawLine2D(ctx, cx - Rpx - 20, y2, cx + Rpx + 20, y2, 'rgba(241,245,249,0.5)', 1.3, true);

        drawLine2D(ctx, cx - halfA, y1, cx + halfA, y1, '#22d3ee', 2.1, false);
        drawLine2D(ctx, cx - halfB, y2, cx + halfB, y2, '#22d3ee', 2.1, false);

        if (showBases.checked) {
            drawLine2D(ctx, cx, y1, cx + halfA, y1, '#22d3ee', 1.8, false);
            drawLine2D(ctx, cx, y2, cx + halfB, y2, '#22d3ee', 1.8, false);
            drawText(ctx, 'a', cx + halfA * 0.52, y1 - 8, '#22d3ee', 'center', 12);
            drawText(ctx, 'b', cx + halfB * 0.52, y2 - 8, '#22d3ee', 'center', 12);
        }

        drawLine2D(ctx, cx + Rpx + 24, y2, cx + Rpx + 24, y1, '#22c55e', 2.1, true);
        drawText(ctx, 'h', cx + Rpx + 30, (y1 + y2) * 0.5, '#22c55e', 'left', 12);

        ctx.beginPath();
        ctx.arc(cx, cy, Rpx, 0, Math.PI * 2);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.stroke();

        var panelX = w * 0.66;
        var panelY = h * 0.08;
        drawSoftPanel(ctx, panelX, panelY, w * 0.31, 92);
        drawText(ctx, 'V = (πh/6)(3a²+3b²+h²)', panelX + 12, panelY + 24, '#c4b5fd', 'left', 12);
        drawText(ctx, 'S_pás = 2πrh', panelX + 12, panelY + 44, '#67e8f9', 'left', 12);
        drawText(ctx, 'S_vrstva = S_pás + π(a²+b²)', panelX + 12, panelY + 64, '#86efac', 'left', 12);
    }

    [radiusSlider, z1Slider, z2Slider, showBases].forEach(function (el) {
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
    });

    resetBtn.addEventListener('click', function () {
        radiusSlider.value = '5';
        z1Slider.value = '-60';
        z2Slider.value = '60';
        showBases.checked = true;
        draw();
    });

    redrawBySection._layer = draw;
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
            correct: 'Správně. S = 4πr² = 4π·7² = 196π cm².',
            incorrect: 'Nesprávně. Správně je b): S = 4π·49 = 196π cm².'
        },
        '2': {
            correct: 'Správně. d = 10 => r = 5, takže V = (4/3)π·5³ = (500/3)π cm³.',
            incorrect: 'Nesprávně. Správně je c): r = 5, V = (4/3)π·125 = (500/3)π cm³.'
        },
        '3': {
            correct: 'Správně. a² = v(2r-v) = 2·(20-2) = 36, takže a = 6 cm.',
            incorrect: 'Nesprávně. Správně je a): a = √36 = 6 cm.'
        },
        '4': {
            correct: 'Správně. V = πv²(r-v/3) = π·4·(5-2/3) = (52/3)π cm³.',
            incorrect: 'Nesprávně. Správně je b): V_úseč = (52/3)π cm³.'
        },
        '5': {
            correct: 'Správně. V = (2/3)πr²v = (2/3)π·25·2 = (100/3)π cm³.',
            incorrect: 'Nesprávně. Správně je c): V_výseč = (100/3)π cm³.'
        },
        '6': {
            correct: 'Správně. V = (π·6/6)(3·16 + 3·16 + 36) = π·132 = 132π cm³.',
            incorrect: 'Nesprávně. Správně je c): V = 132π cm³.'
        },
        '7': {
            correct: 'Správně. S_pás = 2πrh = 2π·5·6 = 60π cm².',
            incorrect: 'Nesprávně. Správně je a): S_pás = 60π cm².'
        },
        '8': {
            correct: 'Správně. Pro kouli platí dV/dr = 4πr², což je přesně povrch S.',
            incorrect: 'Nesprávně. Správně je b): dV/dr = 4πr² = S.'
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
