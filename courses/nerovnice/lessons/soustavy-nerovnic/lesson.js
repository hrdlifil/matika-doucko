// Soustavy nerovnic - interactive lesson

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initNavbarScroll();
    initOneVariablePlayground();
    initTwoVariablePlayground();
    initMiniChecks();
    initExercises();
});

const EPS = 1e-9;
const VIEW_EXTENT = 10;
const CHECK_EXTENT = 220;

function typeset(target) {
    if (!window.MathJax || typeof window.MathJax.typesetPromise !== 'function') return;
    const nodes = target ? [target] : undefined;
    window.MathJax.typesetPromise(nodes).catch(() => {});
}

function initNavigation() {
    const order = ['soustavy-nerovnic-jedne-promenne', 'soustavy-nerovnic-vice-promennych', 'procvicovani'];
    const sections = document.querySelectorAll('.lesson-section');
    const links = document.querySelectorAll('.sidebar-link');

    function updateProgress(sectionId) {
        const index = order.indexOf(sectionId);
        const progress = index >= 0 ? ((index + 1) / order.length) * 100 : 0;
        const bar = document.querySelector('.progress-fill-small');
        if (bar) bar.style.width = `${progress}%`;
    }

    function showSection(sectionId, smooth = true) {
        const target = document.getElementById(sectionId);
        if (!target) return;

        sections.forEach(section => section.classList.remove('active'));
        links.forEach(link => link.classList.remove('active'));
        target.classList.add('active');

        const activeLink = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeLink) activeLink.classList.add('active');

        updateProgress(sectionId);
        window.history.replaceState(null, '', `#${sectionId}`);
        if (smooth) window.scrollTo({ top: 0, behavior: 'smooth' });
        typeset(target);
    }

    links.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            showSection(link.dataset.section);
        });
    });

    document.querySelectorAll('.btn-next').forEach(button => {
        button.addEventListener('click', () => showSection(button.dataset.next));
    });
    document.querySelectorAll('.btn-prev').forEach(button => {
        button.addEventListener('click', () => showSection(button.dataset.prev));
    });

    const initialHash = window.location.hash.replace('#', '');
    showSection(order.includes(initialHash) ? initialHash : order[0], false);
}

function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        navbar.style.background = window.scrollY > 50 ? 'rgba(10, 10, 15, 0.95)' : 'rgba(10, 10, 15, 0.8)';
    });
}

function approxEqual(a, b) {
    return Math.abs(a - b) < EPS;
}

function n(value) {
    return Math.abs(value) < EPS ? 0 : value;
}

function fmt(value) {
    if (!Number.isFinite(value)) return value < 0 ? '-\\infty' : '\\infty';
    const cleaned = n(value);
    const rounded = Math.round(cleaned * 100) / 100;
    if (Math.abs(rounded - Math.round(rounded)) < EPS) return String(Math.round(rounded));
    return rounded.toFixed(2).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
}

function opTex(op) {
    if (op === 'lt') return '<';
    if (op === 'le') return '\\le';
    if (op === 'gt') return '>';
    return '\\ge';
}

function flipOp(op) {
    if (op === 'lt') return 'gt';
    if (op === 'le') return 'ge';
    if (op === 'gt') return 'lt';
    return 'le';
}

function compareValues(left, op, right) {
    if (op === 'lt') return left < right - EPS;
    if (op === 'le') return left <= right + EPS;
    if (op === 'gt') return left > right + EPS;
    return left >= right - EPS;
}

function buildLinearExpr(parts) {
    const terms = [];

    function pushTerm(coef, body) {
        if (Math.abs(coef) < EPS) return;
        const absCoef = Math.abs(coef);
        const coefText = body ? (approxEqual(absCoef, 1) ? '' : fmt(absCoef)) : fmt(absCoef);
        const raw = `${coefText}${body}`;
        if (terms.length === 0) {
            terms.push(coef < 0 ? `-${raw}` : raw);
        } else {
            terms.push(coef < 0 ? `-${raw}` : `+${raw}`);
        }
    }

    parts.forEach(part => pushTerm(part.coef, part.body));
    return terms.length === 0 ? '0' : terms.join('');
}

function linearExprLatex(a, b, variable = 'x') {
    return buildLinearExpr([{ coef: a, body: variable }, { coef: b, body: '' }]);
}

function linearExprXYLatex(a, b) {
    return buildLinearExpr([{ coef: a, body: 'x' }, { coef: b, body: 'y' }]);
}

function allReals() {
    return [{ l: -Infinity, r: Infinity, lc: false, rc: false }];
}

function intervalFromCondition(op, value) {
    if (op === 'lt') return [{ l: -Infinity, r: value, lc: false, rc: false }];
    if (op === 'le') return [{ l: -Infinity, r: value, lc: false, rc: true }];
    if (op === 'gt') return [{ l: value, r: Infinity, lc: false, rc: false }];
    return [{ l: value, r: Infinity, lc: true, rc: false }];
}

