import { useState } from "react";
import {
  MessageSquare,
  Send,
  Paperclip,
  Filter,
  User,
  Clock,
} from "lucide-react";

/* ================= TYPES ================= */

interface Activity {
  id: string;
  user: string;
  action: string;
  entity: string;
  time: string;
}

interface Message {
  id: string;
  user: string;
  message: string;
  time: string;
}

/* ================= MAIN TAB ================= */

const CollaborationTab = () => {
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");

  const activities: Activity[] = [
    {
      id: "1",
      user: "John Smith",
      action: "created ECO",
      entity: "ECO-1023",
      time: "10 min ago",
    },
    {
      id: "2",
      user: "Amit Verma",
      action: "uploaded document",
      entity: "Spec_v2.pdf",
      time: "1 hour ago",
    },
    {
      id: "3",
      user: "Sara Lee",
      action: "approved ECO",
      entity: "ECO-1019",
      time: "Yesterday",
    },
  ];

  const messages: Message[] = [
    {
      id: "1",
      user: "John Smith",
      message: "Please review the updated BoM for ECO-1023",
      time: "09:45 AM",
    },
    {
      id: "2",
      user: "Amit Verma",
      message: "CAD files uploaded, ready for approval",
      time: "10:10 AM",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* ACTIVITY FEED */}
      <div className="lg:col-span-1 bg-white rounded-xl shadow">
        <div className="flex justify-between items-center px-5 py-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Activity Feed
          </h3>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border rounded-lg px-2 py-1"
          >
            <option value="all">All</option>
            <option value="eco">ECOs</option>
            <option value="document">Documents</option>
            <option value="team">Teams</option>
          </select>
        </div>

        <div className="divide-y">
          {activities.map((a) => (
            <div key={a.id} className="px-5 py-4 text-sm">
              <p className="font-medium">{a.user}</p>
              <p className="text-gray-600">
                {a.action} <span className="font-medium">{a.entity}</span>
              </p>
              <p className="text-xs text-gray-400">{a.time}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CHAT / DISCUSSION */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow flex flex-col">
        <div className="px-6 py-4 border-b flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold">Team Discussion</h3>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          {messages.map((m) => (
            <div key={m.id} className="flex gap-3">
              <div className="bg-gray-100 p-2 rounded-full">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium">{m.user}</p>
                <p className="text-sm text-gray-700">{m.message}</p>
                <p className="text-xs text-gray-400">{m.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* INPUT */}
        <div className="border-t p-4 flex items-center gap-3">
          <button className="p-2 border rounded-lg">
            <Paperclip className="h-4 w-4" />
          </button>

          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message, use @ to mention..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
          />

          <button className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollaborationTab;
