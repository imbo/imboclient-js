MOCHA_OPTS = test/**/*.js
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
		--require blanket \
		--reporter $(REPORTER) \
		$(MOCHA_OPTS)

test-cov:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--require blanket \
		$(MOCHA_OPTS) \
		--reporter html-cov > coverage.html

.PHONY: test test-unit
