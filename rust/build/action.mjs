import { writeFileSync } from 'node:fs';
import { sep } from 'node:path';
import process from 'node:process';
import { manifest, output, print } from './output.mjs';
import { build } from './lib/build.mjs';

let source  = process.env.source  || process.env.GITHUB_REPOSITORY;
let commit  = process.env.commit  || process.env.GITHUB_SHA;
let target  = process.env.target  || 'x86_64-unknown-linux-musl';
let profile = process.env.profile || 'release';

let result = await build(target, profile);

for (let msg of result.messages) {
    let path = process.cwd() + sep;

    let level = msg.level;
    let text  = msg.text.trim().replace(/\n/g, '%0A');
    let file  = msg.file?.replace(path, '');
    let span  = msg.spans.find(span => span.is_primary);

    print(level, text, {
        title:     msg.title,
        file:      span && file,
        line:      span?.line_start,
        endLine:   span?.line_end,
        col:       span?.column_start,
        endColumn: span?.column_end,
    });
}

if (!result.success) {
    process.exit(1);
}

for (let binary of Object.values(result.binaries)) {
    let path = binary.location + ".manifest.yaml";
    writeFileSync(path, manifest({
        binary:   binary.binary,
        digest:   binary.digest,
        source:   source,
        commit:   commit,
        compiler: result.compiler,
        target:   target,
    }));
    binary.manifest = path;
}

print('debug', JSON.stringify(result));

await output({
    binaries: JSON.stringify(result.binaries),
    ...Object.values(result.binaries)[0],
    compiler: JSON.stringify(result.compiler),
}, process.env.GITHUB_OUTPUT);
