import {describe, expect, test} from '@jest/globals';

const path = require('path')
const log = require('@whi/stdlog')(path.basename(__filename), {
  level: process.env.LOG_LEVEL || 'fatal'
})

require("./mock_browser")
const mock_comb = require("./mock_comb")

let WebSdkApi
WebSdkApi = require("../src/index").default

describe('test API endpoints', () => {
  let holo

  beforeEach(async () => {
    // Expected handshake response when successful is { happ_id, agent_state }
    mock_comb.nextResponse({ happ_id: '', chaperone_state: { agent_state: {}, ui_state: {} }, chaperone_version: `0.1.2` })
    holo = await WebSdkApi.connect({
      chaperoneUrl: ''
    })
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
    })

    log.debug("Response: %s", response)

    expect(response).toBeDefined()

    expect(response).toHaveProperty('balance');
    expect(response).toHaveProperty('credit');
    expect(response).toHaveProperty('payable');
    expect(response).toHaveProperty('receivable');
    expect(response).toHaveProperty('fees');
    expect(response).toHaveProperty('available');

  })  

  it("should call app_info", async () => {
    const installed_app_id = 'app_id'

    const expectedResponse = {
      installed_app_id,
      cell_data: [[['dna_hash', 'agent_pub_key'], 'dna_alias']]
    }

    mock_comb.nextResponse(expectedResponse)

    const response = await holo.appInfo(installed_app_id)

    log.debug("Response: %s", response)

    expect(response).toBeDefined()
    expect(response).toMatchObject(expectedResponse)
  })

  it("should sign payloads", async () => {
    const payload = { mockPayload: 'value' }
    const expectedResponse = {
      type: 'ok',
      data: { signature: `signature`, signedPayload: `signedPayload`}
    }

    debugger
    mock_comb.nextResponse(expectedResponse)
   
    const response = await holo.signPayload(payload)

    expect(response).toBeDefined()
    expect(response).toHaveProperty('signature');
    expect(response).toHaveProperty('signedPayload');
  })  
})

describe("test comb error", () => {
  let globalComb
  const expectedError = 'timeout error'

  beforeEach(() => {
    if( (<any>global).COMB ) {
      globalComb = (<any>global).COMB
    }

    (<any>global).COMB = {
      connect() {
        throw new Error(expectedError)
      }
    }

    WebSdkApi = require("../src/index").default
  })

  afterEach(() => {
    if( globalComb ) {
      (<any>global).COMB = globalComb
    }
  })

  it("should throw an error from COMB", async () => {
    let thrownMessage

    try {
      // Expected handshake response when successful is { happ_id, agent_state }
      mock_comb.nextResponse({ happ_id: '', agent_state: {} })
      await WebSdkApi.connect({})
    } catch (e) {
      thrownMessage = e.message
    }

    expect(thrownMessage).toEqual(expectedError)
  })
})
