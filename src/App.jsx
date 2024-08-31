import { useEffect, useState, useRef } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Lobby from "./pages/Lobby.jsx";
import Room from "./pages/Room.jsx";

const APP_ID = import.meta.env.VITE_APP_ID;
let token = null,
  uid = String(Math.floor(Math.random() * 10000)),
  channel;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/room/:roomId" element={<Room />} />
        <Route path="/" element={<Lobby />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
