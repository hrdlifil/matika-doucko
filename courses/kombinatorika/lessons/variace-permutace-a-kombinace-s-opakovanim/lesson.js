
// Kombinatorika - Lekce 3: Variace, permutace a kombinace s opakováním

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initNavbarScroll();

    initVariationDemo();
    initPermutationDemo();
    initCombinationDemo();

    initChallenges();
    initExercises();
});

// =============================================
// NAVIGATION
// =============================================

function initNavigation() {
    const sidebarLinks = Array.from(document.querySelectorAll('.sidebar-link'));
    const sections = Array.from(document.querySelectorAll('.lesson-section'));
    const nextButtons = document.querySelectorAll('.btn-next');
    const prevButtons = document.querySelectorAll('.btn-prev');
    const progressFill = document.querySelector('.progress-fill-small');

    if (!sidebarLinks.length || !sections.length) {
        return;
    }

    const sectionOrder = sidebarLinks.map(link => link.dataset.section);

    function showSection(sectionId, updateHash) {
        const section = document.getElementById(sectionId);
        if (!section) {
            return;
        }

        sections.forEach(item => item.classList.remove('active'));
        sidebarLinks.forEach(link => link.classList.remove('active'));

        section.classList.add('active');

        const activeLink = sidebarLinks.find(link => link.dataset.section === sectionId);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        const index = sectionOrder.indexOf(sectionId);
        if (index >= 0 && progressFill) {
            progressFill.style.width = `${((index + 1) / sectionOrder.length) * 100}%`;
        }

        if (updateHash) {
            history.replaceState(null, '', `#${sectionId}`);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            showSection(link.dataset.section, true);
        });
    });

    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            showSection(button.dataset.next, true);
        });
    });

    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            showSection(button.dataset.prev, true);
        });
    });

    const hashId = window.location.hash ? window.location.hash.slice(1) : '';
    if (hashId && sectionOrder.includes(hashId)) {
        showSection(hashId, false);
    } else {
        showSection(sectionOrder[0], false);
    }

    window.addEventListener('hashchange', () => {
        const nextId = window.location.hash.slice(1);
        if (sectionOrder.includes(nextId)) {
            showSection(nextId, false);
        }
    });
}

function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) {
        return;
    }

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 10, 15, 0.95)';
        } else {
            navbar.style.background = 'rgba(10, 10, 15, 0.8)';
        }
    });
}

// =============================================
// HELPERS
// =============================================

const ALNUM_REGEX = (() => {
    try {
        return new RegExp('[\\p{L}\\p{N}]', 'u');
    } catch (error) {
        return /[A-Z0-9]/;
    }
})();

function factorialBigInt(n) {
    if (!Number.isInteger(n) || n < 0) {
        return null;
    }

    let result = 1n;
    for (let i = 2; i <= n; i += 1) {
        result *= BigInt(i);
    }

    return result;
}

function permutationBigInt(n, k) {
    if (!Number.isInteger(n) || !Number.isInteger(k) || n < 0 || k < 0 || k > n) {
        return null;
    }

    let result = 1n;
    for (let i = 0; i < k; i += 1) {
        result *= BigInt(n - i);
    }

    return result;
}

function combinationBigInt(n, k) {
    if (!Number.isInteger(n) || !Number.isInteger(k) || n < 0 || k < 0 || k > n) {
        return null;
    }

    const kk = Math.min(k, n - k);
    let result = 1n;

    for (let i = 1; i <= kk; i += 1) {
        result = (result * BigInt(n - kk + i)) / BigInt(i);
    }

    return result;
}

function powerBigInt(base, exponent) {
    if (!Number.isInteger(base) || !Number.isInteger(exponent) || base < 0 || exponent < 0) {
        return null;
    }

    let result = 1n;
    for (let i = 0; i < exponent; i += 1) {
        result *= BigInt(base);
    }

    return result;
}

function formatBigInt(value) {
    if (value === null || value === undefined) {
        return '';
    }

    const asBigInt = typeof value === 'bigint' ? value : BigInt(value);
    return asBigInt.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function getSymbols(n) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const symbols = [];

    for (let i = 0; i < n; i += 1) {
        if (i < alphabet.length) {
            symbols.push(alphabet[i]);
        } else {
            symbols.push(`X${i - alphabet.length + 1}`);
        }
    }

    return symbols;
}

