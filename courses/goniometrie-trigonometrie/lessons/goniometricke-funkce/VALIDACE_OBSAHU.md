# Kapitola 1: Goniometrické funkce a stupňová a oblouková míra
# === OBSAH PRO KŘÍŽOVOU VALIDACI ===
# Tento soubor obsahuje veškerý matematický obsah lekce ke kontrole správnosti.

## 1. Úhly, trojúhelníky a goniometrické funkce

### Pravoúhlý trojúhelník – pojmy
V pravoúhlém trojúhelníku s pravým úhlem u vrcholu C:
- **Přepona** (c) – strana naproti pravému úhlu, nejdelší strana
- **Protilehlá odvěsna** – strana naproti danému úhlu α
- **Přilehlá odvěsna** – strana přiléhající k danému úhlu α (a není přepona)

### Definice goniometrických funkcí v pravoúhlém trojúhelníku
Pro ostrý úhel α v pravoúhlém trojúhelníku:
- sin α = protilehlá / přepona
- cos α = přilehlá / přepona
- tan α = protilehlá / přilehlá
- cot α = přilehlá / protilehlá

### Využití goniometrických funkcí
- Navigace (výpočet vzdáleností)
- Fyzika (rozklad sil, vlnění, kyvadlo)
- Inženýrství (výpočet výšky budovy ze vzdálenosti a úhlu pohledu)
- Signály (zvuk, elektřina)
- Počítačová grafika (rotace, projekce)

---

## 2. Goniometrické funkce na jednotkové kružnici

### Definice
Jednotková kružnice má střed v počátku souřadnic a poloměr r = 1.
Úhel α měříme od kladné poloosy x proti směru hodinových ručiček.

Bod P na kružnici odpovídající úhlu α má souřadnice:
**P = (cos α, sin α)**

- cos α = x-ová souřadnice bodu P
- sin α = y-ová souřadnice bodu P
- tan α = sin α / cos α (pro cos α ≠ 0)
- cot α = cos α / sin α (pro sin α ≠ 0)

### Znaménka ve kvadrantech
|      | I (0°-90°) | II (90°-180°) | III (180°-270°) | IV (270°-360°) |
|------|:---:|:----:|:-----:|:----:|
| sin  |  +  |  +   |   −   |  −   |
| cos  |  +  |  −   |   −   |  +   |
| tan  |  +  |  −   |   +   |  −   |
| cot  |  +  |  −   |   +   |  −   |

---

## 3. Odvození základních hodnot goniometrických funkcí

### Trojúhelník 45°-45°-90° (rovnoramenný pravoúhlý)
- Dvě odvěsny shodné délky = 1
- Přepona: c = √(1² + 1²) = √2

Výsledky:
- sin 45° = 1/√2 = √2/2 ≈ 0.7071
- cos 45° = 1/√2 = √2/2 ≈ 0.7071
- tan 45° = 1/1 = 1
- cot 45° = 1/1 = 1

### Trojúhelník 30°-60°-90° (polovina rovnostranného)
Rovnostranný trojúhelník se stranou 2, rozpůlíme výškou:
- Přepona = 2
- Kratší odvěsna = 1 (polovina základny)
- Delší odvěsna = √(2² − 1²) = √(4 − 1) = √3

Pro úhel 30°:
- sin 30° = 1/2 = 0.5
- cos 30° = √3/2 ≈ 0.8660
- tan 30° = (1/2)/(√3/2) = 1/√3 = √3/3 ≈ 0.5774
- cot 30° = (√3/2)/(1/2) = √3 ≈ 1.7321

Pro úhel 60°:
- sin 60° = √3/2 ≈ 0.8660
- cos 60° = 1/2 = 0.5
- tan 60° = (√3/2)/(1/2) = √3 ≈ 1.7321
- cot 60° = (1/2)/(√3/2) = 1/√3 = √3/3 ≈ 0.5774

### Hodnoty pro 0° a 90° (z jednotkové kružnice)
- Úhel 0° → bod (1, 0): sin 0° = 0, cos 0° = 1
- Úhel 90° → bod (0, 1): sin 90° = 1, cos 90° = 0

- tan 0° = 0/1 = 0
- cot 0° = 1/0 → **není definován**
- tan 90° = 1/0 → **není definován**
- cot 90° = 0/1 = 0

### Souhrnná tabulka hodnot

|  α     |  0°   |  30°   |  45°   |  60°   |  90°  |
|--------|:-----:|:------:|:------:|:------:|:-----:|
| sin α  |   0   |  1/2   | √2/2   | √3/2   |   1   |
| cos α  |   1   | √3/2   | √2/2   |  1/2   |   0   |
| tan α  |   0   | √3/3   |   1    |  √3    |  —    |
| cot α  |  —    |  √3    |   1    | √3/3   |   0   |

Tip: sin α = cos(90° − α) – tyto funkce jsou kofunkce.

---

## 4. Základní goniometrické vzorce (identity)

