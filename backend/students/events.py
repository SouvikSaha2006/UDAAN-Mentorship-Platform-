import json
import logging
import queue
import threading
from typing import Dict, Any, Generator
from django.http import StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

logger = logging.getLogger(__name__)


class EventBroadcaster:
    """
    Thread-safe in-memory pub/sub event broadcaster for Server-Sent Events (SSE).
    Zero external broker dependency.
    """
    def __init__(self):
        self._subscribers = set()
        self._lock = threading.Lock()

    def subscribe(self) -> queue.Queue:
        q = queue.Queue(maxsize=200)
        with self._lock:
            self._subscribers.add(q)
            logger.info("New SSE subscriber registered. Active subscribers: %d", len(self._subscribers))
        return q

    def unsubscribe(self, q: queue.Queue):
        with self._lock:
            self._subscribers.discard(q)
            logger.info("SSE subscriber unregistered. Remaining: %d", len(self._subscribers))

    def broadcast(self, event_type: str, data: Dict[str, Any]):
        dead = []
        with self._lock:
            subscribers = list(self._subscribers)

        msg = {"event": event_type, "data": data}
        for q in subscribers:
            try:
                q.put_nowait(msg)
            except (queue.Full, Exception):
                dead.append(q)

        if dead:
            with self._lock:
                for q in dead:
                    self._subscribers.discard(q)


broadcaster = EventBroadcaster()


class RealtimeStreamView(APIView):
    """
    GET /api/v1/realtime/stream/
    Server-Sent Events (SSE) endpoint streaming real-time database mutations.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        q = broadcaster.subscribe()

        def event_stream() -> Generator[str, None, None]:
            # Initial handshake frame
            yield "event: connected\ndata: {\"ok\": true, \"status\": \"connected\"}\n\n"
            try:
                while True:
                    try:
                        msg = q.get(timeout=15)
                        event_name = msg.get("event", "message")
                        data_payload = json.dumps(msg.get("data", {}))
                        yield f"event: {event_name}\ndata: {data_payload}\n\n"
                    except queue.Empty:
                        # Keep-alive heartbeat comment every 15 seconds
                        yield ": heartbeat\n\n"
            except (GeneratorExit, Exception):
                pass
            finally:
                broadcaster.unsubscribe(q)

        response = StreamingHttpResponse(
            event_stream(),
            content_type="text/event-stream",
        )
        response["Cache-Control"] = "no-cache, no-transform"
        response["X-Accel-Buffering"] = "no"
        return response
