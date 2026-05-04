'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, Server, Shield, Cpu, Zap, Globe, 
  Plus, Terminal, Play, Settings, Bell, Search, 
  ChevronRight, MoreHorizontal, CheckCircle2, AlertCircle,
  Database, Box
} from 'lucide-react';

export default function CloudDashboard() {
  const [meshData, setMeshData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showInstaller, setShowInstaller] = useState(false);
  const [code, setCode] = useState("print('Unified Node Execution Test')\nimport socket\nprint(f'Hello from {socket.gethostname()}')");
  const [executionResult, setExecutionResult] = useState("");
  const [error, setError] = useState<string | null>(null);

  const MESH_ID = "shashank_dev";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:8004/api/mesh/${MESH_ID}/`);
        const data = await res.json();
        setMeshData(data);
        setError(null);
      } catch (err) {
        setError("Management Backend Unreachable");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const runRemoteCode = async () => {
    setExecutionResult("Dispatching to mesh fleet...");
    try {
      const res = await fetch(`http://localhost:8004/api/mesh/${MESH_ID}/execute/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code })
      });
      const result = await res.json();
      setExecutionResult(result.stdout || result.error || "No output returned.");
    } catch (err) {
      setExecutionResult("Execution failed.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] font-sans">
      <nav className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 font-bold text-blue-600">
            <Box className="w-7 h-7" />
            <span className="text-xl tracking-tight text-gray-900">ZeroCompute <span className="text-blue-600">Mesh</span></span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
            <a href="#" className="text-blue-600 border-b-2 border-blue-600 h-16 flex items-center">Fleet Overview</a>
            <a href="#" className="hover:text-gray-900 h-16 flex items-center">Security</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs bg-gray-100 px-3 py-1.5 rounded-full font-mono text-gray-500 border border-gray-200">
            MESH: {MESH_ID}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Active Fleet</h1>
            <p className="text-gray-500 mt-1">Manage your unified compute and storage nodes across the network.</p>
          </div>
          <button 
            onClick={() => setShowInstaller(!showInstaller)}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add New Node
          </button>
        </div>

        {showInstaller && (
          <div className="mb-10 p-8 bg-white border border-gray-200 rounded-2xl shadow-xl border-t-4 border-t-blue-600 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-start justify-between">
              <div className="max-w-2xl">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Deploy a Unified Node</h3>
                <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                  Run this command on any machine to transform it into a mesh node. 
                  This node will handle both <strong>Compute</strong> and <strong>Storage</strong> tasks automatically.
                </p>
                <div className="bg-gray-900 rounded-xl p-5 font-mono text-xs text-blue-400 relative group overflow-hidden">
                  <code className="break-all">curl -sSL http://localhost:8004/api/install.sh | bash -s -- {MESH_ID}</code>
                  <div className="absolute inset-0 bg-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl">
                 <Terminal className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Node List */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Connected Nodes</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {meshData?.nodes?.length || 0} TOTAL
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {meshData?.nodes?.map((node: any) => (
                  <div key={node.id} className="p-8 hover:bg-gray-50/50 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center border border-gray-200 group-hover:bg-white group-hover:border-blue-200 transition-all">
                          <Server className="w-6 h-6 text-gray-400 group-hover:text-blue-600" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{node.id}</div>
                          <div className="text-xs text-gray-400 font-mono tracking-tighter">{node.ip}:{node.port}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black border border-emerald-100 uppercase tracking-wider">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        Online
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                        <Cpu className="w-4 h-4" /> {node.metrics?.cpu}% CPU
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                        <Database className="w-4 h-4" /> Unified Node
                      </div>
                      <div className="flex-1" />
                      <div className="flex gap-2">
                        <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center border border-blue-100">
                           <Zap className="w-3 h-3 text-blue-600" />
                        </div>
                        <div className="w-6 h-6 rounded bg-emerald-50 flex items-center justify-center border border-emerald-100">
                           <Database className="w-3 h-3 text-emerald-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {(!meshData?.nodes || meshData.nodes.length === 0) && (
                  <div className="p-20 text-center text-gray-400 italic">
                    Waiting for your first node to join the mesh...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Code Execution */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden sticky top-24">
              <div className="p-6 border-b border-gray-100 bg-gray-900">
                <h2 className="text-white font-bold text-sm flex items-center gap-2 uppercase tracking-widest">
                  <Terminal className="w-4 h-4 text-blue-400" /> Remote Mesh Console
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="relative">
                  <textarea 
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-48 bg-gray-50 border border-gray-200 rounded-xl p-4 font-mono text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                  <button 
                    onClick={runRemoteCode}
                    className="absolute bottom-4 right-4 bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 shadow-lg hover:scale-105 transition-all"
                  >
                    <Zap className="w-5 h-5 fill-white" />
                  </button>
                </div>
                
                <div className="bg-gray-100 rounded-xl p-5 border border-gray-200 min-h-[120px]">
                  <div className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Output Log</div>
                  <pre className="font-mono text-xs text-gray-600 whitespace-pre-wrap">{executionResult}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
