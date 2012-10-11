module.exports = process.env.IMBO_COV
  ? require('./lib-cov/imbo')
  : require('./lib/imbo');