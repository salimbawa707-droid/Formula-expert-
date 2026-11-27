#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const tsModule = await import(pathToFileURL(process.env.TYPESCRIPT_PATH).href);
const ts = tsModule.default || tsModule;

const root=process.cwd(), src=path.join(root,'src'), out=path.join(root,'evidence_vault/forensic_reports/generated');
const stamp='2026-11-27';
const md=path.join(out,'PHASE4B_93_CANDIDATE_SYMBOL_INVOCATIONS_'+stamp+'.md');
const json=path.join(out,'PHASE4B_93_CANDIDATE_SYMBOL_INVOCATIONS_'+stamp+'.json');
const exts=new Set(['.ts','.tsx','.js','.jsx']);
const candidateRe=/(engine|calculator|optimizer|optimization|formulation|workflow|predictor|router)/i;
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.name==='node_modules'||e.name==='.git'?[]:e.isDirectory()?walk(path.join(d,e.name)):(exts.has(path.extname(e.name).toLowerCase())?[path.join(d,e.name)]:[]));
const rel=f=>path.relative(root,f).split(path.sep).join('/');
const canon=f=>path.resolve(f).replace(/\\/g,'/');
const test=f=>f.split('/').includes('__tests__')||/\.(test|spec)\.(ts|tsx|js|jsx)$/i.test(f);
const config=ts.readConfigFile(path.join(root,'tsconfig.json'),ts.sys.readFile);
if(config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText,'\n'));
const options=ts.parseJsonConfigFileContent(config.config,ts.sys,root).options;
const sources=walk(src).map(canon).sort();
const candidates=sources.filter(f=>!test(rel(f))&&candidateRe.test(rel(f)));
if(candidates.length!==93) throw new Error('Expected 93 candidates, found '+candidates.length);
const byAbs=new Map(candidates.map(f=>[f,rel(f)])), records=[], unresolved=[];\nconst program=ts.createProgram({rootNames:sources,options});\nconst checker=program.getTypeChecker();\nfunction originOf(node){const symbol=checker.getSymbolAtLocation(node);if(!symbol)return null;let resolved=symbol;if(symbol.flags & ts.SymbolFlags.Alias){try{resolved=checker.getAliasedSymbol(symbol);}catch{return null;}}for(const decl of resolved.getDeclarations?.()||[]){const target=byAbs.get(canon(decl.getSourceFile().fileName));if(target)return target;}return null;}
function resolve(spec,from){const f=ts.resolveModuleName(spec,from,options,ts.sys).resolvedModule?.resolvedFileName;return f?byAbs.get(canon(f))||null:null;}
function importedTarget(expr,bindings){
 while(ts.isParenthesizedExpression(expr)||ts.isAsExpression(expr)||ts.isTypeAssertionExpression(expr)||ts.isNonNullExpression(expr)) expr=expr.expression;
 if(ts.isIdentifier(expr)){const b=bindings.get(expr.text);if(b?.target)return {b,name:b.name};}
 if(ts.isPropertyAccessExpression(expr)&&ts.isIdentifier(expr.expression)){const b=bindings.get(expr.expression.text);if(b){const target=originOf(expr.name)||b.target;if(target)return {b:{...b,target},name:b.name==='*'?expr.name.text:b.name+'.'+expr.name.text};}}
 return null;
}
function add(sf,node,b,name,kind,srcText,imp){
 const p=sf.getLineAndCharacterOfPosition(node.getStart(sf)), line=p.line+1;
 records.push({target:b.target,importer:rel(sf.fileName),importerKind:test(rel(sf.fileName))?'TEST':'PRODUCTION_SOURCE',importedSymbol:name,importSpecifier:b.spec,invocationKind:kind,line,column:p.character+1,expression:imp.slice(0,180),source:srcText.split(/\r?\n/)[line-1]?.trim().slice(0,240)||''});
}
for(const file of sources){
 const text=fs.readFileSync(file,'utf8'), sf=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,file.endsWith('.tsx')||file.endsWith('.jsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 const bindings=new Map();
 for(const st of sf.statements){
  if(!ts.isImportDeclaration(st)||!ts.isStringLiteral(st.moduleSpecifier))continue;
  const spec=st.moduleSpecifier.text;
  const resolvedPath=ts.resolveModuleName(spec,file,options,ts.sys).resolvedModule?.resolvedFileName;
  const directTarget=resolvedPath?byAbs.get(canon(resolvedPath))||null:null;
  if(!resolvedPath&&candidateRe.test(spec)&&!spec.split('/').some(x=>x==='tests'||x==='__tests__'))unresolved.push({importer:rel(file),specifier:spec});
  const c=st.importClause;if(!c||c.isTypeOnly)continue;
  if(c.name)bindings.set(c.name.text,{target:originOf(c.name)||directTarget,name:'default',spec});
  if(c.namedBindings&&ts.isNamespaceImport(c.namedBindings))bindings.set(c.namedBindings.name.text,{target:directTarget,name:'*',spec});
  else if(c.namedBindings&&ts.isNamedImports(c.namedBindings))for(const e of c.namedBindings.elements)if(!e.isTypeOnly)bindings.set(e.name.text,{target:originOf(e.name)||directTarget,name:(e.propertyName||e.name).text,spec});
 }
 function visit(n){
  if(ts.isCallExpression(n)&&n.expression.kind===ts.SyntaxKind.ImportKeyword){
   const a=n.arguments[0];if(a&&ts.isStringLiteral(a)){const target=resolve(a.text,file);if(target){const p=sf.getLineAndCharacterOfPosition(n.getStart(sf)),line=p.line+1;records.push({target,importer:rel(file),importerKind:test(rel(file))?'TEST':'PRODUCTION_SOURCE',importedSymbol:'*',importSpecifier:a.text,invocationKind:'DYNAMIC_IMPORT',line,column:p.character+1,expression:n.getText(sf).slice(0,180),source:text.split(/\r?\n/)[line-1]?.trim().slice(0,240)||''});}}
  }else if(ts.isCallExpression(n)||ts.isNewExpression(n)){
   const hit=importedTarget(n.expression,bindings);if(hit)add(sf,n,hit.b,hit.name,ts.isNewExpression(n)?'CONSTRUCTOR_CALL':'FUNCTION_OR_METHOD_CALL',text,n.expression.getText(sf));
  }else if(ts.isJsxOpeningElement(n)||ts.isJsxSelfClosingElement(n)){
   const tag=n.tagName;let hit=null;
   if(ts.isIdentifier(tag)){const b=bindings.get(tag.text);if(b?.target)hit={b,name:b.name};}
   else if(ts.isPropertyAccessExpression(tag)&&ts.isIdentifier(tag.expression)){const b=bindings.get(tag.expression.text);if(b){const target=originOf(tag.name)||b.target;if(target)hit={b:{...b,target},name:b.name==='*'?tag.name.text:b.name+'.'+tag.name.text};}}
   if(hit)add(sf,n,hit.b,hit.name,'JSX_COMPONENT_RENDER',text,tag.getText(sf));
  }
  ts.forEachChild(n,visit);
 }
 visit(sf);
}
records.sort((a,b)=>a.target.localeCompare(b.target)||a.importer.localeCompare(b.importer)||a.line-b.line||a.column-b.column);
const grouped=new Map(candidates.map(f=>[rel(f),[]]));for(const r of records)grouped.get(r.target)?.push(r);
const prod=records.filter(x=>x.importerKind==='PRODUCTION_SOURCE'),tests=records.filter(x=>x.importerKind==='TEST');
const report={audit:'Phase 4B 93-candidate AST-backed symbol invocation map',generatedAt:new Date().toISOString(),method:'TypeScript AST + TypeScript module resolver; direct named/default/namespace import bindings; direct calls, constructor calls, JSX renders and literal dynamic imports.',candidateCount:candidates.length,sourceFileCount:sources.length,directInvocationCount:records.length,productionInvocationCount:prod.length,testInvocationCount:tests.length,candidatesWithProductionInvocations:[...grouped].filter(([,v])=>v.some(x=>x.importerKind==='PRODUCTION_SOURCE')).length,candidatesWithTestOnlyInvocations:[...grouped].filter(([,v])=>v.length&&v.every(x=>x.importerKind==='TEST')).length,candidatesWithNoResolvedInvocation:[...grouped].filter(([,v])=>!v.length).map(([k])=>k),unresolvedCandidateLikeImports:unresolved,records};
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(json,JSON.stringify(report,null,2)+'\n');
const lines=['# Phase 4B — 93-candidate symbol invocation map','','Generated by evidence_vault/scripts/audit_93_candidate_symbol_invocations.mjs','TypeScript AST scan of all src TS/TSX/JS/JSX files. Every reported site includes source path and line/column.','', '| Metric | Result |','|---|---:|','| Candidates | '+report.candidateCount+' |','| Source files parsed | '+report.sourceFileCount+' |','| Direct symbol invocation/import sites | '+report.directInvocationCount+' |','| Production-source sites | '+report.productionInvocationCount+' |','| Test-only sites | '+report.testInvocationCount+' |','| Candidates with production invocation sites | '+report.candidatesWithProductionInvocations+' |','| Candidates with test-only invocation sites | '+report.candidatesWithTestOnlyInvocations+' |','| Candidates with no resolved direct invocation | '+report.candidatesWithNoResolvedInvocation.length+' |','| Unresolved candidate-like imports | '+unresolved.length+' |','','## Candidate-by-candidate invocation sites',''];
for(const [candidate,items] of grouped){lines.push('### '+candidate);if(!items.length)lines.push('- No resolved direct invocation found; indirect wiring and re-export chains remain unresolved.');for(const x of items)lines.push('- '+x.importer+':'+x.line+':'+x.column+' — '+x.invocationKind+' — '+x.importedSymbol+' — '+x.importerKind+' — '+x.source.replace(/\|/g,'\\|'));lines.push('');}
lines.push('## Unresolved candidate-like imports');if(!unresolved.length)lines.push('- None detected.');else for(const x of unresolved)lines.push('- '+x.importer+' imports unresolved specifier '+x.specifier+'.');
lines.push('','## Interpretation limits','- A syntactic call site proves source invocation, not execution in a runtime session.','- The scan does not resolve arbitrary dependency injection, reflection, computed dynamic imports, callback execution, event wiring, runtime registries or indirect function references.','- Calls through barrel re-exports are not traced back through arbitrary export chains.','- JSX sites show declarative component use, not execution of every internal method.','- Candidates with no direct invocation remain unresolved, not automatically dead code.','- This is wiring evidence only; it does not establish scientific correctness, applicability, calibration or LAB_VALIDATED status.','');
fs.writeFileSync(md,lines.join('\n'));
console.log(JSON.stringify({candidateCount:report.candidateCount,sourceFileCount:report.sourceFileCount,directInvocationCount:report.directInvocationCount,productionInvocationCount:report.productionInvocationCount,testInvocationCount:report.testInvocationCount,candidatesWithProductionInvocations:report.candidatesWithProductionInvocations,candidatesWithTestOnlyInvocations:report.candidatesWithTestOnlyInvocations,candidatesWithNoResolvedInvocation:report.candidatesWithNoResolvedInvocation.length,unresolvedCandidateLikeImports:unresolved.length},null,2));
