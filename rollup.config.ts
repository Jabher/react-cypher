import { readFileSync } from 'fs'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import sourceMaps from 'rollup-plugin-sourcemaps'
import typescript from 'rollup-plugin-typescript2'
import json from 'rollup-plugin-json'

const pkg = JSON.parse(readFileSync(`./package.json`, `utf8`))

const libraryName = pkg.name

export default {
  input: `src/index.ts`,
  output: [
    {
      file: pkg.main,
      name: libraryName,
      format: `umd`,
      sourcemap: true
    },
    { file: pkg.module, format: `es`, sourcemap: true }
  ],
  external: [`react`, `react-dom`, `neo4j-driver`, `ramda`],
  watch: {
    include: `src/**`
  },
  plugins: [
    json(),
    typescript({ useTsconfigDeclarationDir: true }),
    commonjs(),
    resolve(),
    sourceMaps()
  ]
}
