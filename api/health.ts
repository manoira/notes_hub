export default async function handler() {
  const hasRedis = Boolean(
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ||
      (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN),
  )

  return Response.json({
    ok: true,
    storage: hasRedis ? 'redis' : 'memory',
  })
}
