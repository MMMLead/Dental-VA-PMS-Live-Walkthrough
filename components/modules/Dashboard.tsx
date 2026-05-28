import React, { useState } from 'react';
import { useSimulationContext } from '../../context/SimulationContext';
import { Module, Task, PortalMessage } from '../../types';

interface DashboardProps {
  setActiveModule: (module: Module) => void;
}

const isSameDay = (d1: Date, d2: Date) => 
  d1.getFullYear() === d2.getFullYear() ||
  d1.getMonth() === d2.getMonth() ||
  d1.getDate() === d2.getDate();

const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const adjustedDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
    return adjustedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); 
};

const Dashboard: React.FC<DashboardProps> = ({ setActiveModule }) => {
  const { state, dispatch } = useSimulationContext();
  const today = new Date();

  const appointmentsToday = state.appointments.filter(
    (apt) => isSameDay(apt.startTime, today)
  );
  
  const ledgerEntriesToday = state.patients.flatMap((p) =>
    p.ledger.filter((entry) => isSameDay(new Date(entry.date + 'T12:00:00'), today))
  );

  const productionToday = ledgerEntriesToday.reduce((sum, entry) => sum + entry.charge, 0);
  const collectionsToday = ledgerEntriesToday.reduce((sum, entry) => sum + entry.payment, 0);

  const unreadMessages = state.portalMessages.filter(m => m.status === 'Unread');
  const pendingVerifications = state.verifications.filter(v => v.status === 'To Verify' || v.status === 'Needs Follow-up');

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  const getPatientName = (id: number) => {
    const p = state.patients.find(p => p.id === id);
    return p ? `${p.lastName}, ${p.firstName}` : 'Unknown';
  }
  
  const handlePatientClick = (patientId: number) => {
      dispatch({ type: 'SELECT_PATIENT', payload: patientId });
      setActiveModule(Module.FamilyFile);
  }

  const handleMessageClick = (msg: PortalMessage) => {
      dispatch({ type: 'MARK_MESSAGE_READ', payload: msg.id });
      dispatch({ type: 'SELECT_PATIENT', payload: msg.patientId });
      dispatch({ type: 'ADD_TOAST', payload: { message: `Opening portal thread for ${getPatientName(msg.patientId)}`, type: 'info' } });
      setActiveModule(Module.FamilyFile);
  };

  const handleAddTask = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newTaskTitle) return;
      
      const due = new Date();
      if (newTaskTime) {
        const [h, m] = newTaskTime.split(':').map(Number);
        due.setHours(h, m, 0, 0);
      } else {
          due.setHours(due.getHours() + 1);
      }

      const newTask: Task = {
          id: `task-${Date.now()}`,
          title: newTaskTitle,
          dueDate: due.toISOString(),
          completed: false,
          reminded: false,
          priority: 'Medium'
      };
      
      dispatch({ type: 'ADD_TASK', payload: newTask });
      setNewTaskTitle('');
      setNewTaskTime('');
      setIsAddingTask(false);
  };

  const toggleTask = (id: string) => {
      dispatch({ type: 'TOGGLE_TASK_COMPLETE', payload: id });
  }

  const cyclePriority = (task: Task) => {
      const priorities: Task['priority'][] = ['Low', 'Medium', 'High'];
      const currentIndex = priorities.indexOf(task.priority);
      const nextIndex = (currentIndex + 1) % priorities.length;
      const nextPriority = priorities[nextIndex];
      
      dispatch({ 
          type: 'UPDATE_TASK', 
          payload: { id: task.id, updates: { priority: nextPriority } } 
      });
      
      dispatch({ 
          type: 'ADD_TOAST', 
          payload: { message: `Task urgency updated to ${nextPriority}.`, type: 'info' } 
      });
  };

  const sortedTasks = [...state.tasks].sort((a, b) => {
      if (a.completed === b.completed) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return a.completed ? 1 : -1;
  });

  return (
    <div className="p-4 space-y-6 overflow-y-auto h-full">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Practice Command Center</h1>
          <p className="text-sm text-gray-500 font-medium">{today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex gap-2">
            <button className="px-3 py-1 bg-white border border-gray-300 rounded shadow-sm text-xs font-bold text-gray-600 hover:bg-gray-50 uppercase tracking-wider transition-all">Download Day Sheet</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Today's Schedule" value={appointmentsToday.length.toString()} icon="📅" color="blue" />
        <KpiCard title="Portal Inbox" value={unreadMessages.length.toString()} icon="📨" color="purple" onClick={() => {}} />
        <KpiCard title="Total Production" value={`$${productionToday.toFixed(2)}`} icon="📈" color="green" />
        <KpiCard title="Pending Verif." value={pendingVerifications.length.toString()} icon="🛡️" color="yellow" onClick={() => setActiveModule(Module.InsuranceVerifications)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments Column */}
        <div className="lg:col-span-1">
          <DashboardWidget title="Today's Appointments">
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {appointmentsToday.sort((a,b) => a.startTime.getTime() - b.startTime.getTime()).map(apt => (
                <div key={apt.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between hover:border-blue-300 hover:shadow-sm transition-all group">
                  <div className="flex items-center">
                    <div className="w-16 text-[11px] font-black text-gray-400 uppercase">{apt.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className={`w-1 h-8 rounded-full ${apt.color} mr-3`}></div>
                    <div>
                      <button onClick={() => handlePatientClick(apt.patientId)} className="font-bold text-gray-800 text-sm hover:text-blue-600 transition-colors">{getPatientName(apt.patientId)}</button>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{apt.treatment}</p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-gray-400 font-black uppercase tracking-widest group-hover:text-gray-600">
                    Op-{apt.operatory}
                  </div>
                </div>
              ))}
              {appointmentsToday.length === 0 && <p className="text-center text-gray-400 py-10 italic text-sm">Clear schedule for today.</p>}
            </div>
          </DashboardWidget>
        </div>

        {/* Portal Messages Column */}
        <div className="lg:col-span-1">
          <DashboardWidget title="Patient Portal Messages">
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {state.portalMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(msg => (
                <div 
                    key={msg.id} 
                    onClick={() => handleMessageClick(msg)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer group relative ${msg.status === 'Unread' ? 'bg-purple-50 border-purple-100 shadow-sm' : 'bg-white border-gray-100 opacity-75'}`}
                >
                  {msg.status === 'Unread' && <div className="absolute top-3 right-3 w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>}
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">{msg.category}</span>
                    <span className="text-[9px] text-gray-400 font-bold">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <h4 className="text-xs font-black text-gray-800 mb-0.5 group-hover:text-purple-700">{msg.subject}</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-gray-600">{getPatientName(msg.patientId)}</span>
                    <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">Review →</span>
                  </div>
                </div>
              ))}
              {state.portalMessages.length === 0 && <p className="text-center text-gray-400 py-10 italic text-sm">No new messages.</p>}
            </div>
          </DashboardWidget>
        </div>

        {/* Tasks Column */}
        <div className="lg:col-span-1">
          <DashboardWidget title="Priority Tasks">
            <div className="flex flex-col h-full">
                <div className="flex-grow overflow-y-auto max-h-[400px] mb-4 space-y-2 pr-1 custom-scrollbar">
                    {sortedTasks.map(task => {
                         const isOverdue = !task.completed && new Date(task.dueDate) < new Date();
                         return (
                            <div key={task.id} className={`flex items-center p-2.5 rounded-xl border transition-all ${task.completed ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200 shadow-sm hover:border-blue-400'}`}>
                                <input 
                                    type="checkbox" 
                                    checked={task.completed} 
                                    onChange={() => toggleTask(task.id)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded-lg focus:ring-blue-500 transition-all cursor-pointer"
                                />
                                <div className="ml-3 flex-grow">
                                    <p className={`text-xs font-black ${task.completed ? 'line-through text-gray-400' : 'text-gray-700 uppercase tracking-tight'}`}>{task.title}</p>
                                    <p className={`text-[10px] ${isOverdue ? 'text-red-500 font-black' : 'text-gray-400 font-bold uppercase'}`}>
                                        {isOverdue ? '⚠️ OVERDUE: ' : '⏳ DUE: '} 
                                        {new Date(task.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => cyclePriority(task)}
                                    title={`Click to change urgency (Current: ${task.priority})`}
                                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <span className={`w-2 h-2 rounded-full block transition-all ${
                                        task.priority === 'High' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 
                                        task.priority === 'Medium' ? 'bg-yellow-500' : 
                                        'bg-green-500'
                                    }`}></span>
                                </button>
                            </div>
                         )
                    })}
                </div>
                
                <div className="pt-3 border-t">
                    {isAddingTask ? (
                        <form onSubmit={handleAddTask} className="space-y-2 animate-slide-in-from-right">
                            <input 
                                type="text" 
                                placeholder="What needs to be done?" 
                                value={newTaskTitle}
                                onChange={e => setNewTaskTitle(e.target.value)}
                                className="input-field-xs w-full py-2 bg-gray-50 border-gray-200 font-medium"
                                autoFocus
                            />
                            <div className="flex space-x-2">
                                <input 
                                    type="time" 
                                    value={newTaskTime}
                                    onChange={e => setNewTaskTime(e.target.value)}
                                    className="input-field-xs flex-grow py-2 bg-gray-50 border-gray-200"
                                />
                                <button type="button" onClick={() => setIsAddingTask(false)} className="btn-secondary-xs px-4">Cancel</button>
                                <button type="submit" className="btn-primary-xs px-6 bg-blue-600 font-black uppercase tracking-widest">Add</button>
                            </div>
                        </form>
                    ) : (
                        <button onClick={() => setIsAddingTask(true)} className="group w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 text-[10px] font-black uppercase tracking-widest transition-all">
                            + Quick Add Task
                        </button>
                    )}
                </div>
            </div>
          </DashboardWidget>
        </div>
      </div>
    </div>
  );
};

const KpiCard: React.FC<{ title: string; value: string; icon: string; color: string; onClick?: () => void }> = ({ title, value, icon, color, onClick }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100 text-blue-800 hover:bg-blue-100',
    green: 'bg-green-50 border-green-100 text-green-800 hover:bg-green-100',
    yellow: 'bg-yellow-50 border-yellow-100 text-yellow-800 hover:bg-yellow-100',
    purple: 'bg-purple-50 border-purple-100 text-purple-800 hover:bg-purple-100',
  };
  const cursorClass = onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-95' : '';

  return (
    <div className={`p-5 rounded-2xl border shadow-sm transition-all duration-300 ${colors[color]} ${cursorClass}`} onClick={onClick}>
      <div className="flex justify-between items-start">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{title}</p>
        <div className="text-2xl drop-shadow-sm">{icon}</div>
      </div>
      <p className="text-3xl font-black mt-2 tracking-tight">{value}</p>
    </div>
  );
};

const DashboardWidget: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white p-5 rounded-2xl shadow-xl border border-gray-100 h-full flex flex-col">
    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center">
      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
      {title}
    </h3>
    <div className="flex-grow overflow-hidden">
        {children}
    </div>
  </div>
);

export default Dashboard;
