var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


//Variables
let numUniqueUsers = 0;
let connectedUsersNames = [];
let connectedUserSockets = [];




app.use(express.static('static'));


app.get('/', function(req, res)
{
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket)
{
    console.log('a user connected');

    //New client asks for name
    socket.on('new client request name', function()
    {
        //Give the client a new name
        let newName = "User" + numUniqueUsers++;
        socket.emit('give name', newName);

        connectedUsersNames.push(newName);
        connectedUserSockets.push(socket);

        //Propagate new list of users to all clients
        //io.emit('user connect', newName);


        console.log("New client given name " + newName);
    });

    //Returning client
    socket.on('returning client', function(msg)
    {
        //TODO
        //Check to see if returning name is taken
        //Give the client the requested name if it is not taken.
        //Otherwise, give the client a new generic name
        let newName;
        if(false)
        {
            //Name is taken. Give generic
            newName = "User" + numUniqueUsers++;
            socket.emit('give name', newName);
            connectedUsersNames.push(newName);
            connectedUserSockets.push(socket);
        }
        else
        {
            //Name is not taken
            newName = msg;
            socket.emit('give name', newName);
            connectedUsersNames.push(newName);
            connectedUserSockets.push(socket);
        }

        //Propagate new list of users to all clients
        //io.emit('user connect', msg);


        console.log("Returning client with name " + newName);
    });

    //Chat message
    socket.on('chat message', function(msg)
    {

        io.emit('chat message', msg);
        console.log('message: ' + msg);
    });

    //Disconnection
    socket.on('disconnect', function()
    {

        let i = connectedUserSockets.indexOf(socket);

        console.log('User disconnected: ' + connectedUsersNames[i]);



        connectedUsersNames.splice(i, 1);
        connectedUserSockets.splice(i, 1);
    });
});

http.listen(3000, function()
{
    console.log('listening on *:3000');
});