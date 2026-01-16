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
import logoCafe from "@assets/logo_cafe_1768483716128.png";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phoneNumber: z.string().length(10, "Phone number must be exactly 10 digits").regex(/^\d+$/, "Phone number must only contain digits"),
  numberOfPeople: z.number().min(1).max(15),
});

type FormData = z.infer<typeof formSchema>;

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [footerText, setFooterText] = useState("");
  const fullText = "Thank you for visiting Cafe made in 2020";

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
      
      console.log("Join Queue Success Data:", data);
      
      const shouldShowWelcome = data.isExisting === true || data.isReUsed === true;
      
      if (shouldShowWelcome) {
        toast({
          title: `Welcome back, ${data.name}!`,
          description: data.isExisting 
            ? `You're still at position #${data.position}`
            : `You've joined the queue at position #${data.position}`,
        });
      } else {
        toast({
          title: "You're in the queue!",
          description: `Your position is #${data.position}`,
        });
      }
      setLocation(`/status/${data._id || data.id}`);
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
      className="min-h-screen flex flex-col relative overflow-hidden" 
      data-testid="page-home"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <header className="pt-24 pb-6 px-4 relative z-10 md:pt-12" data-testid="header">
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
            delay: 0.4,
            ease: [0.16, 1, 0.3, 1] 
          }}
        >
          <Card className="bg-card/90 backdrop-blur-md border-white/20 shadow-2xl" data-testid="card-join-queue">
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
                              maxLength={10}
                              onKeyPress={(e) => {
                                if (!/[0-9]/.test(e.key)) {
                                  e.preventDefault();
                                }
                              }}
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
                    render={({ field }) => {
                      const [isCustom, setIsCustom] = useState(field.value > 8);
                      return (
                        <FormItem data-testid="field-people">
                          <FormLabel>Number of People</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                              {isCustom ? (
                                <div className="flex gap-2">
                                  <Input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={field.value}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/[^0-9]/g, "");
                                      const numVal = val === "" ? 0 : Number(val);
                                      if (numVal > 15) {
                                        field.onChange(15);
                                      } else {
                                        field.onChange(numVal);
                                      }
                                    }}
                                    className="pl-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    placeholder="Enter count"
                                    data-testid="input-custom-people"
                                  />
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      setIsCustom(false);
                                      field.onChange(1);
                                    }}
                                  >
                                    Reset
                                  </Button>
                                </div>
                              ) : (
                                <Select
                                  value={String(field.value)}
                                  onValueChange={(val) => {
                                    if (val === "custom") {
                                      setIsCustom(true);
                                      field.onChange(9);
                                    } else {
                                      field.onChange(Number(val));
                                    }
                                  }}
                                >
                                  <SelectTrigger className="pl-10" data-testid="select-people">
                                    <SelectValue placeholder="Select number of people" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 8 }, (_, i) => i + 1).map((num) => (
                                      <SelectItem key={num} value={String(num)} data-testid={`option-people-${num}`}>
                                        {num} {num === 1 ? "person" : "people"}
                                      </SelectItem>
                                    ))}
                                    <SelectItem value="custom" className="font-semibold text-[#8B4513]" data-testid="option-people-custom">
                                      Custom number...
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage data-testid="error-people" />
                        </FormItem>
                      );
                    }}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-[#8B4513] hover:bg-[#A0522D] transition-colors"
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
        </motion.div>
      </main>

      <footer className="py-8 px-4 text-center text-sm relative z-10 h-20 flex items-center justify-center" data-testid="footer">
        <div className="bg-black/40 backdrop-blur-md p-3 px-6 rounded-full border border-white/10 shadow-lg">
          <p data-testid="text-footer" className="min-h-[1.25rem] text-white font-medium drop-shadow-sm flex items-center">
            {footerText}
            <span className="animate-pulse border-r-2 border-white ml-1 h-4" />
          </p>
        </div>
      </footer>
    </div>
  );
}
