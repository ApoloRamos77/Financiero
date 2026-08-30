using System;
using System.IO;
using System.Data.Common;

class Program {
    static void Main() {
        var connStr = ""Host=76.13.164.224;Port=5432;Database=familyfinance;Username=postgres;Password=SoftSport2026"";
        var factory = DbProviderFactories.GetFactory(""Npgsql"");
        using var conn = factory.CreateConnection();
        conn.ConnectionString = connStr;
        conn.Open();
        
        using var cmd = conn.CreateCommand();
        cmd.CommandText = ""SELECT id, family_id FROM ff.accounts LIMIT 1"";
        using var reader = cmd.ExecuteReader();
        if (reader.Read()) {
            Console.WriteLine($""AccountId: {reader.GetGuid(0)}, FamilyId: {reader.GetGuid(1)}"");
        }
    }
}
