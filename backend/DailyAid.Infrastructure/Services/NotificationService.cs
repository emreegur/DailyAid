using DailyAid.Application.DTOs;
using DailyAid.Application.Interfaces;
using DailyAid.Domain.Entities;
using DailyAid.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DailyAid.Infrastructure.Services;

public class NotificationService(AppDbContext db) : INotificationService
{
    public async Task<List<NotificationDto>> GetNotificationsAsync(string userId)
    {
        return await db.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new NotificationDto(n.Id, n.Title, n.Message, n.IsRead, n.CreatedAt, n.Type))
            .ToListAsync();
    }

    public async Task MarkAsReadAsync(string userId, int notificationId)
    {
        var notif = await db.Notifications.FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId)
            ?? throw new Exception("Notification not found.");
        notif.IsRead = true;
        await db.SaveChangesAsync();
    }

    public async Task<NotificationDto> CreateNotificationAsync(string caregiverId, string title, string message, string type = "info")
    {
        var notif = new Notification
        {
            UserId = caregiverId,
            Title = title,
            Message = message,
            Type = type,
            IsRead = false,
            CreatedAt = DateTime.UtcNow.AddHours(3)
        };

        db.Notifications.Add(notif);
        await db.SaveChangesAsync();

        return new NotificationDto(notif.Id, notif.Title, notif.Message, notif.IsRead, notif.CreatedAt, notif.Type);
    }

    public async Task DeleteNotificationAsync(string userId, int notificationId)
    {
        var notif = await db.Notifications.FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);
        if (notif != null)
        {
            db.Notifications.Remove(notif);
            await db.SaveChangesAsync();
        }
    }
}
