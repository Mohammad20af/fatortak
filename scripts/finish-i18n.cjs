const fs = require('node:fs');
const path = require('node:path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const b = require('@babel/types');
const files = dir => fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);
const t = (key, values) => b.callExpression(b.identifier('t'),[typeof key === 'string'?b.stringLiteral(key):key,...(values?[values]:[])]);
for(const file of files('src').filter(f=>f.endsWith('.jsx')&&!f.includes('i18n'))) {
 let source=fs.readFileSync(file,'utf8').replaceAll('err.message','err');
 const ast=parser.parse(source,{sourceType:'module',plugins:['jsx']});
 let formatNames=[];
 traverse(ast,{
  ImportDeclaration(p) {
   if(!p.node.source.value.endsWith('/utils/format'))return;
   p.node.specifiers=p.node.specifiers.filter(s=>{
    if(['money','dateLabel','periodLabel'].includes(s.imported?.name)){formatNames.push(s.imported.name);return false;}return true;
   });
   if(!p.node.specifiers.length)p.remove();
  },
  JSXAttribute(p) {
   const attr=p.node;
   if(!['title','label','placeholder','aria-label'].includes(attr.name.name)||!b.isJSXExpressionContainer(attr.value))return;
   const expr=attr.value.expression;
   if(b.isTemplateLiteral(expr)) {
    const start=expr.quasis[0].value.cooked;
    let key, parameter;
    if(start==='Hello, '){key='Hello, {name}.';parameter='name';}
    else if(['Description ','Quantity ','Unit price ','Remove line item '].includes(start)){key=`${start}{number}`;parameter='number';}
    else if(start==='Amount ('){key='Amount ({currency})';parameter='currency';}
    attr.value.expression=key?t(key,b.objectExpression([b.objectProperty(b.identifier(parameter),expr.expressions[0])])):t(expr);
   }
  },
  JSXOpeningElement(p) {
   if(p.node.name.name!=='ResourcePage')return;
   const attr=p.node.attributes.find(a=>a.name?.name==='title');
   if(!b.isJSXExpressionContainer(attr?.value))return;
   function unwrap(node){if(b.isCallExpression(node)&&node.callee.name==='t')return node.arguments[0];if(b.isConditionalExpression(node)){node.consequent=unwrap(node.consequent);node.alternate=unwrap(node.alternate);}return node;}
   attr.value.expression=unwrap(attr.value.expression);
  },
 });
 if(formatNames.length){
  const relative=path.relative(path.dirname(file),'src/i18n/useFormat').replaceAll('\\','/');
  ast.program.body.unshift(b.importDeclaration([b.importDefaultSpecifier(b.identifier('useFormat'))],b.stringLiteral(relative)));
  traverse(ast,{FunctionDeclaration(p){
   if(!/^[A-Z]/.test(p.node.id?.name||''))return;
   const used=new Set();p.traverse({CallExpression(q){if(formatNames.includes(q.node.callee.name))used.add(q.node.callee.name);}});
   if(used.size)p.node.body.body.unshift(b.variableDeclaration('const',[b.variableDeclarator(b.objectPattern([...used].map(name=>b.objectProperty(b.identifier(name),b.identifier(name),false,true))),b.callExpression(b.identifier('useFormat'),[]))]));
  }});
 }
 fs.writeFileSync(file,generate(ast,{comments:true,jsescOption:{minimal:true}}).code+'\n');
}
const hook='src/utils/useLoad.js';fs.writeFileSync(hook,fs.readFileSync(hook,'utf8').replaceAll('err.message','err'));
