import pkg from './package.json' assert { type: 'json' };
import rollupTypescript from '@rollup/plugin-typescript';
import typescript from 'typescript';

const license = `/*!
 * @author yomotsu
 * dissolve-transition
 * https://github.com/yomotsu/dissolve-transition
 * Released under the MIT License.
 */`;

export default {
	input: 'src/index.ts',
	output: [
		{
			format: 'umd',
			name: 'DissolveTransition',
			file: pkg.main,
			banner: license,
			indent: '\t',
		},
		{
			format: 'es',
			file: pkg.module,
			banner: license,
			indent: '\t',
		}
	],
	plugins: [
		rollupTypescript( { typescript } ),
	],
};