function generateVariationSamples(symbols, k, limit) {
    if (k === 0) {
        return ['()'];
    }

    const results = [];
    const current = [];

    function backtrack(depth) {
        if (results.length >= limit) {
            return;
        }

        if (depth === k) {
            results.push(`(${current.join(', ')})`);
            return;
        }

        for (let i = 0; i < symbols.length; i += 1) {
            current.push(symbols[i]);
            backtrack(depth + 1);
            current.pop();

            if (results.length >= limit) {
                return;
            }
        }
    }

    backtrack(0);
    return results;
}
function sanitizeWordInput(rawValue) {
    const upper = Array.from(rawValue.toUpperCase());
    const cleaned = upper.filter(char => ALNUM_REGEX.test(char));
    return cleaned.slice(0, 12);
}

function buildFrequencyEntries(symbols) {
    const map = new Map();

    symbols.forEach(symbol => {
        map.set(symbol, (map.get(symbol) || 0) + 1);
    });

    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], 'cs'));
}

function generatePermutationSamples(freqEntries, limit) {
    const entries = freqEntries.map(([symbol, count]) => ({ symbol, count }));
    const totalLength = entries.reduce((sum, entry) => sum + entry.count, 0);
    const current = [];
    const results = [];

    function backtrack() {
        if (results.length >= limit) {
            return;
        }

        if (current.length === totalLength) {
            results.push(current.join(''));
            return;
        }

        for (let i = 0; i < entries.length; i += 1) {
            if (entries[i].count === 0) {
                continue;
            }

            entries[i].count -= 1;
            current.push(entries[i].symbol);
            backtrack();
            current.pop();
            entries[i].count += 1;

            if (results.length >= limit) {
                return;
            }
        }
    }

    backtrack();
    return results;
}

function randomPermutationFromEntries(freqEntries) {
    const expanded = [];

    freqEntries.forEach(([symbol, count]) => {
        for (let i = 0; i < count; i += 1) {
            expanded.push(symbol);
        }
    });

    for (let i = expanded.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = expanded[i];
        expanded[i] = expanded[j];
        expanded[j] = temp;
    }

    return expanded.join('');
}

function generateMultisetSamples(symbols, k, limit) {
    if (k === 0) {
        return [[]];
    }

    const results = [];
    const current = [];

    function backtrack(startIndex) {
        if (results.length >= limit) {
            return;
        }

        if (current.length === k) {
            results.push([...current]);
            return;
        }

        for (let i = startIndex; i < symbols.length; i += 1) {
            current.push(symbols[i]);
            backtrack(i);
            current.pop();

            if (results.length >= limit) {
                return;
            }
        }
    }

    backtrack(0);
    return results;
}

function randomWeakComposition(n, k) {
    if (n === 1) {
        return [k];
    }

    if (k === 0) {
        return Array(n).fill(0);
    }

    const total = n + k - 1;
    const bars = new Set();

    while (bars.size < n - 1) {
        bars.add(Math.floor(Math.random() * total) + 1);
    }

    const sortedBars = Array.from(bars).sort((a, b) => a - b);
    const counts = [];
    let previous = 0;

    sortedBars.forEach(position => {
        counts.push(position - previous - 1);
        previous = position;
    });

    counts.push(total - previous);
    return counts;
}

function initNumericChallenge(config) {
    const input = document.getElementById(config.inputId);
    const button = document.getElementById(config.buttonId);
    const feedback = document.getElementById(config.feedbackId);

    if (!input || !button || !feedback) {
        return;
    }

    button.addEventListener('click', () => {
        const value = parseInt(input.value, 10);

        if (Number.isNaN(value)) {
            feedback.className = 'challenge-feedback incorrect';
            feedback.textContent = 'Nejdřív zadejte číselnou odpověď.';
            return;
        }

        if (value === config.correct) {
            feedback.className = 'challenge-feedback correct';
            feedback.textContent = config.correctText;
        } else {
            feedback.className = 'challenge-feedback incorrect';
            feedback.textContent = config.incorrectText;
        }
    });
}

// =============================================
// VARIACE S OPAKOVÁNÍM
// =============================================

