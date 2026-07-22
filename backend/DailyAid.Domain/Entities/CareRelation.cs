namespace DailyAid.Domain.Entities;

public class CareRelation
{
    public int Id { get; set; }
    public string CaregiverId { get; set; } = string.Empty;
    public string ElderlyId { get; set; } = string.Empty;
    public DateTime StartDate { get; set; } = DateTime.UtcNow.AddHours(3);
    public bool IsActive { get; set; } = true;
    public string Status { get; set; } = "Pending";
}
