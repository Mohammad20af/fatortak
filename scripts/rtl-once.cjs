const fs = require('node:fs');
const file='src/index.css';
let css=fs.readFileSync(file,'utf8');
for(const [from,to] of Object.entries({'margin-left:':'margin-inline-start:','margin-right:':'margin-inline-end:','padding-left:':'padding-inline-start:','padding-right:':'padding-inline-end:','border-right:':'border-inline-end:','text-align: left':'text-align: start','text-align: right':'text-align: end','right: -18px':'inset-inline-end: -18px','inset: 0 auto 0 0;':'inset-block: 0;\n  inset-inline-start: 0;'})) css=css.replaceAll(from,to);
fs.writeFileSync(file,css);
