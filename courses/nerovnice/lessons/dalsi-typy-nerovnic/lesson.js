// Dalsi typy nerovnic - interactive lesson

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initNavbarScroll();
    initProductPlayground();
    initRationalPlayground();
    initPowerPlayground();
    initAbsolutePlayground();
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
        'nerovnice-v-soucinovem-tvaru',
        'nerovnice-v-podilovem-tvaru',
        'nerovnice-vyssich-mocnin',
        'nerovnice-s-absolutni-hodnotou',
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

function sanitizeNonZeroRange(control, fallback = 1) {
    let value = Number(control.value);
    if (Math.abs(value) < EPS) {
        value = fallback;
        control.value = String(value);
    }
    return value;
}

function uniqueSorted(values) {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted.filter((value, index) => index === 0 || !approxEqual(value, sorted[index - 1]));
}

function pointSetLatex(values) {
    const unique = uniqueSorted(values);
    if (unique.length === 0) return '\\emptyset';
    return `\\{${unique.map(value => fmt(value)).join(',\\;')}\\}`;
}

function intervalOpenLatex(left, right) {
    const leftText = left === -Infinity ? '-\\infty' : fmt(left);
    const rightText = right === Infinity ? '\\infty' : fmt(right);
    return `(${leftText},${rightText})`;
}

function mergeFactors(factors) {
    const cleaned = factors
        .filter(f => Number.isFinite(f.root) && Number.isFinite(f.mult) && f.mult > 0)
        .map(f => ({ root: Number(f.root), mult: Math.round(Number(f.mult)) }))
        .sort((a, b) => a.root - b.root);

    const merged = [];
    cleaned.forEach(factor => {
        const last = merged[merged.length - 1];
        if (last && approxEqual(last.root, factor.root)) {
            last.mult += factor.mult;
        } else {
            merged.push({ ...factor });
        }
    });

    return merged;
}

function formatFactor(root, mult = 1) {
    const base = approxEqual(root, 0)
        ? 'x'
        : (root > 0 ? `x-${fmt(root)}` : `x+${fmt(-root)}`);

    if (mult === 1) return `(${base})`;
    return `(${base})^{${mult}}`;
}

function factorProductLatex(factors) {
    if (!factors.length) return '1';
    return factors.map(factor => formatFactor(factor.root, factor.mult)).join('');
}

function combineCoefficientAndFactors(coef, factors) {
    if (!factors.length) return fmt(coef);
    const product = factorProductLatex(factors);
    if (approxEqual(coef, 1)) return product;
    if (approxEqual(coef, -1)) return `-${product}`;
    return `${fmt(coef)}${product}`;
}

function factorizedInequalityLatex(coef, numeratorFactors, denominatorFactors, op) {
    if (!denominatorFactors.length) {
        return `${combineCoefficientAndFactors(coef, numeratorFactors)} ${opTex(op)} 0`;
    }
    const numerator = combineCoefficientAndFactors(coef, numeratorFactors);
    const denominator = factorProductLatex(denominatorFactors);
    return `\\frac{${numerator}}{${denominator}} ${opTex(op)} 0`;
}

function chooseSample(left, right) {
    if (left === -Infinity && right === Infinity) return 0;
    if (left === -Infinity) return right - 1;
    if (right === Infinity) return left + 1;
    return (left + right) / 2;
}

function signAtSample(sample, coef, numeratorFactors, denominatorFactors) {
    if (Math.abs(coef) < EPS) return 0;

    let sign = coef > 0 ? 1 : -1;

    numeratorFactors.forEach(factor => {
        if (approxEqual(sample, factor.root)) {
            sign = 0;
            return;
        }
        if (factor.mult % 2 !== 0 && sample < factor.root) sign *= -1;
    });

    denominatorFactors.forEach(factor => {
        if (approxEqual(sample, factor.root)) {
            sign = Number.NaN;
            return;
        }
        if (factor.mult % 2 !== 0 && sample < factor.root) sign *= -1;
    });

    return sign;
}

