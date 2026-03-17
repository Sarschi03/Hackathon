const fs = require('fs');
const content = fs.readFileSync('bundle_err.txt', 'utf8');
try {
  const json = JSON.parse(content);
  console.log('--- ERROR MESSAGE ---');
  console.log(json.message);
  console.log('--- ERROR STACK ---');
  console.log(json.stack);
} catch (e) {
  console.log('Failed to parse JSON: ' + e.message);
  console.log('Content snippet: ' + content.slice(0, 200));
}
