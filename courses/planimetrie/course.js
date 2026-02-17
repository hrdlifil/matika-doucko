// Planimetrie - Course Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
    initChapterAccordions();
    initNavbarScroll();
    initSmoothScroll();
});

/**
 * Initialize chapter accordion functionality.
 */
function initChapterAccordions() {
    const chapterCards = document.querySelectorAll('.chapter-card');

    chapterCards.forEach(card => {
        const header = card.querySelector('.chapter-header');

        header.addEventListener('click', () => {
            chapterCards.forEach(otherCard => {
                if (otherCard !== card && otherCard.classList.contains('expanded')) {
                    otherCard.classList.remove('expanded');
                }
            });

            card.classList.toggle('expanded');
        });
    });

    if (chapterCards.length > 0) {
        chapterCards[0].classList.add('expanded');
    }
}

/**
 * Navbar background opacity on scroll.
 */
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 10, 15, 0.95)';
        } else {
            navbar.style.background = 'rgba(10, 10, 15, 0.8)';
        }
    });
}

/**
 * Smooth scroll for anchor links.
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}
