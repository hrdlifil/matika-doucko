// Základy o nerovnicích - Interactive Lesson JavaScript

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initNavbarScroll();
    initNumberLineDemo();
    initMiniChecks();
    initFlipChallenge();
    initConversionTasks();
    initExercises();
});

function typeset(target) {
    if (!window.MathJax || typeof window.MathJax.typesetPromise !== 'function') {
        return;
    }

    const payload = target ? [target] : undefined;
    window.MathJax.typesetPromise(payload).catch(() => {
        // no-op: ignore transient MathJax rendering errors
    });
}

function initNavigation() {
    const sectionOrder = [
        'uvod-do-nerovnic',
        'ekvivalentni-upravy-nerovnice',
        'prevod-na-urcity-typ-nerovnic',
        'procvicovani'
    ];

    const sections = document.querySelectorAll('.lesson-section');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const nextButtons = document.querySelectorAll('.btn-next');
    const prevButtons = document.querySelectorAll('.btn-prev');

    function updateProgress(sectionId) {
        const index = sectionOrder.indexOf(sectionId);
        const progress = index >= 0 ? ((index + 1) / sectionOrder.length) * 100 : 0;
        const bar = document.querySelector('.progress-fill-small');
        if (bar) {
            bar.style.width = `${progress}%`;
        }
    }

    function showSection(sectionId, smooth = true) {
        const targetSection = document.getElementById(sectionId);
        if (!targetSection) {
            return;
        }

        sections.forEach(section => section.classList.remove('active'));
        sidebarLinks.forEach(link => link.classList.remove('active'));

        targetSection.classList.add('active');
        const targetLink = document.querySelector(`[data-section="${sectionId}"]`);
        if (targetLink) {
            targetLink.classList.add('active');
        }

        updateProgress(sectionId);
        window.history.replaceState(null, '', `#${sectionId}`);

        if (smooth) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        typeset(targetSection);
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            showSection(link.dataset.section);
        });
    });

    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            showSection(button.dataset.next);
        });
    });

    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            showSection(button.dataset.prev);
        });
    });

    const initialHash = window.location.hash.replace('#', '');
    const initialSection = sectionOrder.includes(initialHash) ? initialHash : sectionOrder[0];
    showSection(initialSection, false);
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

function initNumberLineDemo() {
    const canvas = document.getElementById('numberLineCanvas');
    const operatorSelect = document.getElementById('inequalityOperator');
    const boundarySlider = document.getElementById('boundarySlider');
    const boundaryValue = document.getElementById('boundaryValue');
    const inequalityEl = document.getElementById('currentInequality');
    const intervalEl = document.getElementById('currentInterval');
    const sampleEl = document.getElementById('sampleSolutions');

    if (!canvas || !operatorSelect || !boundarySlider || !boundaryValue || !inequalityEl || !intervalEl || !sampleEl) {
        return;
    }

    const ctx = canvas.getContext('2d');
    const minVal = -10;
    const maxVal = 10;
    const margin = 42;

    function toCanvasX(value) {
        const width = canvas.width - margin * 2;
        return margin + ((value - minVal) / (maxVal - minVal)) * width;
    }

    function satisfies(value, boundary, op) {
        if (op === 'lt') return value < boundary;
        if (op === 'le') return value <= boundary;
        if (op === 'gt') return value > boundary;
        return value >= boundary;
    }

    function opToLatex(op) {
        if (op === 'lt') return '<';
        if (op === 'le') return '\\le';
        if (op === 'gt') return '>';
        return '\\ge';
    }

    function intervalLatex(boundary, op) {
        if (op === 'lt') return `\\((-\\infty,${boundary})\\)`;
        if (op === 'le') return `\\((-\\infty,${boundary}]\\)`;
        if (op === 'gt') return `\\((${boundary},\\infty)\\)`;
        return `\\([${boundary},\\infty)\\)`;
    }

    function drawAxis(boundary, op) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#08080d';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const y = canvas.height / 2;

        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(canvas.width - margin, y);
        ctx.stroke();

        // Arrow heads
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.beginPath();
        ctx.moveTo(canvas.width - margin + 12, y);
        ctx.lineTo(canvas.width - margin, y - 6);
        ctx.lineTo(canvas.width - margin, y + 6);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(margin - 12, y);
        ctx.lineTo(margin, y - 6);
        ctx.lineTo(margin, y + 6);
        ctx.closePath();
        ctx.fill();

        // Tick marks and labels
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        for (let i = minVal; i <= maxVal; i++) {
            const x = toCanvasX(i);
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, y - 6);
            ctx.lineTo(x, y + 6);
            ctx.stroke();

            if (i % 2 === 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.fillText(i.toString(), x, y + 10);
            }
        }

        // Highlight satisfying region
        const boundaryX = toCanvasX(boundary);
        ctx.fillStyle = 'rgba(99, 102, 241, 0.28)';

        if (op === 'lt' || op === 'le') {
            ctx.fillRect(margin, y - 8, Math.max(0, boundaryX - margin), 16);
        } else {
            ctx.fillRect(boundaryX, y - 8, Math.max(0, canvas.width - margin - boundaryX), 16);
        }

        // Boundary point
        ctx.beginPath();
        ctx.arc(boundaryX, y, 9, 0, Math.PI * 2);

        if (op === 'le' || op === 'ge') {
            ctx.fillStyle = '#6366f1';
            ctx.fill();
        } else {
            ctx.fillStyle = '#08080d';
            ctx.fill();
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Direction marker
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (op === 'lt' || op === 'le') {
            ctx.moveTo(boundaryX - 20, y);
            ctx.lineTo(boundaryX - 70, y);
            ctx.lineTo(boundaryX - 58, y - 7);
            ctx.moveTo(boundaryX - 70, y);
            ctx.lineTo(boundaryX - 58, y + 7);
        } else {
            ctx.moveTo(boundaryX + 20, y);
            ctx.lineTo(boundaryX + 70, y);
            ctx.lineTo(boundaryX + 58, y - 7);
            ctx.moveTo(boundaryX + 70, y);
            ctx.lineTo(boundaryX + 58, y + 7);
        }
        ctx.stroke();
    }

    function updateDisplay() {
        const boundary = Number(boundarySlider.value);
        const op = operatorSelect.value;

        boundaryValue.textContent = String(boundary);
        inequalityEl.innerHTML = `\\(x ${opToLatex(op)} ${boundary}\\)`;
        intervalEl.innerHTML = intervalLatex(boundary, op);

        const integers = [];
        for (let i = -10; i <= 10; i++) {
            if (satisfies(i, boundary, op)) {
                integers.push(i);
            }
        }

        if (integers.length === 0) {
            sampleEl.textContent = 'Žádná celá hodnota v intervalu [-10, 10].';
        } else {
            const picked = integers.slice(0, 6).join(',\\;');
            sampleEl.innerHTML = `\\(${picked}\\)`;
        }

        drawAxis(boundary, op);
        const outputGrid = document.querySelector('.math-output-grid');
        typeset(outputGrid || undefined);
    }

    operatorSelect.addEventListener('change', updateDisplay);
    boundarySlider.addEventListener('input', updateDisplay);

    updateDisplay();
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
            const correctLabel = button.dataset.correctLabel;
            const explanation = button.dataset.explanation || '';

            options.forEach(option => {
                option.disabled = true;
            });
            button.disabled = true;

            selected.parentElement.classList.add(isCorrect ? 'correct' : 'incorrect');

            if (!isCorrect) {
                options.forEach(option => {
                    if (option.value === correct) {
                        option.parentElement.classList.add('correct');
                    }
                });
            }

            if (feedback) {
                feedback.innerHTML = isCorrect
                    ? `Správně. ${explanation}`
                    : `Nesprávně. Správná odpověď je ${correctLabel}. ${explanation}`;
                feedback.className = `mini-feedback show ${isCorrect ? 'correct' : 'incorrect'}`;
                typeset(feedback);
            }
        });
    });
}

