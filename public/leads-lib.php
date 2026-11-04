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
