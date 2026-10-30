"""Collect public Seedburo product tabs without storefront/cart markup."""
import argparse, concurrent.futures, json, pathlib, time, urllib.request
from urllib.parse import quote
from html.parser import HTMLParser
from html import escape

VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
class Node:
 def __init__(self,tag='',attrs=(),parent=None):self.tag=tag;self.attrs=dict(attrs);self.children=[];self.parent=parent
 def html(self):
  if not self.tag:return ''.join(c.html() if isinstance(c,Node) else escape(c,quote=False) for c in self.children)
  attrs=''.join(' '+k+('="'+escape(v or '',quote=True)+'"' if v is not None else '') for k,v in self.attrs.items())
  return '<'+self.tag+attrs+'>'+('' if self.tag in VOID else self.inner()+'</'+self.tag+'>')
 def inner(self):return ''.join(c.html() if isinstance(c,Node) else escape(c,quote=False) for c in self.children)
 def text(self):return ''.join(c.text() if isinstance(c,Node) else c for c in self.children)
 def walk(self):
  yield self
  for c in self.children:
   if isinstance(c,Node):yield from c.walk()
class DOM(HTMLParser):
 def __init__(self,h):
  super().__init__(convert_charrefs=True);self.root=Node();self.current=self.root;self.feed(h)
 def handle_starttag(self,tag,attrs):
  n=Node(tag,attrs,self.current);self.current.children.append(n)
  if tag not in VOID:self.current=n
 def handle_startendtag(self,tag,attrs):self.handle_starttag(tag,attrs);self.handle_endtag(tag)
 def handle_endtag(self,tag):
  node=self.current
  while node.parent:
   if node.tag==tag:self.current=node.parent;return
   node=node.parent
 def handle_data(self,s):self.current.children.append(s)

def extract_tabs(html):
 dom=DOM(html);nodes=list(dom.root.walk());titles={}
 for node in nodes:
  if node.tag=='button' and node.attrs.get('aria-controls'):
   titles[node.attrs['aria-controls']]=' '.join(node.text().split())
 return [{'title':titles.get(node.attrs.get('id'),'Product Information'),'html':node.inner()} for node in nodes if 'tab-content' in (node.attrs.get('class') or '').split() and node.inner().strip()]

if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--cache',required=True);args=ap.parse_args()
 root=pathlib.Path(args.cache);dest=root/'sections';dest.mkdir(exist_ok=True)
 products=json.loads((root/'all-products.json').read_text())
 targets=[p for p in products if (p.get('body_html') or '').strip() or p.get('images')]
 def collect(p):
  path=dest/(p['handle']+'.json')
  if path.exists():return
  for attempt in range(3):
   try:
    u=f"https://seedburo.com/products/{quote(p['handle'])}?section_id=main-product"
    with urllib.request.urlopen(u,timeout=30) as response:html=response.read().decode()
    tabs=extract_tabs(html)
    path.write_text(json.dumps({'handle':p['handle'],'sourceUrl':u,'tabs':tabs},ensure_ascii=False));return
   except Exception:
    if attempt==2:raise
    time.sleep(attempt+1)
 errors=[];n=0
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  jobs={pool.submit(collect,p):p for p in targets}
  for job in concurrent.futures.as_completed(jobs):
   try:job.result()
   except Exception as e:errors.append({'handle':jobs[job]['handle'],'error':str(e)})
   n+=1
   if n%40==0:print(json.dumps({'sections':n,'total':len(targets),'errors':len(errors)}),flush=True)
 (root/'section-errors.json').write_text(json.dumps(errors))
 print(json.dumps({'finished':True,'total':len(targets),'errors':errors}),flush=True)
