MOCHA_OPTS = test/**/*.js

full: test

test: test-unit

test-unit:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--require blanket \
		--reporter spec \
		$(MOCHA_OPTS)

test-cov:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--require blanket \
		$(MOCHA_OPTS) \
		--reporter html-cov > coverage.html

.PHONY: test test-unit
