"""Build a price-free, source-linked Seedburo catalog from public snapshots."""
import argparse,json,pathlib,re,datetime,html,hashlib
from urllib.parse import urlsplit,urljoin
from collect_seedburo_sections import DOM,Node

def plain(value):return re.sub(r'\s+',' ',html.unescape(re.sub('<[^>]*>',' ',value or ''))).strip()
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--cache',required=True);args=ap.parse_args()
 root=pathlib.Path(args.cache);out=pathlib.Path(__file__).resolve().parent.parent/'data'/'seedburo';out.mkdir(exist_ok=True)
 raw=json.loads((root/'all-products.json').read_text());rawcols=json.loads((root/'all-collections.json').read_text())
 import xml.etree.ElementTree as ET
 from urllib.parse import unquote
 source_record_count=len(raw)
 namespace={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
 canonical=set()
 for sitemap in root.glob('product-sitemap-*.xml'):
  canonical.update(unquote(e.text.rsplit('/',1)[-1]) for e in ET.fromstring(sitemap.read_text()).findall('s:url/s:loc',namespace) if '/products/' in e.text)
 if not canonical:raise RuntimeError('A current public product sitemap is required')
 public_ids=set()
 for membership in (root/'memberships').glob('*.json'):public_ids.update(json.loads(membership.read_text())['productIds'])
 raw=[p for p in raw if p['handle'] in canonical or p['id'] in public_ids]
 if not canonical.issubset({p['handle'] for p in raw}):raise RuntimeError('A canonical product is absent from the source snapshot')
 home=(root/'home.txt').read_text();menu=re.search(r'<script type="template/html" id="globoMenu\d+HTML">(.*?)</script>',home,re.S).group(1)
 menu=menu[:menu.find('title="Crops"')]
 productblock=menu[:menu.find('title="Product Phases"')]
 phasestart=menu.find('title="Product Phases"');phaseblock=menu[phasestart:menu.find('title="Crops"') if 'title="Crops"' in menu else len(menu)]
 def links(block):
  found=[]
  for m in re.finditer(r'<a\b[^>]*href=[\'\"]([^\'\"]*/collections/([^\'\"?#/]+))[^\'\"]*[\'\"][^>]*>(.*?)</a>',block,re.S):
   if m.group(2) not in {x['handle'] for x in found}:found.append({'handle':m.group(2),'title':plain(m.group(3))})
  return found
 navigation=links(productblock);phases=[x for x in links(phaseblock) if x['handle'] in ['sample','sort','test','grade']]
 aliases=json.loads((root/'navigation-aliases.json').read_text()) if (root/'navigation-aliases.json').exists() else {}
 for item in navigation+phases:item['handle']=aliases.get(item['handle'],item['handle'])
 known={p['handle'] for p in raw};productids={p['id']:p['handle'] for p in raw}
 collections=[]
 for c in rawcols:
  if c['handle'].startswith('price-code-') or not c['products_count'] or c['handle']=='all':continue
  f=root/'memberships'/(c['handle']+'.json')
  if not f.exists():raise RuntimeError('Missing collection snapshot '+c['handle'])
  membership=json.loads(f.read_text());handles=[productids[i] for i in membership['productIds'] if i in productids]
  if not handles:continue
  image=(c.get('image') or {}).get('src') or ''
  collections.append({'handle':c['handle'],'title':c['title'],'sourceUrl':'https://seedburo.com/collections/'+c['handle'],'description':plain(c.get('description')),'image':image,'productHandles':handles,'count':len(handles)})
 knowncols={c['handle'] for c in collections}
 memberships={p['handle']:[] for p in raw}
 for c in collections:
  for handle in c['productHandles']:memberships[handle].append(c['handle'])
 allowed={'p','div','span','br','strong','b','em','i','u','s','sup','sub','ul','ol','li','h2','h3','h4','h5','h6','table','thead','tbody','tfoot','tr','th','td','caption','a','img','iframe','video','source','hr','blockquote'}
 banned={'script','style','form','button','input','select','noscript','object','svg'}
 def clean_content(rawhtml):
  dom=DOM(rawhtml)
  def render(n):
   if isinstance(n,str):return html.escape(re.sub(r'\$\s*[\d,]+(?:\.\d{2})?','',n),quote=False)
   if n.tag in banned:return ''
   inside=''.join(render(c) for c in n.children)
   if not n.tag or n.tag not in allowed:return inside
   a=n.attrs;attrs={}
   if n.tag=='a':
    href=urljoin('https://seedburo.com/',a.get('href') or '')
    u=urlsplit(href)
    if u.scheme not in ['https','http','mailto','tel'] or re.search(r'/(cart|account|checkout)(?:/|$)',u.path):return inside
    handle=u.path.split('/products/',1)[-1].split('/')[0] if '/products/' in u.path else ''
    col=u.path.split('/collections/',1)[-1].split('/')[0] if '/collections/' in u.path else ''
    if u.hostname in ['seedburo.com','www.seedburo.com'] and handle in known:href='/products/seedburo/item/'+handle
    elif u.hostname in ['seedburo.com','www.seedburo.com'] and col in knowncols:href='/products/seedburo/'+col
    elif u.hostname in ['seedburo.com','www.seedburo.com'] and u.path=='/collections/all':href='/products/seedburo/all-products'
    if not href.startswith('/products/seedburo/'):
     attrs.update({'target':'_blank','rel':'noopener noreferrer'})
    attrs['href']=href
   if n.tag in ['img','iframe','video','source']:
    src=urljoin('https://seedburo.com/',a.get('src') or '')
    u=urlsplit(src)
    if u.scheme!='https':return ''
    if n.tag=='img':
     if re.search(r'made.?in.?usa|made_in_usa|logo|flag|banner|badge',src,re.I):return ''
     if u.hostname not in ['cdn.shopify.com','seedburo.com','www.seedburo.com']:return ''
     attrs.update({'src':src,'alt':a.get('alt') or '', 'loading':'lazy','decoding':'async'})
    elif n.tag=='iframe':
     if u.hostname not in ['www.youtube.com','youtube.com','www.youtube-nocookie.com','player.vimeo.com','online.fliphtml5.com','fliphtml5.com']:return ''
     attrs.update({'src':src,'title':a.get('title') or 'Product media','loading':'lazy','allowfullscreen':'','class':'seedburo-embed'})
    else:attrs.update({'src':src,'controls':'','preload':'metadata'})
   if n.tag in ['td','th']:
    for key in ['colspan','rowspan']:
     if str(a.get(key,'')).isdigit():attrs[key]=a[key]
   astr=''.join(' '+k+'="'+html.escape(str(v),quote=True)+'"' for k,v in attrs.items())
   return '<'+n.tag+astr+'>'+('' if n.tag in ['img','br','hr','source'] else inside+'</'+n.tag+'>')
  return ''.join(render(c) for c in dom.root.children).strip()
 products=[];tabcount=0
 for p in raw:
  images=[{'url':x['src'],'alt':x.get('alt') or p['title'],'width':x.get('width') or 1000,'height':x.get('height') or 1000} for x in p['images'] if x.get('src')]
  variants=[{'id':str(v['id']),'title':v['title'],'sku':(v.get('sku') or '').strip(),'options':[v.get('option1'),v.get('option2'),v.get('option3')],'image':(v.get('featured_image') or {}).get('src') or ''} for v in p['variants']]
  sectionfile=root/'sections'/(p['handle']+'.json');tabs=[]
  if sectionfile.exists():
   tabs=[{'title':t['title'],'html':clean_content(t['html'])} for t in json.loads(sectionfile.read_text())['tabs']]
  elif p.get('images') or (p.get('body_html') or '').strip():raise RuntimeError('Missing product tabs '+p['handle'])
  description=clean_content(p.get('body_html') or '')
  if tabs and tabs[0]['title'].lower() in ['product description','description']:description=tabs.pop(0)['html']
  tabs=[t for t in tabs if plain(t['html']) or re.search(r'<(?:iframe|img|video)',t['html'])]
  tabcount+=len(tabs)
  products.append({'id':str(p['id']),'handle':p['handle'],'title':p['title'],'vendor':p['vendor'],'sourceUrl':'https://seedburo.com/products/'+p['handle'],'summary':plain(description)[:240],'descriptionHtml':description,'images':images,'variants':variants,'optionNames':[o['name'] for o in p['options']],'categoryHandles':memberships[p['handle']],'tabs':tabs})
 products.sort(key=lambda p:p['title'].casefold())
 # Public catalog records are counted separately from unpublished collection totals.
 report={'source':'https://seedburo.com/','collectedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceRecords':source_record_count,'sourceProductPages':len(canonical),'products':len(products),'variants':sum(len(p['variants']) for p in products),'collections':len(collections),'productsWithGallery':sum(bool(p['images']) for p in products),'productsWithoutGallery':sum(not p['images'] for p in products),'additionalTabs':tabcount,'collectionErrors':json.loads((root/'collection-errors.json').read_text()),'sectionErrors':json.loads((root/'section-errors.json').read_text())}
 imagechecks=json.loads((root/'image-checks.json').read_text()) if (root/'image-checks.json').exists() else {}
 imageurls={image['url'] for product in products for image in product['images']}
 verified=sum(imagechecks.get(url,{}).get('status')==200 and imagechecks.get(url,{}).get('contentType','').startswith('image/') for url in imageurls)
 report['gallerySourceUrls']=len(imageurls)
 report['verifiedGallerySourceUrls']=verified
 report['unverifiedGallerySourceUrls']=len(imageurls)-verified
 if report['collectionErrors'] or report['sectionErrors']:raise RuntimeError('Source collection has failures')
 for filename,data in [('catalog.json',products),('collections.json',collections),('navigation.json',{'categories':navigation,'phases':phases}),('migration-report.json',report)]:
  (out/filename).write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
 print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
