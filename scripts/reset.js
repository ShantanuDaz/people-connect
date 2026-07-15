import fs from 'fs/promises';
import path from 'path';
import os from 'os';

async function resetApp() {
  console.log('🧹 Starting app reset...');

  // Paths to clear
  const pathsToClear = [];

  // 1. Electron default userData path for 'people-connect'
  let userDataPath;
  if (process.platform === 'win32') {
    userDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'people-connect');
  } else if (process.platform === 'darwin') {
    userDataPath = path.join(os.homedir(), 'Library', 'Application Support', 'people-connect');
  } else {
    userDataPath = path.join(os.homedir(), '.config', 'people-connect');
  }
  pathsToClear.push(userDataPath);

  // 2. Client test data path (used in 'npm run dev:client')
  pathsToClear.push(path.join(process.cwd(), 'test-client-data'));

  // 3. Fallback corestore directory if accidentally created in project root
  pathsToClear.push(path.join(process.cwd(), 'corestore'));

  for (const dir of pathsToClear) {
    try {
      await fs.rm(dir, { recursive: true, force: true });
      console.log(`✅ Cleared: ${dir}`);
    } catch (err) {
      console.error(`❌ Failed to clear: ${dir}`, err.message);
    }
  }

  console.log('\n✨ Reset complete! You can now start the app with a clean slate.');
}

resetApp().catch(console.error);
