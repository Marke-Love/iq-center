<?php
// Общий код бэкенда заявок: конфиг, база SQLite, справочники.
// Подключается из send.php и admin/index.php; напрямую из браузера закрыт в .htaccess.

if (!defined('IQ_ROOT')) {
    define('IQ_ROOT', __DIR__);
}

function iq_config(): array {
    static $config = null;
    if ($config === null) {
        $file = IQ_ROOT . '/config.php';
        $config = is_file($file) ? (array) require $file : [];
    }
    return $config;
}

// База лежит на уровень выше папки сайта: так её не скачать по ссылке
// и она не затрётся при повторной заливке сайта. Если туда писать нельзя — папка data/ рядом (закрыта .htaccess).
function iq_db_path(): string {
    $config = iq_config();
    if (!empty($config['db_path'])) {
        return $config['db_path'];
    }
    $outside = dirname(IQ_ROOT) . '/leads-data';
    if (is_dir($outside) || @mkdir($outside, 0700, true)) {
        if (is_writable($outside)) {
            return $outside . '/leads.sqlite';
        }
    }
    $inside = IQ_ROOT . '/data';
    if (!is_dir($inside)) {
        @mkdir($inside, 0700, true);
    }
    if (!is_file($inside . '/.htaccess')) {
        @file_put_contents($inside . '/.htaccess', "Require all denied\n");
    }
    return $inside . '/leads.sqlite';
}

function iq_db(): PDO {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }
    $pdo = new PDO('sqlite:' . iq_db_path());
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec('PRAGMA journal_mode = WAL');
    $pdo->exec('CREATE TABLE IF NOT EXISTS leads (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL,
        name       TEXT NOT NULL DEFAULT \'\',
        phone      TEXT NOT NULL,
        exam       TEXT NOT NULL DEFAULT \'\',
        subject    TEXT NOT NULL DEFAULT \'\',
        source     TEXT NOT NULL DEFAULT \'\',
        page       TEXT NOT NULL DEFAULT \'\',
        utm        TEXT NOT NULL DEFAULT \'{}\',
        status     TEXT NOT NULL DEFAULT \'new\',
        comment    TEXT NOT NULL DEFAULT \'\',
        search     TEXT NOT NULL DEFAULT \'\'
    )');
    $pdo->exec('CREATE INDEX IF NOT EXISTS leads_created ON leads (created_at)');
    return $pdo;
}

// Статусы заявки для администратора
const IQ_STATUSES = [
    'new'      => 'Новая',
    'called'   => 'Перезвонили',
    'booked'   => 'Записан',
    'declined' => 'Отказ',
    'spam'     => 'Спам',
];

// Откуда нажали «Записаться» (source из формы)
const IQ_SOURCES = [
    'hero'       => 'Первый экран',
    'header'     => 'Шапка',
    'prices'     => 'Стоимость',
    'countdown'  => 'Блок «До/после»',
    'final'      => 'Форма внизу',
    'footer'     => 'Подвал',
    'mobile_bar' => 'Мобильная панель',
    'modal'      => 'Окно записи',
];

// SQLite сравнивает кириллицу с учётом регистра, поэтому для поиска храним текст в нижнем регистре
function iq_search_text(string ...$parts): string {
    return mb_strtolower(implode(' ', $parts), 'UTF-8');
}

function iq_phone_pretty(string $phone): string {
    if (strlen($phone) !== 11) {
        return $phone;
    }
    return sprintf('+7 (%s) %s-%s-%s', substr($phone, 1, 3), substr($phone, 4, 3), substr($phone, 7, 2), substr($phone, 9, 2));
}

// В базе время в UTC, показываем по Москве
function iq_time(string $utc, string $format = 'd.m.Y H:i'): string {
    $dt = new DateTime($utc, new DateTimeZone('UTC'));
    $dt->setTimezone(new DateTimeZone('Europe/Moscow'));
    return $dt->format($format);
}

