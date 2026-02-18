// Lineární nerovnice - interactive lesson

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initNavbarScroll();
    initLinearPlayground();
    initCompoundPlayground();
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
        'linearni-nerovnice',
        'linearni-nerovnice-s-vice-podminkami',
        'linearni-nerovnice-s-absolutni-hodnotou',
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
            || (Math.abs(current.l - last.r) < EPS && (last.rc || current.lc));

        if (!overlap) {
            merged.push(current);
            continue;
        }

        const currentExtendsRight = current.r > last.r;
        const sameRight = Math.abs(current.r - last.r) < EPS;

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

            if (l < r || (Math.abs(l - r) < EPS && lc && rc)) {
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
        if (Math.abs(interval.l - interval.r) < EPS && interval.lc && interval.rc) {
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
    const leftOk = interval.l === -Infinity || value > interval.l || (Math.abs(value - interval.l) < EPS && interval.lc);
    const rightOk = interval.r === Infinity || value < interval.r || (Math.abs(value - interval.r) < EPS && interval.rc);
    return leftOk && rightOk;
}

function sampleIntegers(intervals) {
    const values = [];
    for (let x = -10; x <= 10; x += 1) {
        if (intervals.some(interval => inInterval(x, interval))) values.push(x);
    }

    if (values.length === 0) return 'žádná celá hodnota v intervalu [-10,10]';
    return `\\(${values.slice(0, 6).join(',\\;')}\\)`;
}

function latexLinearExpr(a, b) {
    if (Math.abs(a) < EPS) return fmt(b);

    let expr;
    if (Math.abs(a - 1) < EPS) expr = 'x';
    else if (Math.abs(a + 1) < EPS) expr = '-x';
    else expr = `${fmt(a)}x`;

    if (b > 0) expr += `+${fmt(b)}`;
    if (b < 0) expr += `${fmt(b)}`;
    return expr;
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
            ctx.strokeStyle = 'rgba(255,255,255,0.17)';
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
                ctx.moveTo(leftX, y); ctx.lineTo(leftX + 10, y - 6); ctx.moveTo(leftX, y); ctx.lineTo(leftX + 10, y + 6); ctx.stroke();
            }
            if (interval.r === Infinity) {
                ctx.beginPath();
                ctx.moveTo(rightX, y); ctx.lineTo(rightX - 10, y - 6); ctx.moveTo(rightX, y); ctx.lineTo(rightX - 10, y + 6); ctx.stroke();
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
                    ctx.lineWidth = 2.5;
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
                    ctx.lineWidth = 2.5;
                    ctx.strokeStyle = row.color;
                    ctx.stroke();
                }
            }
        });
    });
}

