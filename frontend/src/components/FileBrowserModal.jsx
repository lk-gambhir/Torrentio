import { useState, useEffect } from 'react';
import { Folder, FolderUp, X, ChevronRight, Check } from 'lucide-react';

export default function FileBrowserModal({ isOpen, onClose, onSelect, initialPath }) {
  const [currentPath, setCurrentPath] = useState(initialPath || '');
  const [parentPath, setParentPath] = useState(null);
  const [directories, setDirectories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  

  const fetchDirectories = async (path) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/browse?path=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error('Cannot read directory');
      const data = await res.json();
      setCurrentPath(data.currentPath);
      setParentPath(data.parentPath);
      setDirectories(data.directories || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => fetchDirectories(initialPath || ''), 0);
    }
  }, [isOpen, initialPath]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-pencil/40 backdrop-blur-sm p-4">
      <div className="card w-full max-w-2xl flex flex-col max-h-[80vh] rotate-0 shadow-2xl relative bg-paper border-4 border-pencil">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4 pb-4 border-b-2 border-dashed border-pencil">
          <h3 className="text-3xl font-kalam flex items-center gap-2">
            <Folder className="w-8 h-8 text-marker" /> Select Folder
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-erased rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Current Path Bar */}
        <div className="flex items-center gap-2 bg-white border-2 border-pencil p-2 mb-4" style={{ borderRadius: 'var(--wobble-sm)' }}>
          <div className="font-mono text-sm flex-1 truncate px-2 text-pencil/80">
            {currentPath}
          </div>
          <button 
            onClick={() => onSelect(currentPath)}
            className="bg-pen text-white px-4 py-1 flex items-center gap-2 border-2 border-pencil font-bold hover:-translate-y-0.5 transition-transform"
            style={{ borderRadius: 'var(--wobble-sm)' }}
          >
            <Check className="w-4 h-4" /> Pick Here
          </button>
        </div>

        {/* Browser List */}
        <div className="flex-1 overflow-y-auto bg-white border-2 border-pencil p-2" style={{ borderRadius: 'var(--wobble-sm)' }}>
          {error && (
            <div className="text-marker font-bold p-4 text-center">
              Error: {error}
            </div>
          )}
          
          {loading && !error && (
            <div className="p-8 text-center text-pencil/50 animate-pulse font-kalam text-xl">
              Loading folders...
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-1">
              {parentPath && (
                <button
                  onClick={() => fetchDirectories(parentPath)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-erased text-left transition-colors font-bold"
                  style={{ borderRadius: 'var(--wobble-sm)' }}
                >
                  <FolderUp className="w-6 h-6 text-pencil/60" />
                  <span>.. (Up one level)</span>
                </button>
              )}
              
              {directories.length === 0 && !parentPath ? (
                <div className="p-4 text-center text-pencil/50">No sub-folders</div>
              ) : (
                directories.map((dir) => (
                  <button
                    key={dir.path}
                    onClick={() => fetchDirectories(dir.path)}
                    className="w-full flex items-center justify-between p-2 hover:bg-erased text-left transition-colors"
                    style={{ borderRadius: 'var(--wobble-sm)' }}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Folder className="w-6 h-6 text-pencil/80 shrink-0" />
                      <span className="truncate">{dir.name}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-pencil/30 shrink-0" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
