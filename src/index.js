const path = require('path');
const logger = require('./logger');
const morgan = require('morgan');
const express = require('express');
const app = express();
const port = 3000;
var connector_api = require('./connector')

const morganMiddleware = morgan(
    ':method :url :status :res[content-length] - :response-time ms',
    {
      stream: {
        // Configure Morgan to use our custom logger with the http severity
        write: (message) => logger.http(message.trim()),
      },
    }
  );
app.use(morganMiddleware);



const projectRoot = path.dirname(__dirname);
const publicDir = path.join(projectRoot, "public");
logger.info(`Public directory path is ${publicDir}`);
app.use(express.static(publicDir))

const indexPath = path.join(publicDir, '/html/index.html')
logger.info(`index.html path is ${indexPath}`);
app.get('/', (req, res) => {
    res.sendFile(indexPath);
});

app.get('/api/v1/connector/:name.:ext', connector_api.view);
app.get('/api/v1/connector/:name/:layer.:ext', connector_api.layer);
app.get('/api/v1/connectors.:ext', connector_api.list);
app.get('*', function(req, res){
    res.send('what???', 404);
  });


app.listen(port, () => logger.info("Listening on port " + port+"."));

