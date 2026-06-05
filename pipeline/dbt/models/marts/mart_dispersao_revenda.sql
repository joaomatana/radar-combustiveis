with uf_mes as (
    select * from {{ ref('int_precos_uf_mes') }}
)

select
    id,
    uf,
    produto,
    ano,
    mes,
    qtd_municipios,
    qtd_coletas,
    preco_min_venda,
    preco_max_venda,
    amplitude_venda,
    desvio_padrao_municipal,
    coef_variacao_pct,
    margem_media
from uf_mes
