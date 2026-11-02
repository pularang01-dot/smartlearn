import { execSync } from 'node:child_process';
const cmd = process.platform === 'win32'
  ? `powershell -Command "Compress-Archive -Path (Get-ChildItem -Force | Where-Object { $_.Name -notin 'node_modules','dist','.env','smartlearn-motion-project.zip' }) -DestinationPath smartlearn-motion-project.zip -Force"`
  : `zip -r smartlearn-motion-project.zip . -x "node_modules/*" "dist/*" ".env" "*.zip"`;
execSync(cmd, { stdio: 'inherit' });
