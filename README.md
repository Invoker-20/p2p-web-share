# P2P Web Share
> ⭐ Advanced Extension Implemented: Large File Support (>500 MB)

A WebRTC based peer-to-peer file sharing application built for the Mars Open Project 2026 .

The goal of this project is to transfer files directly between devices without uploading file data to a central server.

## Features

* Create and join rooms using a unique room ID
* Drag-and-drop file support
* Share rooms using an invite link
* Direct file transfer using WebRTC DataChannels
* Transfer progress tracking
* Transfer speed display
* Streaming SHA-256 integrity verification
* Automatic file download after transfer
* Connection and disconnect handling
* Large file support 
* Streaming file transfer for low memory usage


## Advanced Feature Implemented

### Large File Support (>500 MB)

This project implements the Large File Support extension from the Mars Open Project advanced feature list.

To support very large transfers without excessive RAM usage:

* Files are streamed in chunks instead of loading the entire file into memory.
* Incoming chunks are written directly to disk using the File System Access API.
* SHA-256 hashes are computed incrementally during transfer for integrity verification.
* Memory usage remains low even for large files.
* Successfully tested with file up to 1.1 GB.

This implementation enables reliable browser-based peer-to-peer transfer of files larger than 500 MB while avoiding browser memory limitations through streaming reads, writes, and integrity verification.

## Tech Stack

### Frontend

* React
* Vite
* WebRTC

### Backend

* Node.js
* Express
* Socket.IO

### Deployment

* Frontend: Vercel
* Backend: Render

## How It Works

1. The sender creates a room.
2. The receiver joins the room.
3. Socket.IO is used for signaling (offer, answer, and ICE candidate exchange).
4. A WebRTC DataChannel is established between the two peers.
5. The file is streamed in chunks over a WebRTC DataChannel.
6. Both sender and receiver compute SHA-256 hashes during transfer.
7. The receiver verifies integrity before marking the transfer complete.

## Setup Instructions 

1. Sender needs to create a room.
2. The sender receives a room code and invite link to share with the receiver.
3. If the receiver opens the invite link, the room code is filled automatically. Alternatively, the receiver can enter the room code manually.
4. The receiver clicks Join Room.
5. File transfer starts automatically and the file is downloaded when the transfer completes.

## Testing

Successful transfers:

* 20 MB
* 300 MB
* 1.1 GB

## Hosted Application

https://p2p-web-share-alpha.vercel.app

## Repository

https://github.com/Invoker-20/p2p-web-share

## Future Improvements

* Resume interrupted transfers

* TURN server support for difficult network environments

## Author

Rishabh Singh