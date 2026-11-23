import json
import logging
import queue
import threading
from typing import Dict, Any, Generator
from django.http import StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.renderers import BaseRenderer

logger = logging.getLogger(__name__)


class ServerSentEventRenderer(BaseRenderer):
    """
    Renderer for Server-Sent Events (text/event-stream).
    Prevents DRF content negotiation 406 Not Acceptable errors on SSE requests.
    """
    media_type = "text/event-stream"
    format = "event-stream"
    charset = "utf-8"

    def render(self, data, accepted_media_type=None, renderer_context=None):
        return data


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
    renderer_classes = [ServerSentEventRenderer]

    def perform_content_negotiation(self, request, force=False):
        """
        Always accept text/event-stream requests without raising 406 Not Acceptable.
        """
        return (ServerSentEventRenderer(), ServerSentEventRenderer.media_type)

    def get(self, request):
        def event_stream() -> Generator[str, None, None]:
            q = broadcaster.subscribe()
            try:
                # Initial handshake frame
                yield "event: connected\ndata: {\"ok\": true, \"status\": \"connected\"}\n\n"
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
