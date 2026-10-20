// Lets the app import the shared chess logic in ../core, resolving its packages from this app's node_modules.
const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)
config.watchFolders = [path.resolve(__dirname, '../core')]
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')]

module.exports = config
