using Microsoft.AspNetCore.Identity;
using DailyAid.Domain.Enums;

namespace DailyAid.Infrastructure.Identity;

public class ApplicationUser : IdentityUser
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow.AddHours(3);
    public bool IsOnline { get; set; }
    public DateTime? LastSeen { get; set; }
}
