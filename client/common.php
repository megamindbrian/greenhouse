<?php

include dirname(__FILE__) . DIRECTORY_SEPARATOR . 'common.php';

$pdo = new PDO('mysql:host=localhost;dbname=agro', 'agro', 'ksiodfs834r347vun49');

if (isset($_GET['time']) && isset($_GET['celsius']) &&
    isset($_GET['fahrenheit']) && isset($_GET['humidity'])) {

    $params = array(
        ':time' => gmdate("Y-m-d H:i:s", $_GET['time']),
        ':celsius' => $_GET['celsius'],
        ':fahrenheit' => $_GET['fahrenheit'],
        ':humidity' => $_GET['humidity']);

    $stmt = $pdo->prepare('
        INSERT INTO temperature (`time`, `celsius`, `fahrenheit`, `humidity`)
        VALUES (:time, :celsius, :fahrenheit, :humidity)
    ');

    $stmt->execute($params);
}

$stmt = $pdo->prepare('
    SELECT * FROM temperature
    ORDER BY `time` DESC
    LIMIT 0,1');

$stmt->execute();
$current = $stmt->fetchAll();
if(isset($current[0]))
{
    $dt = new DateTime($current[0]['time'], new DateTimeZone('UTC'));
    $dt->setTimezone(new DateTimeZone(date_default_timezone_get()));
}

if(isset($_GET['last_update']))
{
    $stmt = $pdo->prepare('
                SELECT MAX(`time`) AS time,AVG(`celsius`) AS celsius,AVG(`fahrenheit`) AS fahrenheit,AVG(`humidity`) AS humidity
                FROM temperature
                WHERE `time` > FROM_UNIXTIME(:time+UNIX_TIMESTAMP(UTC_TIMESTAMP())-UNIX_TIMESTAMP())
                GROUP BY ROUND(UNIX_TIMESTAMP(`time`) / 432)
                ORDER BY MAX(`time`) ASC');
    $stmt->execute(array(':time' => $_GET['last_update']));
    $history = $stmt->fetchAll();
}
else
{
    $stmt = $pdo->prepare('
                SELECT MAX(`time`) AS time,AVG(`celsius`) AS celsius,AVG(`fahrenheit`) AS fahrenheit,AVG(`humidity`) AS humidity
                FROM temperature
                WHERE `time` > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 DAY)
                GROUP BY ROUND(UNIX_TIMESTAMP(`time`) / 432)
                ORDER BY MAX(`time`) ASC
                LIMIT 1,200');
    $stmt->execute();
    $history = $stmt->fetchAll();
}

$settings = array(
    'time' => isset($dt) ? time_elapsed_string($dt->getTimestamp()) : UNK,
    'humidity' => isset($current[0]['humidity']) ? ($current[0]['humidity'] . '%') : UNK,
    'celsius' => isset($current[0]['celsius']) ? ($current[0]['celsius'] . '&deg; c') : UNK,
    'fahrenheit' => isset($current[0]['fahrenheit']) ? ($current[0]['fahrenheit'] . '&deg; f') : UNK,
    'history' => $history
);

if(strpos($_SERVER['HTTP_ACCEPT'], 'json') !== false)
{
    print json_encode($settings);

    exit;
}

?><?php

define('UNK', 'UNK');

function time_elapsed_string($ptime)
{
    $etime = time() - $ptime;

    if ($etime < 1)
    {
        return '0 seconds';
    }

    $a = array( 12 * 30 * 24 * 60 * 60  =>  'year',
        30 * 24 * 60 * 60       =>  'month',
        24 * 60 * 60            =>  'day',
        60 * 60                 =>  'hour',
        60                      =>  'minute',
        1                       =>  'second'
    );

    foreach ($a as $secs => $str)
    {
        $d = $etime / $secs;
        if ($d >= 1)
        {
            $r = round($d);
            return $r . ' ' . $str . ($r > 1 ? 's' : '') . ' ago';
        }
    }
}

?>