// ---------- Настройки уведомлений (хранятся в базе, меняются в /admin/?view=settings) ----------

function iq_settings_defaults(): array {
    $config = iq_config();
    return [
        'notify_email' => (string) ($config['email_to'] ?? ''),
        'mail_method'  => !empty($config['email_to']) ? 'mail' : 'off', // off | mail | smtp
        'from_email'   => (string) ($config['email_from'] ?? ''),
        'from_name'    => 'Заявка с сайта',
        'smtp_host'    => 'smtp.yandex.ru',
        'smtp_port'    => '465',
        'smtp_secure'  => 'ssl', // ssl | tls | none
        'smtp_user'    => '',
        'smtp_pass'    => '',
        'tg_enabled'   => '0',
        'tg_token'     => '',
        'tg_chat'      => '',
        'status_email' => '',
        'status_tg'    => '',
    ];
}

function iq_settings(): array {
    $db = iq_db();
    $db->exec('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
    $stored = [];
    foreach ($db->query('SELECT key, value FROM settings') as $row) {
        $stored[$row['key']] = $row['value'];
    }
    return array_merge(iq_settings_defaults(), $stored);
}

function iq_settings_save(array $values): void {
    $db = iq_db();
    $db->exec('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
    $stmt = $db->prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    foreach ($values as $k => $v) {
        $stmt->execute([$k, (string) $v]);
    }
}

// Список адресов «a@b.ru, c@d.ru» → массив корректных адресов
function iq_email_list(string $raw): array {
    $list = [];
    foreach (preg_split('/[\s,;]+/', $raw, -1, PREG_SPLIT_NO_EMPTY) as $email) {
        if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $list[] = $email;
        }
    }
    return array_values(array_unique($list));
}

function iq_site_base(): string {
    $host = preg_replace('/[^a-z0-9.:-]/i', '', (string) ($_SERVER['HTTP_HOST'] ?? ''));
    return $host === '' ? '' : 'https://' . $host;
}

function iq_lead_lines(array $lead): array {
    return [
        'Имя: ' . ($lead['name'] !== '' ? $lead['name'] : '—'),
        'Телефон: ' . iq_phone_pretty($lead['phone']),
        'Экзамен: ' . ($lead['exam'] !== '' ? $lead['exam'] : '—'),
        'Предмет: ' . ($lead['subject'] !== '' ? $lead['subject'] : 'не выбран'),
        'Кнопка: ' . (IQ_SOURCES[$lead['source']] ?? ($lead['source'] !== '' ? $lead['source'] : '—')),
        'Время (МСК): ' . iq_time($lead['created_at']),
    ];
}

function iq_mime_header(string $text): string {
    return '=?UTF-8?B?' . base64_encode($text) . '?=';
}

// Отправка письма выбранным способом. Ошибку бросает исключением с понятным текстом.
function iq_send_mail(array $s, string $subject, string $body): void {
    $to = iq_email_list($s['notify_email']);
    if (!$to) {
        throw new RuntimeException('Не указан адрес, на который приходят заявки.');
    }
    $from = $s['from_email'];
    if ($s['mail_method'] === 'smtp' && $from === '') {
        $from = $s['smtp_user'];
    }
    if (!filter_var($from, FILTER_VALIDATE_EMAIL)) {
        $from = 'noreply@' . preg_replace('/^www\.|:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? 'localhost'));
    }
    $fromHeader = ($s['from_name'] !== '' ? iq_mime_header($s['from_name']) . ' ' : '') . '<' . $from . '>';
    $headers = [
        'Date: ' . date('r'),
        'From: ' . $fromHeader,
        'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . substr(strrchr($from, '@'), 1) . '>',
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
    ];
    $encodedBody = rtrim(chunk_split(base64_encode($body), 76, "\r\n"));

    if ($s['mail_method'] === 'smtp') {
        iq_smtp_send($s, $from, $to, array_merge($headers, [
            'To: ' . implode(', ', $to),
            'Subject: ' . iq_mime_header($subject),
        ]), $encodedBody);
        return;
    }
    if ($s['mail_method'] !== 'mail') {
        throw new RuntimeException('Отправка писем выключена.');
    }
    // mail() сам добавляет To и Subject
    $headers = array_values(array_filter($headers, function ($h) { return strpos($h, 'Date:') !== 0; }));
    $ok = @mail(implode(', ', $to), iq_mime_header($subject), $encodedBody, implode("\r\n", $headers), '-f' . $from);
    if (!$ok) {
        throw new RuntimeException('Хостинг не принял письмо (функция mail() вернула ошибку). Попробуйте способ SMTP.');
    }
}

// Минимальный SMTP-клиент: SSL (465), STARTTLS (587) или без шифрования, вход AUTH LOGIN
function iq_smtp_send(array $s, string $from, array $to, array $headers, string $body): void {
    $host = trim($s['smtp_host']);
    $port = (int) $s['smtp_port'];
    $secure = $s['smtp_secure'];
    if ($host === '' || $port <= 0) {
        throw new RuntimeException('Не указан SMTP-хост или порт.');
    }
    $ctx = stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true, 'SNI_enabled' => true]]);
    $fp = @stream_socket_client(($secure === 'ssl' ? 'ssl://' : 'tcp://') . $host . ':' . $port, $errno, $errstr, 10, STREAM_CLIENT_CONNECT, $ctx);
    if (!$fp) {
        throw new RuntimeException("Не удалось подключиться к $host:$port. " . trim($errstr));
    }
    stream_set_timeout($fp, 15);

    $read = function () use ($fp) {
        $data = '';
        while (($line = fgets($fp, 1024)) !== false) {
            $data .= $line;
            if (strlen($line) < 4 || $line[3] === ' ') {
                break;
            }
        }
        return $data;
    };
    $expect = function ($codes, string $step) use ($read) {
        $resp = $read();
        if (!in_array((int) substr($resp, 0, 3), (array) $codes, true)) {
            $resp = trim($resp) !== '' ? trim(preg_replace('/\s+/', ' ', $resp)) : 'сервер не ответил';
            throw new RuntimeException("SMTP, шаг «{$step}»: {$resp}");
        }
        return $resp;
    };
    $cmd = function (string $line, $codes, string $step) use ($fp, $expect) {
        fwrite($fp, $line . "\r\n");
        return $expect($codes, $step);
    };

    try {
        $ehlo = preg_replace('/[^a-z0-9.-]/i', '', preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? ''))) ?: 'localhost';
        $expect(220, 'подключение');
        $cmd("EHLO $ehlo", 250, 'приветствие');
        if ($secure === 'tls') {
            $cmd('STARTTLS', 220, 'STARTTLS');
            $method = STREAM_CRYPTO_METHOD_TLS_CLIENT;
            if (defined('STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT')) {
                $method |= STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT;
            }
            if (!@stream_socket_enable_crypto($fp, true, $method)) {
                throw new RuntimeException('SMTP: не удалось включить шифрование STARTTLS.');
            }
            $cmd("EHLO $ehlo", 250, 'приветствие после STARTTLS');
        }
        if ($s['smtp_user'] !== '') {
            $cmd('AUTH LOGIN', 334, 'вход');
            $cmd(base64_encode($s['smtp_user']), 334, 'логин');
            $cmd(base64_encode($s['smtp_pass']), 235, 'пароль (проверьте логин и пароль приложения)');
        }
        $cmd("MAIL FROM:<$from>", 250, 'отправитель (адрес отправителя должен совпадать с логином)');
        foreach ($to as $rcpt) {
            $cmd("RCPT TO:<$rcpt>", [250, 251], 'получатель ' . $rcpt);
        }
        $cmd('DATA', 354, 'начало письма');
        $message = implode("\r\n", $headers) . "\r\n\r\n" . $body;
        $message = preg_replace('/^\./m', '..', $message);
        fwrite($fp, $message . "\r\n.\r\n");
        $expect(250, 'отправка письма');
        @fwrite($fp, "QUIT\r\n");
    } finally {
        fclose($fp);
    }
}

