#!/usr/bin/env node
// Validate the `const CJM = {...}` data in each given index.html with validate() from site/_shared/cjm.js.
// Usage: node scripts/validate-cjm.js site/<folder>/index.html [...]
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const { validate } = require(path.join(root, 'site', '_shared', 'cjm.js'));

let failed = false;
for (const file of process.argv.slice(2)) {
  const html = fs.readFileSync(file, 'utf8');
  const match = html.match(/<script>\s*(const CJM\s*=[\s\S]*?)<\/script>/);
  let errors;
  if (!match) {
    errors = ['no inline <script> that starts with "const CJM = {"'];
  } else {
    try {
      errors = validate(new Function(`${match[1]}\nreturn CJM;`)());
    } catch (e) {
      errors = [`CJM data does not run: ${e.message}`];
    }
  }
  for (const error of errors) console.error(`ERROR: ${path.relative(root, path.resolve(file))}: ${error}`);
  if (errors.length) failed = true;
}
process.exit(failed ? 1 : 0);
