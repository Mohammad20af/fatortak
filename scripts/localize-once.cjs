// One-time source migration; removed after reviewing the generated edits.
const fs = require('node:fs');
const path = require('node:path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const b = require('@babel/types');
const keys = new Set();
function call(value) {
  if (!/[A-Za-z]/.test(value) || ['f.', 'fatortak', 'fatortak.', 'USD', 'you@example.com'].includes(value) || value.startsWith('https://')) return b.stringLiteral(value);
  keys.add(value);
  return b.callExpression(b.identifier('t'), [b.stringLiteral(value)]);
}
function expression(node) {
  if (b.isStringLiteral(node)) return call(node.value);
  if (b.isConditionalExpression(node)) { node.consequent = expression(node.consequent); node.alternate = expression(node.alternate); }
  if (b.isLogicalExpression(node)) node.right = expression(node.right);
  return node;
}
function files(dir) { return fs.readdirSync(dir, {withFileTypes: true}).flatMap(e => e.isDirectory() ? files(path.join(dir,e.name)) : [path.join(dir,e.name)]); }
for (const file of files('src').filter(f => f.endsWith('.jsx') && !f.includes('i18n'))) {
  const ast = parser.parse(fs.readFileSync(file,'utf8'),{sourceType:'module',plugins:['jsx']});
  traverse(ast, {
    JSXText(p) {
      const lines = p.node.value.split(/\r?\n/);
      const value = lines.map((line,i) => {
        let s=line.replace(/\t/g,' '); if(i) s=s.trimStart(); if(i<lines.length-1) s=s.trimEnd(); return s;
      }).filter(Boolean).join(' ');
      if (!/[A-Za-z]/.test(value)) return;
      const translated = call(value.trim());
      if (b.isCallExpression(translated)) p.replaceWith(b.jsxExpressionContainer(translated));
    },
    JSXAttribute(p) {
      if (!['label','title','description','eyebrow','hint','placeholder','aria-label'].includes(p.node.name.name)) return;
      if (b.isStringLiteral(p.node.value)) p.node.value = b.jsxExpressionContainer(call(p.node.value.value));
      else if(b.isJSXExpressionContainer(p.node.value)) p.node.value.expression = expression(p.node.value.expression);
    },
    JSXExpressionContainer(p) {
      if (p.parentPath.isJSXAttribute()) return;
      p.node.expression = expression(p.node.expression);
    },
  });
  let used=false;
  traverse(ast, { FunctionDeclaration(p) {
    if (!/^[A-Z]/.test(p.node.id?.name || '')) return;
    let uses=false;
    p.traverse({CallExpression(q) {if(b.isIdentifier(q.node.callee,{name:'t'})) uses=true;}});
    if(uses) {p.node.body.body.unshift(b.variableDeclaration('const',[b.variableDeclarator(b.objectPattern([b.objectProperty(b.identifier('t'),b.identifier('t'),false,true)]),b.callExpression(b.identifier('useI18n'),[]))])); used=true;}
  }});
  if(used) {
    const relative=path.relative(path.dirname(file),'src/i18n/context').replaceAll('\\','/');
    ast.program.body.unshift(b.importDeclaration([b.importSpecifier(b.identifier('useI18n'),b.identifier('useI18n'))],b.stringLiteral(relative.startsWith('.')?relative:`./${relative}`)));
    fs.writeFileSync(file,generate(ast,{comments:true}).code+'\n');
  }
}
fs.writeFileSync('scripts/translation-keys.json', JSON.stringify([...keys].sort(),null,2));
