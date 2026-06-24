import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit for base64 images
app.use(express.json({ limit: "15mb" }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "dummy",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// API endpoint to analyze trash image
app.post("/api/analyze-trash", async (req, res) => {
  try {
    const { image, mimeType } = req.body;

    if (!image) {
      return res.status(400).json({ error: "이미지 데이터가 필요합니다." });
    }

    // Is the API key initialized?
    if (!process.env.GEMINI_API_KEY) {
      console.warn("⚠️ Warning: GEMINI_API_KEY is not defined in environment variables. Falling back to simulator.");
      // If no key is configured, return fallback data based on a simple simulator to keep the app working seamlessly
      return res.json({
        category: "plastic",
        itemName: "맑은 페트병 (시뮬레이터)",
        recyclable: true,
        points: 10,
        childExplanation: "와! 페트병을 찾았어요! 비닐 라벨을 떼어내고 깨끗이 씻은 후에 찌그러뜨려서 플라스틱 수거함에 쏙 넣어주세요! 쓰레기차가 아주 행복해해요! (인증키 설정 시 더 정확해집니다)",
        monsterName: "플라스틱 괴물",
        simulated: true
      });
    }

    // Strip out base64 header if present
    let base64Data = image;
    let finalMimeType = mimeType || "image/jpeg";
    
    if (image.includes(";base64,")) {
      const parts = image.split(";base64,");
      const match = parts[0].match(/data:(.*)/);
      if (match) {
        finalMimeType = match[1];
      }
      base64Data = parts[1];
    }

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: finalMimeType,
      },
    };

    const textPart = {
      text: `You are an expert AI trash recycling counselor for kids aged 5 to 7. Your name is '달님' (Moon).
Analyze the child's camera image and determine if it represents a recyclable object that is often found in classrooms or households, specifically focusing on these categories:
- plastic (플라스틱)
- paper (종이)
- can (캔)
- milk_carton (우유팩)
- vinyl (비닐)
- other (기타 일반쓰레기 / 비재활용품)

Identify the specific physical item in Korean (e.g. '페트병', '골판지 상자', '캔 맥주/음료수', '우유갑', '비닐 과자봉지').
Then offer high-quality kid-friendly instructions in active, soft, conversational Korean. Explain why/how to clean, strip label, or sort it. It must be sweet and match a 5-year-old's vocabulary level! Use exclamation marks and encouraging phrases!`,
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: "Must be one of: plastic, paper, can, milk_carton, vinyl, other"
            },
            itemName: {
              type: Type.STRING,
              description: "The named item in Korean (e.g., '맑은 페트병', '피자 종이상자', '알루미늄 캔', '초코우유 갑')"
            },
            recyclable: {
              type: Type.BOOLEAN,
              description: "True if category is NOT other, otherwise false"
            },
            points: {
              type: Type.INTEGER,
              description: "plastic (+10), paper (+10), can (+15), milk_carton (+20), vinyl (+10), other (+0)"
            },
            childExplanation: {
              type: Type.STRING,
              description: "Cute, sweet, positive instructional voice text in Korean for 5-7 year olds. Prompt them kindly how to recycle this!"
            },
            monsterName: {
              type: Type.STRING,
              description: "Name of the accompanying monster based on category (e.g., '플라스틱 괴물', '종이 괴물', '캔 괴물', '우유갑 괴물', '비닐 괴물', '먼지 괴물')"
            }
          },
          required: ["category", "itemName", "recyclable", "points", "childExplanation", "monsterName"]
        }
      }
    });

    const jsonText = response.text || "{}";
    const result = JSON.parse(jsonText.trim());
    return res.json(result);

  } catch (error: any) {
    console.error("AI Analysis error:", error);
    return res.status(500).json({ error: error.message || "이미지 분석 중 오류가 발생했습니다." });
  }
});

// Setup Vite Dev Server / Static Files
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve HTML
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`[Server] Trash Village Challenge running on http://localhost:${PORT}`);
  });
}

setupServer();
