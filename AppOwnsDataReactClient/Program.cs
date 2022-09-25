var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSpaStaticFiles(configuration => {
  configuration.RootPath = "wwwRoot";
});

var app = builder.Build();
app.UseHttpsRedirection();

var options = new DefaultFilesOptions();
options.DefaultFileNames.Clear();
options.DefaultFileNames.Add("index.htm");
app.UseDefaultFiles(options);

app.UseStaticFiles();
app.UseSpa(spa => {});

app.Run();
