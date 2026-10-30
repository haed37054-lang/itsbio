"""Download public Seedburo product and collection snapshots; never requires credentials."""
import argparse,concurrent.futures,json,pathlib,time,urllib.request,re
from urllib.parse import urlsplit

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--cache',required=True);args=ap.parse_args()
 root=pathlib.Path(args.cache);root.mkdir(parents=True,exist_ok=True)
 def get(url):
  for attempt in range(3):
   try:
    with urllib.request.urlopen(url,timeout=30) as r:return r.read()
   except Exception:
    if attempt==2:raise
    time.sleep(attempt+1)
 for kind in ['products','collections']:
  rows=[];page=1
  while True:
   path=root/(kind+('' if page==1 else '-'+str(page))+'.json')
   if not path.exists():path.write_bytes(get(f'https://seedburo.com/{kind}.json?limit=250&page={page}'))
   batch=json.loads(path.read_text())[kind];rows.extend(batch)
   if len(batch)<250:break
   page+=1
  if len({row['id'] for row in rows})!=len(rows):raise RuntimeError('Duplicate source records: '+kind)
  (root/f'all-{kind}.json').write_text(json.dumps(rows,ensure_ascii=False))
 (root/'home.txt').write_bytes(get('https://seedburo.com/'))
 import xml.etree.ElementTree as ET
 sitemap=get('https://seedburo.com/sitemap.xml')
 (root/'sitemap.txt').write_bytes(sitemap)
 ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
 product_maps=[e.text for e in ET.fromstring(sitemap).findall('s:sitemap/s:loc',ns) if 'sitemap_products_' in e.text]
 for index,url in enumerate(product_maps,1):
  (root/f'product-sitemap-{index}.xml').write_bytes(get(url))

 products=json.loads((root/'all-products.json').read_text());known={p['id'] for p in products}
 cols=json.loads((root/'all-collections.json').read_text());dest=root/'memberships';dest.mkdir(exist_ok=True)
 known_collections={c['handle'] for c in cols}
 home=(root/'home.txt').read_text()
 referenced=set(re.findall(r'href=[\'\"](?:https://seedburo.com)?/collections/([^\'\"?#/]+)',home))
 aliases={}
 for handle in sorted(referenced-known_collections-{'all'}):
  with urllib.request.urlopen('https://seedburo.com/collections/'+handle,timeout=30) as response:
   canonical=urlsplit(response.url).path.rstrip('/').split('/')[-1]
  if canonical in known_collections:aliases[handle]=canonical
 (root/'navigation-aliases.json').write_text(json.dumps(aliases))

 def collect(c):
  path=dest/(c['handle']+'.json')
  if path.exists() or not c['products_count'] or c['handle'].startswith('price-code-') or c['handle']=='all':return
  ids=[];page=1
  while True:
   data=json.loads(get(f"https://seedburo.com/collections/{c['handle']}/products.json?limit=250&page={page}"))['products']
   ids.extend(p['id'] for p in data if p['id'] in known)
   if len(data)<250:break
   page+=1
  path.write_text(json.dumps({'id':c['id'],'handle':c['handle'],'productIds':list(dict.fromkeys(ids)),'publicCount':len(set(ids)),'sourceReportedCount':c['products_count']}))
 errors=[];n=0
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  jobs={pool.submit(collect,c):c for c in cols}
  for job in concurrent.futures.as_completed(jobs):
   try:job.result()
   except Exception as e:errors.append({'handle':jobs[job]['handle'],'error':str(e)})
   n+=1
   if n%25==0:print(json.dumps({'collections':n,'total':len(cols),'errors':len(errors)}),flush=True)
 (root/'collection-errors.json').write_text(json.dumps(errors))
 print(json.dumps({'products':len(products),'collections':len(cols),'errors':errors}),flush=True)
if __name__=='__main__':main()
