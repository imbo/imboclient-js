module.exports = process.env.IMBO_COV ? require('./lib-cov/client') : require('./lib/client');
