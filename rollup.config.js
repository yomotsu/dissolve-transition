import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';

const license = `/*!
 * @author yomotsu
 * dissolve-transitions
 * https://github.com/yomotsu/dissolve-transitions
 * Released under the MIT License.
 */`;

export default {
	input: 'src/index.ts',
	output: [
		{
			format: 'umd',
			name: 'DissolveTransitions',
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
		typescript( { typescript: require( 'typescript' ) } ),
	],
};
