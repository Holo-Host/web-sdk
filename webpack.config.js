
const path			= require('path');

module.exports			= {
    target: "web",

    entry: [ "./build/index.js" ],

    // Assign 'module.exports' to the window variable
    output: {
	libraryTarget: "window",
    },
};
