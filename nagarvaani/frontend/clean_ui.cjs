const fs = require('fs');

const files = [
  'src/pages/Landing.jsx',
  'src/pages/Auth.jsx',
  'src/components/layout/OfficerSidebar.jsx',
  'src/components/layout/AdminSidebar.jsx'
];

files.forEach(file => {
  let data = fs.readFileSync(file, 'utf8');
  // Remove lines with value="bn", value="ta", value="ml"
  data = data.replace(/.*value="(bn|ta|ml)".*\n/g, '');
  fs.writeFileSync(file, data);
});
