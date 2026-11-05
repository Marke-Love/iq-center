<?php
// Админка заявок: вход по паролю из config.php, фильтры, статусы, комментарии, выгрузка в CSV,
// настройки уведомлений (почта через хостинг или SMTP, Telegram) с проверкой отправки.

define('IQ_ROOT', dirname(__DIR__));
require IQ_ROOT . '/leads-lib.php';

header('X-Robots-Tag: noindex, nofollow');
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header('Cache-Control: no-store');

$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
session_name('iq_admin');
session_set_cookie_params(['lifetime' => 0, 'path' => '/admin/', 'secure' => $https, 'httponly' => true, 'samesite' => 'Strict']);
session_start();

function h($v): string {
    return htmlspecialchars((string) $v, ENT_QUOTES, 'UTF-8');
}

function csrf(): string {
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(16));
    }
    return $_SESSION['csrf'];
}

function check_csrf(): void {
    // пустой токен не принимаем: сразу после входа он ещё не создан
    $expected = (string) ($_SESSION['csrf'] ?? '');
    if ($expected === '' || !hash_equals($expected, (string) ($_POST['csrf'] ?? ''))) {
        http_response_code(400);
        exit('Сессия устарела. Обновите страницу.');
    }
}

function redirect(string $to): void {
    header('Location: ' . $to);
    exit;
}

// ---------- Вход ----------

$config = iq_config();
$hash = (string) ($config['admin_password_hash'] ?? '');
$action = $_POST['action'] ?? $_GET['action'] ?? '';

// Подбор пароля: не больше 5 неудачных попыток за 15 минут с одного IP
$throttleFile = sys_get_temp_dir() . '/iq_admin_' . md5($_SERVER['REMOTE_ADDR'] ?? '');
$fails = is_file($throttleFile) && time() - filemtime($throttleFile) < 900 ? (int) file_get_contents($throttleFile) : 0;

$loginError = '';
if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($fails >= 5) {
        $loginError = 'Слишком много попыток. Попробуйте через 15 минут.';
    } elseif ($hash !== '' && password_verify((string) ($_POST['password'] ?? ''), $hash)) {
        @unlink($throttleFile);
        session_regenerate_id(true);
        $_SESSION['auth'] = true;
        $_SESSION['seen'] = time();
        redirect('./');
    } else {
        file_put_contents($throttleFile, (string) ($fails + 1));
        sleep(1);
        $loginError = 'Неверный пароль.';
    }
}

if ($action === 'logout') {
    $_SESSION = [];
    session_destroy();
    redirect('./');
}

// Сессия живёт 8 часов без активности
if (!empty($_SESSION['auth']) && time() - ($_SESSION['seen'] ?? 0) > 8 * 3600) {
    $_SESSION = [];
}
$authed = !empty($_SESSION['auth']);
if ($authed) {
    $_SESSION['seen'] = time();
}

// ---------- Настройки отправки: сохранение и проверка ----------

