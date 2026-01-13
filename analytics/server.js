const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============ CONFIGURATION ============
// Change this password to something secure!
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'emily-portfolio-2026';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

// ============ IN-MEMORY DATABASE ============
// For production, consider using SQLite or another database
const analytics = {
    pageViews: [],
    visitors: new Map(),
    sessions: new Map()
};

// ============ MIDDLEWARE ============
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS for tracking from portfolio site
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});

// Serve static files (admin dashboard)
app.use(express.static(path.join(__dirname, 'public')));

// ============ HELPER FUNCTIONS ============
function generateVisitorId() {
    return 'v_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
}

function parseUserAgent(ua) {
    if (!ua) return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };
    
    let browser = 'Other';
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
    
    let os = 'Other';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    
    let device = 'Desktop';
    if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) device = 'Mobile';
    else if (ua.includes('Tablet') || ua.includes('iPad')) device = 'Tablet';
    
    return { browser, os, device };
}

function getLocationFromIP(ip) {
    // In production, use a geolocation API like ip-api.com or maxmind
    // For now, return placeholder
    return { country: 'Unknown', city: 'Unknown', region: 'Unknown' };
}

// Auth middleware
function requireAuth(req, res, next) {
    const sessionToken = req.cookies.admin_session;
    
    if (!sessionToken || !analytics.sessions.has(sessionToken)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const session = analytics.sessions.get(sessionToken);
    if (Date.now() > session.expires) {
        analytics.sessions.delete(sessionToken);
        return res.status(401).json({ error: 'Session expired' });
    }
    
    next();
}

// ============ TRACKING ENDPOINTS ============

// Track page view (called from portfolio site)
app.post('/api/track', (req, res) => {
    try {
        const { page, title, referrer, screenWidth, screenHeight } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        const visitorId = req.body.visitorId || generateVisitorId();
        
        const parsedUA = parseUserAgent(userAgent);
        const location = getLocationFromIP(ip);
        
        const pageView = {
            id: analytics.pageViews.length + 1,
            page: page || '/',
            title: title || 'Unknown',
            visitorId,
            ip: ip.split(',')[0].trim(), // Get first IP if multiple
            userAgent,
            browser: parsedUA.browser,
            os: parsedUA.os,
            device: parsedUA.device,
            referrer: referrer || null,
            screenWidth,
            screenHeight,
            country: location.country,
            city: location.city,
            timestamp: new Date().toISOString()
        };
        
        analytics.pageViews.push(pageView);
        
        // Update or create visitor
        if (analytics.visitors.has(visitorId)) {
            const visitor = analytics.visitors.get(visitorId);
            visitor.lastSeen = new Date().toISOString();
            visitor.totalVisits++;
            visitor.pagesViewed.push(page);
        } else {
            analytics.visitors.set(visitorId, {
                visitorId,
                firstSeen: new Date().toISOString(),
                lastSeen: new Date().toISOString(),
                totalVisits: 1,
                pagesViewed: [page],
                ip: ip.split(',')[0].trim(),
                browser: parsedUA.browser,
                os: parsedUA.os,
                device: parsedUA.device,
                country: location.country,
                city: location.city
            });
        }
        
        res.json({ success: true, visitorId });
    } catch (error) {
        console.error('Tracking error:', error);
        res.status(500).json({ error: 'Tracking failed' });
    }
});

// Track events (clicks, scroll depth, etc.)
app.post('/api/track/event', (req, res) => {
    try {
        const { visitorId, eventType, eventData, page } = req.body;
        
        // Store events with page views for simplicity
        const event = {
            id: analytics.pageViews.length + 1,
            type: 'event',
            eventType,
            eventData,
            page,
            visitorId,
            timestamp: new Date().toISOString()
        };
        
        analytics.pageViews.push(event);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Event tracking failed' });
    }
});

// ============ AUTH ENDPOINTS ============

// Login
app.post('/api/auth/login', (req, res) => {
    const { password } = req.body;
    
    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Invalid password' });
    }
    
    const sessionToken = generateSessionToken();
    analytics.sessions.set(sessionToken, {
        created: Date.now(),
        expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    });
    
    res.cookie('admin_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    });
    
    res.json({ success: true });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    const sessionToken = req.cookies.admin_session;
    if (sessionToken) {
        analytics.sessions.delete(sessionToken);
    }
    res.clearCookie('admin_session');
    res.json({ success: true });
});

// Check auth status
app.get('/api/auth/check', (req, res) => {
    const sessionToken = req.cookies.admin_session;
    
    if (!sessionToken || !analytics.sessions.has(sessionToken)) {
        return res.json({ authenticated: false });
    }
    
    const session = analytics.sessions.get(sessionToken);
    if (Date.now() > session.expires) {
        analytics.sessions.delete(sessionToken);
        return res.json({ authenticated: false });
    }
    
    res.json({ authenticated: true });
});

// ============ ADMIN API ENDPOINTS ============

// Get overview stats
app.get('/api/admin/stats', requireAuth, (req, res) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // This calendar month (from 1st of current month)
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    // This calendar year (from Jan 1st)
    const thisYearStart = new Date(now.getFullYear(), 0, 1).toISOString();
    
    const pageViewsOnly = analytics.pageViews.filter(pv => pv.type !== 'event');
    
    const todayViews = pageViewsOnly.filter(pv => pv.timestamp.startsWith(today));
    const weekViews = pageViewsOnly.filter(pv => pv.timestamp >= weekAgo);
    const monthViews = pageViewsOnly.filter(pv => pv.timestamp >= monthAgo);
    const thisMonthViews = pageViewsOnly.filter(pv => pv.timestamp >= thisMonthStart);
    const thisYearViews = pageViewsOnly.filter(pv => pv.timestamp >= thisYearStart);
    
    const todayVisitors = new Set(todayViews.map(pv => pv.visitorId)).size;
    const weekVisitors = new Set(weekViews.map(pv => pv.visitorId)).size;
    const thisMonthVisitors = new Set(thisMonthViews.map(pv => pv.visitorId)).size;
    const thisYearVisitors = new Set(thisYearViews.map(pv => pv.visitorId)).size;
    
    res.json({
        totalPageViews: pageViewsOnly.length,
        totalVisitors: analytics.visitors.size,
        todayViews: todayViews.length,
        todayVisitors,
        weekViews: weekViews.length,
        weekVisitors,
        monthViews: monthViews.length,
        thisMonthViews: thisMonthViews.length,
        thisMonthVisitors,
        thisYearViews: thisYearViews.length,
        thisYearVisitors
    });
});

