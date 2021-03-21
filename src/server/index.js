const express = require('express');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const getExamplesPaths = require('./getExamplesPaths');


app.use(express.static(path.join(process.cwd(), './src/public')));
getExamplesPaths().forEach((examplePath) => {
  app.use(`/${examplePath.dirName}`, express.static(path.join(process.cwd(), 'src/client', examplePath.dirName)));
});
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'src', 'public', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('client-get-examples', () => {
    socket.emit('client-get-examples', getExamplesPaths());
  });
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});
