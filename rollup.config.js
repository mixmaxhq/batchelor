import babel from 'rollup-plugin-babel';
import pkg from './package.json';

const external = new Set([
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
]);

export default {
  input: './src/index.js',
  external: (id) => external.has(id) || id.startsWith('@babel/runtime/'),
  plugins: [
    babel({
      // See babel.config.js for the config.
      runtimeHelpers: true,
    }),
  ],
  output: {
    format: 'cjs',
    file: pkg.main,
  },
};
