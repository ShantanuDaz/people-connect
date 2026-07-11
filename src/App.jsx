import { useState } from "react";

export default function App() {
  const [message, setMessage] = useState("Waiting for backend...");

  const sendPing = async () => {
    // 1. Call the backend through our bridge!
    const response = await window.api.ping();

    // 2. Show the backend's response on the screen
    setMessage(response);
  };

  return (
    <div
      style={{
        padding: "2rem",
        color: "white",
        textAlign: "center",
        fontFamily: "sans-serif",
      }}
    >
      <h1>React + Holepunch</h1>
      <p style={{ color: "#4ADE80" }}>{message}</p>

      <button
        onClick={sendPing}
        style={{
          padding: "10px 20px",
          cursor: "pointer",
          fontSize: "1rem",
          borderRadius: "8px",
        }}
      >
        Ping the Backend
      </button>
    </div>
  );
}
