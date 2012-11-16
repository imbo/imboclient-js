MOCHA_OPTS =
REPORTER = spec

full: test min

check: test

build:
	node build-browser.js

min: build
	./node_modules/.bin/uglifyjs dist/imbo.browser.js > dist/imbo.browser.min.js

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