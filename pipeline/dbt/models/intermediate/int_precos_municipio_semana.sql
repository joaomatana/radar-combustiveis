with precos as (
    select *
    from {{ ref('stg_anp__precos') }}
    where data_coleta is not null and valor_venda is not null
),

com_datas as (
    select
        *,
        extract(year from data_coleta)::int as ano,
        extract(month from data_coleta)::int as mes,
        extract(week from data_coleta)::int as num_semana,
        date_trunc('week', data_coleta)::date as inicio_semana
    from precos
)

select
    md5(concat_ws('|', uf, coalesce(municipio, ''), produto, ano::text, mes::text, num_semana::text)) as id,
    regiao,
    uf,
    municipio,
    produto,
    ano,
    mes,
    num_semana,
    inicio_semana,
    count(*) as qtd_coletas,
    sum(valor_venda) as soma_valor_venda,
    avg(valor_venda) as preco_medio_venda,
    min(valor_venda) as preco_min_venda,
    max(valor_venda) as preco_max_venda,
    avg(valor_compra) as preco_medio_compra
from com_datas
group by regiao, uf, municipio, produto, ano, mes, num_semana, inicio_semana
