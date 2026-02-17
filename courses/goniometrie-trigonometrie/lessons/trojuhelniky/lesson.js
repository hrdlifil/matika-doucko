/* Lesson 7: Trojúhelníky */
document.addEventListener('DOMContentLoaded', function () {

    /* ======= UTILITIES ======= */
    function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: (evt.clientX - rect.left) * (canvas.width / rect.width),
            y: (evt.clientY - rect.top) * (canvas.height / rect.height)
        };
    }

    function dist(p1, p2) {
        return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    }

    function midpoint(p1, p2) {
        return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    }

    // Line from p1 to p2
    function lineEq(p1, p2) {
        var A = p2.y - p1.y;
        var B = p1.x - p2.x;
        var C = -A * p1.x - B * p1.y;
        return { A: A, B: B, C: C };
    }

    // Intersection of two lines
    function intersect(l1, l2) {
        var det = l1.A * l2.B - l2.A * l1.B;
        if (Math.abs(det) < 1e-6) return null; // Parallel
        return {
            x: (l1.B * l2.C - l2.B * l1.C) / det,
            y: (l1.C * l2.A - l2.C * l1.A) / det
        };
    }

    // Perpendicular line to segment p1-p2 passing through p3
    function perpendicularLine(p1, p2, p3) {
        var A = p2.x - p1.x;
        var B = p2.y - p1.y;
        var C = -A * p3.x - B * p3.y;
        return { A: A, B: B, C: C };
    }

    /* ======= GEOMETRY ENGINE ======= */
    var App = {
        canvases: {},
        scenes: {},
        activePoint: null,
        isDragging: false
    };

    function setupCanvas(id, drawCallback, interactCallback) {
        var canvas = document.getElementById(id);
        if (!canvas) return;

        var ctx = canvas.getContext('2d');
        var scene = {
            canvas: canvas,
            ctx: ctx,
            points: [],
            draw: drawCallback,
            interact: interactCallback,
            animId: null
        };

        App.canvases[id] = scene;

        // Mouse Events
        canvas.addEventListener('mousedown', function (e) { handleStart(scene, e); });
        canvas.addEventListener('mousemove', function (e) { handleMove(scene, e); });
        canvas.addEventListener('mouseup', function (e) { handleEnd(scene, e); });
        canvas.addEventListener('mouseleave', function (e) { handleEnd(scene, e); });

        // Touch Events
        canvas.addEventListener('touchstart', function (e) { handleStart(scene, e.touches[0]); e.preventDefault(); }, { passive: false });
        canvas.addEventListener('touchmove', function (e) { handleMove(scene, e.touches[0]); e.preventDefault(); }, { passive: false });
        canvas.addEventListener('touchend', function (e) { handleEnd(scene, e.changedTouches[0]); });

        return scene;
    }

    function handleStart(scene, evt) {
        var pos = getMousePos(scene.canvas, evt);
        App.activePoint = null;

        // Find hit point (reverse order to hit top-most)
        for (var i = scene.points.length - 1; i >= 0; i--) {
            var p = scene.points[i];
            if (dist(pos, p) < 20 && !p.fixed) {
                App.activePoint = p;
                App.isDragging = true;
                scene.canvas.style.cursor = 'grabbing';
                break;
            }
        }
    }

    function handleMove(scene, evt) {
        var pos = getMousePos(scene.canvas, evt);

        if (App.isDragging && App.activePoint) {
            // Constraints
            App.activePoint.x = Math.max(10, Math.min(scene.canvas.width - 10, pos.x));
            App.activePoint.y = Math.max(10, Math.min(scene.canvas.height - 10, pos.y));
            requestAnimationFrame(scene.draw);
        } else {
            // Hover effect
            var hit = false;
            for (var i = scene.points.length - 1; i >= 0; i--) {
                if (dist(pos, scene.points[i]) < 20 && !scene.points[i].fixed) {
                    hit = true; break;
                }
            }
            scene.canvas.style.cursor = hit ? 'grab' : 'default';
        }
    }

    function handleEnd(scene, evt) {
        App.isDragging = false;
        App.activePoint = null;
        scene.canvas.style.cursor = 'default';
    }

    /* ======= SCENE 1: PROPERTIES (Altitudes, Medians) ======= */
    var propScene = setupCanvas('trianglePropertiesCanvas', drawProperties);
    if (propScene) {
        propScene.points = [
            { x: 400, y: 100, label: 'C', color: '#60a5fa' },
            { x: 150, y: 400, label: 'A', color: '#60a5fa' },
            { x: 650, y: 400, label: 'B', color: '#60a5fa' }
        ];
        drawProperties();
    }

    function drawProperties() {
        if (!propScene) return;
        var ctx = propScene.ctx, w = propScene.canvas.width, h = propScene.canvas.height;
        var pts = propScene.points;
        var C = pts[0], A = pts[1], B = pts[2];

        ctx.clearRect(0, 0, w, h);

        // Settings
        var showAltitudes = document.getElementById('checkAltitudes').checked;
        var showMedians = document.getElementById('checkMedians').checked;
        var showMidlines = document.getElementById('checkMidlines').checked;

        // Helpers
        var Ma = midpoint(B, C), Mb = midpoint(A, C), Mc = midpoint(A, B);

        // -- ALTITUDES (Výšky) --
        if (showAltitudes) {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)'; // Red
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);

            // Altitude from C to AB
            var lineAB = lineEq(A, B);
            var perpC = perpendicularLine(A, B, C);
            var footC = intersect(lineAB, perpC);
            if (footC) { ctx.beginPath(); ctx.moveTo(C.x, C.y); ctx.lineTo(footC.x, footC.y); ctx.stroke(); }

            // Altitude from A to BC
            var lineBC = lineEq(B, C);
            var perpA = perpendicularLine(B, C, A);
            var footA = intersect(lineBC, perpA);
            if (footA) { ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(footA.x, footA.y); ctx.stroke(); }

            // Altitude from B to AC
            var lineAC = lineEq(A, C);
            var perpB = perpendicularLine(A, C, B);
            var footB = intersect(lineAC, perpB);
            if (footB) { ctx.beginPath(); ctx.moveTo(B.x, B.y); ctx.lineTo(footB.x, footB.y); ctx.stroke(); }

            // Orthocenter
            var Ortho = intersect(perpA, perpC);
            if (Ortho) drawDot(ctx, Ortho.x, Ortho.y, '#ef4444', 6, 'V');
        }

        // -- MEDIANS (Těžnice) --
        if (showMedians) {
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)'; // Green
            ctx.lineWidth = 2;
            ctx.setLineDash([]);

            ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(Ma.x, Ma.y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(B.x, B.y); ctx.lineTo(Mb.x, Mb.y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(C.x, C.y); ctx.lineTo(Mc.x, Mc.y); ctx.stroke();

            // Centroid
            var Centroid = { x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3 };
            drawDot(ctx, Centroid.x, Centroid.y, '#10b981', 6, 'T');
        }

        // -- MIDLINES (Střední příčky) --
        if (showMidlines) {
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)'; // Orange
            ctx.lineWidth = 3;
            ctx.setLineDash([]);

            ctx.beginPath();
            ctx.moveTo(Ma.x, Ma.y); ctx.lineTo(Mb.x, Mb.y);
            ctx.lineTo(Mc.x, Mc.y); ctx.closePath();
            ctx.stroke();

            ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
            ctx.fill();
        }

        // -- MAIN TRIANGLE --
        ctx.strokeStyle = '#6366f1'; // Indigo
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);
        ctx.lineTo(C.x, C.y);
        ctx.closePath();
        ctx.stroke();

        ctx.globalAlpha = 0.05;
        ctx.fillStyle = '#6366f1';
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Draw points
        for (var i = 0; i < pts.length; i++) {
            drawDot(ctx, pts[i].x, pts[i].y, pts[i].color, 6, pts[i].label);
        }
    }

    // Wiring up checkboxes
    ['checkAltitudes', 'checkMedians', 'checkMidlines'].forEach(id => {
        var el = document.getElementById(id);
        if (el) el.addEventListener('change', drawProperties);
    });


    /* ======= SCENE 2: KRUŽNICE VEPSANÁ ======= */
    var inScene = setupCanvas('incircleCanvas', drawIncircle);
    var inStep = 1;
    window.setConstructionStep = function (type, step) {
        if (type === 'incircle') {
            inStep = step;
            // Update buttons
            var buts = document.querySelectorAll('#incircle .step-btn');
            buts.forEach((b, i) => b.classList.toggle('active', i + 1 === step));
            drawIncircle();
        } else if (type === 'circumcircle') {
            circumStep = step;
            var buts = document.querySelectorAll('#circumcircle .step-btn');
            buts.forEach((b, i) => b.classList.toggle('active', i + 1 === step));
            drawCircumcircle();
        }
    };

    if (inScene) {
        inScene.points = [
            { x: 400, y: 100, label: 'C', color: '#60a5fa' },
            { x: 200, y: 380, label: 'A', color: '#60a5fa' },
            { x: 600, y: 380, label: 'B', color: '#60a5fa' }
        ];
        drawIncircle();
    }

    function drawIncircle() {
        if (!inScene) return;
        var ctx = inScene.ctx, w = inScene.canvas.width, h = inScene.canvas.height;
        var pts = inScene.points;
        var C = pts[0], A = pts[1], B = pts[2];

        ctx.clearRect(0, 0, w, h);

        // Calculations
        var a = dist(B, C), b = dist(A, C), c = dist(A, B);
        // Incenter formula: (aA + bB + cC) / (a+b+c)
        var P = a + b + c;
        var I = {
            x: (a * A.x + b * B.x + c * C.x) / P,
            y: (a * A.y + b * B.y + c * C.y) / P
        };
        // Radius using Heron's formula
        var s = P / 2;
        var Area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
        var r = Area / s;

        // Step 1: Angle Bisectors (Osy úhlů)
        if (inStep >= 1) {
            ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)'; // Pink
            ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
            ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(I.x, I.y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(B.x, B.y); ctx.lineTo(I.x, I.y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(C.x, C.y); ctx.lineTo(I.x, I.y); ctx.stroke();
        }

        // Step 2: Center (Střed)
        if (inStep >= 2) {
            drawDot(ctx, I.x, I.y, '#db2777', 5, 'S');
        }

        // Step 3: Radius (Poloměr)
        if (inStep >= 3) {
            // Draw perpendicular from I to AB
            var lineAB = lineEq(A, B);
            var perp = perpendicularLine(A, B, I);
            var foot = intersect(lineAB, perp);
            if (foot) {
                ctx.strokeStyle = '#db2777'; ctx.lineWidth = 2; ctx.setLineDash([]);
                ctx.beginPath(); ctx.moveTo(I.x, I.y); ctx.lineTo(foot.x, foot.y); ctx.stroke();
                ctx.fillStyle = '#db2777';
                ctx.font = '12px Inter'; ctx.fillText('ρ', (I.x + foot.x) / 2 + 10, (I.y + foot.y) / 2);
            }
        }

        // Step 4: Circle (Kružnice)
        if (inStep >= 4) {
            ctx.beginPath();
            ctx.arc(I.x, I.y, r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(236, 72, 153, 0.1)';
            ctx.fill();
            ctx.strokeStyle = '#db2777';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Triangle
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 3; ctx.setLineDash([]);
        if (document.body.classList.contains('dark-theme')) ctx.strokeStyle = '#e2e8f0';
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.lineTo(C.x, C.y); ctx.closePath(); ctx.stroke();

        pts.forEach(p => drawDot(ctx, p.x, p.y, p.color, 6, p.label));
    }


    /* ======= SCENE 3: KRUŽNICE OPSANÁ ======= */
    var circumScene = setupCanvas('circumcircleCanvas', drawCircumcircle);
    var circumStep = 1;

    if (circumScene) {
        circumScene.points = [
            { x: 300, y: 100, label: 'C', color: '#60a5fa' },
            { x: 150, y: 350, label: 'A', color: '#60a5fa' },
            { x: 650, y: 350, label: 'B', color: '#60a5fa' }
        ];
        drawCircumcircle();
    }

    function perpendicularBisector(p1, p2) {
        var mid = midpoint(p1, p2);
        return perpendicularLine(p1, p2, mid);
    }

    function drawCircumcircle() {
        if (!circumScene) return;
        var ctx = circumScene.ctx, w = circumScene.canvas.width, h = circumScene.canvas.height;
        var pts = circumScene.points;
        var C = pts[0], A = pts[1], B = pts[2];
        ctx.clearRect(0, 0, w, h);

        // Bisectors
        var pbAB = perpendicularBisector(A, B);
        var pbBC = perpendicularBisector(B, C);
        var O = intersect(pbAB, pbBC); // Circumcenter
        var R = O ? dist(O, A) : 0;

        // Step 1: Perpendicular Bisectors (Osy stran)
        if (circumStep >= 1 && O) {
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)'; // Blue
            ctx.lineWidth = 1; ctx.setLineDash([5, 5]);

            // Draw lines long enough to cross
            // Simplified drawing: from midpoints to O
            var ma = midpoint(B, C), mb = midpoint(A, C), mc = midpoint(A, B);

            // Extend function
            function drawExtendedLine(p1, p2) {
                var dx = p2.x - p1.x, dy = p2.y - p1.y;
                ctx.beginPath(); ctx.moveTo(p1.x - dx, p1.y - dy);
                ctx.lineTo(p2.x + dx, p2.y + dy); ctx.stroke();
            }

            ctx.beginPath(); ctx.moveTo(mc.x, mc.y); ctx.lineTo(O.x, O.y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(ma.x, ma.y); ctx.lineTo(O.x, O.y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(mb.x, mb.y); ctx.lineTo(O.x, O.y); ctx.stroke();
        }

        // Step 2: Center (Střed)
        if (circumStep >= 2 && O) {
            drawDot(ctx, O.x, O.y, '#2563eb', 5, 'O');
        }

        // Step 3: Circle (Kružnice)
        if (circumStep >= 3 && O) {
            ctx.beginPath();
            ctx.arc(O.x, O.y, R, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
            ctx.fill();
            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 2; ctx.setLineDash([]);
            ctx.stroke();
        }

        // Triangle
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 3; ctx.setLineDash([]);
        if (document.body.classList.contains('dark-theme')) ctx.strokeStyle = '#e2e8f0';
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.lineTo(C.x, C.y); ctx.closePath(); ctx.stroke();

        pts.forEach(p => drawDot(ctx, p.x, p.y, p.color, 6, p.label));
    }


    /* ======= SCENE 5: SIMILARITY (Podobnost) ======= */
    var simScene = setupCanvas('similarityCanvas', drawSimilarity);
    var scaleK = 1.5;

    document.getElementById('scaleSlider').addEventListener('input', function (e) {
        scaleK = parseFloat(e.target.value);
        document.getElementById('scaleValue').innerText = scaleK.toFixed(1) + 'x';
        drawSimilarity();
    });

    if (simScene) {
        // Base triangle (fixed)
        simScene.points = [
            { x: 200, y: 150, label: 'C', color: '#94a3b8', fixed: true },
            { x: 100, y: 350, label: 'A', color: '#94a3b8', fixed: true },
            { x: 300, y: 350, label: 'B', color: '#94a3b8', fixed: true }
        ];
        drawSimilarity();
    }

    function drawSimilarity() {
        if (!simScene) return;
        var ctx = simScene.ctx, w = simScene.canvas.width, h = simScene.canvas.height;
        var pts = simScene.points;
        var C = pts[0], A = pts[1], B = pts[2];

        ctx.clearRect(0, 0, w, h);

        // Draw Base Triangle (Ghost)
        ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.lineTo(C.x, C.y); ctx.closePath(); ctx.stroke();

        // Calculate Scaled Triangle
        // Center of scaling is A for simplicity
        function scalePt(p, origin, k) {
            return {
                x: origin.x + (p.x - origin.x) * k,
                y: origin.y + (p.y - origin.y) * k
            };
        }

        var A2 = A; // Fixed point
        var B2 = scalePt(B, A, scaleK);
        var C2 = scalePt(C, A, scaleK);

        // Draw Scaled Triangle
        ctx.strokeStyle = '#8b5cf6'; // Purple
        ctx.lineWidth = 3; ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(A2.x, A2.y); ctx.lineTo(B2.x, B2.y); ctx.lineTo(C2.x, C2.y); ctx.closePath();
        ctx.fillStyle = 'rgba(139, 92, 246, 0.1)'; ctx.fill();
        ctx.stroke();

        // Labels
        ctx.fillStyle = '#64748b'; ctx.font = '14px Inter';
        ctx.fillText('A', A.x - 20, A.y + 10);
        ctx.fillText('B', B.x + 10, B.y + 10);
        ctx.fillText('C', C.x, C.y - 15);

        ctx.fillStyle = '#8b5cf6'; ctx.font = 'bold 16px Inter';
        ctx.fillText("A'", A2.x - 25, A2.y + 25);
        ctx.fillText("B'", B2.x + 10, B2.y + 10);
        ctx.fillText("C'", C2.x, C2.y - 15);
    }


    /* ======= HELPERS ======= */
    function drawDot(ctx, x, y, color, r, label) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (label) {
            ctx.fillStyle = document.body.classList.contains('dark-theme') ? '#e2e8f0' : '#1e293b';
            ctx.font = 'bold 14px Inter';
            ctx.fillText(label, x + 12, y - 12);
        }
    }

    /* ======= INITIALIZATION ======= */
    // Sidebar Navigation logic
    var sections = document.querySelectorAll('.lesson-section');
    var sidebarLinks = document.querySelectorAll('.sidebar-link');

    function activateSection(id) {
        sections.forEach(s => {
            if (s.id === id) {
                s.classList.add('active');
                s.style.display = 'block';
                // Trigger redraws if needed
                if (id === 'properties') drawProperties();
                if (id === 'incircle') drawIncircle();
                if (id === 'circumcircle') drawCircumcircle();
                if (id === 'similarity') drawSimilarity();
            } else {
                s.classList.remove('active');
                s.style.display = 'none';
            }
        });
        sidebarLinks.forEach(l => {
            if (l.dataset.section === id) l.classList.add('active');
            else l.classList.remove('active');
        });
    }

    // Hash navigation
    window.addEventListener('hashchange', () => {
        var hash = location.hash.slice(1);
        if (hash) { activateSection(hash); }
    });

    // Initial load
    if (location.hash) {
        activateSection(location.hash.slice(1));
    } else {
        activateSection('properties');
    }

    // Click handlers for sidebar
    sidebarLinks.forEach(l => {
        l.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent jump
            var id = l.dataset.section;
            location.hash = id;
            activateSection(id);
            document.querySelector('.lesson-content').scrollTop = 0;
        });
    });

    /* ======= EXERCISES ======= */
    window.checkExercise = function (id, correct) {
        var inputs = document.getElementsByName(id);
        var selected = null;
        for (var i = 0; i < inputs.length; i++) {
            if (inputs[i].checked) selected = inputs[i].value;
        }

        var feedback = document.getElementById(id + 'Feedback');
        var status = document.getElementById(id + 'Status');

        if (!selected) {
            feedback.innerHTML = '<span style="color:red">Vyberte odpověď.</span>';
            return;
        }

        if (selected === correct) {
            feedback.innerHTML = '<div class="feedback-box success"> Správně! Výborná práce.</div>';
            status.innerHTML = '✅';
        } else {
            feedback.innerHTML = '<div class="feedback-box" style="color:var(--error)"> Zkuste to znovu.</div>';
            status.innerHTML = '❌';
        }
        feedback.querySelector('.feedback-box').classList.remove('hidden');
    }

});
