import cfg from '../src'
import path from 'path'
import test from 'tape'

test('builder', t => {
	const config = cfg()
		.src('sample-dir/**/*.js')
		.dest('dist')
		.build()
	t.deepLooseEqual(config, {
		entry: {
			js1: path.resolve(process.cwd(), 'sample-dir', 'js1.js'),
			js2: path.resolve(process.cwd(), 'sample-dir', 'js2.js'),
		},
		output: {
			path: path.resolve(process.cwd(), 'dist'),
			filename: '[name].js',
		},
	})
	t.end()
})

// TODO: add more tests
