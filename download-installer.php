<?php
declare(strict_types=1);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET') {
    header('Location: https://hivetools.pro/download', true, 302);
    exit;
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    header('Allow: GET, POST');
    exit('Open the Hive download page and sign in first.');
}

$token = $_POST['access_token'] ?? '';
if (!is_string($token) || strlen($token) < 20 || strlen($token) > 8192 || preg_match('/[^A-Za-z0-9._-]/', $token)) {
    http_response_code(401);
    header('Content-Type: text/plain; charset=utf-8');
    exit('A valid Hive account is required. Sign in at /download and try again.');
}

$installer = __DIR__ . '/downloads/public-beta-v0.0.1.exe';
if (!is_file($installer) || !is_readable($installer)) {
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    exit('The installer is missing from the website host. Please contact Hive support.');
}
if (!function_exists('curl_init')) {
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    exit('Account verification is unavailable on this host. Please contact Hive support.');
}

$curl = curl_init('https://nqkmnmwbmikbgopwkvse.supabase.co/auth/v1/user');
if ($curl === false) {
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    exit('Account verification is temporarily unavailable. Please try again later.');
}
curl_setopt_array($curl, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_CONNECTTIMEOUT => 8,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_HTTPHEADER => [
        'apikey: sb_publishable_p5TvTFyNO0-kS5yUQSkRXw_GBSsHec4',
        'Authorization: Bearer ' . $token,
        'Accept: application/json',
    ],
]);
$body = curl_exec($curl);
$status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
curl_close($curl);

if ($body === false || $status === 0 || $status >= 500) {
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    exit('Hive could not verify your account right now. Please try again shortly.');
}
$user = json_decode($body, true);
if ($status !== 200 || !is_array($user) || empty($user['id']) || !empty($user['is_anonymous'])) {
    http_response_code(401);
    header('Content-Type: text/plain; charset=utf-8');
    exit('Your Hive session expired or is invalid. Return to /download, sign in, and try again.');
}

if (function_exists('set_time_limit')) {
    @set_time_limit(0);
}
while (ob_get_level() > 0) {
    ob_end_clean();
}
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="public-beta-v0.0.1.exe"');
header('Content-Length: ' . (string) filesize($installer));
header('Cache-Control: private, no-store, no-cache, must-revalidate');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');
readfile($installer);
exit;
