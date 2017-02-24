const builder = require('../').default
module.exports = builder()
	.development(process.env.NODE_ENV != 'production')
	.production(process.env.NODE_ENV == 'production')
	.loader('.js', 'babel-loader')

	.src('./src/index')
	.dest('./build/', false)
	.build()
console.log(require('util').inspect(module.exports, {depth: 4}))
