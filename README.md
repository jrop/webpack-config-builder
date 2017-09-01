# webpack-configify

[![Greenkeeper badge](https://badges.greenkeeper.io/jrop/webpack-configify.svg)](https://greenkeeper.io/)

A (slightly opinionated) utility to make Webpack configuration less unwieldy.

## Installation

```sh
npm install --save-dev webpack-configify
# or
yarn add --dev webpack-configify
```

## Use

```js
// file: webpack.config.js
const builder = require('webpack-configify')
const {isDevelopment, isProduction} = require('asenv')

module.exports = builder()
	.development(isDevelopment())
	.production(isProduction())
	.src('src/*.js')
	.dest('build/')
	.loader(['.js', '.jsx'], 'babel-loader', {
		presets: ['latest', 'react'],
	})
	.merge({/* ...your custom webpack configuration here... (uses webpack-merge) */})
	.build()
```

For further options/methods you can [view the documentation](https://jrop.github.io/webpack-configify/).

## License

ISC License (ISC)
Copyright 2017 Jonathan Apodaca <jrapodaca@gmail.com>

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
