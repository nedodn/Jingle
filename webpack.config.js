const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './app/js/App.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'App.js'
  },
  plugins: [
  ],
  module: {
    rules: [
      {
       test: /\.css$/,
       use: [ 'style-loader', 'css-loader' ]
      },
      { test: /\.json$/, use: 'json-loader' },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015'],
          plugins: ['transform-runtime']
        }
      }
    ]
  }
}
