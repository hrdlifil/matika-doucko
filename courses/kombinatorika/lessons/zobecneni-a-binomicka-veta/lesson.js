// Kombinatorika - Lekce 4: Zobecneni a Binomicka veta

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initNavbarScroll();

    initFactorialLab();
    initCombinationLab();
    initBinomialDerivationLab();
    initPascalLab();

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

function combinationExtendedBigInt(n, k) {
    const value = combinationBigInt(n, k);
    return value === null ? 0n : value;
}

function powerBigInt(base, exponent) {
    if (!Number.isInteger(exponent) || exponent < 0) {
        return null;
    }

    let result = 1n;
    const b = typeof base === 'bigint' ? base : BigInt(base);

    for (let i = 0; i < exponent; i += 1) {
        result *= b;
    }

    return result;
}

function formatBigInt(value) {
    if (value === null || value === undefined) {
        return '';
    }

    const asBigInt = typeof value === 'bigint' ? value : BigInt(value);
    const raw = asBigInt.toString();
    const negative = raw.startsWith('-');
    const digits = negative ? raw.slice(1) : raw;
    const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return negative ? `-${grouped}` : grouped;
}

function clampInt(value, min, max) {
    if (!Number.isFinite(value)) {
        return min;
    }
    return Math.min(max, Math.max(min, Math.round(value)));
}

function parseInputInt(input, fallback) {
    const parsed = parseInt(input.value, 10);
    if (Number.isNaN(parsed)) {
        return fallback;
    }
    return parsed;
}

function buildDescendingProductText(n, k) {
    if (k === 0) {
        return '1';
    }

    const terms = [];
    for (let i = 0; i < k; i += 1) {
        terms.push(String(n - i));
    }
    return terms.join(' · ');
}

function buildAscendingProductText(n, k) {
    if (k === 0) {
        return '1';
    }

    const terms = [];
    for (let i = 1; i <= k; i += 1) {
        terms.push(String(n + i));
    }
    return terms.join(' · ');
}

function buildSymbolPower(symbol, power) {
    if (power === 0) {
        return '';
    }

    if (power === 1) {
        return symbol;
    }

    return `${symbol}<sup>${power}</sup>`;
}

function buildSymbolicBinomialTerm(n, k) {
    const coeff = combinationBigInt(n, k);
    if (coeff === null) {
        return '';
    }

    const coeffText = formatBigInt(coeff);
    const partA = buildSymbolPower('a', n - k);
    const partB = buildSymbolPower('b', k);
    const variablePart = `${partA}${partB}`;

    if (!variablePart) {
        return coeffText;
    }

    return coeff === 1n ? variablePart : `${coeffText}${variablePart}`;
}

function generateCombinationSamples(n, k, limit) {
    if (k < 0 || k > n) {
        return [];
    }

    if (k === 0) {
        return [[]];
    }

    const results = [];
    const current = [];

    function backtrack(start) {
        if (results.length >= limit) {
            return;
        }

        if (current.length === k) {
            results.push([...current]);
            return;
        }

        const needed = k - current.length;
        for (let i = start; i <= n - needed + 1; i += 1) {
            current.push(i);
            backtrack(i + 1);
            current.pop();

            if (results.length >= limit) {
                return;
            }
        }
    }

    backtrack(1);
    return results;
}

// =============================================
// TEMA 1: FAKTORIAL
// =============================================

