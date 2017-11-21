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

test('devServer', t => {
	let config = cfg()
		.devServer({
			publicPath: '/js/',
		})
		.build()
	t.equal(config.devServer.overlay, true)
	t.equal(config.devServer.publicPath, '/js/')
	t.assert(typeof config.devServer.after == 'function')
	t.doesNotThrow(() => config.devServer.after())

	config = cfg()
		.devServer({
			overlay: false,
		})
		.build()
	t.equal(config.devServer.overlay, false)
	t.doesNotThrow(() => config.devServer.after())
	t.end()
})

// TODO: add more tests
