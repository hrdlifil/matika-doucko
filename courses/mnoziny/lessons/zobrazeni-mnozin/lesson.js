document.addEventListener('DOMContentLoaded', () => {
    initNavbarScroll();
    initNavigation();
    initClassificationLab();
    initClassificationQuiz();
    initCompositionLab();
    initCompositionNumericQuiz();
    initCompositionRuleQuiz();
    initInverseBuilder();
    initInverseNumericQuiz();
    initExercises();
    typeset();
});

function typeset(target) {
    if (!window.MathJax || typeof window.MathJax.typesetPromise !== 'function') {
        return;
    }

    const payload = target ? [target] : undefined;
    window.MathJax.typesetPromise(payload).catch(() => {
        // Ignore transient MathJax errors.
    });
}

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
    const sectionOrder = [
        'injektivni-surjektivni-a-bijektivni-zobrazeni',
        'skladani-zobrazeni',
        'inverzni-zobrazeni'
    ];

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

        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            typeset(targetSection);
        }
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

function shuffleArray(source) {
    const array = [...source];
    for (let index = array.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [array[index], array[swapIndex]] = [array[swapIndex], array[index]];
    }
    return array;
}

function parseNumberInput(rawValue) {
    const normalized = String(rawValue || '').trim().replace(',', '.');
    if (!normalized) {
        return { valid: false, message: 'Zadejte prosim ciselnou odpoved.' };
    }

    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) {
        return { valid: false, message: 'Odpoved musi byt cislo.' };
    }

    return { valid: true, value: parsed };
}

function formatSet(values) {
    if (!values || values.length === 0) {
        return '∅';
    }
    return `{${values.join(', ')}}`;
}

function mappingToText(mapping, domain, name = 'f') {
    return domain.map(item => `${name}(${item})=${mapping[item]}`).join(', ');
}

function analyzeMapping(domain, codomain, mapping) {
    const preimages = new Map(codomain.map(target => [target, []]));

    domain.forEach(source => {
        const target = mapping[source];
        if (!preimages.has(target)) {
            preimages.set(target, []);
        }
        preimages.get(target).push(source);
    });

    const collisions = [];
    const missing = [];

    codomain.forEach(target => {
        const origins = preimages.get(target) || [];
        if (origins.length === 0) {
            missing.push(target);
        }
        if (origins.length > 1) {
            collisions.push({ target, origins });
        }
    });

    const image = codomain.filter(target => (preimages.get(target) || []).length > 0);
    const injective = collisions.length === 0;
    const surjective = missing.length === 0;

    return {
        injective,
        surjective,
        bijective: injective && surjective,
        image,
        collisions,
        missing,
        preimages
    };
}

function mappingCategoryKey(properties) {
    if (properties.bijective) {
        return 'bijective';
    }
    if (properties.injective) {
        return 'injective-only';
    }
    if (properties.surjective) {
        return 'surjective-only';
    }
    return 'neither';
}

function mappingCategoryLabel(category) {
    if (category === 'bijective') {
        return 'Bijektivni';
    }
    if (category === 'injective-only') {
        return 'Jen injektivni';
    }
    if (category === 'surjective-only') {
        return 'Jen surjektivni';
    }
    return 'Ani injektivni, ani surjektivni';
}

function createPropertyBadge(text, state) {
    const badge = document.createElement('span');
    badge.className = `property-badge ${state ? 'on' : 'off'}`;
    badge.textContent = text;
    return badge;
}

function createSvgElement(tag, attributes = {}) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attributes).forEach(([name, value]) => {
        element.setAttribute(name, String(value));
    });
    return element;
}

function verticalPositions(count, top, bottom) {
    if (count <= 1) {
        return [Math.round((top + bottom) / 2)];
    }

    const step = (bottom - top) / (count - 1);
    return Array.from({ length: count }, (_, index) => Math.round(top + step * index));
}

function initArrowDefinition(svg, markerId, color) {
    const defs = createSvgElement('defs');
    const marker = createSvgElement('marker', {
        id: markerId,
        markerWidth: 9,
        markerHeight: 7,
        refX: 7,
        refY: 3.5,
        orient: 'auto',
        markerUnits: 'strokeWidth'
    });

    const polygon = createSvgElement('polygon', {
        points: '0 0, 9 3.5, 0 7',
        fill: color
    });

    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.appendChild(defs);
}

function drawNode(svg, x, y, label, styles = {}) {
    const circle = createSvgElement('circle', {
        cx: x,
        cy: y,
        r: styles.radius || 20,
        fill: styles.fill || '#111827',
        stroke: styles.stroke || 'rgba(148, 163, 184, 0.7)',
        'stroke-width': styles.strokeWidth || 1.8
    });

    const text = createSvgElement('text', {
        x,
        y: y + 5,
        'text-anchor': 'middle',
        'font-size': 14,
        'font-weight': 700,
        fill: styles.textColor || '#e2e8f0',
        'font-family': 'Inter, sans-serif'
    });
    text.textContent = label;

    svg.appendChild(circle);
    svg.appendChild(text);
}

