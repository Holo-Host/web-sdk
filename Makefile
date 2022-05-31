clean-files:
	find . -name '*~' -exec rm {} \;
preview-package:	clean-files
	npm pack --dry-run .
create-package:		clean-files
	npm pack .
publish-package:	clean-files
	npm publish --access public .
