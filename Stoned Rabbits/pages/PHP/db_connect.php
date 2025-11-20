<?php
$host = 'database-5018416887.webspace-host.com';
$db = 'dbs14645545';
$user = 'dbu1098288';  // Change to your DB user
$pass = 'G0eiemoggol123!@#';      // Change to your DB password

$mysqli = new mysqli($host, $user, $pass, $db);
if ($mysqli->connect_error) {
    die(json_encode(['error' => 'Connection failed: ' . $mysqli->connect_error]));
}
?>