function initFlipChallenge() {
    const scenarioEl = document.getElementById('flipScenario');
    const feedbackEl = document.getElementById('flipFeedback');
    const scoreEl = document.getElementById('flipScore');
    const nextButton = document.getElementById('nextFlipChallenge');
    const decisionButtons = document.querySelectorAll('.flip-decision-btn');

    if (!scenarioEl || !feedbackEl || !scoreEl || !nextButton || decisionButtons.length === 0) {
        return;
    }

    const scenarios = [
        {
            prompt: 'Máme nerovnici \\(3x-4 < 11\\). Obě strany násobíme číslem \\(5\\).',
            answer: 'keep',
            label: 'Nechat znaménko',
            explanation: 'Násobíme kladným číslem, takže směr nerovnosti zůstává stejný.'
        },
        {
            prompt: 'Máme nerovnici \\(-2x+7 \\ge 1\\). Obě strany dělíme číslem \\(-2\\).',
            answer: 'flip',
            label: 'Obrátit znaménko',
            explanation: 'Při dělení záporným číslem se znaménko nerovnosti obrací.'
        },
        {
            prompt: 'Máme nerovnici \\(|x-1| \\le 4\\). Na obě strany přičteme \\(3\\).',
            answer: 'keep',
            label: 'Nechat znaménko',
            explanation: 'Přičtení stejné hodnoty na obou stranách je ekvivalentní úprava bez změny znaménka.'
        },
        {
            prompt: 'Máme nerovnici \\(x+2 > 0\\). Chceme násobit výrazem \\(x-1\\) bez rozdělení na případy.',
            answer: 'unknown',
            label: 'Rozdělit na případy',
            explanation: 'Znaménko \\(x-1\\) není předem známé. Je nutné řešit případy \\(x-1>0\\) a \\(x-1<0\\).'
        },
        {
            prompt: 'Máme nerovnici \\(x \\le y\\). Na obě strany aplikujeme funkci \\(f(t)=-t\\).',
            answer: 'flip',
            label: 'Obrátit znaménko',
            explanation: 'Funkce \\(f(t)=-t\\) je klesající, proto obrací pořadí.'
        },
        {
            prompt: 'Máme nerovnici \\(x < 2\\). Chceme obě strany umocnit na druhou bez dalších podmínek.',
            answer: 'unknown',
            label: 'Rozdělit na případy',
            explanation: 'Funkce \\(t^2\\) není na \\(\\mathbb{R}\\) prostě rostoucí. Bez omezení oboru nejde o obecně ekvivalentní úpravu.'
        }
    ];

    let currentIndex = 0;
    let answered = 0;
    let correctCount = 0;
    let locked = false;

    function resetDecisionButtons() {
        decisionButtons.forEach(button => {
            button.disabled = false;
            button.classList.remove('selected-correct', 'selected-incorrect');
        });
    }

    function updateScore() {
        scoreEl.textContent = `Skóre: ${correctCount}/${answered}`;
    }

    function renderScenario() {
        const scenario = scenarios[currentIndex];
        scenarioEl.innerHTML = scenario.prompt;
        feedbackEl.className = 'challenge-feedback';
        feedbackEl.textContent = '';
        locked = false;
        resetDecisionButtons();
        updateScore();
        typeset(scenarioEl);
    }

    function evaluateDecision(choice) {
        if (locked) {
            return;
        }

        const scenario = scenarios[currentIndex];
        const isCorrect = choice === scenario.answer;

        locked = true;
        answered += 1;
        if (isCorrect) {
            correctCount += 1;
        }

        decisionButtons.forEach(button => {
            button.disabled = true;
            if (button.dataset.answer === choice) {
                button.classList.add(isCorrect ? 'selected-correct' : 'selected-incorrect');
            }
            if (!isCorrect && button.dataset.answer === scenario.answer) {
                button.classList.add('selected-correct');
            }
        });

        feedbackEl.innerHTML = isCorrect
            ? `Správně. ${scenario.explanation}`
            : `Nesprávně. Správná volba je: <strong>${scenario.label}</strong>. ${scenario.explanation}`;
        feedbackEl.className = `challenge-feedback show ${isCorrect ? 'correct' : 'incorrect'}`;

        updateScore();
        typeset(feedbackEl);
    }

    decisionButtons.forEach(button => {
        button.addEventListener('click', () => {
            evaluateDecision(button.dataset.answer);
        });
    });

    nextButton.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % scenarios.length;
        renderScenario();
    });

    renderScenario();
}

function initConversionTasks() {
    const conversionMeta = {
        1: {
            correctText: '\\(5x-15\\le0\\)',
            explanation: 'Po roznásobení a přesunu členů na jednu stranu dostaneme lineární standardní tvar pro analýzu znaménka.'
        },
        2: {
            correctText: '\\((x-3)(x+2)>0\\)',
            explanation: 'Kvadratický výraz převedeme na součinový tvar, abychom mohli použít znaménkovou tabulku.'
        },
        3: {
            correctText: '\\(2x-3>5\\) nebo \\(2x-3<-5\\)',
            explanation: 'Pro \\(|A|>k\\), kde \\(k>0\\), řešíme dvě větve: vpravo od \\(+k\\) a vlevo od \\(-k\\).'
        }
    };

    const buttons = document.querySelectorAll('.conversion-check');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const taskId = button.dataset.task;
            const group = button.dataset.group;
            const correct = button.dataset.correct;
            const selected = document.querySelector(`input[name="${group}"]:checked`);
            const options = document.querySelectorAll(`input[name="${group}"]`);
            const feedback = document.getElementById(`convFeedback${taskId}`);
            const meta = conversionMeta[taskId];

            if (!selected) {
                alert('Vyberte prosím jednu odpověď.');
                return;
            }

            const isCorrect = selected.value === correct;

            options.forEach(option => {
                option.disabled = true;
            });
            button.disabled = true;

            selected.parentElement.classList.add(isCorrect ? 'correct' : 'incorrect');

            if (!isCorrect) {
                options.forEach(option => {
                    if (option.value === correct) {
                        option.parentElement.classList.add('correct');
                    }
                });
            }

            if (feedback && meta) {
                feedback.innerHTML = isCorrect
                    ? `Správně. ${meta.explanation}`
                    : `Nesprávně. Správný převod je ${meta.correctText}. ${meta.explanation}`;
                feedback.className = `conversion-feedback show ${isCorrect ? 'correct' : 'incorrect'}`;
                typeset(feedback);
            }
        });
    });
}

