namespace DailyAid.Domain.Entities;

public class Notification
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public string Type { get; set; } = "info";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow.AddHours(3);
}