function initLinearPlayground() {
    const controls = {
        op: document.getElementById('linearOperator'),
        a: document.getElementById('linearA'),
        b: document.getElementById('linearB'),
        c: document.getElementById('linearC')
    };

    const display = {
        a: document.getElementById('linearAValue'),
        b: document.getElementById('linearBValue'),
        c: document.getElementById('linearCValue'),
        ineq: document.getElementById('linearInequalityLatex'),
        result: document.getElementById('linearSolutionLatex'),
        interval: document.getElementById('linearIntervalLatex'),
        sample: document.getElementById('linearSampleLatex'),
        steps: document.getElementById('linearSteps'),
        canvas: document.getElementById('linearCanvas')
    };

    if (!controls.op || !controls.a || !display.canvas) return;

    function update() {
        const a = Number(controls.a.value);
        const b = Number(controls.b.value);
        const c = Number(controls.c.value);
        const op = controls.op.value;

        display.a.textContent = String(a);
        display.b.textContent = String(b);
        display.c.textContent = String(c);

        display.ineq.innerHTML = `\\(${latexLinearExpr(a, b)} ${opTex(op)} ${fmt(c)}\\)`;

        let intervals;
        let resultText;
        let steps = [];

        if (Math.abs(a) < EPS) {
            const truth = compareValues(b, op, c);
            intervals = truth ? [{ l: -Infinity, r: Infinity, lc: false, rc: false }] : [];
            resultText = truth ? '\\(x\\in\\mathbb{R}\\)' : '\\(\\emptyset\\)';
            steps = [
                `\\(${latexLinearExpr(a, b)} ${opTex(op)} ${fmt(c)}\\)`,
                `\\(${fmt(b)} ${opTex(op)} ${fmt(c)}\\)`,
                truth ? 'Výrok je pravdivý pro všechna \(x\).' : 'Výrok je nepravdivý, proto řešení neexistuje.'
            ];
        } else {
            const rhs = c - b;
            const finalOp = a < 0 ? flipOp(op) : op;
            const threshold = rhs / a;
            intervals = intervalFromCondition(finalOp, threshold);
            resultText = `\\(x ${opTex(finalOp)} ${fmt(threshold)}\\)`;

            steps = [
                `\\(${latexLinearExpr(a, b)} ${opTex(op)} ${fmt(c)}\\)`,
                `\\(${latexLinearExpr(a, 0)} ${opTex(op)} ${fmt(rhs)}\\)`,
                a < 0
                    ? `Dělení \(${fmt(a)}\) obrací znaménko: ${resultText}`
                    : `Dělení \(${fmt(a)}\) znaménko nemění: ${resultText}`
            ];
        }

        display.result.innerHTML = resultText;
        display.interval.innerHTML = `\\(${intervalsToLatex(intervals)}\\)`;
        display.sample.innerHTML = sampleIntegers(intervals);
        display.steps.innerHTML = steps.map(step => `<div class="step-item">${step}</div>`).join('');

        drawIntervalCanvas(display.canvas, [{ label: 'Řešení', intervals, color: '#6366f1' }]);
        typeset(document.getElementById('linearni-nerovnice'));
    }

    Object.values(controls).forEach(control => control.addEventListener('input', update));
    update();
}
function initCompoundPlayground() {
    const controls = {
        connector: document.getElementById('compoundConnector'),
        op1: document.getElementById('compOp1'),
        val1: document.getElementById('compVal1'),
        op2: document.getElementById('compOp2'),
        val2: document.getElementById('compVal2')
    };

    const display = {
        val1: document.getElementById('compVal1Display'),
        val2: document.getElementById('compVal2Display'),
        cond1: document.getElementById('compCond1Latex'),
        cond2: document.getElementById('compCond2Latex'),
        result: document.getElementById('compResultLatex'),
        interval: document.getElementById('compResultInterval'),
        note: document.getElementById('compInterpretation'),
        canvas: document.getElementById('compoundCanvas')
    };

    if (!controls.connector || !display.canvas) return;

    function update() {
        const op1 = controls.op1.value;
        const v1 = Number(controls.val1.value);
        const op2 = controls.op2.value;
        const v2 = Number(controls.val2.value);
        const connector = controls.connector.value;

        display.val1.textContent = String(v1);
        display.val2.textContent = String(v2);

        const intervalsA = intervalFromCondition(op1, v1);
        const intervalsB = intervalFromCondition(op2, v2);

        const combined = connector === 'and'
            ? intersectIntervals(intervalsA, intervalsB)
            : normalizeIntervals([...intervalsA, ...intervalsB]);

        display.cond1.innerHTML = `\\(x ${opTex(op1)} ${fmt(v1)}\\)`;
        display.cond2.innerHTML = `\\(x ${opTex(op2)} ${fmt(v2)}\\)`;
        display.result.innerHTML = connector === 'and' ? '\\(A\\cap B\\)' : '\\(A\\cup B\\)';
        display.interval.innerHTML = `\\(${intervalsToLatex(combined)}\\)`;

        if (combined.length === 0) {
            display.note.textContent = 'Výsledek je prázdná množina: podmínky jsou v konfliktu.';
        } else if (isAllReals(combined)) {
            display.note.textContent = 'Výsledek pokrývá všechna reálná čísla.';
        } else {
            display.note.textContent = connector === 'and'
                ? 'Průnik ponechá jen čísla, která splní obě podmínky současně.'
                : 'Sjednocení vezme všechna čísla, která splní aspoň jednu podmínku.';
        }

        drawIntervalCanvas(display.canvas, [
            { label: 'A', intervals: intervalsA, color: '#3b82f6' },
            { label: 'B', intervals: intervalsB, color: '#f59e0b' },
            { label: 'Výsledek', intervals: combined, color: '#8b5cf6' }
        ]);

        typeset(document.getElementById('linearni-nerovnice-s-vice-podminkami'));
    }

    Object.values(controls).forEach(control => control.addEventListener('input', update));
    update();
}

function absCoreExpr(center) {
    if (Math.abs(center) < EPS) return '|x|';
    if (center > 0) return `|x-${fmt(center)}|`;
    return `|x+${fmt(-center)}|`;
}

