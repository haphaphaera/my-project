import React, { useState, useRef, useEffect } from "react";
// ==== Konfigurasi Firebase (isi sesuai project kamu) ====
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // ganti dengan kunci kamu
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID",
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// ==== Warna Pastel Tailwind Custom ====
const pastel = {
  pink: "bg-[#F8D6E5]",
  blue: "bg-[#A5D8FA]",
  purple: "bg-[#D2C1FA]",
  green: "bg-[#C8F2DC]",
  yellow: "bg-[#FFF5B8]",
};
// ==== Main App ====
export default function HapChatAI() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("chat");
  const [friends, setFriends] = useState([]);
  const [newFriend, setNewFriend] = useState("");
  const [room, setRoom] = useState("umum");
  const [rooms, setRooms] = useState(["umum", "belajar", "main", "nobar"]);
  const [chat, setChat] = useState({ umum: [], belajar: [], main: [], nobar: [] });
  const [msg, setMsg] = useState("");
  const [file, setFile] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [hidden, setHidden] = useState(false);
  // Video
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const localVideo = useRef();
  const remoteVideo = useRef();
  const pcRef = useRef(null);
  // Whiteboard
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  // ==== Auth Listener ====
  useEffect(() => {
    onAuthStateChanged(auth, setUser);
  }, []);
  // ==== Video/WebRTC Logic ====
  useEffect(() => {
    if (!videoEnabled) return;
    // Simple peer-to-peer (tanpa signaling sesungguhnya)
    // Untuk demo lokal, hanya 1 user dapat menyalakan video
    // Untuk produksi, signaling harus via server/socket
    const pc = new window.RTCPeerConnection();
    pcRef.current = pc;
    // Ambil video/audio lokal
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (localVideo.current) localVideo.current.srcObject = stream;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      });
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideo.current) remoteVideo.current.srcObject = event.streams[0];
    };
    // Untuk demo, tidak ada signaling. 
    // Untuk room nyata, signaling harus via WebSocket/server!
    return () => {
      pc.close();
    };
    // eslint-disable-next-line
  }, [videoEnabled]);
  // ==== Chat Send ====
  const sendMsg = () => {
    if (!msg) return;
    setChat((c) => ({
      ...c,
      [room]: [...c[room], { user: user.email, text: msg, time: Date.now() }],
    }));
    setMsg("");
  };
  // ==== File Upload ====
  const handleUpload = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setUploads((u) => [...u, { name: f.name, url: URL.createObjectURL(f), type: f.type }]);
  };
  // ==== Whiteboard Logic ====
  const startDraw = (e) => {
    setDrawing(true);
    draw(e);
  };
  const endDraw = () => setDrawing(false);
  const draw = (e) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#A5D8FA";
    ctx.beginPath();
    ctx.arc(
      (e.nativeEvent.touches?.[0]?.clientX || e.nativeEvent.clientX) - rect.left,
      (e.nativeEvent.touches?.[0]?.clientY || e.nativeEvent.clientY) - rect.top,
      5,
      0,
      2 * Math.PI
    );
    ctx.fill();
  };
  // ==== Fitur Hidden ====
  const triggerHidden = () => setHidden((h) => !h);
  // ==== UI ====
  if (!user)
    return (
      <LoginScreen
        onLogin={() => onAuthStateChanged(auth, setUser)}
        pastel={pastel}
      />
    );
  return (
    <div className={`min-h-screen ${pastel.pink} flex flex-col font-sans`}>
      {/* Header */}
      <div className={`flex items-center p-3 ${pastel.blue} justify-between shadow-md`}>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-widest text-[#d45da1]">hapChatAI</span>
          <button
            className="ml-1 px-2 py-1 rounded bg-[#D2C1FA]/80 hover:bg-[#d45da1]/20 text-xs"
            onClick={() => setTab("chat")}
          >
            Chat
          </button>
          <button
            className="px-2 py-1 rounded bg-[#C8F2DC]/80 hover:bg-[#A5D8FA]/30 text-xs"
            onClick={() => setTab("video")}
          >
            Video
          </button>
          <button
            className="px-2 py-1 rounded bg-[#FFF5B8]/80 hover:bg-[#F8D6E5]/30 text-xs"
            onClick={() => setTab("file")}
          >
            File
          </button>
          <button
            className="px-2 py-1 rounded bg-[#F8D6E5]/80 hover:bg-[#A5D8FA]/30 text-xs"
            onClick={() => setTab("friends")}
          >
            Teman
          </button>
          <button
            className="px-2 py-1 rounded bg-[#d45da1]/10 hover:bg-[#A5D8FA]/40 text-xs"
            onClick={() => setTab("whiteboard")}
          >
            Whiteboard
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">{user.email}</span>
          <button
            className="rounded px-3 bg-[#d45da1]/60 text-white text-xs"
            onClick={() => signOut(auth)}
          >
            Logout
          </button>
        </div>
      </div>
      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Room */}
        <div className={`w-32 ${pastel.purple} flex flex-col items-center py-3`}>
          <div className="mb-2 font-bold text-[#d45da1]">Room</div>
          {rooms.map((r) => (
            <button
              key={r}
              className={`mb-2 rounded px-4 py-1 text-sm ${room === r ? "bg-[#d45da1]/60 text-white" : "bg-white"} hover:bg-[#A5D8FA]/70`}
              onClick={() => setRoom(r)}
            >
              {r}
            </button>
          ))}
          <button
            className="mt-10 text-xs underline text-[#d45da1] hover:text-[#A5D8FA]"
            onClick={triggerHidden}
            aria-label="hidden"
          >
            ?
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 flex flex-col relative">
          {/* Chat */}
          {tab === "chat" && (
            <div className="flex flex-col h-full">
              <div className="flex-1 p-4 overflow-y-auto">
                {(chat[room] || []).map((c, i) => (
                  <div key={i} className={`flex mb-2 ${c.user === user.email ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`px-3 py-2 rounded-2xl shadow ${c.user === user.email ? pastel.blue : pastel.yellow} max-w-[70%]`}
                    >
                      <div className="text-xs text-gray-400">{c.user.split("@")[0]}</div>
                      <div>{c.text}</div>
                      <div className="text-[10px] text-gray-300 text-right">{new Date(c.time).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 p-2 bg-white/70 rounded-b-2xl shadow">
                <input
                  className="flex-1 px-3 py-2 rounded-full border"
                  placeholder="Ketik pesan..."
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMsg()}
                />
                <button
                  className="rounded-full px-4 py-2 bg-[#d45da1] text-white"
                  onClick={sendMsg}
                >
                  Kirim
                </button>
              </div>
            </div>
          )}
          {/* Video */}
          {tab === "video" && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="flex gap-4">
                <video ref={localVideo} autoPlay muted playsInline className="w-48 h-36 border-2 border-[#D2C1FA] rounded-lg shadow" />
                <video ref={remoteVideo} autoPlay playsInline className="w-48 h-36 border-2 border-[#C8F2DC] rounded-lg shadow" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setVideoEnabled((v) => !v)}
                  className="px-4 py-2 rounded bg-[#A5D8FA] hover:bg-[#d45da1]/30 font-bold"
                >
                  {videoEnabled ? "Matikan Kamera" : "Nyalakan Kamera"}
                </button>
                <button
                  onClick={() => {
                    navigator.mediaDevices.getDisplayMedia({ video: true })
                      .then((stream) => {
                        if (localVideo.current) localVideo.current.srcObject = stream;
                      });
                  }}
                  className="px-4 py-2 rounded bg-[#FFF5B8] hover:bg-[#A5D8FA]/30"
                >
                  Share Screen
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-400">* Untuk video call massal, gunakan server signaling!</div>
            </div>
          )}
          {/* File Upload */}
          {tab === "file" && (
            <div className="p-5">
              <div className="mb-4">
                <input type="file" onChange={handleUpload} className="block mb-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {uploads.map((f, i) => (
                  <div key={i} className="bg-white shadow rounded p-2 flex items-center gap-2">
                    {f.type.startsWith("image") ? (
                      <img src={f.url} alt={f.name} className="w-16 h-16 object-cover rounded" />
                    ) : f.type.startsWith("video") ? (
                      <video src={f.url} controls className="w-16 h-16 rounded" />
                    ) : (
                      <div className="w-16 h-16 flex items-center justify-center bg-[#C8F2DC] rounded">
                        <span>📄</span>
                      </div>
                    )}
                    <a href={f.url} download={f.name} className="underline text-[#d45da1]">{f.name}</a>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Friend List */}
          {tab === "friends" && (
            <div className="p-5">
              <div className="mb-4">
                <input
                  value={newFriend}
                  onChange={(e) => setNewFriend(e.target.value)}
                  placeholder="Tambah email teman"
                  className="px-3 py-2 border rounded w-60 mr-2"
                />
                <button
                  onClick={() => {
                    if (newFriend && !friends.includes(newFriend)) setFriends((f) => [...f, newFriend]);
                    setNewFriend("");
                  }}
                  className="px-3 py-2 rounded bg-[#d45da1]/80 text-white"
                >
                  Simpan
                </button>
                <button
                  className="ml-2 underline text-[#A5D8FA]"
                  onClick={() => setShowInvite((v) => !v)}
                >
                  Invite via Email
                </button>
              </div>
              <div>
                <div className="font-bold mb-1">Daftar Teman:</div>
                <ul>
                  {friends.map((f, i) => (
                    <li key={i} className="mb-1">{f}</li>
                  ))}
                </ul>
              </div>
              {showInvite && (
                <div className="mt-4 bg-[#FFF5B8] p-3 rounded shadow">
                  <div className="font-bold mb-1">Kirim invite:</div>
                  <input
                    className="border px-2 py-1 rounded"
                    placeholder="Email teman"
                  />
                  <button
                    className="ml-2 px-3 py-1 rounded bg-[#d45da1]/60 text-white"
                    onClick={() => alert("Undangan akan dikirim (demo, nonaktif)")}
                  >
                    Kirim
                  </button>
                  <div className="text-xs mt-1 text-gray-400">* Fitur invite email hanya demo</div>
                </div>
              )}
            </div>
          )}
          {/* Whiteboard */}
          {tab === "whiteboard" && (
            <div className="flex flex-col items-center h-full justify-center">
              <canvas
                ref={canvasRef}
                width={400}
                height={300}
                className="border-4 border-[#A5D8FA] rounded-lg shadow-lg bg-white"
                onMouseDown={startDraw}
                onMouseUp={endDraw}
                onMouseMove={draw}
                onTouchStart={startDraw}
                onTouchEnd={endDraw}
                onTouchMove={draw}
                style={{ touchAction: "none", cursor: "crosshair" }}
              />
              <button
                className="mt-4 px-4 py-2 bg-[#d45da1]/70 text-white rounded"
                onClick={() => {
                  const ctx = canvasRef.current.getContext("2d");
                  ctx.clearRect(0, 0, 400, 300);
                }}
              >
                Clear
              </button>
            </div>
          )}
          {/* Fitur Hidden */}
          {hidden && (
            <div className="absolute bottom-10 right-10 bg-[#fff] border-4 border-[#d45da1] rounded-2xl shadow-2xl p-8 flex flex-col items-center animate-bounce z-30">
              <div className="text-4xl mb-2">🎉</div>
              <div className="font-bold text-lg text-[#d45da1] mb-2">EASTER EGG!</div>
              <div className="mb-2 text-sm text-[#A5D8FA]">Kamu menemukan fitur rahasia!<br />Coba klik logo hapChatAI 7x untuk unlock tema dark pastel!</div>
              <button className="mt-2 px-4 py-1 bg-[#A5D8FA] rounded text-white" onClick={triggerHidden}>Tutup</button>
            </div>
          )}
        </div>
      </div>
      {/* Footer */}
      <div className={`text-center py-2 text-xs text-[#d45da1] ${pastel.purple}`}>
        hapChatAI &copy; 2025 - Untuk Gen-Z, oleh Gen-Z | <span className="font-bold">#StayConnected</span>
      </div>
    </div>
  );
}
// ==== Komponen Login Screen ====
function LoginScreen({ onLogin, pastel }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [register, setRegister] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (register) {
        await createUserWithEmailAndPassword(auth, email, pw);
      } else {
        await signInWithEmailAndPassword(auth, email, pw);
      }
      onLogin();
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen ${pastel.pink}`}>
      <div className="flex flex-col items-center p-8 rounded-xl shadow-2xl bg-white/90">
        <h1 className="text-4xl font-bold text-[#d45da1] mb-2 tracking-widest">hapChatAI</h1>
        <div className="mb-4 text-[#A5D8FA]">Aplikasi chat untuk semua situasi</div>
        <form className="w-72 flex flex-col gap-2" onSubmit={submit}>
          <input
            type="email"
            className="p-2 rounded border"
            placeholder="Email kamu"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="p-2 rounded border"
            placeholder="Password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            required
          />
          <button
            type="submit"
            className={`w-full p-2 rounded bg-[#A5D8FA] font-bold text-white mt-2`}
          >
            {register ? "Daftar" : "Login"}
          </button>
        </form>
        <div className="mt-2 text-xs text-gray-600">
          {register ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
          <button
            className="underline text-[#d45da1] font-bold"
            onClick={() => setRegister((r) => !r)}
          >
            {register ? "Login" : "Daftar"}
          </button>
        </div>
        {error && <div className="mt-2 text-red-400 text-xs">{error}</div>}
      </div>
      <div className="mt-10 text-xs text-[#A5D8FA] text-center">
        Untuk demo: login/daftar dengan email apa saja.<br />
        Data chat/file hanya tersimpan di memory browser.
      </div>
    </div>
  );
