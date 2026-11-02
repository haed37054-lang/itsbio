import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { load } from 'cheerio';
import sanitize from 'sanitize-html';
import sharp from 'sharp';

const origin = 'https://affinityimmuno.com';
const out = 'data/affinityimmuno';
const cache = '.cache/affinity/pages';
await fs.mkdir(cache, {recursive: true});
await fs.mkdir('public/affinityimmuno', {recursive: true});
const input = JSON.parse(await fs.readFile(`${out}/workbook-input.json`, 'utf8'));
const clean = (s = '') => String(s).normalize('NFC').replace(/\u00a0/g, ' ').replace(/^'(?=-?\d)/, '').trim();
const text = (s = '') => clean(s).replace(/\s+/g, ' ');
const present = s => s && !/^(n\/?a[p]?|not applicable)$/i.test(text(s));
const absolute = u => new URL(u, origin).href.replace(/^http:/, 'https:');
const slug = s => text(s).toLowerCase().replace(/[^a-z0-9-]/g, '-');
const errors = [];
const assetCache = new Map();
async function page(url) {
  const file = path.join(cache, crypto.createHash('sha256').update(url).digest('hex') + '.json');
  try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch {}
  try {
    const r = await fetch(url, {signal: AbortSignal.timeout(25000)});
    const result = {url: r.url, status: r.status, html: await r.text()};
    await fs.writeFile(file, JSON.stringify(result));
    return result;
  } catch (e) { return {url, status: 0, html: '', error: e.message}; }
}
async function asset(url, image = false) {
  url = absolute(url);
  if (assetCache.has(url)) return assetCache.get(url);
  const promise = (async () => {
    try {
      const hash = crypto.createHash('sha256').update(url).digest('hex').slice(0,16);
      const ext = image ? path.extname(new URL(url).pathname).toLowerCase() || '.jpg' : '.pdf';
      const local = `/affinityimmuno/${hash}${ext}`;
      let data;
      try {data = await fs.readFile(`public${local}`);} catch {
        const r = await fetch(url, {signal: AbortSignal.timeout(25000)});
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        data = Buffer.from(await r.arrayBuffer());
      }
      if (!image && !data.subarray(0,5).equals(Buffer.from('%PDF-'))) throw new Error('Not a PDF');
      let dimensions = {};
      if (image) {const m = await sharp(data).metadata(); if (!m.width || !m.height) throw new Error('Not an image'); dimensions = {width:m.width, height:m.height};}
      await fs.writeFile(`public${local}`,data);
      return {url:local, sourceUrl:url, ...dimensions};
    } catch (e) { errors.push({asset:url,error:e.message});return null; }
  })();
  assetCache.set(url, promise);
  return promise;
}

const sourceMap = new Map();
for (const category of ['antibodies', 'elisas']) {
  const result = await page(`${origin}/product-category/${category}/`);
  if (result.status !== 200) throw new Error(`Category fetch failed: ${category}`);
  const $ = load(result.html);
  $('.product-row').each((_, el) => {
    const sku = text($(el).attr('data-catalog-number')).toLowerCase();
    const href = $(el).find('a[href*="/product/"]').attr('href');
    if (sku && href && !sourceMap.has(sku)) sourceMap.set(sku, absolute(href));
  });
}
const extra = {
  'ab-131-437': '/product/ab-131-437-human-igg3-isotype-control/',
  'ab-131-430': '/product/mouse-igg1-isotype-control-2/',
  'ab-131-295-pair': '/product/covid-19-spike-capture-and-detection-hrp-conjugate-elisa-pair-with-calibrator/',
  'ab-131-294': '/product/affinity-purified-sars-cov-2-spike-s2-domain-antibody/',
  'ab-131-294-hrp': '/product/hrp-conjugated-affinity-purified-sars-cov-2-spike-s2-domain-antibody/',
  'ab-131-294-gold': '/product/gold-conjugated-affinity-purified-sars-cov-2-spike-s2-domain-antibody/',
  'ab-131-296': '/product/affinity-purified-sars-cov-2-covid-19-2019-ncov-nucleocapsid-antibody/',
};
const knownHref = new Map(input.records.map(r => [text(r.fields.A).toLowerCase(), `/products/affinity/item/${slug(r.fields.A)}`]));
const internal = new Map([...sourceMap].filter(([sku]) => knownHref.has(sku)).map(([sku,url]) => [new URL(url).pathname,knownHref.get(sku)]));
const categories = [
  ['elisas','ELISA Kits','', 'elisa'],
  ['pharmacokinetic-elisas','Pharmacokinetic ELISAs','elisas','elisa'],
  ['immunogenicity-elisas','Immunogenicity / ADA ELISAs','elisas','elisa'],
  ['antibodies','Antibodies','','antibody'],
  ['human-targets','Human Targets','antibodies','antibody'],
  ['mouse-targets','Mouse Targets','antibodies','antibody'],
  ['anti-idiotype','Anti-Idiotype Antibodies','antibodies','antibody'],
  ['biosimilars','Biosimilars','antibodies','antibody'],
  ['isotype-controls','Isotype Controls','antibodies','antibody'],
  ['covid-19','COVID-19 Research Products','',''],
].map(([slug,title,parent,kind])=>({slug,title,parent,kind}));
const elisaSpec = {F:'Size',G:'Storage',H:'Antigen',I:'Reactivity',J:'Detection range',K:'Detection minimum',N:'Method',O:'Detection method',P:'Application',Q:'Plate format',R:'Sample type',S:'Sample volume',T:'Assay time',U:'Specificity',V:'Assay precision',W:'Preservative',X:'Characteristics',Z:'Gene ID',AA:'Swiss-Prot',AB:'NCBI accession',AC:'Molecular weight'};
const antibodySpec = {C:'Antibody target',F:'Application',G:'Size',H:'Storage',I:'Target protein',J:'Alternative names',K:'Clone',M:'Clonality',N:'Isotype',O:'Host species',P:'Target species',Q:'Formulation',R:'Concentration'};
const conflicts = [];
const results = [];
let completed = 0;
async function collect(record) {
  const f = record.fields, sku = text(f.A), key = sku.toLowerCase(), kind = record.kind;
  const candidate = sourceMap.get(key) || (extra[key] ? absolute(extra[key]) : kind === 'elisa' && f.AJ?.includes('/product/') ? absolute(f.AJ) : '');
  const result = candidate ? await page(candidate) : null;
  const $ = load(result?.html || '');
  let pageSku = text($('.catalog-number').text()).replace(/^Cat\.?\s*No\s*:\s*/i,'');
  if (!pageSku) {
    for (const el of $('script[type="application/ld+json"]').toArray()) {
      try {const ld=JSON.parse($(el).text());if(ld.sku) pageSku=text(ld.sku);} catch {}
    }
  }
  const verified = result?.status === 200 && pageSku.toLowerCase() === key;
  if (!verified) errors.push({sku,sourcePage:candidate,status:result?.status || 0,reason:'No current page with matching Cat.No; workbook retained'});
  const fields = Object.entries(kind === 'elisa' ? elisaSpec : antibodySpec).filter(([k])=>present(f[k])).map(([k,label])=>[label,clean(f[k])]);
  const fieldMap = new Map(fields);
  if (verified) $('.spec-table tr').each((_,el)=>{
    const label=text($(el).find('th').text()), value=clean($(el).find('td').text());
    if (!label || !present(value)) return;
    const existing = [...fieldMap.keys()].find(k=>k.toLowerCase()===label.toLowerCase());
    if (existing && text(fieldMap.get(existing)) !== text(value)) conflicts.push({sku,field:label,workbook:fieldMap.get(existing),website:value});
    if (!existing) fieldMap.set(label,value);
  });
  const safety = verified ? text($('.safety-warning').text()).replace(/^Safety Warning:\s*/i,'') : '';
  if (safety) fieldMap.set('Safety warning',safety);
  const groups = [kind === 'elisa' ? 'elisas' : 'antibodies'];
  if (kind === 'elisa') {
    if (/pharmacokinetic/i.test(f.B)) groups.push('pharmacokinetic-elisas');
    else if (/ADA|immunogenicity|anti-peg/i.test(f.B)) groups.push('immunogenicity-elisas');
  } else {
    if (/human/i.test(f.P || '')) groups.push('human-targets');
    if (/mouse/i.test(f.P || '')) groups.push('mouse-targets');
    if (/anti-idiotype/i.test(f.L || '')) groups.push('anti-idiotype');
    if (/biosimilar/i.test(f.L || '')) groups.push('biosimilars');
    if (/isotype control/i.test(f.L || '')) groups.push('isotype-controls');
  }
  if (/covid|sars-cov/i.test(`${f.B} ${f.L || ''}`)) groups.push('covid-19');
  const images=[];const documents=[];
  let descriptionHtml='';
  if (verified) {
    const body=$('.product-body').clone();
    for(const el of body.find('img').toArray()) {
      const u=$(el).attr('src');
      if (!u || /generic|placeholder|logo|banner/i.test(u)) {$(el).remove();continue;}
      const saved=await asset(u,true);
      if(saved) {images.push({...saved,alt:text($(el).attr('alt')) || sku}); $(el).attr('src',saved.url).removeAttr('srcset').removeAttr('sizes');} else $(el).remove();
    }
    for(const el of body.find('a[href]').toArray()) {
      const u=absolute($(el).attr('href'));const url=new URL(u);
      $(el).attr('href',url.hostname==='affinityimmuno.com' && internal.has(url.pathname) ? internal.get(url.pathname) : u);
      if (!internal.has(url.pathname)) $(el).attr('target','_blank').attr('rel','noopener noreferrer');
    }
    descriptionHtml=sanitize(body.html() || '',{allowedTags:['p','br','strong','em','ul','ol','li','h2','h3','h4','h5','h6','table','thead','tbody','tr','th','td','a','img','figure','figcaption','sub','sup'],allowedAttributes:{a:['href','target','rel'],img:['src','alt','width','height'],th:['scope','colspan','rowspan'],td:['colspan','rowspan']},allowedSchemes:['https']});
    const hero=$('img.product-hero-image').attr('src');
    if(hero && !/generic|placeholder/i.test(hero)) {const saved=await asset(hero,true);if(saved) images.unshift({...saved,alt:sku});}
    const urls=[...new Set($('article.product a[href]').map((_,a)=>$(a).attr('href')).get().filter(u=>/\.pdf(?:$|\?)/i.test(u)).map(absolute))];
    for(const url of urls) {const saved=await asset(url);if(saved)documents.push({...saved,label:`${sku} Product Sheet`});}
  }
  if(key==='el-1611-32214') {
    const saved=await asset(`${origin}/wp-content/uploads/2020/10/EL-1611-32214-Product-sheet-Covid-virus-neutralization.pdf`);
    if(saved)documents.push({...saved,label:`${sku} Product Sheet`});
  }
  if (kind === 'elisa' && !documents.length && /\.pdf$/i.test(f.AJ || '')) {const saved=await asset(f.AJ);if(saved)documents.push({...saved,label:`${sku} Product Sheet`});}
  const protocolSections = kind === 'elisa' ? [['Assay principle',f.AD || f.L],['Reagent preparation',f.AE],['Results calculation',f.AF],['Sample collection',f.AG],['Sample preparation',f.AH]].filter(([,v])=>present(v)).map(([title,body])=>({title,body:clean(body)})) : [];
  if(key==='ab-131-126' && verified && fieldMap.get('Clone')==='2.4300000000000002') fieldMap.set('Clone','2.43');
  // The supplied Tocilizumab principle ends with an unrelated Trastuzumab sentence.
  // Retain the unaffected text; do not substitute an invented scientific claim.
  if(key==='el-1611-202') {
    const section=protocolSections.find(s=>s.title==='Assay principle');
    if(section) section.body=section.body.replace(/The color development is proportional[^.]*Trastuzumab[^.]*\.?/i,'').trim();
    conflicts.push({sku,field:'Assay principle',resolution:'Omitted unrelated Trastuzumab sentence from Tocilizumab entry; original retained in workbook-input.json'});
  }
  const title=clean(f.B).replace(/\s*\|\s*(?:ab-|EL-)[\w-]+\s*$/i,'');
  const target=clean(kind==='elisa'?f.H:f.I || f.C);
  const summary=kind==='elisa'?clean(f.P):target;
  const relatedSkus=kind==='elisa'?[...knownHref.keys()].filter(k=>k!==key && (f.AI || '').toLowerCase().includes(k)):[];
  results.push({sku,slug:slug(sku),title,kind,target,summary,unit:clean(kind==='elisa'?f.F:f.G),host:clean(kind==='antibody'?f.O:''),targetSpecies:clean(kind==='antibody'?f.P:f.I),clone:kind==='antibody'?fieldMap.get('Clone') || '':'',isotype:clean(kind==='antibody'?f.N:''),clonality:clean(kind==='antibody'?f.M:''),applications:clean(kind==='antibody'?f.F:f.P),categories:groups,specifications:[...fieldMap],descriptionHtml,background:kind==='elisa'?clean(f.Y):'',components:kind==='elisa'?clean(f.M).split(/\n/).filter(Boolean):[],protocolSections,images:[...new Map(images.map(x=>[x.url,x])).values()],documents,relatedSkus,sourceUrl:verified?result.url:'',sourceVerified:verified,sourceRows:record.sourceRows});
  completed++;if(completed%25===0 || completed===input.records.length) console.log(`Collected ${completed}/${input.records.length}`);
}
const queue=[...input.records];
await Promise.all(Array.from({length:5},async()=>{while(queue.length)await collect(queue.shift());}));
results.sort((a,b)=>input.records.findIndex(r=>r.fields.A===a.sku)-input.records.findIndex(r=>r.fields.A===b.sku));
for(const c of categories)c.count=results.filter(p=>p.categories.includes(c.slug)).length;
await fs.writeFile(`${out}/catalog.json`,JSON.stringify(results,null,2)+'\n');
await fs.writeFile(`${out}/categories.json`,JSON.stringify(categories,null,2)+'\n');
const report={sourceFilename:input.sourceFilename,sourceSha256:input.sha256,products:results.length,elisas:results.filter(p=>p.kind==='elisa').length,antibodies:results.filter(p=>p.kind==='antibody').length,duplicatesRemoved:input.duplicates,verifiedPages:results.filter(p=>p.sourceVerified).length,uniqueImageProducts:results.filter(p=>p.images.length).length,documentProducts:results.filter(p=>p.documents.length).length,conflicts,errors};
await fs.writeFile(`${out}/migration-report.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,conflicts:conflicts.length,errors:errors.length}));
