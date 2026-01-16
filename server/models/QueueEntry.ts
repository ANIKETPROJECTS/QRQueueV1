import mongoose, { Schema, Document } from "mongoose";

export interface IQueueEntry extends Document {
  name: string;
  phoneNumber: string;
  numberOfPeople: number;
  position: number;
  status: "waiting" | "called" | "cancelled" | "completed";
  createdAt: Date;
  calledAt?: Date;
  visitCount: number;
}

const QueueEntrySchema: Schema = new Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  numberOfPeople: { type: Number, required: true },
  position: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ["waiting", "called", "cancelled", "completed"], 
    default: "waiting" 
  },
  createdAt: { type: Date, default: Date.now },
  calledAt: { type: Date },
  visitCount: { type: Number, default: 1 },
});

// Index for performance
QueueEntrySchema.index({ phoneNumber: 1 });
QueueEntrySchema.index({ status: 1 });

export default mongoose.model<IQueueEntry>("QueueEntry", QueueEntrySchema);
