const { createLogger, format, transports, config } = require('winston');

const logger = createLogger({
    format:format.simple(),
    transports: [
      new transports.Console({ level: 'debug' }),
    ],
  });

  module.exports = logger;