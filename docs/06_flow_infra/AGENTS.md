# docs/06_flow_infra/AGENTS.md

这里记录系统的慢任务、并发、队列、外部基础设施和实时通道。

维护：

- `io_and_resource.md`
- `queues_and_workers.md`
- `redis_kafka_minio.md`
- `realtime_sse_websocket.md`
- `backpressure_and_timeout.md`

每条 flow 都要说明：谁生产任务、谁消费任务、是否 bounded、谁等待结果、timeout 是什么、资源如何释放、失败如何返回。
