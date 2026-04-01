const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(workspaceRoot, "node_modules"),
  path.resolve(projectRoot, "node_modules")
];
config.resolver.disableHierarchicalLookup = true;
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  "@tanstack/query-core": path.resolve(workspaceRoot, "node_modules/@tanstack/query-core/build/legacy/index.cjs"),
  "@tanstack/react-query": path.resolve(workspaceRoot, "node_modules/@tanstack/react-query/build/legacy/index.cjs")
};

module.exports = config;
