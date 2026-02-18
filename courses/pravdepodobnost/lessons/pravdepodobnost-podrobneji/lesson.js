document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initUnionLab();
    initIndependenceLab();
    initConditionalLab();
    initBayesLab();
    initExercises();
});

const EPS = 1e-10;

const UNION_SCENARIOS = {
    die: {
        outcomes: ['1', '2', '3', '4', '5', '6'],
        sample() {
            return String(Math.floor(Math.random() * 6) + 1);
        },
        events: [
            {
                id: 'even',
                label: 'Padne sudé číslo',
                outcomes: ['2', '4', '6'],
                note: 'A nebo B mohou obsahovat společné výsledky - ty patří do průniku A ∩ B.'
            },
            {
                id: 'prime',
                label: 'Padne prvočíslo',
                outcomes: ['2', '3', '5'],
                note: 'Prvočísla na kostce jsou 2, 3, 5.'
            },
            {
                id: 'greater-than-3',
                label: 'Padne číslo větší než 3',
                outcomes: ['4', '5', '6'],
                note: 'Jev obsahuje výsledky 4, 5 a 6.'
            },
            {
                id: 'at-most-2',
                label: 'Padne číslo nejvýše 2',
                outcomes: ['1', '2'],
                note: 'Uvidíte případ s malou pravděpodobností jevu.'
            }
        ]
    },
    coins: {
        outcomes: ['OO', 'OP', 'PO', 'PP'],
        sample() {
            return Math.random() < 0.5
                ? (Math.random() < 0.5 ? 'OO' : 'OP')
                : (Math.random() < 0.5 ? 'PO' : 'PP');
        },
        events: [
            {
                id: 'first-o',
                label: 'První hod je orel',
                outcomes: ['OO', 'OP'],
                note: 'Sledujte, jak sjednocení spojuje výsledky z obou jevů bez duplicit.'
            },
            {
                id: 'second-o',
                label: 'Druhý hod je orel',
                outcomes: ['OO', 'PO'],
                note: 'Průnik A ∩ B je zde výsledek OO.'
            },
            {
                id: 'exactly-one-o',
                label: 'Padne právě jeden orel',
                outcomes: ['OP', 'PO'],
                note: 'Jev zahrnuje OP a PO.'
            },
            {
                id: 'same-side',
                label: 'Padnou stejné strany',
                outcomes: ['OO', 'PP'],
                note: 'Jev zahrnuje OO i PP.'
            }
        ]
    },
    cards: {
        outcomes: ['♠', '♥', '♦', '♣'],
        sample() {
            const idx = Math.floor(Math.random() * 4);
            return this.outcomes[idx];
        },
        events: [
            {
                id: 'red',
                label: 'Karta je červená',
                outcomes: ['♥', '♦'],
                note: 'Červené barvy jsou srdce a káry.'
            },
            {
                id: 'black',
                label: 'Karta je černá',
                outcomes: ['♠', '♣'],
                note: 'Černé barvy jsou piky a kříže.'
            },
            {
                id: 'heart-or-spade',
                label: 'Karta je srdce nebo piky',
                outcomes: ['♥', '♠'],
                note: 'Jev kombinuje dvě konkrétní barvy.'
            },
            {
                id: 'diamond',
                label: 'Karta je káry',
                outcomes: ['♦'],
                note: 'Elementární jev s jedním výsledkem.'
            }
        ]
    }
};

const INDEPENDENCE_SCENARIOS = {
    coins: {
        outcomes: buildCoinOutcomes(),
        sample() {
            return this.outcomes[Math.floor(Math.random() * this.outcomes.length)];
        },
        events: [
            {
                id: 'first-o',
                label: 'První hod je orel',
                predicate: out => out.first === 'O'
            },
            {
                id: 'second-o',
                label: 'Druhý hod je orel',
                predicate: out => out.second === 'O'
            },
            {
                id: 'at-least-one-o',
                label: 'Padne alespoň jeden orel',
                predicate: out => out.first === 'O' || out.second === 'O'
            },
            {
                id: 'same-side',
                label: 'Padnou stejné strany',
                predicate: out => out.first === out.second
            },
            {
                id: 'exactly-one-o',
                label: 'Padne právě jeden orel',
                predicate: out => (out.first === 'O') !== (out.second === 'O')
            }
        ]
    },
    dice: {
        outcomes: buildDiceOutcomes(),
        sample() {
            return this.outcomes[Math.floor(Math.random() * this.outcomes.length)];
        },
        events: [
            {
                id: 'first-even',
                label: 'První kostka je sudá',
                predicate: out => out.d1 % 2 === 0
            },
            {
                id: 'second-gt-3',
                label: 'Druhá kostka je větší než 3',
                predicate: out => out.d2 > 3
            },
            {
                id: 'sum-even',
                label: 'Součet je sudý',
                predicate: out => out.sum % 2 === 0
            },
            {
                id: 'first-six',
                label: 'První kostka je 6',
                predicate: out => out.d1 === 6
            },
            {
                id: 'sum-at-least-10',
                label: 'Součet je alespoň 10',
                predicate: out => out.sum >= 10
            },
            {
                id: 'at-least-one-six',
                label: 'Padne alespoň jedna šestka',
                predicate: out => out.d1 === 6 || out.d2 === 6
            }
        ]
    }
};