$settingsErrors = [];
$settingsInput = null;
if ($authed && $_SERVER['REQUEST_METHOD'] === 'POST' && in_array($action, ['settings_save', 'test_email', 'test_tg'], true)) {
    check_csrf();
    if ($action === 'settings_save') {
        $in = function (string $k, int $max = 200): string {
            return mb_substr(trim((string) ($_POST[$k] ?? '')), 0, $max);
        };
        $v = [
            'notify_email' => $in('notify_email', 500),
            'mail_method'  => in_array($_POST['mail_method'] ?? '', ['off', 'mail', 'smtp'], true) ? $_POST['mail_method'] : 'off',
            'from_email'   => $in('from_email'),
            'from_name'    => str_replace(["\r", "\n"], '', $in('from_name', 80)),
            'smtp_host'    => $in('smtp_host'),
            'smtp_port'    => (string) (int) ($_POST['smtp_port'] ?? 0),
            'smtp_secure'  => in_array($_POST['smtp_secure'] ?? '', ['ssl', 'tls', 'none'], true) ? $_POST['smtp_secure'] : 'ssl',
            'smtp_user'    => $in('smtp_user'),
            'tg_enabled'   => ($_POST['tg_enabled'] ?? '') === '1' ? '1' : '0',
            'tg_chat'      => $in('tg_chat', 64),
        ];
        // Пароль и токен на страницу не выводятся: пустое поле — оставить как было
        $pass = (string) ($_POST['smtp_pass'] ?? '');
        $token = trim((string) ($_POST['tg_token'] ?? ''));
        if ($pass !== '') {
            $v['smtp_pass'] = str_replace(' ', '', $pass); // Яндекс показывает пароль приложения с пробелами
        }
        if (!empty($_POST['smtp_pass_clear'])) {
            $v['smtp_pass'] = '';
        }
        if ($token !== '') {
            $v['tg_token'] = $token;
        }
        if (!empty($_POST['tg_token_clear'])) {
            $v['tg_token'] = '';
        }

        $raw = preg_split('/[\s,;]+/', $v['notify_email'], -1, PREG_SPLIT_NO_EMPTY);
        if (count($raw) !== count(iq_email_list($v['notify_email']))) {
            $settingsErrors[] = 'Проверьте адрес получателя: можно указать один или несколько адресов через запятую.';
        }
        if ($v['mail_method'] !== 'off' && !$raw) {
            $settingsErrors[] = 'Укажите адрес, на который приходят заявки, или выберите «Не отправлять письма».';
        }
        if ($v['from_email'] !== '' && !filter_var($v['from_email'], FILTER_VALIDATE_EMAIL)) {
            $settingsErrors[] = 'Email отправителя указан с ошибкой.';
        }
        if ($v['mail_method'] === 'smtp') {
            if (!preg_match('/^[a-z0-9.-]+$/i', $v['smtp_host'])) {
                $settingsErrors[] = 'Укажите SMTP-хост, например smtp.yandex.ru.';
            }
            if ((int) $v['smtp_port'] < 1 || (int) $v['smtp_port'] > 65535) {
                $settingsErrors[] = 'Укажите порт SMTP: 465 для SSL или 587 для STARTTLS.';
            }
        }
        if ($token !== '' && !preg_match('/^\d+:[A-Za-z0-9_-]{30,}$/', $token)) {
            $settingsErrors[] = 'Токен бота выглядит неверно. Его выдаёт @BotFather, вид: 123456789:AA…';
        }
        if ($v['tg_chat'] !== '' && !preg_match('/^(-?\d{1,20}|@[A-Za-z0-9_]{5,})$/', $v['tg_chat'])) {
            $settingsErrors[] = 'Chat ID — это число (например 123456789, у групп начинается с минуса).';
        }
        if ($v['tg_enabled'] === '1') {
            $current = iq_settings();
            if ($v['tg_chat'] === '' || (($v['tg_token'] ?? $current['tg_token']) === '')) {
                $settingsErrors[] = 'Для отправки в Telegram нужны токен бота и chat ID.';
            }
        }

        if ($settingsErrors) {
            $settingsInput = $v; // покажем форму с введёнными значениями, без редиректа
            $_GET['view'] = 'settings';
        } else {
            iq_settings_save($v);
            $_SESSION['flash'] = ['ok' => true, 'msg' => 'Настройки сохранены.'];
            redirect('./?view=settings');
        }
    } else {
        $s = iq_settings();
        try {
            if ($action === 'test_email') {
                if ($s['mail_method'] === 'off') {
                    throw new RuntimeException('Отправка писем выключена — выберите способ и сохраните настройки.');
                }
                iq_send_mail($s, 'Проверка отправки заявок', "Это тестовое письмо из админки сайта.\nЕсли вы его видите — заявки будут приходить на эту почту.\n\nВремя (МСК): " . iq_time(gmdate('Y-m-d H:i:s')));
                iq_notify_status('email', true);
                $_SESSION['flash'] = ['ok' => true, 'msg' => 'Тестовое письмо отправлено на ' . implode(', ', iq_email_list($s['notify_email'])) . '. Если его нет во «Входящих», проверьте «Спам».'];
            } else {
                iq_tg_send($s, "✅ <b>Проверка связи</b>\nЗаявки с сайта будут приходить сюда.");
                iq_notify_status('tg', true);
                $_SESSION['flash'] = ['ok' => true, 'msg' => 'Сообщение отправлено в Telegram.'];
            }
        } catch (Throwable $e) {
            iq_notify_status($action === 'test_email' ? 'email' : 'tg', false, $e->getMessage());
            $_SESSION['flash'] = ['ok' => false, 'msg' => $e->getMessage()];
        }
        redirect('./?view=settings');
    }
}

// ---------- Действия ----------

if ($authed && $_SERVER['REQUEST_METHOD'] === 'POST' && $action !== 'login' && !$settingsErrors) {
    check_csrf();
    $id = (int) ($_POST['id'] ?? 0);
    $back = (string) ($_POST['back'] ?? './');
    if (strpos($back, './') !== 0) {
        $back = './';
    }
    $db = iq_db();
    if ($action === 'status' && isset(IQ_STATUSES[$_POST['status'] ?? ''])) {
        $db->prepare('UPDATE leads SET status = ? WHERE id = ?')->execute([$_POST['status'], $id]);
    } elseif ($action === 'save') {
        $status = isset(IQ_STATUSES[$_POST['status'] ?? '']) ? $_POST['status'] : 'new';
        $comment = mb_substr(trim((string) ($_POST['comment'] ?? '')), 0, 2000);
        $db->prepare('UPDATE leads SET status = ?, comment = ? WHERE id = ?')->execute([$status, $comment, $id]);
    } elseif ($action === 'delete') {
        $db->prepare('DELETE FROM leads WHERE id = ?')->execute([$id]);
        if (strpos($back, './?id=') === 0) {
            $back = './';
        }
    }
    redirect($back);
}

