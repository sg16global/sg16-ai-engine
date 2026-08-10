import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { CONFIG, ROOT, cliResult, writeReport } from './shared.mjs';

export async function runSonar() {
  const config = join(CONFIG, 'sonar-project.properties');
  const repo = join(ROOT, '..');
  const token = process.env.SONAR_TOKEN;

  if (!token) {
    const skipped = cliResult(
      'sonarqube-sonarlint',
      true,
      'skipped — set SONAR_TOKEN for SonarCloud/SonarQube scanner (SonarLint rules run via ESLint+sonarjs)',
      { skipped: true },
    );
    await writeReport('sonar-summary.json', skipped);
    return skipped;
  }

  const args = ['-Dproject.settings=' + config];
  if (process.env.SONAR_HOST_URL) args.push('-Dsonar.host.url=' + process.env.SONAR_HOST_URL);

  const result = spawnSync('sonar-scanner', args, {
    cwd: repo,
    encoding: 'utf8',
    env: { ...process.env, SONAR_TOKEN: token },
    shell: process.platform === 'win32',
  });

  const ok = (result.status ?? 1) === 0;
  const summary = cliResult('sonarqube-sonarlint', ok, ok ? 'Sonar scanner finished' : 'Sonar scanner failed', {
    exitCode: result.status,
  });
  await writeReport('sonar-summary.json', summary);
  return summary;
}
