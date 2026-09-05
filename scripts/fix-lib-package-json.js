// react-native-builder-bob writes lib/module/package.json with just
// `{ "type": "module" }` -- it doesn't copy the root package.json's
// `sideEffects` field (see its compile.js: the nested package.json is
// hardcoded to only the `type` key). Bundlers resolve `sideEffects` from the
// *nearest* package.json to the file being imported, which for anything
// under lib/module/ is this generated file, not the repo root one -- so
// without this patch, `sideEffects: false` at the repo root is silently
// ignored for every consumer, and tree-shaking a single primitive out of
// this package pulls in the whole library instead. Run after `bob build`.
const fs = require('fs');
const path = require('path');

const pkgJsonPath = path.join(__dirname, '..', 'lib', 'module', 'package.json');

const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
pkgJson.sideEffects = false;

fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson) + '\n');
