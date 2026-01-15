import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Coffee, Users, Clock, XCircle, Loader2, CheckCircle } from "lucide-react";

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
      <div className="min-h-screen bg-background flex flex-col" data-testid="page-status-loading">
        <header className="py-6 px-4 border-b bg-card" data-testid="header">
          <div className="max-w-md mx-auto flex items-center justify-center gap-3">
            <Coffee className="w-8 h-8 text-primary" data-testid="icon-logo" />
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-brand">Cafe 2020</h1>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" data-testid="icon-loading" />
        </main>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-background flex flex-col" data-testid="page-status-not-found">
        <header className="py-6 px-4 border-b bg-card" data-testid="header">
          <div className="max-w-md mx-auto flex items-center justify-center gap-3">
            <Coffee className="w-8 h-8 text-primary" data-testid="icon-logo" />
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-brand">Cafe 2020</h1>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center" data-testid="card-not-found">
            <CardContent className="pt-6">
              <XCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" data-testid="icon-not-found" />
              <h2 className="text-lg font-semibold mb-2" data-testid="text-not-found-title">Entry Not Found</h2>
              <p className="text-muted-foreground mb-4" data-testid="text-not-found-desc">
                This queue entry doesn't exist or has been removed.
              </p>
              <Button onClick={() => setLocation("/")} data-testid="button-go-home">
                Join Queue
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const isCancelled = entry.status === "cancelled";

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="page-status">
      <header className="py-6 px-4 border-b bg-card" data-testid="header">
        <div className="max-w-md mx-auto flex items-center justify-center gap-3">
          <Coffee className="w-8 h-8 text-primary" data-testid="icon-logo" />
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-brand">Cafe 2020</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md" data-testid="card-status">
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
            ) : (
              <>
                <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center" data-testid="position-container">
                  <span className="text-3xl font-bold text-primary" data-testid="text-position">
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
            <div className="bg-muted/50 rounded-lg p-4 space-y-3" data-testid="info-container">
              <div className="flex items-center gap-3" data-testid="info-party-size">
                <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Party Size</p>
                  <p className="font-medium" data-testid="text-party-size">
                    {entry.numberOfPeople} {entry.numberOfPeople === 1 ? "person" : "people"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3" data-testid="info-status">
                <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium capitalize flex items-center gap-2" data-testid="text-status">
                    {isCancelled ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-destructive" data-testid="status-indicator-cancelled" />
                        Cancelled
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
              {!isCancelled && position && (
                <div className="flex items-center gap-3" data-testid="info-ahead">
                  <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">People Ahead</p>
                    <p className="font-medium" data-testid="text-ahead">
                      {position.position - 1} {position.position - 1 === 1 ? "person" : "people"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {!isCancelled ? (
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
                <AlertDialogContent data-testid="dialog-cancel">
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
                      className="bg-destructive text-destructive-foreground"
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
            ) : (
              <Button
                onClick={() => setLocation("/")}
                className="w-full"
                data-testid="button-rejoin"
              >
                Join Queue Again
              </Button>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="py-4 px-4 text-center text-sm text-muted-foreground border-t" data-testid="footer">
        <p data-testid="text-footer">Thank you for visiting Cafe 2020</p>
      </footer>
    </div>
  );
}
