// Operace s mnozinami - interactive lesson logic

document.addEventListener('DOMContentLoaded', () => {
    initNavbarScroll();
    initNavigation();
    initQuickChecks();
    initVennLab();
    initExercises();
});

function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) {
        return;
    }

    window.addEventListener('scroll', () => {
        navbar.style.background = window.scrollY > 50
            ? 'rgba(10, 10, 15, 0.95)'
            : 'rgba(10, 10, 15, 0.8)';
    });
}

function initNavigation() {
    const sectionOrder = ['overview', 'intersection', 'union', 'difference', 'complement', 'lab', 'exercises'];
    const sections = sectionOrder
        .map(id => document.getElementById(id))
        .filter(Boolean);

    const links = Array.from(document.querySelectorAll('.sidebar-link'));
    const nextButtons = document.querySelectorAll('.btn-next');
    const prevButtons = document.querySelectorAll('.btn-prev');
    const progressFill = document.querySelector('.progress-fill-small');

    function showSection(sectionId, smoothScroll = true, updateHash = true) {
        if (!sectionOrder.includes(sectionId)) {
            return;
        }

        sections.forEach(section => {
            section.classList.toggle('active', section.id === sectionId);
        });

        links.forEach(link => {
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

        window.scrollTo({
            top: 0,
            behavior: smoothScroll ? 'smooth' : 'auto'
        });
    }

    links.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            showSection(link.dataset.section, true, true);
        });
    });

    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            showSection(button.dataset.next, true, true);
        });
    });

    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            showSection(button.dataset.prev, true, true);
        });
    });

    const hashId = window.location.hash.replace('#', '');
    if (sectionOrder.includes(hashId)) {
        showSection(hashId, false, false);
    } else {
        showSection(sectionOrder[0], false, false);
    }
}

function initQuickChecks() {
    const cards = document.querySelectorAll('.quick-check');
    cards.forEach(card => {
        const input = card.querySelector('.set-input');
        const button = card.querySelector('.btn-quick-check');
        const feedback = card.querySelector('.quick-check-feedback');
        const parsedAnswer = parseSetInput(card.dataset.answer || '');
        const expected = parsedAnswer.valid ? parsedAnswer.elements : [];

        function evaluate() {
            const userParsed = parseSetInput(input.value);
            if (!userParsed.valid) {
                setFeedback(feedback, false, userParsed.message);
                return;
            }

            const isCorrect = areSameSets(userParsed.elements, expected);
            if (isCorrect) {
                setFeedback(feedback, true, `Správně. Výsledek je ${formatSet(expected)}.`);
            } else {
                setFeedback(feedback, false, `Nesprávně. Správný výsledek je ${formatSet(expected)}.`);
            }
        }

        button.addEventListener('click', evaluate);
        input.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                evaluate();
            }
        });
    });
}

