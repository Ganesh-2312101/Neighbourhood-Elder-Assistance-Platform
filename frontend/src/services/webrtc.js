import Peer from 'peerjs';

let peer = null;

export const initPeer = (userId) => {
  if (peer) return peer;

  // Use free public PeerJS server
  peer = new Peer(`neap-user-${userId}`, {
    debug: 2
  });

  peer.on('open', (id) => {
    console.log('PeerJS voice client ready with ID:', id);
  });

  peer.on('error', (err) => {
    console.warn('PeerJS connection notice:', err);
  });

  return peer;
};

export const startVoiceCall = (targetUserId, onRemoteStream, onError) => {
  navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then((localStream) => {
      const call = peer.call(`neap-user-${targetUserId}`, localStream);
      call.on('stream', (remoteStream) => {
        if (onRemoteStream) onRemoteStream(remoteStream);
      });
      call.on('error', (err) => {
        if (onError) onError(err);
      });
    })
    .catch((err) => {
      if (onError) onError('Microphone permission denied or unavailable: ' + err.message);
    });
};

export const answerIncomingCall = (call, onRemoteStream) => {
  navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then((localStream) => {
      call.answer(localStream);
      call.on('stream', (remoteStream) => {
        if (onRemoteStream) onRemoteStream(remoteStream);
      });
    });
};
