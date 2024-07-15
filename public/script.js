var connection_code;
var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
var local_stream;
var screenStream;
var peer = null;
var currentPeer = null;
var screenSharing = false;
var conn = null;

window.createConnection = function() {
    console.log("Establishing Connection");
    let connection = window.connectionCode;
    connection_code = connection;
    peer = new Peer(connection_code);
    peer.on('open', (id) => {
        console.log("Connection ID: ", id);
        notify("Initiating Connection");
        hostSideSetup();
    });
    peer.on('call', (call) => {
        console.log("Receiving Call from Remote");
        call.answer(local_stream);
        call.on('stream', (stream) => {
            console.log("Call Recieved");
            console.log(stream);
            setRemoteStream(stream);
        });
        currentPeer = call;
    });
    console.log("Connection Established with Id: " + connection_code);
}

window.setScreenSharingStream = function(stream) {
    console.log("Setting Screen Sharing Stream");
    document.getElementById("screenshare-container").hidden = false;
    let video = document.getElementById("screenshared-video");
    video.srcObject = stream;
    video.muted = true;
    video.play();
}

window.setRemoteStream = function(stream) {
    console.log("Setting Remote Screen");
    document.getElementById("remote-vid-container").hidden = false;
    let video = document.getElementById("remote-video");
    video.srcObject = stream;
    video.play();
}

window.notify = function(msg) {
    let notification = document.getElementById("notification");
    notification.innerHTML = msg;
    notification.classList.remove("hidden");
    notification.classList.add("visible");
    setTimeout(() => {
        notification.classList.remove("visible");
        notification.classList.add("hidden");
    }, 6000);
}


window.joinconnection = function() {
    console.log("Joining connection");
    let connection = document.getElementById("connection-input").value;
    if (connection.trim() === "") {
        alert("Please Enter Connection Code");
        return;
    }
    connection_code = connection;
    peer = new Peer();
    peer.on('open', (id) => {
        console.log("Connection Id: " + id);
        notify("Connecting with Host");
        conn = peer.connect(connection_code); // Establish data connection
        document.getElementById("tohost").hidden = false;
        document.getElementById("gethost").hidden = false;
    });
}

window.startScreenShare = function() {
    if (screenSharing) {
        stopScreenSharing();
    }
    navigator.mediaDevices.getDisplayMedia({ video: true }).then((stream) => {
        setScreenSharingStream(stream);
        screenStream = stream;
        let videoTrack = screenStream.getVideoTracks()[0];
        videoTrack.onended = () => {
            stopScreenSharing();
        };
        if (peer) {
            let sender = currentPeer.peerConnection.getSenders().find(function(s) {
                return s.track.kind == videoTrack.kind;
            });
            sender.replaceTrack(videoTrack);
            screenSharing = true;
        }
        console.log(screenStream);
    }).catch((error) => {
        console.error("Error accessing screen for sharing: ", error);
    });
}

window.stopScreenSharing = function() {
    if (screenStream) {
        let tracks = screenStream.getTracks();
        tracks.forEach(track => track.stop());
        console.log('Screen sharing stopped');
        screenStream = null;
        if (conn) {
            conn.send('SCREEN_SHARE_STOPPED');
        }
    } else {
        console.log('No screen sharing to stop');
    }
}

window.getHostScreen = function() {
    console.log("Requesting Host Screen");
    if (!conn) {
        console.error("Data connection (conn) not established.");
        return;
    }
    conn.send('REQUEST_SCREEN_SHARE');
}

window.screenAccessRequest = function(accepted) {
    if (accepted) {
        navigator.mediaDevices.getDisplayMedia({ video: true }).then((stream) => {
            screenStream = stream;
            setScreenSharingStream(screenStream);
            if (conn) {
                conn.send('SCREEN_SHARE_ACCEPTED');
                console.log("Screen share accepted message sent to remote.");
            }
        }).catch((error) => {
            console.error("Error accessing host screen: ", error);
            notify("Error Accessing Host Screen.");
        });
    } else {
        notify("Host Denied Screen Share Request.");
        if (conn) {
            conn.send('SCREEN_SHARE_DENIED');
            console.log("Screen share denied message sent to remote.");
        } else {
            console.error("Data connection (conn) not established.");
        }
    }
}

window.sendStreamToRemote = function(stream) {
    const createMediaStreamFake = () => {
        return new MediaStream([createEmptyAudioTrack(), createEmptyVideoTrack({ width: 640, height: 480 })]);
    }
    
        const createEmptyAudioTrack = () => {
            const ctx = new AudioContext();
            const oscillator = ctx.createOscillator();
            const dst = oscillator.connect(ctx.createMediaStreamDestination());
            oscillator.start();
            const track = dst.stream.getAudioTracks()[0];
            return Object.assign(track, { enabled: false });
        }
    
        const createEmptyVideoTrack = ({ width, height }) => {
            const canvas = Object.assign(document.createElement('canvas'), { width, height });
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = "green";
            ctx.fillRect(0, 0, width, height);
    
            const stream = canvas.captureStream();
            const track = stream.getVideoTracks()[0];
    
            return Object.assign(track, { enabled: false });
        };
    
        notify("Sharing Screen Initiated")
        startScreenShare();
        let call = peer.call(connection_code, createMediaStreamFake())
        call.on('stream', (stream) => {
            setRemoteStream(stream);
            currentPeer = call;
    
        })
}

window.hostSideSetup = function() {
    if (!peer) {
        console.error("Peer connection not initialized.");
        return;
    }
    peer.on('connection', (connection) => {
        conn = connection;
        conn.on('data', (data) => {
            if (data === 'REQUEST_SCREEN_SHARE') {
                console.log("Received Screen Share Request from Remote");
                if (confirm("Remote User wants to access your screen\nAllow Access?")) {
                    conn.send('SCREEN_SHARE_ACCEPTED');
                    screenAccessRequest(true); // Start sharing screen with remote
                } else {
                    conn.send('SCREEN_SHARE_DENIED');
                    notify("You have Denied the remote request.");
                }
            }
        });
    });
}

window.shareScreenToHost = function() {
    console.log("Sharing Screen to Host");
    const createMediaStreamFake = () => {
    return new MediaStream([createEmptyAudioTrack(), createEmptyVideoTrack({ width: 640, height: 480 })]);
}

    const createEmptyAudioTrack = () => {
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        const track = dst.stream.getAudioTracks()[0];
        return Object.assign(track, { enabled: false });
    }

    const createEmptyVideoTrack = ({ width, height }) => {
        const canvas = Object.assign(document.createElement('canvas'), { width, height });
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = "green";
        ctx.fillRect(0, 0, width, height);

        const stream = canvas.captureStream();
        const track = stream.getVideoTracks()[0];

        return Object.assign(track, { enabled: false });
    };

    notify("Joining peer")
    let call = peer.call(connection_code, createMediaStreamFake())
    call.on('stream', (stream) => {
        setRemoteStream(stream);

    })

    currentPeer = call;
    startScreenShare();
}
