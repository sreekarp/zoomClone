const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")(server);
const port=process.env.PORT || 3030;
// Peer

const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use("/peerjs", peerServer);

app.get("/", (req, rsp) => {
  rsp.redirect(`/${uuidv4()}`);
});

app.get("/end",(req,res)=>{
  res.render("leave.ejs");
})

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId,userName) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit("user-connected", userId,userName);

    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message,userName);
    });
    socket.on('disconnect',()=>{
        socket.broadcast.to(roomId).emit('user-disconnected',userId,userName);
    });
  });
});


server.listen(port);
