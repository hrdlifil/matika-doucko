// Kombinatorika - Lekce 2: Variace, permutace a kombinace bez opakování

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initNavbarScroll();

    initFactorialDemo();
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

function formatBigInt(value) {
    if (value === null || value === undefined) {
        return '';
    }

    const asBigInt = typeof value === 'bigint' ? value : BigInt(value);
    return asBigInt.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function buildFactorialProduct(n) {
    if (n === 0) {
        return '0! = 1';
    }
    if (n === 1) {
        return '1! = 1';
    }

    const parts = [];
    for (let i = n; i >= 1; i -= 1) {
        parts.push(String(i));
    }
    return `${n}! = ${parts.join(' · ')}`;
}

function buildFallingProduct(n, k) {
    if (k === 0) {
        return '1';
    }

    const parts = [];
    for (let i = 0; i < k; i += 1) {
        parts.push(String(n - i));
    }
    return parts.join(' · ');
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
    const results = [];
    const used = Array(symbols.length).fill(false);
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
            if (used[i]) {
                continue;
            }

            used[i] = true;
            current.push(symbols[i]);
            backtrack(depth + 1);
            current.pop();
            used[i] = false;

            if (results.length >= limit) {
                return;
            }
        }
    }

    backtrack(0);
    return results;
}

function generateCombinationSamples(symbols, k, limit) {
    const results = [];
    const current = [];

    function backtrack(start) {
        if (results.length >= limit) {
            return;
        }

        if (current.length === k) {
            results.push(`{${current.join(', ')}}`);
            return;
        }

        const remainingNeeded = k - current.length;
        for (let i = start; i <= symbols.length - remainingNeeded; i += 1) {
            current.push(symbols[i]);
            backtrack(i + 1);
            current.pop();

            if (results.length >= limit) {
                return;
            }
        }
    }

    backtrack(0);
    return results;
}

