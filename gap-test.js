const fs = require('fs');
const content = fs.readFileSync('app/estimate/services/page.tsx', 'utf8');
console.log(content.split('\n').filter((l, i) => i > 300 && i < 330).join('\n'));