// ---------- Фильтры ----------

$f = [
    'q'      => trim((string) ($_GET['q'] ?? '')),
    'phone'  => preg_replace('/\D/', '', (string) ($_GET['phone'] ?? '')),
    'exam'   => in_array($_GET['exam'] ?? '', ['ЕГЭ', 'ОГЭ'], true) ? $_GET['exam'] : '',
    'status' => isset(IQ_STATUSES[$_GET['status'] ?? '']) ? $_GET['status'] : '',
    'source' => isset(IQ_SOURCES[$_GET['source'] ?? '']) ? $_GET['source'] : '',
    'from'   => preg_match('/^\d{4}-\d{2}-\d{2}$/', $_GET['from'] ?? '') ? $_GET['from'] : '',
    'to'     => preg_match('/^\d{4}-\d{2}-\d{2}$/', $_GET['to'] ?? '') ? $_GET['to'] : '',
];

// Даты в фильтре — московские, в базе — UTC
function msk_to_utc(string $date, string $time): string {
    $dt = new DateTime("$date $time", new DateTimeZone('Europe/Moscow'));
    $dt->setTimezone(new DateTimeZone('UTC'));
    return $dt->format('Y-m-d H:i:s');
}

$where = [];
$params = [];
if ($f['q'] !== '') {
    $where[] = 'search LIKE :q';
    $params[':q'] = '%' . iq_search_text($f['q']) . '%';
}
if ($f['phone'] !== '') {
    $where[] = 'phone LIKE :phone';
    $params[':phone'] = '%' . $f['phone'] . '%';
}
foreach (['exam', 'status', 'source'] as $k) {
    if ($f[$k] !== '') {
        $where[] = "$k = :$k";
        $params[":$k"] = $f[$k];
    }
}
if ($f['from'] !== '') {
    $where[] = 'created_at >= :from';
    $params[':from'] = msk_to_utc($f['from'], '00:00:00');
}
if ($f['to'] !== '') {
    $where[] = 'created_at <= :to';
    $params[':to'] = msk_to_utc($f['to'], '23:59:59');
}
$whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';
$filterQuery = http_build_query(array_filter($f, 'strlen'));

// ---------- Выгрузка CSV (открывается в Excel) ----------

if ($authed && $action === 'csv') {
    $stmt = iq_db()->prepare("SELECT * FROM leads $whereSql ORDER BY created_at DESC");
    $stmt->execute($params);
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="zayavki-' . date('Y-m-d') . '.csv"');
    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF");
    fputcsv($out, ['Дата (МСК)', 'Имя', 'Телефон', 'Экзамен', 'Предмет', 'Откуда', 'Статус', 'Комментарий', 'Метки'], ';', '"', '\\');
    foreach ($stmt as $r) {
        $utm = json_decode($r['utm'], true) ?: [];
        fputcsv($out, [
            iq_time($r['created_at']),
            $r['name'],
            iq_phone_pretty($r['phone']),
            $r['exam'],
            $r['subject'],
            IQ_SOURCES[$r['source']] ?? $r['source'],
            IQ_STATUSES[$r['status']] ?? $r['status'],
            $r['comment'],
            implode(', ', array_map(function ($k, $v) { return "$k=$v"; }, array_keys($utm), $utm)),
        ], ';', '"', '\\');
    }
    exit;
}

// ---------- Разметка ----------

