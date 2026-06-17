import { useState, useEffect } from 'react';
import { Save, Shield, HardDrive, Wifi, CheckCircle2 } from 'lucide-react';
import FileBrowserModal from '../components/FileBrowserModal';

function Settings() {
  const [settings, setSettings] = useState({
    defaultSavePath: '',
    listenPort: 6881,
    maxConnections: 200,
    requireEncryption: true,
    enableDHT: false
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
    } catch (err) {
      alert("Failed to save settings.",err);
    } finally {
      setSaving(false);
    }
  };

  const handleFolderSelect = (path) => {
    setSettings(prev => ({ ...prev, defaultSavePath: path }));
    setIsBrowserOpen(false);
  };

  if (loading) {
    return <div className="text-2xl mt-20 text-center animate-pulse">Loading settings...</div>;
  }

  return (
    <div className="space-y-8 max-w-3xl pb-20">
      <header className="mb-10 border-b-4 border-dashed border-pencil/30 pb-4">
        <h2 className="text-5xl rotate-1">Settings</h2>
        <p className="text-xl text-pencil/70 -rotate-1 mt-2">Tweak it till you break it.</p>
      </header>

      <div className="card space-y-8">
        
        <section>
          <h3 className="text-3xl font-kalam flex items-center gap-2 mb-4">
            <HardDrive className="w-6 h-6" /> Storage
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xl mb-2 font-bold">Default Save Path</label>
              <div className="flex flex-col sm:flex-row gap-4">
                <input 
                  type="text" 
                  name="defaultSavePath"
                  value={settings.defaultSavePath}
                  onChange={handleChange}
                  className="input flex-1"
                />
                <button 
                  onClick={() => setIsBrowserOpen(true)} 
                  className="btn whitespace-nowrap"
                >
                  Browse...
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="w-full border-t-[3px] border-dashed border-pencil/30 my-8"></div>

        <section>
          <h3 className="text-3xl font-kalam flex items-center gap-2 mb-4">
            <Wifi className="w-6 h-6" /> Network
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xl mb-2 font-bold">Listen Port</label>
              <input 
                type="number" 
                name="listenPort"
                value={settings.listenPort} 
                onChange={handleChange}
                className="input" 
              />
            </div>
            <div>
              <label className="block text-xl mb-2 font-bold">Max Connections</label>
              <input 
                type="number" 
                name="maxConnections"
                value={settings.maxConnections} 
                onChange={handleChange}
                className="input" 
              />
            </div>
          </div>
        </section>

        <div className="w-full border-t-[3px] border-dashed border-pencil/30 my-8"></div>

        <section>
          <h3 className="text-3xl font-kalam flex items-center gap-2 mb-4">
            <Shield className="w-6 h-6" /> Privacy
          </h3>
          <div className="space-y-4">
            <label className="flex items-center gap-4 cursor-pointer">
              <input 
                type="checkbox" 
                name="requireEncryption"
                checked={settings.requireEncryption}
                onChange={handleChange}
                className="w-6 h-6 accent-marker rounded" 
              />
              <span className="text-xl">Require Protocol Encryption</span>
            </label>
            <label className="flex items-center gap-4 cursor-pointer">
              <input 
                type="checkbox" 
                name="enableDHT"
                checked={settings.enableDHT}
                onChange={handleChange}
                className="w-6 h-6 accent-marker rounded" 
              />
              <span className="text-xl">Enable DHT (Distributed Hash Table)</span>
            </label>
          </div>
        </section>

        <div className="pt-8 flex items-center justify-end gap-4">
          {savedMsg && (
            <span className="text-pen font-bold flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-5 h-5" /> Saved!
            </span>
          )}
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="btn bg-marker text-white hover:text-white flex items-center gap-2"
          >
            <Save className="w-6 h-6" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <FileBrowserModal 
        isOpen={isBrowserOpen} 
        onClose={() => setIsBrowserOpen(false)} 
        onSelect={handleFolderSelect}
        initialPath={settings.defaultSavePath}
      />
    </div>
  );
}

export default Settings;
