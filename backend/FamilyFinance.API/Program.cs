using FamilyFinance.Infrastructure.Data;
using FamilyFinance.Infrastructure.Extensions;
using FamilyFinance.Application.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// ─── Serilog ─────────────────────────────────────────────────
builder.Host.UseSerilog((ctx, cfg) =>
    cfg.ReadFrom.Configuration(ctx.Configuration)
       .WriteTo.Console()
       .WriteTo.File("logs/familyfinance-.txt", rollingInterval: RollingInterval.Day));

// ─── Database ────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        npgsql => npgsql.MigrationsHistoryTable("__ef_migrations", "ff")));

// ─── Application Services ────────────────────────────────────
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices();

// ─── JWT Authentication ───────────────────────────────────────
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ClockSkew = TimeSpan.Zero
        };
    });
builder.Services.AddAuthorization();

// ─── CORS ────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("MobileApp", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader());
});

// ─── Controllers ─────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(opt =>
    {
        opt.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        opt.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        opt.JsonSerializerOptions.Converters.Add(new DateOnlyJsonConverter());
        opt.JsonSerializerOptions.Converters.Add(new NullableDateOnlyJsonConverter());
    });

// ─── Swagger ─────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "FamilyFinance API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header. Ejemplo: Bearer {token}",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                    { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// ─── Middleware ───────────────────────────────────────────────
app.UseSerilogRequestLogging();

app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Unhandled exception");
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        var msg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
        await context.Response.WriteAsJsonAsync(new { message = msg, detail = ex.ToString() });
    }
});


// Habilitado en todos los entornos para que Easypanel pueda mostrar Swagger
app.UseSwagger();
app.UseSwaggerUI(c => 
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "FamilyFinance API v1");
    c.RoutePrefix = string.Empty;
});

app.UseCors("MobileApp");
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/health", async (FamilyFinance.Infrastructure.Data.AppDbContext db) => 
{ 
    try {
        var canConnect = await db.Database.CanConnectAsync();
        return canConnect ? Results.Ok(new { status = "OK", db = "Connected" }) : Results.Problem("Cannot connect to database");
    }
    catch (Exception ex) {
        return Results.Problem($"Database connection failed: {ex.Message}");
    }
});

app.MapControllers();

// ─── Auto-migrate on startup ──────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        db.Database.Migrate();
        Log.Information("Database migration completed successfully.");
        
        // Convert Enums to Varchar safely
        db.Database.ExecuteSqlRaw(@"
            DO $$ BEGIN ALTER TABLE ff.categories ALTER COLUMN type TYPE varchar(50) USING type::text; EXCEPTION WHEN OTHERS THEN END; $$;
            DO $$ BEGIN ALTER TABLE ff.users ALTER COLUMN role TYPE varchar(50) USING role::text; EXCEPTION WHEN OTHERS THEN END; $$;
            DO $$ BEGIN ALTER TABLE ff.contributors ALTER COLUMN contributor_type TYPE varchar(50) USING contributor_type::text; EXCEPTION WHEN OTHERS THEN END; $$;
            DO $$ BEGIN ALTER TABLE ff.contributors ALTER COLUMN frequency TYPE varchar(50) USING frequency::text; EXCEPTION WHEN OTHERS THEN END; $$;
            DO $$ BEGIN ALTER TABLE ff.ventures ALTER COLUMN status TYPE varchar(50) USING status::text; EXCEPTION WHEN OTHERS THEN END; $$;
            DO $$ BEGIN ALTER TABLE ff.accounts ALTER COLUMN account_type TYPE varchar(50) USING account_type::text; EXCEPTION WHEN OTHERS THEN END; $$;
            DO $$ BEGIN ALTER TABLE ff.movements ALTER COLUMN type TYPE varchar(50) USING type::text; EXCEPTION WHEN OTHERS THEN END; $$;
            DO $$ BEGIN ALTER TABLE ff.movements ALTER COLUMN payment_method TYPE varchar(50) USING payment_method::text; EXCEPTION WHEN OTHERS THEN END; $$;
            DO $$ BEGIN ALTER TABLE ff.goals ALTER COLUMN goal_type TYPE varchar(50) USING goal_type::text; EXCEPTION WHEN OTHERS THEN END; $$;
            DO $$ BEGIN ALTER TABLE ff.alerts ALTER COLUMN alert_type TYPE varchar(50) USING alert_type::text; EXCEPTION WHEN OTHERS THEN END; $$;
            DO $$ BEGIN ALTER TABLE ff.alerts ALTER COLUMN status TYPE varchar(50) USING status::text; EXCEPTION WHEN OTHERS THEN END; $$;
            DO $$ BEGIN ALTER TABLE ff.alert_configs ALTER COLUMN alert_type TYPE varchar(50) USING alert_type::text; EXCEPTION WHEN OTHERS THEN END; $$;
        ");
        Log.Information("Enum conversion script executed successfully.");
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Database migration failed.");
    }
}

app.Run();
