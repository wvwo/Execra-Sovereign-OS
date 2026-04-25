const fs = require('fs');
const filePath = 'frontend/src/App.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// The sed command did: s|fetch('http://localhost:3001/|fetch(`${API_BASE}/|g
// Meaning we have things like: fetch(`${API_BASE}/api/analytics');
// We need to replace the closing quote with a backtick

content = content.replace(/fetch\(\`\$\{API_BASE\}\/([^']+)'\)/g, 'fetch(`${API_BASE}/$1`)');
content = content.replace(/fetch\(\`\$\{API_BASE\}\/([^']+)', \{/g, 'fetch(`${API_BASE}/$1`, {');

fs.writeFileSync(filePath, content);
console.log("Fixed quotes in App.jsx");
