// Základy o rovnicích - Interactive Lesson JavaScript

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initEquationExplorer();
    initDecisionChecks();
    initExercises();
});

// =============================================
// NAVIGATION
// =============================================

function initNavigation() {
    const sidebarLinks = Array.from(document.querySelectorAll('.sidebar-link'));
    const sections = Array.from(document.querySelectorAll('.lesson-section'));
    const nextButtons = Array.from(document.querySelectorAll('.btn-next'));
    const prevButtons = Array.from(document.querySelectorAll('.btn-prev'));
    const progressFill = document.querySelector('.progress-fill-small');

    if (!sidebarLinks.length || !sections.length) {
        return;
    }

    const sectionOrder = sidebarLinks.map(link => link.dataset.section);

    function showSection(sectionId, options = {}) {
        const { updateHash = true, smoothScroll = true } = options;
        if (!sectionOrder.includes(sectionId)) {
            return;
        }

        sections.forEach(section => {
            section.classList.toggle('active', section.id === sectionId);
        });

        sidebarLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.section === sectionId);
        });

        const index = sectionOrder.indexOf(sectionId);
        const progress = ((index + 1) / sectionOrder.length) * 100;
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }

        if (updateHash) {
            window.history.replaceState(null, '', `#${sectionId}`);
        }

        if (smoothScroll) {
            const lessonContent = document.querySelector('.lesson-content');
            if (lessonContent) {
                lessonContent.scrollTop = 0;
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            showSection(link.dataset.section);
        });
    });

    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            const nextSection = button.dataset.next;
            if (nextSection) {
                showSection(nextSection);
            }
        });
    });

    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            const prevSection = button.dataset.prev;
            if (prevSection) {
                showSection(prevSection);
            }
        });
    });

    const hashSection = window.location.hash ? window.location.hash.slice(1) : '';
    const initialSection = sectionOrder.includes(hashSection) ? hashSection : sectionOrder[0];
    showSection(initialSection, { updateHash: Boolean(hashSection), smoothScroll: false });

    window.addEventListener('hashchange', () => {
        const target = window.location.hash ? window.location.hash.slice(1) : '';
        if (sectionOrder.includes(target)) {
            showSection(target, { updateHash: false, smoothScroll: true });
        }
    });
}

// =============================================
// INTERACTIVE EQUATION EXPLORER
// =============================================

function initEquationExplorer() {
    const equationEl = document.getElementById('explorerEquation');
    const xSlider = document.getElementById('xSlider');
    const xValue = document.getElementById('xValue');
    const lhsValue = document.getElementById('lhsValue');
    const rhsValue = document.getElementById('rhsValue');
    const diffValue = document.getElementById('diffValue');
    const statusEl = document.getElementById('equationStatus');
    const randomButton = document.getElementById('randomEquationBtn');
    const showSolutionButton = document.getElementById('showSolutionBtn');

    if (!equationEl || !xSlider || !xValue || !lhsValue || !rhsValue || !diffValue || !statusEl) {
        return;
    }

    const state = {
        a: 2,
        b: 1,
        c: 7,
        solution: 3
    };

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function generateEquation() {
        const coefficients = [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6];
        state.a = coefficients[randomInt(0, coefficients.length - 1)];
        state.solution = randomInt(-6, 6);
        state.b = randomInt(-10, 10);
        state.c = state.a * state.solution + state.b;
    }

    function formatLinearExpression(a, b) {
        const xPart = a === 1 ? 'x' : a === -1 ? '-x' : `${a}x`;
        if (b === 0) {
            return xPart;
        }
        const sign = b > 0 ? ' + ' : ' - ';
        return `${xPart}${sign}${Math.abs(b)}`;
    }

    function formatNumber(value) {
        if (Number.isInteger(value)) {
            return String(value);
        }
        return String(Number(value.toFixed(4)));
    }

    function updateStatus(isSolution) {
        statusEl.classList.remove('status-pill-true', 'status-pill-false');
        if (isSolution) {
            statusEl.classList.add('status-pill-true');
            statusEl.textContent = 'Rovnost platí. Toto x je řešení.';
        } else {
            statusEl.classList.add('status-pill-false');
            statusEl.textContent = 'Rovnost zatím neplatí.';
        }
    }

    function updateDisplay() {
        const x = Number(xSlider.value);
        const lhs = state.a * x + state.b;
        const rhs = state.c;
        const difference = Math.abs(lhs - rhs);

        equationEl.textContent = `${formatLinearExpression(state.a, state.b)} = ${state.c}`;
        xValue.textContent = String(x);
        lhsValue.textContent = formatNumber(lhs);
        rhsValue.textContent = formatNumber(rhs);
        diffValue.textContent = formatNumber(difference);
        updateStatus(difference === 0);
    }

    xSlider.addEventListener('input', updateDisplay);

    if (randomButton) {
        randomButton.addEventListener('click', () => {
            generateEquation();
            xSlider.value = '0';
            updateDisplay();
        });
    }

    if (showSolutionButton) {
        showSolutionButton.addEventListener('click', () => {
            xSlider.value = String(state.solution);
            updateDisplay();
        });
    }

    generateEquation();
    xSlider.value = '0';
    updateDisplay();
}