function solveAbsolute(center, radius, op) {
    const m = center;
    const r = radius;

    if (op === 'lt') {
        if (r <= 0) {
            return {
                intervals: [],
                equivalent: '\\emptyset',
                note: 'Absolutní hodnota je vždy nezáporná, proto menší než nekladné číslo být nemůže.'
            };
        }
        return {
            intervals: [{ l: m - r, r: m + r, lc: false, rc: false }],
            equivalent: `${fmt(m - r)}<x<${fmt(m + r)}`,
            note: 'Řešení leží uvnitř otevřeného intervalu kolem středu.'
        };
    }

    if (op === 'le') {
        if (r < 0) {
            return {
                intervals: [],
                equivalent: '\\emptyset',
                note: 'Podmínka \\(|A(x)|\\le r\\) pro \\(r<0\\) je nemožná.'
            };
        }
        if (Math.abs(r) < EPS) {
            return {
                intervals: [{ l: m, r: m, lc: true, rc: true }],
                equivalent: `x=${fmt(m)}`,
                note: 'Vzdálenost může být nejvýše 0 jen v jediném bodě.'
            };
        }
        return {
            intervals: [{ l: m - r, r: m + r, lc: true, rc: true }],
            equivalent: `${fmt(m - r)}\\le x\\le ${fmt(m + r)}`,
            note: 'Řešení je uzavřený interval kolem středu.'
        };
    }

    if (op === 'gt') {
        if (r < 0) {
            return {
                intervals: [{ l: -Infinity, r: Infinity, lc: false, rc: false }],
                equivalent: '\\mathbb{R}',
                note: 'Absolutní hodnota je vždy větší než záporné číslo.'
            };
        }
        if (Math.abs(r) < EPS) {
            return {
                intervals: normalizeIntervals([{ l: -Infinity, r: m, lc: false, rc: false }, { l: m, r: Infinity, lc: false, rc: false }]),
                equivalent: `x\\neq ${fmt(m)}`,
                note: 'Vzdálenost větší než 0 znamená všechny body kromě středu.'
            };
        }
        return {
            intervals: normalizeIntervals([{ l: -Infinity, r: m - r, lc: false, rc: false }, { l: m + r, r: Infinity, lc: false, rc: false }]),
            equivalent: `x<${fmt(m - r)}\\;\\text{nebo}\\;x>${fmt(m + r)}`,
            note: 'Řešení je mimo otevřený interval kolem středu.'
        };
    }

    if (r <= 0) {
        return {
            intervals: [{ l: -Infinity, r: Infinity, lc: false, rc: false }],
            equivalent: '\\mathbb{R}',
            note: 'Podmínka \\(|A(x)|\\ge r\\) pro \\(r\\le0\\) platí vždy.'
        };
    }

    return {
        intervals: normalizeIntervals([{ l: -Infinity, r: m - r, lc: false, rc: true }, { l: m + r, r: Infinity, lc: true, rc: false }]),
        equivalent: `x\\le${fmt(m - r)}\\;\\text{nebo}\\;x\\ge${fmt(m + r)}`,
        note: 'Řešení je mimo interval včetně jeho krajních bodů.'
    };
}

function initAbsolutePlayground() {
    const controls = {
        op: document.getElementById('absOperator'),
        center: document.getElementById('absCenter'),
        radius: document.getElementById('absRadius')
    };

    const display = {
        center: document.getElementById('absCenterValue'),
        radius: document.getElementById('absRadiusValue'),
        expr: document.getElementById('absExpressionLatex'),
        eq: document.getElementById('absEquivalentLatex'),
        result: document.getElementById('absResultLatex'),
        sample: document.getElementById('absSamplesLatex'),
        note: document.getElementById('absInterpretation'),
        canvas: document.getElementById('absCanvas')
    };

    if (!controls.op || !display.canvas) return;

    function update() {
        const op = controls.op.value;
        const center = Number(controls.center.value);
        const radius = Number(controls.radius.value);

        display.center.textContent = fmt(center);
        display.radius.textContent = fmt(radius);

        const solved = solveAbsolute(center, radius, op);

        display.expr.innerHTML = `\\(${absCoreExpr(center)} ${opTex(op)} ${fmt(radius)}\\)`;
        display.eq.innerHTML = `\\(${solved.equivalent}\\)`;
        display.result.innerHTML = `\\(${intervalsToLatex(solved.intervals)}\\)`;
        display.sample.innerHTML = sampleIntegers(solved.intervals);
        display.note.textContent = solved.note;

        drawIntervalCanvas(display.canvas, [{ label: 'Řešení', intervals: solved.intervals, color: '#10b981' }]);
        typeset(document.getElementById('linearni-nerovnice-s-absolutni-hodnotou'));
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
        1: { correct: '\\(x>2\\)', explanation: '\\(7-3x<1\\Rightarrow -3x<-6\\Rightarrow x>2\\). Znaménko se při dělení -3 obrátí.' },
        2: { correct: '\\(\\emptyset\\)', explanation: '\\(4x-6\\ge4x+2\\Rightarrow -6\\ge2\\), což je nepravda.' },
        3: { correct: '\\([-1,3)\\)', explanation: '\\(-1\\le3x+2<11\\Rightarrow -3\\le3x<9\\Rightarrow -1\\le x<3\\).' },
        4: { correct: '\\((-\\infty,-3]\\cup(3,\\infty)\\)', explanation: '\\(2x-5>1\\Rightarrow x>3\\), \\(x+4\\le1\\Rightarrow x\\le-3\\), spojka "nebo" dává sjednocení.' },
        5: { correct: '\\((-7,3)\\)', explanation: '\\(|x+2|<5\\Rightarrow -5<x+2<5\\Rightarrow -7<x<3\\).' },
        6: { correct: '\\(\\emptyset\\)', explanation: 'Absolutní hodnota je vždy nezáporná, proto nemůže být menší nebo rovna -0.5.' },
        7: { correct: '\\((-\\infty,-1)\\cup(7,\\infty)\\)', explanation: '\\(|2x-6|>8\\Rightarrow 2x-6>8\\) nebo \\(2x-6<-8\\), tedy \\(x>7\\) nebo \\(x<-1\\).' }
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


