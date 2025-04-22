import express from 'express';
import logger from 'morgan';
import {Server} from 'socket.io';
import dotenv from 'dotenv';
import { createClient } from '@libsql/client';
import {createServer} from 'node:http';
const port = process.env.PORT || 3000;
const app = express();
const server = createServer(app);
const io  = new Server(server, {
    connectionStateRecovery: {},

    })
dotenv.config();
//create db connection
const db = createClient({
    url: process.env.DB_URL,
    authToken: process.env.DB_TOKEN,
});
io.on('connection', (socket) => {
    console.log('a user connected');
    //listen when a user is disconnected
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
    //listen when a user sends a message
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });
});
    app.get('/', (req, res) => {
    res.sendFile(process.cwd() + '/client/index.html');
}
);
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}
); 