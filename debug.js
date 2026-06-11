const fs = require('fs');
const contents = fs.readFileSync('.next/server/chunks/611.js', 'utf8');
const lines = contents.split('\n');
if (lines.length >= 6) {
  const line = lines[5];
  console.log(line.substring(1300, 1450));
}
