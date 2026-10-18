const fs=require('node:fs');
const parser=require('@babel/parser');
const traverse=require('@babel/traverse').default;
const path=require('node:path');
const files=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);
(async()=>{
const {translations}=await import('../src/i18n/translations.js');
const missing=new Set();
for(const file of files('src').filter(f=>/\.(js|jsx)$/.test(f)&&!f.includes('i18n'))){
const ast=parser.parse(fs.readFileSync(file,'utf8'),{sourceType:'module',plugins:['jsx']});
traverse(ast,{CallExpression(p){if(p.node.callee.name==='t'&&p.node.arguments[0]?.type==='StringLiteral'&&!translations.ar[p.node.arguments[0].value])missing.add(p.node.arguments[0].value);}});
}
console.log(JSON.stringify([...missing],null,2));
})();
