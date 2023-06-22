import { NextResponse } from "next/server";
import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
});

export async function GET() {
  const today = new Date().toISOString().split("T")[0];
  const key = `visits:${today}`;

  // Update the visit count and last visit timestamp
  const pipeline = redis.pipeline();
  pipeline.hincrby(key, "count", 1);
  pipeline.hget(key, "lastVisit");
  pipeline.hset(key, "lastVisit", new Date().toISOString());

  const result = await pipeline.exec();

  if (result) {
    return NextResponse.json({
      visits: result[0][1],
      lastVisit: result[1][1],
    });
  }

  return NextResponse.error();
}
