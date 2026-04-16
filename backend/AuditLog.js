// AuditLog.js — Enterprise Integrity: Immutable Blockchain-Ready Audit Trail
// Records every swarm and engine action in a tamper-evident, append-only log.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const AUDIT_LOG_PATH = path.join(__dirname, 'audit_log.json');

class AuditLog {
    constructor() {
        this.entries = [];
        this._load();
    }

    _load() {
        try {
            if (fs.existsSync(AUDIT_LOG_PATH)) {
                this.entries = JSON.parse(fs.readFileSync(AUDIT_LOG_PATH, 'utf-8'));
            }
        } catch (e) {
            this.entries = [];
        }
    }

    _save() {
        try {
            fs.writeFileSync(AUDIT_LOG_PATH, JSON.stringify(this.entries, null, 2));
        } catch (e) {
            console.warn('[AuditLog] Persistence failed.');
        }
    }

    // Compute block hash: sha256(previousHash + timestamp + action + data)
    _computeHash(entry) {
        const raw = `${entry.previousHash}${entry.timestamp}${entry.action}${JSON.stringify(entry.data)}`;
        return crypto.createHash('sha256').update(raw).digest('hex');
    }

    record(action, data, actor = 'system') {
        const previousHash = this.entries.length > 0
            ? this.entries[this.entries.length - 1].hash
            : '0000000000000000000000000000000000000000000000000000000000000000';

        const entry = {
            index: this.entries.length,
            timestamp: new Date().toISOString(),
            action,
            data,
            actor,
            previousHash
        };

        entry.hash = this._computeHash(entry);
        this.entries.push(entry);
        this._save();

        console.log(`[AuditLog] Block #${entry.index} | ${action} | Hash: ${entry.hash.substring(0, 12)}...`);
        return entry;
    }

    verifyIntegrity() {
        for (let i = 1; i < this.entries.length; i++) {
            const expected = this._computeHash({
                ...this.entries[i],
                hash: undefined
            });
            if (this.entries[i].hash !== expected) {
                return { valid: false, brokenAt: i, message: `Tamper detected at block #${i}` };
            }
            if (this.entries[i].previousHash !== this.entries[i - 1].hash) {
                return { valid: false, brokenAt: i, message: `Chain link broken at block #${i}` };
            }
        }
        return { valid: true, totalBlocks: this.entries.length, message: 'Chain integrity verified.' };
    }

    getRecent(count = 20) {
        return this.entries.slice(-count).reverse();
    }

    getStats() {
        return {
            totalBlocks: this.entries.length,
            integrity: this.verifyIntegrity(),
            lastAction: this.entries.length > 0 ? this.entries[this.entries.length - 1].action : 'none'
        };
    }
}

module.exports = new AuditLog();
