<?php
/**
 * Processa o formulário de Solicitação de Diagnóstico (contato.html).
 * Sem framework, sem banco de dados nesta fase — apenas valida, sanitiza
 * e tenta enviar por e-mail. Nunca simula sucesso: se o envio falhar (por
 * exemplo, SMTP não configurado neste ambiente), a resposta diz isso.
 */
declare(strict_types=1);

session_start();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const DEST_EMAIL   = 'contato@grupoarpo.com.br';
const PRIVATE_DIR  = __DIR__ . '/private';
const RATE_LIMIT_FILE = PRIVATE_DIR . '/rate-limit.json';
const ERROR_LOG_FILE  = PRIVATE_DIR . '/mail-errors.log';
const MIN_SECONDS_BETWEEN_SUBMITS = 30;
const MAX_SUBMITS_PER_IP_PER_HOUR = 8;

function respond(bool $success, string $message, int $httpStatus = 200): never {
    http_response_code($httpStatus);
    echo json_encode(['success' => $success, 'message' => $message]);
    exit;
}

function fieldTooLong(string $value, int $max): bool {
    return mb_strlen($value) > $max;
}

// Remove quebras de linha e caracteres de controle para impedir injeção de
// cabeçalhos de e-mail via campos livres (nome, empresa, mensagem etc.).
function sanitizeText(string $value, int $maxLength): string {
    $value = str_replace(["\r", "\n"], ' ', $value);
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', '', $value) ?? '';
    $value = trim($value);
    return mb_substr($value, 0, $maxLength);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(false, 'Método não permitido.', 405);
}

// CSRF: token emitido por csrf-token.php e devolvido pelo formulário.
$csrfSubmitted = $_POST['csrf_token'] ?? '';
$csrfSession = $_SESSION['csrf_token'] ?? '';
if ($csrfSession === '' || !hash_equals($csrfSession, (string) $csrfSubmitted)) {
    respond(false, 'Sessão expirada. Atualize a página e tente novamente.', 400);
}

// Honeypot: campo oculto que humanos não preenchem; bots costumam preencher.
if (trim((string) ($_POST['website'] ?? '')) !== '') {
    // Resposta "de sucesso" para o bot não aprender a diferenciar, mas nada é enviado.
    respond(true, 'Solicitação recebida.');
}

// Limite básico de frequência, por sessão e por IP, sem banco de dados.
$now = time();
$lastSubmit = (int) ($_SESSION['diagnostic_last_submit'] ?? 0);
if ($lastSubmit > 0 && ($now - $lastSubmit) < MIN_SECONDS_BETWEEN_SUBMITS) {
    respond(false, 'Aguarde alguns segundos antes de enviar novamente.', 429);
}

if (!is_dir(PRIVATE_DIR)) {
    mkdir(PRIVATE_DIR, 0750, true);
}

$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$ipHash = hash('sha256', $ip);
$rateLimitOk = true;
$handle = @fopen(RATE_LIMIT_FILE, 'c+');
if ($handle !== false) {
    if (flock($handle, LOCK_EX)) {
        $raw = stream_get_contents($handle);
        $data = $raw !== false && $raw !== '' ? json_decode($raw, true) : [];
        if (!is_array($data)) {
            $data = [];
        }
        $windowStart = $now - 3600;
        $timestamps = array_values(array_filter($data[$ipHash] ?? [], fn($t) => $t > $windowStart));
        if (count($timestamps) >= MAX_SUBMITS_PER_IP_PER_HOUR) {
            $rateLimitOk = false;
        } else {
            $timestamps[] = $now;
            $data[$ipHash] = $timestamps;
            ftruncate($handle, 0);
            rewind($handle);
            fwrite($handle, json_encode($data));
        }
        flock($handle, LOCK_UN);
    }
    fclose($handle);
}
if (!$rateLimitOk) {
    respond(false, 'Muitas tentativas em pouco tempo. Tente novamente mais tarde.', 429);
}

