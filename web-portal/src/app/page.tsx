'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Server, LogOut, ChevronRight, LayoutGrid, Network, Activity, ArrowLeft, ArrowRight, RefreshCw, Zap, Shield, Search, Globe, User, Settings, Lock, Mail, Calendar, CreditCard, Wifi, Cpu, Share2, Plus, Trash2, AlertTriangle, X, Box, Rocket, Copy, Check, Terminal, Layers
} from 'lucide-react';

const API_BASE = "http://localhost:8004/api";

export default function ZeroComputeSaneKinetic() {
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  const [view, setViewState] = useState<'auth' | 'dashboard' | 'meshes' | 'nodes' | 'mesh' | 'profile'>('auth');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [meshes, setMeshes] = useState<any[]>([]);
  const [allNodes, setAllNodes] = useState<any[]>([]);
  const [activeMesh, setActiveMeshState] = useState<any>(null);
  const [meshNodes, setMeshNodes] = useState<any[]>([]);
  const [stats, setStats] = useState({ total_meshes: 0, total_nodes: 0, health: 'Idle' });
  const [histories, setHistories] = useState<{[key: string]: any[]}>({});
  const [cmd, setCmd] = useState("");
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authData, setAuthData] = useState({username: '', password: '', email: ''});
  const [token, setToken] = useState<string | null>(null);
  
  const [showConfirm, setShowConfirm] = useState<{show: boolean, meshId: string | null}>({show: false, meshId: null});
  const [showCreate, setShowCreate] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [newMeshName, setNewMeshName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const setView = (v: any) => { setViewState(v); localStorage.setItem('zc_view', v); };
  const setActiveMesh = (m: any) => {
    setActiveMeshState(m);
    if (m) localStorage.setItem('zc_active_mesh', JSON.stringify(m));
    else localStorage.removeItem('zc_active_mesh');
  };

  const secureFetch = async (endpoint: string, options: any = {}) => {
    if (!token && !endpoint.includes('login') && !endpoint.includes('register')) return null;
    const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}), ...options.headers };
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
      if (!res.ok) { if (res.status === 401) { localStorage.clear(); setViewState('auth'); } return null; }
      if (res.status === 204) return { success: true };
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) return await res.json();
      return null;
    } catch (err) { return null; }
  };

  const refreshData = async () => {
    const data = await secureFetch('/fleet/overview/');
    if (data) { if (data.stats) setStats(data.stats); if (data.all_nodes) setAllNodes(data.all_nodes); }
    const mdata = await secureFetch('/meshes/');
    if (Array.isArray(mdata)) {
      setMeshes(mdata);
      const savedMesh = localStorage.getItem('zc_active_mesh');
      if (savedMesh) {
        const parsed = JSON.parse(savedMesh);
        const match = mdata.find((m: any) => m.mesh_id === parsed.mesh_id);
        if (match) setActiveMeshState(match);
      }
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('zc_token');
    const savedUser = localStorage.getItem('zc_user');
    const savedView = localStorage.getItem('zc_view');
    if (savedToken) {
      setToken(savedToken);
      if (savedUser) setUser(JSON.parse(savedUser));
      if (savedView) setViewState(savedView as any);
      else setViewState('dashboard');
    } else { setViewState('auth'); }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (token) {
      refreshData();
      secureFetch('/profile/').then(d => d && setProfileData(d));
      const int = setInterval(refreshData, 5000);
      return () => clearInterval(int);
    }
  }, [token]);

  useEffect(() => {
    if (view === 'mesh' && activeMesh && token) {
      const fetchMeshNodes = async () => {
        const data = await secureFetch(`/mesh/${activeMesh.mesh_id}/`);
        if (data && data.nodes) setMeshNodes(data.nodes);
      };
      fetchMeshNodes();
      const interval = setInterval(fetchMeshNodes, 3000);
      return () => clearInterval(interval);
    }
  }, [view, activeMesh, token]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [histories, activeMesh]);

  const handleAuth = async (e: any) => {
    e.preventDefault();
    const endpoint = authMode === 'login' ? '/login/' : '/register/';
    const data = await secureFetch(endpoint, { method: 'POST', body: JSON.stringify(authData) });
    if (data && data.access) {
      setToken(data.access);
      const userData = data.user || { username: authData.username };
      setUser(userData);
      localStorage.setItem('zc_token', data.access);
      localStorage.setItem('zc_user', JSON.stringify(userData));
      setView('dashboard');
    } else { alert("Auth failed"); }
  };

  const createMesh = async () => {
    if (!newMeshName) return;
    setIsCreating(true);
    await secureFetch('/meshes/', { method: 'POST', body: JSON.stringify({name: newMeshName}) });
    setTimeout(() => {
      setNewMeshName("");
      setIsCreating(false);
      setShowCreate(false);
      refreshData();
    }, 800);
  };

  const executeRemove = async () => {
    const meshId = showConfirm.meshId;
    if (!meshId) return;
    const res = await secureFetch(`/mesh/${meshId}/remove/`, { method: 'DELETE' });
    if (res) { if (activeMesh?.mesh_id === meshId) { setActiveMesh(null); setView('meshes'); } refreshData(); }
    setShowConfirm({show: false, meshId: null});
  };

  const runCmd = async () => {
    if (!cmd.trim() || !activeMesh) return;
    const current = cmd;
    const mId = activeMesh.mesh_id;
    setCmd("");
    setHistories(prev => ({ ...prev, [mId]: [...(prev[mId] || []), {type: 'cmd', content: current}] }));
    const data = await secureFetch(`/mesh/${mId}/execute/`, { method: 'POST', body: JSON.stringify({code: current, engine: 'bash'}) });
    setHistories(prev => ({ ...prev, [mId]: [...(prev[mId] || []), {type: 'out', content: data?.stdout || data?.stderr || data?.error || "(Success)"}] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const Logo = () => (
    <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setView('dashboard')}>
      <span className="text-2xl font-black text-[#8b5cf6]" style={{ fontFamily: "'Roboto', sans-serif", WebkitTextStroke: '1px currentColor' }}>0</span>
      <span className="text-base font-bold tracking-tighter">Compute</span>
    </div>
  );

  const Sparkline = ({ data }: { data: number[] }) => {
    if (!data || data.length === 0) return null;
    const max = Math.max(...data, 1);
    const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${30 - (v / max) * 20}`).join(' ');
    return (
      <svg className="w-full h-8 text-[#8b5cf6]/30" viewBox="0 0 100 30" preserveAspectRatio="none">
         <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  };

  const BlueprintGrid = () => (
    <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `radial-gradient(#8b5cf6 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />
  );

  if (loading) return null;

  if (view === 'auth') return (
    <div className="min-h-screen bg-[#fcfcfd] flex items-center justify-center p-6 relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <BlueprintGrid />
      <div className="max-w-sm w-full bg-white border border-[#e4e4e7] p-10 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] relative z-10">
        <div className="flex flex-col items-center mb-8"><Logo /></div>
        <form onSubmit={handleAuth} className="space-y-3">
          <input type="text" placeholder="Identifier" className="w-full px-5 py-3.5 bg-gray-50 border rounded-xl outline-none focus:border-[#8b5cf6] text-sm" onChange={e => setAuthData({...authData, username: e.target.value})} />
          <input type="password" placeholder="Key" className="w-full px-5 py-3.5 bg-gray-50 border rounded-xl outline-none focus:border-[#8b5cf6] text-sm" onChange={e => setAuthData({...authData, password: e.target.value})} />
          <button className="w-full h-12 bg-[#09090b] text-white font-bold rounded-xl shadow-xl shadow-gray-200 uppercase tracking-widest text-[10px]">Initialize Session</button>
        </form>
      </div>
    </div>
  );

  const activeHistory = (activeMesh && histories[activeMesh.mesh_id]) || [];
  const installCmd = activeMesh ? `curl -s http://localhost:8004/api/install.sh | bash -s ${activeMesh.mesh_id}` : '';

  return (
    <div className="h-screen bg-[#fcfcfd] text-[#09090b] font-sans flex overflow-hidden relative" style={{ fontFamily: "'Inter', sans-serif" }}>
      <BlueprintGrid />
      
      {/* CONNECT NODE MODAL */}
      {showConnect && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowConnect(false)} />
           <div className="bg-white border border-[#e4e4e7] w-full max-w-xl rounded-3xl shadow-[0_64px_128px_-16px_rgba(0,0,0,0.2)] p-10 relative z-10 animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-start mb-6">
                 <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-sm border border-emerald-100"><Plus size={24} /></div>
                 <button onClick={() => setShowConnect(false)} className="h-8 w-8 rounded-full hover:bg-gray-50 flex items-center justify-center transition-colors"><X size={16} /></button>
              </div>
              <h3 className="text-2xl font-black tracking-tighter uppercase mb-2">Connect Node</h3>
              <p className="text-[#71717a] text-[13px] leading-relaxed font-medium mb-8">Run this tactical one-liner to link the <span className="text-[#8b5cf6] font-black">{activeMesh?.name}</span> mesh.</p>
              
              <div className="relative group">
                 <div className="w-full bg-[#09090b] p-8 rounded-2xl font-mono text-white text-[12px] break-all leading-relaxed relative overflow-hidden">
                    {installCmd}
                    <button onClick={() => copyToClipboard(installCmd)} className="absolute top-4 right-4 h-10 w-10 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center justify-center transition-all">
                       {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* CREATE MESH MODAL */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowCreate(false)} />
           <div className="bg-white border border-[#e4e4e7] w-full max-w-md rounded-3xl shadow-[0_64px_128px_-16px_rgba(0,0,0,0.2)] p-10 relative z-10 animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-start mb-6">
                 <div className="h-12 w-12 rounded-2xl bg-violet-50 text-[#8b5cf6] flex items-center justify-center shadow-sm border border-violet-100"><Rocket size={24} /></div>
                 <button onClick={() => setShowCreate(false)} className="h-8 w-8 rounded-full hover:bg-gray-50 flex items-center justify-center transition-colors"><X size={16} /></button>
              </div>
              <h3 className="text-2xl font-black tracking-tighter uppercase mb-2">Create Mesh</h3>
              <p className="text-[#71717a] text-[13px] leading-relaxed font-medium mb-8">Initialize a new secure compute enclave.</p>
              <div className="space-y-4 mb-8">
                 <input autoFocus value={newMeshName} onChange={e => setNewMeshName(e.target.value)} placeholder="NETWORK_ID" className="w-full h-12 px-6 bg-[#fcfcfd] border border-[#e4e4e7] rounded-xl outline-none focus:border-[#8b5cf6] font-bold text-sm transition-all" />
              </div>
              <button onClick={createMesh} disabled={isCreating || !newMeshName} className="w-full h-14 bg-[#09090b] text-white font-bold rounded-xl shadow-xl shadow-gray-200 uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 hover:bg-black transition-all">
                 {isCreating ? <RefreshCw className="animate-spin" size={16} /> : <Plus size={16} />}
                 {isCreating ? 'Initializing...' : 'Create Enclave'}
              </button>
           </div>
        </div>
      )}

      {/* CONFIRM DECOMMISSION MODAL */}
      {showConfirm.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowConfirm({show: false, meshId: null})} />
           <div className="bg-white border border-[#e4e4e7] w-full max-w-md rounded-3xl shadow-[0_64px_128px_-16px_rgba(0,0,0,0.2)] p-10 relative z-10 animate-in zoom-in-95 duration-300">
              <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shadow-sm border border-red-100 mb-6"><AlertTriangle size={24} /></div>
              <h3 className="text-2xl font-black tracking-tighter uppercase mb-2 text-[#ef4444]">Decommission</h3>
              <p className="text-[#71717a] text-[13px] leading-relaxed font-medium mb-8">Permanently retire assets? <span className="text-red-500 font-bold">Irreversible.</span></p>
              <div className="flex gap-3">
                 <button onClick={executeRemove} className="flex-1 h-12 bg-[#ef4444] text-white font-bold rounded-xl uppercase tracking-widest text-[10px] hover:bg-red-600 transition-all">Decommission</button>
                 <button onClick={() => setShowConfirm({show: false, meshId: null})} className="px-6 h-12 bg-[#f8f9fa] border border-[#e4e4e7] text-[#09090b] font-bold rounded-xl uppercase tracking-widest text-[10px] hover:bg-gray-50 transition-all">Abort</button>
              </div>
           </div>
        </div>
      )}

      <aside className="w-64 border-r border-[#e4e4e7] bg-white/80 backdrop-blur-xl flex flex-col shrink-0 relative z-20">
        <div className="p-6 h-16 flex items-center border-b shrink-0"><Logo /></div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
            { id: 'meshes', label: 'Meshes', icon: Network },
            { id: 'nodes', label: 'Nodes', icon: Server },
          ].map((item) => (
            <button key={item.id} onClick={() => setView(item.id as any)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[12px] font-bold transition-all ${view === item.id || (view === 'mesh' && item.id === 'meshes') ? 'bg-white text-[#8b5cf6] border border-[#e4e4e7] shadow-sm' : 'text-[#71717a] hover:bg-gray-50'}`}>
              <item.icon size={16} strokeWidth={2.5} /> {item.label}
            </button>
          ))}
        </div>
        <div className="p-4 border-t bg-white shrink-0">
          <div onClick={() => setView('profile')} className={`flex items-center gap-3 p-3 rounded-2xl border border-[#e4e4e7] bg-[#f8f9fa] mb-3 cursor-pointer hover:border-[#8b5cf6] transition-all group ${view === 'profile' ? 'border-[#8b5cf6] bg-violet-50' : ''}`}>
             <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] flex items-center justify-center text-white font-black text-sm uppercase">{profileData?.username?.charAt(0) || user?.username?.charAt(0) || 'U'}</div>
             <div className="flex-1 min-w-0">
                <div className="text-[12px] font-black truncate capitalize leading-tight">{profileData?.username || user?.username}</div>
                <div className="text-[8px] text-[#8b5cf6] font-bold uppercase tracking-widest">Enterprise</div>
             </div>
          </div>
          <button onClick={() => {localStorage.clear(); window.location.reload();}} className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-[#ef4444] hover:bg-red-50 transition-all"><LogOut size={12} /> Terminate</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <header className="h-16 border-b border-[#e4e4e7] flex items-center justify-between px-8 bg-white/50 backdrop-blur-md shrink-0">
          <div className="text-[9px] font-black text-[#a1a1aa] uppercase tracking-[0.2em] flex items-center gap-2">
            <span>STUDIO</span><ChevronRight size={12} /><span className="text-[#09090b]">{view}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-widest">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Sync
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {view === 'dashboard' && (
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="flex justify-between items-end">
                <div>
                   <h1 className="text-[32px] font-black tracking-tighter leading-none text-[#09090b]">ORCHESTRATOR</h1>
                   <p className="text-[#8b5cf6] font-bold text-[9px] tracking-[0.4em] mt-2 uppercase">Agentic Infrastructure</p>
                </div>
                <button onClick={() => setShowCreate(true)} className="h-11 px-6 bg-[#8b5cf6] text-white flex items-center gap-2 rounded-xl shadow-lg shadow-violet-100 hover:scale-105 transition-all text-[10px] font-black uppercase tracking-widest border-2 border-white"><Plus size={16} /> Create Mesh</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Topology', value: stats.total_meshes, icon: Network, detail: 'Meshes' },
                  { label: 'Compute', value: stats.total_nodes, icon: Server, detail: 'Instances' },
                  { label: 'Health', value: stats.health, icon: Activity, color: 'text-emerald-600', detail: 'Optimal' },
                ].map((s, i) => (
                  <div key={i} className="bg-white border border-[#e4e4e7] p-6 rounded-2xl shadow-sm hover:border-[#8b5cf6] transition-all">
                    <div className="p-2 bg-[#f8f9fa] rounded-lg border border-[#e4e4e7] w-fit mb-4 text-[#8b5cf6]"><s.icon size={18} /></div>
                    <p className="text-[9px] font-black text-[#a1a1aa] uppercase tracking-[0.2em] mb-1">{s.label}</p>
                    <div className="flex items-baseline gap-1.5"><h4 className={`text-[28px] font-black tracking-tighter ${s.color || ''}`}>{s.value}</h4><span className="text-[10px] font-bold text-[#a1a1aa] uppercase">{s.detail}</span></div>
                  </div>
                ))}
              </div>

              <div className="bg-white border border-[#e4e4e7] p-8 rounded-2xl shadow-sm relative overflow-hidden">
                 <div className="flex justify-between items-center mb-6 relative z-10">
                    <div><h3 className="text-lg font-black uppercase tracking-tight">Mesh Topology</h3><p className="text-[9px] font-bold text-[#a1a1aa] uppercase mt-1">Inter-node communication</p></div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border text-[9px] font-bold text-[#71717a]"><Wifi size={12} className="text-[#8b5cf6]" /> {stats.total_nodes} Nodes</div>
                 </div>
                 <div className="h-[400px] w-full bg-[#fcfcfd] rounded-xl border border-[#e4e4e7] relative flex items-center justify-center overflow-hidden">
                    <style>{`
                      @keyframes scanRotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                      @keyframes orbitRotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                      @keyframes counterRotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(-360deg); } }
                      @keyframes linePulse { 0%, 100% { opacity: 0.2; stroke-width: 1; } 50% { opacity: 0.5; stroke-width: 2; } }
                    `}</style>
                    <div className="absolute inset-0 flex items-center justify-center">
                       <div className="absolute h-[320px] w-[320px] border border-[#8b5cf6]/10 rounded-full" />
                       <div className="absolute h-[220px] w-[220px] border border-[#8b5cf6]/5 rounded-full" />
                       <div className="absolute h-[120px] w-[120px] border-2 border-dashed border-[#8b5cf6]/20 rounded-full animate-[scanRotation_10s_linear_infinite]" />
                    </div>
                    
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                       <defs>
                          <radialGradient id="packetGrad" cx="50%" cy="50%" r="50%">
                             <stop offset="0%" stopColor="#8b5cf6" />
                             <stop offset="100%" stopColor="transparent" />
                          </radialGradient>
                       </defs>
                       {allNodes.map((n, i) => {
                          const angle = (i * (360 / allNodes.length));
                          const pathId = `path-${i}`;
                          return (
                            <g key={i}>
                               <path id={pathId} d={`M 250,200 L ${250 + 120 * Math.cos(angle * Math.PI / 180)},${200 + 120 * Math.sin(angle * Math.PI / 180)}`} fill="none" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="4,4" className="opacity-20 animate-[linePulse_4s_ease-in-out_infinite]" />
                               <circle r="2" fill="url(#packetGrad)">
                                  <animateMotion dur="3s" repeatCount="indefinite" begin={`${i * 0.5}s`}>
                                     <mpath href={`#${pathId}`} />
                                  </animateMotion>
                               </circle>
                            </g>
                          );
                       })}
                    </svg>
                    
                    <div className="relative w-full h-full flex items-center justify-center">
                       <div className="relative z-20">
                          <div className="h-16 w-16 bg-white border-2 border-[#8b5cf6] rounded-2xl flex items-center justify-center shadow-2xl animate-pulse"><Cpu size={28} className="text-[#8b5cf6]" /></div>
                          <div className="absolute inset-[-12px] border-2 border-dashed border-[#8b5cf6]/30 rounded-full animate-[scanRotation_4s_linear_infinite]" />
                       </div>
                       
                       <div className="absolute inset-0 animate-[orbitRotation_60s_linear_infinite]">
                          {allNodes.map((n, i) => (
                             <div key={i} className="absolute left-1/2 top-1/2 h-10 w-10 bg-white border border-[#e4e4e7] rounded-xl flex items-center justify-center shadow-lg group" style={{ 
                                transform: `rotate(${(i * (360 / allNodes.length))}deg) translate(120px)` 
                             }}>
                                <div className="animate-[counterRotation_60s_linear_infinite]">
                                   <Server size={18} className="text-[#8b5cf6]" />
                                   <div className="absolute -bottom-6 opacity-0 group-hover:opacity-100 transition-all bg-gray-900 text-white text-[8px] font-bold px-2 py-1 rounded shadow-xl whitespace-nowrap">{n.id}</div>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {view === 'meshes' && (
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="flex justify-between items-end">
                <h1 className="text-[32px] font-black tracking-tighter uppercase">Meshes</h1>
                <button onClick={() => setShowCreate(true)} className="h-11 px-6 bg-[#09090b] text-white flex items-center gap-2 rounded-xl shadow-lg shadow-gray-100 hover:scale-105 transition-all text-[10px] font-black uppercase tracking-widest"><Plus size={16} /> New Network</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {meshes.map(m => (
                  <div key={m.id} onClick={() => {setActiveMesh(m); setView('mesh');}} className="group bg-white border border-[#e4e4e7] p-6 rounded-2xl hover:border-[#8b5cf6] hover:shadow-lg transition-all cursor-pointer relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className="h-10 w-10 rounded-xl bg-[#f8f9fa] border border-[#e4e4e7] flex items-center justify-center text-[#8b5cf6] group-hover:bg-[#8b5cf6] group-hover:text-white transition-all shadow-sm"><Network size={20} /></div>
                      <button onClick={(e) => {e.stopPropagation(); setShowConfirm({show: true, meshId: m.mesh_id});}} className="h-8 w-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-tighter mb-1 text-[#09090b]">{m.name}</h3>
                    <p className="text-[9px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-6">M_ID: {m.mesh_id.slice(0, 8)}</p>
                    <div className="relative h-8 mb-4 bg-gray-50 rounded-lg overflow-hidden border border-[#e4e4e7]/50"><Sparkline data={m.telemetry || [10, 15, 12, 18]} /></div>
                    <span className="text-[10px] font-black text-[#8b5cf6] flex items-center gap-1 group-hover:gap-2 transition-all uppercase tracking-widest">Access Session <ChevronRight size={14} /></span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'mesh' && (
            <div className="max-w-6xl mx-auto flex flex-col gap-8">
              <div className="flex justify-between items-center">
                 <button onClick={() => setView('meshes')} className="text-[9px] font-black text-[#a1a1aa] hover:text-[#09090b] transition-colors uppercase tracking-[0.3em] flex items-center gap-2"><ArrowLeft size={16} /> BACK_TO_TOPOLOGY</button>
                 <button onClick={() => setShowConnect(true)} className="h-10 px-6 bg-[#09090b] text-white flex items-center gap-2 rounded-xl text-[10px] font-black uppercase tracking-widest"><Plus size={16} /> Add Node</button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                 <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white border border-[#e4e4e7] rounded-2xl overflow-hidden shadow-sm">
                       <div className="px-6 py-4 border-b bg-[#fcfcfd] flex justify-between items-center text-[10px] font-black uppercase">
                          <span>Mesh Fleet</span>
                          <span className="bg-[#8b5cf6] text-white px-2 py-0.5 rounded-md">{meshNodes.length}</span>
                       </div>
                       <div className="p-4 grid grid-cols-1 gap-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                          {meshNodes.length === 0 && (
                            <div className="p-10 text-center border-2 border-dashed rounded-xl border-[#e4e4e7]">
                               <Server size={32} className="mx-auto mb-4 text-[#a1a1aa] opacity-20" />
                               <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest">No Active Nodes</p>
                            </div>
                          )}
                          {meshNodes.map(n => (
                            <div key={n.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#fcfcfd] border border-[#e4e4e7] hover:border-[#8b5cf6] transition-all group shadow-sm">
                               <div className="h-10 w-10 bg-white rounded-lg border flex items-center justify-center text-[#8b5cf6] relative">
                                  <Server size={18} />
                                  <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
                               </div>
                               <div className="flex-1 min-w-0">
                                  <div className="text-[13px] font-black uppercase tracking-tight truncate leading-none mb-1">{n.id}</div>
                                  <div className="text-[9px] text-[#a1a1aa] font-mono">{n.ip}</div>
                               </div>
                               <div className="flex flex-col items-end">
                                  <div className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase">Live</div>
                                  <div className="text-[7px] text-[#a1a1aa] font-bold mt-1">2ms</div>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="lg:col-span-8 flex flex-col h-[700px] bg-[#09090b] rounded-2xl overflow-hidden shadow-2xl border border-white/5 relative">
                    <div className="px-8 py-5 bg-[#141414] border-b border-white/5 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-[#71717a]"><div className="flex items-center gap-3"><div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" /><span>SECURE_TUNNEL</span></div></div>
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 font-mono text-[13px] custom-scrollbar text-[#a1a1aa]">
                       {activeHistory.map((h, i) => (
                         <div key={i} className={`mb-4 ${h.type === 'cmd' ? 'text-[#8b5cf6]' : 'text-[#a1a1aa] pl-6 border-l border-white/10'}`}>
                           {h.type === 'cmd' && <span className="font-black mr-4 opacity-50">zero:~$</span>}
                           <span className={h.type === 'cmd' ? 'text-white font-black' : ''}>{h.content}</span>
                         </div>
                       ))}
                    </div>
                    <div className="p-8 bg-[#111111] border-t border-white/5 flex items-center gap-6 font-mono text-[14px]">
                       <span className="text-[#8b5cf6] font-black opacity-50">zero:~$</span>
                       <input value={cmd} onChange={e => setCmd(e.target.value)} onKeyPress={e => e.key === 'Enter' && runCmd()} className="flex-1 bg-transparent text-white outline-none caret-[#8b5cf6] font-black" placeholder="EXECUTE_PROTOCOL" autoFocus />
                    </div>
                 </div>
              </div>
            </div>
          )}

          {view === 'nodes' && (
            <div className="max-w-5xl mx-auto space-y-8">
              <h1 className="text-[32px] font-black tracking-tighter uppercase">Registry</h1>
              <div className="bg-white border border-[#e4e4e7] rounded-2xl overflow-hidden shadow-sm relative">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#fcfcfd] border-b text-[9px] font-black text-[#a1a1aa] uppercase tracking-widest"><th className="px-8 py-5">Authority ID</th><th className="px-8 py-5">Topology</th><th className="px-8 py-5 text-right">Status</th></tr>
                  </thead>
                  <tbody>
                    {allNodes.map((n, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-6"><div className="flex items-center gap-3"><div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center text-[#8b5cf6]"><Server size={14} /></div><span className="text-sm font-black tracking-tight">{n.id}</span></div></td>
                        <td className="px-8 py-6"><span className="text-[9px] font-black text-[#71717a] uppercase bg-gray-100 px-2.5 py-1 rounded-md border">{n.mesh_name}</span></td>
                        <td className="px-8 py-6 text-right"><div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === 'profile' && (
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div><h1 className="text-[32px] font-black tracking-tighter text-[#09090b]">PROFILE</h1><p className="text-[#8b5cf6] font-bold text-[9px] tracking-[0.3em] mt-2 uppercase">Governance Console</p></div>
               <div className="bg-white border border-[#e4e4e7] rounded-2xl p-10 shadow-sm space-y-10">
                  <div className="flex items-center gap-8 border-b pb-10 border-[#f1f3f5]">
                     <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] flex items-center justify-center text-white font-black text-4xl shadow-xl shadow-violet-100 uppercase">{profileData?.username?.charAt(0) || user?.username?.charAt(0)}</div>
                     <div><h2 className="text-2xl font-black capitalize text-[#09090b]">{profileData?.username || user?.username}</h2><div className="flex items-center gap-1.5 text-[#8b5cf6] font-black text-[10px] uppercase tracking-widest mt-1"><Shield size={14} /> {profileData?.tier || "Enterprise"}</div></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="p-6 bg-[#fcfcfd] rounded-xl border border-[#e4e4e7]"><div className="flex items-center gap-2 text-[#a1a1aa] mb-1.5"><Mail size={14} /><span className="text-[9px] font-black uppercase tracking-widest">Email</span></div><div className="text-xs font-black text-[#09090b]">{profileData?.email || "internal@0.space"}</div></div>
                     <div className="p-6 bg-[#fcfcfd] rounded-xl border border-[#e4e4e7]"><div className="flex items-center gap-2 text-[#a1a1aa] mb-1.5"><Calendar size={14} /><span className="text-[9px] font-black uppercase tracking-widest">Registered</span></div><div className="text-xs font-black text-[#09090b]">{profileData?.date_joined || "N/A"}</div></div>
                  </div>
               </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
