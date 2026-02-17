/* Kapitola 1: Bod, primka, poloprimka, usecka, uhel */

document.addEventListener('DOMContentLoaded', function () {
    var redrawBySection = {};

    initPrimitivesDemo(redrawBySection);
    initHalfplaneAngleDemo(redrawBySection);
    initLinesDemo(redrawBySection);
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
    if (len < 1e-6) {
        return { x: 1, y: 0 };
    }
    return { x: v.x / len, y: v.y / len };
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

function fromCanvas(plane, x, y) {
    return {
        x: (x - plane.cx) / plane.scale,
        y: (plane.cy - y) / plane.scale
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
    roundedRect(
        ctx,
        plane.left,
        plane.top,
        plane.right - plane.left,
        plane.bottom - plane.top,
        9
    );
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
    var r = radius || 6;

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
        ctx.fillText(label, p.x + 9, p.y - 10);
    }
}

function drawArrow(ctx, from, to, color, width) {
    var dx = to.x - from.x;
    var dy = to.y - from.y;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.001) return;

    var ux = dx / len;
    var uy = dy / len;
    var head = 10;

    ctx.strokeStyle = color;
    ctx.lineWidth = width || 2.5;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - ux * head - uy * 5, to.y - uy * head + ux * 5);
    ctx.lineTo(to.x - ux * head + uy * 5, to.y - uy * head - ux * 5);
    ctx.closePath();
    ctx.fill();
}

function drawInfiniteLine(ctx, plane, point, dir, color, width, dashed) {
    var p1 = { x: point.x - dir.x * 40, y: point.y - dir.y * 40 };
    var p2 = { x: point.x + dir.x * 40, y: point.y + dir.y * 40 };
    var c1 = toCanvas(plane, p1);
    var c2 = toCanvas(plane, p2);

    ctx.save();
    if (dashed) ctx.setLineDash([6, 5]);
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 2.4;
    ctx.beginPath();
    ctx.moveTo(c1.x, c1.y);
    ctx.lineTo(c2.x, c2.y);
    ctx.stroke();
    ctx.restore();
}

function initNavigation(redrawBySection) {
    var sectionOrder = [
        'bod-poloprimka-primka-usecka-a-shodnost',
        'polorovina-uhel-a-osa-uhlu',
        'dve-primky-odchylka-a-vzdalenost',
        'exercises'
    ];
    var sections = document.querySelectorAll('.lesson-section');
    var sidebarLinks = document.querySelectorAll('.sidebar-link[data-section]');
    var nextButtons = document.querySelectorAll('.btn-next');
    var prevButtons = document.querySelectorAll('.btn-prev');
    var progressFill = document.querySelector('.progress-fill-small');

    function showSection(id, updateHash, smoothScroll) {
        sections.forEach(function (s) {
            s.classList.toggle('active', s.id === id);
        });

        sidebarLinks.forEach(function (link) {
            link.classList.toggle('active', link.getAttribute('data-section') === id);
        });

        var idx = sectionOrder.indexOf(id);
        if (idx >= 0 && progressFill) {
            progressFill.style.width = Math.round(((idx + 1) / sectionOrder.length) * 100) + '%';
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
            if (active && redrawBySection[active.id]) redrawBySection[active.id]();
        }, 120);
    });
}

