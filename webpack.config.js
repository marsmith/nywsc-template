var path = require('path');
var webpack = require('webpack');
var pkg = require('./package.json');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var { CleanWebpackPlugin } = require('clean-webpack-plugin');
var CopyPlugin = require('copy-webpack-plugin');

var PATHS = {
    dist: path.join(__dirname, 'dist/'),
    src: path.join(__dirname, 'src/')
  };

module.exports = {
    entry: './src/app.js',
    output: {
        filename: '[name].[contenthash].js',
        path: PATHS.dist
    },
    optimization: {
		splitChunks: {
			cacheGroups: {
				commons: {
					test: /[\\/]node_modules[\\/]/,
					name: 'vendors',
					chunks: 'all'
				}
			}
		}
	},
    module: {
        rules: [
            { test: /\.css$/, use: ['style-loader', 'css-loader' ] },
            { test: /\.png$/, loader: 'url-loader?limit=8192', query: { mimetype: 'image/png' } },
            { test: /\.woff($|\?)|\.woff2($|\?)|\.ttf($|\?)|\.eot($|\?)|\.svg($|\?)/, loader: 'url-loader' },
            { test: /\.js?$/, exclude: '/node_modules/', use: { loader: 'babel-loader' } },
            { test: /\.html$/, loader: 'raw-loader' }
        ]
    },
    plugins: [
        new webpack.ProvidePlugin({
            '$': 'jquery'
        }),
        new webpack.DefinePlugin( {'VERSION': JSON.stringify(pkg.version) }),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            inject: 'head',
            template: './src/index.html'
        }),
        new CleanWebpackPlugin(),
        new CopyPlugin({
            patterns: [
                { from: './src/appConfig.js', to: './' },
                { from: './src/images', to: './images' },
            ]
        }),
        new webpack.ContextReplacementPlugin(
            /moment[/\\]locale$/,
            /en/
        ),
        //new BundleAnalyzerPlugin()
    ],
    devServer: {
        open: true,
        contentBase: PATHS.src,
        watchContentBase: true,
        port: 8008
    }
};
