<?php
// Админка заявок: вход по паролю из config.php, фильтры, статусы, комментарии, выгрузка в CSV.

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

// ---------- Действия ----------

if ($authed && $_SERVER['REQUEST_METHOD'] === 'POST' && $action !== 'login') {
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

$header = function () { ?>
  <div class="top">
    <h1><a href="./" style="text-decoration:none;color:inherit">Заявки IQ Center</a></h1>
    <a class="btn btn-light" href="./?action=logout">Выйти</a>
  </div>
<?php };

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
