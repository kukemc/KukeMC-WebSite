
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = process.env.VITE_API_BASE || 'https://api.kuke.ink';
const SITE_URL = 'https://kuke.ink';
const OUTPUT_DIR_DIST = path.resolve(__dirname, '../dist');
const OUTPUT_DIR_PUBLIC = path.resolve(__dirname, '../public');

// --- Configuration & Tuning ---
const CONFIG = {
    limits: {
        maxPosts: 10000,
        minScoreToindex: 5, // Minimum score required to be indexed at all
    },
    weights: {
        like: 1.5,
        comment: 3.0, // Comments indicate engagement
        collect: 5.0, // Collections indicate high value/utility
        freshness_decay: 1.2 // Exponential decay factor
    },
    thresholds: {
        hot: 50,      // High interaction
        evergreen: 100 // Very high interaction, time-independent
    }
};

// Static Routes (Core Pages)
const STATIC_ROUTES = [
    { loc: '/', priority: 1.0, changefreq: 'daily' },
    { loc: '/news', priority: 0.9, changefreq: 'daily' },
    { loc: '/activity', priority: 0.9, changefreq: 'always' },
    { loc: '/stats', priority: 0.8, changefreq: 'daily' },
    { loc: '/consensus', priority: 0.8, changefreq: 'weekly' },
    { loc: '/players', priority: 0.7, changefreq: 'daily' },
    { loc: '/bans', priority: 0.6, changefreq: 'daily' },
    { loc: '/monitor', priority: 0.5, changefreq: 'always' },
];

// --- Helpers ---

async function fetchData(endpoint, params = {}) {
    try {
        const response = await axios.get(`${API_BASE}${endpoint}`, { params });
        return response.data;
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error.message);
        return null;
    }
}

// Post Score Algorithm
// Formula: (Likes * W_l + Comments * W_c + Collects * W_k) + (ContentLength * W_len)
function calculateInteractionScore(post) {
    const likes = post.likes_count || 0;
    const comments = post.comments_count || 0;
    const collects = post.collects_count || 0;
    const contentLen = post.content ? post.content.length : 0;
    
    // Interaction Score
    let score = (likes * CONFIG.weights.like) + 
                (comments * CONFIG.weights.comment) + 
                (collects * CONFIG.weights.collect);

    // Content Length Bonus (0.02 point per char, max 20 points)
    // Encourages longer, higher quality content (1000 chars = 20 pts)
    const lengthBonus = Math.min(contentLen * 0.02, 20);
    
    return score + lengthBonus;
}

// Freshness Weight
// Returns a multiplier between 0 and 1
function calculateFreshnessFactor(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = (now - date) / (1000 * 60 * 60 * 24);
    
    // Decay function: 1 / (days + 1) ^ 0.5
    // Example: 0 days -> 1.0, 7 days -> 0.35, 30 days -> 0.18
    return 1 / Math.pow(diffDays + 1, 0.5);
}

function categorizePost(post) {
    const interactionScore = calculateInteractionScore(post);
    const lastMod = post.updated_at || post.created_at;
    const daysOld = (new Date() - new Date(lastMod)) / (1000 * 60 * 60 * 24);

    // 1. Evergreen: High Value, Age doesn't matter (or implies it stood test of time)
    if (interactionScore >= CONFIG.thresholds.evergreen) {
        return 'evergreen';
    }

    // 2. Hot: High Value, Recent (last 30 days)
    if (interactionScore >= CONFIG.thresholds.hot && daysOld < 30) {
        return 'hot';
    }

    // 3. Trending: Good Value, Very Recent (last 7 days)
    // Lower threshold for trending as they are new
    if (interactionScore >= 10 && daysOld < 7) {
        return 'trending';
    }

    // 4. Standard: Meets minimum quality
    if (interactionScore >= CONFIG.limits.minScoreToindex) {
        return 'standard';
    }

    return 'excluded';
}

// --- Fetchers ---

async function fetchAllPosts() {
    console.log('Fetching posts for evaluation...');
    let page = 1;
    const allPosts = [];
    const perPage = 50;
    const seenIds = new Set();

    while (true) {
        const data = await fetchData('/api/posts', { page, per_page: perPage, type: 'latest' });
        if (!data || !data.data || data.data.length === 0) break;
        
        // Filter is_published if the API supported it, but we assume public API returns published only.
        // We will process all returned posts.
        
        for (const post of data.data) {
            if (!seenIds.has(post.id)) {
                seenIds.add(post.id);
                allPosts.push(post);
            }
        }
        
        process.stdout.write(`\rFetched ${allPosts.length} posts...`);
        
        if (allPosts.length >= CONFIG.limits.maxPosts || allPosts.length >= data.total) break;
        page++;
    }
    console.log('\nDone fetching posts.');
    return allPosts;
}

async function fetchNews() {
    console.log('Fetching news...');
    try {
        // Fetch up to 1000 news items. Assuming this is enough for now.
        const data = await fetchData('/api/website/news/', { limit: 1000 });
        return data || [];
    } catch (e) {
        console.error("Error fetching news", e);
        return [];
    }
}