function initVariationDemo() {
    const nSlider = document.getElementById('variationN');
    const kSlider = document.getElementById('variationK');

    if (!nSlider || !kSlider) {
        return;
    }

    const nValue = document.getElementById('variationNValue');
    const kValue = document.getElementById('variationKValue');
    const formulaOut = document.getElementById('variationFormula');
    const countOut = document.getElementById('variationCount');
    const interpretationOut = document.getElementById('variationInterpretation');
    const compareOut = document.getElementById('variationCompare');
    const poolOut = document.getElementById('variationPool');
    const slotsOut = document.getElementById('variationSlots');
    const sampleList = document.getElementById('variationSampleList');

    function render() {
        const n = parseInt(nSlider.value, 10);
        const k = parseInt(kSlider.value, 10);

        const count = powerBigInt(n, k);
        const symbols = getSymbols(n);
        const samples = generateVariationSamples(symbols, k, 14);

        nValue.textContent = String(n);
        kValue.textContent = String(k);

        formulaOut.textContent = `V_o(${n}, ${k}) = ${n}^${k}`;
        countOut.textContent = formatBigInt(count);
        interpretationOut.textContent = `${n} možností na každé ze ${k} pozic`;

        if (k <= n) {
            const withoutRepetition = permutationBigInt(n, k);
            compareOut.textContent =
                `V_o(${n}, ${k}) = ${formatBigInt(count)}, zatímco V(${n}, ${k}) = ${formatBigInt(withoutRepetition)}.`;
        } else {
            compareOut.textContent =
                `Pro k > n model bez opakování neexistuje, ale V_o(${n}, ${k}) je stále dobře definováno.`;
        }

        poolOut.innerHTML = symbols.map(symbol => `<span class="token">${symbol}</span>`).join('');
        slotsOut.innerHTML = Array.from({ length: k }, (_, index) =>
            `<span class="token">pozice ${index + 1}</span>`
        ).join('');

        const items = samples.map(item => `<li>${item}</li>`);
        const remaining = count - BigInt(samples.length);
        if (remaining > 0n) {
            items.push(`<li class="sample-muted">... a dalších ${formatBigInt(remaining)} variací</li>`);
        }

        sampleList.innerHTML = items.join('');
    }

    nSlider.addEventListener('input', render);
    kSlider.addEventListener('input', render);

    render();
}
// =============================================
// PERMUTACE S OPAKOVÁNÍM
// =============================================

function initPermutationDemo() {
    const wordInput = document.getElementById('permWordInput');
    const randomButton = document.getElementById('permRandomBtn');

    if (!wordInput || !randomButton) {
        return;
    }

    const chips = Array.from(document.querySelectorAll('.word-chip'));
    const totalOut = document.getElementById('permTotalN');
    const frequencyOut = document.getElementById('permFrequency');
    const formulaOut = document.getElementById('permFormula');
    const countOut = document.getElementById('permCount');
    const insightOut = document.getElementById('permInsight');
    const sampleList = document.getElementById('permSampleList');
    const randomValueOut = document.getElementById('permRandomValue');

    let currentEntries = [];

    function render() {
        const cleaned = sanitizeWordInput(wordInput.value);
        const fallbackUsed = cleaned.length === 0;
        const symbols = fallbackUsed ? ['A'] : cleaned;

        currentEntries = buildFrequencyEntries(symbols);

        const n = symbols.length;
        const numerator = factorialBigInt(n);
        let denominator = 1n;

        currentEntries.forEach(([, count]) => {
            denominator *= factorialBigInt(count);
        });

        const count = numerator / denominator;
        const denominatorTerms = currentEntries
            .filter(([, c]) => c > 1)
            .map(([, c]) => `${c}!`);

        totalOut.textContent = String(n);

        frequencyOut.innerHTML = currentEntries
            .map(([symbol, countValue]) => `<span class="frequency-badge">${symbol}:${countValue}</span>`)
            .join('');

        formulaOut.textContent = denominatorTerms.length > 0
            ? `${n}! / (${denominatorTerms.join(' · ')})`
            : `${n}!`;

        countOut.textContent = formatBigInt(count);

        if (fallbackUsed) {
            insightOut.textContent = 'Prázdný vstup byl nahrazen symbolem A, takže výsledek je 1.';
        } else if (denominatorTerms.length === 0) {
            insightOut.textContent = 'Všechna písmena jsou různá, proto dostáváme běžnou permutaci n!.';
        } else {
            insightOut.textContent =
                `Stejné symboly dělíme přes ${denominatorTerms.join(' · ')}, aby nevznikalo vícenásobné započítání.`;
        }

        const samples = generatePermutationSamples(currentEntries, 12);
        const items = samples.map(item => `<li>${item}</li>`);
        const remaining = count - BigInt(samples.length);

        if (remaining > 0n) {
            items.push(`<li class="sample-muted">... a dalších ${formatBigInt(remaining)} uspořádání</li>`);
        }

        sampleList.innerHTML = items.join('');
        randomValueOut.textContent = samples.length ? samples[0] : '-';
    }

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            wordInput.value = chip.dataset.word || '';
            render();
        });
    });

    wordInput.addEventListener('input', render);

    randomButton.addEventListener('click', () => {
        if (!currentEntries.length) {
            return;
        }

        randomValueOut.textContent = randomPermutationFromEntries(currentEntries);
    });

    render();
}

