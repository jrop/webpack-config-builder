import arrify from 'arrify'
import common from 'common-dir'
import merge from 'webpack-merge'
import path from 'path'
import {sync as globby} from 'globby'
import webpack from 'webpack'

// http://stackoverflow.com/questions/3115150
function _reEscape(text) {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}

// remove the file extension from the file path:
function _noext(f) {
	const ext = path.extname(f)
	return f.slice(0, -ext.length)
}

/**
 * The configuration builder class
 * @public
 */
class ConfigurationBuilder {
	constructor() {
		this._cfg = {}
	}

	/**
	 * Define aliases
	 * @see https://webpack.js.org/configuration/resolve/#resolve-alias
	 * @param {object} aliases The alias specifications
	 * @return {ConfigurationBuilder}
	 * @example
	 * // webpack.config.js
	 * module.exports = builder()
	 *   .alias({
	 *     'react': 'inferno-compat',
	 *     'react-dom': 'inferno-compat',
	 *   })
	 *   .build()
	 */
	alias(aliases) {
		return this.merge({
			resolve: {
				alias: aliases,
			},
		})
	}

	/**
	 * Returns a plain JavaScript object representing the built Webpack configuration
	 * @return {object}
	 * @example
	 * // webpack.config.js
	 * module.exports = builder()
	 *   .build()
	 */
	build() {
		return this._cfg
	}

	/**
	 * Set the output directory
	 * @param {string} dir The output directory; this path may be relative or absolute
	 * @param {boolean} chunkhash=true Whether to include [chunkhash] in the filename
	 * @return {ConfigurationBuilder}
	 * @example
	 * // webpack.config.js
	 * module.exports = builder()
	 *   .dest('build/public/js', false)
	 *   .build()
	 */
	dest(dir, chunkhash = true) {
		let ManifestPlugin = false
		try {
			ManifestPlugin = require('webpack-manifest-plugin')
		} catch (e) {} // eslint-disable-line no-empty
		chunkhash = chunkhash && Boolean(ManifestPlugin)
		if (chunkhash && ManifestPlugin) this.plugins(new ManifestPlugin())
		return this.merge({
			output: {
				path: path.resolve(dir),
				filename: `${chunkhash ? '[chunkhash].' : ''}[name].js`,
			},
		})
	}

	/**
	 * Specify whether or not to generate development configuration
	 * @param {boolean} enable Whether or not to enable development mode
	 * @return {ConfigurationBuilder}
	 * @example
	 * // webpack.config.js
	 * module.exports = builder()
	 *   .development((process.env.NODE_ENV || 'development') == 'development')
	 *   .build()
	 */
	development(enable) {
		if (!enable) return this
		return this.merge({
			devtool: 'source-map',
			output: {
				pathinfo: true,
			},
		})
	}

	/**
	 * Turns on overlay and optional proxy
	 * @param {Object} opts (plus optional 'proxy' options to be passed to 'http-proxy')
	 * @return {ConfigurationBuilder}
	 * @example
	 * // webpack.config.js
	 * module.exports = builder()
	 *   .devServer({
	 *     publicPath: '/js/',
	 *     proxy: {
	 *       target: 'https://localhost:8443/',
	 *       secure: false,
	 *     },
	 *   })
	 *   .build()
	 */
	devServer(opts) {
		opts = opts || {}
		const {proxy: proxyOptions} = opts
		delete opts.proxy
		return this.merge({
			devServer: Object.assign(
				{},
				{
					overlay: true,
					after(app) {
						if (typeof proxyOptions == 'undefined') return
						const proxy = require('http-proxy').createProxyServer(proxyOptions)
						app.use((req, res, next) => {
							console.error(
								'webpack-dev-middleware: proxy:',
								req.method,
								req.url
							)
							proxy.web(req, res, {}, err => {
								if (err) return next(err)
							})
						})
					},
				},
				opts
			),
		})
	}

	/**
	 * Add resolvable extensions (ex: '.jsx', '.css')
	 * @see https://webpack.js.org/configuration/resolve/#resolve-extensions
	 * @param {...string} ext The extensions to add
	 * @return {ConfigurationBuilder}
	 * @example
	 * // webpack.config.js
	 * module.exports = builder()
	 *   .extensions('.js', '.jsx', '.ts', '.css', '.less', '.scss')
	 *   .build()
	 */
	extensions(...ext) {
		return this.merge({
			resolve: {extensions: ext},
		})
	}

