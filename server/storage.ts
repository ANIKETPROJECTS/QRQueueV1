import QueueEntry, { IQueueEntry } from "./models/QueueEntry";
import type { InsertQueueEntry, QueueEntry as QueueEntryType } from "@shared/schema";

export interface IStorage {
  getQueue(): Promise<QueueEntryType[]>;
  getQueueEntry(id: string): Promise<QueueEntryType | undefined>;
  getQueueEntryByPhone(phoneNumber: string): Promise<QueueEntryType | null>;
  createQueueEntry(entry: InsertQueueEntry): Promise<QueueEntryType & { isNew: boolean }>;
  cancelQueueEntry(id: string): Promise<QueueEntryType | undefined>;
  callQueueEntry(id: string): Promise<QueueEntryType | undefined>;
  completeQueueEntry(id: string): Promise<QueueEntryType | undefined>;
  getStats(): Promise<{ totalCustomers: number; totalVisits: number }>;
  getPosition(id: string): Promise<{ position: number; totalWaiting: number } | undefined>;
  getNextPosition(): Promise<number>;
  getAllEntries(): Promise<QueueEntryType[]>;
}

function toQueueEntryType(doc: IQueueEntry): QueueEntryType {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    phoneNumber: doc.phoneNumber,
    numberOfPeople: doc.numberOfPeople,
    position: doc.position,
    status: doc.status as "waiting" | "called" | "cancelled" | "completed",
    createdAt: doc.createdAt,
    calledAt: doc.calledAt,
  };
}

export class MongoStorage implements IStorage {
  async getQueue(): Promise<QueueEntryType[]> {
    const entries = await QueueEntry.find({ status: "waiting" })
      .sort({ position: 1 })
      .exec();
    return entries.map(toQueueEntryType);
  }

  async getAllEntries(): Promise<QueueEntryType[]> {
    const entries = await QueueEntry.find().sort({ createdAt: -1 }).exec();
    return entries.map(toQueueEntryType);
  }

  async getQueueEntry(id: string): Promise<QueueEntryType | undefined> {
    try {
      const entry = await QueueEntry.findById(id).exec();
      return entry ? toQueueEntryType(entry) : undefined;
    } catch {
      return undefined;
    }
  }

  async getQueueEntryByPhone(phoneNumber: string): Promise<QueueEntryType | null> {
    const entry = await QueueEntry.findOne({
      phoneNumber
    }).sort({ createdAt: -1 }).exec();
    return entry ? toQueueEntryType(entry) : null;
  }

  async createQueueEntry(entry: InsertQueueEntry): Promise<QueueEntryType & { isNew: boolean }> {
    const existing = await QueueEntry.findOne({ 
      phoneNumber: entry.phoneNumber,
      name: entry.name
    }).exec();
    
    if (existing) {
      const position = await this.getNextPosition();
      existing.numberOfPeople = entry.numberOfPeople;
      existing.status = "waiting";
      existing.position = position;
      existing.createdAt = new Date();
      existing.calledAt = undefined;
      const saved = await existing.save();
      return { ...toQueueEntryType(saved), isNew: false };
    }

    const position = await this.getNextPosition();
    const newEntry = new QueueEntry({
      ...entry,
      position,
      status: "waiting",
    });
    const saved = await newEntry.save();
    return { ...toQueueEntryType(saved), isNew: true };
  }

  async cancelQueueEntry(id: string): Promise<QueueEntryType | undefined> {
    try {
      const entry = await QueueEntry.findByIdAndUpdate(
        id,
        { 
          status: "cancelled",
          position: 0
        },
        { new: true }
      ).exec();
      return entry ? toQueueEntryType(entry) : undefined;
    } catch {
      return undefined;
    }
  }

  async callQueueEntry(id: string): Promise<QueueEntryType | undefined> {
    try {
      const entry = await QueueEntry.findByIdAndUpdate(
        id,
        { 
          status: "called",
          calledAt: new Date()
        },
        { new: true }
      ).exec();
      return entry ? toQueueEntryType(entry) : undefined;
    } catch {
      return undefined;
    }
  }

  async completeQueueEntry(id: string): Promise<QueueEntryType | undefined> {
    try {
      const entry = await QueueEntry.findByIdAndUpdate(
        id,
        { 
          status: "completed",
          position: 0
        },
        { new: true }
      ).exec();
      return entry ? toQueueEntryType(entry) : undefined;
    } catch {
      return undefined;
    }
  }

  async getStats(): Promise<{ totalCustomers: number; totalVisits: number }> {
    const totalVisits = await QueueEntry.countDocuments().exec();
    const distinctPhones = await QueueEntry.distinct("phoneNumber").exec();
    return {
      totalCustomers: distinctPhones.length,
      totalVisits
    };
  }

  async getPosition(id: string): Promise<{ position: number; totalWaiting: number } | undefined> {
    try {
      const entry = await QueueEntry.findById(id).exec();
      if (!entry || entry.status !== "waiting") return undefined;

      const waitingAhead = await QueueEntry.countDocuments({
        status: "waiting",
        position: { $lt: entry.position },
      }).exec();

      const totalWaiting = await QueueEntry.countDocuments({
        status: "waiting",
      }).exec();

      return {
        position: waitingAhead + 1,
        totalWaiting,
      };
    } catch {
      return undefined;
    }
  }

  async getNextPosition(): Promise<number> {
    const lastEntry = await QueueEntry.findOne({ status: "waiting" })
      .sort({ position: -1 })
      .exec();
    return lastEntry ? lastEntry.position + 1 : 1;
  }
}

export const storage = new MongoStorage();
