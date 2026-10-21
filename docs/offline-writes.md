# Offline writes

The PWA caches visited pages and GET responses. Writes use explicit outboxes:

| Write | Queue | Replay |
|---|---|---|
| Test question response | `det_response_outbox_v1` | `flushResponseOutbox` on resume / finalize |
| Error notebook item | `pendingSync` flag in the user-scoped cache | retried by `loadForUser` |
| SRS review | `det_srs_outbox_v1_<user>` | `flushSRSOutbox` on mount and `online` |

The SRS outbox keeps the latest review per card because the local SM-2 state has
already advanced optimistically. Test responses are upserted by
`(session_id, question_id)`, so replaying them is safe. SRS replay is
at-least-once; a lost response after the server accepted the review can apply it
twice, which is why the queue keeps only the latest review and flushes once per
reconnect.

Coverage: `e2e/srs-offline.spec.ts`, `e2e-fullstack/offline.spec.ts`, and the
existing `response-outbox` flow exercised by the test-completion suite.
