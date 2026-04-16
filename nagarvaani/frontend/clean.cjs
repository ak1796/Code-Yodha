const fs = require('fs'); 
const file = 'src/lib/i18n.js'; 
let data = fs.readFileSync(file, 'utf8'); 
const bnIndex = data.indexOf('  bn: {'); 
if (bnIndex !== -1) { 
  const prevComma = data.lastIndexOf(',', bnIndex); 
  if (prevComma !== -1) { 
    const endStr = '};\n\ni18n'; 
    const endIndex = data.indexOf(endStr, bnIndex); 
    if (endIndex !== -1) { 
      data = data.substring(0, prevComma) + '\n' + data.substring(endIndex); 
    } 
  } 
} 
data = data.replace(/[ \t]*"Lang_(bn|ta|ml)":\s*".*?",?\r?\n/g, ''); 
fs.writeFileSync(file, data);