function initFactorialLab() {
    const nSlider = document.getElementById('factorialN');
    const kSlider = document.getElementById('factorialK');

    if (!nSlider || !kSlider) {
        return;
    }

    const nValueOut = document.getElementById('factorialNValue');
    const kValueOut = document.getElementById('factorialKValue');
    const fallingFormulaOut = document.getElementById('fallingFormula');
    const fallingExpansionOut = document.getElementById('fallingExpansion');
    const fallingResultOut = document.getElementById('fallingResult');
    const risingFormulaOut = document.getElementById('risingFormula');
    const risingExpansionOut = document.getElementById('risingExpansion');
    const risingResultOut = document.getElementById('risingResult');
    const compareOut = document.getElementById('factorialCompare');
    const domainOut = document.getElementById('factorialDomainNote');

    function render() {
        const n = parseInt(nSlider.value, 10);
        kSlider.max = String(n);
        const k = clampInt(parseInt(kSlider.value, 10), 0, n);
        kSlider.value = String(k);

        nValueOut.textContent = String(n);
        kValueOut.textContent = String(k);

        let fallingValue = 1n;
        for (let i = 0; i < k; i += 1) {
            fallingValue *= BigInt(n - i);
        }

        let risingValue = 1n;
        for (let i = 1; i <= k; i += 1) {
            risingValue *= BigInt(n + i);
        }

        fallingFormulaOut.textContent = `${n}! / ${n - k}!`;
        fallingExpansionOut.textContent = `${n}!/${n - k}! = ${buildDescendingProductText(n, k)}`;
        fallingResultOut.textContent = `= ${formatBigInt(fallingValue)}`;

        risingFormulaOut.textContent = `${n + k}! / ${n}!`;
        risingExpansionOut.textContent = `${n + k}!/${n}! = ${buildAscendingProductText(n, k)}`;
        risingResultOut.textContent = `= ${formatBigInt(risingValue)}`;

        if (k === 0) {
            compareOut.textContent = 'Pro k = 0 mají oba výrazy hodnotu 1.';
        } else {
            compareOut.textContent =
                `Oba výrazy obsahují přesně ${k} násobených činitelů, jen v opačném směru kolem n.`;
        }

        domainOut.textContent = `Aby výraz n!/(n-k)! dával smysl, musí platit n-k ≥ 0. Zde: ${n - k} ≥ 0.`;
    }

    nSlider.addEventListener('input', render);
    kSlider.addEventListener('input', render);

    render();
}

// =============================================
// TEMA 2: KOMBINACNI CISLA
// =============================================