function initVennLab() {
    const canvas = document.getElementById('vennCanvas');
    if (!canvas) {
        return;
    }

    const ctx = canvas.getContext('2d');

    const universe = Array.from({ length: 12 }, (_, index) => index + 1);
    let setA = new Set([1, 2, 3, 6, 9]);
    let setB = new Set([2, 4, 6, 8, 10]);
    let operation = 'intersection';

    const operationMeta = {
        intersection: {
            labelHtml: 'A ∩ B',
            description: 'Prvky, které jsou současně v množině A i v množině B.'
        },
        union: {
            labelHtml: 'A ∪ B',
            description: 'Prvky, které jsou alespoň v jedné z množin A nebo B.'
        },
        differenceAB: {
            labelHtml: 'A \\ B',
            description: 'Prvky z A po odebrání všech prvků, které patří do B.'
        },
        differenceBA: {
            labelHtml: 'B \\ A',
            description: 'Prvky z B po odebrání všech prvků, které patří do A.'
        },
        complementA: {
            labelHtml: 'A<sup>c</sup>',
            description: 'Prvky univerzální množiny U, které neleží v A.'
        },
        complementB: {
            labelHtml: 'B<sup>c</sup>',
            description: 'Prvky univerzální množiny U, které neleží v B.'
        }
    };

    const universeDisplay = document.getElementById('universeDisplay');
    const operationSelect = document.getElementById('operationSelect');
    const operationDescription = document.getElementById('operationDescription');
    const setAChips = document.getElementById('setAChips');
    const setBChips = document.getElementById('setBChips');
    const resultEquation = document.getElementById('resultEquation');
    const resultMeta = document.getElementById('resultMeta');
    const randomizeButton = document.getElementById('randomizeSets');
    const clearButton = document.getElementById('clearSets');

    if (universeDisplay) {
        universeDisplay.textContent = `U = ${formatSet(universe.map(value => String(value)))}`;
    }

    const chipRefsA = createChips(setAChips, universe, value => {
        if (setA.has(value)) {
            setA.delete(value);
        } else {
            setA.add(value);
        }
        render();
    });

    const chipRefsB = createChips(setBChips, universe, value => {
        if (setB.has(value)) {
            setB.delete(value);
        } else {
            setB.add(value);
        }
        render();
    });

    operationSelect.addEventListener('change', () => {
        operation = operationSelect.value;
        render();
    });

    randomizeButton.addEventListener('click', () => {
        setA = randomSubset(universe);
        setB = randomSubset(universe);
        render();
    });

    clearButton.addEventListener('click', () => {
        setA = new Set();
        setB = new Set();
        render();
    });

    function render() {
        chipRefsA.forEach((button, value) => {
            button.classList.toggle('active', setA.has(value));
        });

        chipRefsB.forEach((button, value) => {
            button.classList.toggle('active', setB.has(value));
        });

        const result = computeOperation(universe, setA, setB, operation);
        const meta = operationMeta[operation];

        resultEquation.innerHTML = `${meta.labelHtml} = ${formatSet(result.map(value => String(value)))}`;
        resultMeta.textContent = `|A| = ${setA.size}, |B| = ${setB.size}, |výsledek| = ${result.length}`;
        operationDescription.textContent = meta.description;

        drawVennDiagram(ctx, canvas, universe, setA, setB, result, operation);
    }

    render();
}

function createChips(container, universe, onToggle) {
    const refs = new Map();
    container.innerHTML = '';

    universe.forEach(value => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'set-chip';
        button.textContent = String(value);
        button.addEventListener('click', () => onToggle(value));
        container.appendChild(button);
        refs.set(value, button);
    });

    return refs;
}

function computeOperation(universe, setA, setB, operation) {
    switch (operation) {
        case 'intersection':
            return universe.filter(value => setA.has(value) && setB.has(value));
        case 'union':
            return universe.filter(value => setA.has(value) || setB.has(value));
        case 'differenceAB':
            return universe.filter(value => setA.has(value) && !setB.has(value));
        case 'differenceBA':
            return universe.filter(value => setB.has(value) && !setA.has(value));
        case 'complementA':
            return universe.filter(value => !setA.has(value));
        case 'complementB':
            return universe.filter(value => !setB.has(value));
        default:
            return [];
    }
}

