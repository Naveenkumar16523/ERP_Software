import fs from 'fs';

const content = fs.readFileSync('c:/Users/sudha/Downloads/ERP-Tool/ERP-Tool/frontend/src/App.jsx', 'utf8');

const searchTerms = [
  'activeModule',
  'activeTab',
  'dashboard',
  'finance',
  'inventory',
  'hr',
  'crm',
  'manufacturing',
  'procurement',
  'project',
  'payroll',
  'banking',
  'education',
  'marketing',
  'supplychain',
  'healthcare',
  'agriculture',
  'sustainability',
  'security',
  'support'
];

console.log('=== Checking Search Terms in App.jsx ===');
searchTerms.forEach(term => {
  const count = (content.toLowerCase().match(new RegExp('\\b' + term.toLowerCase() + '\\b', 'g')) || []).length;
  console.log(`${term}: count = ${count}`);
});
