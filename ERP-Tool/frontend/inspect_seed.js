const fs = require('fs');
const content = fs.readFileSync('../backend/app/seed.py', 'utf8');
console.log(content);
