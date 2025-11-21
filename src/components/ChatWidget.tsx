import { useState } from "react";

export default function ChatWidget() {
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;
    // For demo: instantly add to local messages
    setMessages([...messages, { sender: "You", text: input }]);
    // TODO: Optionally send to your backend here with fetch(...)
    setInput("");
  };

  return (
    <div className="fixed bottom-8 right-8 w-80 bg-white rounded-lg shadow-lg p-4 flex flex-col z-50">
      <h4 className="font-bold text-purple-600 mb-2">Chat Support</h4>
      <div className="flex-1 overflow-y-auto mb-2 min-h-[120px] max-h-48">
        {messages.map((msg, idx) => (
          <div key={idx} className="mb-1">
            <span className="font-semibold">{msg.sender}:</span> {msg.text}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === "Enter" && sendMessage()}
        className="px-3 py-2 border rounded mb-1"
        placeholder="Type message..."
      />
      <button
        onClick={sendMessage}
        className="bg-purple-500 hover:bg-pink-500 text-white rounded px-3 py-2 mt-1 font-bold"
      >
        Send
      </button>
    </div>
  );
}x  xx  x  
