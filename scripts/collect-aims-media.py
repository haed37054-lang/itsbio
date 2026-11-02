"""Collect exact public AIMS image, brochure and video references for the three reviewed systems."""
import concurrent.futures, datetime, hashlib, io, json, pathlib, re, sys, urllib.request
from urllib.parse import urlsplit, urlunsplit
from PIL import Image
from collect_seedburo_sections import DOM
root=pathlib.Path(sys.argv[1]);root.mkdir(parents=True,exist_ok=True);out=pathlib.Path(__file__).resolve().parent.parent/'data'/'aims';out.mkdir(parents=True,exist_ok=True)
products={};assets=set()
def canonical(url):
 u=urlsplit(url);return urlunsplit(('https','animalid.com',u.path,u.query,''))
for slug in ['ats-3','neo-9','ats-3l']:
 page='https://animalid.com/portfolio/'+{'ats-3':'ats-3-general-rodent-tattoo-system','neo-9':'neo-9-neonate-rodent-tattooing-system','ats-3l':'ats-3l-large-animal-tattoo-system'}[slug]+'/'
 if not (root/(slug+'.html')).exists():
  with urllib.request.urlopen(page,timeout=40) as response:(root/(slug+'.html')).write_bytes(response.read())
 dom=DOM((root/(slug+'.html')).read_text());nodes=list(dom.root.walk())
 content=next(n for n in nodes if 'entry-content' in n.attrs.get('class','').split())
 images=[n for n in content.walk() if n.tag=='img']
 def largest(n):
  entries=re.findall(r'(https://[^,\s]+)\s+(\d+)w',n.attrs.get('srcset',''))
  return canonical(max(entries,key=lambda x:int(x[1]))[0] if entries else n.attrs['src'])
 primary=largest(images[0]);gallery=[]
 for n in nodes:
  if n.tag=='a' and re.match(r'https://(?:new\.)?animalid.com/wp-content/uploads/.*\.(jpg|jpeg|png)$',n.attrs.get('href',''),re.I):
   u=canonical(n.attrs['href'])
   if u!=primary and u not in gallery:gallery.append(u)
 for n in images[1:]:
  u=largest(n)
  if u!=primary and u not in gallery:gallery.append(u)
 brochures=list(dict.fromkeys(canonical(n.attrs['href']) for n in content.walk() if n.tag=='a' and re.match(r'https://(?:new\.)?animalid.com/wp-content/uploads/.*\.pdf$',n.attrs.get('href',''))))
 videos=list(dict.fromkeys(canonical(n.attrs['src']) for n in content.walk() if n.tag in ['video','source'] and n.attrs.get('src','').endswith('.mp4')))
 products[slug]={'sourceUrl':'https://animalid.com/portfolio/'+{'ats-3':'ats-3-general-rodent-tattoo-system','neo-9':'neo-9-neonate-rodent-tattooing-system','ats-3l':'ats-3l-large-animal-tattoo-system'}[slug]+'/','image':primary,'gallery':gallery,'brochures':brochures,'videos':videos}
 assets.update([primary,*gallery,*brochures,*videos])
checks={}
def verify(url):
 req=urllib.request.Request(url,method='HEAD' if url.endswith(('.pdf','.mp4')) else 'GET')
 with urllib.request.urlopen(req,timeout=45) as r:
  row={'status':r.status,'contentType':r.headers.get('Content-Type',''),'size':r.headers.get('Content-Length','')}
  if req.method=='GET':
   b=r.read();im=Image.open(io.BytesIO(b));row.update({'width':im.width,'height':im.height,'sha256':hashlib.sha256(b).hexdigest()})
 return url,row
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
 for url,row in pool.map(verify,sorted(assets)):checks[url]=row
assert all(x['status']==200 for x in checks.values())
for p in products.values():
 p['images']=[{'url':p['image'],'width':checks[p['image']]['width'],'height':checks[p['image']]['height']}]
 p['gallery']=[{'url':u,'width':checks[u]['width'],'height':checks[u]['height']} for u in p['gallery']]
report={'collectedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'products':3,'upgrades':['NEO-AP','LLA-AP'],'assets':checks}
(root/'media.json').write_text(json.dumps(products,ensure_ascii=False,indent=2))
(out/'source-media.json').write_text(json.dumps(products,ensure_ascii=False,separators=(',',':'))+'\n')
(out/'media-checks.json').write_text(json.dumps(report,ensure_ascii=False,separators=(',',':'))+'\n')
print(json.dumps({'assets':len(checks),'products':{k:{'gallery':len(v['gallery']),'brochures':len(v['brochures']),'videos':len(v['videos'])} for k,v in products.items()}}),flush=True)
