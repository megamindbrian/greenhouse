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

?>
<!DOCTYPE html>
<html class="no-js">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title></title>
    <meta name="description" content="">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- Place favicon.ico and apple-touch-icon(s) in the root directory -->

    <link rel="stylesheet" href="css/normalize.css">
    <link rel="stylesheet" href="css/main.css">
    <script src="js/jquery-2.0.3.min.js"></script>
    <script src="js/d3.v3.js"></script>
    <script src="js/cubism.v1.js"></script>
    <script src="js/highlight.min.js"></script>
    <script src="js/agro.js"></script>
    <script type="text/javascript">
        window.initialHistory = <?php print json_encode($settings['history']); ?>;
    </script>
</head>
<body>
<!--[if lt IE 8]>
<p class="browsehappy">You are using an <strong>outdated</strong> browser. Please <a href="http://browsehappy.com/">upgrade your browser</a> to improve your experience.</p>
<![endif]-->

<!-- Add your site or application content here -->

<div id="temperature" class="current-box">
    <label>Temperature</label>
    <strong><?php print $settings['celsius']; ?>
        <sub> /
            <?php print $settings['fahrenheit']; ?></sub></strong>
    <small>Last updated: <?php print $settings['time']; ?></small>
</div>

<div id="humidity" class="current-box">
    <label>Humidity</label>
    <strong><?php print $settings['humidity']; ?></strong>
    <small>Last updated: <?php print $settings['time']; ?></small>
</div>
<br />

<div id="timeline" class="current-box">
    <label>Timeline</label>
    <strong></strong>
    <small>Last updated: <?php print $settings['time']; ?></small>
</div>

</body>
</html>