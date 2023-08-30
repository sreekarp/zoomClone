const socket = io("/");
const chatInputBox = document.getElementById("chat-message");
const all_messages = document.getElementById("all-messages");
const mainChatWindow = document.getElementById("main-chat-window");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");

myVideo.muted = true;
//PEER
const peers={};
var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "443",
});

let myVideoStream;

const user=prompt("Enter Your Name:"); /*User Name Input */

var getUserMedia =                     //Get audio and video access
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

navigator.mediaDevices                      //My video stream
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    peer.on("call", (call) => {                          //Adding other peer's video in our stream
      call.answer(stream);
      const video = document.createElement("video");

      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId,userName) => {   //user connected
      connectToNewUser(userId, stream);
      popIt(userName,"connect");
    });

    //CHAT

    document.addEventListener("keydown", (e) => {           //Chat Input from User
      if (e.which === 13 && chatInputBox.value != "") {

        socket.emit("message",chatInputBox.value);
        chatInputBox.value = "";
      }
    });

    socket.on("createMessage", (msg,userName) => {         //Display message onto chatbox
      console.log(msg);

      const today=new Date();
      const time=today.getHours()+":"+today.getMinutes();
      const li=document.createElement("li");
      li.innerHTML=`<div><b>${userName === user? "Me:" : userName+":"}</b><hr>${msg}<small id="sml">${time}</small></div>`;

      all_messages.append(li);
      mainChatWindow.scrollTop = mainChatWindow.scrollHeight;
    });

  });

  socket.on("user-disconnected",(userId,userName)=>{    //user disconnected
      popIt(userName,"disconnect");
      if(peers[userId])peers[userId].close();
  })

peer.on("call", function (call) {                       //Answer call
  getUserMedia(
    { video: true, audio: true },
    function (stream) {
      call.answer(stream); // Answer the call with an A/V stream.
      const video = document.createElement("video");
      call.on("stream", function (remoteStream) {
        addVideoStream(video, remoteStream);
      });
    },
    function (err) {
      console.err("Failed to get local stream");
    }
  );
});

peer.on("open", (id) => {                                      //unique user-id is created for every conneted peer
  socket.emit("join-room", ROOM_ID, id,user);
});



const connectToNewUser = (userId, streams) => {               //Start Connection
  var call = peer.call(userId, streams);
  console.log(userId);
  var video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    console.log(userVideoStream);
    addVideoStream(video, userVideoStream);
  });
  call.on("close",()=>{
      video.remove();
  })
  peers[userId]=call;

};

const addVideoStream = (videoEl, stream) => {              //Add video stream to video grid
  videoEl.srcObject = stream;
  videoEl.addEventListener("loadedmetadata", () => {
    videoEl.play();
  });
  myVideoStream.getVideoTracks()[0].enabled=false;
  myVideoStream.getAudioTracks()[0].enabled=false;
  videoGrid.append(videoEl);
  let totalUsers = document.getElementsByTagName("video").length;
  if (totalUsers > 1) {
    for (let index = 0; index < totalUsers; index++) {
      document.getElementsByTagName("video")[index].style.objectFit=fill;
    }
  }

};

const playStop = () => {                                             //Video button
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

const muteUnmute = () => {                                          //Mute button
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};


const setPlayVideo = () => {
  const html = `<i class="unmute fas fa-play"></i>
  <span class="unmute">Resume Video</span>`;
  document.getElementById("playPauseVideo").innerHTML = html;
};

const setStopVideo = () => {
  const html = `<i class=" fas fa-stop"></i>
  <span class="">Stop Video</span>`;
  document.getElementById("playPauseVideo").innerHTML = html;
};

const setUnmuteButton = () => {
  const html = `<i class="unmute fas fa-microphone-alt-slash"></i>
  <span class="unmute">Unmute</span>`;
  document.getElementById("muteButton").innerHTML = html;
};
const setMuteButton = () => {
  const html = `<i class="fas fa-microphone-alt"></i>
  <span>Mute</span>`;
  document.getElementById("muteButton").innerHTML = html;
};


function ShowChat(e){                                             //Toggle chat
    e.classList.toggle("active");
    document.body.classList.toggle("showchat");
}


function getLink(){                                               //Invite link
    var modal=document.getElementById("Modal");
    console.log( modal.style.display)
   modal.style.display="block";
   document.getElementById("roomlnk").innerHTML=window.location.href;
   document.getElementById("roomlnk").style.display="block";
}

function closeIt(){                                             //Close Invite link
    var modal=document.getElementById("Modal");
    modal.style.display="none";
}


//Before and After Video Call

(document.getElementById("name").innerHTML=user)
document.getElementById("lnk").innerHTML=window.location.href;

document.getElementById("call").onclick=function(){                 //Start Video call button

  document.getElementById("start-leave").style.display="none";
  document.getElementById("main-left").style.flex="1";
  document.getElementById("main-left").style.display="flex";
  document.getElementById("main-right").style.flex="0.3";
}

document.getElementById("leave-meeting").onclick=function(){         //End Video call

  document.getElementById("start-leave").style.display="block";
  document.getElementById("main-left").style.display="none";
  document.getElementById("main-right").style.flex="1";

  myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
}

function popIt(name,str){                                            //Display peers who joined or left
  if(str=="disconnect")
  {
    document.getElementById("pop-up").innerText=name+" disconnected";
    document.getElementById("pop-up").style.display="block";
  }
  else{
    document.getElementById("pop-up").innerText=name+" is connected";
    document.getElementById("pop-up").style.display="block";
  }
  setTimeout(function(){document.getElementById("pop-up").style.display="none";},5000);
}

//Thankyou page

function feedback(){
  document.getElementById("final").style.display="flex";
  document.getElementById("final").style.flexDirection="column";
}
