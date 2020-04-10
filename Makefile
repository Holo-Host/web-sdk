
MOCHA_OPTS		=

test:
	npx mocha $(MOCHA_OPTS) --recursive ./tests
test-unit:
	LOG_LEVEL=silly npx mocha $(MOCHA_OPTS) ./tests/unit/


keystore.key:
	@echo "Creating Holochain key for Agent $*: keystore-$*.key";
	echo $$( hc keygen --nullpass --quiet --path ./keystore.key)			\
		| while read key _; do							\
			echo $$key > AGENTID;						\
		done
	@echo "Agent ID: $$(cat AGENTID)";


use-local-chaperone:
	npm uninstall --save @holo-host/chaperone; npm install --save-dev ../chaperone
use-npm-chaperone:
	npm uninstall --save @holo-host/chaperone; npm install --save-dev @holo-host/chaperone
