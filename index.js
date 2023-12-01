const path = require('path');

const express = require('express');
const app = express();
const port = 3000;
var connector_api = require('./connector')

app.use(express.static(__dirname + '/public'))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

app.get('/api/v1/connector/:name.:ext', connector_api.view);
app.get('/api/v1/connector/:name/:layer.:ext', connector_api.layer);
app.get('/api/v1/connectors.:ext', connector_api.list);


app.listen(port, () => console.log("Listening on port " + port + "..."));
