function showPage(pageId, evt) {
    const e = evt || window.event;

    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));

    // Show selected page
    const target = document.getElementById(pageId);
    if (target) target.classList.add('active');

    // Update nav active state
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => link.classList.remove('active'));
    const clicked = e && (e.target || e.srcElement);
    if (clicked && clicked.classList) clicked.classList.add('active');

    // Scroll to top
    window.scrollTo(0, 0);
}

// Helper to run initialization code whether DOMContentLoaded already fired or not
function runOnReady(fn) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        fn();
    }
}

// Mobile menu toggle
runOnReady(function () {
    const mobile = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    if (mobile && navLinks) {
        mobile.addEventListener('click', function () {
            navLinks.classList.toggle('open');
        });
    }
});

/* Avatar controls removed per user request. */
