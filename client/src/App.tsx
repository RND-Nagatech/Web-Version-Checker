// Modern Toastify-style Toast component
function Toast({ message, type = 'success' }: { message: string; type?: 'error' | 'success' }) {
  return (
    <div
      className={`fixed top-8 left-1/2 z-50 transform -translate-x-1/2 min-w-[220px] max-w-xs px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in-fast bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 ${type === 'error' ? 'border-red-300 text-red-700 dark:text-red-300' : 'border-green-300 text-green-700 dark:text-green-300'}`}
      style={{
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <span className={`text-xl ${type === 'error' ? 'text-red-400' : 'text-green-400'}`}>{type === 'error' ? '❌' : '✅'}</span>
      <span className="font-medium text-base flex-1">{message}</span>
    </div>
  );
}
import React, { useState, useEffect } from 'react'
import { CheckIcon, CloudIcon, MoonIcon, SunIcon } from './icons'

type Result = {
  url: string;
  versi_klien?: string | null;
  versi_server?: string | null;
  error?: string;
}

export default function App() {
  const [toast, setToast] = useState<{ message: string; type?: 'error' | 'success' } | null>(null);
  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const [urlsText, setUrlsText] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dark, setDark] = useState(() => {
    const v = localStorage.getItem('theme');
    return v === 'dark';
  });
  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalResults = results.length;
  const totalPages = Math.ceil(totalResults / pageSize);
  const paginatedResults = results.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const start = async () => {
    const lines = urlsText.split('\n').map(s => s.trim()).filter(Boolean);
    if (lines.length === 0) {
      setToast({ message: 'Masukkan minimal 1 URL', type: 'error' });
      return;
    }
    setLoading(true);
    setResults([]);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const res = await fetch(`${apiBaseUrl}/api/check`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ urls: lines })
      });
      clearInterval(progressInterval);
      setProgress(100);

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResults(data.results || []);
      localStorage.setItem('lastResults', JSON.stringify(data.results || []));
    } catch (err:any) {
      setToast({ message: 'Gagal: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }

  const download = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'result.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download results as CSV
  const downloadCsv = () => {
    if (!results.length) return;
    const header = ['URL', 'Client Version', 'Server Version', 'Error'];
    const rows = results.map(r => [
      r.url,
      r.versi_klien ?? '',
      r.versi_server ?? '',
      r.error ?? ''
    ]);
    const csvContent = [header, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const blob = new Blob([csvContent], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'result.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    const prev = localStorage.getItem('lastResults');
    if (prev) setResults(JSON.parse(prev));
  }, []);

  // Reset to first page when results change
  useEffect(() => {
    setPage(1);
  }, [results]);

  const totalChecked = results.length;
  const successful = results.filter(r => !r.error).length;
  const failed = results.filter(r => r.error).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-gray-100 relative overflow-hidden">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
        />
      )}
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12 relative">
          <div className="absolute top-0 right-0">
            <button onClick={() => setDark(d => !d)} className="p-4 rounded-2xl hover:bg-white/10 dark:hover:bg-gray-700/50 transition-all duration-300 shadow-xl backdrop-blur-sm bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-600/20">
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mb-6 shadow-2xl animate-pulse">
            {/* Modern gradient checkmark logo */}
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="modern-check-gradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366F1" />
                  <stop offset="1" stopColor="#A78BFA" />
                </linearGradient>
              </defs>
              <circle cx="24" cy="24" r="22" fill="url(#modern-check-gradient)" />
              <path d="M16 25.5L22 31.5L33 18.5" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 animate-fade-in">
            Web Version Checker
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
            Cek versi klien dan server website secara otomatis dalam jumlah banyak dengan mudah dan cepat.
          </p>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 transform hover:scale-105 transition-all duration-300">
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">{totalChecked}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Checked</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 transform hover:scale-105 transition-all duration-300">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">{successful}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Successful</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 transform hover:scale-105 transition-all duration-300">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">{failed}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
          {/* Progress Bar */}
          {loading && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Checking websites...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="mb-8">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Website URLs</label>
                <div className="w-full rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-inner textarea-scrollbar overflow-hidden" style={{ height: '320px' }}>
                  <textarea
                    className="w-full h-full p-6 pr-4 bg-transparent focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 resize-none text-lg"
                    rows={10}
                    placeholder="Masukkan daftar URL satu per baris&#10;&#10;Contoh:&#10;https://example.com&#10;https://google.com&#10;https://github.com"
                    value={urlsText}
                    onChange={e => setUrlsText(e.target.value)}
                    style={{ border: 'none', outline: 'none', boxShadow: 'none', borderRadius: '0', minHeight: '100%', maxHeight: '100%' }}
                  />
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-4 lg:w-80 mt-0 lg:mt-0">
                <button
                  onClick={start}
                  disabled={loading}
                  className="w-full px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl font-bold text-xl transform hover:scale-105 active:scale-95"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Checking...</span>
                    </div>
                  ) : (
                    'Start Check'
                  )}
                </button>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={download}
                    className="w-full px-8 py-4 border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-300 font-semibold text-lg shadow-lg transform hover:scale-105 active:scale-95"
                  >
                    Download JSON
                  </button>
                  <button
                    onClick={downloadCsv}
                    className="w-full px-8 py-4 border-2 border-blue-500 text-blue-600 dark:text-blue-400 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 font-semibold text-lg shadow-lg transform hover:scale-105 active:scale-95"
                  >
                    Download CSV
                  </button>
                </div>
                <button
                  onClick={() => { setResults([]); localStorage.removeItem('lastResults'); }}
                  className="w-full px-8 py-4 border-2 border-red-500 text-red-600 dark:text-red-400 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 font-semibold text-lg shadow-lg transform hover:scale-105 active:scale-95"
                >
                  Clear Results
                </button>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="overflow-hidden rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-xl">
            <table className="w-full table-auto dark:bg-gray-900 bg-white">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                <tr>
                  <th className="p-6 text-left font-bold text-gray-700 dark:text-gray-300 text-lg">🌐 Website</th>
                  <th className="p-6 text-left font-bold text-gray-700 dark:text-gray-300 text-lg">💻 Client Version</th>
                  <th className="p-6 text-left font-bold text-gray-700 dark:text-gray-300 text-lg">🖥️ Server Version</th>
                  <th className="p-6 text-left font-bold text-gray-700 dark:text-gray-300 text-lg">📊 Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedResults.map((r, idx) => (
                  <tr
                    key={idx + (page - 1) * pageSize}
                    className={`border-t border-gray-200 dark:border-gray-700 ${(idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800')} hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors duration-200 animate-fade-in`}
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <td className="p-6 align-top">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 break-all text-lg">{r.url}</div>
                    </td>
                    <td className="p-6 align-top">
                      <span className="inline-flex items-center px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-xl text-sm font-bold shadow-md">
                        🔵 {r.versi_klien ?? 'N/A'}
                      </span>
                    </td>
                    <td className="p-6 align-top">
                      <span className="inline-flex items-center px-3 py-2 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-xl text-sm font-bold shadow-md">
                        🟣 {r.versi_server ?? 'N/A'}
                      </span>
                    </td>
                    <td className="p-6 align-top">
                      {r.error ? (
                        <span className="inline-flex items-center px-3 py-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-xl text-sm font-bold shadow-md">
                          ❌ Error: {r.error}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-xl text-sm font-bold shadow-md">
                          ✅ Success
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-16 text-center text-gray-500 dark:text-gray-400 dark:bg-gray-900 bg-white">
                      <div className="text-6xl mb-6 animate-bounce">📊</div>
                      <div className="text-2xl font-bold mb-2">Belum Ada Hasil</div>
                      <div className="text-lg">Masukkan daftar URL di atas lalu klik \"Mulai Cek\" untuk memulai analisis</div>
                    </td>
                  </tr>
                )}
                {/* Pagination Info & Controls as a single row at bottom right */}
                {results.length > 0 && (
                  <tr>
                    <td colSpan={4} className="pt-4 pb-2 px-6 dark:bg-gray-900 bg-white">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Menampilkan {((page - 1) * pageSize) + 1}
                          {' - '}
                          {Math.min(page * pageSize, totalResults)}
                          {' dari '}
                          {totalResults} domain
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 disabled:opacity-50"
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                          >
                            ←
                          </button>
                          <span className="px-2 py-2 text-gray-500 dark:text-gray-400 text-sm">Halaman {page} / {totalPages}</span>
                          <button
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 disabled:opacity-50"
                            disabled={page === totalPages}
                            onClick={() => setPage(page + 1)}
                          >
                            →
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-12">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
            <p className="text-lg font-medium flex items-center justify-center gap-2">
               Pastikan nama website sesuai agar mendapatkan hasil yang optimal <span className="text-pink-500 text-xl"></span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
