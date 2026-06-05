with mensal as (
    select * from {{ ref('int_precos_uf_mes') }}
),

com_anterior as (
    select
        id,
        uf,
        produto,
        ano,
        mes,
        preco_medio_venda,
        lag(preco_medio_venda) over (
            partition by uf, produto order by ano, mes
        ) as preco_mes_anterior
    from mensal
)

select
    id,
    uf,
    produto,
    ano,
    mes,
    preco_medio_venda,
    preco_mes_anterior,
    round(
        (100 * (preco_medio_venda - preco_mes_anterior)
        / nullif(preco_mes_anterior, 0))::numeric, 2
    ) as variacao_pct
from com_anterior