function iq_tg_send(array $s, string $html): void {
    $token = trim($s['tg_token']);
    $chat = trim($s['tg_chat']);
    if ($token === '' || $chat === '') {
        throw new RuntimeException('Не указан токен бота или chat ID.');
    }
    $url = 'https://api.telegram.org/bot' . $token . '/sendMessage';
    $payload = http_build_query(['chat_id' => $chat, 'text' => $html, 'parse_mode' => 'HTML', 'disable_web_page_preview' => 'true']);
    $resp = false;
    $netError = '';
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 8,
            CURLOPT_TIMEOUT => 12,
        ]);
        $resp = curl_exec($ch);
        $netError = curl_error($ch);
    } else {
        $ctx = stream_context_create(['http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/x-www-form-urlencoded',
            'content' => $payload,
            'timeout' => 12,
            'ignore_errors' => true,
        ]]);
        $resp = @file_get_contents($url, false, $ctx);
    }
    $json = is_string($resp) ? json_decode($resp, true) : null;
    if (!is_array($json) || empty($json['ok'])) {
        $why = is_array($json) && isset($json['description']) ? $json['description'] : ('нет ответа от Telegram ' . $netError);
        if (stripos($why, 'chat not found') !== false) {
            $why .= ' — напишите своему боту /start и проверьте chat ID';
        } elseif (stripos($why, 'Unauthorized') !== false || stripos($why, 'Not Found') !== false) {
            $why .= ' — проверьте токен бота';
        }
        throw new RuntimeException('Telegram: ' . str_replace($token, '***', trim($why)));
    }
}