function cloneInterval(interval) {
    return { l: interval.l, r: interval.r, lc: interval.lc, rc: interval.rc };
}

function normalizeIntervals(intervals) {
    if (!intervals || intervals.length === 0) return [];

    const sorted = intervals.map(cloneInterval).sort((a, b) => {
        if (a.l === b.l) {
            if (a.lc === b.lc) return 0;
            return a.lc ? -1 : 1;
        }
        return a.l < b.l ? -1 : 1;
    });

    const merged = [sorted[0]];

    for (let i = 1; i < sorted.length; i += 1) {
        const current = sorted[i];
        const last = merged[merged.length - 1];

        const overlap = last.r === Infinity || current.l < last.r || (approxEqual(current.l, last.r) && (last.rc || current.lc));

        if (!overlap) {
            merged.push(current);
            continue;
        }

        const currentExtendsRight = current.r > last.r;
        const sameRight = approxEqual(current.r, last.r);

        if (currentExtendsRight) {
            last.r = current.r;
            last.rc = current.rc;
        } else if (sameRight) {
            last.rc = last.rc || current.rc;
        }
    }

    return merged;
}

function intersectIntervals(aSet, bSet) {
    const intersections = [];

    aSet.forEach(a => {
        bSet.forEach(b => {
            let l;
            let lc;
            if (a.l > b.l) {
                l = a.l;
                lc = a.lc;
            } else if (b.l > a.l) {
                l = b.l;
                lc = b.lc;
            } else {
                l = a.l;
                lc = a.lc && b.lc;
            }

            let r;
            let rc;
            if (a.r < b.r) {
                r = a.r;
                rc = a.rc;
            } else if (b.r < a.r) {
                r = b.r;
                rc = b.rc;
            } else {
                r = a.r;
                rc = a.rc && b.rc;
            }

            if (l < r || (approxEqual(l, r) && lc && rc)) {
                intersections.push({ l, r, lc, rc });
            }
        });
    });

    return normalizeIntervals(intersections);
}

function isAllReals(intervals) {
    return intervals.length === 1 && intervals[0].l === -Infinity && intervals[0].r === Infinity;
}

function intervalsToLatex(intervals) {
    if (!intervals || intervals.length === 0) return '\\emptyset';
    if (isAllReals(intervals)) return '\\mathbb{R}';

    const parts = intervals.map(interval => {
        if (approxEqual(interval.l, interval.r) && interval.lc && interval.rc) {
            return `\\{${fmt(interval.l)}\\}`;
        }

        const left = interval.l === -Infinity ? '-\\infty' : fmt(interval.l);
        const right = interval.r === Infinity ? '\\infty' : fmt(interval.r);
        const leftBracket = interval.lc ? '[' : '(';
        const rightBracket = interval.rc ? ']' : ')';
        return `${leftBracket}${left},${right}${rightBracket}`;
    });

    return parts.join('\\cup ');
}

function inInterval(value, interval) {
    const leftOk = interval.l === -Infinity || value > interval.l || (approxEqual(value, interval.l) && interval.lc);
    const rightOk = interval.r === Infinity || value < interval.r || (approxEqual(value, interval.r) && interval.rc);
    return leftOk && rightOk;
}

function sampleIntegers1D(intervals) {
    const values = [];
    for (let x = -12; x <= 12; x += 1) {
        if (intervals.some(interval => inInterval(x, interval))) values.push(x);
    }

    if (values.length === 0) return 'žádné celé číslo v intervalu [-12,12]';
    return `\\(${values.slice(0, 8).join(',\\;')}\\)`;
}
function solveLinearInequality(a, b, op, c) {
    const steps = [];
    const expr = linearExprLatex(a, b);

    if (Math.abs(a) < EPS) {
        const holds = compareValues(b, op, c);
        steps.push(`\\(${expr} ${opTex(op)} ${fmt(c)}\\)`);
        steps.push(holds
            ? 'Nerovnost je konstantně pravdivá pro všechna \\(x\\).'
            : 'Nerovnost je konstantně nepravdivá, řešení je prázdné.');

        return {
            mode: 'constant',
            intervals: holds ? allReals() : [],
            resultLatex: holds ? '\\mathbb{R}' : '\\emptyset',
            finalOp: op,
            boundary: null,
            steps
        };
    }

    const rhs = c - b;
    const finalOp = a < 0 ? flipOp(op) : op;
    const boundary = rhs / a;

    steps.push(`\\(${expr} ${opTex(op)} ${fmt(c)}\\)`);
    steps.push(`\\(${fmt(a)}x ${opTex(op)} ${fmt(rhs)}\\)`);
    if (a < 0) steps.push('Dělení záporným číslem obrací znaménko nerovnosti.');
    steps.push(`\\(x ${opTex(finalOp)} ${fmt(boundary)}\\)`);

    const intervals = intervalFromCondition(finalOp, boundary);

    return {
        mode: 'linear',
        intervals,
        resultLatex: `x ${opTex(finalOp)} ${fmt(boundary)}`,
        finalOp,
        boundary,
        steps
    };
}