const CONDITIONAL_EVENTS = [
    {
        id: 'first-six',
        label: 'První kostka je 6',
        predicate: out => out.d1 === 6
    },
    {
        id: 'second-even',
        label: 'Druhá kostka je sudá',
        predicate: out => out.d2 % 2 === 0
    },
    {
        id: 'sum-at-least-9',
        label: 'Součet je alespoň 9',
        predicate: out => out.sum >= 9
    },
    {
        id: 'sum-even',
        label: 'Součet je sudý',
        predicate: out => out.sum % 2 === 0
    },
    {
        id: 'doubles',
        label: 'Padne dvojice (d1=d2)',
        predicate: out => out.d1 === out.d2
    },
    {
        id: 'first-at-most-3',
        label: 'První kostka je nejvýše 3',
        predicate: out => out.d1 <= 3
    },
    {
        id: 'at-least-one-six',
        label: 'Padne alespoň jedna šestka',
        predicate: out => out.d1 === 6 || out.d2 === 6
    }
];

const CONDITIONAL_OUTCOMES = buildDiceOutcomes();

function ensureElement(id) {
    return document.getElementById(id);
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y !== 0) {
        const rest = x % y;
        x = y;
        y = rest;
    }
    return x || 1;
}

function simplifyFraction(numerator, denominator) {
    if (denominator === 0) {
        return { numerator: 0, denominator: 1 };
    }
    if (numerator === 0) {
        return { numerator: 0, denominator: 1 };
    }
    const factor = gcd(numerator, denominator);
    return {
        numerator: numerator / factor,
        denominator: denominator / factor
    };
}

function formatDecimal(value, digits = 4) {
    return Number(value.toFixed(digits)).toString();
}

function formatPercent(value, digits = 2) {
    return `${formatDecimal(value * 100, digits)}%`;
}

function formatCount(value) {
    const rounded = Math.round(value);
    if (Math.abs(value - rounded) < EPS) {
        return rounded.toString();
    }
    return value.toFixed(1);
}

function formatProbability(numerator, denominator, digits = 4) {
    if (denominator === 0) {
        return 'nedefinováno';
    }
    const simplified = simplifyFraction(numerator, denominator);
    return `${simplified.numerator}/${simplified.denominator} (${formatDecimal(numerator / denominator, digits)})`;
}

function buildSetText(values, limit = 14) {
    if (!values.length) {
        return '{ ∅ }';
    }
    if (values.length <= limit) {
        return `{ ${values.join(', ')} }`;
    }
    const preview = values.slice(0, limit).join(', ');
    return `{ ${preview}, ... } (${values.length} prvků)`;
}

function arraysIntersection(valuesA, valuesB) {
    const setB = new Set(valuesB);
    return valuesA.filter(value => setB.has(value));
}

function arraysUnion(valuesA, valuesB) {
    const unique = new Set([...valuesA, ...valuesB]);
    return Array.from(unique);
}

function parseFractionOrDecimalOrPercent(rawInput) {
    if (!rawInput) {
        return null;
    }

    const raw = rawInput.replace(/\s+/g, '').replace(',', '.').trim();
    if (!raw) {
        return null;
    }

    if (raw.endsWith('%')) {
        const numericPercent = Number(raw.slice(0, -1));
        if (Number.isNaN(numericPercent)) {
            return null;
        }
        return numericPercent / 100;
    }

    if (/^-?\d+(\.\d+)?\/-?\d+(\.\d+)?$/.test(raw)) {
        const [numerator, denominator] = raw.split('/').map(Number);
        if (Math.abs(denominator) < EPS) {
            return null;
        }
        return numerator / denominator;
    }

    const numeric = Number(raw);
    if (Number.isNaN(numeric)) {
        return null;
    }
    return numeric;
}

function buildCoinOutcomes() {
    return [
        { id: 'OO', first: 'O', second: 'O' },
        { id: 'OP', first: 'O', second: 'P' },
        { id: 'PO', first: 'P', second: 'O' },
        { id: 'PP', first: 'P', second: 'P' }
    ];
}

function buildDiceOutcomes() {
    const outcomes = [];
    for (let d1 = 1; d1 <= 6; d1 += 1) {
        for (let d2 = 1; d2 <= 6; d2 += 1) {
            outcomes.push({
                id: `${d1},${d2}`,
                d1,
                d2,
                sum: d1 + d2
            });
        }
    }
    return outcomes;
}

// =============================================
// NAVIGATION
// =============================================

