#!/usr/bin/env python3
"""Prepare a format-preserving template and private Career import payloads.

Only sanitized layout files are written to the repository. Private payloads
must go to a separate local directory and are never logged.
"""
import argparse, base64, hashlib, html, json, re
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parent.parent
REVISION='word-20260920-exact-v1'
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'
NS={'w':W}
P_RE=re.compile(r'<w:p\b[\s\S]*?</w:p>')
T_RE=re.compile(r'(<w:t\b[^>]*>)([\s\S]*?)(</w:t>)')
ROW_RE=re.compile(r'<w:tr\b[\s\S]*?</w:tr>')

def text(p):return ''.join(html.unescape(m.group(2)) for m in T_RE.finditer(p))
def dump(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2),encoding='utf-8')

def main():
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--docx',type=Path,required=True);parser.add_argument('--pdf',type=Path,required=True)
 parser.add_argument('--preview-png',type=Path,required=True);parser.add_argument('--private-output',type=Path,required=True)
 args=parser.parse_args();out=args.private_output.resolve()
 if out==ROOT or ROOT in out.parents:parser.error('Private output must be outside the repository.')
 out.mkdir(parents=True,exist_ok=True)
 archive=ZipFile(args.docx);source_xml=archive.read('word/document.xml').decode()
 raw_rows=ROW_RE.findall(source_xml)
 if len(raw_rows)!=20 or [text(raw_rows[i]) for i in [1,4,14,18]]!=['教育背景','实习/工作经历','项目经历','技能&兴趣爱好']:
  parser.error('Reference structure changed; inspect it before updating the slot map.')
 paragraphs={};counter=0
 def sanitize_paragraph(match):
  nonlocal counter
  p=match.group(0);key=f'p{len(paragraphs):03d}';slots=[];values=[]
  def replace(m):
   nonlocal counter
   slot=f'__RESUME_SLOT_{counter:04d}__';counter+=1;slots.append(slot);values.append(html.unescape(m.group(2)))
   return m.group(1)+slot+m.group(3)
  result=T_RE.sub(replace,p);paragraphs[key]={'slots':slots,'texts':values,'text':''.join(values),'xml':p,'sanitized':result}
  return result
 sanitized=P_RE.sub(sanitize_paragraph,source_xml)
 # Every paragraph's key can be recovered from its unique slot ids.
 sanitized_rows=ROW_RE.findall(sanitized)
 slot_to_key={slot:key for key,p in paragraphs.items() for slot in p['slots']}
 def pkeys(rows):
  keys=[]
  for row in rows:
   for p in P_RE.findall(sanitized_rows[row]):
    m=re.search(r'__RESUME_SLOT_\d{4}__',p)
    if m:keys.append(slot_to_key[m.group(0)])
  return keys
 manifest={'revision':REVISION,'paragraphs':{k:{'slots':v['slots']} for k,v in paragraphs.items()},'headings':{},'patterns':{}}
 for section,row in [('education',1),('experience',4),('projects',14),('skills',18)]:
  manifest['headings'][section]={'row':row,'values':{slot:value for k in pkeys([row]) for slot,value in zip(paragraphs[k]['slots'],paragraphs[k]['texts'])}}
 def pattern(key,rows,roles):
  keys=[k for k in pkeys(rows) if paragraphs[k]['slots']]
  if len(keys)!=len(roles):raise ValueError('Unexpected paragraph count in '+key)
  spec={'rows':rows,'paragraphs':[{'key':k,'role':role} for k,role in zip(keys,roles)]}
  manifest['patterns'][key]=spec
  return spec
 header=pattern('header',[0],['name','contact'])
 for i,row in enumerate([2,3]):pattern(f'education{i}',[row],['title','subtitle','summary','location','date'])
 for i,(rows,count) in enumerate([([5,6,7],5),([8,9,10],4),([11,12,13],3)]):
  pattern(f'experience{i}',rows,['title','location','subtitle','date']+[f'bullet:{j}' for j in range(count)])
 pattern('projects0',[15,16,17],['title','location','subtitle','date']+[f'bullet:{j}' for j in range(5)])
 skill_keys=[k for k in pkeys([19]) if paragraphs[k]['slots']]
 for i,key in enumerate(skill_keys):manifest['patterns'][f'skills{i}']={'rows':[19],'paragraphs':[{'key':key,'role':'skill'}]}
 source_hash=hashlib.sha256(args.docx.read_bytes()).hexdigest()
 def metadata(key):
  spec=manifest['patterns'][key]
  return {'revision':REVISION,'pattern':key,'source_sha256':source_hash,'paragraphs':[{**p,'texts':paragraphs[p['key']]['texts']} for p in spec['paragraphs']]}
 def pvalue(key,role):
  k=next(p['key'] for p in manifest['patterns'][key]['paragraphs'] if p['role']==role)
  return paragraphs[k]['text']
 def date_fields(s):
  months=re.findall(r'(20\d{2})\.(\d{2})',s)
  return {'start_date':f'{months[0][0]}-{months[0][1]}-01' if months else None,'end_date':f'{months[1][0]}-{months[1][1]}-01' if len(months)>1 else None,'is_current':'至今' in s}
 def payload(kind,key,index):
  roles={p['role']:pvalue(key,p['role']) for p in manifest['patterns'][key]['paragraphs']}
  title=roles.get('title','');subtitle=roles.get('subtitle','');summary=roles.get('summary');details={}
  if kind=='education':details={'school':title,'resume_subtitle':subtitle}
  if kind=='experience':details={'company':title,'resume_subtitle':subtitle}
  if kind=='project':details={'project_name':title,'resume_subtitle':subtitle}
  dates=date_fields(roles.get('date',''))
  meta=metadata(key);meta['dates']={**dates,'text':roles.get('date','')}
  details['_resume_source']=meta
  return {'item_type':kind,'title':title.strip(),'organization':title.strip() if kind!='project' else None,'role_title':subtitle.strip() or None,'location':roles.get('location','').strip() or None,**dates,'summary':summary.strip() if summary else None,'bullets':[v.strip() for k,v in roles.items() if k.startswith('bullet:')],'skills':[],'tags':['中文原版20261018',key],'details':details,'sort_order':index,'is_featured':False,'related_project_id':None,'related_publication_id':None,'related_knowledge_id':None,'related_skill_id':None}
 name=pvalue('header','name');contact=pvalue('header','contact')
 email=re.search(r'[A-Za-z0-9_.+-]+@[A-Za-z0-9.-]+',contact).group(0)
 phone=re.search(r'电话[:：]\s*(.*?)\s*\|',contact).group(1)
 photo=next(n for n in archive.namelist() if n.startswith('word/media/') and n.endswith('.jpeg'))
 basic_meta=metadata('header');basic_meta['profile']={'name':name,'phone':phone,'email':email}
 basic_meta['reference_snapshot_hash']=hashlib.sha256(source_xml.encode()+('data:image/jpeg;base64,'+base64.b64encode(archive.read(photo)).decode()).encode()).hexdigest()
 basic_meta['pdf_data_url']='data:application/pdf;base64,'+base64.b64encode(args.pdf.read_bytes()).decode()
 basic_meta['preview_data_url']='data:image/png;base64,'+base64.b64encode(args.preview_png.read_bytes()).decode()
 basic={'item_type':'basic','title':'中文简历原版个人信息 · 20261018','organization':None,'role_title':None,'location':None,'start_date':None,'end_date':None,'is_current':False,'summary':None,'bullets':[],'skills':[],'tags':['中文原版20261018','header'],'details':{'name':name,'phone':phone,'email':email,'photo_url':'data:image/jpeg;base64,'+base64.b64encode(archive.read(photo)).decode(),'_resume_source':basic_meta},'sort_order':0,'is_featured':False,'related_project_id':None,'related_publication_id':None,'related_knowledge_id':None,'related_skill_id':None}
 records=[('header','summary',basic)]
 for i in range(2):records.append((f'education{i}','education',payload('education',f'education{i}',i)))
 for i in range(3):records.append((f'experience{i}','experience',payload('experience',f'experience{i}',i)))
 records.append(('projects0','projects',payload('project','projects0',0)))
 for i in range(4):
  key=f'skills{i}';line=pvalue(key,'skill');clean=re.sub(r'^[•·\s]+','',line);parts=re.split(r'[:：]',clean,maxsplit=1);label=parts[0].strip();body=parts[1].strip() if len(parts)>1 else ''
  row=payload('skill',key,i);row.update(title=label,summary=body);row['details']['skill_category']=label
  row['details']['_resume_source']['skill']={'title':label,'summary':body}
  records.append((key,'skills',row))
 for key,_,record in records:dump(out/(key+'.json'),record)
 dump(out/'import-plan.json',{'revision':REVISION,'records':[{'key':k,'section':s,'file':k+'.json'} for k,s,_ in records],'docx_sha256':source_hash,'pdf_sha256':hashlib.sha256(args.pdf.read_bytes()).hexdigest()})
 # Copy layout parts byte-for-byte; remove all source personal data and media.
 allowed={'word/document.xml','word/styles.xml','word/numbering.xml','word/theme/theme1.xml','word/settings.xml','word/webSettings.xml','word/fontTable.xml','word/footnotes.xml','word/endnotes.xml'}
 allowed.update(n for n in archive.namelist() if re.fullmatch(r'word/(header|footer)\d+\.xml',n))
 files={n:archive.read(n) for n in allowed};files['word/document.xml']=sanitized.encode()
 rels=archive.read('word/_rels/document.xml.rels').decode()
 def relationship(m):
  xml=m.group(0);target=re.search(r'\bTarget="([^"]*)"',xml);id_=re.search(r'\bId="([^"]*)"',xml)
  if id_ and id_.group(1)=='rId11':return re.sub(r'\bTarget="[^"]*"','Target="media/resume-photo-placeholder.png"',xml)
  return xml if target and 'word/'+target.group(1) in allowed and 'TargetMode="External"' not in xml else ''
 files['word/_rels/document.xml.rels']=re.sub(r'<Relationship\b[^>]*/>',relationship,rels)
 files['word/media/resume-photo-placeholder.png']=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=')
 files['_rels/.rels']=b'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'
 types=archive.read('[Content_Types].xml').decode()
 types=re.sub(r'<Override\b[^>]*/>',lambda m:m.group(0) if re.search(r'PartName="([^"]+)"',m.group(0)).group(1).lstrip('/') in files else '',types)
 if 'Extension="png"' not in types:types=types.replace('</Types>','<Default Extension="png" ContentType="image/png"/></Types>')
 files['[Content_Types].xml']=types.encode()
 template=ROOT/'src/templates/resume/20261018-reference-template.docx'
 with ZipFile(template,'w',ZIP_DEFLATED) as z:
  for n,content in files.items():z.writestr(n,content)
 dump(ROOT/'src/templates/resume/20261018-reference-layout.json',manifest)
 print('Prepared sanitized native layout and',len(records),'private structured records. No source content logged.')
 print('Source SHA-256:',source_hash)

if __name__=='__main__':main()