function drawIntervalCanvas(canvas, rows) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const marginX = 62;
    const min = -12;
    const max = 12;
    const bg = '#08080d';

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const toX = value => marginX + ((value - min) / (max - min)) * (w - 2 * marginX);
    const rowYs = rows.length === 1
        ? [Math.round(h / 2)]
        : rows.map((_, index) => Math.round(46 + index * ((h - 92) / (rows.length - 1))));

    rows.forEach((row, index) => {
        const y = rowYs[index];

        ctx.fillStyle = 'rgba(255,255,255,0.78)';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText(row.label, 8, y - 12);

        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(marginX, y);
        ctx.lineTo(w - marginX, y);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.moveTo(w - marginX + 10, y); ctx.lineTo(w - marginX, y - 5); ctx.lineTo(w - marginX, y + 5); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(marginX - 10, y); ctx.lineTo(marginX, y - 5); ctx.lineTo(marginX, y + 5); ctx.fill();

        ctx.font = '11px Inter, sans-serif';
        for (let tick = min; tick <= max; tick += 1) {
            const x = toX(tick);
            ctx.strokeStyle = 'rgba(255,255,255,0.16)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, y - 5);
            ctx.lineTo(x, y + 5);
            ctx.stroke();
            if (tick % 2 === 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.64)';
                ctx.fillText(String(tick), x - 6, y + 18);
            }
        }

        if (!row.intervals || row.intervals.length === 0) {
            ctx.fillStyle = '#ef4444';
            ctx.fillText('∅', w / 2 - 4, y - 12);
            return;
        }

        row.intervals.forEach(interval => {
            const leftX = interval.l === -Infinity ? marginX : toX(interval.l);
            const rightX = interval.r === Infinity ? w - marginX : toX(interval.r);

            ctx.strokeStyle = row.color;
            ctx.lineWidth = 7;
            ctx.beginPath();
            ctx.moveTo(leftX, y);
            ctx.lineTo(rightX, y);
            ctx.stroke();

            if (interval.l === -Infinity) {
                ctx.beginPath();
                ctx.moveTo(leftX, y); ctx.lineTo(leftX + 10, y - 6); ctx.moveTo(leftX, y); ctx.lineTo(leftX + 10, y + 6);
                ctx.stroke();
            }
            if (interval.r === Infinity) {
                ctx.beginPath();
                ctx.moveTo(rightX, y); ctx.lineTo(rightX - 10, y - 6); ctx.moveTo(rightX, y); ctx.lineTo(rightX - 10, y + 6);
                ctx.stroke();
            }

            if (Number.isFinite(interval.l)) {
                ctx.beginPath();
                ctx.arc(leftX, y, 7, 0, Math.PI * 2);
                if (interval.lc) {
                    ctx.fillStyle = row.color;
                    ctx.fill();
                } else {
                    ctx.fillStyle = bg;
                    ctx.fill();
                    ctx.lineWidth = 2.4;
                    ctx.strokeStyle = row.color;
                    ctx.stroke();
                }
            }

            if (Number.isFinite(interval.r)) {
                ctx.beginPath();
                ctx.arc(rightX, y, 7, 0, Math.PI * 2);
                if (interval.rc) {
                    ctx.fillStyle = row.color;
                    ctx.fill();
                } else {
                    ctx.fillStyle = bg;
                    ctx.fill();
                    ctx.lineWidth = 2.4;
                    ctx.strokeStyle = row.color;
                    ctx.stroke();
                }
            }
        });
    });
}

