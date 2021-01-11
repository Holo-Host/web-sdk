const path				= require('path');
const log				= require('@whi/stdlog')(path.basename( __filename ), {
    level: process.env.LOG_LEVEL || 'fatal',
});

const expect				= require('chai').expect;

require("../mock_browser.js");
const mock_comb				= require("../mock_comb.js");
const { Connection }			= require("../../src/index.js");



describe("Javascript API", () => {

    it("should call zome function", async () => {
	const envoy			= new Connection();
	await envoy.ready();

	mock_comb.nextResponse({
	"Ok":{
		"balance":		"0",
		"credit":		"0",
		"payable":		"0",
		"receivable":	"0",
		"fees":		"0",
		"available":	"0",
	}
	});

	const response		= await envoy.zomeCall(
	"holofuel", "transactions", "ledger_state"
	);

	log.debug("Response: %s", response );
	const state			= response.Ok;

	expect( state		).to.be.an("object");
	expect( Object.keys(state)	).to.have.members([
	"balance", "credit", "payable", "receivable", "fees", "available"
	]);
    });

    it("should call app_info", async () => {
	const installed_app_id = 'app_id'
	const envoy			= new Connection();
	await envoy.ready();

	const expectedResponse 	= {
	installed_app_id,
	cell_data: [[['hash', 'pubkey'], 'dna_alias']]
	};

	mock_comb.nextResponse(expectedResponse);

	const response		= await envoy.appInfo(installed_app_id);

	log.debug("Response: %s", response );

	expect( response		).to.be.an("object");
	expect( response 		).to.equal(expectedResponse)
    });

    describe("ready", () => {
	let globalComb;
	const expectedError = 'timeout error';

	before(() => {
	    globalComb = global.COMB;
	    global.COMB = {
		connect () {
		    throw new Error(expectedError);
		}
	    }
	})

	after(() => {
	    global.COMB = globalComb;
	})
	
	it("throws an error from COMB", async () => {
	    let thrownMessage;
   	    const envoy			= new Connection();
	    try {
		await envoy.ready();
	    } catch (e)	{
		thrownMessage = e.message;
	    }
	    expect( thrownMessage 	).to.equal(expectedError);
	})
    });


});