$nome = sanitizeText((string) ($_POST['nome'] ?? ''), 120);
$empresa = sanitizeText((string) ($_POST['empresa'] ?? ''), 120);
$cargo = sanitizeText((string) ($_POST['cargo'] ?? ''), 120);
$emailRaw = trim((string) ($_POST['email'] ?? ''));
$telefone = sanitizeText((string) ($_POST['telefone'] ?? ''), 30);
$servico = sanitizeText((string) ($_POST['servico'] ?? ''), 60);
$contexto = sanitizeText((string) ($_POST['contexto'] ?? ''), 2000);
$mensagem = sanitizeText((string) ($_POST['mensagem'] ?? ''), 4000);
$consentimento = ($_POST['consentimento'] ?? '') === 'on';

$servicosValidos = ['assessoria', 'auditoria', 'consultoria', 'nao-sei'];

$errors = [];
if ($nome === '' || fieldTooLong($nome, 120)) $errors[] = 'nome';
if ($empresa === '' || fieldTooLong($empresa, 120)) $errors[] = 'empresa';
if (!filter_var($emailRaw, FILTER_VALIDATE_EMAIL) || fieldTooLong($emailRaw, 254)) $errors[] = 'email';
if (!in_array($servico, $servicosValidos, true)) $errors[] = 'servico';
if ($mensagem === '') $errors[] = 'mensagem';
if (!$consentimento) $errors[] = 'consentimento';

if ($errors) {
    respond(false, 'Revise os campos destacados antes de enviar.', 422);
}

$email = sanitizeText($emailRaw, 254);

$_SESSION['diagnostic_last_submit'] = $now;

$servicoLabel = [
    'assessoria' => 'Assessoria Contábil',
    'auditoria' => 'Auditoria Contábil',
    'consultoria' => 'Consultoria Empresarial',
    'nao-sei' => 'Ainda não sei',
][$servico] ?? $servico;

$corpo = "Nova solicitação de diagnóstico — grupoarpo.com.br\n\n"
    . "Nome: {$nome}\n"
    . "Empresa: {$empresa}\n"
    . "Cargo/função: " . ($cargo !== '' ? $cargo : '(não informado)') . "\n"
    . "E-mail: {$email}\n"
    . "Telefone/WhatsApp: " . ($telefone !== '' ? $telefone : '(não informado)') . "\n"
    . "Serviço de interesse: {$servicoLabel}\n"
    . "Contexto do negócio: " . ($contexto !== '' ? $contexto : '(não informado)') . "\n\n"
    . "Mensagem:\n{$mensagem}\n\n"
    . "Consentimento (Política de Privacidade): confirmado\n"
    . "Recebido em: " . date('d/m/Y H:i:s') . "\n";

$subject = '=?UTF-8?B?' . base64_encode("Diagnóstico — {$empresa}") . '?=';
$headers = "From: Site Grupo ARPO <" . DEST_EMAIL . ">\r\n"
    . "Reply-To: {$nome} <{$email}>\r\n"
    . "Content-Type: text/plain; charset=UTF-8\r\n";

$sent = @mail(DEST_EMAIL, $subject, $corpo, $headers);

if (!$sent) {
    $logLine = sprintf(
        "[%s] Falha ao enviar diagnóstico (mail() indisponível/não configurado). IP-hash: %s\n",
        date('c'),
        substr($ipHash, 0, 16)
    );
    @error_log($logLine, 3, ERROR_LOG_FILE);

    respond(
        false,
        'O envio automático ainda não está disponível neste ambiente. Nenhum dado foi perdido — copie as informações e envie para ' . DEST_EMAIL . ', ou aguarde: entraremos em contato assim que o envio direto estiver disponível.',
        503
    );
}

respond(true, 'Solicitação enviada com sucesso. Entraremos em contato em breve.');
