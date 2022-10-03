module.exports			= {
	target: "web",

	mode: 'development', // production | development
	devtool: 'source-map',

	entry: [ "babel-polyfill", "./src/index.ts" ],

	// Assign 'module.exports' to the variable defined by `output.library`
	output: {
		library: "HoloWebSDK",
		libraryTarget: "umd",

		publicPath: "/dist/",
	},

	resolve: {
		extensions: [".ts"]
	},

	module: {
		rules: [
			{
				test: /\.tsx?$/, loader: "ts-loader"
			}, 
			// {
			// 	test: /\.js?$/, loader: "source-map-loader"
			// }, 
			{
				test: /\.m?js$/,
				exclude: /(node_modules|bower_components)/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env']
					}
				}
			}
		],
	},

	plugins: [
	],
};
