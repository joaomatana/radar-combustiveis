---
name: setup-dbt-model
description: Cria um novo modelo dbt já com schema.yml, descrição e testes. Use ao adicionar qualquer modelo em staging, intermediate ou marts.
---
Ao criar um modelo dbt:
1. Crie o .sql na camada correta seguindo a convenção de nome (stg_/int_/mart_).
2. Crie/atualize o _<...>__models.yml com descrição do modelo, descrição de cada coluna e testes (not_null/unique nas chaves; accepted_values onde fizer sentido).
3. staging só faz cast/limpeza; regra de negócio vai em intermediate/marts.
4. Rode `dbt build --select <modelo>` e confirme que os testes passam antes de finalizar.
