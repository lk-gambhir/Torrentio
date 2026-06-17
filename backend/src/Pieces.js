"use strict";

import * as torrentParser from "./torrent-parser.js";

export default class Pieces {
  constructor(torrent) {
    function calculateTotalPieces() {
      return torrent.info.pieces.length / 20;
    }

    function buildPiecesArray() {
      const nPieces = calculateTotalPieces();
      const arr = new Array(nPieces).fill(null);
      return arr.map((_, i) =>
        new Array(torrentParser.blocksPerPiece(torrent, i)).fill(false)
      );
    }

    this._requested = buildPiecesArray();
    this._received = buildPiecesArray();

    this.totalBlocks = this._requested
      .map((piece) => {
        return piece.reduce((count, _) => count + 1, 0);
      })
      .reduce((acc, curr) => acc + curr, 0);
    this.totalReceivedBlocks = 0;
    this.totalRequestedBlocks = 0;
  }

  addRequested(pieceBlock) {
    const blockIndex = pieceBlock.begin / torrentParser.BLOCK_LENGTH;
    if (!this._requested[pieceBlock.index][blockIndex]) {
      this._requested[pieceBlock.index][blockIndex] = true;
      this.totalRequestedBlocks++;
    }
  }

  addReceived(pieceBlock) {
    const blockIndex = pieceBlock.begin / torrentParser.BLOCK_LENGTH;
    if (!this._received[pieceBlock.index][blockIndex]) {
      this._received[pieceBlock.index][blockIndex] = true;
      this.totalReceivedBlocks++;
      
      // If we received a block that was somehow not marked as requested, fix the count
      if (!this._requested[pieceBlock.index][blockIndex]) {
        this._requested[pieceBlock.index][blockIndex] = true;
        this.totalRequestedBlocks++;
      }
    }
  }

  needed(pieceBlock) {
    if (this.totalRequestedBlocks === this.totalBlocks) {
      this._requested = this._received.map((blocks) => blocks.slice());
      this.totalRequestedBlocks = this.totalReceivedBlocks;
    }

    const blockIndex = pieceBlock.begin / torrentParser.BLOCK_LENGTH;
    return !this._requested[pieceBlock.index][blockIndex];
  }

  isDone() {
    return this.totalReceivedBlocks === this.totalBlocks;
  }

  isPieceComplete(pieceIndex) {
    return this._received[pieceIndex].every((block) => block);
  }
}
