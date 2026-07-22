namespace DailyAid.Domain.Entities;

public enum FrequencyType { Daily = 0, Weekly = 1, Twice = 2, AsNeeded = 3 }

public class Medication
{
    public int Id { get; set; }
    public string ElderlyId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public FrequencyType Frequency { get; set; }
    public TimeOnly ScheduledTime { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow.AddHours(3);

    public ICollection<MedicationLog> Logs { get; set; } = [];
}

public class MedicationLog
{
    public int Id { get; set; }
    public int MedicationId { get; set; }
    public DateTime ScheduledFor { get; set; }
    public DateTime? TakenAt { get; set; }
    public bool IsTaken { get; set; }

    public Medication Medication { get; set; } = null!;
}
