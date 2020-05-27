const { version: runtimeVersion } = require('@babel/runtime/package.json');

module.exports = (api) => ({
  plugins: [
    // The idiom for transpiling import/export syntax for use under jest without interfering with
    // rollup's module bundling process. The test will yield true under jest, and false under
    // rollup.
    ...(api.env('test') ? ['@babel/plugin-transform-modules-commonjs'] : []),
    [
      '@babel/plugin-transform-runtime',
      {
        // Explicitly specifying this version lets the plugin be more liberal with the helpers
        // that it imports instead of inlining.
        version: runtimeVersion,
      },
    ],
  ],
  presets: [['@babel/preset-env', { targets: { node: 'current' } }], '@babel/preset-flow'],
});