function drawVennDiagram(ctx, canvas, universe, setA, setB, resultArray, operation) {
    const width = canvas.width;
    const height = canvas.height;
    const universeRect = { x: 24, y: 20, w: width - 48, h: height - 40 };
    const circleA = { x: 250, y: 198, r: 118 };
    const circleB = { x: 390, y: 198, r: 118 };

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0b101a';
    ctx.fillRect(0, 0, width, height);

    drawOperationHighlight(ctx, operation, universeRect, circleA, circleB);

    ctx.strokeStyle = 'rgba(226, 232, 240, 0.35)';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(universeRect.x, universeRect.y, universeRect.w, universeRect.h);

    ctx.fillStyle = 'rgba(59, 130, 246, 0.11)';
    drawCirclePath(ctx, circleA);
    ctx.fill();

    ctx.fillStyle = 'rgba(16, 185, 129, 0.11)';
    drawCirclePath(ctx, circleB);
    ctx.fill();

    ctx.strokeStyle = 'rgba(147, 197, 253, 0.9)';
    ctx.lineWidth = 2;
    drawCirclePath(ctx, circleA);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(110, 231, 183, 0.9)';
    drawCirclePath(ctx, circleB);
    ctx.stroke();

    ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';
    ctx.font = '600 16px Inter, sans-serif';
    ctx.fillText('U', universeRect.x + 8, universeRect.y + 18);

    ctx.fillStyle = '#93c5fd';
    ctx.fillText('A', circleA.x - 74, circleA.y - circleA.r + 18);

    ctx.fillStyle = '#6ee7b7';
    ctx.fillText('B', circleB.x + 60, circleB.y - circleB.r + 18);

    const buckets = {
        aOnly: [],
        both: [],
        bOnly: [],
        outside: []
    };

    universe.forEach(value => {
        const inA = setA.has(value);
        const inB = setB.has(value);

        if (inA && inB) {
            buckets.both.push(value);
        } else if (inA) {
            buckets.aOnly.push(value);
        } else if (inB) {
            buckets.bOnly.push(value);
        } else {
            buckets.outside.push(value);
        }
    });

    const resultSet = new Set(resultArray);

    const aOnlySlots = gridSlots(circleA.x - 98, circleA.y - 66, 4, 3, 24, 36);
    const bothSlots = gridSlots((circleA.x + circleB.x) / 2 - 25, circleA.y - 66, 3, 4, 22, 30);
    const bOnlySlots = gridSlots(circleB.x + 18, circleB.y - 66, 4, 3, 24, 36);
    const outsideTop = gridSlots(universeRect.x + 44, universeRect.y + 36, 6, 1, 92, 1);
    const outsideBottom = gridSlots(universeRect.x + 44, universeRect.y + universeRect.h - 32, 6, 1, 92, 1);
    const outsideSlots = outsideTop.concat(outsideBottom);

    drawElementsInBucket(ctx, buckets.aOnly, aOnlySlots, resultSet);
    drawElementsInBucket(ctx, buckets.both, bothSlots, resultSet);
    drawElementsInBucket(ctx, buckets.bOnly, bOnlySlots, resultSet);
    drawElementsInBucket(ctx, buckets.outside, outsideSlots, resultSet);
}

function drawOperationHighlight(ctx, operation, universeRect, circleA, circleB) {
    const layer = document.createElement('canvas');
    layer.width = ctx.canvas.width;
    layer.height = ctx.canvas.height;

    const g = layer.getContext('2d');
    g.fillStyle = 'rgba(99, 102, 241, 0.34)';

    switch (operation) {
        case 'intersection': {
            g.save();
            drawCirclePath(g, circleA);
            g.clip();
            drawCirclePath(g, circleB);
            g.fill();
            g.restore();
            break;
        }
        case 'union': {
            drawCirclePath(g, circleA);
            g.fill();
            drawCirclePath(g, circleB);
            g.fill();
            break;
        }
        case 'differenceAB': {
            drawCirclePath(g, circleA);
            g.fill();
            g.globalCompositeOperation = 'destination-out';
            drawCirclePath(g, circleB);
            g.fill();
            g.globalCompositeOperation = 'source-over';
            break;
        }
        case 'differenceBA': {
            drawCirclePath(g, circleB);
            g.fill();
            g.globalCompositeOperation = 'destination-out';
            drawCirclePath(g, circleA);
            g.fill();
            g.globalCompositeOperation = 'source-over';
            break;
        }
        case 'complementA': {
            g.fillRect(universeRect.x, universeRect.y, universeRect.w, universeRect.h);
            g.globalCompositeOperation = 'destination-out';
            drawCirclePath(g, circleA);
            g.fill();
            g.globalCompositeOperation = 'source-over';
            break;
        }
        case 'complementB': {
            g.fillRect(universeRect.x, universeRect.y, universeRect.w, universeRect.h);
            g.globalCompositeOperation = 'destination-out';
            drawCirclePath(g, circleB);
            g.fill();
            g.globalCompositeOperation = 'source-over';
            break;
        }
        default:
            break;
    }

    ctx.drawImage(layer, 0, 0);
}

function drawCirclePath(context, circle) {
    context.beginPath();
    context.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
}

