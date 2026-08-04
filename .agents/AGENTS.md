# Reglas de Proyecto y Convenciones

- **NSS (Número de Seguro Social)**: NUNCA usar `intNss` en payloads, DTOs ni mapeos JavaScript/C#. Utilizar siempre `bigNss` (o representación en cadena/BigInt) ya que el NSS en México cuenta con 11 dígitos y causa desbordamiento en enteros de 32 bits (`int`).
