import { z } from "zod";

const ConfigSchema = z.object({
  chromePath: z.string().optional(),
  defaultTheme: z.string().optional(),
  defaultAuthor: z.string().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

let _config: Config | null = null;

export function loadConfig(): Config {
  if (_config) return _config;

  const raw = {
    chromePath: process.env.CHROME_PATH || undefined,
    defaultTheme: process.env.DEFAULT_THEME || undefined,
    defaultAuthor: process.env.DEFAULT_AUTHOR || undefined,
  };

  const result = ConfigSchema.safeParse(raw);
  if (!result.success) {
    const errors = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Configuration error:\n${errors}`);
  }

  _config = result.data;
  return _config;
}

export function getConfig(): Config {
  if (!_config) return loadConfig();
  return _config;
}

/**
 * Reset cached config. Useful for testing.
 */
export function resetConfig(): void {
  _config = null;
}