function initOneVariablePlayground() {
    const controls = {
        op1: document.getElementById('oneOp1'),
        a1: document.getElementById('oneA1'),
        b1: document.getElementById('oneB1'),
        c1: document.getElementById('oneC1'),
        op2: document.getElementById('oneOp2'),
        a2: document.getElementById('oneA2'),
        b2: document.getElementById('oneB2'),
        c2: document.getElementById('oneC2')
    };

    const display = {
        a1: document.getElementById('oneA1Value'),
        b1: document.getElementById('oneB1Value'),
        c1: document.getElementById('oneC1Value'),
        a2: document.getElementById('oneA2Value'),
        b2: document.getElementById('oneB2Value'),
        c2: document.getElementById('oneC2Value'),
        system: document.getElementById('oneSystemLatex'),
        first: document.getElementById('oneFirstLatex'),
        second: document.getElementById('oneSecondLatex'),
        intersection: document.getElementById('oneIntersectionLatex'),
        sample: document.getElementById('oneSampleLatex'),
        interpretation: document.getElementById('oneInterpretation'),
        steps: document.getElementById('oneSteps'),
        canvas: document.getElementById('oneVarCanvas')
    };

    if (!controls.op1 || !display.canvas) return;

    function update() {
        const op1 = controls.op1.value;
        const a1 = Number(controls.a1.value);
        const b1 = Number(controls.b1.value);
        const c1 = Number(controls.c1.value);

        const op2 = controls.op2.value;
        const a2 = Number(controls.a2.value);
        const b2 = Number(controls.b2.value);
        const c2 = Number(controls.c2.value);

        display.a1.textContent = fmt(a1);
        display.b1.textContent = fmt(b1);
        display.c1.textContent = fmt(c1);
        display.a2.textContent = fmt(a2);
        display.b2.textContent = fmt(b2);
        display.c2.textContent = fmt(c2);

        const expr1 = `${linearExprLatex(a1, b1)} ${opTex(op1)} ${fmt(c1)}`;
        const expr2 = `${linearExprLatex(a2, b2)} ${opTex(op2)} ${fmt(c2)}`;

        const solved1 = solveLinearInequality(a1, b1, op1, c1);
        const solved2 = solveLinearInequality(a2, b2, op2, c2);
        const intersection = intersectIntervals(solved1.intervals, solved2.intervals);

        display.system.innerHTML = `\\(\\left\\{\\begin{aligned}${expr1}\\\\${expr2}\\end{aligned}\\right.\\)`;
        display.first.innerHTML = `\\(${intervalsToLatex(solved1.intervals)}\\)`;
        display.second.innerHTML = `\\(${intervalsToLatex(solved2.intervals)}\\)`;
        display.intersection.innerHTML = `\\(${intervalsToLatex(intersection)}\\)`;
        display.sample.innerHTML = sampleIntegers1D(intersection);

        if (intersection.length === 0) {
            display.interpretation.textContent = 'Podmínky jsou v konfliktu, soustava nemá řešení.';
        } else if (isAllReals(intersection)) {
            display.interpretation.textContent = 'Výsledek pokrývá všechna reálná čísla.';
        } else {
            display.interpretation.textContent = 'Výsledek je průnik obou intervalových řešení.';
        }

        const steps = [
            `<div class="step-item">1. Vyřeš 1. nerovnici: ${solved1.steps.join(' → ')}</div>`,
            `<div class="step-item">2. Vyřeš 2. nerovnici: ${solved2.steps.join(' → ')}</div>`,
            `<div class="step-item">3. Vezmi průnik: \\(${intervalsToLatex(solved1.intervals)}\\) \\cap \\(${intervalsToLatex(solved2.intervals)}\\) = \\(${intervalsToLatex(intersection)}\\).</div>`
        ];
        display.steps.innerHTML = steps.join('');

        drawIntervalCanvas(display.canvas, [
            { label: '1. nerovnice', intervals: solved1.intervals, color: '#3b82f6' },
            { label: '2. nerovnice', intervals: solved2.intervals, color: '#f59e0b' },
            { label: 'Průnik', intervals: intersection, color: '#8b5cf6' }
        ]);

        typeset(document.getElementById('soustavy-nerovnic-jedne-promenne'));
    }

    Object.values(controls).forEach(control => control.addEventListener('input', update));
    update();
}
function normalizeHalfplane(a, b, op, c) {
    if (Math.abs(a) < EPS && Math.abs(b) < EPS) {
        const holds = compareValues(0, op, c);
        return {
            a,
            b,
            c,
            op,
            A: 0,
            B: 0,
            C: 0,
            strict: op === 'lt' || op === 'gt',
            always: holds,
            never: !holds
        };
    }

    if (op === 'le' || op === 'lt') {
        return {
            a,
            b,
            c,
            op,
            A: a,
            B: b,
            C: -c,
            strict: op === 'lt',
            always: false,
            never: false
        };
    }

    return {
        a,
        b,
        c,
        op,
        A: -a,
        B: -b,
        C: c,
        strict: op === 'gt',
        always: false,
        never: false
    };
}

function halfplaneValue(hp, x, y) {
    return hp.A * x + hp.B * y + hp.C;
}

function pointInHalfplane(hp, x, y, strictAware = true) {
    if (hp.always) return true;
    if (hp.never) return false;

    const val = halfplaneValue(hp, x, y);
    if (strictAware && hp.strict) return val < -EPS;
    return val <= EPS;
}

function lineSegmentBoundaryIntersection(p1, p2, v1, v2) {
    const denom = v1 - v2;
    if (Math.abs(denom) < EPS) return { x: p1.x, y: p1.y };
    const t = Math.max(0, Math.min(1, v1 / denom));
    return {
        x: p1.x + t * (p2.x - p1.x),
        y: p1.y + t * (p2.y - p1.y)
    };
}

