

class Connection {
    constructor () {
	this.waiting			= [];
	this.child			= null;
	this.connect();
    }

    ready ( timeout ) {
	return new Promise((f,r) => {
	    this.child !== null
		? f()
		: this.waiting.push(f);
	});
    }

    async connect () {
	this.child			= await COMB.connect( "http://localhost:24273" );
	let f;
	while (f = this.waiting.shift()) {
	    f();
	}
    }

    async zomeCall ( ...args ) {
	let result;
	const response			= await this.child.run("zomeCall", ...args );

	try {
	    result			= JSON.parse( response );
	} catch (err) {
	    console.error( err );
	}

	return result;
    }
}


module.exports = {
    Connection,
};
