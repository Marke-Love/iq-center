<?php
// Приём заявок с сайта → Telegram + Email.
// Настройки — в config.php рядом с этим файлом (скопируйте config.example.php).

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function reply(int $code, array $data): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    reply(405, ['ok' => false, 'error' => 'method']);
}

$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    reply(500, ['ok' => false, 'error' => 'config_missing']);
}
$config = require $configFile;

$input = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($input)) {
    reply(400, ['ok' => false, 'error' => 'bad_request']);
}

// Honeypot: люди это поле не видят
if (!empty($input['website'])) {
    reply(200, ['ok' => true]);
}

function clean($v, int $max = 200): string {
    $v = is_string($v) ? $v : '';
    $v = trim(preg_replace('/\s+/u', ' ', strip_tags($v)));
    return mb_substr($v, 0, $max);
}

$name    = clean($input['name'] ?? '', 80);
$phone   = preg_replace('/\D/', '', (string)($input['phone'] ?? ''));
$exam    = in_array($input['exam'] ?? '', ['ЕГЭ', 'ОГЭ'], true) ? $input['exam'] : '';
$subject = clean($input['subject'] ?? '', 80);
$source  = clean($input['source'] ?? '', 40);
$page    = clean($input['page'] ?? '', 300);
$utm     = [];
if (isset($input['utm']) && is_array($input['utm'])) {
    foreach ($input['utm'] as $k => $v) {
        if (preg_match('/^(utm_[a-z]+|yclid)$/', (string)$k)) $utm[$k] = clean($v, 200);
    }
}

if (strlen($phone) === 11 && $phone[0] === '8') $phone = '7' . substr($phone, 1);
if (strlen($phone) !== 11 || $phone[0] !== '7') {
    reply(422, ['ok' => false, 'error' => 'phone']);
}

// Ограничение частоты: одна заявка с IP раз в 30 секунд
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$lockDir = sys_get_temp_dir() . '/iq_leads';
@mkdir($lockDir, 0700, true);
$lock = $lockDir . '/' . md5($ip);
if (is_file($lock) && time() - filemtime($lock) < 30) {
    reply(429, ['ok' => false, 'error' => 'too_many']);
}
@touch($lock);

$phonePretty = sprintf('+7 (%s) %s-%s-%s', substr($phone, 1, 3), substr($phone, 4, 3), substr($phone, 7, 2), substr($phone, 9, 2));
$time = (new DateTime('now', new DateTimeZone('Europe/Moscow')))->format('d.m.Y H:i');

$lines = [
    'Имя: ' . ($name ?: '—'),
    'Телефон: ' . $phonePretty,
    'Экзамен: ' . ($exam ?: '—'),
    'Предмет: ' . ($subject ?: 'не выбран'),
    'Кнопка: ' . ($source ?: '—'),
    'Время: ' . $time,
];
foreach ($utm as $k => $v) $lines[] = "$k: $v";
if ($page) $lines[] = 'Страница: ' . $page;

$sent = false;

// Telegram
if (!empty($config['tg_token']) && !empty($config['tg_chat_id'])) {
    $esc = fn($s) => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
    $text = "<b>🎓 Новая заявка на пробник</b>\n\n" . implode("\n", array_map($esc, $lines));
    $ch = curl_init('https://api.telegram.org/bot' . $config['tg_token'] . '/sendMessage');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_POSTFIELDS => [
            'chat_id' => $config['tg_chat_id'],
            'text' => $text,
            'parse_mode' => 'HTML',
            'disable_web_page_preview' => 'true',
        ],
    ]);
    $res = json_decode((string)curl_exec($ch), true);
    curl_close($ch);
    if (!empty($res['ok'])) $sent = true;
}

// Email
if (!empty($config['email_to'])) {
    $from = $config['email_from'] ?? ('noreply@' . ($_SERVER['HTTP_HOST'] ?? 'localhost'));
    $subjectLine = '=?UTF-8?B?' . base64_encode('Заявка на пробник: ' . $phonePretty) . '?=';
    $headers = implode("\r\n", [
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        'From: ' . $from,
    ]);
    if (@mail($config['email_to'], $subjectLine, implode("\n", $lines), $headers)) $sent = true;
}

if (!$sent) {
    @unlink($lock);
    reply(502, ['ok' => false, 'error' => 'delivery']);
}

reply(200, ['ok' => true]);
