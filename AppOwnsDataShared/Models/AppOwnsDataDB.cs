
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.IO;

namespace AppOwnsDataShared.Models {

  public class PowerBiTenant {
    [Key]
    public string Name { get; set; }
    public string ProfileId { get; set; }
    public string WorkspaceId { get; set; }
    public string WorkspaceUrl { get; set; }
    public string DatabaseServer { get; set; }
    public string DatabaseName { get; set; }
    public string DatabaseUserName { get; set; }
    public string DatabaseUserPassword { get; set; }
    public DateTime Created { get; set; }
  }

  public class User {
    [Key]
    public string LoginId { get; set; }
    public string UserName { get; set; }
    public bool CanEdit { get; set; }
    public bool CanCreate { get; set; }
    public bool TenantAdmin { get; set; }
    public DateTime Created { get; set; }
    public DateTime LastLogin { get; set; }
    public string TenantName { get; set; }
  }

  public class ActivityLogEntry {
    public int Id { get; set; }
    public DateTime Created { get; set; }
    public string LoginId { get; set; }
    public string User { get; set; }
    public string Activity { get; set; }
    public string Tenant { get; set; }
    public string WorkspaceId { get; set; }
    public string Dataset { get; set; }
    public string DatasetId { get; set; }
    public string Report { get; set; }
    public string ReportId { get; set; }
    public string ReportType { get; set; }
    public string PageName { get; set; }
    public string OriginalReportId { get; set; }
    public int? LoadDuration { get; set; }
    public int? RenderDuration { get; set; }
    public string CorrelationId { get; set; }
    public string EmbedTokenId { get; set; }
  }

  public class AppOwnsDataDB : DbContext {

    public AppOwnsDataDB(DbContextOptions<AppOwnsDataDB> options) : base(options) { }

    public DbSet<PowerBiTenant> Tenants { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<ActivityLogEntry> ActivityLog { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder) {
      base.OnModelCreating(modelBuilder);
    }

  }

  public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppOwnsDataDB> {
    public AppOwnsDataDB CreateDbContext(string[] args) {
      string configFilePath = @Directory.GetCurrentDirectory() + "/../AppOwnsDataAdmin/appsettings.json";
      IConfigurationRoot configuration = new ConfigurationBuilder().SetBasePath(Directory.GetCurrentDirectory()).AddJsonFile(configFilePath).Build();
      var builder = new DbContextOptionsBuilder<AppOwnsDataDB>();
      builder.UseSqlServer(configuration["AppOwnsDataDB:ConnectString"]);
      return new AppOwnsDataDB(builder.Options);
    }
  }

}
