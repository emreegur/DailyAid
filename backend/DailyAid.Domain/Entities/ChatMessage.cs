namespace DailyAid.Domain.Entities;

public class ChatMessage
{
    public int Id { get; set; }
    public string ElderlyId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsBot { get; set; }
    public string? Sentiment { get; set; }
    public DateTime SentAt { get; set; } = DateTime.UtcNow.AddHours(3);
}
