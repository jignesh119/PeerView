import { useEffect, useState, useRef } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Lobby from "./pages/Lobby.jsx";
import Room from "./pages/Room.jsx";
import { Toaster } from "react-hot-toast";

const APP_ID = import.meta.env.VITE_APP_ID;
let token = null,
  uid = String(Math.floor(Math.random() * 10000)),
  channel;

function App() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          success: { iconTheme: { primary: "#4aed88", secondary: "blue" } },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/room/:roomId" element={<Room />} />
          <Route path="/" element={<Lobby />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
