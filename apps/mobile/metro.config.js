const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Let Metro see files outside apps/mobile (needed to resolve
// packages/shared-types, which lives at the monorepo root).
config.watchFolders = [workspaceRoot];

// Look for modules both in apps/mobile/node_modules and the hoisted
// workspace root node_modules (npm/yarn workspaces hoist shared deps up).
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Workspace packages are symlinked into node_modules; make sure Metro
// resolves the real file so its own resolution (and Fast Refresh) works.
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
