import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import PizZip from 'pizzip';

// Compile only the pure export/model modules; no app server or credentials needed.
const root = process.cwd();
const output = process.env.RESUME_CHECK_OUTPUT || mkdtempSync(path.join(os.tmpdir(), 'workstation-resume-check-'));
mkdirSync(output, { recursive: true });
const require = createRequire(path.join(root, 'package.json'));
function compile(name) {
  const filename = path.join(root, 'src/lib', `${name}.ts`);
  let source = ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  source = source.replace(/from "(@\/lib\/[^"\n]+|docxtemplater|pizzip)"/g, (_, specifier) => {
    const resolved = specifier.startsWith('@/lib/') ? path.join(output, `${specifier.slice(6)}.mjs`) : require.resolve(specifier);
    return `from ${JSON.stringify(pathToFileURL(resolved).href)}`;
  });
  writeFileSync(path.join(output, `${name}.mjs`), source);
}
for (const name of ['resume-display', 'resume-template-model', 'resume-ai-input', 'resume-reference', 'resume-docx']) compile(name);
const { buildResumeDocx } = await import(pathToFileURL(path.join(output, 'resume-docx.mjs')));
const { buildResumeTemplateModel } = await import(pathToFileURL(path.join(output, 'resume-template-model.mjs')));
const { buildResumeAiInputContext } = await import(pathToFileURL(path.join(output, 'resume-ai-input.mjs')));
const profile = { display_name: '示例候选人', contact: {}, social_links: {} };
const basicItem = { details: { name: '示例候选人', phone: '000-0000', email: 'example@example.invalid' } };
function item(type, i, fields = {}) {
  return { id: `item-${i}`, item_type: type, title: `条目${i}`, organization: `示例机构${i}`, role_title: '研究助理', location: '上海', start_date: '2026-01-01', end_date: null, is_current: true, summary: null, bullets: [`研究成果：核对数据 & <口径> ${i}`], skills: [], tags: [], details: {}, ...fields };
}
function version(items, fields = {}) {
  return { title: '模板验收', profile_fields: { show_photo: false, show_name: true, show_phone: true, show_email: true }, section_order: [], resume_version_items: items.map((resume_items, i) => ({ id: `link-${i}`, sort_order: i, resume_items, is_visible: true, visible_fields: {}, section_key: ({project:'projects',skill:'skills',language:'skills',other:'other'})[resume_items.item_type] || resume_items.item_type })), ...fields };
}
function xml(buffer) { return new PizZip(buffer).file('word/document.xml').asText(); }
function text(document) { return [...document.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)].map(match=>match[1]).join(''); }
const mixed = version([item('education', 0), ...Array.from({ length: 5 }, (_, i) => item('experience', i + 1)), item('project', 7), item('skill', 8, { details: { skill_category: '工具', skill_items: ['Python'] } }), item('research', 9), item('award', 10)]);
let buffer = await buildResumeDocx({version: mixed, profile, basicItem});
writeFileSync(path.join(output, 'sample.docx'), buffer);
let document = xml(buffer);
assert(!document.includes('{#') && !document.includes('{/'), 'No unresolved loops');
assert(!document.includes('<w:drawing'), 'No photo placeholder when photo is disabled');
assert(document.includes('研究成果：'), 'Bullet labels retained');
assert(document.includes('&amp;') && document.includes('&lt;口径&gt;'), 'User text is XML escaped');
for (let i = 1; i <= 5; i++) assert(document.includes(`示例机构${i}`), 'Any number of experiences');
for (const label of ['教育背景', '实习/工作经历', '项目经历', '技能&amp;兴趣爱好', '研究经历', '荣誉奖项']) assert(text(document).includes(label), `Section ${label}`);
assert(!document.includes('在校经历'), 'Empty sections omitted');
const hidden = structuredClone(mixed);
hidden.resume_version_items[1].is_visible = false;
hidden.resume_version_items[2].visible_fields = { show_location: false, show_date: false, show_company: false };
document = xml(await buildResumeDocx({ version: hidden, profile, basicItem }));
assert(!document.includes('>示例机构1<') && !document.includes('>示例机构2<'), 'Hidden items and fields are omitted');
const ai = buildResumeAiInputContext({version:hidden,profile,basicItem,targetKeywords:[]});
const aiEntries = ai.sections.find(section => section.key==='experience').entries;
assert(!aiEntries[0].subtitle.includes('上海') && aiEntries[1].subtitle.includes('上海'), 'JD input retains visible locations and excludes hidden locations');
const empty = await buildResumeDocx({ version: version([]), profile, basicItem });
assert(!xml(empty).includes('教育背景'), 'No empty headings');
const nameHidden = version([], { profile_fields: { show_name: false, show_photo: false } });
assert(!xml(await buildResumeDocx({ version: nameHidden, profile, basicItem })).includes('示例候选人'), 'Hidden name never falls back to version title');
const photoItem = { details: { name: '示例候选人', photo_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=' } };
const photoVersion = version([], { profile_fields: {show_name:true, show_photo:true} });
const photoZip = new PizZip(await buildResumeDocx({ version: photoVersion, profile, basicItem: photoItem }));
assert(photoZip.file('word/document.xml').asText().includes('<w:drawing'), 'Selected photo rendered');
assert(photoZip.file('word/_rels/document.xml.rels').asText().includes('media/resume-photo.png'), 'Photo relationship updated');
assert(!xml(await buildResumeDocx({ version: photoVersion, profile, basicItem })).includes('<w:drawing'), 'Missing photo has no inherited face');
const order = version([item('experience',1),item('education',2),item('project',3)],{section_order:['projects','experience','education']});
const model = buildResumeTemplateModel({ version: order, profile, basicItem });
assert.deepEqual(model.sections.map(s=>s.key), ['projects','experience','education'], 'Saved section order is respected');
const labels = model.sections.map(s=>s.label);
document = xml(await buildResumeDocx({ version: order, profile, basicItem }));
assert(labels.every((label,i)=>i===0 || text(document).indexOf(labels[i-1])<text(document).indexOf(label)), 'Preview and Word have identical section order');
const long = version(Array.from({length:16},(_,i)=>item('experience',i,{bullets:Array.from({length:4},(_,j)=>`验收段落${i}-${j}：${'持续更新素材并验证完整输出。'.repeat(6)}`)})));
const longBuffer = await buildResumeDocx({version:long, profile, basicItem});
writeFileSync(path.join(output,'long.docx'),longBuffer);
assert(xml(longBuffer).includes('验收段落15-3'), 'Long content retained through the last paragraph');
const longRows = xml(longBuffer).match(/<w:tr\b[\s\S]*?<\/w:tr>/g).filter(row=>row.includes('验收段落'));
assert(longRows.every(row=>!row.includes('trHeight')), 'No sample body row heights constrain new content');
assert(!xml(longBuffer).includes('hRule="exact"'), 'No exact row heights can clip text');
const template = new PizZip(readFileSync('src/templates/resume/20261018-reference-template.docx'));
assert(!Object.keys(template.files).some(name=>name.startsWith('customXml/') || name.startsWith('docProps/')), 'No personal metadata');
assert(!Object.keys(template.files).some(name=>name.endsWith('.jpeg')), 'No original portrait');
console.log('Resume template checks passed: loops, repeats, escaping, field visibility, photo, empty sections, section order, long content, metadata.');
console.log('QA files:', output);

// Normal manually created materials have no _resume_source or template revision.
// Their complete visible data must still use native Word typography and layout.
const manual = version([
  item('education', 20, {details:{school:'手工学校',major:'手工专业',degree:'硕士',college:'手工学院',gpa:'GPA4.0',location:'表单地点',core_courses:['手工课程'],honors:['手工荣誉']},location:null,summary:'教育摘要'}),
  item('experience', 21, {details:{company:'手工公司',position:'手工岗位',department:'手工部门',business_area:'业务领域',achievements:'手工业绩',tools:['工具独立开关']},summary:'工作摘要',skills:Array.from({length:10},(_,i)=>`技能${i}`),bullets:['无标签的正文','成果标签：正文内容','第六条','第四条','第五条','额外第六条']}),
  item('project', 22, {details:{project_name:'手工项目',project_role:'项目角色',methods:'项目方法',background:'项目背景',conclusion:'项目结论',related_outputs:'项目关联产出',results:'项目结果',tools:['项目工具']}}),
  item('research', 23, {details:{research_topic:'研究主题',research_role:'研究角色',background:'研究背景',methods:'研究方法',conclusion:'研究结论',results:'研究结果',related_outputs:'相关产出'}}),
  item('skill', 24, {details:{skill_category:'技能分类',skill_items:['手工技能'],tools:['技能工具'],language_level:'语言等级',proficiency:'熟练程度'},skills:['根技能'],summary:'技能摘要'}),
  item('certification', 25, {details:{certificate_name:'手工证书',issuer:'证书机构',valid_until:'有效期限',description:'证书说明',level:'证书级别'},summary:'证书摘要'}),
  item('award', 26, {details:{award_name:'手工奖项',issuer:'颁奖机构',level:'奖项等级',description:'奖项说明'}}),
  item('other', 27, {details:{organization_name:'手工社团',position:'社团职务',achievements:'社团成果'}})
]);
manual.resume_version_items[0].visible_fields = {show_gpa:true};
manual.resume_version_items[2].visible_fields = {show_related_outputs:true};
manual.resume_version_items[5].visible_fields = {show_level:true};
manual.resume_version_items[3].visible_fields = {show_related_outputs:true};
manual.resume_version_items[4].visible_fields = {show_proficiency:true,show_language_level:true};
const manualBuffer = await buildResumeDocx({version:manual,profile,basicItem});
writeFileSync(path.join(output,'manual-materials.docx'),manualBuffer);
const manualXml = xml(manualBuffer);
const manualText = text(manualXml);
for (const value of ['手工学校','手工专业','硕士','手工学院','表单地点','GPA4.0','手工课程','手工荣誉','教育摘要','手工公司','手工岗位','手工部门','业务领域','手工业绩','工作摘要','工具独立开关','技能9','额外第六条','手工项目','项目角色','项目方法','项目背景','项目结论','项目关联产出','项目结果','项目工具','研究主题','研究角色','研究背景','研究方法','研究结论','研究结果','相关产出','技能分类','手工技能','技能工具','语言等级','熟练程度','根技能','技能摘要','手工证书','证书机构','有效期限','证书说明','证书摘要','证书级别','手工奖项','颁奖机构','奖项等级','奖项说明','手工社团','社团职务','社团成果']) assert(manualText.includes(value),`Manual field retained: ${value}`);
for (const part of ['word/styles.xml','word/numbering.xml','word/fontTable.xml','word/theme/theme1.xml','word/settings.xml']) assert(new PizZip(manualBuffer).file(part).asNodeBuffer().equals(template.file(part).asNodeBuffer()),`Manual uses native ${part}`);
const runFor = (document,value) => document.match(/<w:r\b[\s\S]*?<\/w:r>/g).find(run=>run.includes(value));
assert(runFor(manualXml,'正文内容').includes('w:eastAsia="楷体"'), 'Manual body uses source Chinese font');
assert(runFor(manualXml,'正文内容').includes('w:ascii="Times New Roman"'), 'Manual body uses source Latin font');
assert(!/<w:b\s*\/>/.test(runFor(manualXml,'正文内容')), 'Body text after a label is regular');
assert(!/<w:b\s*\/>/.test(runFor(manualXml,'无标签的正文')), 'A plain bullet must not inherit the bold label run');
assert(/<w:b\s*\/>/.test(runFor(manualXml,'成果标签')), 'Bullet label keeps source bold style');
const fieldHidden = structuredClone(manual);
fieldHidden.resume_version_items[0].visible_fields = {show_major:false,show_degree:false,show_college:false,show_core_courses:false,show_honors:false,show_summary:false};
fieldHidden.resume_version_items[1].visible_fields = {show_tools:false,show_skills:true,show_department:false,show_business_area:false,show_achievements:false};
fieldHidden.resume_version_items[2].visible_fields = {show_background:false,show_results:false,show_methods:false,show_conclusion:false,show_related_outputs:false};
fieldHidden.resume_version_items[4].visible_fields = {show_skill_items:false,show_tools:false,show_summary:false};
const hiddenText = text(xml(await buildResumeDocx({version:fieldHidden,profile,basicItem})));
for (const value of ['手工专业','手工学院','手工课程','手工荣誉','教育摘要','工具独立开关','手工部门','业务领域','手工业绩','项目背景','项目结论','项目关联产出','项目结果','项目方法','手工技能','技能工具','根技能','技能摘要']) assert(!hiddenText.includes(value),`Hidden manual field omitted: ${value}`);
assert(hiddenText.includes('技能9'),'Skills remain visible when only tools are hidden');
const reuse = structuredClone(manual);
reuse.resume_version_items[1].resume_items.details.position = '更新后的岗位';
const reusedText = text(xml(await buildResumeDocx({version:reuse,profile,basicItem})));
assert(reusedText.includes('更新后的岗位') && !reusedText.includes('手工岗位'),'Re-export uses current material content');
for (const key of ['classic','compact','research']) {
 const oldVersion = version([item('experience',1)],{template_key:key});
 const exported = new PizZip(await buildResumeDocx({version:oldVersion,profile,basicItem}));
 assert(exported.file('word/styles.xml').asNodeBuffer().equals(template.file('word/styles.xml').asNodeBuffer()),`Historical ${key} also uses current native template`);
}
console.log('Manual workflow checks passed: complete fields, native fonts/styles, independent visibility, live reuse and historical versions.');

// Optional exact-fidelity check against private, locally supplied reference data.
// Source text and photographs are read at runtime and never checked into Git.
if (process.env.RESUME_REFERENCE_INPUT && process.env.RESUME_REFERENCE_DOCX) {
  const input = JSON.parse(readFileSync(process.env.RESUME_REFERENCE_INPUT, 'utf8'));
  const {getReferenceSnapshot,getReferenceContentHash,referenceResumeTemplatePath,redistributeReferenceText} = await import(pathToFileURL(path.join(output,'resume-reference.mjs')));
  const template = new PizZip(readFileSync(referenceResumeTemplatePath));
  const templateXml = template.file('word/document.xml').asText();
  const generated = new PizZip(await buildResumeDocx(input));
  const reference = new PizZip(readFileSync(process.env.RESUME_REFERENCE_DOCX));
  for (const name of ['word/document.xml','word/styles.xml','word/numbering.xml','word/fontTable.xml','word/theme/theme1.xml','word/settings.xml']) {
    assert(generated.file(name).asNodeBuffer().equals(reference.file(name).asNodeBuffer()),`Exact native source part ${name}`);
  }
  assert(getReferenceSnapshot(input,templateXml),'Snapshot must match current material content');
  const edited = structuredClone(input);
  const entry = edited.version.resume_version_items.find(link=>link.resume_items?.item_type==='experience');
  entry.resume_items.bullets[0] += ' 更新验收';
  assert(!getReferenceSnapshot(edited,templateXml),'Edited content invalidates the old PDF');
  assert.notEqual(getReferenceContentHash(edited,templateXml),getReferenceContentHash(input,templateXml));
  const editedDoc = new PizZip(await buildResumeDocx(edited));
  assert(editedDoc.file('word/document.xml').asText().includes('更新验收'),'Updated text must reach native Word');
  assert(editedDoc.file('word/styles.xml').asNodeBuffer().equals(reference.file('word/styles.xml').asNodeBuffer()),'Edits retain source font styles');
  const hidden = structuredClone(input);
  const hiddenEntry = hidden.version.resume_version_items.find(link=>link.resume_items?.item_type==='experience');
  const hiddenTitle = hiddenEntry.resume_items.details.company;
  hiddenEntry.is_visible = false;
  assert(!new PizZip(await buildResumeDocx(hidden)).file('word/document.xml').asText().includes(hiddenTitle),'Unselected source entry is omitted');
  assert(!getReferenceSnapshot(hidden,templateXml),'Hidden entry invalidates old PDF');
  for (const [before,after] of [[['ab','cd'],'abcXd'],[['',''],'新增'],[['甲乙','丙丁'],'甲更新丁'],[['ab','cd'],''],[['ab','cd'],'abcdef']]) assert.equal(redistributeReferenceText(before,after).join(''),after);
  console.log('Exact reference checks passed: private read-back, source parts, editable runs, hidden material and PDF freshness.');
}