// =============================================
// EQUIVALENT / NON-EQUIVALENT CHECKER
// =============================================

function initDecisionChecks() {
    const cards = Array.from(document.querySelectorAll('.decision-card'));
    const summary = document.getElementById('decisionSummary');
    if (!cards.length) {
        return;
    }

    cards.forEach(card => {
        const buttons = Array.from(card.querySelectorAll('.decision-btn'));
        const feedback = card.querySelector('.decision-feedback');
        const correctChoice = card.dataset.correct;
        const explanation = card.dataset.explanation || '';

        buttons.forEach(button => {
            button.addEventListener('click', () => {
                if (card.dataset.answered === 'true') {
                    return;
                }

                const selectedChoice = button.dataset.choice;
                const isCorrect = selectedChoice === correctChoice;
                const correctText = correctChoice === 'yes' ? 'Ekvivalentní' : 'Neekvivalentní';

                buttons.forEach(actionButton => {
                    actionButton.disabled = true;
                    if (actionButton.dataset.choice === correctChoice) {
                        actionButton.classList.add('correct-choice');
                    }
                });

                if (!isCorrect) {
                    button.classList.add('incorrect-choice');
                }

                if (feedback) {
                    feedback.textContent = isCorrect
                        ? `Správně. ${explanation}`
                        : `Nesprávně. Správná volba je: ${correctText}. ${explanation}`;
                    feedback.className = `decision-feedback show ${isCorrect ? 'correct' : 'incorrect'}`;
                }

                card.dataset.answered = 'true';
                card.dataset.result = isCorrect ? '1' : '0';
                updateDecisionSummary(cards, summary);
            });
        });
    });
}

function updateDecisionSummary(cards, summaryEl) {
    if (!summaryEl) {
        return;
    }

    const answeredCards = cards.filter(card => card.dataset.answered === 'true');
    if (answeredCards.length !== cards.length) {
        return;
    }

    const correctCount = answeredCards.filter(card => card.dataset.result === '1').length;
    summaryEl.textContent = `Všechny situace jsou vyhodnocené: ${correctCount} / ${cards.length} správně.`;
    summaryEl.classList.remove('hidden');
}

// =============================================
// EXERCISES
// =============================================

function initExercises() {
    const checkButtons = Array.from(document.querySelectorAll('.btn-check'));
    if (!checkButtons.length) {
        return;
    }

    checkButtons.forEach(button => {
        button.addEventListener('click', () => {
            const exerciseNum = button.dataset.exercise;
            const exercise = exerciseNum ? document.getElementById(`exercise${exerciseNum}`) : null;
            if (!exercise) {
                return;
            }

            const type = exercise.dataset.type;
            const expected = exercise.dataset.answer || '';

            if (type === 'number') {
                handleNumberExercise(exercise, button, expected);
            } else if (type === 'set') {
                handleSetExercise(exercise, button, expected);
            } else if (type === 'choice') {
                handleChoiceExercise(exercise, button, expected);
            }
        });
    });
}

function handleNumberExercise(exercise, button, expectedRaw) {
    const input = exercise.querySelector('.exercise-input');
    if (!input) {
        return;
    }

    const userValue = parseMathNumber(input.value);
    const expectedValue = parseMathNumber(expectedRaw);
    if (!Number.isFinite(userValue)) {
        showInterimFeedback(exercise, 'Zadejte prosím číselný výsledek (např. 5 nebo 10/2).');
        return;
    }

    const isCorrect = nearlyEqual(userValue, expectedValue);
    let message = '';

    if (isCorrect) {
        message = `Správně. Výsledek je x = ${formatOutputNumber(expectedValue)}.`;
    } else if (exercise.id === 'exercise2') {
        message = `Nesprávně. Správný výsledek je x = ${formatOutputNumber(expectedValue)} a navíc musí platit podmínka x ≠ 1.`;
    } else {
        message = `Nesprávně. Správný výsledek je x = ${formatOutputNumber(expectedValue)}.`;
    }

    finalizeExercise(exercise, button, isCorrect, message);
}

function handleSetExercise(exercise, button, expectedRaw) {
    const input = exercise.querySelector('.exercise-input');
    if (!input) {
        return;
    }

    const userSet = parseNumberSet(input.value);
    const expectedSet = parseNumberSet(expectedRaw);

    if (!userSet.valid) {
        showInterimFeedback(exercise, 'Zadejte prosím množinu čísel oddělených čárkou, např. 3 nebo 1, 2.');
        return;
    }

    const isCorrect = areNumberSetsEqual(userSet.values, expectedSet.values);
    const expectedDisplay = expectedSet.values.map(formatOutputNumber).join(', ');
    const message = isCorrect
        ? `Správně. Množina řešení je {${expectedDisplay}}.`
        : `Nesprávně. Správná množina řešení je {${expectedDisplay}}.`;

    finalizeExercise(exercise, button, isCorrect, message);
}

