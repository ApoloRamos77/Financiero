# Database Maintenance Rule

- Nunca limpiar ni borrar registros de la base de datos en producción.
- No ejecutar scripts que vacíen o trunquen tablas (`DELETE FROM`, `TRUNCATE`) en bases de datos a menos que exista una autorización explícita y confirmación del usuario para este entorno.