function initPrimitivesDemo(redrawBySection) {
    var sectionId = 'bod-poloprimka-primka-usecka-a-shodnost';
    var canvas = document.getElementById('primitivesCanvas');
    if (!canvas) return;

    var modeSelect = document.getElementById('primitiveMode');
    var congruentSlider = document.getElementById('congruentSlider');
    var congruentLengthValue = document.getElementById('congruentLengthValue');
    var segmentLengthAB = document.getElementById('segmentLengthAB');
    var segmentLengthCD = document.getElementById('segmentLengthCD');
    var congruentState = document.getElementById('congruentState');
    var primitiveHint = document.getElementById('primitiveHint');
    var resetPrimitive = document.getElementById('resetPrimitive');

    var state = {
        mode: 'segment',
        A: { x: -4.5, y: -1.4 },
        B: { x: 3.6, y: 1.8 },
        C: { x: -5.4, y: 3.2 },
        D: { x: -0.4, y: 3.2 },
        dragKey: null,
        prevMath: null,
        lastPlane: null
    };

    var hints = {
        point: 'Bod má pouze polohu. Délka pro bod nedává geometrický smysl.',
        line: 'Přímka AB je nekonečná na obě strany. Body A a B určují její směr.',
        ray: 'Polopřímka začíná v bodě A a pokračuje směrem přes bod B.',
        segment: 'Úsečka AB je konečná. Shodnost znamená |AB| = |CD|.'
    };

    function applyCDLength(length) {
        var dir = normalize({ x: state.D.x - state.C.x, y: state.D.y - state.C.y });
        state.D = {
            x: state.C.x + dir.x * length,
            y: state.C.y + dir.y * length
        };
    }

    function hitTest(mousePx, threshold) {
        var keys = ['A', 'B', 'C', 'D'];
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var p = toCanvas(state.lastPlane, state[key]);
            var dx = mousePx.x - p.x;
            var dy = mousePx.y - p.y;
            if (Math.sqrt(dx * dx + dy * dy) <= threshold) {
                return key;
            }
        }
        return null;
    }

    function updateReadout() {
        var lenAB = distance(state.A, state.B);
        var lenCD = distance(state.C, state.D);
        var equal = Math.abs(lenAB - lenCD) <= 0.05;

        segmentLengthAB.textContent = lenAB.toFixed(2);
        segmentLengthCD.textContent = lenCD.toFixed(2);
        congruentLengthValue.textContent = lenCD.toFixed(1);

        congruentState.classList.remove('equal', 'different');
        if (equal) {
            congruentState.textContent = 'Shodné';
            congruentState.classList.add('equal');
        } else {
            congruentState.textContent = 'Neshodné';
            congruentState.classList.add('different');
        }

        primitiveHint.textContent = hints[state.mode] || '';
    }

    function draw() {
        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);

        var plane = createPlane(14, 14, w - 28, h - 28, -10, 10, -6.5, 6.5);
        state.lastPlane = plane;
        drawPlaneGrid(ctx, plane);

        var dirAB = normalize({ x: state.B.x - state.A.x, y: state.B.y - state.A.y });
        var Apx = toCanvas(plane, state.A);
        var Bpx = toCanvas(plane, state.B);
        var Cpx = toCanvas(plane, state.C);
        var Dpx = toCanvas(plane, state.D);

        ctx.save();
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = 'rgba(148,163,184,0.45)';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(Apx.x, Apx.y);
        ctx.lineTo(Bpx.x, Bpx.y);
        ctx.stroke();
        ctx.restore();

        if (state.mode === 'line') {
            drawInfiniteLine(ctx, plane, state.A, dirAB, '#fb7185', 2.9, false);
            var fromLine = toCanvas(plane, { x: state.A.x - dirAB.x * 8, y: state.A.y - dirAB.y * 8 });
            var toLine = toCanvas(plane, { x: state.A.x - dirAB.x * 9.4, y: state.A.y - dirAB.y * 9.4 });
            drawArrow(ctx, fromLine, toLine, '#fb7185', 2.4);
            var fromLine2 = toCanvas(plane, { x: state.A.x + dirAB.x * 8, y: state.A.y + dirAB.y * 8 });
            var toLine2 = toCanvas(plane, { x: state.A.x + dirAB.x * 9.4, y: state.A.y + dirAB.y * 9.4 });
            drawArrow(ctx, fromLine2, toLine2, '#fb7185', 2.4);
        } else if (state.mode === 'ray') {
            var rayEndMath = { x: state.A.x + dirAB.x * 12, y: state.A.y + dirAB.y * 12 };
            var rayEndPx = toCanvas(plane, rayEndMath);
            drawArrow(ctx, Apx, rayEndPx, '#fb7185', 2.8);
        } else if (state.mode === 'segment') {
            ctx.strokeStyle = '#fb7185';
            ctx.lineWidth = 3.1;
            ctx.beginPath();
            ctx.moveTo(Apx.x, Apx.y);
            ctx.lineTo(Bpx.x, Bpx.y);
            ctx.stroke();
        }

        if (state.mode === 'point') {
            ctx.fillStyle = 'rgba(251,113,133,0.85)';
            ctx.font = '600 12px Inter';
            ctx.textAlign = 'left';
            ctx.fillText('A je bod', Apx.x + 10, Apx.y + 15);
        }

        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 3.1;
        ctx.beginPath();
        ctx.moveTo(Cpx.x, Cpx.y);
        ctx.lineTo(Dpx.x, Dpx.y);
        ctx.stroke();

        drawPoint(ctx, plane, state.A, '#fb7185', 'A', 6);
        drawPoint(ctx, plane, state.B, '#f59e0b', 'B', 6);
        drawPoint(ctx, plane, state.C, '#34d399', 'C', 6);
        drawPoint(ctx, plane, state.D, '#60a5fa', 'D', 6);

        ctx.fillStyle = 'rgba(226,232,240,0.8)';
        ctx.font = '600 12px Inter';
        ctx.textAlign = 'left';
        ctx.fillText('AB', (Apx.x + Bpx.x) / 2 + 8, (Apx.y + Bpx.y) / 2 - 8);
        ctx.fillText('CD', (Cpx.x + Dpx.x) / 2 + 8, (Cpx.y + Dpx.y) / 2 - 8);

        updateReadout();
    }

    function getMousePos(event) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    canvas.addEventListener('mousedown', function (event) {
        if (!state.lastPlane) return;
        var mouse = getMousePos(event);
        var key = hitTest(mouse, 12);
        if (!key) return;
        state.dragKey = key;
        state.prevMath = fromCanvas(state.lastPlane, mouse.x, mouse.y);
    });

    canvas.addEventListener('mousemove', function (event) {
        if (!state.lastPlane) return;
        var mouse = getMousePos(event);

        if (state.dragKey) {
            var currentMath = fromCanvas(state.lastPlane, mouse.x, mouse.y);
            currentMath.x = clamp(currentMath.x, state.lastPlane.xMin + 0.2, state.lastPlane.xMax - 0.2);
            currentMath.y = clamp(currentMath.y, state.lastPlane.yMin + 0.2, state.lastPlane.yMax - 0.2);

            if (state.dragKey === 'C') {
                var dx = currentMath.x - state.prevMath.x;
                var dy = currentMath.y - state.prevMath.y;
                state.C.x += dx;
                state.C.y += dy;
                state.D.x += dx;
                state.D.y += dy;
            } else {
                state[state.dragKey].x = currentMath.x;
                state[state.dragKey].y = currentMath.y;
            }

            state.prevMath = currentMath;

            if (state.dragKey === 'D') {
                var len = distance(state.C, state.D);
                congruentSlider.value = clamp(len, parseFloat(congruentSlider.min), parseFloat(congruentSlider.max)).toFixed(1);
            }

            draw();
            return;
        }

        var hover = hitTest(mouse, 11);
        canvas.style.cursor = hover ? 'grab' : 'crosshair';
    });

    canvas.addEventListener('mouseup', function () {
        state.dragKey = null;
        state.prevMath = null;
        canvas.style.cursor = 'crosshair';
    });

    canvas.addEventListener('mouseleave', function () {
        state.dragKey = null;
        state.prevMath = null;
    });

    modeSelect.addEventListener('change', function () {
        state.mode = modeSelect.value;
        draw();
    });

    congruentSlider.addEventListener('input', function () {
        applyCDLength(parseFloat(congruentSlider.value));
        draw();
    });

    resetPrimitive.addEventListener('click', function () {
        state.mode = 'segment';
        state.A = { x: -4.5, y: -1.4 };
        state.B = { x: 3.6, y: 1.8 };
        state.C = { x: -5.4, y: 3.2 };
        state.D = { x: -0.4, y: 3.2 };
        modeSelect.value = 'segment';
        congruentSlider.value = '5.0';
        draw();
    });

    redrawBySection[sectionId] = draw;
    draw();
}

