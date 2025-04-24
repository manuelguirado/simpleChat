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
app.use(logger('dev'));
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
      content TEXT,
      userName TEXT
    );
  `);
io.on('connection', async (socket) => {
    console.log('a user connected');
    //listen when a user is disconnected
    socket.on('disconnect', () => {

        console.log('user disconnected');
    });
    //listen when a user sends a message
    socket.on('chat message', async (msg) => {
        let result;
        const username = socket.handshake.auth.userName ?? 'anonymous';
        try {
       
        
          result = await db.execute({
            sql: `INSERT INTO messages (content,userName) VALUES (:content, :userName)`,
            args: { content: msg , userName : username}
          });
        } catch (e) {
          console.error(e)
          return
        }
      
        io.emit('chat message', msg, result.lastInsertRowid.toString(), username)
      });
    //recover all the messages 
     if (!socket.recovered){
      try{
        const result = await db.execute({
          sql :'SELECT id,content,userName FROM messages WHERE id > ?' ,
          args: [socket.handshake.auth.serverOffset ?? 0]
        })
        result.rows.forEach(row => {
          socket.emit('chat message', row.content, row.id, row.userName)
        })

        }catch(e){
          console.error(e)
          return;
        }
      }

     }
    );
    app.get('/', (req, res) => {
    res.sendFile(process.cwd() + '/client/index.html');
}
);
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}
); 