function renderTwoSetMappingDiagram(svg, leftLabel, rightLabel, leftValues, rightValues, mapping, options = {}) {
    if (!svg) {
        return;
    }

    const width = 760;
    const height = 380;
    const leftX = 170;
    const rightX = 590;
    const top = 70;
    const bottom = 320;

    const leftPositions = verticalPositions(leftValues.length, top, bottom);
    const rightPositions = verticalPositions(rightValues.length, top, bottom);
    const leftYByValue = new Map(leftValues.map((value, index) => [value, leftPositions[index]]));
    const rightYByValue = new Map(rightValues.map((value, index) => [value, rightPositions[index]]));

    svg.innerHTML = '';

    initArrowDefinition(svg, 'arrow-forward', options.arrowColor || '#6366f1');
    initArrowDefinition(svg, 'arrow-backward', options.reverseArrowColor || '#f59e0b');

    const bg = createSvgElement('rect', {
        x: 10,
        y: 12,
        width: width - 20,
        height: height - 24,
        rx: 16,
        fill: '#0b101a',
        stroke: 'rgba(148, 163, 184, 0.22)',
        'stroke-width': 1.2
    });
    svg.appendChild(bg);

    const leftBox = createSvgElement('rect', {
        x: 90,
        y: 36,
        width: 160,
        height: 308,
        rx: 14,
        fill: 'rgba(59, 130, 246, 0.12)',
        stroke: 'rgba(59, 130, 246, 0.4)',
        'stroke-width': 1.2
    });

    const rightBox = createSvgElement('rect', {
        x: 510,
        y: 36,
        width: 160,
        height: 308,
        rx: 14,
        fill: 'rgba(16, 185, 129, 0.12)',
        stroke: 'rgba(16, 185, 129, 0.4)',
        'stroke-width': 1.2
    });

    svg.appendChild(leftBox);
    svg.appendChild(rightBox);

    const leftTitle = createSvgElement('text', {
        x: 170,
        y: 58,
        'text-anchor': 'middle',
        'font-size': 15,
        'font-weight': 700,
        fill: '#bfdbfe',
        'font-family': 'Inter, sans-serif'
    });
    leftTitle.textContent = leftLabel;

    const rightTitle = createSvgElement('text', {
        x: 590,
        y: 58,
        'text-anchor': 'middle',
        'font-size': 15,
        'font-weight': 700,
        fill: '#bbf7d0',
        'font-family': 'Inter, sans-serif'
    });
    rightTitle.textContent = rightLabel;

    svg.appendChild(leftTitle);
    svg.appendChild(rightTitle);

    const colors = ['#a78bfa', '#60a5fa', '#34d399', '#f59e0b', '#f472b6'];

    leftValues.forEach((source, index) => {
        const target = mapping[source];
        const y1 = leftYByValue.get(source);
        const y2 = rightYByValue.get(target);

        if (y2 === undefined) {
            return;
        }

        const line = createSvgElement('path', {
            d: `M ${leftX + 21} ${y1} C ${leftX + 180} ${y1}, ${rightX - 180} ${y2}, ${rightX - 21} ${y2}`,
            fill: 'none',
            stroke: colors[index % colors.length],
            'stroke-width': 2.6,
            'marker-end': 'url(#arrow-forward)',
            opacity: 0.92
        });

        svg.appendChild(line);
    });

    leftValues.forEach(value => {
        drawNode(svg, leftX, leftYByValue.get(value), value, {
            fill: '#1e293b',
            stroke: 'rgba(147, 197, 253, 0.85)',
            textColor: '#e2e8f0'
        });
    });

    rightValues.forEach(value => {
        drawNode(svg, rightX, rightYByValue.get(value), value, {
            fill: '#102219',
            stroke: 'rgba(110, 231, 183, 0.85)',
            textColor: '#ecfeff'
        });
    });

    if (options.reverseMapping) {
        rightValues.forEach((source, index) => {
            const target = options.reverseMapping[source];
            const y1 = rightYByValue.get(source);
            const y2 = leftYByValue.get(target);

            if (y2 === undefined) {
                return;
            }

            const reverse = createSvgElement('path', {
                d: `M ${rightX - 21} ${y1 + 2} C ${rightX - 200} ${y1 + 8}, ${leftX + 200} ${y2 + 8}, ${leftX + 21} ${y2 + 2}`,
                fill: 'none',
                stroke: options.reverseArrowColor || '#f59e0b',
                'stroke-width': 2,
                'stroke-dasharray': '5 4',
                'marker-end': 'url(#arrow-backward)',
                opacity: 0.85
            });
            svg.appendChild(reverse);
        });
    }
}

