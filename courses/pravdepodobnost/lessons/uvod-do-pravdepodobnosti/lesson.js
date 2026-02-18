document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initOutcomeLab();
    initEventBuilder();
    initNaiveCalculator();
    initSimulationLab();
    initExercises();
});

const EXPERIMENTS = {
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
                explanation: 'Sudá čísla na kostce jsou 2, 4, 6.'
            },
            {
                id: 'prime',
                label: 'Padne prvočíslo',
                outcomes: ['2', '3', '5'],
                explanation: 'Prvočísla v {1,…,6} jsou 2, 3, 5.'
            },
            {
                id: 'greater-than-4',
                label: 'Padne číslo větší než 4',
                outcomes: ['5', '6'],
                explanation: 'Jev obsahuje výsledky 5 a 6.'
            }
        ]
    },
    coins: {
        outcomes: ['OO', 'OP', 'PO', 'PP'],
        sample() {
            return randomCoinSide() + randomCoinSide();
        },
        events: [
            {
                id: 'exactly-one-o',
                label: 'Padne právě jeden orel',
                outcomes: ['OP', 'PO'],
                explanation: 'Právě jeden orel znamená OP nebo PO.'
            },
            {
                id: 'at-least-one-o',
                label: 'Padne alespoň jeden orel',
                outcomes: ['OO', 'OP', 'PO'],
                explanation: 'Vše kromě PP.'
            },
            {
                id: 'same-side',
                label: 'Padnou stejné strany',
                outcomes: ['OO', 'PP'],
                explanation: 'Stejný výsledek nastane v OO nebo PP.'
            }
        ]
    },
    suits: {
        outcomes: ['♠', '♥', '♦', '♣'],
        sample() {
            const outcomes = this.outcomes;
            return outcomes[Math.floor(Math.random() * outcomes.length)];
        },
        events: [
            {
                id: 'red',
                label: 'Karta je červená',
                outcomes: ['♥', '♦'],
                explanation: 'Červené barvy jsou srdce a káry.'
            },
            {
                id: 'black',
                label: 'Karta je černá',
                outcomes: ['♠', '♣'],
                explanation: 'Černé barvy jsou piky a kříže.'
            },
            {
                id: 'hearts',
                label: 'Karta je srdce',
                outcomes: ['♥'],
                explanation: 'Jev obsahuje právě barvu ♥.'
            }
        ]
    }
};

function randomCoinSide() {
    return Math.random() < 0.5 ? 'O' : 'P';
}

function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y !== 0) {
        const remainder = x % y;
        x = y;
        y = remainder;
    }
    return x || 1;
}

function simplifyFraction(numerator, denominator) {
    const factor = gcd(numerator, denominator);
    return {
        numerator: numerator / factor,
        denominator: denominator / factor
    };
}

function formatDecimal(value, digits = 4) {
    return Number(value.toFixed(digits)).toString();
}

function buildSetText(values) {
    if (!values.length) {
        return '{ }';
    }
    return `{ ${values.join(', ')} }`;
}

function ensureElement(id) {
    return document.getElementById(id);
}

// =============================================
// NAVIGATION
// =============================================

function initNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const sections = document.querySelectorAll('.lesson-section');
    const nextButtons = document.querySelectorAll('.btn-next');
    const prevButtons = document.querySelectorAll('.btn-prev');

    if (!sidebarLinks.length || !sections.length) {
        return;
    }

    const sectionOrder = Array.from(sidebarLinks).map(link => link.dataset.section);

    function showSection(sectionId) {
        sections.forEach(section => section.classList.remove('active'));
        sidebarLinks.forEach(link => link.classList.remove('active'));

        const section = ensureElement(sectionId);
        const link = document.querySelector(`.sidebar-link[data-section="${sectionId}"]`);

        if (section) {
            section.classList.add('active');
        }
        if (link) {
            link.classList.add('active');
        }

        updateProgress(sectionId, sectionOrder);
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

function updateProgress(sectionId, sectionOrder) {
    const fill = document.querySelector('.progress-fill-small');
    if (!fill) {
        return;
    }

    const index = sectionOrder.indexOf(sectionId);
    const progress = ((index + 1) / sectionOrder.length) * 100;
    fill.style.width = `${progress}%`;
}

// =============================================
// OUTCOME LAB
// =============================================

function initOutcomeLab() {
    const experimentSelect = ensureElement('expSelect');
    const eventSelect = ensureElement('eventSelect');
    const outcomeGrid = ensureElement('outcomeGrid');
    const eventSet = ensureElement('eventSet');
    const omegaSize = ensureElement('omegaSize');
    const eventSize = ensureElement('eventSize');
    const eventProbability = ensureElement('eventProbability');
    const eventFormula = ensureElement('eventFormula');
    const eventExplanation = ensureElement('eventExplanation');
    const drawButton = ensureElement('drawOutcomeBtn');
    const drawResult = ensureElement('drawResult');

    if (!experimentSelect || !eventSelect || !outcomeGrid) {
        return;
    }

    let latestOutcome = null;

    function getCurrentExperiment() {
        return EXPERIMENTS[experimentSelect.value];
    }

    function getCurrentEvent() {
        const experiment = getCurrentExperiment();
        return experiment.events.find(event => event.id === eventSelect.value);
    }

    function fillEventOptions() {
        const experiment = getCurrentExperiment();
        eventSelect.innerHTML = experiment.events
            .map(event => `<option value="${event.id}">${event.label}</option>`)
            .join('');
    }

    function renderGrid() {
        const experiment = getCurrentExperiment();
        const selectedEvent = getCurrentEvent();
        if (!selectedEvent) {
            return;
        }

        outcomeGrid.innerHTML = experiment.outcomes
            .map(outcome => {
                const isFavorable = selectedEvent.outcomes.includes(outcome);
                const isLatest = latestOutcome === outcome;
                const classes = [
                    'outcome-chip',
                    isFavorable ? 'favorable' : '',
                    isLatest ? 'latest' : ''
                ].filter(Boolean).join(' ');
                return `<div class="${classes}">${outcome}</div>`;
            })
            .join('');
    }

    function updateSummary() {
        const experiment = getCurrentExperiment();
        const selectedEvent = getCurrentEvent();
        if (!selectedEvent) {
            return;
        }

        const favorable = selectedEvent.outcomes.length;
        const total = experiment.outcomes.length;
        const simplified = simplifyFraction(favorable, total);
        const decimal = formatDecimal(favorable / total);

        eventSet.textContent = `A = ${buildSetText(selectedEvent.outcomes)}`;
        omegaSize.textContent = total.toString();
        eventSize.textContent = favorable.toString();
        eventProbability.textContent = `${simplified.numerator}/${simplified.denominator}`;
        eventFormula.textContent = `P(A) = ${favorable}/${total} = ${simplified.numerator}/${simplified.denominator} = ${decimal}`;
        eventExplanation.textContent = selectedEvent.explanation;
    }

    function refreshLab() {
        renderGrid();
        updateSummary();
    }

    experimentSelect.addEventListener('change', () => {
        latestOutcome = null;
        drawResult.textContent = '–';
        fillEventOptions();
        refreshLab();
    });

    eventSelect.addEventListener('change', refreshLab);

    drawButton.addEventListener('click', () => {
        const experiment = getCurrentExperiment();
        latestOutcome = experiment.sample();
        drawResult.textContent = latestOutcome;
        renderGrid();
    });

    fillEventOptions();
    refreshLab();
}

// =============================================
// EVENT BUILDER
// =============================================

function initEventBuilder() {
    const experimentSelect = ensureElement('builderExpSelect');
    const grid = ensureElement('builderGrid');
    const setOutput = ensureElement('builderSet');
    const eventSize = ensureElement('builderEventSize');
    const probability = ensureElement('builderProbability');
    const complementProbability = ensureElement('builderComplementProbability');
    const clearButton = ensureElement('builderClearBtn');
    const randomButton = ensureElement('builderRandomBtn');

    if (!experimentSelect || !grid) {
        return;
    }

    let selected = new Set();

    function experiment() {
        return EXPERIMENTS[experimentSelect.value];
    }

    function renderBuilderGrid() {
        const outcomes = experiment().outcomes;
        grid.innerHTML = outcomes.map(outcome => {
            const classes = ['outcome-chip', 'builder'];
            if (selected.has(outcome)) {
                classes.push('selected');
            }
            return `<button class="${classes.join(' ')}" data-outcome="${outcome}" type="button">${outcome}</button>`;
        }).join('');

        grid.querySelectorAll('.outcome-chip.builder').forEach(button => {
            button.addEventListener('click', () => {
                const value = button.dataset.outcome;
                if (selected.has(value)) {
                    selected.delete(value);
                } else {
                    selected.add(value);
                }
                renderBuilderGrid();
                updateBuilderSummary();
            });
        });
    }

    function updateBuilderSummary() {
        const outcomes = experiment().outcomes;
        const favorable = selected.size;
        const total = outcomes.length;
        const simplifiedMain = simplifyFraction(favorable, total);
        const simplifiedComplement = simplifyFraction(total - favorable, total);
        const selectedValues = outcomes.filter(outcome => selected.has(outcome));

        setOutput.textContent = `A = ${buildSetText(selectedValues)}`;
        eventSize.textContent = favorable.toString();
        probability.textContent = `${simplifiedMain.numerator}/${simplifiedMain.denominator}`;
        complementProbability.textContent = `${simplifiedComplement.numerator}/${simplifiedComplement.denominator}`;
    }

    experimentSelect.addEventListener('change', () => {
        selected = new Set();
        renderBuilderGrid();
        updateBuilderSummary();
    });

    clearButton.addEventListener('click', () => {
        selected = new Set();
        renderBuilderGrid();
        updateBuilderSummary();
    });

    randomButton.addEventListener('click', () => {
        selected = new Set();
        experiment().outcomes.forEach(outcome => {
            if (Math.random() < 0.5) {
                selected.add(outcome);
            }
        });
        renderBuilderGrid();
        updateBuilderSummary();
    });

    renderBuilderGrid();
    updateBuilderSummary();
}

// =============================================
// NAIVE CALCULATOR
// =============================================

function initNaiveCalculator() {
    const favorableInput = ensureElement('favorableInput');
    const totalInput = ensureElement('totalInput');
    const button = ensureElement('calcProbabilityBtn');
    const result = ensureElement('calcResult');
    const hint = ensureElement('calcHint');

    if (!favorableInput || !totalInput || !button) {
        return;
    }

    function compute() {
        const favorable = Number(favorableInput.value);
        const total = Number(totalInput.value);

        if (!Number.isInteger(favorable) || !Number.isInteger(total) || total <= 0 || favorable < 0 || favorable > total) {
            result.textContent = 'Neplatný vstup';
            hint.textContent = 'Musí platit: n > 0, m je celé číslo a 0 ≤ m ≤ n.';
            return;
        }

        const simplified = simplifyFraction(favorable, total);
        const decimal = formatDecimal(favorable / total, 6);
        result.textContent = `P(A) = ${favorable}/${total} = ${simplified.numerator}/${simplified.denominator} = ${decimal}`;

        if (favorable === 0) {
            hint.textContent = 'Jev je nemožný, proto P(A) = 0.';
            return;
        }
        if (favorable === total) {
            hint.textContent = 'Jev je jistý, proto P(A) = 1.';
            return;
        }
        if (simplified.numerator === favorable && simplified.denominator === total) {
            hint.textContent = 'Zlomek je již v základním tvaru.';
        } else {
            hint.textContent = `Po krácení dostaneme ${simplified.numerator}/${simplified.denominator}.`;
        }
    }

    button.addEventListener('click', compute);
    favorableInput.addEventListener('input', compute);
    totalInput.addEventListener('input', compute);

    compute();
}

// =============================================
// SIMULATION
// =============================================

function initSimulationLab() {
    const experimentSelect = ensureElement('simExpSelect');
    const eventSelect = ensureElement('simEventSelect');
    const runButtons = document.querySelectorAll('.sim-run-btn');
    const resetButton = ensureElement('simResetBtn');
    const theoreticalBar = ensureElement('theoreticalBar');
    const frequencyBar = ensureElement('frequencyBar');
    const theoreticalValue = ensureElement('theoreticalValue');
    const frequencyValue = ensureElement('frequencyValue');
    const trialsNode = ensureElement('simTrials');
    const hitsNode = ensureElement('simHits');
    const differenceNode = ensureElement('simDifference');
    const logNode = ensureElement('trialLog');

    if (!experimentSelect || !eventSelect || !runButtons.length) {
        return;
    }

    const state = {
        trials: 0,
        hits: 0,
        log: []
    };

    function currentExperiment() {
        return EXPERIMENTS[experimentSelect.value];
    }

    function currentEvent() {
        const experiment = currentExperiment();
        return experiment.events.find(event => event.id === eventSelect.value);
    }

    function fillEventSelect() {
        const experiment = currentExperiment();
        eventSelect.innerHTML = experiment.events
            .map(event => `<option value="${event.id}">${event.label}</option>`)
            .join('');
    }

    function resetSimulation() {
        state.trials = 0;
        state.hits = 0;
        state.log = [];
        updateSimulationView();
    }

    function updateSimulationView() {
        const experiment = currentExperiment();
        const event = currentEvent();
        if (!event) {
            return;
        }

        const total = experiment.outcomes.length;
        const favorable = event.outcomes.length;
        const theoretical = favorable / total;
        const frequency = state.trials > 0 ? state.hits / state.trials : 0;
        const difference = Math.abs(theoretical - frequency);

        theoreticalBar.style.width = `${theoretical * 100}%`;
        frequencyBar.style.width = `${frequency * 100}%`;
        theoreticalValue.textContent = formatDecimal(theoretical);
        frequencyValue.textContent = state.trials > 0 ? formatDecimal(frequency) : '0';
        trialsNode.textContent = state.trials.toString();
        hitsNode.textContent = state.hits.toString();
        differenceNode.textContent = state.trials > 0 ? formatDecimal(difference) : '0';

        logNode.innerHTML = state.log.map(entry => {
            const className = entry.hit ? 'trial-log-item hit' : 'trial-log-item';
            return `<span class="${className}">${entry.outcome}</span>`;
        }).join('');
    }

    function runTrials(count) {
        const experiment = currentExperiment();
        const event = currentEvent();
        if (!event) {
            return;
        }

        for (let i = 0; i < count; i += 1) {
            const outcome = experiment.sample();
            const hit = event.outcomes.includes(outcome);
            state.trials += 1;
            if (hit) {
                state.hits += 1;
            }
            state.log.unshift({ outcome, hit });
        }

        state.log = state.log.slice(0, 24);
        updateSimulationView();
    }

    experimentSelect.addEventListener('change', () => {
        fillEventSelect();
        resetSimulation();
    });

    eventSelect.addEventListener('change', resetSimulation);
    resetButton.addEventListener('click', resetSimulation);

    runButtons.forEach(button => {
        button.addEventListener('click', () => {
            const count = Number(button.dataset.run);
            runTrials(count);
        });
    });

    fillEventSelect();
    resetSimulation();
}

// =============================================
// EXERCISES
// =============================================

function initExercises() {
    const buttons = document.querySelectorAll('.btn-check[data-exercise]');
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
            const explanation = card.dataset.explanation;
            const status = ensureElement(`ex${number}Status`);
            const feedback = ensureElement(`ex${number}Feedback`);

            let isCorrect = false;
            let answerForFeedback = answer;

            if (type === 'choice') {
                const choiceResult = evaluateChoice(card, number, answer);
                if (choiceResult === null) {
                    alert('Vyberte prosím jednu odpověď.');
                    return;
                }
                isCorrect = choiceResult.isCorrect;
                answerForFeedback = choiceResult.answerText;
            } else if (type === 'fraction') {
                isCorrect = evaluateFraction(card, number, answer);
                if (isCorrect === null) {
                    alert('Zadejte prosím odpověď.');
                    return;
                }
            }

            button.disabled = true;
            setExerciseResult(status, feedback, isCorrect, answerForFeedback, explanation);
            checkCompletion();
        });
    });
}

