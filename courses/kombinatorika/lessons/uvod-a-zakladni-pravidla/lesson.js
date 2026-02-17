// Kombinatorika - Lekce 1: Úvod a základní pravidla

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initNavbarScroll();
    initClassifier();
    initProductDemo();
    initProductChallenge();
    initSumDemo();
    initSumChallenge();
    initRuleTraining();
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

function factorial(n) {
    if (n < 0) return NaN;
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i += 1) {
        result *= i;
    }
    return result;
}

function combination(n, k) {
    if (k < 0 || n < 0 || k > n) {
        return NaN;
    }

    const kk = Math.min(k, n - k);
    let numerator = 1;
    let denominator = 1;

    for (let i = 1; i <= kk; i += 1) {
        numerator *= (n - kk + i);
        denominator *= i;
    }

    return numerator / denominator;
}

// =============================================
// CLASSIFIER
// =============================================

function initClassifier() {
    const orderSelect = document.getElementById('orderSelect');
    const repetitionSelect = document.getElementById('repetitionSelect');
    const allUseSelect = document.getElementById('allUseSelect');
    const nInput = document.getElementById('classifierN');
    const kInput = document.getElementById('classifierK');

    if (!orderSelect || !repetitionSelect || !allUseSelect || !nInput || !kInput) {
        return;
    }

    const nValue = document.getElementById('classifierNValue');
    const kValue = document.getElementById('classifierKValue');
    const modelOut = document.getElementById('classifierModel');
    const formulaOut = document.getElementById('classifierFormula');
    const countOut = document.getElementById('classifierCount');
    const warningOut = document.getElementById('classifierWarning');

    function render() {
        const n = parseInt(nInput.value, 10);
        const k = parseInt(kInput.value, 10);
        const orderMatters = orderSelect.value === 'ano';
        const repetitionAllowed = repetitionSelect.value === 'ano';
        const useAll = allUseSelect.value === 'ano';

        nValue.textContent = String(n);
        kValue.textContent = String(k);

        let warning = '';
        let kUsed = k;

        if (useAll && k !== n) {
            warning = 'Pokud používáme všechny prvky, mělo by platit k = n. Pro výpočet níže bereme k = n.';
            kUsed = n;
        }

        let model = '';
        let formula = '';
        let count = NaN;

        if (orderMatters) {
            if (repetitionAllowed) {
                model = 'Variace s opakováním';
                formula = "V'(n,k) = n^k";
                count = Math.pow(n, kUsed);
            } else if (useAll) {
                model = 'Permutace bez opakování';
                formula = 'P(n) = n!';
                count = factorial(n);
            } else {
                model = 'Variace bez opakování';
                formula = 'V(n,k) = n! / (n-k)!';
                if (kUsed > n) {
                    warning = 'Bez opakování musí platit k ≤ n.';
                } else {
                    count = factorial(n) / factorial(n - kUsed);
                }
            }
        } else {
            if (repetitionAllowed) {
                model = 'Kombinace s opakováním';
                formula = "C'(n,k) = C(n+k-1, k)";
                count = combination(n + kUsed - 1, kUsed);
            } else if (useAll) {
                model = 'Kombinace všech prvků';
                formula = 'C(n,n) = 1';
                count = 1;
            } else {
                model = 'Kombinace bez opakování';
                formula = 'C(n,k) = n! / [k!(n-k)!]';
                if (kUsed > n) {
                    warning = 'Bez opakování musí platit k ≤ n.';
                } else {
                    count = combination(n, kUsed);
                }
            }
        }

        modelOut.textContent = model;
        formulaOut.textContent = formula;

        if (Number.isNaN(count)) {
            countOut.textContent = 'Počet možností nelze určit pro zadané podmínky.';
        } else {
            countOut.textContent = `Pro n = ${n}, k = ${kUsed}: ${count}`;
        }

        warningOut.textContent = warning;
    }

    [orderSelect, repetitionSelect, allUseSelect, nInput, kInput].forEach(element => {
        element.addEventListener('input', render);
        element.addEventListener('change', render);
    });

    render();
}

// =============================================
// PRODUCT RULE DEMO
// =============================================

