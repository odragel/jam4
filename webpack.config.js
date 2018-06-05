const HtmlWebpackPlugin = require('html-webpack-plugin');

const path = require('path');
const distPath = path.resolve(__dirname, 'dist');

module.exports = {
    entry: './src/js/index.js',
    output: {
        path: distPath,
        filename: '[name].[hash].js'
    },
    plugins: [
        new HtmlWebpackPlugin({
          template: './index.html'
        })
      ],
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['babel-preset-env']
                    }
                }
            },
            { 
              type: 'javascript/auto',
              test: /\.json$/,
              loader: 'json-loader'
            },
            {
                test:/\.css$/,
                use:['style-loader','css-loader']
            }
        ]
    },
    devServer: {
      contentBase: distPath,
      port: 9000,
      compress: true,
      open: true
    }
};