	/**
	 * Exclude certain modules/files from the bundle
	 * @param {string|string[]} depsOrFiles The array of files/module to exclude
	 * @param {string} moduleType see: https://webpack.js.org/configuration/externals/#externals
	 * @example
	 * module.exports = builder()
	 *   .externals(Object.keys(require('./package').dependencies))
	 *   .build()
	 *
	 * // Exclude specific file:
	 *
	 * module.exports = builder()
	 *   // Note how we are using 'config/index' and not 'config/index.js'
	 *   // Be sure to match exactly how you are requiring/importing the file
	 *   // For example, if you require the file with `require('./config/index')`
	 *   // then exclude 'config/index' (without extension).  However if your code
	 *   // looks like `require('./config/index.js')`, then exclude 'config/index.js'
	 *   .externals(path.resolve('config/index'))
	 *   .build()
	 */
	externals(depsOrFiles, moduleType = 'commonjs') {
		depsOrFiles = arrify(depsOrFiles)
		return this.merge({
			externals(ctx, req, done) {
				let mod = req
				if (mod.startsWith('@')) mod = mod.split('/')[1]
				if (/^(?:\.\.?|\/)/.test(mod)) {
					// file
					mod = path.resolve(ctx, mod)
				} else mod = /^(?:.*!)?((?:@[^\/]+\/)?[^\/]+)/.exec(req)[1]

				if (depsOrFiles.includes(mod)) return done(null, `${moduleType} ${req}`)
				else return done()
			},
		})
	}

	/**
	 * Add a loader
	 * @see https://webpack.js.org/configuration/module/#module-rules
	 * @param {string|Array<string>} ext The file extensions to match
	 * @param {string|Array<string>} loader The loader spec
	 * @param {?object} query The loader parameters
	 * @return {ConfigurationBuilder}
	 * @example
	 * // webpack.config.js
	 * module.exports = builder()
	 *   .loader(['.js', '.jsx'], 'babel-loader', {
	 *     presets: ['latest', 'react'],
	 *   })
	 *   .build()
	 */
	loader(ext, loader, query) {
		return this.merge({
			module: {
				rules: [
					Object.assign(
						{
							test: new RegExp(
								`(${arrify(ext)
									.map(type => _reEscape(type))
									.join('|')})$`
							),
							loader,
							exclude: /\/node_modules/,
						},
						query ? {query} : null
					),
				],
			},
		})
	}

	/**
	 * Merge configuration using `webpack-merge`
	 * @see https://github.com/survivejs/webpack-merge
	 * @param {...object} cfgs The configurations to merge
	 * @return {ConfigurationBuilder}
	 * @example
	 * // webpack.config.js
	 * module.exports = builder()
	 *   .merge({
	 *     resolve: {
	 *       modules: ['node_modules'],
	 *     },
	 *   })
	 *   .build()
	 */
	merge(...cfgs) {
		Object.assign(this._cfg, merge(this._cfg, ...cfgs))
		return this
	}

	/**
	 * Add plugins
	 * @param {...object} plugins The plugins to add
	 * @return {ConfigurationBuilder}
	 * @example
	 * // webpack.config.js
	 * module.exports = builder()
	 *   .plugins(new Plugin1(), new Plugin2())
	 *   .build()
	 */
	plugins(...plugins) {
		return this.merge({plugins})
	}

	/**
	 * Specify whether or not to generate production configuration
	 * @param {boolean} enable Whether or not to enable production mode
	 * @return {ConfigurationBuilder}
	 * @example
	 * // webpack.config.js
	 * module.exports = builder()
	 *   .production(process.env.NODE_ENV == 'production')
	 *   .build()
	 */
	production(enable) {
		if (!enable) return this
		return this.plugins(
			new webpack.optimize.UglifyJsPlugin({
				comments: false,
				compress: {warnings: false},
				minimize: true,
			}),
			new webpack.DefinePlugin({
				'process.env.NODE_ENV': JSON.stringify('production'),
			})
		)
	}

	/**
	 * Set entry/entries based on glob(s)
	 * @param {...string} globs The file globs
	 * @return {ConfigurationBuilder}
	 * @example
	 * // webpack.config.js
	 * module.exports = builder()
	 *   .src('src/*.js')
	 *   .build()
	 */
	src(...globs) {
		const cwd = process.cwd()
		const files = globby(globs, {cwd}).map(f => path.resolve(cwd, f))
		const base = files.length == 1 ? path.dirname(files[0]) : common(files)
		return this.merge({
			entry: Object.assign(
				{},
				...files.map(file => ({[_noext(path.relative(base, file))]: file}))
			),
		})
	}

	/**
	 * Specify vendor modules
	 * @param {...string} modules The vendor modules
	 * @return {ConfigurationBuilder}
	 * @example
	 * // webpack.config.js
	 * module.exports = builder()
	 *   .vendor('react', 'react-dom', ...)
	 *   .build()
	 */
	vendor(...modules) {
		return this.plugins(
			new webpack.optimize.CommonsChunkPlugin({names: ['vendor', 'manifest']})
		).merge({
			entry: {
				vendor: modules,
			},
		})
	}
}

/**
 * Creates a configuration builder and returns it
 * @return {ConfigurationBuilder}
 */
export default function builder() {
	return new ConfigurationBuilder()
}
