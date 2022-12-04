import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

export async function rustc(...args) {
    let stdio = ['inherit', 'pipe', 'inherit'];
    let rustc = spawn('rustc', args, { stdio });
    let input = createInterface({ input: rustc.stdout });

    let output = [];
    for await (let line of input) {
        output.push(line);
    }

    return output;
}
