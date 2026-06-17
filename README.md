# Torrentino

A full-stack, decentralized BitTorrent client built with Node.js and React. Torrentino provides a robust custom P2P networking engine for downloading torrents and a highly responsive, modern dashboard for managing active transfers in real-time.

## Features

- **Custom BitTorrent Engine**: Implements the BitTorrent protocol natively in Node.js, featuring manual TCP peer handshakes and UDP tracker communication.
- **Data Integrity & Recovery**: Includes built-in SHA-1 piece hashing to ensure file integrity, alongside an endgame recovery algorithm that aggressively re-requests dropped chunks.
- **Real-Time Dashboard**: A React/Vite frontend that visualizes active peer clusters, live download speeds, and concurrent disk I/O metrics via asynchronous polling.
- **Secure File System Integration**: Sandboxed directory browsing and strict path validation prevent Zip Slip and path traversal vulnerabilities during multi-file torrent extraction.
- **Modular Architecture**: Clean separation of concerns with dedicated controllers and global state management.

## Tech Stack

- **Backend**: Node.js, Express
- **Frontend**: React, Vite, Tailwind CSS, Recharts
- **Networking**: Raw TCP (`net`), UDP (`dgram`)

## Installation

Ensure you have [Node.js](https://nodejs.org/) installed, then clone the repository:

```bash
git clone https://github.com/yourusername/mytorrent-client.git
cd mytorrent-client
```

### Starting the Backend

The backend engine handles the raw P2P connections and file extraction.

```bash
cd backend
npm install
npm start
```

### Starting the Frontend

The React frontend provides the real-time visualization dashboard.

```bash
cd frontend
npm install
npm run dev
```

## Usage

1. Open the dashboard in your browser.
2. Upload a `.torrent` file.
3. The backend will automatically resolve the tracker, handshake with peers, and begin downloading chunks directly to your system.
4. Monitor live speeds, active peer connections, and file progress from the Library view.

## License

This project is licensed under the MIT License.
