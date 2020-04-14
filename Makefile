
MOCHA_OPTS		=

dist:
	npm run build
test:		dist
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
