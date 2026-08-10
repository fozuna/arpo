# Pendências — Sistema "O Razão" (uso interno / administração do projeto)

Este arquivo não é referenciado pelo site público. Ele documenta o que foi
deliberadamente omitido ou implementado como solução temporária no site,
conforme a regra de não publicar informação não validada como se fosse real.

Atualizado na Fase 2 (normalização e reconstrução de todas as páginas).

## Conteúdo pendente (não publicado)

- **Métricas do hero** (`+200` projetos, `+50` empresas, `+15` setores):
  presentes no standalone com anotação `[CONFIRMAR VALORES ANTES DE
  PUBLICAR]`. Omitidas da Home em produção. Quando os números forem
  validados, adicionar de volta ao bloco `.hero-contact` (ver
  `index.html`, seção hero) seguindo o layout do standalone
  (linha de estatísticas com `border-top` logo abaixo do contato direto).
- **Telefone**: o standalone traz `+55 67 99999-0000 [confirmar]` — não é um
  número real confirmado. Omitido do rodapé e do hero. Adicionar em
  `index.html` (rodapé, coluna "Contato") assim que confirmado.
- **Depoimentos de clientes**: standalone marca a seção como "aguardando
  autorização dos clientes". Nenhuma seção de depoimentos foi construída
  nesta fase — não há dados reais para exibir.
- **Nomes/fotos da equipe**: não fazem parte do escopo da Home; relevantes
  para a página "Sobre" (fase futura).
- **Datas e autores dos artigos**: relevantes para as páginas de Conteúdo/
  Artigo (fase futura); a Home só lista títulos.
- **Revisão jurídica/LGPD**: pendente, aplicável à Política de Privacidade
  e ao futuro formulário de diagnóstico (fase futura).

## Logo negativa (rodapé/CTA navy)

Não existe arquivo oficial da versão negativa/reversa de `logoarpo.png`.
Por regra do contrato, o arquivo positivo não pode ser invertido ou
recolorido programaticamente. Solução aplicada nesta fase: nenhuma marca
gráfica é renderizada sobre os fundos navy (rodapé e CTA de diagnóstico);
apenas texto ("Grupo ARPO" no copyright, em IBM Plex Mono) identifica a
marca nesses blocos. Assim que o arquivo negativo oficial for entregue,
adicionar `<img>` correspondente em `index.html` (rodapé, coluna
"footer-about", e possivelmente no header do CTA de diagnóstico).

## Nomenclatura "ARPO" vs. "Grupo ARPO"

Ainda não definida oficialmente. Nesta implementação, seguiu-se o uso
específico de cada instância no standalone aprovado: `alt="Grupo ARPO"` na
logo, "GRUPO ARPO" no eyebrow do hero e no copyright do rodapé, "ARPO"
como forma curta em contextos de marca (title da página, meta tags).
Ajustar globalmente quando a definição final for confirmada.

## Domínio de produção

`https://grupoarpo.com.br/` (sem `www`) é o domínio confirmado nesta fase e
já está aplicado em canonical, Open Graph, Twitter Card, dados estruturados,
`sitemap.xml` e `robots.txt` em todas as páginas. Se o domínio real divergir
disso, atualizar essas referências antes do lançamento.

## Sobre (`sobre.html`)

- **Nomes, fotos e cargos da equipe**: não publicados. Nenhum avatar ou
  pessoa artificial foi criado. Adicionar apenas quando fornecidos dados
  reais.
- **Descrições dos três públicos** (PMEs / Médias e grandes empresas /
  Profissionais liberais): o standalone v2 marca essas descrições como
  pendentes (`[DESCRIÇÕES POR PÚBLICO PENDENTES]`). A página publica apenas
  os três nomes de categoria, sem frase descritiva — completar quando o
  texto for validado.
- Os oito diferenciais (`.trait-grid`) usam texto já aprovado no standalone
  (inclui "registro CRC ativo" como afirmação genérica de habilitação
  profissional, não uma certificação específica inventada).

## Conteúdo e Artigo

- Dos quatro temas aprovados, apenas **"Como escolher o regime tributário
  ideal para seu negócio"** tem página própria
  (`artigo-regime-tributario.html`). Os outros três aparecem em
  `conteudo.html` como **"Em preparação"**, sem link — não são páginas
  quebradas, apenas ainda não escritas.
- `artigo-regime-tributario.html` publica apenas título, resumo e um aviso
  interno de conteúdo preliminar. **Não existe corpo de artigo completo,
  data de publicação nem tempo de leitura** — nenhum desses dados foi
  inventado. Escrever o corpo real e então remover o aviso `.article-pending-notice`.

## Formulário de diagnóstico (`contato.html`)

- **Não há endpoint de envio configurado.** O formulário valida no cliente
  e, ao ser enviado, exibe uma mensagem fixa explicando que o envio
  automático ainda está sendo configurado e oferecendo o e-mail
  `contato@grupoarpo.com.br` como alternativa — nenhum dado é apagado, nenhum
  sucesso falso é exibido. Configurar o endpoint (`action`/backend) e trocar
  essa mensagem por um envio real é a próxima etapa.
- **Telefone/WhatsApp do Grupo ARPO**: continua pendente. O campo do
  formulário é opcional e o rodapé/página de contato não publicam nenhum
  número.

## Redes sociais

- **LinkedIn**: nenhuma URL confirmada foi fornecida nesta fase. Omitido do
  rodapé (o site antigo usava `linkedin.com/company/arpo`, não validado para
  "Grupo ARPO"). Adicionar ao rodapé (`footer-col` "Institucional") quando a
  URL oficial for confirmada.
- **X/Twitter**: removido definitivamente do site (não fazia parte do
  posicionamento aprovado).

## Política de Privacidade

O documento publicado em `politica-de-privacidade.html` é identificado
internamente como preliminar (`.article-pending-notice` na própria página)
e depende de **revisão jurídica formal para conformidade com a LGPD** antes
de ser tratado como versão final.
