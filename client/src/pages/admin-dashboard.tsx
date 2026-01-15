import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Clock, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import type { QueueEntry } from "@shared/schema";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (localStorage.getItem("adminAuth") !== "true") {
      setLocation("/adminlogin");
    }
  }, [setLocation]);

  const { data: entries, isLoading } = useQuery<QueueEntry[]>({
    queryKey: ["/api/admin/entries"],
    refetchInterval: 5000,
  });

  const { data: stats } = useQuery<{ totalCustomers: number; totalVisits: number }>({
    queryKey: ["/api/admin/stats"],
    refetchInterval: 10000,
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-[#8B4513]">Admin Dashboard</h1>
          <Button variant="outline" onClick={() => {
            localStorage.removeItem("adminAuth");
            setLocation("/adminlogin");
          }}>Logout</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Queue</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{waitingEntries.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalCustomers || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalVisits || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              Waiting <Badge variant="secondary">{waitingEntries.length}</Badge>
            </h2>
            <div className="space-y-3">
              {waitingEntries.map((entry) => (
                <motion.div key={entry._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card>
                    <CardContent className="p-4 flex justify-between items-center">
                      <div>
                        <div className="font-bold">{entry.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {entry.numberOfPeople} people • {entry.phoneNumber}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => callMutation.mutate(entry._id!)} 
                          size="sm" 
                          className="bg-[#8B4513]"
                        >
                          Call Now
                        </Button>
                        <Button 
                          onClick={() => cancelMutation.mutate(entry._id!)} 
                          variant="destructive" 
                          size="icon"
                          className="h-9 w-9"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              Called <Badge variant="secondary">{calledEntries.length}</Badge>
            </h2>
            <div className="space-y-3">
              {calledEntries.map((entry) => (
                <motion.div key={entry._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card className="border-orange-200 bg-orange-50/50">
                    <CardContent className="p-4 flex justify-between items-center">
                      <div>
                        <div className="font-bold">{entry.name}</div>
                        <div className="text-sm text-orange-600 font-medium">
                          Wait for customer...
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => completeMutation.mutate(entry._id!)} 
                          size="icon" 
                          className="bg-green-600 h-8 w-8"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button 
                          onClick={() => cancelMutation.mutate(entry._id!)} 
                          variant="destructive" 
                          size="icon"
                          className="h-8 w-8"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
