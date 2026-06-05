with origem as (
    select * from {{ source('anp', 'precos') }}
)

select
    nullif(trim(regexp_replace("Regiao - Sigla", '[\r\n]', '', 'g')), '') as regiao,
    upper(nullif(trim(regexp_replace("Estado - Sigla", '[\r\n]', '', 'g')), '')) as uf,
    nullif(trim("Municipio"), '') as municipio,
    nullif(trim("Revenda"), '') as revenda,
    nullif(trim("CNPJ da Revenda"), '') as cnpj_revenda,
    nullif(trim("Bandeira"), '') as bandeira,
    nullif(trim("Produto"), '') as produto,
    {{ try_to_date('trim("Data da Coleta")') }} as data_coleta,
    {{ try_to_numeric('trim("Valor de Venda")') }} as valor_venda,
    {{ try_to_numeric('trim("Valor de Compra")') }} as valor_compra,
    nullif(trim("Unidade de Medida"), '') as unidade_medida,
    _arquivo_origem,
    _loaded_at
from origem
where nullif(trim("Produto"), '') is not null