function analyzeSign(coef, numeratorFactors, denominatorFactors) {
    const critical = [];

    function upsert(root, key, mult) {
        let target = critical.find(point => approxEqual(point.x, root));
        if (!target) {
            target = { x: root, zeroMult: 0, poleMult: 0 };
            critical.push(target);
        }
        target[key] += mult;
    }

    numeratorFactors.forEach(factor => upsert(factor.root, 'zeroMult', factor.mult));
    denominatorFactors.forEach(factor => upsert(factor.root, 'poleMult', factor.mult));
    critical.sort((a, b) => a.x - b.x);

    const boundaries = [-Infinity, ...critical.map(point => point.x), Infinity];
    const positiveIntervals = [];
    const negativeIntervals = [];
    const segments = [];

    for (let i = 0; i < boundaries.length - 1; i += 1) {
        const left = boundaries[i];
        const right = boundaries[i + 1];
        const sample = chooseSample(left, right);
        const sign = signAtSample(sample, coef, numeratorFactors, denominatorFactors);

        segments.push({ left, right, sign });

        const interval = { l: left, r: right, lc: false, rc: false };
        if (sign > 0) positiveIntervals.push(interval);
        if (sign < 0) negativeIntervals.push(interval);
    }

    const zeros = critical.filter(point => point.zeroMult > 0 && point.poleMult === 0).map(point => point.x);
    const poles = critical.filter(point => point.poleMult > 0).map(point => point.x);

    return {
        critical,
        segments,
        positiveIntervals: normalizeIntervals(positiveIntervals),
        negativeIntervals: normalizeIntervals(negativeIntervals),
        zeros: uniqueSorted(zeros),
        poles: uniqueSorted(poles)
    };
}

function segmentSignLatex(segments) {
    if (!segments.length) return '\\text{bez intervalů}';
    const parts = segments.map(segment => `${intervalOpenLatex(segment.left, segment.right)}:${segment.sign > 0 ? '+' : '-'}`);
    return parts.join(',\\;');
}

function solutionFromAnalysis(analysis, op) {
    const base = (op === 'gt' || op === 'ge') ? analysis.positiveIntervals : analysis.negativeIntervals;
    const includeZero = op === 'le' || op === 'ge';
    const intervals = base.map(interval => ({ ...interval }));

    if (includeZero) {
        analysis.zeros.forEach(value => intervals.push({ l: value, r: value, lc: true, rc: true }));
    }

    return normalizeIntervals(intervals);
}

function cloneInterval(interval) {
    return { l: interval.l, r: interval.r, lc: interval.lc, rc: interval.rc };
}

