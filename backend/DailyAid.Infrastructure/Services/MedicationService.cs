using DailyAid.Application.DTOs;
using DailyAid.Application.Interfaces;
using DailyAid.Domain.Entities;
using DailyAid.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DailyAid.Infrastructure.Services;

public class MedicationService(AppDbContext db) : IMedicationService
{
    public async Task<List<MedicationDto>> GetMedicationsAsync(string elderlyId)
    {
        var today = DateTime.UtcNow.AddHours(3).Date;
        return await db.Medications
            .Where(m => m.ElderlyId == elderlyId && m.IsActive)
            .Select(m => new MedicationDto(
                m.Id, 
                m.Name, 
                m.Dosage, 
                m.Frequency.ToString(), 
                m.ScheduledTime.ToString("HH:mm"), 
                m.IsActive,
                db.MedicationLogs.Any(l => l.MedicationId == m.Id && l.IsTaken && l.TakenAt.HasValue && l.TakenAt.Value.Date == today)
            ))
            .ToListAsync();
    }

    public async Task<MedicationDto> CreateMedicationAsync(string elderlyId, CreateMedicationDto dto)
    {
        if (dto.Frequency == "Twice")
        {
            var med1 = new Medication
            {
                ElderlyId = elderlyId,
                Name = $"{dto.Name} (Morning)",
                Dosage = dto.Dosage,
                Frequency = FrequencyType.Daily,
                ScheduledTime = TimeOnly.Parse(dto.ScheduledTime)
            };
            var med2 = new Medication
            {
                ElderlyId = elderlyId,
                Name = $"{dto.Name} (Evening)",
                Dosage = dto.Dosage,
                Frequency = FrequencyType.Daily,
                ScheduledTime = TimeOnly.Parse(dto.ScheduledTime).AddHours(12)
            };
            db.Medications.AddRange(med1, med2);
            await db.SaveChangesAsync();
            return new MedicationDto(med1.Id, med1.Name, med1.Dosage, med1.Frequency.ToString(), med1.ScheduledTime.ToString("HH:mm"), med1.IsActive, false);
        }

        var med = new Medication
        {
            ElderlyId = elderlyId,
            Name = dto.Name,
            Dosage = dto.Dosage,
            Frequency = Enum.Parse<FrequencyType>(dto.Frequency),
            ScheduledTime = TimeOnly.Parse(dto.ScheduledTime)
        };
        db.Medications.Add(med);
        await db.SaveChangesAsync();
        return new MedicationDto(med.Id, med.Name, med.Dosage, med.Frequency.ToString(), med.ScheduledTime.ToString("HH:mm"), med.IsActive, false);
    }

    public async Task<MedicationDto> UpdateMedicationAsync(string elderlyId, int medicationId, UpdateMedicationDto dto)
    {
        var med = await db.Medications.FirstOrDefaultAsync(m => m.Id == medicationId && m.ElderlyId == elderlyId)
            ?? throw new Exception("Medication not found.");

        med.Name = dto.Name;
        med.Dosage = dto.Dosage;
        med.Frequency = Enum.Parse<FrequencyType>(dto.Frequency);
        med.ScheduledTime = TimeOnly.Parse(dto.ScheduledTime);

        await db.SaveChangesAsync();

        var today = DateTime.UtcNow.AddHours(3).Date;
        var isTakenToday = await db.MedicationLogs.AnyAsync(l => l.MedicationId == med.Id && l.IsTaken && l.TakenAt.HasValue && l.TakenAt.Value.Date == today);

        return new MedicationDto(med.Id, med.Name, med.Dosage, med.Frequency.ToString(), med.ScheduledTime.ToString("HH:mm"), med.IsActive, isTakenToday);
    }

    public async Task MarkAsTakenAsync(string elderlyId, int medicationId)
    {
        var med = await db.Medications.FirstOrDefaultAsync(m => m.Id == medicationId && m.ElderlyId == elderlyId)
            ?? throw new Exception("Medication not found.");

        db.MedicationLogs.Add(new MedicationLog
        {
            MedicationId = med.Id,
            ScheduledFor = DateTime.UtcNow.AddHours(3).Date.Add(med.ScheduledTime.ToTimeSpan()),
            TakenAt = DateTime.UtcNow.AddHours(3),
            IsTaken = true
        });
        await db.SaveChangesAsync();
    }

    public async Task UntakeMedicationAsync(string elderlyId, int medicationId)
    {
        var today = DateTime.UtcNow.AddHours(3).Date;
        var log = await db.MedicationLogs
            .Include(l => l.Medication)
            .FirstOrDefaultAsync(l => l.MedicationId == medicationId && l.Medication.ElderlyId == elderlyId && l.IsTaken && l.TakenAt.HasValue && l.TakenAt.Value.Date == today);
        
        if (log != null)
        {
            db.MedicationLogs.Remove(log);
            await db.SaveChangesAsync();
        }
    }

    public async Task DeleteMedicationAsync(string elderlyId, int medicationId)
    {
        var med = await db.Medications.FirstOrDefaultAsync(m => m.Id == medicationId && m.ElderlyId == elderlyId)
            ?? throw new Exception("Medication not found.");
        med.IsActive = false;
        await db.SaveChangesAsync();
    }
}
