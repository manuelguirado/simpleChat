import express from 'express';
import logger from 'morgan';
import {Server} from 'socket.io';
import dotenv from 'dotenv';
import { createClient } from '@libsql/client';
import {createServer} from 'node:http';
dotenv.config( {path: './server/.env' });
const port = process.env.PORT || 3000;
const app = express();
const server = createServer(app);
const io  = new Server(server, {
    connectionStateRecovery: {},

    })
 if (!process.env.DATABASE_TOKEN || !process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    console.error('DATABASE_TOKEN is not set');
    process.exit(1);
 }
 //create db connection
const db = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_TOKEN
});
//create a table
await db.execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT
    );
  `);
io.on('connection', (socket) => {
    console.log('a user connected');
    //listen when a user is disconnected
    socket.on('disconnect', () => {

        console.log('user disconnected');
    });
    //listen when a user sends a message
    socket.on('chat message', async (msg) => {
        let result;
        try {
          console.log(msg)
        
          result = await db.execute({
            sql: `INSERT INTO messages (content) VALUES (:content)`,
            args: { content: msg }
          });
        } catch (e) {
          console.error(e)
          return
        }
      
        io.emit('chat message', msg, result.lastInsertRowid.toString())
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