function initNavigation() {
    const sidebarLinks = Array.from(document.querySelectorAll('.sidebar-link'));
    const sections = Array.from(document.querySelectorAll('.lesson-section'));
    const nextButtons = Array.from(document.querySelectorAll('.btn-next'));
    const prevButtons = Array.from(document.querySelectorAll('.btn-prev'));

    if (!sidebarLinks.length || !sections.length) {
        return;
    }

    const sectionOrder = sidebarLinks.map(link => link.dataset.section);

    function updateProgress(sectionId) {
        const fill = document.querySelector('.progress-fill-small');
        if (!fill) {
            return;
        }
        const index = sectionOrder.indexOf(sectionId);
        if (index < 0) {
            fill.style.width = '0%';
            return;
        }
        const progress = ((index + 1) / sectionOrder.length) * 100;
        fill.style.width = `${progress}%`;
    }

    function showSection(sectionId) {
        sections.forEach(section => section.classList.remove('active'));
        sidebarLinks.forEach(link => link.classList.remove('active'));

        const section = ensureElement(sectionId);
        const link = sidebarLinks.find(item => item.dataset.section === sectionId);

        if (section) {
            section.classList.add('active');
        }
        if (link) {
            link.classList.add('active');
        }

        updateProgress(sectionId);
        window.history.replaceState(null, '', `#${sectionId}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            showSection(link.dataset.section);
        });
    });

    nextButtons.forEach(button => {
        button.addEventListener('click', () => showSection(button.dataset.next));
    });

    prevButtons.forEach(button => {
        button.addEventListener('click', () => showSection(button.dataset.prev));
    });

    const initialSection = window.location.hash ? window.location.hash.slice(1) : sectionOrder[0];
    if (sectionOrder.includes(initialSection)) {
        showSection(initialSection);
    } else {
        showSection(sectionOrder[0]);
    }
}

// =============================================
// UNION OF EVENTS
// =============================================

function initUnionLab() {
    const scenarioSelect = ensureElement('unionScenarioSelect');
    const eventASelect = ensureElement('unionEventASelect');
    const eventBSelect = ensureElement('unionEventBSelect');
    const grid = ensureElement('unionOutcomeGrid');

    if (!scenarioSelect || !eventASelect || !eventBSelect || !grid) {
        return;
    }

    const ui = {
        setA: ensureElement('unionASet'),
        setB: ensureElement('unionBSet'),
        setInter: ensureElement('unionIntersectionSet'),
        setUnion: ensureElement('unionUnionSet'),
        pA: ensureElement('unionPA'),
        pB: ensureElement('unionPB'),
        pInter: ensureElement('unionPIntersection'),
        pUnion: ensureElement('unionPUnion'),
        formula: ensureElement('unionFormula'),
        noteA: ensureElement('unionEventANote'),
        noteB: ensureElement('unionEventBNote'),
        drawButton: ensureElement('unionDrawOutcomeBtn'),
        drawResult: ensureElement('unionDrawResult'),
        drawFeedback: ensureElement('unionDrawFeedback')
    };

    let latestOutcome = null;

    function currentScenario() {
        return UNION_SCENARIOS[scenarioSelect.value];
    }

    function currentEvents() {
        const scenario = currentScenario();
        const eventA = scenario.events.find(event => event.id === eventASelect.value);
        const eventB = scenario.events.find(event => event.id === eventBSelect.value);
        return { eventA, eventB };
    }

    function fillEventOptions() {
        const scenario = currentScenario();
        const options = scenario.events
            .map(event => `<option value="${event.id}">${event.label}</option>`)
            .join('');

        eventASelect.innerHTML = options;
        eventBSelect.innerHTML = options;

        if (scenario.events.length > 1) {
            eventASelect.value = scenario.events[0].id;
            eventBSelect.value = scenario.events[1].id;
        }
    }

    function renderGrid(eventA, eventB) {
        const scenario = currentScenario();
        const setA = new Set(eventA.outcomes);
        const setB = new Set(eventB.outcomes);

        grid.innerHTML = scenario.outcomes
            .map(outcome => {
                const inA = setA.has(outcome);
                const inB = setB.has(outcome);
                const classes = ['outcome-chip'];

                if (inA && inB) {
                    classes.push('in-both');
                } else if (inA) {
                    classes.push('in-a');
                } else if (inB) {
                    classes.push('in-b');
                }

                if (latestOutcome === outcome) {
                    classes.push('latest');
                }

                return `<div class="${classes.join(' ')}">${outcome}</div>`;
            })
            .join('');
    }

    function updateSummary(eventA, eventB) {
        const scenario = currentScenario();
        const total = scenario.outcomes.length;
        const inter = arraysIntersection(eventA.outcomes, eventB.outcomes);
        const union = arraysUnion(eventA.outcomes, eventB.outcomes);

        ui.setA.textContent = `A = ${buildSetText(eventA.outcomes)}`;
        ui.setB.textContent = `B = ${buildSetText(eventB.outcomes)}`;
        ui.setInter.textContent = `A ∩ B = ${buildSetText(inter)}`;
        ui.setUnion.textContent = `A ∪ B = ${buildSetText(union)}`;

        ui.pA.textContent = formatProbability(eventA.outcomes.length, total);
        ui.pB.textContent = formatProbability(eventB.outcomes.length, total);
        ui.pInter.textContent = formatProbability(inter.length, total);
        ui.pUnion.textContent = formatProbability(union.length, total);

        const left = formatDecimal(union.length / total, 6);
        const right = formatDecimal((eventA.outcomes.length / total) + (eventB.outcomes.length / total) - (inter.length / total), 6);

        ui.formula.textContent = `P(A ∪ B) = ${eventA.outcomes.length}/${total} + ${eventB.outcomes.length}/${total} - ${inter.length}/${total} = ${union.length}/${total} = ${left}`;
        ui.noteA.textContent = `A: ${eventA.note}`;
        ui.noteB.textContent = `B: ${eventB.note} (kontrola: ${left} = ${right})`;
    }

    function refreshUnion() {
        const { eventA, eventB } = currentEvents();
        if (!eventA || !eventB) {
            return;
        }
        renderGrid(eventA, eventB);
        updateSummary(eventA, eventB);
    }

    scenarioSelect.addEventListener('change', () => {
        latestOutcome = null;
        ui.drawResult.textContent = '–';
        ui.drawFeedback.textContent = 'Výsledek zatím nebyl vygenerován.';
        fillEventOptions();
        refreshUnion();
    });

    eventASelect.addEventListener('change', refreshUnion);
    eventBSelect.addEventListener('change', refreshUnion);

    ui.drawButton.addEventListener('click', () => {
        const scenario = currentScenario();
        const { eventA, eventB } = currentEvents();
        if (!eventA || !eventB) {
            return;
        }

        latestOutcome = scenario.sample();
        const inA = eventA.outcomes.includes(latestOutcome);
        const inB = eventB.outcomes.includes(latestOutcome);

        ui.drawResult.textContent = latestOutcome;
        if (inA && inB) {
            ui.drawFeedback.textContent = 'Výsledek je současně v A i v B, tedy patří i do A ∩ B a A ∪ B.';
        } else if (inA) {
            ui.drawFeedback.textContent = 'Výsledek je v A (a tedy i v A ∪ B), ale není v B.';
        } else if (inB) {
            ui.drawFeedback.textContent = 'Výsledek je v B (a tedy i v A ∪ B), ale není v A.';
        } else {
            ui.drawFeedback.textContent = 'Výsledek není ani v A, ani v B, proto není v A ∪ B.';
        }

        renderGrid(eventA, eventB);
    });

    fillEventOptions();
    refreshUnion();
}
// =============================================
// INDEPENDENCE
// =============================================

function initIndependenceLab() {
    const scenarioSelect = ensureElement('indScenarioSelect');
    const eventASelect = ensureElement('indEventASelect');
    const eventBSelect = ensureElement('indEventBSelect');
    const grid = ensureElement('indOutcomeGrid');

    if (!scenarioSelect || !eventASelect || !eventBSelect || !grid) {
        return;
    }

    const ui = {
        setA: ensureElement('indSetA'),
        setB: ensureElement('indSetB'),
        setInter: ensureElement('indSetInter'),
        theoryPA: ensureElement('indTheoryPA'),
        theoryPB: ensureElement('indTheoryPB'),
        theoryInter: ensureElement('indTheoryInter'),
        theoryProduct: ensureElement('indTheoryProduct'),
        theoryDiff: ensureElement('indTheoryDiff'),
        verdict: ensureElement('indVerdict'),
        trials: ensureElement('indTrials'),
        hitsA: ensureElement('indHitsA'),
        hitsB: ensureElement('indHitsB'),
        hitsBoth: ensureElement('indHitsBoth'),
        freqInter: ensureElement('indFreqInter'),
        freqProduct: ensureElement('indFreqProduct'),
        freqDiff: ensureElement('indFreqDiff'),
        log: ensureElement('indLog'),
        resetButton: ensureElement('indResetBtn'),
        runButtons: Array.from(document.querySelectorAll('.ind-run-btn'))
    };

    const state = {
        trials: 0,
        hitsA: 0,
        hitsB: 0,
        hitsBoth: 0,
        log: [],
        latestId: null
    };

    let cache = {
        setA: new Set(),
        setB: new Set(),
        setInter: new Set(),
        pA: 0,
        pB: 0,
        pInter: 0,
        pProduct: 0,
        diff: 0,
        independent: false
    };

    function currentScenario() {
        return INDEPENDENCE_SCENARIOS[scenarioSelect.value];
    }

    function fillEventOptions() {
        const scenario = currentScenario();
        const options = scenario.events
            .map(event => `<option value="${event.id}">${event.label}</option>`)
            .join('');

        eventASelect.innerHTML = options;
        eventBSelect.innerHTML = options;

        if (scenario.events.length > 1) {
            eventASelect.value = scenario.events[0].id;
            eventBSelect.value = scenario.events[1].id;
        }
    }

    function getSelectedEvent(selectNode) {
        const scenario = currentScenario();
        return scenario.events.find(event => event.id === selectNode.value);
    }

    function resetSimulation() {
        state.trials = 0;
        state.hitsA = 0;
        state.hitsB = 0;
        state.hitsBoth = 0;
        state.log = [];
        state.latestId = null;
        updateSimulationDisplay();
    }

    function computeTheoretical() {
        const scenario = currentScenario();
        const eventA = getSelectedEvent(eventASelect);
        const eventB = getSelectedEvent(eventBSelect);
        if (!eventA || !eventB) {
            return;
        }

        const idsA = scenario.outcomes.filter(out => eventA.predicate(out)).map(out => out.id);
        const idsB = scenario.outcomes.filter(out => eventB.predicate(out)).map(out => out.id);
        const idsInter = idsA.filter(id => idsB.includes(id));

        const total = scenario.outcomes.length;
        const pA = idsA.length / total;
        const pB = idsB.length / total;
        const pInter = idsInter.length / total;
        const pProduct = pA * pB;
        const diff = Math.abs(pInter - pProduct);

        cache = {
            setA: new Set(idsA),
            setB: new Set(idsB),
            setInter: new Set(idsInter),
            pA,
            pB,
            pInter,
            pProduct,
            diff,
            independent: diff < EPS
        };

        ui.setA.textContent = `A = ${buildSetText(idsA)}`;
        ui.setB.textContent = `B = ${buildSetText(idsB)}`;
        ui.setInter.textContent = `A ∩ B = ${buildSetText(idsInter)}`;

        ui.theoryPA.textContent = formatDecimal(pA, 6);
        ui.theoryPB.textContent = formatDecimal(pB, 6);
        ui.theoryInter.textContent = formatDecimal(pInter, 6);
        ui.theoryProduct.textContent = formatDecimal(pProduct, 6);
        ui.theoryDiff.textContent = formatDecimal(diff, 8);

        if (cache.independent) {
            ui.verdict.textContent = 'A a B jsou nezávislé (teoreticky).';
            ui.verdict.className = 'live-equation independent';
        } else {
            ui.verdict.textContent = 'A a B jsou závislé (teoreticky).';
            ui.verdict.className = 'live-equation dependent';
        }
    }

    function renderGrid() {
        const scenario = currentScenario();
        grid.innerHTML = scenario.outcomes
            .map(outcome => {
                const classes = ['outcome-chip'];
                const inA = cache.setA.has(outcome.id);
                const inB = cache.setB.has(outcome.id);

                if (inA && inB) {
                    classes.push('in-both');
                } else if (inA) {
                    classes.push('in-a');
                } else if (inB) {
                    classes.push('in-b');
                }

                if (state.latestId === outcome.id) {
                    classes.push('latest');
                }

                return `<div class="${classes.join(' ')}">${outcome.id}</div>`;
            })
            .join('');
    }

    function updateSimulationDisplay() {
        const fA = state.trials > 0 ? state.hitsA / state.trials : 0;
        const fB = state.trials > 0 ? state.hitsB / state.trials : 0;
        const fInter = state.trials > 0 ? state.hitsBoth / state.trials : 0;
        const fProduct = fA * fB;
        const diff = Math.abs(fInter - fProduct);

        ui.trials.textContent = state.trials.toString();
        ui.hitsA.textContent = state.trials > 0 ? `${state.hitsA}/${state.trials}` : '0';
        ui.hitsB.textContent = state.trials > 0 ? `${state.hitsB}/${state.trials}` : '0';
        ui.hitsBoth.textContent = state.trials > 0 ? `${state.hitsBoth}/${state.trials}` : '0';
        ui.freqInter.textContent = formatDecimal(fInter, 6);
        ui.freqProduct.textContent = formatDecimal(fProduct, 6);
        ui.freqDiff.textContent = formatDecimal(diff, 8);

        ui.log.innerHTML = state.log
            .map(entry => {
                const classes = ['trial-log-item'];
                if (entry.inBoth) {
                    classes.push('hit');
                }
                return `<span class="${classes.join(' ')}">${entry.id}</span>`;
            })
            .join('');

        renderGrid();
    }

    function runSimulation(count) {
        const scenario = currentScenario();
        const eventA = getSelectedEvent(eventASelect);
        const eventB = getSelectedEvent(eventBSelect);
        if (!eventA || !eventB) {
            return;
        }

        for (let i = 0; i < count; i += 1) {
            const outcome = scenario.sample();
            const inA = eventA.predicate(outcome);
            const inB = eventB.predicate(outcome);
            const inBoth = inA && inB;

            state.trials += 1;
            state.latestId = outcome.id;
            if (inA) {
                state.hitsA += 1;
            }
            if (inB) {
                state.hitsB += 1;
            }
            if (inBoth) {
                state.hitsBoth += 1;
            }

            state.log.unshift({ id: outcome.id, inBoth });
        }

        state.log = state.log.slice(0, 36);
        updateSimulationDisplay();
    }

    function refreshAll() {
        computeTheoretical();
        resetSimulation();
    }

    scenarioSelect.addEventListener('change', () => {
        fillEventOptions();
        refreshAll();
    });

    eventASelect.addEventListener('change', refreshAll);
    eventBSelect.addEventListener('change', refreshAll);

    ui.runButtons.forEach(button => {
        button.addEventListener('click', () => {
            const count = Number(button.dataset.run);
            runSimulation(count);
        });
    });

    ui.resetButton.addEventListener('click', resetSimulation);

    fillEventOptions();
    refreshAll();
}
// =============================================
// CONDITIONAL PROBABILITY
// =============================================

function initConditionalLab() {
    const eventASelect = ensureElement('condEventASelect');
    const eventBSelect = ensureElement('condEventBSelect');
    const grid = ensureElement('condOutcomeGrid');

    if (!eventASelect || !eventBSelect || !grid) {
        return;
    }

    const ui = {
        setA: ensureElement('condSetA'),
        setB: ensureElement('condSetB'),
        setInter: ensureElement('condSetInter'),
        pB: ensureElement('condPB'),
        pInter: ensureElement('condPInter'),
        pGiven: ensureElement('condPAGivenB'),
        formulaMain: ensureElement('condFormulaMain'),
        formulaCheck: ensureElement('condFormulaCheck'),
        drawButton: ensureElement('condDrawBtn'),
        drawResult: ensureElement('condDrawResult'),
        trials: ensureElement('condTrials'),
        hits: ensureElement('condHits'),
        freq: ensureElement('condFreq'),
        diff: ensureElement('condDiff'),
        resetButton: ensureElement('condResetBtn'),
        runButtons: Array.from(document.querySelectorAll('.cond-run-btn'))
    };

    const state = {
        trials: 0,
        hits: 0,
        latestId: null
    };

    let cache = {
        setA: new Set(),
        setB: new Set(),
        setInter: new Set(),
        bList: [],
        pB: 0,
        pInter: 0,
        pGiven: 0
    };

    function fillEventOptions() {
        const options = CONDITIONAL_EVENTS
            .map(event => `<option value="${event.id}">${event.label}</option>`)
            .join('');

        eventASelect.innerHTML = options;
        eventBSelect.innerHTML = options;

        if (CONDITIONAL_EVENTS.length > 1) {
            eventASelect.value = CONDITIONAL_EVENTS[0].id;
            eventBSelect.value = CONDITIONAL_EVENTS[2].id;
        }
    }

    function selectedEvent(selectNode) {
        return CONDITIONAL_EVENTS.find(event => event.id === selectNode.value);
    }

    function recompute() {
        const eventA = selectedEvent(eventASelect);
        const eventB = selectedEvent(eventBSelect);
        if (!eventA || !eventB) {
            return;
        }

        const idsA = CONDITIONAL_OUTCOMES.filter(out => eventA.predicate(out)).map(out => out.id);
        const idsB = CONDITIONAL_OUTCOMES.filter(out => eventB.predicate(out)).map(out => out.id);
        const idsInter = idsA.filter(id => idsB.includes(id));

        const total = CONDITIONAL_OUTCOMES.length;
        const pB = idsB.length / total;
        const pInter = idsInter.length / total;
        const pGiven = idsB.length > 0 ? idsInter.length / idsB.length : 0;

        cache = {
            setA: new Set(idsA),
            setB: new Set(idsB),
            setInter: new Set(idsInter),
            bList: idsB,
            pB,
            pInter,
            pGiven
        };

        ui.setA.textContent = `A = ${buildSetText(idsA)}`;
        ui.setB.textContent = `B = ${buildSetText(idsB)}`;
        ui.setInter.textContent = `A ∩ B = ${buildSetText(idsInter)}`;

        ui.pB.textContent = formatProbability(idsB.length, total);
        ui.pInter.textContent = formatProbability(idsInter.length, total);
        ui.pGiven.textContent = idsB.length > 0
            ? formatProbability(idsInter.length, idsB.length)
            : 'nedefinováno';

        ui.formulaMain.textContent = idsB.length > 0
            ? `P(A|B) = (${idsInter.length}/${total}) / (${idsB.length}/${total}) = ${idsInter.length}/${idsB.length}`
            : 'P(A|B) není definováno, protože P(B)=0';

        ui.formulaCheck.textContent = idsB.length > 0
            ? `Kontrola: P(A ∩ B) = P(B)·P(A|B) = ${formatDecimal(pB, 6)} · ${formatDecimal(pGiven, 6)} = ${formatDecimal(pB * pGiven, 6)}`
            : 'Zvolte podmínku B s nenulovou pravděpodobností.';

        renderConditionalGrid();
        updateConditionalStats();
    }

    function renderConditionalGrid() {
        grid.innerHTML = CONDITIONAL_OUTCOMES
            .map(outcome => {
                const inB = cache.setB.has(outcome.id);
                const inInter = cache.setInter.has(outcome.id);
                const classes = ['outcome-chip'];

                if (inInter) {
                    classes.push('in-both');
                } else if (inB) {
                    classes.push('in-condition');
                } else {
                    classes.push('muted');
                }

                if (state.latestId === outcome.id) {
                    classes.push('latest');
                }

                return `<div class="${classes.join(' ')}">${outcome.id}</div>`;
            })
            .join('');
    }

    function drawFromConditionB() {
        if (!cache.bList.length) {
            return null;
        }
        const id = cache.bList[Math.floor(Math.random() * cache.bList.length)];
        return CONDITIONAL_OUTCOMES.find(outcome => outcome.id === id) || null;
    }

    function updateConditionalStats() {
        const empirical = state.trials > 0 ? state.hits / state.trials : 0;
        const difference = Math.abs(cache.pGiven - empirical);

        ui.trials.textContent = state.trials.toString();
        ui.hits.textContent = state.hits.toString();
        ui.freq.textContent = formatDecimal(empirical, 6);
        ui.diff.textContent = formatDecimal(difference, 8);
    }

    function resetConditionalSimulation() {
        state.trials = 0;
        state.hits = 0;
        state.latestId = null;
        ui.drawResult.textContent = '–';
        updateConditionalStats();
        renderConditionalGrid();
    }

    function runConditionalSimulation(count) {
        for (let i = 0; i < count; i += 1) {
            const outcome = drawFromConditionB();
            if (!outcome) {
                return;
            }
            const inInter = cache.setInter.has(outcome.id);
            state.trials += 1;
            state.latestId = outcome.id;
            if (inInter) {
                state.hits += 1;
            }
        }

        updateConditionalStats();
        renderConditionalGrid();
    }

    eventASelect.addEventListener('change', () => {
        resetConditionalSimulation();
        recompute();
    });

    eventBSelect.addEventListener('change', () => {
        resetConditionalSimulation();
        recompute();
    });

    ui.drawButton.addEventListener('click', () => {
        const outcome = drawFromConditionB();
        if (!outcome) {
            ui.drawResult.textContent = 'B je prázdný jev';
            return;
        }

        state.latestId = outcome.id;
        ui.drawResult.textContent = cache.setInter.has(outcome.id)
            ? `${outcome.id} ∈ A ∩ B`
            : `${outcome.id} ∈ B \\ A`;

        renderConditionalGrid();
    });

    ui.runButtons.forEach(button => {
        button.addEventListener('click', () => {
            const count = Number(button.dataset.run);
            runConditionalSimulation(count);
        });
    });

    ui.resetButton.addEventListener('click', resetConditionalSimulation);

    fillEventOptions();
    recompute();
}

// =============================================
// BAYES
// =============================================

function initBayesLab() {
    const inputs = {
        prevalence: ensureElement('bayesPrevalenceInput'),
        sensitivity: ensureElement('bayesSensitivityInput'),
        specificity: ensureElement('bayesSpecificityInput'),
        population: ensureElement('bayesPopulationInput')
    };

    if (!inputs.prevalence || !inputs.sensitivity || !inputs.specificity || !inputs.population) {
        return;
    }

    const ui = {
        tp: ensureElement('bayesTP'),
        fp: ensureElement('bayesFP'),
        fn: ensureElement('bayesFN'),
        tn: ensureElement('bayesTN'),
        positive: ensureElement('bayesPositiveCount'),
        negative: ensureElement('bayesNegativeCount'),
        disease: ensureElement('bayesDiseaseCount'),
        healthy: ensureElement('bayesHealthyCount'),
        population: ensureElement('bayesPopulationCount'),
        numerator: ensureElement('bayesNumerator'),
        denominator: ensureElement('bayesDenominator'),
        posterior: ensureElement('bayesPosterior'),
        pPositive: ensureElement('bayesPPositive'),
        npv: ensureElement('bayesNPV'),
        ppvValue: ensureElement('bayesPPV'),
        falsePositivePosterior: ensureElement('bayesFalsePositivePosterior'),
        tpBar: ensureElement('bayesTruePositiveBar'),
        fpBar: ensureElement('bayesFalsePositiveBar'),
        interpretation: ensureElement('bayesInterpretation'),
        presets: Array.from(document.querySelectorAll('.bayes-preset-btn'))
    };

    function readInputs() {
        const prevalence = clamp(Number(inputs.prevalence.value), 0.000001, 100);
        const sensitivity = clamp(Number(inputs.sensitivity.value), 0, 100);
        const specificity = clamp(Number(inputs.specificity.value), 0, 100);
        const population = clamp(Math.round(Number(inputs.population.value) || 10000), 1000, 1000000);

        inputs.prevalence.value = String(prevalence);
        inputs.sensitivity.value = String(sensitivity);
        inputs.specificity.value = String(specificity);
        inputs.population.value = String(population);

        return {
            p: prevalence / 100,
            se: sensitivity / 100,
            sp: specificity / 100,
            population
        };
    }

    function updateBayes() {
        const { p, se, sp, population } = readInputs();

        const disease = population * p;
        const healthy = population - disease;

        const tp = disease * se;
        const fn = disease - tp;
        const tn = healthy * sp;
        const fp = healthy - tn;

        const positive = tp + fp;
        const negative = fn + tn;

        const pPositive = positive / population;
        const ppv = positive > 0 ? tp / positive : 0;
        const npv = negative > 0 ? tn / negative : 0;
        const posteriorFalsePositive = positive > 0 ? fp / positive : 0;

        const numerator = se * p;
        const denominator = (se * p) + ((1 - sp) * (1 - p));
        const posterior = denominator > 0 ? numerator / denominator : 0;

        ui.tp.textContent = formatCount(tp);
        ui.fp.textContent = formatCount(fp);
        ui.fn.textContent = formatCount(fn);
        ui.tn.textContent = formatCount(tn);
        ui.positive.textContent = formatCount(positive);
        ui.negative.textContent = formatCount(negative);
        ui.disease.textContent = formatCount(disease);
        ui.healthy.textContent = formatCount(healthy);
        ui.population.textContent = population.toString();

        ui.numerator.textContent = formatDecimal(numerator, 8);
        ui.denominator.textContent = formatDecimal(denominator, 8);
        ui.posterior.textContent = `P(D|+) = ${formatPercent(posterior, 2)}`;
        ui.pPositive.textContent = `P(+) = ${formatPercent(pPositive, 2)}`;
        ui.npv.textContent = `P(¬D|-) = ${formatPercent(npv, 2)}`;

        ui.ppvValue.textContent = formatPercent(ppv, 2);
        ui.falsePositivePosterior.textContent = formatPercent(posteriorFalsePositive, 2);

        ui.tpBar.style.width = `${ppv * 100}%`;
        ui.fpBar.style.width = `${posteriorFalsePositive * 100}%`;

        ui.interpretation.textContent =
            `V populaci ${population.toLocaleString('cs-CZ')} osob očekáváme přibližně ${formatCount(positive)} pozitivních testů. ` +
            `Z nich je skutečně nemocných ${formatCount(tp)}, tedy PPV ≈ ${formatPercent(ppv, 2)}.`;
    }

    [inputs.prevalence, inputs.sensitivity, inputs.specificity, inputs.population].forEach(input => {
        input.addEventListener('input', updateBayes);
    });

    ui.presets.forEach(button => {
        button.addEventListener('click', () => {
            inputs.prevalence.value = button.dataset.prevalence;
            inputs.sensitivity.value = button.dataset.sensitivity;
            inputs.specificity.value = button.dataset.specificity;
            updateBayes();
        });
    });

    updateBayes();
}
// =============================================
// EXERCISES
// =============================================

function initExercises() {
    const buttons = Array.from(document.querySelectorAll('.btn-check[data-exercise]'));
    if (!buttons.length) {
        return;
    }

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const number = button.dataset.exercise;
            const card = ensureElement(`exercise${number}`);
            if (!card) {
                return;
            }

            const type = card.dataset.type;
            const answer = card.dataset.answer;
            const answerDisplay = card.dataset.answerDisplay || answer;
            const explanation = card.dataset.explanation || '';
            const status = ensureElement(`ex${number}Status`);
            const feedback = ensureElement(`ex${number}Feedback`);

            let isCorrect = false;

            if (type === 'choice') {
                const result = evaluateChoice(card, number, answer);
                if (result === null) {
                    alert('Vyberte prosím jednu odpověď.');
                    return;
                }
                isCorrect = result;
            }

            if (type === 'fraction') {
                const result = evaluateNumericInput(number, answer);
                if (result === null) {
                    alert('Zadejte prosím odpověď.');
                    return;
                }
                isCorrect = result;
            }

            button.disabled = true;
            setExerciseResult(status, feedback, isCorrect, answerDisplay, explanation);
            checkExerciseCompletion();
        });
    });
}

function evaluateChoice(card, number, answer) {
    const options = Array.from(card.querySelectorAll(`input[name="ex${number}"]`));
    const selected = options.find(option => option.checked);

    if (!selected) {
        return null;
    }

    options.forEach(option => {
        option.disabled = true;
        const optionLabel = option.closest('.option');
        if (!optionLabel) {
            return;
        }

        if (option.value === answer) {
            optionLabel.classList.add('correct');
        }

        if (option.value === selected.value && option.value !== answer) {
            optionLabel.classList.add('incorrect');
        }
    });

    return selected.value === answer;
}

function evaluateNumericInput(number, answer) {
    const input = ensureElement(`ex${number}Input`);
    if (!input) {
        return null;
    }

    const rawValue = input.value.trim();
    if (!rawValue) {
        return null;
    }

    const userValue = parseFractionOrDecimalOrPercent(rawValue);
    const expectedValue = parseFractionOrDecimalOrPercent(answer);

    input.disabled = true;

    if (userValue === null || expectedValue === null) {
        input.classList.add('incorrect');
        return false;
    }

    const isCorrect = Math.abs(userValue - expectedValue) < 1e-4;
    input.classList.toggle('correct', isCorrect);
    input.classList.toggle('incorrect', !isCorrect);

    return isCorrect;
}

function setExerciseResult(statusNode, feedbackNode, isCorrect, answerDisplay, explanation) {
    statusNode.textContent = isCorrect ? '✓ Správně' : '✗ Chybně';
    statusNode.className = `exercise-status ${isCorrect ? 'correct' : 'incorrect'}`;

    if (isCorrect) {
        feedbackNode.innerHTML = explanation;
    } else {
        feedbackNode.innerHTML = `${explanation}<br><span class="correct-value">Správná odpověď: ${answerDisplay}</span>`;
    }

    feedbackNode.className = `exercise-feedback show ${isCorrect ? 'correct' : 'incorrect'}`;
}

function checkExerciseCompletion() {
    const buttons = Array.from(document.querySelectorAll('.btn-check[data-exercise]'));
    const complete = buttons.every(button => button.disabled);
    const banner = ensureElement('lessonComplete');
    if (banner) {
        banner.style.display = complete ? 'block' : 'none';
    }
}
