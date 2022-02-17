const path = require('path');
const log = require('@whi/stdlog')(path.basename(__filename), {
  level: process.env.LOG_LEVEL || 'fatal',
});

const expect = require('chai').expect;
let WebSdkApi = require("../../src/index.js")

require("../mock_browser.js");
const mock_comb = require("../mock_comb.js");


describe("test API endpoints", () => {
  let holo;
  before(async () => {
    // Expected handshake response when successful is null
    mock_comb.nextResponse(null);
    holo = await WebSdkApi.connect();
  })

  it("should call zome function", async () => {
    mock_comb.nextResponse({
      "balance": "0",
      "credit": "0",
      "payable": "0",
      "receivable": "0",
      "fees": "0",
      "available": "0",
    });

    const response = await holo.zomeCall({
      roleId: "holofuel",
      zome: "transactions",
      fn: "ledger_state",
      args: null,
      cap_token: null
    });

    log.debug("Response: %s", response);

    expect(response).to.be.an("object");
    expect(Object.keys(response)).to.have.members([
      "balance", "credit", "payable", "receivable", "fees", "available"
    ]);
  });

  it("should call app_info", async () => {
    const installed_app_id = 'app_id'

    const expectedResponse = {
      installed_app_id,
      cell_data: [[['dna_hash', 'agent_pub_key'], 'dna_alias']]
    };

    mock_comb.nextResponse(expectedResponse);

    const response = await holo.appInfo(installed_app_id);

    log.debug("Response: %s", response);

    expect(response).to.be.an("object");
    expect(response).to.equal(expectedResponse)
  });
});

describe("test comb error", () => {
  let globalComb;
  const expectedError = 'timeout error';
  before(() => {
    globalComb = global.COMB;
    global.COMB = {
      connect() {
        throw new Error(expectedError);
      }
    };
    (WebSdkApi = require("../../src/index.js"))
  })
  after(() => {
    global.COMB = globalComb;
  })

  it("should throw an error from COMB", async () => {
    let thrownMessage;
    try {
      // Expected handshake response when successful is null
      mock_comb.nextResponse(null);
      await WebSdkApi.connect();
    } catch (e) {
      thrownMessage = e.message;
    }
    expect(thrownMessage).to.equal(expectedError);
  })
})

describe("test ready method", () => {
  it("should resolve ready method once the available event is resolved", async () => {
    let passed;
    // Expected handshake response when successful is null
    mock_comb.nextResponse(null);
    const holo = await WebSdkApi.connect();
    try {
      mock_comb.triggerEvent('available');
      await holo.ready();
      passed = true
    } catch (e) {
      passed = false
    }
    expect(passed).to.equal(true);
  })
});