function renderThreeSetCompositionDiagram(svg, setA, setB, setC, mappingF, mappingG) {
    if (!svg) {
        return;
    }

    const width = 860;
    const height = 400;

    const xA = 140;
    const xB = 430;
    const xC = 720;

    const top = 76;
    const bottom = 338;

    const positionsA = verticalPositions(setA.length, top, bottom);
    const positionsB = verticalPositions(setB.length, top, bottom);
    const positionsC = verticalPositions(setC.length, top, bottom);

    const yA = new Map(setA.map((item, index) => [item, positionsA[index]]));
    const yB = new Map(setB.map((item, index) => [item, positionsB[index]]));
    const yC = new Map(setC.map((item, index) => [item, positionsC[index]]));

    svg.innerHTML = '';

    initArrowDefinition(svg, 'arrow-f', '#3b82f6');
    initArrowDefinition(svg, 'arrow-g', '#10b981');
    initArrowDefinition(svg, 'arrow-h', '#a855f7');

    const bg = createSvgElement('rect', {
        x: 10,
        y: 12,
        width: width - 20,
        height: height - 24,
        rx: 16,
        fill: '#0b101a',
        stroke: 'rgba(148, 163, 184, 0.22)',
        'stroke-width': 1.2
    });
    svg.appendChild(bg);

    const boxes = [
        { x: 60, color: 'rgba(59,130,246,0.35)', fill: 'rgba(59,130,246,0.1)', label: 'A' },
        { x: 350, color: 'rgba(16,185,129,0.35)', fill: 'rgba(16,185,129,0.1)', label: 'B' },
        { x: 640, color: 'rgba(168,85,247,0.35)', fill: 'rgba(168,85,247,0.1)', label: 'C' }
    ];

    boxes.forEach(box => {
        svg.appendChild(createSvgElement('rect', {
            x: box.x,
            y: 36,
            width: 160,
            height: 328,
            rx: 14,
            fill: box.fill,
            stroke: box.color,
            'stroke-width': 1.2
        }));

        const title = createSvgElement('text', {
            x: box.x + 80,
            y: 58,
            'text-anchor': 'middle',
            'font-size': 15,
            'font-weight': 700,
            fill: '#e2e8f0',
            'font-family': 'Inter, sans-serif'
        });
        title.textContent = box.label;
        svg.appendChild(title);
    });

    setA.forEach((source, index) => {
        const middle = mappingF[source];
        const y1 = yA.get(source);
        const y2 = yB.get(middle);
        if (y2 === undefined) {
            return;
        }

        const line = createSvgElement('path', {
            d: `M ${xA + 20} ${y1} C ${xA + 95} ${y1}, ${xB - 95} ${y2}, ${xB - 20} ${y2}`,
            fill: 'none',
            stroke: '#60a5fa',
            'stroke-width': 2.4,
            'marker-end': 'url(#arrow-f)',
            opacity: 0.95
        });

        svg.appendChild(line);

        const finalValue = mappingG[middle];
        const y3 = yC.get(finalValue);
        if (y3 !== undefined) {
            const composed = createSvgElement('path', {
                d: `M ${xA + 18} ${y1 + 2} C ${xA + 230} ${y1 + 26}, ${xC - 230} ${y3 + 26}, ${xC - 18} ${y3 + 2}`,
                fill: 'none',
                stroke: '#a78bfa',
                'stroke-width': 1.8,
                'stroke-dasharray': '6 4',
                'marker-end': 'url(#arrow-h)',
                opacity: 0.7
            });
            svg.appendChild(composed);
        }

        const fLabel = createSvgElement('text', {
            x: (xA + xB) / 2 - 10,
            y: 30 + index * 16,
            'text-anchor': 'middle',
            'font-size': 11,
            fill: '#93c5fd',
            'font-family': 'Inter, sans-serif'
        });
        fLabel.textContent = 'f';
        svg.appendChild(fLabel);
    });

    setB.forEach(source => {
        const target = mappingG[source];
        const y1 = yB.get(source);
        const y2 = yC.get(target);
        if (y2 === undefined) {
            return;
        }

        const line = createSvgElement('path', {
            d: `M ${xB + 20} ${y1} C ${xB + 95} ${y1}, ${xC - 95} ${y2}, ${xC - 20} ${y2}`,
            fill: 'none',
            stroke: '#34d399',
            'stroke-width': 2.4,
            'marker-end': 'url(#arrow-g)',
            opacity: 0.95
        });

        svg.appendChild(line);
    });

    setA.forEach(value => {
        drawNode(svg, xA, yA.get(value), value, {
            fill: '#13243a',
            stroke: 'rgba(147, 197, 253, 0.85)'
        });
    });

    setB.forEach(value => {
        drawNode(svg, xB, yB.get(value), value, {
            fill: '#0f2a21',
            stroke: 'rgba(110, 231, 183, 0.85)'
        });
    });

    setC.forEach(value => {
        drawNode(svg, xC, yC.get(value), value, {
            fill: '#23163a',
            stroke: 'rgba(196, 181, 253, 0.9)'
        });
    });
}

function setFeedback(element, type, message, useHtml = false) {
    if (!element) {
        return;
    }

    if (useHtml) {
        element.innerHTML = message;
    } else {
        element.textContent = message;
    }

    element.className = `feedback-box show ${type}`;
    typeset(element);
}

function clearFeedback(element) {
    if (!element) {
        return;
    }
    element.className = 'feedback-box';
    element.textContent = '';
}

function setInlineFeedback(element, kind, text) {
    if (!element) {
        return;
    }

    element.textContent = text;
    element.className = `feedback-inline ${kind}`;
}

