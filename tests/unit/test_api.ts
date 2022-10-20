const path = require('path')
const log = require('@whi/stdlog')(path.basename(__filename), {
  level: process.env.LOG_LEVEL || 'fatal'
})

import { expect } from 'chai'

require("../mock_browser")
const mock_comb = require("../mock_comb")

let WebSdkApi
WebSdkApi = require("../../src/index").default

describe("test API endpoints", () => {
  let holo;
  before(async () => {
    // Expected handshake response when successful is { happ_id, agent_state }
    mock_comb.nextResponse({ happ_id: '', agent_state: {} });
    holo = await WebSdkApi.connect({
      chaperoneUrl: ''
    });
  })

  it("should call zome function", async () => {
    mock_comb.nextResponse({
      type: 'ok',
      data: {
        "balance": "0",
        "credit": "0",
        "payable": "0",
        "receivable": "0",
        "fees": "0",
        "available": "0",  
      }
    })

    const response = await holo.callZome({
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
    WebSdkApi = require("../../src/index").default
  })
  after(() => {
    (<any>global).COMB = globalComb;
  })

  it("should throw an error from COMB", async () => {
    let thrownMessage;
    try {
      // Expected handshake response when successful is { happ_id, agent_state }
      mock_comb.nextResponse({ happ_id: '', agent_state: {} });
      await WebSdkApi.connect({});
    } catch (e) {
      thrownMessage = e.message;
    }
    expect(thrownMessage).to.equal(expectedError);
  })
})
