import mongoose from "mongoose";

const RequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: {
    type: String,
    required: true,

    minlength: 10,
    maxlength: 10,
  },
  title: { type: String, required: true },
  image: { data: Buffer, contentType: String },
  timestamp: { type: Date, default: Date.now },
});

RequestSchema.index({ phone: 1 }, { unique: true });

RequestSchema.index({ title: "text" });
RequestSchema.index({ timestamp: -1 });

export default mongoose.model("Request", RequestSchema);