function generatePermutationList(symbols) {
    const results = [];
    const used = Array(symbols.length).fill(false);
    const current = [];

    function backtrack() {
        if (current.length === symbols.length) {
            results.push(current.join(''));
            return;
        }

        for (let i = 0; i < symbols.length; i += 1) {
            if (used[i]) {
                continue;
            }

            used[i] = true;
            current.push(symbols[i]);
            backtrack();
            current.pop();
            used[i] = false;
        }
    }

    backtrack();
    return results;
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
// FAKTORIÁL
// =============================================

function initFactorialDemo() {
    const slider = document.getElementById('factorialN');
    if (!slider) {
        return;
    }

    const nValue = document.getElementById('factorialNValue');
    const formulaOut = document.getElementById('factorialFormula');
    const recurrenceOut = document.getElementById('factorialRecurrence');
    const valueOut = document.getElementById('factorialValue');

    function render() {
        const n = parseInt(slider.value, 10);
        const fact = factorialBigInt(n);

        nValue.textContent = String(n);
        formulaOut.textContent = buildFactorialProduct(n);
        valueOut.textContent = formatBigInt(fact);

        if (n === 0) {
            recurrenceOut.textContent = '0! = 1 (prázdný součin).';
            return;
        }

        const prevFact = factorialBigInt(n - 1);
        recurrenceOut.textContent = `${n}! = ${n} · ${(n - 1)}! = ${n} · ${formatBigInt(prevFact)} = ${formatBigInt(fact)}`;
    }

    slider.addEventListener('input', render);
    render();
}

// =============================================
// VARIACE
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
    const productOut = document.getElementById('variationProduct');
    const countOut = document.getElementById('variationCount');
    const warningOut = document.getElementById('variationWarning');
    const pool = document.getElementById('variationPool');
    const slots = document.getElementById('variationSlots');
    const sampleList = document.getElementById('variationSampleList');

    function render() {
        const n = parseInt(nSlider.value, 10);

        kSlider.max = String(n);
        if (parseInt(kSlider.value, 10) > n) {
            kSlider.value = String(n);
        }
        const k = parseInt(kSlider.value, 10);

        const count = permutationBigInt(n, k);
        const product = buildFallingProduct(n, k);
        const symbols = getSymbols(n);

        nValue.textContent = String(n);
        kValue.textContent = String(k);

        formulaOut.textContent = `V(${n}, ${k}) = ${n}! / (${n - k})!`;
        productOut.textContent = `${product} = ${formatBigInt(count)}`;
        countOut.textContent = `Celkem variací: ${formatBigInt(count)}`;

        if (k === n) {
            warningOut.textContent = 'Pro k = n dostaneme permutace: V(n, n) = P(n) = n!.';
        } else {
            warningOut.textContent = '';
        }

        pool.innerHTML = symbols.map(symbol => `<span class="token">${symbol}</span>`).join('');
        slots.innerHTML = Array.from({ length: k }, (_, index) =>
            `<span class="token">pozice ${index + 1}</span>`
        ).join('');

        const samples = generateVariationSamples(symbols, k, 14);
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
// PERMUTACE
// =============================================

function initPermutationDemo() {
    const nSlider = document.getElementById('permN');
    const indexSlider = document.getElementById('permIndex');
    const randomButton = document.getElementById('permRandomBtn');
    const firstButton = document.getElementById('permFirstBtn');

    if (!nSlider || !indexSlider || !randomButton || !firstButton) {
        return;
    }

    const nValue = document.getElementById('permNValue');
    const formulaOut = document.getElementById('permFormula');
    const asVariationOut = document.getElementById('permAsVariation');
    const countOut = document.getElementById('permCount');
    const currentOut = document.getElementById('permCurrent');
    const indexValue = document.getElementById('permIndexValue');
    const indexMax = document.getElementById('permIndexMax');
    const sampleList = document.getElementById('permSampleList');

    let permutations = [];

    function renderCurrent() {
        if (!permutations.length) {
            currentOut.textContent = '-';
            indexValue.textContent = '0';
            return;
        }

        const index = parseInt(indexSlider.value, 10) - 1;
        const item = permutations[Math.max(0, Math.min(index, permutations.length - 1))];
        currentOut.textContent = item.split('').join(' ');
        indexValue.textContent = String(index + 1);
    }

    function renderSet() {
        const n = parseInt(nSlider.value, 10);
        const symbols = getSymbols(n);

        permutations = generatePermutationList(symbols);

        nValue.textContent = String(n);
        formulaOut.textContent = `P(${n}) = ${n}!`;
        asVariationOut.textContent = `P(${n}) = V(${n}, ${n})`;
        countOut.textContent = formatBigInt(factorialBigInt(n));

        indexSlider.min = '1';
        indexSlider.max = String(permutations.length);
        if (parseInt(indexSlider.value, 10) > permutations.length) {
            indexSlider.value = '1';
        }

        indexMax.textContent = formatBigInt(BigInt(permutations.length));

        const sampleItems = permutations.slice(0, 14)
            .map(item => `<li>${item.split('').join(' ')}</li>`);

        if (permutations.length > 14) {
            sampleItems.push(`<li class="sample-muted">... a dalších ${formatBigInt(BigInt(permutations.length - 14))} permutací</li>`);
        }

        sampleList.innerHTML = sampleItems.join('');
        renderCurrent();
    }

    nSlider.addEventListener('input', renderSet);
    indexSlider.addEventListener('input', renderCurrent);

    randomButton.addEventListener('click', () => {
        if (!permutations.length) {
            return;
        }
        const randomIndex = Math.floor(Math.random() * permutations.length) + 1;
        indexSlider.value = String(randomIndex);
        renderCurrent();
    });

    firstButton.addEventListener('click', () => {
        indexSlider.value = '1';
        renderCurrent();
    });

    renderSet();
}

// =============================================
// KOMBINACE
// =============================================

function initCombinationDemo() {
    const nSlider = document.getElementById('comboN');
    const kSlider = document.getElementById('comboK');

    if (!nSlider || !kSlider) {
        return;
    }

    const nValue = document.getElementById('comboNValue');
    const kValue = document.getElementById('comboKValue');
    const formulaOut = document.getElementById('comboFormula');
    const countOut = document.getElementById('comboCount');
    const symmetryOut = document.getElementById('comboSymmetry');
    const relationOut = document.getElementById('comboRelation');
    const warningOut = document.getElementById('comboWarning');
    const pool = document.getElementById('comboPool');
    const sampleList = document.getElementById('comboSampleList');

    function render() {
        const n = parseInt(nSlider.value, 10);
        kSlider.max = String(n);

        if (parseInt(kSlider.value, 10) > n) {
            kSlider.value = String(n);
        }
        const k = parseInt(kSlider.value, 10);

        const count = combinationBigInt(n, k);
        const nMinusK = n - k;
        const symmetric = combinationBigInt(n, nMinusK);
        const variations = permutationBigInt(n, k);
        const kFactorial = factorialBigInt(k);
        const symbols = getSymbols(n);

        nValue.textContent = String(n);
        kValue.textContent = String(k);

        formulaOut.textContent = `C(${n}, ${k}) = ${n}! / (${k}! · ${nMinusK}!)`;
        countOut.textContent = formatBigInt(count);
        symmetryOut.textContent = `C(${n}, ${k}) = C(${n}, ${nMinusK}) = ${formatBigInt(symmetric)}`;
        relationOut.textContent =
            `V(${n}, ${k}) = ${formatBigInt(variations)} = C(${n}, ${k}) · ${k}! = ${formatBigInt(count)} · ${formatBigInt(kFactorial)}`;

        if (k === 1) {
            warningOut.textContent = `Při k = 1 je C(${n}, 1) = ${n}.`;
        } else if (k === n) {
            warningOut.textContent = `Při k = n je C(${n}, ${n}) = 1.`;
        } else {
            warningOut.textContent = '';
        }

        pool.innerHTML = symbols.map(symbol => `<span class="token">${symbol}</span>`).join('');

        const samples = generateCombinationSamples(symbols, k, 14);
        const items = samples.map(item => `<li>${item}</li>`);
        const remaining = count - BigInt(samples.length);

        if (remaining > 0n) {
            items.push(`<li class="sample-muted">... a dalších ${formatBigInt(remaining)} kombinací</li>`);
        }

        sampleList.innerHTML = items.join('');
    }

    nSlider.addEventListener('input', render);
    kSlider.addEventListener('input', render);
    render();
}

// =============================================
// CHALLENGES
// =============================================

function initChallenges() {
    initNumericChallenge({
        inputId: 'factorialChallengeInput',
        buttonId: 'factorialChallengeCheck',
        feedbackId: 'factorialChallengeFeedback',
        correct: 336,
        correctText: 'Správně. 8! / 5! = 8 · 7 · 6 = 336.',
        incorrectText: 'Nesprávně. Správně je 336, protože 8! / 5! = (8 · 7 · 6 · 5!) / 5! = 8 · 7 · 6.'
    });

    initNumericChallenge({
        inputId: 'variationChallengeInput',
        buttonId: 'variationChallengeCheck',
        feedbackId: 'variationChallengeFeedback',
        correct: 56,
        correctText: 'Správně. V(8, 2) = 8 · 7 = 56.',
        incorrectText: 'Nesprávně. Správně je 56, protože pro dvě pořadové pozice počítáme 8 · 7 možností.'
    });

    initNumericChallenge({
        inputId: 'permChallengeInput',
        buttonId: 'permChallengeCheck',
        feedbackId: 'permChallengeFeedback',
        correct: 720,
        correctText: 'Správně. P(6) = 6! = 720.',
        incorrectText: 'Nesprávně. Správně je 720, protože počet permutací 6 prvků je 6! = 720.'
    });

    initNumericChallenge({
        inputId: 'comboChallengeInput',
        buttonId: 'comboChallengeCheck',
        feedbackId: 'comboChallengeFeedback',
        correct: 120,
        correctText: 'Správně. C(10, 3) = 120.',
        incorrectText: 'Nesprávně. Správně je 120, protože C(10, 3) = 10! / (3! · 7!) = 120.'
    });
}

// =============================================
// FINAL EXERCISES
// =============================================

function initExercises() {
    const feedbackData = {
        1: {
            correct: 'Správně. Platí 0! = 1.',
            incorrect: 'Nesprávně. Správná odpověď je 1, tedy možnost b).'
        },
        2: {
            correct: 'Správně. V(7,3) = 7 · 6 · 5 = 210.',
            incorrect: 'Nesprávně. Správně je 210, protože V(7,3) = 7! / 4! = 7 · 6 · 5.'
        },
        3: {
            correct: 'Správně. P(6) = 6! = 720.',
            incorrect: 'Nesprávně. Správně je 720, tedy možnost a).'
        },
        4: {
            correct: 'Správně. Jde o dvě různé funkce, takže záleží na pořadí: V(12,2).',
            incorrect: 'Nesprávně. Správně je variace bez opakování V(12,2), protože předseda a místopředseda nejsou stejné role.'
        },
        5: {
            correct: 'Správně. C(9,4) = 126.',
            incorrect: 'Nesprávně. Správně je 126, tedy možnost a).'
        },
        6: {
            correct: 'Správně. Obecně platí V(n,k) = C(n,k) · k!.',
            incorrect: 'Nesprávně. Správný vztah je V(n,k) = C(n,k) · k!, tedy možnost d).'
        }
    };

    const statuses = document.querySelectorAll('.exercise-status');
    statuses.forEach(status => {
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
                status.textContent = isCorrect ? '✓ Správně' : '✗ Špatně';
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
