import { promises as fs } from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "likes.json");

export async function GET() {
  const data = await fs.readFile(filePath, "utf-8");
  return new Response(data, { status: 200 });
}

export async function POST(req) {
  const body = await req.json();
  await fs.writeFile(filePath, JSON.stringify(body, null, 2));
  return new Response("OK", { status: 200 });
}
