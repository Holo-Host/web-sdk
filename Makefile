
keystore.key:
	@echo "Creating Holochain key for Agent $*: keystore-$*.key";
	echo $$( hc keygen --nullpass --quiet --path ./keystore.key)			\
		| while read key _; do							\
			echo $$key > AGENTID;						\
		done
	@echo "Agent ID: $$(cat AGENTID)";
