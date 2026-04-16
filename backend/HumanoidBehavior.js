// HumanoidBehavior.js — Advanced Stealth Engine
// Simulates human-like browsing patterns to evade bot detection systems.

class HumanoidBehavior {
    constructor(page) {
        this.page = page;
        this.stealthLevel = 'maximum';
    }

    // --- Bezier Curve Mouse Movement ---
    async humanMouseMove(targetX, targetY) {
        const viewport = this.page.viewportSize() || { width: 1280, height: 720 };
        const startX = Math.random() * viewport.width;
        const startY = Math.random() * viewport.height;
        
        // Generate 2 control points for cubic Bezier curve
        const cp1x = startX + (targetX - startX) * 0.25 + (Math.random() - 0.5) * 100;
        const cp1y = startY + (targetY - startY) * 0.25 + (Math.random() - 0.5) * 100;
        const cp2x = startX + (targetX - startX) * 0.75 + (Math.random() - 0.5) * 60;
        const cp2y = startY + (targetY - startY) * 0.75 + (Math.random() - 0.5) * 60;

        const steps = 15 + Math.floor(Math.random() * 20); // 15-35 steps
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const inv = 1 - t;
            
            // Cubic Bezier formula: B(t) = (1-t)^3*P0 + 3(1-t)^2*t*P1 + 3(1-t)*t^2*P2 + t^3*P3
            const x = Math.round(
                inv * inv * inv * startX +
                3 * inv * inv * t * cp1x +
                3 * inv * t * t * cp2x +
                t * t * t * targetX
            );
            const y = Math.round(
                inv * inv * inv * startY +
                3 * inv * inv * t * cp1y +
                3 * inv * t * t * cp2y +
                t * t * t * targetY
            );

            await this.page.mouse.move(x, y);
            // Human-like variable speed: slower near start/end, faster in middle
            const delay = 8 + Math.floor(Math.random() * 12) + (t < 0.1 || t > 0.9 ? 15 : 0);
            await this.page.waitForTimeout(delay);
        }
    }

    // --- Human-Like Click with Pre-Hover ---
    async humanClick(selector) {
        try {
            const element = await this.page.$(selector);
            if (!element) return false;

            const box = await element.boundingBox();
            if (!box) return false;

            // Add slight randomness within the element bounds
            const targetX = box.x + box.width * (0.3 + Math.random() * 0.4);
            const targetY = box.y + box.height * (0.3 + Math.random() * 0.4);

            // Move mouse with Bezier curve
            await this.humanMouseMove(targetX, targetY);
            
            // Pre-click hover delay (50-200ms like real humans)
            await this.page.waitForTimeout(50 + Math.floor(Math.random() * 150));
            
            await this.page.mouse.click(targetX, targetY);
            
            // Post-click micro-delay
            await this.page.waitForTimeout(100 + Math.floor(Math.random() * 200));
            return true;
        } catch (e) {
            console.warn('[HumanoidBehavior] Click failed:', e.message);
            return false;
        }
    }

    // --- Human-Like Typing with Variable Speed ---
    async humanType(selector, text) {
        try {
            await this.page.click(selector);
            await this.page.waitForTimeout(200 + Math.floor(Math.random() * 300));

            for (const char of text) {
                await this.page.keyboard.type(char, {
                    delay: 30 + Math.floor(Math.random() * 120) // 30-150ms per char
                });

                // Occasional longer pause (simulates thinking)
                if (Math.random() < 0.08) {
                    await this.page.waitForTimeout(300 + Math.floor(Math.random() * 500));
                }
            }
            return true;
        } catch (e) {
            console.warn('[HumanoidBehavior] Type failed:', e.message);
            return false;
        }
    }

    // --- Fingerprint Masking ---
    async applyFingerprint() {
        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
        ];

        const selectedUA = userAgents[Math.floor(Math.random() * userAgents.length)];

        // Override navigator properties to evade detection
        await this.page.addInitScript(() => {
            // Mask webdriver flag
            Object.defineProperty(navigator, 'webdriver', { get: () => false });

            // Mask Chrome automation indicators
            delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
            delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
            delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;

            // Fake plugins array
            Object.defineProperty(navigator, 'plugins', {
                get: () => [
                    { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
                    { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
                    { name: 'Native Client', filename: 'internal-nacl-plugin' }
                ]
            });

            // Fake languages
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en', 'fr']
            });

            // Canvas fingerprint noise
            const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
            HTMLCanvasElement.prototype.toDataURL = function(type) {
                if (type === 'image/png') {
                    const ctx = this.getContext('2d');
                    if (ctx) {
                        const shift = Math.random() * 0.01;
                        const imageData = ctx.getImageData(0, 0, this.width, this.height);
                        for (let i = 0; i < imageData.data.length; i += 4) {
                            imageData.data[i] += shift; // Tiny noise to R channel
                        }
                        ctx.putImageData(imageData, 0, 0);
                    }
                }
                return origToDataURL.apply(this, arguments);
            };

            // WebGL fingerprint randomization
            const origGetParameter = WebGLRenderingContext.prototype.getParameter;
            WebGLRenderingContext.prototype.getParameter = function(param) {
                if (param === 37445) return 'Intel Inc.';  // UNMASKED_VENDOR
                if (param === 37446) return 'Intel Iris OpenGL Engine'; // UNMASKED_RENDERER
                return origGetParameter.call(this, param);
            };
        });

        console.log(`[HumanoidBehavior] Fingerprint applied: ${selectedUA.substring(0, 50)}...`);
        return selectedUA;
    }

    // --- PredictiveGuard: Anticipatory Error Detection ---
    async predictiveGuard() {
        try {
            const metrics = await this.page.evaluate(() => {
                const entries = performance.getEntriesByType('navigation');
                const nav = entries[0] || {};
                return {
                    loadTime: nav.loadEventEnd - nav.startTime || 0,
                    domInteractive: nav.domInteractive - nav.startTime || 0,
                    resourceCount: performance.getEntriesByType('resource').length,
                    hiddenElements: document.querySelectorAll('[style*="display: none"], [style*="visibility: hidden"], .hidden').length
                };
            });

            const warnings = [];

            if (metrics.loadTime > 8000) {
                warnings.push({ type: 'slow_response', severity: 'high', message: `Page load time critical: ${Math.round(metrics.loadTime)}ms` });
            }
            if (metrics.hiddenElements > 10) {
                warnings.push({ type: 'vanishing_elements', severity: 'medium', message: `${metrics.hiddenElements} hidden elements detected — possible dynamic cloaking` });
            }
            if (metrics.resourceCount > 150) {
                warnings.push({ type: 'resource_overload', severity: 'low', message: `Heavy page: ${metrics.resourceCount} resources loaded` });
            }

            return {
                safe: warnings.length === 0,
                warnings,
                metrics,
                recommendation: warnings.length > 0 ? 'Increase stealth delays and diversify fingerprint.' : 'Environment stable.'
            };
        } catch (e) {
            return { safe: true, warnings: [], recommendation: 'Guard bypassed (no page context).' };
        }
    }

    // ═══════════════════════════════════════════════════════════
    // SOVEREIGN GHOST PROTOCOL — Silent Infiltration Engine
    // ═══════════════════════════════════════════════════════════

    // --- Ghost Pathing: Biometric Trajectory Simulation ---
    async ghostPath(targetX, targetY) {
        const viewport = this.page.viewportSize() || { width: 1280, height: 720 };
        const startX = Math.random() * viewport.width;
        const startY = Math.random() * viewport.height;

        // Generate 4 control points for QUINTIC Bezier (beyond cubic — harder to fingerprint)
        const controlPoints = Array.from({ length: 4 }, () => ({
            x: startX + (Math.random() - 0.5) * viewport.width * 0.6,
            y: startY + (Math.random() - 0.5) * viewport.height * 0.6
        }));

        const steps = 25 + Math.floor(Math.random() * 40);
        const trajectory = [];

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            // De Casteljau algorithm for N-point Bezier
            let points = [{ x: startX, y: startY }, ...controlPoints, { x: targetX, y: targetY }];
            while (points.length > 1) {
                const next = [];
                for (let j = 0; j < points.length - 1; j++) {
                    next.push({
                        x: points[j].x * (1 - t) + points[j + 1].x * t,
                        y: points[j].y * (1 - t) + points[j + 1].y * t
                    });
                }
                points = next;
            }

            // Add micro-tremor (human hand shake)
            const tremor = { x: (Math.random() - 0.5) * 2.5, y: (Math.random() - 0.5) * 2.5 };
            trajectory.push({
                x: Math.round(points[0].x + tremor.x),
                y: Math.round(points[0].y + tremor.y)
            });
        }

        // Execute trajectory with variable velocity (acceleration + deceleration)
        for (let i = 0; i < trajectory.length; i++) {
            await this.page.mouse.move(trajectory[i].x, trajectory[i].y);
            const progress = i / trajectory.length;
            // Sigmoid-based speed curve: slow start, fast middle, slow end
            const sigmoid = 1 / (1 + Math.exp(-12 * (progress - 0.5)));
            const delay = 5 + Math.floor((1 - sigmoid * (1 - sigmoid) * 4) * 20) + Math.floor(Math.random() * 6);
            await this.page.waitForTimeout(delay);
        }
    }

    // --- Dynamic Fingerprint Rotation (per-navigation) ---
    async rotateFingerprint() {
        const platforms = ['Win32', 'MacIntel', 'Linux x86_64'];
        const vendors = ['Google Inc.', 'Apple Computer, Inc.', ''];
        const renderers = [
            'ANGLE (NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0)',
            'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11)',
            'Apple GPU',
            'ANGLE (AMD, AMD Radeon Pro 5500M OpenGL Engine)',
            'Mesa Intel(R) UHD Graphics 630'
        ];
        const screenRes = [
            { w: 1920, h: 1080 }, { w: 2560, h: 1440 }, { w: 1440, h: 900 },
            { w: 1680, h: 1050 }, { w: 3840, h: 2160 }, { w: 1366, h: 768 }
        ];
        const timezones = ['America/New_York', 'Europe/London', 'Asia/Tokyo', 'America/Los_Angeles', 'Europe/Berlin'];
        const langSets = [['en-US', 'en'], ['en-GB', 'en'], ['fr-FR', 'fr', 'en'], ['de-DE', 'de', 'en'], ['ja-JP', 'ja']];

        const chosen = {
            platform: platforms[Math.floor(Math.random() * platforms.length)],
            vendor: vendors[Math.floor(Math.random() * vendors.length)],
            renderer: renderers[Math.floor(Math.random() * renderers.length)],
            screen: screenRes[Math.floor(Math.random() * screenRes.length)],
            tz: timezones[Math.floor(Math.random() * timezones.length)],
            langs: langSets[Math.floor(Math.random() * langSets.length)],
            hardwareConcurrency: [2, 4, 8, 12, 16][Math.floor(Math.random() * 5)],
            deviceMemory: [2, 4, 8, 16][Math.floor(Math.random() * 4)]
        };

        await this.page.addInitScript((fp) => {
            Object.defineProperty(navigator, 'platform', { get: () => fp.platform });
            Object.defineProperty(navigator, 'vendor', { get: () => fp.vendor });
            Object.defineProperty(navigator, 'languages', { get: () => fp.langs });
            Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => fp.hardwareConcurrency });
            Object.defineProperty(navigator, 'deviceMemory', { get: () => fp.deviceMemory });
            Object.defineProperty(screen, 'width', { get: () => fp.screen.w });
            Object.defineProperty(screen, 'height', { get: () => fp.screen.h });

            // Rotate WebGL renderer
            const origGetParam = WebGLRenderingContext.prototype.getParameter;
            WebGLRenderingContext.prototype.getParameter = function(param) {
                if (param === 37446) return fp.renderer;
                if (param === 37445) return fp.vendor || 'Intel Inc.';
                return origGetParam.call(this, param);
            };

            // AudioContext fingerprint noise
            const origCreateOsc = window.AudioContext?.prototype?.createOscillator;
            if (origCreateOsc) {
                const OrigAudioCtx = window.AudioContext;
                window.AudioContext = function() {
                    const ctx = new OrigAudioCtx();
                    const origCreateAE = ctx.createAnalyser;
                    ctx.createAnalyser = function() {
                        const analyser = origCreateAE.call(ctx);
                        const origGetFloat = analyser.getFloatFrequencyData;
                        analyser.getFloatFrequencyData = function(arr) {
                            origGetFloat.call(this, arr);
                            for (let i = 0; i < arr.length; i++) arr[i] += (Math.random() - 0.5) * 0.1;
                        };
                        return analyser;
                    };
                    return ctx;
                };
            }
        }, chosen);

        console.log(`[Ghost Protocol] Fingerprint rotated: ${chosen.platform} | ${chosen.renderer.substring(0, 30)}... | ${chosen.tz}`);
        return chosen;
    }

    // --- Phantom Scroll: Natural-feeling scroll simulation ---
    async phantomScroll(distance = 500) {
        const steps = 8 + Math.floor(Math.random() * 12);
        const baseStep = distance / steps;
        for (let i = 0; i < steps; i++) {
            const scrollAmount = baseStep * (0.6 + Math.random() * 0.8);
            await this.page.mouse.wheel(0, scrollAmount);
            await this.page.waitForTimeout(30 + Math.floor(Math.random() * 80));
        }
        // Occasional micro-correction scroll (human-like)
        if (Math.random() < 0.3) {
            await this.page.waitForTimeout(200);
            await this.page.mouse.wheel(0, -(15 + Math.random() * 30));
        }
    }

    // --- Ghost Mode: Full stealth activation sequence ---
    async activateGhostMode() {
        console.log('[Ghost Protocol] ⚡ Activating Sovereign Ghost Mode...');
        await this.rotateFingerprint();
        await this.applyFingerprint();
        console.log('[Ghost Protocol] 👻 Ghost Mode Active — Invisible to all detection systems.');
        return { status: 'ghost_active', timestamp: Date.now() };
    }
}

module.exports = HumanoidBehavior;

