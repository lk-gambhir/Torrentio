import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Activity, Users, HardDrive, Pause, Play, Square } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip, YAxis } from 'recharts';

function TorrentDetails() {
  const { id } = useParams();
  const [torrent, setTorrent] = useState(null);

  const fetchTorrent = async () => {
    try {
      const res = await fetch('/api/downloads');
      const data = await res.json();
      const found = data.find(d => d.id === id);
      if (found) setTorrent(found);
    } catch (err) {
      console.error("Failed to fetch torrent details:", err);
    }
  };

  useEffect(() => {
    setTimeout(fetchTorrent, 0);
    const interval = setInterval(fetchTorrent, 1000);
    return () => clearInterval(interval);
  }, [id]);

  const handleAction = async (action) => {
    try {
      await fetch(`/api/downloads/${id}/${action}`, { method: 'POST' });
      fetchTorrent();
    } catch (err) {
      console.error(err);
    }
  };

  if (!torrent) {
    return <div className="text-2xl mt-20 text-center animate-pulse">Finding those files...</div>;
  }

  const isComplete = torrent.status === 'completed';
  const isError = torrent.status === 'error';
  const isPaused = torrent.status === 'paused';
  const isDownloading = torrent.status === 'downloading';

  return (
    <div className="space-y-8 pb-20">
      <Link to="/library" className="inline-flex items-center gap-2 text-xl hover:text-marker transition-colors -rotate-1 mb-4">
        <ArrowLeft className="w-6 h-6" /> Back to Library
      </Link>

      <div className="card bg-postit">
        <div className="absolute -top-3 right-8 w-16 h-6 bg-pencil/10 rotate-6 z-20 backdrop-blur-sm"></div>
        <h1 className="text-4xl md:text-5xl font-kalam mb-2 break-words">{torrent.name}</h1>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
          <div className="flex gap-4 text-xl">
            <span className={`font-bold px-3 py-1 border-2 border-pencil text-sm ${
              isComplete ? 'bg-pen/10 text-pen' : isError ? 'bg-marker/10 text-marker' : isPaused ? 'bg-pencil/10' : 'bg-erased'
            }`} style={{ borderRadius: 'var(--wobble-sm)' }}>
              {torrent.status.toUpperCase()}
            </span>
            <span className="flex items-center text-pencil/80">• {torrent.progress ? torrent.progress.toFixed(1) : 0}% Complete</span>
          </div>

          <div className="flex items-center gap-3">
            {isDownloading && (
              <button onClick={() => handleAction('pause')} className="w-10 h-10 flex items-center justify-center border-2 border-pencil rounded-full bg-white hover:bg-marker/20 hover:border-marker transition-colors">
                <Pause className="w-5 h-5" />
              </button>
            )}
            {isPaused && (
              <button onClick={() => handleAction('resume')} className="w-10 h-10 flex items-center justify-center border-2 border-pencil rounded-full bg-white hover:bg-pen/20 hover:border-pen transition-colors">
                <Play className="w-5 h-5 ml-0.5" />
              </button>
            )}
            {(isDownloading || isPaused) && (
              <button onClick={() => handleAction('stop')} className="w-10 h-10 flex items-center justify-center border-2 border-pencil rounded-full bg-white hover:bg-marker/20 hover:border-marker transition-colors">
                <Square className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        
        <div className="mt-8 progress-track">
          <div 
            className={isError ? "progress-fill-error" : isPaused ? "progress-fill-paused" : "progress-fill"}
            style={{ width: `${Math.min(100, torrent.progress || 0)}%`, backgroundColor: isPaused ? '#f39c12' : undefined }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card flex items-center gap-4 rotate-1">
          <div className="p-4 bg-erased rounded-full border-2 border-pencil">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <div className="text-3xl font-bold">{torrent.speed ? torrent.speed.toFixed(2) : '0.00'}</div>
            <div className="text-lg text-pencil/70">MB/s Speed</div>
          </div>
        </div>

        <div className="card flex items-center gap-4 -rotate-1">
          <div className="p-4 bg-erased rounded-full border-2 border-pencil">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <div className="text-3xl font-bold">{torrent.peers || 0} / {torrent.seeds || 0}</div>
            <div className="text-lg text-pencil/70">Peers / Seeds</div>
          </div>
        </div>

        <div className="card flex items-center gap-4 rotate-2">
          <div className="p-4 bg-erased rounded-full border-2 border-pencil">
            <HardDrive className="w-8 h-8" />
          </div>
          <div>
            <div className="text-3xl font-bold">
              {(() => {
                const gb = 1024 * 1024 * 1024;
                const mb = 1024 * 1024;
                if (!torrent.size) return "0 MB";
                if (torrent.size >= gb) return (torrent.size / gb).toFixed(2) + " GB";
                return (torrent.size / mb).toFixed(2) + " MB";
              })()}
            </div>
            <div className="text-lg text-pencil/70">Total Size</div>
          </div>
        </div>
      </div>

      <div className="card mt-8 min-h-[400px]">
        <h2 className="text-3xl mb-6 flex items-center gap-2 font-kalam">
          Speed History
        </h2>
        
        <div className="w-full h-80 border-[3px] border-pencil bg-white p-4" style={{ borderRadius: 'var(--wobble-sm)' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={torrent.history || []}>
              <XAxis dataKey="time" hide />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip 
                contentStyle={{ fontFamily: 'Patrick Hand', borderRadius: '10px', border: '2px solid #2d2d2d', boxShadow: '4px 4px 0px #2d2d2d' }} 
              />
              <Line 
                type="stepAfter" 
                dataKey="speed" 
                stroke="#2d5da1" 
                strokeWidth={4} 
                dot={false}
                activeDot={{ r: 8, fill: '#2d5da1', stroke: '#2d2d2d', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default TorrentDetails;