// =============================================
// KOMBINACE S OPAKOVÁNÍM
// =============================================

function initCombinationDemo() {
    const nSlider = document.getElementById('comboN');
    const kSlider = document.getElementById('comboK');
    const randomButton = document.getElementById('comboRandomBtn');

    if (!nSlider || !kSlider || !randomButton) {
        return;
    }

    const nValue = document.getElementById('comboNValue');
    const kValue = document.getElementById('comboKValue');
    const formulaOut = document.getElementById('comboFormula');
    const countOut = document.getElementById('comboCount');
    const symmetryOut = document.getElementById('comboSymmetry');
    const equationOut = document.getElementById('comboEquation');
    const solutionOut = document.getElementById('comboSolution');
    const starsBarsOut = document.getElementById('starsBars');
    const compositionOut = document.getElementById('comboCompositionReadout');
    const sampleList = document.getElementById('comboSampleList');

    let currentComposition = [];

    function updateCompositionVisual(symbols, counts) {
        const tokens = [];

        counts.forEach((count, index) => {
            for (let i = 0; i < count; i += 1) {
                tokens.push('<span class="bars-stars-token star">★</span>');
            }

            if (index < counts.length - 1) {
                tokens.push('<span class="bars-stars-token bar">|</span>');
            }
        });

        starsBarsOut.innerHTML = tokens.join('');
        compositionOut.textContent = counts.map((count, index) => `${symbols[index]}:${count}`).join(' · ');
        solutionOut.textContent = `(${counts.join(', ')})`;
    }

    function render() {
        const n = parseInt(nSlider.value, 10);
        const k = parseInt(kSlider.value, 10);

        const symbols = getSymbols(n);
        const transformedN = n + k - 1;
        const count = combinationBigInt(transformedN, k);

        nValue.textContent = String(n);
        kValue.textContent = String(k);
        formulaOut.textContent = `C_o(${n}, ${k}) = C(${transformedN}, ${k})`;
        countOut.textContent = formatBigInt(count);
        symmetryOut.textContent = `C(${transformedN}, ${k}) = C(${transformedN}, ${n - 1})`;

        const equationParts = symbols.map((_, index) => `x${index + 1}`);
        equationOut.textContent = `${equationParts.join(' + ')} = ${k}`;

        const samples = generateMultisetSamples(symbols, k, 14);
        const items = samples.map(sample => {
            if (sample.length === 0) {
                return '<li>{ }</li>';
            }
            return `<li>{${sample.join(', ')}}</li>`;
        });

        const remaining = count - BigInt(samples.length);
        if (remaining > 0n) {
            items.push(`<li class="sample-muted">... a dalších ${formatBigInt(remaining)} kombinací</li>`);
        }

        sampleList.innerHTML = items.join('');

        if (currentComposition.length !== n || currentComposition.reduce((sum, value) => sum + value, 0) !== k) {
            currentComposition = randomWeakComposition(n, k);
        }

        updateCompositionVisual(symbols, currentComposition);
    }

    randomButton.addEventListener('click', () => {
        const n = parseInt(nSlider.value, 10);
        const k = parseInt(kSlider.value, 10);
        currentComposition = randomWeakComposition(n, k);
        updateCompositionVisual(getSymbols(n), currentComposition);
    });

    nSlider.addEventListener('input', render);
    kSlider.addEventListener('input', render);

    render();
}
// =============================================
// CHALLENGES
// =============================================

