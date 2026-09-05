# Marcador AR (targets.mind)

O modo AR precisa de um arquivo targets.mind, gerado a partir de uma
imagem (o campo desenhado que voce vai imprimir ou exibir na mesa).

## Passo a passo

1. Escolha/desenhe a imagem do campo (alto contraste ajuda o tracking).
2. Acesse o compilador online oficial do MindAR:
   https://hiukim.github.io/mind-ar-js-doc/tools/compile
3. Suba a imagem do campo, gere o .mind e baixe o arquivo.
4. Coloque o arquivo baixado aqui como markers/targets.mind.
5. Imprima a MESMA imagem usada na compilacao.

## Dicas pro dia da apresentacao

- Teste o tracking com a luz da sala de aula ANTES do dia.
- Leve a imagem impressa em pelo menos 2 tamanhos.
- O motor tatico (src/tactics/engine.ts) e testado independente do AR,
  entao qualquer problema de tracking no dia nao compromete a logica.
