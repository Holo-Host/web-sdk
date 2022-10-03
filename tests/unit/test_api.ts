const path = require('path');
const log = require('@whi/stdlog')(path.basename(__filename), {
  level: process.env.LOG_LEVEL || 'fatal',
});

const expect = require('chai').expect;
let WebSdkApiLib = require("../../src/index.ts")

require("../mock_browser.ts");
const mock_comb = require("../mock_comb.ts");

describe("test API endpoints", () => {
  let holo;
  before(async () => {
    // Expected handshake response when successful is { happ_id, agent_state }
    mock_comb.nextResponse({ happ_id: '', agent_state: {} });
    holo = await WebSdkApiLib.connect({});
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
    globalComb = (<any>global).COMB;
    (<any>global).COMB = {
      connect() {
        throw new Error(expectedError);
      }
    };
    (WebSdkApiLib = require("../../src/index.ts"))
  })
  after(() => {
    (<any>global).COMB = globalComb;
  })

  it("should throw an error from COMB", async () => {
    let thrownMessage;
    try {
      // Expected handshake response when successful is { happ_id, agent_state }
      mock_comb.nextResponse({ happ_id: '', agent_state: {} });
      await WebSdkApiLib.connect({});
    } catch (e) {
      thrownMessage = e.message;
    }
    expect(thrownMessage).to.equal(expectedError);
  })
})
