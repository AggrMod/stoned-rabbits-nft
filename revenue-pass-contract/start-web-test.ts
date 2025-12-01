/**
 * Web Test Interface Server
 * Launches the blockchain test interface in your browser
 */

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3456;

const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
        const filePath = path.join(__dirname, 'web-test-interface.html');
        const content = fs.readFileSync(filePath, 'utf8');

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(PORT, () => {
    console.log('\n🚀 Revenue Pass Test Interface Started!\n');
    console.log('═'.repeat(60));
    console.log(`📱 Open in browser: http://localhost:${PORT}`);
    console.log('═'.repeat(60));
    console.log('\n✨ Features:');
    console.log('  • Deposit revenue (simulating Gamblor payouts)');
    console.log('  • Claim revenue for any pass (1-777)');
    console.log('  • View pool statistics in real-time');
    console.log('  • See blockchain blocks being mined');
    console.log('  • Track transaction history');
    console.log('\n💡 Try this:');
    console.log('  1. Deposit 7.77 SOL');
    console.log('  2. Claim with pass #420');
    console.log('  3. Deposit another 25 SOL');
    console.log('  4. Claim again with pass #420 (gets more!)');
    console.log('\n⏸️  Press Ctrl+C to stop the server\n');
});
