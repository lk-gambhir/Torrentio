import { useState, useEffect } from 'react';
import { Download, AlertCircle, ChevronRight, CheckCircle2, Pause, Play, Square } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Library() {
  const [downloads, setDownloads] = useState([]);

  const fetchDownloads = async () => {
    try {
      const res = await fetch('/api/downloads');
      const data = await res.json();
      // Reverse to show newest first
      setDownloads(data.reverse());
    } catch (e) { /* ignore */ }
  };

  useEffect(() => {
    setTimeout(fetchDownloads, 0);
    const id = setInterval(fetchDownloads, 2000);
    return () => clearInterval(id);
  }, []);

  const handleAction = async (e, id, action) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await fetch(`/api/downloads/${id}/${action}`, { method: 'POST' });
      fetchDownloads();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <header className="border-b-4 border-dashed border-pencil/30 pb-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-5xl rotate-1">Library</h2>
          <p className="text-xl text-pencil/60 -rotate-1 mt-1">All your downloads in one messy place.</p>
        </div>
        <div className="text-2xl font-bold bg-postit px-4 py-2 border-2 border-pencil -rotate-2 shadow-hard" style={{ borderRadius: 'var(--wobble-sm)' }}>
          {downloads.length} Items
        </div>
      </header>

      {/* ── Empty state ── */}
      {downloads.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-4 border-dashed border-pencil/20" style={{ borderRadius: 'var(--wobble-md)' }}>
          <p className="text-2xl text-pencil/40 rotate-[-2deg]">Nothing here yet… go add a torrent!</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {downloads.map((dl) => {
            const isComplete = dl.status === 'completed';
            const isError = dl.status === 'error';
            const isPaused = dl.status === 'paused';
            const isDownloading = dl.status === 'downloading';

            return (
              <Link key={dl.id} to={`/torrent/${dl.id}`} className="block group">
                <div className="card hover:shadow-hard hover:rotate-[0.5deg] transition-all duration-200 cursor-pointer relative">

                  {/* Status badge */}
                  {isError && (
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-marker rounded-full flex items-center justify-center shadow-hard text-white rotate-12">
                      <AlertCircle className="w-5 h-5" strokeWidth={3} />
                    </div>
                  )}
                  {isComplete && (
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-pen rounded-full flex items-center justify-center shadow-hard text-white -rotate-6">
                      <CheckCircle2 className="w-5 h-5" strokeWidth={3} />
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-erased rounded-full flex items-center justify-center border-2 border-pencil shrink-0">
                        <Download className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-kalam text-2xl truncate">{dl.name}</h3>
                        <div className="flex gap-3 text-pencil/60 text-sm font-bold">
                          <span>{dl.speed ? dl.speed.toFixed(2) : '0.00'} MB/s</span>
                          <span>•</span>
                          <span>{dl.peers || 0} Peers / {dl.seeds || 0} Seeds</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end md:self-auto z-10">
                      {isDownloading && (
                        <button onClick={(e) => handleAction(e, dl.id, 'pause')} className="w-10 h-10 flex items-center justify-center border-2 border-pencil rounded-full hover:bg-marker/20 hover:border-marker transition-colors">
                          <Pause className="w-5 h-5" />
                        </button>
                      )}
                      {isPaused && (
                        <button onClick={(e) => handleAction(e, dl.id, 'resume')} className="w-10 h-10 flex items-center justify-center border-2 border-pencil rounded-full hover:bg-pen/20 hover:border-pen transition-colors">
                          <Play className="w-5 h-5 ml-0.5" />
                        </button>
                      )}
                      {(isDownloading || isPaused) && (
                        <button onClick={(e) => handleAction(e, dl.id, 'stop')} className="w-10 h-10 flex items-center justify-center border-2 border-pencil rounded-full hover:bg-marker/20 hover:border-marker transition-colors">
                          <Square className="w-5 h-5" />
                        </button>
                      )}

                      <span className={`hidden md:inline-block font-bold px-3 py-1 border-2 border-pencil text-sm ${
                        isComplete ? 'bg-pen/10 text-pen' : isError ? 'bg-marker/10 text-marker' : isPaused ? 'bg-pencil/10' : 'bg-erased'
                      }`} style={{ borderRadius: 'var(--wobble-sm)' }}>
                        {dl.status.charAt(0).toUpperCase() + dl.status.slice(1)}
                      </span>
                      <ChevronRight className="w-7 h-7 text-pencil/30 group-hover:text-pencil transition-colors" />
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-4">
                    <div className="progress-track flex-1">
                      <div
                        className={isError ? 'progress-fill-error' : isPaused ? 'progress-fill-paused' : 'progress-fill'}
                        style={{ width: `${Math.min(100, dl.progress || 0)}%`, backgroundColor: isPaused ? '#f39c12' : undefined }}
                      ></div>
                    </div>
                    <span className="font-bold text-lg min-w-[3rem] text-right">
                      {Math.floor(dl.progress || 0)}%
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
