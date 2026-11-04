<?php
// Приём заявок с сайта → база (смотреть в /admin/) + письмо на почту, если она указана в config.php.

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require __DIR__ . '/leads-lib.php';

function reply(int $code, array $data): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    reply(405, ['ok' => false, 'error' => 'method']);
}

$input = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($input)) {
    reply(400, ['ok' => false, 'error' => 'bad_request']);
}

// Защита от ботов: скрытое поле (люди его не видят) и слишком быстрое заполнение формы.
// Боту отвечаем «успешно», чтобы он не подбирал обход.
$elapsed = (int) ($input['t'] ?? 0);
if (!empty($input['website']) || $elapsed < 2500) {
    reply(200, ['ok' => true]);
}

function clean($v, int $max = 200): string {
    $v = is_string($v) ? $v : '';
    $v = trim(preg_replace('/\s+/u', ' ', strip_tags($v)));
    return mb_substr($v, 0, $max);
}

$name    = clean($input['name'] ?? '', 80);
$phone   = preg_replace('/\D/', '', (string) ($input['phone'] ?? ''));
$exam    = in_array($input['exam'] ?? '', ['ЕГЭ', 'ОГЭ'], true) ? $input['exam'] : '';
$subject = clean($input['subject'] ?? '', 80);
$source  = clean($input['source'] ?? '', 40);
$page    = clean($input['page'] ?? '', 300);
$utm     = [];
if (isset($input['utm']) && is_array($input['utm'])) {
    foreach ($input['utm'] as $k => $v) {
        if (preg_match('/^(utm_[a-z]+|yclid)$/', (string) $k)) {
            $utm[$k] = clean($v, 200);
        }
    }
}

// Ссылки в имени — верный признак спама
if (preg_match('~https?://|www\.~i', $name)) {
    reply(200, ['ok' => true]);
}

if (strlen($phone) === 11 && $phone[0] === '8') {
    $phone = '7' . substr($phone, 1);
}
if (strlen($phone) !== 11 || $phone[0] !== '7') {
    reply(422, ['ok' => false, 'error' => 'phone']);
}

// Ограничение частоты: одна заявка с IP раз в 30 секунд (IP в базу не сохраняется)
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$lockDir = sys_get_temp_dir() . '/iq_leads';
@mkdir($lockDir, 0700, true);
$lock = $lockDir . '/' . md5($ip);
if (is_file($lock) && time() - filemtime($lock) < 30) {
    reply(429, ['ok' => false, 'error' => 'too_many']);
}
@touch($lock);

try {
    $stmt = iq_db()->prepare('INSERT INTO leads (created_at, name, phone, exam, subject, source, page, utm, search)
        VALUES (:created_at, :name, :phone, :exam, :subject, :source, :page, :utm, :search)');
    $stmt->execute([
        ':created_at' => gmdate('Y-m-d H:i:s'),
        ':name'       => $name,
        ':phone'      => $phone,
        ':exam'       => $exam,
        ':subject'    => $subject,
        ':source'     => $source,
        ':page'       => $page,
        ':utm'        => json_encode($utm, JSON_UNESCAPED_UNICODE),
        ':search'     => iq_search_text($name, $subject),
    ]);
} catch (Throwable $e) {
    error_log('iq leads: ' . $e->getMessage());
    @unlink($lock);
    reply(502, ['ok' => false, 'error' => 'storage']);
}

// Письмо — дополнительный канал: если почта не настроена или не дошла, заявка всё равно сохранена
$config = iq_config();
if (!empty($config['email_to'])) {
    $phonePretty = iq_phone_pretty($phone);
    $lines = [
        'Имя: ' . ($name ?: '—'),
        'Телефон: ' . $phonePretty,
        'Экзамен: ' . ($exam ?: '—'),
        'Предмет: ' . ($subject ?: 'не выбран'),
        'Кнопка: ' . (IQ_SOURCES[$source] ?? ($source ?: '—')),
        'Время: ' . iq_time(gmdate('Y-m-d H:i:s')),
    ];
    foreach ($utm as $k => $v) {
        $lines[] = "$k: $v";
    }
    $from = $config['email_from'] ?? ('noreply@' . ($_SERVER['HTTP_HOST'] ?? 'localhost'));
    $subjectLine = '=?UTF-8?B?' . base64_encode('Заявка на пробник: ' . $phonePretty) . '?=';
    $headers = implode("\r\n", [
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        'From: ' . $from,
    ]);
    @mail($config['email_to'], $subjectLine, implode("\n", $lines), $headers);
}

reply(200, ['ok' => true]);
