#!/usr/bin/env bun
import { Command } from "commander";
import { generate } from "./commands/generate.js";
import { createTheme, listThemes } from "./commands/theme.js";
import { addTemplate, listTemplates } from "./commands/template.js";
import { loadConfig } from "./config.js";
import { log } from "./utils/logger.js";
import {
  getPreference,
  getPreferencesFilePath,
  loadPreferences,
  PREFERENCE_KEYS,
  removePreference,
  setPreference,
} from "./utils/preferences.js";

const program = new Command();

program
  .name("slideforge")
  .description(
    "Generate Instagram card news (1080x1440px). " +
      "Use as an MCP server (recommended) or CLI for template re-rendering.",
  )
  .version("0.1.0");

program
  .command("generate")
  .description("Apply copy.json to HTML slide templates and export PNGs")
  .requiredOption("--template <dir>", "Source directory with slides/ templates to reuse")
  .requiredOption(
    "--rerender <file>",
    "Path to copy.json to apply to templates",
  )
  .option("-t, --theme <name>", "Theme to use")
  .option("-o, --output <dir>", "Output directory")
  .action(async (opts) => {
    try {
      const config = loadConfig();
      opts.theme = opts.theme || config.defaultTheme || getPreference("theme") || "default";

      await generate(opts);
    } catch (err) {
      log.error("Generation failed", err instanceof Error ? err : undefined);
      process.exit(1);
    }
  });

program
  .command("theme")
  .description("Manage themes")
  .addCommand(
    new Command("list").description("List available themes").action(async () => {
      await listThemes();
    }),
  )
  .addCommand(
    new Command("create")
      .description("Create a new theme")
      .argument("<name>", "Name of the new theme")
      .action(async (name: string) => {
        await createTheme(name);
      }),
  );

program
  .command("template")
  .description("Manage saved slide templates")
  .addCommand(
    new Command("list").description("List saved templates").action(async () => {
      await listTemplates();
    }),
  )
  .addCommand(
    new Command("add")
      .description("Save an output folder as a reusable template")
      .argument("<folder>", "Output directory containing slides/ to save")
      .argument("[name]", "Template name (defaults to folder basename)")
      .action(async (folder: string, name?: string) => {
        await addTemplate(folder, name);
      }),
  );

// ─── Config / Preferences ───────────────────────────────────────────────

const configCmd = program
  .command("config")
  .description("Manage user preferences (persisted cross-platform)");

configCmd
  .command("set")
  .description("Set a user preference")
  .argument("<key>", `Preference key (${PREFERENCE_KEYS.join(", ")})`)
  .argument("<value>", "Value to set")
  .action((key: string, value: string) => {
    if (!PREFERENCE_KEYS.includes(key as keyof import("./utils/preferences.js").UserPreferences)) {
      log.error(`Unknown preference key: "${key}". Valid keys: ${PREFERENCE_KEYS.join(", ")}`);
      process.exit(1);
    }

    const typedKey = key as keyof import("./utils/preferences.js").UserPreferences;

    if (typedKey === "slides") {
      const num = parseInt(value, 10);
      if (Number.isNaN(num) || num < 3 || num > 20) {
        log.error("Slides must be a number between 3 and 20.");
        process.exit(1);
      }
      setPreference(typedKey, num);
    } else {
      setPreference(typedKey, value);
    }

    log.success(`Set ${key} = ${value}`);
    log.info(`Saved to: ${getPreferencesFilePath()}`);
  });

configCmd
  .command("get")
  .description("Get a user preference value")
  .argument("<key>", `Preference key (${PREFERENCE_KEYS.join(", ")})`)
  .action((key: string) => {
    if (!PREFERENCE_KEYS.includes(key as keyof import("./utils/preferences.js").UserPreferences)) {
      log.error(`Unknown preference key: "${key}". Valid keys: ${PREFERENCE_KEYS.join(", ")}`);
      process.exit(1);
    }

    const value = getPreference(key as keyof import("./utils/preferences.js").UserPreferences);
    if (value === undefined) {
      log.info(`${key}: (not set)`);
    } else {
      log.info(`${key}: ${value}`);
    }
  });

configCmd
  .command("list")
  .description("List all user preferences")
  .action(() => {
    const prefs = loadPreferences();
    const entries = Object.entries(prefs).filter(([, v]) => v !== undefined);

    if (entries.length === 0) {
      log.info("No preferences set.");
      log.info(`File: ${getPreferencesFilePath()}`);
      return;
    }

    log.banner("User Preferences");
    for (const [key, value] of entries) {
      log.info(`  ${key}: ${value}`);
    }
    log.divider();
    log.info(`File: ${getPreferencesFilePath()}`);
  });

configCmd
  .command("unset")
  .description("Remove a user preference")
  .argument("<key>", `Preference key (${PREFERENCE_KEYS.join(", ")})`)
  .action((key: string) => {
    if (!PREFERENCE_KEYS.includes(key as keyof import("./utils/preferences.js").UserPreferences)) {
      log.error(`Unknown preference key: "${key}". Valid keys: ${PREFERENCE_KEYS.join(", ")}`);
      process.exit(1);
    }

    removePreference(key as keyof import("./utils/preferences.js").UserPreferences);
    log.success(`Removed preference: ${key}`);
  });

program.parse();
