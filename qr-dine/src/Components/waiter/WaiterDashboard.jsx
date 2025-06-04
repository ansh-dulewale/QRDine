import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';
import toast, { Toaster } from 'react-hot-toast';
import { Search, RefreshCw, Clock, TrendingUp, Award, Zap } from 'lucide-react';
import WaiterSidebar from './WaiterSidebar.jsx';
import WaiterOrdersList from './WaiterOrdersList';
import WaiterProfile from './WaiterProfile.jsx';

function getInitialHistory() {
  return JSON.parse(localStorage.getItem('waiterHistory') || '[]');
}
function saveHistory(history) {
  localStorage.setItem('waiterHistory', JSON.stringify(history));
}
const WAITER_PROFILE = {
  name: 'Amit Kumar',
  id: 'W123',
  phone: '+91-9876543210',
  joined: '2023-08-15',
  avatar: '🧑‍🍳',
};
async function fetchReadyOrders() {
  await new Promise(resolve => setTimeout(resolve, 800));
  const orders = [
    {
      id: 201,
      table: 5,
      items: [
        { name: 'Paneer Butter Masala', qty: 2 },
        { name: 'Butter Naan', qty: 4 }
      ],
      notes: 'No onion',
      chef: 'Chef Arjun',
      readyAt: Date.now() - 1000 * 60 * 3,
      status: 'ready',
      assignedTo: null,
      priority: 'high',
      estimatedDeliveryTime: 5
    },
    {
      id: 202,
      table: 2,
      items: [
        { name: 'Chicken Biryani', qty: 1 }
      ],
      notes: '',
      chef: 'Chef Priya',
      readyAt: Date.now() - 1000 * 60 * 7,
      status: 'ready',
      assignedTo: null,
      priority: 'medium',
      estimatedDeliveryTime: 3
    },
    {
      id: 203,
      table: 8,
      items: [
        { name: 'Masala Dosa', qty: 2 },
        { name: 'Filter Coffee', qty: 2 }
      ],
      notes: 'Extra sambar',
      chef: 'Chef Ravi',
      readyAt: Date.now() - 1000 * 60 * 1,
      status: 'ready',
      assignedTo: null,
      priority: 'low',
      estimatedDeliveryTime: 2
    }
  ];
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  return orders.sort((a, b) => {
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return b.readyAt - a.readyAt;
  });
}

