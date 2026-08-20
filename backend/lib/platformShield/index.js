import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

async function hasCli(name) {
  try {
    if (process.platform === 'win32') {
      await execFileAsync('where', [name], { timeout: 5000 });
    } else {
      await execFileAsync('sh', ['-c', `command -v ${name}`], { timeout: 5000 });
    }
    return true;
  } catch {
    return false;
  }
}

export async function getPlatformToolStatus() {
  const [trivy, lynis, nuclei] = await Promise.all([
    hasCli('trivy'),
    hasCli('lynis'),
    hasCli('nuclei'),
  ]);
  return {
    shield: 'SG16 Platform Shield',
    license: 'OSS defensive scanners — trivy, lynis, nuclei on Railway container',
    brain: 'mistral:7b-instruct (Apache 2.0) — separate from these scanners',
    clis: { trivy, lynis, nuclei },
    ready: trivy && lynis && nuclei,
  };
}
