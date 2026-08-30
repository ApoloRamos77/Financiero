using System;
using System.IO;
using Npgsql;

class Program {
    static void Main() {
        string connStr = ""Host=76.13.164.224;Port=5432;Database=familyfinance;Username=postgres;Password=SoftSport2026"";
        using var conn = new NpgsqlConnection(connStr);
        conn.Open();
        using var cmd = new NpgsqlCommand(""SELECT id, family_id FROM ff.users LIMIT 1"", conn);
        using var reader = cmd.ExecuteReader();
        if (reader.Read()) {
            Console.WriteLine($""UserId: {reader.GetGuid(0)}, FamilyId: {reader.GetGuid(1)}"");
        }
    }
}
