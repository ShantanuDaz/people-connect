import fs from 'bare-fs/promises';
import path from 'bare-path';

let cachedConfig = null;

export const saveLocalConfig = async (storageDir, pubKeys) => {
  const configPath = path.join(storageDir, 'worker-config.json');
  await fs.writeFile(configPath, JSON.stringify(pubKeys, null, 2));
  cachedConfig = pubKeys;
};

export const getLocalConfig = async (storageDir) => {
  if (cachedConfig) return cachedConfig;
  try {
    const configPath = path.join(storageDir, 'worker-config.json');
    const data = await fs.readFile(configPath, 'utf8');
    cachedConfig = JSON.parse(data);
    return cachedConfig;
  } catch (err) {
    return null;
  }
};
