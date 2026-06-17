"use strict";

import fs from "fs";
import net from "net";
import { Buffer } from "buffer";
import path from "path";

import * as tracker from "./tracker.js";
import * as message from "./message.js";
import Pieces from "./Pieces.js";
import Queue from "./Queue.js";
import * as torrentParser from "./torrent-parser.js";

export default function (torrent, downloadPath, onProgress, onComplete, onError, onPeers, onSeeds) {
  tracker.getPeers(torrent, (peers) => {
    if (!peers || peers.length === 0) {
      if (onError) onError(new Error("No peers found"));
      return;
    }
    
    let activePeers = 0;
    let activeSeeds = 0;
    const onPeerConnect = () => {
      activePeers++;
      if (onPeers) onPeers(activePeers);
    };
    const onPeerDisconnect = (isSeed) => {
      activePeers--;
      if (activePeers < 0) activePeers = 0;
      if (onPeers) onPeers(activePeers);
      
      if (isSeed) {
        activeSeeds--;
        if (activeSeeds < 0) activeSeeds = 0;
        if (onSeeds) onSeeds(activeSeeds);
      }
    };
    
    const onSeedFound = () => {
      activeSeeds++;
      if (onSeeds) onSeeds(activeSeeds);
    };

    console.log(torrent.info.files);

    const pieces = new Pieces(torrent);
    // console.log("\n====== initial pieces arrray =====", pieces);

    fs.mkdir(downloadPath, { recursive: true }, (err) => {
      if (err) {
        console.log({ "Torrentino Error: Error creating download directory": err });
        if (onError) onError(err);
        return;
      }
    });

    // todo: take into account the file structure where file are present in
    // the direcories recursively

    const files = initializeFiles(torrent, downloadPath);
    console.log({ files });
    files.forEach((file) => {
      file.descriptor = fs.openSync(file.path, "w");
    });

    peers.forEach((peer) => download(peer, torrent, pieces, files, onProgress, onComplete, onError, onPeerConnect, onPeerDisconnect, onSeedFound));
  });
}

function initializeFiles(torrent, downloadPath) {
  const files = [];
  const basePath = typeof downloadPath === 'string' ? downloadPath : new TextDecoder().decode(downloadPath);

  if (!torrent.info.files) {
    // Single file torrent
    const filename = new TextDecoder().decode(torrent.info.name);
    const filepath = `${basePath}/${filename}`;
    
    fs.mkdirSync(basePath, { recursive: true });
    
    files.push({
      path: filepath,
      length: torrent.info.length,
      descriptor: null,
      globalOffset: 0,
    });
    return files;
  }

    // Multi-file torrent
  let globalOffset = 0;
  for (let i = 0; i < torrent.info.files.length; i++) {
    const pathParts = torrent.info.files[i].path.map(p => new TextDecoder().decode(p));
    
    // SECURITY FIX: Prevent Zip Slip / Path Traversal inside torrent files
    const safePathParts = pathParts.filter(p => p !== '..' && p !== '.' && !p.includes('/') && !p.includes('\\'));
    if (safePathParts.length === 0) safePathParts.push(`malicious_file_${i}`);
    
    const relativePath = safePathParts.join('/');
    const filepath = `${basePath}/${relativePath}`;
    
    // Double check that we didn't escape the basePath
    const resolvedPath = path.resolve(filepath);
    const resolvedBase = path.resolve(basePath);
    if (!resolvedPath.startsWith(resolvedBase)) {
      console.warn("WARNING: Blocked malicious path traversal attempt in torrent");
      continue; // Skip this file
    }

    const fileLength = torrent.info.files[i].length;

    // Ensure directory exists
    const dirPath = filepath.substring(0, filepath.lastIndexOf('/'));
    fs.mkdirSync(dirPath, { recursive: true });

    files.push({
      path: filepath,
      length: fileLength,
      descriptor: null,
      globalOffset: globalOffset,
    });

    globalOffset += fileLength;
  }

  return files;
}

