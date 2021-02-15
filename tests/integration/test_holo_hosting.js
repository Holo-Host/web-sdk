const path = require('path');
const log = require('@whi/stdlog')(path.basename(__filename), {
  level: process.env.LOG_LEVEL || 'fatal',
});
const MockConductor = require('@holo-host/mock-conductor');
const expect = require('chai').expect;
const puppeteer = require('puppeteer');
const http_servers = require('../setup_http_server.js');

let browser;

async function create_page(url) {
  const page = await browser.newPage();

  log.info("Go to: %s", url);
  await page.goto(url, {
    "waitUntil": "networkidle0"
  });

  return page;
}

class PageTestUtils {
  constructor(page) {
    this.logPageErrors = () => page.on('pageerror', async error => {
      if (error instanceof Error) {
        log.silly(error.message);
      } else
        log.silly(error);
    });

    this.describeJsHandleLogs = () => page.on('console', async msg => {
      const args = await Promise.all(msg.args().map(arg => this.describeJsHandle(arg)))
        .catch(error => console.log(error.message));
      console.log(...args);
    });

    this.describeJsHandle = (jsHandle) => {
      return jsHandle.executionContext().evaluate(arg => {
        if (arg instanceof Error)
          return arg.message;
        else
          return arg;
      }, jsHandle);
    };
  }
}

describe("Start Mock Conductor with Chaperone Server (HCC Mode)", () => {
  const CONDUCTOR_PORT = 42211
  const DNA_ALIAS = "dna_alias";
  const MOCK_CELL_ID = [Buffer.from("dnaHash"), Buffer.from("agentPubkey")];
  const MOCK_CELL_DATA = [[MOCK_CELL_ID, DNA_ALIAS]];

  let http_ctrls, http_url;
  before(async function() {
    this.timeout(100_000);

    appConductor = new MockConductor(CONDUCTOR_PORT);
    appConductor.any({ cell_data: MOCK_CELL_DATA });

    http_ctrls = http_servers();
    browser = await puppeteer.launch({ headless: false });
    console.info(browser);
    http_url = `http://localhost:8080`;
  });

  after("Close Mock Conductor and Chaperone Server", async () => {
    log.debug("Shutdown cleanly...");
    log.debug("Close browser...");
    await browser.close();

    log.debug("Close HTTP server...");
    await http_ctrls.close();

    log.info("Stopping Mock Conductor...");
    await appConductor.close();
  });

  it("should sign-in and make a zome function call", async function() {
    this.timeout(300_000_000);

    try {
      let response;
      const page_url = `${http_url}/html/index.html`;
      const page = await create_page(page_url);
      await page.setViewport({ width: 1442, height: 1341 });
      
      const pageTestUtils = new PageTestUtils(page);
      pageTestUtils.logPageErrors();
      pageTestUtils.describeJsHandleLogs();
      
      await page.exposeFunction('expect', (actualValue, expectedValue) => expect(actualValue).to.equal(expectedValue));

      response = await page.evaluate(async function () {
        console.log(" ----------------> 1");
        const holoWebClient = new HoloWebSDK.Connection('http://localhost:24273', signal => console.log("Signal : ", signal),
          {
              logo_url: '../assets/holochain.png',
              app_name: 'Test Holofuel App',
              info_link: 'https://holo.host'
          }
        );
        console.log(" ----------------> 2");

	      holoWebClient.on("connected", console.log.bind(console));
	      await holoWebClient.ready();
        console.log(" ----------------> 3");

	      window.holoWebClient = holoWebClient;
        console.log(" ----------------> 4");

	      await holoWebClient.signUp();
        console.log(" ----------------> 5");
        console.log("Called sign-up...");

        const chaperone_modal = frames.find(f => f.url() === 'http://localhost:24273/?logo_url=http%3A%2F%2Flocalhost%3A8080%2Fassets%2Fholochain.png&app_name=My+Holofuel+App');
        await page.waitForNavigation();

        expect(!!chaperone_modal, true);

        // visual test
        const appLogo = await chaperone_modal.waitForSelector('img > .app-logo');
        expect(appLogo.getAttribute("src"), "http://localhost:8080/assets/holochain.png");

        const appName = await chaperone_modal.waitForSelector('h1 > span > .app-name');
        expect(appName.value, "Test Holofuel App");

        // input test -log in using chaperone modal
        try {
          const agentEmail = 'test@test.com'
          const agentPassword = '123456'
            
          const emailInput = await chaperone_modal.waitForSelector('div > #sign-up #signup-email');
          await chaperone_modal.click(emailInput);
          await chaperone_modal.type(emailInput, agentEmail);
          expect(emailInput, agentEmail);
          
          const passwordInput = await chaperone_modal.waitForSelector('#sign-up #signup-password');
          await chaperone_modal.click(passwordInput);
          await chaperone_modal.type(passwordInput, agentPassword);
          expect(passwordInput, agentPassword);
          
          const passwordConfirmInput = await chaperone_modal.waitForSelector('#sign-up #signup-password-confirm');
          await chaperone_modal.click(passwordConfirmInput);
          await chaperone_modal.type(passwordConfirmInput, agentPassword);
          expect(passwordConfirmInput, agentPassword);

          const submitButton = await chaperone_modal.waitForSelector('.submit-button');
          await chaperone_modal.click(submitButton);
        } catch (error) {
          console.log(typeof err.stack, err.stack.toString());
          throw err
        }

        // zomecall test - trigger outbound zome call to chaperone
        try {
          // Note: we are calling the Chaperone in HCC mode and using the mock conductor
          const callZomeData = {
            cell_id: MOCK_CELL_ID,
            zome_name: "zome",
            fn_name: "zome_fn",
            args: {
              zomeFnArgs: "String Input"
            }
          };
          const expected_response = "Hello World";
          appConductor.once(MockConductor.ZOME_CALL_TYPE, callZomeData, expected_response);
          return holoWebClient.zomeCall("dna_alias", "zome", "zome_fn", {
            zomeFnArgs: "String Input"
          });
        } catch (err) {
          console.log(typeof err.stack, err.stack.toString());
          throw err
        }
      });

      log.info("Completed evaluation: %s", response);
      expect(Object.keys(response)).to.have.members(["value"]);
      expect(response.value).to.equal("This is the returned value");
    } finally {

    }
  });
});