function iq_tg_escape(string $text): string {
    return htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function iq_notify_status(string $channel, bool $ok, string $error = ''): void {
    iq_settings_save(['status_' . $channel => json_encode(['ok' => $ok, 'at' => gmdate('Y-m-d H:i:s'), 'error' => $error], JSON_UNESCAPED_UNICODE)]);
}

// Уведомления о новой заявке. Заявка к этому моменту уже в базе, поэтому ошибки здесь только записываем.
function iq_notify_lead(array $lead): void {
    $s = iq_settings();
    $lines = iq_lead_lines($lead);
    $base = iq_site_base();
    $adminUrl = $base !== '' ? $base . '/admin/?id=' . (int) $lead['id'] : '';

    if ($s['mail_method'] !== 'off' && $s['notify_email'] !== '') {
        try {
            $body = implode("\n", $lines) . ($adminUrl ? "\n\nОткрыть заявку: $adminUrl" : '');
            iq_send_mail($s, 'Заявка на пробник: ' . iq_phone_pretty($lead['phone']), $body);
            iq_notify_status('email', true);
        } catch (Throwable $e) {
            error_log('iq notify email: ' . $e->getMessage());
            iq_notify_status('email', false, $e->getMessage());
        }
    }

    if ($s['tg_enabled'] === '1') {
        try {
            $html = "🔔 <b>Новая заявка на пробник</b>\n" . implode("\n", array_map('iq_tg_escape', $lines));
            if ($adminUrl && !preg_match('~//(localhost|127\.|\[)~', $adminUrl)) {
                $html .= "\n\n<a href=\"" . iq_tg_escape($adminUrl) . '">Открыть в админке</a>';
            }
            iq_tg_send($s, $html);
            iq_notify_status('tg', true);
        } catch (Throwable $e) {
            error_log('iq notify tg: ' . $e->getMessage());
            iq_notify_status('tg', false, $e->getMessage());
        }
    }
}
