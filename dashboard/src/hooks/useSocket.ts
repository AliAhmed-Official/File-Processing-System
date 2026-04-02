import { useEffect, useRef } from 'react';
import { getSocket } from '../services/socket';
import { Socket } from 'socket.io-client';

export const useSocket = (room?: string): Socket => {
  const socket = getSocket();
  const joinedRoom = useRef<string | null>(null);

  useEffect(() => {
    if (room && joinedRoom.current !== room) {
      if (joinedRoom.current) {
        socket.emit(`leave:${joinedRoom.current.split(':')[0]}`, joinedRoom.current.split(':')[1]);
      }
      const [roomType, roomId] = room.includes(':') ? room.split(':') : [room, undefined];
      if (roomId) {
        socket.emit(`join:${roomType}`, roomId);
      } else {
        socket.emit(`join:${room}`);
      }
      joinedRoom.current = room;
    }

    return () => {
      if (joinedRoom.current) {
        const [roomType, roomId] = joinedRoom.current.includes(':')
          ? joinedRoom.current.split(':')
          : [joinedRoom.current, undefined];
        if (roomId) {
          socket.emit(`leave:${roomType}`, roomId);
        } else {
          socket.emit(`leave:${joinedRoom.current}`);
        }
        joinedRoom.current = null;
      }
    };
  }, [room, socket]);

  return socket;
};
