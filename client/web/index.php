<?php
require(__DIR__ . '/../vendor/autoload.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Node.js Socket.io Server</title>
    <script>
        "use strict"

        const socketConfig = <?= json_encode([
            'socketUrl' => 'https://127.0.0.1:8443',
            'socketToken' => \Firebase\JWT\JWT::encode([
                'user' => [
                    'id' => 'INSERT_USER_ID_HERE',
                    'username' => 'INSERT_USERNAME_HERE',
                ],
                'request' => [
                    'route' => 'site/index',
                    'query' => ['var' => 'val'],
                ],
            ], 'INSERT_SECRET_HERE'),
        ]) ?>;

    </script>
    <script src="https://127.0.0.1:8443/socket.io/socket.io.js"></script>
    <script src="socket.js"></script>
</head>
<body>

</body>
</html>