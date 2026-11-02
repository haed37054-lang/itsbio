"""Validate source photo URLs; no missing images are substituted."""
import pathlib,json,urllib.request,concurrent.futures,time,argparse
ap=argparse.ArgumentParser();ap.add_argument('--cache',required=True);args=ap.parse_args()
root=pathlib.Path(args.cache);products=json.loads((root/'all-products.json').read_text())
urls=sorted(set(img['src'] for p in products for img in p['images']))
path=root/'image-checks.json';done=json.loads(path.read_text()) if path.exists() else {}
def check(url):
 if url in done and done[url].get('status')==200:return url,done[url]
 for attempt in range(2):
  try:
   req=urllib.request.Request(url,method='HEAD')
   with urllib.request.urlopen(req,timeout=20) as r:result={'status':r.status,'contentType':r.headers.get('Content-Type','')}
   return url,result
  except Exception as e:
   if attempt==1:return url,{'error':str(e)}
   time.sleep(1)
n=0
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
 for url,result in pool.map(check,urls):
  done[url]=result;n+=1
  if n%80==0:
   path.write_text(json.dumps(done));print(json.dumps({'imagesChecked':n,'total':len(urls),'failed':sum(x.get('status')!=200 for x in done.values())}),flush=True)
path.write_text(json.dumps(done))
print(json.dumps({'finished':True,'checked':len(done),'failed':[{'url':u,**v} for u,v in done.items() if v.get('status')!=200 or not v.get('contentType','').startswith('image/')]}),flush=True)
