"""Snapshot the visible Seedburo recommendation block, including its source fallback rule."""
import argparse, concurrent.futures, datetime, json, pathlib, re, time, urllib.request
from urllib.parse import quote, urljoin, urlsplit, unquote, parse_qs
from collect_seedburo_sections import DOM

DEFAULT_SECTION = 'template--23140037886007__product_recommendation_fallback_8GnrBD'

def extract_recommendations(html):
    blocks = [node for node in DOM(html).root.walk() if node.tag == 'globo-product-recommendations']
    for block in blocks:
        headings = [n for n in block.walk() if n.tag == 'h2']
        heading = ' '.join(headings[0].text().split()) if headings else ''
        if heading not in ['Customers who bought this item also bought', 'Best sellers']:
            continue
        items = []
        for title in block.walk():
            if 'spf-product-card__title' not in (title.attrs.get('class') or '').split():
                continue
            for link in title.walk():
                if link.tag != 'a' or not link.attrs.get('href'):
                    continue
                url = urlsplit(urljoin('https://seedburo.com', link.attrs['href']))
                if url.hostname not in ['seedburo.com', 'www.seedburo.com'] or '/products/' not in url.path:
                    raise ValueError('Unexpected recommendation link: '+link.attrs['href'])
                item = {'handle': unquote(url.path.split('/products/', 1)[1].strip('/'))}
                variant = parse_qs(url.query).get('variant', [''])[0]
                if variant:
                    item['variantId'] = variant
                if item not in items:
                    items.append(item)
        if items:
            # The source hides Best sellers when the first block contains cards.
            return {'heading': heading, 'kind': 'bought-together' if heading.startswith('Customers') else 'best-sellers', 'items': items}
    return {'heading': '', 'kind': 'none', 'items': []}

def request(url):
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url, timeout=40) as response:
                return response.read().decode()
        except Exception:
            if attempt == 2:
                raise
            time.sleep(attempt+1)

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--cache', required=True); args=ap.parse_args()
    root=pathlib.Path(args.cache); root.mkdir(parents=True, exist_ok=True)
    cache=root/'recommendations'; cache.mkdir(exist_ok=True)
    data=pathlib.Path(__file__).resolve().parent.parent/'data'/'seedburo'
    catalog=json.loads((data/'catalog.json').read_text())
    def collect(product):
        path=cache/(product['handle']+'.json')
        if path.exists():
            return json.loads(path.read_text())
        url='https://seedburo.com/products/'+quote(product['handle'])
        section_url=url+'?section_id='+DEFAULT_SECTION
        try:
            html=request(section_url)
        except Exception:
            html=''
        if 'globo-product-recommendations' not in html:
            html=request(url)
            if 'section-product-rec-fallback' not in html:
                raise ValueError('Source recommendation section could not be located')
        result={'sourceUrl':url, **extract_recommendations(html)}
        path.write_text(json.dumps(result, ensure_ascii=False))
        return result
    results={}; errors=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        jobs={pool.submit(collect,p):p for p in catalog}
        for job in concurrent.futures.as_completed(jobs):
            product=jobs[job]
            try: results[product['handle']]=job.result()
            except Exception as error: errors.append({'handle':product['handle'],'error':str(error)})
            done=len(results)+len(errors)
            if done%50==0: print(json.dumps({'checked':done,'total':len(catalog),'errors':len(errors)}),flush=True)
    known={p['handle'] for p in catalog}
    unknown=sorted({item['handle'] for result in results.values() for item in result['items'] if item['handle'] not in known})
    report={'source':'https://seedburo.com/','collectedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'checkedProducts':len(results),'boughtTogetherProducts':sum(r['kind']=='bought-together' for r in results.values()),'fallbackProducts':sum(r['kind']=='best-sellers' for r in results.values()),'emptyProducts':sum(not r['items'] for r in results.values()),'relations':sum(len(r['items']) for r in results.values()),'unknownTargets':unknown,'errors':errors}
    (root/'recommendations-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    if errors or unknown:
        raise RuntimeError(json.dumps(report))
    (data/'recommendations.json').write_text(json.dumps(dict(sorted(results.items())),ensure_ascii=False,separators=(',',':'))+'\n')
    (data/'recommendations-report.json').write_text(json.dumps(report,ensure_ascii=False,separators=(',',':'))+'\n')
    print(json.dumps(report),flush=True)
if __name__=='__main__': main()
