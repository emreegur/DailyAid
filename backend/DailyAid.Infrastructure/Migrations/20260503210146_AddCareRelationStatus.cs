using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DailyAid.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCareRelationStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "CareRelations",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Status",
                table: "CareRelations");
        }
    }
}
