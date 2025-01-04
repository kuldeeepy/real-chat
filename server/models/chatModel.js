import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  sessionId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("chatMessage", chatMessageSchema);