function initCombinationLab() {
    const nSlider = document.getElementById('combN');
    const kSlider = document.getElementById('combK');

    if (!nSlider || !kSlider) {
        return;
    }

    const nOut = document.getElementById('combNValue');
    const kOut = document.getElementById('combKValue');
    const currentFormulaOut = document.getElementById('combCurrentFormula');
    const currentValueOut = document.getElementById('combCurrentValue');
    const symmetryLeftOut = document.getElementById('symmetryLeft');
    const symmetryRightOut = document.getElementById('symmetryRight');
    const symmetryCheckOut = document.getElementById('symmetryCheck');
    const pascalLeftOut = document.getElementById('pascalLeft');
    const pascalRightOut = document.getElementById('pascalRight');
    const pascalCheckOut = document.getElementById('pascalCheck');
    const rowSumLeftOut = document.getElementById('rowSumLeft');
    const rowSumRightOut = document.getElementById('rowSumRight');
    const rowSumCheckOut = document.getElementById('rowSumCheck');
    const ratioOut = document.getElementById('ratioValue');

    const eqSelect = document.getElementById('combEquationSelect');
    const eqInput = document.getElementById('combEquationInput');
    const eqButton = document.getElementById('combEquationCheck');
    const eqFeedback = document.getElementById('combEquationFeedback');

    const equations = {
        eq1: {
            answer: 10,
            correctText: 'Spravne. C(n,2)=45 dava rovnici n(n-1)/2=45, tedy n=10.',
            incorrectText: 'Nespravne. Spravne je n=10, protoze n(n-1)/2=45 => n^2-n-90=0.'
        },
        eq2: {
            answer: 10,
            correctText: 'Spravne. C(n,3)=120 plati pro n=10.',
            incorrectText: 'Nespravne. Spravne je n=10, protoze C(10,3)=120.'
        },
        eq3: {
            answer: 14,
            correctText: 'Spravne. C(n,n-1)=n, takze n=14.',
            incorrectText: 'Nespravne. Spravne je n=14, protoze C(n,n-1)=n.'
        }
    };

    function render() {
        const n = parseInt(nSlider.value, 10);
        kSlider.max = String(n);
        const k = clampInt(parseInt(kSlider.value, 10), 0, n);
        kSlider.value = String(k);

        nOut.textContent = String(n);
        kOut.textContent = String(k);

        const current = combinationBigInt(n, k) || 0n;
        currentFormulaOut.textContent = `C(${n},${k})`;
        currentValueOut.textContent = formatBigInt(current);

        const symmetryRightK = n - k;
        const symmetryRight = combinationBigInt(n, symmetryRightK) || 0n;
        symmetryLeftOut.textContent = `C(${n},${k}) = ${formatBigInt(current)}`;
        symmetryRightOut.textContent = `C(${n},${symmetryRightK}) = ${formatBigInt(symmetryRight)}`;
        symmetryCheckOut.textContent = current === symmetryRight
            ? 'Obe strany vychazeji stejne, proto plati symetrie C(n,k)=C(n,n-k).'
            : 'Pozor, doslo k nekonzistenci.';

        const pascalRightA = combinationExtendedBigInt(n - 1, k - 1);
        const pascalRightB = combinationExtendedBigInt(n - 1, k);
        const pascalRight = pascalRightA + pascalRightB;
        pascalLeftOut.textContent = `C(${n},${k}) = ${formatBigInt(current)}`;
        pascalRightOut.textContent =
            `C(${n - 1},${k - 1}) + C(${n - 1},${k}) = ${formatBigInt(pascalRightA)} + ${formatBigInt(pascalRightB)} = ${formatBigInt(pascalRight)}`;
        pascalCheckOut.textContent = current === pascalRight
            ? 'Pascalovo pravidlo sedi i pro krajni hodnoty (mimorozsahove cleny bereme jako 0).'
            : 'Pozor, doslo k nekonzistenci.';

        let rowSum = 0n;
        for (let j = 0; j <= n; j += 1) {
            rowSum += combinationBigInt(n, j) || 0n;
        }
        const powerTwo = powerBigInt(2n, n) || 0n;

        rowSumLeftOut.textContent = `∑ C(${n},j) = ${formatBigInt(rowSum)}`;
        rowSumRightOut.textContent = `2^${n} = ${formatBigInt(powerTwo)}`;
        rowSumCheckOut.textContent = rowSum === powerTwo
            ? 'Soucet radku odpovida 2^n.'
            : 'Pozor, doslo k nekonzistenci.';

        if (k < n) {
            const next = combinationBigInt(n, k + 1) || 0n;
            ratioOut.textContent =
                `C(${n},${k + 1}) / C(${n},${k}) = ${formatBigInt(next)} / ${formatBigInt(current)} = (${n - k})/(${k + 1}).`;
        } else {
            ratioOut.textContent = 'Pro k = n uz neexistuje dalsi sousedni koeficient C(n,k+1).';
        }
    }

    if (eqButton && eqInput && eqSelect && eqFeedback) {
        eqButton.addEventListener('click', () => {
            const eq = equations[eqSelect.value];
            const userValue = parseInt(eqInput.value, 10);

            if (Number.isNaN(userValue)) {
                eqFeedback.className = 'challenge-feedback incorrect';
                eqFeedback.textContent = 'Nejdriv zadejte ciselnou hodnotu n.';
                return;
            }

            if (userValue === eq.answer) {
                eqFeedback.className = 'challenge-feedback correct';
                eqFeedback.textContent = eq.correctText;
            } else {
                eqFeedback.className = 'challenge-feedback incorrect';
                eqFeedback.textContent = eq.incorrectText;
            }
        });
    }

    nSlider.addEventListener('input', render);
    kSlider.addEventListener('input', render);

    render();
}

