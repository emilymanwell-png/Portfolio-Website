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

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function () {
    const mobile = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    if (mobile && navLinks) {
        mobile.addEventListener('click', function () {
            navLinks.classList.toggle('open');
        });
    }
});
