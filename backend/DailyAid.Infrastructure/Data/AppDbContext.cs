using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using DailyAid.Domain.Entities;
using DailyAid.Infrastructure.Identity;

namespace DailyAid.Infrastructure.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<CareRelation> CareRelations => Set<CareRelation>();
    public DbSet<Medication> Medications => Set<Medication>();
    public DbSet<MedicationLog> MedicationLogs => Set<MedicationLog>();
    public DbSet<Routine> Routines => Set<Routine>();
    public DbSet<RoutineLog> RoutineLogs => Set<RoutineLog>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<CareRelation>()
            .HasIndex(c => new { c.CaregiverId, c.ElderlyId })
            .IsUnique();
    }
}
