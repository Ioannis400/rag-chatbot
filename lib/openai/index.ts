import OpenAI from "openai";
import { MODEL, EMBED_MODEL } from "@/config";

export { MODEL, EMBED_MODEL };
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? "build-placeholder",
});