function evaluateChoice(card, number, answer) {
    const selectedOption = card.querySelector(`input[name="ex${number}"]:checked`);
    const options = card.querySelectorAll(`input[name="ex${number}"]`);

    if (!selectedOption) {
        return null;
    }

    const correctOption = card.querySelector(`input[name="ex${number}"][value="${answer}"]`);
    const correctLabelText = correctOption
        ? (correctOption.closest('.option')?.querySelector('span')?.textContent?.trim() || answer)
        : answer;

    options.forEach(option => {
        option.disabled = true;
        const optionLabel = option.closest('.option');
        if (!optionLabel) {
            return;
        }

        if (option.value === answer) {
            optionLabel.classList.add('correct');
        }
        if (option === selectedOption && option.value !== answer) {
            optionLabel.classList.add('incorrect');
        }
    });

    return {
        isCorrect: selectedOption.value === answer,
        answerText: correctLabelText
    };
}

function evaluateFraction(card, number, answer) {
    const input = ensureElement(`ex${number}Input`);
    if (!input) {
        return null;
    }

    const raw = input.value.trim();
    if (!raw) {
        return null;
    }

    input.disabled = true;
    const userValue = parseFractionOrDecimal(raw);
    const expectedValue = parseFractionOrDecimal(answer);

    if (userValue === null || expectedValue === null) {
        input.classList.add('incorrect');
        return false;
    }

    const isCorrect = Math.abs(userValue - expectedValue) < 1e-9;
    input.classList.toggle('incorrect', !isCorrect);
    input.classList.toggle('correct', isCorrect);

    return isCorrect;
}

