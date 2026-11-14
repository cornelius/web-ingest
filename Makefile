.PHONY: test package clean

test:
	npm test

package:
	scripts/package.sh

clean:
	rm -f dist/web-ingest-*.zip
	-rmdir dist