function gridSlots(startX, startY, cols, rows, stepX, stepY) {
    const slots = [];
    for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
            slots.push({
                x: startX + col * stepX,
                y: startY + row * stepY
            });
        }
    }
    return slots;
}

function drawElementsInBucket(ctx, values, slots, resultSet) {
    values.forEach((value, index) => {
        const baseSlot = slots[index % slots.length];
        const layer = Math.floor(index / slots.length);
        const offset = layer * 6;

        const x = baseSlot.x + (layer % 2 === 0 ? offset : -offset);
        const y = baseSlot.y + offset;

        const inResult = resultSet.has(value);

        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fillStyle = inResult ? 'rgba(16, 185, 129, 0.88)' : 'rgba(148, 163, 184, 0.38)';
        ctx.fill();

        ctx.lineWidth = 1.1;
        ctx.strokeStyle = inResult ? 'rgba(110, 231, 183, 0.95)' : 'rgba(148, 163, 184, 0.72)';
        ctx.stroke();

        ctx.fillStyle = '#0b1220';
        ctx.font = '600 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(value), x, y + 0.3);
    });
}

function randomSubset(universe) {
    const subset = new Set();
    universe.forEach(value => {
        if (Math.random() >= 0.5) {
            subset.add(value);
        }
    });
    return subset;
}

function initExercises() {
    const cards = Array.from(document.querySelectorAll('.exercise-card'));
    if (cards.length === 0) {
        return;
    }

    cards.forEach(card => {
        card.dataset.solved = 'false';

        const button = card.querySelector('.btn-check-exercise');
        if (!button) {
            return;
        }

        button.addEventListener('click', () => {
            evaluateExerciseCard(card);
            updateExerciseCompletion(cards);
        });

        const input = card.querySelector('.exercise-input');
        if (input) {
            input.addEventListener('keydown', event => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    evaluateExerciseCard(card);
                    updateExerciseCompletion(cards);
                }
            });
        }
    });
}

function evaluateExerciseCard(card) {
    const type = card.dataset.type;
    if (type === 'set') {
        evaluateSetExercise(card);
        return;
    }

    if (type === 'choice') {
        evaluateChoiceExercise(card);
    }
}

function evaluateSetExercise(card) {
    const input = card.querySelector('.exercise-input');
    const feedback = card.querySelector('.exercise-feedback');
    const expectedParsed = parseSetInput(card.dataset.answer || '');

    const userParsed = parseSetInput(input.value);
    if (!userParsed.valid) {
        setExerciseState(card, false);
        setFeedback(feedback, false, userParsed.message);
        return;
    }

    const expected = expectedParsed.valid ? expectedParsed.elements : [];
    const isCorrect = areSameSets(userParsed.elements, expected);

    if (isCorrect) {
        setExerciseState(card, true);
        setFeedback(feedback, true, `Správně. Výsledek je ${formatSet(expected)}.`);
    } else {
        setExerciseState(card, false);
        setFeedback(feedback, false, `Nesprávně. Správný výsledek je ${formatSet(expected)}.`);
    }
}

function evaluateChoiceExercise(card) {
    const feedback = card.querySelector('.exercise-feedback');
    const answer = card.dataset.answer;
    const groupName = card.dataset.name;
    const selectedInput = card.querySelector(`input[name="${groupName}"]:checked`);

    if (!selectedInput) {
        setExerciseState(card, false);
        setFeedback(feedback, false, 'Vyberte prosím jednu možnost.');
        return;
    }

    const options = Array.from(card.querySelectorAll('.option'));
    options.forEach(option => option.classList.remove('correct', 'incorrect'));

    const correctInput = card.querySelector(`input[name="${groupName}"][value="${answer}"]`);
    const correctOption = correctInput ? correctInput.closest('.option') : null;
    const selectedOption = selectedInput.closest('.option');

    const isCorrect = selectedInput.value === answer;

    if (isCorrect) {
        selectedOption.classList.add('correct');
        setExerciseState(card, true);
        setFeedback(feedback, true, 'Správně. Vybrali jste správné tvrzení.');
    } else {
        selectedOption.classList.add('incorrect');
        if (correctOption) {
            correctOption.classList.add('correct');
        }

        const correctTextElement = correctOption ? correctOption.querySelector('.option-text') : null;
        const correctText = correctTextElement ? correctTextElement.textContent.trim() : 'správná volba';

        setExerciseState(card, false);
        setFeedback(feedback, false, `Nesprávně. Správná odpověď je: ${correctText}`);
    }
}