function sanitizePolygon(poly) {
    if (!poly || poly.length === 0) return [];

    const cleaned = [];
    poly.forEach(point => {
        const last = cleaned[cleaned.length - 1];
        if (!last || Math.hypot(last.x - point.x, last.y - point.y) > 1e-6) {
            cleaned.push({ x: point.x, y: point.y });
        }
    });

    if (cleaned.length > 1) {
        const first = cleaned[0];
        const last = cleaned[cleaned.length - 1];
        if (Math.hypot(first.x - last.x, first.y - last.y) < 1e-6) {
            cleaned.pop();
        }
    }

    return cleaned;
}

function clipPolygonWithHalfplane(polygon, hp, strictMargin = 0) {
    if (!polygon || polygon.length === 0) return [];
    if (hp.always) return polygon.map(point => ({ x: point.x, y: point.y }));
    if (hp.never) return [];

    const output = [];
    const threshold = hp.strict ? -Math.abs(strictMargin) : EPS;

    for (let i = 0; i < polygon.length; i += 1) {
        const current = polygon[i];
        const next = polygon[(i + 1) % polygon.length];
        const currentVal = halfplaneValue(hp, current.x, current.y);
        const nextVal = halfplaneValue(hp, next.x, next.y);
        const currentInside = currentVal <= threshold;
        const nextInside = nextVal <= threshold;

        if (currentInside && nextInside) {
            output.push(next);
        } else if (currentInside && !nextInside) {
            output.push(lineSegmentBoundaryIntersection(current, next, currentVal, nextVal));
        } else if (!currentInside && nextInside) {
            output.push(lineSegmentBoundaryIntersection(current, next, currentVal, nextVal));
            output.push(next);
        }
    }

    return sanitizePolygon(output);
}

function createBoxPolygon(extent) {
    return [
        { x: -extent, y: -extent },
        { x: extent, y: -extent },
        { x: extent, y: extent },
        { x: -extent, y: extent }
    ];
}

function clipSystemToBox(hp1, hp2, extent, strictMargin = 0) {
    let poly = createBoxPolygon(extent);
    poly = clipPolygonWithHalfplane(poly, hp1, strictMargin);
    poly = clipPolygonWithHalfplane(poly, hp2, strictMargin);
    return poly;
}

function lineBoxIntersections(a, b, c, extent) {
    const points = [];

    function pushPoint(x, y) {
        if (x < -extent - EPS || x > extent + EPS || y < -extent - EPS || y > extent + EPS) return;
        const exists = points.some(p => Math.hypot(p.x - x, p.y - y) < 1e-6);
        if (!exists) points.push({ x, y });
    }

    if (Math.abs(b) > EPS) {
        pushPoint(-extent, (c - a * -extent) / b);
        pushPoint(extent, (c - a * extent) / b);
    }
    if (Math.abs(a) > EPS) {
        pushPoint((c - b * -extent) / a, -extent);
        pushPoint((c - b * extent) / a, extent);
    }

    return points;
}

function drawPlaneGrid(ctx, w, h, toX, toY, extent) {
    ctx.fillStyle = '#08080d';
    ctx.fillRect(0, 0, w, h);

    for (let v = -extent; v <= extent; v += 1) {
        const x = toX(v);
        const y = toY(v);

        ctx.strokeStyle = v % 2 === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.38)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(toX(-extent), toY(0));
    ctx.lineTo(toX(extent), toY(0));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX(0), toY(-extent));
    ctx.lineTo(toX(0), toY(extent));
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.74)';
    ctx.font = '11px Inter, sans-serif';
    for (let v = -extent; v <= extent; v += 2) {
        if (v !== 0) {
            ctx.fillText(String(v), toX(v) - 6, toY(0) + 16);
            ctx.fillText(String(v), toX(0) + 7, toY(v) + 4);
        }
    }
}

function drawPolygonFill(ctx, polygon, toX, toY, fillColor) {
    if (!polygon || polygon.length < 3) return;

    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.moveTo(toX(polygon[0].x), toY(polygon[0].y));
    for (let i = 1; i < polygon.length; i += 1) {
        ctx.lineTo(toX(polygon[i].x), toY(polygon[i].y));
    }
    ctx.closePath();
    ctx.fill();
}