function initChallenges() {
    initNumericChallenge({
        inputId: 'variationChallengeInput',
        buttonId: 'variationChallengeCheck',
        feedbackId: 'variationChallengeFeedback',
        correct: 15625,
        correctText: 'Správně. V_o(5,6) = 5^6 = 15 625.',
        incorrectText: 'Nesprávně. Správně je 15 625, protože na každé z 6 pozic je 5 možností, tedy 5^6.'
    });

    initNumericChallenge({
        inputId: 'permChallengeInput',
        buttonId: 'permChallengeCheck',
        feedbackId: 'permChallengeFeedback',
        correct: 60,
        correctText: 'Správně. BANANA má 6 písmen, A je 3x a N 2x, tedy 6!/(3!·2!) = 60.',
        incorrectText: 'Nesprávně. Správně je 60, protože 6!/(3!·2!) = 720/12 = 60.'
    });

    initNumericChallenge({
        inputId: 'comboChallengeInput',
        buttonId: 'comboChallengeCheck',
        feedbackId: 'comboChallengeFeedback',
        correct: 126,
        correctText: 'Správně. C_o(6,4) = C(9,4) = 126.',
        incorrectText: 'Nesprávně. Správně je 126, protože C_o(6,4) = C(6+4-1,4) = C(9,4).'
    });
}

// =============================================
// FINAL EXERCISES
// =============================================

function initExercises() {
    const feedbackData = {
        1: {
            correct: 'Správně. V_o(4,3) = 4^3 = 64.',
            incorrect: 'Nesprávně. Správně je 64, protože variace s opakováním počítáme jako n^k.'
        },
        2: {
            correct: 'Správně. U kódu je důležité pořadí a opakování je dovoleno, takže V_o(10,5).',
            incorrect: 'Nesprávně. Správný model je V_o(10,5), protože pořadí pozic je důležité a číslice se mohou opakovat.'
        },
        3: {
            correct: 'Správně. TATAR: 5!/(2!·2!) = 120/4 = 30.',
            incorrect: 'Nesprávně. Správně je 30, protože TATAR má dvě A a dvě T.'
        },
        4: {
            correct: 'Správně. Obecný vzorec je n!/(n1!·...·nr!).',
            incorrect: 'Nesprávně. Správný vzorec je n!/(n1!·...·nr!), kde ni jsou četnosti stejných prvků.'
        },
        5: {
            correct: 'Správně. C_o(5,3) = C(7,3) = 35.',
            incorrect: 'Nesprávně. Správně je 35, protože C_o(5,3)=C(5+3-1,3)=C(7,3).'
        },
        6: {
            correct: 'Správně. C_o(4,6) = C(9,6) = 84.',
            incorrect: 'Nesprávně. Správně je 84, protože C_o(4,6)=C(4+6-1,6)=C(9,6).'
        }
    };

    document.querySelectorAll('.exercise-status').forEach(status => {
        status.textContent = 'Nezodpovězeno';
    });

    document.querySelectorAll('.btn-check').forEach(button => {
        button.addEventListener('click', () => {
            const exNum = button.dataset.exercise;
            const correctAnswer = button.dataset.correct;
            const selected = document.querySelector(`input[name="ex${exNum}"]:checked`);
            const status = document.getElementById(`ex${exNum}Status`);
            const feedback = document.getElementById(`ex${exNum}Feedback`);

            if (!selected) {
                alert('Vyberte prosím odpověď.');
                return;
            }

            const isCorrect = selected.value === correctAnswer;
            const options = document.querySelectorAll(`input[name="ex${exNum}"]`);

            options.forEach(option => {
                option.disabled = true;
                const label = option.closest('.option');
                if (option.value === correctAnswer) {
                    label.classList.add('correct');
                } else if (option.checked && !isCorrect) {
                    label.classList.add('incorrect');
                }
            });

            button.disabled = true;

            if (status) {
                status.textContent = isCorrect ? '✓ Správně' : '✕ Špatně';
                status.className = `exercise-status ${isCorrect ? 'correct' : 'incorrect'}`;
            }

            if (feedback) {
                feedback.textContent = feedbackData[exNum][isCorrect ? 'correct' : 'incorrect'];
                feedback.className = `exercise-feedback show ${isCorrect ? 'correct' : 'incorrect'}`;
            }

            const allDone = Array.from(document.querySelectorAll('.btn-check')).every(btn => btn.disabled);
            if (allDone) {
                const complete = document.getElementById('lessonComplete');
                if (complete) {
                    complete.style.display = 'block';
                }
            }
        });
    });
}
