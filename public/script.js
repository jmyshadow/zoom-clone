const socket = io('/');
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined,{
  host: '/',
  port: '3001'
});
const peers = {};
const myVideo = document.createElement('video');
myVideo.muted = true;

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  addVideoStream(myVideo, stream)

  myPeer.on('call', call => {
    call.answer(stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
  })

  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream)
  })
})

socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close()
})

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    video.remove()
    autoResizeVideos()
  })

  peers[userId] = call
}

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
  autoResizeVideos()
}

function autoResizeVideos(){
  let wRatio = document.body.clientWidth / document.body.clientHeight,
  vRatio,
  possibilities = [],
  differences = [];
  //can have as many cols or rows as num videos displaying
  let numVids = document.getElementsByTagName("video").length;

  //x = possible number of colums
  //keeping aspect ratio of 16:9
  const X_ASPECT = 16;
  const Y_ASPECT = 9;
  for (let x = 1; x <= Math.ceil(numVids / 2); x++) {
    vRatio = (x * X_ASPECT) / (Math.ceil(numVids / x) * Y_ASPECT);
    possibilities.push([vRatio, x]);
  }
  // after we get to numVids/2 rows, only value after that is x = numvids
  possibilities.push([numVids, numVids]);

  possibilities.forEach((possibility) => {
    differences.push([Math.abs(possibility[0] - wRatio), possibility[1]]);
  });

  //find ratio with smallest difference
  differences.sort((a, b) => a[0] - b[0]);

  const col = differences[0][1];
  const row = Math.ceil(numVids / differences[0][1]);

  document.documentElement.style.setProperty("--col", col);
  document.documentElement.style.setProperty("--row", row);
}

window.addEventListener("resize", autoResizeVideos);