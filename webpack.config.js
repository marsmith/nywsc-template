const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    entry: {
      index: './src/index.js',
    },
    resolve: {
      alias: {
          jquery: "jquery/src/jquery"
        }
    },
    // Path and filename of your result bundle.
    // Webpack will bundle all JavaScript into this file
    plugins: [
    
      new MiniCssExtractPlugin({
        filename: "css/[name].css"
      }),
      new HtmlWebpackPlugin({
        chunks: ['index'],
        filename: "index.html",
          template: "src/index.html"
      }),
      new CleanWebpackPlugin(),
      new CopyPlugin({
        patterns: [
          { from: 'src/img', to: 'img' },
          { from: 'node_modules/@uswds/uswds/dist/img', to: 'img' },
          { from: 'node_modules/@uswds/uswds/dist/fonts', to: 'fonts' }
      ]}),
    ],
    devServer: {
        open: true,
        static: path.join(__dirname, 'dist'),
        compress: true,
        historyApiFallback: {
          index: 'index.html',
        },
        port: 9000
    },
    output: {
      filename: 'js/[name].js',
      path: path.join(__dirname, 'dist')
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader"
          }
        },
        {
            // Apply rule for .sass, .scss or .css files
            test: /\.(sa|sc|c)ss$/,

            // Set loaders to transform files.
            // Loaders are applying from right to left(!)
            // The first loader will be applied after others
            use: 
            [
                {
                    // After all CSS loaders we use plugin to do his work.
                    // It gets all transformed CSS and extracts it into separate
                    // single bundled file
                    loader: MiniCssExtractPlugin.loader
                },
                {
                    // This loader resolves url() and @imports inside CSS
                    loader: "css-loader",options: { url: false, sourceMap: true }
                },
                {
                    // Then we apply postCSS fixes like autoprefixer and minifying
                    loader: "postcss-loader",
                    options: {
                      sourceMap: true
                    }
                },
                // {
                //     // First we transform SASS to standard CSS
                //     loader: "sass-loader",
                //     options: {
                //       implementation: require("node-sass"),
                //       sourceMap: true,
                //       sassOptions: {
                //         includePaths: [
                //           "./node_modules/@uswds",
                //           "./node_modules/@uswds/uswds/packages",
                //         ],
                //       },
                //     },
                // }
            ]
          }
      ]
    }
      
  };