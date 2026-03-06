import { join } from "node:path";
import { ensureDir, fileExists, listDirs, writeJsonFile, writeOutputFile } from "../utils/file.js";
import { log } from "../utils/logger.js";
import { resolveFromSrc } from "../utils/paths.js";

function getThemesDir(): string {
  return resolveFromSrc("design-system", "themes");
}

export async function listThemes(): Promise<void> {
  const themesDir = getThemesDir();
  const dirs = await listDirs(themesDir);

  if (dirs.length === 0) {
    log.warn("No themes found.");
    return;
  }

  log.banner("Available Themes");
  for (const name of dirs) {
    log.info(`  ${name}`);
  }
}

export async function createTheme(name: string): Promise<void> {
  const themeDir = join(getThemesDir(), name);

  if (await fileExists(themeDir)) {
    log.error(`Theme "${name}" already exists.`);
    process.exit(1);
  }

  await ensureDir(themeDir);

  await writeJsonFile(join(themeDir, "theme.json"), {
    name,
    description: `${name} theme`,
    createdAt: new Date().toISOString(),
  });

  const themeCss = `/* ${name} theme overrides */
/* Override any design token from shared/design-tokens.css here */

:root {
  /* Example overrides: */
  /* --color-primary: #your-color; */
  /* --color-accent: #your-accent; */
  /* --fs-title: 60px; */
}
`;
  await writeOutputFile(join(themeDir, "theme.css"), themeCss);

  log.success(`Theme "${name}" created at ${themeDir}`);
  log.info("Edit theme.css to customize design tokens for this theme.");
}
