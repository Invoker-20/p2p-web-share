import { useState , useEffect , useRef} from "react";
import "./App.css";
import socket from "./services/socket";
import { createSHA256 } from "hash-wasm";
import {
  createPeerConnection,
  createOffer,
  createAnswer,
  setRemoteAnswer,
} from "./services/webrtc";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [status, setStatus] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("");
  const [peerConnection, setPeerConnection] = useState(null);
  const [progress, setProgress] = useState(0);
  const [transferSpeed, setTransferSpeed] = useState(0);
  const [verificationStatus,setVerificationStatus] =useState("");
  const [shareLink, setShareLink] =useState("");


  const roomIdRef = useRef("");
  const joinRoomIdRef = useRef("");
  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const incomingFileRef = useRef(null);
  const selectedFileRef = useRef(null);
  const totalChunksRef = useRef(0);
  const transferStartRef = useRef(null);
  const bytesReceivedRef = useRef(0);
  const senderHashRef = useRef("");
  const writableRef = useRef(null);
  const receivedChunksCountRef =useRef(0);
  const receiverShaRef = useRef(null);


  useEffect(() => {
    socket.on("connect", () => {
    console.log("Connected:", socket.id);
  });
    socket.on("room-created", (id) => {
    roomIdRef.current = id;
    setRoomId(id);
    const link =
  `${window.location.origin}?room=${id}`;

  setShareLink(link);
    setStatus("Waiting for Receiver...");
  });
    socket.on("room-joined", (roomId) => {
    console.log("Joined room:", roomId);
  });
    socket.on("receiver-joined", async () => {
    setStatus("Receiver Connected");
    const pc = createPeerConnection();
    pc.onconnectionstatechange =
  () => {

  console.log(
    "Connection state:",
    pc.connectionState
  );

  if (
    pc.connectionState ===
      "disconnected" ||
    pc.connectionState ===
      "failed" ||
    pc.connectionState ===
      "closed"
  ) {

    setConnectionStatus(
      "Connection Lost "
    );
    setStatus("Receiver Disconnected");
  }
  
};
  const dataChannel = pc.createDataChannel("fileTransfer");
  dataChannelRef.current = dataChannel;

  dataChannel.onopen = async () => {
  console.log("Data channel opened");
  
  if (selectedFileRef.current) {
  const chunkSize = 64 * 1024;

  const totalChunks = Math.ceil(selectedFileRef.current.size / chunkSize);

  dataChannel.send(
    JSON.stringify({
      type: "file-info",
      name: selectedFileRef.current.name,
      size: selectedFileRef.current.size,
      totalChunks,
    })
  );

  

  console.log("File sent:",selectedFileRef.current.name);
  }

  setConnectionStatus(
    "Direct Connection Established "
  );
};

  dataChannel.onmessage = async (event) => {

  const message =JSON.parse(event.data);

  if (message.type ==="receiver-ready") {
    console.log("Receiver ready");
    setProgress(0);
    setTransferSpeed(0);
    setVerificationStatus("");

    const chunkSize = 64 * 1024;
    const totalChunks = Math.ceil(
    selectedFileRef.current.size /chunkSize
  );
    const sha256 =await createSHA256();

  


  for (
    let offset = 0;
    offset < selectedFileRef.current.size;
    offset += chunkSize
  ) {

  const chunk =
    selectedFileRef.current.slice(
      offset,
      offset + chunkSize
    );

  const bufferChunk =await chunk.arrayBuffer();
  sha256.update(new Uint8Array(bufferChunk));
  while (
  dataChannel.bufferedAmount >
  4*1024 * 1024
  ) {
  
  await new Promise(resolve =>
    setTimeout(resolve, 10)
  );
  }
  if (
    dataChannel.readyState !==
    "open"
  ) {
    break;
  }
  dataChannel.send(bufferChunk);
  if (!transferStartRef.current) {
  transferStartRef.current = Date.now();
  }

  const sentBytes =
  offset +bufferChunk.byteLength;

const elapsedSeconds =
  (Date.now() -
    transferStartRef.current) /
  1000;

if (elapsedSeconds > 0) {
  const speedMBps =
    (
      sentBytes /
      1024 /
      1024 /
      elapsedSeconds
    ).toFixed(2);

  setTransferSpeed(speedMBps);
  
}
  const sentChunks =
  Math.floor(
    offset / chunkSize
  ) + 1;

  const percent =
  Math.floor(
    (sentChunks / totalChunks) * 100
  );

  setProgress(percent);
  }
  const fileHash =
  sha256.digest("hex");
  if (
  dataChannel.readyState === "open"
  ) {

  dataChannel.send(
    JSON.stringify({
      type: "file-hash",
      hash: fileHash,
    })
  );

  dataChannel.send(
    JSON.stringify({
      type: "file-complete",
    })
  );
  }

  console.log("File info sent:",selectedFileRef.current.name);
    }
  };


  dataChannel.onclose = () => {

  console.log(
    "Data channel closed"
  );

  setConnectionStatus("Receiver Disconnected ");
  };
    pc.onicecandidate = (event) => {
  

  if (event.candidate) {
    socket.emit("ice-candidate", {
      roomId: roomIdRef.current,
      candidate: event.candidate,
    });
  }
  };
    peerConnectionRef.current = pc;
    setPeerConnection(pc);
  
    setConnectionStatus("Generating offer...");

    const offer = await createOffer(pc);

    

    socket.emit("offer", {
    roomId: roomIdRef.current,
    offer,
    });
    });
    socket.on("offer", async (offer) => {
    console.log("Offer received by receiver");

  setConnectionStatus("Creating answer...");

  const pc = createPeerConnection();
  pc.onconnectionstatechange =
  () => {

  console.log(
    "Connection state:",
    pc.connectionState
  );

  if (
    pc.connectionState ===
      "disconnected" ||
    pc.connectionState ===
      "failed" ||
    pc.connectionState ===
      "closed"
  ) {

    setConnectionStatus(
      "Connection Lost "
    );
    setStatus("Receiver Disconnected");
  }
  };
  pc.ondatachannel = (event) => {
  const dataChannel = event.channel;
  dataChannel.onclose = () => {

  console.log("Data channel closed");

  setConnectionStatus("Sender Disconnected ");
  };
  dataChannelRef.current = event.channel;
  dataChannel.onmessage = async (event) => {

  if (typeof event.data === "string") {

    const message =JSON.parse(event.data);

    if (message.type === "file-info") {
      transferStartRef.current = Date.now();
      bytesReceivedRef.current = 0;
      setProgress(0);
      setTransferSpeed(0);
      setVerificationStatus("");
      totalChunksRef.current =message.totalChunks;
      receivedChunksCountRef.current = 0;
      receiverShaRef.current =
  await createSHA256();

      incomingFileRef.current =
        message;
      
      const fileHandle =await window.showSaveFilePicker({
        suggestedName: message.name,
      });
      writableRef.current = await fileHandle.createWritable();
      dataChannel.send(
        JSON.stringify({
        type: "receiver-ready",
      })
      );
      

      console.log("Receiving file:",message.name);

      return;
    }
    if (message.type === "file-hash") {
        senderHashRef.current =
        message.hash;

    return;
}

    if (
      message.type === "file-complete"
    ) {
      setProgress(100);
      setTransferSpeed(0);
      await writableRef.current.close();

      console.log(
      "Writable closed"
        );

      const receiverHash =receiverShaRef.current.digest("hex");
      if (
  receiverHash ===
  senderHashRef.current
) {

  setVerificationStatus("Verified ");

  console.log("SHA-256 Verified");

} else {
  setVerificationStatus("Corrupted ");

  console.log("SHA-256 Mismatch");
}


      console.log("Download complete");
      setConnectionStatus("Transfer Complete");

      return;
    }
  }
  
  if (!writableRef.current) {
  console.log("Writable not ready");
  return;
}

await writableRef.current.write(
  event.data
);
receiverShaRef.current.update(
  new Uint8Array(event.data)
);
receivedChunksCountRef.current++;
  bytesReceivedRef.current += event.data.byteLength;
  const received =
  receivedChunksCountRef.current;

const elapsedSeconds =
  (Date.now() -
    transferStartRef.current) /
  1000;

if (elapsedSeconds > 0) {

  const speedMBps =
    (
      bytesReceivedRef.current /
      1024 /
      1024 /
      elapsedSeconds
    ).toFixed(2);

  if (received % 20 === 0) {
  setTransferSpeed(speedMBps);
}
}
  

const total = totalChunksRef.current;

const percent =
  Math.floor(
    (received / total) * 100
  );

if (received % 20 === 0) {
  setProgress(percent);
}
};

  dataChannel.onopen = () => {
    console.log(
      "Data channel opened"
    );

    setConnectionStatus(
      "Direct Connection Established "
    );
  };

};
  pc.onicecandidate = (event) => {
  

  if (event.candidate) {
    socket.emit("ice-candidate", {
      roomId: joinRoomIdRef.current,
      candidate: event.candidate,
    });
  }
};
  peerConnectionRef.current = pc;
  setPeerConnection(pc);
  

  const answer = await createAnswer(pc, offer);

  

  socket.emit("answer", {
    roomId: joinRoomIdRef.current,
    answer,
  });
});
  socket.on("answer", async (answer) => {

  console.log(
    "Answer received by sender"
  );

  console.log(
    "Signaling state:",
    peerConnectionRef.current
      ?.signalingState
  );

  if (
    peerConnectionRef.current
      ?.signalingState !==
    "have-local-offer"
  ) {
    console.log(
      "Ignoring duplicate answer"
    );
    return;
  }

  await setRemoteAnswer(
    peerConnectionRef.current,
    answer
  );

  setConnectionStatus(
    "Answer processed "
  );
});
  socket.on("ice-candidate", async (candidate) => {
  if (peerConnectionRef.current) {
    await peerConnectionRef.current.addIceCandidate(
      new RTCIceCandidate(candidate)
    );

    
  }
});
socket.on(
  "disconnect",
  () => {

    console.log("Socket disconnected");

    setConnectionStatus("Signaling Lost ");
  }
);

  return () => {
    socket.off("connect");
    socket.off("room-created");
    socket.off("room-joined");
    socket.off("receiver-joined");
    socket.off("offer");
    socket.off("answer");
    socket.off("disconnect");
    
  };
  }, []);




