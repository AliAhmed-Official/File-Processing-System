import { useSocket } from '../../hooks/useSocket';
import { useEffect, useState } from 'react';

export default function Header() {
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
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
      <h1 className="text-xl font-bold text-gray-900">File Processing Dashboard</h1>
      <div className="flex items-center gap-2">
        <div className={`h-2.5 w-2.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm text-gray-500">{connected ? 'Connected' : 'Reconnecting...'}</span>
      </div>
    </header>
  );
}
