namespace DailyAid.Domain.Entities;

public class Routine
{
    public int Id { get; set; }
    public string ElderlyId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TimeOnly ScheduledTime { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow.AddHours(3);

    public ICollection<RoutineLog> Logs { get; set; } = [];
}

public class RoutineLog
{
    public int Id { get; set; }
    public int RoutineId { get; set; }
    public DateTime ScheduledFor { get; set; }
    public DateTime? CompletedAt { get; set; }
    public bool IsCompleted { get; set; }

    public Routine Routine { get; set; } = null!;
}