export default function WaiterDashboard() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [assigned, setAssigned] = useState([]);
  const [view, setView] = useState('orders');
  const [history, setHistory] = useState(getInitialHistory());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    assignedOrders: 0,
    completedToday: 0,
    avgDeliveryTime: 0
  });
  const refreshIntervalRef = useRef(null);
  const audioRef = useRef(null);

  // Animation springs
  const headerSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(-20px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: { tension: 280, friction: 60 }
  });
  const statsSpring = useSpring({
    from: { scale: 0.8, opacity: 0 },
    to: { scale: 1, opacity: 1 },
    delay: 200,
    config: { tension: 300, friction: 25 }
  });

  // Fetch orders with loading state
  const fetchOrders = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const newOrders = await fetchReadyOrders();
      setOrders(newOrders);
      setStats(prev => ({
        ...prev,
        totalOrders: newOrders.length,
        assignedOrders: assigned.length
      }));
      if (orders.length > 0 && newOrders.length > orders.length) {
        const newOrdersCount = newOrders.length - orders.length;
        toast.success(`🔔 ${newOrdersCount} new order${newOrdersCount > 1 ? 's' : ''} ready!`, {
          duration: 4000,
          icon: '🍽️'
        });
        if (audioRef.current) {
          audioRef.current.play().catch(() => {});
        }
      }
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  }, [orders.length, assigned.length]);

  // Auto-refresh orders
  useEffect(() => {
    fetchOrders();
    refreshIntervalRef.current = setInterval(() => {
      fetchOrders(false);
    }, 30000);
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchOrders]);

  useEffect(() => {
    saveHistory(history);
    setStats(prev => ({
      ...prev,
      completedToday: history.filter(order => {
        const today = new Date().toDateString();
        return new Date(order.servedAt).toDateString() === today;
      }).length
    }));
  }, [history]);

  function handleAssign(orderId) {
    setAssigned(ids => [...ids, orderId]);
    toast.success(`🎯 Order #${orderId} assigned to you!`, {
      duration: 3000,
      icon: '✅'
    });
    setStats(prev => ({
      ...prev,
      assignedOrders: prev.assignedOrders + 1
    }));
  }

  function handleServe(orderId) {
    const order = orders.find(o => o.id === orderId);
    setOrders(orders => orders.filter(o => o.id !== orderId));
    setAssigned(ids => ids.filter(id => id !== orderId));
    const servedOrder = {
      ...order,
      servedAt: Date.now(),
      waiter: WAITER_PROFILE.name,
      deliveryTime: Math.floor((Date.now() - order.readyAt) / 60000)
    };
    setHistory(hist => [servedOrder, ...hist]);
    toast.success(`🎉 Order #${orderId} served successfully!`, {
      duration: 4000,
      icon: '🍽️'
    });
    setStats(prev => ({
      ...prev,
      assignedOrders: Math.max(0, prev.assignedOrders - 1),
      completedToday: prev.completedToday + 1,
      avgDeliveryTime: Math.round((prev.avgDeliveryTime * (prev.completedToday) + servedOrder.deliveryTime) / (prev.completedToday + 1))
    }));
  }

  const filtered = orders.filter(o =>
    o.id.toString().includes(search) || o.table.toString().includes(search)
  );

  // --- Stats Bar ---
  function StatsBar() {
    return (
      <animated.div
        className="flex gap-8 my-4.5 mb-7 bg-gradient-to-r from-amber-300 to-warm-300 rounded-2xl shadow-[0_2px_8px_#ffe0b2] p-4.5 justify-center items-center text-orange-600 font-bold text-lg animate-statsGlow md:p-2.5 md:gap-2.5 md:text-base"
        style={statsSpring}
      >
        <div className="flex items-center gap-1.5 bg-warm-100 rounded-lg p-1.5 px-3.5 shadow-[0_1px_4px_#ffe0b2] text-orange-500 text-base transition-shadow duration-200">
          <Clock size={18} /> <b className="text-orange-600 text-lg">{stats.totalOrders}</b> Orders
        </div>
        <div className="flex items-center gap-1.5 bg-warm-100 rounded-lg p-1.5 px-3.5 shadow-[0_1px_4px_#ffe0b2] text-orange-500 text-base transition-shadow duration-200">
          <Zap size={18} /> <b className="text-orange-600 text-lg">{stats.assignedOrders}</b> Assigned
        </div>
        <div className="flex items-center gap-1.5 bg-warm-100 rounded-lg p-1.5 px-3.5 shadow-[0_1px_4px_#ffe0b2] text-orange-500 text-base transition-shadow duration-200">
          <Award size={18} /> <b className="text-orange-600 text-lg">{stats.completedToday}</b> Served Today
        </div>
        <div className="flex items-center gap-1.5 bg-warm-100 rounded-lg p-1.5 px-3.5 shadow-[0_1px_4px_#ffe0b2] text-orange-500 text-base transition-shadow duration-200">
          <TrendingUp size={18} /> <b className="text-orange-600 text-lg">{stats.avgDeliveryTime || 0} min</b> Avg Delivery
        </div>
      </animated.div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-r from-warm-300 to-warm-200 font-sans animate-waiterBgAnim">
      <Toaster position="top-right" />
      <WaiterSidebar view={view} setView={setView} />
      <main className="flex-1 p-9 flex flex-col min-w-0 bg-white/85 rounded-tl-[32px] rounded-bl-[32px] shadow-[0_8px_32px_rgba(255,152,0,0.10),0_2px_8px_rgba(60,60,120,0.10)] my-6 md:p-2.5 md:rounded-none md:m-0">
        <animated.div
          className="flex items-center justify-between mb-6 bg-gradient-to-r from-warm-300 to-warm-200 rounded-2xl shadow-[0_2px_8px_#ffe0b2] p-4.5 relative md:p-2.5 md:rounded-xl"
          style={headerSpring}>
          <h2 className="text-2xl font-extrabold text-orange-500">Waiter Dashboard</h2>
          <div className="flex items-center gap-4.5">
            <button
              className="bg-gradient-to-r from-orange-500 to-amber-300 text-white border-none rounded-[10px] font-bold text-base py-2 px-4.5 flex items-center gap-2 shadow-[0_2px_8px_rgba(255,152,0,0.10)] transition-all duration-200 active:brightness-95 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              onClick={() => fetchOrders(true)}
              disabled={refreshing}
              title="Refresh"
            >
              <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} /> {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <div className="flex items-center bg-warm-100 rounded-lg shadow-[0_1px_4px_#ffe0b2] p-1 px-2.5 gap-1.5">
              <Search size={18} />
              <input
                className="border-none bg-transparent text-orange-600 font-semibold text-base outline-none py-1.5 min-w-[120px]"
                placeholder="Search by table or order ID"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </animated.div>
        <StatsBar />
        <AnimatePresence>
          {view === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              {loading ? (
                <div className="text-center text-orange-500 font-bold text-xl mt-12 animate-pulseText">
                  Loading orders...
                </div>
              ) : (
                <WaiterOrdersList
                  orders={filtered}
                  assigned={assigned}
                  onAssign={handleAssign}
                  onServe={handleServe}
                  isHistory={false}
                />
              )}
            </motion.div>
          )}
          {view === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <WaiterOrdersList
                orders={history}
                assigned={[]}
                onAssign={() => {}}
                onServe={() => {}}
                isHistory={true}
                waiterName={WAITER_PROFILE.name}
              />
            </motion.div>
          )}
          {view === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <WaiterProfile profile={WAITER_PROFILE} ordersServed={history.length} />
            </motion.div>
          )}
        </AnimatePresence>
        <audio ref={audioRef} src="/notification.mp3" preload="auto" style={{ display: 'none' }} />
      </main>
    </div>
  );
}