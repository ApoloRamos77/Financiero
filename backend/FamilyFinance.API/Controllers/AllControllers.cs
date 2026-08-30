using FamilyFinance.Application.DTOs;
using FamilyFinance.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FamilyFinance.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    public AuthController(IAuthService auth) => _auth = auth;

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto, CancellationToken ct)
    {
        try { return Ok(await _auth.LoginAsync(dto, ct)); }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { message = ex.Message }); }
    }

    [HttpPost("setup")]
    public async Task<IActionResult> Setup([FromBody] SetupFamilyDto dto, CancellationToken ct)
    {
        try { return Ok(await _auth.SetupFamilyAsync(dto, ct)); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] string refreshToken, CancellationToken ct)
    {
        try { return Ok(await _auth.RefreshTokenAsync(refreshToken, ct)); }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { message = ex.Message }); }
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] string refreshToken, CancellationToken ct)
    {
        await _auth.RevokeTokenAsync(refreshToken, ct);
        return NoContent();
    }
}

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FamilyController : ControllerBase
{
    private readonly IFamilyService _svc;
    public FamilyController(IFamilyService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
        => Ok(await _svc.GetAsync(GetFamilyId(), ct));

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateFamilyDto dto, CancellationToken ct)
        => Ok(await _svc.UpdateAsync(GetFamilyId(), dto, ct));

    private Guid GetFamilyId() => Guid.Parse(User.FindFirstValue("familyId")!);
}

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _svc;
    public UsersController(IUserService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
        => Ok(await _svc.GetByFamilyAsync(GetFamilyId(), ct));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        try { return Ok(await _svc.GetByIdAsync(id, ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserDto dto, CancellationToken ct)
    {
        try { return Created("", await _svc.CreateAsync(GetFamilyId(), dto, ct)); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserDto dto, CancellationToken ct)
    {
        try { return Ok(await _svc.UpdateAsync(id, dto, ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        try { await _svc.DeleteAsync(id, ct); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    private Guid GetFamilyId() => Guid.Parse(User.FindFirstValue("familyId")!);
}

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ContributorsController : ControllerBase
{
    private readonly IContributorService _svc;
    public ContributorsController(IContributorService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
        => Ok(await _svc.GetByFamilyAsync(GetFamilyId(), ct));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        try { return Ok(await _svc.GetByIdAsync(id, ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateContributorDto dto, CancellationToken ct)
        => Created("", await _svc.CreateAsync(GetFamilyId(), dto, ct));

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateContributorDto dto, CancellationToken ct)
    {
        try { return Ok(await _svc.UpdateAsync(id, dto, ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        try { await _svc.DeleteAsync(id, ct); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    private Guid GetFamilyId() => Guid.Parse(User.FindFirstValue("familyId")!);
}

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class VenturesController : ControllerBase
{
    private readonly IVentureService _svc;
    public VenturesController(IVentureService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
        => Ok(await _svc.GetByFamilyAsync(GetFamilyId(), ct));

    [HttpGet("{id}/summary")]
    public async Task<IActionResult> GetSummary(Guid id, CancellationToken ct)
    {
        try { return Ok(await _svc.GetSummaryAsync(id, ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateVentureDto dto, CancellationToken ct)
        => Created("", await _svc.CreateAsync(GetFamilyId(), dto, ct));

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateVentureDto dto, CancellationToken ct)
    {
        try { return Ok(await _svc.UpdateAsync(id, dto, ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        try { await _svc.DeleteAsync(id, ct); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    private Guid GetFamilyId() => Guid.Parse(User.FindFirstValue("familyId")!);
}

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class MovementsController : ControllerBase
{
    private readonly IMovementService _svc;
    private readonly IAlertService _alertSvc;
    public MovementsController(IMovementService svc, IAlertService alertSvc)
    { _svc = svc; _alertSvc = alertSvc; }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] MovementFilterDto filter, CancellationToken ct)
        => Ok(await _svc.GetByFamilyAsync(GetFamilyId(), filter, ct));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        try { return Ok(await _svc.GetByIdAsync(id, ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMovementDto dto, CancellationToken ct)
    {
        var result = await _svc.CreateAsync(GetFamilyId(), GetUserId(), dto, ct);
        // Generate alerts after each movement — non-blocking: si falla no afecta el movimiento
        try { await _alertSvc.GenerateAlertsAsync(GetFamilyId(), ct); }
        catch { /* Las alertas son opcionales, no bloquean el registro */ }
        return Created("", result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateMovementDto dto, CancellationToken ct)
    {
        try { return Ok(await _svc.UpdateAsync(id, GetUserId(), dto, ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        try { await _svc.DeleteAsync(id, ct); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpGet("calendar/{year}/{month}")]
    public async Task<IActionResult> Calendar(int year, int month, CancellationToken ct)
        => Ok(await _svc.GetCalendarAsync(GetFamilyId(), year, month, ct));

    [HttpGet("compliance/{year}/{month}")]
    public async Task<IActionResult> Compliance(int year, int month, CancellationToken ct)
        => Ok(await _svc.GetComplianceAsync(GetFamilyId(), year, month, ct));

    private Guid GetFamilyId() => Guid.Parse(User.FindFirstValue("familyId")!);
    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier)!);
}

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _svc;
    public CategoriesController(ICategoryService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
        => Ok(await _svc.GetByFamilyAsync(GetFamilyId(), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCategoryDto dto, CancellationToken ct)
        => Created("", await _svc.CreateAsync(GetFamilyId(), dto, ct));

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCategoryDto dto, CancellationToken ct)
    {
        try { return Ok(await _svc.UpdateAsync(id, dto, ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        try { await _svc.DeleteAsync(id, ct); return NoContent(); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    private Guid GetFamilyId() => Guid.Parse(User.FindFirstValue("familyId")!);
}

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AccountsController : ControllerBase
{
    private readonly IAccountService _svc;
    public AccountsController(IAccountService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
        => Ok(await _svc.GetByFamilyAsync(GetFamilyId(), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAccountDto dto, CancellationToken ct)
        => Created("", await _svc.CreateAsync(GetFamilyId(), dto, ct));

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAccountDto dto, CancellationToken ct)
    {
        try { return Ok(await _svc.UpdateAsync(id, dto, ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        try { await _svc.DeleteAsync(id, ct); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    private Guid GetFamilyId() => Guid.Parse(User.FindFirstValue("familyId")!);
}

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class GoalsController : ControllerBase
{
    private readonly IGoalService _svc;
    public GoalsController(IGoalService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
        => Ok(await _svc.GetByFamilyAsync(GetFamilyId(), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateGoalDto dto, CancellationToken ct)
        => Created("", await _svc.CreateAsync(GetFamilyId(), dto, ct));

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateGoalDto dto, CancellationToken ct)
    {
        try { return Ok(await _svc.UpdateAsync(id, dto, ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPatch("{id}/amount")]
    public async Task<IActionResult> UpdateAmount(Guid id, [FromBody] decimal amount, CancellationToken ct)
    {
        try { return Ok(await _svc.UpdateAmountAsync(id, amount, ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        try { await _svc.DeleteAsync(id, ct); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    private Guid GetFamilyId() => Guid.Parse(User.FindFirstValue("familyId")!);
}

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AlertsController : ControllerBase
{
    private readonly IAlertService _svc;
    public AlertsController(IAlertService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
        => Ok(await _svc.GetByFamilyAsync(GetFamilyId(), ct));

    [HttpPatch("{id}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken ct)
    {
        try { await _svc.MarkAsReadAsync(id, ct); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPatch("{id}/dismiss")]
    public async Task<IActionResult> Dismiss(Guid id, CancellationToken ct)
    {
        try { await _svc.DismissAsync(id, ct); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpGet("configs")]
    public async Task<IActionResult> GetConfigs(CancellationToken ct)
        => Ok(await _svc.GetConfigsAsync(GetFamilyId(), ct));

    [HttpPut("configs/{id}")]
    public async Task<IActionResult> UpdateConfig(Guid id, [FromBody] UpdateAlertConfigDto dto, CancellationToken ct)
    {
        try { await _svc.UpdateConfigAsync(id, dto, ct); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost("generate")]
    public async Task<IActionResult> Generate(CancellationToken ct)
    {
        await _svc.GenerateAlertsAsync(GetFamilyId(), ct);
        return NoContent();
    }

    private Guid GetFamilyId() => Guid.Parse(User.FindFirstValue("familyId")!);
}

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _svc;
    public DashboardController(IDashboardService svc) => _svc = svc;

    [HttpGet("summary")]
    public async Task<IActionResult> Summary([FromQuery] int? year, [FromQuery] int? month, CancellationToken ct)
        => Ok(await _svc.GetSummaryAsync(GetFamilyId(), year, month, ct));

    [HttpGet("charts")]
    public async Task<IActionResult> Charts([FromQuery] int? year, [FromQuery] int? month, CancellationToken ct)
        => Ok(await _svc.GetChartsAsync(GetFamilyId(), year, month, ct));

    private Guid GetFamilyId() => Guid.Parse(User.FindFirstValue("familyId")!);
}

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _svc;
    public ReportsController(IReportService svc) => _svc = svc;

    [HttpGet("monthly/{year}/{month}")]
    public async Task<IActionResult> Monthly(int year, int month, CancellationToken ct)
        => Ok(await _svc.GetMonthlyAsync(GetFamilyId(), year, month, ct));

    [HttpGet("annual/{year}")]
    public async Task<IActionResult> Annual(int year, CancellationToken ct)
        => Ok(await _svc.GetAnnualAsync(GetFamilyId(), year, ct));

    [HttpGet("export/csv")]
    public async Task<IActionResult> ExportCsv([FromQuery] MovementFilterDto filter, CancellationToken ct)
    {
        var bytes = await _svc.ExportCsvAsync(GetFamilyId(), filter, ct);
        return File(bytes, "text/csv", $"movimientos_{DateTime.Today:yyyyMMdd}.csv");
    }

    [HttpGet("export/pdf/{year}/{month}")]
    public async Task<IActionResult> ExportPdf(int year, int month, CancellationToken ct)
    {
        var bytes = await _svc.ExportPdfAsync(GetFamilyId(), year, month, ct);
        return File(bytes, "application/pdf", $"reporte_{year}_{month:D2}.pdf");
    }

    private Guid GetFamilyId() => Guid.Parse(User.FindFirstValue("familyId")!);
}

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AnalysisController : ControllerBase
{
    private readonly IAnalysisService _svc;
    public AnalysisController(IAnalysisService svc) => _svc = svc;

    [HttpGet("insights")]
    public async Task<IActionResult> Insights(CancellationToken ct)
        => Ok(await _svc.GetInsightsAsync(GetFamilyId(), ct));

    private Guid GetFamilyId() => Guid.Parse(User.FindFirstValue("familyId")!);
}
