import { io } from "socket.io-client";

const socket = io("https://p2p-web-share-u6sh.onrender.com");

export default socket;