### Základní goniometrická identita (Pythagorova)
**sin²α + cos²α = 1**

Odvození: Na jednotkové kružnici bod P = (cos α, sin α) leží na x² + y² = 1,
tedy cos²α + sin²α = 1. Platí pro KAŽDÝ úhel α.

### Podílové identity
- tan α = sin α / cos α (pro cos α ≠ 0)
- cot α = cos α / sin α (pro sin α ≠ 0)

### Součinová identita
**tan α · cot α = 1** (pro sin α ≠ 0 a cos α ≠ 0)

Důkaz: tan α · cot α = (sin α / cos α) · (cos α / sin α) = 1

### Odvozené Pythagorovy identity
Vydělením sin²α + cos²α = 1:

1) Dělíme cos²α:
   sin²α/cos²α + cos²α/cos²α = 1/cos²α
   **tan²α + 1 = 1/cos²α**

2) Dělíme sin²α:
   sin²α/sin²α + cos²α/sin²α = 1/sin²α
   **1 + cot²α = 1/sin²α**

---

## 5. Stupňová a oblouková míra

### Stupňová míra
- Plný úhel = 360°
- 1° = 60' (minut), 1' = 60'' (vteřin)

### Oblouková míra (radiány)
1 radián = úhel, který na kružnici s poloměrem r vytyčí oblouk o délce r.
Na jednotkové kružnici (r = 1): 1 radián = oblouk o délce 1.

Obvod jednotkové kružnice = 2π, proto:
**360° = 2π rad**
**180° = π rad**

### Převodní vztahy
- Stupně → radiány: rad = (stupně · π) / 180
- Radiány → stupně: stupně = (rad · 180) / π

### Tabulka převodů
|  Stupně  |  Radiány  |
|:--------:|:---------:|
|    0°    |     0     |
|   30°    |   π/6     |
|   45°    |   π/4     |
|   60°    |   π/3     |
|   90°    |   π/2     |
|  120°    |  2π/3     |
|  135°    |  3π/4     |
|  150°    |  5π/6     |
|  180°    |    π      |
|  210°    |  7π/6     |
|  225°    |  5π/4     |
|  240°    |  4π/3     |
|  270°    |  3π/2     |
|  300°    |  5π/3     |
|  315°    |  7π/4     |
|  330°    | 11π/6     |
|  360°    |   2π      |

---

## CVIČENÍ (s odpověďmi)

### Úloha 1
V pravoúhlém trojúhelníku je přepona c = 10 a protilehlá odvěsna a = 6.
Jaká je hodnota sin α?
a) 0.8  b) 0.6  c) 0.75  d) 1.667
**Správná odpověď: b) 0.6**
Řešení: sin α = protilehlá / přepona = 6/10 = 0.6

### Úloha 2
Jaká je hodnota cos 60°?
a) √3/2  b) √2/2  c) 1/2  d) 1
**Správná odpověď: c) 1/2**
Řešení: Z trojúhelníku 30°-60°-90°: přilehlá k 60° = 1, přepona = 2, cos 60° = 1/2.

### Úloha 3
Převeďte 120° na radiány:
a) π/3  b) 2π/3  c) 3π/4  d) 4π/3
**Správná odpověď: b) 2π/3**
Řešení: 120° × π/180 = 120π/180 = 2π/3

### Úloha 4
Pokud sin α = 3/5, jaká je hodnota cos α? (α je ostrý úhel)
a) 4/5  b) 2/5  c) 5/3  d) 3/4
**Správná odpověď: a) 4/5**
Řešení: sin²α + cos²α = 1 → (3/5)² + cos²α = 1 → 9/25 + cos²α = 1 → cos²α = 16/25 → cos α = 4/5

### Úloha 5
Jaká je hodnota tan 30°?
a) √3  b) 1  c) √3/3  d) 1/2
**Správná odpověď: c) √3/3**
Řešení: tan 30° = sin 30° / cos 30° = (1/2) / (√3/2) = 1/√3 = √3/3

### Úloha 6
Ve kterém kvadrantu je sin α > 0 a cos α < 0?
a) I. kvadrant  b) II. kvadrant  c) III. kvadrant  d) IV. kvadrant
**Správná odpověď: b) II. kvadrant**
Řešení: V II. kvadrantu (90°–180°) je y-souřadnice kladná (sin > 0) a x-souřadnice záporná (cos < 0).

### Úloha 7
Kolik radiánů je 270°?
a) π  b) 3π/4  c) 3π/2  d) 2π
**Správná odpověď: c) 3π/2**
Řešení: 270° × π/180 = 270π/180 = 3π/2

### Úloha 8
Zjednodušte výraz: sin²α + cos²α + tan α · cot α
a) 1  b) 2  c) sin²α + 1  d) 0
**Správná odpověď: b) 2**
Řešení: sin²α + cos²α = 1 (Pythagorova identita) + tan α · cot α = 1 (součinová identita) → celkem 1 + 1 = 2
