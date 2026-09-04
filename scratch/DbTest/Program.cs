using System;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.IdentityModel.Tokens;

class Program
{
    static async Task Main(string[] args)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("FamilyFinancePro-SuperSecretKey-2026-ChangeInProduction-MinimumLength256bits"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, "32304969-aac5-43b1-b63b-8e908840667c"),
            new Claim(JwtRegisteredClaimNames.Email, "aerp77@gmail.com"),
            new Claim("familyId", "a6c097ba-bdbb-4b0c-b3a1-8d9828f98734"),
            new Claim(ClaimTypes.Role, "Contributor"),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: "FamilyFinanceAPI",
            audience: "FamilyFinanceMobileApp",
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(60),
            signingCredentials: creds);
            
        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
        
        var client = new HttpClient();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", tokenString);
        
        var url = "https://softsport77-apifinanza.scuiaw.easypanel.host/api/Movements?page=1&pageSize=30";
        var response = await client.GetAsync(url);
        
        Console.WriteLine($"Status: {response.StatusCode}");
    }
}
