using System;
using System.IO;
using Npgsql;

class Program {
    static void Main() {
        try {
            string connStr = ""Host=76.13.164.224;Port=5432;Database=familyfinance;Username=postgres;Password=SoftSport2026"";
            using var conn = new NpgsqlConnection(connStr);
            conn.Open();
            
            // Get constraints
            using var cmd = new NpgsqlCommand(@""
                SELECT conname, pg_get_constraintdef(c.oid)
                FROM pg_constraint c
                JOIN pg_namespace n ON n.oid = c.connamespace
                WHERE conrelid = 'ff.movements'::regclass;"", conn);
            using var reader = cmd.ExecuteReader();
            Console.WriteLine(""Constraints on ff.movements:"");
            while (reader.Read()) {
                Console.WriteLine($""{reader.GetString(0)}: {reader.GetString(1)}"");
            }
        } catch (Exception ex) {
            Console.WriteLine(ex.ToString());
        }
    }
}
