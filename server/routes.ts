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

  app.get(api.queue.getByPhone.path, async (req, res) => {
    try {
      const entry = await storage.getQueueEntryByPhone(req.params.phoneNumber);
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch queue entry" });
    }
  });

  app.post(api.queue.create.path, async (req, res) => {
    try {
      const input = api.queue.create.input.parse(req.body);
      
      const existing = await storage.getQueueEntryByPhone(input.phoneNumber);
      if (existing && existing.status === "waiting") {
        // Return 200 instead of 400 to signal "Welcome back" to the frontend
        return res.status(200).json({
          ...existing,
          isExisting: true
        });
      }

      const entry = await storage.createQueueEntry(input);
      res.status(201).json(entry);
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

  return httpServer;
}
