{#
    Conversão segura texto -> numeric no Postgres (equivalente ao try_cast do DuckDB).
    Troca vírgula->ponto e guarda com regex; ::numeric LANÇA em input inválido.
    SEM precisão fixa: numeric(10,3) reintroduziria overflow num valor grande que
    passa no regex. Escala/arredondamento ficam nos modelos. Sem ELSE = NULL.
    Obs.: a regex está no CORPO do macro (texto literal), então use UMA barra (\.) —
    o Jinja não desescapa aqui (ao contrário de um arg-string como no try_to_date).
#}
{% macro try_to_numeric(col) %}
    case
        when replace({{ col }}, ',', '.') ~ '^-?[0-9]+(\.[0-9]+)?$'
        then replace({{ col }}, ',', '.')::numeric
    end
{% endmacro %}
