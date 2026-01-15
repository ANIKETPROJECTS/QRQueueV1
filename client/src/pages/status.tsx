import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Users, Clock, XCircle, Loader2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { QueueEntry } from "@shared/schema";
import bgImageStatus from "@assets/image_1768484128273.png";
import logoCafe from "@assets/logo_cafe_1768483716128.png";

export default function Status() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: entry, isLoading: entryLoading } = useQuery<QueueEntry>({
    queryKey: ["/api/queue", id],
    enabled: !!id,
    refetchInterval: 5000,
  });

  const { data: position, isLoading: positionLoading } = useQuery<{
    position: number;
    totalWaiting: number;
  }>({
    queryKey: ["/api/queue", id, "position"],
    enabled: !!id && entry?.status === "waiting",
    refetchInterval: 5000,
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/queue/${id}/cancel`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/queue", id] });
      toast({
        title: "Queue cancelled",
        description: "Your spot has been removed from the queue",
      });
    },
    onError: () => {
      toast({
        title: "Failed to cancel",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const isLoading = entryLoading || positionLoading;

  if (isLoading) {
    return (
      <div 
        className="min-h-screen flex flex-col relative overflow-hidden" 
        data-testid="page-status-loading"
        style={{
          backgroundImage: `url(${bgImageStatus})`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <header className="py-6 px-4 relative z-10" data-testid="header">
          <div className="max-w-fit mx-auto bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/10 shadow-lg overflow-hidden">
            <img src={logoCafe} alt="Logo" className="w-48 h-auto" />
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center relative z-10">
          <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl">
            <Loader2 className="w-8 h-8 animate-spin text-white" data-testid="icon-loading" />
          </div>
        </main>
      </div>
    );
  }

  if (!entry) {
    return (
      <div 
        className="min-h-screen flex flex-col relative overflow-hidden" 
        data-testid="page-status-not-found"
        style={{
          backgroundImage: `url(${bgImageStatus})`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <header className="py-6 px-4 relative z-10" data-testid="header">
          <div className="max-w-fit mx-auto bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/10 shadow-lg overflow-hidden">
            <img src={logoCafe} alt="Logo" className="w-48 h-auto" />
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4 relative z-10">
          <Card className="w-full max-w-md text-center bg-card/90 backdrop-blur-md border-white/20 shadow-2xl" data-testid="card-not-found">
            <CardContent className="pt-6">
              <XCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" data-testid="icon-not-found" />
              <h2 className="text-lg font-semibold mb-2" data-testid="text-not-found-title">Entry Not Found</h2>
              <p className="text-muted-foreground mb-4" data-testid="text-not-found-desc">
                This queue entry doesn't exist or has been removed.
              </p>
              <Button onClick={() => setLocation("/")} data-testid="button-go-home" className="bg-[#8B4513] hover:bg-[#A0522D] text-white">
                Join Queue
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const isCancelled = entry.status === "cancelled";
  const isCalled = entry.status === "called";

  return (
    <div 
      className="min-h-screen flex flex-col relative overflow-hidden" 
      data-testid="page-status"
      style={{
        backgroundImage: `url(${bgImageStatus})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <header className="py-6 px-4 relative z-10" data-testid="header">
        <motion.div 
          className="max-w-fit mx-auto flex items-center justify-center bg-black/40 backdrop-blur-md p-1 px-1 rounded-full border border-white/10 shadow-lg overflow-hidden"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.img
            src={logoCafe}
            alt="Cafe made in 2020 Logo"
            className="w-48 h-auto"
            animate={{ 
              scale: [1, 1.05, 1.05, 1]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
          />
        </motion.div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            duration: 0.8, 
            delay: 0.2,
            ease: [0.16, 1, 0.3, 1] 
          }}
        >
          <Card 
            className={`backdrop-blur-md border-white/20 shadow-2xl transition-all duration-500 ${
              isCalled ? "bg-green-600/90 ring-4 ring-green-400 ring-offset-4 ring-offset-transparent" : "bg-card/90"
            }`} 
            data-testid="card-status"
          >
            <CardHeader className="text-center">
              {isCancelled ? (
                <>
                  <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-destructive/10 flex items-center justify-center" data-testid="icon-cancelled-container">
                    <XCircle className="w-10 h-10 text-destructive" data-testid="icon-cancelled" />
                  </div>
                  <CardTitle className="text-xl" data-testid="text-title-cancelled">Queue Cancelled</CardTitle>
                  <CardDescription data-testid="text-desc-cancelled">
                    Your spot has been removed from the queue
                  </CardDescription>
                </>
              ) : isCalled ? (
                <>
                  <motion.div 
                    className="w-24 h-24 mx-auto mb-4 rounded-full bg-white flex items-center justify-center shadow-xl" 
                    data-testid="called-container"
                    animate={{ 
                      scale: [1, 1.15, 1],
                      boxShadow: ["0px 0px 0px rgba(255,255,255,0.5)", "0px 0px 30px rgba(255,255,255,0.8)", "0px 0px 0px rgba(255,255,255,0.5)"]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <CheckCircle className="w-14 h-14 text-green-600" data-testid="icon-called" />
                  </motion.div>
                  <CardTitle className="text-3xl text-white font-black mb-2 drop-shadow-lg" data-testid="text-title-called">Your Seat is Ready!</CardTitle>
                  <CardDescription className="text-white text-lg font-medium drop-shadow-md" data-testid="text-desc-called">
                    Please head to the counter now. We're waiting for you!
                  </CardDescription>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-[#8B4513]/10 flex items-center justify-center" data-testid="position-container">
                    <span className="text-3xl font-bold text-[#8B4513]" data-testid="text-position">
                      #{position?.position || "-"}
                    </span>
                  </div>
                  <CardTitle className="text-xl" data-testid="text-title-waiting">You're in the Queue!</CardTitle>
                  <CardDescription data-testid="text-desc-waiting">
                    {position && position.position <= 3
                      ? "Get ready! Your table will be available soon"
                      : "Please wait for your turn"}
                  </CardDescription>
                </>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`rounded-lg p-4 space-y-3 transition-colors ${
                isCalled ? "bg-white/30" : "bg-muted/50"
              }`} data-testid="info-container">
                <div className="flex items-center gap-3" data-testid="info-party-size">
                  <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center">
                    <Users className={`w-4 h-4 ${isCalled ? "text-green-600" : "text-[#8B4513]"}`} />
                  </div>
                  <div>
                    <p className={`text-sm ${isCalled ? "text-white/90" : "text-muted-foreground"}`}>Party Size</p>
                    <p className={`font-bold ${isCalled ? "text-white text-lg" : ""}`} data-testid="text-party-size">
                      {entry.numberOfPeople} {entry.numberOfPeople === 1 ? "person" : "people"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3" data-testid="info-status">
                  <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center">
                    <Clock className={`w-4 h-4 ${isCalled ? "text-green-600" : "text-[#8B4513]"}`} />
                  </div>
                  <div>
                    <p className={`text-sm ${isCalled ? "text-white/90" : "text-muted-foreground"}`}>Status</p>
                    <p className={`font-bold capitalize flex items-center gap-2 ${isCalled ? "text-white text-lg" : ""}`} data-testid="text-status">
                      {isCancelled ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-destructive" data-testid="status-indicator-cancelled" />
                          Cancelled
                        </>
                      ) : isCalled ? (
                        <>
                          <span className="w-3 h-3 rounded-full bg-white animate-ping" data-testid="status-indicator-called" />
                          Now Serving!
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" data-testid="status-indicator-waiting" />
                          Waiting
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {!isCancelled && !isCalled ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full"
                      data-testid="button-cancel-queue"
                    >
                      Cancel My Spot
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent data-testid="dialog-cancel" className="bg-card/95 backdrop-blur-md border-white/20">
                    <AlertDialogHeader>
                      <AlertDialogTitle data-testid="dialog-title">Cancel Queue?</AlertDialogTitle>
                      <AlertDialogDescription data-testid="dialog-description">
                        Are you sure you want to leave the queue? You'll lose your current position.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-testid="button-cancel-no">No, keep my spot</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => cancelMutation.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        data-testid="button-cancel-yes"
                      >
                        {cancelMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Yes, cancel"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : isCalled ? (
                <div className="pt-2">
                  <p className="text-white text-center text-sm font-bold animate-bounce">
                    Welcome to Cafe made in 2020!
                  </p>
                </div>
              ) : (
                <Button
                  onClick={() => setLocation("/")}
                  className="w-full bg-[#8B4513] hover:bg-[#A0522D] text-white"
                  data-testid="button-rejoin"
                >
                  Join Queue Again
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <footer className="py-8 px-4 text-center text-sm relative z-10 h-20 flex items-center justify-center" data-testid="footer">
        <div className="bg-black/40 backdrop-blur-md p-3 px-6 rounded-full border border-white/10 shadow-lg">
          <p data-testid="text-footer" className="min-h-[1.25rem] text-white font-medium drop-shadow-sm">
            Thank you for visiting Cafe made in 2020
          </p>
        </div>
      </footer>
    </div>
  );
}
