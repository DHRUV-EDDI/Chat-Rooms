const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUserInRoom } = require('./utils/users.js')
const app = express();
const server = http.createServer(app);
const io = socketio(server)

const port = process.env.PORT || 3000

app.use(express.static(`${__dirname}/../public`));

io.on('connection',(socket) => {
    console.log('New client connected...');
    
    socket.on('join',(options,callback) => {
        // console.log(username, room)
        const {error, user} = addUser({ id:socket.id, ...options})
        
        if(error)
            return callback(error)

        socket.join(user.room)
        // This emits an event to only connected client
        socket.emit('message',generateMessage('Admin','Welcome!'))
        // This emits an event to all connected clients except the Parent client
        // To specify the room we used .to() method
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined!`));
        io.to(user.room).emit('roomData',{
            room: user.room,
            users : getUserInRoom(user.room)
        })
        callback();
    })
    // This emits an event to all connected clients (io.emit => Listener)
    socket.on('sendLocation',(coords,callback) => {        
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://www.google.com/maps?q=${coords.lattitude},${coords.longitude}`));
        callback()
    })
    socket.on('sendMessage',(message,callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        
        if(filter.isProfane(message))
            return callback('Profanity is not allowed');
        
        io.to(user.room).emit('message',generateMessage(user.username,message));
        callback();
    })

    // Built-in event triggers when a connected client left
    socket.on('disconnect',() => {
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left!`))
            io.to(user.room).emit('roomData',{
                room: user.room,
                users : getUserInRoom(user.room)
            })
        }
    })
})
server.listen(port,() => {
    console.log(`Listening at port ${port}....`);
})