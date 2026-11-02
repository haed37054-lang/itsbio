import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {load} from 'cheerio';
import sharp from 'sharp';

const read=async file=>JSON.parse(await fs.readFile(file,'utf8'));
const input=await read('data/affinityimmuno/workbook-input.json');
const products=await read('data/affinityimmuno/catalog.json');
const categories=await read('data/affinityimmuno/categories.json');
const report=await read('data/affinityimmuno/migration-report.json');
assert.equal(products.length,217);
assert.equal(products.filter(p=>p.kind==='elisa').length,19);
assert.equal(products.filter(p=>p.kind==='antibody').length,198);
assert.equal(new Set(products.map(p=>p.sku.toLowerCase())).size,217);
assert.equal(new Set(products.map(p=>p.slug)).size,217);
const expected=new Set(input.records.map(r=>r.fields.A));
assert.deepEqual(new Set(products.map(p=>p.sku)),expected);
const paths=new Set(products.map(p=>`/products/affinity/item/${p.slug}`));
for(const c of categories){assert.equal(c.count,products.filter(p=>p.categories.includes(c.slug)).length);assert(c.count>0);paths.add(`/products/affinity/${c.slug}`);}
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
for(const p of products){
  assert(p.title && p.target && p.unit && p.specifications.length>0,p.sku);
  assert.equal(p.sourceVerified,!!p.sourceUrl,p.sku);
  assert(p.sourceRows.length>0);
  for(const d of p.documents){const b=await fs.readFile(`public${d.url}`);assert.equal(b.subarray(0,5).toString(),'%PDF-');files.add(d.url);}
  for(const image of p.images){const m=await sharp(`public${image.url}`).metadata();assert.equal(m.width,image.width);assert.equal(m.height,image.height);files.add(image.url);assert(!/placeholder|generic/.test(image.sourceUrl));}
  const $=load(p.descriptionHtml);
  assert.equal($('script,iframe,form,input,button').length,0,p.sku);
  for(const image of $('img').toArray()){const src=$(image).attr('src');assert(src?.startsWith('/affinityimmuno/'));await fs.access(`public${src}`);bodyImages++;}
  for(const link of $('a').toArray()){const href=$(link).attr('href');if(href?.startsWith('/products/affinity/'))assert(paths.has(href.split('#')[0]),`${p.sku}: ${href}`);inlineLinks++;}
  assert(!/Add to cart|Add to order|Request Bulk Pricing|\$\d|2\.4300000000000002/i.test(JSON.stringify(p)),p.sku);
}
const nav=await read('data/affinityimmuno/navigation.json');
for(const section of nav)for(const link of section.links)assert(paths.has(link.href));
assert.equal(report.products,products.length);
assert.equal(products.filter(p=>p.kind==='elisa' && p.documents.length>0).length,19);
console.log(JSON.stringify({products:products.length,categories:categories.length,verifiedSourcePages:products.filter(p=>p.sourceVerified).length,retainedWorkbookOnly:products.filter(p=>!p.sourceVerified).length,localMediaFiles:files.size,bodyImages,inlineLinks,result:'PASS'}));
