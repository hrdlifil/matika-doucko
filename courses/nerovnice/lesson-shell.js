document.addEventListener('DOMContentLoaded', () => {
    initSidebarNavigation();
    initNavbarScroll();
});

/**
 * Handles smooth scrolling and active link highlighting in lesson sidebar.
 */
function initSidebarNavigation() {
    const links = Array.from(document.querySelectorAll('.sidebar-link'));
    if (links.length === 0) {
        return;
    }

    const sectionByLink = new Map();
    links.forEach(link => {
        const hash = link.getAttribute('href');
        const section = hash ? document.querySelector(hash) : null;
        if (section) {
            sectionByLink.set(link, section);
        }
    });

    links.forEach(link => {
        link.addEventListener('click', event => {
            const hash = link.getAttribute('href');
            const section = hash ? document.querySelector(hash) : null;
            if (!section) {
                return;
            }

            event.preventDefault();
            setActiveLink(link);
            section.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            window.history.replaceState(null, '', hash);
        });
    });

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            }

            const match = links.find(link => {
                const hash = link.getAttribute('href');
                return hash === `#${entry.target.id}`;
            });

            if (match) {
                setActiveLink(match);
            }
        });
    }, {
        rootMargin: '-30% 0px -55% 0px',
        threshold: 0.1
    });

    sectionByLink.forEach(section => observer.observe(section));

    const hashLink = links.find(link => link.getAttribute('href') === window.location.hash);
    if (hashLink) {
        setActiveLink(hashLink);
    } else {
        setActiveLink(links[0]);
    }
}

function setActiveLink(activeLink) {
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.toggle('active', link === activeLink);
    });
}

/**
 * Navbar background opacity on scroll.
 */
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