function parseFractionOrDecimal(rawInput) {
    const input = rawInput.replace(/\s+/g, '').replace(',', '.').trim();
    if (!input) {
        return null;
    }

    if (/^-?\d+\/-?\d+$/.test(input)) {
        const [numerator, denominator] = input.split('/').map(Number);
        if (denominator === 0) {
            return null;
        }
        return numerator / denominator;
    }

    const numeric = Number(input);
    if (Number.isNaN(numeric)) {
        return null;
    }
    return numeric;
}

function setExerciseResult(status, feedback, isCorrect, answer, explanation) {
    status.textContent = isCorrect ? '✓ Správně' : '✗ Chybně';
    status.className = `exercise-status ${isCorrect ? 'correct' : 'incorrect'}`;

    const answerText = `<span class="correct-value">Správná odpověď: ${answer}</span>`;
    feedback.innerHTML = isCorrect
        ? `${explanation}`
        : `${explanation}<br>${answerText}`;
    feedback.className = `exercise-feedback show ${isCorrect ? 'correct' : 'incorrect'}`;
}

function checkCompletion() {
    const buttons = document.querySelectorAll('.btn-check[data-exercise]');
    const allDone = Array.from(buttons).every(button => button.disabled);
    const completeBanner = ensureElement('lessonComplete');
    if (completeBanner) {
        completeBanner.style.display = allDone ? 'block' : 'none';
    }
}
