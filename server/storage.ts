import QueueEntry, { IQueueEntry } from "./models/QueueEntry";
import type { InsertQueueEntry, QueueEntry as QueueEntryType } from "@shared/schema";

export interface IStorage {
  getQueue(): Promise<QueueEntryType[]>;
  getQueueEntry(id: string): Promise<QueueEntryType | undefined>;
  getQueueEntryByPhone(phoneNumber: string): Promise<QueueEntryType | null>;
  createQueueEntry(entry: InsertQueueEntry): Promise<QueueEntryType>;
  cancelQueueEntry(id: string): Promise<QueueEntryType | undefined>;
  getPosition(id: string): Promise<{ position: number; totalWaiting: number } | undefined>;
  getNextPosition(): Promise<number>;
}

function toQueueEntryType(doc: IQueueEntry): QueueEntryType {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    phoneNumber: doc.phoneNumber,
    numberOfPeople: doc.numberOfPeople,
    position: doc.position,
    status: doc.status,
    createdAt: doc.createdAt,
  };
}

export class MongoStorage implements IStorage {
  async getQueue(): Promise<QueueEntryType[]> {
    const entries = await QueueEntry.find({ status: "waiting" })
      .sort({ position: 1 })
      .exec();
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
      phoneNumber,
      status: "waiting",
    }).exec();
    return entry ? toQueueEntryType(entry) : null;
  }

  async createQueueEntry(entry: InsertQueueEntry): Promise<QueueEntryType> {
    const position = await this.getNextPosition();
    const newEntry = new QueueEntry({
      ...entry,
      position,
      status: "waiting",
    });
    const saved = await newEntry.save();
    return toQueueEntryType(saved);
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
    const lastEntry = await QueueEntry.findOne()
      .sort({ position: -1 })
      .exec();
    return lastEntry ? lastEntry.position + 1 : 1;
  }
}

export const storage = new MongoStorage();
