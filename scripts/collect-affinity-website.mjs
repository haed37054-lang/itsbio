import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {load} from 'cheerio';
import sanitize from 'sanitize-html';
import sharp from 'sharp';

const origin='https://affinityimmuno.com';
const out='data/affinityimmuno';
const cache='.cache/affinity/full-review/pages';
await fs.mkdir(cache,{recursive:true});
const previous=JSON.parse(await fs.readFile(`${out}/catalog.json`,'utf8'));
const priorArchive=await fs.readFile(`${out}/retained-workbook-products.json`,'utf8').then(JSON.parse).catch(()=>[]);
const previousAll=[...previous,...priorArchive];
const workbook=JSON.parse(await fs.readFile(`${out}/workbook-input.json`,'utf8'));
const additionalResources=JSON.parse(await fs.readFile(`${out}/additional-source-resources.json`,'utf8'));
const norm=s=>String(s||'').normalize('NFKC').replace(/[‐‑‒–—―−]/g,'-').toLowerCase().trim();
const clean=s=>String(s||'').normalize('NFC').replace(/\u00a0/g,' ').trim();
const text=s=>clean(s).replace(/\s+/g,' ');
const slug=s=>norm(s).replace(/[^a-z0-9-]/g,'-');
const absolute=u=>new URL(u,origin).href.replace(/^http:/,'https:');
const cacheKey=url=>crypto.createHash('sha256').update(url).digest('hex');
const contentDigest=value=>cacheKey(String(value).normalize('NFKC').replace(/\s+/g,''));
const sourceProblems=[],differences=[],assetChecks=[],linkChecks=[];
const pagePromises=new Map(),imagePromises=new Map(),documentPromises=new Map(),linkPromises=new Map();
async function page(url){
  if(pagePromises.has(url))return pagePromises.get(url);
  const promise=(async()=>{
    const file=`${cache}/${cacheKey(url)}.json`;
    try{return JSON.parse(await fs.readFile(file,'utf8'));}catch{}
    const r=await fetch(url,{signal:AbortSignal.timeout(30000)});
    const result={url:r.url,status:r.status,html:await r.text()};
    await fs.writeFile(file,JSON.stringify(result));return result;
  })();pagePromises.set(url,promise);return promise;
}
async function concurrent(items,worker,n=5){const queue=[...items],result=[];await Promise.all(Array.from({length:n},async()=>{while(queue.length){const item=queue.shift();result.push(await worker(item));}}));return result;}
function listing(html){const $=load(html);return $('.product-row').map((_,e)=>({sku:text($(e).attr('data-catalog-number')),title:text($(e).attr('data-title')),url:absolute($(e).find('a[href*="/product/"]').attr('href')),unit:text($(e).find('.row-amount').text())})).get();}