function download(peer, torrent, pieces, files, onProgress, onComplete, onError, onPeerConnect, onPeerDisconnect, onSeedFound) {
  const socket = new net.Socket();
  let isConnected = false;
  socket.isSeed = false;
  socket.peerPieces = new Set();
  
  const checkSeed = () => {
    if (!socket.isSeed && socket.peerPieces.size === pieces._requested.length) {
      socket.isSeed = true;
      if (onSeedFound) onSeedFound();
    }
  };

  socket.on("error", (err) => {
    return { tcp_peer_connect_error: err };
  });

  socket.on("close", () => {
    if (isConnected) {
      isConnected = false;
      if (onPeerDisconnect) onPeerDisconnect(socket.isSeed);
    }
  });

  socket.connect(peer.port, peer.ip, () => {
    isConnected = true;
    if (onPeerConnect) onPeerConnect();
    console.log("\n===== [Torrentino] Connecting with peer: " + peer.ip + " =====\n");
    socket.write(message.buildHandshake(torrent));
  });

  // queue is a list per connection that contains
  // all the pieces that a single peer has
  const queue = new Queue(torrent);

  onWholeMessage(socket, (msg) => {
    // console.log("\n******* received complete message *******\n");
    messageHandler(msg, socket, pieces, queue, torrent, files, onProgress, onComplete, onError, checkSeed);
  });
}

function onWholeMessage(socket, callback) {
  let savedBuffer = Buffer.alloc(0);
  let handshake = true;

  socket.on("data", (receivedBuffer) => {
    // msgLength calculates the length of whole message in bytes
    function msgLength() {
      return handshake
        ? savedBuffer.readUInt8(0) + 49
        : savedBuffer.readInt32BE(0) + 4;
    }
    savedBuffer = Buffer.concat([savedBuffer, receivedBuffer]);

    while (savedBuffer.length >= 4 && savedBuffer.length >= msgLength()) {
      callback(savedBuffer.subarray(0, msgLength()));
      savedBuffer = savedBuffer.subarray(msgLength()); // clear saved buffer
      handshake = false;
    }
  });
}

function messageHandler(msg, socket, pieces, queue, torrent, files, onProgress, onComplete, onError, checkSeed) {
  if (isHandshake(msg)) {
    // console.log("\n===== handshake successfull =====\n");

    socket.write(message.buildInterested());
  } else {
    const parsedMsg = message.parse(msg);
    // console.log({ parsedMsg });

    switch (parsedMsg.id) {
      case 0: {
        // console.log({ choked_msg_received: parsedMsg });
        chokeHandler(socket);
        break;
      }
      case 1: {
        // console.log("\n===== unchoke msg received =====\n");
        unchokeHandler(socket, pieces, queue, torrent);
        break;
      }
      case 4: {
        // console.log({ have_msg_received: parsedMsg });
        haveHandler(socket, pieces, queue, parsedMsg.payload, checkSeed, torrent);
        break;
      }
      case 5: {
        // console.log({ bitfield_msg_received: parsedMsg });
        bitfieldHandler(socket, pieces, queue, parsedMsg.payload, checkSeed, torrent);
        break;
      }
      case 7: {
        // console.log({ pieceblock_msg_received: parsedMsg });
        pieceHandler(socket, pieces, queue, torrent, files, parsedMsg.payload, onProgress, onComplete, onError);
        break;
      }
    }
  }
}

function isHandshake(msg) {
  return (
    msg.length === msg.readUInt8(0) + 49 &&
    msg.toString("utf8", 1) === "BitTorrent protocol"
  );
}

function chokeHandler(socket) {
  socket.end();
}

function unchokeHandler(socket, pieces, queue, torrent) {
  queue.choked = false;
  requestPiece(socket, pieces, queue, torrent);
}

function haveHandler(socket, pieces, queue, payload, checkSeed, torrent) {
  const pieceIndex = payload.readUInt32BE(0);
  socket.peerPieces.add(pieceIndex);
  if (checkSeed) checkSeed();
  
  const queueEmpty = queue.length === 0;

  queue.queue(pieceIndex);

  if (queueEmpty) requestPiece(socket, pieces, queue, torrent);
}

