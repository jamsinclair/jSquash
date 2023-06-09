const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './main.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.m?js/,
        resolve: {
            fullySpecified: false
        }
      }
    ]
  },
  plugins: [
    new webpack.IgnorePlugin({
      resourceRegExp: /avif_enc_mt.worker/,
    }),
    new HtmlWebpackPlugin({
      template: 'index.html'
    })
  ],
  devServer: {
    static: path.resolve(__dirname, './'),
    port: 9000,
    open: true,
  },
};
