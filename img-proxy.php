<?php
declare(strict_types=1);

const ALLOWED_HOSTS = [
    'images.unsplash.com',
    'source.unsplash.com',
    'images.pexels.com'
];
const MAX_REDIRECTS = 3;
const TIMEOUT_SECONDS = 10;
const MAX_IMAGE_BYTES = 5242880;
const DEFAULT_IMAGE_CONTENT_TYPE = 'image/jpeg';

function fail(int $code, string $message): void {
    http_response_code($code);
    header('Content-Type: text/plain; charset=utf-8');
    echo $message;
    exit;
}

function sanitize_input_url(): string {
    $raw = filter_input(INPUT_GET, 'url', FILTER_UNSAFE_RAW);
    if (!$raw) {
        $raw = filter_input(INPUT_GET, 'u', FILTER_UNSAFE_RAW);
    }
    $url = filter_var((string) $raw, FILTER_SANITIZE_URL);
    if (!$url) {
        fail(400, 'missing url');
    }
    return $url;
}

function is_allowed_url(string $url): bool {
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        return false;
    }
    $parts = parse_url($url);
    if (!$parts) {
        return false;
    }
    $scheme = strtolower((string) ($parts['scheme'] ?? ''));
    $host = strtolower((string) ($parts['host'] ?? ''));
    if ($scheme !== 'https' || $host === '') {
        return false;
    }
    return in_array($host, ALLOWED_HOSTS, true);
}

function split_content_type(string $contentType): string {
    $pieces = explode(';', $contentType);
    return trim(strtolower($pieces[0] ?? ''));
}

function fetch_with_curl(string $url): array {
    $currentUrl = $url;
    $redirects = 0;

    while (true) {
        $responseHeaders = [];
        $body = '';
        $ch = curl_init($currentUrl);
        curl_setopt_array($ch, [
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_RETURNTRANSFER => false,
            CURLOPT_TIMEOUT => TIMEOUT_SECONDS,
            CURLOPT_CONNECTTIMEOUT => TIMEOUT_SECONDS,
            CURLOPT_USERAGENT => 'ARPO-ImageProxy/2.0',
            CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
            CURLOPT_REDIR_PROTOCOLS => CURLPROTO_HTTPS,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_HEADERFUNCTION => static function($ch, string $headerLine) use (&$responseHeaders): int {
                $len = strlen($headerLine);
                $parts = explode(':', $headerLine, 2);
                if (count($parts) === 2) {
                    $name = strtolower(trim($parts[0]));
                    $value = trim($parts[1]);
                    $responseHeaders[$name][] = $value;
                }
                return $len;
            },
            CURLOPT_WRITEFUNCTION => static function($ch, string $chunk) use (&$body): int {
                $next = strlen($body) + strlen($chunk);
                if ($next > MAX_IMAGE_BYTES) {
                    return 0;
                }
                $body .= $chunk;
                return strlen($chunk);
            }
        ]);

        $ok = curl_exec($ch);
        $curlErr = curl_errno($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $ct = (string) curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        curl_close($ch);

        if ($ok === false || $curlErr !== 0) {
            return ['', '', 502];
        }

        if ($code >= 300 && $code < 400) {
            $location = $responseHeaders['location'][0] ?? '';
            if ($location === '' || ++$redirects > MAX_REDIRECTS) {
                return ['', '', 502];
            }
            if (strpos($location, 'http') !== 0) {
                $base = parse_url($currentUrl);
                $scheme = $base['scheme'] ?? 'https';
                $host = $base['host'] ?? '';
                $location = $scheme . '://' . $host . '/' . ltrim($location, '/');
            }
            if (!is_allowed_url($location)) {
                return ['', '', 403];
            }
            $currentUrl = $location;
            continue;
        }

        return [$body, $ct, $code];
    }
}

function fetch_with_stream(string $url): array {
    $ctx = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => "User-Agent: ARPO-ImageProxy/2.0\r\n",
            'timeout' => TIMEOUT_SECONDS,
            'follow_location' => 0
        ]
    ]);
    $data = @file_get_contents($url, false, $ctx, 0, MAX_IMAGE_BYTES + 1);
    if ($data === false || strlen($data) > MAX_IMAGE_BYTES) {
        return ['', '', 502];
    }
    $ct = '';
    $code = 200;
    if (isset($http_response_header)) {
        foreach ($http_response_header as $line) {
            if (stripos($line, 'HTTP/') === 0) {
                preg_match('/\s(\d{3})\s/', $line, $m);
                if (!empty($m[1])) {
                    $code = (int) $m[1];
                }
            }
            if (stripos($line, 'Content-Type:') === 0) {
                $ct = trim(substr($line, 13));
            }
        }
    }
    return [$data, $ct, $code];
}

$url = sanitize_input_url();
if (!is_allowed_url($url)) {
    fail(403, 'url not allowed');
}

[$data, $ct, $code] = function_exists('curl_init')
    ? fetch_with_curl($url)
    : fetch_with_stream($url);

if ($code >= 400 || $data === '') {
    fail(502, 'fetch failed');
}

$contentType = split_content_type($ct);
if (strpos($contentType, 'image/') !== 0) {
    fail(415, 'invalid content type');
}

header('Content-Type: ' . ($contentType ?: DEFAULT_IMAGE_CONTENT_TYPE));
header('Content-Length: ' . strlen($data));
header('Cache-Control: public, max-age=2592000, immutable');
header('Cross-Origin-Resource-Policy: cross-origin');
header('X-Content-Type-Options: nosniff');
echo $data;
