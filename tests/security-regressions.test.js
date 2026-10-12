const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const server = read('server.js');
const agent = read('src/agent/figranite/index.js');

assert.match(server, /EXTRACTION_SCRIPT_OVERRIDE_FORBIDDEN/);
assert.match(server, /disableExtractionScriptTemplating: Boolean\(req\.apiKey\)/);
assert.match(agent, /resolveExtractionScriptTemplate\(extractionScriptRaw/);
assert.match(agent, /runExtractionScript\(extractionScript, cleanedHtml, page\.url\(\), includeShadowDom, runtimeVars\)/);

const sandbox = read('src/agent/sandbox.js');
assert.match(sandbox, /variables: runtimeVariables && typeof runtimeVariables === 'object'/);

const { resolveExtractionScriptTemplate } = require('../src/agent/figranite');
const values = { query: '"; process.exit(); //', count: 3, active: true };
const resolved = resolveExtractionScriptTemplate(
    "return { query: '{$query}', count: {$count}, active: {$active} };",
    (name) => values[name]
);
assert.equal(resolved, `return { query: '\\"; process.exit(); //', count: 3, active: true };`);

assert.doesNotMatch(read('src/server/routes/credentials.js'), /requireAuthOrApiKey/);

for (const file of ['src/server/routes/browser.js', 'src/server/routes/cabinets.js']) {
    const source = read(file);
    assert.match(source, /requireAuthOrApiKey/);
    assert.match(source, /requireScopedPermission\('tasks:manage'\)/);
}

for (const file of ['server.js', 'src/server/routes/data.js', 'src/server/routes/cabinets.js']) {
    const source = read(file);
    assert.match(source, /requireScopedPermission\('tasks:manage'\)/);
}

console.log('Security regressions are guarded.');
