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
  getDetailedAnalytics(period: "day" | "week" | "month"): Promise<any>;
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
    visitCount: doc.visitCount || 1,
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
      // visitCount is incremented only upon successful completion (accepted)
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
      const entry = await QueueEntry.findById(id).exec();
      if (!entry) return undefined;

      entry.status = "completed";
      entry.position = 0;
      entry.visitCount = (entry.visitCount || 0) + 1;
      
      const saved = await entry.save();
      return toQueueEntryType(saved);
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

  async getDetailedAnalytics(period: "day" | "week" | "month"): Promise<any> {
    const now = new Date();
    let startDate = new Date();
    
    if (period === "day") startDate.setHours(0, 0, 0, 0);
    else if (period === "week") startDate.setDate(now.getDate() - 7);
    else if (period === "month") startDate.setMonth(now.getMonth() - 1);

    const entries = await QueueEntry.find({
      createdAt: { $gte: startDate }
    }).exec();

    const statsByDay: Record<string, any> = {};

    entries.forEach(entry => {
      const day = entry.createdAt.toISOString().split('T')[0];
      if (!statsByDay[day]) {
        statsByDay[day] = { date: day, total: 0, accepted: 0, cancelled: 0, waitTimes: [] };
      }
      
      statsByDay[day].total++;
      if (entry.status === "completed" || entry.status === "called") statsByDay[day].accepted++;
      if (entry.status === "cancelled") statsByDay[day].cancelled++;
      
      if (entry.calledAt) {
        const waitTime = (new Date(entry.calledAt).getTime() - new Date(entry.createdAt).getTime()) / (1000 * 60);
        statsByDay[day].waitTimes.push(waitTime);
      }
    });

    return Object.values(statsByDay).map(dayStats => {
      const avgWait = dayStats.waitTimes.length > 0 
        ? dayStats.waitTimes.reduce((a: number, b: number) => a + b, 0) / dayStats.waitTimes.length 
        : 0;
      return {
        date: dayStats.date,
        total: dayStats.total,
        accepted: dayStats.accepted,
        cancelled: dayStats.cancelled,
        avgWaitTime: Math.round(avgWait * 10) / 10
      };
    }).sort((a, b) => b.date.localeCompare(a.date));
  }
}

export const storage = new MongoStorage();
