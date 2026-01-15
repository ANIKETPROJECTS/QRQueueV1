import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Coffee, Users, Phone, User, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { z } from "zod";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import bgImage from "@assets/image_1768481104099.png";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phoneNumber: z.string().min(10, "Please enter a valid phone number"),
  numberOfPeople: z.number().min(1).max(20),
});

type FormData = z.infer<typeof formSchema>;

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [footerText, setFooterText] = useState("");
  const fullText = "Thank you for visiting Cafe 2020";

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let charIndex = 0;
    let isDeleting = false;

    const animate = () => {
      if (!isDeleting) {
        setFooterText(fullText.substring(0, charIndex + 1));
        charIndex++;
        if (charIndex === fullText.length) {
          isDeleting = true;
          timeout = setTimeout(animate, 5000);
          return;
        }
      } else {
        setFooterText(fullText.substring(0, charIndex - 1));
        charIndex--;
        if (charIndex === 0) {
          isDeleting = false;
        }
      }
      timeout = setTimeout(animate, isDeleting ? 50 : 100);
    };

    animate();
    return () => clearTimeout(timeout);
  }, []);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
      numberOfPeople: 1,
    },
  });

  const joinQueue = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", api.queue.create.path, data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/queue"] });
      toast({
        title: "You're in the queue!",
        description: `Your position is #${data.position}`,
      });
      setLocation(`/status/${data._id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to join queue",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    joinQueue.mutate(data);
  };

  return (
    <div 
      className="min-h-screen flex flex-col relative" 
      data-testid="page-home"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <header className="py-6 px-4 border-b bg-card/20 backdrop-blur-md relative z-10" data-testid="header">
        <motion.div 
          className="max-w-md mx-auto flex items-center justify-center gap-3"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1.1, 1]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
          >
            <Coffee className="w-8 h-8 text-primary" data-testid="icon-logo" />
          </motion.div>
          <motion.h1 
            className="text-2xl font-bold text-foreground" 
            data-testid="text-brand"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Cafe 2020
          </motion.h1>
        </motion.div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <Card className="w-full max-w-md" data-testid="card-join-queue">
          <CardHeader className="text-center">
            <CardTitle className="text-xl" data-testid="text-title">Join the Queue</CardTitle>
            <CardDescription data-testid="text-description">
              Fill in your details to reserve your spot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" data-testid="form-join-queue">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem data-testid="field-name">
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Enter your name"
                            className="pl-10"
                            data-testid="input-name"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage data-testid="error-name" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem data-testid="field-phone">
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Enter your phone number"
                            className="pl-10"
                            type="tel"
                            data-testid="input-phone"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage data-testid="error-phone" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numberOfPeople"
                  render={({ field }) => (
                    <FormItem data-testid="field-people">
                      <FormLabel>Number of People</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                          <Select
                            value={String(field.value)}
                            onValueChange={(val) => field.onChange(Number(val))}
                          >
                            <SelectTrigger className="pl-10" data-testid="select-people">
                              <SelectValue placeholder="Select number of people" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                                <SelectItem key={num} value={String(num)} data-testid={`option-people-${num}`}>
                                  {num} {num === 1 ? "person" : "people"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </FormControl>
                      <FormMessage data-testid="error-people" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={joinQueue.isPending}
                  data-testid="button-join-queue"
                >
                  {joinQueue.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    "Join Queue"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>

      <footer className="py-4 px-4 text-center text-sm border-t bg-background/20 backdrop-blur-sm relative z-10 h-14 flex items-center justify-center" data-testid="footer">
        <p data-testid="text-footer" className="min-h-[1.25rem] text-white font-medium drop-shadow-sm">{footerText}<span className="animate-pulse border-r-2 border-white ml-1" /></p>
      </footer>
    </div>
  );
}
