using DailyAid.Application.DTOs;
using DailyAid.Application.Interfaces;
using DailyAid.Domain.Entities;
using DailyAid.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DailyAid.Infrastructure.Services;

public class RoutineService(AppDbContext db) : IRoutineService
{
    public async Task<List<RoutineDto>> GetRoutinesAsync(string elderlyId)
    {
        var today = DateTime.UtcNow.AddHours(3).Date;
        return await db.Routines
            .Where(r => r.ElderlyId == elderlyId && r.IsActive)
            .Select(r => new RoutineDto(
                r.Id, 
                r.Title, 
                r.Description, 
                r.ScheduledTime.ToString("HH:mm"), 
                r.IsActive,
                db.RoutineLogs.Any(l => l.RoutineId == r.Id && l.IsCompleted && l.CompletedAt.HasValue && l.CompletedAt.Value.Date == today)
            ))
            .ToListAsync();
    }

    public async Task<RoutineDto> CreateRoutineAsync(string elderlyId, CreateRoutineDto dto)
    {
        var routine = new Routine
        {
            ElderlyId = elderlyId,
            Title = dto.Title,
            Description = dto.Description,
            ScheduledTime = TimeOnly.Parse(dto.ScheduledTime)
        };
        db.Routines.Add(routine);
        await db.SaveChangesAsync();
        return new RoutineDto(routine.Id, routine.Title, routine.Description, routine.ScheduledTime.ToString("HH:mm"), routine.IsActive, false);
    }

    public async Task CompleteRoutineAsync(string elderlyId, int routineId)
    {
        var routine = await db.Routines.FirstOrDefaultAsync(r => r.Id == routineId && r.ElderlyId == elderlyId)
            ?? throw new Exception("Routine not found.");

        db.RoutineLogs.Add(new RoutineLog
        {
            RoutineId = routine.Id,
            ScheduledFor = DateTime.UtcNow.AddHours(3).Date.Add(routine.ScheduledTime.ToTimeSpan()),
            CompletedAt = DateTime.UtcNow.AddHours(3),
            IsCompleted = true
        });
        await db.SaveChangesAsync();
    }

    public async Task UncompleteRoutineAsync(string elderlyId, int routineId)
    {
        var today = DateTime.UtcNow.AddHours(3).Date;
        var log = await db.RoutineLogs
            .Include(l => l.Routine)
            .FirstOrDefaultAsync(l => l.RoutineId == routineId && l.Routine.ElderlyId == elderlyId && l.IsCompleted && l.CompletedAt.HasValue && l.CompletedAt.Value.Date == today);
        
        if (log != null)
        {
            db.RoutineLogs.Remove(log);
            await db.SaveChangesAsync();
        }
    }

    public async Task DeleteRoutineAsync(string elderlyId, int routineId)
    {
        var routine = await db.Routines.FirstOrDefaultAsync(r => r.Id == routineId && r.ElderlyId == elderlyId)
            ?? throw new Exception("Routine not found.");
        routine.IsActive = false;
        await db.SaveChangesAsync();
    }
}
