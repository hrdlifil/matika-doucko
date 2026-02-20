# Math Accuracy Audit Report

Date: 2026-02-20
Workspace: `c:/Users/filip/Desktop/Hana`

## Scope
- Reviewed all lesson pages: 69 files under `courses/**/lessons/**/index.html`.
- Reviewed all keyed practice content extracted from lessons (both standard and custom quiz patterns).

## Automated validation passes
1. Standard keyed-content extraction (`data-correct`, `data-answer`, option sets)
- Records audited: 450
- Files covered: 58
- Issues after final pass: 0
- Artifacts:
  - `_audit/full_exercise_audit.json`
  - `_audit/full_exercise_issues.json`

2. Custom keyed-content extraction (`onclick="checkExercise(...)"` patterns)
- Records audited: 30
- Files covered: 6
- Issues after final pass: 0
- Artifacts:
  - `_audit/onclick_exercises_audit.json`
  - `_audit/onclick_exercises_issues.json`

3. Symbolic ambiguity checks
- Checked for mathematically equivalent duplicate options (e.g., `15/5` vs `3`).
- Checked missing key mappings and duplicate option texts.
- Final result: no unresolved ambiguities in keyed exercises.

## Manual content review
- Manually reviewed formula statements and worked examples in remaining/custom lessons not fully represented by the first extractor, including:
  - `courses/goniometrie-trigonometrie/lessons/gonio-rovnice/index.html`
  - `courses/goniometrie-trigonometrie/lessons/sinus-kosinus/index.html`
  - `courses/goniometrie-trigonometrie/lessons/tangens-kotangens/index.html`
  - `courses/goniometrie-trigonometrie/lessons/trigonometrie/index.html`
  - `courses/goniometrie-trigonometrie/lessons/trojuhelniky/index.html`
  - `courses/goniometrie-trigonometrie/lessons/vzorce-goniometrie/index.html`
  - `courses/mnoziny/lessons/mnozinove-vztahy/index.html`
  - `courses/mnoziny/lessons/uvod-a-graficke-zobrazeni/index.html`
  - `courses/rovinne-utvary-a-telesa/lessons/mnohouhelnik-a-kruh/index.html`

## Issues found and fixed
### 1) Ambiguous multiple-choice options (duplicate mathematically correct choices)
- File: `courses/analyticka-geometrie/lessons/opakovani/index.html`
  - Exercise 3: replaced distractors that were equivalent to the keyed correct value.
  - Exercise 12: replaced one distractor equivalent to correct value.

- File: `courses/analyticka-geometrie/lessons/prostor/index.html`
  - Exercise 5: replaced one distractor equivalent to correct value.

## Mathematical reference sources used for cross-checking
- Trig identities (sum/difference):
  - https://openstax.org/books/algebra-and-trigonometry-2e/pages/9-2-sum-and-difference-identities
- Double/half/reduction formulas:
  - https://openstax.org/books/precalculus-2e/pages/7-3-double-angle-half-angle-and-reduction-formulas
- Sum-to-product / product-to-sum formulas:
  - https://openstax.org/books/precalculus-2e/pages/7-4-sum-to-product-and-product-to-sum-formulas
- Law of sines:
  - https://openstax.org/books/precalculus-2e/pages/8-1-non-right-triangles-law-of-sines
- Law of cosines:
  - https://openstax.org/books/precalculus-2e/pages/8-2-non-right-triangles-law-of-cosines
- Vectors and dot product:
  - https://openstax.org/books/precalculus-2e/pages/8-8-vectors
- Conic-section definitions and terminology:
  - https://openstax.org/books/precalculus-2e/pages/10-introduction-to-analytic-geometry
  - https://openstax.org/books/precalculus-2e/pages/10-2-the-hyperbola
  - https://openstax.org/books/precalculus-2e/pages/10-key-terms
- Counting principles and binomial theorem:
  - https://openstax.org/books/college-algebra-2e/pages/9-5-counting-principles
  - https://openstax.org/books/algebra-and-trigonometry-2e/pages/13-6-binomial-theorem
- Probability rules:
  - https://openstax.org/books/introductory-statistics-2e/pages/3-3-two-basic-rules-of-probability
- Set operations and subset concepts:
  - https://openstax.org/books/contemporary-mathematics/pages/1-4-set-operations-with-two-sets
  - https://openstax.org/books/contemporary-mathematics/pages/1-key-terms
- Polygon/circle/sector/annulus/circular-segment formulas:
  - https://mathworld.wolfram.com/RegularPolygon.html
  - https://mathworld.wolfram.com/Circle.html
  - https://mathworld.wolfram.com/Sector.html
  - https://mathworld.wolfram.com/Annulus.html
  - https://mathworld.wolfram.com/CircularSegment.html
- Complex numbers reference:
  - https://mathworld.wolfram.com/ComplexNumber.html

## Final status
- No remaining keyed-answer inconsistencies found in final automated + manual passes.
- Identified math-content issues were corrected in place in analytic geometry review lessons.
