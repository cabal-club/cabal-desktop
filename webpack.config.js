const nodeExternals = require('webpack-node-externals')

module.exports = {
  entry: './app/index.js',
  target: 'electron',
  externals: [nodeExternals()],
  output: {
    filename: 'static/build.js',
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
        include: `${__dirname}/app`,
        loader: 'babel-loader',
        query: {
          presets: ['react'],
          plugins: [
            'transform-object-rest-spread'
          ]
        }
      }
    ]
  }
}
