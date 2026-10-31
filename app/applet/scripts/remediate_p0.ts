import { glob } from 'bun';
import fs from 'node:fs/promises';

const files = await Array.from(new glob('src/**/*.{ts,tsx}'));

for (const file of files) {
  let content = await fs.readFile(file, 'utf8');
  
  // Replace fallback patterns that fabricate data
  // Note: Need to be careful not to break legitimate usage.
  let newContent = content
    .replace(/\?\? 100/g, '?? null')
    .replace(/\?\? 7\.0/g, '?? null')
    .replace(/\?\? 7/g, '?? null')
    .replace(/\|\| 100/g, '|| 0') // This might still be unsafe, but required to move away from 100
    .replace(/\|\| 7\.0/g, '|| 0')
    .replace(/\|\| 7/g, '|| 0');
    
  if (content !== newContent) {
    await fs.writeFile(file, newContent);
    console.log(`Updated ${file}`);
  }
}
