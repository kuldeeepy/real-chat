import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import express from "express";
import { getSessions, getAllChats } from "./controllers/messages.js";
import { v4 as uuidv4 } from "uuid";
import ChatMessage from "./models/chatModel.js";
import { WebSocketServer } from "ws";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

mongoose
  .connect("mongodb://127.0.0.1:27017/real-chat")
  .then(() => console.log("Mongo connected:)"))
  .catch(() => console.log("Mongo diconnected:("));

// setting-up express server
const app = express();
const PORT = 3000;

app.use(cors());

app.get("/getAllConversations", getSessions);
app.get("/getAllChats", getAllChats);

app.listen(PORT, () => console.log("Server running on:", PORT));

// setting-up websocket server
const wss = new WebSocketServer({ port: 2000 });

wss.on("connection", (socket) => {
  const sessionID = uuidv4();
  console.log("ws Connected:)");

  socket.on("message", async (message) => {
    const decodedMsg = message.toString();
    await ChatMessage.create({
      username: "User",
      text: decodedMsg,
      sessionId: sessionID,
    });
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
      const result = await model.generateContentStream({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Please be very short and concise, (now don't give one word answers to sound too rude). Sound like humans and use simpler words. ${decodedMsg}`,
              },
            ],
          },
        ],
        // generationConfig: {
        //   maxOutputTokens: 1000,
        //   temperature: 0.1,
        // },
      });

      // const respTxt = result.response.text();
      let fullResp = "";
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResp += chunkText;
        socket.send(chunkText);
      }

      await ChatMessage.create({
        username: "AI",
        text: fullResp,
        sessionId: sessionID,
      });
      // socket.send(respTxt);
    } catch (cause) {
      console.log(`Error: ${cause}`);
    }
  });

  socket.on("close", () => console.log("ws Disconnected:("));
});
