// Large official scientific figures are stored in transport-sized binary parts.
// Reassembly preserves every original byte, including colour profiles and metadata.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await fs.readFile(new URL('data/abm-reviewed-asset-parts/manifest.json', root), 'utf8'));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
for (const asset of manifest.assets) {
  const destination = new URL(asset.path, root);
  const existing = await fs.readFile(destination).catch(() => null);
  if (existing?.length === asset.bytes && sha(existing) === asset.sha256) continue;
  const buffers = [];
  for (const part of asset.parts) {
    const bytes = await fs.readFile(new URL(`data/abm-reviewed-asset-parts/${part.path}`, root));
    if (bytes.length !== part.bytes || sha(bytes) !== part.sha256) throw Error(`Invalid reviewed asset part: ${part.path}`);
    buffers.push(bytes);
  }
  const bytes = Buffer.concat(buffers);
  if (bytes.length !== asset.bytes || sha(bytes) !== asset.sha256) throw Error(`Original figure integrity failed: ${asset.path}`);
  await fs.mkdir(new URL('.', destination), {recursive:true});
  const temporary = new URL(`${asset.path}.assembling`, root);
  await fs.writeFile(temporary, bytes);
  await fs.rename(temporary, destination);
  console.log(`Reassembled original ABM figure: ${asset.path}`);
}
