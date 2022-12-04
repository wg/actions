import { createWriteStream } from 'node:fs';
import { stdout } from 'node:process';
import { Writable } from 'node:stream';

const MANIFEST = `
binary: $binary
digest: $digest

source: $source
commit: $commit

compiler: |
$compiler
target: $target
`.trimStart();

export function manifest(manifest) {
    return MANIFEST.replace(/\$(\w+)/g, (_, name) => {
        let value = manifest[name];
        if (Array.isArray(value)) {
            value = value.map(line => '  ' + line).join('\n');
        }
        return value;
    });
}

export function print(event, message, attributes = {}) {
    let attrs = flatten(attributes, escape, ',');
    stdout.write(`::${event} ${attrs}::${message}\n`);
}

export async function output(outputs, path) {
    let create = () => createWriteStream(path, { flags: 'a' });
    let stream = Writable.toWeb(path ? create() : stdout);

    let data = flatten(outputs, identity, '\n');

    await stream.getWriter().write(data + '\n');
}

function flatten(object, format, separator) {
    let entries = Object.entries(object);
    return entries.flatMap(([name, value]) => (
        value ? [name, format(value)].join('=') : []
    )).join(separator);
}

function escape(value) {
    return String(value).replace(/([,%]|::)/g, encodeURIComponent)
}

function identity(value) {
    return String(value);
}