function initClassificationLab() {
    const setMeta = document.getElementById('classificationSetMeta');
    const controls = document.getElementById('classificationMappingControls');
    const randomButton = document.getElementById('classificationRandomBtn');
    const resetButton = document.getElementById('classificationResetBtn');
    const summary = document.getElementById('classificationSummary');
    const badges = document.getElementById('classificationPropertyBadges');
    const details = document.getElementById('classificationDetails');
    const counterexample = document.getElementById('classificationCounterexample');
    const diagram = document.getElementById('classificationDiagram');

    if (!setMeta || !controls || !randomButton || !resetButton || !summary || !badges || !details || !counterexample || !diagram) {
        return;
    }

    const domain = ['1', '2', '3', '4'];
    const codomain = ['a', 'b', 'c', 'd'];
    let mapping = {
        1: 'a',
        2: 'b',
        3: 'c',
        4: 'd'
    };

    function buildControls() {
        controls.innerHTML = '';

        domain.forEach(source => {
            const row = document.createElement('div');
            row.className = 'mapping-control-row';

            const label = document.createElement('label');
            label.textContent = `f(${source}) =`;

            const select = document.createElement('select');
            select.dataset.source = source;

            codomain.forEach(target => {
                const option = document.createElement('option');
                option.value = target;
                option.textContent = target;
                if (mapping[source] === target) {
                    option.selected = true;
                }
                select.appendChild(option);
            });

            select.addEventListener('change', () => {
                mapping[source] = select.value;
                render();
            });

            row.appendChild(label);
            row.appendChild(select);
            controls.appendChild(row);
        });
    }

    function randomizeMapping() {
        domain.forEach(source => {
            const randomTarget = codomain[Math.floor(Math.random() * codomain.length)];
            mapping[source] = randomTarget;
        });
    }

    function resetMapping() {
        mapping = {
            1: 'a',
            2: 'b',
            3: 'c',
            4: 'd'
        };
    }

    function render() {
        buildControls();

        setMeta.innerHTML = `A = ${formatSet(domain)}, B = ${formatSet(codomain)}`;

        const properties = analyzeMapping(domain, codomain, mapping);
        const category = mappingCategoryKey(properties);
        summary.textContent = `Typ zobrazeni: ${mappingCategoryLabel(category)}`;

        badges.innerHTML = '';
        badges.appendChild(createPropertyBadge('Injektivni', properties.injective));
        badges.appendChild(createPropertyBadge('Surjektivni', properties.surjective));
        badges.appendChild(createPropertyBadge('Bijektivni', properties.bijective));

        details.innerHTML = [
            `Mapovani: ${mappingToText(mapping, domain, 'f')}`,
            `Obor hodnot: ${formatSet(properties.image)}`
        ].join('<br>');

        if (properties.bijective) {
            setInlineFeedback(counterexample, 'correct', 'Spravne: kazdy prvek B ma prave jeden vzor.');
        } else if (!properties.injective && properties.collisions.length > 0) {
            const collision = properties.collisions[0];
            setInlineFeedback(
                counterexample,
                'incorrect',
                `Neni injektivni: ${collision.origins.join(' a ')} se zobrazuji na ${collision.target}.`
            );
        } else if (!properties.surjective && properties.missing.length > 0) {
            setInlineFeedback(
                counterexample,
                'incorrect',
                `Neni surjektivni: prvky ${properties.missing.join(', ')} v B nemaji vzor.`
            );
        } else {
            setInlineFeedback(counterexample, 'info', 'Upravte mapovani a sledujte, jak se meni vlastnosti.');
        }

        renderTwoSetMappingDiagram(
            diagram,
            'A',
            'B',
            domain,
            codomain,
            mapping,
            { arrowColor: '#6366f1' }
        );

        typeset(details.closest('.interactive-demo'));
    }

    randomButton.addEventListener('click', () => {
        randomizeMapping();
        render();
    });

    resetButton.addEventListener('click', () => {
        resetMapping();
        render();
    });

    render();
}

function initClassificationQuiz() {
    const questionEl = document.getElementById('classificationQuizQuestion');
    const progressEl = document.getElementById('classificationQuizProgress');
    const feedbackEl = document.getElementById('classificationQuizFeedback');
    const options = Array.from(document.querySelectorAll('#classificationQuizOptions .classify-option'));
    const checkButton = document.getElementById('classificationQuizCheckBtn');
    const nextButton = document.getElementById('classificationQuizNextBtn');

    if (!questionEl || !progressEl || !feedbackEl || options.length === 0 || !checkButton || !nextButton) {
        return;
    }

    const tasks = shuffleArray([
        {
            statement: 'Pro \(f\colon \mathbb{R}\to\mathbb{R},\ f(x)=x^3\) urcete typ zobrazeni.',
            answer: 'bijective',
            explanation: 'x^3 je na R striktne rostouci a pokryva vsechna realna cisla.'
        },
        {
            statement: 'Pro \(f\colon \mathbb{R}\to\mathbb{R},\ f(x)=x^2\) urcete typ zobrazeni.',
            answer: 'neither',
            explanation: 'Neni injektivni (napr. 2 a -2) ani surjektivni na R (zaporne hodnoty).'
        },
        {
            statement: '\(A=\{1,2,3\},\ B=\{a,b,c,d\},\ f(1)=a, f(2)=b, f(3)=c\).',
            answer: 'injective-only',
            explanation: 'Vystupy jsou ruzne, ale d nema vzor, proto nejde o surjekci.'
        },
        {
            statement: '\(A=\{1,2,3,4\},\ B=\{x,y\},\ f(1)=x, f(2)=x, f(3)=y, f(4)=y\).',
            answer: 'surjective-only',
            explanation: 'Kazdy prvek B ma vzor, ale ruzne vstupy se slivaji.'
        },
        {
            statement: '\(A=\{1,2,3\},\ B=\{a,b,c\},\ f(1)=b, f(2)=c, f(3)=a\).',
            answer: 'bijective',
            explanation: 'Jde o permutaci prvku B, tedy injekce i surjekce.'
        },
        {
            statement: '\(A=\{1,2,3\},\ B=\{a,b,c\},\ f(1)=a, f(2)=a, f(3)=a\).',
            answer: 'neither',
            explanation: 'Neni injektivni a navic b,c nejsou pokryty, tedy neni surjektivni.'
        }
    ]);

    let currentIndex = 0;
    let selected = '';

    function clearOptionState() {
        options.forEach(option => option.classList.remove('selected', 'correct', 'incorrect'));
    }

    function renderTask() {
        selected = '';
        clearOptionState();
        clearFeedback(feedbackEl);

        const task = tasks[currentIndex];
        questionEl.innerHTML = task.statement;
        progressEl.textContent = `Uloha ${currentIndex + 1} z ${tasks.length}`;
        typeset(questionEl.closest('.demo-panel'));
    }

    options.forEach(option => {
        option.addEventListener('click', () => {
            selected = option.dataset.value;
            options.forEach(item => item.classList.remove('selected'));
            option.classList.add('selected');
        });
    });

    checkButton.addEventListener('click', () => {
        if (!selected) {
            setFeedback(feedbackEl, 'info', 'Vyberte jednu moznost.');
            return;
        }

        const task = tasks[currentIndex];
        const isCorrect = selected === task.answer;

        options.forEach(option => {
            option.classList.remove('correct', 'incorrect');
            if (option.dataset.value === task.answer) {
                option.classList.add('correct');
            } else if (option.dataset.value === selected && !isCorrect) {
                option.classList.add('incorrect');
            }
        });

        if (isCorrect) {
            setFeedback(feedbackEl, 'correct', `Spravne. ${task.explanation}`);
        } else {
            setFeedback(
                feedbackEl,
                'incorrect',
                `Nespravne. Spravna klasifikace je "${mappingCategoryLabel(task.answer)}". ${task.explanation}`
            );
        }
    });

    nextButton.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % tasks.length;
        renderTask();
    });

    renderTask();
}

