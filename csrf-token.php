<?php
/**
 * Emite um token CSRF vinculado à sessão do visitante, consumido pelo
 * formulário de diagnóstico (contato.html) antes do envio. A página é
 * estática, então o token é buscado via fetch em vez de renderizado no HTML.
 */
declare(strict_types=1);

session_start();

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
echo json_encode(['token' => $_SESSION['csrf_token']]);
