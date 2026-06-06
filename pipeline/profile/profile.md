# Data profile — marts

## `mart_preco_medio_uf_mes`

- **linhas:** 4833
- **colunas:** 10
- **período:** 2024-01 -> 2026-03
- **uf** (27): AC, AL, AM, AP, BA, CE, DF, ES, GO, MA, MG, MS, MT, PA, PB, PE, PI, PR, RJ, RN, RO, RR, RS, SC, SE, SP, TO
- **produto** (7): DIESEL, DIESEL S10, ETANOL, GASOLINA, GASOLINA ADITIVADA, GLP, GNV
- **nulos:** nenhum

```
       preco_medio_venda  preco_min_venda  preco_max_venda  qtd_coletas  qtd_municipios
count           4833.000         4833.000         4833.000     4833.000        4833.000
mean              21.540           18.352           25.554      462.712          13.153
std               37.535           31.407           45.241      752.769          18.431
min                3.007            2.630            3.540        1.000           1.000
25%                5.607            5.090            6.230      103.000           3.000
50%                6.144            5.580            6.940      204.000           6.000
75%                6.607            6.140            7.750      518.000          15.000
max              141.789          130.000          170.000     6054.000         109.000
```

## `mart_variacao_preco`

- **linhas:** 4833
- **colunas:** 8
- **período:** 2024-01 -> 2026-03
- **uf** (27): AC, AL, AM, AP, BA, CE, DF, ES, GO, MA, MG, MS, MT, PA, PB, PE, PI, PR, RJ, RN, RO, RR, RS, SC, SE, SP, TO
- **produto** (7): DIESEL, DIESEL S10, ETANOL, GASOLINA, GASOLINA ADITIVADA, GLP, GNV
- **nulos:** preco_mes_anterior=3.7%, variacao_pct=3.7%

```
       preco_medio_venda  preco_mes_anterior  variacao_pct
count           4833.000            4652.000      4652.000
mean              21.540              21.505         0.577
std               37.535              37.492         2.404
min                3.007               3.007       -18.450
25%                5.607               5.602        -0.460
50%                6.144               6.131         0.100
75%                6.607               6.556         1.110
max              141.789             141.637        23.760
```

## `mart_dispersao_revenda`

- **linhas:** 4833
- **colunas:** 13
- **período:** 2024-01 -> 2026-03
- **uf** (27): AC, AL, AM, AP, BA, CE, DF, ES, GO, MA, MG, MS, MT, PA, PB, PE, PI, PR, RJ, RN, RO, RR, RS, SC, SE, SP, TO
- **produto** (7): DIESEL, DIESEL S10, ETANOL, GASOLINA, GASOLINA ADITIVADA, GLP, GNV
- **nulos:** desvio_padrao_municipal=0.1%, coef_variacao_pct=0.1%, margem_media=100.0%

```
       qtd_municipios  qtd_coletas  preco_min_venda  preco_max_venda  amplitude_venda  desvio_padrao_municipal  coef_variacao_pct
count        4833.000     4833.000         4833.000         4833.000         4833.000                 4826.000           4826.000
mean           13.153      462.712           18.352           25.554            7.202                    0.994              4.035
std            18.431      752.769           31.407           45.241           15.210                    2.295              2.648
min             1.000        1.000            2.630            3.540            0.000                    0.000              0.000
25%             3.000      103.000            5.090            6.230            0.940                    0.145              2.230
50%             6.000      204.000            5.580            6.940            1.400                    0.235              3.725
75%            15.000      518.000            6.140            7.750            2.050                    0.378              5.398
max           109.000     6054.000          130.000          170.000           95.010                   17.997             15.320
```
