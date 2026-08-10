# Pendências — Sistema "O Razão" (uso interno / administração do projeto)

Este arquivo não é referenciado pelo site público. Ele documenta o que foi
deliberadamente omitido ou implementado como solução temporária no site,
conforme a regra de não publicar informação não validada como se fosse real.

Atualizado na Fase 3 (correção de conteúdo, privacidade, formulário e
publicação dos quatro artigos).

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
- **Revisão jurídica/LGPD**: pendente, aplicável à Política de Privacidade
  (ver seção própria abaixo) e ao formulário de diagnóstico.

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

Os quatro temas aprovados agora têm página própria e corpo completo
(~1000–1600 palavras), sem aviso de conteúdo preliminar:

- `artigo-regime-tributario.html` — Como escolher o regime tributário ideal
  para seu negócio;
- `artigo-obrigacoes-acessorias.html` — Os erros mais comuns na entrega de
  obrigações acessórias;
- `artigo-auditoria-contabil.html` — Auditoria contábil: quando deixa de ser
  obrigação e vira ferramenta de gestão;
- `artigo-indicadores-financeiros.html` — Indicadores financeiros que todo
  empresário deveria acompanhar.

Todos publicam `datePublished`/`dateModified` reais (10/08/2026, data desta
publicação) e usam `"author": { "@type": "Organization", "name": "Grupo
ARPO" }` nos dados estruturados — não foi inventado autor pessoal nem
assinatura "Equipe Grupo ARPO", já que essa assinatura institucional não
está confirmada como aprovada. Se for aprovada no futuro, pode-se adicionar
como texto visível no `article-meta` de cada artigo.

Os exemplos usados em cada artigo são explicitamente rotulados como
hipotéticos (`<em>Este exemplo é ilustrativo...</em>`) e nenhum dos quatro
textos cita estatísticas, clientes, resultados ou valores específicos de
lei sem ressalva — onde a legislação tem valores que mudam com frequência
(limites de faturamento, alíquotas), o texto indica explicitamente que o
valor deve ser confirmado como vigente.

## Formulário de diagnóstico (`contato.html`)

- **Backend implementado**: `enviar-diagnostico.php` (validação e
  sanitização no servidor, honeypot, limite de frequência por sessão e por
  IP em `private/rate-limit.json`, token CSRF via `csrf-token.php` +
  sessão). O formulário usa `method="post"` e é enviado via `fetch` — os
  dados nunca aparecem na URL, e o JS (`main.js`) mostra a resposta real do
  servidor, nunca uma mensagem simulada.
- **Envio de e-mail depende de `mail()` do PHP, sem SMTP dedicado
  configurado.** Neste ambiente local (Laragon), `sendmail_path` aponta
  para o Mailpit (`C:/laragon/bin/mailpit/.../mailpit.exe sendmail`); como o
  daemon do Mailpit não estava em execução durante os testes, `mail()`
  retornou `true` mesmo sem nenhuma entrega real — isso é uma peculiaridade
  deste ambiente de desenvolvimento (o e-mail nunca chegou a sair da
  máquina local), não um comportamento confiável para produção. **Antes do
  lançamento, configurar SMTP de produção (ou confirmar que o `mail()` da
  hospedagem funciona de fato) e reexecutar o teste end-to-end** — o código
  já verifica o retorno de `mail()` e não finge sucesso, mas essa
  verificação só é tão confiável quanto a configuração de e-mail do
  servidor onde rodar.
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

`politica-de-privacidade.html` foi substituída por uma minuta orientada à
LGPD (14 seções: responsável pelo tratamento, dados coletados, finalidades,
bases legais, compartilhamento, cookies, retenção, segurança, direitos do
titular, links externos, crianças e adolescentes, alterações, contato). O
texto genérico anterior (menções a Google AdSense, cookies de publicidade
comportamental e afiliados) foi removido integralmente.

Pendências específicas desse texto, registradas conforme pedido:

- **Razão social e CNPJ do controlador**: a minuta identifica o responsável
  pelo tratamento apenas como "Grupo ARPO", sem razão social nem CNPJ —
  nenhum dos dois foi inventado. Confirmar e adicionar à seção "2. Quem é
  responsável pelo tratamento" antes da aprovação jurídica definitiva.
- **Prazo operacional de retenção**: a seção "8. Armazenamento e retenção"
  descreve a lógica de retenção (enquanto houver finalidade legítima) sem
  fixar um prazo em meses/anos, porque nenhum prazo foi definido
  internamente pelo Grupo ARPO. Definir esse prazo e incluí-lo no texto
  quando decidido.
- **Revisão jurídica formal**: continua pendente (aviso mantido no topo da
  página). O texto é uma minuta técnica baseada na operação atual do site.