function initProductDemo() {
    const slider1 = document.getElementById('productChoice1');
    const slider2 = document.getElementById('productChoice2');
    const slider3 = document.getElementById('productChoice3');
    const canvas = document.getElementById('productCanvas');

    if (!slider1 || !slider2 || !slider3 || !canvas) {
        return;
    }

    const ctx = canvas.getContext('2d');
    const val1 = document.getElementById('prodVal1');
    const val2 = document.getElementById('prodVal2');
    const val3 = document.getElementById('prodVal3');
    const equationOut = document.getElementById('productEquation');
    const totalOut = document.getElementById('productTotal');
    const sampleList = document.getElementById('productSampleList');

    function segmentCenters(start, end, count) {
        const result = [];
        const step = (end - start) / count;
        for (let i = 0; i < count; i += 1) {
            result.push(start + step * (i + 0.5));
        }
        return result;
    }

    function drawNode(x, y, radius, color) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    }

    function drawTree(n1, n2, n3) {
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);

        const x0 = 50;
        const x1 = 220;
        const x2 = 420;
        const x3 = 640;
        const padding = 24;

        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText('start', x0 - 18, 18);
        ctx.fillText('krok 1', x1 - 18, 18);
        ctx.fillText('krok 2', x2 - 18, 18);
        ctx.fillText('krok 3', x3 - 18, 18);

        const level1 = segmentCenters(padding, height - padding, n1);
        const totalHeight = height - 2 * padding;
        const block1 = totalHeight / n1;

        drawNode(x0, height / 2, 5, '#94a3b8');

        for (let i = 0; i < n1; i += 1) {
            const y1 = level1[i];

            ctx.strokeStyle = 'rgba(99, 102, 241, 0.55)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x0, height / 2);
            ctx.lineTo(x1, y1);
            ctx.stroke();

            drawNode(x1, y1, 3.2, '#6366f1');

            const start1 = padding + i * block1;
            const end1 = start1 + block1;
            const level2 = segmentCenters(start1, end1, n2);
            const block2 = block1 / n2;

            for (let j = 0; j < n2; j += 1) {
                const y2 = level2[j];

                ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();

                drawNode(x2, y2, 2.8, '#10b981');

                const start2 = start1 + j * block2;
                const end2 = start2 + block2;
                const level3 = segmentCenters(start2, end2, n3);

                for (let k = 0; k < n3; k += 1) {
                    const y3 = level3[k];
                    ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
                    ctx.beginPath();
                    ctx.moveTo(x2, y2);
                    ctx.lineTo(x3, y3);
                    ctx.stroke();
                    drawNode(x3, y3, 2.5, '#f59e0b');
                }
            }
        }
    }

    function updateSamples(n1, n2, n3) {
        const samples = [];

        for (let i = 1; i <= n1; i += 1) {
            for (let j = 1; j <= n2; j += 1) {
                for (let k = 1; k <= n3; k += 1) {
                    if (samples.length < 12) {
                        samples.push(`(${i}, ${j}, ${k})`);
                    }
                }
            }
        }

        const total = n1 * n2 * n3;
        if (total > 12) {
            samples.push(`... a dalších ${total - 12} možností`);
        }

        sampleList.innerHTML = samples.map(item => `<li>${item}</li>`).join('');
    }

    function render() {
        const n1 = parseInt(slider1.value, 10);
        const n2 = parseInt(slider2.value, 10);
        const n3 = parseInt(slider3.value, 10);

        val1.textContent = String(n1);
        val2.textContent = String(n2);
        val3.textContent = String(n3);

        const total = n1 * n2 * n3;
        equationOut.textContent = `${n1} · ${n2} · ${n3} = ${total}`;
        totalOut.textContent = `Celkem možností: ${total}`;

        drawTree(n1, n2, n3);
        updateSamples(n1, n2, n3);
    }

    [slider1, slider2, slider3].forEach(slider => {
        slider.addEventListener('input', render);
    });

    render();
}

