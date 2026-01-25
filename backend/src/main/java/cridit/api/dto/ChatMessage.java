package cridit.api.dto;

public class ChatMessage {
  public long id;
  public String role;
  public String text;
  public String source;
  public String clientId;
  public String taskId;
  public Integer rating;
  public String selfConfidence;
  public String satisfaction;
  public String helpfulness;
  public String trustCueUsefulness;
  public String interactionId;
  public long timestamp;

  public ChatMessage() {}

  public ChatMessage(long id, String role, String text, String source, String clientId, String taskId, long timestamp) {
    this.id = id;
    this.role = role;
    this.text = text;
    this.source = source;
    this.clientId = clientId;
    this.taskId = taskId;
    this.timestamp = timestamp;
  }
}
