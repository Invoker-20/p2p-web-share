export const createPeerConnection = () => {
  return new RTCPeerConnection({
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  });
};

export const createOffer = async (peerConnection) => {
  const offer = await peerConnection.createOffer();

  await peerConnection.setLocalDescription(offer);

  return offer;
};

export const createAnswer = async (peerConnection, offer) => {
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(offer)
  );

  const answer = await peerConnection.createAnswer();

  await peerConnection.setLocalDescription(answer);

  return answer;
};

export const setRemoteAnswer = async (
  peerConnection,
  answer
) => {
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(answer)
  );
};

export const calculateSHA256 = async (
  buffer
) => {

  const hashBuffer =
    await crypto.subtle.digest(
      "SHA-256",
      buffer
    );

  const hashArray =
    Array.from(
      new Uint8Array(hashBuffer)
    );

  return hashArray
    .map(byte =>
      byte
        .toString(16)
        .padStart(2, "0")
    )
    .join("");
};