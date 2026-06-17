import { useState, useEffect, useRef } from 'react';
import { Upload, File, Play, Activity, TrendingUp, Users, HardDrive, Download, Clock } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip } from 'recharts';

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloads, setDownloads] = useState([]);
  const [speedHistory, setSpeedHistory] = useState([]);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/downloads');
        const data = await res.json();
        setDownloads(data);

        const totalSpeed = data.reduce((a, d) => a + (d.speed || 0), 0);
        const totalPeers = data.reduce((a, d) => a + (d.peers || 0), 0);

        setSpeedHistory(prev => {
          const next = [...prev, {
            time: new Date().toLocaleTimeString(),
            speed: parseFloat(totalSpeed.toFixed(2)),
            peers: totalPeers,
          }];
          return next.length > 20 ? next.slice(-20) : next;
        });
      } catch (e) { /*empty block */ }
    };

    setTimeout(poll, 0);
    const id = setInterval(poll, 1500);
    return () => clearInterval(id);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('torrent', file);
    try {
      const res = await fetch('/api/download', { method: 'POST', body: form });
      if (res.ok) {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        navigate('/library');
      } else {
        alert('Upload failed');
      }
    } catch { alert('Network error'); }
    finally { setUploading(false); }
  };

  const activeDownloads = downloads.filter(d => d.status === 'downloading' || d.status === 'paused');
  const activeCount = activeDownloads.length;
  const totalSpeed = activeDownloads.reduce((a, d) => a + (d.speed || 0), 0);
  const totalPeers = activeDownloads.reduce((a, d) => a + (d.peers || 0), 0);
  const totalSeeds = activeDownloads.reduce((a, d) => a + (d.seeds || 0), 0);

  const recentDownloads = downloads
    .filter(d => d.status === 'completed' || d.status === 'stopped' || d.status === 'error')
    .slice(-5)
    .reverse();

  return (
    <div className="space-y-10">

      {/* ── Heading ── */}
      <header>
        <h2 className="text-5xl md:text-6xl rotate-[-1deg] inline-block">Welcome back!</h2>
        <p className="text-xl text-pencil/60 rotate-1 mt-1">Ready to grab some bits?</p>
      </header>

      {/* ── Stat chips ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active', value: activeCount, Icon: Activity, color: 'bg-marker' },
          { label: 'Speed', value: `${totalSpeed.toFixed(1)} MB/s`, Icon: TrendingUp, color: 'bg-pen' },
          { label: 'Peers/Seeds', value: `${totalPeers} / ${totalSeeds}`, Icon: Users, color: 'bg-pencil' },
          { label: 'Total', value: downloads.length, Icon: HardDrive, color: 'bg-erased' },
        ].map(({ label, value, Icon, color }, i) => (
          <div
            key={label}
            className={`card flex items-center gap-3 ${i % 2 === 0 ? 'rotate-1' : '-rotate-1'}`}
          >
            <div className={`${color} text-white p-2 rounded-full`}>
              <Icon className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-2xl font-bold leading-none">{value}</div>
              <div className="text-sm text-pencil/60">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        {/* ── Upload Card ── */}
        <div className="card bg-postit hover:-rotate-1 transition-transform duration-300">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-marker shadow-hard-sm z-20">
            <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-white/40"></div>
          </div>

          <h3 className="text-3xl mb-6 flex items-center gap-2">
            <Upload className="w-8 h-8" strokeWidth={2.5} /> Add Torrent
          </h3>

          <div className="mb-4">
            <input
              type="file"
              accept=".torrent"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              ref={fileInputRef}
              className="input bg-white/50 cursor-pointer
                file:mr-4 file:py-2 file:px-4
                file:border-2 file:border-pencil file:bg-white
                file:font-hand file:cursor-pointer hover:file:bg-erased"
            />
          </div>

          {file && (
            <div className="mb-4 p-3 border-2 border-dashed border-pencil bg-white/50 rotate-1 flex items-center gap-3" style={{ borderRadius: 'var(--wobble-sm)' }}>
              <File className="w-5 h-5 shrink-0" strokeWidth={2.5} />
              <span className="truncate">{file.name}</span>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="btn w-full text-xl flex items-center justify-center gap-2"
          >
            {uploading
              ? 'Starting...'
              : <><Play className="w-5 h-5" strokeWidth={3} /> Start Download</>}
          </button>
        </div>

        {/* ── Dynamic Right Column ── */}
        <div className="flex flex-col gap-8">
          
          {activeCount > 0 ? (
            /* ── Speed Graph ── */
            <div className="card">
              <div className="absolute -top-3 right-8 w-16 h-5 bg-pencil/10 rotate-6 z-20"></div>

              <h3 className="text-3xl mb-4 flex items-center gap-2">
                <Activity className="w-8 h-8" strokeWidth={2.5} /> Live Speed
              </h3>

              <div className="h-48 w-full border-2 border-pencil bg-white p-2" style={{ borderRadius: 'var(--wobble-sm)' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={speedHistory}>
                    <XAxis dataKey="time" hide />
                    <Tooltip
                      contentStyle={{
                        fontFamily: 'Patrick Hand', border: '2px solid #2d2d2d',
                        boxShadow: '4px 4px 0px #2d2d2d', borderRadius: '10px',
                      }}
                      formatter={(v) => [`${v} MB/s`, 'Speed']}
                    />
                    <Line type="monotone" dataKey="speed" stroke="#ff4d4d" strokeWidth={4} dot={false}
                      activeDot={{ r: 8, fill: '#ff4d4d', stroke: '#2d2d2d', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-center text-2xl font-bold mt-4 rotate-1">
                {totalSpeed.toFixed(1)} MB/s
              </p>
            </div>
          ) : (
            /* ── Recent Downloads (When no active) ── */
            <div className="card">
              <h3 className="text-3xl mb-4 flex items-center gap-2">
                <Clock className="w-8 h-8" strokeWidth={2.5} /> Recently Finished
              </h3>
              
              {recentDownloads.length === 0 ? (
                <div className="text-center text-pencil/50 py-10 rotate-1 border-2 border-dashed border-pencil/30" style={{ borderRadius: 'var(--wobble-sm)' }}>
                  Nothing here yet! Add a torrent to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {recentDownloads.map(dl => (
                    <Link key={dl.id} to={`/torrent/${dl.id}`} className="block">
                      <div className="flex items-center justify-between gap-4 bg-white p-3 border-2 border-pencil hover:bg-erased transition-colors" style={{ borderRadius: 'var(--wobble-sm)' }}>
                        <div className="truncate font-kalam text-xl min-w-0">{dl.name}</div>
                        <div className="shrink-0 text-sm font-bold px-2 py-1 bg-pen/10 text-pen border-2 border-pencil" style={{ borderRadius: 'var(--wobble-sm)' }}>
                          {dl.status.charAt(0).toUpperCase() + dl.status.slice(1)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
          
        </div>
      </div>

      {/* ── Active Downloads (Full Width) ── */}
      {activeCount > 0 && (
        <div className="card -rotate-1 mt-8">
          <h3 className="text-3xl mb-4 flex items-center gap-2">
            <Download className="w-8 h-8" strokeWidth={2.5} /> Active Downloads
          </h3>
          <div className={`grid gap-4 grid-cols-1 ${activeCount === 2 ? 'md:grid-cols-2' : activeCount >= 3 ? 'md:grid-cols-2 lg:grid-cols-3' : ''}`}>
            {activeDownloads.slice(0, 6).map(dl => (
              <Link key={dl.id} to={`/torrent/${dl.id}`} className="block">
                <div className="flex flex-col gap-4 bg-white p-4 border-2 border-pencil hover:bg-erased transition-colors h-full" style={{ borderRadius: 'var(--wobble-sm)' }}>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-kalam text-xl mb-2">{dl.name}</div>
                    <div className="flex justify-between items-end mb-2">
                      <div className="font-bold text-2xl">{Math.floor(dl.progress || 0)}%</div>
                      <div className="text-sm text-pencil/60 font-bold">{dl.status === 'paused' ? 'Paused' : `${(dl.speed || 0).toFixed(1)} MB/s`}</div>
                    </div>
                    <div className="progress-track h-3">
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.min(100, dl.progress || 0)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {activeCount > 6 && (
            <p className="text-center text-pencil/60 mt-6 font-bold">+ {activeCount - 6} more in library</p>
          )}
        </div>
      )}
    </div>
  );
}