useEffect(() => {

  const params =
    new URLSearchParams(
      window.location.search
    );

  const room =
    params.get("room");

  if (room) {

    setJoinRoomId(room);

  }

}, []);





  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    selectedFileRef.current = file;
  };
  const handleDrop = (event) => {
  event.preventDefault();

  const file = event.dataTransfer.files[0];

  if (file) {
    setSelectedFile(file);
    selectedFileRef.current = file;
  }
};

const handleDragOver = (event) => {
  event.preventDefault();
};
const createRoom = () => {
  console.log("Create Room clicked");
  console.log("Socket ID:", socket.id);
  socket.emit("create-room");
};
const joinRoom = () => {
  joinRoomIdRef.current = joinRoomId;
  socket.emit("join-room", joinRoomId);
};

  return (
    <div className="container">
      <h1>P2P Web Share</h1>
<p>
  Secure peer-to-peer file transfer
</p>

    <div className="upload-box"
      onDrop={handleDrop}
      onDragOver={handleDragOver}>
        <p>Drag & Drop File Here</p>
        <p>or</p>

        <input
          type="file"
          onChange={handleFileChange}
        />

        {selectedFile && (
  <>
    <p>
      📄 {selectedFile.name}
    </p>
    <p>
      Size:{" "}
      {(
        selectedFile.size /
        1024 /
        1024
      ).toFixed(2)}{" "}
      MB
    </p>
  </>
)}
      </div>

      <button
        className="create-btn"
        onClick={createRoom}
         >
        Create Room
      </button>
      {roomId && (
  <div className="info-card">

    <h3>Room Details</h3>

    <p>
      <strong>Room ID:</strong>{" "}
      {roomId}
    </p>

    {shareLink && (
      <p>
        <strong>Link:</strong>
        <br />
        {shareLink}
      </p>
    )}

    {shareLink && (
      <button
        onClick={() =>
          navigator.clipboard.writeText(
            shareLink
          )
        }
      >
        Copy Link
      </button>
    )}

    {status && (
      <p>
        <strong>Status:</strong>{" "}
        {status}
      </p>
    )}
  </div>
)}
    {(
  connectionStatus ||
  progress > 0 ||
  verificationStatus
) && (
  <div className="transfer-card">

    {connectionStatus && (
      <p>
        🔗 {connectionStatus}
      </p>
    )}

    {progress > 0 && (
      <>
        <p>
          Progress: {progress}%
        </p>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </>
    )}

    {progress > 0 && (
      <p>
        ⚡ {transferSpeed} MB/s
      </p>
    )}

    {verificationStatus && (
      <p>
        ✅ Integrity:
        {" "}
        {verificationStatus}
      </p>
    )}
  </div>
)}
      
      <hr />

        <h3>Join Room</h3>

      <input
      type="text"
      placeholder="Enter Room ID"
      value={joinRoomId}
      onChange={(e) => setJoinRoomId(e.target.value)}/>
      <button onClick={joinRoom}>
      Join Room
      </button>
      </div>
    );
}

export default App;




