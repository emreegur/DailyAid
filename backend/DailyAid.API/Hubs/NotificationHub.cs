using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using DailyAid.Infrastructure.Data;
using DailyAid.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;

namespace DailyAid.API.Hubs;

[Authorize]
public class NotificationHub(AppDbContext db, UserManager<ApplicationUser> userManager) : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, userId);
            
            var user = await userManager.FindByIdAsync(userId);
            if (user != null)
            {
                user.IsOnline = true;
                await userManager.UpdateAsync(user);
            }
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, userId);
            
            var user = await userManager.FindByIdAsync(userId);
            if (user != null)
            {
                user.IsOnline = false;
                user.LastSeen = DateTime.UtcNow.AddHours(3);
                await userManager.UpdateAsync(user);
            }
        }

        await base.OnDisconnectedAsync(exception);
    }
}