// =============================================
// TEMA 3: ODVODZENI BINOMICKE VETY
// =============================================

function initBinomialDerivationLab() {
    const nSlider = document.getElementById('binomN');
    const kSlider = document.getElementById('binomK');
    const aInput = document.getElementById('binomA');
    const bInput = document.getElementById('binomB');

    if (!nSlider || !kSlider || !aInput || !bInput) {
        return;
    }

    const nOut = document.getElementById('binomNValue');
    const kOut = document.getElementById('binomKValue');
    const expansionOut = document.getElementById('binomExpansion');
    const termOut = document.getElementById('binomTermFormula');
    const interpretationOut = document.getElementById('binomInterpretation');
    const coefficientOut = document.getElementById('binomCoefficient');
    const samplesOut = document.getElementById('binomPositionSamples');
    const theoremOut = document.getElementById('binomNumericByTheorem');
    const directOut = document.getElementById('binomNumericDirect');
    const checkOut = document.getElementById('binomNumericCheck');

    function render() {
        const n = parseInt(nSlider.value, 10);
        kSlider.max = String(n);
        const k = clampInt(parseInt(kSlider.value, 10), 0, n);
        kSlider.value = String(k);

        const a = clampInt(parseInputInt(aInput, 0), -9, 9);
        const b = clampInt(parseInputInt(bInput, 0), -9, 9);
        aInput.value = String(a);
        bInput.value = String(b);

        nOut.textContent = String(n);
        kOut.textContent = String(k);

        const terms = [];
        for (let j = 0; j <= n; j += 1) {
            terms.push(buildSymbolicBinomialTerm(n, j));
        }
        expansionOut.innerHTML = terms.join(' + ');

        const coeff = combinationBigInt(n, k) || 0n;
        coefficientOut.textContent = formatBigInt(coeff);

        const termPartA = buildSymbolPower('a', n - k);
        const termPartB = buildSymbolPower('b', k);
        const visibleTerm = `${termPartA}${termPartB}` || '1';
        termOut.innerHTML = `<span>C(${n},${k})</span><span>${visibleTerm}</span>`;
        interpretationOut.textContent =
            `Volime ${k} z ${n} zavorek, ze kterych vezmeme b. Pocet voleb je C(${n},${k}).`;

        const samples = generateCombinationSamples(n, k, 12);
        const sampleItems = samples.map(sample => {
            if (sample.length === 0) {
                return '<li>{ } (vezmeme vsude a)</li>';
            }
            return `<li>{${sample.join(', ')}}</li>`;
        });

        const remaining = coeff - BigInt(samples.length);
        if (remaining > 0n) {
            sampleItems.push(`<li class="sample-muted">... a dalsich ${formatBigInt(remaining)} vyberu</li>`);
        }
        samplesOut.innerHTML = sampleItems.join('');

        let theoremValue = 0n;
        for (let j = 0; j <= n; j += 1) {
            const c = combinationBigInt(n, j) || 0n;
            theoremValue += c * (powerBigInt(BigInt(a), n - j) || 0n) * (powerBigInt(BigInt(b), j) || 0n);
        }
        const directValue = powerBigInt(BigInt(a + b), n) || 0n;

        theoremOut.textContent = `Soucet dle binomicke vety: ${formatBigInt(theoremValue)}`;
        directOut.textContent = `Prima mocnina (a+b)^n: ${formatBigInt(directValue)}`;
        checkOut.textContent = theoremValue === directValue
            ? 'Kontrola sedi: obe cesty davaji stejny vysledek.'
            : 'Pozor, doslo k nekonzistenci.';
    }

    nSlider.addEventListener('input', render);
    kSlider.addEventListener('input', render);
    aInput.addEventListener('input', render);
    bInput.addEventListener('input', render);

    render();
}

// =============================================
// TEMA 4: PASCALUV TROJUHELNIK
// =============================================