function initCompositionLab() {
    const controlsF = document.getElementById('compositionControlsF');
    const controlsG = document.getElementById('compositionControlsG');
    const resultTable = document.getElementById('compositionResultTable');
    const randomButton = document.getElementById('compositionRandomBtn');
    const resetButton = document.getElementById('compositionResetBtn');
    const propertyF = document.getElementById('compositionPropertyF');
    const propertyG = document.getElementById('compositionPropertyG');
    const propertyH = document.getElementById('compositionPropertyH');
    const diagram = document.getElementById('compositionDiagram');

    if (!controlsF || !controlsG || !resultTable || !randomButton || !resetButton || !propertyF || !propertyG || !propertyH || !diagram) {
        return;
    }

    const setA = ['1', '2', '3', '4'];
    const setB = ['a', 'b', 'c'];
    const setC = ['u', 'v', 'w'];

    let mappingF = {
        1: 'a',
        2: 'b',
        3: 'b',
        4: 'c'
    };

    let mappingG = {
        a: 'u',
        b: 'v',
        c: 'w'
    };

    function composeMapping() {
        const result = {};
        setA.forEach(source => {
            result[source] = mappingG[mappingF[source]];
        });
        return result;
    }

    function buildControls(container, sources, targets, mapping, labelName) {
        container.innerHTML = '';

        sources.forEach(source => {
            const row = document.createElement('div');
            row.className = 'mapping-control-row';

            const label = document.createElement('label');
            label.textContent = `${labelName}(${source}) =`;

            const select = document.createElement('select');
            targets.forEach(target => {
                const option = document.createElement('option');
                option.value = target;
                option.textContent = target;
                if (mapping[source] === target) {
                    option.selected = true;
                }
                select.appendChild(option);
            });

            select.addEventListener('change', () => {
                mapping[source] = select.value;
                render();
            });

            row.appendChild(label);
            row.appendChild(select);
            container.appendChild(row);
        });
    }

    function randomize() {
        setA.forEach(source => {
            mappingF[source] = setB[Math.floor(Math.random() * setB.length)];
        });
        setB.forEach(source => {
            mappingG[source] = setC[Math.floor(Math.random() * setC.length)];
        });
    }

    function reset() {
        mappingF = {
            1: 'a',
            2: 'b',
            3: 'b',
            4: 'c'
        };
        mappingG = {
            a: 'u',
            b: 'v',
            c: 'w'
        };
    }

    function propertyText(name, props) {
        return `${name}: ${mappingCategoryLabel(mappingCategoryKey(props))}`;
    }

    function render() {
        buildControls(controlsF, setA, setB, mappingF, 'f');
        buildControls(controlsG, setB, setC, mappingG, 'g');

        const mappingH = composeMapping();
        const propsF = analyzeMapping(setA, setB, mappingF);
        const propsG = analyzeMapping(setB, setC, mappingG);
        const propsH = analyzeMapping(setA, setC, mappingH);

        resultTable.innerHTML = setA
            .map(source => `h(${source}) = g(f(${source})) = g(${mappingF[source]}) = ${mappingH[source]}`)
            .join('<br>');

        propertyF.textContent = propertyText('f', propsF);
        propertyG.textContent = propertyText('g', propsG);
        propertyH.textContent = propertyText('h = g∘f', propsH);

        renderThreeSetCompositionDiagram(diagram, setA, setB, setC, mappingF, mappingG);
    }

    randomButton.addEventListener('click', () => {
        randomize();
        render();
    });

    resetButton.addEventListener('click', () => {
        reset();
        render();
    });

    render();
}

