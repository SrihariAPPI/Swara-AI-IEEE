import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckSquare, X, Plus, Trash2, Check } from 'lucide-react';
import { auth } from '../lib/firebase';
import { deleteDoc, doc, setDoc, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

interface TaskManagerProps {
  onClose: () => void;
}

export default function TaskManager({ onClose }: TaskManagerProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");

  // Load Tasks
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }

      if (user) {
        const q = query(collection(db, `users/${user.uid}/tasks`), orderBy("createdAt", "desc"));
        unsubscribe = onSnapshot(q, (snapshot) => {
          const loadedTasks: Task[] = [];
          snapshot.forEach((doc) => loadedTasks.push(doc.data() as Task));
          setTasks(loadedTasks);
        }, (error) => {
          console.error("Task loading error:", error);
        });
      } else {
        const saved = localStorage.getItem("swara_tasks");
        if (saved) {
          try {
            setTasks(JSON.parse(saved));
          } catch (e) {
            console.error("Failed to parse tasks", e);
          }
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Save Tasks (Local)
  useEffect(() => {
    if (!auth.currentUser) {
      localStorage.setItem("swara_tasks", JSON.stringify(tasks));
    }
  }, [tasks]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    const task: Task = {
      id: Date.now().toString(),
      text: newTask.trim(),
      completed: false,
      createdAt: Date.now(),
    };

    if (auth.currentUser) {
      await setDoc(doc(db, `users/${auth.currentUser.uid}/tasks`, task.id), task);
    } else {
      setTasks([task, ...tasks]);
    }
    setNewTask("");
  };

  const toggleTask = async (task: Task) => {
    const updatedTask = { ...task, completed: !task.completed };
    
    if (auth.currentUser) {
      await setDoc(doc(db, `users/${auth.currentUser.uid}/tasks`, task.id), updatedTask);
    } else {
      setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
    }
  };

  const deleteTask = async (id: string) => {
    if (auth.currentUser) {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/tasks`, id));
    } else {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md glass border-marigold/30 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
          <h2 className="text-xl font-cute font-bold text-marigold flex items-center gap-2">
            <CheckSquare size={20} />
            My Tasks
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <X size={20} className="text-cream" />
          </button>
        </div>

        <div className="p-4 bg-black/20 border-b border-white/10">
          <form onSubmit={handleAddTask} className="flex gap-2">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="What needs to be done?"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-cream placeholder:text-cream/50 outline-none focus:border-marigold/50 transition-colors"
            />
            <button
              type="submit"
              disabled={!newTask.trim()}
              className="p-2 px-4 rounded-xl font-bold tracking-wide transition-all shadow-lg bg-gradient-to-r from-marigold to-terracotta text-peacock hover:shadow-marigold/20 disabled:opacity-50 disabled:grayscale flex items-center justify-center"
            >
              <Plus size={20} />
            </button>
          </form>
        </div>

        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2">
          <AnimatePresence mode="popLayout">
            {tasks.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-center py-8 opacity-50 text-sm"
              >
                No tasks yet. Add one above!
              </motion.div>
            ) : (
              tasks.map((task) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  key={task.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    task.completed ? "bg-white/5 border-white/5" : "bg-white/10 border-white/10 hover:border-marigold/30"
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <button
                      onClick={() => toggleTask(task)}
                      className={`relative shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors overflow-hidden ${
                        task.completed ? "border-green-400/80 bg-green-400/20" : "border-cream/30 hover:border-marigold/50"
                      }`}
                    >
                      <AnimatePresence>
                        {task.completed && (
                          <motion.svg
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="w-4 h-4 text-green-400"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <motion.path
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 0.4, ease: "easeOut" }}
                              d="M20 6L9 17l-5-5"
                            />
                          </motion.svg>
                        )}
                      </AnimatePresence>
                    </button>
                    <span 
                      className={`text-sm truncate transition-all duration-300 ${
                        task.completed ? "line-through opacity-40" : "opacity-90"
                      }`}
                    >
                      {task.text}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 shrink-0 rounded-md hover:bg-red-500/20 hover:text-red-300 text-cream/40 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
