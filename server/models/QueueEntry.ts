import mongoose, { Schema, Document } from "mongoose";

export interface IQueueEntry extends Document {
  name: string;
  phoneNumber: string;
  numberOfPeople: number;
  position: number;
  status: "waiting" | "called" | "cancelled" | "completed";
  createdAt: Date;
}

const QueueEntrySchema = new Schema<IQueueEntry>({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  numberOfPeople: { type: Number, required: true, min: 1, max: 20 },
  position: { type: Number, required: true },
  status: {
    type: String,
    enum: ["waiting", "called", "cancelled", "completed"],
    default: "waiting",
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IQueueEntry>("QueueEntry", QueueEntrySchema);
