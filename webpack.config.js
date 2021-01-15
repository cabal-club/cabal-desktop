const Dotenv = require('dotenv-webpack')
const nodeExternals = require('webpack-node-externals')
const path = require('path')

module.exports = {
  entry: './app/index.js',
  mode: 'production',
  target: 'electron-renderer',
  watch: process.env.NODE_ENV === 'development',
  externals: [nodeExternals()],
  output: {
    path: path.join(__dirname, 'static'),
    filename: 'build.js',
    libraryTarget: 'commonjs2'
  },
  devtool: 'eval',
  node: {
    __dirname: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve(__dirname, 'app'),
        loader: 'babel-loader',
        query: {
          presets: ['@babel/react'],
          plugins: [
            '@babel/plugin-proposal-object-rest-spread'
          ]
        }
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new Dotenv()
  ]
}
