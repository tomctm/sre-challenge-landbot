import RedisClient from "../lib/redis";

type Visits = {
  visits: number;
  lastVisit: string;
};

export async function getVisits(): Promise<Visits> {
  const today = new Date().toISOString().split("T")[0];
  const key = `visits:${today}`;

  const redis = RedisClient.getInstance();
  const pipeline = redis.pipeline();

  pipeline.hincrby(key, "count", 1);
  pipeline.hget(key, "lastVisit");
  pipeline.hset(key, "lastVisit", new Date().toISOString());

  const result = await pipeline.exec();

  if (result) {
    return {
      visits: (result[0][1] as number) || 0,
      lastVisit: (result[1][1] as string) || "",
    };
  }

  return {
    visits: 0,
    lastVisit: "",
  };
}
