import React, { useState, useMemo } from 'react';
import { useSimulationContext } from '../../context/SimulationContext';
import { PortalMessage, Patient, Module } from '../../types';

interface PortalInboxProps {
  setActiveModule: (module: Module) => void;
}

const PortalInbox: React.FC<PortalInboxProps> = ({ setActiveModule }) => {
  const { state, dispatch } = useSimulationContext();
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(state.portalMessages[0]?.id || null);
  const [replyText, setReplyText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const selectedMessage = useMemo(() => 
    state.portalMessages.find(m => m.id === selectedMessageId),
    [state.portalMessages, selectedMessageId]
  );

  const getPatient = (id: number) => state.patients.find(p => p.id === id);

  const sortedMessages = useMemo(() => {
    return [...state.portalMessages]
      .filter(m => {
        const patient = getPatient(m.patientId);
        const searchStr = `${patient?.lastName} ${patient?.firstName} ${m.subject} ${m.content}`.toLowerCase();
        return searchStr.includes(searchTerm.toLowerCase());
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [state.portalMessages, searchTerm, state.patients]);

  const handleMessageSelect = (id: string) => {
    setSelectedMessageId(id);
    const msg = state.portalMessages.find(m => m.id === id);
    if (msg?.status === 'Unread') {
      dispatch({ type: 'MARK_MESSAGE_READ', payload: id });
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessageId || !replyText.trim()) return;

    dispatch({ 
      type: 'SEND_PORTAL_REPLY', 
      payload: { messageId: selectedMessageId, content: replyText } 
    });

    dispatch({ 
      type: 'ADD_TOAST', 
      payload: { message: 'Reply sent to patient portal.', type: 'success' } 
    });

    setReplyText('');
  };

  const navigateToPatient = (patientId: number) => {
    dispatch({ type: 'SELECT_PATIENT', payload: patientId });
    setActiveModule(Module.FamilyFile);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Medical Question': return 'text-red-600 bg-red-50';
      case 'Billing': return 'text-yellow-600 bg-yellow-50';
      case 'Appointment Request': return 'text-blue-600 bg-blue-50';
      case 'Refill': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white h-full shadow-lg rounded-md overflow-hidden flex animate-slide-in-from-right">
      {/* Sidebar: Message List */}
      <div className="w-80 border-r flex flex-col bg-gray-50">
        <div className="p-4 border-b bg-white">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Patient Portal Inbox</h2>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input 
              type="text" 
              placeholder="Search messages..." 
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-grow overflow-y-auto divide-y">
          {sortedMessages.map(msg => {
            const patient = getPatient(msg.patientId);
            const isSelected = msg.id === selectedMessageId;
            return (
              <div 
                key={msg.id}
                onClick={() => handleMessageSelect(msg.id)}
                className={`p-4 cursor-pointer transition-colors relative group ${isSelected ? 'bg-indigo-50' : 'bg-white hover:bg-gray-100'}`}
              >
                {msg.status === 'Unread' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                    {new Date(msg.timestamp).toLocaleDateString()}
                  </span>
                  {msg.status === 'Processed' && <span className="text-[10px] font-bold text-green-600">✓ Replied</span>}
                </div>
                <h4 className={`text-sm ${msg.status === 'Unread' ? 'font-black' : 'font-bold'} text-gray-800 truncate`}>{patient?.lastName}, {patient?.firstName}</h4>
                <p className="text-xs text-gray-600 font-medium truncate mb-2">{msg.subject}</p>
                <div className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${getCategoryColor(msg.category)}`}>
                  {msg.category}
                </div>
              </div>
            );
          })}
          {sortedMessages.length === 0 && (
            <div className="p-8 text-center text-gray-400 italic">No messages found.</div>
          )}
        </div>
      </div>

      {/* Main: Message Detail */}
      <div className="flex-grow flex flex-col bg-white">
        {selectedMessage ? (
          <>
            <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-black text-gray-800">{selectedMessage.subject}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <button 
                    onClick={() => navigateToPatient(selectedMessage.patientId)}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    {getPatient(selectedMessage.patientId)?.lastName}, {getPatient(selectedMessage.patientId)?.firstName}
                  </button>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs text-gray-500">{new Date(selectedMessage.timestamp).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => navigateToPatient(selectedMessage.patientId)}
                  className="px-4 py-2 border rounded-lg text-xs font-black uppercase text-gray-600 hover:bg-white shadow-sm transition-all"
                >
                  View Patient File
                </button>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto p-8 space-y-8 bg-slate-50/30">
              {/* Patient Message */}
              <div className="flex flex-col items-start max-w-2xl">
                <div className="bg-white border p-6 rounded-2xl rounded-tl-none shadow-sm relative">
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Patient Message</div>
                  <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>
              </div>

              {/* Reply History */}
              {(selectedMessage.replyContent || replyText) && (
                <div className="flex flex-col items-end">
                  <div className="bg-indigo-600 text-white p-6 rounded-2xl rounded-tr-none shadow-md max-w-2xl relative">
                    <div className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2">Your Office Reply</div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedMessage.replyContent || replyText || 'Drafting...'}</p>
                    <div className="mt-4 text-[10px] text-indigo-200 font-bold italic">
                      Sent {selectedMessage.replyTimestamp ? new Date(selectedMessage.replyTimestamp).toLocaleString() : 'Just now'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Reply Input Area */}
            {selectedMessage.status !== 'Processed' ? (
              <div className="p-6 border-t bg-white">
                <form onSubmit={handleSendReply}>
                  <div className="relative">
                    <textarea 
                      placeholder="Type your reply to the patient..."
                      className="w-full p-4 border rounded-xl text-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none h-32 resize-none"
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                    />
                    <div className="absolute bottom-4 right-4 flex gap-3">
                      <button 
                        type="button" 
                        onClick={() => setReplyText('')}
                        className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-gray-600"
                      >
                        Discard
                      </button>
                      <button 
                        type="submit"
                        disabled={!replyText.trim()}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all active:scale-95 disabled:bg-gray-200"
                      >
                        Send Reply
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 text-[10px] text-gray-400 italic">
                    Note: Your reply will be visible to the patient in their secure portal.
                  </p>
                </form>
              </div>
            ) : (
              <div className="p-6 border-t bg-green-50 flex items-center justify-center">
                <p className="text-sm font-bold text-green-700 flex items-center">
                  <span className="mr-2">✅</span> This conversation was marked as processed on {new Date(selectedMessage.replyTimestamp!).toLocaleDateString()}.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-gray-400 opacity-40">
            <div className="text-6xl mb-4">📨</div>
            <p className="text-lg font-black uppercase tracking-widest">Select a message to view</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortalInbox;