import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {load} from 'cheerio';
import sharp from 'sharp';
import crypto from 'node:crypto';

const read=async file=>JSON.parse(await fs.readFile(file,'utf8'));
const digest=value=>crypto.createHash('sha256').update(String(value).normalize('NFKC').replace(/\s+/g,'')).digest('hex');
const inventory=await read('data/affinityimmuno/official-inventory.json');
const retained=await read('data/affinityimmuno/retained-workbook-products.json');
const products=await read('data/affinityimmuno/catalog.json');
const categories=await read('data/affinityimmuno/categories.json');
const report=await read('data/affinityimmuno/migration-report.json');
assert.equal(products.length,310);
assert.equal(products.filter(p=>p.kind==='elisa').length,117);
assert.equal(products.filter(p=>p.kind==='antibody').length,193);
assert.equal(new Set(products.map(p=>p.sku.toLowerCase())).size,309);
assert.equal(new Set(products.map(p=>p.slug)).size,310);
assert.equal(new Set(products.map(p=>p.sourceUrl)).size,310);
assert.deepEqual(new Set(products.map(p=>p.sourceUrl)),new Set(inventory.products.map(p=>p.sourceUrl)));
assert.equal(retained.length,8);
const allProducts=[...products,...retained];
assert.equal(new Set(allProducts.map(p=>p.slug)).size,318);
const paths=new Set(allProducts.map(p=>`/products/affinity/item/${p.slug}`));
for(const c of categories){
  assert.equal(c.count,products.filter(p=>p.categories.includes(c.slug)).length);
  if(!c.hidden){assert.equal(c.count,c.sourceCount);assert(c.count>0);const expected=inventory.categories.find(x=>x.slug===c.slug);assert.deepEqual(new Set(products.filter(p=>p.categories.includes(c.slug)).map(p=>p.sourceUrl)),new Set(expected.productUrls));}
  paths.add(`/products/affinity/${c.slug}`);
}
const files=new Set();
const referenceMedia=await read('data/affinityimmuno/reference-media.json');
for(const kind of ['antibody','elisa']){
  const image=referenceMedia[kind];
  const metadata=await sharp(`public${image.url}`).metadata();
  assert.equal(metadata.width,image.width);
  assert.equal(metadata.height,image.height);
  assert.equal(image.reference,true);
  assert(image.sourceUrl.startsWith('https://affinityimmuno.com/images/'));
  files.add(image.url);
}
await sharp('public/partners/affinityimmuno-logo.png').metadata();
let bodyImages=0,inlineLinks=0;
for(const p of allProducts){
  assert(p.title && p.target && p.specifications.length>0,p.sku);
  assert.equal(p.sourceVerified,!!p.sourceUrl,p.sku);
  assert(p.sourceVerified || p.sourceRows.length>0);
  for(const d of p.documents){if(d.url.startsWith('/')){const b=await fs.readFile(`public${d.url}`);assert.equal(b.subarray(0,5).toString(),'%PDF-');files.add(d.url);}else{assert(d.url.startsWith('https://affinityimmuno.com/'));assert(report.assetChecks.some(check=>check.kind==='pdf' && check.url===d.sourceUrl && check.status>=200 && check.status<300));}}
  for(const image of p.images){const m=await sharp(`public${image.url}`).metadata();assert.equal(m.width,image.width);assert.equal(m.height,image.height);files.add(image.url);assert(!/placeholder|generic/.test(image.sourceUrl));}
  const $=load(p.descriptionHtml);
  const evidence=inventory.products.find(row=>row.sourceUrl===p.sourceUrl);
  if(evidence){
    assert.equal(digest($.text()),evidence.sourceBodyDigest,`Source body changed: ${p.slug}`);
    for(const source of evidence.sourceSpecifications){const field=p.specifications.find(([label])=>label.toLowerCase()===source.label.toLowerCase());assert(field,`${p.slug}: missing ${source.label}`);assert.equal(digest(field[1]),source.digest,`${p.slug}: changed ${source.label}`);}
  }
  assert.equal($('script,iframe,form,input,button').length,0,p.sku);
  for(const image of $('img').toArray()){const src=$(image).attr('src');assert(src?.startsWith('/affinityimmuno/'));await fs.access(`public${src}`);bodyImages++;}
  for(const link of $('a').toArray()){const href=$(link).attr('href');if(href?.startsWith('/products/affinity/'))assert(paths.has(href.split('#')[0]),`${p.sku}: ${href}`);inlineLinks++;}
  assert(!/Add to cart|Add to order|Request Bulk Pricing|\$\d|2\.4300000000000002/i.test(JSON.stringify(p)),p.sku);
}
const nav=await read('data/affinityimmuno/navigation.json');
for(const section of nav)for(const link of section.links)assert(paths.has(link.href));
assert.equal(report.products,products.length);
assert(products.filter(p=>p.kind==='elisa' && p.documents.length>0).length>=116);
assert.equal(report.sourceProblems.length,0);
const duplicates=products.filter(p=>p.sku==='EL-1611-73196');
assert.equal(duplicates.length,2);
assert.equal(new Set(duplicates.map(p=>p.slug)).size,2);
assert(duplicates.some(p=>p.catalogAliases.includes('EL-1611-73196-PEG-GCSF-PK')));

console.log(JSON.stringify({products:products.length,categories:categories.length,verifiedSourcePages:products.filter(p=>p.sourceVerified).length,retainedWorkbookOnly:retained.length,localMediaFiles:files.size,bodyImages,inlineLinks,result:'PASS'}));
