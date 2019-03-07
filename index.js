var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


//Variables
let connectedUsers = [];

function compileUserList()
{
    let userList = [];
    for(i = 0; i < connectedUsers.length; i++)
    {
        userList.push(connectedUsers[i].name);
    }
    return userList;
}

function addUser(name, sock)
{
    connectedUsers.push(
        {"name": name,
        "socket": sock,
        "colour": {"r": 0xab, "g": 0xcd, "b": 0xef}
        });
}

function removeUser(sock)
{
    let index;
    for(i = 0; i < connectedUsers.length; i++)
    {
        if(connectedUsers[i].socket === sock)
        {
            index = i;
            break;
        }
    }

    console.log('[INFO] User disconnected: ' + connectedUsers[i].name);

    connectedUsers.splice(index, 1);
}

function getUser(sock)
{
    for(i = 0; i < connectedUsers.length; i++)
    {
        if(connectedUsers[i].socket === sock)
        {
            return connectedUsers[i];
        }
    }
}

function checkUnique(n)
{
    for(i = 0; i < connectedUsers.length; i++)
    {
        if(connectedUsers[i].name === n)
        {
            return false;
        }
    }
    return true;
}

app.use(express.static('static'));


app.get('/', function(req, res)
{
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket)
{
    //console.log('a user connected');

    //New client asks for name
    socket.on('new client request name', function()
    {
        //Give the client a new name
        let newName = "User" + connectedUsers.length;
        socket.emit('give name', newName);

        addUser(newName, socket);

        //Propagate new list of users to all clients
        io.emit('user update', compileUserList());


        console.log("[INFO] New client connected. Given name: " + newName);
    });

    //Returning client
    socket.on('returning client', function(msg)
    {
        //Check to see if returning name is taken
        //Give the client the requested name if it is not taken.
        //Otherwise, give the client a new generic name
        let newName;
        if(checkUnique(msg))
        {
            //Name is not taken
            newName = msg;
            socket.emit('give name', newName);
            addUser(newName, socket);
            console.log("[INFO] Returning user. Requested name " + newName + " not in use.");
        }
        else
        {
            //Name is taken. Give generic
            newName = "User" + connectedUsers.length;
            socket.emit('give name', newName);
            addUser(newName, socket);
            console.log("[INFO] Returning user. Requested name " + msg + " in use. Given name " + newName + ".");
        }

        //Propagate new list of users to all clients
        io.emit('user update', compileUserList());
    });

    //Chat message
    socket.on('chat message', function(msg)
    {
        let d = new Date();
        usr = getUser(socket);
        let message = {
            "time": d.getHours() + ":" + d.getMinutes(),
            "username": usr.name,
            "colour": usr.colour,
            "content": msg,
        };
        console.log(message);
        console.log('[CHAT] ' + message.time + ' ' + message.username + ': ' + msg);
        io.emit('chat message', message);
    });

    socket.on('name change', function(msg)
    {
        usr = getUser(socket);
        if(checkUnique(msg))
        {
            console.log("[INFO] User " + usr.name + " requested name change to " + msg + ". Granted.");
            socket.emit('give name', msg);
            usr.name = msg;
            io.emit('user update', compileUserList());
        }
        else
        {
            console.log("[INFO] User " + usr.name + " requested name change to " + msg + ". Rejected.");
            socket.emit('name rejected', msg);
        }
    });


    //Disconnection
    socket.on('disconnect', function()
    {
        removeUser(socket);
        io.emit('user update', compileUserList());
    });
});

http.listen(3000, function()
{
    console.log('listening on *:3000');
});