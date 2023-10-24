module.exports = {
  target: "web",
  mode: 'development', // production | development
  devtool: 'source-map',
  
  experiments: {
    outputModule: true,
  },

  entry: [ "babel-polyfill", "./src/index.ts" ],

  // Assign 'module.exports' to the variable defined by `output.library`
  output: {
    library: {
      type: "module",
    },
    filename: "holo_hosting_web_sdk.js",
    publicPath: "/dist/",
  },

  resolve: {
    extensions: [".ts", ".js"],
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      buffer: require.resolve("buffer/"),
    },
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/, loader: "ts-loader"
      }, 
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env','@babel/preset-typescript']
          }
        }
      }
    ],
  },
};
