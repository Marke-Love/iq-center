<?php
// Приём заявок с сайта → база (смотреть в /admin/) + письмо и/или Telegram по настройкам в /admin/?view=settings.

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

$lead = [
    'created_at' => gmdate('Y-m-d H:i:s'),
    'name'       => $name,
    'phone'      => $phone,
    'exam'       => $exam,
    'subject'    => $subject,
    'source'     => $source,
];

try {
    $stmt = iq_db()->prepare('INSERT INTO leads (created_at, name, phone, exam, subject, source, page, utm, search)
        VALUES (:created_at, :name, :phone, :exam, :subject, :source, :page, :utm, :search)');
    $stmt->execute([
        ':created_at' => $lead['created_at'],
        ':name'       => $name,
        ':phone'      => $phone,
        ':exam'       => $exam,
        ':subject'    => $subject,
        ':source'     => $source,
        ':page'       => $page,
        ':utm'        => json_encode($utm, JSON_UNESCAPED_UNICODE),
        ':search'     => iq_search_text($name, $subject),
    ]);
    $lead['id'] = (int) iq_db()->lastInsertId();
} catch (Throwable $e) {
    error_log('iq leads: ' . $e->getMessage());
    @unlink($lock);
    reply(502, ['ok' => false, 'error' => 'storage']);
}

// Посетитель сразу получает ответ «заявка принята», а письмо и Telegram отправляются уже после.
// Уведомления — дополнительный канал: если они не дошли, заявка всё равно сохранена в /admin/.
http_response_code(200);
echo json_encode(['ok' => true]);
if (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request();
}
ignore_user_abort(true);
@set_time_limit(60);
iq_notify_lead($lead);
