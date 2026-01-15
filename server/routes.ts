import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { connectDB } from "./db";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await connectDB();

  // Public Routes
  app.get(api.queue.list.path, async (req, res) => {
    try {
      const queue = await storage.getQueue();
      res.json(queue);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch queue" });
    }
  });

  app.get(api.queue.get.path, async (req, res) => {
    try {
      const entry = await storage.getQueueEntry(req.params.id);
      if (!entry) {
        return res.status(404).json({ message: "Queue entry not found" });
      }
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch queue entry" });
    }
  });

  app.post(api.queue.create.path, async (req, res) => {
    try {
      const input = api.queue.create.input.parse(req.body);
      const cleanPhone = input.phoneNumber.trim();
      
      const active = await storage.getQueueEntryByPhone(cleanPhone);
      if (active && active.status === "waiting") {
        return res.status(200).json({
          ...active,
          isExisting: true,
          isReUsed: false
        });
      }

      const entryResult = await storage.createQueueEntry({
        ...input,
        phoneNumber: cleanPhone
      });

      res.status(201).json({
        ...entryResult,
        isExisting: false,
        isReUsed: !entryResult.isNew
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      res.status(500).json({ message: "Failed to create queue entry" });
    }
  });

  app.patch(api.queue.cancel.path, async (req, res) => {
    try {
      const entry = await storage.cancelQueueEntry(req.params.id);
      if (!entry) {
        return res.status(404).json({ message: "Queue entry not found" });
      }
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "Failed to cancel queue entry" });
    }
  });

  app.get(api.queue.position.path, async (req, res) => {
    try {
      const position = await storage.getPosition(req.params.id);
      if (!position) {
        return res.status(404).json({ message: "Queue entry not found" });
      }
      res.json(position);
    } catch (error) {
      res.status(500).json({ message: "Failed to get position" });
    }
  });

  // Admin Routes (Simplified for Fast Mode)
  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    if (username === "admin" && password === "admin123") {
      res.json({ success: true });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  });

  app.get("/api/admin/entries", async (req, res) => {
    const entries = await storage.getAllEntries();
    res.json(entries);
  });

  app.get("/api/admin/stats", async (req, res) => {
    const stats = await storage.getStats();
    res.json(stats);
  });

  app.get("/api/admin/analytics", async (req, res) => {
    const period = (req.query.period as "day" | "week" | "month") || "day";
    const analytics = await storage.getDetailedAnalytics(period);
    res.json(analytics);
  });

  app.post("/api/admin/call/:id", async (req, res) => {
    const entry = await storage.callQueueEntry(req.params.id);
    res.json(entry);
  });

  app.post("/api/admin/complete/:id", async (req, res) => {
    const entry = await storage.completeQueueEntry(req.params.id);
    res.json(entry);
  });

  // Background job for auto-cancellation (5 min)
  setInterval(async () => {
    try {
      const entries = await storage.getAllEntries();
      const now = new Date();
      const fiveMinutes = 5 * 60 * 1000;

      for (const entry of entries) {
        if (entry.status === "called" && entry.calledAt) {
          const diff = now.getTime() - new Date(entry.calledAt).getTime();
          if (diff > fiveMinutes) {
            console.log(`Auto-cancelling entry ${entry._id} due to timeout`);
            await storage.cancelQueueEntry(entry._id!);
          }
        }
      }
    } catch (e) {
      console.error("Auto-cancellation job error:", e);
    }
  }, 30000); // Check every 30 seconds

  return httpServer;
}
