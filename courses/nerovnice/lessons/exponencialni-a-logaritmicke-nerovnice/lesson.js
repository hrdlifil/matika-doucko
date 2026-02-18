// Exponencialni a logaritmicke nerovnice - interactive lesson

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initNavbarScroll();
    initExponentialPlayground();
    initLogarithmicPlayground();
    initMiniChecks();
    initExercises();
});

const EPS = 1e-9;

function typeset(target) {
    if (!window.MathJax || typeof window.MathJax.typesetPromise !== 'function') return;
    const nodes = target ? [target] : undefined;
    window.MathJax.typesetPromise(nodes).catch(() => {});
}

function initNavigation() {
    const order = [
        'exponencialni-nerovnice',
        'logaritmicke-nerovnice',
        'procvicovani'
    ];

    const sections = document.querySelectorAll('.lesson-section');
    const links = document.querySelectorAll('.sidebar-link');
    const nextButtons = document.querySelectorAll('.btn-next');
    const prevButtons = document.querySelectorAll('.btn-prev');

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

    nextButtons.forEach(button => button.addEventListener('click', () => showSection(button.dataset.next)));
    prevButtons.forEach(button => button.addEventListener('click', () => showSection(button.dataset.prev)));

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
    if (!Number.isFinite(a) || !Number.isFinite(b)) return a === b;
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

function baseTex(base) {
    if (approxEqual(base, 0.5)) return '\\frac{1}{2}';
    if (approxEqual(base, 0.25)) return '\\frac{1}{4}';
    if (approxEqual(base, 0.2)) return '\\frac{1}{5}';
    return fmt(base);
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
    if (op === 'lt') return left < right;
    if (op === 'le') return left <= right;
    if (op === 'gt') return left > right;
    return left >= right;
}

function linearLatex(m, b, variable = 'x') {
    const terms = [];

    function pushTerm(coef, body) {
        if (Math.abs(coef) < EPS) return;
        const absCoef = Math.abs(coef);
        const coefText = body
            ? (approxEqual(absCoef, 1) ? '' : fmt(absCoef))
            : fmt(absCoef);
        const raw = `${coefText}${body}`;
        if (terms.length === 0) {
            terms.push(coef < 0 ? `-${raw}` : raw);
        } else {
            terms.push(coef < 0 ? `-${raw}` : `+${raw}`);
        }
    }

    pushTerm(m, variable);
    pushTerm(b, '');

    if (terms.length === 0) return '0';
    return terms.join('');
}

function latexPoly(a, b, c) {
    const terms = [];

    function pushTerm(coef, body) {
        if (Math.abs(coef) < EPS) return;
        const absCoef = Math.abs(coef);
        const coefText = body
            ? (approxEqual(absCoef, 1) ? '' : fmt(absCoef))
            : fmt(absCoef);
        const raw = `${coefText}${body}`;
        if (terms.length === 0) {
            terms.push(coef < 0 ? `-${raw}` : raw);
        } else {
            terms.push(coef < 0 ? `-${raw}` : `+${raw}`);
        }
    }

    pushTerm(a, 'x^2');
    pushTerm(b, 'x');
    pushTerm(c, '');

    if (terms.length === 0) return '0';
    return terms.join('');
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

        const overlap = last.r === Infinity
            || current.l < last.r
            || (approxEqual(current.l, last.r) && (last.rc || current.lc));

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

function unionIntervals(aSet, bSet) {
    return normalizeIntervals([...(aSet || []), ...(bSet || [])]);
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

function sampleIntegers(intervals) {
    const values = [];
    for (let x = -12; x <= 12; x += 1) {
        if (intervals.some(interval => inInterval(x, interval))) values.push(x);
    }
    if (values.length === 0) return 'žádné celé číslo v intervalu [-12,12]';
    return `\\(${values.slice(0, 8).join(',\\;')}\\)`;
}

function solveLinearInequality(b, c, op) {
    const steps = [];

    if (Math.abs(b) < EPS) {
        const holds = compareValues(c, op, 0);
        steps.push(`\\(${latexPoly(0, b, c)} ${opTex(op)} 0\\) je konstantní tvrzení.`);
        steps.push(holds ? 'Tvrzení je pravdivé pro všechna reálná čísla.' : 'Tvrzení je nepravdivé pro všechna reálná čísla.');

        return {
            mode: 'constant',
            intervals: holds ? allReals() : [],
            roots: [],
            discriminant: null,
            steps
        };
    }

    const boundary = -c / b;
    const finalOp = b < 0 ? flipOp(op) : op;

    steps.push(`\\(${latexPoly(0, b, c)} ${opTex(op)} 0\\)`);
    steps.push(`\\(${fmt(b)}x ${opTex(op)} ${fmt(-c)}\\)`);
    if (b < 0) steps.push('Dělení záporným číslem obrací znaménko nerovnosti.');
    steps.push(`\\(x ${opTex(finalOp)} ${fmt(boundary)}\\)`);

    return {
        mode: 'linear',
        intervals: intervalFromCondition(finalOp, boundary),
        roots: [boundary],
        discriminant: null,
        steps
    };
}

function constantSignIntervals(sign, op) {
    if (sign > 0) {
        if (op === 'gt' || op === 'ge') return allReals();
        return [];
    }
    if (op === 'lt' || op === 'le') return allReals();
    return [];
}

function solveQuadraticInequality(a, b, c, op) {
    if (Math.abs(a) < EPS) return solveLinearInequality(b, c, op);

    const steps = [];
    const D = b * b - 4 * a * c;
    const cleanedD = n(D);
    const roots = [];
    let intervals = [];

    steps.push(`\\(D=b^2-4ac=${fmt(b)}^2-4\\cdot${fmt(a)}\\cdot${fmt(c)}=${fmt(cleanedD)}\\)`);

    if (cleanedD < 0) {
        steps.push('Diskriminant je záporný, kvadratický výraz nemá reálné kořeny.');
        steps.push(a > 0 ? 'Parabola je celá nad osou x.' : 'Parabola je celá pod osou x.');
        intervals = constantSignIntervals(Math.sign(a), op);
    } else if (approxEqual(cleanedD, 0)) {
        const x0 = -b / (2 * a);
        roots.push(x0);
        steps.push(`\\(x_0=\\frac{-b}{2a}=\\frac{-(${fmt(b)})}{2\\cdot${fmt(a)}}=${fmt(x0)}\\)`);
        steps.push(`\\(f(x)=${fmt(a)}(x-${fmt(x0)})^2\\)`);

        if (a > 0) {
            if (op === 'gt') intervals = normalizeIntervals([{ l: -Infinity, r: x0, lc: false, rc: false }, { l: x0, r: Infinity, lc: false, rc: false }]);
            if (op === 'ge') intervals = allReals();
            if (op === 'lt') intervals = [];
            if (op === 'le') intervals = [{ l: x0, r: x0, lc: true, rc: true }];
        } else {
            if (op === 'gt') intervals = [];
            if (op === 'ge') intervals = [{ l: x0, r: x0, lc: true, rc: true }];
            if (op === 'lt') intervals = normalizeIntervals([{ l: -Infinity, r: x0, lc: false, rc: false }, { l: x0, r: Infinity, lc: false, rc: false }]);
            if (op === 'le') intervals = allReals();
        }
    } else {
        const sqrtD = Math.sqrt(cleanedD);
        const r1 = (-b - sqrtD) / (2 * a);
        const r2 = (-b + sqrtD) / (2 * a);
        const x1 = Math.min(r1, r2);
        const x2 = Math.max(r1, r2);
        roots.push(x1, x2);

        steps.push(`\\(x_1=${fmt(x1)},\\;x_2=${fmt(x2)}\\)`);
        steps.push(a > 0 ? 'Pro \(a>0\) je výraz mezi kořeny záporný a mimo kořeny kladný.' : 'Pro \(a<0\) je výraz mezi kořeny kladný a mimo kořeny záporný.');

        if (a > 0) {
            if (op === 'lt') intervals = [{ l: x1, r: x2, lc: false, rc: false }];
            if (op === 'le') intervals = [{ l: x1, r: x2, lc: true, rc: true }];
            if (op === 'gt') intervals = normalizeIntervals([{ l: -Infinity, r: x1, lc: false, rc: false }, { l: x2, r: Infinity, lc: false, rc: false }]);
            if (op === 'ge') intervals = normalizeIntervals([{ l: -Infinity, r: x1, lc: false, rc: true }, { l: x2, r: Infinity, lc: true, rc: false }]);
        } else {
            if (op === 'lt') intervals = normalizeIntervals([{ l: -Infinity, r: x1, lc: false, rc: false }, { l: x2, r: Infinity, lc: false, rc: false }]);
            if (op === 'le') intervals = normalizeIntervals([{ l: -Infinity, r: x1, lc: false, rc: true }, { l: x2, r: Infinity, lc: true, rc: false }]);
            if (op === 'gt') intervals = [{ l: x1, r: x2, lc: false, rc: false }];
            if (op === 'ge') intervals = [{ l: x1, r: x2, lc: true, rc: true }];
        }
    }

    return {
        mode: 'quadratic',
        intervals: normalizeIntervals(intervals),
        roots,
        discriminant: cleanedD,
        steps
    };
}

function realRootsOfPolynomial(a, b, c) {
    if (Math.abs(a) < EPS) {
        if (Math.abs(b) < EPS) return [];
        return [-c / b];
    }

    const D = b * b - 4 * a * c;
    if (D < -EPS) return [];
    if (approxEqual(D, 0)) return [-b / (2 * a)];
    const sqrtD = Math.sqrt(D);
    const r1 = (-b - sqrtD) / (2 * a);
    const r2 = (-b + sqrtD) / (2 * a);
    return [Math.min(r1, r2), Math.max(r1, r2)];
}

function solveAbsoluteQuadratic(a, b, c, op, k) {
    const q = latexPoly(a, b, c);
    const result = { intervals: [], steps: [], cases: [], combine: '', equivalent: '' };

    if ((op === 'lt' || op === 'le') && k < 0) {
        result.intervals = [];
        result.equivalent = '\\emptyset';
        result.steps.push('Protože \\(|Q(x)|\\ge0\\), nerovnost s pravou stranou menší než 0 nemá řešení.');
        return result;
    }

    if ((op === 'gt' || op === 'ge') && k < 0) {
        result.intervals = allReals();
        result.equivalent = '\\mathbb{R}';
        result.steps.push('Absolutní hodnota je vždy větší nebo rovna 0, tedy jistě větší než záporné číslo.');
        return result;
    }

    function caseSolve(text, rhsShift, cmp) {
        const solved = solveQuadraticInequality(a, b, c - rhsShift, cmp);
        return { text, solved };
    }

    let first;
    let second;

    if (op === 'lt') {
        first = caseSolve(`${q}<${fmt(k)}`, k, 'lt');
        second = caseSolve(`${q}>${fmt(-k)}`, -k, 'gt');
        result.combine = 'and';
        result.intervals = intersectIntervals(first.solved.intervals, second.solved.intervals);
    } else if (op === 'le') {
        first = caseSolve(`${q}\\le${fmt(k)}`, k, 'le');
        second = caseSolve(`${q}\\ge${fmt(-k)}`, -k, 'ge');
        result.combine = 'and';
        result.intervals = intersectIntervals(first.solved.intervals, second.solved.intervals);
    } else if (op === 'gt') {
        first = caseSolve(`${q}>${fmt(k)}`, k, 'gt');
        second = caseSolve(`${q}<${fmt(-k)}`, -k, 'lt');
        result.combine = 'or';
        result.intervals = unionIntervals(first.solved.intervals, second.solved.intervals);
    } else {
        first = caseSolve(`${q}\\ge${fmt(k)}`, k, 'ge');
        second = caseSolve(`${q}\\le${fmt(-k)}`, -k, 'le');
        result.combine = 'or';
        result.intervals = unionIntervals(first.solved.intervals, second.solved.intervals);
    }

    result.cases = [first, second];
    result.equivalent = result.combine === 'and'
        ? `${first.text}\\;\\text{a}\\;${second.text}`
        : `${first.text}\\;\\text{nebo}\\;${second.text}`;

    result.steps.push(result.combine === 'and'
        ? 'Nejprve vyřešíme obě podmínky a vezmeme jejich průnik.'
        : 'Nejprve vyřešíme obě podmínky a vezmeme jejich sjednocení.');
    result.steps.push(`Výsledek: \\(${intervalsToLatex(result.intervals)}\\).`);

    return result;
}

function drawIntervalCanvas(canvas, rows) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const marginX = 58;
    const min = -10;
    const max = 10;
    const bg = '#08080d';

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const toX = value => marginX + ((value - min) / (max - min)) * (w - 2 * marginX);
    const rowYs = rows.length === 1
        ? [Math.round(h / 2)]
        : rows.map((_, index) => Math.round(42 + index * ((h - 84) / (rows.length - 1))));

    rows.forEach((row, index) => {
        const y = rowYs[index];

        ctx.fillStyle = 'rgba(255,255,255,0.72)';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText(row.label, 8, y - 10);

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
                ctx.fillStyle = 'rgba(255,255,255,0.65)';
                ctx.fillText(String(tick), x - 6, y + 18);
            }
        }

        if (!row.intervals || row.intervals.length === 0) {
            ctx.fillStyle = '#ef4444';
            ctx.fillText('∅', w / 2 - 5, y - 12);
            return;
        }

        row.intervals.forEach(interval => {
            const visibleL = interval.l === -Infinity ? min : Math.max(interval.l, min);
            const visibleR = interval.r === Infinity ? max : Math.min(interval.r, max);
            if (visibleR < min || visibleL > max) return;

            const leftX = toX(visibleL);
            const rightX = toX(visibleR);

            ctx.strokeStyle = row.color;
            ctx.lineWidth = 7;
            ctx.beginPath();
            ctx.moveTo(leftX, y);
            ctx.lineTo(rightX, y);
            ctx.stroke();

            if (interval.l === -Infinity) {
                ctx.beginPath();
                ctx.moveTo(leftX, y); ctx.lineTo(leftX + 10, y - 6); ctx.moveTo(leftX, y); ctx.lineTo(leftX + 10, y + 6); ctx.stroke();
            }
            if (interval.r === Infinity) {
                ctx.beginPath();
                ctx.moveTo(rightX, y); ctx.lineTo(rightX - 10, y - 6); ctx.moveTo(rightX, y); ctx.lineTo(rightX - 10, y + 6); ctx.stroke();
            }

            if (Number.isFinite(interval.l) && interval.l >= min && interval.l <= max) {
                ctx.beginPath();
                ctx.arc(leftX, y, 7, 0, Math.PI * 2);
                if (interval.lc) {
                    ctx.fillStyle = row.color;
                    ctx.fill();
                } else {
                    ctx.fillStyle = bg;
                    ctx.fill();
                    ctx.lineWidth = 2.5;
                    ctx.strokeStyle = row.color;
                    ctx.stroke();
                }
            }

            if (Number.isFinite(interval.r) && interval.r >= min && interval.r <= max) {
                ctx.beginPath();
                ctx.arc(rightX, y, 7, 0, Math.PI * 2);
                if (interval.rc) {
                    ctx.fillStyle = row.color;
                    ctx.fill();
                } else {
                    ctx.fillStyle = bg;
                    ctx.fill();
                    ctx.lineWidth = 2.5;
                    ctx.strokeStyle = row.color;
                    ctx.stroke();
                }
            }
        });
    });
}

