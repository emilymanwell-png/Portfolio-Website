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
    // Setup embed modal for VIP project
    const vipBtns = document.querySelectorAll('.view-vip');
    const modal = document.getElementById('embed-modal');
    const iframe = document.getElementById('embed-iframe');
    const closeBtn = document.getElementById('embed-close');
    const backdrop = document.getElementById('embed-backdrop');

    function openEmbed(url) {
        if (!modal || !iframe) return;
        iframe.src = url || '';
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeEmbed() {
        if (!modal || !iframe) return;
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        iframe.src = '';
        document.body.style.overflow = '';
    }

    if (vipBtns && vipBtns.length) {
        vipBtns.forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const url = btn.getAttribute('data-embed');
                console.log('Opening embed:', url);
                if (url) openEmbed(url);
            });
        });
    }

    // Delegated click handler as a fallback in case listeners above aren't attached
    document.addEventListener('click', function (e) {
        const btn = e.target.closest && e.target.closest('.view-vip');
        if (!btn) return;
        e.preventDefault();
        const url = btn.getAttribute('data-embed');
        console.log('Delegated open embed:', url);
        if (url) openEmbed(url);
    });

    if (closeBtn) closeBtn.addEventListener('click', closeEmbed);
    if (backdrop) backdrop.addEventListener('click', closeEmbed);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal && modal.classList.contains('open')) closeEmbed(); });
});

/* Avatar controls removed per user request. */
