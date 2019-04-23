import mongoose from "mongoose";

const Schema = mongoose.Schema;

export interface ISequenceNumber extends mongoose.Document {
  seqKey: string;
  seqNo: number;
}

const SequenceNumberSchema = new mongoose.Schema(
  {
    seqKey: { type: String, required: true, default: "TBD" },
    seqNo: { type: Number, required: true, default: 0 },
  },
  { timestamps: false }
);

SequenceNumberSchema.index({ "seqKey": 1, "seqNo": 1 }, { "unique": true });

const SequenceNumberModel = mongoose.model<ISequenceNumber>("SequenceNumber", SequenceNumberSchema);
export default SequenceNumberModel;