function bitfieldHandler(socket, pieces, queue, payload, checkSeed, torrent) {
  const queueEmpty = queue.length === 0;

  payload.forEach((byte, i) => {
    for (let j = 0; j < 8; j++) {
      if (byte % 2) {
        const pieceIndex = i * 8 + 7 - j;
        queue.queue(pieceIndex);
        socket.peerPieces.add(pieceIndex);
      }
      byte = Math.floor(byte / 2);
    }
  });
  if (checkSeed) checkSeed();

  if (queueEmpty) requestPiece(socket, pieces, queue, torrent);
}

function pieceHandler(socket, pieces, queue, torrent, files, pieceBlock, onProgress, onComplete, onError) {
  pieces.addReceived(pieceBlock);

  const blockGlobalOffset = pieceBlock.index * torrent.info["piece length"] + pieceBlock.begin;
  const blockLength = pieceBlock.block.length;
  const blockEndOffset = blockGlobalOffset + blockLength;

  let written = 0;

  for (const file of files) {
    const fileGlobalOffset = file.globalOffset;
    const fileEndOffset = fileGlobalOffset + file.length;

    if (fileGlobalOffset < blockEndOffset && fileEndOffset > blockGlobalOffset) {
      const fileRelativeOffset = Math.max(0, blockGlobalOffset - fileGlobalOffset);
      const blockRelativeOffset = Math.max(0, fileGlobalOffset - blockGlobalOffset);
      const bytesToWrite = Math.min(file.length - fileRelativeOffset, blockLength - blockRelativeOffset);

      if (!file.descriptor) continue;

      fs.write(
        file.descriptor,
        pieceBlock.block,
        blockRelativeOffset,
        bytesToWrite,
        fileRelativeOffset,
        (err) => {
          if (err) console.error("[Torrentino] Error writing to file:", err);
        }
      );
      written += bytesToWrite;
    }
  }

  const progress = pieces.totalReceivedBlocks / pieces.totalBlocks;
  if (onProgress) onProgress(progress);

  if (pieces.isDone() && !torrent._isCompleteFired) {
    torrent._isCompleteFired = true;
    console.log("\n********** [Torrentino] DOWNLOAD COMPLETE **********");
    socket.end();
    files.forEach((f) => {
      try {
        if (f.descriptor) {
          fs.closeSync(f.descriptor);
          f.descriptor = null;
        }
      } catch (err) {
        console.log({ error_while_closing_file: err });
      }
    });
    console.log("\n[Torrentino] All files closed successfully.");
    if (onComplete) onComplete();
  } else if (!torrent._isCompleteFired) {
    if (process.stdout.isTTY) {
      process.stdout.write(
        `[Torrentino] downloading... ${(progress * 100).toPrecision(3)}%`
      );
      process.stdout.cursorTo(0);
    } else if (pieces.totalReceivedBlocks % 50 === 0) {
      console.log(
        `[Torrentino] downloading... ${(progress * 100).toPrecision(3)}%`
      );
    }

    requestPiece(socket, pieces, queue, torrent);
  }
}



function requestPiece(socket, pieces, queue, torrent) {
  if (queue.choked) return null;

  while (queue.length()) {
    const pieceBlock = queue.deque(); // pick first piece from queue
    if (pieces.needed(pieceBlock)) {
      socket.write(message.buildRequest(pieceBlock)); // request the piece
      pieces.addRequested(pieceBlock); // add it to the requested pieces array
      return;
    }
  }

  // Endgame/Dropped block recovery:
  // If queue is empty, look through all pieces this peer has to see if any are still needed.
  if (socket.peerPieces && !pieces.isDone()) {
    for (const pieceIndex of socket.peerPieces) {
      const nBlocks = torrentParser.blocksPerPiece(torrent, pieceIndex);
      for (let i = 0; i < nBlocks; i++) {
        const pieceBlock = {
          index: pieceIndex,
          begin: i * torrentParser.BLOCK_LENGTH,
          length: torrentParser.blockLen(torrent, pieceIndex, i),
        };
        if (pieces.needed(pieceBlock)) {
          socket.write(message.buildRequest(pieceBlock));
          pieces.addRequested(pieceBlock);
          return;
        }
      }
    }
  }
}