function initPascalLab() {
    const rowsSlider = document.getElementById('pascalRows');
    const nInput = document.getElementById('pascalSelectN');
    const kInput = document.getElementById('pascalSelectK');
    const rowsOut = document.getElementById('pascalRowsValue');
    const triangleOut = document.getElementById('pascalTriangle');

    if (!rowsSlider || !nInput || !kInput || !rowsOut || !triangleOut) {
        return;
    }

    const valueOut = document.getElementById('pascalCellValue');
    const identityOut = document.getElementById('pascalCellIdentity');
    const neighborsOut = document.getElementById('pascalCellNeighbors');
    const rowSumOut = document.getElementById('pascalRowSum');
    const altSumOut = document.getElementById('pascalAltSum');
    const expansionOut = document.getElementById('pascalRowExpansion');

    function normalizeInputs() {
        const maxRows = parseInt(rowsSlider.value, 10);
        rowsOut.textContent = String(maxRows);

        nInput.max = String(maxRows);
        const n = clampInt(parseInputInt(nInput, maxRows), 0, maxRows);
        nInput.value = String(n);

        kInput.max = String(n);
        const k = clampInt(parseInputInt(kInput, 0), 0, n);
        kInput.value = String(k);

        return { maxRows, n, k };
    }

    function render() {
        const { maxRows, n, k } = normalizeInputs();

        const rowsHtml = [];
        for (let i = 0; i <= maxRows; i += 1) {
            const cells = [];
            for (let j = 0; j <= i; j += 1) {
                const value = combinationBigInt(i, j) || 0n;
                const activeClass = i === n && j === k ? ' active' : '';
                cells.push(
                    `<button type="button" class="pascal-cell${activeClass}" data-n="${i}" data-k="${j}">${formatBigInt(value)}</button>`
                );
            }
            rowsHtml.push(`<div class="pascal-row">${cells.join('')}</div>`);
        }
        triangleOut.innerHTML = rowsHtml.join('');

        const selected = combinationBigInt(n, k) || 0n;
        const symmetric = combinationBigInt(n, n - k) || 0n;
        valueOut.textContent = `C(${n},${k}) = ${formatBigInt(selected)}`;
        identityOut.textContent = `Symetrie: C(${n},${k}) = C(${n},${n - k}) = ${formatBigInt(symmetric)}.`;

        if (n === 0) {
            neighborsOut.textContent = 'Prvni radek nema rodice.';
        } else {
            const leftParent = combinationExtendedBigInt(n - 1, k - 1);
            const rightParent = combinationExtendedBigInt(n - 1, k);
            neighborsOut.textContent =
                `Rodice: ${formatBigInt(leftParent)} a ${formatBigInt(rightParent)}; jejich soucet je ${formatBigInt(leftParent + rightParent)}.`;
        }

        let rowSum = 0n;
        let altSum = 0n;
        const coeffs = [];
        for (let j = 0; j <= n; j += 1) {
            const c = combinationBigInt(n, j) || 0n;
            rowSum += c;
            altSum += (j % 2 === 0 ? c : -c);
            coeffs.push(formatBigInt(c));
        }

        rowSumOut.textContent = `Soucet radku: ${coeffs.join(' + ')} = ${formatBigInt(rowSum)} = 2^${n}.`;
        altSumOut.textContent = `Alternujici soucet: ${formatBigInt(altSum)} ${n > 0 ? '(pro n>0 vychazi 0)' : ''}.`;
        expansionOut.textContent = `Koeficienty pro (a+b)^${n}: [${coeffs.join(', ')}].`;
    }

    triangleOut.addEventListener('click', event => {
        const cell = event.target.closest('.pascal-cell');
        if (!cell) {
            return;
        }

        nInput.value = cell.dataset.n;
        kInput.value = cell.dataset.k;
        render();
    });

    rowsSlider.addEventListener('input', render);
    nInput.addEventListener('input', render);
    kInput.addEventListener('input', render);

    render();
}

