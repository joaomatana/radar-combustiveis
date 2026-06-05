{#
    Conversão segura texto -> date no Postgres (equivalente ao try_strptime do DuckDB).
    to_date() LANÇA em input inválido, então guardamos com regex antes de converter.
    Sem ELSE no case = NULL (emula try_). Default: data BR dd/mm/aaaa.
#}
{% macro try_to_date(col, fmt='DD/MM/YYYY', regex='^\\d{2}/\\d{2}/\\d{4}$') %}
    case when {{ col }} ~ '{{ regex }}' then to_date({{ col }}, '{{ fmt }}') end
{% endmacro %}