function initProductChallenge() {
    const input = document.getElementById('productChallengeInput');
    const button = document.getElementById('productChallengeCheck');
    const feedback = document.getElementById('productChallengeFeedback');

    if (!input || !button || !feedback) {
        return;
    }

    button.addEventListener('click', () => {
        const value = parseInt(input.value, 10);
        const correct = 60;

        if (Number.isNaN(value)) {
            feedback.className = 'challenge-feedback incorrect';
            feedback.textContent = 'Nejdřív zadejte číselnou odpověď.';
            return;
        }

        if (value === correct) {
            feedback.className = 'challenge-feedback correct';
            feedback.textContent = 'Správně. 4 · 5 · 3 = 60.';
        } else {
            feedback.className = 'challenge-feedback incorrect';
            feedback.textContent = `Nesprávně. Správně je 60, protože 4 · 5 · 3 = 60.`;
        }
    });
}

// =============================================
// SUM RULE DEMO
// =============================================

function initSumDemo() {
    const aSlider = document.getElementById('setACount');
    const bSlider = document.getElementById('setBCount');
    const iSlider = document.getElementById('setIntersection');

    if (!aSlider || !bSlider || !iSlider) {
        return;
    }

    const setALabel = document.getElementById('setALabel');
    const setBLabel = document.getElementById('setBLabel');
    const setILabel = document.getElementById('setILabel');

    const setAValue = document.getElementById('setAValue');
    const setBValue = document.getElementById('setBValue');
    const setIValue = document.getElementById('setIValue');

    const barA = document.getElementById('barA');
    const barB = document.getElementById('barB');
    const barI = document.getElementById('barIntersection');

    const overlapBadge = document.getElementById('overlapBadge');
    const equation = document.getElementById('unionEquation');
    const naiveOut = document.getElementById('sumNaive');
    const correctOut = document.getElementById('sumCorrect');

    function render() {
        const a = parseInt(aSlider.value, 10);
        const b = parseInt(bSlider.value, 10);

        const maxIntersection = Math.min(a, b);
        iSlider.max = String(maxIntersection);

        let intersection = parseInt(iSlider.value, 10);
        if (intersection > maxIntersection) {
            intersection = maxIntersection;
            iSlider.value = String(intersection);
        }

        setALabel.textContent = String(a);
        setBLabel.textContent = String(b);
        setILabel.textContent = String(intersection);

        setAValue.textContent = String(a);
        setBValue.textContent = String(b);
        setIValue.textContent = String(intersection);

        const naive = a + b;
        const correct = a + b - intersection;

        naiveOut.textContent = String(naive);
        correctOut.textContent = String(correct);

        if (intersection === 0) {
            overlapBadge.textContent = 'Případy jsou disjunktní: stačí sčítat.';
            equation.textContent = `|A ∪ B| = |A| + |B| = ${a} + ${b} = ${correct}`;
        } else {
            overlapBadge.textContent = 'Případy se překrývají: musíme odečíst průnik.';
            equation.textContent = `|A ∪ B| = |A| + |B| - |A ∩ B| = ${a} + ${b} - ${intersection} = ${correct}`;
        }

        const scale = 25;
        barA.style.width = `${(a / scale) * 100}%`;
        barB.style.width = `${(b / scale) * 100}%`;
        barI.style.width = `${(intersection / scale) * 100}%`;
    }

    [aSlider, bSlider, iSlider].forEach(slider => {
        slider.addEventListener('input', render);
    });

    render();
}

function initSumChallenge() {
    const input = document.getElementById('sumChallengeInput');
    const button = document.getElementById('sumChallengeCheck');
    const feedback = document.getElementById('sumChallengeFeedback');

    if (!input || !button || !feedback) {
        return;
    }

    button.addEventListener('click', () => {
        const value = parseInt(input.value, 10);
        const correct = 17;

        if (Number.isNaN(value)) {
            feedback.className = 'challenge-feedback incorrect';
            feedback.textContent = 'Nejdřív zadejte číselnou odpověď.';
            return;
        }

        if (value === correct) {
            feedback.className = 'challenge-feedback correct';
            feedback.textContent = 'Správně. 12 + 9 - 4 = 17.';
        } else {
            feedback.className = 'challenge-feedback incorrect';
            feedback.textContent = 'Nesprávně. Správně je 17, protože průnik 4 studentů je v součtu započten dvakrát.';
        }
    });
}

