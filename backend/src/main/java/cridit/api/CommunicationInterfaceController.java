package cridit.api;

import cridit.api.dto.ChatMessage;
import cridit.api.dto.ScenarioInputs;
import cridit.observability.ChatHistoryStore;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@Path("/")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CommunicationInterfaceController {
  @Inject
  ChatHistoryStore chatHistoryStore;

  private static final Map<String, ScenarioInputs> INPUTS_STORE = new ConcurrentHashMap<>();
  private static final Map<String, List<ChatMessage>> CHAT_STORE = new ConcurrentHashMap<>();
  private static final Map<String, AtomicLong> CHAT_COUNTERS = new ConcurrentHashMap<>();

  @GET
  @Path("/inputs")
  public Map<String, ScenarioInputs> listInputs() {
    return INPUTS_STORE;
  }

  @GET
  @Path("/inputs/{scenario}")
  public ScenarioInputs getInputs(@PathParam("scenario") String scenario) {
    return INPUTS_STORE.get(scenario);
  }

  @POST
  @Path("/inputs/{scenario}")
  public ScenarioInputs putInputs(@PathParam("scenario") String scenario, ScenarioInputs input) {
    INPUTS_STORE.put(scenario, input);
    return input;
  }

  @GET
  @Path("/chat/{scenario}")
  public List<ChatMessage> listChat(
      @PathParam("scenario") String scenario,
      @QueryParam("since") long since,
      @QueryParam("afterId") long afterId
  ) {
    List<ChatMessage> messages = CHAT_STORE.getOrDefault(scenario, List.of());
    List<ChatMessage> filtered = new ArrayList<>();
    for (ChatMessage message : messages) {
      if (afterId > 0) {
        if (message.id > afterId) {
          filtered.add(message);
        }
      } else if (since > 0) {
        if (message.timestamp > since) {
          filtered.add(message);
        }
      } else {
        filtered.add(message);
      }
    }
    return filtered;
  }

  @POST
  @Path("/chat/{scenario}")
  public ChatMessage appendChat(@PathParam("scenario") String scenario, ChatMessage message) {
    long timestamp = message.timestamp > 0 ? message.timestamp : System.currentTimeMillis();
    long id = CHAT_COUNTERS.computeIfAbsent(scenario, key -> new AtomicLong(0)).incrementAndGet();
    ChatMessage stored = new ChatMessage(
        id,
        message.role,
        message.text,
        message.source,
        message.clientId,
        message.taskId,
        timestamp
    );
    CHAT_STORE.computeIfAbsent(scenario, key -> new CopyOnWriteArrayList<>()).add(stored);
    if (chatHistoryStore != null) {
      chatHistoryStore.record(scenario, stored);
    }
    return stored;
  }
}