function setExerciseState(card, isCorrect) {
    const status = card.querySelector('.exercise-status');
    card.dataset.solved = isCorrect ? 'true' : 'false';
    card.classList.toggle('solved', isCorrect);

    if (!status) {
        return;
    }

    status.textContent = isCorrect ? 'Správně' : 'Nesprávně';
    status.classList.remove('correct', 'incorrect');
    status.classList.add(isCorrect ? 'correct' : 'incorrect');
}

function updateExerciseCompletion(cards) {
    const allSolved = cards.every(card => card.dataset.solved === 'true');
    const completePanel = document.getElementById('lessonComplete');
    if (completePanel) {
        completePanel.style.display = allSolved ? 'block' : 'none';
    }
}

function setFeedback(feedbackElement, isCorrect, text) {
    feedbackElement.textContent = text;
    feedbackElement.classList.remove('correct', 'incorrect', 'show');
    feedbackElement.classList.add(isCorrect ? 'correct' : 'incorrect', 'show');
}

function parseSetInput(rawValue) {
    const raw = String(rawValue || '').trim();

    if (!raw) {
        return {
            valid: false,
            message: 'Zadejte prosím množinu, například {1, 2, 3} nebo ∅.'
        };
    }

    const lowered = raw.toLowerCase();
    if (raw === '∅' || lowered === 'empty' || lowered === 'prazdna' || raw === '{}') {
        return { valid: true, elements: [] };
    }

    let cleaned = raw
        .replace(/[{}]/g, '')
        .replace(/[;|]/g, ',')
        .replace(/[−–—]/g, '-')
        .trim();

    if (!cleaned) {
        return { valid: true, elements: [] };
    }

    const tokens = cleaned
        .split(',')
        .map(token => token.trim())
        .filter(Boolean);

    if (tokens.length === 0) {
        return { valid: true, elements: [] };
    }

    const normalized = [];
    for (const token of tokens) {
        const canonicalToken = canonicalizeToken(token);
        if (!canonicalToken) {
            return {
                valid: false,
                message: 'Použijte prvky oddělené čárkou, například {1, 3, 5}.'
            };
        }
        normalized.push(canonicalToken);
    }

    const unique = Array.from(new Set(normalized));
    unique.sort(compareSetTokens);

    return {
        valid: true,
        elements: unique
    };
}

function canonicalizeToken(token) {
    const compact = token
        .replace(/\s+/g, '')
        .replace(/[−–—]/g, '-');

    if (!compact) {
        return null;
    }

    const numericCandidate = compact.replace(',', '.');
    if (/^-?\d+(?:\.\d+)?$/.test(numericCandidate)) {
        const parsed = Number(numericCandidate);
        if (!Number.isFinite(parsed)) {
            return null;
        }

        if (Number.isInteger(parsed)) {
            return String(parsed);
        }

        const fixed = parsed.toString();
        return fixed.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
    }

    return compact.toLowerCase();
}

function compareSetTokens(left, right) {
    const leftNumeric = /^-?\d+(?:\.\d+)?$/.test(left);
    const rightNumeric = /^-?\d+(?:\.\d+)?$/.test(right);

    if (leftNumeric && rightNumeric) {
        return Number(left) - Number(right);
    }

    if (leftNumeric) {
        return -1;
    }

    if (rightNumeric) {
        return 1;
    }

    return left.localeCompare(right, 'cs');
}

function areSameSets(first, second) {
    if (first.length !== second.length) {
        return false;
    }

    for (let index = 0; index < first.length; index += 1) {
        if (first[index] !== second[index]) {
            return false;
        }
    }

    return true;
}

function formatSet(elements) {
    if (!elements || elements.length === 0) {
        return '∅';
    }

    return `{${elements.join(', ')}}`;
}