function initExercises() {
    const checkButtons = document.querySelectorAll('.btn-check');

    const solutions = {
        1: {
            correctText: '\\(x>1\\)',
            explanation: '\\(4-3x<1 \\Rightarrow -3x<-3\\Rightarrow x>1\\). Při dělení záporným číslem se znaménko obrací.'
        },
        2: {
            correctText: '\\((-3,4]\\)',
            explanation: 'Z dvojité nerovnice vyjde \\(-3<x\\) a současně \\(x\\le4\\), průnik je \\((-3,4]\\).'
        },
        3: {
            correctText: '\\([-2,3]\\)',
            explanation: '\\(x^2-x-6=(x-3)(x+2)\\). Součin je nekladný mezi kořeny včetně krajů.'
        },
        4: {
            correctText: '\\((-\\infty,-1)\\cup(4,\\infty)\\)',
            explanation: 'Kritické body jsou \\(x=-1\\) (zakázaný) a \\(x=4\\) (nulový čitatel). Znaménko je kladné vlevo od -1 a vpravo od 4.'
        },
        5: {
            correctText: '\\((-1,5)\\)',
            explanation: '\\(|3x-6|<9 \\Rightarrow -9<3x-6<9 \\Rightarrow -1<x<5\\).'
        },
        6: {
            correctText: '\\(\\mathbb{R}\\)',
            explanation: 'Protože \\(|2x+1|\\ge0\\) pro všechna \\(x\\), nerovnost \\(|2x+1|\\ge-4\\) platí vždy.'
        }
    };

    checkButtons.forEach(button => {
        button.addEventListener('click', () => {
            const exerciseNum = button.dataset.exercise;
            const correctAnswer = button.dataset.correct;
            const selectedOption = document.querySelector(`input[name="ex${exerciseNum}"]:checked`);
            const feedback = document.getElementById(`ex${exerciseNum}Feedback`);
            const status = document.getElementById(`ex${exerciseNum}Status`);
            const options = document.querySelectorAll(`input[name="ex${exerciseNum}"]`);
            const meta = solutions[exerciseNum];

            if (!selectedOption) {
                alert('Vyberte prosím jednu odpověď.');
                return;
            }

            const isCorrect = selectedOption.value === correctAnswer;

            options.forEach(option => {
                option.disabled = true;
            });
            button.disabled = true;

            selectedOption.parentElement.classList.add(isCorrect ? 'correct' : 'incorrect');

            if (!isCorrect) {
                options.forEach(option => {
                    if (option.value === correctAnswer) {
                        option.parentElement.classList.add('correct');
                    }
                });
            }

            if (status) {
                status.textContent = isCorrect ? 'Správně' : 'Špatně';
                status.className = `exercise-status ${isCorrect ? 'correct' : 'incorrect'}`;
            }

            if (feedback && meta) {
                feedback.innerHTML = isCorrect
                    ? `Správně. ${meta.explanation}`
                    : `Nesprávně. Správný výsledek je ${meta.correctText}. ${meta.explanation}`;
                feedback.className = `exercise-feedback show ${isCorrect ? 'correct' : 'incorrect'}`;
                typeset(feedback);
            }

            checkLessonComplete();
        });
    });

    function checkLessonComplete() {
        const allDisabled = Array.from(checkButtons).every(button => button.disabled);
        if (!allDisabled) {
            return;
        }

        const completeBox = document.getElementById('lessonComplete');
        if (completeBox) {
            completeBox.style.display = 'block';
            typeset(completeBox);
        }
    }
}

