with uf_mes as (
    select * from {{ ref('int_precos_uf_mes') }}
)

select
    id,
    uf,
    produto,
    ano,
    mes,
    preco_medio_venda,
    preco_min_venda,
    preco_max_venda,
    qtd_coletas,
    qtd_municipios
from uf_mes
