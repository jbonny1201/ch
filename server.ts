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
      
      const fallbacks = [
        {
          category: "plastic",
          itemName: "맑은 생수 페트병 (시뮬레이션)",
          recyclable: true,
          points: 10,
          childExplanation: "우와! 깨끗한 플라스틱 생수병이군요! 페트병의 비닐 상표 라벨스티커를 꼭 뜯어서 따로 분리수거하고, 찌그러뜨려서 플라스틱 수거함에 쏙 넣어주세요! 땅별마을이 환하게 미소지을 거예요!",
          monsterName: "플라스틱 괴물",
          simulated: true
        },
        {
          category: "paper",
          itemName: "달콤한 과자 종이상자 (시뮬레이션)",
          recyclable: true,
          points: 10,
          childExplanation: "우와! 과자를 담았던 이쁜 종이상자네요! 테이프나 철사 같은 다른 부품을 떼어내고 납작하게 꾹꾹 눌러서 종이 수거함에 예쁘게 담아주세요!",
          monsterName: "종이 괴물",
          simulated: true
        },
        {
          category: "can",
          itemName: "시원한 콜라 캔 (시뮬레이션)",
          recyclable: true,
          points: 15,
          childExplanation: "짠! 시원한 음료수가 담겨있던 알루미늄 캔이네요! 내용물을 물로 가볍게 헹구고 발로 꾹 밟아서 납작하게 만든 후 캔 수거함에 쏙 버려주세요!",
          monsterName: "캔 괴물",
          simulated: true
        },
        {
          category: "milk_carton",
          itemName: "고소한 흰 우유팩 (시뮬레이션)",
          recyclable: true,
          points: 20,
          childExplanation: "와! 영양만점 우유팩이네요! 다 마신 우유갑은 속을 물로 깨끗하게 헹군 뒤, 네모나게 활짝 펼쳐서 말려 전용 우유팩 수거함에 버려요! 소중한 화장지로 다시 태어난답니다!",
          monsterName: "우유갑 괴물",
          simulated: true
        },
        {
          category: "vinyl",
          itemName: "투명 과일 비닐봉지 (시뮬레이션)",
          recyclable: true,
          points: 10,
          childExplanation: "바스락바스락 비닐봉지군요! 비닐 안에 이물질이 남아있지 않게 확인하고 비닐류 전용 분리수거함에 바람을 빼서 납작하게 넣어주세요!",
          monsterName: "비닐 괴물",
          simulated: true
        }
      ];

      const randomIndex = Math.floor(Math.random() * fallbacks.length);
      const chosenFallback = fallbacks[randomIndex];
      return res.json(chosenFallback);
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
