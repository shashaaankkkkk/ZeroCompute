'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Server, LogOut, ChevronRight, LayoutGrid, Network, Activity, ArrowLeft, ArrowRight, RefreshCw, Zap, Shield, Search, Globe, User, Settings, Lock, Mail, Calendar, CreditCard, Wifi, Cpu, Share2, Plus, Trash2, AlertTriangle, X, Box, Rocket, Copy, Check, Terminal, Layers, Info
} from 'lucide-react';

const API_BASE = "http://localhost:8004/api";

export default function ZeroComputeFixedStudio() {
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
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  
  const [rotation, setRotation] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // FRAME-SYNC KINETIC ENGINE
  useEffect(() => {
    let frame: number;
    const animate = (time: number) => {
      setRotation(time / 150);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

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

  const BlueprintGrid = () => (
    <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `radial-gradient(#8b5cf6 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />
  );

  const Logo = () => (
    <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setView('dashboard')}>
      <span className="text-2xl font-black text-[#8b5cf6]">0</span>
      <span className="text-base font-bold tracking-tighter text-[#09090b]">Compute</span>
    </div>
  );

  if (loading) return null;

  if (view === 'auth') return (
    <div className="min-h-screen bg-[#fcfcfd] flex items-center justify-center p-6 relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <BlueprintGrid />
      <div className="max-w-sm w-full bg-white border border-[#e4e4e7] p-10 rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] relative z-10">
        <div className="flex flex-col items-center mb-10"><Logo /></div>
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="text" placeholder="Identifier" className="w-full px-6 py-4 bg-[#f8f9fa] border border-[#e4e4e7] rounded-2xl outline-none focus:border-[#8b5cf6] text-sm text-[#09090b]" onChange={e => setAuthData({...authData, username: e.target.value})} />
          <input type="password" placeholder="Key" className="w-full px-6 py-4 bg-[#f8f9fa] border border-[#e4e4e7] rounded-2xl outline-none focus:border-[#8b5cf6] text-sm text-[#09090b]" onChange={e => setAuthData({...authData, password: e.target.value})} />
          <button className="w-full h-14 bg-[#8b5cf6] text-white font-black rounded-2xl uppercase tracking-[0.2em] text-[11px] hover:bg-[#7c3aed] transition-all shadow-xl shadow-violet-100">Initialize</button>
        </form>
      </div>
    </div>
  );

  const activeHistory = (activeMesh && histories[activeMesh.mesh_id]) || [];
  const installCmd = activeMesh ? `curl -s http://localhost:8004/api/install.sh | bash -s ${activeMesh.mesh_id}` : '';

  return (
    <div className="h-screen bg-[#fcfcfd] text-[#09090b] font-sans flex overflow-hidden relative" style={{ fontFamily: "'Inter', sans-serif" }}>
      <BlueprintGrid />
      
      {/* GLOBAL MODALS */}
      {(showConnect || showCreate || showConfirm.show) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-md" onClick={() => {setShowConnect(false); setShowCreate(false); setShowConfirm({show: false, meshId: null});}} />
           <div className="bg-white border border-[#e4e4e7] w-full max-w-xl rounded-[40px] shadow-[0_64px_128px_-16px_rgba(0,0,0,0.2)] p-12 relative z-10">
              {showConnect && (
                <>
                  <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 mb-8"><Zap size={28} /></div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-2 text-[#09090b]">Connect Node</h3>
                  <div className="bg-[#f8f9fa] p-8 rounded-3xl font-mono text-[#09090b] text-[12px] break-all leading-relaxed relative border border-[#e4e4e7] mt-8">
                     {installCmd}
                     <button onClick={() => copyToClipboard(installCmd)} className="absolute top-6 right-6 h-12 w-12 bg-white hover:bg-gray-50 rounded-xl flex items-center justify-center transition-all border shadow-sm">
                        {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                     </button>
                  </div>
                </>
              )}
              {showCreate && (
                <>
                  <div className="h-14 w-14 rounded-2xl bg-violet-50 text-[#8b5cf6] flex items-center justify-center border border-violet-100 mb-8"><Rocket size={28} /></div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-2 text-[#09090b]">Create Mesh</h3>
                  <input autoFocus value={newMeshName} onChange={e => setNewMeshName(e.target.value)} placeholder="NETWORK_ID" className="w-full h-14 px-8 bg-[#f8f9fa] border border-[#e4e4e7] rounded-2xl outline-none focus:border-[#8b5cf6] font-bold text-[#09090b] my-8" />
                  <button onClick={createMesh} className="w-full h-16 bg-[#8b5cf6] text-white font-black rounded-2xl shadow-xl shadow-violet-100 uppercase tracking-[0.2em] text-[12px] hover:bg-[#7c3aed]">Synthesize</button>
                </>
              )}
           </div>
        </div>
      )}

      <aside className="w-20 lg:w-64 border-r border-[#e4e4e7] bg-white flex flex-col shrink-0 relative z-30 shadow-sm">
        <div className="p-6 h-16 flex items-center lg:px-8 border-b shrink-0"><Logo /></div>
        <div className="flex-1 py-10 px-4 lg:px-6 space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
            { id: 'meshes', label: 'Meshes', icon: Network },
            { id: 'nodes', label: 'Registry', icon: Server },
          ].map((item) => (
            <button key={item.id} onClick={() => setView(item.id as any)} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${view === item.id ? 'bg-[#f8f9fa] text-[#8b5cf6] border border-[#e4e4e7]' : 'text-[#71717a] hover:bg-gray-50'}`}>
              <item.icon size={18} strokeWidth={2.5} /> <span className="hidden lg:block text-[11px] font-black uppercase tracking-[0.2em]">{item.label}</span>
            </button>
          ))}
        </div>
        <div className="p-6 border-t bg-[#fcfcfd]">
          <button onClick={() => {localStorage.clear(); window.location.reload();}} className="w-full flex items-center justify-center gap-3 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all"><LogOut size={14} /> <span className="hidden lg:block">Logout</span></button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-[#e4e4e7] flex items-center justify-between px-10 bg-white shrink-0">
          <div className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-[0.3em] flex items-center gap-3">
             <span>STUDIO</span><ChevronRight size={14} className="text-[#8b5cf6]" /><span>{view}</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-[0.2em]">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live_Sync
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 custom-scrollbar relative">
          {view === 'dashboard' && (
            <div className="max-w-7xl mx-auto space-y-10">
              <div className="flex justify-between items-end">
                <div>
                   <h1 className="text-[36px] font-black tracking-tighter leading-none text-[#09090b]">ORCHESTRATOR</h1>
                   <p className="text-[#8b5cf6] font-black text-[10px] tracking-[0.5em] mt-3 uppercase opacity-60">High-Density Command Console</p>
                </div>
                <button onClick={() => setShowCreate(true)} className="h-14 px-10 bg-[#8b5cf6] text-white flex items-center gap-3 rounded-2xl shadow-xl shadow-violet-100 hover:scale-105 transition-all text-[11px] font-black uppercase tracking-widest"><Plus size={18} /> New Mesh</button>
              </div>

              {/* RESTORED STAT CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {[
                   { label: 'Topology', value: stats.total_meshes, icon: Network, detail: 'Meshes' },
                   { label: 'Compute', value: stats.total_nodes, icon: Server, detail: 'Nodes' },
                   { label: 'Health', value: stats.health === 'Optimal' ? '100%' : '98%', icon: Activity, color: 'text-emerald-600', detail: 'Protected' },
                 ].map((s, i) => (
                   <div key={i} className="bg-white border border-[#e4e4e7] p-8 rounded-[32px] shadow-sm hover:border-[#8b5cf6] transition-all group">
                     <div className="p-3 bg-[#f8f9fa] rounded-2xl border border-[#e4e4e7] w-fit mb-6 text-[#8b5cf6] group-hover:scale-110 transition-all"><s.icon size={22} /></div>
                     <p className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-[0.2em] mb-2">{s.label}</p>
                     <div className="flex items-baseline gap-2"><h4 className={`text-[32px] font-black tracking-tighter ${s.color || ''}`}>{s.value}</h4><span className="text-[11px] font-black text-[#a1a1aa] uppercase tracking-widest">{s.detail}</span></div>
                   </div>
                 ))}
              </div>

              <div className="flex flex-col lg:flex-row gap-10">
                <div className="flex-1 bg-white border border-[#e4e4e7] rounded-[40px] p-10 h-[700px] flex items-center justify-center relative overflow-hidden shadow-sm">
                   <style>{`
                      @keyframes scan { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                      @keyframes packet { 0% { opacity: 0; r: 6; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; r: 10; } }
                   `}</style>
                   
                   <div className="relative h-[1000px] w-[1000px] scale-[0.5] lg:scale-[0.7] flex items-center justify-center">
                      <div className="absolute h-[850px] w-[850px] border-4 border-dashed border-[#e4e4e7] rounded-full" />
                      <div className="absolute h-[600px] w-[600px] border-2 border-dashed border-gray-100 rounded-full" />
                      <div className="absolute h-[350px] w-[350px] border-8 border-dashed border-[#8b5cf6]/5 rounded-full animate-[scan_20s_linear_infinite]" />

                      <svg viewBox="0 0 1000 1000" className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
                         {allNodes.map((n, i) => {
                            const nodeAngle = (i * (360 / Math.max(allNodes.length, 1))) + rotation;
                            const rad = nodeAngle * Math.PI / 180;
                            const xEnd = 500 + 425 * Math.cos(rad);
                            const yEnd = 500 + 425 * Math.sin(rad);
                            const pathId = `p-${i}`;
                            return (
                              <g key={i}>
                                 <path id={pathId} d={`M 500,500 L ${xEnd},${yEnd}`} fill="none" stroke="#8b5cf6" strokeWidth="4" strokeDasharray="20,20" className="opacity-10" />
                                 <circle fill="#8b5cf6" className="animate-[packet_2.5s_ease-in-out_infinite] shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                                    <animateMotion dur="3s" repeatCount="indefinite" begin={`${i * 0.4}s`}>
                                       <mpath href={`#${pathId}`} />
                                    </animateMotion>
                                 </circle>
                              </g>
                            );
                         })}
                      </svg>

                      {/* HUB */}
                      <div className="relative z-30 group cursor-pointer" onMouseEnter={() => setHoveredNode({type: 'hub'})}>
                         <div className="h-48 w-48 bg-white border-4 border-[#8b5cf6] rounded-[56px] flex items-center justify-center shadow-[0_0_80px_rgba(139,92,246,0.1)] animate-pulse hover:scale-105 transition-all">
                            <Cpu size={80} className="text-[#8b5cf6]" />
                         </div>
                      </div>

                      {/* FRAME-SYNCED NODES */}
                      {allNodes.map((n, i) => {
                         const nodeAngle = (i * (360 / Math.max(allNodes.length, 1))) + rotation;
                         const rad = nodeAngle * Math.PI / 180;
                         const x = 500 + 425 * Math.cos(rad);
                         const y = 500 + 425 * Math.sin(rad);
                         return (
                           <div key={i} className="absolute pointer-events-auto" style={{ transform: `translate(${x - 500}px, ${y - 500}px)` }} onMouseEnter={() => setHoveredNode(n)} onMouseLeave={() => setHoveredNode(null)}>
                              <div className="h-28 w-28 bg-white border-2 border-[#e4e4e7] rounded-[36px] flex items-center justify-center shadow-2xl hover:border-[#8b5cf6] transition-all group relative">
                                 <Server size={48} className="text-[#8b5cf6]" />
                                 <div className="absolute -top-1 -right-1 h-6 w-6 bg-emerald-500 border-4 border-white rounded-full shadow-lg animate-pulse" />
                              </div>
                           </div>
                         );
                      })}
                   </div>
                </div>

                {/* TACTICAL SIDEBAR */}
                <div className="w-full lg:w-96 shrink-0">
                   <div className="bg-white border border-[#e4e4e7] rounded-[40px] p-10 min-h-[500px] shadow-sm flex flex-col h-full">
                      <div className="flex items-center gap-3 mb-10 pb-6 border-b border-[#f1f3f5]">
                         <Info size={22} className="text-[#8b5cf6]" />
                         <h3 className="text-[13px] font-black uppercase tracking-[0.3em]">Intelligence</h3>
                      </div>
                      
                      {hoveredNode ? (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                           <div>
                              <div className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest mb-3">Resource Identity</div>
                              <div className="text-2xl font-black text-[#09090b] break-all tracking-tighter">{hoveredNode.type === 'hub' ? 'CORE_ENGINE' : hoveredNode.id}</div>
                           </div>
                           <div className="grid grid-cols-2 gap-6">
                              <div className="p-5 bg-[#f8f9fa] rounded-2xl border border-[#e4e4e7]"><div className="text-[8px] font-black text-[#a1a1aa] uppercase mb-2">Protocol</div><div className="text-xs font-black text-[#09090b] uppercase">{hoveredNode.type === 'hub' ? 'CONTROL' : 'FABRIC'}</div></div>
                              <div className="p-5 bg-[#f8f9fa] rounded-2xl border border-[#e4e4e7]"><div className="text-[8px] font-black text-[#a1a1aa] uppercase mb-2">Latency</div><div className="text-xs font-black text-emerald-600 uppercase">2ms</div></div>
                           </div>
                           <div className="p-8 bg-violet-50 rounded-3xl border border-violet-100 relative">
                              <div className="text-[10px] font-black text-[#8b5cf6] uppercase tracking-widest mb-4 flex items-center gap-2"><Activity size={16} /> Operational</div>
                              <p className="text-[11px] text-[#7c3aed] font-medium leading-relaxed uppercase tracking-tight">The node is operating at peak efficiency. All cryptographic heartbeats verified.</p>
                           </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-30">
                           <div className="h-20 w-20 border-2 border-dashed border-[#8b5cf6] rounded-full flex items-center justify-center mb-8 animate-[scan_10s_linear_infinite]"><Network size={28} className="text-[#8b5cf6]" /></div>
                           <p className="text-[11px] font-bold uppercase tracking-widest text-[#71717a] leading-relaxed">Hover hardware for tactical telemetry.</p>
                        </div>
                      )}
                   </div>
                </div>
              </div>
            </div>
          )}

          {view === 'mesh' && activeMesh && (
            <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-160px)] gap-10">
              <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-[#e4e4e7] shadow-sm">
                 <button onClick={() => setView('meshes')} className="text-[10px] font-black text-[#a1a1aa] hover:text-[#09090b] uppercase tracking-widest flex items-center gap-3"><ArrowLeft size={18} /> FLEET_BLUEPRINT</button>
                 <div className="flex items-center gap-5">
                    <div className="px-6 py-2.5 bg-[#f8f9fa] rounded-xl border border-[#e4e4e7] text-[11px] font-black text-[#8b5cf6] uppercase tracking-widest">{activeMesh.name}</div>
                    <button onClick={() => setShowConnect(true)} className="h-12 px-8 bg-[#09090b] text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-xl shadow-gray-200">Connect_Node</button>
                 </div>
              </div>

              <div className="flex-1 flex gap-10 overflow-hidden">
                 <div className="w-80 bg-white border border-[#e4e4e7] rounded-[40px] flex flex-col overflow-hidden shadow-sm shrink-0">
                    <div className="p-8 border-b border-[#f1f3f5] text-[11px] font-black text-[#a1a1aa] uppercase tracking-[0.2em]">Live_Fleet</div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                       {meshNodes.map(n => (
                         <div key={n.id} className="p-5 bg-[#fcfcfd] border border-[#e4e4e7] rounded-3xl flex items-center gap-5 hover:border-[#8b5cf6] transition-all group shadow-sm">
                            <div className="h-12 w-12 bg-white rounded-2xl border border-[#e4e4e7] flex items-center justify-center text-[#8b5cf6] group-hover:scale-110 transition-all shadow-sm"><Server size={22} /></div>
                            <div className="min-w-0"><div className="text-[14px] font-black text-[#09090b] truncate uppercase tracking-tight">{n.id}</div><div className="text-[10px] text-[#a1a1aa] font-mono">{n.ip}</div></div>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="flex-1 bg-white border border-[#e4e4e7] rounded-[40px] flex flex-col overflow-hidden shadow-2xl relative group">
                    <div className="absolute inset-0 bg-[#f8f9fa] pointer-events-none opacity-40" />
                    <div className="px-10 py-6 bg-white border-b border-[#f1f3f5] flex justify-between items-center text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest">
                       <div className="flex items-center gap-4"><div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" /><span>ENCRYPTED_TUNNEL</span></div>
                       <span className="font-mono text-gray-400">{activeMesh.mesh_id.slice(0, 16)}</span>
                    </div>
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-12 custom-scrollbar font-mono text-[15px]">
                       {activeHistory.length === 0 && <div className="text-[12px] text-[#a1a1aa] font-black uppercase mb-6 animate-pulse">Establishing tactical link... Handshake verified.</div>}
                       {activeHistory.map((h, i) => (
                         <div key={i} className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
                           {h.type === 'cmd' ? (
                             <div className="flex gap-5">
                               <span className="text-[#8b5cf6] font-black shrink-0">zero:~$</span>
                               <span className="text-[#09090b] font-black tracking-tight">{h.content}</span>
                             </div>
                           ) : (
                             <div className="flex gap-5">
                               <div className="w-1.5 bg-[#f1f3f5] rounded-full shrink-0 my-1" />
                               <pre className="text-[#71717a] whitespace-pre-wrap leading-relaxed text-[14px] font-medium">{h.content}</pre>
                             </div>
                           )}
                         </div>
                       ))}
                    </div>
                    <div className="p-10 bg-[#f8f9fa]/80 border-t border-[#f1f3f5] flex items-center gap-6 group-focus-within:bg-white transition-all backdrop-blur-sm">
                       <span className="text-[#8b5cf6] font-black shrink-0">zero:~$</span>
                       <input value={cmd} onChange={e => setCmd(e.target.value)} onKeyPress={e => e.key === 'Enter' && runCmd()} className="flex-1 bg-transparent text-[#09090b] outline-none caret-[#8b5cf6] font-black placeholder:text-gray-300" placeholder="EXECUTE_COMMAND" autoFocus />
                    </div>
                 </div>
              </div>
            </div>
          )}

          {view === 'meshes' && (
            <div className="max-w-7xl mx-auto space-y-12">
              <div className="flex justify-between items-end border-b border-[#e4e4e7] pb-8">
                <h1 className="text-[40px] font-black tracking-tighter uppercase text-[#09090b]">Enclaves</h1>
                <button onClick={() => setShowCreate(true)} className="h-14 px-10 bg-[#8b5cf6] text-white flex items-center gap-3 rounded-2xl shadow-xl shadow-violet-100 transition-all text-[11px] font-black uppercase tracking-widest"><Plus size={18} /> New Enclave</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {meshes.map(m => (
                  <div key={m.id} onClick={() => {setActiveMesh(m); setView('mesh');}} className="group bg-white border border-[#e4e4e7] p-10 rounded-[48px] hover:border-[#8b5cf6] hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden shadow-sm">
                    <div className="flex justify-between items-start mb-10">
                      <div className="h-14 w-14 rounded-2xl bg-[#f8f9fa] border border-[#e4e4e7] flex items-center justify-center text-[#8b5cf6] group-hover:scale-110 transition-all shadow-sm"><Network size={28} /></div>
                      <button onClick={(e) => {e.stopPropagation(); setShowConfirm({show: true, meshId: m.mesh_id});}} className="h-10 w-10 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18} /></button>
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 text-[#09090b]">{m.name}</h3>
                    <p className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-[0.2em] mb-10">M_ID: {m.mesh_id.slice(0, 16)}</p>
                    <div className="flex items-center gap-2 text-[#8b5cf6] font-black text-[12px] uppercase tracking-widest group-hover:gap-6 transition-all">Launch Console <ChevronRight size={18} /></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'nodes' && (
             <div className="max-w-7xl mx-auto space-y-12">
                <h1 className="text-[40px] font-black tracking-tighter uppercase text-[#09090b]">Registry</h1>
                <div className="bg-white border border-[#e4e4e7] rounded-[40px] overflow-hidden shadow-sm">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="bg-[#f8f9fa] border-b border-[#e4e4e7] text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest"><th className="px-12 py-8">Authority ID</th><th className="px-12 py-8">Mesh Link</th><th className="px-12 py-8 text-right">Status</th></tr>
                      </thead>
                      <tbody>
                         {allNodes.map((n, i) => (
                           <tr key={i} className="border-b border-[#f1f3f5] last:border-0 hover:bg-[#fcfcfd] transition-colors">
                              <td className="px-12 py-10"><div className="flex items-center gap-6 text-[16px] font-black text-[#09090b] tracking-tight truncate"><div className="h-10 w-10 bg-[#f8f9fa] rounded-xl border border-[#e4e4e7] flex items-center justify-center text-[#8b5cf6]"><Server size={20} /></div> {n.id}</div></td>
                              <td className="px-12 py-10 font-black text-[11px] text-[#a1a1aa] uppercase tracking-[0.2em]">{n.mesh_name}</td>
                              <td className="px-12 py-10 text-right"><span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100 uppercase tracking-[0.1em]">Active_Live</span></td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          )}
        </main>
      </div>
    </div>
  );
}
