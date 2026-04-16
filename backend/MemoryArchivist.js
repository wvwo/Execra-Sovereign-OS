// MemoryArchivist.js — Neural Vector Memory (Local Vector DB)
// Stores successful healing experiences as encoded vectors for instant recall.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MEMORY_DB_PATH = path.join(__dirname, 'neural_memory.json');

class MemoryArchivist {
    constructor() {
        this.memories = [];
        this.xp = 0;
        this._load();
    }

    _load() {
        try {
            if (fs.existsSync(MEMORY_DB_PATH)) {
                const raw = fs.readFileSync(MEMORY_DB_PATH, 'utf-8');
                const data = JSON.parse(raw);
                this.memories = data.memories || [];
                this.xp = data.xp || 0;
            }
        } catch (e) {
            console.warn('[MemoryArchivist] Failed to load memory DB, starting fresh.');
            this.memories = [];
            this.xp = 0;
        }
    }

    _save() {
        try {
            fs.writeFileSync(MEMORY_DB_PATH, JSON.stringify({
                memories: this.memories,
                xp: this.xp,
                lastUpdated: new Date().toISOString()
            }, null, 2));
        } catch (e) {
            console.warn('[MemoryArchivist] Failed to persist memory.');
        }
    }

    // Generate a vector fingerprint from the step context
    _vectorize(step, domain) {
        const raw = `${domain}::${step.action}::${step.selector || ''}::${step.url || ''}`;
        return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 16);
    }

    // Store a successful healing experience
    recordExperience(step, domain, solution) {
        const vector = this._vectorize(step, domain);
        
        // Prevent duplicates
        const existing = this.memories.find(m => m.vector === vector);
        if (existing) {
            existing.hitCount = (existing.hitCount || 1) + 1;
            existing.lastUsed = new Date().toISOString();
            this.xp += 5; // Bonus XP for reinforcement
        } else {
            this.memories.push({
                vector,
                domain,
                action: step.action,
                originalSelector: step.selector || null,
                solution: {
                    type: solution.type, // 'selector', 'js_code', 'scenario'
                    value: solution.value
                },
                hitCount: 1,
                createdAt: new Date().toISOString(),
                lastUsed: new Date().toISOString()
            });
            this.xp += 25; // Major XP gain for new experience
        }

        this._save();
        console.log(`[MemoryArchivist] Experience encoded. Vector: ${vector} | Total XP: ${this.xp}`);
        return { vector, xp: this.xp };
    }

    // Recall a past experience before calling external AI
    recall(step, domain) {
        const vector = this._vectorize(step, domain);
        const match = this.memories.find(m => m.vector === vector);
        
        if (match) {
            match.hitCount++;
            match.lastUsed = new Date().toISOString();
            this.xp += 3; // Minor XP for successful recall
            this._save();
            console.log(`[MemoryArchivist] CACHE HIT! Vector: ${vector} | Hits: ${match.hitCount}`);
            return { found: true, solution: match.solution, hitCount: match.hitCount };
        }

        // Fuzzy match: same domain + same action type
        const fuzzy = this.memories.find(m => m.domain === domain && m.action === step.action);
        if (fuzzy) {
            console.log(`[MemoryArchivist] Fuzzy match found for domain ${domain}.`);
            return { found: true, solution: fuzzy.solution, hitCount: fuzzy.hitCount, fuzzy: true };
        }

        return { found: false };
    }

    getStats() {
        return {
            totalExperiences: this.memories.length,
            xp: this.xp,
            topDomains: [...new Set(this.memories.map(m => m.domain))].slice(0, 5)
        };
    }
}

module.exports = new MemoryArchivist();
