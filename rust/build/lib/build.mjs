import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { basename, parse } from 'node:path';
import { Readable } from 'node:stream';
import { cargo } from './cargo.mjs';
import { rustc } from './rustc.mjs';

export async function build(target, profile) {
    let messages = [];
    let binaries = [];
    let success  = false;

    async function artifact(event) {
        if (event.target.kind.includes('bin')) {
            let item = await binary(event, target);
            let name = event.target.name;
            binaries.push([name, item]);
        }
    }

    function message(event) {
        let level = event.message.level;
        let title = event.message.message;
        let text  = event.message.rendered;
        let spans = event.message.spans;
        let file  = event.target?.src_path;
        messages.push({ level, title, text, spans, file });
    }

    let build = cargo("build", target, profile);

    for await (let event of build) {
        switch (event.reason) {
            case 'compiler-artifact':
                await artifact(event);
                break;
            case 'compiler-message':
                message(event);
                break;
            case 'build-finished':
                success = event.success;
                break;
        }
    }

    let compiler = await rustc("-Vv");

    let result = {
        binaries: Object.fromEntries(binaries.sort()),
        messages: messages,
        compiler: compiler,
        target:   target,
        success:  success,
    };

    return result;
}

async function binary(event, target) {
    let [arch, vendor, os] = target.split('-');

    let system = {
        "apple-darwin":  "macos",
        "unknown-linux": "linux",
        "pc-windows":    "windows",
    }[`${vendor}-${os}`];

    if (!system) {
        throw new Error(`unsupported target: ${target}`);
    }

    let { name, ext } = parse(event.executable);

    let binary = basename(event.executable);
    let digest = await sha256(event.executable);
    let prefix = `${arch}/${system}`;

    return {
        artifact: `${name}-${arch}-${system}${ext}`,
        binary:   binary,
        digest:   digest,
        prefix:   prefix,
        location: event.executable,
    }
}

async function sha256(file) {
    let hash   = createHash('SHA256');
    let reader = createReadStream(file);
    let stream = Readable.toWeb(reader);

    await stream.pipeTo(new WritableStream({
        write: (chunk) => hash.update(chunk)
    }));

    return hash.digest('hex');
}