const all=await page(`${origin}/product-category/`);
if(all.status!==200)throw new Error('Manufacturer inventory unavailable');
const source=listing(all.html);
if(source.length!==310 || new Set(source.map(p=>p.url)).size!==310)throw new Error('Manufacturer inventory changed; review before publishing');
const categoryDefinitions=[
  ['elisas','ELISA Kits','','elisa','elisas'],
  ['biosimilar-elisas','Biosimilar ELISAs','elisas','elisa','elisas/biosimilar-elisas'],
  ['biomarker-elisas','Biomarker ELISAs','elisas','elisa','elisas/biomarker-elisas'],
  ['antibodies','Antibodies','','antibody','antibodies'],
  ['primary-antibodies','Primary Antibodies','antibodies','antibody','antibodies/primary-antibodies'],
  ['human-targets','Human Targets','antibodies','antibody','antibodies/human-targets'],
  ['mouse-targets','Mouse Targets','antibodies','antibody','antibodies/mouse-targets'],
  ['anti-idiotype','Anti-Idiotype Antibodies','antibodies','antibody','antibodies/anti-idiotype-antibodies'],
  ['biosimilars','Biosimilars','antibodies','antibody','antibodies/biosimilars'],
  ['isotype-controls','Isotype Controls','antibodies','antibody','antibodies/isotype-controls'],
];
const categories=await concurrent(categoryDefinitions,async([slug,title,parent,kind,sourcePath])=>{
  const sourceUrl=`${origin}/product-category/${sourcePath}/`;
  const result=await page(sourceUrl);if(result.status!==200)throw new Error(`Category failed: ${sourceUrl}`);
  const products=listing(result.html);return {slug,title,parent,kind,sourceUrl,sourceProductUrls:products.map(p=>p.url),sourceCount:products.length,hidden:false};
},3);
categories.sort((a,b)=>categoryDefinitions.findIndex(c=>c[0]===a.slug)-categoryDefinitions.findIndex(c=>c[0]===b.slug));
const existingSlugs=new Set();
for(const item of source){
  item.categories=categories.filter(c=>c.sourceProductUrls.includes(item.url)).map(c=>c.slug);
  item.kind=item.categories.includes('elisas')?'elisa':'antibody';
  item.slug=previousAll.find(p=>p.sourceUrl===item.url)?.slug || slug(item.sku);
  if(existingSlugs.has(item.slug)){
    const alias=item.title.match(/EL-[A-Za-z0-9-]+/g)?.find(code=>norm(code)!==norm(item.sku));
    item.slug=alias?slug(alias):`${item.slug}-${new URL(item.url).pathname.split('/').filter(Boolean).at(-1)}`;
  }
  if(existingSlugs.has(item.slug))throw new Error(`Duplicate route: ${item.slug}`);
  existingSlugs.add(item.slug);
}
const internal=new Map(source.map(p=>[new URL(p.url).pathname,`/products/affinity/item/${p.slug}`]));
const oldDocuments=new Map(previousAll.flatMap(p=>p.documents.map(d=>[d.sourceUrl,d])));
async function imageAsset(url,alt){
  url=absolute(url);if(imagePromises.has(url))return imagePromises.get(url);
  const promise=(async()=>{
    const local=`/affinityimmuno/${cacheKey(url).slice(0,16)}${path.extname(new URL(url).pathname).toLowerCase() || '.jpg'}`;
    let bytes=await fs.readFile(`public${local}`).catch(()=>null);
    if(!bytes){const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error(`Image HTTP ${r.status}: ${url}`);bytes=Buffer.from(await r.arrayBuffer());}
    const metadata=await sharp(bytes).metadata();if(!metadata.width || !metadata.height)throw new Error(`Invalid image: ${url}`);
    await fs.writeFile(`public${local}`,bytes);const result={url:local,sourceUrl:url,width:metadata.width,height:metadata.height,alt:text(alt)};assetChecks.push({url,status:200,kind:'image'});return result;
  })();imagePromises.set(url,promise);return promise;
}
async function documentAsset(url){
  url=absolute(url);if(documentPromises.has(url))return documentPromises.get(url);
  const promise=(async()=>{
    const retained=oldDocuments.get(url);
    if(retained?.url.startsWith('/')){const bytes=await fs.readFile(`public${retained.url}`);if(bytes.subarray(0,5).toString()!=='%PDF-')throw new Error(`Invalid retained PDF: ${url}`);assetChecks.push({url,status:200,kind:'pdf',local:retained.url});return retained;}
    const r=await fetch(url,{headers:{Range:'bytes=0-4095'},signal:AbortSignal.timeout(30000)});
    if(!r.ok)throw new Error(`PDF HTTP ${r.status}: ${url}`);
    const reader=r.body.getReader();const {value}=await reader.read();await reader.cancel();
    if(Buffer.from(value||[]).subarray(0,5).toString()!=='%PDF-')throw new Error(`Not a PDF: ${url}`);
    assetChecks.push({url,status:r.status,kind:'pdf'});return {url,sourceUrl:url};
  })();documentPromises.set(url,promise);return promise;
}
async function externalLink(url){
  if(linkPromises.has(url))return linkPromises.get(url);
  const promise=(async()=>{try{let r=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(20000)});if(r.status===405){r=await fetch(url,{headers:{Range:'bytes=0-1023'},signal:AbortSignal.timeout(20000)});await r.body?.cancel();}const ok=r.ok;linkChecks.push({url,status:r.status,ok});return ok;}catch(e){linkChecks.push({url,status:0,ok:false,error:e.message});return false;}})();linkPromises.set(url,promise);return promise;
}
const aliases={precision:'Assay precision','alternative name':'Alternative names','host specie(s)':'Host species',buffer:'Formulation','application(s)':'Application'};
function readCell($,td){const copy=$(td).clone();copy.find('br').replaceWith('\n');copy.find('li,p').append('\n');return clean(copy.text());}
const prepared=[];let completed=0;
await concurrent(source,async item=>{
  const response=await page(item.url);if(response.status!==200)throw new Error(`Product HTTP ${response.status}: ${item.url}`);
  const $=load(response.html);const pageSku=text($('.catalog-number').text()).replace(/^Cat\.?\s*No\s*:\s*/i,'');
  if(norm(pageSku)!==norm(item.sku))throw new Error(`SKU mismatch ${item.sku} / ${pageSku}: ${item.url}`);
  const old=previousAll.find(p=>p.sourceUrl===item.url) || previousAll.find(p=>norm(p.sku)===norm(item.sku));
  const fieldMap=new Map();
  $('.spec-table tr').each((_,e)=>{let label=text($(e).find('th').text());const value=readCell($,$(e).find('td'));label=aliases[norm(label)]||label;if(label && value)fieldMap.set(label,value);});
  item.sourceBodyDigest=contentDigest($('.product-body').text());
  item.sourceSpecifications=[...fieldMap].map(([label,value])=>({label,digest:contentDigest(value)}));
  if(old)for(const [label,value] of old.specifications){const existing=[...fieldMap.keys()].find(k=>norm(k)===norm(label));if(existing && text(fieldMap.get(existing))!==text(value))differences.push({sourceUrl:item.url,sku:item.sku,field:label,website:fieldMap.get(existing),workbook:value,resolution:'Manufacturer page used'});if(!existing && !['Components','Precision'].includes(label))fieldMap.set(label,value);}
  const unit=text($('.unit-size').text()) || fieldMap.get('Size') || item.unit || fieldMap.get('Components')?.match(/\b\d+\s*wells\b/i)?.[0] || $('.product-body').text().match(/\b\d+\s+well\s+microplate\b/i)?.[0].replace(/\s+well\s+microplate/i,' wells') || '';
  if(unit)fieldMap.set('Size',unit);
  const safety=text($('.safety-warning').text()).replace(/^Safety Warning:\s*/i,'');if(safety)fieldMap.set('Safety warning',safety);
  const body=$('.product-body').clone();
  const images=[];const documents=[];
  for(const el of body.find('img').toArray()){
    const src=$(el).attr('src');if(!src){$(el).remove();continue;}
    if(/generic|placeholder|logo|banner/i.test(src)){ $(el).remove();continue; }
    try{const image=await imageAsset(src,$(el).attr('alt')||item.title);images.push(image);$(el).attr('src',image.url).removeAttr('srcset').removeAttr('sizes');}catch(e){sourceProblems.push({sourceUrl:item.url,type:'image',url:absolute(src),error:e.message});$(el).remove();}
  }
  const hero=$('img.product-hero-image').attr('src');if(hero && !/generic|placeholder/.test(hero)){try{images.unshift(await imageAsset(hero,item.title));}catch(e){sourceProblems.push({sourceUrl:item.url,type:'image',url:absolute(hero),error:e.message});}}
  const supplemental=additionalResources[new URL(item.url).pathname.split('/').filter(Boolean).at(-1)]?.documents || [];
  const pdfUrls=[...new Set([...$('article.product a[href]').map((_,a)=>$(a).attr('href')).get().filter(u=>/\.pdf(?:$|\?)/i.test(u)).map(absolute),...supplemental.map(d=>d.url)])];
  for(const url of pdfUrls){try{documents.push({...await documentAsset(url),label:supplemental.find(d=>d.url===url)?.label || `${item.sku} Product Sheet`});}catch(e){sourceProblems.push({sourceUrl:item.url,type:'document',url,error:e.message});}}
  if(old && !pdfUrls.length)for(const doc of old.documents){try{documents.push({...await documentAsset(doc.sourceUrl),label:doc.label});}catch(e){sourceProblems.push({sourceUrl:item.url,type:'document',url:doc.sourceUrl,error:e.message});}}
  const docMap=new Map(documents.map(d=>[d.sourceUrl,d.url]));
  for(const el of body.find('a[href]').toArray()){
    const href=$(el).attr('href');if(href.startsWith('#'))continue;
    if(/^(mailto:|tel:)/i.test(href))continue;
    let url;try{url=new URL(absolute(href));}catch{$(el).replaceWith($(el).text());continue;}
    if(!['https:','http:'].includes(url.protocol)){$(el).replaceWith($(el).text());continue;}
    if(url.hostname==='affinityimmuno.com' && internal.has(url.pathname))$(el).attr('href',internal.get(url.pathname)+url.hash).removeAttr('target').removeAttr('rel');
    else if(docMap.has(url.href))$(el).attr('href',docMap.get(url.href)).attr('target','_blank').attr('rel','noopener noreferrer');
    else if(await externalLink(url.href))$(el).attr('href',url.href).attr('target','_blank').attr('rel','noopener noreferrer');
    else{sourceProblems.push({sourceUrl:item.url,type:'link',url:url.href,resolution:'Unavailable manufacturer link omitted; link text retained'});$(el).replaceWith($(el).text());}
  }
  const descriptionHtml=sanitize(body.html()||'',{allowedTags:['p','br','strong','em','ul','ol','li','h2','h3','h4','h5','h6','table','thead','tbody','tr','th','td','a','img','figure','figcaption','sub','sup','video','source'],allowedAttributes:{a:['href','target','rel'],img:['src','alt','width','height'],th:['scope','colspan','rowspan'],td:['colspan','rowspan'],video:['controls','src','poster','preload','playsinline'],source:['src','type']},allowedSchemes:['https']});
  const rawTitle=text($('article.product h1').first().text()) || item.title;
  const title=rawTitle.replace(new RegExp(`^${item.sku}\\s*[-–]?\\s*`,'i'),'').replace(new RegExp(`\\s*\\|\\s*${item.sku}\\s*$`,'i'),'').trim();
  const catalogAliases=[...new Set((rawTitle.replace(/[‐‑‒–—―−]/g,'-').match(/(?:EL-|ab-)[A-Za-z0-9-]+/gi)||[]).filter(code=>norm(code)!==norm(item.sku)))];
  const components=fieldMap.get('Components')?.split(/\n/).map(clean).filter(Boolean) || old?.components || [];
  const protocolSections=old?.protocolSections || [];
  const target=fieldMap.get('Target protein') || fieldMap.get('Antigen') || fieldMap.get('Antibody target') || old?.target || title;
  const summary=text(body.find('p').first().text()) || old?.summary || target;
  if(item.kind==='elisa'){
    if(/pharmacokinetic|GCSF-PEG ELISA kit/i.test(title))item.categories.push('pharmacokinetic-elisas');
    if(/immunogenicity|ADA|anti.?PEG antibody/i.test(title))item.categories.push('immunogenicity-elisas');
  }
  const product={sku:item.sku,slug:item.slug,title,kind:item.kind,target,summary,unit,host:fieldMap.get('Host species')||'',targetSpecies:fieldMap.get('Target species')||fieldMap.get('Reactivity')||'',clone:fieldMap.get('Clone')||'',isotype:fieldMap.get('Isotype')||'',clonality:fieldMap.get('Clonality')||'',applications:fieldMap.get('Application')||'',categories:item.categories,specifications:[...fieldMap],descriptionHtml,background:old?.background||'',components,protocolSections,images:[...new Map(images.map(x=>[x.url,x])).values()],documents,relatedSkus:old?.relatedSkus||[],sourceUrl:item.url,sourceVerified:true,sourceRows:old?.sourceRows||[],catalogAliases,sourceTitle:rawTitle};
  prepared.push(product);completed++;if(completed%25===0 || completed===source.length)console.log(`Reviewed ${completed}/${source.length}`);return product;
});
prepared.sort((a,b)=>source.findIndex(p=>p.url===a.sourceUrl)-source.findIndex(p=>p.url===b.sourceUrl));
const activeSkus=new Set(source.map(p=>norm(p.sku)));
const retained=[...new Map(previousAll.filter(p=>!activeSkus.has(norm(p.sku))).map(p=>[p.slug,p])).values()];
for(const [slug,title,kind] of [['pharmacokinetic-elisas','Pharmacokinetic ELISAs','elisa'],['immunogenicity-elisas','Immunogenicity / ADA ELISAs','elisa'],['covid-19','COVID-19 Research Products','']])categories.push({slug,title,parent:slug==='covid-19'?'':'elisas',kind,hidden:true,sourceUrl:'',sourceProductUrls:[],sourceCount:0});
for(const c of categories)c.count=prepared.filter(p=>p.categories.includes(c.slug)).length;
const navigation=categories.filter(c=>!c.hidden && !c.parent).map(parent=>({label:parent.title,links:[{label:`All ${parent.title}`,href:`/products/affinity/${parent.slug}`},...categories.filter(c=>!c.hidden && c.parent===parent.slug).map(c=>({label:c.title,href:`/products/affinity/${c.slug}`}))]}));
const inventory={sourceUrl:`${origin}/product-category/`,reviewedAt:new Date().toISOString(),listedCount:source.length,uniqueCatalogNumbers:activeSkus.size,products:source.map(p=>({sku:p.sku,title:p.title,sourceUrl:p.url,slug:p.slug,kind:p.kind,categories:p.categories,sourceBodyDigest:p.sourceBodyDigest,sourceSpecifications:p.sourceSpecifications})),categories:categories.filter(c=>!c.hidden).map(c=>({slug:c.slug,sourceUrl:c.sourceUrl,count:c.sourceCount,productUrls:c.sourceProductUrls}))};
const report={scope:'Complete manufacturer catalog',sourceUrl:inventory.sourceUrl,reviewedAt:inventory.reviewedAt,products:prepared.length,uniqueCatalogNumbers:activeSkus.size,elisas:prepared.filter(p=>p.kind==='elisa').length,antibodies:prepared.filter(p=>p.kind==='antibody').length,retainedPriorWorkbookPages:retained.map(p=>p.sku),initialWorkbookProducts:workbook.records.length,newProductPages:prepared.filter(p=>!workbook.records.some(record=>norm(record.fields.A)===norm(p.sku))).length,sourceMissingFields:prepared.filter(p=>!p.unit || (p.kind==='elisa' && !p.documents.length)).map(p=>({sku:p.sku,sourceUrl:p.sourceUrl,fields:[...(!p.unit?['Size']:[]),...(p.kind==='elisa' && !p.documents.length?['Product sheet']:[])]})),duplicateCatalogNumbers:source.filter(p=>source.filter(other=>norm(other.sku)===norm(p.sku)).length>1).map(p=>({sku:p.sku,sourceUrl:p.url,slug:p.slug})),verifiedPages:prepared.length,uniqueImageProducts:prepared.filter(p=>p.images.length).length,documentProducts:prepared.filter(p=>p.documents.length).length,sourceDifferences:differences,sourceProblems,assetChecks,linkChecks};
for(const [file,data] of Object.entries({'catalog.json':prepared,'retained-workbook-products.json':retained,'categories.json':categories,'navigation.json':navigation,'official-inventory.json':inventory,'migration-report.json':report}))await fs.writeFile(`${out}/${file}`,JSON.stringify(data,null,2)+'\n');
console.log(JSON.stringify({products:report.products,uniqueCatalogNumbers:report.uniqueCatalogNumbers,elisas:report.elisas,antibodies:report.antibodies,retainedPriorPages:retained.length,newProductPages:report.newProductPages,documentProducts:report.documentProducts,figures:report.uniqueImageProducts,sourceProblems:sourceProblems.length,sourceDifferences:differences.length}));
