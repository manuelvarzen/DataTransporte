<?php
/*!
 * Google Fusion Tables to HTML Table
 * http://derekeder.com/fusion-tables-to-html-table/
 *
 * Copyright 2012, Derek Eder
 * Licensed under the MIT license.
 * https://github.com/derekeder/Fusion-Tables-to-HTML-Table/wiki/License
 *
 * Date: 5/2/2012
 * 
 */
include('source/clientlogin.php');
include('source/sql.php');
include('source/connectioninfo.php');
require_once 'google-api-php-client/src/Google_Client.php';
require_once 'google-api-php-client/src/contrib/Google_PlusService.php';

//phpinfo(); 

//get token 
$token = ClientLogin::getAuthToken(ConnectionInfo::$google_username, ConnectionInfo::$google_password);
$ftclient = new FTClientLogin($token);

//select * from table
$result = $ftclient->query(SQLBuilder::select(ConnectionInfo::$fusionTableId));

//echo result;

$result = explode("\n", $result);

foreach ($result as $i => $value) {
//echo "exploding row $i<br />";
$result[$i] = explode(",", $value);
}

?>

<!DOCTYPE html>
<html>
<head>
<link href='/styles/master.css' media='all' rel='stylesheet' type='text/css' />
<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.4/jquery.min.js"></script> 
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
</head> 
<body>
<div id="page">
<h1>Prueba lista desde fusion tables </h1>

<?php

echo "<table>\n";

/*Print table head*/
echo "<thead><tr>\n";
foreach ($result[0] as $i => $col) {
echo "<td>$col</td>\n";
} 
echo "</tr></thead>\n";

/*Print table body*/
echo "<tbody>\n";
foreach ($result as $i => $row){
if ($i > 0)
{
echo "<tr>\n"; 
foreach ($row as $j => $col) {
echo "<td>$col</td>\n";
}
echo "</tr>\n";
}
}
echo "</tbody></table>\n";
?>

</div>
</body>
</html>
