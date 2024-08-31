import React, { useMemo, useContext, createContext } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();
export const useSocket = () => {
  return useContext(SocketContext);
};
export const SocketProvider = ({ children }) => {
  const initOpts = {
    "force new connection": true,
    reconnectionAttempt: "Infinity",
    timeout: 10000,
    transports: ["websocket"],
  };
  const socket = useMemo(
    () =>
      io(import.meta.env.VITE_APP_BACKEND_URL || "localhost:4000", initOpts),
    [],
  );

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
