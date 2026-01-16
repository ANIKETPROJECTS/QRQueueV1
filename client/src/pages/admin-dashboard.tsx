import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserCheck, Clock, CheckCircle, XCircle, BarChart3, List } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import type { QueueEntry } from "@shared/schema";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"queue" | "analytics" | "customers">("queue");
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");

  useEffect(() => {
    if (localStorage.getItem("adminAuth") !== "true") {
      setLocation("/adminlogin");
    }
  }, [setLocation]);

  const { data: entries } = useQuery<QueueEntry[]>({
    queryKey: ["/api/admin/entries"],
    refetchInterval: 2000,
  });

  const { data: stats } = useQuery<{ totalCustomers: number; totalVisits: number }>({
    queryKey: ["/api/admin/stats"],
    refetchInterval: 2000,
  });

  const { data: analytics } = useQuery<any[]>({
    queryKey: ["/api/admin/analytics", period],
    enabled: activeTab === "analytics",
  });

  const callMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/admin/call/${id}`, { method: "POST" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/entries"] }),
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/admin/complete/${id}`, { method: "POST" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/entries"] }),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/queue/${id}/cancel`, { method: "PATCH" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/entries"] }),
  });

  const waitingEntries = entries?.filter(e => e.status === "waiting") || [];
  const calledEntries = entries?.filter(e => e.status === "called") || [];
  
  const customerStats = entries ? Object.values(entries.reduce((acc: any, curr) => {
    if (!acc[curr.phoneNumber]) {
      acc[curr.phoneNumber] = {
        name: curr.name,
        phoneNumber: curr.phoneNumber,
        visitCount: curr.visitCount || 1,
        lastVisited: curr.createdAt
      };
    } else {
      // Find the record with the highest visit count or most recent
      if ((curr.visitCount || 1) > acc[curr.phoneNumber].visitCount) {
        acc[curr.phoneNumber].visitCount = curr.visitCount || 1;
      }
      if (new Date(curr.createdAt) > new Date(acc[curr.phoneNumber].lastVisited)) {
        acc[curr.phoneNumber].lastVisited = curr.createdAt;
      }
    }
    return acc;
  }, {})).sort((a: any, b: any) => b.visitCount - a.visitCount) : [];

  return (
    <div className="min-h-screen bg-[#FDFBF9] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-[#4A2C2A] tracking-tight">Dashboard</h1>
            <p className="text-[#8C7A78] mt-1">Manage your queue and track performance</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-xl border p-1 shadow-sm flex items-center">
              <Button 
                variant={activeTab === "queue" ? "default" : "ghost"}
                size="sm"
                className={`rounded-lg ${activeTab === "queue" ? "bg-[#8B4513]" : ""}`}
                onClick={() => setActiveTab("queue")}
              >
                <List className="h-4 w-4 mr-2" />
                Live Queue
              </Button>
              <Button 
                variant={activeTab === "analytics" ? "default" : "ghost"}
                size="sm"
                className={`rounded-lg ${activeTab === "analytics" ? "bg-[#8B4513]" : ""}`}
                onClick={() => setActiveTab("analytics")}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button 
                variant={activeTab === "customers" ? "default" : "ghost"}
                size="sm"
                className={`rounded-lg ${activeTab === "customers" ? "bg-[#8B4513]" : ""}`}
                onClick={() => setActiveTab("customers")}
              >
                <Users className="h-4 w-4 mr-2" />
                Customers
              </Button>
            </div>
            <Button variant="outline" className="rounded-xl border-[#D7CCC8]" onClick={() => {
              localStorage.removeItem("adminAuth");
              setLocation("/adminlogin");
            }}>Logout</Button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden">
            <div className="h-1 bg-[#8B4513]" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-[#8C7A78]">In Queue</CardTitle>
              <Users className="h-5 w-5 text-[#8B4513]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#4A2C2A]">{waitingEntries.length}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden">
            <div className="h-1 bg-green-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-[#8C7A78]">Active Now</CardTitle>
              <UserCheck className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#4A2C2A]">{calledEntries.length}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden">
            <div className="h-1 bg-blue-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-[#8C7A78]">Total Users</CardTitle>
              <Users className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#4A2C2A]">{stats?.totalCustomers || 0}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden">
            <div className="h-1 bg-purple-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-[#8C7A78]">Total Visits</CardTitle>
              <Clock className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#4A2C2A]">{stats?.totalVisits || 0}</div>
            </CardContent>
          </Card>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "queue" ? (
            <motion.div 
              key="queue"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-[#4A2C2A] flex items-center gap-3">
                    Waiting List
                    <Badge className="bg-[#8B4513] hover:bg-[#8B4513] text-white border-none px-3 py-1 rounded-full">
                      {waitingEntries.length}
                    </Badge>
                  </h2>
                </div>
                <div className="space-y-4">
                  {waitingEntries.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-[#D7CCC8]">
                      <Users className="h-12 w-12 text-[#D7CCC8] mx-auto mb-4" />
                      <p className="text-[#8C7A78]">No one is waiting in line</p>
                    </div>
                  )}
                  {waitingEntries.map((entry) => (
                    <motion.div key={entry._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Card className="rounded-2xl border-none shadow-sm bg-white group hover:shadow-md transition-all duration-300">
                        <CardContent className="p-5 flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-[#F5F1EE] flex items-center justify-center text-[#8B4513] font-bold text-lg">
                              {entry.position}
                            </div>
                            <div>
                              <div className="font-bold text-lg text-[#4A2C2A]">{entry.name}</div>
                              <div className="text-sm text-[#8C7A78] flex items-center gap-2">
                                <Users className="h-3 w-3" /> {entry.numberOfPeople} people • {entry.phoneNumber}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => callMutation.mutate(entry._id!)} 
                              size="default" 
                              className="bg-[#8B4513] hover:bg-[#6D360F] text-white rounded-xl px-6"
                            >
                              Call Now
                            </Button>
                            <Button 
                              onClick={() => cancelMutation.mutate(entry._id!)} 
                              variant="ghost" 
                              size="icon"
                              className="h-10 w-10 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                            >
                              <XCircle className="h-5 w-5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-[#4A2C2A] flex items-center gap-3">
                  Currently Called
                  <Badge className="bg-green-500 hover:bg-green-500 text-white border-none px-3 py-1 rounded-full">
                    {calledEntries.length}
                  </Badge>
                </h2>
                <div className="space-y-4">
                  {calledEntries.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-[#D7CCC8]">
                      <UserCheck className="h-12 w-12 text-[#D7CCC8] mx-auto mb-4" />
                      <p className="text-[#8C7A78]">No one has been called yet</p>
                    </div>
                  )}
                  {calledEntries.map((entry) => (
                    <motion.div key={entry._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Card className="rounded-2xl border-2 border-green-100 bg-green-50/30 shadow-sm overflow-hidden">
                        <CardContent className="p-5 flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600 font-bold text-lg">
                              <Clock className="h-6 w-6 animate-pulse" />
                            </div>
                            <div>
                              <div className="font-bold text-lg text-[#4A2C2A]">{entry.name}</div>
                              <div className="text-sm text-green-600 font-semibold flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                Processing...
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => completeMutation.mutate(entry._id!)} 
                              size="icon" 
                              className="bg-green-600 hover:bg-green-700 text-white h-10 w-10 rounded-xl"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </Button>
                            <Button 
                              onClick={() => cancelMutation.mutate(entry._id!)} 
                              variant="ghost" 
                              size="icon"
                              className="h-10 w-10 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                            >
                              <XCircle className="h-5 w-5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div 
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-[#4A2C2A]">Traffic Analytics</h2>
                <div className="flex bg-white border rounded-xl p-1 shadow-sm">
                  <Button 
                    variant={period === "day" ? "secondary" : "ghost"} 
                    size="sm" 
                    onClick={() => setPeriod("day")}
                    className="rounded-lg"
                  >Today</Button>
                  <Button 
                    variant={period === "week" ? "secondary" : "ghost"} 
                    size="sm" 
                    onClick={() => setPeriod("week")}
                    className="rounded-lg"
                  >Week</Button>
                  <Button 
                    variant={period === "month" ? "secondary" : "ghost"} 
                    size="sm" 
                    onClick={() => setPeriod("month")}
                    className="rounded-lg"
                  >Month</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="rounded-3xl border-none shadow-sm bg-white p-6">
                  <h3 className="text-lg font-bold text-[#4A2C2A] mb-6">Customer Volume</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#8C7A78', fontSize: 12}}
                          dy={10}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#8C7A78', fontSize: 12}} />
                        <Tooltip 
                          cursor={{fill: '#F9F7F5'}}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="total" name="Total" fill="#8B4513" radius={[6, 6, 0, 0]} barSize={40} />
                        <Bar dataKey="accepted" name="Accepted" fill="#22c55e" radius={[6, 6, 0, 0]} barSize={40} />
                        <Bar dataKey="cancelled" name="Cancelled" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="rounded-3xl border-none shadow-sm bg-white p-6">
                  <h3 className="text-lg font-bold text-[#4A2C2A] mb-6">Average Queue Wait Time (mins)</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#8C7A78', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#8C7A78', fontSize: 12}} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Line type="monotone" dataKey="avgWaitTime" name="Avg Wait (min)" stroke="#8B4513" strokeWidth={3} dot={{r: 4, fill: '#8B4513', strokeWidth: 2}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-bold text-[#4A2C2A]">Daily Data Table</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#F9F7F5] text-[#8C7A78] text-sm uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Total</th>
                        <th className="px-6 py-4">Accepted</th>
                        <th className="px-6 py-4">Cancelled</th>
                        <th className="px-6 py-4">Avg Wait</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F0F0]">
                      {analytics?.map((day) => (
                        <tr key={day.date} className="hover:bg-[#FDFBF9] transition-colors">
                          <td className="px-6 py-4 font-medium text-[#4A2C2A]">{day.date}</td>
                          <td className="px-6 py-4 text-[#4A2C2A]">{day.total}</td>
                          <td className="px-6 py-4 text-green-600 font-medium">{day.accepted}</td>
                          <td className="px-6 py-4 text-red-500 font-medium">{day.cancelled}</td>
                          <td className="px-6 py-4 text-[#8B4513]">{day.avgWaitTime}m</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
