
MOCHA_OPTS		=

dist:
	yarn run build
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
	yarn uninstall --save @holo-host/chaperone; yarn install --save ../chaperone
use-yarn-chaperone:
	yarn uninstall --save @holo-host/chaperone; yarn install --save @holo-host/chaperone


clean-files:
	find . -name '*~' -exec rm {} \;
preview-package:	clean-files test
	yarn pack --dry-run .
create-package:		clean-files test
	yarn pack .
publish-package:	clean-files test
	yarn publish --access public .