function drawBoundaryLine(ctx, a, b, c, op, toX, toY, extent, color) {
    if (Math.abs(a) < EPS && Math.abs(b) < EPS) return;

    const points = lineBoxIntersections(a, b, c, extent);
    if (points.length < 2) return;

    const p1 = points[0];
    const p2 = points[1];

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    if (op === 'lt' || op === 'gt') {
        ctx.setLineDash([8, 6]);
    } else {
        ctx.setLineDash([]);
    }

    ctx.beginPath();
    ctx.moveTo(toX(p1.x), toY(p1.y));
    ctx.lineTo(toX(p2.x), toY(p2.y));
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawTwoVariableCanvas(canvas, state) {
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const extent = VIEW_EXTENT;

    const toX = x => ((x + extent) / (2 * extent)) * w;
    const toY = y => h - ((y + extent) / (2 * extent)) * h;

    drawPlaneGrid(ctx, w, h, toX, toY, extent);

    drawPolygonFill(ctx, state.poly1, toX, toY, 'rgba(59, 130, 246, 0.17)');
    drawPolygonFill(ctx, state.poly2, toX, toY, 'rgba(245, 158, 11, 0.18)');
    drawPolygonFill(ctx, state.intersection, toX, toY, 'rgba(139, 92, 246, 0.33)');

    drawBoundaryLine(ctx, state.eq1.a, state.eq1.b, state.eq1.c, state.eq1.op, toX, toY, extent, '#3b82f6');
    drawBoundaryLine(ctx, state.eq2.a, state.eq2.b, state.eq2.c, state.eq2.op, toX, toY, extent, '#f59e0b');

    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('x', w - 14, toY(0) - 8);
    ctx.fillText('y', toX(0) + 8, 16);

    if (!state.hasSolution) {
        ctx.fillStyle = '#ef4444';
        ctx.font = '700 14px Inter, sans-serif';
        ctx.fillText('Soustava nemá řešení (∅).', 16, 24);
    } else if (state.hasSolution && state.intersection.length === 0) {
        ctx.fillStyle = '#f59e0b';
        ctx.font = '700 14px Inter, sans-serif';
        ctx.fillText('Řešení je mimo zobrazené okno.', 16, 24);
    }
}

function relationWord(op) {
    if (op === 'lt') return '<';
    if (op === 'le') return '≤';
    if (op === 'gt') return '>';
    return '≥';
}

function boundaryType(op) {
    return (op === 'lt' || op === 'gt') ? 'čárkovaná (hranice nepatří do řešení)' : 'plná (hranice patří do řešení)';
}

function chooseTestPoint(a, b, c) {
    const candidates = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 1 }];

    for (const point of candidates) {
        const val = a * point.x + b * point.y - c;
        if (Math.abs(val) > EPS) return point;
    }

    return { x: 2, y: -1 };
}

function satisfiesOriginalInequality(a, b, op, c, x, y) {
    return compareValues(a * x + b * y, op, c);
}

function sampleIntegerPoints2D(eq1, eq2, limit = 8) {
    const points = [];
    for (let x = -6; x <= 6; x += 1) {
        for (let y = -6; y <= 6; y += 1) {
            if (satisfiesOriginalInequality(eq1.a, eq1.b, eq1.op, eq1.c, x, y)
                && satisfiesOriginalInequality(eq2.a, eq2.b, eq2.op, eq2.c, x, y)) {
                points.push({ x, y });
                if (points.length >= limit) return points;
            }
        }
    }
    return points;
}