function handleChoiceExercise(exercise, button, expectedRaw) {
    const exerciseId = exercise.id.replace('exercise', '');
    const selected = document.querySelector(`input[name="ex${exerciseId}"]:checked`);
    if (!selected) {
        showInterimFeedback(exercise, 'Vyberte prosím jednu možnost.');
        return;
    }

    const options = Array.from(exercise.querySelectorAll('input[type="radio"]'));
    const isCorrect = selected.value === expectedRaw;
    const correctOption = options.find(option => option.value === expectedRaw);

    options.forEach(option => {
        option.disabled = true;
    });

    selected.parentElement.classList.add(isCorrect ? 'correct' : 'incorrect');
    if (!isCorrect && correctOption) {
        correctOption.parentElement.classList.add('correct');
    }

    const correctLabel = correctOption ? correctOption.parentElement.textContent.trim() : expectedRaw;
    const message = isCorrect
        ? 'Správně. Riziková je pouze úprava dělením výrazem, který může být nulový.'
        : `Nesprávně. Správná odpověď: ${correctLabel}.`;

    finalizeExercise(exercise, button, isCorrect, message);
}

function finalizeExercise(exercise, button, isCorrect, message) {
    const exerciseId = exercise.id.replace('exercise', '');
    const feedback = document.getElementById(`ex${exerciseId}Feedback`);
    const status = document.getElementById(`ex${exerciseId}Status`);

    if (feedback) {
        feedback.textContent = message;
        feedback.className = `exercise-feedback show ${isCorrect ? 'correct' : 'incorrect'}`;
    }

    if (status) {
        status.textContent = isCorrect ? '✓ Správně' : '✗ Špatně';
        status.className = `exercise-status ${isCorrect ? 'correct' : 'incorrect'}`;
    }

    exercise.dataset.correct = isCorrect ? '1' : '0';
    button.disabled = true;

    const inputs = Array.from(exercise.querySelectorAll('input'));
    inputs.forEach(input => {
        input.disabled = true;
    });

    checkAllExercisesComplete();
}

function showInterimFeedback(exercise, message) {
    const exerciseId = exercise.id.replace('exercise', '');
    const feedback = document.getElementById(`ex${exerciseId}Feedback`);
    if (!feedback) {
        return;
    }

    feedback.textContent = message;
    feedback.className = 'exercise-feedback show incorrect';
}

function checkAllExercisesComplete() {
    const buttons = Array.from(document.querySelectorAll('.btn-check'));
    const allCompleted = buttons.every(button => button.disabled);
    if (!allCompleted) {
        return;
    }

    const exercises = Array.from(document.querySelectorAll('.exercise'));
    const correctCount = exercises.filter(exercise => exercise.dataset.correct === '1').length;

    const finalScore = document.getElementById('finalScore');
    if (finalScore) {
        finalScore.textContent = `${correctCount} / ${exercises.length}`;
    }

    const lessonComplete = document.getElementById('lessonComplete');
    if (lessonComplete) {
        lessonComplete.style.display = 'block';
    }
}

// =============================================
// UTILITIES
// =============================================

function parseMathNumber(rawValue) {
    if (typeof rawValue !== 'string') {
        return NaN;
    }

    let cleaned = rawValue.trim();
    if (!cleaned) {
        return NaN;
    }

    cleaned = cleaned
        .replace(/\s+/g, '')
        .replace(/,/g, '.')
        .replace(/−/g, '-');

    if (cleaned.includes('/')) {
        const parts = cleaned.split('/');
        if (parts.length !== 2) {
            return NaN;
        }
        const numerator = Number(parts[0]);
        const denominator = Number(parts[1]);
        if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
            return NaN;
        }
        return numerator / denominator;
    }

    const value = Number(cleaned);
    return Number.isFinite(value) ? value : NaN;
}

function parseNumberSet(rawValue) {
    if (typeof rawValue !== 'string') {
        return { valid: false, values: [] };
    }

    const cleaned = rawValue.replace(/[{}]/g, '').trim();
    if (!cleaned) {
        return { valid: false, values: [] };
    }

    const parts = cleaned.split(/[;,]/).map(part => part.trim()).filter(Boolean);
    if (!parts.length) {
        return { valid: false, values: [] };
    }

    const values = [];
    for (const part of parts) {
        const parsed = parseMathNumber(part);
        if (!Number.isFinite(parsed)) {
            return { valid: false, values: [] };
        }
        if (!values.some(value => nearlyEqual(value, parsed))) {
            values.push(parsed);
        }
    }

    values.sort((a, b) => a - b);
    return { valid: true, values };
}

function nearlyEqual(a, b, tolerance = 1e-9) {
    return Math.abs(a - b) <= tolerance;
}

function areNumberSetsEqual(first, second) {
    if (first.length !== second.length) {
        return false;
    }
    for (let i = 0; i < first.length; i += 1) {
        if (!nearlyEqual(first[i], second[i])) {
            return false;
        }
    }
    return true;
}

function formatOutputNumber(value) {
    if (Number.isInteger(value)) {
        return String(value);
    }
    return String(Number(value.toFixed(6)));
}
