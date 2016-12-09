'use strict'
const webpack = require('webpack')
const fs = require('fs')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

const ConsoleNotifierPlugin = function () {}

ConsoleNotifierPlugin.prototype.compilationDone = (stats) => {
  const log = (error) => {
    console.log(error.error.toString())
  }
  stats.compilation.errors.forEach(log)
}

ConsoleNotifierPlugin.prototype.apply = function (compiler) {
  compiler.plugin('done', this.compilationDone.bind(this))
}

let config = {
  entry: {
    app: ['whatwg-fetch', './js/app.jsx'],
    vendor: ['react', 'react-dom', 'react-router', 'leaflet', 'react-leaflet', 'wkx', 'buffer', 'autotrack']
  },
  output: {
    path: __dirname,
    filename: 'dist/app.js'
  },
  devtool: 'cheap-module-source-map',
  module: {
    loaders: [
      { test: /\.(js|jsx)?$/, loader: 'babel-loader', include: [fs.realpathSync(__dirname + '/js')] }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify(process.env.NODE_ENV)
      }
    }),
    new webpack.optimize.CommonsChunkPlugin('vendor', 'dist/vendor.js'),
  ]
}
if (process.env.NODE_ENV === 'production') {
  config.plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false
    })
  )
} else {
  config.plugins.push(
    new ConsoleNotifierPlugin()
  )
}
module.exports = config