// =============================================
// RULE TRAINING
// =============================================

function initRuleTraining() {
    const cards = Array.from(document.querySelectorAll('.rule-mini-exercise'));
    if (!cards.length) {
        return;
    }

    const explanations = {
        1: 'Součin: vybíráte tričko i kalhoty i mikinu, tedy 5 · 3 · 2.',
        2: 'Součet: vybíráte jednu alternativu (buď dezert, nebo kávu).',
        3: 'Součin: pozice kódu jsou navazující volby (26 · 26 · 10).',
        4: 'Součet: student je buď z A, nebo z B, a třídy se nepřekrývají.'
    };

    const scoreCorrect = document.getElementById('ruleScoreCorrect');
    const scoreTotal = document.getElementById('ruleScoreTotal');
    const scoreText = document.getElementById('ruleScoreText');

    let solved = 0;
    let correct = 0;

    if (scoreTotal) {
        scoreTotal.textContent = String(cards.length);
    }

    cards.forEach(card => {
        const id = card.dataset.id;
        const expected = card.dataset.correct;
        const buttons = Array.from(card.querySelectorAll('.rule-choice-btn'));
        const feedback = card.querySelector('.rule-feedback');

        buttons.forEach(button => {
            button.addEventListener('click', () => {
                if (card.dataset.solved === '1') {
                    return;
                }

                const selected = button.dataset.answer;
                const isCorrect = selected === expected;

                card.dataset.solved = '1';
                solved += 1;
                if (isCorrect) {
                    correct += 1;
                }

                buttons.forEach(btn => {
                    const btnAnswer = btn.dataset.answer;
                    if (btnAnswer === expected) {
                        btn.classList.add('correct');
                    }
                    if (btnAnswer === selected && !isCorrect) {
                        btn.classList.add('incorrect');
                    }
                    btn.disabled = true;
                });

                if (feedback) {
                    if (isCorrect) {
                        feedback.textContent = `Správně. ${explanations[id]}`;
                        feedback.style.color = '#10b981';
                    } else {
                        const correctLabel = expected === 'soucet' ? 'Pravidlo součtu' : 'Pravidlo součinu';
                        feedback.textContent = `Nesprávně. Správně je ${correctLabel}. ${explanations[id]}`;
                        feedback.style.color = '#ef4444';
                    }
                }

                if (scoreCorrect) {
                    scoreCorrect.textContent = String(correct);
                }

                if (scoreText && solved === cards.length) {
                    scoreText.textContent =
                        correct === cards.length
                            ? 'Skvělé, všechna rozhodnutí jsou správně.'
                            : 'Hotovo. Projděte si vysvětlení u úloh, které vyšly chybně.';
                }
            });
        });
    });
}

// =============================================
// FINAL EXERCISES
// =============================================

function initExercises() {
    const feedbackData = {
        1: {
            correct: 'Správně. Jde o disjunktní varianty „buď, nebo“, takže 8 + 5 = 13.',
            incorrect: 'Nesprávně. Jde o pravidlo součtu: 8 + 5 = 13. Správná možnost je b).'
        },
        2: {
            correct: 'Správně. Každá ze 4 pozic má 10 možností, tedy 10 · 10 · 10 · 10 = 10^4.',
            incorrect: 'Nesprávně. Je to sled 4 voleb po 10 možnostech: 10^4 = 10000. Správná možnost je a).'
        },
        3: {
            correct: 'Správně. Vybíráte čepici i bundu i boty, tedy 3 · 2 · 4 = 24.',
            incorrect: 'Nesprávně. Jde o pravidlo součinu: 3 · 2 · 4 = 24. Správná možnost je b).'
        },
        4: {
            correct: 'Správně. Použijeme inkluzi-exkluzi: 15 + 11 - 6 = 20.',
            incorrect: 'Nesprávně. Správný výpočet je 15 + 11 - 6 = 20, protože průnik se musí odečíst. Správná možnost je b).'
        },
        5: {
            correct: 'Správně. Prostý součet selhává při překryvu množin, protože počítá některé prvky dvakrát.',
            incorrect: 'Nesprávně. Problém nastává při neprázdném průniku množin. Správná možnost je b).'
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
