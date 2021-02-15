
MOCHA_OPTS =

html:
	mkdir -p ./html
dist:
	npm run build

start-static-websdk:
	python -m SimpleHTTPServer 8080 &
stop-static-websdk: 
	npm run stop-websdk

start-static-chaperone: chaperone/dist
	npm run start-static-chaperone
stop-static-chaperone: 
	npm run stop-static-chaperone

chaperone-dev-server: ./chaperone-dev-server/*.json
	mkdir -p ./chaperone-dev-server
start-chaperone-server: chaperone-dev-server
	npx chaperone-server --config ./chaperone-dev-server/chaperone.json &
stop-chaperone-server: chaperone-dev-server
	npm run stop-chaperone

stop-dev-servers: html dist
	make stop-chaperone-server &
	make stop-static-websdk &

start-dev-servers: html dist
	make start-chaperone-server &
	make start-static-websdk &

test:		dist
	npx mocha $(MOCHA_OPTS) --recursive ./tests
test-unit:
	LOG_LEVEL=silly npx mocha $(MOCHA_OPTS) ./tests/unit/

test-integration:
	make start-chaperone-server
	npx mocha $(MOCHA_OPTS) ./tests/integration/
	make stop-chaperone-server
test-integration-debug:
	make start-chaperone-server
	LOG_LEVEL=silly CONDUCTOR_LOGS=error,warn npx mocha $(MOCHA_OPTS) ./tests/integration/
	make stop-chaperone-server

# Note: 'use-local-chaperone' expects the chaperone repo to live as sibling to current root directory
use-local-chaperone:
	npm uninstall --save @holo-host/chaperone; npm install --save ../chaperone
use-npm-chaperone:
	npm uninstall --save @holo-host/chaperone; npm install --save @holo-host/chaperone

clean-files:
	find . -name '*~' -exec rm {} \;
preview-package:	clean-files test
	npm pack --dry-run .
create-package:		clean-files test
	npm pack .
publish-package:	clean-files test
	npm publish --access public .
