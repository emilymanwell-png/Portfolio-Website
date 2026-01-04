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

/* Expandable card modal functionality */
function openExpandableModal(cardElement) {
    // Prevent event bubbling
    event.stopPropagation();
    
    // Create modal if it doesn't exist
    let modalContainer = document.getElementById('expandable-modal-container');
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'expandable-modal-container';
        modalContainer.className = 'expandable-modal';
        modalContainer.innerHTML = '<div class="expandable-modal-content"><button class="expandable-modal-close" onclick="closeExpandableModal()">&times;</button><div id="expandable-modal-body"></div></div>';
        document.body.appendChild(modalContainer);
    }
    
    // Clone card content into modal
    const cardContent = cardElement.cloneNode(true);
    cardContent.classList.remove('expandable-card', 'methylation-card');
    cardContent.style.width = 'auto';
    cardContent.style.height = 'auto';
    cardContent.querySelectorAll('p').forEach(p => {
        p.style.display = 'block';
        p.style.webkitLineClamp = 'unset';
    });
    cardContent.querySelector('.expand-overlay')?.remove();
    
    document.getElementById('expandable-modal-body').innerHTML = '';
    document.getElementById('expandable-modal-body').appendChild(cardContent);
    
    // Open modal
    modalContainer.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeExpandableModal() {
    const modal = document.getElementById('expandable-modal-container');
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

// Close modal when clicking backdrop
runOnReady(function () {
    document.addEventListener('click', function (e) {
        if (e.target.id === 'expandable-modal-container') {
            closeExpandableModal();
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeExpandableModal();
        }
    });
});

/* Avatar controls removed per user request. */

// Video embed interaction for cover images
runOnReady(function () {
    const videoEmbeds = document.querySelectorAll('.video-embed');
    
    // Add CSS for clicked state
    const style = document.createElement('style');
    style.textContent = `
        .video-embed.clicked::before {
            opacity: 0 !important;
            transition: opacity 0.3s ease;
        }
        .video-embed.clicked::after {
            opacity: 0 !important;
            transition: opacity 0.3s ease;
        }
    `;
    document.head.appendChild(style);
    
    // Handle clicks on video embeds
    videoEmbeds.forEach(embed => {
        embed.addEventListener('click', function(e) {
            // Only add clicked class if we're clicking the overlay, not the iframe itself
            if (!e.target.tagName || e.target.tagName !== 'IFRAME') {
                this.classList.add('clicked');
            }
        });
    });
});