function normalizeIntervals(intervals) {
    if (!intervals || intervals.length === 0) return [];

    const valid = intervals
        .map(cloneInterval)
        .filter(interval => interval.l < interval.r || (approxEqual(interval.l, interval.r) && interval.lc && interval.rc));

    if (valid.length === 0) return [];

    const sorted = valid.sort((a, b) => {
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

        const touching = (current.l === last.r || (Number.isFinite(current.l) && Number.isFinite(last.r) && approxEqual(current.l, last.r)));
        const overlap = last.r === Infinity || current.l < last.r || (touching && (last.rc || current.lc));

        if (!overlap) {
            merged.push(current);
            continue;
        }

        const currentExtendsRight = current.r > last.r;
        const sameRight = current.r === last.r || (Number.isFinite(current.r) && Number.isFinite(last.r) && approxEqual(current.r, last.r));

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
    if (values.length === 0) return 'žádná celá hodnota v intervalu [-12,12]';
    return `\\(${values.slice(0, 8).join(',\\;')}\\)`;
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

function solveLinearInequality(b, c, op) {
    const steps = [];

    if (Math.abs(b) < EPS) {
        const holds = compareValues(c, op, 0);
        steps.push(`\\(${latexPoly(0, b, c)} ${opTex(op)} 0\\) je konstantní tvrzení.`);
        steps.push(holds ? 'Tvrzení je pravdivé pro všechna reálná čísla.' : 'Tvrzení je nepravdivé pro všechna reálná čísla.');

        return {
            mode: 'constant',
            intervals: holds ? [{ l: -Infinity, r: Infinity, lc: false, rc: false }] : [],
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
        intervals: finalOp === 'lt'
            ? [{ l: -Infinity, r: boundary, lc: false, rc: false }]
            : finalOp === 'le'
                ? [{ l: -Infinity, r: boundary, lc: false, rc: true }]
                : finalOp === 'gt'
                    ? [{ l: boundary, r: Infinity, lc: false, rc: false }]
                    : [{ l: boundary, r: Infinity, lc: true, rc: false }],
        roots: [boundary],
        discriminant: null,
        steps
    };
}

function constantSignIntervals(sign, op) {
    if (sign > 0) {
        if (op === 'gt' || op === 'ge') return [{ l: -Infinity, r: Infinity, lc: false, rc: false }];
        return [];
    }
    if (op === 'lt' || op === 'le') return [{ l: -Infinity, r: Infinity, lc: false, rc: false }];
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
            if (op === 'ge') intervals = [{ l: -Infinity, r: Infinity, lc: false, rc: false }];
            if (op === 'lt') intervals = [];
            if (op === 'le') intervals = [{ l: x0, r: x0, lc: true, rc: true }];
        } else {
            if (op === 'gt') intervals = [];
            if (op === 'ge') intervals = [{ l: x0, r: x0, lc: true, rc: true }];
            if (op === 'lt') intervals = normalizeIntervals([{ l: -Infinity, r: x0, lc: false, rc: false }, { l: x0, r: Infinity, lc: false, rc: false }]);
            if (op === 'le') intervals = [{ l: -Infinity, r: Infinity, lc: false, rc: false }];
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
        result.intervals = [{ l: -Infinity, r: Infinity, lc: false, rc: false }];
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
        ? 'Vyřešíme obě podmínky a vezmeme jejich průnik.'
        : 'Vyřešíme obě podmínky a vezmeme jejich sjednocení.');
    result.steps.push(`Výsledek: \\(${intervalsToLatex(result.intervals)}\\).`);

    return result;
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

function initProductPlayground() {
    const controls = {
        op: document.getElementById('productOperator'),
        a: document.getElementById('productA'),
        r1: document.getElementById('productR1'),
        r2: document.getElementById('productR2'),
        r3: document.getElementById('productR3')
    };

    const display = {
        a: document.getElementById('productAValue'),
        r1: document.getElementById('productR1Value'),
        r2: document.getElementById('productR2Value'),
        r3: document.getElementById('productR3Value'),
        expr: document.getElementById('productExprLatex'),
        critical: document.getElementById('productCriticalLatex'),
        sign: document.getElementById('productSignLatex'),
        solution: document.getElementById('productSolutionLatex'),
        sample: document.getElementById('productSampleLatex'),
        steps: document.getElementById('productSteps'),
        canvas: document.getElementById('productNumberCanvas')
    };

    if (!controls.op || !display.canvas) return;

    function update() {
        const op = controls.op.value;
        const a = sanitizeNonZeroRange(controls.a, 1);
        const r1 = Number(controls.r1.value);
        const r2 = Number(controls.r2.value);
        const r3 = Number(controls.r3.value);

        display.a.textContent = fmt(a);
        display.r1.textContent = fmt(r1);
        display.r2.textContent = fmt(r2);
        display.r3.textContent = fmt(r3);

        const factors = mergeFactors([
            { root: r1, mult: 1 },
            { root: r2, mult: 1 },
            { root: r3, mult: 1 }
        ]);

        const analysis = analyzeSign(a, factors, []);
        const solution = solutionFromAnalysis(analysis, op);

        display.expr.innerHTML = `\\(${factorizedInequalityLatex(a, factors, [], op)}\\)`;
        display.critical.innerHTML = `\\(${pointSetLatex(analysis.zeros)}\\)`;
        display.sign.innerHTML = `\\(${segmentSignLatex(analysis.segments)}\\)`;
        display.solution.innerHTML = `\\(${intervalsToLatex(solution)}\\)`;
        display.sample.innerHTML = sampleIntegers(solution);

        const steps = [
            `Kritické body jsou kořeny faktorů: \\(${pointSetLatex(analysis.zeros)}\\).`,
            `Na intervalech mezi kritickými body určíme znaménko součinu.`,
            (op === 'lt' || op === 'le')
                ? 'Hledáme záporné části; u \\(\\le\\) přidáme i nulové body.'
                : 'Hledáme kladné části; u \\(\\ge\\) přidáme i nulové body.'
        ];
        display.steps.innerHTML = steps.map((step, index) => `<div class="step-item">${index + 1}. ${step}</div>`).join('');

        drawIntervalCanvas(display.canvas, [
            { label: 'f(x)>0', intervals: analysis.positiveIntervals, color: '#10b981' },
            { label: 'f(x)<0', intervals: analysis.negativeIntervals, color: '#ef4444' },
            { label: 'Řešení', intervals: solution, color: '#6366f1' }
        ]);

        typeset(document.getElementById('nerovnice-v-soucinovem-tvaru'));
    }

    Object.values(controls).forEach(control => control.addEventListener('input', update));
    update();
}

function initRationalPlayground() {
    const controls = {
        op: document.getElementById('rationalOperator'),
        a: document.getElementById('rationalA'),
        n1: document.getElementById('rationalN1'),
        n2: document.getElementById('rationalN2'),
        d1: document.getElementById('rationalD1'),
        d2: document.getElementById('rationalD2')
    };

    const display = {
        a: document.getElementById('rationalAValue'),
        n1: document.getElementById('rationalN1Value'),
        n2: document.getElementById('rationalN2Value'),
        d1: document.getElementById('rationalD1Value'),
        d2: document.getElementById('rationalD2Value'),
        expr: document.getElementById('rationalExprLatex'),
        domain: document.getElementById('rationalDomainLatex'),
        critical: document.getElementById('rationalCriticalLatex'),
        sign: document.getElementById('rationalSignLatex'),
        solution: document.getElementById('rationalSolutionLatex'),
        sample: document.getElementById('rationalSampleLatex'),
        steps: document.getElementById('rationalSteps'),
        canvas: document.getElementById('rationalNumberCanvas')
    };

    if (!controls.op || !display.canvas) return;

    function update() {
        const op = controls.op.value;
        const a = sanitizeNonZeroRange(controls.a, 1);
        const n1 = Number(controls.n1.value);
        const n2 = Number(controls.n2.value);
        const d1 = Number(controls.d1.value);
        const d2 = Number(controls.d2.value);

        display.a.textContent = fmt(a);
        display.n1.textContent = fmt(n1);
        display.n2.textContent = fmt(n2);
        display.d1.textContent = fmt(d1);
        display.d2.textContent = fmt(d2);

        const numeratorFactors = mergeFactors([
            { root: n1, mult: 1 },
            { root: n2, mult: 1 }
        ]);
        const denominatorFactors = mergeFactors([
            { root: d1, mult: 1 },
            { root: d2, mult: 1 }
        ]);

        const analysis = analyzeSign(a, numeratorFactors, denominatorFactors);
        const solution = solutionFromAnalysis(analysis, op);
        const allCritical = uniqueSorted([...analysis.zeros, ...analysis.poles]);
        const domain = analysis.poles.length
            ? `\\mathbb{R}\\setminus${pointSetLatex(analysis.poles)}`
            : '\\mathbb{R}';

        display.expr.innerHTML = `\\(${factorizedInequalityLatex(a, numeratorFactors, denominatorFactors, op)}\\)`;
        display.domain.innerHTML = `\\(${domain}\\)`;
        display.critical.innerHTML = `\\(\\text{nuly: }${pointSetLatex(analysis.zeros)},\\;\\text{póly: }${pointSetLatex(analysis.poles)}\\)`;
        display.sign.innerHTML = `\\(${segmentSignLatex(analysis.segments)}\\)`;
        display.solution.innerHTML = `\\(${intervalsToLatex(solution)}\\)`;
        display.sample.innerHTML = sampleIntegers(solution);

        const steps = [
            `Definiční obor: \\(${domain}\\).`,
            `Kritické body: \\(${pointSetLatex(allCritical)}\\).`,
            `Nulové body čitatele lze u neostrých nerovnic zahrnout, póly nikdy.`,
            (op === 'lt' || op === 'le')
                ? 'Vybereme záporné intervaly podílu.'
                : 'Vybereme kladné intervaly podílu.'
        ];
        display.steps.innerHTML = steps.map((step, index) => `<div class="step-item">${index + 1}. ${step}</div>`).join('');

        drawIntervalCanvas(display.canvas, [
            { label: 'f(x)>0', intervals: analysis.positiveIntervals, color: '#10b981' },
            { label: 'f(x)<0', intervals: analysis.negativeIntervals, color: '#ef4444' },
            { label: 'Řešení', intervals: solution, color: '#6366f1' }
        ]);

        typeset(document.getElementById('nerovnice-v-podilovem-tvaru'));
    }

    Object.values(controls).forEach(control => control.addEventListener('input', update));
    update();
}

function buildRootBehaviorText(criticalPoints) {
    const roots = criticalPoints.filter(point => point.zeroMult > 0 && point.poleMult === 0);
    if (!roots.length) return 'Žádné kořeny: znaménko je konstantní na celé ose.';

    return roots.map(point => {
        const odd = point.zeroMult % 2 === 1;
        return `x=${fmt(point.x)}: ${odd ? 'lichá' : 'sudá'} násobnost ${point.zeroMult} → ${odd ? 'znaménko se mění' : 'znaménko se nemění'}`;
    }).join('<br>');
}

function initPowerPlayground() {
    const controls = {
        op: document.getElementById('powerOperator'),
        a: document.getElementById('powerA'),
        r1: document.getElementById('powerR1'),
        m1: document.getElementById('powerM1'),
        r2: document.getElementById('powerR2'),
        m2: document.getElementById('powerM2')
    };

    const display = {
        a: document.getElementById('powerAValue'),
        r1: document.getElementById('powerR1Value'),
        r2: document.getElementById('powerR2Value'),
        expr: document.getElementById('powerExprLatex'),
        critical: document.getElementById('powerCriticalLatex'),
        behavior: document.getElementById('powerBehaviorLatex'),
        sign: document.getElementById('powerSignLatex'),
        solution: document.getElementById('powerSolutionLatex'),
        sample: document.getElementById('powerSampleLatex'),
        steps: document.getElementById('powerSteps'),
        canvas: document.getElementById('powerNumberCanvas')
    };

    if (!controls.op || !display.canvas) return;

    function update() {
        const op = controls.op.value;
        const a = sanitizeNonZeroRange(controls.a, 1);
        const r1 = Number(controls.r1.value);
        const r2 = Number(controls.r2.value);
        const m1 = Number(controls.m1.value);
        const m2 = Number(controls.m2.value);

        display.a.textContent = fmt(a);
        display.r1.textContent = fmt(r1);
        display.r2.textContent = fmt(r2);

        const factors = mergeFactors([
            { root: r1, mult: m1 },
            { root: r2, mult: m2 }
        ]);

        const analysis = analyzeSign(a, factors, []);
        const solution = solutionFromAnalysis(analysis, op);

        display.expr.innerHTML = `\\(${factorizedInequalityLatex(a, factors, [], op)}\\)`;
        display.critical.innerHTML = `\\(${pointSetLatex(analysis.zeros)}\\)`;
        display.behavior.innerHTML = buildRootBehaviorText(analysis.critical);
        display.sign.innerHTML = `\\(${segmentSignLatex(analysis.segments)}\\)`;
        display.solution.innerHTML = `\\(${intervalsToLatex(solution)}\\)`;
        display.sample.innerHTML = sampleIntegers(solution);

        const steps = [
            `Rozklad: \\(${combineCoefficientAndFactors(a, factors)}\\).`,
            'Parita násobnosti určí, zda se v kořeni mění znaménko.',
            (op === 'lt' || op === 'le')
                ? 'Vybereme záporné intervaly, u neostré nerovnosti přidáme kořeny.'
                : 'Vybereme kladné intervaly, u neostré nerovnosti přidáme kořeny.'
        ];
        display.steps.innerHTML = steps.map((step, index) => `<div class="step-item">${index + 1}. ${step}</div>`).join('');

        drawIntervalCanvas(display.canvas, [
            { label: 'f(x)>0', intervals: analysis.positiveIntervals, color: '#10b981' },
            { label: 'f(x)<0', intervals: analysis.negativeIntervals, color: '#ef4444' },
            { label: 'Řešení', intervals: solution, color: '#6366f1' }
        ]);

        typeset(document.getElementById('nerovnice-vyssich-mocnin'));
    }

    Object.values(controls).forEach(control => control.addEventListener('input', update));
    update();
}

function initAbsolutePlayground() {
    const controls = {
        op: document.getElementById('absOperator'),
        r1: document.getElementById('absR1'),
        r2: document.getElementById('absR2'),
        k: document.getElementById('absK')
    };

    const display = {
        r1: document.getElementById('absR1Value'),
        r2: document.getElementById('absR2Value'),
        k: document.getElementById('absKValue'),
        expr: document.getElementById('absExprLatex'),
        equivalent: document.getElementById('absEquivalentLatex'),
        caseA: document.getElementById('absCaseALatex'),
        caseB: document.getElementById('absCaseBLatex'),
        solution: document.getElementById('absSolutionLatex'),
        steps: document.getElementById('absSteps'),
        graphCanvas: document.getElementById('absGraphCanvas'),
        numberCanvas: document.getElementById('absNumberCanvas')
    };

    if (!controls.op || !display.graphCanvas || !display.numberCanvas) return;

    function update() {
        const op = controls.op.value;
        const r1 = Number(controls.r1.value);
        const r2 = Number(controls.r2.value);
        const k = Number(controls.k.value);

        display.r1.textContent = fmt(r1);
        display.r2.textContent = fmt(r2);
        display.k.textContent = fmt(k);

        const factors = mergeFactors([
            { root: r1, mult: 1 },
            { root: r2, mult: 1 }
        ]);
        const b = -(r1 + r2);
        const c = r1 * r2;

        const solved = solveAbsoluteQuadratic(1, b, c, op, k);

        display.expr.innerHTML = `\\(\\left|${factorProductLatex(factors)}\\right| ${opTex(op)} ${fmt(k)}\\)`;
        display.equivalent.innerHTML = `\\(${solved.equivalent}\\)`;
        display.solution.innerHTML = `\\(${intervalsToLatex(solved.intervals)}\\)`;

        if (solved.cases.length === 2) {
            display.caseA.innerHTML = `\\(${solved.cases[0].text}\\Rightarrow ${intervalsToLatex(solved.cases[0].solved.intervals)}\\)`;
            display.caseB.innerHTML = `\\(${solved.cases[1].text}\\Rightarrow ${intervalsToLatex(solved.cases[1].solved.intervals)}\\)`;
        } else {
            display.caseA.innerHTML = '\\(\\text{speciální případ}\\)';
            display.caseB.innerHTML = `\\(${intervalsToLatex(solved.intervals)}\\)`;
        }

        display.steps.innerHTML = solved.steps.map((step, index) => `<div class="step-item">${index + 1}. ${step}</div>`).join('');

        drawQuadraticPlot(display.graphCanvas, 1, b, c, { roots: uniqueSorted([r1, r2]), k });

        const rows = [];
        if (solved.cases.length === 2) {
            rows.push({ label: 'A', intervals: solved.cases[0].solved.intervals, color: '#3b82f6' });
            rows.push({ label: 'B', intervals: solved.cases[1].solved.intervals, color: '#f59e0b' });
        }
        rows.push({ label: 'Řešení', intervals: solved.intervals, color: '#8b5cf6' });
        drawIntervalCanvas(display.numberCanvas, rows);

        typeset(document.getElementById('nerovnice-s-absolutni-hodnotou'));
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
            correct: '\\(( -\\infty,-1]\\cup[2,4]\\)',
            explanation: 'Kořeny jsou \\(-1,2,4\\). Součin tří lineárních faktorů je \\(\\le0\\) na intervalech \\(( -\\infty,-1]\\) a \\([2,4]\\).'
        },
        2: {
            correct: '\\((1,\\infty)\\)',
            explanation: 'Faktor \\((x+3)^2\\ge0\\) pouze vynuluje výraz v \\(-3\\), znaménko určuje \\((x-1)\\). Pro \\(>0\\) vyjde \\(x>1\\).'
        },
        3: {
            correct: '\\(( -\\infty,-3)\\cup(-1,2)\\cup(4,\\infty)\\)',
            explanation: 'Kritické body jsou \\(-3,-1,2,4\\), přičemž \\(-3\\) a \\(4\\) jsou póly. Pro ostrou nerovnost body \\(-1\\) a \\(2\\) také nepatří.'
        },
        4: {
            correct: '\\(\\mathbb{R}\\setminus\\{5\\}\\)',
            explanation: 'Mimo bod \\(x=5\\) je výraz roven 1, tedy splňuje \\(\\ge0\\). V bodě \\(x=5\\) není definován.'
        },
        5: {
            correct: '\\([-2,-1]\\cup[1,2]\\)',
            explanation: 'Substituce \\(t=x^2\\): \\(t^2-5t+4\\le0\\Rightarrow t\\in[1,4]\\). Po zpětné substituci \\(x\\in[-2,-1]\\cup[1,2]\\).'
        },
        6: {
            correct: '\\(( -\\infty,-2)\\)',
            explanation: 'Faktor \\((x-1)^4\\ge0\\), znaménko určuje \\((x+2)^3\\). Pro \\(<0\\) musí platit \\(x<-2\\).'
        },
        7: {
            correct: '\\(\\{-1,1\\}\\)',
            explanation: '\\(|A(x)|\\le0\\iff A(x)=0\\). Tedy \\((x-1)(x+1)=0\\Rightarrow x\\in\\{-1,1\\}.'
        },
        8: {
            correct: '\\(( -\\infty,2-\\sqrt3)\\cup(2+\\sqrt3,\\infty)\\)',
            explanation: '\\(|x^2-4x+3|>2\\iff x^2-4x+3>2\\) nebo \\(<-2\\). Druhá podmínka nemá řešení, z první vyjde interval mimo kořeny \\(2\\pm\\sqrt3\\).'
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
