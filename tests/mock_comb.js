
let next_response;

global.COMB = {
    async connect () {
	return Promise.resolve({
	    call() {
		if ( next_response === undefined )
		    return `{"Err":"Next response is undefined"}`
		else {
		    const value			= next_response;
		    next_response		= undefined;
		    return value;
		}
	    }
	});
    }
}

module.exports = {
    nextResponse ( value ) {
	if ( typeof value !== "string" )
	    value				= JSON.stringify( value );

	next_response				= value;
    }
}