function pointsToLatex(points) {
    if (!points || points.length === 0) return '\\text{žádný celočíselný bod v oblasti }[-6,6]^2';
    return `\\(${points.map(point => `(${point.x},${point.y})`).join(',\\;')}\\)`;
}
function initTwoVariablePlayground() {
    const controls = {
        op1: document.getElementById('twoOp1'),
        a1: document.getElementById('twoA1'),
        b1: document.getElementById('twoB1'),
        c1: document.getElementById('twoC1'),
        op2: document.getElementById('twoOp2'),
        a2: document.getElementById('twoA2'),
        b2: document.getElementById('twoB2'),
        c2: document.getElementById('twoC2')
    };

    const display = {
        a1: document.getElementById('twoA1Value'),
        b1: document.getElementById('twoB1Value'),
        c1: document.getElementById('twoC1Value'),
        a2: document.getElementById('twoA2Value'),
        b2: document.getElementById('twoB2Value'),
        c2: document.getElementById('twoC2Value'),
        system: document.getElementById('twoSystemLatex'),
        boundary: document.getElementById('twoBoundaryInfo'),
        result: document.getElementById('twoResultLatex'),
        sample: document.getElementById('twoSampleLatex'),
        note: document.getElementById('twoNote'),
        steps: document.getElementById('twoSteps'),
        canvas: document.getElementById('twoVarCanvas')
    };

    if (!controls.op1 || !display.canvas) return;

    function update() {
        const eq1 = {
            op: controls.op1.value,
            a: Number(controls.a1.value),
            b: Number(controls.b1.value),
            c: Number(controls.c1.value)
        };

        const eq2 = {
            op: controls.op2.value,
            a: Number(controls.a2.value),
            b: Number(controls.b2.value),
            c: Number(controls.c2.value)
        };

        display.a1.textContent = fmt(eq1.a);
        display.b1.textContent = fmt(eq1.b);
        display.c1.textContent = fmt(eq1.c);
        display.a2.textContent = fmt(eq2.a);
        display.b2.textContent = fmt(eq2.b);
        display.c2.textContent = fmt(eq2.c);

        const expr1 = `${linearExprXYLatex(eq1.a, eq1.b)} ${opTex(eq1.op)} ${fmt(eq1.c)}`;
        const expr2 = `${linearExprXYLatex(eq2.a, eq2.b)} ${opTex(eq2.op)} ${fmt(eq2.c)}`;
        display.system.innerHTML = `\\(\\left\\{\\begin{aligned}${expr1}\\\\${expr2}\\end{aligned}\\right.\\)`;

        const hp1 = normalizeHalfplane(eq1.a, eq1.b, eq1.op, eq1.c);
        const hp2 = normalizeHalfplane(eq2.a, eq2.b, eq2.op, eq2.c);

        const poly1 = clipPolygonWithHalfplane(createBoxPolygon(VIEW_EXTENT), hp1);
        const poly2 = clipPolygonWithHalfplane(createBoxPolygon(VIEW_EXTENT), hp2);
        const intersection = clipSystemToBox(hp1, hp2, VIEW_EXTENT);
        const globalIntersection = clipSystemToBox(hp1, hp2, CHECK_EXTENT, 1e-6);
        const hasSolution = globalIntersection.length > 0;

        display.boundary.textContent = `1. hranice: ${boundaryType(eq1.op)}. 2. hranice: ${boundaryType(eq2.op)}.`;

        if (!hasSolution) {
            display.result.innerHTML = '\\(\\emptyset\\)';
            display.sample.innerHTML = '\\(\\emptyset\\)';
            display.note.textContent = 'Poloroviny nemají společný bod, soustava je neslučitelná.';
        } else {
            const sample = sampleIntegerPoints2D(eq1, eq2);
            display.sample.innerHTML = pointsToLatex(sample);

            if (intersection.length === 0) {
                display.result.innerHTML = '\\(\\text{Řešení existuje, ale je mimo vykreslené okno}\\)';
                display.note.textContent = 'Větší rozsah os by ukázal část řešení.';
            } else {
                display.result.innerHTML = '\\(\\text{Průnik vyznačený fialovou barvou}\\)';
                display.note.textContent = 'Každý bod z fialové oblasti splní obě nerovnice současně.';
            }
        }

        const stepTexts = [];
        stepTexts.push(`1. Nakresli přímky \\(${linearExprXYLatex(eq1.a, eq1.b)}=${fmt(eq1.c)}\\) a \\(${linearExprXYLatex(eq2.a, eq2.b)}=${fmt(eq2.c)}\\).`);
        stepTexts.push(`2. Hranice pro \\(${relationWord(eq1.op)}\\) je ${boundaryType(eq1.op)}; pro \\(${relationWord(eq2.op)}\\) je ${boundaryType(eq2.op)}.`);

        if (!hp1.always && !hp1.never) {
            const p1 = chooseTestPoint(eq1.a, eq1.b, eq1.c);
            const ok1 = satisfiesOriginalInequality(eq1.a, eq1.b, eq1.op, eq1.c, p1.x, p1.y);
            stepTexts.push(`3. Test bodu \\((${p1.x},${p1.y})\\) pro 1. nerovnici: ${ok1 ? 'bod vyhovuje, bereme stranu s tímto bodem.' : 'bod nevyhovuje, bereme opačnou stranu.'}`);
        } else if (hp1.always) {
            stepTexts.push('3. První nerovnice je vždy pravdivá a neomezuje řešení.');
        } else {
            stepTexts.push('3. První nerovnice je vždy nepravdivá.');
        }

        if (!hp2.always && !hp2.never) {
            const p2 = chooseTestPoint(eq2.a, eq2.b, eq2.c);
            const ok2 = satisfiesOriginalInequality(eq2.a, eq2.b, eq2.op, eq2.c, p2.x, p2.y);
            stepTexts.push(`4. Test bodu \\((${p2.x},${p2.y})\\) pro 2. nerovnici: ${ok2 ? 'bod vyhovuje, bereme stranu s tímto bodem.' : 'bod nevyhovuje, bereme opačnou stranu.'}`);
        } else if (hp2.always) {
            stepTexts.push('4. Druhá nerovnice je vždy pravdivá a neomezuje řešení.');
        } else {
            stepTexts.push('4. Druhá nerovnice je vždy nepravdivá.');
        }

        stepTexts.push(`5. Výsledkem je průnik polorovin: \\(${hasSolution ? (intersection.length ? '\\text{neprázdný}' : '\\text{mimo okno}') : '\\emptyset'}\\).`);

        display.steps.innerHTML = stepTexts.map((text, idx) => `<div class="step-item">${idx + 1}. ${text}</div>`).join('');

        drawTwoVariableCanvas(display.canvas, {
            eq1,
            eq2,
            poly1,
            poly2,
            intersection,
            hasSolution
        });

        typeset(document.getElementById('soustavy-nerovnic-vice-promennych'));
    }

    Object.values(controls).forEach(control => control.addEventListener('input', update));
    update();
}