// --- Generators ---

function generateSitemapXML(urls) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
}

function generateSitemapIndex(sitemaps) {
    const today = new Date().toISOString().split('T')[0];
    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(filename => `  <sitemap>
    <loc>${SITE_URL}/${filename}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;
}

async function main() {
    console.log('=== Starting Advanced Sitemap Generation ===');
    
    const posts = await fetchAllPosts();
    const newsList = await fetchNews();
    
    // Buckets for different sitemaps
    const sitemaps = {
        main: [],      // Static pages
        news: [],      // News/Announcements
        hot: [],       // Hot posts
        evergreen: [], // Evergreen posts
        trending: [],  // Trending posts
        standard: []   // Standard posts
    };

    const today = new Date().toISOString().split('T')[0];

    // 1. Process Static Routes
    STATIC_ROUTES.forEach(route => {
        sitemaps.main.push({
            loc: `${SITE_URL}${route.loc === '/' ? '' : route.loc}`,
            lastmod: today,
            changefreq: route.changefreq,
            priority: route.priority
        });
    });

    // 2. Process News
    newsList.forEach(news => {
        const lastMod = (news.updated_at || news.created_at).split('T')[0];
        sitemaps.news.push({
            loc: `${SITE_URL}/news/${news.id}`,
            lastmod: lastMod,
            changefreq: 'monthly', // News don't change often after publish
            priority: 0.8
        });
    });
    console.log(`Processed ${newsList.length} news items.`);

    // 3. Process Posts with Scoring Algorithm
    let stats = { total: posts.length, included: 0, excluded: 0, byCategory: {} };
    
    posts.forEach(post => {
        const category = categorizePost(post);
        const lastMod = (post.updated_at || post.created_at).split('T')[0];
        
        if (category === 'excluded') {
            stats.excluded++;
            return;
        }

        const url = {
            loc: post.type === 'album' ? `${SITE_URL}/album/${post.id}` : `${SITE_URL}/activity/${post.id}`,
            lastmod: lastMod,
            changefreq: 'weekly',
            priority: 0.5 // default
        };

        switch (category) {
            case 'evergreen':
                url.priority = 1.0;
                url.changefreq = 'monthly'; // Stable content
                sitemaps.evergreen.push(url);
                break;
            case 'hot':
                url.priority = 0.9;
                url.changefreq = 'daily'; // High activity
                sitemaps.hot.push(url);
                break;
            case 'trending':
                url.priority = 0.8;
                url.changefreq = 'daily';
                sitemaps.trending.push(url);
                break;
            case 'standard':
                url.priority = 0.6;
                sitemaps.standard.push(url);
                break;
        }
        stats.included++;
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    });

    console.log('Generation Stats:', stats);

    // Ensure output directories
    const sitemapSubDir = 'sitemaps';
    const distSitemapsDir = path.join(OUTPUT_DIR_DIST, sitemapSubDir);
    const publicSitemapsDir = path.join(OUTPUT_DIR_PUBLIC, sitemapSubDir);

    [OUTPUT_DIR_DIST, OUTPUT_DIR_PUBLIC, distSitemapsDir, publicSitemapsDir].forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    const generatedFiles = [];

    // Write Sitemap Files
    // Helper to write to both dist and public
    const writeSitemap = (filename, urls) => {
        if (urls.length === 0) return;
        const content = generateSitemapXML(urls);
        
        // Write to subdirectories
        fs.writeFileSync(path.join(distSitemapsDir, filename), content);
        fs.writeFileSync(path.join(publicSitemapsDir, filename), content);
        
        generatedFiles.push(filename);
        console.log(`Generated ${filename} with ${urls.length} URLs`);
    };

    writeSitemap('sitemap-main.xml', sitemaps.main);
    writeSitemap('sitemap-news.xml', sitemaps.news);
    writeSitemap('sitemap-posts-hot.xml', sitemaps.hot);
    writeSitemap('sitemap-posts-evergreen.xml', sitemaps.evergreen);
    writeSitemap('sitemap-posts-trending.xml', sitemaps.trending);
    writeSitemap('sitemap-posts-standard.xml', sitemaps.standard);

    // Write Index File
    if (generatedFiles.length > 0) {
        // Index needs to point to the subdirectory
        const today = new Date().toISOString().split('T')[0];
        const indexContent = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${generatedFiles.map(filename => `  <sitemap>
    <loc>${SITE_URL}/${sitemapSubDir}/${filename}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;

        fs.writeFileSync(path.join(OUTPUT_DIR_DIST, 'sitemap.xml'), indexContent);
        fs.writeFileSync(path.join(OUTPUT_DIR_PUBLIC, 'sitemap.xml'), indexContent);
        console.log('Generated sitemap.xml (Index) at root');
    }

    console.log('=== Sitemap Generation Complete ===');
}

main().catch(console.error);