function initCompositionNumericQuiz() {
    const questionEl = document.getElementById('compositionNumericQuestion');
    const progressEl = document.getElementById('compositionNumericProgress');
    const inputEl = document.getElementById('compositionNumericInput');
    const checkButton = document.getElementById('compositionNumericCheckBtn');
    const nextButton = document.getElementById('compositionNumericNextBtn');
    const feedbackEl = document.getElementById('compositionNumericFeedback');

    if (!questionEl || !progressEl || !inputEl || !checkButton || !nextButton || !feedbackEl) {
        return;
    }

    const tasks = shuffleArray([
        {
            statement: 'Necht \(f(x)=2x-1\), \(g(x)=x^2\). Urcete \((g\circ f)(3)\).',
            answer: 25,
            explanation: 'f(3)=5 a g(5)=25.'
        },
        {
            statement: 'Necht \(f(x)=x+4\), \(g(x)=3x\). Urcete \((g\circ f)(2)\).',
            answer: 18,
            explanation: 'f(2)=6 a g(6)=18.'
        },
        {
            statement: 'Necht \(f(x)=x^2\), \(g(x)=x+1\). Urcete \((g\circ f)(-3)\).',
            answer: 10,
            explanation: 'f(-3)=9 a g(9)=10.'
        },
        {
            statement: 'Necht \(f(x)=2x\), \(g(x)=x-5\). Urcete \((f\circ g)(7)\).',
            answer: 4,
            explanation: 'g(7)=2 a f(2)=4.'
        },
        {
            statement: 'Necht \(f(x)=x+1\), \(g(x)=x^3\). Urcete \((g\circ f)(1)\).',
            answer: 8,
            explanation: 'f(1)=2 a g(2)=8.'
        },
        {
            statement: 'Necht \(f(x)=x^2+1\), \(g(x)=2x\). Urcete \((g\circ f)(2)\).',
            answer: 10,
            explanation: 'f(2)=5 a g(5)=10.'
        }
    ]);

    let currentIndex = 0;

    function renderTask() {
        const task = tasks[currentIndex];
        questionEl.innerHTML = task.statement;
        progressEl.textContent = `Uloha ${currentIndex + 1} z ${tasks.length}`;
        inputEl.value = '';
        clearFeedback(feedbackEl);
        typeset(questionEl.closest('.demo-panel'));
    }

    function evaluate() {
        const parsed = parseNumberInput(inputEl.value);
        if (!parsed.valid) {
            setFeedback(feedbackEl, 'info', parsed.message);
            return;
        }

        const task = tasks[currentIndex];
        const isCorrect = Math.abs(parsed.value - task.answer) < 1e-9;

        if (isCorrect) {
            setFeedback(feedbackEl, 'correct', `Spravne. ${task.explanation}`);
        } else {
            setFeedback(feedbackEl, 'incorrect', `Nespravne. Spravny vysledek je ${task.answer}. ${task.explanation}`);
        }
    }

    checkButton.addEventListener('click', evaluate);
    inputEl.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            evaluate();
        }
    });

    nextButton.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % tasks.length;
        renderTask();
    });

    renderTask();
}

function initCompositionRuleQuiz() {
    const questionEl = document.getElementById('compositionRuleQuestion');
    const progressEl = document.getElementById('compositionRuleProgress');
    const feedbackEl = document.getElementById('compositionRuleFeedback');
    const options = Array.from(document.querySelectorAll('#compositionRuleOptions .binary-option'));
    const checkButton = document.getElementById('compositionRuleCheckBtn');
    const nextButton = document.getElementById('compositionRuleNextBtn');

    if (!questionEl || !progressEl || !feedbackEl || options.length === 0 || !checkButton || !nextButton) {
        return;
    }

    const tasks = shuffleArray([
        {
            statement: 'Skladani zobrazeni je obecne komutativni: \(g\circ f=f\circ g\).',
            answer: 'false',
            explanation: 'Poradi je obecne zasadni, komutativita neplati.'
        },
        {
            statement: 'Jsou-li \(f\) a \(g\) injektivni, pak \(g\circ f\) je injektivni.',
            answer: 'true',
            explanation: 'Kompozice injekci je opet injekce.'
        },
        {
            statement: 'Je-li \(g\circ f\) surjektivni, pak \(g\) je surjektivni.',
            answer: 'true',
            explanation: 'Kazdy prvek kodomeny musi byt dosazen uz pres mapovani g.'
        },
        {
            statement: 'Je-li \(g\circ f\) injektivni, pak \(f\) je injektivni.',
            answer: 'true',
            explanation: 'Kdyby f nebyla injektivni, kompozice by take nemohla byt injektivni.'
        },
        {
            statement: 'Vzdy plati \(f\circ \mathrm{id}_A=f\).',
            answer: 'true',
            explanation: 'Jednotkove zobrazeni nechava vstup beze zmeny.'
        },
        {
            statement: 'Je-li \(g\circ f\) surjektivni, pak \(f\) musi byt surjektivni.',
            answer: 'false',
            explanation: 'Nutna je surjektivita g, surjektivita f obecne z toho neplyne.'
        }
    ]);

    let currentIndex = 0;
    let selected = '';

    function clearOptionState() {
        options.forEach(option => option.classList.remove('selected', 'correct', 'incorrect'));
    }

    function renderTask() {
        selected = '';
        clearOptionState();
        clearFeedback(feedbackEl);

        const task = tasks[currentIndex];
        questionEl.innerHTML = task.statement;
        progressEl.textContent = `Uloha ${currentIndex + 1} z ${tasks.length}`;
        typeset(questionEl.closest('.demo-panel'));
    }

    options.forEach(option => {
        option.addEventListener('click', () => {
            selected = option.dataset.value;
            options.forEach(item => item.classList.remove('selected'));
            option.classList.add('selected');
        });
    });

    checkButton.addEventListener('click', () => {
        if (!selected) {
            setFeedback(feedbackEl, 'info', 'Vyberte Pravda nebo Nepravda.');
            return;
        }

        const task = tasks[currentIndex];
        const isCorrect = selected === task.answer;

        options.forEach(option => {
            option.classList.remove('correct', 'incorrect');
            if (option.dataset.value === task.answer) {
                option.classList.add('correct');
            } else if (option.dataset.value === selected && !isCorrect) {
                option.classList.add('incorrect');
            }
        });

        if (isCorrect) {
            setFeedback(feedbackEl, 'correct', `Spravne. ${task.explanation}`);
        } else {
            setFeedback(
                feedbackEl,
                'incorrect',
                `Nespravne. Spravna odpoved je "${task.answer === 'true' ? 'Pravda' : 'Nepravda'}". ${task.explanation}`
            );
        }
    });

    nextButton.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % tasks.length;
        renderTask();
    });

    renderTask();
}