// Get page analytics
app.get('/api/admin/pages', requireAuth, (req, res) => {
    const pageViewsOnly = analytics.pageViews.filter(pv => pv.type !== 'event');
    
    // Group by page
    const pageStats = {};
    pageViewsOnly.forEach(pv => {
        if (!pageStats[pv.page]) {
            pageStats[pv.page] = { page: pv.page, views: 0, visitors: new Set() };
        }
        pageStats[pv.page].views++;
        pageStats[pv.page].visitors.add(pv.visitorId);
    });
    
    const pages = Object.values(pageStats)
        .map(p => ({ page: p.page, views: p.views, uniqueVisitors: p.visitors.size }))
        .sort((a, b) => b.views - a.views);
    
    res.json({ pages });
});

// Get visitor details
app.get('/api/admin/visitors', requireAuth, (req, res) => {
    const visitors = Array.from(analytics.visitors.values())
        .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen))
        .slice(0, 100);
    
    res.json({ visitors });
});

// Get recent activity
app.get('/api/admin/activity', requireAuth, (req, res) => {
    const recentViews = analytics.pageViews
        .filter(pv => pv.type !== 'event')
        .slice(-100)
        .reverse();
    
    res.json({ recentViews });
});

// Get traffic sources (referrers)
app.get('/api/admin/sources', requireAuth, (req, res) => {
    const pageViewsOnly = analytics.pageViews.filter(pv => pv.type !== 'event');
    
    const sources = {};
    pageViewsOnly.forEach(pv => {
        const source = pv.referrer || 'Direct';
        if (!sources[source]) {
            sources[source] = 0;
        }
        sources[source]++;
    });
    
    const sourceList = Object.entries(sources)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count);
    
    res.json({ sources: sourceList });
});

// Get device/browser breakdown
app.get('/api/admin/devices', requireAuth, (req, res) => {
    const pageViewsOnly = analytics.pageViews.filter(pv => pv.type !== 'event');
    
    const browsers = {};
    const devices = {};
    const operatingSystems = {};
    
    pageViewsOnly.forEach(pv => {
        browsers[pv.browser] = (browsers[pv.browser] || 0) + 1;
        devices[pv.device] = (devices[pv.device] || 0) + 1;
        operatingSystems[pv.os] = (operatingSystems[pv.os] || 0) + 1;
    });
    
    res.json({
        browsers: Object.entries(browsers).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
        devices: Object.entries(devices).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
        operatingSystems: Object.entries(operatingSystems).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
    });
});

// Get daily views for chart
app.get('/api/admin/daily', requireAuth, (req, res) => {
    const pageViewsOnly = analytics.pageViews.filter(pv => pv.type !== 'event');
    
    const dailyStats = {};
    const last30Days = [];
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        last30Days.push(date);
        dailyStats[date] = { date, views: 0, visitors: new Set() };
    }
    
    pageViewsOnly.forEach(pv => {
        const date = pv.timestamp.split('T')[0];
        if (dailyStats[date]) {
            dailyStats[date].views++;
            dailyStats[date].visitors.add(pv.visitorId);
        }
    });
    
    const daily = last30Days.map(date => ({
        date,
        views: dailyStats[date].views,
        visitors: dailyStats[date].visitors.size
    }));
    
    res.json({ daily });
});

// ============ SERVE ADMIN DASHBOARD ============
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============ START SERVER ============
app.listen(PORT, () => {
    console.log(`\n📊 Portfolio Analytics Server running on http://localhost:${PORT}`);
    console.log(`\n🔐 Admin Dashboard: http://localhost:${PORT}/admin`);
    console.log(`   Default password: ${ADMIN_PASSWORD}`);
    console.log(`\n💡 To change password, set ADMIN_PASSWORD in .env file\n`);
});
