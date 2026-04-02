import { useSocket } from '../../hooks/useSocket';
import { useEffect, useState } from 'react';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const socket = useSocket();
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [socket]);

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:px-6 md:py-4">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 md:hidden"
            aria-label="Open navigation menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        )}
        <h1 className="text-lg font-bold text-gray-900 md:text-xl">File Processing Dashboard</h1>
      </div>
      <div className="flex items-center gap-2" role="status" aria-label={connected ? 'Connected to server' : 'Disconnected from server, reconnecting'}>
        <div className={`h-2.5 w-2.5 rounded-full transition-colors duration-200 ${connected ? 'bg-green-500' : 'bg-red-500'}`} aria-hidden="true" />
        <span className="text-sm text-gray-500">
          {connected ? (
            <span className="flex items-center gap-1">
              <span aria-hidden="true">&#x2713;</span> Connected
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <span aria-hidden="true">&#x21BB;</span> Reconnecting...
            </span>
          )}
        </span>
      </div>
    </header>
  );
}
