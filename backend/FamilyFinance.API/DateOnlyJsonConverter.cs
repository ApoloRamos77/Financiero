using System.Text.Json;
using System.Text.Json.Serialization;

/// <summary>
/// Converter para serializar/deserializar DateOnly desde/hacia formato "YYYY-MM-DD" en JSON.
/// Necesario porque System.Text.Json no tiene soporte nativo para DateOnly en todas las versiones.
/// </summary>
public class DateOnlyJsonConverter : JsonConverter<DateOnly>
{
    private const string Format = "yyyy-MM-dd";

    public override DateOnly Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return DateOnly.MinValue;

        if (DateOnly.TryParseExact(value, Format, out var result))
            return result;

        // Intentar parseo flexible
        if (DateTime.TryParse(value, out var dt))
            return DateOnly.FromDateTime(dt);

        throw new JsonException($"No se pudo convertir '{value}' a DateOnly. Use el formato {Format}.");
    }

    public override void Write(Utf8JsonWriter writer, DateOnly value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToString(Format));
    }
}

/// <summary>
/// Converter para DateOnly? (nullable).
/// </summary>
public class NullableDateOnlyJsonConverter : JsonConverter<DateOnly?>
{
    private readonly DateOnlyJsonConverter _inner = new();

    public override DateOnly? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
            return null;
        return _inner.Read(ref reader, typeof(DateOnly), options);
    }

    public override void Write(Utf8JsonWriter writer, DateOnly? value, JsonSerializerOptions options)
    {
        if (value is null)
            writer.WriteNullValue();
        else
            _inner.Write(writer, value.Value, options);
    }
}