function initHalfplaneAngleDemo(redrawBySection) {
    var sectionId = 'polorovina-uhel-a-osa-uhlu';
    var canvas = document.getElementById('halfplaneAngleCanvas');
    if (!canvas) return;

    var lineTiltSlider = document.getElementById('lineTiltSlider');
    var pointXSlider = document.getElementById('pointXSlider');
    var pointYSlider = document.getElementById('pointYSlider');
    var angleSlider = document.getElementById('angleSlider');
    var showBisector = document.getElementById('showBisector');

    var lineTiltValue = document.getElementById('lineTiltValue');
    var pointXValue = document.getElementById('pointXValue');
    var pointYValue = document.getElementById('pointYValue');
    var angleValueInline = document.getElementById('angleValueInline');

    var pointSideStatus = document.getElementById('pointSideStatus');
    var angleValue = document.getElementById('angleValue');
    var bisectorValue = document.getElementById('bisectorValue');

    function drawLeftPanel(ctx, rect, tiltDeg, pointP) {
        var plane = createPlane(rect.x + 10, rect.y + 10, rect.w - 20, rect.h - 20, -8, 8, -6, 6);
        drawPlaneGrid(ctx, plane);

        var theta = tiltDeg * Math.PI / 180;
        var dir = { x: Math.cos(theta), y: Math.sin(theta) };
        var normal = { x: -Math.sin(theta), y: Math.cos(theta) };
        var far = 20;

        var poly = [
            { x: -far * dir.x, y: -far * dir.y },
            { x: far * dir.x, y: far * dir.y },
            { x: far * dir.x + far * normal.x, y: far * dir.y + far * normal.y },
            { x: -far * dir.x + far * normal.x, y: -far * dir.y + far * normal.y }
        ];

        ctx.save();
        roundedRect(ctx, plane.left, plane.top, plane.right - plane.left, plane.bottom - plane.top, 9);
        ctx.clip();
        ctx.fillStyle = 'rgba(96,165,250,0.16)';
        ctx.beginPath();
        var first = toCanvas(plane, poly[0]);
        ctx.moveTo(first.x, first.y);
        for (var i = 1; i < poly.length; i++) {
            var p = toCanvas(plane, poly[i]);
            ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        drawInfiniteLine(ctx, plane, { x: 0, y: 0 }, dir, '#fbbf24', 2.8, false);

        var leftArrowFrom = toCanvas(plane, { x: -dir.x * 7, y: -dir.y * 7 });
        var leftArrowTo = toCanvas(plane, { x: -dir.x * 8.8, y: -dir.y * 8.8 });
        var rightArrowFrom = toCanvas(plane, { x: dir.x * 7, y: dir.y * 7 });
        var rightArrowTo = toCanvas(plane, { x: dir.x * 8.8, y: dir.y * 8.8 });
        drawArrow(ctx, leftArrowFrom, leftArrowTo, '#fbbf24', 2.2);
        drawArrow(ctx, rightArrowFrom, rightArrowTo, '#fbbf24', 2.2);

        var signed = pointP.x * normal.x + pointP.y * normal.y;
        var foot = {
            x: pointP.x - signed * normal.x,
            y: pointP.y - signed * normal.y
        };

        var pPx = toCanvas(plane, pointP);
        var footPx = toCanvas(plane, foot);

        ctx.save();
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = 'rgba(226,232,240,0.6)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(pPx.x, pPx.y);
        ctx.lineTo(footPx.x, footPx.y);
        ctx.stroke();
        ctx.restore();

        drawPoint(ctx, plane, pointP, '#34d399', 'P', 6.5);
        drawPoint(ctx, plane, { x: 0, y: 0 }, '#818cf8', 'O', 5.5);

        ctx.fillStyle = 'rgba(226,232,240,0.88)';
        ctx.font = '700 12px Inter';
        ctx.textAlign = 'left';
        ctx.fillText('l', toCanvas(plane, { x: dir.x * 5.8, y: dir.y * 5.8 }).x + 4, toCanvas(plane, { x: dir.x * 5.8, y: dir.y * 5.8 }).y - 6);
        ctx.fillText('H+', toCanvas(plane, { x: normal.x * 3.3, y: normal.y * 3.3 }).x + 4, toCanvas(plane, { x: normal.x * 3.3, y: normal.y * 3.3 }).y);
        ctx.fillText('H-', toCanvas(plane, { x: -normal.x * 3.3, y: -normal.y * 3.3 }).x + 4, toCanvas(plane, { x: -normal.x * 3.3, y: -normal.y * 3.3 }).y);

        var sideLabel;
        if (Math.abs(signed) < 0.08) {
            sideLabel = 'P leží na přímce l (d = 0)';
        } else if (signed > 0) {
            sideLabel = 'P je v kladné polorovině H+ (d = ' + Math.abs(signed).toFixed(2) + ')';
        } else {
            sideLabel = 'P je v záporné polorovině H- (d = ' + Math.abs(signed).toFixed(2) + ')';
        }
        pointSideStatus.textContent = sideLabel;
    }

    function drawRightPanel(ctx, rect, alphaDeg, showAxis) {
        var plane = createPlane(rect.x + 8, rect.y + 8, rect.w - 16, rect.h - 16, -1.5, 8.2, -1.2, 7.2);
        drawPlaneGrid(ctx, plane);

        var alpha = alphaDeg * Math.PI / 180;
        var O = { x: 0, y: 0 };
        var rayLen = 6;
        var A = { x: rayLen, y: 0 };
        var B = { x: rayLen * Math.cos(alpha), y: rayLen * Math.sin(alpha) };

        var Opx = toCanvas(plane, O);
        var Apx = toCanvas(plane, A);
        var Bpx = toCanvas(plane, B);

        ctx.fillStyle = 'rgba(251,146,60,0.18)';
        ctx.beginPath();
        ctx.moveTo(Opx.x, Opx.y);
        var steps = 40;
        for (var i = 0; i <= steps; i++) {
            var t = alpha * (i / steps);
            var pt = toCanvas(plane, { x: rayLen * Math.cos(t), y: rayLen * Math.sin(t) });
            ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();
        ctx.fill();

        drawArrow(ctx, Opx, Apx, '#f87171', 2.8);
        drawArrow(ctx, Opx, Bpx, '#60a5fa', 2.8);

        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (var j = 0; j <= steps; j++) {
            var angle = alpha * (j / steps);
            var arcPoint = toCanvas(plane, { x: 1.35 * Math.cos(angle), y: 1.35 * Math.sin(angle) });
            if (j === 0) ctx.moveTo(arcPoint.x, arcPoint.y);
            else ctx.lineTo(arcPoint.x, arcPoint.y);
        }
        ctx.stroke();

        ctx.fillStyle = '#fbbf24';
        ctx.font = '700 13px Inter';
        ctx.textAlign = 'left';
        var mid = alpha / 2;
        var midPos = toCanvas(plane, { x: 1.9 * Math.cos(mid), y: 1.9 * Math.sin(mid) });
        ctx.fillText('α', midPos.x + 4, midPos.y - 2);

        if (showAxis) {
            var bisector = alpha / 2;
            var bisectorEnd = toCanvas(plane, { x: rayLen * 0.95 * Math.cos(bisector), y: rayLen * 0.95 * Math.sin(bisector) });
            ctx.save();
            ctx.setLineDash([6, 4]);
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 2.1;
            ctx.beginPath();
            ctx.moveTo(Opx.x, Opx.y);
            ctx.lineTo(bisectorEnd.x, bisectorEnd.y);
            ctx.stroke();
            ctx.restore();

            ctx.fillStyle = '#34d399';
            ctx.font = '600 12px Inter';
            ctx.fillText('osa', bisectorEnd.x + 5, bisectorEnd.y - 6);
        }

        drawPoint(ctx, plane, O, '#818cf8', 'O', 5.5);

        angleValue.textContent = 'α = ' + alphaDeg.toFixed(0) + '°';
        if (showAxis) {
            bisectorValue.textContent = 'směr ' + (alphaDeg / 2).toFixed(1) + '°';
        } else {
            bisectorValue.textContent = 'skrytá';
        }
    }

    function draw() {
        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);

        var padding = 12;
        var gap = 12;
        var panelWidth = (w - padding * 2 - gap) / 2;
        var panelHeight = h - padding * 2;

        var leftRect = { x: padding, y: padding, w: panelWidth, h: panelHeight };
        var rightRect = { x: padding + panelWidth + gap, y: padding, w: panelWidth, h: panelHeight };

        roundedRect(ctx, leftRect.x, leftRect.y, leftRect.w, leftRect.h, 12);
        ctx.fillStyle = 'rgba(15,23,42,0.42)';
        ctx.fill();
        roundedRect(ctx, rightRect.x, rightRect.y, rightRect.w, rightRect.h, 12);
        ctx.fill();

        var tilt = parseFloat(lineTiltSlider.value);
        var px = parseFloat(pointXSlider.value);
        var py = parseFloat(pointYSlider.value);
        var alphaDeg = parseFloat(angleSlider.value);
        var showAxis = showBisector.checked;

        drawLeftPanel(ctx, leftRect, tilt, { x: px, y: py });
        drawRightPanel(ctx, rightRect, alphaDeg, showAxis);

        ctx.fillStyle = 'rgba(226,232,240,0.85)';
        ctx.font = '700 12px Inter';
        ctx.textAlign = 'left';
        ctx.fillText('Polorovina', leftRect.x + 14, leftRect.y + 18);
        ctx.fillText('Úhel a osa úhlu', rightRect.x + 14, rightRect.y + 18);

        lineTiltValue.textContent = tilt.toFixed(0) + '°';
        pointXValue.textContent = px.toFixed(1);
        pointYValue.textContent = py.toFixed(1);
        angleValueInline.textContent = alphaDeg.toFixed(0) + '°';
    }

    [lineTiltSlider, pointXSlider, pointYSlider, angleSlider].forEach(function (input) {
        input.addEventListener('input', draw);
    });
    showBisector.addEventListener('change', draw);

    redrawBySection[sectionId] = draw;
    draw();
}

function initLinesDemo(redrawBySection) {
    var sectionId = 'dve-primky-odchylka-a-vzdalenost';
    var canvas = document.getElementById('linesDistanceCanvas');
    if (!canvas) return;

    var forceParallel = document.getElementById('forceParallel');
    var lineAngleSlider = document.getElementById('lineAngleSlider');
    var lineOffsetSlider = document.getElementById('lineOffsetSlider');
    var lineAngleInline = document.getElementById('lineAngleInline');
    var lineOffsetInline = document.getElementById('lineOffsetInline');
    var lineRelation = document.getElementById('lineRelation');
    var lineAngle = document.getElementById('lineAngle');
    var lineDistance = document.getElementById('lineDistance');
    var resetLines = document.getElementById('resetLines');

    function draw() {
        var setup = setupHiDPI(canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        drawBackdrop(ctx, w, h);

        var plane = createPlane(14, 14, w - 28, h - 28, -10, 10, -6, 6);
        drawPlaneGrid(ctx, plane);

        var offset = parseFloat(lineOffsetSlider.value);
        var angleDeg = parseFloat(lineAngleSlider.value);
        var isParallel = forceParallel.checked;

        var line1Point = { x: 0, y: 0 };
        var line1Dir = { x: 1, y: 0 };

        var line2Point = { x: 0, y: offset };
        var line2Dir;
        if (isParallel) {
            line2Dir = { x: 1, y: 0 };
        } else {
            var rad = angleDeg * Math.PI / 180;
            line2Dir = { x: Math.cos(rad), y: Math.sin(rad) };
        }

        drawInfiniteLine(ctx, plane, line1Point, line1Dir, '#60a5fa', 2.9, false);
        drawInfiniteLine(ctx, plane, line2Point, line2Dir, '#f87171', 2.9, false);

        var relationText;
        var angleText;
        var distanceText;

        if (isParallel) {
            relationText = 'rovnoběžné';
            angleText = 'ω = 0°';
            distanceText = 'd = ' + Math.abs(offset).toFixed(2);

            var xSample = -7;
            var p1 = toCanvas(plane, { x: xSample, y: 0 });
            var p2 = toCanvas(plane, { x: xSample, y: offset });

            ctx.save();
            ctx.setLineDash([6, 4]);
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.restore();

            ctx.fillStyle = '#34d399';
            ctx.font = '600 12px Inter';
            ctx.fillText('d', p1.x + 6, (p1.y + p2.y) / 2 - 4);
        } else {
            relationText = (angleDeg === 90) ? 'kolmé (různoběžné)' : 'různoběžné';
            angleText = 'ω = ' + angleDeg.toFixed(0) + '°';
            distanceText = 'd = 0';

            var t = -offset / line2Dir.y;
            var intersection = {
                x: line2Point.x + line2Dir.x * t,
                y: 0
            };

            if (intersection.x > plane.xMin - 2 && intersection.x < plane.xMax + 2) {
                drawPoint(ctx, plane, intersection, '#34d399', 'I', 6);
            }

            var radius = 1.6;
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2;
            ctx.beginPath();
            var arcSteps = 26;
            for (var i = 0; i <= arcSteps; i++) {
                var a = (angleDeg * Math.PI / 180) * (i / arcSteps);
                var pt = toCanvas(plane, { x: radius * Math.cos(a), y: radius * Math.sin(a) });
                if (i === 0) ctx.moveTo(pt.x, pt.y);
                else ctx.lineTo(pt.x, pt.y);
            }
            ctx.stroke();

            var labelPos = toCanvas(plane, { x: 2.1 * Math.cos((angleDeg * Math.PI / 360)), y: 2.1 * Math.sin((angleDeg * Math.PI / 360)) });
            ctx.fillStyle = '#fbbf24';
            ctx.font = '700 12px Inter';
            ctx.fillText('ω', labelPos.x + 3, labelPos.y - 2);
            drawPoint(ctx, plane, { x: 0, y: 0 }, '#818cf8', null, 4.5);
        }

        var l1LabelPos = toCanvas(plane, { x: 8.4, y: 0.35 });
        var l2LabelPos = isParallel
            ? toCanvas(plane, { x: 8.4, y: offset + 0.35 })
            : toCanvas(plane, { x: 6.4, y: 6.4 * line2Dir.y + offset });
        ctx.fillStyle = '#dbeafe';
        ctx.font = '600 12px Inter';
        ctx.fillText('l1', l1LabelPos.x, l1LabelPos.y);
        ctx.fillText('l2', l2LabelPos.x, l2LabelPos.y);

        lineRelation.textContent = relationText;
        lineAngle.textContent = angleText;
        lineDistance.textContent = distanceText;

        lineAngleInline.textContent = angleDeg.toFixed(0) + '°';
        lineOffsetInline.textContent = offset.toFixed(1);
        lineAngleSlider.disabled = isParallel;
    }

    [lineAngleSlider, lineOffsetSlider].forEach(function (input) {
        input.addEventListener('input', draw);
    });
    forceParallel.addEventListener('change', draw);

    resetLines.addEventListener('click', function () {
        forceParallel.checked = false;
        lineAngleSlider.value = '35';
        lineOffsetSlider.value = '2';
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
            var exerciseNum = button.getAttribute('data-exercise');
            var correctAnswer = button.getAttribute('data-correct');
            var selectedOption = document.querySelector('input[name="ex' + exerciseNum + '"]:checked');

            if (!selectedOption) {
                alert('Vyberte prosím jednu odpověď.');
                return;
            }

            var feedback = document.getElementById('ex' + exerciseNum + 'Feedback');
            var status = document.getElementById('ex' + exerciseNum + 'Status');
            var options = document.querySelectorAll('input[name="ex' + exerciseNum + '"]');
            var isCorrect = selectedOption.value === correctAnswer;

            options.forEach(function (opt) {
                opt.disabled = true;
                opt.parentElement.classList.remove('correct', 'incorrect');
            });
            button.disabled = true;

            selectedOption.parentElement.classList.add(isCorrect ? 'correct' : 'incorrect');

            if (!isCorrect) {
                options.forEach(function (opt) {
                    if (opt.value === correctAnswer) {
                        opt.parentElement.classList.add('correct');
                    }
                });
            }

            status.textContent = isCorrect ? '✓ Správně' : '✗ Chyba';
            status.className = 'exercise-status ' + (isCorrect ? 'correct' : 'incorrect');

            feedback.textContent = isCorrect
                ? 'Správně. Tento pojem máte dobře zvládnutý.'
                : 'Nesprávně. Správná možnost je zvýrazněna zeleně.';
            feedback.className = 'exercise-feedback show ' + (isCorrect ? 'correct' : 'incorrect');

            checkAllExercisesComplete();
        });
    });

    function checkAllExercisesComplete() {
        var allDone = Array.from(document.querySelectorAll('.btn-check')).every(function (button) {
            return button.disabled;
        });

        var completeBlock = document.getElementById('lessonComplete');
        if (completeBlock) {
            completeBlock.style.display = allDone ? 'block' : 'none';
        }
    }
}
