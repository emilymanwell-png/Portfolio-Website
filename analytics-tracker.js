/**
 * Portfolio Analytics Tracker
 * Add this script to your portfolio website to track visitor analytics
 * 
 * Usage: Include this script in your HTML and call initAnalytics() with your server URL
 */

(function() {
    'use strict';
    
    // Configuration - UPDATE THIS to your analytics server URL
    const ANALYTICS_SERVER = 'http://localhost:3001'; // Change for production
    
    // Get or create visitor ID
    function getVisitorId() {
        let visitorId = localStorage.getItem('portfolio_visitor_id');
        if (!visitorId) {
            visitorId = 'v_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('portfolio_visitor_id', visitorId);
        }
        return visitorId;
    }
    
    // Track page view
    function trackPageView() {
        const data = {
            visitorId: getVisitorId(),
            page: window.location.pathname + window.location.hash,
            title: document.title,
            referrer: document.referrer || null,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height
        };
        
        // Send tracking data
        fetch(ANALYTICS_SERVER + '/api/track', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            mode: 'cors'
        }).catch(function(err) {
            // Silently fail - don't affect user experience
            console.debug('Analytics tracking skipped');
        });
    }
    
    // Track custom events
    function trackEvent(eventType, eventData) {
        const data = {
            visitorId: getVisitorId(),
            eventType: eventType,
            eventData: eventData,
            page: window.location.pathname + window.location.hash
        };
        
        fetch(ANALYTICS_SERVER + '/api/track/event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            mode: 'cors'
        }).catch(function() {});
    }
    
    // Track page changes (for single-page apps)
    function setupSPATracking() {
        // Track hash changes
        window.addEventListener('hashchange', function() {
            trackPageView();
        });
        
        // Track history changes (pushState/replaceState)
        const originalPushState = history.pushState;
        history.pushState = function() {
            originalPushState.apply(this, arguments);
            trackPageView();
        };
        
        const originalReplaceState = history.replaceState;
        history.replaceState = function() {
            originalReplaceState.apply(this, arguments);
            trackPageView();
        };
        
        window.addEventListener('popstate', function() {
            trackPageView();
        });
    }
    
    // Initialize tracking
    function init() {
        // Track initial page view
        trackPageView();
        
        // Setup SPA tracking for your portfolio's page navigation
        setupSPATracking();
        
        // Optional: Track when user leaves
        window.addEventListener('beforeunload', function() {
            trackEvent('page_exit', { 
                timeOnPage: Math.round(performance.now() / 1000) 
            });
        });
    }
    
    // Expose functions globally
    window.portfolioAnalytics = {
        init: init,
        trackPageView: trackPageView,
        trackEvent: trackEvent
    };
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