function page_start(string $title): void { ?>
<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title><?= h($title) ?> · Заявки IQ Center</title>
<style>
  :root { --ink:#2d2df0; --ink-soft:#e6e8ff; --paper:#f3f5ff; --grid:#cfd4f5; --text:#12122b; --muted:#5a5d80; --check:#ff5a1f; --ok:#16a34a; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--paper); color:var(--text); font:15px/1.45 -apple-system, "Segoe UI", Roboto, Arial, sans-serif; }
  a { color:var(--ink); }
  .wrap { max-width:1280px; margin:0 auto; padding:20px 16px 48px; }
  .top { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:16px; }
  .top h1 { margin:0; font-size:20px; }
  .card { background:#fff; border:1px solid var(--grid); border-radius:16px; padding:20px; margin-bottom:16px; }
  .filters { display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:12px 16px; align-items:end; }
  .range { display:flex; align-items:center; gap:8px; }
  .range input { flex:1; min-width:0; }
  @media (min-width:640px) { .period { grid-column:span 2; } }
  label { display:block; font-weight:600; font-size:13px; margin-bottom:6px; }
  input, select, textarea { width:100%; padding:9px 11px; border:1px solid var(--grid); border-radius:10px; font:inherit; background:#fff; color:inherit; }
  input:focus, select:focus, textarea:focus { outline:2px solid var(--ink); outline-offset:-1px; }
  .btn { display:inline-flex; align-items:center; justify-content:center; gap:6px; padding:9px 16px; border-radius:10px; border:1px solid transparent; font:inherit; font-weight:600; cursor:pointer; text-decoration:none; white-space:nowrap; }
  .btn-primary { background:var(--ink); color:#fff; }
  .btn-light { background:var(--ink-soft); color:var(--ink); }
  .btn-danger { background:#fff0eb; color:#c2410c; }
  .btns { display:flex; gap:8px; flex-wrap:wrap; }
  .summary { display:flex; gap:16px; align-items:center; justify-content:space-between; flex-wrap:wrap; margin-bottom:12px; }
  .summary b { font-size:18px; }
  .table-wrap { overflow-x:auto; }
  table { width:100%; border-collapse:collapse; min-width:900px; }
  th { text-align:left; font-size:13px; color:var(--muted); font-weight:600; padding:10px; background:var(--paper); }
  td { padding:10px; border-top:1px solid var(--grid); vertical-align:top; }
  tr.is-new td:first-child { box-shadow: inset 3px 0 0 var(--check); }
  .muted { color:var(--muted); font-size:13px; }
  .status { padding:5px 8px; border-radius:8px; width:auto; font-size:13px; }
  .s-new { background:#fff0eb; } .s-called { background:var(--ink-soft); } .s-booked { background:#dcfce7; } .s-declined, .s-spam { background:#f1f1f4; }
  .detail { display:grid; grid-template-columns:180px 1fr; gap:8px 16px; margin:0 0 20px; }
  .detail dt { color:var(--muted); } .detail dd { margin:0; word-break:break-word; }
  .login { max-width:360px; margin:12vh auto 0; }
  .error { color:#c2410c; margin:10px 0 0; }
  .pager { display:flex; gap:6px; flex-wrap:wrap; margin-top:16px; }
  .pager a, .pager span { padding:6px 11px; border-radius:8px; background:#fff; border:1px solid var(--grid); text-decoration:none; }
  .pager span { background:var(--ink); color:#fff; border-color:var(--ink); }
  .settings h2 { font-size:18px; margin:24px 0 10px; } .settings h2:first-of-type { margin-top:0; }
  .settings fieldset { border:0; padding:0; margin:0; min-width:0; }
  .settings .row { display:grid; grid-template-columns:1fr 1fr; gap:14px 20px; }
  .settings .full { grid-column:1 / -1; }
  .settings [hidden] { display:none !important; }
  .hint { color:var(--muted); font-size:13px; margin:6px 0 12px; }
  .check { display:flex; align-items:center; gap:8px; font-weight:400; margin-top:8px; }
  .check input { width:auto; }
  .note { padding:12px 14px; border-radius:12px; margin:0 0 12px; font-size:14px; word-break:break-word; }
  .note.ok { background:#dcfce7; color:#14532d; } .note.bad { background:#fff0eb; color:#9a3412; }
  code { background:var(--paper); padding:1px 5px; border-radius:6px; }
  @media (max-width:640px) { .settings .row { grid-template-columns:1fr; } .top { flex-wrap:wrap; } }
  @media (max-width:640px) { .detail { grid-template-columns:1fr; } .detail dt { margin-top:8px; } }
</style>
</head>
<body>
<div class="wrap">
<?php }

function page_end(): void { ?>
</div>
<script>
  // подтверждение удаления и смена статуса прямо из списка
  document.addEventListener('submit', function (e) {
    if (e.target.matches('.js-delete') && !confirm('Удалить заявку? Это действие нельзя отменить.')) e.preventDefault();
  });
  document.addEventListener('change', function (e) {
    if (e.target.matches('.js-status')) e.target.form.submit();
  });
</script>
</body>
</html>
<?php }

function status_form(array $r, string $back): void { ?>
  <form method="post" style="margin:0">
    <input type="hidden" name="csrf" value="<?= h(csrf()) ?>">
    <input type="hidden" name="action" value="status">
    <input type="hidden" name="id" value="<?= (int) $r['id'] ?>">
    <input type="hidden" name="back" value="<?= h($back) ?>">
    <select name="status" class="status js-status s-<?= h($r['status']) ?>" aria-label="Статус заявки">
      <?php foreach (IQ_STATUSES as $k => $label): ?>
        <option value="<?= h($k) ?>" <?= $r['status'] === $k ? 'selected' : '' ?>><?= h($label) ?></option>
      <?php endforeach; ?>
    </select>
  </form>
<?php }

function delete_form(int $id, string $back): void { ?>
  <form method="post" class="js-delete" style="margin:0">
    <input type="hidden" name="csrf" value="<?= h(csrf()) ?>">
    <input type="hidden" name="action" value="delete">
    <input type="hidden" name="id" value="<?= $id ?>">
    <input type="hidden" name="back" value="<?= h($back) ?>">
    <button class="btn btn-danger" type="submit">Удалить</button>
  </form>
<?php }

// ---------- Экран входа ----------

if (!$authed) {
    page_start('Вход'); ?>
  <div class="card login">
    <h1 style="margin:0 0 16px;font-size:20px">Заявки IQ Center</h1>
    <?php if ($hash === ''): ?>
      <p>Пароль ещё не задан. Укажите <code>admin_password_hash</code> в файле <code>config.php</code> на хостинге — инструкция внутри <code>config.example.php</code>.</p>
    <?php else: ?>
      <form method="post">
        <input type="hidden" name="action" value="login">
        <label for="password">Пароль</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required autofocus>
        <button class="btn btn-primary" type="submit" style="width:100%;margin-top:14px">Войти</button>
        <?php if ($loginError): ?><p class="error"><?= h($loginError) ?></p><?php endif; ?>
      </form>
    <?php endif; ?>
  </div>
<?php
    page_end();
    exit;
}

try {
    $db = iq_db();
} catch (Throwable $e) {
    page_start('Ошибка');
    echo '<div class="card"><b>Не удалось открыть базу заявок.</b><p class="muted">' . h($e->getMessage()) . '</p><p>Проверьте, что на хостинге включено расширение PHP pdo_sqlite.</p></div>';
    page_end();
    exit;
}

$header = function (string $active = 'leads') { ?>
  <div class="top">
    <h1><a href="./" style="text-decoration:none;color:inherit">Заявки IQ Center</a></h1>
    <nav class="btns">
      <a class="btn <?= $active === 'leads' ? 'btn-primary' : 'btn-light' ?>" href="./">Заявки</a>
      <a class="btn <?= $active === 'settings' ? 'btn-primary' : 'btn-light' ?>" href="./?view=settings">Настройки отправки</a>
      <a class="btn btn-light" href="./?action=logout">Выйти</a>
    </nav>
  </div>
<?php };

// ---------- Настройки отправки ----------

if (($_GET['view'] ?? '') === 'settings') {
    $s = iq_settings();
    $form = $settingsInput ? array_merge($s, $settingsInput) : $s;
    $flash = $_SESSION['flash'] ?? null;
    unset($_SESSION['flash']);
    $statusLine = function (string $raw, string $what) {
        $st = json_decode($raw, true);
        if (!is_array($st)) {
            return '<p class="muted">' . h($what) . ': ещё не отправлялось.</p>';
        }
        $when = iq_time($st['at'], 'd.m.Y H:i');
        return $st['ok']
            ? '<p class="note ok">' . h($what) . ': последняя отправка ' . h($when) . ' — успешно.</p>'
            : '<p class="note bad">' . h($what) . ': ошибка ' . h($when) . ' — ' . h(preg_replace('/^Telegram: /', '', $st['error'])) . '</p>';
    };
    page_start('Настройки отправки');
    $header('settings'); ?>
  <?php if ($flash): ?><div class="note <?= $flash['ok'] ? 'ok' : 'bad' ?>" role="status"><?= h($flash['msg']) ?></div><?php endif; ?>
  <?php if ($settingsErrors): ?><div class="note bad" role="alert"><b>Настройки не сохранены:</b><br><?= implode('<br>', array_map('h', $settingsErrors)) ?></div><?php endif; ?>

  <form method="post" class="card settings">
    <input type="hidden" name="csrf" value="<?= h(csrf()) ?>">
    <input type="hidden" name="action" value="settings_save">

    <h2>Получатель уведомлений</h2>
    <div class="row">
      <div class="full">
        <label for="notify_email">Email, на который приходят заявки</label>
        <input id="notify_email" name="notify_email" value="<?= h($form['notify_email']) ?>" placeholder="markelovaov@yandex.ru">
        <p class="hint">Можно несколько адресов через запятую.</p>
      </div>
    </div>

    <h2>Способ отправки писем</h2>
    <div class="row">
      <div class="full">
        <label for="mail_method">Как отправлять письма о заявках</label>
        <select id="mail_method" name="mail_method">
          <option value="smtp" <?= $form['mail_method'] === 'smtp' ? 'selected' : '' ?>>Через почтовый ящик по SMTP (Яндекс, Mail.ru и др.) — надёжнее</option>
          <option value="mail" <?= $form['mail_method'] === 'mail' ? 'selected' : '' ?>>Обычная отправка с хостинга (без логина и пароля)</option>
          <option value="off" <?= $form['mail_method'] === 'off' ? 'selected' : '' ?>>Не отправлять письма</option>
        </select>
        <p class="hint" data-show="mail">Письмо отправляет сам хостинг. Просто, но такие письма чаще попадают в «Спам». В «Email отправителя» лучше указать ящик на домене сайта, созданный в панели reg.ru.</p>
        <p class="hint" data-show="smtp">Письмо уходит из вашего почтового ящика, как будто вы отправили его сами, — почти никогда не попадает в «Спам». Заполните блок SMTP ниже.</p>
      </div>
      <div data-show="mail smtp">
        <label for="from_email">Email отправителя (From)</label>
        <input id="from_email" name="from_email" value="<?= h($form['from_email']) ?>" placeholder="Для SMTP — как логин">
      </div>
      <div data-show="mail smtp">
        <label for="from_name">Имя отправителя</label>
        <input id="from_name" name="from_name" value="<?= h($form['from_name']) ?>" maxlength="80">
      </div>
    </div>

    <fieldset data-show="smtp">
      <h2>SMTP-сервер</h2>
      <p class="hint">Для Яндекс Почты: хост <code>smtp.yandex.ru</code>, SSL, порт 465. Логин — ваш адрес на Яндексе. Вместо обычного пароля нужен <b>пароль приложения</b>: id.yandex.ru → Безопасность → Пароли приложений → «Почта». В настройках почты Яндекса включите «Все настройки → Почтовые программы → разрешить доступ с сервера imap.yandex.ru». Email отправителя должен совпадать с логином или быть пустым.</p>
      <div class="row">
        <div>
          <label for="smtp_host">SMTP-хост</label>
          <input id="smtp_host" name="smtp_host" value="<?= h($form['smtp_host']) ?>">
        </div>
        <div>
          <label for="smtp_port">Порт</label>
          <input id="smtp_port" name="smtp_port" inputmode="numeric" value="<?= h($form['smtp_port']) ?>">
        </div>
        <div>
          <label for="smtp_secure">Шифрование</label>
          <select id="smtp_secure" name="smtp_secure">
            <option value="ssl" <?= $form['smtp_secure'] === 'ssl' ? 'selected' : '' ?>>SSL (порт 465)</option>
            <option value="tls" <?= $form['smtp_secure'] === 'tls' ? 'selected' : '' ?>>STARTTLS (порт 587)</option>
            <option value="none" <?= $form['smtp_secure'] === 'none' ? 'selected' : '' ?>>Без шифрования (не рекомендуется)</option>
          </select>
        </div>
        <div>
          <label for="smtp_user">Логин (обычно email)</label>
          <input id="smtp_user" name="smtp_user" value="<?= h($form['smtp_user']) ?>" autocomplete="off">
        </div>
        <div class="full">
          <label for="smtp_pass">Пароль приложения</label>
          <input id="smtp_pass" name="smtp_pass" type="password" autocomplete="new-password" placeholder="<?= $s['smtp_pass'] !== '' ? 'Сохранён — оставьте пустым, чтобы не менять' : 'Не задан' ?>">
          <?php if ($s['smtp_pass'] !== ''): ?><label class="check"><input type="checkbox" name="smtp_pass_clear" value="1"> Удалить сохранённый пароль</label><?php endif; ?>
        </div>
      </div>
    </fieldset>

    <h2>Дублирование в Telegram</h2>
    <p class="hint">Заявки будут приходить боту дополнительно к письму.
      1) Создайте бота у <b>@BotFather</b> (команда /newbot) и скопируйте токен.
      2) Откройте своего бота и нажмите «Запустить» (/start) — без этого бот не сможет вам писать.
      3) Узнайте свой chat ID у бота <b>@userinfobot</b>. Для группы: добавьте в неё своего бота, chat ID группы начинается с минуса.</p>
    <div class="row">
      <div class="full">
        <label for="tg_enabled">Отправлять заявки в Telegram</label>
        <select id="tg_enabled" name="tg_enabled">
          <option value="0" <?= $form['tg_enabled'] !== '1' ? 'selected' : '' ?>>Нет</option>
          <option value="1" <?= $form['tg_enabled'] === '1' ? 'selected' : '' ?>>Да</option>
        </select>
      </div>
      <div>
        <label for="tg_token">Токен бота</label>
        <input id="tg_token" name="tg_token" type="password" autocomplete="off" placeholder="<?= $s['tg_token'] !== '' ? 'Сохранён — оставьте пустым, чтобы не менять' : '123456789:AA…' ?>">
        <?php if ($s['tg_token'] !== ''): ?><label class="check"><input type="checkbox" name="tg_token_clear" value="1"> Удалить сохранённый токен</label><?php endif; ?>
      </div>
      <div>
        <label for="tg_chat">Кому отправлять (chat ID)</label>
        <input id="tg_chat" name="tg_chat" value="<?= h($form['tg_chat']) ?>" placeholder="123456789">
      </div>
    </div>

    <div class="btns" style="margin-top:20px"><button class="btn btn-primary" type="submit">Сохранить</button></div>
  </form>

  <div class="card settings">
    <h2>Проверка отправки</h2>
    <p class="hint">Отправляет проверочное сообщение с уже <b>сохранёнными</b> настройками — сначала нажмите «Сохранить».</p>
    <?= $statusLine($s['status_email'], 'Письма') ?>
    <form method="post" style="margin:0 0 16px">
      <input type="hidden" name="csrf" value="<?= h(csrf()) ?>">
      <input type="hidden" name="action" value="test_email">
      <button class="btn btn-light" type="submit">Отправить тестовое письмо</button>
    </form>
    <?= $statusLine($s['status_tg'], 'Telegram') ?>
    <form method="post" style="margin:0">
      <input type="hidden" name="csrf" value="<?= h(csrf()) ?>">
      <input type="hidden" name="action" value="test_tg">
      <button class="btn btn-light" type="submit">Отправить тестовое сообщение в Telegram</button>
    </form>
  </div>

  <script>
    // показываем только поля выбранного способа отправки и подставляем порт под шифрование
    (function () {
      var method = document.getElementById('mail_method');
      var secure = document.getElementById('smtp_secure');
      var port = document.getElementById('smtp_port');
      function sync() {
        document.querySelectorAll('[data-show]').forEach(function (el) {
          el.hidden = el.getAttribute('data-show').split(' ').indexOf(method.value) === -1;
        });
      }
      method.addEventListener('change', sync);
      secure.addEventListener('change', function () {
        var ports = { ssl: '465', tls: '587', none: '25' };
        if (['465', '587', '25', ''].indexOf(port.value) !== -1) port.value = ports[secure.value];
      });
      sync();
    })();
  </script>
<?php
    page_end();
    exit;
}

// ---------- Карточка заявки ----------

if (isset($_GET['id'])) {
    $stmt = $db->prepare('SELECT * FROM leads WHERE id = ?');
    $stmt->execute([(int) $_GET['id']]);
    $r = $stmt->fetch();
    page_start($r ? 'Заявка №' . $r['id'] : 'Не найдена');
    $header();
    if (!$r) {
        echo '<div class="card">Заявка не найдена. <a href="./">К списку</a></div>';
        page_end();
        exit;
    }
    $back = './?id=' . (int) $r['id']; ?>
  <p><a href="./">← Все заявки</a></p>
  <div class="card">
    <h2 style="margin:0 0 16px;font-size:18px">Заявка №<?= (int) $r['id'] ?></h2>
    <dl class="detail">
      <dt>Дата (МСК)</dt><dd><?= h(iq_time($r['created_at'], 'd.m.Y H:i:s')) ?></dd>
      <dt>Имя</dt><dd><?= h($r['name'] ?: '—') ?></dd>
      <dt>Телефон</dt><dd><a href="tel:+<?= h($r['phone']) ?>"><?= h(iq_phone_pretty($r['phone'])) ?></a></dd>
      <dt>Экзамен</dt><dd><?= h($r['exam'] ?: '—') ?></dd>
      <dt>Предмет</dt><dd><?= h($r['subject'] ?: 'не выбран') ?></dd>
      <dt>Откуда нажали</dt><dd><?= h(IQ_SOURCES[$r['source']] ?? ($r['source'] ?: '—')) ?></dd>
      <dt>Страница</dt><dd class="muted"><?= h($r['page'] ?: '—') ?></dd>
    </dl>
    <form method="post">
      <input type="hidden" name="csrf" value="<?= h(csrf()) ?>">
      <input type="hidden" name="action" value="save">
      <input type="hidden" name="id" value="<?= (int) $r['id'] ?>">
      <input type="hidden" name="back" value="<?= h($back) ?>">
      <div class="filters" style="grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));align-items:start">
        <div>
          <label for="status">Статус</label>
          <select id="status" name="status">
            <?php foreach (IQ_STATUSES as $k => $label): ?>
              <option value="<?= h($k) ?>" <?= $r['status'] === $k ? 'selected' : '' ?>><?= h($label) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div>
          <label for="comment">Комментарий</label>
          <textarea id="comment" name="comment" rows="3" maxlength="2000" placeholder="Например: записан на 14.12, математика профиль"><?= h($r['comment']) ?></textarea>
        </div>
      </div>
      <div class="btns" style="margin-top:14px">
        <button class="btn btn-primary" type="submit">Сохранить</button>
        <button class="btn btn-danger" type="submit" form="delete-form">Удалить заявку</button>
      </div>
    </form>
  </div>
  <form method="post" id="delete-form" class="js-delete">
    <input type="hidden" name="csrf" value="<?= h(csrf()) ?>">
    <input type="hidden" name="action" value="delete">
    <input type="hidden" name="id" value="<?= (int) $r['id'] ?>">
    <input type="hidden" name="back" value="<?= h($back) ?>">
  </form>
  <?php
    page_end();
    exit;
}

// ---------- Список ----------

$perPage = 50;
$pageNum = max(1, (int) ($_GET['page'] ?? 1));

$count = $db->prepare("SELECT COUNT(*) AS total, SUM(status = 'new') AS fresh FROM leads $whereSql");
$count->execute($params);
$totals = $count->fetch();
$total = (int) $totals['total'];
$pages = max(1, (int) ceil($total / $perPage));
$pageNum = min($pageNum, $pages);

$stmt = $db->prepare("SELECT * FROM leads $whereSql ORDER BY created_at DESC LIMIT $perPage OFFSET " . (($pageNum - 1) * $perPage));
$stmt->execute($params);
$rows = $stmt->fetchAll();

$back = './' . ($filterQuery || $pageNum > 1 ? '?' . http_build_query(array_filter($f + ['page' => $pageNum > 1 ? $pageNum : ''], 'strlen')) : '');

page_start('Все заявки');
$header(); ?>
  <form class="card filters" method="get">
    <div><label for="q">Имя или предмет</label><input id="q" name="q" value="<?= h($f['q']) ?>"></div>
    <div><label for="phone">Телефон</label><input id="phone" name="phone" inputmode="tel" value="<?= h($f['phone']) ?>"></div>
    <div>
      <label for="exam">Экзамен</label>
      <select id="exam" name="exam">
        <option value="">Все</option>
        <?php foreach (['ЕГЭ', 'ОГЭ'] as $x): ?><option <?= $f['exam'] === $x ? 'selected' : '' ?>><?= $x ?></option><?php endforeach; ?>
      </select>
    </div>
    <div>
      <label for="status-f">Статус</label>
      <select id="status-f" name="status">
        <option value="">Все</option>
        <?php foreach (IQ_STATUSES as $k => $label): ?><option value="<?= h($k) ?>" <?= $f['status'] === $k ? 'selected' : '' ?>><?= h($label) ?></option><?php endforeach; ?>
      </select>
    </div>
    <div>
      <label for="source">Откуда</label>
      <select id="source" name="source">
        <option value="">Все</option>
        <?php foreach (IQ_SOURCES as $k => $label): ?><option value="<?= h($k) ?>" <?= $f['source'] === $k ? 'selected' : '' ?>><?= h($label) ?></option><?php endforeach; ?>
      </select>
    </div>
    <div class="period">
      <label for="from">Период</label>
      <div class="range">
        <input id="from" name="from" type="date" value="<?= h($f['from']) ?>" aria-label="С даты">
        <span class="muted">—</span>
        <input id="to" name="to" type="date" value="<?= h($f['to']) ?>" aria-label="По дату">
      </div>
    </div>
    <div class="btns" style="grid-column:1 / -1">
      <button class="btn btn-primary" type="submit">Фильтровать</button>
      <a class="btn btn-light" href="./">Сбросить</a>
    </div>
  </form>

  <div class="card">
    <div class="summary">
      <div><b>Всего заявок: <?= $total ?></b> <span class="muted">· новых: <?= (int) $totals['fresh'] ?></span></div>
      <a class="btn btn-light" href="./?<?= h($filterQuery ? $filterQuery . '&' : '') ?>action=csv">Скачать для Excel</a>
    </div>
    <?php if (!$rows): ?>
      <p class="muted">Заявок нет<?= $filterQuery ? ' по выбранным фильтрам' : '' ?>.</p>
    <?php else: ?>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Дата</th><th>Имя</th><th>Телефон</th><th>Экзамен</th><th>Предмет</th><th>Откуда</th><th>Статус</th><th></th><th></th></tr></thead>
        <tbody>
        <?php foreach ($rows as $r): ?>
          <tr class="<?= $r['status'] === 'new' ? 'is-new' : '' ?>">
            <td><?= h(iq_time($r['created_at'], 'd.m.Y')) ?><br><span class="muted"><?= h(iq_time($r['created_at'], 'H:i')) ?></span></td>
            <td><?= h($r['name'] ?: '—') ?><?php if ($r['comment'] !== ''): ?><br><span class="muted" title="<?= h($r['comment']) ?>">💬 <?= h(mb_strimwidth($r['comment'], 0, 40, '…')) ?></span><?php endif; ?></td>
            <td style="white-space:nowrap"><a href="tel:+<?= h($r['phone']) ?>"><?= h(iq_phone_pretty($r['phone'])) ?></a></td>
            <td><?= h($r['exam'] ?: '—') ?></td>
            <td><?= h($r['subject'] ?: '—') ?></td>
            <td><?= h(IQ_SOURCES[$r['source']] ?? ($r['source'] ?: '—')) ?></td>
            <td><?php status_form($r, $back); ?></td>
            <td><a href="./?id=<?= (int) $r['id'] ?>">Открыть</a></td>
            <td><?php delete_form((int) $r['id'], $back); ?></td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    </div>
    <?php if ($pages > 1): ?>
      <nav class="pager" aria-label="Страницы">
        <?php for ($i = 1; $i <= $pages; $i++):
            $q = http_build_query(array_filter($f + ['page' => $i > 1 ? $i : ''], 'strlen'));
            if ($i === $pageNum): ?><span><?= $i ?></span><?php else: ?><a href="./<?= $q ? '?' . h($q) : '' ?>"><?= $i ?></a><?php endif;
        endfor; ?>
      </nav>
    <?php endif; ?>
    <?php endif; ?>
  </div>
<?php
page_end();