function niceStep(value) {
    const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
    const residual = value / magnitude;
    if (residual >= 5) return 5 * magnitude;
    if (residual >= 2) return 2 * magnitude;
    return magnitude;
}

function drawQuadraticPlot(canvas, a, b, c, options = {}) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const xMin = -8;
    const xMax = 8;

    const samples = [];
    for (let x = xMin; x <= xMax; x += 0.1) {
        samples.push(a * x * x + b * x + c);
    }

    if (Number.isFinite(options.k)) {
        samples.push(options.k, -options.k);
    }
    samples.push(0);

    let yMin = Math.min(...samples);
    let yMax = Math.max(...samples);
    if (approxEqual(yMin, yMax)) {
        yMin -= 2;
        yMax += 2;
    }

    const pad = (yMax - yMin) * 0.15;
    yMin -= pad;
    yMax += pad;
    yMin = Math.max(yMin, -30);
    yMax = Math.min(yMax, 30);

    const toX = x => ((x - xMin) / (xMax - xMin)) * w;
    const toY = y => h - ((y - yMin) / (yMax - yMin)) * h;

    ctx.fillStyle = '#08080d';
    ctx.fillRect(0, 0, w, h);

    const stepX = 1;
    const stepY = niceStep((yMax - yMin) / 7);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;

    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x += stepX) {
        ctx.beginPath();
        ctx.moveTo(toX(x), 0);
        ctx.lineTo(toX(x), h);
        ctx.stroke();
    }

    for (let y = Math.ceil(yMin / stepY) * stepY; y <= yMax; y += stepY) {
        ctx.beginPath();
        ctx.moveTo(0, toY(y));
        ctx.lineTo(w, toY(y));
        ctx.stroke();
    }

    if (yMin < 0 && yMax > 0) {
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, toY(0));
        ctx.lineTo(w, toY(0));
        ctx.stroke();
    }

    if (xMin < 0 && xMax > 0) {
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(toX(0), 0);
        ctx.lineTo(toX(0), h);
        ctx.stroke();
    }

    if (Number.isFinite(options.k)) {
        ctx.setLineDash([7, 6]);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, toY(options.k));
        ctx.lineTo(w, toY(options.k));
        ctx.stroke();

        ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
        ctx.beginPath();
        ctx.moveTo(0, toY(-options.k));
        ctx.lineTo(w, toY(-options.k));
        ctx.stroke();
        ctx.setLineDash([]);
    }

    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#10b981');
    gradient.addColorStop(1, '#6366f1');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let pixel = 0; pixel <= w; pixel += 1) {
        const x = xMin + (pixel / w) * (xMax - xMin);
        const y = a * x * x + b * x + c;
        const py = toY(y);
        if (pixel === 0) ctx.moveTo(pixel, py);
        else ctx.lineTo(pixel, py);
    }
    ctx.stroke();

    (options.roots || []).forEach(root => {
        if (!Number.isFinite(root) || root < xMin || root > xMax) return;
        const x = toX(root);
        const y = toY(0);
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
}

function initQuadraticPlayground() {
    const controls = {
        op: document.getElementById('quadOperator'),
        a: document.getElementById('quadA'),
        b: document.getElementById('quadB'),
        c: document.getElementById('quadC')
    };

    const display = {
        a: document.getElementById('quadAValue'),
        b: document.getElementById('quadBValue'),
        c: document.getElementById('quadCValue'),
        inequality: document.getElementById('quadInequalityLatex'),
        discriminant: document.getElementById('quadDiscriminantLatex'),
        roots: document.getElementById('quadRootsLatex'),
        solution: document.getElementById('quadSolutionLatex'),
        steps: document.getElementById('quadSteps'),
        graphCanvas: document.getElementById('quadGraphCanvas'),
        numberCanvas: document.getElementById('quadNumberCanvas')
    };

    if (!controls.op || !display.graphCanvas || !display.numberCanvas) return;

    function update() {
        const op = controls.op.value;
        const a = Number(controls.a.value);
        const b = Number(controls.b.value);
        const c = Number(controls.c.value);

        display.a.textContent = fmt(a);
        display.b.textContent = fmt(b);
        display.c.textContent = fmt(c);

        const solved = solveQuadraticInequality(a, b, c, op);

        display.inequality.innerHTML = `\\(${latexPoly(a, b, c)} ${opTex(op)} 0\\)`;

        if (solved.mode === 'quadratic') {
            display.discriminant.innerHTML = `\\(D=${fmt(solved.discriminant)}\\)`;
            if (solved.roots.length === 0) {
                display.roots.innerHTML = '\\(\\text{žádné reálné kořeny}\\)';
            } else if (solved.roots.length === 1) {
                display.roots.innerHTML = `\\(x_0=${fmt(solved.roots[0])}\\)`;
            } else {
                display.roots.innerHTML = `\\(x_1=${fmt(solved.roots[0])},\\;x_2=${fmt(solved.roots[1])}\\)`;
            }
        } else if (solved.mode === 'linear') {
            display.discriminant.innerHTML = '\\(a=0\\Rightarrow\\text{lineární nerovnice}\\)';
            display.roots.innerHTML = solved.roots.length ? `\\(x_0=${fmt(solved.roots[0])}\\)` : '\\(\\text{bez kořenů}\\)';
        } else {
            display.discriminant.innerHTML = '\\(a=b=0\\Rightarrow\\text{konstantní tvrzení}\\)';
            display.roots.innerHTML = '\\(\\text{kořeny se neřeší}\\)';
        }

        display.solution.innerHTML = `\\(${intervalsToLatex(solved.intervals)}\\)`;
        display.steps.innerHTML = solved.steps.map((step, index) => `<div class="step-item">${index + 1}. ${step}</div>`).join('');

        drawQuadraticPlot(display.graphCanvas, a, b, c, { roots: solved.roots });
        drawIntervalCanvas(display.numberCanvas, [{ label: 'Řešení', intervals: solved.intervals, color: '#10b981' }]);

        typeset(document.getElementById('kvadraticke-nerovnice'));
    }

    Object.values(controls).forEach(control => control.addEventListener('input', update));
    update();
}

function initAbsoluteQuadraticPlayground() {
    const controls = {
        op: document.getElementById('absQuadOperator'),
        a: document.getElementById('absQuadA'),
        b: document.getElementById('absQuadB'),
        c: document.getElementById('absQuadC'),
        k: document.getElementById('absQuadK')
    };

    const display = {
        a: document.getElementById('absQuadAValue'),
        b: document.getElementById('absQuadBValue'),
        c: document.getElementById('absQuadCValue'),
        k: document.getElementById('absQuadKValue'),
        expr: document.getElementById('absQuadExpressionLatex'),
        equivalent: document.getElementById('absQuadEquivalentLatex'),
        combine: document.getElementById('absQuadCombineLatex'),
        solution: document.getElementById('absQuadSolutionLatex'),
        cases: document.getElementById('absQuadCases'),
        steps: document.getElementById('absQuadSteps'),
        graphCanvas: document.getElementById('absQuadGraphCanvas'),
        numberCanvas: document.getElementById('absQuadNumberCanvas')
    };

    if (!controls.op || !display.graphCanvas || !display.numberCanvas) return;

    function update() {
        const op = controls.op.value;
        const a = Number(controls.a.value);
        const b = Number(controls.b.value);
        const c = Number(controls.c.value);
        const k = Number(controls.k.value);

        display.a.textContent = fmt(a);
        display.b.textContent = fmt(b);
        display.c.textContent = fmt(c);
        display.k.textContent = fmt(k);

        const solved = solveAbsoluteQuadratic(a, b, c, op, k);
        const q = latexPoly(a, b, c);
        display.expr.innerHTML = `\\(|${q}| ${opTex(op)} ${fmt(k)}\\)`;
        display.equivalent.innerHTML = `\\(${solved.equivalent}\\)`;
        display.combine.innerHTML = solved.combine
            ? (solved.combine === 'and' ? '\\(A\\cap B\\)' : '\\(A\\cup B\\)')
            : '\\(\\text{speciální případ}\\)';
        display.solution.innerHTML = `\\(${intervalsToLatex(solved.intervals)}\\)`;

        if (solved.cases.length === 2) {
            display.cases.innerHTML = solved.cases.map((item, index) => {
                return `<article class="case-card"><div class="case-title">Podmínka ${index === 0 ? 'A' : 'B'}</div><div class="case-value">\\(${item.text}\\)</div><div>\\(${intervalsToLatex(item.solved.intervals)}\\)</div></article>`;
            }).join('');
        } else {
            display.cases.innerHTML = `<article class="case-card"><div class="case-title">Interpretace</div><div class="case-value">\\(${intervalsToLatex(solved.intervals)}\\)</div><div>${sampleIntegers(solved.intervals)}</div></article>`;
        }

        display.steps.innerHTML = solved.steps.map((step, index) => `<div class="step-item">${index + 1}. ${step}</div>`).join('');

        const rootsForGraph = realRootsOfPolynomial(a, b, c);
        drawQuadraticPlot(display.graphCanvas, a, b, c, { roots: rootsForGraph, k });

        const rows = [];
        if (solved.cases.length === 2) {
            rows.push({ label: 'A', intervals: solved.cases[0].solved.intervals, color: '#3b82f6' });
            rows.push({ label: 'B', intervals: solved.cases[1].solved.intervals, color: '#f59e0b' });
        }
        rows.push({ label: 'Výsledek', intervals: solved.intervals, color: '#8b5cf6' });
        drawIntervalCanvas(display.numberCanvas, rows);

        typeset(document.getElementById('kvadraticke-nerovnice-s-absolutni-hodnotou'));
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
        1: { correct: '\\(x>2\\)', explanation: '\\(8=2^3\\), pro zaklad vetsi nez 1 se znamenko zachova: \\(x+1>3\\).' },
        2: { correct: '\\(x\\ge3\\)', explanation: 'U zakladu \\(\\frac13\\) se znamenko obraci, tedy \\(2x-1\\ge5\\).' },
        3: { correct: '\\(( -\\infty,-2]\\cup[2,\\infty)\\)', explanation: '\\(5^{x^2-4}\\ge1=5^0\\Rightarrow x^2-4\\ge0\\).' },
        4: { correct: '\\((1,9)\\)', explanation: 'Podminka \\(x-1>0\\) a zaroven \\(x-1<8\\).' },
        5: { correct: '\\((-\\tfrac32,-\\tfrac12]\\)', explanation: 'U zakladu \\(\\frac12\\) se znamenko obraci: \\(2x+3\\le2\\), navic \\(2x+3>0\\).' },
        6: { correct: '\\([-\\sqrt{13},-2)\\cup(2,\\sqrt{13}]\\)', explanation: 'Soucasne musi platit \\(x^2-4>0\\) a \\(x^2-4\\le9\\).' },
        7: { correct: '\\(x<1+\\log_4 7\\approx2.40\\)', explanation: 'Pro zaklad 4 (vetsi nez 1) se smer nerovnosti zachova: \\(x-1<\\log_4 7\\).' },
        8: { correct: '\\([4,\\infty)\\)', explanation: '\\(x>2\\), potom \\(\\log_2(x(x-2))\\ge3\\Rightarrow x^2-2x-8\\ge0\\).' }
    };

    checks.forEach(button => {
        button.addEventListener('click', () => {
            const index = button.dataset.exercise;
            const selected = document.querySelector(`input[name="ex${index}"]:checked`);
            const options = document.querySelectorAll(`input[name="ex${index}"]`);
            const feedback = document.getElementById(`ex${index}Feedback`);
            const status = document.getElementById(`ex${index}Status`);

            if (!selected) {
                alert('Vyberte prosim jednu odpoved.');
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
                status.textContent = isCorrect ? 'Spravne' : 'Spatne';
                status.className = `exercise-status ${isCorrect ? 'correct' : 'incorrect'}`;
            }

            const explanation = meta[index];
            if (feedback && explanation) {
                feedback.innerHTML = isCorrect
                    ? `Spravne. ${explanation.explanation}`
                    : `Nespravne. Spravny vysledek je ${explanation.correct}. ${explanation.explanation}`;
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
function solveExponentialModel(base, m, nCoef, op, k) {
    const exponentOp = base > 1 ? op : flipOp(op);
    const linear = solveLinearInequality(m, nCoef - k, exponentOp);

    return {
        exponentOp,
        linear,
        monotonicity: base > 1
            ? '\\(a>1\\Rightarrow a^x\\) je rostoucí, znaménko se zachová.'
            : '\\(0<a<1\\Rightarrow a^x\\) je klesající, znaménko se obrací.'
    };
}

function drawExponentialModelGraph(canvas, base, m, nCoef, k) {
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const xMin = -6;
    const xMax = 6;
    const lnA = Math.log(base);

    const zLeft = lnA * (m * xMin + nCoef);
    const zRight = lnA * (m * xMax + nCoef);
    const zK = lnA * k;

    let yMin = Math.min(zLeft, zRight, zK);
    let yMax = Math.max(zLeft, zRight, zK);
    if (approxEqual(yMin, yMax)) {
        yMin -= 1;
        yMax += 1;
    }
    const pad = (yMax - yMin) * 0.18;
    yMin -= pad;
    yMax += pad;

    const toX = x => ((x - xMin) / (xMax - xMin)) * w;
    const toY = y => h - ((y - yMin) / (yMax - yMin)) * h;

    ctx.fillStyle = '#08080d';
    ctx.fillRect(0, 0, w, h);

    const stepY = niceStep((yMax - yMin) / 7);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x += 1) {
        ctx.beginPath();
        ctx.moveTo(toX(x), 0);
        ctx.lineTo(toX(x), h);
        ctx.stroke();
    }
    for (let y = Math.ceil(yMin / stepY) * stepY; y <= yMax; y += stepY) {
        ctx.beginPath();
        ctx.moveTo(0, toY(y));
        ctx.lineTo(w, toY(y));
        ctx.stroke();
    }

    if (yMin < 0 && yMax > 0) {
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, toY(0));
        ctx.lineTo(w, toY(0));
        ctx.stroke();
    }

    if (xMin < 0 && xMax > 0) {
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(toX(0), 0);
        ctx.lineTo(toX(0), h);
        ctx.stroke();
    }

    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#10b981');
    gradient.addColorStop(1, '#6366f1');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(toX(xMin), toY(zLeft));
    ctx.lineTo(toX(xMax), toY(zRight));
    ctx.stroke();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.moveTo(0, toY(zK));
    ctx.lineTo(w, toY(zK));
    ctx.stroke();
    ctx.setLineDash([]);

    if (Math.abs(m) >= EPS) {
        const x0 = (k - nCoef) / m;
        if (x0 >= xMin && x0 <= xMax) {
            ctx.beginPath();
            ctx.arc(toX(x0), toY(zK), 5, 0, Math.PI * 2);
            ctx.fillStyle = '#f59e0b';
            ctx.fill();
        }
    }

    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('z = ln(a^(mx+n))', 12, 20);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('z = ln(a^k)', 12, 38);
}

function initExponentialPlayground() {
    const controls = {
        op: document.getElementById('expOperator'),
        base: document.getElementById('expBase'),
        m: document.getElementById('expM'),
        n: document.getElementById('expN'),
        k: document.getElementById('expK')
    };

    const display = {
        m: document.getElementById('expMValue'),
        n: document.getElementById('expNValue'),
        k: document.getElementById('expKValue'),
        inequality: document.getElementById('expInequalityLatex'),
        monotonic: document.getElementById('expMonotonicLatex'),
        equivalent: document.getElementById('expEquivalentLatex'),
        boundary: document.getElementById('expBoundaryLatex'),
        solution: document.getElementById('expSolutionLatex'),
        sample: document.getElementById('expSampleLatex'),
        steps: document.getElementById('expSteps'),
        graphCanvas: document.getElementById('expGraphCanvas'),
        numberCanvas: document.getElementById('expNumberCanvas')
    };

    if (!controls.op || !display.graphCanvas || !display.numberCanvas) return;

    function update() {
        const op = controls.op.value;
        const base = Number(controls.base.value);
        const m = Number(controls.m.value);
        const nCoef = Number(controls.n.value);
        const k = Number(controls.k.value);

        display.m.textContent = fmt(m);
        display.n.textContent = fmt(nCoef);
        display.k.textContent = fmt(k);

        const solved = solveExponentialModel(base, m, nCoef, op, k);
        const leftExponent = linearLatex(m, nCoef);
        const leftExpr = `${baseTex(base)}^{${leftExponent}}`;
        const rightExpr = `${baseTex(base)}^{${fmt(k)}}`;

        display.inequality.innerHTML = `\\(${leftExpr} ${opTex(op)} ${rightExpr}\\)`;
        display.monotonic.innerHTML = solved.monotonicity;
        display.equivalent.innerHTML = `\\(${leftExponent} ${opTex(solved.exponentOp)} ${fmt(k)}\\)`;

        if (solved.linear.mode === 'linear') {
            display.boundary.innerHTML = `\\(x_0=${fmt(solved.linear.roots[0])}\\)`;
        } else {
            display.boundary.innerHTML = '\\(\\text{hraniční bod nevzniká (konstantní nerovnost)}\\)';
        }

        display.solution.innerHTML = `\\(${intervalsToLatex(solved.linear.intervals)}\\)`;
        display.sample.innerHTML = sampleIntegers(solved.linear.intervals);

        const steps = [
            base > 1
                ? `Protože ${fmt(base)} > 1, funkce \\(a^x\\) je rostoucí.`
                : `Protože \\(0<${fmt(base)}<1\\), funkce \\(a^x\\) je klesající.`,
            `Přejdeme na exponenty: \\(${leftExponent} ${opTex(solved.exponentOp)} ${fmt(k)}\\).`,
            ...solved.linear.steps,
            `Výsledek: \\(${intervalsToLatex(solved.linear.intervals)}\\).`
        ];
        display.steps.innerHTML = steps.map((step, index) => `<div class="step-item">${index + 1}. ${step}</div>`).join('');

        drawExponentialModelGraph(display.graphCanvas, base, m, nCoef, k);
        drawIntervalCanvas(display.numberCanvas, [{ label: 'Řešení', intervals: solved.linear.intervals, color: '#8b5cf6' }]);

        typeset(document.getElementById('exponencialni-nerovnice'));
    }

    Object.values(controls).forEach(control => control.addEventListener('input', update));
    update();
}

function logBaseValue(value, base) {
    return Math.log(value) / Math.log(base);
}

function solveLogModel(base, m, nCoef, op, p) {
    const transformedOp = base > 1 ? op : flipOp(op);
    const target = Math.pow(base, p);
    const domain = solveLinearInequality(m, nCoef, 'gt');
    const algebraic = solveLinearInequality(m, nCoef - target, transformedOp);
    const solution = intersectIntervals(domain.intervals, algebraic.intervals);

    return {
        transformedOp,
        target,
        domain,
        algebraic,
        solution,
        monotonicity: base > 1
            ? '\\(a>1\\Rightarrow \\log_a x\\) je rostoucí, znaménko se zachová.'
            : '\\(0<a<1\\Rightarrow \\log_a x\\) je klesající, znaménko se obrací.'
    };
}

function drawLogModelGraph(canvas, base, m, nCoef, p) {
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const xMin = -8;
    const xMax = 8;
    const points = [];

    for (let x = xMin; x <= xMax; x += 0.02) {
        const arg = m * x + nCoef;
        if (arg <= 0) continue;
        const y = logBaseValue(arg, base);
        if (Number.isFinite(y) && Math.abs(y) < 30) points.push({ x, y });
    }

    let yMin = Math.min(p, -2);
    let yMax = Math.max(p, 2);
    if (points.length > 0) {
        const values = points.map(point => point.y);
        yMin = Math.min(yMin, ...values);
        yMax = Math.max(yMax, ...values);
    }

    if (approxEqual(yMin, yMax)) {
        yMin -= 1;
        yMax += 1;
    }

    const pad = (yMax - yMin) * 0.16;
    yMin -= pad;
    yMax += pad;

    const toX = x => ((x - xMin) / (xMax - xMin)) * w;
    const toY = y => h - ((y - yMin) / (yMax - yMin)) * h;

    ctx.fillStyle = '#08080d';
    ctx.fillRect(0, 0, w, h);

    const stepY = niceStep((yMax - yMin) / 7);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x += 1) {
        ctx.beginPath();
        ctx.moveTo(toX(x), 0);
        ctx.lineTo(toX(x), h);
        ctx.stroke();
    }
    for (let y = Math.ceil(yMin / stepY) * stepY; y <= yMax; y += stepY) {
        ctx.beginPath();
        ctx.moveTo(0, toY(y));
        ctx.lineTo(w, toY(y));
        ctx.stroke();
    }

    if (yMin < 0 && yMax > 0) {
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, toY(0));
        ctx.lineTo(w, toY(0));
        ctx.stroke();
    }

    if (xMin < 0 && xMax > 0) {
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(toX(0), 0);
        ctx.lineTo(toX(0), h);
        ctx.stroke();
    }

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.moveTo(0, toY(p));
    ctx.lineTo(w, toY(p));
    ctx.stroke();
    ctx.setLineDash([]);

    if (Math.abs(m) >= EPS) {
        const asymptote = -nCoef / m;
        if (asymptote > xMin && asymptote < xMax) {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(toX(asymptote), 0);
            ctx.lineTo(toX(asymptote), h);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    if (points.length > 1) {
        const gradient = ctx.createLinearGradient(0, 0, w, h);
        gradient.addColorStop(0, '#10b981');
        gradient.addColorStop(1, '#6366f1');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;

        let started = false;
        for (let i = 0; i < points.length; i += 1) {
            const point = points[i];
            const cx = toX(point.x);
            const cy = toY(point.y);
            if (!started) {
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                started = true;
            } else {
                const prev = points[i - 1];
                if (point.x - prev.x > 0.05) {
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                } else {
                    ctx.lineTo(cx, cy);
                }
            }
        }
        if (started) ctx.stroke();
    }

    if (points.length === 0) {
        ctx.fillStyle = '#ef4444';
        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Definiční obor je prázdný.', w / 2, h / 2);
        ctx.textAlign = 'left';
    }

    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('y = log_a(mx+n)', 12, 20);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('y = p', 12, 38);
}

function initLogarithmicPlayground() {
    const controls = {
        op: document.getElementById('logOperator'),
        base: document.getElementById('logBase'),
        m: document.getElementById('logM'),
        n: document.getElementById('logN'),
        p: document.getElementById('logP')
    };

    const display = {
        m: document.getElementById('logMValue'),
        n: document.getElementById('logNValue'),
        p: document.getElementById('logPValue'),
        expr: document.getElementById('logExprLatex'),
        domain: document.getElementById('logDomainLatex'),
        monotonic: document.getElementById('logMonotonicLatex'),
        equivalent: document.getElementById('logEquivalentLatex'),
        algebraic: document.getElementById('logAlgebraicLatex'),
        solution: document.getElementById('logSolutionLatex'),
        sample: document.getElementById('logSampleLatex'),
        steps: document.getElementById('logSteps'),
        graphCanvas: document.getElementById('logGraphCanvas'),
        numberCanvas: document.getElementById('logNumberCanvas')
    };

    if (!controls.op || !display.graphCanvas || !display.numberCanvas) return;

    function update() {
        const op = controls.op.value;
        const base = Number(controls.base.value);
        const m = Number(controls.m.value);
        const nCoef = Number(controls.n.value);
        const p = Number(controls.p.value);

        display.m.textContent = fmt(m);
        display.n.textContent = fmt(nCoef);
        display.p.textContent = fmt(p);

        const solved = solveLogModel(base, m, nCoef, op, p);
        const argument = linearLatex(m, nCoef);
        const logExpr = `\\log_{${baseTex(base)}}\\left(${argument}\\right)`;

        display.expr.innerHTML = `\\(${logExpr} ${opTex(op)} ${fmt(p)}\\)`;
        display.domain.innerHTML = `\\(${intervalsToLatex(solved.domain.intervals)}\\)`;
        display.monotonic.innerHTML = solved.monotonicity;
        display.equivalent.innerHTML = `\\(${argument} ${opTex(solved.transformedOp)} ${fmt(solved.target)}\\)`;
        display.algebraic.innerHTML = `\\(${intervalsToLatex(solved.algebraic.intervals)}\\)`;
        display.solution.innerHTML = `\\(${intervalsToLatex(solved.solution)}\\)`;
        display.sample.innerHTML = sampleIntegers(solved.solution);

        const steps = [
            `Definiční obor: \\(${argument}>0\\).`,
            base > 1
                ? `Protože ${fmt(base)} > 1, logaritmus je rostoucí.`
                : `Protože \\(0<${fmt(base)}<1\\), logaritmus je klesající.`,
            `Bez logaritmu: \\(${argument} ${opTex(solved.transformedOp)} ${fmt(solved.target)}\\).`,
            `Algebraická část: \\(${intervalsToLatex(solved.algebraic.intervals)}\\).`,
            `Průnik s definičním oborem: \\(${intervalsToLatex(solved.solution)}\\).`
        ];
        display.steps.innerHTML = steps.map((step, index) => `<div class="step-item">${index + 1}. ${step}</div>`).join('');

        drawLogModelGraph(display.graphCanvas, base, m, nCoef, p);
        drawIntervalCanvas(display.numberCanvas, [
            { label: 'D(f)', intervals: solved.domain.intervals, color: '#3b82f6' },
            { label: 'Algebra', intervals: solved.algebraic.intervals, color: '#f59e0b' },
            { label: 'Řešení', intervals: solved.solution, color: '#8b5cf6' }
        ]);

        typeset(document.getElementById('logaritmicke-nerovnice'));
    }

    Object.values(controls).forEach(control => control.addEventListener('input', update));
    update();
}