function initInverseBuilder() {
    const forwardDisplay = document.getElementById('inverseForwardDisplay');
    const controls = document.getElementById('inverseControls');
    const checkButton = document.getElementById('inverseCheckBtn');
    const newButton = document.getElementById('inverseNewBtn');
    const resultDisplay = document.getElementById('inverseResultDisplay');
    const feedback = document.getElementById('inverseBuilderFeedback');
    const diagram = document.getElementById('inverseDiagram');

    if (!forwardDisplay || !controls || !checkButton || !newButton || !resultDisplay || !feedback || !diagram) {
        return;
    }

    const setA = ['p', 'q', 'r', 's'];
    const setB = ['1', '2', '3', '4'];

    let forwardMapping = {};
    let inverseGuess = {};

    function createBijection() {
        const shuffled = shuffleArray(setB);
        forwardMapping = {};
        setA.forEach((source, index) => {
            forwardMapping[source] = shuffled[index];
        });

        inverseGuess = {};
        setB.forEach(target => {
            inverseGuess[target] = '';
        });
    }

    function expectedInverse() {
        const inverse = {};
        setA.forEach(source => {
            inverse[forwardMapping[source]] = source;
        });
        return inverse;
    }

    function buildControls() {
        controls.innerHTML = '';

        setB.forEach(target => {
            const row = document.createElement('div');
            row.className = 'mapping-control-row';

            const label = document.createElement('label');
            label.textContent = `f⁻¹(${target}) =`;

            const select = document.createElement('select');
            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = '-- vyberte --';
            select.appendChild(placeholder);

            setA.forEach(source => {
                const option = document.createElement('option');
                option.value = source;
                option.textContent = source;
                if (inverseGuess[target] === source) {
                    option.selected = true;
                }
                select.appendChild(option);
            });

            select.addEventListener('change', () => {
                inverseGuess[target] = select.value;
                setInlineFeedback(feedback, 'info', 'Prubezne doplnujte vsechny hodnoty a pak stisknete Zkontrolovat.');
                renderDiagram();
            });

            row.appendChild(label);
            row.appendChild(select);
            controls.appendChild(row);
        });
    }

    function renderDiagram(showGuess = false) {
        renderTwoSetMappingDiagram(
            diagram,
            'A',
            'B',
            setA,
            setB,
            forwardMapping,
            showGuess ? { reverseMapping: inverseGuess, reverseArrowColor: '#f59e0b' } : {}
        );
    }

    function render() {
        forwardDisplay.textContent = mappingToText(forwardMapping, setA, 'f');
        resultDisplay.textContent = 'Po kontrole se zde zobrazi inverzni mapovani.';
        buildControls();
        renderDiagram();
        setInlineFeedback(feedback, 'info', 'Doplnte inverzni mapovani f⁻¹.' );
    }

    checkButton.addEventListener('click', () => {
        const expected = expectedInverse();

        const missing = setB.filter(target => !inverseGuess[target]);
        if (missing.length > 0) {
            setInlineFeedback(feedback, 'info', `Doplnte jeste hodnoty pro: ${missing.join(', ')}.`);
            return;
        }

        const wrong = setB.filter(target => inverseGuess[target] !== expected[target]);
        if (wrong.length === 0) {
            setInlineFeedback(feedback, 'correct', 'Spravne. Inverzni zobrazeni je sestaveno bez chyby.');
            resultDisplay.textContent = `f⁻¹: ${mappingToText(expected, setB, 'f⁻¹')}`;
        } else {
            const sample = wrong[0];
            setInlineFeedback(
                feedback,
                'incorrect',
                `Nespravne. Napr. f⁻¹(${sample}) ma byt ${expected[sample]}. Cele spravne mapovani je zobrazeno vyse.`
            );
            resultDisplay.textContent = `Spravne mapovani: ${mappingToText(expected, setB, 'f⁻¹')}`;
        }

        renderDiagram(true);
    });

    newButton.addEventListener('click', () => {
        createBijection();
        render();
    });

    createBijection();
    render();
}