// =============================================
// CHALLENGES
// =============================================

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
            feedback.textContent = 'Nejdriv zadejte ciselnou odpoved.';
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

function initChallenges() {
    initNumericChallenge({
        inputId: 'factorialChallengeInput',
        buttonId: 'factorialChallengeCheck',
        feedbackId: 'factorialChallengeFeedback',
        correct: 5,
        correctText: 'Spravne. Po kraceni (n+1)! = 30(n-1)! dostaneme n(n+1)=30, tedy n=5.',
        incorrectText: 'Nespravne. Spravne je n=5, protoze n(n+1)=30.'
    });

    initNumericChallenge({
        inputId: 'derivationChallengeInput',
        buttonId: 'derivationChallengeCheck',
        feedbackId: 'derivationChallengeFeedback',
        correct: 10,
        correctText: 'Spravne. Koeficient je C(5,2)=10.',
        incorrectText: 'Nespravne. Spravne je 10, protoze C(5,2)=10.'
    });

    initNumericChallenge({
        inputId: 'pascalChallengeInput',
        buttonId: 'pascalChallengeCheck',
        feedbackId: 'pascalChallengeFeedback',
        correct: 56,
        correctText: 'Spravne. Koeficient u x^5y^3 v (x+y)^8 je C(8,3)=56.',
        incorrectText: 'Nespravne. Spravne je 56, protoze C(8,3)=56.'
    });
}

// =============================================
// EXERCISES
// =============================================

function initExercises() {
    const feedbackData = {
        1: {
            correct: 'Spravne. 8!/6! = 8*7 = 56.',
            incorrect: 'Nespravne. Spravne je 56, protoze 8!/6! = 8*7.'
        },
        2: {
            correct: 'Spravne. n!/(n-3)! = n(n-1)(n-2) = 120 dava n=6.',
            incorrect: 'Nespravne. Spravne je n=6, protoze 6*5*4 = 120.'
        },
        3: {
            correct: 'Spravne. C(9,7)=C(9,2)=36.',
            incorrect: 'Nespravne. Spravne je 36, vyuzijeme symetrii C(9,7)=C(9,2).'
        },
        4: {
            correct: 'Spravne. C(n,2)=28 => n(n-1)/2=28 => n=8.',
            incorrect: 'Nespravne. Spravne je n=8.'
        },
        5: {
            correct: 'Spravne. Koeficient u a^4b^2 je C(6,2)=15.',
            incorrect: 'Nespravne. Spravne je 15, protoze C(6,2)=15.'
        },
        6: {
            correct: 'Spravne. Pro x^2 bereme clen C(4,2)*(2x)^2*(-3)^2 = 6*4*9 = 216.',
            incorrect: 'Nespravne. Spravny koeficient je 216.'
        },
        7: {
            correct: 'Spravne. Soucet 7. radku je 2^7 = 128.',
            incorrect: 'Nespravne. Spravne je 128, protoze soucet n-teho radku je 2^n.'
        },
        8: {
            correct: 'Spravne. C(8,3)=C(7,2)+C(7,3).',
            incorrect: 'Nespravne. Spravne je C(8,3)=C(7,2)+C(7,3).'
        }
    };

    document.querySelectorAll('.exercise-status').forEach(status => {
        status.textContent = 'Nezodpovezeno';
    });

    document.querySelectorAll('.btn-check').forEach(button => {
        button.addEventListener('click', () => {
            const exNum = button.dataset.exercise;
            const correctAnswer = button.dataset.correct;
            const selected = document.querySelector(`input[name="ex${exNum}"]:checked`);
            const status = document.getElementById(`ex${exNum}Status`);
            const feedback = document.getElementById(`ex${exNum}Feedback`);

            if (!selected) {
                alert('Vyberte prosim odpoved.');
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
                status.textContent = isCorrect ? '✓ Spravne' : '✕ Spatne';
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
