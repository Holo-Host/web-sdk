const TESTING				= global.COMB !== undefined;

if ( !TESTING )
    COMB				= require('@holo-host/comb').COMB;

const { EventEmitter }			= require('events');


class Connection extends EventEmitter {

    constructor ( url ) {
	super();

	const hostname			= window.location.hostname;
	this.chaperone_url		= url || `http://${hostname}:24273`;
	console.log("Chaperone URL:", this.chaperone_url );

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
	try {
	    this.child			= await COMB.connect( this.chaperone_url, 5000 );
	} catch (err) {
	    if ( err.name === "TimeoutError" )
		console.log("Chaperone did not load properly.  Is it running?");
	    throw err;
	}

	let f;
	while (f = this.waiting.shift()) {
	    f();
	}

	if ( TESTING )
	    return;

	// Alerts:
	//   signin		- emitted when the user completes a successful sign-in
	//   signup		- emitted when the user completes a successful sign-up
	//   signout		- emitted when the user competes a successful sign-out
	//   canceled		- emitted when the user purposefully exits sign-in/up
	//   connected		- emitted when the connection is opened
	//   disconnected	- emitted when the connection is closed
	this.child.msg_bus.on("alert",	( event, ...args ) => {
	    this.emit( event );
	});
    }

    async context () {
	return Connection.HOSTED_ANONYMOUS;
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

    async signUp () {
	return await this.child.call("signUp");
    }

    async signIn () {
	const iframe			= document.getElementsByClassName("comb-frame-0")[0];
	const css			= iframe.style;
	css.zIndex			= "99999999";
	css.display			= "block";
	css.width			= "100%";
	css.height			= "100%";
	css.position			= "absolute";
	css.top				= "0";
	css.left			= "0";

	await this.child.call("signIn");

	css.display			= "none";
	return true;
    }

    async signOut () {
	return await this.child.run("signOut");
    }
}

Connection.AUTONOMOUS			= 1;
Connection.HOSTED_ANONYMOUS		= 2;
Connection.HOSTED_AGENT			= 3;

module.exports = {
    Connection,
};
