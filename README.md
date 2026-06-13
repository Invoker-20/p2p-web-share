# P2P Web Share

A peer-to-peer file sharing application built using WebRTC, React, Node.js, Express, and Socket.IO.

Users can create a room, share the room ID or invite link, and transfer files directly between devices without uploading file data to a central server.

## Features

* Peer-to-peer file transfer using WebRTC DataChannels
* Room creation and joining using unique room IDs
* Invite link sharing
* Real-time transfer progress tracking
* Real-time transfer speed display
* SHA-256 file integrity verification
* Automatic file download on completion
* Disconnect detection and handling
* Large file support (tested up to 1.1 GB)
* Cross-device support (Desktop ↔ Desktop, Desktop ↔ Android)

## Tech Stack

### Frontend

* React
* Vite
* WebRTC

### Backend

* Node.js
* Express.js
* Socket.IO

### Deployment

* Frontend: Vercel
* Backend: Render

## How It Works

1. Sender creates a room.
2. Receiver joins using the room ID or invite link.
3. Socket.IO signaling exchanges:

   * Offer
   * Answer
   * ICE Candidates
4. A WebRTC DataChannel is established.
5. Files are transferred directly between peers.
6. SHA-256 verification confirms file integrity.
7. Receiver automatically downloads the file.

## Project Structure

```text
p2p-web-share
│
├── backend
│   ├── server.js
│   └── package.json
│
├── frontend
│   ├── src
│   ├── public
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## Performance

### Tested Successfully

* 20 MB (Laptop → Android)
* 300 MB (Hosted deployment)
* 1.1 GB (Desktop transfer)

### Additional Features

* Chunked file transfer
* Flow control using DataChannel buffering
* Transfer speed monitoring
* Integrity verification using SHA-256

## Deployment

Frontend:
https://p2p-web-share-alpha.vercel.app

Backend:
https://p2p-web-share-u6sh.onrender.com

## Future Improvements

* Resume interrupted transfers
* Drag and drop file support
* Better transfer analytics
* Enhanced mobile UI
* TURN server support for difficult network environments

## Author

Rishabh Singh

Developed as part of the Mars Open Projects 2026 selection process.