function initMiniChecks() {
    const buttons = document.querySelectorAll('.mini-check-btn');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const group = button.dataset.group;
            const correct = button.dataset.correct;
            const feedback = document.getElementById(button.dataset.feedback);
            const selected = document.querySelector(`input[name="${group}"]:checked`);
            const options = document.querySelectorAll(`input[name="${group}"]`);

            if (!selected) {
                alert('Vyberte prosím jednu odpověď.');
                return;
            }

            const isCorrect = selected.value === correct;
            options.forEach(option => option.disabled = true);
            button.disabled = true;

            selected.parentElement.classList.add(isCorrect ? 'correct' : 'incorrect');
            if (!isCorrect) {
                options.forEach(option => {
                    if (option.value === correct) option.parentElement.classList.add('correct');
                });
            }

            if (feedback) {
                const correctLabel = button.dataset.correctLabel || '';
                const explanation = button.dataset.explanation || '';
                feedback.innerHTML = isCorrect
                    ? `Správně. ${explanation}`
                    : `Nesprávně. Správná odpověď je ${correctLabel}. ${explanation}`;
                feedback.className = `mini-feedback show ${isCorrect ? 'correct' : 'incorrect'}`;
                typeset(feedback);
            }
        });
    });
}

function initExercises() {
    const checks = document.querySelectorAll('.btn-check');
    const meta = {
        1: {
            correct: '\\((2,6]\\)',
            explanation: 'Z první nerovnice: \\((3x>6)\\Rightarrow x>2\\). Z druhé: \\((x\\le6)\\). Průnik je \\((2,6]\\).'
        },
        2: {
            correct: '\\([2,5)\\)',
            explanation: '\\(-2x+4\\le0\\Rightarrow -2x\\le-4\\Rightarrow x\\ge2\\). Druhá dává \\((x<5)\\). Průnik: \\([2,5)\\).'
        },
        3: {
            correct: '\\((1,3]\\)',
            explanation: '\\(x^2-9\\le0\\Rightarrow x\\in[-3,3]\\). S podmínkou \\((x>1)\\) dostaneme \\((1,3]\\).'
        },
        4: {
            correct: '\\((-\\infty,-7]\\cup[3,4)\\)',
            explanation: '\\(|x+2|\\ge5\\Rightarrow x\\le-7\\) nebo \\((x\\ge3)\\). S \\((x<4)\\) vyjde \\((-\\infty,-7]\\cup[3,4)\\).'
        },
        5: {
            correct: 'Ano',
            explanation: 'Pro \\((4,1)\\): \\((4+1=5\\le6)\\) a \\((4-2\\cdot1=2\\ge0)\\). Bod splňuje obě nerovnice.'
        },
        6: {
            correct: 'První čárkovaná, druhá plná',
            explanation: 'U \\((2x+y>3)\\) je hranice čárkovaná, protože ostrá nerovnost. U \\((y\\le2)\\) je hranice plná.'
        },
        7: {
            correct: '\\((0,0),(4,0),(0,4)\\)',
            explanation: 'Průnik \\((x\\ge0, y\\ge0, x+y\\le4)\\) tvoří trojúhelník v 1. kvadrantu s vrcholy \\((0,0),(4,0),(0,4)\\).'
        },
        8: {
            correct: '\\(\\emptyset\\)',
            explanation: 'Podmínky \\((x+y\\le1)\\) a \\((x+y>3)\\) nemohou platit současně.'
        }
    };

    checks.forEach(button => {
        button.addEventListener('click', () => {
            const index = button.dataset.exercise;
            const selected = document.querySelector(`input[name="ex${index}"]:checked`);
            const options = document.querySelectorAll(`input[name="ex${index}"]`);
            const feedback = document.getElementById(`ex${index}Feedback`);
            const status = document.getElementById(`ex${index}Status`);

            if (!selected) {
                alert('Vyberte prosím jednu odpověď.');
                return;
            }

            const isCorrect = selected.value === button.dataset.correct;
            options.forEach(option => option.disabled = true);
            button.disabled = true;

            selected.parentElement.classList.add(isCorrect ? 'correct' : 'incorrect');
            if (!isCorrect) {
                options.forEach(option => {
                    if (option.value === button.dataset.correct) option.parentElement.classList.add('correct');
                });
            }

            if (status) {
                status.textContent = isCorrect ? 'Správně' : 'Špatně';
                status.className = `exercise-status ${isCorrect ? 'correct' : 'incorrect'}`;
            }

            const explanation = meta[index];
            if (feedback && explanation) {
                feedback.innerHTML = isCorrect
                    ? `Správně. ${explanation.explanation}`
                    : `Nesprávně. Správný výsledek je ${explanation.correct}. ${explanation.explanation}`;
                feedback.className = `exercise-feedback show ${isCorrect ? 'correct' : 'incorrect'}`;
                typeset(feedback);
            }

            const complete = Array.from(checks).every(check => check.disabled);
            if (complete) {
                const box = document.getElementById('lessonComplete');
                if (box) {
                    box.style.display = 'block';
                    typeset(box);
                }
            }
        });
    });
}
