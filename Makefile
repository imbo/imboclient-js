MOCHA_OPTS =
REPORTER = spec
BROWSER_FILES = lib/browser.js lib/compat.js lib/url.js lib/client.js

full: test min

check: test

build: $(BROWSER_FILES)
	cat $^ > dist/imbo.js

min: build
	./node_modules/.bin/uglifyjs dist/imbo.js > dist/imbo.min.js

test: test-unit

test-unit:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		$(MOCHA_OPTS)

test-cov: lib-cov
	@IMBO_COV=1 $(MAKE) -s test REPORTER=html-cov > coverage.html
	@rm -rf lib-cov

lib-cov:
	@jscoverage lib lib-cov

.PHONY: test test-unit