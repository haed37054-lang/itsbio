import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {load} from 'cheerio';
import sharp from 'sharp';
const read=async name=>JSON.parse(await fs.readFile(`data/aims/${name}`,'utf8'));
const products=await read('catalog.json'),categories=await read('categories.json'),inventory=await read('official-inventory.json'),report=await read('migration-report.json'),navigation=await read('navigation.json');
const digest=s=>crypto.createHash('sha256').update(String(s).normalize('NFKC').replace(/\s/g,'')).digest('hex');
assert.equal(products.length,39);assert.equal(inventory.listingCount,50);assert.equal(inventory.familyPageCount,11);assert.equal(categories.length,22);assert.equal(categories.filter(c=>!c.parent).length,6);
assert.equal(new Set(products.map(p=>p.slug)).size,39);assert.deepEqual(new Set(products.map(p=>p.sourceUrl)),new Set(inventory.products.map(p=>p.sourceUrl)));
const paths=new Set(['/products/aims',...products.map(p=>`/products/aims/item/${p.slug}`),...categories.map(c=>`/products/aims/${c.slug}`)]);
for(const c of categories){assert(c.count>0,`Empty category ${c.slug}`);assert.equal(c.count,products.filter(p=>p.categories.includes(c.slug)).length);for(const url of c.productUrls)assert(url.startsWith('https://aimslabproducts.com/product/'));}
for(const f of inventory.families)assert(paths.has(f.href),f.sourceUrl);
for(const section of navigation)for(const link of section.links)assert(paths.has(link.href),link.href);
const seen=new Set();let bodyImages=0;
for(const p of products){
 assert(p.title&&p.descriptionHtml&&p.images.length,p.slug);assert(p.sourceUrl.startsWith('https://aimslabproducts.com/product/'));
 assert(!/animalid\.com|ATS-3|NEO-9|add to cart|checkout|\$\s*\d/i.test(JSON.stringify(p)),p.slug);
 const $=load(p.descriptionHtml);assert.equal(digest($.text()),inventory.products.find(x=>x.sourceUrl===p.sourceUrl).sourceBodyDigest,p.slug);assert.equal($('script,iframe,form,input,button').length,0,p.slug);
 for(const a of $('a[href]').toArray())assert(paths.has($(a).attr('href').split('#')[0]),`${p.slug}: ${$(a).attr('href')}`);
 for(const image of p.images){assert(image.sourceUrl.startsWith('https://aimslabproducts.com/'));if(seen.has(image.url))continue;const metadata=await sharp(`public${image.url}`).metadata();assert.equal(metadata.width,image.width);assert.equal(metadata.height,image.height);seen.add(image.url);}
 for(const image of $('img').toArray()){assert($(image).attr('src').startsWith('/aims-lab/'));await fs.access(`public${$(image).attr('src')}`);bodyImages++;}
 for(const document of p.documents){assert(document.sourceUrl.startsWith('https://aimslabproducts.com/'));const bytes=await fs.readFile(`public${document.url}`);assert.equal(bytes.subarray(0,5).toString(),'%PDF-');seen.add(document.url);}
 for(const slug of p.relatedSlugs)assert(products.some(x=>x.slug===slug));
}
const logo=await sharp('public/partners/aims-lab-logo.png').metadata();assert.equal(logo.width,report.logo.width);assert.equal(logo.height,report.logo.height);
assert.equal(report.assetChecks.filter(a=>a.kind==='pdf').length,16);assert.equal(report.productsWithDocuments,38);
console.log(JSON.stringify({products:products.length,sourceListings:inventory.listingCount,familyRoutes:inventory.familyPageCount,rootCategories:6,categories:categories.length,localMedia:seen.size,bodyImages,documentProducts:38,result:'PASS'}));
