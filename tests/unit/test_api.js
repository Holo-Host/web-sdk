const path				= require('path');
const log				= require('@whi/stdlog')(path.basename( __filename ), {
    level: process.env.LOG_LEVEL || 'fatal',
});

const expect				= require('chai').expect;

const mock_browser			= require("../mock_browser.js");
const mock_comb				= require("../mock_comb.js");
const { Connection }			= require("../../src/index.js");


describe("Javascript API", () => {

    it("should call COMB.call", async () => {
	try {
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
	} finally {
	}
    });
});