function initInverseNumericQuiz() {
    const questionEl = document.getElementById('inverseNumericQuestion');
    const progressEl = document.getElementById('inverseNumericProgress');
    const inputEl = document.getElementById('inverseNumericInput');
    const checkButton = document.getElementById('inverseNumericCheckBtn');
    const nextButton = document.getElementById('inverseNumericNextBtn');
    const feedbackEl = document.getElementById('inverseNumericFeedback');

    if (!questionEl || !progressEl || !inputEl || !checkButton || !nextButton || !feedbackEl) {
        return;
    }

    const tasks = shuffleArray([
        {
            statement: 'Necht \(f(x)=3x-5\). Urcete \(f^{-1}(16)\).',
            answer: 7,
            explanation: '3x-5=16, tedy x=7.'
        },
        {
            statement: 'Necht \(f(x)=\frac{x+4}{2}\). Urcete \(f^{-1}(7)\).',
            answer: 10,
            explanation: '(x+4)/2 = 7, tedy x = 10.'
        },
        {
            statement: 'Necht \(f(x)=x^3\). Urcete \(f^{-1}(27)\).',
            answer: 3,
            explanation: 'x^3 = 27, tedy x = 3.'
        },
        {
            statement: 'Necht \(f(x)=2x+9\). Urcete \(f^{-1}(1)\).',
            answer: -4,
            explanation: '2x+9=1, tedy x=-4.'
        },
        {
            statement: 'Necht \(f(x)=x^2\) na intervalu \([0,\infty)\). Urcete \(f^{-1}(49)\).',
            answer: 7,
            explanation: 'Na [0,∞) bereme nezapornou odmocninu, tedy 7.'
        },
        {
            statement: 'Necht \(f(x)=5-2x\). Urcete \(f^{-1}(1)\).',
            answer: 2,
            explanation: '5-2x=1, tedy x=2.'
        }
    ]);

    let currentIndex = 0;

    function renderTask() {
        const task = tasks[currentIndex];
        questionEl.innerHTML = task.statement;
        progressEl.textContent = `Uloha ${currentIndex + 1} z ${tasks.length}`;
        inputEl.value = '';
        clearFeedback(feedbackEl);
        typeset(questionEl.closest('.demo-panel'));
    }

    function evaluate() {
        const parsed = parseNumberInput(inputEl.value);
        if (!parsed.valid) {
            setFeedback(feedbackEl, 'info', parsed.message);
            return;
        }

        const task = tasks[currentIndex];
        const isCorrect = Math.abs(parsed.value - task.answer) < 1e-9;

        if (isCorrect) {
            setFeedback(feedbackEl, 'correct', `Spravne. ${task.explanation}`);
        } else {
            setFeedback(feedbackEl, 'incorrect', `Nespravne. Spravny vysledek je ${task.answer}. ${task.explanation}`);
        }
    }

    checkButton.addEventListener('click', evaluate);
    inputEl.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            evaluate();
        }
    });

    nextButton.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % tasks.length;
        renderTask();
    });

    renderTask();
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

    if (type === 'choice') {
        evaluateChoiceExercise(card);
        return;
    }

    if (type === 'number') {
        evaluateNumberExercise(card);
    }
}

function evaluateChoiceExercise(card) {
    const feedback = card.querySelector('.exercise-feedback');
    const answer = card.dataset.answer;
    const groupName = card.dataset.name;
    const explanation = card.dataset.explanation || '';

    const selectedInput = card.querySelector(`input[name="${groupName}"]:checked`);
    const options = Array.from(card.querySelectorAll('.option'));

    options.forEach(option => option.classList.remove('correct', 'incorrect'));

    if (!selectedInput) {
        setExerciseState(card, false, 'Nevyplneno');
        setCardFeedback(feedback, false, 'Vyberte prosim jednu moznost.');
        return;
    }

    const correctInput = card.querySelector(`input[name="${groupName}"][value="${answer}"]`);
    const selectedOption = selectedInput.closest('.option');
    const correctOption = correctInput ? correctInput.closest('.option') : null;

    const isCorrect = selectedInput.value === answer;

    if (selectedOption) {
        selectedOption.classList.add(isCorrect ? 'correct' : 'incorrect');
    }

    if (!isCorrect && correctOption) {
        correctOption.classList.add('correct');
    }

    const correctText = correctOption
        ? (correctOption.querySelector('.option-text')?.textContent || 'spravna odpoved')
        : 'spravna odpoved';

    if (isCorrect) {
        setExerciseState(card, true, 'Spravne');
        setCardFeedback(feedback, true, `Spravne. ${explanation}`);
    } else {
        setExerciseState(card, false, 'Nespravne');
        setCardFeedback(feedback, false, `Nespravne. Spravna odpoved je: ${correctText}. ${explanation}`);
    }
}

function evaluateNumberExercise(card) {
    const feedback = card.querySelector('.exercise-feedback');
    const input = card.querySelector('.exercise-input');
    const explanation = card.dataset.explanation || '';
    const expectedValue = Number(card.dataset.answer);

    if (!input) {
        return;
    }

    const parsed = parseNumberInput(input.value);
    if (!parsed.valid) {
        setExerciseState(card, false, 'Nespravne');
        setCardFeedback(feedback, false, parsed.message);
        return;
    }

    const isCorrect = Math.abs(parsed.value - expectedValue) < 1e-9;

    if (isCorrect) {
        setExerciseState(card, true, 'Spravne');
        setCardFeedback(feedback, true, `Spravne. ${explanation}`);
    } else {
        setExerciseState(card, false, 'Nespravne');
        setCardFeedback(feedback, false, `Nespravne. Spravny vysledek je ${expectedValue}. ${explanation}`);
    }
}

function setExerciseState(card, isCorrect, statusText) {
    const status = card.querySelector('.exercise-status');
    card.dataset.solved = isCorrect ? 'true' : 'false';
    card.classList.toggle('solved', isCorrect);

    if (!status) {
        return;
    }

    status.textContent = statusText;
    status.classList.remove('correct', 'incorrect');

    if (statusText === 'Spravne') {
        status.classList.add('correct');
    } else if (statusText === 'Nespravne') {
        status.classList.add('incorrect');
    }
}

function setCardFeedback(element, isCorrect, text) {
    if (!element) {
        return;
    }

    element.textContent = text;
    element.classList.remove('correct', 'incorrect', 'show');
    element.classList.add(isCorrect ? 'correct' : 'incorrect', 'show');
}

function updateExerciseCompletion(cards) {
    const allSolved = cards.every(card => card.dataset.solved === 'true');
    const completePanel = document.getElementById('lessonComplete');

    if (!completePanel) {
        return;
    }

    completePanel.style.display = allSolved ? 'block' : 'none';
}
