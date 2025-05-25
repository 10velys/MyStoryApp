const common = require("./webpack.common.js");
const { merge } = require("webpack-merge");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const WorkboxWebpackPlugin = require("workbox-webpack-plugin");
const path = require("path");

module.exports = merge(common, {
  mode: "production",
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env"],
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: "styles.css",
    }),
    new WorkboxWebpackPlugin.InjectManifest({
      swSrc: path.resolve(__dirname, 'src/public/service-worker.js'),
      swDest: 'service-worker.js',
      exclude: [
        /\.map$/,
        /manifest\.json$/,
        /\.DS_Store$/,
        /CNAME$/,
      ],
      maximumFileSizeToCacheInBytes: 10000000, 
      include: [/\.html$/, /\.js$/, /\.css$/, /\.png$/, /\.jpg$/, /\.jpeg$/, /\.svg$/, /\.ico$/, /\.webp$/],
      manifestTransforms: [(manifestEntries) => {
        console.log('[Workbox] Precaching', manifestEntries.length, 'files');
        return { manifest: manifestEntries };
      }],
    }),
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
});