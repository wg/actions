import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

export async function* cargo(command, target, profile, ...args) {
    args.unshift(command);

    args.push('--target',  target);
    args.push('--profile', profile);
    args.push('--message-format', 'json');

    let stdio = ['inherit', 'pipe', 'inherit'];
    let cargo = spawn('cargo', args, { stdio });
    let input = createInterface({ input: cargo.stdout });

    for await (let buffer of input) {
        yield JSON.parse(buffer);
    }
}
