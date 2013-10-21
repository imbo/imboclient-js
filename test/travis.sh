#!/bin/bash
php composer.phar create-project -n imbo/imbolauncher imbolauncher dev-develop
./imbolauncher/imbolauncher start-servers --config=$TRAVIS_BUILD_DIR/test/imbolauncher/config.json --install-path=/tmp/imbo-servers --no-interaction -vvv ; cat /tmp/imbo-servers/0.3.3/httpd.log
make test
OUT=$?
./imbolauncher/imbolauncher kill-servers --no-interaction -vvv

exit $OUT